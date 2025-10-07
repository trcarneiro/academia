import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from '@/config';
import { logger } from '@/utils/logger';
import { AttendancePattern, DropoutRiskAnalysis } from '@/types';
import { prisma } from '@/utils/database';
import dayjs from 'dayjs';

export class AIService {
  private static anthropic: Anthropic | null = null;

  private static getClient(): Anthropic | null {
    if (!this.anthropic && appConfig.ai.anthropicApiKey) {
      this.anthropic = new Anthropic({
        apiKey: appConfig.ai.anthropicApiKey,
      });
    }
    return this.anthropic;
  }

  private static getGeminiClient() {
    if (appConfig.ai.geminiApiKey) {
      return new GoogleGenerativeAI(appConfig.ai.geminiApiKey);
    }
    return null;
  }

  private static async generateLessonPlansWithGemini(params: {
    geminiClient: GoogleGenerativeAI;
    courseName: string;
    courseLevel: string;
    documentAnalysis: string;
    techniques: any[];
    availableActivities?: any[] | undefined;
    generateCount: number;
    weekRange?: { start: number; end: number } | undefined;
  }): Promise<any[]> {
    const { geminiClient, courseName, courseLevel, documentAnalysis, techniques, availableActivities, generateCount, weekRange } = params;
    
    const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = this.buildLessonPlanGenerationPrompt({
      courseName,
      courseLevel,
      documentAnalysis,
      techniques,
      availableActivities,
      generateCount,
      weekRange,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const lessonPlansText = response.text();
    
    return this.parseLessonPlans(lessonPlansText);
  }

  static async analyzeDropoutRisk(studentId: string): Promise<DropoutRiskAnalysis> {
    try {
      // Get student data with attendance patterns
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          attendances: {
            include: {
              class: {
                include: {
                  courseProgram: true,
                },
              },
            },
            orderBy: { checkInTime: 'desc' },
            take: 50, // Last 50 attendances
          },
          attendancePatterns: true,
          subscriptions: {
            include: {
              plan: true,
              payments: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!student) {
        throw new Error('Estudante não encontrado');
      }

      // Prepare data for AI analysis
      const attendanceData = this.prepareAttendanceData(student);
      const prompt = this.buildDropoutAnalysisPrompt(attendanceData);

      const client = this.getClient();
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = this.parseDropoutAnalysis(analysisText, studentId);

      logger.info(
        {
          studentId,
          riskScore: analysis.riskScore,
          riskLevel: analysis.riskLevel,
        },
        'Dropout risk analysis completed'
      );

      return analysis;
    } catch (error) {
      logger.error({ error, studentId }, 'Failed to analyze dropout risk');
      
      // Return default analysis in case of error
      return {
        studentId,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        factors: ['Dados insuficientes para análise'],
        recommendations: ['Acompanhar frequência do aluno'],
        confidence: 0.1,
      };
    }
  }

  static async analyzeMartialArtsProgress(studentId: string): Promise<any> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          evaluations: {
            orderBy: { evaluatedAt: 'desc' },
            take: 10,
          },
          progressRecords: {
            orderBy: { achievedAt: 'desc' },
            take: 20,
          },
          attendances: {
            include: {
              class: {
                include: {
                  courseProgram: true,
                  lessonPlan: true,
                },
              },
            },
            orderBy: { checkInTime: 'desc' },
            take: 30,
          },
        },
      });

      if (!student) {
        throw new Error('Estudante não encontrado');
      }

      const progressData = this.prepareProgressData(student);
      const prompt = this.buildProgressAnalysisPrompt(progressData);

      const client = this.getClient();
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = this.parseProgressAnalysis(analysisText, studentId);

      logger.info({ studentId }, 'Martial arts progress analysis completed');

