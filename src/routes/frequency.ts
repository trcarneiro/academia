import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FrequencyStatsService } from '@/services/frequencyStatsService';
import { PerformanceService } from '@/services/performanceService';
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
   * GET /api/frequency/classes
   * Obter lista de turmas/aulas disponíveis para check-in
   */
  fastify.get(
    '/classes',
    async (
      request: FastifyRequest<{ Querystring: FrequencyQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const organizationId =
          request.query.organizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

        // Buscar turmas ativas da organização
        const turmas = await prisma.turma.findMany({
          where: {
            organizationId,
            isActive: true
          },
          include: {
            course: {
              select: { name: true }
            },
            instructor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            _count: {
              select: {
                students: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        });

        // Formatar resposta
        const formattedClasses = turmas.map((turma: any) => ({
          id: turma.id,
          name: turma.name,
          courseName: turma.course?.name || 'Curso não especificado',
          instructorName: turma.instructor?.user
            ? `${turma.instructor.user.firstName} ${turma.instructor.user.lastName}`
            : 'Instrutor não especificado',
          schedule: turma.schedule,
          modality: turma.modality,
          studentsCount: turma._count.students,
          isActive: turma.isActive
        }));

        return reply.send({
          success: true,
          data: formattedClasses,
          total: formattedClasses.length
        });
      } catch (error) {
        logger.error('Error fetching classes:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error ? error.message : 'Erro ao buscar turmas',
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

  /**
   * GET /api/frequency/student/:studentId/techniques
   * Buscar técnicas praticadas por um aluno em um curso
   */
  fastify.get(
    '/student/:studentId/techniques',
    async (
      request: FastifyRequest<{
        Params: { studentId: string };
        Querystring: { courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId } = request.params;
        const { courseId } = request.query;

        if (!courseId) {
          return reply.code(400).send({
            success: false,
            message: 'courseId é obrigatório'
          });
        }

        const techniques = await PerformanceService.getStudentTechniques(
          studentId,
          courseId
        );

        return reply.send({
          success: true,
          data: techniques,
          total: techniques.length
        });
      } catch (error) {
        logger.error('Error fetching student techniques:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao buscar técnicas do aluno'
        });
      }
    }
  );

  /**
   * GET /api/frequency/student/:studentId/performance
   * Calcular performance do aluno (Bronze/Prata/Ouro)
   */
  fastify.get(
    '/student/:studentId/performance',
    async (
      request: FastifyRequest<{
        Params: { studentId: string };
        Querystring: { courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId } = request.params;
        const { courseId } = request.query;

        if (!courseId) {
          return reply.code(400).send({
            success: false,
            message: 'courseId é obrigatório'
          });
        }

        const performance = await PerformanceService.calculatePerformance(
          studentId,
          courseId
        );

        return reply.send({
          success: true,
          data: performance
        });
      } catch (error) {
        logger.error('Error calculating student performance:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao calcular performance do aluno'
        });
      }
    }
  );

  /**
   * GET /api/frequency/lesson/:lessonId/techniques
   * Buscar técnicas de uma aula específica
   */
  fastify.get(
    '/lesson/:lessonId/techniques',
    async (
      request: FastifyRequest<{
        Params: { lessonId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { lessonId } = request.params;

        const techniques = await PerformanceService.getLessonTechniques(lessonId);

        return reply.send({
          success: true,
          data: techniques,
          total: techniques.length
        });
      } catch (error) {
        logger.error('Error fetching lesson techniques:', error);
        return reply.code(500).send({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao buscar técnicas da aula'
        });
      }
    }
  );
}
