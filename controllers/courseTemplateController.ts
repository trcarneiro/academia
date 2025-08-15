import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { courseTemplateService } from '../services/courseTemplateService';
import { AppError } from '../utils/errors';
import { CourseTemplateCreateSchema, CourseTemplateUpdateSchema } from '../schemas/courseTemplateSchema';

// Filtros e paginação básicos (agora passados ao service para execução no banco)
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.enum(['MARTIAL_ARTS', 'DANCE', 'FITNESS', 'LANGUAGE', 'MUSIC', 'OTHER']).optional(),
  isSystemTemplate: z.coerce.boolean().optional(),
});

const templateParamsSchema = z.object({ id: z.string().uuid() });

export class CourseTemplateController {
  async createTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.user.organizationId;
      const body = CourseTemplateCreateSchema.parse(request.body);
      const template = await courseTemplateService.createTemplate(body, organizationId);
      return reply.status(201).send({ success: true, data: template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'Dados inválidos', details: error.errors });
      }
      if (error instanceof AppError) {
        return reply.status(error.statusCode || 400).send({ success: false, error: error.message });
      }
      throw error;
    }
  }

  async getTemplates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.user.organizationId;
      const query = listQuerySchema.parse(request.query);
      const result = await courseTemplateService.listTemplates({
        organizationId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        category: query.category,
        isSystemTemplate: query.isSystemTemplate,
      });
      return reply.send({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'Parâmetros inválidos', details: error.errors });
      }
      if (error instanceof AppError) {
        return reply.status((error as AppError).statusCode || 400).send({ success: false, error: (error as AppError).message });
      }
      throw error;
    }
  }

  async getTemplateById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const organizationId = request.user.organizationId;
      const template = await courseTemplateService.getTemplateById(id, organizationId);
      if (!template) {
        return reply.status(404).send({ success: false, error: 'Template não encontrado' });
      }
      return reply.send({ success: true, data: template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'ID inválido', details: error.errors });
      }
      if (error instanceof AppError) {
        return reply.status((error as AppError).statusCode || 400).send({ success: false, error: (error as AppError).message });
      }
      throw error;
    }
  }

  async updateTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const organizationId = request.user.organizationId;
      const body = CourseTemplateUpdateSchema.parse(request.body);
      const template = await courseTemplateService.updateTemplate(id, body, organizationId);
      return reply.send({ success: true, data: template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'Dados inválidos', details: error.errors });
      }
      if (error instanceof AppError) {
        return reply.status((error as AppError).statusCode || 400).send({ success: false, error: (error as AppError).message });
      }
      throw error;
    }
  }

  async deleteTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const organizationId = request.user.organizationId;
      await courseTemplateService.deleteTemplate(id, organizationId);
      return reply.send({ success: true, message: 'Template removido com sucesso' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: 'ID inválido', details: error.errors });
      }
      if (error instanceof AppError) {
        return reply.status((error as AppError).statusCode || 400).send({ success: false, error: (error as AppError).message });
      }
      throw error;
    }
  }

  // Temporariamente desativado até implementação consistente no service
  async createCourseFromTemplate(_request: FastifyRequest, reply: FastifyReply) {
    return reply.status(400).send({ success: false, error: 'Funcionalidade indisponível no momento' });
  }
}

export const courseTemplateController = new CourseTemplateController();