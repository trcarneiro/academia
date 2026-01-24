
import { PrismaClient } from '@prisma/client';
import { addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function activatePlan() {
    console.log('🧪 Activating Student Plan (Bypass Payment)...\n');

    try {
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No Organization found.');

        // Find the student (Raphael)
        const student = await prisma.student.findFirst({
            where: {
                organizationId: org.id,
                user: { firstName: { contains: 'Raphael' } }
            },
            include: { user: true }
        });

        if (!student) throw new Error('Student Raphael not found.');
        console.log(`🔹 Student: ${student.user.firstName} ${student.user.lastName} (${student.id})`);

        // Find a billing plan
        const plan = await prisma.billingPlan.findFirst({
            where: { organizationId: org.id, isActive: true }
        });

        if (!plan) throw new Error('No active Billing Plan found.');
        console.log(`🔹 Plan: ${plan.name} (${plan.id})`);

        // Check active subscription
        const existingSub = await prisma.studentSubscription.findFirst({
            where: { studentId: student.id, status: 'ACTIVE' }
        });

        if (existingSub) {
            console.log('✅ Student already has an ACTIVE subscription.');
            return;
        }

        // Create Subscription
        console.log('🔹 Creating ACTIVE subscription...');
        const startDate = new Date();
        const endDate = addMonths(startDate, 1);

        try {
            await prisma.studentSubscription.create({
                data: {
                    studentId: student.id,
                    organizationId: org.id, // Fixed: Added missing required field
                    planId: plan.id,
                    status: 'ACTIVE',
                    startDate: startDate,
                    endDate: endDate,
                    nextBillingDate: endDate,
                    currentPrice: Number(plan.price),
                    billingType: plan.billingType,
                    autoRenew: true
                }
            });
            console.log('✅ Plan ACTIVATED successfully.');
        } catch (innerError: any) {
            console.error('❌ Inner Prisma Error:', innerError.message);
            console.dir(innerError, { depth: null });
        }

    } catch (e: any) {
        console.error('❌ General Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

activatePlan();
