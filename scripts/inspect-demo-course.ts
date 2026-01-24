
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
});

const DEMO_ORG_ID = '336cb021-103f-4ea8-b5cd-8742b97684ba';

async function inspect() {
    console.log(`🔍 Inspecting Org: ${DEMO_ORG_ID}`);

    const course = await prisma.course.findFirst({
        where: { organizationId: DEMO_ORG_ID },
        include: {
            lessonPlans: { select: { id: true, title: true } },
            // techniques: true, // Causing issue in include?
            // billingPlans: true
        }
    });

    if (!course) {
        console.log('❌ No course found in Demo Org.');
        return;
    }

    console.log(`✅ Found Course: ${course.name}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Lesson Plans: ${course.lessonPlans.length}`);
    console.log(`   Billing Plans: ${course.billingPlans.length}`);

    if (course.lessonPlans.length > 0) {
        console.log(`   Example Lesson: ${course.lessonPlans[0].title}`);
    }
}

inspect().finally(() => prisma.$disconnect());
