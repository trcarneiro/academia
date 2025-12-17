// @ts-nocheck
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function discountsRoutes(fastify: FastifyInstance) {
  // List all discounts
  fastify.get('/', async (request, reply) => {
    try {
      const { organizationId } = request.user as any;
      const discounts = await prisma.discount.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });
      return ResponseHelper.success(reply, discounts);
    } catch (error) {
      return ResponseHelper.error(reply, 'Failed to fetch discounts', 500, error);
    }
  });

  // Create discount
  fastify.post('/', async (request, reply) => {
    try {
      const { organizationId } = request.user as any;
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
        value: z.number(),
        triggerType: z.enum(['MANUAL', 'PAYMENT_METHOD', 'COUPON', 'CAMPAIGN']),
        triggerValue: z.string().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        isActive: z.boolean().default(true)
      });

      const data = schema.parse(request.body);

      const discount = await prisma.discount.create({
        data: {
          ...data,
          organizationId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
        }
      });

      return ResponseHelper.success(reply, discount, 'Discount created successfully');
    } catch (error) {
      return ResponseHelper.error(reply, 'Failed to create discount', 500, error);
    }
  });

  // Update discount
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { organizationId } = request.user as any;
      
      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
        value: z.number().optional(),
        triggerType: z.enum(['MANUAL', 'PAYMENT_METHOD', 'COUPON', 'CAMPAIGN']).optional(),
        triggerValue: z.string().optional(),
        startDate: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        isActive: z.boolean().optional()
      });

      const data = schema.parse(request.body);

      // Verify ownership
      const existing = await prisma.discount.findFirst({ where: { id, organizationId } });
      if (!existing) return ResponseHelper.error(reply, 'Discount not found', 404);

      const discount = await prisma.discount.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : (data.startDate === null ? null : undefined),
          endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined),
        }
      });

      return ResponseHelper.success(reply, discount, 'Discount updated successfully');
    } catch (error) {
      return ResponseHelper.error(reply, 'Failed to update discount', 500, error);
    }
  });

  // Delete discount
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { organizationId } = request.user as any;

      const existing = await prisma.discount.findFirst({ where: { id, organizationId } });
      if (!existing) return ResponseHelper.error(reply, 'Discount not found', 404);

      await prisma.discount.delete({ where: { id } });
      return ResponseHelper.success(reply, null, 'Discount deleted successfully');
    } catch (error) {
      return ResponseHelper.error(reply, 'Failed to delete discount', 500, error);
    }
  });
}
