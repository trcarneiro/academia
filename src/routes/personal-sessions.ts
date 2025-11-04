import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Rota para listar sessões de personal training
async function personalSessionsRoutes(fastify: FastifyInstance) {
  // Schema de validação para criar/editar sessão
  const CreateSessionSchema = z.object({
    personalClassId: z.string().uuid(),
    courseId: z.string().uuid().optional(),
    lessonPlanId: z.string().uuid().optional(),
    date: z.string().datetime(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    trainingAreaId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    instructorNotes: z.string().optional(),
    lessonContent: z.any().optional(),
    progressNotes: z.string().optional(),
    nextLessonSuggestion: z.string().optional(),
  });

  const UpdateSessionSchema = CreateSessionSchema.partial().extend({
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED']).optional(),
    attendanceConfirmed: z.boolean().optional(),
    actualDuration: z.number().int().min(1).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    feedback: z.string().optional(),
  });

  // GET /api/personal-sessions - Listar sessões
  fastify.get('/', async (request, reply) => {
    try {
      const { organizationId } = request as any;
      
      // Por enquanto retorna dados mockup até o Prisma Client ser regenerado
      const mockSessions = [
        {
          id: 'session-1',
          personalClassId: 'class-1',
          date: '2025-09-18T00:00:00.000Z',
          startTime: '2025-09-18T10:00:00.000Z',
          endTime: '2025-09-18T11:00:00.000Z',
          status: 'SCHEDULED',
          personalClass: {
            student: {
              user: { firstName: 'João', lastName: 'Silva' }
            },
            instructor: { name: 'Prof. Marcus' }
          },
          course: { name: 'Krav Maga Faixa Branca' }
        }
      ];

      return reply.send({
        success: true,
        data: {
          sessions: mockSessions,
          total: mockSessions.length,
          page: 1,
          totalPages: 1
        }
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar sessões de personal training'
      });
    }
  });

  // GET /api/personal-sessions/:id - Obter sessão por ID  
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Mock data
      const mockSession = {
        id,
        personalClassId: 'class-1',
        date: '2025-09-18T00:00:00.000Z',
        startTime: '2025-09-18T10:00:00.000Z',
        endTime: '2025-09-18T11:00:00.000Z',
        status: 'SCHEDULED',
        personalClass: {
          student: {
            user: { firstName: 'João', lastName: 'Silva' }
          },
          instructor: { name: 'Prof. Marcus' }
        },
        course: { name: 'Krav Maga Faixa Branca' }
      };

      return reply.send({
        success: true,
        data: mockSession
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar sessão'
      });
    }
  });

  // POST /api/personal-sessions - Criar nova sessão
  fastify.post('/', async (request, reply) => {
    try {
      const data = CreateSessionSchema.parse(request.body);
      
      // Mock creation
      const mockSession = {
        id: 'session-new',
        ...data,
        status: 'SCHEDULED',
        attendanceConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return reply.status(201).send({
        success: true,
        data: mockSession,
        message: 'Sessão criada com sucesso'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: error
      });
    }
  });

  // PUT /api/personal-sessions/:id - Atualizar sessão
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = UpdateSessionSchema.parse(request.body);
      
      // Mock update
      const mockUpdatedSession = {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      };

      return reply.send({
        success: true,
        data: mockUpdatedSession,
        message: 'Sessão atualizada com sucesso'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: error
      });
    }
  });

  // PUT /api/personal-sessions/:id/reschedule - Reagendar sessão
  fastify.put('/:id/reschedule', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { date, startTime, endTime, reason } = request.body as {
        date: string;
        startTime: string;
        endTime: string;
        reason?: string;
      };

      // Mock reschedule
      const mockRescheduledSession = {
        id,
        date,
        startTime,
        endTime,
        status: 'RESCHEDULED',
        instructorNotes: reason,
        updatedAt: new Date().toISOString()
      };

      return reply.send({
        success: true,
        data: mockRescheduledSession,
        message: 'Sessão reagendada com sucesso'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Erro ao reagendar sessão'
      });
    }
  });

  // PUT /api/personal-sessions/:id/cancel - Cancelar sessão
  fastify.put('/:id/cancel', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason?: string };

      // Mock cancel
      const mockCancelledSession = {
        id,
        status: 'CANCELLED',
        instructorNotes: reason,
        updatedAt: new Date().toISOString()
      };

      return reply.send({
        success: true,
        data: mockCancelledSession,
        message: 'Sessão cancelada com sucesso'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Erro ao cancelar sessão'
      });
    }
  });

  // PUT /api/personal-sessions/:id/confirm-attendance - Confirmar presença
  fastify.put('/:id/confirm-attendance', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { actualDuration, rating, feedback, progressNotes } = request.body as {
        actualDuration?: number;
        rating?: number;
        feedback?: string;
        progressNotes?: string;
      };

      // Mock confirm attendance
      const mockCompletedSession = {
        id,
        status: 'COMPLETED',
        attendanceConfirmed: true,
        actualDuration,
        rating,
        feedback,
        progressNotes,
        updatedAt: new Date().toISOString()
      };

      return reply.send({
        success: true,
        data: mockCompletedSession,
        message: 'Presença confirmada com sucesso'
      });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Erro ao confirmar presença'
      });
    }
  });

  // DELETE /api/personal-sessions/:id - Excluir sessão
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      return reply.send({
        success: true,
        message: 'Sessão excluída com sucesso'
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Erro ao excluir sessão'
      });
    }
  });
}

export default personalSessionsRoutes;