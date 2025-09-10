import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';

// Backward compatibility route for frontend expecting /api/billing-plans
export default async function billingPlanRoutes(fastify: FastifyInstance) {
  // GET /api/billing-plans - List billing plans
  fastify.get('/api/billing-plans', async (request, reply) => {
    try {
      // Adicionar logs para debug
      console.log('🔍 Headers:', JSON.stringify(request.headers, null, 2));
      console.log('🔍 Query:', JSON.stringify(request.query, null, 2));
      
      // Verificar se há organização no request
      const organizationId = (request.headers as any)['x-organization-id'] || 
                            (request.query as any).organizationId ||
                            'd961f738-9552-4385-8c1d-e10d8b1047e5'; // Fallback para desenvolvimento
      
      console.log('🔍 Using organizationId:', organizationId);

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
      
      // Map Prisma enum values to frontend expected values for compatibility
      const mappedPlan = {
        ...plan,
        billingType: plan.billingType === 'RECURRING' ? 'RECURRING' : 
                    plan.billingType === 'MONTHLY' ? 'MONTHLY' : 
                    plan.billingType
      };
      
      return { success: true, data: mappedPlan };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to fetch plan' };
    }
  });

  // POST /api/billing-plans - Create new billing plan (frontend expects this)
  fastify.post('/api/billing-plans', async (request, reply) => {
    try {
      console.log('🔍 POST Request body:', JSON.stringify(request.body, null, 2));
      
      const organizationId = (request.headers as any)['x-organization-id'] || 
                            (request.query as any).organizationId ||
                            'd961f738-9552-4385-8c1d-e10d8b1047e5'; // Fallback para desenvolvimento
      
      console.log('🔍 Using organizationId for POST:', organizationId);

      const body = request.body as any || {};

      // Map legacy billing types to valid Prisma enum values
      let billingType = body.billingType || 'MONTHLY';
      if (billingType === 'SUBSCRIPTION') {
        billingType = 'RECURRING';
      } else if (billingType === 'CREDIT') {
        billingType = 'MONTHLY';
      }

      // Filter only valid fields for BillingPlan model
      const createData: any = {
        name: body.name || 'Untitled Plan',
        description: body.description || '',
        price: Number(body.price) || 0,
        billingType: billingType,
        organizationId: organizationId
      };
      
      // Add optional valid fields if provided
      if (body.category !== undefined) createData.category = body.category;
      if (body.classesPerWeek !== undefined) createData.classesPerWeek = Number(body.classesPerWeek);
      if (body.maxClasses !== undefined) createData.maxClasses = Number(body.maxClasses);
      if (body.duration !== undefined) createData.duration = Number(body.duration);
      if (body.pricePerClass !== undefined) createData.pricePerClass = Number(body.pricePerClass);
      if (body.creditsValidity !== undefined) createData.creditsValidity = Number(body.creditsValidity);
      if (body.isUnlimitedAccess !== undefined) createData.isUnlimitedAccess = body.isUnlimitedAccess;
      if (body.hasPersonalTraining !== undefined) createData.hasPersonalTraining = body.hasPersonalTraining;
      if (body.hasNutrition !== undefined) createData.hasNutrition = body.hasNutrition;
      if (body.isActive !== undefined) createData.isActive = body.isActive;

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
      
      console.log('🔍 PUT Request received for ID:', id);
      console.log('🔍 Raw body received:', JSON.stringify(body, null, 2));
      
      // Map legacy billing types to valid Prisma enum values
      if (body.billingType === 'SUBSCRIPTION') {
        body.billingType = 'RECURRING';
      } else if (body.billingType === 'CREDIT') {
        body.billingType = 'MONTHLY';
      }
      
      // Filter only valid fields for BillingPlan model
      const validData: any = {};
      
      // Basic fields
      if (body.name !== undefined) validData.name = body.name;
      if (body.description !== undefined) validData.description = body.description;
      if (body.price !== undefined) validData.price = Number(body.price);
      if (body.billingType !== undefined) validData.billingType = body.billingType;
      if (body.category !== undefined) validData.category = body.category;
      if (body.isActive !== undefined) validData.isActive = body.isActive;
      
      // Integer fields
      if (body.classesPerWeek !== undefined) validData.classesPerWeek = Number(body.classesPerWeek);
      if (body.maxClasses !== undefined) validData.maxClasses = Number(body.maxClasses);
      if (body.duration !== undefined) validData.duration = Number(body.duration);
      if (body.creditsValidity !== undefined) validData.creditsValidity = Number(body.creditsValidity);
      
      // Decimal fields
      if (body.pricePerClass !== undefined) validData.pricePerClass = Number(body.pricePerClass);
      
      // Boolean fields
      if (body.isUnlimitedAccess !== undefined) validData.isUnlimitedAccess = body.isUnlimitedAccess;
      if (body.unlimitedClasses !== undefined) validData.isUnlimitedAccess = body.unlimitedClasses; // Map frontend field
      if (body.hasPersonalTraining !== undefined) validData.hasPersonalTraining = body.hasPersonalTraining;
      if (body.hasNutrition !== undefined) validData.hasNutrition = body.hasNutrition;
      if (body.allowInstallments !== undefined) validData.allowInstallments = body.allowInstallments;
      if (body.isRecurring !== undefined) validData.isRecurring = body.isRecurring;
      if (body.accessAllModalities !== undefined) validData.accessAllModalities = body.accessAllModalities;
      if (body.allowFreeze !== undefined) validData.allowFreeze = body.allowFreeze;
      
      // Other numeric fields
      if (body.maxInstallments !== undefined) validData.maxInstallments = Number(body.maxInstallments);
      if (body.installmentInterestRate !== undefined) validData.installmentInterestRate = Number(body.installmentInterestRate);
      if (body.recurringInterval !== undefined) validData.recurringInterval = Number(body.recurringInterval);
      if (body.freezeMaxDays !== undefined) validData.freezeMaxDays = Number(body.freezeMaxDays);
      
      // JSON field
      if (body.features !== undefined) validData.features = body.features;
      
      console.log('🔧 Filtered validData being sent to Prisma:', JSON.stringify(validData, null, 2));
      
      const plan = await prisma.billingPlan.update({ where: { id }, data: validData });
      console.log('✅ Prisma update successful, updated plan:', JSON.stringify(plan, null, 2));
      return { success: true, data: plan, message: 'Plan updated successfully' };
    } catch (error: any) {
      // Prisma P2025: Record not found
      if (error?.code === 'P2025') {
        reply.code(404);
        return { success: false, error: 'Plan not found' };
      }
      reply.code(500);
      return { success: false, error: 'Failed to update plan' };
    }
  });

  // DELETE /api/billing-plans/:id - Delete billing plan
  fastify.delete('/api/billing-plans/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check existence
      const existing = await prisma.billingPlan.findUnique({ where: { id } });
      if (!existing) {
        reply.code(404);
        return { success: false, error: 'Plan not found' };
      }

      // Prevent delete if there are subscriptions
      const subCount = await prisma.studentSubscription.count({ where: { planId: id } });
      if (subCount > 0) {
        reply.code(409);
        return { success: false, error: 'Cannot delete plan with active subscriptions', subscriptions: subCount };
      }

      await prisma.billingPlan.delete({ where: { id } });
      return { success: true, message: 'Plan deleted successfully' };
    } catch (error: any) {
      // Prisma P2003: Foreign key constraint failed
      if (error?.code === 'P2003') {
        reply.code(409);
        return { success: false, error: 'Cannot delete plan due to existing references' };
      }
      reply.code(500);
      return { success: false, error: 'Failed to delete plan' };
    }
  });
}
