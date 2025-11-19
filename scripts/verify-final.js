const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';

  console.log('📊 Verificando vínculos em CourseTechnique\n');

  const courseTechniques = await prisma.courseTechnique.findMany({
    where: { courseId },
    include: { 
      technique: { 
        select: { name: true } 
      } 
    },
    orderBy: { orderIndex: 'asc' }
  });

  console.log(`✅ Total de técnicas vinculadas ao curso: ${courseTechniques.length}\n`);

  if (courseTechniques.length > 0) {
    console.log('📋 Primeiras 10 técnicas:');
    courseTechniques.slice(0, 10).forEach((ct, i) => {
      console.log(`  ${i + 1}. ${ct.technique.name}`);
    });
    
    if (courseTechniques.length > 10) {
      console.log(`  ... e mais ${courseTechniques.length - 10} técnicas`);
    }
  }

  console.log('\n📊 Verificando vínculos em LessonPlanTechniques (aulas 50-58)\n');

  const lessonTechniques = await prisma.lessonPlanTechniques.findMany({
    where: {
      lessonPlan: {
        order: { gte: 50, lte: 58 }
      }
    },
    include: {
      technique: { select: { name: true } },
      lessonPlan: { select: { order: true, title: true } }
    }
  });

  console.log(`✅ Total de técnicas vinculadas nas aulas 50-58: ${lessonTechniques.length}`);

  console.log('\n✅ Estrutura completa:');
  console.log(`   CourseTechnique: ${courseTechniques.length} técnicas (lista geral do curso)`);
  console.log(`   LessonPlanTechniques: ${lessonTechniques.length} técnicas (atribuídas em aulas)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
