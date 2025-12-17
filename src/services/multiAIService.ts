import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from '@/config';
import { logger } from '@/utils/logger';
import { AIProvider, AIAnalysisRequest, AIAnalysisResponse, TenantContext } from '@/types';

export class MultiAIService {
  private static anthropic: Anthropic | null = null;
  private static openai: OpenAI | null = null;
  private static gemini: GoogleGenerativeAI | null = null;

  private static getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      if (!appConfig.ai.anthropicApiKey) {
        throw new Error('Anthropic API key not configured');
      }
      this.anthropic = new Anthropic({
        apiKey: appConfig.ai.anthropicApiKey,
      });
    }
    return this.anthropic;
  }

  private static getOpenAIClient(): OpenAI {
    if (!this.openai) {
      if (!appConfig.ai.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      this.openai = new OpenAI({
        apiKey: appConfig.ai.openaiApiKey,
      });
    }
    return this.openai;
  }

  private static getGeminiClient(): GoogleGenerativeAI {
    if (!this.gemini) {
      if (!appConfig.ai.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }
      this.gemini = new GoogleGenerativeAI(appConfig.ai.geminiApiKey);
    }
    return this.gemini;
  }

  private static async callOpenRouter(prompt: string, model: string = 'meta-llama/llama-3.1-8b-instruct:free'): Promise<string> {
    if (!appConfig.ai.openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appConfig.ai.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://krav-academy.com',
        'X-Title': 'Krav Maga Academy AI',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  static async executeAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Determine which AI provider to use
      const provider = request.context?.organization?.settings?.aiProvider || appConfig.ai.provider;
      
      let result: any;
      
      switch (request.type) {
        case 'dropout_risk':
          result = await this.analyzeDropoutRisk(request.studentId, request.data, provider);
          break;
        case 'progress_analysis':
          result = await this.analyzeProgress(request.studentId, request.data, provider);
          break;
        case 'recommendations':
          result = await this.generateRecommendations(request.studentId, request.data, provider);
          break;
        case 'technique_feedback':
          result = await this.analyzeTechnique(request.studentId, request.data, provider);
          break;
        case 'video_analysis':
          result = await this.analyzeVideo(request.studentId, request.data, provider);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${request.type}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        confidence: result.confidence || 0.8,
        provider,
        processingTime,
      };
    } catch (error) {
      logger.error({ error, request }, 'AI analysis failed');
      
      return {
        success: false,
        data: null,
        confidence: 0,
        provider: appConfig.ai.provider,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static async analyzeDropoutRisk(studentId: string, data: any, provider: AIProvider): Promise<any> {
    const prompt = this.buildDropoutAnalysisPrompt(data);
    
    let response: string;
    
    switch (provider) {
      case 'CLAUDE':
        const claude = this.getAnthropicClient();
        const claudeResponse = await claude.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        break;
        
      case 'OPENAI':
        const openai = this.getOpenAIClient();
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
        break;
        
      case 'GEMINI':
        const gemini = this.getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const geminiResponse = await model.generateContent(prompt);
        response = geminiResponse.response.text();
        break;
        
      case 'OPENROUTER':
        response = await this.callOpenRouter(prompt);
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseDropoutAnalysis(response, studentId);
  }

  private static async analyzeProgress(studentId: string, data: any, provider: AIProvider): Promise<any> {
    const prompt = this.buildProgressAnalysisPrompt(data);
    
    let response: string;
    
    switch (provider) {
      case 'CLAUDE':
        const claude = this.getAnthropicClient();
        const claudeResponse = await claude.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        });
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        break;
        
      case 'OPENAI':
        const openai = this.getOpenAIClient();
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
        break;
        
      case 'GEMINI':
        const gemini = this.getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const geminiResponse = await model.generateContent(prompt);
        response = geminiResponse.response.text();
        break;
        
      case 'OPENROUTER':
        response = await this.callOpenRouter(prompt);
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseProgressAnalysis(response, studentId);
  }

  private static async generateRecommendations(studentId: string, data: any, provider: AIProvider): Promise<any> {
    const prompt = this.buildRecommendationPrompt(data);
    
    let response: string;
    
    switch (provider) {
      case 'CLAUDE':
        const claude = this.getAnthropicClient();
        const claudeResponse = await claude.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        });
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        break;
        
      case 'OPENAI':
        const openai = this.getOpenAIClient();
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
        break;
        
      case 'GEMINI':
        const gemini = this.getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const geminiResponse = await model.generateContent(prompt);
        response = geminiResponse.response.text();
        break;
        
      case 'OPENROUTER':
        response = await this.callOpenRouter(prompt);
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseRecommendations(response);
  }

  private static async analyzeTechnique(studentId: string, data: any, provider: AIProvider): Promise<any> {
    const prompt = this.buildTechniqueAnalysisPrompt(data);
    
    let response: string;
    
    switch (provider) {
      case 'CLAUDE':
        const claude = this.getAnthropicClient();
        const claudeResponse = await claude.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        break;
        
      case 'OPENAI':
        const openai = this.getOpenAIClient();
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
        break;
        
      case 'GEMINI':
        const gemini = this.getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
        const geminiResponse = await model.generateContent(prompt);
        response = geminiResponse.response.text();
        break;
        
      case 'OPENROUTER':
        response = await this.callOpenRouter(prompt);
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseTechniqueAnalysis(response, studentId);
  }

  private static async analyzeVideo(studentId: string, data: any, provider: AIProvider): Promise<any> {
    const prompt = this.buildVideoAnalysisPrompt(data);
    
    // For video analysis, we might prefer vision-capable models
    let response: string;
    
    switch (provider) {
      case 'CLAUDE':
        // Claude 3 Opus has vision capabilities
        const claude = this.getAnthropicClient();
        const claudeResponse = await claude.messages.create({
          model: 'claude-3-haiku-20240307', // Use Opus for vision when available
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        });
        response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        break;
        
      case 'OPENAI':
        // GPT-4 Vision
        const openai = this.getOpenAIClient();
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-4-vision-preview',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
        });
        response = openaiResponse.choices[0]?.message?.content || '';
        break;
        
      case 'GEMINI':
        // Gemini Pro Vision
        const gemini = this.getGeminiClient();
        const model = gemini.getGenerativeModel({ model: 'gemini-pro-vision' });
        const geminiResponse = await model.generateContent(prompt);
        response = geminiResponse.response.text();
        break;
        
      case 'OPENROUTER':
        // Use a vision-capable model from OpenRouter
        response = await this.callOpenRouter(prompt, 'openai/gpt-4-vision-preview');
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseVideoAnalysis(response, studentId);
  }

  // Prompt builders
  private static buildDropoutAnalysisPrompt(data: any): string {
    return `
Você é um especialista em análise de dados de academias de artes marciais. Analise os dados do estudante abaixo e determine o risco de evasão.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Calcule um score de risco de evasão de 0-100 (0 = baixo risco, 100 = alto risco)
2. Categorize o risco: LOW (0-25), MEDIUM (26-60), HIGH (61-85), CRITICAL (86-100)
3. Identifique os principais fatores de risco
4. Forneça recomendações específicas para retenção
5. Estime uma data provável de abandono se aplicável

RESPONDA NO FORMATO JSON:
{
  "riskScore": number,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "factors": ["fator1", "fator2", ...],
  "recommendations": ["recomendação1", "recomendação2", ...],
  "confidence": number (0-1),
  "trend": "IMPROVING|DECLINING|STABLE|VOLATILE",
  "estimatedChurnDate": "YYYY-MM-DD ou null"
}
    `.trim();
  }

  private static buildProgressAnalysisPrompt(data: any): string {
    return `
Você é um instrutor experiente de artes marciais. Analise o progresso do estudante baseado nos dados fornecidos.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Avalie o progresso técnico atual
2. Identifique pontos fortes e áreas para melhoria
3. Sugira próximos passos no treinamento
4. Estime o tempo para próxima graduação
5. Recomende técnicas específicas para focar

RESPONDA NO FORMATO JSON:
{
  "currentLevel": "string",
  "progressScore": number (0-100),
  "strengths": ["força1", "força2", ...],
  "improvementAreas": ["área1", "área2", ...],
  "nextSteps": ["passo1", "passo2", ...],
  "estimatedTimeToNextLevel": "string",
  "recommendedTechniques": ["técnica1", "técnica2", ...],
  "confidence": number (0-1)
}
    `.trim();
  }

  private static buildRecommendationPrompt(data: any): string {
    return `
Você é um sistema de recomendação inteligente para academias de artes marciais. Com base no histórico e preferências do estudante, recomende as melhores aulas e atividades.

DADOS DO ESTUDANTE E AULAS DISPONÍVEIS:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Analise o padrão de frequência do estudante
2. Considere os dias e horários preferidos
3. Leve em conta o nível atual do estudante
4. Priorize aulas com boa ocupação mas não lotadas
5. Recomende até 5 aulas mais adequadas
6. Sugira técnicas para praticar

RESPONDA NO FORMATO JSON:
{
  "classRecommendations": [
    {
      "classId": "string",
      "score": number (0-100),
      "reason": "string explicando por que esta aula é recomendada",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "techniqueRecommendations": [
    {
      "techniqueId": "string",
      "reason": "string",
      "priority": "HIGH|MEDIUM|LOW",
      "estimatedMasteryTime": "string"
    }
  ],
  "generalRecommendations": ["recomendação1", "recomendação2", ...],
  "insights": {
    "preferredDays": ["day1", "day2", ...],
    "preferredTimes": "string",
    "recommendedFrequency": "string",
    "strengths": ["força1", "força2", ...],
    "improvementAreas": ["área1", "área2", ...]
  }
}
    `.trim();
  }

  private static buildTechniqueAnalysisPrompt(data: any): string {
    return `
Você é um instrutor especialista em análise técnica de artes marciais. Analise a execução da técnica do estudante.

DADOS DA TÉCNICA:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Avalie a proficiência atual (0-100)
2. Identifique pontos fortes na execução
3. Aponte áreas de melhoria específicas
4. Sugira exercícios para aprimoramento
5. Estime quantas práticas mais são necessárias para maestria

RESPONDA NO FORMATO JSON:
{
  "masteryScore": number (0-100),
  "proficiency": "LEARNING|PRACTICING|COMPETENT|PROFICIENT|EXPERT|MASTERED",
  "strengths": ["força1", "força2", ...],
  "improvements": ["melhoria1", "melhoria2", ...],
  "nextSteps": ["passo1", "passo2", ...],
  "practicesNeeded": number,
  "confidence": number (0-1)
}
    `.trim();
  }

  private static buildVideoAnalysisPrompt(data: any): string {
    return `
Você é um especialista em análise biomecânica de artes marciais. Analise o vídeo da técnica executada pelo estudante.

DADOS DO VÍDEO:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Avalie precisão técnica, forma, timing e potência
2. Identifique pontos-chave de melhoria
3. Forneça feedback específico por timestamp
4. Sugira correções detalhadas

RESPONDA NO FORMATO JSON:
{
  "accuracy": number (0-100),
  "form": number (0-100),
  "timing": number (0-100),
  "power": number (0-100),
  "feedback": {
    "strengths": ["força1", "força2", ...],
    "improvements": ["melhoria1", "melhoria2", ...],
    "recommendations": ["recomendação1", "recomendação2", ...]
  },
  "keyPoints": [
    {
      "timestamp": number,
      "comment": "string",
      "type": "good|improvement|error"
    }
  ],
  "confidence": number (0-1)
}
    `.trim();
  }

  // Response parsers
  private static parseDropoutAnalysis(text: string, studentId: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          studentId,
          riskScore: analysis.riskScore || 50,
          riskLevel: analysis.riskLevel || 'MEDIUM',
          factors: analysis.factors || [],
          recommendations: analysis.recommendations || [],
          confidence: analysis.confidence || 0.7,
          trend: analysis.trend || 'STABLE',
          estimatedChurnDate: analysis.estimatedChurnDate || null,
        };
      }
    } catch (error) {
      logger.warn({ error, text }, 'Failed to parse dropout analysis');
    }

    return {
      studentId,
      riskScore: 50,
      riskLevel: 'MEDIUM',
      factors: ['Análise automática não disponível'],
      recommendations: ['Monitorar frequência do aluno'],
      confidence: 0.3,
      trend: 'STABLE',
      estimatedChurnDate: null,
    };
  }

  private static parseProgressAnalysis(text: string, studentId: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, text }, 'Failed to parse progress analysis');
    }

    return {
      currentLevel: 'Indefinido',
      progressScore: 50,
      strengths: ['Análise em processamento'],
      improvementAreas: ['Análise em processamento'],
      nextSteps: ['Continuar treinamento regular'],
      estimatedTimeToNextLevel: 'A definir',
      recommendedTechniques: ['Técnicas básicas'],
      confidence: 0.3,
    };
  }

  private static parseRecommendations(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, text }, 'Failed to parse recommendations');
    }

    return {
      classRecommendations: [],
      techniqueRecommendations: [],
      generalRecommendations: ['Continue praticando regularmente'],
      insights: {
        preferredDays: [],
        preferredTimes: 'Não definido',
        recommendedFrequency: '2-3 vezes por semana',
        strengths: [],
        improvementAreas: [],
      },
    };
  }

  private static parseTechniqueAnalysis(text: string, studentId: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, text }, 'Failed to parse technique analysis');
    }

    return {
      masteryScore: 50,
      proficiency: 'PRACTICING',
      strengths: ['Análise em processamento'],
      improvements: ['Análise em processamento'],
      nextSteps: ['Continue praticando'],
      practicesNeeded: 10,
      confidence: 0.3,
    };
  }

  private static parseVideoAnalysis(text: string, studentId: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, text }, 'Failed to parse video analysis');
    }

    return {
      accuracy: 50,
      form: 50,
      timing: 50,
      power: 50,
      feedback: {
        strengths: ['Análise em processamento'],
        improvements: ['Análise em processamento'],
        recommendations: ['Continue praticando'],
      },
      keyPoints: [],
      confidence: 0.3,
    };
  }
}