// Limpa dados acadêmicos específicos antes de recriar
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clean() {
  console.log('🗑️ Limpando dados acadêmicos...');

  try {
    // Delete em ordem reversa devido às foreign keys
    await prisma.attendanceRecord.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.evaluationRecord.deleteMany();
    await prisma.studentCourse.deleteMany();
    await prisma.weeklyChallenge.deleteMany();
    await prisma.techniqueDetail.deleteMany();
    await prisma.lessonPlan.deleteMany({ where: { title: { contains: 'Aula' } } });
    await prisma.class.deleteMany({ where: { title: { contains: 'Turma' } } });
    await prisma.course.deleteMany({ where: { name: { contains: 'Krav Maga Faixa Branca' } } });

    console.log('✅ Dados acadêmicos limpos!');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();