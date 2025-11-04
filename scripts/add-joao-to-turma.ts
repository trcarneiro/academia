import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addJoaoToTurma() {
  console.log('🔧 Adicionando João Silva à turma...\n');

  try {
    const turma = await prisma.turma.findFirst();
    const student = await prisma.student.findFirst({
      where: { user: { email: 'joao@academia.demo' } },
      include: { user: true }
    });

    if (!student || !turma) {
      console.error('❌ Dados não encontrados');
      return;
    }

    // 1. Adicionar à turma (TurmaStudent)
    const turmaStudent = await prisma.turmaStudent.create({
      data: {
        turmaId: turma.id,
        studentId: student.id,
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      }
    });
    console.log(`✅ ${student.user.firstName} adicionado à turma "${turma.name}"`);

    // 2. Criar presenças
    const lessons = await prisma.turmaLesson.findMany({
      where: { turmaId: turma.id },
      take: 3
    });

    for (const lesson of lessons) {
      await prisma.turmaAttendance.create({
        data: {
          turmaId: turma.id,
          turmaLessonId: lesson.id,
          turmaStudentId: turmaStudent.id,
          studentId: student.id,
          present: true,
          notes: 'Seed correction - João'
        }
      });
    }
    console.log(`✅ ${lessons.length} presença(s) registrada(s)`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addJoaoToTurma();
