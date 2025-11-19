import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FrequencyStatsService } from '@/services/frequencyStatsService';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';

interface FrequencyQuery {
  organizationId?: string;
  daysThreshold?: string;
}

export default async function frequencyRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/frequency/dashboard-stats
   * Obter estatísticas agregadas para o dashboard
   */
  fastify.get(
    '/dashboard-stats',
    async (
      request: FastifyRequest<{ Querystring: FrequencyQuery }>,
      reply: FastifyReply
    ) => {
      try {
        // TODO: Pegar organizationId do token JWT autenticado
        const organizationId =
          request.query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

        const stats = await FrequencyStatsService.getDashboardStats(organizationId);

        return reply.send(stats);
      } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
        });
      }
    }
  );

  /**
   * GET /api/frequency/charts-data
   * Obter dados para gráficos do dashboard
   */
  fastify.get(
    '/charts-data',
    async (
      request: FastifyRequest<{ Querystring: FrequencyQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const organizationId =
          request.query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

        const charts = await FrequencyStatsService.getChartsData(organizationId);

        return reply.send(charts);
      } catch (error) {
        logger.error('Error fetching charts data:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error ? error.message : 'Erro ao buscar dados de gráficos',
        });
      }
    }
  );

  /**
   * GET /api/frequency/students-missing-with-active-plans
   * Obter lista de alunos com planos ativos mas sem check-in recente
   */
  fastify.get(
    '/students-missing-with-active-plans',
    async (
      request: FastifyRequest<{ Querystring: FrequencyQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const organizationId =
          request.query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
        const daysThreshold = request.query.daysThreshold
          ? parseInt(request.query.daysThreshold, 10)
          : 7;

        const students =
          await FrequencyStatsService.getStudentsMissingWithActivePlans(
            organizationId,
            daysThreshold
          );

        return reply.send({
          success: true,
          data: students,
          total: students.length,
        });
      } catch (error) {
        logger.error('Error fetching students missing:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao buscar alunos faltosos',
        });
      }
    }
  );

  /**
   * GET /api/frequency/lessons-history
   * Obter histórico de aulas com presença
   */
  fastify.get(
    '/lessons-history',
    async (
      request: FastifyRequest<{ Querystring: any }>,
      reply: FastifyReply
    ) => {
      try {
        const organizationId =
          request.query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
        
        const page = parseInt(request.query.page || '1', 10);
        const pageSize = parseInt(request.query.pageSize || '20', 10);
        const turmaId = request.query.turmaId;
        const status = request.query.status;
        const startDate = request.query.startDate;
        const endDate = request.query.endDate;

        // Buscar aulas (TurmaLesson) com presenças
        const where: any = {};
        
        if (turmaId) {
          where.turmaId = turmaId;
        }
        
        if (status) {
          where.status = status;
        }
        
        if (startDate || endDate) {
          where.scheduledDate = {};
          if (startDate) where.scheduledDate.gte = new Date(startDate as string);
          if (endDate) where.scheduledDate.lte = new Date(endDate as string);
        }

        // Se não passou filtro de turma, buscar turmas da organização
        if (!turmaId) {
          const turmas = await prisma.turma.findMany({
            where: { organizationId },
            select: { id: true }
          });
          
          if (turmas.length > 0) {
            where.turmaId = { in: turmas.map((t: any) => t.id) };
          }
        }

        // Total de registros
        const total = await prisma.turmaLesson.count({ where });

        // Buscar aulas paginadas
        const lessons = await prisma.turmaLesson.findMany({
          where,
          include: {
            turma: {
              include: {
                course: { select: { name: true } },
                instructor: { select: { firstName: true, lastName: true } }
              }
            },
            attendances: {
              include: {
                student: {
                  include: {
                    user: { select: { firstName: true, lastName: true } }
                  }
                }
              }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        });

        // Formatar resposta
        const formattedLessons = lessons.map((lesson: any) => ({
          id: lesson.id,
          turmaId: lesson.turmaId,
          turmaName: lesson.turma.name,
          courseName: lesson.turma.course.name,
          instructorName: `${lesson.turma.instructor.firstName} ${lesson.turma.instructor.lastName}`,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          scheduledDate: lesson.scheduledDate,
          actualDate: lesson.actualDate,
          status: lesson.status,
          duration: lesson.duration,
          totalStudents: lesson.attendances.length,
          presentStudents: lesson.attendances.filter((a: any) => a.present).length,
          absentStudents: lesson.attendances.filter((a: any) => !a.present).length,
          attendanceRate: lesson.attendances.length > 0 
            ? Math.round((lesson.attendances.filter((a: any) => a.present).length / lesson.attendances.length) * 100)
            : 0,
          participants: lesson.attendances.map((a: any) => ({
            studentId: a.studentId,
            studentName: `${a.student.user.firstName} ${a.student.user.lastName}`,
            present: a.present,
            late: a.late,
            justified: a.justified,
            checkedAt: a.checkedAt
          }))
        }));

        return reply.send({
          success: true,
          data: formattedLessons,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        });
      } catch (error) {
        logger.error('Error fetching lessons history:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao buscar histórico de aulas',
        });
      }
    }
  );
}
