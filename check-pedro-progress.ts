import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPedroProgress() {
  console.log('\n===== VERIFICANDO PROGRESSO DO PEDRO =====\n');
  
  // Find Pedro
  const pedro = await prisma.student.findFirst({
    where: {
      registrationNumber: '2025001'
    },
    include: {
      user: true
    }
  });

  if (!pedro) {
    console.log('❌ Pedro não encontrado!');
    return;
  }

  console.log(`✅ Pedro encontrado: ${pedro.user.firstName} ${pedro.user.lastName}`);
  console.log(`   ID: ${pedro.id}`);

  // Check enrollment
  const enrollment = await prisma.studentCourse.findFirst({
    where: {
      studentId: pedro.id,
      status: 'ACTIVE',
      isActive: true,
    },
    include: {
      course: true
    },
    orderBy: { startDate: 'desc' },
  });

  if (!enrollment) {
    console.log('\n❌ Pedro não está matriculado em nenhum curso ativo!');
    return;
  }

  console.log(`\n📚 Curso: ${enrollment.course.name}`);
  console.log(`   ID do Curso: ${enrollment.courseId}`);

  // Check progress
  const allProgress = await prisma.studentProgress.findMany({
    where: {
      studentId: pedro.id,
      courseId: enrollment.courseId,
    },
  });

  console.log(`\n📊 Progresso:`);
  console.log(`   Total de atividades registradas: ${allProgress.length}`);

  const completedActivities = allProgress.filter(
    (p) => p.completionPercentage >= 100
  ).length;

  console.log(`   Atividades completas: ${completedActivities}`);
  console.log(`   Atividades incompletas: ${allProgress.length - completedActivities}`);

  if (allProgress.length > 0) {
    console.log(`\n   Primeiras 5 atividades:`);
    allProgress.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. Atividade ID: ${p.activityId}`);
      console.log(`      Completude: ${p.completionPercentage}%`);
      console.log(`      Updated: ${p.updatedAt.toISOString()}`);
    });
  }

  // Check qualitative assessments
  const qualAssessments = await prisma.qualitativeAssessment.findMany({
    where: {
      studentProgress: {
        studentId: pedro.id,
        courseId: enrollment.courseId
      }
    }
  });

  const averageRating =
    qualAssessments.length > 0
      ? qualAssessments.reduce((sum, a) => sum + a.rating, 0) / qualAssessments.length
      : 0;

  console.log(`\n⭐ Avaliações:`);
  console.log(`   Total de avaliações: ${qualAssessments.length}`);
  console.log(`   Média: ${averageRating.toFixed(1)}/10`);

  // Calculate percentage
  const percentage =
    allProgress.length > 0 ? (completedActivities / allProgress.length) * 100 : 0;
  
  console.log(`\n📈 Resumo:`);
  console.log(`   Percentual completo: ${percentage.toFixed(1)}%`);
  console.log(`   Elegível para graduação: ${percentage >= 80 && averageRating >= 7.0 ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   Faltam: ${allProgress.length - completedActivities} atividades`);

  await prisma.$disconnect();
}

checkPedroProgress().catch(console.error);
