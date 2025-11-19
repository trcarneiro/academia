const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const activities = await prisma.activity.findMany({
    where: {
      organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
      type: 'TECHNIQUE'
    }
  });

  const lessonPlans = await prisma.lessonPlan.findMany({
    where: {
      courseId: 'krav-maga-faixa-branca-2025'
    },
    orderBy: { lessonNumber: 'asc' }
  });

  const associations = await prisma.lessonPlanActivity.findMany({
    where: {
      lessonPlanId: { in: lessonPlans.map(lp => lp.id) }
    }
  });

  console.log('📊 Status Atual:');
  console.log(`✅ Atividades: ${activities.length}`);
  console.log(`✅ Planos de Aula: ${lessonPlans.length}`);
  console.log(`✅ Associações: ${associations.length}\n`);

  if (lessonPlans.length > 0) {
    console.log('Planos criados:');
    lessonPlans.forEach(lp => console.log(`  - Aula ${lp.lessonNumber}: ${lp.title}`));
  }

  await prisma.$disconnect();
}

check();
