import { FastifyRequest, FastifyReply } from 'fastify';
import { GraduationService } from '@/services/graduationService';
import { logger } from '@/utils/logger';

/**
 * Controller para endpoints de graduação
 */
export class GraduationController {
  /**
   * GET /api/graduation/students
   * Lista estudantes com progresso agregado
   */
  static async listStudents(
    request: FastifyRequest<{
      Querystring: {
        organizationId: string;
        courseId?: string;
        turmaId?: string;
        startDate?: string;
        endDate?: string;
        status?: 'active' | 'inactive' | 'all';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      console.log('🎓 [GRADUATION] Controller reached - listStudents');
      const { organizationId, courseId, turmaId, startDate, endDate, status } =
        request.query;
      console.log('🎓 [GRADUATION] Query params:', { organizationId, courseId, turmaId, startDate, endDate, status });

      if (!organizationId) {
        console.log('❌ [GRADUATION] Missing organizationId');
        return reply.code(400).send({
          success: false,
          message: 'organizationId is required',
        });
      }

      const filters: any = {};
      if (courseId) filters.courseId = courseId;
      if (turmaId) filters.turmaId = turmaId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (status) filters.status = status;
      
      console.log('🎓 [GRADUATION] Filters:', filters);
      console.log('🎓 [GRADUATION] Calling service...');

      const students = await GraduationService.listStudentsWithProgress(
        organizationId,
        filters
      );

      console.log('✅ [GRADUATION] Service returned:', students.length, 'students');

      return reply.send({
        success: true,
        data: students,
        total: students.length,
      });
    } catch (error) {
      console.error('❌ [GRADUATION] Controller error:', error);
      logger.error('Error listing students:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to list students',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      });
    }
  }

