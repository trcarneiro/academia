import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTurmaStudents() {
  const students = await prisma.turmaStudent.findMany({
    include: {
      student: {
        include: {
          user: true
        }
      }
    }
  });

  console.log('📋 TurmaStudents encontrados:');
  for (const ts of students) {
    console.log(`   - ${ts.student.user.firstName} ${ts.student.user.lastName}`);
  }

  await prisma.$disconnect();
}

checkTurmaStudents();
