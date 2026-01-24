// @ts-nocheck
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import FinancialService, { CreatePlanData, CreateSubscriptionData } from '../services/financialService';
import { StudentCategory, BillingType } from '@prisma/client';
import { prisma } from '@/utils/database';

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
  planId: z.string(),
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
  fastify: FastifyInstance
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
      }
    }
  }, async (request, reply) => {
    try {
      // Derivar organização pelo primeiro registro existente (fallback sem auth)
      const org = await prisma.organization.findFirst();
      if (!org) {
        return reply.code(400).send({ success: false, error: 'No organization found' });
      }
      const financialService = new FinancialService(org.id);
      const { category, isActive } = request.query as any;
      const plans = await financialService.listPlans({ category, isActive });
      return { success: true, data: plans };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to list plans' };
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
      // Derivar organização pelo primeiro registro existente (fallback sem auth)
      const org = await prisma.organization.findFirst();
      if (!org) {
        return reply.code(400).send({ success: false, error: 'No organization found' });
      }
      const financialService = new FinancialService(org.id);

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
      const org = await prisma.organization.findFirst();
      if (!org) {
        reply.code(400);
        return { success: false, error: 'No organization found' };
      }
      const financialService = new FinancialService(org.id);
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

  // GET /api/financial/subscriptions - Listar todas as assinaturas
  fastify.get('/subscriptions', {
    schema: {
      description: 'List all subscriptions',
      tags: ['Financial'],
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
                  student: { type: 'object' },
                  plan: { type: 'object' },
                  status: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string', nullable: true },
                  customPrice: { type: 'number', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const subscriptions = await prisma.studentSubscription.findMany({
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              billingType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.code(200).send({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      console.error('Erro ao listar assinaturas:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

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
          planId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          customPrice: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const validatedData = createSubscriptionSchema.parse(request.body);
      // Derivar organização pelo estudante
      const student = await prisma.student.findUnique({
        where: { id: validatedData.studentId },
        select: { organizationId: true }
      });
      if (!student) {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }
      const financialService = new FinancialService(student.organizationId);
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
      const { id } = request.params as { id: string };
      // Derivar organização pela própria subscription
      const sub = await prisma.studentSubscription.findUnique({ where: { id }, select: { organizationId: true } });
      if (!sub) {
        reply.code(404);
        return { success: false, error: 'Subscription not found' };
      }
      const financialService = new FinancialService(sub.organizationId);
      const updateData = request.body as any;
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
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

  // PATCH /api/financial/subscriptions/:id - Atualizar assinatura (alias do PUT)
  fastify.patch('/subscriptions/:id', {
    schema: {
      description: 'Partially update student subscription (same as PUT)',
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
          customPrice: { type: 'number' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      // Derivar organização pela própria subscription
      const sub = await prisma.studentSubscription.findUnique({ where: { id }, select: { organizationId: true } });
      if (!sub) {
        reply.code(404);
        return { success: false, error: 'Subscription not found' };
      }
      const financialService = new FinancialService(sub.organizationId);
      const updateData = request.body as any;
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

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
          // Accept any non-empty string; handler will resolve 404 if not found
          id: { type: 'string', minLength: 1 }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const sub = await prisma.studentSubscription.findUnique({ where: { id }, select: { organizationId: true } });
      if (!sub) {
        reply.code(404);
        return { success: false, error: 'Subscription not found' };
      }
      const financialService = new FinancialService(sub.organizationId);
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
      const { studentId } = request.params as { studentId: string };
      const student = await prisma.student.findUnique({ where: { id: studentId }, select: { organizationId: true } });
      if (!student) {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }
      const financialService = new FinancialService(student.organizationId);
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

  // GET /api/financial/stats - Estatísticas globais (Dashboard)
  fastify.get('/stats', {
    schema: {
      description: 'Get global financial stats',
      tags: ['Financial']
    }
  }, async (request, reply) => {
    try {
      const org = await prisma.organization.findFirst();
      if (!org) {
        return reply.code(400).send({ success: false, error: 'No organization found' });
      }

      // Calcular receita mensal (Soma de currentPrice de assinaturas ATIVAS)
      // Ajuste para periodicidade (se BillingType != MONTHLY, dividir pelo prazo?)
      // Por simplicidade inicial: considera valor da parcela como receita mensal recorrente se for mensal.
      const activeSubscriptions = await prisma.studentSubscription.findMany({
        where: {
          organizationId: org.id,
          status: 'ACTIVE',
          isActive: true
        },
        select: {
          currentPrice: true,
          billingType: true
        }
      });

      let monthlyRevenue = 0;
      activeSubscriptions.forEach(sub => {
        let value = Number(sub.currentPrice);
        if (sub.billingType === 'QUARTERLY') value = value / 3;
        if (sub.billingType === 'YEARLY') value = value / 12;
        // Se for MONTHLY ou outros, mantém
        monthlyRevenue += value;
      });

      return {
        success: true,
        data: {
          monthlyRevenue,
          activeSubscriptions: activeSubscriptions.length
        }
      };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to fetch financial stats' };
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
      const org = await prisma.organization.findFirst();
      if (!org) {
        reply.code(400);
        return { success: false, error: 'No organization found' };
      }
      const financialService = new FinancialService(org.id);
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
      const org = await prisma.organization.findFirst();
      if (!org) {
        reply.code(400);
        return { success: false, error: 'No organization found' };
      }
      const financialService = new FinancialService(org.id);

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
      const { id } = request.params as { id: string };
      const sub = await prisma.studentSubscription.findUnique({ where: { id }, select: { organizationId: true } });
      if (!sub) {
        reply.code(404);
        return { success: false, error: 'Subscription not found' };
      }
      const financialService = new FinancialService(sub.organizationId);
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

  // ==========================================
  // CREDIT PURCHASES
  // ==========================================

  // GET /api/financial/credits - Listar compras de crédito
  fastify.get('/credits', {
    schema: {
      description: 'List all credit purchases',
      tags: ['Financial'],
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
                  student: { type: 'object' },
                  plan: { type: 'object' },
                  credits: { type: 'number' },
                  usedCredits: { type: 'number' },
                  remainingCredits: { type: 'number' },
                  purchaseDate: { type: 'string' },
                  expiryDate: { type: 'string', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Por agora, vamos simular dados de crédito baseados nas assinaturas de crédito
      const creditPlans = await prisma.billingPlan.findMany({
        where: {
          billingType: 'CREDITS'
        },
        include: {
          subscriptions: {
            include: {
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const creditPurchases = creditPlans.flatMap(plan =>
        plan.subscriptions.map(subscription => ({
          id: subscription.id,
          student: subscription.student,
          plan: {
            id: plan.id,
            name: plan.name,
            price: plan.price
          },
          credits: plan.maxClasses || 10, // Usar maxClasses como créditos
          usedCredits: Math.floor(Math.random() * (plan.maxClasses || 10)), // Simulado
          remainingCredits: (plan.maxClasses || 10) - Math.floor(Math.random() * (plan.maxClasses || 10)),
          purchaseDate: subscription.startDate,
          expiryDate: subscription.endDate
        }))
      );

      return reply.code(200).send({
        success: true,
        data: creditPurchases
      });
    } catch (error) {
      console.error('Erro ao listar créditos:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });
}
