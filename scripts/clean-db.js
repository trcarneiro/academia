// Clean database before seeding
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clean() {
  console.log('🗑️ Limpando banco de dados...');

  try {
    // Delete in reverse order due to foreign keys
    await prisma.courseTechnique.deleteMany();
    await prisma.studentAchievement.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.techniqueProgress.deleteMany();
    await prisma.technique.deleteMany();
    await prisma.courseEnrollment.deleteMany();
    await prisma.course.deleteMany();
    await prisma.student.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.martialArt.deleteMany();
    await prisma.organizationSettings.deleteMany();
    await prisma.organization.deleteMany();

    console.log('✅ Banco de dados limpo!');
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();