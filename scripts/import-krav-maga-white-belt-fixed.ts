/**
 * Script de Importação: Técnicas de Krav Maga - Faixa Branca
 * 
 * IMPORTANTE: Este script usa findFirst + create/update pois os modelos não têm
 * unique constraints compostos necessários para upsert.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Technique {
  id: string;
  title: string;
  description: string;
  equipment?: string[];
  safety?: string;
  adaptations?: string[];
  defaultParams: {
    repetitions: {
      'Adulto Masculino': number;
      'Adulto Feminino': number;
      'Infantil': number;
    };
  };
}

async function main() {
  console.log('🚀 Iniciando importação de técnicas Krav Maga - Faixa Branca\n');

  // 1. Verificar organização
  const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new Error(`❌ Organização não encontrada: ${organizationId}`);
  }

  console.log(`✅ Organização: ${organization.name} (${organization.id})\n`);

  // 2. Verificar curso
  const courseId = 'krav-maga-faixa-branca-2025';
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error(`❌ Curso não encontrado: ${courseId}`);
  }

  console.log(`✅ Curso: ${course.name} (${course.id})\n`);

  // 3. Ler JSON
  const jsonPath = path.join(__dirname, '..', 'cursos', 'Tecnicas_Krav_Maga_Faixa_Branca.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`❌ Arquivo JSON não encontrado: ${jsonPath}`);
  }

  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const techniques: Technique[] = JSON.parse(jsonContent);

  console.log(`📚 Lidas ${techniques.length} técnicas do JSON\n`);

  // 4. Agrupar técnicas por categoria (usando prefixo do ID)
  const categoryMapping: Record<string, string> = {
    '1': 'Postura e Movimentação',
    '2': 'Socos',
    '3': 'Combinações',
    '4': 'Cotoveladas',
    '5': 'Chutes e Joelhadas',
    '6': 'Defesa - Estrangulamento',
    '7': 'Defesa - Agarramento',
    '8': 'Defesa - Geral',
    '9': 'Quedas e Rolamentos',
  };

  const techniquesByCategory: Record<string, Technique[]> = {};

  for (const tech of techniques) {
    const prefix = tech.id.split('-')[0];
    const category = categoryMapping[prefix] || 'Outros';

    if (!techniquesByCategory[category]) {
      techniquesByCategory[category] = [];
    }

    techniquesByCategory[category].push(tech);
  }

  // 5. Criar/atualizar atividades (Activity)
  console.log('🔨 Criando atividades no banco...\n');

  const activityMap = new Map<string, string>(); // techId -> activityId

  for (const tech of techniques) {
    try {
      // Activity NÃO tem unique constraint, fazemos findFirst + create/update manual
      let activity = await prisma.activity.findFirst({
        where: {
          organizationId: organization.id,
          title: tech.title,
        },
      });

      const activityData = {
        description: tech.description,
        instructions: JSON.stringify({
          equipment: tech.equipment || [],
          safety: tech.safety || '',
          adaptations: tech.adaptations || [],
        }),
      };

      if (activity) {
        // Atualizar existente
        activity = await prisma.activity.update({
          where: { id: activity.id },
          data: activityData,
        });
      } else {
        // Criar novo
        activity = await prisma.activity.create({
          data: {
            organizationId: organization.id,
            title: tech.title,
            type: 'TECHNIQUE',
            videoUrl: null,
            imageUrl: null,
            ...activityData,
          },
        });
      }

      activityMap.set(tech.id, activity.id);
      console.log(`  ✓ ${tech.title} (${activity.id})`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar ${tech.title}:`, error);
    }
  }

  console.log(`\n✅ ${activityMap.size} atividades criadas/atualizadas\n`);

  // 6. Criar planos de aula (LessonPlan)
  console.log('📝 Criando planos de aula...\n');

  const lessonPlanMap = new Map<string, string>(); // category -> lessonPlanId
  let lessonNumber = 1;

  for (const [category, techs] of Object.entries(techniquesByCategory)) {
    try {
      // LessonPlan tem unique em [courseId, lessonNumber, isActive]
      let lessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          courseId: course.id,
          lessonNumber,
          isActive: true,
        },
      });

      const lessonData = {
        title: category,
        description: `Aula dedicada a ${category.toLowerCase()}`,
        objectives: techs.map((t) => t.title),
      };

      if (lessonPlan) {
        // Atualizar existente
        lessonPlan = await prisma.lessonPlan.update({
          where: { id: lessonPlan.id },
          data: lessonData,
        });
      } else {
        // Criar novo
        lessonPlan = await prisma.lessonPlan.create({
          data: {
            courseId: course.id,
            lessonNumber,
            weekNumber: lessonNumber,
            duration: 60,
            level: 1,
            difficulty: 1,
            isActive: true,
            equipment: [],
            activities: [],
            warmup: {},
            techniques: {},
            simulations: {},
            cooldown: {},
            ...lessonData,
          },
        });
      }

      lessonPlanMap.set(category, lessonPlan.id);
      console.log(`  ✓ Aula ${lessonNumber}: ${category} (${lessonPlan.id})`);

      lessonNumber++;
    } catch (error) {
      console.error(`  ❌ Erro ao criar aula ${category}:`, error);
    }
  }

  console.log(`\n✅ ${lessonPlanMap.size} planos de aula criados\n`);

  // 7. Associar atividades aos planos de aula (LessonPlanActivity)
  console.log('🔗 Associando atividades aos planos de aula...\n');

  let associationCount = 0;

  for (const [category, techs] of Object.entries(techniquesByCategory)) {
    const lessonPlanId = lessonPlanMap.get(category);
    if (!lessonPlanId) continue;

    for (let i = 0; i < techs.length; i++) {
      const tech = techs[i];
      const activityId = activityMap.get(tech.id);
      if (!activityId) continue;

      try {
        // LessonPlanActivity requer campo 'segment' (enum)
        const existing = await prisma.lessonPlanActivity.findFirst({
          where: {
            lessonPlanId,
            activityId,
          },
        });

        if (existing) {
          await prisma.lessonPlanActivity.update({
            where: { id: existing.id },
            data: {
              ord: i + 1,
              minimumForGraduation: tech.defaultParams.repetitions['Adulto Masculino'],
            },
          });
        } else {
          await prisma.lessonPlanActivity.create({
            data: {
              lessonPlanId,
              activityId,
              segment: 'TECHNIQUES', // ← Campo obrigatório (enum: WARMUP, TECHNIQUES, SIMULATIONS, COOLDOWN)
              ord: i + 1,
              minimumForGraduation: tech.defaultParams.repetitions['Adulto Masculino'],
            },
          });
        }

        associationCount++;
        console.log(`  ✓ ${tech.title} → ${category} (ordem ${i + 1})`);
      } catch (error) {
        console.error(`  ❌ Erro ao associar ${tech.title}:`, error);
      }
    }
  }

  console.log(`\n✅ ${associationCount} associações criadas\n`);

  // 8. Resumo final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Atividades: ${activityMap.size}`);
  console.log(`✅ Planos de Aula: ${lessonPlanMap.size}`);
  console.log(`✅ Associações: ${associationCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎉 Importação concluída com sucesso!\n');
  console.log('👉 Agora você pode:');
  console.log('   1. Acessar o módulo de Graduação');
  console.log('   2. Clicar no aluno "Pedro Teste"');
  console.log('   3. Ver todas as atividades do curso listadas');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
