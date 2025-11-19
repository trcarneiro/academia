const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';

  console.log('🔍 Verificando vínculos entre Curso → Planos → Atividades\n');

  // 1. Verificar curso
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    console.log('❌ Curso não encontrado!');
    return;
  }

  console.log('✅ Curso encontrado:', course.name);

  // 2. Verificar planos de aula do curso
  const lessonPlans = await prisma.lessonPlan.findMany({
    where: { 
      courseId: courseId,
      lessonNumber: { gte: 50, lte: 58 }
    },
    orderBy: { lessonNumber: 'asc' }
  });

  console.log(`✅ Planos de aula (50-58): ${lessonPlans.length}`);

  // 3. Para cada plano, verificar atividades vinculadas
  for (const plan of lessonPlans) {
    const activities = await prisma.lessonPlanActivity.findMany({
      where: { lessonPlanId: plan.id },
      include: { activity: true },
      orderBy: { ord: 'asc' }
    });

    console.log(`\n📚 Aula ${plan.lessonNumber}: ${plan.title}`);
    console.log(`   Atividades vinculadas: ${activities.length}`);
    
    if (activities.length > 0) {
      activities.forEach(lpa => {
        console.log(`   ✓ ${lpa.activity.title} (segment: ${lpa.segment})`);
      });
    } else {
      console.log('   ⚠️ Nenhuma atividade vinculada!');
    }
  }

  // 4. Verificar API de graduação (simular chamada)
  console.log('\n\n🎓 Simulando API /api/graduation/:studentId');
  
  const studentId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564'; // Pedro Teste
  
  // Verificar enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: studentId,
      courseId: courseId
    }
  });

  if (!enrollment) {
    console.log('❌ Aluno não matriculado no curso!');
    return;
  }

  console.log('✅ Aluno matriculado no curso');

  // Buscar atividades via lesson plans
  const courseActivities = await prisma.lessonPlanActivity.findMany({
    where: {
      lessonPlan: {
        courseId: courseId
      }
    },
    include: {
      activity: true,
      lessonPlan: true
    },
    orderBy: [
      { lessonPlan: { lessonNumber: 'asc' } },
      { ord: 'asc' }
    ]
  });

  console.log(`\n📊 Total de atividades vinculadas ao curso: ${courseActivities.length}`);

  if (courseActivities.length > 0) {
    console.log('\n✅ CURSO ESTÁ VINCULADO ÀS ATIVIDADES!');
    console.log('   Primeiras 5 atividades:');
    courseActivities.slice(0, 5).forEach(lpa => {
      console.log(`   - Aula ${lpa.lessonPlan.lessonNumber}: ${lpa.activity.title}`);
    });
  } else {
    console.log('\n❌ NENHUMA ATIVIDADE VINCULADA AO CURSO!');
  }

  // Verificar progresso do aluno
  const progress = await prisma.studentProgress.findMany({
    where: { studentId: studentId }
  });

  console.log(`\n📈 Progresso do aluno: ${progress.length} registros`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
