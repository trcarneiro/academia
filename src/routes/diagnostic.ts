import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export const diagnosticRoutes = async (fastify: FastifyInstance) => {
  // Route alias for diagnostic: /api/financial-responsibles
  fastify.get('/api/financial-responsibles', async () => {
    try {
      const responsibles = await prisma.financialResponsible.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: responsibles.map(responsible => ({
          id: responsible.id,
          name: responsible.name,
          cpfCnpj: responsible.cpfCnpj,
          email: responsible.email,
          phone: responsible.phone,
          relationshipType: responsible.relationshipType,
          createdAt: responsible.createdAt
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch financial responsibles');
      return {
        success: false,
        error: 'Failed to fetch financial responsibles',
        data: []
      };
    }
  });
};
