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
        trend: 'STABLE'
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
            orderBy: { progressDate: 'desc' },
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
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
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

  static async chat(
    messages: Array<{ role: string; content: string }>,
    options?: { model?: string; temperature?: number; maxTokens?: number }
  ): Promise<{ choices: Array<{ message: { content: string } }> }> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const systemContent = systemMessage ? systemMessage.content : '';
    
    const client = this.getClient();
    if (client) {
      try {
        const response = await client.messages.create({
          model: options?.model || 'claude-3-haiku-20240307',
          max_tokens: options?.maxTokens || 4000,
          system: systemContent,
          messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        });
        // @ts-ignore - Anthropic types might vary
        const content = response.content[0].text;
        return { choices: [{ message: { content } }] };
      } catch (error) {
        logger.error('Error in AIService.chat (Anthropic):', error);
      }
    }
    
    // Fallback to Gemini
    const gemini = this.getGeminiClient();
    if (gemini) {
        try {
            const modelName = options?.model?.includes('gemini') ? options.model : 'gemini-2.0-flash';
            const model = gemini.getGenerativeModel({ model: modelName });
            
            // Construct prompt for Gemini
            const prompt = `${systemContent}\n\n${userMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
            
            const result = await model.generateContent(prompt);
            const content = result.response.text();
            return { choices: [{ message: { content } }] };
        } catch (error) {
            logger.error('Error in AIService.chat (Gemini):', error);
        }
    }
    
    throw new Error('No AI provider available for chat');
  }

  private static buildLessonPlanGenerationPrompt(data: any): string {
    return `Generate ${data.generateCount} lesson plans for ${data.courseName} (${data.courseLevel}). Context: ${data.documentAnalysis}`;
  }

  private static parseLessonPlans(text: string): any[] {
    try {
      // Attempt to find JSON array in text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return [];
    } catch (e) {
      logger.error('Failed to parse lesson plans', e);
      return [];
    }
  }

  private static prepareAttendanceData(student: any): any {
    return {
      totalClasses: student.attendances?.length || 0,
      lastAttendance: student.attendances?.[0]?.checkInTime,
      patterns: student.attendancePatterns
    };
  }

  private static buildDropoutAnalysisPrompt(data: any): string {
    return `Analyze dropout risk based on attendance data: ${JSON.stringify(data)}`;
  }

  private static parseDropoutAnalysis(text: string, studentId: string): DropoutRiskAnalysis {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        return { ...json, studentId };
      }
    } catch (e) {}
    
    return {
      studentId,
      riskScore: 50,
      riskLevel: 'MEDIUM',
      factors: ['Analysis failed'],
      recommendations: [],
      confidence: 0,
      trend: 'STABLE'
    };
  }

  private static prepareProgressData(student: any): any {
    return {
      evaluations: student.evaluations,
      progressRecords: student.progressRecords
    };
  }

  private static buildProgressAnalysisPrompt(data: any): string {
    return `Analyze martial arts progress: ${JSON.stringify(data)}`;
  }

  private static parseProgressAnalysis(text: string, studentId: string): any {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return { ...JSON.parse(match[0]), studentId };
      }
    } catch (e) {}
    return { studentId, analysis: text };
  }

  private static prepareRecommendationData(student: any, classes: any[]): any {
    return {
      studentProfile: student,
      availableClasses: classes
    };
  }

  private static buildRecommendationPrompt(data: any): string {
    return `Recommend classes for student based on: ${JSON.stringify(data)}`;
  }

  private static parseRecommendations(text: string): any[] {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {}
    return [];
  }

  private static buildDocumentAnalysisPrompt(data: any): string {
    return `Analyze this course document for ${data.courseName} (${data.courseLevel}): ${data.documentContent}`;
  }

  private static parseDocumentAnalysis(text: string, courseId: string): any {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return { ...JSON.parse(match[0]), courseId };
      }
    } catch (e) {}
    return { courseId, summary: text };
  }

  private static buildTechniqueGenerationPrompt(data: any): string {
    return `Generate ${data.generateCount} techniques for ${data.courseName}. Difficulty: ${data.difficulty}`;
  }

  private static parseTechniques(text: string): any[] {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {}
    return [];
  }

  private static getMockDocumentAnalysis(courseId: string, name: string, level: string, content: string): any {
    return {
      courseId,
      summary: 'Mock analysis result',
      topics: ['Topic A', 'Topic B'],
      difficulty: 'Intermediate'
    };
  }

  private static getMockTechniques(count: number, level: string, difficulty?: string): any[] {
    return Array(count).fill(0).map((_, i) => ({
      name: `Mock Technique ${i + 1}`,
      description: 'Generated mock technique',
      difficulty: difficulty || 'Medium',
      type: 'TECHNIQUE'
    }));
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
        { name: 'ExercÃ­cio de AplicaÃ§Ã£o', duration: 15, description: 'AplicaÃ§Ã£o da tÃ©cnicas em cenÃ¡rios', type: 'drill' },
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

export const aiService = AIService;
