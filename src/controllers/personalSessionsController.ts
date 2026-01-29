import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ResponseHelper } from '@/utils/response';
import { randomUUID } from 'crypto';
import { useCredits, restoreCredit } from '@/services/creditService';
import { logger } from '@/utils/logger';

// Enums from schema
enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

const prisma = new PrismaClient();

// Schema para validação
const CreatePersonalSessionSchema = z.object({
  personalClassId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  lessonPlanId: z.string().uuid().optional(),
  date: z.string().transform((str) => new Date(str)),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
  trainingAreaId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  instructorNotes: z.string().optional(),
  lessonContent: z.any().optional(),
  progressNotes: z.string().optional(),
  nextLessonSuggestion: z.string().optional(),
});

const UpdatePersonalSessionSchema = CreatePersonalSessionSchema.partial().extend({
  status: z.nativeEnum(SessionStatus).optional(),
  attendanceConfirmed: z.boolean().optional(),
  actualDuration: z.number().int().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

const RescheduleSessionSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
  reason: z.string().optional(),
});

export class PersonalSessionsController {
  // Listar sessões de personal training
  static async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { organizationId } = request as any;
      const querySchema = z.object({
        studentId: z.string().uuid().optional(),
        instructorId: z.string().uuid().optional(),
        status: z.nativeEnum(SessionStatus).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('10'),
      });

      const query = querySchema.parse(request.query);
      const skip = (query.page - 1) * query.limit;

      const where: any = {
        personalClass: { organizationId },
      };

      if (query.studentId) {
        where.personalClass.studentId = query.studentId;
      }
      if (query.instructorId) {
        where.personalClass.instructorId = query.instructorId;
      }
      if (query.status) {
        where.status = query.status;
      }
      if (query.startDate) {
        where.date = { gte: new Date(query.startDate) };
      }
      if (query.endDate) {
        where.date = { ...where.date, lte: new Date(query.endDate) };
      }

      const [sessions, total] = await Promise.all([
        prisma.personalTrainingSession.findMany({
          where,
          include: {
            personalClass: {
              include: {
                student: {
                  include: { user: true }
                },
                instructor: true
              }
            },
            course: true,
            lessonPlan: true,
            trainingArea: true,
            unit: true
          },
          orderBy: [
            { date: 'desc' },
            { startTime: 'desc' }
          ],
          skip,
          take: query.limit,
        }),
        prisma.personalTrainingSession.count({ where }),
      ]);

