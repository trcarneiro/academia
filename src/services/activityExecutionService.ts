import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import type { 
  LessonActivityExecution, 
  ActivityTrackingSettings,
  TurmaLesson,
  LessonPlanActivity 
} from '@prisma/client';

/**
 * Service para gerenciar execução de atividades do plano de aula
 * Suporta modo automático (check-in) e manual (professor)
 */
export class ActivityExecutionService {
  /**
   * Registrar ou atualizar execução de uma atividade
   * Upsert: cria se não existe, atualiza se já existe
   */
  static async recordExecution(data: {
    attendanceId: string;
    activityId: string;
    completed: boolean;
    performanceRating?: number;
    actualDuration?: number;
    actualReps?: number;
    notes?: string;
    recordedBy?: string;
  }): Promise<LessonActivityExecution> {
    try {
      // Validar performanceRating se fornecido
      if (data.performanceRating !== undefined && 
          (data.performanceRating < 1 || data.performanceRating > 5)) {
        throw new Error('performanceRating deve estar entre 1 e 5');
      }

      // Validar que attendanceId e activityId pertencem ao mesmo turmaLessonId
      await this.validateAttendanceActivity(data.attendanceId, data.activityId);

      // Upsert: criar ou atualizar
      const execution = await prisma.lessonActivityExecution.upsert({
        where: {
          attendanceId_activityId: {
            attendanceId: data.attendanceId,
            activityId: data.activityId
          }
        },
        update: {
          completed: data.completed,
          performanceRating: data.performanceRating,
          actualDuration: data.actualDuration,
          actualReps: data.actualReps,
          notes: data.notes,
          recordedBy: data.recordedBy,
          recordedAt: new Date()
        },
        create: {
          attendanceId: data.attendanceId,
          activityId: data.activityId,
          completed: data.completed,
          performanceRating: data.performanceRating,
          actualDuration: data.actualDuration,
          actualReps: data.actualReps,
          notes: data.notes,
          recordedBy: data.recordedBy,
          recordedAt: new Date()
        }
      });

      logger.info(`Activity execution recorded: ${execution.id}`, {
        attendanceId: data.attendanceId,
        activityId: data.activityId,
        completed: data.completed
      });

      return execution;
    } catch (error) {
      logger.error('Error recording activity execution:', error);
      throw error;
    }
  }