      return analysis;
    } catch (error) {
      logger.error({ error, studentId }, 'Failed to analyze martial arts progress');
      throw error;
    }
  }

  static async generateClassRecommendations(studentId: string): Promise<any> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          attendancePatterns: true,
          attendances: {
            include: {
              class: {
                include: {
                  courseProgram: true,
                  schedule: true,
                },
              },
            },
            orderBy: { checkInTime: 'desc' },
            take: 20,
          },
        },
      });

      if (!student) {
        throw new Error('Estudante não encontrado');
      }

      // Get available classes
      const availableClasses = await prisma.class.findMany({
        where: {
          date: {
            gte: new Date(),
          },
          status: 'SCHEDULED',
        },
        include: {
          courseProgram: true,
          schedule: true,
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
        take: 20,
      });

      const recommendationData = this.prepareRecommendationData(student, availableClasses);
      const prompt = this.buildRecommendationPrompt(recommendationData);

      const client = this.getClient();
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const recommendations = this.parseRecommendations(analysisText);

      logger.info({ studentId }, 'Class recommendations generated');

      return recommendations;
    } catch (error) {
      logger.error({ error, studentId }, 'Failed to generate class recommendations');
      throw error;
    }
  }

  /**
   * Analyze a course document using AI to extract key information
   */
  static async analyzeCourseDocument(params: {
    courseId: string;
    courseName: string;
    courseLevel: string;
    courseDescription: string;
    documentContent: string;
    fileName: string;
    analysisType: string;
    aiProvider: string;
  }): Promise<any> {
    try {
      const { courseId, courseName, courseLevel, documentContent, analysisType, aiProvider } = params;

      const client = this.getClient();
      
      // Mock mode when no API key is configured
      if (!client) {
        logger.info({ courseId, analysisType }, 'Using mock AI analysis - no API key configured');
        return this.getMockDocumentAnalysis(courseId, courseName, courseLevel, documentContent);
      }

      const prompt = this.buildDocumentAnalysisPrompt({
        courseName,
        courseLevel,
        documentContent,
        analysisType,
      });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = this.parseDocumentAnalysis(analysisText, courseId);

      logger.info({ courseId, analysisType }, 'Document analysis completed');
      return analysis;
    } catch (error) {
      logger.error({ error, courseId: params.courseId }, 'Failed to analyze course document');
      throw error;
    }
  }

  /**
   * Generate techniques based on course analysis
   */
  static async generateTechniques(params: {
    courseId: string;
    courseName: string;
    courseLevel: string;
    documentAnalysis: string;
    generateCount: number;
    difficulty?: string;
    focusAreas?: string[];
    aiProvider: string;
  }): Promise<any[]> {
    try {
      const { courseId, courseName, courseLevel, documentAnalysis, generateCount, difficulty, focusAreas } = params;

      const client = this.getClient();
      
      // Mock mode when no API key is configured
      if (!client) {
        logger.info({ courseId, generateCount }, 'Using mock technique generation - no API key configured');
        return this.getMockTechniques(generateCount, courseLevel, difficulty);
      }

      const prompt = this.buildTechniqueGenerationPrompt({
        courseName,
        courseLevel,
        documentAnalysis,
        generateCount,
        difficulty,
        focusAreas,
      });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const techniquesText = response.content[0].type === 'text' ? response.content[0].text : '';
      const techniques = this.parseTechniques(techniquesText);

      logger.info({ courseId, generatedCount: techniques.length }, 'Techniques generated');
      return techniques;
    } catch (error) {
      logger.error({ error, courseId: params.courseId }, 'Failed to generate techniques');
      throw error;
    }
  }

  /**
   * Generate lesson plans based on course analysis
   */
  static async generateLessonPlans(params: {
    courseId: string;
    courseName: string;
    courseLevel: string;
    documentAnalysis: string;
    techniques: any[];
    availableActivities?: any[];
    generateCount: number;
    weekRange?: { start: number; end: number };
    aiProvider: string;
  }): Promise<any[]> {
    try {
      const { courseId, courseName, courseLevel, documentAnalysis, techniques, availableActivities, generateCount, weekRange } = params;

      // Try Gemini first
      const geminiClient = this.getGeminiClient();
      if (geminiClient) {
        try {
          logger.info({ courseId, generateCount, provider: 'gemini' }, 'Using Gemini AI for lesson plan generation');
          return await this.generateLessonPlansWithGemini({
            geminiClient,
            courseName,
            courseLevel,
            documentAnalysis,
            techniques,
            availableActivities,
            generateCount,
            weekRange,
          });
        } catch (geminiError) {
          logger.warn({ geminiError }, 'Gemini failed, trying alternative providers');
          // Continue to try other providers
        }
      }

      // Fallback to Claude
      const client = this.getClient();
      if (client) {
        logger.info({ courseId, generateCount, provider: 'claude' }, 'Using Claude AI for lesson plan generation');
        const prompt = this.buildLessonPlanGenerationPrompt({
          courseName,
          courseLevel,
          documentAnalysis,
          techniques,
          availableActivities,
          generateCount,
          weekRange,
        });

        const response = await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const lessonPlansText = response.content[0]?.type === 'text' ? (response.content[0] as any).text : '';
        const lessonPlans = this.parseLessonPlans(lessonPlansText);

        logger.info({ courseId, generatedCount: lessonPlans.length }, 'Lesson plans generated with Claude');
        return lessonPlans;
      }
      
      // Mock mode when no API key is configured
      logger.info({ courseId, generateCount }, 'Using mock lesson plan generation - no API key configured');
      return this.getMockLessonPlans(generateCount, courseLevel, techniques);
    } catch (error) {
      logger.error({ error, courseId: params.courseId }, 'Failed to generate lesson plans');
      throw error;
    }
  }

  // Private helper methods for prompt building and parsing

  private static buildDropoutAnalysisPrompt(data: any): string {
    return `
Você é um especialista em análise de dados de academias de artes marciais (Krav Maga). Analise os dados do estudante abaixo e determine o risco de evasão.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Calcule um score de risco de evasão de 0-100 (0 = baixo risco, 100 = alto risco)
2. Categorize o risco: LOW (0-25), MEDIUM (26-60), HIGH (61-85), CRITICAL (86-100)
3. Identifique os principais fatores de risco
4. Forneça recomendações específicas para retenção

RESPONDA NO FORMATO JSON:
{
  "riskScore": number,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "factors": ["fator1", "fator2", ...],
  "recommendations": ["recomendação1", "recomendação2", ...],
  "confidence": number (0-1)
}
    `.trim();
  }

  private static buildProgressAnalysisPrompt(data: any): string {
    return `
Você é um instrutor experiente de Krav Maga. Analise o progresso do estudante baseado nos dados fornecidos.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Avalie o progresso técnico atual
2. Identifique pontos fortes e áreas para melhoria
3. Sugira próximos passos no treinamento
4. Estime o tempo para próxima graduação

RESPONDA NO FORMATO JSON:
{
  "currentLevel": "string",
  "progressScore": number (0-100),
  "strengths": ["força1", "força2", ...],
  "improvementAreas": ["área1", "área2", ...],
  "nextSteps": ["passo1", "passo2", ...],
  "estimatedTimeToNextLevel": "string",
  "recommendedFocus": ["técnica1", "técnica2", ...]
}
    `.trim();
  }

  private static buildRecommendationPrompt(data: any): string {
    return `
Você é um sistema de recomendação inteligente para academia de Krav Maga. Com base no histórico e preferências do estudante, recomende as melhores aulas.

DADOS DO ESTUDANTE E AULAS DISPONÍVEIS:
${JSON.stringify(data, null, 2)}

INSTRUÇÕES:
1. Analise o padrão de frequência do estudante
2. Considere os dias e horários preferidos
3. Leve em conta o nível atual do estudante
4. Priorize aulas com boa ocupação mas não lotadas
5. Recomende até 5 aulas mais adequadas

RESPONDA NO FORMATO JSON:
{
  "recommendations": [
    {
      "classId": "string",
      "score": number (0-100),
      "reason": "string explicando por que esta aula é recomendada",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "insights": {
    "preferredDays": ["day1", "day2", ...],
    "preferredTimes": "string",
    "recommendedFrequency": "string"
  }
}
    `.trim();
  }

  private static buildDocumentAnalysisPrompt(params: {
    courseName: string;
    courseLevel: string;
    documentContent: string;
    analysisType: string;
  }): string {
    return `
Você é um especialista em Krav Maga e análise de currículos de treinamento. Analise o seguinte documento de curso e extraia informações chave.

**Informações do Curso:**
- Nome: ${params.courseName}
- Nível: ${params.courseLevel}
- Tipo de Análise: ${params.analysisType}

**Conteúdo do Documento:**
${params.documentContent}

Por favor, analise este documento e forneça uma análise estruturada em formato JSON com as seguintes informações:

{
  "summary": "Resumo do conteúdo do documento",
  "keyTechniques": ["lista", "de", "técnicas", "identificadas"],
  "learningObjectives": ["objetivos", "de", "aprendizado"],
  "difficulty": "nivel de dificuldade (1-5)",
  "estimatedDuration": "duração estimada em semanas",
  "prerequisites": ["pré-requisitos", "necessários"],
  "safetyConsiderations": ["considerações", "de", "segurança"],
  "equipment": ["equipamentos", "necessários"],
  "progression": "sequência de progressão sugerida",
  "assessmentCriteria": ["critérios", "de", "avaliação"]
}

Responda apenas com o JSON, sem texto adicional.`;
  }

  private static buildTechniqueGenerationPrompt(params: {
    courseName: string;
    courseLevel: string;
    documentAnalysis: string;
    generateCount: number;
    difficulty?: string;
    focusAreas?: string[];
  }): string {
    return `
Você é um especialista em Krav Maga. Com base na análise do curso fornecida, gere ${params.generateCount} técnicas apropriadas.

**Informações do Curso:**
- Nome: ${params.courseName}
- Nível: ${params.courseLevel}
- Dificuldade Solicitada: ${params.difficulty || 'Automática'}
- Áreas de Foco: ${params.focusAreas?.join(', ') || 'Geral'}

**Análise do Documento:**
${params.documentAnalysis}

Gere ${params.generateCount} técnicas em formato JSON seguindo esta estrutura:

[
  {
    "name": "Nome da Técnica",
    "description": "Descrição detalhada da execução",
    "type": "TECHNIQUE", 
    "difficulty": 1-5,
    "equipment": ["equipamentos", "necessários"],
    "safety": "considerações de segurança",
    "prerequisites": ["técnicas", "pré-requisito"],
    "variations": ["variações", "possíveis"],
    "commonMistakes": ["erros", "comuns"],
    "trainingTips": ["dicas", "de", "treinamento"]
  }
]

As técnicas devem ser progressivas, apropriadas para o nível ${params.courseLevel}, e seguir os princípios do Krav Maga.
Responda apenas com o JSON array, sem texto adicional.`;
  }

  private static buildLessonPlanGenerationPrompt(params: {
    courseName: string;
    courseLevel: string;
    documentAnalysis: string;
    techniques: any[];
    availableActivities?: any[] | undefined;
    generateCount: number;
    weekRange?: { start: number; end: number } | undefined;
  }): string {
    const techniqueNames = params.techniques.map(t => t.name).join(', ');
    
    // Prepare available activities context
    const activitiesContext = params.availableActivities && params.availableActivities.length > 0 
      ? `\n**ATIVIDADES DISPONÍVEIS NO BANCO DE DADOS:**\n${params.availableActivities.map(act => 
          `- ${act.title || act.name}: ${act.description || 'Sem descrição'} (Tipo: ${act.type || 'N/A'}, Dificuldade: ${act.difficulty || 'N/A'})`
        ).join('\n')}\n\n**IMPORTANTE:** Sempre que possível, use atividades existentes do banco de dados acima. Se precisar criar uma nova atividade, ela será automaticamente adicionada ao banco de dados com documentação completa para instrutores e preparação para vídeos futuros por IA.\n`
      : '\n**NOTA:** Novas atividades sugeridas serão automaticamente criadas no banco de dados com documentação completa.\n';
    
    return `
Você é um especialista em Krav Maga e planejamento pedagógico detalhado. Gere ${params.generateCount} planos de aula MUITO DETALHADOS baseados no curso.
${activitiesContext}
**MODELO DE REFERÊNCIA (use como inspiração):**
Um plano completo deve incluir:
- Título específico com tema da aula
- Descrição pedagógica clara dos objetivos
- Estrutura temporal detalhada (aquecimento, técnicas, simulações, relaxamento)
- Equipamentos específicos necessários
- Objetivos de aprendizagem claros e mensuráveis
- Adaptações para diferentes necessidades
- Comandos específicos para o instrutor
- Sistema de avaliação e feedback

**Informações do Curso:**
- Nome: ${params.courseName}
- Nível: ${params.courseLevel}
- Técnicas Disponíveis: ${techniqueNames}

**Contexto da Aula:**
${params.documentAnalysis}

**IMPORTANTE:** Gere planos DETALHADOS seguindo a estrutura JSON abaixo, mas com conteúdo rico e específico para Krav Maga:

[
  {
    "title": "Título Específico da Aula (ex: Introdução ao Krav Maga: Postura, Deslocamentos e Defesas Básicas)",
    "description": "Descrição pedagógica detalhada dos objetivos, contexto e foco da aula",
    "lessonNumber": 1,
    "weekNumber": 1,
    "duration": 60,
    "objectives": [
      "Objetivo específico e mensurável 1",
      "Objetivo específico e mensurável 2",
      "Objetivo específico e mensurável 3",
      "Objetivo específico e mensurável 4",
      "Objetivo específico e mensurável 5"
    ],
    "activities": [
      {
        "name": "Aquecimento Dinâmico",
        "duration": 10,
        "description": "Descrição detalhada da atividade de aquecimento com exercícios específicos",
        "type": "warmup"
      },
      {
        "name": "Técnica Principal do Dia",
        "duration": 20,
        "description": "Ensino e prática detalhada da técnica principal com progressão pedagógica",
        "type": "technique"
      },
      {
        "name": "Aplicação Prática",
        "duration": 15,
        "description": "Exercícios de aplicação da técnica em cenários controlados",
        "type": "drill"
      },
      {
        "name": "Simulação Realística",
        "duration": 10,
        "description": "Simulação em pares ou grupos da técnica aprendida",
        "type": "drill"
      },
      {
        "name": "Relaxamento e Respiração",
        "duration": 5,
        "description": "Exercícios de relaxamento muscular e respiração controlada",
        "type": "cooldown"
      }
    ],
    "materials": ["Tatame ou espaço amplo", "Equipamentos específicos", "Materiais adicionais"],
    "notes": "Observações pedagógicas importantes para o instrutor, adaptações necessárias, pontos de atenção",
    "assessment": "Critérios específicos de avaliação e indicadores de progresso dos alunos",
    "homework": "Tarefa específica para casa que reforce o aprendizado (opcional)"
  }
]

**DIRETRIZES IMPORTANTES:**
- Cada atividade deve ter duração específica totalizando 60 minutos
- Progressão pedagógica do simples para o complexo
- Técnicas apropriadas para o nível ${params.courseLevel}
- Foco na segurança e execução correta
- Incluir princípios específicos do Krav Maga
- Atividades variadas e engajantes
- Objetivos claros e mensuráveis

Responda APENAS com o JSON array, sem texto adicional.`;
  }

  private static parseDropoutAnalysis(analysisText: string, studentId: string): DropoutRiskAnalysis {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          studentId,
          riskScore: analysis.riskScore || 50,
          riskLevel: analysis.riskLevel || 'MEDIUM',
          factors: analysis.factors || [],
          recommendations: analysis.recommendations || [],
          confidence: analysis.confidence || 0.5,
        };
      }
    } catch (error) {
      logger.warn({ error, analysisText }, 'Failed to parse AI dropout analysis');
    }

    // Fallback parsing
    return {
      studentId,
      riskScore: 50,
      riskLevel: 'MEDIUM',
      factors: ['Análise automática não disponível'],
      recommendations: ['Monitorar frequência do aluno'],
      confidence: 0.3,
    };
  }

  private static parseProgressAnalysis(analysisText: string, studentId: string): any {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, analysisText }, 'Failed to parse AI progress analysis');
    }

    return {
      currentLevel: 'Indefinido',
      progressScore: 50,
      strengths: ['Análise em processamento'],
      improvementAreas: ['Análise em processamento'],
      nextSteps: ['Continuar treinamento regular'],
      estimatedTimeToNextLevel: 'A definir',
      recommendedFocus: ['Técnicas básicas'],
    };
  }

  private static parseRecommendations(analysisText: string): any {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, analysisText }, 'Failed to parse AI recommendations');
    }

    return {
      recommendations: [],
      insights: {
        preferredDays: [],
        preferredTimes: 'Não definido',
        recommendedFrequency: '2-3 vezes por semana',
      },
    };
  }

  private static parseDocumentAnalysis(analysisText: string, courseId: string): any {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          courseId,
          ...parsed,
          analyzedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      logger.warn({ error, analysisText }, 'Failed to parse document analysis');
    }

    return {
      courseId,
      summary: 'Análise automática do documento',
      keyTechniques: ['Técnicas básicas de Krav Maga'],
      learningObjectives: ['Aprender defesa pessoal', 'Desenvolver condicionamento físico'],
      difficulty: 1,
      estimatedDuration: '8 semanas',
      prerequisites: ['Nenhum'],
      safetyConsiderations: ['Aquecimento adequado', 'Uso de equipamentos'],
      equipment: ['Proteções básicas'],
      progression: 'Do básico ao avançado',
      assessmentCriteria: ['Execução correta das técnicas'],
      analyzedAt: new Date().toISOString(),
    };
  }

  private static parseTechniques(techniquesText: string): any[] {
    try {
      const jsonMatch = techniquesText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, techniquesText }, 'Failed to parse techniques');
    }

    return [
      {
        name: 'Postura de Combate',
        description: 'Posição básica de defesa e ataque no Krav Maga',
        type: 'TECHNIQUE',
        difficulty: 1,
        equipment: [],
        safety: 'Manter sempre o equilíbrio',
        prerequisites: [],
        variations: ['Postura alta', 'Postura baixa'],
        commonMistakes: ['Tensão excessiva', 'Desequilíbrio'],
        trainingTips: ['Praticar em frente ao espelho', 'Focar na respiração'],
      },
    ];
  }

  private static parseLessonPlans(lessonPlansText: string): any[] {
    try {
      const jsonMatch = lessonPlansText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn({ error, lessonPlansText }, 'Failed to parse lesson plans');
    }

    return [
      {
        title: 'Introdução ao Krav Maga',
        description: 'Aula introdutória com conceitos básicos',
        lessonNumber: 1,
        weekNumber: 1,
        duration: 60,
        objectives: ['Apresentar os princípios do Krav Maga', 'Ensinar postura básica'],
        activities: [
          {
            name: 'Aquecimento',
            duration: 10,
            description: 'Exercícios de mobilidade e aquecimento articular',
            type: 'warmup',
          },
          {
            name: 'Postura de Combate',
            duration: 20,
            description: 'Ensino e prática da postura básica',
            type: 'technique',
          },
          {
            name: 'Deslocamentos',
            duration: 20,
            description: 'Movimentação básica na postura de combate',
            type: 'drill',
          },
          {
            name: 'Relaxamento',
            duration: 10,
            description: 'Alongamento e técnicas de respiração',
            type: 'cooldown',
          },
        ],
        materials: ['Colchonetes', 'Espelho'],
        notes: 'Enfatizar a importância da postura correta desde o início',
        assessment: 'Observar se os alunos mantêm a postura durante os exercícios',
        homework: 'Praticar a postura em casa por 5 minutos diários',
      },
    ];
  }

  /**
   * Generate mock document analysis for testing without API key
   */
  private static getMockDocumentAnalysis(courseId: string, courseName: string, courseLevel: string, documentContent: string): any {
    const contentLength = documentContent.length;
    const difficulty = courseLevel === 'ADVANCED' ? 4 : courseLevel === 'INTERMEDIATE' ? 3 : 2;
    
    return {
      courseId,
      summary: `Análise simulada do curso "${courseName}" (${contentLength} caracteres de conteúdo). Este é um documento de treinamento em Krav Maga que contém instruções detalhadas para técnicas de defesa pessoal.`,
      keyTechniques: [
        'Postura de Combate',
        'Socos Diretos',
        'Defesas contra Estrangulamento',
        'Chutes de Defesa',
        'Movimentação Tática'
      ],
      learningObjectives: [
        'Desenvolver reflexos de defesa',
        'Aprender técnicas básicas de Krav Maga',
        'Melhorar condicionamento físico',
        'Ganhar confiança em situações de perigo'
      ],
      difficulty,
      estimatedDuration: '8-12 semanas',
      prerequisites: courseLevel === 'BEGINNER' ? ['Nenhum'] : ['Conhecimento básico de Krav Maga'],
      safetyConsiderations: [
        'Aquecimento obrigatório de 10 minutos',
        'Uso de equipamentos de proteção',
        'Supervisão de instrutor qualificado',
        'Progressão gradual na intensidade'
      ],
      equipment: [
        'Proteções para punhos',
        'Protetor bucal',
        'Colchonetes',
        'Equipamentos de treino'
      ],
      progression: 'Sequência progressiva: fundamentos → técnicas básicas → aplicação prática → sparring controlado',
      assessmentCriteria: [
        'Execução correta das técnicas',
        'Tempo de reação',
        'Aplicação em cenários simulados',
        'Compreensão dos princípios'
      ],
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate mock techniques for testing without API key
   */
  private static getMockTechniques(count: number, courseLevel: string, difficulty?: string): any[] {
    const baseDifficulty = difficulty ? parseInt(difficulty) : (courseLevel === 'ADVANCED' ? 4 : courseLevel === 'INTERMEDIATE' ? 3 : 2);
    
    const mockTechniques = [
      {
        name: 'Postura de Combate Básica',
        description: 'Posição fundamental do Krav Maga com pés afastados na largura dos ombros, joelhos levemente flexionados, mãos protegendo o rosto.',
        type: 'TECHNIQUE',
        difficulty: Math.max(1, baseDifficulty - 1),
        equipment: [],
        safety: 'Manter sempre o equilíbrio e respiração controlada',
        prerequisites: [],
        variations: ['Postura alta', 'Postura baixa', 'Postura lateral'],
        commonMistakes: ['Tensão excessiva', 'Pés muito juntos', 'Mãos muito baixas'],
        trainingTips: ['Praticar em frente ao espelho', 'Focar na respiração', 'Manter relaxamento dinâmico']
      },
      {
        name: 'Soco Direto (Jab)',
        description: 'Golpe reto executado com o punho da mão mais avançada, mantendo velocidade e precisão.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty,
        equipment: ['Luvas de treino', 'Saco de pancadas'],
        safety: 'Aquecer pulsos e ombros antes da execução',
        prerequisites: ['Postura de Combate Básica'],
        variations: ['Jab alto', 'Jab no corpo', 'Jab duplo'],
        commonMistakes: ['Baixar a guarda', 'Movimento telegrafado', 'Falta de rotação do quadril'],
        trainingTips: ['Iniciar devagar', 'Focar na trajetória linear', 'Retornar rapidamente à posição']
      },
      {
        name: 'Defesa contra Estrangulamento Frontal',
        description: 'Técnica para se libertar quando atacado por estrangulamento de frente, usando alavancas e pontos de pressão.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty + 1,
        equipment: ['Parceiro de treino'],
        safety: 'Praticar com intensidade controlada, sinais de parada definidos',
        prerequisites: ['Postura de Combate Básica', 'Noções de distância'],
        variations: ['Duas mãos no pescoço', 'Uma mão no pescoço', 'Com empurrão'],
        commonMistakes: ['Pânico', 'Não usar o corpo todo', 'Demora na reação'],
        trainingTips: ['Praticar lentamente', 'Respirar durante a técnica', 'Treinar ambos os lados']
      },
      {
        name: 'Chute de Defesa (Push Kick)',
        description: 'Chute frontal com a planta do pé para manter distância e desequilibrar o oponente.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty,
        equipment: ['Almofadas de chute'],
        safety: 'Aquecer articulações das pernas, atenção ao equilíbrio',
        prerequisites: ['Postura de Combate Básica'],
        variations: ['Chute baixo', 'Chute médio', 'Chute com pé de apoio'],
        commonMistakes: ['Perder equilíbrio', 'Usar a ponta do pé', 'Não usar o quadril'],
        trainingTips: ['Treinar em apoio único', 'Focar na penetração', 'Recolher rapidamente']
      },
      {
        name: 'Esquiva Lateral',
        description: 'Movimento evasivo para sair da linha de ataque, mantendo posição para contra-ataque.',
        type: 'DRILL',
        difficulty: baseDifficulty - 1,
        equipment: [],
        safety: 'Atenção ao espaço ao redor, evitar tropeços',
        prerequisites: ['Postura de Combate Básica'],
        variations: ['Esquiva direita', 'Esquiva esquerda', 'Esquiva com contra-ataque'],
        commonMistakes: ['Esquivar muito cedo', 'Perder a guarda', 'Não contra-atacar'],
        trainingTips: ['Treinar timing', 'Manter visão no oponente', 'Fluidez no movimento']
      }
    ];

    return mockTechniques.slice(0, Math.min(count, mockTechniques.length));
  }

  /**
   * Generate mock lesson plans for testing without AI API key
   */
  private static getMockLessonPlans(count: number, courseLevel: string, techniques: any[]): any[] {
    const baseActivities = {
      warmup: [
        { name: 'Aquecimento Articular', duration: 5, description: 'Movimentos circulares de articulações', type: 'warmup' },
        { name: 'Corrida Leve', duration: 5, description: 'Ativação cardiovascular', type: 'warmup' }
      ],
      techniques: [
        { name: 'Ensino de Técnica', duration: 20, description: 'Demonstração e prática da técnica principal', type: 'technique' },
        { name: 'Repetições Controladas', duration: 15, description: 'Prática repetitiva com correções', type: 'technique' }
      ],
      drills: [
        { name: 'Exercício de Aplicação', duration: 15, description: 'Aplicação da técnica em cenários', type: 'drill' },
        { name: 'Exercício de Velocidade', duration: 10, description: 'Execução com tempo limitado', type: 'drill' }
      ],
      cooldown: [
        { name: 'Alongamento', duration: 8, description: 'Relaxamento muscular e flexibilidade', type: 'cooldown' },
        { name: 'Respiração', duration: 2, description: 'Técnicas de respiração para relaxamento', type: 'cooldown' }
      ]
    };

    const mockPlans = [];

    for (let i = 1; i <= count; i++) {
      const weekNumber = Math.ceil(i / 2);
      const lessonInWeek = i % 2 === 1 ? 1 : 2;
      
      const plan = {
        title: `Aula ${i}: ${i === 1 ? 'Introdução ao Krav Maga' : i <= 4 ? 'Fundamentos Básicos' : i <= 8 ? 'Técnicas Intermediárias' : 'Aplicação Prática'}`,
        description: `Aula ${i} do curso de Krav Maga ${courseLevel}. Foco em ${i <= 2 ? 'apresentação e postura básica' : i <= 6 ? 'técnicas de ataque e defesa' : 'aplicação e sparring controlado'}.`,
        lessonNumber: i,
        weekNumber: weekNumber,
        duration: 60,
        objectives: [
          i === 1 ? 'Apresentar os princípios do Krav Maga' : 'Desenvolver técnicas específicas',
          i <= 4 ? 'Estabelecer fundamentos sólidos' : 'Aplicar conhecimentos adquiridos',
          'Melhorar condicionamento físico',
          i >= 6 ? 'Preparar para situações reais' : 'Construir confiança'
        ],
        activities: [
          ...baseActivities.warmup,
          ...baseActivities.techniques,
          ...(i >= 4 ? baseActivities.drills : []),
          ...baseActivities.cooldown
        ],
        materials: [
          'Colchonetes',
          'Proteções básicas',
          ...(i >= 6 ? ['Almofadas de treino', 'Equipamentos de sparring'] : []),
          'Espelho (se disponível)'
        ],
        notes: `Aula ${i} - ${lessonInWeek}ª aula da semana ${weekNumber}. ${i === 1 ? 'Enfatizar a importância da postura e disciplina.' : i <= 4 ? 'Focar na execução correta das técnicas.' : 'Incentivar aplicação prática com segurança.'}`,
        assessment: i <= 2 ? 'Observar postura e atenção dos alunos' : i <= 6 ? 'Avaliar execução das técnicas ensinadas' : 'Verificar aplicação em cenários simulados',
        homework: i === 1 ? 'Praticar postura de combate em casa por 5 minutos diários' : i <= 4 ? 'Revisar movimentos básicos' : 'Mentalizar cenários de aplicação'
      };

      mockPlans.push(plan);
    }

    return mockPlans;
  }
}