const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';
  
  const plans = [
    { lessonNumber: 50, name: 'Postura e Movimentação' },
    { lessonNumber: 51, name: 'Socos' },
    { lessonNumber: 52, name: 'Combinações de Socos' },
    { lessonNumber: 53, name: 'Cotoveladas' },
    { lessonNumber: 54, name: 'Chutes' },
    { lessonNumber: 55, name: 'Defesas - Estrangulamento' },
    { lessonNumber: 56, name: 'Defesas - Agarramento' },
    { lessonNumber: 57, name: 'Defesas - Ataques Gerais' },
    { lessonNumber: 58, name: 'Quedas e Rolamentos' }
  ];

  console.log('📝 Criando 9 planos de aula...\n');

  for (const plan of plans) {
    const created = await prisma.lessonPlan.create({
      data: {
        courseId: courseId,
        title: plan.name,
        lessonNumber: plan.lessonNumber,
        weekNumber: Math.ceil(plan.lessonNumber / 2),
        duration: 90,
        level: 1,
        difficulty: 'beginner',
        equipment: ['Tatame', 'Luvas'],
        isActive: true,
        activities: {},
        warmup: {},
        techniques: {},
        simulations: {},
        cooldown: {}
      }
    });
    console.log(`✓ ${plan.name} (Aula ${plan.lessonNumber})`);
  }

  console.log('\n✅ 9 planos criados!');
  await prisma.$disconnect();
}

main().catch(console.error);