  /**
   * GET /api/graduation/progress/:studentId
   * Busca progresso detalhado de um estudante
   */
  static async getStudentProgress(
    request: FastifyRequest<{
      Params: { studentId: string };
      Querystring: { courseId?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { studentId } = request.params;
      const { courseId } = request.query;

      const stats = await GraduationService.calculateStudentStats(
        studentId,
        courseId
      );

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting student progress:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get student progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/graduation/manual-registration
   * Registra manualmente progresso quantitativo + qualitativo
   */
  static async createManualRegistration(
    request: FastifyRequest<{
      Body: {
        studentId: string;
        courseId: string;
        lessonNumber: number;
        activityName: string;
        completedReps: number;
        targetReps: number;
        rating?: number; // 1-5 (opcional)
        notes?: string;
        instructorId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        studentId,
        courseId,
        lessonNumber,
        activityName,
        completedReps,
        targetReps,
        rating,
        notes,
        instructorId,
      } = request.body;

      // Validações
      if (
        !studentId ||
        !courseId ||
        !lessonNumber ||
        !activityName ||
        completedReps === undefined ||
        !targetReps
      ) {
        return reply.code(400).send({
          success: false,
          message:
            'Missing required fields: studentId, courseId, lessonNumber, activityName, completedReps, targetReps',
        });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return reply.code(400).send({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      // 1. Criar/atualizar progresso quantitativo
      const progress = await GraduationService.upsertStudentProgress({
        studentId,
        courseId,
        lessonNumber,
        activityName,
        completedReps,
        targetReps,
      });

      // 2. Se forneceu rating, criar avaliação qualitativa
      let assessment = null;
      if (rating) {
        assessment = await GraduationService.addQualitativeAssessment({
          studentProgressId: progress.id,
          instructorId,
          rating,
          notes,
        });
      }

      return reply.code(201).send({
        success: true,
        data: {
          progress,
          assessment,
        },
        message: 'Manual registration created successfully',
      });
    } catch (error) {
      logger.error('Error creating manual registration:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create manual registration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/graduation/activity/:progressId
   * Atualiza apenas repetições de uma atividade existente
   */
  static async updateActivity(
    request: FastifyRequest<{
      Params: { progressId: string };
      Body: {
        completedReps?: number;
        targetReps?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { progressId } = request.params;
      const { completedReps, targetReps } = request.body;

      if (completedReps === undefined && targetReps === undefined) {
        return reply.code(400).send({
          success: false,
          message: 'At least one field (completedReps or targetReps) is required',
        });
      }

      const updateData: any = {};
      if (completedReps !== undefined) updateData.completedReps = completedReps;
      if (targetReps !== undefined) updateData.targetReps = targetReps;

      // Recalcular percentage
      if (updateData.completedReps || updateData.targetReps) {
        const current = await request.server.prisma.studentProgress.findUnique({
          where: { id: progressId },
        });

        if (!current) {
          return reply.code(404).send({
            success: false,
            message: 'Progress record not found',
          });
        }

        const finalCompletedReps = completedReps ?? current.completedReps;
        const finalTargetReps = targetReps ?? current.targetReps;
        updateData.completionPercentage =
          (finalCompletedReps / finalTargetReps) * 100;
        updateData.lastUpdated = new Date();
      }

      const updated = await request.server.prisma.studentProgress.update({
        where: { id: progressId },
        data: updateData,
        include: {
          qualitativeAssessments: {
            orderBy: { assessmentDate: 'desc' },
            take: 1,
          },
        },
      });

      return reply.send({
        success: true,
        data: updated,
        message: 'Activity updated successfully',
      });
    } catch (error) {
      logger.error('Error updating activity:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update activity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/graduation/save-progress
   * Salva progresso completo de um aluno (múltiplas atividades de uma vez)
   */
  static async saveProgress(
    request: FastifyRequest<{
      Body: {
        studentId: string;
        courseId: string;
        activities: Array<{
          lessonNumber: number;
          activityName: string;
          completedReps: number;
          targetReps: number;
          rating?: number;
          notes?: string;
        }>;
        instructorId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { studentId, courseId, activities, instructorId } = request.body;

      if (!studentId || !courseId || !activities || activities.length === 0) {
        return reply.code(400).send({
          success: false,
          message: 'Missing required fields: studentId, courseId, activities',
        });
      }

      const results = [];

      for (const activity of activities) {
        // Criar/atualizar progresso
        const progress = await GraduationService.upsertStudentProgress({
          studentId,
          courseId,
          lessonNumber: activity.lessonNumber,
          activityName: activity.activityName,
          completedReps: activity.completedReps,
          targetReps: activity.targetReps,
        });

        // Avaliação qualitativa (se fornecida)
        let assessment = null;
        if (activity.rating) {
          assessment = await GraduationService.addQualitativeAssessment({
            studentProgressId: progress.id,
            instructorId,
            rating: activity.rating,
            notes: activity.notes,
          });
        }

        results.push({ progress, assessment });
      }

      return reply.send({
        success: true,
        data: results,
        message: `Saved progress for ${activities.length} activities`,
      });
    } catch (error) {
      logger.error('Error saving progress:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to save progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/graduation/requirements
   * Busca requisitos de graduação de um curso
   */
  static async getCourseRequirements(
    request: FastifyRequest<{
      Querystring: {
        courseId: string;
        beltLevel?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { courseId, beltLevel } = request.query;

      if (!courseId) {
        return reply.code(400).send({
          success: false,
          message: 'courseId is required',
        });
      }

      const result = await GraduationService.getCourseRequirements(
        courseId,
        beltLevel
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error getting course requirements:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get course requirements',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/graduation/export
   * Exporta relatório de graduação (placeholder - implementar CSV/PDF depois)
   */
  static async exportReport(
    request: FastifyRequest<{
      Querystring: {
        organizationId: string;
        courseId?: string;
        format?: 'csv' | 'pdf';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { organizationId, courseId, format = 'csv' } = request.query;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId is required',
        });
      }

      // TODO: Implementar geração de CSV/PDF
      // Por agora, retornar dados JSON
      const students = await GraduationService.listStudentsWithProgress(
        organizationId,
        { courseId }
      );

      return reply.send({
        success: true,
        data: students,
        format,
        message: 'Export functionality coming soon (CSV/PDF)',
      });
    } catch (error) {
      logger.error('Error exporting report:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to export report',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/graduation/student/:id/progress
   * Detalhes de progresso de um aluno específico
   */
  static async getStudentProgress(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { courseId?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { courseId } = request.query;

      console.log(`🎓 [GRADUATION] Getting progress for student ${id}`);

      const progress = await GraduationService.getStudentDetailedProgress(id, courseId);

      if (!progress) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found or no progress data available',
        });
      }

      return reply.send({
        success: true,
        data: progress,
      });
    } catch (error) {
      logger.error('Error getting student progress:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get student progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/graduation/student/:studentId/activity/:activityId
   * Atualiza progresso de uma atividade específica (INLINE EDIT)
   */
  static async updateStudentActivity(
    request: FastifyRequest<{
      Params: {
        studentId: string;
        activityId: string;
      };
      Body: {
        quantitativeProgress?: number;
        qualitativeRating?: number;
        notes?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { studentId, activityId } = request.params;
      const { quantitativeProgress, qualitativeRating, notes } = request.body;

      console.log(`🎓 [GRADUATION] Updating activity ${activityId} for student ${studentId}`);
      console.log('📝 [GRADUATION] Update data:', { quantitativeProgress, qualitativeRating, notes });

      if (!studentId || !activityId) {
        return reply.code(400).send({
          success: false,
          message: 'studentId and activityId are required',
        });
      }

      const updated = await GraduationService.updateStudentActivity(
        studentId,
        activityId,
        {
          quantitativeProgress,
          qualitativeRating,
          notes,
        }
      );

      return reply.send({
        success: true,
        data: updated,
        message: 'Activity updated successfully',
      });
    } catch (error) {
      logger.error('Error updating student activity:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update activity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/graduation/student/:id/detailed-progress
   * Retorna progresso detalhado com timeline de check-ins e atividades
   */
  static async getStudentDetailedProgressWithCheckins(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { courseId?: string; organizationId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { courseId, organizationId } = request.query;

      console.log(`📊 [GRADUATION] Getting detailed progress for student ${id}`);

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'organizationId is required',
        });
      }

      // Buscar progresso detalhado (usa método existente)
      const progressData = await GraduationService.getStudentDetailedProgress(
        id,
        courseId,
        organizationId
      );

      // Buscar check-ins com detalhes das aulas
      const { prisma } = await import('@/utils/database');
      
      const checkins = await prisma.turmaAttendance.findMany({
        where: {
          studentId: id,
          present: true,
        },
        include: {
          lesson: {
            include: {
              lessonPlan: {
                select: {
                  lessonNumber: true,
                  title: true,
                  description: true,
                  activities: {
                    include: {
                      activity: {
                        select: {
                          id: true,
                          title: true,
                          type: true,
                          estimatedDuration: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 30 // Últimos 30 check-ins
      });

      console.log(`✅ Found ${checkins.length} check-ins for student`);

      // Criar timeline combinando check-ins com execuções
      const timeline = checkins
        .filter(checkin => checkin.lesson?.lessonPlan)
        .map(checkin => {
          const lesson = checkin.lesson!;
          const lessonPlan = lesson.lessonPlan!;
          const lessonActivities = lessonPlan.activities || [];

          // Buscar atividades executadas nesta aula
          const executedActivities = progressData.activities
            .filter(act => act.lessonNumber === lessonPlan.lessonNumber)
            .map(act => ({
              name: act.name,
              category: act.category,
              quantitativeProgress: act.quantitativeProgress,
              qualitativeRating: act.qualitativeRating,
              targetReps: act.targetReps || 0,
              completed: act.quantitativeProgress >= (act.targetReps || 0),
            }));

          return {
            checkinId: checkin.id,
            checkinDate: checkin.createdAt,
            lessonId: lesson.id,
            lessonNumber: lessonPlan.lessonNumber,
            lessonTitle: lessonPlan.title,
            lessonDescription: lessonPlan.description,
            scheduledDate: lesson.scheduledDate,
            activitiesInLesson: lessonActivities.map(la => {
              const executed = executedActivities.find(
                e => e.name === la.activity.title
              );
              return {
                id: la.activity.id,
                name: la.activity.title,
                category: la.activity.type,
                targetReps: la.minimumForGraduation || 0,
                executed: executed || null,
              };
            }),
            completionRate: lessonActivities.length > 0
              ? (executedActivities.length / lessonActivities.length) * 100
              : 0,
          };
        });

      // Calcular estatísticas de frequência
      const last7Days = checkins.filter(c => {
        const diff = Date.now() - new Date(c.createdAt).getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }).length;

      const last30Days = checkins.filter(c => {
        const diff = Date.now() - new Date(c.createdAt).getTime();
        return diff <= 30 * 24 * 60 * 60 * 1000;
      }).length;

      return reply.send({
        success: true,
        data: {
          ...progressData,
          timeline,
          stats: {
            ...progressData.stats,
            recentCheckins: {
              last7Days,
              last30Days,
              total: checkins.length,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching detailed progress with checkins:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch detailed progress',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