  /**
   * Validar que attendanceId e activityId pertencem ao mesmo turmaLessonId
   */
  private static async validateAttendanceActivity(
    attendanceId: string, 
    activityId: string
  ): Promise<void> {
    const attendance = await prisma.turmaAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        lesson: {
          include: {
            lessonPlan: {
              include: {
                activityItems: true
              }
            }
          }
        }
      }
    });

    if (!attendance) {
      throw new Error(`Attendance not found: ${attendanceId}`);
    }

    if (!attendance.lesson.lessonPlan) {
      throw new Error(`Lesson has no lesson plan: ${attendance.lesson.id}`);
    }

    const activityExists = attendance.lesson.lessonPlan.activityItems.some(
      item => item.id === activityId
    );

    if (!activityExists) {
      throw new Error(
        `Activity ${activityId} does not belong to lesson ${attendance.lesson.id}`
      );
    }
  }

  /**
   * Buscar execuções de uma aula (visão do instrutor)
   * Retorna grid de alunos × atividades
   */
  static async findByLesson(lessonId: string): Promise<{
    lesson: TurmaLesson & {
      turma: { name: string };
      lessonPlan?: { title: string; activityItems: LessonPlanActivity[] } | null;
    };
    students: Array<{
      studentId: string;
      studentName: string;
      avatarUrl?: string | null;
      activities: Array<{
        activityId: string;
        activityName: string;
        segment: string;
        duration: number;
        completed: boolean;
        performanceRating?: number | null;
        notes?: string | null;
      }>;
      completionRate: number;
    }>;
    completionRate: number;
  }> {
    try {
      // Buscar aula com todas as informações necessárias
      const lesson = await prisma.turmaLesson.findUnique({
        where: { id: lessonId },
        include: {
          turma: {
            select: { name: true }
          },
          lessonPlan: {
            include: {
              activityItems: {
                orderBy: { ord: 'asc' },
                include: {
                  activity: {
                    select: { name: true, duration: true }
                  }
                }
              }
            }
          },
          attendances: {
            where: { present: true },
            include: {
              student: {
                include: {
                  user: {
                    select: { 
                      firstName: true, 
                      lastName: true, 
                      avatarUrl: true 
                    }
                  }
                }
              },
              activityExecutions: true
            }
          }
        }
      });

      if (!lesson) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      if (!lesson.lessonPlan) {
        throw new Error(`Lesson has no lesson plan: ${lessonId}`);
      }

      // Construir grid de alunos × atividades
      const students = lesson.attendances.map(attendance => {
        const activities = lesson.lessonPlan!.activityItems.map(activityItem => {
          const execution = attendance.activityExecutions.find(
            exec => exec.activityId === activityItem.id
          );

          return {
            activityId: activityItem.id,
            activityName: activityItem.activity.name,
            segment: activityItem.segment,
            duration: activityItem.activity.duration,
            completed: execution?.completed || false,
            performanceRating: execution?.performanceRating,
            notes: execution?.notes
          };
        });

        const completedCount = activities.filter(a => a.completed).length;
        const completionRate = activities.length > 0 
          ? (completedCount / activities.length) * 100 
          : 0;

        return {
          studentId: attendance.studentId,
          studentName: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
          avatarUrl: attendance.student.user.avatarUrl,
          activities,
          completionRate
        };
      });

      // Calcular completion rate geral da turma
      const totalActivities = students.length * (lesson.lessonPlan.activityItems.length || 1);
      const completedActivities = students.reduce((sum, student) => 
        sum + student.activities.filter(a => a.completed).length, 0
      );
      const completionRate = totalActivities > 0 
        ? (completedActivities / totalActivities) * 100 
        : 0;

      return {
        lesson: {
          ...lesson,
          lessonPlan: {
            title: lesson.lessonPlan.title,
            activityItems: lesson.lessonPlan.activityItems
          }
        },
        students,
        completionRate
      };
    } catch (error) {
      logger.error('Error fetching lesson executions:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de performance de um aluno
   */
  static async getStudentStats(
    studentId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      courseId?: string;
    }
  ): Promise<{
    studentId: string;
    studentName: string;
    period: {
      startDate: Date;
      endDate: Date;
      totalLessons: number;
    };
    byActivity: Array<{
      activityName: string;
      totalAttempts: number;
      completions: number;
      completionRate: number;
      avgRating: number;
      avgDuration: number;
    }>;
    overallStats: {
      totalActivities: number;
      completedActivities: number;
      completionRate: number;
      avgRating: number;
    };
    trend: 'improving' | 'stable' | 'declining';
  }> {
    try {
      // Buscar informações do aluno
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      // Construir filtros de data
      const dateFilter: any = {};
      if (filters?.startDate) {
        dateFilter.gte = filters.startDate;
      }
      if (filters?.endDate) {
        dateFilter.lte = filters.endDate;
      }

      // Buscar todas as execuções do aluno
      const executions = await prisma.lessonActivityExecution.findMany({
        where: {
          attendance: {
            studentId: studentId,
            ...(Object.keys(dateFilter).length > 0 && {
              lesson: {
                scheduledDate: dateFilter
              }
            })
          }
        },
        include: {
          activity: {
            include: {
              activity: {
                select: { name: true }
              }
            }
          },
          attendance: {
            include: {
              lesson: {
                select: { scheduledDate: true }
              }
            }
          }
        },
        orderBy: {
          recordedAt: 'asc'
        }
      });

      // Agrupar por atividade
      const activityMap = new Map<string, {
        name: string;
        attempts: number;
        completions: number;
        ratings: number[];
        durations: number[];
      }>();

      executions.forEach(exec => {
        const activityName = exec.activity.activity.name;
        
        if (!activityMap.has(activityName)) {
          activityMap.set(activityName, {
            name: activityName,
            attempts: 0,
            completions: 0,
            ratings: [],
            durations: []
          });
        }

        const stats = activityMap.get(activityName)!;
        stats.attempts++;
        if (exec.completed) stats.completions++;
        if (exec.performanceRating) stats.ratings.push(exec.performanceRating);
        if (exec.actualDuration) stats.durations.push(exec.actualDuration);
      });

      // Converter para array com estatísticas calculadas
      const byActivity = Array.from(activityMap.values()).map(stats => ({
        activityName: stats.name,
        totalAttempts: stats.attempts,
        completions: stats.completions,
        completionRate: (stats.completions / stats.attempts) * 100,
        avgRating: stats.ratings.length > 0
          ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
          : 0,
        avgDuration: stats.durations.length > 0
          ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
          : 0
      }));

      // Estatísticas gerais
      const totalActivities = executions.length;
      const completedActivities = executions.filter(e => e.completed).length;
      const allRatings = executions
        .map(e => e.performanceRating)
        .filter((r): r is number => r !== null);
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

      // Calcular tendência (baseado em últimas 5 aulas vs 5 anteriores)
      const trend = this.calculateTrend(executions);

      // Período
      const dates = executions.map(e => e.attendance.lesson.scheduledDate);
      const startDate = filters?.startDate || (dates.length > 0 ? dates[0] : new Date());
      const endDate = filters?.endDate || (dates.length > 0 ? dates[dates.length - 1] : new Date());
      
      // Contar aulas únicas
      const uniqueLessons = new Set(executions.map(e => e.attendance.turmaLessonId));

      return {
        studentId,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        period: {
          startDate,
          endDate,
          totalLessons: uniqueLessons.size
        },
        byActivity,
        overallStats: {
          totalActivities,
          completedActivities,
          completionRate: totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0,
          avgRating
        },
        trend
      };
    } catch (error) {
      logger.error('Error fetching student stats:', error);
      throw error;
    }
  }

  /**
   * Calcular tendência de performance (improving/stable/declining)
   * Compara média de ratings das últimas 5 aulas vs 5 anteriores
   */
  private static calculateTrend(
    executions: Array<{ performanceRating: number | null; recordedAt: Date }>
  ): 'improving' | 'stable' | 'declining' {
    const withRatings = executions.filter(e => e.performanceRating !== null);
    
    if (withRatings.length < 10) {
      return 'stable'; // Dados insuficientes
    }

    // Últimas 5 vs 5 anteriores
    const recent = withRatings.slice(-5);
    const previous = withRatings.slice(-10, -5);

    const recentAvg = recent.reduce((sum, e) => sum + (e.performanceRating || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, e) => sum + (e.performanceRating || 0), 0) / previous.length;

    const diff = recentAvg - previousAvg;

    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
  }

  /**
   * Auto-completar atividades no check-in (se configurado)
   */
  static async autoCompleteOnCheckin(attendanceId: string): Promise<void> {
    try {
      // Buscar attendance com lesson plan
      const attendance = await prisma.turmaAttendance.findUnique({
        where: { id: attendanceId },
        include: {
          lesson: {
            include: {
              lessonPlan: {
                include: {
                  activityItems: true
                }
              }
            }
          }
        }
      });

      if (!attendance) {
        throw new Error(`Attendance not found: ${attendanceId}`);
      }

      if (!attendance.lesson.lessonPlan) {
        logger.warn(`Lesson ${attendance.lesson.id} has no lesson plan, skipping auto-complete`);
        return;
      }

      // Criar execuções para todas as atividades
      const executions = attendance.lesson.lessonPlan.activityItems.map(activity => ({
        attendanceId: attendanceId,
        activityId: activity.id,
        completed: true,
        recordedAt: new Date()
      }));

      // Bulk insert
      await prisma.lessonActivityExecution.createMany({
        data: executions,
        skipDuplicates: true // Não falhar se já existir
      });

      logger.info(`Auto-completed ${executions.length} activities for attendance ${attendanceId}`);
    } catch (error) {
      logger.error('Error auto-completing activities:', error);
      throw error;
    }
  }

  /**
   * Buscar configurações de rastreamento de atividades da organização
   */
  static async getSettings(organizationId: string): Promise<ActivityTrackingSettings | null> {
    try {
      const settings = await prisma.activityTrackingSettings.findUnique({
        where: { organizationId }
      });

      return settings;
    } catch (error) {
      logger.error('Error fetching activity tracking settings:', error);
      throw error;
    }
  }

  /**
   * Criar configurações padrão para uma organização
   */
  static async createDefaultSettings(organizationId: string): Promise<ActivityTrackingSettings> {
    try {
      const settings = await prisma.activityTrackingSettings.create({
        data: {
          organizationId,
          autoCompleteOnCheckin: false, // Manual por padrão
          requireInstructorValidation: true,
          enablePerformanceRating: true,
          enableVideos: false,
          defaultActivityDuration: 15
        }
      });

      logger.info(`Created default activity tracking settings for organization ${organizationId}`);
      return settings;
    } catch (error) {
      logger.error('Error creating default settings:', error);
      throw error;
    }
  }

  /**
   * Atualizar execução existente
   */
  static async updateExecution(
    executionId: string,
    data: {
      completed?: boolean;
      performanceRating?: number | null;
      actualDuration?: number | null;
      actualReps?: number | null;
      notes?: string | null;
      recordedBy?: string;
    }
  ): Promise<LessonActivityExecution> {
    try {
      // Validar performanceRating se fornecido
      if (data.performanceRating !== undefined && data.performanceRating !== null &&
          (data.performanceRating < 1 || data.performanceRating > 5)) {
        throw new Error('performanceRating deve estar entre 1 e 5');
      }

      const execution = await prisma.lessonActivityExecution.update({
        where: { id: executionId },
        data: {
          ...data,
          recordedAt: new Date()
        }
      });

      logger.info(`Activity execution updated: ${executionId}`);
      return execution;
    } catch (error) {
      logger.error('Error updating activity execution:', error);
      throw error;
    }
  }

  /**
   * Deletar execução
   */
  static async deleteExecution(executionId: string): Promise<void> {
    try {
      await prisma.lessonActivityExecution.delete({
        where: { id: executionId }
      });

      logger.info(`Activity execution deleted: ${executionId}`);
    } catch (error) {
      logger.error('Error deleting activity execution:', error);
      throw error;
    }
  }

  /**
   * Buscar dados para heatmap de execuções do aluno
   * Retorna matriz: [lessonNumber][activityName] = { date, repetitions, rating }
   */
  static async getStudentHeatmap(
    studentId: string,
    filters?: {
      courseId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    uniqueActivities: string[];
    uniqueDates: string[];
    heatmapData: Record<string, Record<string, Array<{ date: string; repetitions: number; rating?: number }>>>;
  }> {
    try {
      // Construir filtros
      const whereClause: any = {
        studentId: studentId
      };

      // Construir filtros de data para a aula
      const lessonFilter: any = {};
      if (filters?.startDate || filters?.endDate) {
        lessonFilter.scheduledDate = {};
        if (filters.startDate) {
          lessonFilter.scheduledDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          lessonFilter.scheduledDate.lte = filters.endDate;
        }
      }

      // Buscar todas as execuções do aluno
      const executions = await prisma.lessonActivityExecution.findMany({
        where: {
          attendance: whereClause
        },
        include: {
          activity: {
            include: {
              activity: {
                select: { name: true }
              }
            }
          },
          attendance: {
            include: {
              lesson: {
                select: { 
                  scheduledDate: true,
                  lessonPlan: {
                    select: {
                      lessonNumber: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          recordedAt: 'asc'
        }
      });

      // Processar dados para heatmap
      const activitiesSet = new Set<string>();
      const datesSet = new Set<string>();
      const heatmapData: Record<string, Record<string, Array<{ date: string; repetitions: number; rating?: number }>>> = {};

      for (const execution of executions) {
        const activityName = execution.activity?.activity?.name || 'Atividade desconhecida';
        const lessonDate = execution.attendance.lesson.scheduledDate;
        const lessonNumber = execution.attendance.lesson.lessonPlan?.lessonNumber || 0;
        const dateStr = lessonDate.toISOString().split('T')[0]; // YYYY-MM-DD

        activitiesSet.add(activityName);
        datesSet.add(dateStr);

        // Estrutura: heatmapData[lessonNumber][activityName] = [{ date, repetitions, rating }]
        if (!heatmapData[lessonNumber]) {
          heatmapData[lessonNumber] = {};
        }
        if (!heatmapData[lessonNumber][activityName]) {
          heatmapData[lessonNumber][activityName] = [];
        }

        heatmapData[lessonNumber][activityName].push({
          date: dateStr,
          repetitions: execution.actualReps || 0,
          rating: execution.performanceRating || undefined
        });
      }

      const uniqueActivities = Array.from(activitiesSet).sort();
      const uniqueDates = Array.from(datesSet).sort();

      logger.info(`Heatmap generated for student ${studentId}`, {
        totalActivities: uniqueActivities.length,
        totalDates: uniqueDates.length,
        totalExecutions: executions.length
      });

      return {
        uniqueActivities,
        uniqueDates,
        heatmapData
      };
    } catch (error) {
      logger.error('Error generating student heatmap:', error);
      throw error;
    }
  }
}

