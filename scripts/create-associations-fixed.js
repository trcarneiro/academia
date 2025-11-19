const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Criando associações entre atividades e planos de aula...\n');

  const courseId = 'krav-maga-faixa-branca-2025';

  // Mapeamento: categoria → lessonNumber → lista de títulos de atividades
  const categoryMapping = [
    {
      lessonNumber: 50,
      category: 'Postura',
      activities: ['Guarda de Boxe', 'Posição Ortodoxa', 'Posição Canhota', 'Shadow Boxing (Passo, Planos, Saltos)']
    },
    {
      lessonNumber: 51,
      category: 'Socos',
      activities: ['Jab', 'Direto', 'Gancho Esquerdo/Direito', 'Uppercut Esquerdo/Direito']
    },
    {
      lessonNumber: 52,
      category: 'Combinações',
      activities: ['Jab + Direto', 'Jab + Gancho', 'Direto + Uppercut']
    },
    {
      lessonNumber: 53,
      category: 'Cotoveladas',
      activities: ['Cotovelada Traseira', 'Cotovelada Lateral', 'Cotovelada Frontal', 'Cotovelada Uppercut', 'Cotovelada Martelo']
    },
    {
      lessonNumber: 54,
      category: 'Chutes',
      activities: ['Chute Reto', 'Chute Lateral', 'Chute Circular Baixo', 'Joelhada Frontal', 'Empurrão']
    },
    {
      lessonNumber: 55,
      category: 'Defesa Estrangulamento',
      activities: [
        'Defesa Estrangulamento Dedos (Frontal)',
        'Defesa Estrangulamento Joelho (Frontal)',
        'Defesa Estrangulamento Empurrão (Frontal)',
        'Defesa Estrangulamento Posterior',
        'Defesa Estrangulamento Empurrão (Posterior)',
        'Defesa Estrangulamento Lateral'
      ]
    },
    {
      lessonNumber: 56,
      category: 'Defesa Agarramento',
      activities: [
        'Defesa Agarramento Frontal Não Agressivo',
        'Defesa Agarramento Frontal Agressivo',
        'Defesa Agarramento com Imobilização',
        'Defesa Agarramento por Trás Externa',
        'Defesa Agarramento por Trás Interna'
      ]
    },
    {
      lessonNumber: 57,
      category: 'Defesa Geral',
      activities: ['Defesa 360°', 'Defesa 360° + Contra-ataque', 'Defesa Soco Reto', 'Defesa Soco Gancho']
    },
    {
      lessonNumber: 58,
      category: 'Quedas/Rolamentos',
      activities: ['Queda para Trás', 'Queda Frente Suave', 'Queda Frente Dura', 'Queda Lateral', 'Rolamento Frente', 'Rolamento Trás']
    }
  ];

  let totalAssociations = 0;
  let skipped = 0;

  for (const cat of categoryMapping) {
    console.log(`\n📚 Categoria: ${cat.category} (Aula ${cat.lessonNumber})`);

    // Buscar plano de aula
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: {
        courseId: courseId,
        lessonNumber: cat.lessonNumber,
        isActive: true
      }
    });

    if (!lessonPlan) {
      console.log(`  ⚠️ Plano de aula ${cat.lessonNumber} não encontrado`);
      continue;
    }

    // Para cada atividade da categoria
    let ord = 1;
    for (const activityTitle of cat.activities) {
      // Buscar atividade
      const activity = await prisma.activity.findFirst({
        where: {
          title: activityTitle,
          type: 'TECHNIQUE'
        }
      });

      if (!activity) {
        console.log(`  ❌ Atividade não encontrada: ${activityTitle}`);
        continue;
      }

      // Verificar se associação já existe
      const existing = await prisma.lessonPlanActivity.findFirst({
        where: {
          lessonPlanId: lessonPlan.id,
          activityId: activity.id
        }
      });

      if (existing) {
        console.log(`  ⏭️  ${activityTitle} (já associada)`);
        skipped++;
        continue;
      }

      // Criar associação com enum CORRETO: 'TECHNIQUE' (singular)
      await prisma.lessonPlanActivity.create({
        data: {
          lessonPlanId: lessonPlan.id,
          activityId: activity.id,
          ord: ord,
          segment: 'TECHNIQUE',  // ✅ CORRETO: singular, não 'TECHNIQUES'
          minimumForGraduation: 30
        }
      });

      console.log(`  ✓ ${activityTitle}`);
      totalAssociations++;
      ord++;
    }
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📊 ${totalAssociations} associações criadas`);
  console.log(`⏭️  ${skipped} já existiam`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
