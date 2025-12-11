import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FrequencyStatsService } from '@/services/frequencyStatsService';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';
import { z } from 'zod';

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
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const query = request.query as any;
        const organizationId =
          query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
        
        const page = parseInt(query.page || '1', 10);
        const pageSize = parseInt(query.pageSize || '20', 10);
        const turmaId = query.turmaId;
        const status = query.status;
        const startDate = query.startDate;
        const endDate = query.endDate;

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

  /**
   * POST /api/frequency/checkin
   * Registrar presença em uma turma (cria aula se não existir)
   */
  fastify.post(
    '/checkin',
    async (
      request: FastifyRequest<{
        Body: {
          studentId: string;
          turmaId: string;
          type: string;
          timestamp: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId, turmaId, timestamp } = request.body;
        const date = new Date(timestamp);
        
        // 1. Buscar ou criar aula (TurmaLesson) para hoje
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let lesson = await prisma.turmaLesson.findFirst({
          where: {
            turmaId,
            scheduledDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (!lesson) {
          const turma = await prisma.turma.findUnique({
            where: { id: turmaId }
          });

          if (!turma) {
            return reply.code(404).send({ success: false, message: 'Turma não encontrada' });
          }

          // Calcular próximo número de aula
          const lastLesson = await prisma.turmaLesson.findFirst({
            where: { turmaId },
            orderBy: { lessonNumber: 'desc' }
          });
          const nextLessonNumber = (lastLesson?.lessonNumber || 0) + 1;

          // Criar nova aula
          lesson = await prisma.turmaLesson.create({
            data: {
              turmaId,
              scheduledDate: date,
              status: 'COMPLETED',
              title: `Aula de ${date.toLocaleDateString('pt-BR')}`,
              duration: 60,
              lessonNumber: nextLessonNumber
            }
          });
        }

        // 2. Garantir que o aluno está matriculado na turma (TurmaStudent)
        let turmaStudent = await prisma.turmaStudent.findUnique({
          where: {
            turmaId_studentId: {
              turmaId,
              studentId
            }
          }
        });

        if (!turmaStudent) {
          // Matricular aluno automaticamente (como ativo)
          turmaStudent = await prisma.turmaStudent.create({
            data: {
              turmaId,
              studentId,
              status: 'ACTIVE',
              isActive: true
            }
          });
        }

        // 3. Registrar presença (TurmaAttendance)
        const existingAttendance = await prisma.turmaAttendance.findUnique({
          where: {
            turmaLessonId_studentId: {
              turmaLessonId: lesson.id,
              studentId
            }
          }
        });

        if (existingAttendance) {
           if (!existingAttendance.present) {
             await prisma.turmaAttendance.update({
               where: { id: existingAttendance.id },
               data: { present: true, checkedAt: new Date() }
             });
           }
           return reply.send({ success: true, message: 'Presença atualizada' });
        }

        await prisma.turmaAttendance.create({
          data: {
            turmaId,
            turmaLessonId: lesson.id,
            turmaStudentId: turmaStudent.id,
            studentId,
            present: true,
            checkedAt: new Date()
          }
        });

        return reply.send({ success: true, message: 'Presença registrada com sucesso' });

      } catch (error) {
        logger.error('Error submitting attendance:', error);
        return reply.code(500).send({
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao registrar presença'
        });
      }
    }
  );
}
