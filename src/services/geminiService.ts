/**
 * Gemini AI Service - Google Generative AI Integration
 * Clean implementation with model fallback and safe defaults
 */

import 'dotenv/config'; // Must be first to ensure env vars are loaded
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Safety settings to prevent overly aggressive blocking
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

// Dynamic getter for API key to support lazy initialization
function getApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

// Use getter instead of constant to pick up env vars correctly
const ENV_MODEL = process.env.GEMINI_MODEL || process.env.RAG_MODEL || '';

// Ordered list of model candidates (deduped)
const MODEL_CANDIDATES = Array.from(new Set([
  ENV_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-exp',
  'gemini-2.5-pro-exp',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
].filter(Boolean)));

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let currentModelName: string | null = null;

export function initializeGemini(): boolean {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY ausente — modo fallback ativo');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('[Gemini] SDK inicializado com chave:', apiKey.substring(0, 10) + '...');
    return true;
  } catch (err) {
    console.error('[Gemini] Falha ao inicializar SDK:', err);
    return false;
  }
}

// Lazy initialization - call this before using genAI
function ensureGeminiInitialized(): boolean {
  if (genAI) return true;
  return initializeGemini();
}

function isNotFoundModelError(err: unknown): boolean {
  const msg = (err as any)?.message || String(err);
  return /is not found|not supported for generateContent|404/i.test(msg);
}

async function ensureModel(): Promise<void> {
  // Lazy initialize if not done
  if (!genAI && !ensureGeminiInitialized()) {
    throw new Error('Gemini indisponível: configure GEMINI_API_KEY');
  }
  if (model) return;

  let lastErr: unknown = null;
  for (const candidate of MODEL_CANDIDATES) {
    try {
      const m = genAI.getGenerativeModel({ model: candidate });
      // Lazy verify with a tiny noop prompt to detect 404 early
      await m.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });
      model = m;
      currentModelName = candidate;
      console.log(`[Gemini] Modelo selecionado: ${candidate}`);
      return;
    } catch (err) {
      lastErr = err;
      if (isNotFoundModelError(err)) {
        console.warn(`[Gemini] Modelo indisponível: ${candidate}. Tentando próximo...`);
        continue;
      }
      // Other errors (e.g., quota, auth) — stop early
      break;
    }
  }
  // If we reach here, no candidate worked
  throw lastErr ?? new Error('Nenhum modelo Gemini disponível');
}

export class GeminiService {
  static isAvailable(): boolean {
    // Lazy check - try to initialize if not done
    if (!genAI) ensureGeminiInitialized();
    return Boolean(genAI);
  }

