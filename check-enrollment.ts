import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnrollment() {
  const studentId = '93c60d89-c610-4948-87fc-23b0e7925ab1';
  
  console.log('🔍 Verificando matrícula do aluno:', studentId);
  
  // Check student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true
    }
  });
  
  console.log('\n👤 Aluno encontrado:', student?.user.firstName, student?.user.lastName);
  
  // Check ALL enrollments (without filter)
  const allEnrollments = await prisma.studentCourse.findMany({
    where: { studentId },
    include: {
      course: { select: { id: true, name: true } }
    }
  });
  
  console.log('\n📚 TODAS as matrículas (sem filtro):', allEnrollments.length);
  allEnrollments.forEach((e, i) => {
    console.log(`  ${i + 1}. Curso: ${e.course.name}`);
    console.log(`     Status: ${e.status}, isActive: ${e.isActive}`);
    console.log(`     StartDate: ${e.startDate}`);
    console.log(`     ClassId: ${e.classId || 'null'}`);
  });
  
  // Check ACTIVE enrollments only
  const activeEnrollments = await prisma.studentCourse.findMany({
    where: { 
      studentId,
      status: 'ACTIVE'
    },
    include: {
      course: { select: { id: true, name: true } }
    }
  });
  
  console.log('\n✅ Matrículas ATIVAS (status=ACTIVE):', activeEnrollments.length);
  activeEnrollments.forEach((e, i) => {
    console.log(`  ${i + 1}. Curso: ${e.course.name}`);
  });
  
  await prisma.$disconnect();
}

checkEnrollment().catch(console.error);
