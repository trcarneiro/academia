import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

const BillingPlanQuerySchema = z.object({
  active: z.string().optional(),
  category: z.string().optional(),
  limit: z.string().optional(),
});

const BillingPlanParamsSchema = z.object({
  id: z.string(),
});

const CreateBillingPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  billingType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  features: z.array(z.string()).optional(),
  classesPerWeek: z.number().int().positive().optional(),
  hasPersonalTraining: z.boolean().optional().default(false),
  hasNutrition: z.boolean().optional().default(false),
  allowFreeze: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export default async function billingPlanRoutes(fastify: FastifyInstance) {
  // Get all billing plans
  fastify.get('/api/billing-plans', {
    schema: {
      tags: ['Billing Plans'],
      summary: 'Get all billing plans',
      querystring: {
        type: 'object',
        properties: {
          active: { type: 'string' },
          category: { type: 'string' },
          limit: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            count: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: z.infer<typeof BillingPlanQuerySchema> }>, reply: FastifyReply) => {
      try {
        const { active, category, limit } = request.query;
        
        const where: any = {};
        
        if (active !== undefined) {
          where.isActive = active === 'true';
        }
        
        if (category) {
          where.targetCategory = category;
        }

        const billingPlans = await prisma.billingPlan.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billingType: true,
            features: true,
            classesPerWeek: true,
            hasPersonalTraining: true,
            hasNutrition: true,
            allowFreeze: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            price: 'asc'
          },
          take: limit ? parseInt(limit) : 50,
        });

        return ResponseHelper.success(reply, billingPlans, 'Billing plans retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to fetch billing plans');
        return ResponseHelper.error(reply, 'Failed to fetch billing plans', 500);
      }
    }
  });

  // Get billing plan by ID
  fastify.get('/api/billing-plans/:id', {
    schema: {
      tags: ['Billing Plans'],
      summary: 'Get billing plan by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    },
    handler: async (request: FastifyRequest<{ Params: z.infer<typeof BillingPlanParamsSchema> }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const billingPlan = await prisma.billingPlan.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billingType: true,
            features: true,
            classesPerWeek: true,
            hasPersonalTraining: true,
            hasNutrition: true,
            allowFreeze: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!billingPlan) {
          return ResponseHelper.error(reply, 'Billing plan not found', 404);
        }

        return ResponseHelper.success(reply, billingPlan, 'Billing plan retrieved successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to fetch billing plan');
        return ResponseHelper.error(reply, 'Failed to fetch billing plan', 500);
      }
    }
  });
}
