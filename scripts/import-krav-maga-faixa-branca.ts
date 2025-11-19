/**
 * Script para importar técnicas do Krav Maga Faixa Branca
 * - Cria atividades (Activity) a partir do JSON
 * - Cria planos de aula (LessonPlan) organizados por categoria
 * - Associa atividades aos planos de aula (LessonPlanActivity)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TechniqueJson {
  id: string;
  type: 'TECHNIQUE';
  title: string;
  description: string;
  equipment: string[];
  safety: string;
  adaptations: string[];
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  refTechniqueId: string[];
  defaultParams: {
    repetitions: {
      'Adulto Masculino': number;
      'Adulto Feminino': number;
    };
    duration: string;
    precision: string;
  };
}

// Mapeamento de categorias por prefixo do ID
const CATEGORY_MAP: Record<string, string> = {
  'postura-': 'Postura e Movimentação',
  'soco-': 'Socos',
  'combinacao-': 'Combinações',
  'cotovelada-': 'Cotoveladas',
  'chute-': 'Chutes e Joelhadas',
  'defesa-estrangulamento-': 'Defesa - Estrangulamento',
  'defesa-agarramento-': 'Defesa - Agarramento',
  'defesa-geral-': 'Defesa - Geral',
  'queda-': 'Quedas e Rolamentos',
  'rolamento-': 'Quedas e Rolamentos',
};

function getCategoryFromId(id: string): string {
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (id.startsWith(prefix)) {
      return category;
    }
  }
  return 'Outros';
}

async function main() {
  console.log('🥋 Importando técnicas do Krav Maga Faixa Branca...\n');

  // 1. Buscar organização Smart Defence
  const organization = await prisma.organization.findFirst({
    where: {
      name: {
        contains: 'Smart Defence',
        mode: 'insensitive',
      },
    },
  });

  if (!organization) {
    console.error('❌ Organização Smart Defence não encontrada');
    return;
  }

  console.log(`✅ Organização: ${organization.name} (${organization.id})\n`);

  // 2. Buscar curso "Krav Maga - Faixa Branca"
  const course = await prisma.course.findFirst({
    where: {
      name: {
        contains: 'Faixa Branca',
        mode: 'insensitive',
      },
      organizationId: organization.id,
    },
  });

  if (!course) {
    console.error('❌ Curso "Krav Maga - Faixa Branca" não encontrado');
    return;
  }

  console.log(`✅ Curso: ${course.name} (${course.id})\n`);

  // 3. Ler JSON de técnicas
  const jsonPath = path.join(
    process.cwd(),
    'cursos',
    'Tecnicas_Krav_Maga_Faixa_Branca.json'
  );

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo não encontrado: ${jsonPath}`);
    return;
  }

  const techniques: TechniqueJson[] = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8')
  );

  console.log(`📚 Lidas ${techniques.length} técnicas do JSON\n`);

  // 4. Agrupar técnicas por categoria
  const techniquesByCategory: Record<string, TechniqueJson[]> = {};

  for (const tech of techniques) {
    const category = getCategoryFromId(tech.id);
    if (!techniquesByCategory[category]) {
      techniquesByCategory[category] = [];
    }
    techniquesByCategory[category].push(tech);
  }

  console.log('📊 Técnicas por categoria:');
  for (const [category, techs] of Object.entries(techniquesByCategory)) {
    console.log(`  - ${category}: ${techs.length} técnicas`);
  }
  console.log('');

  // 5. Criar/atualizar atividades (Activity)
  console.log('🔨 Criando atividades no banco...\n');

  const activityMap = new Map<string, string>(); // techId -> activityId

  for (const tech of techniques) {
    try {
      const activity = await prisma.activity.upsert({
        where: {
          organizationId_title: {
            organizationId: organization.id,
            title: tech.title,
          },
        },
        create: {
          organizationId: organization.id,
          title: tech.title,
          type: 'TECHNIQUE',
          description: tech.description,
          videoUrl: null,
          imageUrl: null,
          instructions: JSON.stringify({
            equipment: tech.equipment,
            safety: tech.safety,
            adaptations: tech.adaptations,
          }),
        },
        update: {
          description: tech.description,
          instructions: JSON.stringify({
            equipment: tech.equipment,
            safety: tech.safety,
            adaptations: tech.adaptations,
          }),
        },
      });

      activityMap.set(tech.id, activity.id);
      console.log(`  ✓ ${tech.title} (${activity.id})`);
    } catch (error) {
      console.error(`  ❌ Erro ao criar ${tech.title}:`, error);
    }
  }

  console.log(`\n✅ ${activityMap.size} atividades criadas/atualizadas\n`);

  // 6. Criar planos de aula (LessonPlan) - um por categoria
  console.log('📝 Criando planos de aula...\n');

  let lessonNumber = 1;
  const lessonPlanMap = new Map<string, string>(); // category -> lessonPlanId

  for (const [category, techs] of Object.entries(techniquesByCategory)) {
    try {
      const lessonPlan = await prisma.lessonPlan.upsert({
        where: {
          courseId_lessonNumber: {
            courseId: course.id,
            lessonNumber,
          },
        },
        create: {
          courseId: course.id,
          lessonNumber,
          title: category,
          description: `Aula dedicada a ${category.toLowerCase()}`,
          durationMinutes: 60,
          objectives: techs.map((t) => t.title).join(', '),
          prerequisites: null,
        },
        update: {
          title: category,
          description: `Aula dedicada a ${category.toLowerCase()}`,
          objectives: techs.map((t) => t.title).join(', '),
        },
      });

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
        await prisma.lessonPlanActivity.upsert({
          where: {
            lessonPlanId_activityId: {
              lessonPlanId,
              activityId,
            },
          },
          create: {
            lessonPlanId,
            activityId,
            ord: i + 1,
            minimumForGraduation: tech.defaultParams.repetitions['Adulto Masculino'],
            isRequired: true,
          },
          update: {
            ord: i + 1,
            minimumForGraduation: tech.defaultParams.repetitions['Adulto Masculino'],
          },
        });

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
  console.log('   3. Ver todas as atividades do curso listadas\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
