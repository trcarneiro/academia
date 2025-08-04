import { describe, it, expect } from 'vitest';
import { prisma } from '../setup';

describe('Billing Plans API Integration', () => {
  describe('Database Operations', () => {
    it('should create a new billing plan in the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a billing plan
      const billingPlan = await prisma.billingPlan.create({
        data: {
          organizationId: organization.id,
          name: 'Basic Plan',
          description: 'Basic plan for beginners',
          price: 99.99,
          billingType: 'MONTHLY',
          classesPerWeek: 2,
          isActive: true,
        },
      });

      expect(billingPlan).toBeDefined();
      expect(billingPlan.name).toBe('Basic Plan');
      expect(billingPlan.price).toBe(99.99);
      expect(billingPlan.billingType).toBe('MONTHLY');
      expect(billingPlan.classesPerWeek).toBe(2);
      expect(billingPlan.isActive).toBe(true);

      // Clean up
      await prisma.billingPlan.delete({ where: { id: billingPlan.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });

    it('should retrieve a billing plan from the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a billing plan
      const billingPlan = await prisma.billingPlan.create({
        data: {
          organizationId: organization.id,
          name: 'Premium Plan',
          description: 'Premium plan with all features',
          price: 199.99,
          billingType: 'MONTHLY',
          classesPerWeek: 5,
          isActive: true,
        },
      });

      // Retrieve the billing plan
      const retrievedPlan = await prisma.billingPlan.findUnique({
        where: { id: billingPlan.id },
      });

      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.name).toBe('Premium Plan');
      expect(retrievedPlan?.price).toBe(199.99);
      expect(retrievedPlan?.billingType).toBe('MONTHLY');
      expect(retrievedPlan?.classesPerWeek).toBe(5);

      // Clean up
      await prisma.billingPlan.delete({ where: { id: billingPlan.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });

    it('should update a billing plan in the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a billing plan
      let billingPlan = await prisma.billingPlan.create({
        data: {
          organizationId: organization.id,
          name: 'Standard Plan',
          description: 'Standard plan',
          price: 149.99,
          billingType: 'MONTHLY',
          classesPerWeek: 3,
          isActive: true,
        },
      });

      // Update the billing plan
      billingPlan = await prisma.billingPlan.update({
        where: { id: billingPlan.id },
        data: {
          name: 'Updated Standard Plan',
          price: 179.99,
          classesPerWeek: 4,
        },
      });

      expect(billingPlan.name).toBe('Updated Standard Plan');
      expect(billingPlan.price).toBe(179.99);
      expect(billingPlan.classesPerWeek).toBe(4);

      // Clean up
      await prisma.billingPlan.delete({ where: { id: billingPlan.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });

    it('should list billing plans with filters', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create multiple billing plans
      await prisma.billingPlan.create({
        data: {
          organizationId: organization.id,
          name: 'Active Plan',
          price: 99.99,
          billingType: 'MONTHLY',
          classesPerWeek: 2,
          isActive: true,
        },
      });

      await prisma.billingPlan.create({
        data: {
          organizationId: organization.id,
          name: 'Inactive Plan',
          price: 199.99,
          billingType: 'MONTHLY',
          classesPerWeek: 5,
          isActive: false,
        },
      });

      // Retrieve active billing plans
      const activePlans = await prisma.billingPlan.findMany({
        where: {
          organizationId: organization.id,
          isActive: true,
        },
      });

      expect(activePlans).toHaveLength(1);
      expect(activePlans[0].name).toBe('Active Plan');

      // Retrieve all billing plans
      const allPlans = await prisma.billingPlan.findMany({
        where: {
          organizationId: organization.id,
        },
      });

      expect(allPlans).toHaveLength(2);

      // Clean up
      await prisma.billingPlan.deleteMany({
        where: { organizationId: organization.id },
      });
      await prisma.organization.delete({ where: { id: organization.id } });
    });
  });
});
