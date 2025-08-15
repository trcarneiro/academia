import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export default async function billingPlanRoutes(fastify: FastifyInstance) {
  // Get all billing plans
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const plans = await prisma.billingPlan.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.send({
        success: true,
        data: plans,
        total: plans.length
      });
    } catch (error) {
      logger.error('Error fetching billing plans:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch billing plans'
      });
    }
  });

  // Get billing plan by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const plan = await prisma.billingPlan.findUnique({
        where: { id }
      });

      if (!plan) {
        return reply.code(404).send({
          success: false,
          message: 'Billing plan not found'
        });
      }

      return reply.send({
        success: true,
        data: plan
      });
    } catch (error) {
      logger.error('Error fetching billing plan:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch billing plan'
      });
    }
  });

  // Create billing plan
  fastify.post('/', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const data = request.body;
      
      // Add a default organizationId if not provided
      if (!data.organizationId) {
        // Get the first organization
        const firstOrg = await prisma.organization.findFirst();
        if (firstOrg) {
          data.organizationId = firstOrg.id;
        }
      }

      const plan = await prisma.billingPlan.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          billingType: data.billingType,
          organizationId: data.organizationId,
          features: data.features || [],
          classesPerWeek: data.classesPerWeek || 2,
          hasPersonalTraining: data.hasPersonalTraining || false,
          hasNutrition: data.hasNutrition || false,
          allowFreeze: data.allowFreeze || true,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      return reply.code(201).send({
        success: true,
        data: plan
      });
    } catch (error) {
      logger.error('Error creating billing plan:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create billing plan'
      });
    }
  });
}
