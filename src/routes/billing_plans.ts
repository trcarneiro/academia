import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function billingPlansRoutes(fastify: FastifyInstance) {
  fastify.get('/api/billing-plans', async (request, reply) => {
    try {
      const plans = await prisma.billingPlan.findMany({
        where: { isActive: true },
      });
      reply.send({ success: true, data: plans });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Failed to fetch billing plans' });
    }
  });
}
