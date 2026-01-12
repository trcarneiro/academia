import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.lessonPlan.findMany({
    take: 5,
    orderBy: { lessonNumber: 'asc' },
    select: { id: true, title: true, lessonNumber: true, courseId: true }
  });

  console.log('Planos encontrados:');
  console.log(JSON.stringify(plans, null, 2));

  await prisma.$disconnect();
}

checkPlans();