  static async generateSimple(
    prompt: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    if (process.env.MOCK_AI === 'true') {
      if (prompt.includes('JSON array (máx 2 agentes')) {
        return JSON.stringify([
          {
            name: "Agente Comercial",
            type: "marketing",
            description: "Focado em converter leads e recuperar ex-alunos",
            justification: "Alto número de leads não convertidos detectado"
          }
        ]);
      }
      if (prompt.includes('TAREFA:')) {
        return JSON.stringify({
          summary: "Análise concluída com sucesso",
          insights: ["Insight 1: Alta taxa de cancelamento", "Insight 2: Poucos leads novos"],
          actions: [
            {
              description: "Enviar email de recuperação",
              executionMethod: "MCP_IMMEDIATE",
              executionDetails: "Usar ferramenta de email",
              requiresApproval: false
            }
          ],
          priority: "HIGH"
        });
      }
      return '{"mock": "response"}';
    }

    // Lazy initialization - try to initialize if not already done
    if (!genAI && !ensureGeminiInitialized()) {
      // Soft fallback when API key missing
      return '[Fallback AI] Configure GEMINI_API_KEY para respostas reais. Prompt recebido: ' + prompt.slice(0, 200);
    }
    try {
      await ensureModel();
      const generationConfig = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      } as any;
      
      console.log('[Gemini] 🎛️ Generation config:', generationConfig);

      const res = await (model as GenerativeModel).generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings: SAFETY_SETTINGS
      });
      
      // Debug: log full response object
      console.log('[Gemini] Response candidates:', res.response.candidates?.length || 0);
      console.log('[Gemini] Response finish reason:', res.response.candidates?.[0]?.finishReason);
      
      const text = res.response.text();
      if (!text || text.trim().length === 0) {
        const finishReason = res.response.candidates?.[0]?.finishReason;
        console.error('[Gemini] Empty response - finish reason:', finishReason);
        console.error('[Gemini] Safety ratings:', JSON.stringify(res.response.candidates?.[0]?.safetyRatings));
        
        // Specific error message for MAX_TOKENS
        if (finishReason === 'MAX_TOKENS') {
          throw new Error('Resposta truncada: maxTokens muito baixo. Aumente o limite ou reduza o prompt.');
        }
        throw new Error('Resposta vazia do modelo');
      }
      return text;
    } catch (err) {
      // If model not found, rotate to next and retry once
      if (isNotFoundModelError(err)) {
        model = null; // force reselect
        try {
          await ensureModel();
          const res = await (model as GenerativeModel).generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            safetySettings: SAFETY_SETTINGS
          });
          const text = res.response.text();
          if (text) return text;
        } catch (_) { /* ignore and fallthrough */ }
      }
      console.error('[Gemini] generateSimple error:', err);
      // Non-throwing fallback to keep API responsive
      return '[Fallback AI] Não foi possível obter resposta do Gemini agora. Tente novamente mais tarde.';
    }
  }

  static async generateRAGResponse(
    question: string,
    context: string[],
    options: { temperature?: number; maxTokens?: number; systemPrompt?: string } = {}
  ): Promise<string> {
    const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    const prompt = `${systemPrompt}\n\nCONTEXTO:\n${(context || []).join('\n\n')}\n\nPERGUNTA:\n${question}\n\nRESPOSTA:`;

    return this.generateSimple(prompt, options);
  }

  private static getDefaultSystemPrompt(): string {
    return [
      'Você é um assistente pedagógico especializado em artes marciais.',
      'Responda de forma objetiva, usando dados do contexto.',
      'Se não souber, diga explicitamente que não encontrou no contexto.'
    ].join(' ');
  }

  // Optional helpers with graceful fallbacks when Gemini is unavailable
  static async generateTechnique(parameters: { level: string; type: string; context: string; category?: string; }): Promise<any> {
    if (!this.isAvailable()) {
      return {
        name: 'Técnica (fallback)',
        description: 'Gemini indisponível no momento.',
        level: parameters.level,
        type: parameters.type,
        steps: [],
        keyPoints: [],
        commonMistakes: [],
        safetyNotes: []
      };
    }
    const prompt = `Você é um especialista em Krav Maga. Gere um JSON de técnica com: nível=${parameters.level}, tipo=${parameters.type}, contexto=${parameters.context}, categoria=${parameters.category || 'defesa'}. Responda apenas JSON.`;
    try {
      await ensureModel();
      const result = await (model as GenerativeModel).generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      const jsonText = result.response.text().trim();
      const clean = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(clean);
    } catch (err) {
      console.warn('[Gemini] generateTechnique fallback JSON:', err);
      return {
        name: 'Técnica (fallback)',
        description: 'Falha ao gerar via Gemini.',
        level: parameters.level,
        type: parameters.type,
        steps: [],
        keyPoints: [],
        commonMistakes: [],
        safetyNotes: []
      };
    }
  }

  static async generateCourseModule(parameters: { weeks: string; level: string; theme: string; prerequisites?: string[]; }): Promise<any> {
    if (!this.isAvailable()) {
      return {
        title: 'Módulo (fallback)',
        duration: parameters.weeks,
        level: parameters.level,
        theme: parameters.theme,
        description: 'Gemini indisponível.',
        prerequisites: parameters.prerequisites || [],
        learningOutcomes: [],
        weeklyProgression: [],
        finalAssessment: {},
        resources: [],
        certification: ''
      };
    }
    const prompt = `Coordene um módulo de curso. Gere JSON (apenas JSON) com campos padrão. semanas=${parameters.weeks}, nível=${parameters.level}, tema=${parameters.theme}.`;
    try {
      await ensureModel();
      const result = await (model as GenerativeModel).generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      const jsonText = result.response.text().trim();
      const clean = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(clean);
    } catch (err) {
      console.warn('[Gemini] generateCourseModule fallback JSON:', err);
      return {
        title: 'Módulo (fallback)',
        duration: parameters.weeks,
        level: parameters.level,
        theme: parameters.theme,
        description: 'Falha ao gerar via Gemini.',
        prerequisites: parameters.prerequisites || [],
        learningOutcomes: [],
        weeklyProgression: [],
        finalAssessment: {},
        resources: [],
        certification: ''
      };
    }
  }

  static async generateEvaluationCriteria(parameters: { type: string; level: string; focus: string; }): Promise<any> {
    if (!this.isAvailable()) {
      return { criteria: [], rubric: [] };
    }
    const prompt = `Crie critérios de avaliação (JSON) para tipo=${parameters.type}, nível=${parameters.level}, foco=${parameters.focus}. Responda apenas JSON.`;
    try {
      await ensureModel();
      const result = await (model as GenerativeModel).generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      const jsonText = result.response.text().trim();
      const clean = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(clean);
    } catch (err) {
      console.warn('[Gemini] generateEvaluationCriteria fallback JSON:', err);
      return { criteria: [], rubric: [] };
    }
  }
}

