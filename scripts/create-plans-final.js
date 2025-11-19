const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';

  const plans = [
    { lessonNumber: 50, title: 'Postura e Movimentação', equipment: ['Tatame', 'Luvas'] },
    { lessonNumber: 51, title: 'Socos Básicos', equipment: ['Luvas', 'Bandagens', 'Saco de pancada'] },
    { lessonNumber: 52, title: 'Combinações de Socos', equipment: ['Luvas', 'Bandagens', 'Manoplas'] },
    { lessonNumber: 53, title: 'Cotoveladas', equipment: ['Luvas', 'Escudos', 'Manoplas'] },
    { lessonNumber: 54, title: 'Chutes e Joelhadas', equipment: ['Tatame', 'Aparadores', 'Escudos'] },
    { lessonNumber: 55, title: 'Defesas contra Estrangulamento', equipment: ['Tatame'] },
    { lessonNumber: 56, title: 'Defesas contra Agarramento', equipment: ['Tatame'] },
    { lessonNumber: 57, title: 'Defesas Gerais (360°)', equipment: ['Tatame', 'Almofadas'] },
    { lessonNumber: 58, title: 'Quedas e Rolamentos', equipment: ['Tatame', 'Colchões'] }
  ];

  console.log('📝 Criando 9 planos de aula...\n');

  for (const plan of plans) {
    const created = await prisma.lessonPlan.create({
      data: {
        courseId: courseId,
        title: plan.title,
        lessonNumber: plan.lessonNumber,
        weekNumber: Math.floor(plan.lessonNumber / 2), // Aproximado
        duration: 90,
        level: 1,              // ✅ Int
        difficulty: 1,         // ✅ Int (1=Iniciante)
        equipment: plan.equipment,
        objectives: [`Praticar técnicas de ${plan.title}`],
        activities: [],
        isActive: true,
        // Campos JSON obrigatórios
        warmup: {},
        techniques: {},
        simulations: {},
        cooldown: {}
      }
    });

    console.log(`✓ Aula ${plan.lessonNumber}: ${plan.title}`);
  }

  console.log('\n✅ 9 planos criados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
