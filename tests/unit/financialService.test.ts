import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialService } from '@/services/financialService';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrisma = {
  organization: {
    findFirst: vi.fn(),
  },
  billingPlan: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  student: {
    findUnique: vi.fn(),
  },
  studentSubscription: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  course: {
    findUnique: vi.fn(),
  },
  courseEnrollment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
  };
});

describe('FinancialService', () => {
  let financialService: FinancialService;
  const mockOrganizationId = 'test-org-id';

  beforeEach(() => {
    vi.clearAllMocks();
    financialService = new FinancialService(mockOrganizationId);
  });

  describe('createPlan', () => {
    it('should create a new billing plan', async () => {
      const planData = {
        name: 'Test Plan',
        price: 100,
        billingType: 'MONTHLY',
        classesPerWeek: 2,
      };

      const mockCreatedPlan = {
        id: 'plan-1',
        ...planData,
        organizationId: mockOrganizationId,
      };

      mockPrisma.billingPlan.create.mockResolvedValue(mockCreatedPlan);

      const result = await financialService.createPlan(planData);

      expect(result).toEqual(mockCreatedPlan);
      expect(mockPrisma.billingPlan.create).toHaveBeenCalledWith({
        data: {
          ...planData,
          organizationId: mockOrganizationId,
        },
      });
    });
  });

  describe('updatePlan', () => {
    it('should update an existing billing plan', async () => {
      const planId = 'plan-1';
      const updateData = { name: 'Updated Plan' };
      const mockUpdatedPlan = {
        id: planId,
        name: 'Updated Plan',
        price: 100,
        billingType: 'MONTHLY',
        classesPerWeek: 2,
      };

      mockPrisma.billingPlan.update.mockResolvedValue(mockUpdatedPlan);

      const result = await financialService.updatePlan(planId, updateData);

      expect(result).toEqual(mockUpdatedPlan);
      expect(mockPrisma.billingPlan.update).toHaveBeenCalledWith({
        where: { id: planId },
        data: updateData,
      });
    });
  });

  describe('listPlans', () => {
    it('should list billing plans with filters', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Plan 1',
          price: 100,
          billingType: 'MONTHLY',
          classesPerWeek: 2,
          _count: { subscriptions: 5 },
        },
      ];

      mockPrisma.billingPlan.findMany.mockResolvedValue(mockPlans);

      const result = await financialService.listPlans({ isActive: true });

      expect(result).toEqual(mockPlans);
      expect(mockPrisma.billingPlan.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId,
          isActive: true,
        },
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createSubscription', () => {
    it('should create a new student subscription', async () => {
      const subscriptionData = {
        studentId: 'student-1',
        planId: 'plan-1',
      };

      const mockStudent = {
        id: 'student-1',
        user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      };

      const mockPlan = {
        id: 'plan-1',
        name: 'Test Plan',
        price: 100,
        billingType: 'MONTHLY',
      };

      const mockSubscription = {
        id: 'subscription-1',
        studentId: 'student-1',
        planId: 'plan-1',
        currentPrice: 100,
        billingType: 'MONTHLY',
        startDate: new Date(),
        nextBillingDate: new Date(),
        status: 'ACTIVE',
        student: mockStudent,
        plan: mockPlan,
      };

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.billingPlan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.studentSubscription.create.mockResolvedValue(mockSubscription);
      mockPrisma.courseEnrollment.create.mockResolvedValue({});

      const result = await financialService.createSubscription(subscriptionData);

      expect(result).toEqual(mockSubscription);
      expect(mockPrisma.studentSubscription.create).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      const subscriptionData = {
        studentId: 'student-1',
        planId: 'plan-1',
      };

      mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(financialService.createSubscription(subscriptionData))
        .rejects
        .toThrow('Student not found');
    });

    it('should throw error if plan not found', async () => {
      const subscriptionData = {
        studentId: 'student-1',
        planId: 'plan-1',
      };

      const mockStudent = {
        id: 'student-1',
        user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      };

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.billingPlan.findUnique.mockResolvedValue(null);

      await expect(financialService.createSubscription(subscriptionData))
        .rejects
        .toThrow('Plan not found');
    });
  });

  describe('updateSubscriptionPlan', () => {
    it('should update subscription plan', async () => {
      const subscriptionId = 'subscription-1';
      const newPlanId = 'plan-2';

      const mockSubscription = {
        id: subscriptionId,
        studentId: 'student-1',
        planId: 'plan-1',
        currentPrice: 100,
        billingType: 'MONTHLY',
      };

      const mockNewPlan = {
        id: newPlanId,
        name: 'New Plan',
        price: 150,
        billingType: 'MONTHLY',
      };

      const mockUpdatedSubscription = {
        ...mockSubscription,
        planId: newPlanId,
        currentPrice: 150,
        plan: mockNewPlan,
      };

      mockPrisma.studentSubscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.billingPlan.findUnique.mockResolvedValue(mockNewPlan);
      mockPrisma.studentSubscription.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await financialService.updateSubscriptionPlan(subscriptionId, newPlanId);

      expect(result).toEqual(mockUpdatedSubscription);
      expect(mockPrisma.studentSubscription.update).toHaveBeenCalled();
    });

    it('should throw error if subscription not found', async () => {
      const subscriptionId = 'subscription-1';
      const newPlanId = 'plan-2';

      mockPrisma.studentSubscription.findUnique.mockResolvedValue(null);

      await expect(financialService.updateSubscriptionPlan(subscriptionId, newPlanId))
        .rejects
        .toThrow('Subscription not found');
    });

    it('should throw error if new plan not found', async () => {
      const subscriptionId = 'subscription-1';
      const newPlanId = 'plan-2';

      const mockSubscription = {
        id: subscriptionId,
        studentId: 'student-1',
        planId: 'plan-1',
        currentPrice: 100,
        billingType: 'MONTHLY',
      };

      mockPrisma.studentSubscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.billingPlan.findUnique.mockResolvedValue(null);

      await expect(financialService.updateSubscriptionPlan(subscriptionId, newPlanId))
        .rejects
        .toThrow('New plan not found');
    });
  });
});
