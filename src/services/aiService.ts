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
    
    const model = geminiClient.getGenerativeModel({ model: (process.env.GEMINI_MODEL || process.env.RAG_MODEL || 'gemini-2.5-flash') });
    
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
        throw new Error('Estudante nÃ£o encontrado');
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
        factors: ['Dados insuficientes para anÃ¡lise'],
        recommendations: ['Acompanhar frequÃªncia do aluno'],
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
        throw new Error('Estudante nÃ£o encontrado');
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
        throw new Error('Estudante nÃ£o encontrado');
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
VocÃª Ã© um especialista em anÃ¡lise de dados de academias de artes marciais (Krav Maga). Analise os dados do estudante abaixo e determine o risco de evasÃ£o.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÃ‡Ã•ES:
1. Calcule um score de risco de evasÃ£o de 0-100 (0 = baixo risco, 100 = alto risco)
2. Categorize o risco: LOW (0-25), MEDIUM (26-60), HIGH (61-85), CRITICAL (86-100)
3. Identifique os principais fatores de risco
4. ForneÃ§a recomendaÃ§Ãµes especÃ­ficas para retenÃ§Ã£o

RESPONDA NO FORMATO JSON:
{
  "riskScore": number,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "factors": ["fator1", "fator2", ...],
  "recommendations": ["recomendaÃ§Ã£o1", "recomendaÃ§Ã£o2", ...],
  "confidence": number (0-1)
}
    `.trim();
  }

  private static buildProgressAnalysisPrompt(data: any): string {
    return `
VocÃª Ã© um instrutor experiente de Krav Maga. Analise o progresso do estudante baseado nos dados fornecidos.

DADOS DO ESTUDANTE:
${JSON.stringify(data, null, 2)}

INSTRUÃ‡Ã•ES:
1. Avalie o progresso tÃ©cnico atual
2. Identifique pontos fortes e Ã¡reas para melhoria
3. Sugira prÃ³ximos passos no treinamento
4. Estime o tempo para prÃ³xima graduaÃ§Ã£o

RESPONDA NO FORMATO JSON:
{
  "currentLevel": "string",
  "progressScore": number (0-100),
  "strengths": ["forÃ§a1", "forÃ§a2", ...],
  "improvementAreas": ["Ã¡rea1", "Ã¡rea2", ...],
  "nextSteps": ["passo1", "passo2", ...],
  "estimatedTimeToNextLevel": "string",
  "recommendedFocus": ["tÃ©cnica1", "tÃ©cnica2", ...]
}
    `.trim();
  }

  private static buildRecommendationPrompt(data: any): string {
    return `
VocÃª Ã© um sistema de recomendaÃ§Ã£o inteligente para academia de Krav Maga. Com base no histÃ³rico e preferÃªncias do estudante, recomende as melhores aulas.

DADOS DO ESTUDANTE E AULAS DISPONÃVEIS:
${JSON.stringify(data, null, 2)}

INSTRUÃ‡Ã•ES:
1. Analise o padrÃ£o de frequÃªncia do estudante
2. Considere os dias e horÃ¡rios preferidos
3. Leve em conta o nÃ­vel atual do estudante
4. Priorize aulas com boa ocupaÃ§Ã£o mas nÃ£o lotadas
5. Recomende atÃ© 5 aulas mais adequadas

