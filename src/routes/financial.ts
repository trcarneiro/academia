import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import FinancialService, { CreatePlanData, CreateSubscriptionData } from '../services/financialService';
import { StudentCategory, BillingType } from '@prisma/client';

// Schemas de validação
const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(StudentCategory).optional(),
  price: z.number().positive(),
  billingType: z.nativeEnum(BillingType),
  classesPerWeek: z.number().int().positive(),
  maxClasses: z.number().int().positive().optional(),
  hasPersonalTraining: z.boolean().optional(),
  hasNutrition: z.boolean().optional()
});

const createSubscriptionSchema = z.object({
  studentId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  customPrice: z.number().positive().optional()
});

const financialReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const webhookSchema = z.object({
  event: z.string(),
  payment: z.object({
    id: z.string(),
    status: z.string(),
    value: z.number(),
    billingType: z.string()
  }).optional()
});

export default async function financialRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // ==========================================
  // SUBSCRIPTION PLANS
  // ==========================================

  // GET /api/financial/plans - Listar planos
  fastify.get('/plans', {
    schema: {
      description: 'List subscription plans',
      tags: ['Financial'],
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: Object.values(StudentCategory) },
          isActive: { type: 'boolean' }
        }
      },
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
                  price: { type: 'number' },
                  billingType: { type: 'string' },
                  classesPerWeek: { type: 'number' },
                  isActive: { type: 'boolean' },
                  _count: {
                    type: 'object',
                    properties: {
                      subscriptions: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { category, isActive } = request.query as any;
      const filters: any = {};
      
      if (category) filters.category = category;
      if (isActive !== undefined) filters.isActive = isActive;

      const plans = await financialService.listPlans(filters);

      return {
        success: true,
        data: plans
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/financial/plans - Criar plano
  fastify.post('/plans', {
    schema: {
      description: 'Create subscription plan',
      tags: ['Financial'],
      body: {
        type: 'object',
        required: ['name', 'price', 'billingType', 'classesPerWeek'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: Object.values(StudentCategory) },
          price: { type: 'number' },
          billingType: { type: 'string', enum: Object.values(BillingType) },
          classesPerWeek: { type: 'number' },
          maxClasses: { type: 'number' },
          hasPersonalTraining: { type: 'boolean' },
          hasNutrition: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const validatedData = createPlanSchema.parse(request.body);
      const plan = await financialService.createPlan(validatedData as CreatePlanData);

      return {
        success: true,
        data: plan,
        message: 'Plan created successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/financial/plans/:id - Buscar plano específico
  fastify.get('/plans/:id', {
    schema: {
      description: 'Get subscription plan by ID',
      tags: ['Financial'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { id } = request.params as { id: string };
      const plan = await financialService.getPlan(id);

      if (!plan) {
        reply.code(404);
        return {
          success: false,
          error: 'Plan not found'
        };
      }

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch plan',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // STUDENT SUBSCRIPTIONS
  // ==========================================

  // POST /api/financial/subscriptions - Criar assinatura
  fastify.post('/subscriptions', {
    schema: {
      description: 'Create student subscription',
      tags: ['Financial'],
      body: {
        type: 'object',
        required: ['studentId', 'planId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
          planId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date-time' },
          customPrice: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const validatedData = createSubscriptionSchema.parse(request.body);
      const subscriptionData = {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined
      };
      
      const subscription = await financialService.createSubscription(subscriptionData as CreateSubscriptionData);

      return {
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // PUT /api/financial/subscriptions/:id - Atualizar assinatura
  fastify.put('/subscriptions/:id', {
    schema: {
      description: 'Update student subscription',
      tags: ['Financial'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          customPrice: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { id } = request.params as { id: string };
      const updateData = request.body as any;
      
      // Convert date strings to Date objects
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      const subscription = await financialService.updateSubscription(id, updateData);

      return {
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to update subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // DELETE /api/financial/subscriptions/:id - Cancelar/deletar assinatura
  fastify.delete('/subscriptions/:id', {
    schema: {
      description: 'Delete student subscription',
      tags: ['Financial'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { id } = request.params as { id: string };
      await financialService.deleteSubscription(id);

      return {
        success: true,
        message: 'Subscription deleted successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to delete subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/financial/students/:studentId/summary - Resumo financeiro do aluno
  fastify.get('/students/:studentId/summary', {
    schema: {
      description: 'Get student financial summary',
      tags: ['Financial'],
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string', format: 'uuid' }
        },
        required: ['studentId']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { studentId } = request.params as { studentId: string };
      const summary = await financialService.getStudentFinancialSummary(studentId);

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch student financial summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // REPORTS
  // ==========================================

  // GET /api/financial/reports - Relatório financeiro
  fastify.get('/reports', {
    schema: {
      description: 'Get financial report',
      tags: ['Financial'],
      querystring: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { startDate, endDate } = request.query as any;
      const validatedData = financialReportSchema.parse({ startDate, endDate });
      
      const report = await financialService.getOrganizationFinancialReport(
        new Date(validatedData.startDate),
        new Date(validatedData.endDate)
      );

      return {
        success: true,
        data: report
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to generate financial report',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // ASAAS WEBHOOKS
  // ==========================================

  // POST /api/financial/webhooks/asaas - Webhook do Asaas
  fastify.post('/webhooks/asaas', {
    schema: {
      description: 'Handle Asaas webhook notifications',
      tags: ['Financial'],
      body: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          payment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              value: { type: 'number' },
              billingType: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '1'; // TODO: Get from webhook validation
      const financialService = new FinancialService(organizationId);
      
      // TODO: Validate webhook signature
      const result = await financialService.processWebhook(request.body);

      return {
        success: true,
        data: result,
        message: 'Webhook processed successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // MANUAL PAYMENT OPERATIONS
  // ==========================================

  // POST /api/financial/subscriptions/:id/charge - Gerar cobrança manual
  fastify.post('/subscriptions/:id/charge', {
    schema: {
      description: 'Create manual charge for subscription',
      tags: ['Financial'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = '483d891e-8080-4337-aaaf-e53e43f22e71'; // TODO: Get from auth context
      const financialService = new FinancialService(organizationId);
      
      const { id } = request.params as { id: string };
      const payment = await financialService.createPaymentForSubscription(id);

      return {
        success: true,
        data: payment,
        message: 'Charge created successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create charge',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
