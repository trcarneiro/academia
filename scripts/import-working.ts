import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TechniqueData {
  id: string;
  title: string;
  description: string;
  equipment: string[];
  safety: string;
  adaptations: string[];
  defaultParams: {
    'Adulto Masculino': number;
    'Adulto Feminino': number;
    'Adolescente': number;
    'Infantil': number;
  };
}

async function main() {
  console.log('🚀 Iniciando importação de técnicas do Krav Maga - Faixa Branca\n');

  // 1. Validar organização
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new Error(`Organização ${organizationId} não encontrada`);
  }
  console.log(`✅ Organização: ${organization.name} (${organization.id})`);

  // 2. Validar curso POR NOME (não por slug!)
  const courseName = 'Krav Maga - Faixa Branca';
  const course = await prisma.course.findFirst({
    where: {
      name: courseName,
      organizationId: organization.id,
    },
  });

  if (!course) {
    throw new Error(`Curso "${courseName}" não encontrado`);
  }
  console.log(`✅ Curso: ${course.name} (${course.id})\n`);

  // 3. Ler JSON
  const jsonPath = path.join(__dirname, '..', 'cursos', 'Tecnicas_Krav_Maga_Faixa_Branca.json');
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const techniques: TechniqueData[] = jsonData.techniques;

  console.log(`📚 Lidas ${techniques.length} técnicas do JSON\n`);

  // 4. Mapear categorias por prefixo ID
  const categoryMap: Record<string, { name: string; lessonNumber: number }> = {
    'TB-Postura': { name: 'Postura e Movimentação', lessonNumber: 1 },
    'TB-Socos': { name: 'Socos', lessonNumber: 2 },
    'TB-Combinacoes': { name: 'Combinações de Socos', lessonNumber: 3 },
    'TB-Cotoveladas': { name: 'Cotoveladas', lessonNumber: 4 },
    'TB-Chutes': { name: 'Chutes', lessonNumber: 5 },
    'TB-Defesa-Estrangulamento': { name: 'Defesas - Estrangulamento', lessonNumber: 6 },
    'TB-Defesa-Agarramento': { name: 'Defesas - Agarramento', lessonNumber: 7 },
    'TB-Defesa-Geral': { name: 'Defesas - Ataques Gerais', lessonNumber: 8 },
    'TB-Quedas': { name: 'Quedas e Rolamentos', lessonNumber: 9 },
  };

  // Agrupar técnicas por categoria
  const techniquesByCategory: Record<string, TechniqueData[]> = {};
  for (const tech of techniques) {
    const prefix = tech.id.split('-').slice(0, 2).join('-');
    if (!techniquesByCategory[prefix]) {
      techniquesByCategory[prefix] = [];
    }
    techniquesByCategory[prefix].push(tech);
  }

  console.log('🔨 Criando atividades no banco...\n');

  // 5. Criar atividades (SEM videoUrl/imageUrl!)
  const activitiesCreated: Record<string, string> = {};
  let activityCount = 0;

  for (const tech of techniques) {
    try {
      let activity = await prisma.activity.findFirst({
        where: {
          organizationId: organization.id,
          title: tech.title,
        },
      });

      if (activity) {
        activity = await prisma.activity.update({
          where: { id: activity.id },
          data: {
            description: tech.description,
            instructions: JSON.stringify({
              equipment: tech.equipment,
              safety: tech.safety,
              adaptations: tech.adaptations,
            }),
          },
        });
      } else {
        activity = await prisma.activity.create({
          data: {
            organizationId: organization.id,
            title: tech.title,
            type: 'TECHNIQUE',
            description: tech.description,
            instructions: JSON.stringify({
              equipment: tech.equipment,
              safety: tech.safety,
              adaptations: tech.adaptations,
            }),
          },
        });
      }

      activitiesCreated[tech.id] = activity.id;
      activityCount++;
      console.log(`  ✓ ${tech.title}`);
    } catch (error: any) {
      console.error(`  ❌ ${tech.title}:`, error.message);
    }
  }

  console.log(`\n✅ ${activityCount} atividades criadas\n`);

  // 6. Criar planos de aula
  console.log('📝 Criando planos de aula...\n');

  const lessonPlansCreated: Record<string, string> = {};
  let lessonPlanCount = 0;

  for (const [prefix, category] of Object.entries(categoryMap)) {
    try {
      let lessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          courseId: course.id,
          lessonNumber: category.lessonNumber,
          isActive: true,
        },
      });

      if (!lessonPlan) {
        lessonPlan = await prisma.lessonPlan.create({
          data: {
            courseId: course.id,
            title: category.name,
            lessonNumber: category.lessonNumber,
            weekNumber: Math.ceil(category.lessonNumber / 2),
            duration: 90,
            level: 'Faixa Branca',
            difficulty: 'beginner',
            equipment: ['Tatame', 'Luvas de boxe'],
            isActive: true,
            activities: {},
            warmup: {},
            techniques: {},
            simulations: {},
            cooldown: {},
          },
        });
      }

      lessonPlansCreated[prefix] = lessonPlan.id;
      lessonPlanCount++;
      console.log(`  ✓ Aula ${category.lessonNumber}: ${category.name}`);
    } catch (error: any) {
      console.error(`  ❌ ${category.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${lessonPlanCount} planos criados\n`);

  // 7. Associar atividades
  console.log('🔗 Associando atividades...\n');

  let associationCount = 0;

  for (const [prefix, techList] of Object.entries(techniquesByCategory)) {
    const lessonPlanId = lessonPlansCreated[prefix];
    if (!lessonPlanId) continue;

    let order = 1;
    for (const tech of techList) {
      const activityId = activitiesCreated[tech.id];
      if (!activityId) continue;

      try {
        const existing = await prisma.lessonPlanActivity.findFirst({
          where: { lessonPlanId, activityId },
        });

        if (!existing) {
          await prisma.lessonPlanActivity.create({
            data: {
              lessonPlanId,
              activityId,
              ord: order,
              segment: 'TECHNIQUES',
              minimumForGraduation: tech.defaultParams['Adulto Masculino'],
            },
          });
          associationCount++;
          console.log(`  ✓ ${tech.title}`);
        }
        order++;
      } catch (error: any) {
        console.error(`  ❌ ${tech.title}:`, error.message);
      }
    }
  }

  console.log(`\n✅ ${associationCount} associações criadas\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Atividades: ${activityCount}`);
  console.log(`✅ Planos: ${lessonPlanCount}`);
  console.log(`✅ Associações: ${associationCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
