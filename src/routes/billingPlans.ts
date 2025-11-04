import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';
import { getDefaultOrganizationId } from '@/config/dev';

// Backward compatibility route for frontend expecting /api/billing-plans
export default async function billingPlanRoutes(fastify: FastifyInstance) {

  // GET /api/billing-plans - List billing plans
  fastify.get('/api/billing-plans', async (request, reply) => {
    try {
      console.log('📋 Headers:', JSON.stringify(request.headers, null, 2));
      console.log('📋 Query:', JSON.stringify(request.query, null, 2));

      // Verificar se há organização no request
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      console.log('📋 Using organizationId:', organizationId);

      const plans = await prisma.billingPlan.findMany({
        where: { organizationId: organizationId },
        include: {
          _count: { select: { subscriptions: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const data = plans.map((p: any) => ({
        ...p,
        subscriberCount: p._count?.subscriptions ?? 0
      }));

      reply.send({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('❌ Error fetching billing plans:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch billing plans'
      });
    }
  });

  // POST /api/billing-plans - Create billing plan
  fastify.post('/api/billing-plans', async (request, reply) => {
    try {
      console.log('📝 Creating billing plan, body:', JSON.stringify(request.body, null, 2));
      console.log('📝 Headers:', JSON.stringify(request.headers, null, 2));
      console.log('📝 Query:', JSON.stringify(request.query, null, 2));
      console.log('📝 User:', request.user);

      // Try to get organizationId from multiple sources
      const headerOrgId = requireOrganizationId(request as any, reply as any) as string;
      if (!headerOrgId) {
        return;
      }

      const organizationId = headerOrgId;

      console.log('📝 Final organizationId to use:', organizationId);

      // Validate that organization exists
      const orgExists = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!orgExists) {
        console.error('❌ Organization not found:', organizationId);
        return reply.code(400).send({
          success: false,
          error: 'Organization not found',
          details: `Organization with id ${organizationId} does not exist`
        });
      }

      console.log('✅ Organization found:', orgExists.name);

      const planData = request.body as any;

      // Remove any organizationId from the body to avoid conflicts
      const { organizationId: _, ...cleanPlanData } = planData;

      // Convert numeric fields to proper types
      const preparedData: any = {
        ...cleanPlanData,
        organizationId: organizationId,
        price: cleanPlanData.price ? parseFloat(cleanPlanData.price) : 0,
        classesPerWeek: cleanPlanData.classesPerWeek ? parseInt(cleanPlanData.classesPerWeek) : 2,
        maxInstallments: cleanPlanData.maxInstallments ? parseInt(cleanPlanData.maxInstallments) : 1,
        freezeMaxDays: cleanPlanData.freezeMaxDays ? parseInt(cleanPlanData.freezeMaxDays) : 30
      };

      // Handle optional numeric fields
      if (cleanPlanData.maxClasses) {
        preparedData.maxClasses = parseInt(cleanPlanData.maxClasses);
      }
      if (cleanPlanData.pricePerClass) {
        preparedData.pricePerClass = parseFloat(cleanPlanData.pricePerClass);
      }
      if (cleanPlanData.creditsValidity) {
        preparedData.creditsValidity = parseInt(cleanPlanData.creditsValidity);
      }
      if (cleanPlanData.recurringInterval) {
        preparedData.recurringInterval = parseInt(cleanPlanData.recurringInterval);
      }
      if (cleanPlanData.installmentInterestRate) {
        preparedData.installmentInterestRate = parseFloat(cleanPlanData.installmentInterestRate);
      }

      console.log('📦 Prepared data for Prisma:', JSON.stringify(preparedData, null, 2));

      const plan = await prisma.billingPlan.create({
        data: preparedData,
        include: {
          _count: { select: { subscriptions: true } },
          organization: true
        }
      });

      const responseData = {
        ...plan,
        subscriberCount: plan._count?.subscriptions ?? 0
      };

      console.log('✅ Billing plan created successfully:', plan.id);

      reply.code(201).send({
        success: true,
        data: responseData
      });
    } catch (error: any) {
      console.error('❌ Error creating billing plan:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      
      // Return more specific error message
      const errorMessage = error.message || 'Failed to create billing plan';
      
      reply.code(500).send({
        success: false,
        error: 'Failed to create billing plan',
        details: errorMessage,
        code: error.code
      });
    }
  });

  // GET /api/billing-plans/:id - Get single billing plan
  fastify.get('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;

      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      const plan = await prisma.billingPlan.findFirst({
        where: { id: id },
        include: {
          _count: { select: { subscriptions: true } },
          organization: true
        }
      });

      if (!plan) {
        reply.code(404).send({
          success: false,
          error: 'Billing plan not found'
        });
        return;
      }

      const responseData = {
        ...plan,
        subscriberCount: plan._count?.subscriptions ?? 0
      };

      reply.send({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('❌ Error fetching billing plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch billing plan'
      });
    }
  });

  // PUT /api/billing-plans/:id - Update billing plan
  fastify.put('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;

      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      const planData = request.body as any;

      // Remove any organizationId from the body to avoid conflicts
      const { organizationId: _, ...cleanPlanData } = planData;

      const plan = await prisma.billingPlan.update({
        where: { id: id },
        data: {
          ...cleanPlanData,
          organizationId: organizationId
        },
        include: {
          _count: { select: { subscriptions: true } },
          organization: true
        }
      });

      const responseData = {
        ...plan,
        subscriberCount: plan._count?.subscriptions ?? 0
      };

      reply.send({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('❌ Error updating billing plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to update billing plan'
      });
    }
  });

  // DELETE /api/billing-plans/:id - Delete billing plan
  fastify.delete('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;

      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      const existing = await prisma.billingPlan.findFirst({ where: { id } });
      if (!existing) {
        return reply.code(404).send({ success: false, error: 'Billing plan not found' });
      }
      if (existing.organizationId !== organizationId) {
        return reply.code(403).send({ success: false, error: 'Access denied to this organization' });
      }

      await prisma.billingPlan.delete({ where: { id } });

      reply.send({
        success: true,
        message: 'Billing plan deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting billing plan:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to delete billing plan'
      });
    }
  });
}
