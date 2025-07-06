import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

const TechniqueQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  limit: z.string().optional(),
});

const TechniqueParamsSchema = z.object({
  id: z.string(),
});

export default async function techniqueRoutes(fastify: FastifyInstance) {
  // Get all techniques
  fastify.get('/api/techniques', {
    schema: {
      querystring: TechniqueQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  difficulty: { type: 'string' },
                  createdAt: { type: 'string' },
                }
              }
            },
            count: { type: 'number' },
            message: { type: 'string' }
          }
        }
      },
      tags: ['Techniques'],
      summary: 'Get all techniques',
    },
    handler: async (request: FastifyRequest<{ Querystring: z.infer<typeof TechniqueQuerySchema> }>, reply: FastifyReply) => {
      try {
        const { category, difficulty, limit } = request.query;
        
        const where: any = {};
        
        if (category) {
          where.category = category;
        }
        
        if (difficulty) {
          where.difficulty = difficulty;
        }

        const techniques = await prisma.technique.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
            createdAt: true,
          },
          orderBy: {
            name: 'asc'
          },
          take: limit ? parseInt(limit) : 50,
        });

        return ResponseHelper.success(reply, techniques, 'Techniques retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to fetch techniques');
        return ResponseHelper.error(reply, 'Failed to fetch techniques', 500);
      }
    }
  });

  // Get technique by ID
  fastify.get('/api/techniques/:id', {
    schema: {
      params: TechniqueParamsSchema,
      tags: ['Techniques'],
      summary: 'Get technique by ID',
    },
    handler: async (request: FastifyRequest<{ Params: z.infer<typeof TechniqueParamsSchema> }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const technique = await prisma.technique.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
            createdAt: true,
          },
        });

        if (!technique) {
          return ResponseHelper.error(reply, 'Technique not found', 404);
        }

        return ResponseHelper.success(reply, technique, 'Technique retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to fetch technique');
        return ResponseHelper.error(reply, 'Failed to fetch technique', 500);
      }
    }
  });
}
