const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Criando vínculos LessonPlan ↔ Technique para o módulo de Cursos\n');

  const courseId = 'krav-maga-faixa-branca-2025';

  // Lista das 42 atividades que importamos
  const activityTitles = [
    'Guarda de Boxe', 'Posição Ortodoxa', 'Posição Canhota', 'Shadow Boxing (Passo, Planos, Saltos)',
    'Jab', 'Direto', 'Gancho Esquerdo/Direito', 'Uppercut Esquerdo/Direito',
    'Jab + Direto', 'Jab + Gancho', 'Direto + Uppercut',
    'Cotovelada Traseira', 'Cotovelada Lateral', 'Cotovelada Frontal', 'Cotovelada Uppercut', 'Cotovelada Martelo',
    'Chute Reto', 'Chute Lateral', 'Chute Circular Baixo', 'Joelhada Frontal', 'Empurrão',
    'Defesa Estrangulamento Dedos (Frontal)', 'Defesa Estrangulamento Joelho (Frontal)', 
    'Defesa Estrangulamento Empurrão (Frontal)', 'Defesa Estrangulamento Posterior', 
    'Defesa Estrangulamento Empurrão (Posterior)', 'Defesa Estrangulamento Lateral',
    'Defesa Agarramento Frontal Não Agressivo', 'Defesa Agarramento Frontal Agressivo',
    'Defesa Agarramento com Imobilização', 'Defesa Agarramento por Trás Externa', 
    'Defesa Agarramento por Trás Interna',
    'Defesa 360°', 'Defesa 360° + Contra-ataque', 'Defesa Soco Reto', 'Defesa Soco Gancho',
    'Queda para Trás', 'Queda Frente Suave', 'Queda Frente Dura', 'Queda Lateral', 
    'Rolamento Frente', 'Rolamento Trás'
  ];

  // 1. Buscar as atividades
  const activities = await prisma.activity.findMany({
    where: {
      type: 'TECHNIQUE',
      title: { in: activityTitles }
    }
  });

  console.log(`✅ Encontradas ${activities.length} atividades\n`);

  // 2. Para cada atividade, criar ou encontrar Technique correspondente
  const techniqueMap = new Map();
  let created = 0;
  let existing = 0;

  for (const activity of activities) {
    // Gerar slug
    const slug = activity.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Verificar se existe
    let technique = await prisma.technique.findUnique({
      where: { slug: slug }
    });

    if (!technique) {
      // Criar com TODOS os campos obrigatórios
      technique = await prisma.technique.create({
        data: {
          name: activity.title,
          slug: slug,
          description: activity.description || '',
          difficulty: 1,
          category: 'TECHNIQUE',
          objectives: [],
          prerequisites: [],
          resources: [],
          assessmentCriteria: [],
          risksMitigation: [],
          tags: [],
          references: [],
          instructions: [],
          stepByStep: [],
          bnccCompetencies: []
        }
      });
      console.log(`  ✓ Criada: ${technique.name}`);
      created++;
    } else {
      console.log(`  ⏭️  Já existe: ${technique.name}`);
      existing++;
    }

    techniqueMap.set(activity.title, technique);
  }

  console.log(`\n📊 Techniques: ${created} criadas, ${existing} já existiam\n`);

  // 3. Criar vínculos
  const categoryMapping = [
    { lessonNumber: 50, activities: ['Guarda de Boxe', 'Posição Ortodoxa', 'Posição Canhota', 'Shadow Boxing (Passo, Planos, Saltos)'] },
    { lessonNumber: 51, activities: ['Jab', 'Direto', 'Gancho Esquerdo/Direito', 'Uppercut Esquerdo/Direito'] },
    { lessonNumber: 52, activities: ['Jab + Direto', 'Jab + Gancho', 'Direto + Uppercut'] },
    { lessonNumber: 53, activities: ['Cotovelada Traseira', 'Cotovelada Lateral', 'Cotovelada Frontal', 'Cotovelada Uppercut', 'Cotovelada Martelo'] },
    { lessonNumber: 54, activities: ['Chute Reto', 'Chute Lateral', 'Chute Circular Baixo', 'Joelhada Frontal', 'Empurrão'] },
    { lessonNumber: 55, activities: ['Defesa Estrangulamento Dedos (Frontal)', 'Defesa Estrangulamento Joelho (Frontal)', 'Defesa Estrangulamento Empurrão (Frontal)', 'Defesa Estrangulamento Posterior', 'Defesa Estrangulamento Empurrão (Posterior)', 'Defesa Estrangulamento Lateral'] },
    { lessonNumber: 56, activities: ['Defesa Agarramento Frontal Não Agressivo', 'Defesa Agarramento Frontal Agressivo', 'Defesa Agarramento com Imobilização', 'Defesa Agarramento por Trás Externa', 'Defesa Agarramento por Trás Interna'] },
    { lessonNumber: 57, activities: ['Defesa 360°', 'Defesa 360° + Contra-ataque', 'Defesa Soco Reto', 'Defesa Soco Gancho'] },
    { lessonNumber: 58, activities: ['Queda para Trás', 'Queda Frente Suave', 'Queda Frente Dura', 'Queda Lateral', 'Rolamento Frente', 'Rolamento Trás'] }
  ];

  let links = 0;
  let skipped = 0;

  for (const cat of categoryMapping) {
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: { courseId: courseId, lessonNumber: cat.lessonNumber, isActive: true }
    });

    if (!lessonPlan) {
      console.log(`⚠️  Plano ${cat.lessonNumber} não encontrado`);
      continue;
    }

    console.log(`\n📚 Aula ${cat.lessonNumber}:`);

    let order = 1;
    for (const activityTitle of cat.activities) {
      const technique = techniqueMap.get(activityTitle);
      
      if (!technique) {
        console.log(`  ❌ Technique não encontrada: ${activityTitle}`);
        continue;
      }

      // Verificar se existe
      const existingLink = await prisma.lessonPlanTechniques.findUnique({
        where: {
          lessonPlanId_techniqueId: {
            lessonPlanId: lessonPlan.id,
            techniqueId: technique.id
          }
        }
      });

      if (existingLink) {
        console.log(`  ⏭️  ${activityTitle}`);
        skipped++;
        continue;
      }

      // Criar link
      await prisma.lessonPlanTechniques.create({
        data: {
          lessonPlanId: lessonPlan.id,
          techniqueId: technique.id,
          order: order,
          allocationMinutes: 10,
          objectiveMapping: []
        }
      });

      console.log(`  ✓ ${activityTitle}`);
      links++;
      order++;
    }
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📊 ${links} vínculos criados, ${skipped} já existiam`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
