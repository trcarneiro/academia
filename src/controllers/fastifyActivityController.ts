import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { z } from 'zod';

// Helper function to get organization ID
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

// Validation schemas
const activitySchema = z.object({
  type: z.enum(['TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT']),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  equipment: z.array(z.string()).default([]),
  safety: z.string().optional(),
  adaptations: z.array(z.string()).default([]),
  difficulty: z.number().int().min(1).max(5).optional(),
  refTechniqueId: z.string().uuid().optional(),
  defaultParams: z.any().optional(),
});

export const fastifyActivityController = {
  // GET /api/activities - List all activities
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = await getOrganizationId();
      const query = request.query as any || {};
      
      // Filters
      const where: any = { organizationId };
      if (query.type) where.type = query.type;
      if (query.difficulty) where.difficulty = parseInt(query.difficulty);
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ];
      }

      // Pagination
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
      const skip = (page - 1) * pageSize;

      // Sorting
      const sortField = String(query.sortField || '').trim();
      const sortOrder = String((query.sortOrder || 'asc')).toLowerCase() === 'desc' ? 'desc' : 'asc';
      const allowedSortFields: Record<string, any> = {
        'title': { title: sortOrder },
        'type': { type: sortOrder },
        'difficulty': { difficulty: sortOrder },
        'createdAt': { createdAt: sortOrder }
      };
      const orderBy = allowedSortFields[sortField] || { title: 'asc' };

      const [activities, count] = await Promise.all([
        prisma.activity.findMany({
          where,
          include: {
            refTechnique: {
              select: { id: true, name: true }
            }
          },
          orderBy,
          skip,
          take: pageSize
        }),
        prisma.activity.count({ where })
      ]);

      const response = {
        success: true,
        data: activities,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };

      console.log('🔍 DEBUG - Activities controller response:', {
        dataLength: activities.length,
        count,
        page,
        pageSize,
        totalPages: response.totalPages,
        responseKeys: Object.keys(response)
      });

      // Log temporário para arquivo
      const fs = require('fs');
      fs.writeFileSync('debug-activities.log', JSON.stringify({
        timestamp: new Date().toISOString(),
        activitiesLength: activities.length,
        count,
        page,
        pageSize,
        totalPages: response.totalPages,
        responseKeys: Object.keys(response),
        fullResponse: response
      }, null, 2));

      return reply.send(response);
    } catch (error) {
      console.error('Get activities error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar atividades'
      });
    }
  },

  // GET /api/activities/count - Get total count
  async getCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = await getOrganizationId();
      const query = request.query as any || {};
      
      // Same filters as getAll
      const where: any = { organizationId };
      if (query.type) where.type = query.type;
      if (query.difficulty) where.difficulty = parseInt(query.difficulty);
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ];
      }

      const count = await prisma.activity.count({ where });

      return reply.send({
        success: true,
        count
      });
    } catch (error) {
      console.error('Get activities count error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao contar atividades'
      });
    }
  },

  // GET /api/activities/ids - Get all activity IDs
  async getAllIds(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = await getOrganizationId();
      
      const activities = await prisma.activity.findMany({
        where: { organizationId },
        select: { id: true },
        orderBy: { title: 'asc' }
      });

      const ids = activities.map(activity => activity.id);

      return reply.send({
        success: true,
        data: ids
      });
    } catch (error) {
      console.error('Get activities IDs error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar IDs das atividades'
      });
    }
  },

  // GET /api/activities/:id - Get single activity
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const organizationId = await getOrganizationId();

      const activity = await prisma.activity.findFirst({
        where: { 
          id,
          organizationId
        },
        include: {
          refTechnique: {
            select: { id: true, name: true }
          }
        }
      });

      if (!activity) {
        return reply.status(404).send({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      return reply.send({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Get activity error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar atividade'
      });
    }
  },

  // POST /api/activities - Create new activity
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validation = activitySchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: validation.error.errors?.[0]?.message || 'Dados inválidos'
        });
      }

      const data = validation.data;
      const organizationId = await getOrganizationId();

      // Check if refTechnique exists if provided
      if (data.refTechniqueId) {
        const technique = await prisma.technique.findUnique({
          where: { id: data.refTechniqueId }
        });
        if (!technique) {
          return reply.status(404).send({
            success: false,
            error: 'Técnica referenciada não encontrada'
          });
        }
      }

      const activity = await prisma.activity.create({
        data: {
          type: data.type,
          title: data.title,
          equipment: data.equipment,
          adaptations: data.adaptations,
          organization: { connect: { id: organizationId } },
          refTechnique: data.refTechniqueId ? { connect: { id: data.refTechniqueId } } : undefined,
          description: data.description ?? null,
          safety: data.safety ?? null,
          defaultParams: data.defaultParams ?? null,
          difficulty: data.difficulty ?? null
        },
        include: {
          refTechnique: {
            select: { id: true, name: true }
          }
        }
      });

      return reply.status(201).send({
        success: true,
        data: activity,
        message: 'Atividade criada com sucesso'
      });
    } catch (error) {
      console.error('Create activity error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao criar atividade'
      });
    }
  },

  // PUT /api/activities/:id - Update activity
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const validation = activitySchema.partial().safeParse(request.body);
      
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: validation.error.errors?.[0]?.message || 'Dados inválidos'
        });
      }

      const data = validation.data;
      const organizationId = await getOrganizationId();

      // Verify activity exists and belongs to organization
      const existing = await prisma.activity.findFirst({
        where: { 
          id,
          organizationId
        }
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      // Check if refTechnique exists if provided
      if (data.refTechniqueId) {
        const technique = await prisma.technique.findUnique({
          where: { id: data.refTechniqueId }
        });
        if (!technique) {
          return reply.status(404).send({
            success: false,
            error: 'Técnica referenciada não encontrada'
          });
        }
      }

      // Prepare update data, filtering out undefined values
      const { ...updateData } = data;
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).map(([key, value]) => [
          key,
          value === undefined ? null : value
        ])
      );

      const activity = await prisma.activity.update({
        where: { id },
        data: cleanUpdateData,
        include: {
          refTechnique: {
            select: { id: true, name: true }
          }
        }
      });

      return reply.send({
        success: true,
        data: activity,
        message: 'Atividade atualizada com sucesso'
      });
    } catch (error) {
      console.error('Update activity error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao atualizar atividade'
      });
    }
  },

  // DELETE /api/activities/:id - Delete activity
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const organizationId = await getOrganizationId();

      // Verify activity exists and belongs to organization
      const existing = await prisma.activity.findFirst({
        where: { 
          id,
          organizationId
        }
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      await prisma.activity.delete({
        where: { id }
      });

      return reply.send({
        success: true,
        message: 'Atividade removida com sucesso'
      });
    } catch (error) {
      console.error('Delete activity error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao remover atividade'
      });
    }
  }
};
