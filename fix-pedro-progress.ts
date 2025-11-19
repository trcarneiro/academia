import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPedroProgress() {
  console.log('\n===== CORRIGINDO PROGRESSO DO PEDRO =====\n');
  
  // Find Pedro
  const pedro = await prisma.student.findFirst({
    where: {
      registrationNumber: '2025001'
    }
  });

  if (!pedro) {
    console.log('❌ Pedro não encontrado!');
    return;
  }

  console.log(`✅ Pedro encontrado: ${pedro.id}`);

  // Get enrollment
  const enrollment = await prisma.studentCourse.findFirst({
    where: {
      studentId: pedro.id,
      status: 'ACTIVE',
      isActive: true,
    },
    orderBy: { startDate: 'desc' },
  });

  if (!enrollment) {
    console.log('❌ Pedro não tem matrícula ativa!');
    return;
  }

  console.log(`📚 Curso: ${enrollment.courseId}`);

  // Update all progress to 100% completion
  const updateProgress = await prisma.studentProgress.updateMany({
    where: {
      studentId: pedro.id,
      courseId: enrollment.courseId,
    },
    data: {
      completionPercentage: 100,
      updatedAt: new Date(),
    },
  });

  console.log(`\n✅ Atualizadas ${updateProgress.count} atividades para 100%`);

  // Update all qualitative assessments to 8.0 (good rating)
  const updateQual = await prisma.qualitativeAssessment.updateMany({
    where: {
      studentProgress: {
        studentId: pedro.id,
        courseId: enrollment.courseId,
      },
    },
    data: {
      rating: 8.0,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Atualizadas ${updateQual.count} avaliações para 8.0/10`);

  // Verify
  const allProgress = await prisma.studentProgress.findMany({
    where: {
      studentId: pedro.id,
      courseId: enrollment.courseId,
    },
  });

  const completedActivities = allProgress.filter(
    (p) => p.completionPercentage >= 100
  ).length;

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

  const percentage =
    allProgress.length > 0 ? (completedActivities / allProgress.length) * 100 : 0;

  console.log(`\n📊 RESULTADO:`);
  console.log(`   Total atividades: ${allProgress.length}`);
  console.log(`   Completas: ${completedActivities}`);
  console.log(`   Percentual: ${percentage.toFixed(1)}%`);
  console.log(`   Média: ${averageRating.toFixed(1)}/10`);
  console.log(`   Elegível para graduação: ${percentage >= 80 && averageRating >= 7.0 ? '✅ SIM' : '❌ NÃO'}`);

  await prisma.$disconnect();
}

fixPedroProgress().catch(console.error);
