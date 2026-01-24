
import { PrismaClient } from '@prisma/client';
import { addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function activatePlanForThiago() {
    console.log('🧪 Activating Plan specifically for Thiago (CPF: 06822689680)...\n');

    try {
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No Organization found.');

        // Find the student by CPF as requested
        const student = await prisma.student.findFirst({
            where: {
                organizationId: org.id,
                user: { cpf: '06822689680' }
            },
            include: { user: true }
        });

        if (!student) throw new Error('Student with CPF 06822689680 not found.');
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
            // Optional: Print dates
            console.log(`   Valid until: ${existingSub.endDate?.toLocaleDateString()}`);
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
                    organizationId: org.id,
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
            console.log('✅ Plan ACTIVATED successfully for Thiago.');
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

activatePlanForThiago();
