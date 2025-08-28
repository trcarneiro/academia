/**
 * Gemini AI Service - Google Generative AI Integration
 * Academia Krav Maga v2.0
 * 
 * Serviço para integração com Google Gemini API
 * Usado pelo sistema RAG para geração de conteúdo inteligente
 */

import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Carregar variáveis de ambiente
config();

// Configuração do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = process.env.RAG_MODEL || 'gemini-1.5-flash';

console.log('🔧 GeminiService - API Key:', GEMINI_API_KEY ? 'CONFIGURADA' : 'NÃO ENCONTRADA');
console.log('🔧 GeminiService - Model:', MODEL_NAME);

// Inicialização do cliente Gemini
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Inicializa o serviço Gemini
 */
export function initializeGemini() {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY não configurada - usando modo mock');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: MODEL_NAME });
        console.log('✅ Gemini AI inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Gemini:', error);
        return false;
    }
}

/**
 * Classe principal do serviço Gemini
 */
export class GeminiService {
    
    /**
     * Verifica se o Gemini está disponível
     */
    static isAvailable(): boolean {
        return genAI !== null && model !== null;
    }
    
    /**
     * Gera resposta com contexto RAG
     */
    static async generateRAGResponse(
        question: string,
        context: string[],
        options: {
            temperature?: number;
            maxTokens?: number;
            systemPrompt?: string;
        } = {}
    ): Promise<string> {
        if (!this.isAvailable()) {
            throw new Error('Gemini não está disponível');
        }
        
        const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
        const contextText = context.join('\n\n');
        
        const prompt = `${systemPrompt}

CONTEXTO DA BASE DE CONHECIMENTO:
${contextText}

PERGUNTA DO USUÁRIO:
${question}

INSTRUÇÕES:
- Use APENAS informações do contexto fornecido
- Se a resposta não estiver no contexto, diga "Não encontrei essa informação na base de conhecimento"
- Seja específico e detalhado
- Use exemplos práticos quando possível
- Mantenha o foco em Krav Maga e defesa pessoal

RESPOSTA:`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Erro na geração Gemini:', error);
            throw new Error('Erro ao gerar resposta com Gemini');
        }
    }
    
    /**
     * Gera técnica de Krav Maga
     */
    static async generateTechnique(parameters: {
        level: string;
        type: string;
        context: string;
        category?: string;
    }): Promise<any> {
        if (!this.isAvailable()) {
            throw new Error('Gemini não está disponível');
        }
        
        const prompt = `Você é um especialista em Krav Maga com mais de 20 anos de experiência.

TAREFA: Criar uma técnica de Krav Maga com as seguintes especificações:
- Nível: ${parameters.level}
- Tipo: ${parameters.type}
- Contexto: ${parameters.context}
- Categoria: ${parameters.category || 'defesa pessoal'}

FORMATO DE RESPOSTA (JSON):
{
    "name": "Nome da técnica",
    "description": "Descrição breve e clara",
    "level": "${parameters.level}",
    "type": "${parameters.type}",
    "steps": [
        "Passo 1: descrição detalhada",
        "Passo 2: descrição detalhada",
        "Passo 3: descrição detalhada",
        "Passo 4: descrição detalhada"
    ],
    "keyPoints": [
        "Ponto importante 1",
        "Ponto importante 2",
        "Ponto importante 3"
    ],
    "commonMistakes": [
        "Erro comum 1",
        "Erro comum 2"
    ],
    "tips": "Dicas práticas para execução",
    "variations": [
        "Variação 1 da técnica",
        "Variação 2 da técnica"
    ],
    "contraindications": "Quando NÃO usar esta técnica",
    "trainingDrills": [
        "Exercício 1 para praticar",
        "Exercício 2 para praticar"
    ]
}

Responda APENAS com o JSON, sem texto adicional:`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text().trim();
            
            // Remove markdown se presente
            const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Erro na geração de técnica:', error);
            throw new Error('Erro ao gerar técnica com Gemini');
        }
    }
    
    /**
     * Gera plano de aula
     */
    static async generateLessonPlan(parameters: {
        duration: string;
        level: string;
        focus: string;
        objectives?: string[];
    }): Promise<any> {
        if (!this.isAvailable()) {
            throw new Error('Gemini não está disponível');
        }
        
        const prompt = `Você é um instrutor experiente de Krav Maga criando um plano de aula.

ESPECIFICAÇÕES:
- Duração: ${parameters.duration} minutos
- Nível: ${parameters.level}
- Foco: ${parameters.focus}
- Objetivos: ${parameters.objectives?.join(', ') || 'desenvolver habilidades básicas'}

FORMATO DE RESPOSTA (JSON):
{
    "title": "Título da aula",
    "duration": "${parameters.duration}",
    "level": "${parameters.level}",
    "focus": "${parameters.focus}",
    "objectives": [
        "Objetivo específico 1",
        "Objetivo específico 2",
        "Objetivo específico 3"
    ],
    "structure": {
        "warmup": {
            "duration": "X minutos",
            "activities": ["Atividade 1", "Atividade 2"],
            "description": "Descrição do aquecimento"
        },
        "mainActivity": {
            "duration": "X minutos", 
            "techniques": ["Técnica 1", "Técnica 2"],
            "drills": ["Exercício 1", "Exercício 2"],
            "description": "Descrição da atividade principal"
        },
        "sparring": {
            "duration": "X minutos",
            "scenarios": ["Cenário 1", "Cenário 2"],
            "description": "Descrição da prática livre"
        },
        "cooldown": {
            "duration": "X minutos",
            "activities": ["Alongamento 1", "Alongamento 2"],
            "description": "Descrição do relaxamento"
        }
    },
    "materials": ["Material 1", "Material 2"],
    "safetyNotes": ["Nota de segurança 1", "Nota de segurança 2"],
    "assessmentCriteria": ["Critério 1", "Critério 2"],
    "homework": "Tarefa para casa opcional"
}

Responda APENAS com o JSON:`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text().trim();
            
            const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Erro na geração de plano:', error);
            throw new Error('Erro ao gerar plano de aula com Gemini');
        }
    }
    
    /**
     * Gera módulo de curso
     */
    static async generateCourseModule(parameters: {
        weeks: string;
        level: string;
        theme: string;
        prerequisites?: string[];
    }): Promise<any> {
        if (!this.isAvailable()) {
            throw new Error('Gemini não está disponível');
        }
        
        const prompt = `Você é um coordenador pedagógico de Krav Maga criando um módulo de curso.

ESPECIFICAÇÕES:
- Duração: ${parameters.weeks} semanas
- Nível: ${parameters.level}
- Tema: ${parameters.theme}
- Pré-requisitos: ${parameters.prerequisites?.join(', ') || 'nenhum'}

FORMATO DE RESPOSTA (JSON):
{
    "title": "Título do módulo",
    "duration": "${parameters.weeks}",
    "level": "${parameters.level}",
    "theme": "${parameters.theme}",
    "description": "Descrição detalhada do módulo",
    "prerequisites": ["Pré-requisito 1", "Pré-requisito 2"],
    "learningOutcomes": [
        "Resultado 1",
        "Resultado 2", 
        "Resultado 3"
    ],
    "weeklyProgression": [
        {
            "week": 1,
            "title": "Título da semana 1",
            "objectives": ["Objetivo 1", "Objetivo 2"],
            "techniques": ["Técnica 1", "Técnica 2"],
            "assessment": "Método de avaliação"
        }
    ],
    "finalAssessment": {
        "type": "Tipo de avaliação final",
        "criteria": ["Critério 1", "Critério 2"],
        "passingGrade": "Nota mínima"
    },
    "resources": ["Recurso 1", "Recurso 2"],
    "certification": "Tipo de certificação obtida"
}

Crie progressão semanal para todas as ${parameters.weeks} semanas.
Responda APENAS com o JSON:`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text().trim();
            
            const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Erro na geração de curso:', error);
            throw new Error('Erro ao gerar módulo de curso com Gemini');
        }
    }
    
    /**
     * Gera critérios de avaliação
     */
    static async generateEvaluationCriteria(parameters: {
        type: string;
        level: string;
        focus: string;
    }): Promise<any> {
        if (!this.isAvailable()) {
            throw new Error('Gemini não está disponível');
        }
        
        const prompt = `Você é um avaliador certificado de Krav Maga criando critérios de avaliação.

ESPECIFICAÇÕES:
- Tipo: ${parameters.type}
- Nível: ${parameters.level}
- Foco: ${parameters.focus}

FORMATO DE RESPOSTA (JSON):
{
    "title": "Título da avaliação",
    "type": "${parameters.type}",
    "level": "${parameters.level}",
    "focus": "${parameters.focus}",
    "criteria": [
        {
            "category": "Execução Técnica",
            "weight": 40,
            "subcriteria": [
                "Postura correta",
                "Precisão dos movimentos",
                "Fluidez da execução"
            ]
        },
        {
            "category": "Timing e Velocidade", 
            "weight": 30,
            "subcriteria": [
                "Tempo de reação",
                "Velocidade de execução",
                "Timing de contra-ataque"
            ]
        }
    ],
    "gradingScale": {
        "excellent": "9-10 pontos",
        "good": "7-8 pontos", 
        "satisfactory": "5-6 pontos",
        "needsImprovement": "0-4 pontos"
    },
    "practicalTests": [
        "Teste prático 1",
        "Teste prático 2"
    ],
    "theoreticalQuestions": [
        "Pergunta teórica 1",
        "Pergunta teórica 2"
    ],
    "passingGrade": "7 pontos",
    "feedback": {
        "strengths": "Como identificar pontos fortes",
        "improvements": "Como sugerir melhorias"
    }
}

Responda APENAS com o JSON:`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text().trim();
            
            const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Erro na geração de avaliação:', error);
            throw new Error('Erro ao gerar critérios com Gemini');
        }
    }
    
    /**
     * Prompt de sistema padrão para RAG
     */
    private static getDefaultSystemPrompt(): string {
        return `Você é um assistente especializado em Krav Maga e defesa pessoal da Academia.

PERSONALIDADE:
- Instrutor experiente e paciente
- Focado na segurança e técnica correta
- Didático e encorajador
- Baseado em evidências e experiência prática

CONHECIMENTO:
- Técnicas de Krav Maga de todos os níveis
- Princípios de defesa pessoal
- Metodologias de ensino
- Condicionamento físico para artes marciais
- Filosofia e princípios do Krav Maga

ESTILO DE RESPOSTA:
- Claro e objetivo
- Use exemplos práticos
- Inclua dicas de segurança quando relevante
- Adapte a linguagem ao nível do praticante
- Seja encorajador mas realista`;
    }
}

export default GeminiService;
