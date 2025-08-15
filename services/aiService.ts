import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '@/config';
import { logger } from '@/utils/logger';
import { AttendancePattern, DropoutRiskAnalysis } from '@/types';
import { prisma } from '@/utils/database';
import dayjs from 'dayjs';

export class AIService {
  private static anthropic: Anthropic | null = null;

  private static getClient(): Anthropic {
    if (!this.anthropic) {
      if (!appConfig.ai.anthropicApiKey) {
        throw new Error('Anthropic API key não configurada');
      }
      
      this.anthropic = new Anthropic({
        apiKey: appConfig.ai.anthropicApiKey,
      });
    }
    return this.anthropic;
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

  private static prepareAttendanceData(student: any): any {
    const attendances = student.attendances || [];
    const pattern = student.attendancePatterns?.[0];
    const subscription = student.subscriptions?.[0];

    return {
      studentInfo: {
        firstName: student.firstName,
        lastName: student.lastName,
        enrollmentDate: student.enrollmentDate,
        isActive: student.isActive,
      },
      attendancePattern: pattern || {},
      recentAttendances: attendances.slice(0, 20).map((a: any) => ({
        date: a.checkInTime,
        status: a.status,
        courseProgram: a.class?.courseProgram?.name,
        level: a.class?.courseProgram?.level,
      })),
      subscriptionInfo: subscription ? {
        planName: subscription.plan?.name,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentHistory: subscription.payments?.map((p: any) => ({
          status: p.status,
          dueDate: p.dueDate,
          paidAt: p.paidAt,
        })),
      } : null,
      statistics: {
        totalClasses: attendances.length,
        attendanceRate: pattern?.attendanceRate || 0,
        consecutiveAbsences: pattern?.consecutiveAbsences || 0,
        preferredDays: pattern?.preferredDays || [],
        recentTrend: pattern?.recentTrend || 'STABLE',
      },
    };
  }

  private static prepareProgressData(student: any): any {
    return {
      studentInfo: {
        firstName: student.firstName,
        lastName: student.lastName,
        enrollmentDate: student.enrollmentDate,
      },
      evaluations: student.evaluations?.map((e: any) => ({
        type: e.type,
        score: e.score,
        comments: e.comments,
        evaluatedAt: e.evaluatedAt,
      })) || [],
      progressRecords: student.progressRecords?.map((p: any) => ({
        level: p.level,
        technique: p.technique,
        mastery: p.mastery,
        achievedAt: p.achievedAt,
        notes: p.notes,
      })) || [],
      recentClasses: student.attendances?.map((a: any) => ({
        courseProgram: a.class?.courseProgram?.name,
        level: a.class?.courseProgram?.level,
        lessonTitle: a.class?.lessonPlan?.title,
        techniques: a.class?.lessonPlan?.techniques,
        date: a.checkInTime,
      })) || [],
    };
  }

  private static prepareRecommendationData(student: any, availableClasses: any[]): any {
    const pattern = student.attendancePatterns?.[0];
    
    return {
      studentInfo: {
        firstName: student.firstName,
        lastName: student.lastName,
      },
      attendancePattern: pattern || {},
      attendanceHistory: student.attendances?.map((a: any) => ({
        courseProgram: a.class?.courseProgram?.name,
        level: a.class?.courseProgram?.level,
        dayOfWeek: dayjs(a.checkInTime).day(),
        time: dayjs(a.checkInTime).format('HH:mm'),
      })) || [],
      availableClasses: availableClasses.map((c: any) => ({
        id: c.id,
        date: c.date,
        courseProgram: c.courseProgram?.name,
        level: c.courseProgram?.level,
        dayOfWeek: dayjs(c.date).day(),
        startTime: dayjs(c.startTime).format('HH:mm'),
        instructor: `${c.instructor?.firstName} ${c.instructor?.lastName}`,
        currentStudents: c._count?.attendances || 0,
        maxStudents: c.schedule?.maxStudents || 20,
      })),
    };
  }

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
}