RESPONDA NO FORMATO JSON:
{
  "recommendations": [
    {
      "classId": "string",
      "score": number (0-100),
      "reason": "string explicando por que esta aula Ã© recomendada",
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
VocÃª Ã© um especialista em Krav Maga e anÃ¡lise de currÃ­culos de treinamento. Analise o seguinte documento de curso e extraia informaÃ§Ãµes chave.

**InformaÃ§Ãµes do Curso:**
- Nome: ${params.courseName}
- NÃ­vel: ${params.courseLevel}
- Tipo de AnÃ¡lise: ${params.analysisType}

**ConteÃºdo do Documento:**
${params.documentContent}

Por favor, analise este documento e forneÃ§a uma anÃ¡lise estruturada em formato JSON com as seguintes informaÃ§Ãµes:

{
  "summary": "Resumo do conteÃºdo do documento",
  "keyTechniques": ["lista", "de", "tÃ©cnicas", "identificadas"],
  "learningObjectives": ["objetivos", "de", "aprendizado"],
  "difficulty": "nivel de dificuldade (1-5)",
  "estimatedDuration": "duraÃ§Ã£o estimada em semanas",
  "prerequisites": ["prÃ©-requisitos", "necessÃ¡rios"],
  "safetyConsiderations": ["consideraÃ§Ãµes", "de", "seguranÃ§a"],
  "equipment": ["equipamentos", "necessÃ¡rios"],
  "progression": "sequÃªncia de progressÃ£o sugerida",
  "assessmentCriteria": ["critÃ©rios", "de", "avaliaÃ§Ã£o"]
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
VocÃª Ã© um especialista em Krav Maga. Com base na anÃ¡lise do curso fornecida, gere ${params.generateCount} tÃ©cnicas apropriadas.

**InformaÃ§Ãµes do Curso:**
- Nome: ${params.courseName}
- NÃ­vel: ${params.courseLevel}
- Dificuldade Solicitada: ${params.difficulty || 'AutomÃ¡tica'}
- Ãreas de Foco: ${params.focusAreas?.join(', ') || 'Geral'}

**AnÃ¡lise do Documento:**
${params.documentAnalysis}

Gere ${params.generateCount} tÃ©cnicas em formato JSON seguindo esta estrutura:

[
  {
    "name": "Nome da TÃ©cnica",
    "description": "DescriÃ§Ã£o detalhada da execuÃ§Ã£o",
    "type": "TECHNIQUE", 
    "difficulty": 1-5,
    "equipment": ["equipamentos", "necessÃ¡rios"],
    "safety": "consideraÃ§Ãµes de seguranÃ§a",
    "prerequisites": ["tÃ©cnicas", "prÃ©-requisito"],
    "variations": ["variaÃ§Ãµes", "possÃ­veis"],
    "commonMistakes": ["erros", "comuns"],
    "trainingTips": ["dicas", "de", "treinamento"]
  }
]

As tÃ©cnicas devem ser progressivas, apropriadas para o nÃ­vel ${params.courseLevel}, e seguir os princÃ­pios do Krav Maga.
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
      ? `\n**ATIVIDADES DISPONÃVEIS NO BANCO DE DADOS:**\n${params.availableActivities.map(act => 
          `- ${act.title || act.name}: ${act.description || 'Sem descriÃ§Ã£o'} (Tipo: ${act.type || 'N/A'}, Dificuldade: ${act.difficulty || 'N/A'})`
        ).join('\n')}\n\n**IMPORTANTE:** Sempre que possÃ­vel, use atividades existentes do banco de dados acima. Se precisar criar uma nova atividade, ela serÃ¡ automaticamente adicionada ao banco de dados com documentaÃ§Ã£o completa para instrutores e preparaÃ§Ã£o para vÃ­deos futuros por IA.\n`
      : '\n**NOTA:** Novas atividades sugeridas serÃ£o automaticamente criadas no banco de dados com documentaÃ§Ã£o completa.\n';
    
    return `
VocÃª Ã© um especialista em Krav Maga e planejamento pedagÃ³gico detalhado. Gere ${params.generateCount} planos de aula MUITO DETALHADOS baseados no curso.
${activitiesContext}
**MODELO DE REFERÃŠNCIA (use como inspiraÃ§Ã£o):**
Um plano completo deve incluir:
- TÃ­tulo especÃ­fico com tema da aula
- DescriÃ§Ã£o pedagÃ³gica clara dos objetivos
- Estrutura temporal detalhada (aquecimento, tÃ©cnicas, simulaÃ§Ãµes, relaxamento)
- Equipamentos especÃ­ficos necessÃ¡rios
- Objetivos de aprendizagem claros e mensurÃ¡veis
- AdaptaÃ§Ãµes para diferentes necessidades
- Comandos especÃ­ficos para o instrutor
- Sistema de avaliaÃ§Ã£o e feedback

**InformaÃ§Ãµes do Curso:**
- Nome: ${params.courseName}
- NÃ­vel: ${params.courseLevel}
- TÃ©cnicas DisponÃ­veis: ${techniqueNames}

**Contexto da Aula:**
${params.documentAnalysis}

**IMPORTANTE:** Gere planos DETALHADOS seguindo a estrutura JSON abaixo, mas com conteÃºdo rico e especÃ­fico para Krav Maga:

[
  {
    "title": "TÃ­tulo EspecÃ­fico da Aula (ex: IntroduÃ§Ã£o ao Krav Maga: Postura, Deslocamentos e Defesas BÃ¡sicas)",
    "description": "DescriÃ§Ã£o pedagÃ³gica detalhada dos objetivos, contexto e foco da aula",
    "lessonNumber": 1,
    "weekNumber": 1,
    "duration": 60,
    "objectives": [
      "Objetivo especÃ­fico e mensurÃ¡vel 1",
      "Objetivo especÃ­fico e mensurÃ¡vel 2",
      "Objetivo especÃ­fico e mensurÃ¡vel 3",
      "Objetivo especÃ­fico e mensurÃ¡vel 4",
      "Objetivo especÃ­fico e mensurÃ¡vel 5"
    ],
    "activities": [
      {
        "name": "Aquecimento DinÃ¢mico",
        "duration": 10,
        "description": "DescriÃ§Ã£o detalhada da atividade de aquecimento com exercÃ­cios especÃ­ficos",
        "type": "warmup"
      },
      {
        "name": "TÃ©cnica Principal do Dia",
        "duration": 20,
        "description": "Ensino e prÃ¡tica detalhada da tÃ©cnica principal com progressÃ£o pedagÃ³gica",
        "type": "technique"
      },
      {
        "name": "AplicaÃ§Ã£o PrÃ¡tica",
        "duration": 15,
        "description": "ExercÃ­cios de aplicaÃ§Ã£o da tÃ©cnica em cenÃ¡rios controlados",
        "type": "drill"
      },
      {
        "name": "SimulaÃ§Ã£o RealÃ­stica",
        "duration": 10,
        "description": "SimulaÃ§Ã£o em pares ou grupos da tÃ©cnica aprendida",
        "type": "drill"
      },
      {
        "name": "Relaxamento e RespiraÃ§Ã£o",
        "duration": 5,
        "description": "ExercÃ­cios de relaxamento muscular e respiraÃ§Ã£o controlada",
        "type": "cooldown"
      }
    ],
    "materials": ["Tatame ou espaÃ§o amplo", "Equipamentos especÃ­ficos", "Materiais adicionais"],
    "notes": "ObservaÃ§Ãµes pedagÃ³gicas importantes para o instrutor, adaptaÃ§Ãµes necessÃ¡rias, pontos de atenÃ§Ã£o",
    "assessment": "CritÃ©rios especÃ­ficos de avaliaÃ§Ã£o e indicadores de progresso dos alunos",
    "homework": "Tarefa especÃ­fica para casa que reforce o aprendizado (opcional)"
  }
]

**DIRETRIZES IMPORTANTES:**
- Cada atividade deve ter duraÃ§Ã£o especÃ­fica totalizando 60 minutos
- ProgressÃ£o pedagÃ³gica do simples para o complexo
- TÃ©cnicas apropriadas para o nÃ­vel ${params.courseLevel}
- Foco na seguranÃ§a e execuÃ§Ã£o correta
- Incluir princÃ­pios especÃ­ficos do Krav Maga
- Atividades variadas e engajantes
- Objetivos claros e mensurÃ¡veis

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
      factors: ['AnÃ¡lise automÃ¡tica nÃ£o disponÃ­vel'],
      recommendations: ['Monitorar frequÃªncia do aluno'],
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
      strengths: ['AnÃ¡lise em processamento'],
      improvementAreas: ['AnÃ¡lise em processamento'],
      nextSteps: ['Continuar treinamento regular'],
      estimatedTimeToNextLevel: 'A definir',
      recommendedFocus: ['TÃ©cnicas bÃ¡sicas'],
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
        preferredTimes: 'NÃ£o definido',
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
      summary: 'AnÃ¡lise automÃ¡tica do documento',
      keyTechniques: ['TÃ©cnicas bÃ¡sicas de Krav Maga'],
      learningObjectives: ['Aprender defesa pessoal', 'Desenvolver condicionamento fÃ­sico'],
      difficulty: 1,
      estimatedDuration: '8 semanas',
      prerequisites: ['Nenhum'],
      safetyConsiderations: ['Aquecimento adequado', 'Uso de equipamentos'],
      equipment: ['ProteÃ§Ãµes bÃ¡sicas'],
      progression: 'Do bÃ¡sico ao avanÃ§ado',
      assessmentCriteria: ['ExecuÃ§Ã£o correta das tÃ©cnicas'],
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
        description: 'PosiÃ§Ã£o bÃ¡sica de defesa e ataque no Krav Maga',
        type: 'TECHNIQUE',
        difficulty: 1,
        equipment: [],
        safety: 'Manter sempre o equilÃ­brio',
        prerequisites: [],
        variations: ['Postura alta', 'Postura baixa'],
        commonMistakes: ['TensÃ£o excessiva', 'DesequilÃ­brio'],
        trainingTips: ['Praticar em frente ao espelho', 'Focar na respiraÃ§Ã£o'],
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
        title: 'IntroduÃ§Ã£o ao Krav Maga',
        description: 'Aula introdutÃ³ria com conceitos bÃ¡sicos',
        lessonNumber: 1,
        weekNumber: 1,
        duration: 60,
        objectives: ['Apresentar os princÃ­pios do Krav Maga', 'Ensinar postura bÃ¡sica'],
        activities: [
          {
            name: 'Aquecimento',
            duration: 10,
            description: 'ExercÃ­cios de mobilidade e aquecimento articular',
            type: 'warmup',
          },
          {
            name: 'Postura de Combate',
            duration: 20,
            description: 'Ensino e prÃ¡tica da postura bÃ¡sica',
            type: 'technique',
          },
          {
            name: 'Deslocamentos',
            duration: 20,
            description: 'MovimentaÃ§Ã£o bÃ¡sica na postura de combate',
            type: 'drill',
          },
          {
            name: 'Relaxamento',
            duration: 10,
            description: 'Alongamento e tÃ©cnicas de respiraÃ§Ã£o',
            type: 'cooldown',
          },
        ],
        materials: ['Colchonetes', 'Espelho'],
        notes: 'Enfatizar a importÃ¢ncia da postura correta desde o inÃ­cio',
        assessment: 'Observar se os alunos mantÃªm a postura durante os exercÃ­cios',
        homework: 'Praticar a postura em casa por 5 minutos diÃ¡rios',
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
      summary: `AnÃ¡lise simulada do curso "${courseName}" (${contentLength} caracteres de conteÃºdo). Este Ã© um documento de treinamento em Krav Maga que contÃ©m instruÃ§Ãµes detalhadas para tÃ©cnicas de defesa pessoal.`,
      keyTechniques: [
        'Postura de Combate',
        'Socos Diretos',
        'Defesas contra Estrangulamento',
        'Chutes de Defesa',
        'MovimentaÃ§Ã£o TÃ¡tica'
      ],
      learningObjectives: [
        'Desenvolver reflexos de defesa',
        'Aprender tÃ©cnicas bÃ¡sicas de Krav Maga',
        'Melhorar condicionamento fÃ­sico',
        'Ganhar confianÃ§a em situaÃ§Ãµes de perigo'
      ],
      difficulty,
      estimatedDuration: '8-12 semanas',
      prerequisites: courseLevel === 'BEGINNER' ? ['Nenhum'] : ['Conhecimento bÃ¡sico de Krav Maga'],
      safetyConsiderations: [
        'Aquecimento obrigatÃ³rio de 10 minutos',
        'Uso de equipamentos de proteÃ§Ã£o',
        'SupervisÃ£o de instrutor qualificado',
        'ProgressÃ£o gradual na intensidade'
      ],
      equipment: [
        'ProteÃ§Ãµes para punhos',
        'Protetor bucal',
        'Colchonetes',
        'Equipamentos de treino'
      ],
      progression: 'SequÃªncia progressiva: fundamentos â†’ tÃ©cnicas bÃ¡sicas â†’ aplicaÃ§Ã£o prÃ¡tica â†’ sparring controlado',
      assessmentCriteria: [
        'ExecuÃ§Ã£o correta das tÃ©cnicas',
        'Tempo de reaÃ§Ã£o',
        'AplicaÃ§Ã£o em cenÃ¡rios simulados',
        'CompreensÃ£o dos princÃ­pios'
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
        name: 'Postura de Combate BÃ¡sica',
        description: 'PosiÃ§Ã£o fundamental do Krav Maga com pÃ©s afastados na largura dos ombros, joelhos levemente flexionados, mÃ£os protegendo o rosto.',
        type: 'TECHNIQUE',
        difficulty: Math.max(1, baseDifficulty - 1),
        equipment: [],
        safety: 'Manter sempre o equilÃ­brio e respiraÃ§Ã£o controlada',
        prerequisites: [],
        variations: ['Postura alta', 'Postura baixa', 'Postura lateral'],
        commonMistakes: ['TensÃ£o excessiva', 'PÃ©s muito juntos', 'MÃ£os muito baixas'],
        trainingTips: ['Praticar em frente ao espelho', 'Focar na respiraÃ§Ã£o', 'Manter relaxamento dinÃ¢mico']
      },
      {
        name: 'Soco Direto (Jab)',
        description: 'Golpe reto executado com o punho da mÃ£o mais avanÃ§ada, mantendo velocidade e precisÃ£o.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty,
        equipment: ['Luvas de treino', 'Saco de pancadas'],
        safety: 'Aquecer pulsos e ombros antes da execuÃ§Ã£o',
        prerequisites: ['Postura de Combate BÃ¡sica'],
        variations: ['Jab alto', 'Jab no corpo', 'Jab duplo'],
        commonMistakes: ['Baixar a guarda', 'Movimento telegrafado', 'Falta de rotaÃ§Ã£o do quadril'],
        trainingTips: ['Iniciar devagar', 'Focar na trajetÃ³ria linear', 'Retornar rapidamente Ã  posiÃ§Ã£o']
      },
      {
        name: 'Defesa contra Estrangulamento Frontal',
        description: 'TÃ©cnica para se libertar quando atacado por estrangulamento de frente, usando alavancas e pontos de pressÃ£o.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty + 1,
        equipment: ['Parceiro de treino'],
        safety: 'Praticar com intensidade controlada, sinais de parada definidos',
        prerequisites: ['Postura de Combate BÃ¡sica', 'NoÃ§Ãµes de distÃ¢ncia'],
        variations: ['Duas mÃ£os no pescoÃ§o', 'Uma mÃ£o no pescoÃ§o', 'Com empurrÃ£o'],
        commonMistakes: ['PÃ¢nico', 'NÃ£o usar o corpo todo', 'Demora na reaÃ§Ã£o'],
        trainingTips: ['Praticar lentamente', 'Respirar durante a tÃ©cnica', 'Treinar ambos os lados']
      },
      {
        name: 'Chute de Defesa (Push Kick)',
        description: 'Chute frontal com a planta do pÃ© para manter distÃ¢ncia e desequilibrar o oponente.',
        type: 'TECHNIQUE',
        difficulty: baseDifficulty,
        equipment: ['Almofadas de chute'],
        safety: 'Aquecer articulaÃ§Ãµes das pernas, atenÃ§Ã£o ao equilÃ­brio',
        prerequisites: ['Postura de Combate BÃ¡sica'],
        variations: ['Chute baixo', 'Chute mÃ©dio', 'Chute com pÃ© de apoio'],
        commonMistakes: ['Perder equilÃ­brio', 'Usar a ponta do pÃ©', 'NÃ£o usar o quadril'],
        trainingTips: ['Treinar em apoio Ãºnico', 'Focar na penetraÃ§Ã£o', 'Recolher rapidamente']
      },
      {
        name: 'Esquiva Lateral',
        description: 'Movimento evasivo para sair da linha de ataque, mantendo posiÃ§Ã£o para contra-ataque.',
        type: 'DRILL',
        difficulty: baseDifficulty - 1,
        equipment: [],
        safety: 'AtenÃ§Ã£o ao espaÃ§o ao redor, evitar tropeÃ§os',
        prerequisites: ['Postura de Combate BÃ¡sica'],
        variations: ['Esquiva direita', 'Esquiva esquerda', 'Esquiva com contra-ataque'],
        commonMistakes: ['Esquivar muito cedo', 'Perder a guarda', 'NÃ£o contra-atacar'],
        trainingTips: ['Treinar timing', 'Manter visÃ£o no oponente', 'Fluidez no movimento']
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
        { name: 'Aquecimento Articular', duration: 5, description: 'Movimentos circulares de articulaÃ§Ãµes', type: 'warmup' },
        { name: 'Corrida Leve', duration: 5, description: 'AtivaÃ§Ã£o cardiovascular', type: 'warmup' }
      ],
      techniques: [
        { name: 'Ensino de TÃ©cnica', duration: 20, description: 'DemonstraÃ§Ã£o e prÃ¡tica da tÃ©cnica principal', type: 'technique' },
        { name: 'RepetiÃ§Ãµes Controladas', duration: 15, description: 'PrÃ¡tica repetitiva com correÃ§Ãµes', type: 'technique' }
      ],
      drills: [
        { name: 'ExercÃ­cio de AplicaÃ§Ã£o', duration: 15, description: 'AplicaÃ§Ã£o da tÃ©cnica em cenÃ¡rios', type: 'drill' },
        { name: 'ExercÃ­cio de Velocidade', duration: 10, description: 'ExecuÃ§Ã£o com tempo limitado', type: 'drill' }
      ],
      cooldown: [
        { name: 'Alongamento', duration: 8, description: 'Relaxamento muscular e flexibilidade', type: 'cooldown' },
        { name: 'RespiraÃ§Ã£o', duration: 2, description: 'TÃ©cnicas de respiraÃ§Ã£o para relaxamento', type: 'cooldown' }
      ]
    };

    const mockPlans = [];

    for (let i = 1; i <= count; i++) {
      const weekNumber = Math.ceil(i / 2);
      const lessonInWeek = i % 2 === 1 ? 1 : 2;
      
      const plan = {
        title: `Aula ${i}: ${i === 1 ? 'IntroduÃ§Ã£o ao Krav Maga' : i <= 4 ? 'Fundamentos BÃ¡sicos' : i <= 8 ? 'TÃ©cnicas IntermediÃ¡rias' : 'AplicaÃ§Ã£o PrÃ¡tica'}`,
        description: `Aula ${i} do curso de Krav Maga ${courseLevel}. Foco em ${i <= 2 ? 'apresentaÃ§Ã£o e postura bÃ¡sica' : i <= 6 ? 'tÃ©cnicas de ataque e defesa' : 'aplicaÃ§Ã£o e sparring controlado'}.`,
        lessonNumber: i,
        weekNumber: weekNumber,
        duration: 60,
        objectives: [
          i === 1 ? 'Apresentar os princÃ­pios do Krav Maga' : 'Desenvolver tÃ©cnicas especÃ­ficas',
          i <= 4 ? 'Estabelecer fundamentos sÃ³lidos' : 'Aplicar conhecimentos adquiridos',
          'Melhorar condicionamento fÃ­sico',
          i >= 6 ? 'Preparar para situaÃ§Ãµes reais' : 'Construir confianÃ§a'
        ],
        activities: [
          ...baseActivities.warmup,
          ...baseActivities.techniques,
          ...(i >= 4 ? baseActivities.drills : []),
          ...baseActivities.cooldown
        ],
        materials: [
          'Colchonetes',
          'ProteÃ§Ãµes bÃ¡sicas',
          ...(i >= 6 ? ['Almofadas de treino', 'Equipamentos de sparring'] : []),
          'Espelho (se disponÃ­vel)'
        ],
        notes: `Aula ${i} - ${lessonInWeek}Âª aula da semana ${weekNumber}. ${i === 1 ? 'Enfatizar a importÃ¢ncia da postura e disciplina.' : i <= 4 ? 'Focar na execuÃ§Ã£o correta das tÃ©cnicas.' : 'Incentivar aplicaÃ§Ã£o prÃ¡tica com seguranÃ§a.'}`,
        assessment: i <= 2 ? 'Observar postura e atenÃ§Ã£o dos alunos' : i <= 6 ? 'Avaliar execuÃ§Ã£o das tÃ©cnicas ensinadas' : 'Verificar aplicaÃ§Ã£o em cenÃ¡rios simulados',
        homework: i === 1 ? 'Praticar postura de combate em casa por 5 minutos diÃ¡rios' : i <= 4 ? 'Revisar movimentos bÃ¡sicos' : 'Mentalizar cenÃ¡rios de aplicaÃ§Ã£o'
      };

      mockPlans.push(plan);
    }

    return mockPlans;
  }
}
