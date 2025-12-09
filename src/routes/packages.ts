import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { authenticateToken, allRoles } from '@/middlewares/auth';

/**
 * Helper: Extrai organizationId de JWT, query param ou fallback
 * Suporta desenvolvimento sem autenticação
 */
function getOrganizationId(request: any): string {
  return request.user?.organizationId || 
         (request.query as any).organizationId || 
         (request.headers['x-organization-id'] as string) ||
         'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence (fallback)
}

// Schemas de validação para pacotes
const CreatePackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  billingType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CREDITS', 'CREDIT_CARD_INSTALLMENT']),
  category: z.string().optional(),
  classesPerWeek: z.number().int().min(0).optional(),
  credits: z.number().int().min(1).optional(), // Para pacotes de crédito
  hasPersonalTraining: z.boolean().default(false),
  hasNutrition: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

const UpdatePackageSchema = CreatePackageSchema.partial();

const PackageQuerySchema = z.object({
  type: z.enum(['subscription', 'credits', 'all']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

/**
 * 📦 Packages Routes - API Unificada
 * Substitui /api/billing-plans e /api/financial
 */
export default async function packagesRoutes(fastify: FastifyInstance) {
  
  // GET /api/packages - Listar todos os pacotes
  fastify.get('/', {
    // ⚠️ TEMPORARY: Authentication disabled for PostgreSQL migration testing
    // preHandler: [authenticateToken, allRoles],
    schema: {
      querystring: PackageQuerySchema,
      tags: ['Packages'],
      summary: 'Listar pacotes (planos + créditos)'
    }
  }, async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      const query = request.query as z.infer<typeof PackageQuerySchema>;
      
      // Construir filtros
      const where: any = { organizationId };
      
      if (query.type === 'subscription') {
        where.billingType = { in: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'CREDIT_CARD_INSTALLMENT'] };
      } else if (query.type === 'credits') {
        where.billingType = 'CREDITS';
      }
      
      if (query.status === 'active') {
        where.isActive = true;
      } else if (query.status === 'inactive') {
        where.isActive = false;
      }
      
      if (query.category) {
        where.category = query.category;
      }
      
      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;
      
      // Buscar pacotes
      const [packages, total] = await Promise.all([
        prisma.billingPlan.findMany({
          where,
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              select: { id: true }
            },
            creditPurchases: {
              where: { isActive: true },
              select: { id: true, creditsRemaining: true }
            },
            _count: {
              select: {
                subscriptions: true,
                creditPurchases: true
              }
            }
          },
          orderBy: [
            { isActive: 'desc' },
            { price: 'asc' }
          ],
          skip,
          take: limit
        }),
        prisma.billingPlan.count({ where })
      ]);
      
      // Enriquecer dados
      const enrichedPackages = packages.map(pkg => ({
        ...pkg,
        activeSubscriptions: pkg.subscriptions?.length || 0,
        activeCreditPurchases: pkg.creditPurchases?.length || 0,
        totalCreditsRemaining: pkg.creditPurchases?.reduce((sum, cp) => sum + (cp.creditsRemaining || 0), 0) || 0
      }));
      
      return ResponseHelper.success(reply, {
        data: enrichedPackages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // GET /api/packages/:id - Buscar pacote específico
  fastify.get('/:id', {
    // ⚠️ TEMPORARY: Authentication disabled for PostgreSQL migration testing
    // preHandler: [authenticateToken, allRoles],
    schema: {
      params: z.object({ id: z.string().cuid() }),
      tags: ['Packages'],
      summary: 'Buscar pacote por ID'
    }
  }, async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params as { id: string };
      
      const packageData = await prisma.billingPlan.findFirst({
        where: { id, organizationId },
        include: {
          subscriptions: {
            include: {
              student: {
                include: { user: true }
              }
            }
          },
          creditPurchases: {
            include: {
              student: {
                include: { user: true }
              }
            }
          },
          _count: {
            select: {
              subscriptions: true,
              creditPurchases: true
            }
          }
        }
      });
      
      if (!packageData) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }
      
      return ResponseHelper.success(reply, packageData);
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // POST /api/packages - Criar novo pacote
  fastify.post('/', {
    // ⚠️ TEMPORARY: Authentication disabled for PostgreSQL migration testing
    // preHandler: [authenticateToken, allRoles],
    schema: {
      body: CreatePackageSchema,
      tags: ['Packages'],
      summary: 'Criar novo pacote'
    }
  }, async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      const body = request.body as z.infer<typeof CreatePackageSchema>;
      
      // Validações específicas
      if (body.billingType === 'CREDITS' && !body.credits) {
        return ResponseHelper.badRequest(reply, 'Pacotes de crédito devem ter quantidade de créditos definida');
      }
      
      if (body.billingType !== 'CREDITS' && body.credits) {
        return ResponseHelper.badRequest(reply, 'Apenas pacotes de crédito podem ter quantidade de créditos');
      }
      
      const packageData = await prisma.billingPlan.create({
        data: {
          ...body,
          organizationId
        }
      });
      
      return ResponseHelper.success(reply, packageData, 'Pacote criado com sucesso', 201);
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // PUT /api/packages/:id - Atualizar pacote
  fastify.put('/:id', {
    // ⚠️ TEMPORARY: Authentication disabled for PostgreSQL migration testing
    // preHandler: [authenticateToken, allRoles],
    schema: {
      params: z.object({ id: z.string().cuid() }),
      body: UpdatePackageSchema,
      tags: ['Packages'],
      summary: 'Atualizar pacote'
    }
  }, async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof UpdatePackageSchema>;
      
      // Verificar se pacote existe
      const existingPackage = await prisma.billingPlan.findFirst({
        where: { id, organizationId }
      });
      
      if (!existingPackage) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }
      
      // Validações específicas de atualização
      if (body.billingType === 'CREDITS' && !body.credits && !existingPackage.credits) {
        return ResponseHelper.badRequest(reply, 'Pacotes de crédito devem ter quantidade de créditos definida');
      }
      
      const updatedPackage = await prisma.billingPlan.update({
        where: { id },
        data: {
          ...body,
          updatedAt: new Date()
        }
      });
      
      return ResponseHelper.success(reply, updatedPackage, 'Pacote atualizado com sucesso');
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // DELETE /api/packages/:id - Excluir/desativar pacote
  fastify.delete('/:id', {
    // ⚠️ TEMPORARY: Authentication disabled for PostgreSQL migration testing
    // preHandler: [authenticateToken, allRoles],
    schema: {
      params: z.object({ id: z.string().cuid() }),
      tags: ['Packages'],
      summary: 'Excluir/desativar pacote'
    }
  }, async (request, reply) => {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params as { id: string };
      
      // Verificar se pacote existe
      const existingPackage = await prisma.billingPlan.findFirst({
        where: { id, organizationId },
        include: {
          _count: {
            select: {
              subscriptions: true,
              creditPurchases: true
            }
          }
        }
      });
      
      if (!existingPackage) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }
      
      // Verificar se tem assinaturas ou créditos ativos
      const hasActiveItems = existingPackage._count.subscriptions > 0 || existingPackage._count.creditPurchases > 0;
      
      if (hasActiveItems) {
        // Soft delete - apenas desativar
        const deactivatedPackage = await prisma.billingPlan.update({
          where: { id },
          data: { isActive: false }
        });
        
        return ResponseHelper.success(reply, deactivatedPackage, 'Pacote desativado com sucesso (possui itens ativos)');
      } else {
        // Hard delete - remover completamente
        await prisma.billingPlan.delete({
          where: { id }
        });
        
        return ResponseHelper.success(reply, null, 'Pacote excluído com sucesso');
      }
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // GET /api/packages/analytics - Métricas e analytics
  fastify.get('/analytics', {
    preHandler: [authenticateToken, allRoles],
    schema: {
      querystring: z.object({
        period: z.enum(['week', 'month', 'quarter', 'year']).default('month')
      }),
      tags: ['Packages'],
      summary: 'Métricas de pacotes'
    }
  }, async (request, reply) => {
    try {
      const { organizationId } = request.user;
      const { period } = request.query as { period: string };
      
      // Calcular data de início baseada no período
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      // Buscar dados para métricas
      const [
        totalPackages,
        activePackages,
        activeSubscriptions,
        totalRevenue,
        creditsData
      ] = await Promise.all([
        prisma.billingPlan.count({ where: { organizationId } }),
        prisma.billingPlan.count({ where: { organizationId, isActive: true } }),
        prisma.studentSubscription.count({
          where: {
            organizationId,
            status: 'ACTIVE',
            createdAt: { gte: startDate }
          }
        }),
        prisma.studentSubscription.aggregate({
          where: {
            organizationId,
            status: 'ACTIVE',
            createdAt: { gte: startDate }
          },
          _sum: { currentPrice: true }
        }),
        prisma.creditPurchase.aggregate({
          where: {
            organizationId,
            isActive: true,
            purchaseDate: { gte: startDate }
          },
          _sum: {
            creditsTotal: true,
            creditsRemaining: true,
            price: true
          }
        })
      ]);
      
      const metrics = {
        packages: {
          total: totalPackages,
          active: activePackages,
          inactive: totalPackages - activePackages
        },
        subscriptions: {
          active: activeSubscriptions,
          revenue: totalRevenue._sum.currentPrice || 0
        },
        credits: {
          sold: creditsData._sum.creditsTotal || 0,
          remaining: creditsData._sum.creditsRemaining || 0,
          revenue: creditsData._sum.price || 0
        },
        totalRevenue: (totalRevenue._sum.currentPrice || 0) + (creditsData._sum.price || 0),
        period
      };
      
      return ResponseHelper.success(reply, metrics);
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // POST /api/packages/:id/subscribe - Criar assinatura para pacote
  fastify.post('/:id/subscribe', {
    preHandler: [authenticateToken, allRoles],
    schema: {
      params: z.object({ id: z.string().cuid() }),
      body: z.object({
        studentId: z.string().cuid(),
        customPrice: z.number().positive().optional(),
        startDate: z.string().datetime().optional()
      }),
      tags: ['Packages'],
      summary: 'Criar assinatura para pacote'
    }
  }, async (request, reply) => {
    try {
      const { organizationId } = request.user;
      const { id } = request.params as { id: string };
      const { studentId, customPrice, startDate } = request.body as any;
      
      // Verificar se pacote existe e é de assinatura
      const packageData = await prisma.billingPlan.findFirst({
        where: { id, organizationId }
      });
      
      if (!packageData) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }
      
      if (packageData.billingType === 'CREDITS') {
        return ResponseHelper.badRequest(reply, 'Use /api/packages/:id/purchase-credits para pacotes de crédito');
      }
      
      // Verificar se aluno existe
      const student = await prisma.student.findFirst({
        where: { id: studentId, organizationId }
      });
      
      if (!student) {
        return ResponseHelper.notFound(reply, 'Aluno não encontrado');
      }
      
      // Verificar se já tem assinatura ativa
      // Desativar assinaturas ativas anteriores (cada aluno só pode ter UMA ativa)
      const existingSubscription = await prisma.studentSubscription.findMany({
        where: {
          studentId,
          status: 'ACTIVE'
        }
      });
      
      if (existingSubscription.length > 0) {
        await prisma.studentSubscription.updateMany({
          where: {
            studentId,
            status: 'ACTIVE'
          },
          data: { status: 'INACTIVE', isActive: false }
        });
        console.log(`⚠️ ${existingSubscription.length} assinatura(s) anterior(es) desativada(s) automaticamente para aluno ${studentId}`);
      }
      
      // Buscar responsável financeiro do aluno
      let payerId = studentId;
      if (student.financialResponsibleId) {
        payerId = student.financialResponsibleId;
      }
      // Criar assinatura
      const subscription = await prisma.studentSubscription.create({
        data: {
          organizationId,
          studentId,
          planId: id,
          payerId,
          currentPrice: customPrice || packageData.price,
          billingType: packageData.billingType,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: 'ACTIVE'
        },
        include: {
          student: { include: { user: true } },
          plan: true
        }
      });
      
      return ResponseHelper.success(reply, subscription, 'Assinatura criada com sucesso', 201);
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
  
  // POST /api/packages/:id/purchase-credits - Comprar créditos
  fastify.post('/:id/purchase-credits', {
    preHandler: [authenticateToken, allRoles],
    schema: {
      params: z.object({ id: z.string().cuid() }),
      body: z.object({
        studentId: z.string().cuid(),
        creditsQuantity: z.number().int().min(1).optional(),
        customPrice: z.number().positive().optional(),
        expirationDate: z.string().datetime().optional()
      }),
      tags: ['Packages'],
      summary: 'Comprar créditos de pacote'
    }
  }, async (request, reply) => {
    try {
      const { organizationId } = request.user;
      const { id } = request.params as { id: string };
      const { studentId, creditsQuantity, customPrice, expirationDate } = request.body as any;
      
      // Verificar se pacote existe e é de créditos
      const packageData = await prisma.billingPlan.findFirst({
        where: { id, organizationId }
      });
      
      if (!packageData) {
        return ResponseHelper.notFound(reply, 'Pacote não encontrado');
      }
      
      if (packageData.billingType !== 'CREDITS') {
        return ResponseHelper.badRequest(reply, 'Use /api/packages/:id/subscribe para pacotes de assinatura');
      }
      
      // Verificar se aluno existe
      const student = await prisma.student.findFirst({
        where: { id: studentId, organizationId }
      });
      
      if (!student) {
        return ResponseHelper.notFound(reply, 'Aluno não encontrado');
      }
      
      const finalCredits = creditsQuantity || packageData.credits || 1;
      const finalPrice = customPrice || packageData.price;
      
      // Criar compra de créditos
      const creditPurchase = await prisma.creditPurchase.create({
        data: {
          organizationId,
          studentId,
          planId: id,
          creditsTotal: finalCredits,
          creditsRemaining: finalCredits,
          price: finalPrice,
          purchaseDate: new Date(),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          isActive: true
        },
        include: {
          student: { include: { user: true } },
          plan: true
        }
      });
      
      return ResponseHelper.success(reply, creditPurchase, 'Créditos comprados com sucesso', 201);
      
    } catch (error) {
      return ResponseHelper.error(reply, error);
    }
  });
}

// Backward compatibility - redirect old routes
export async function legacyRedirectRoutes(fastify: FastifyInstance) {
  // Redirect /api/billing-plans to /api/packages
  fastify.get('/billing-plans', async (request, reply) => {
    reply.redirect(301, '/api/packages');
  });
  
  fastify.get('/billing-plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    reply.redirect(301, `/api/packages/${id}`);
  });
  
  // Redirect /api/financial routes
  fastify.get('/financial/plans', async (request, reply) => {
    reply.redirect(301, '/api/packages?type=subscription');
  });
  
  fastify.get('/financial/subscriptions', async (request, reply) => {
    reply.redirect(301, '/api/subscriptions');
  });
}
