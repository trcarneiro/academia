const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';

  console.log('🔍 Testando dados para módulo de Cursos\n');

  // Simular exatamente o que a API faz
  const lessonPlans = await prisma.lessonPlan.findMany({
    where: { courseId: courseId },
    include: {
      techniqueLinks: {
        include: {
          technique: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              difficulty: true,
              description: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { lessonNumber: 'asc' }
  });

  console.log(`📚 Total de planos de aula: ${lessonPlans.length}\n`);

  // Filtrar apenas aulas 50-58
  const aulas5058 = lessonPlans.filter(lp => lp.lessonNumber >= 50 && lp.lessonNumber <= 58);
  
  console.log(`📚 Planos de aula 50-58: ${aulas5058.length}\n`);

  // Verificar técnicas vinculadas
  let totalTechniques = 0;
  aulas5058.forEach(lesson => {
    console.log(`📖 Aula ${lesson.lessonNumber}: ${lesson.title}`);
    console.log(`   Técnicas vinculadas: ${lesson.techniqueLinks.length}`);
    
    if (lesson.techniqueLinks.length > 0) {
      lesson.techniqueLinks.forEach(link => {
        console.log(`     ✓ ${link.technique.name}`);
      });
    } else {
      console.log(`     ⚠️ NENHUMA TÉCNICA VINCULADA!`);
    }
    console.log('');
    totalTechniques += lesson.techniqueLinks.length;
  });

  console.log(`\n📊 Total de técnicas vinculadas nas aulas 50-58: ${totalTechniques}\n`);

  if (totalTechniques === 0) {
    console.log('❌ PROBLEMA: Nenhuma técnica vinculada!\n');
    console.log('Verificando tabela LessonPlanTechniques...\n');
    
    const allLinks = await prisma.lessonPlanTechniques.findMany({
      include: {
        lessonPlan: {
          select: {
            lessonNumber: true,
            courseId: true
          }
        },
        technique: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Total de links na tabela: ${allLinks.length}`);
    
    const linksForCourse = allLinks.filter(link => link.lessonPlan.courseId === courseId);
    console.log(`Links para este curso: ${linksForCourse.length}`);
    
    if (linksForCourse.length > 0) {
      console.log('\nPrimeiros 5 links:');
      linksForCourse.slice(0, 5).forEach(link => {
        console.log(`  - Aula ${link.lessonPlan.lessonNumber}: ${link.technique.name}`);
      });
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
