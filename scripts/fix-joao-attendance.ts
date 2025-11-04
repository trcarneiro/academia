import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixJoaoAttendance() {
  console.log('🔧 Corrigindo presença do João Silva...\n');

  try {
    // Buscar dados
    const turma = await prisma.turma.findFirst();
    const student = await prisma.student.findFirst({
      where: { user: { email: 'joao@academia.demo' } },
      include: { user: true }
    });

    if (!student) {
      console.error('❌ Aluno não encontrado');
      return;
    }

    const turmaStudent = await prisma.turmaStudent.findFirst({
      where: { 
        turmaId: turma!.id, 
        studentId: student.id 
      }
    });

    if (!turmaStudent) {
      console.error('❌ TurmaStudent não encontrado');
      return;
    }

    const lessons = await prisma.turmaLesson.findMany({
      where: { turmaId: turma!.id },
      take: 3
    });

    let added = 0;
    for (const lesson of lessons) {
      const existing = await prisma.turmaAttendance.findFirst({
        where: {
          turmaLessonId: lesson.id,
          studentId: student.id
        }
      });

      if (!existing) {
        await prisma.turmaAttendance.create({
          data: {
            turmaId: turma!.id,
            turmaLessonId: lesson.id,
            turmaStudentId: turmaStudent.id,
            studentId: student.id,
            present: true,
            notes: 'Seed correction'
          }
        });
        added++;
      }
    }

    console.log(`✅ ${added} presença(s) adicionada(s) para ${student.user.firstName}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixJoaoAttendance();
