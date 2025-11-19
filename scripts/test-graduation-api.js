const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const studentId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564'; // Pedro Teste
  const courseId = 'krav-maga-faixa-branca-2025';

  console.log('🎓 Simulando API /api/graduation/student/:id/detailed-progress\n');

  // 1. Buscar aluno e matrícula
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      studentCourses: {
        where: { courseId: courseId },
        include: { course: true }
      }
    }
  });

  if (!student || student.studentCourses.length === 0) {
    console.log('❌ Aluno não encontrado ou não matriculado');
    return;
  }

  const enrollment = student.studentCourses[0];
  const course = enrollment.course;

  console.log('✅ Aluno:', student.user.firstName, student.user.lastName);
  console.log('✅ Curso:', course.name);

  // 2. Buscar atividades do curso via LessonPlanActivity
  const lessonActivities = await prisma.lessonPlanActivity.findMany({
    where: {
      lessonPlan: {
        courseId: course.id
      }
    },
    include: {
      activity: {
        select: {
          title: true,
          type: true
        }
      },
      lessonPlan: {
        select: {
          lessonNumber: true,
          title: true
        }
      }
    },
    orderBy: [
      { lessonPlan: { lessonNumber: 'asc' } },
      { ord: 'asc' }
    ]
  });

  console.log(`\n📋 Atividades encontradas no curso: ${lessonActivities.length}`);

  if (lessonActivities.length > 0) {
    console.log('\n✅ SUCESSO! As atividades ESTÃO vinculadas ao curso!\n');
    console.log('Primeiras 10 atividades:');
    lessonActivities.slice(0, 10).forEach((lpa, idx) => {
      console.log(`  ${idx + 1}. Aula ${lpa.lessonPlan.lessonNumber}: ${lpa.activity.title}`);
    });
    console.log('  ...');
  } else {
    console.log('\n❌ NENHUMA atividade encontrada!');
  }

  // 3. Buscar progresso do aluno
  const studentProgress = await prisma.studentProgress.findMany({
    where: {
      studentId: studentId,
      courseId: course.id
    }
  });

  console.log(`\n📈 Progresso do aluno: ${studentProgress.length} registros`);

  // 4. Calcular estatísticas
  const totalActivities = lessonActivities.length;
  const completedActivities = lessonActivities.filter((lpa) => {
    const progress = studentProgress.find(
      (p) => 
        p.lessonNumber === lpa.lessonPlan.lessonNumber && 
        p.activityName === lpa.activity.title
    );
    const target = lpa.minimumForGraduation || 0;
    return progress && progress.completedReps >= target;
  }).length;

  const progressPercentage = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  console.log('\n📊 Estatísticas:');
  console.log(`  Total de atividades: ${totalActivities}`);
  console.log(`  Atividades concluídas: ${completedActivities}`);
  console.log(`  Progresso: ${progressPercentage}%`);

  // 5. Simular resposta da API
  console.log('\n📦 Resposta da API (simplificada):');
  console.log(JSON.stringify({
    success: true,
    data: {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        beltLevel: student.beltLevel || 'white'
      },
      courseName: course.name,
      progressPercentage: progressPercentage,
      activities: lessonActivities.length,
      availableActivities: lessonActivities.length
    }
  }, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
