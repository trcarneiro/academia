import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';

// Backward compatibility route for frontend expecting /api/billing-plans
export default async function billingPlanRoutes(fastify: FastifyInstance) {
  // GET /api/billing-plans - List billing plans
  fastify.get('/api/billing-plans', async (_request, reply) => {
    try {
      const org = await prisma.organization.findFirst();
      if (!org) {
        reply.code(400);
        return { success: false, error: 'No organization found' };
      }

      const plans = await prisma.billingPlan.findMany({
        where: { organizationId: org.id },
        include: {
          _count: { select: { subscriptions: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const data = plans.map((p: any) => ({
        ...p,
        subscriberCount: p._count?.subscriptions ?? 0
      }));

      return {
        success: true,
        data,
        message: 'Billing plans retrieved successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch billing plans'
      };
    }
  });

  // GET /api/billing-plans/:id - Get single billing plan
  fastify.get('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const plan = await prisma.billingPlan.findUnique({ where: { id } });
      if (!plan) {
        reply.code(404);
        return { success: false, error: 'Plan not found' };
      }
      return { success: true, data: plan };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to fetch plan' };
    }
  });

  // POST /api/billing-plans - Create new billing plan (frontend expects this)
  fastify.post('/api/billing-plans', async (request, reply) => {
    try {
      const body = request.body as any || {};

      // Ensure we have an organization to attach the plan to
      const org = await prisma.organization.findFirst();
      if (!org) {
        reply.code(400);
        return { success: false, error: 'No organization found' };
      }

      // Normalize/whitelist fields to avoid accidental injection
      const createData: any = {
        name: body.name || 'Untitled Plan',
        description: body.description || '',
        price: typeof body.price === 'number' ? body.price : (body.price ? Number(body.price) : 0),
        billingType: body.billingType || (body.billingInterval || 'MONTHLY'),
        category: body.category || null,
        organizationId: org.id,
        // Optional fields - preserve if provided
        ...(body.extra && { extra: body.extra })
      };

      const created = await prisma.billingPlan.create({ data: createData });
      return { success: true, data: created, message: 'Plan created successfully' };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to create plan' };
    }
  });

  // PUT /api/billing-plans/:id - Update billing plan
  fastify.put('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const plan = await prisma.billingPlan.update({ where: { id }, data: body });
      return { success: true, data: plan, message: 'Plan updated successfully' };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to update plan' };
    }
  });
}
