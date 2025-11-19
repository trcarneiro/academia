const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lessonPlans = await prisma.lessonPlan.findMany({
    where: {
      courseId: 'krav-maga-faixa-branca-2025',
      lessonNumber: { gte: 50, lte: 58 }
    },
    orderBy: { lessonNumber: 'asc' }
  });

  console.log('📚 Planos de aula 50-58:', lessonPlans.length);
  lessonPlans.forEach(lp => {
    console.log(`  - Aula ${lp.lessonNumber}: ${lp.title}`);
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
