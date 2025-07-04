import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';

export default async function organizationsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // GET /api/organizations - List organizations
  fastify.get('/', {
    schema: {
      description: 'List organizations',
      tags: ['Organizations']
    }
  }, async (request, reply) => {
    try {
      const organizations = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true
        }
      });

      return {
        success: true,
        data: organizations
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch organizations',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}