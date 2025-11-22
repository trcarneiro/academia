import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ResponseHelper } from '@/utils/response';

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

      // Verificar se a PersonalClass existe e pertence à organização
      const personalClass = await prisma.personalTrainingClass.findFirst({
        where: {
          id: data.personalClassId,
          organizationId
        }
      });

      if (!personalClass) {
        return ResponseHelper.error(reply, 'Classe de personal training não encontrada', 404);
      }

      // Verificar conflitos de horário na mesma área
      if (data.trainingAreaId && data.startTime && data.endTime) {
        const conflicts = await prisma.personalTrainingSession.findMany({
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
          return ResponseHelper.error(reply, 'Conflito de horário na área de treino selecionada', 409);
        }
      }

      const session = await prisma.personalTrainingSession.create({
        data: {
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
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao criar sessão', 500);
    }
  }

  // Atualizar sessão
  static async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;
      const data = UpdatePersonalSessionSchema.parse(request.body);

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
        data,
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
      return ResponseHelper.error(reply, 'Erro ao atualizar sessão', 500);
    }
  }

  // Reagendar sessão
  static async reschedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;
      const data = RescheduleSessionSchema.parse(request.body);

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

      // Verificar se a sessão pode ser reagendada
      if (existingSession.status === 'COMPLETED' || existingSession.status === 'CANCELLED') {
        return ResponseHelper.error(reply, 'Sessão não pode ser reagendada', 400);
      }

      const session = await prisma.personalTrainingSession.update({
        where: { id },
        data: {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          status: 'RESCHEDULED',
          instructorNotes: data.reason ? 
            `${existingSession.instructorNotes || ''}\n\nReagendado: ${data.reason}`.trim() : 
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

      return ResponseHelper.success(reply, session);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao reagendar sessão', 500);
    }
  }

  // Cancelar sessão
  static async cancel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { organizationId } = request as any;
      const { reason } = request.body as { reason?: string };

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

      return ResponseHelper.success(reply, session);
    } catch (error) {
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

