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
            category: true,
            courseId: true,
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
            category: true,
            courseId: true,
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

  // Create new billing plan
  fastify.post('/api/billing-plans', {
    schema: {
      tags: ['Billing Plans'],
      summary: 'Create new billing plan',
      body: {
        type: 'object',
        required: ['name', 'price', 'billingType'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          courseId: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          billingType: { type: 'string' },
          classesPerWeek: { type: 'number' },
          maxClasses: { type: 'number' },
          isUnlimitedAccess: { type: 'boolean' },
          hasPersonalTraining: { type: 'boolean' },
          hasNutrition: { type: 'boolean' },
          accessAllModalities: { type: 'boolean' },
          allowFreeze: { type: 'boolean' },
          freezeMaxDays: { type: 'number' },
          allowInstallments: { type: 'boolean' },
          maxInstallments: { type: 'number' },
          isRecurring: { type: 'boolean' },
          recurringInterval: { type: 'number' },
          isActive: { type: 'boolean' },
          features: { type: 'object' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const organizationId = await getOrganizationId();
        const data = request.body;
        
        const billingPlan = await prisma.billingPlan.create({
          data: {
            organizationId,
            name: data.name,
            description: data.description || null,
            courseId: data.courseId || null,
            category: data.category || null,
            price: data.price,
            billingType: data.billingType,
            classesPerWeek: data.classesPerWeek || 2,
            maxClasses: data.maxClasses || null,
            isUnlimitedAccess: data.isUnlimitedAccess || false,
            hasPersonalTraining: data.hasPersonalTraining || false,
            hasNutrition: data.hasNutrition || false,
            accessAllModalities: data.accessAllModalities || false,
            allowFreeze: data.allowFreeze || false,
            freezeMaxDays: data.freezeMaxDays || 30,
            allowInstallments: data.allowInstallments || false,
            maxInstallments: data.maxInstallments || 1,
            isRecurring: data.isRecurring || false,
            recurringInterval: data.recurringInterval || 30,
            isActive: data.isActive !== undefined ? data.isActive : true,
            features: data.features || null
          }
        });

        return ResponseHelper.success(reply, billingPlan, 'Billing plan created successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to create billing plan');
        return ResponseHelper.error(reply, 'Failed to create billing plan', 500);
      }
    }
  });

  // Update billing plan
  fastify.put('/api/billing-plans/:id', {
    schema: {
      tags: ['Billing Plans'],
      summary: 'Update billing plan',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          courseId: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          billingType: { type: 'string' },
          classesPerWeek: { type: 'number' },
          maxClasses: { type: 'number' },
          isUnlimitedAccess: { type: 'boolean' },
          hasPersonalTraining: { type: 'boolean' },
          hasNutrition: { type: 'boolean' },
          accessAllModalities: { type: 'boolean' },
          allowFreeze: { type: 'boolean' },
          freezeMaxDays: { type: 'number' },
          allowInstallments: { type: 'boolean' },
          maxInstallments: { type: 'number' },
          isRecurring: { type: 'boolean' },
          recurringInterval: { type: 'number' },
          isActive: { type: 'boolean' },
          features: { type: 'object' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
      const { id } = request.params;
      const data = request.body;
      logger.info(`[UPDATE_PLAN] Iniciando atualização para o plano ${id}`);

      try {
        const existingPlan = await prisma.billingPlan.findUnique({ where: { id } });
        if (!existingPlan) {
          return ResponseHelper.error(reply, 'Plano não encontrado', 404);
        }

        // Extract courseIds from both possible locations
        const courseIds = data.courseIds || (data.features && data.features.courseIds) || [];
        const primaryCourseId = courseIds.length > 0 ? courseIds[0] : null;

        logger.info(`[UPDATE_PLAN] Dados recebidos do frontend: ${JSON.stringify(data, null, 2)}`);
        logger.info(`[UPDATE_PLAN] CourseIds extraídos de data.courseIds: ${JSON.stringify(data.courseIds)}`);
        logger.info(`[UPDATE_PLAN] CourseIds extraídos de data.features.courseIds: ${JSON.stringify(data.features?.courseIds)}`);
        logger.info(`[UPDATE_PLAN] CourseIds final: ${JSON.stringify(courseIds)}`);
        logger.info(`[UPDATE_PLAN] Features recebidas: ${JSON.stringify(data.features)}`);

        const updateData: any = {};
        const allowedFields = ['name', 'description', 'price', 'billingType', 'classesPerWeek', 'hasPersonalTraining', 'hasNutrition', 'isActive'];
        for (const field of allowedFields) {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        }

        updateData.courseId = primaryCourseId;
        updateData.features = {
            ...(existingPlan.features as object || {}),
            ...(data.features || {}),
            courseIds: courseIds,
        };
        updateData.updatedAt = new Date();

        logger.info(`[UPDATE_PLAN] Dados preparados para atualização: ${JSON.stringify(updateData, null, 2)}`);

        const billingPlan = await prisma.billingPlan.update({
          where: { id },
          data: updateData,
        });

        logger.info(`[UPDATE_PLAN] Plano ${id} atualizado com sucesso no banco de dados.`);
        return ResponseHelper.success(reply, billingPlan, 'Plano atualizado com sucesso!');

      } catch (error) {
        logger.error({ error, planId: id, data }, 'Falha catastrófica ao atualizar o plano de cobrança');
        return ResponseHelper.error(reply, 'Falha ao atualizar o plano de cobrança', 500);
      }
    }
});
}

// Helper function to get organization ID
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}
