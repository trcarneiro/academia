// @ts-nocheck
import { FastifyRequest, FastifyReply } from 'fastify';
import { HorariosSugeridosService } from '@/services/horariosSugeridosService';
import { ResponseHelper } from '@/utils/response';
import { z } from 'zod';

const CreateSuggestionSchema = z.object({
  studentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  courseType: z.string().optional(),
  level: z.string().optional(),
  preferredUnit: z.string().optional(),
  notes: z.string().optional()
});

export class HorariosSugeridosController {
  private service: HorariosSugeridosService;

  constructor() {
    this.service = new HorariosSugeridosService();
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = CreateSuggestionSchema.parse(request.body);
      const suggestion = await this.service.create(data as any);
      return ResponseHelper.success(reply, suggestion, 'Sugestão criada com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ResponseHelper.badRequest(reply, 'Dados inválidos', error.errors);
      }
      return ResponseHelper.error(reply, 'Erro ao criar sugestão', 500);
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { organizationId, status, dayOfWeek, minVotes } = request.query as any;
      
      const suggestions = await this.service.list({
        organizationId,
        status,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined,
        minVotes: minVotes ? parseInt(minVotes) : undefined
      });

      return ResponseHelper.success(reply, suggestions);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao listar sugestões', 500);
    }
  }

  async support(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { studentId } = request.body as { studentId: string };

      if (!studentId) return ResponseHelper.badRequest(reply, 'Student ID required');

      const result = await this.service.support(id, studentId);
      return ResponseHelper.success(reply, result, 'Apoio registrado');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao apoiar sugestão', 500);
    }
  }

  async removeSupport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, studentId } = request.params as { id: string, studentId: string };
      
      await this.service.removeSupport(id, studentId);
      return ResponseHelper.success(reply, { success: true }, 'Apoio removido');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao remover apoio', 500);
    }
  }

  async approve(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { adminId, createTurmaData } = request.body as { adminId: string, createTurmaData?: any };

      const result = await this.service.approve(id, adminId, createTurmaData);
      return ResponseHelper.success(reply, result, 'Sugestão aprovada');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao aprovar sugestão', 500);
    }
  }

  async reject(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { adminId, reason } = request.body as { adminId: string, reason: string };

      const result = await this.service.reject(id, adminId, reason);
      return ResponseHelper.success(reply, result, 'Sugestão rejeitada');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao rejeitar sugestão', 500);
    }
  }
}
