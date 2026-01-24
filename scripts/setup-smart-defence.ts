
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function setup() {
  console.log(`🚀 Setting up Smart Defence Organization (${ORG_ID})...`);

  // 1. Create Course
  let course = await prisma.course.findFirst({
    where: { organizationId: ORG_ID, name: 'Krav Maga' }
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        organizationId: ORG_ID,
        name: 'Krav Maga',
        description: 'Curso principal de Defesa Pessoal',
        level: 'BEGINNER', // Assuming enum or string
        duration: 60,
        totalClasses: 100,
        isActive: true
      }
    });
    console.log(`✅ Created Course: ${course.name} (${course.id})`);
  } else {
    console.log(`ℹ️ Course exists: ${course.name} (${course.id})`);
  }

  // 2. Create Default Plan
  let plan = await prisma.billingPlan.findFirst({
    where: { organizationId: ORG_ID, name: 'Plano Padrão' }
  });

  if (!plan) {
    plan = await prisma.billingPlan.create({
      data: {
        organizationId: ORG_ID,
        name: 'Plano Padrão',
        price: 0,
        billingType: 'MONTHLY',
        isActive: true
      }
    });
    console.log(`✅ Created Plan: ${plan.name} (${plan.id})`);
  } else {
    console.log(`ℹ️ Plan exists: ${plan.name} (${plan.id})`);
  }

  console.log('\n--- Setup Complete ---');
  console.log(`COURSE_ID: ${course.id}`);
  console.log(`PLAN_ID: ${plan.id}`);
}

setup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