      return ResponseHelper.success(reply, {
        sessions,
        total,
        page: query.page,
        totalPages: Math.ceil(total / query.limit),
      });
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar sessões de personal training', 500);
    }
  }

  // Obter sessão por ID
  static async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;

      const session = await prisma.personalTrainingSession.findFirst({
        where: {
          id,
          personalClass: { organizationId }
        },
        include: {
          personalClass: {
            include: {
              student: {
                include: { user: true }
              },
              instructor: true
            }
          },
          course: true,
          lessonPlan: true,
          trainingArea: true,
          unit: true
        }
      });

      if (!session) {
        return ResponseHelper.error(reply, 'Sessão não encontrada', 404);
      }

      return ResponseHelper.success(reply, session);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar sessão', 500);
    }
  }

  // Criar nova sessão
  static async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { organizationId } = request as any;
      const data = CreatePersonalSessionSchema.parse(request.body);

      // Gerar ID antecipadamente para vincular ao uso do crédito
      const sessionId = randomUUID();

      return await prisma.$transaction(async (tx) => {
        // Verificar se a PersonalClass existe e pertence à organização
        const personalClass = await tx.personalTrainingClass.findFirst({
          where: {
            id: data.personalClassId,
            organizationId
          }
        });

        if (!personalClass) {
          throw new Error('Classe de personal training não encontrada'); // Will be caught and return 404/500
        }

        // Tentar consumir 1 crédito ("PERSONAL_HOUR" ou genérico)
        // Descrição inclui o ID da sessão para facilitar estorno
        const creditResult = await useCredits({
          studentId: personalClass.studentId,
          attendanceId: undefined, // Não há attendance ainda
          creditsToUse: 1,
          description: `Sessão Personal Agendada: ${data.date.toLocaleDateString('pt-BR')} (ID: ${sessionId})`,
          organizationId
        }, tx);

        if (!creditResult.success) {
          // Se falhar (ex: sem saldo), lançar erro para abortar transação
          throw new Error(creditResult.message || 'Créditos insuficientes');
        }

        // Verificar conflitos de horário na mesma área
        if (data.trainingAreaId && data.startTime && data.endTime) {
          const conflicts = await tx.personalTrainingSession.findMany({
            where: {
              trainingAreaId: data.trainingAreaId,
              date: data.date,
              status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
              OR: [
                {
                  AND: [
                    { startTime: { lte: data.startTime } },
                    { endTime: { gt: data.startTime } }
                  ]
                },
                {
                  AND: [
                    { startTime: { lt: data.endTime } },
                    { endTime: { gte: data.endTime } }
                  ]
                }
              ]
            }
          });

          if (conflicts.length > 0) {
            throw new Error('Conflito de horário na área de treino selecionada');
          }
        }

        const session = await tx.personalTrainingSession.create({
          data: {
            id: sessionId, // Usar o ID gerado
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            instructorNotes: data.instructorNotes,
            lessonContent: data.lessonContent,
            progressNotes: data.progressNotes,
            nextLessonSuggestion: data.nextLessonSuggestion,
            personalClass: { connect: { id: data.personalClassId } },
            course: data.courseId ? { connect: { id: data.courseId } } : undefined,
            unit: data.unitId ? { connect: { id: data.unitId } } : undefined,
            lessonPlan: data.lessonPlanId ? { connect: { id: data.lessonPlanId } } : undefined,
            trainingArea: data.trainingAreaId ? { connect: { id: data.trainingAreaId } } : undefined,
          },
          include: {
            personalClass: {
              include: {
                student: {
                  include: { user: true }
                },
                instructor: true
              }
            },
            course: true,
            lessonPlan: true,
            trainingArea: true,
            unit: true
          }
        });

        return ResponseHelper.success(reply, session, 'Sessão criada com sucesso', 201);
      });

    } catch (error: any) {
      const msg = error.message || 'Erro ao criar sessão';
      console.error('❌ Error creating session:', error);

      // We explicitly allow insufficient credits now (managed in creditService)
      // But if creditService throws other errors (like "Student class not found"), they are caught here.

      if (msg.includes('Créditos insuficientes')) {
        // Just log warning, but validation should have passed if we allowed negative balance
        logger.warn(`Creating session with insufficient credits: ${msg}`);
      }

      if (msg === 'Classe de personal training não encontrada') {
        return ResponseHelper.error(reply, msg, 404);
      }
      if (msg === 'Conflito de horário na área de treino selecionada') {
        return ResponseHelper.error(reply, msg, 409);
      }
      return ResponseHelper.error(reply, 'Erro ao criar sessão', 500);
    }
  }

  // ... update and reschedule ...

  // Cancelar sessão
  static async cancel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;
      const { reason } = request.body as { reason?: string };

      return await prisma.$transaction(async (tx) => {
        // Verificar se a sessão existe e pertence à organização
        const existingSession = await tx.personalTrainingSession.findFirst({
          where: {
            id,
            personalClass: { organizationId }
          },
          include: {
            personalClass: true // Need studentId
          }
        });

        if (!existingSession) {
          throw new Error('Sessão não encontrada');
        }

        if (existingSession.status === 'CANCELLED') {
          // Já cancelada, retornar sucesso sem fazer nada
          return ResponseHelper.success(reply, existingSession);
        }

        const session = await tx.personalTrainingSession.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            instructorNotes: reason ?
              `${existingSession.instructorNotes || ''}\n\nCancelado: ${reason}`.trim() :
              existingSession.instructorNotes
          },
          include: {
            personalClass: {
              include: {
                student: {
                  include: { user: true }
                },
                instructor: true
              }
            },
            course: true,
            lessonPlan: true,
            trainingArea: true,
            unit: true
          }
        });

        // Estornar crédito usando o ID da sessão como keyword
        await restoreCredit({
          studentId: existingSession.personalClass.studentId,
          descriptionKeyword: `(ID: ${id})`, // Procura pela string única na descrição
          organizationId
        }, tx);

        return ResponseHelper.success(reply, session);
      });
    } catch (error: any) {
      if (error.message === 'Sessão não encontrada') {
        return ResponseHelper.error(reply, error.message, 404);
      }
      return ResponseHelper.error(reply, 'Erro ao cancelar sessão', 500);
    }
  }

  // Confirmar presença na sessão
  static async confirmAttendance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;
      const { actualDuration, rating, feedback, progressNotes } = request.body as {
        actualDuration?: number;
        rating?: number;
        feedback?: string;
        progressNotes?: string;
      };

      // Verificar se a sessão existe e pertence à organização
      const existingSession = await prisma.personalTrainingSession.findFirst({
        where: {
          id,
          personalClass: { organizationId }
        }
      });

      if (!existingSession) {
        return ResponseHelper.error(reply, 'Sessão não encontrada', 404);
      }

      const session = await prisma.personalTrainingSession.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          attendanceConfirmed: true,
          actualDuration,
          rating,
          feedback,
          progressNotes
        },
        include: {
          personalClass: {
            include: {
              student: {
                include: { user: true }
              },
              instructor: true
            }
          },
          course: true,
          lessonPlan: true,
          trainingArea: true,
          unit: true
        }
      });

      return ResponseHelper.success(reply, session);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao confirmar presença', 500);
    }
  }

  // Excluir sessão
  static async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;

      // Verificar se a sessão existe e pertence à organização
      const existingSession = await prisma.personalTrainingSession.findFirst({
        where: {
          id,
          personalClass: { organizationId }
        }
      });

      if (!existingSession) {
        return ResponseHelper.error(reply, 'Sessão não encontrada', 404);
      }

      await prisma.personalTrainingSession.delete({
        where: { id }
      });

      return ResponseHelper.success(reply, { message: 'Sessão excluída com sucesso' });
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao excluir sessão', 500);
    }
  }
}

