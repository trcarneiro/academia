import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PEDRO_ID = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

console.log('🔍 Verificando por que Pedro não vê as turmas...\n');

try {
  // 1. Verificar se Pedro existe e está ativo
  const pedro = await prisma.student.findUnique({
    where: { id: PEDRO_ID },
    include: {
      user: true
    }
  });
  
  console.log('👤 PEDRO TESTE:');
  console.log(`   ID: ${pedro.id}`);
  console.log(`   Nome: ${pedro.user.name}`);
  console.log(`   Status: ${pedro.status}`);
  console.log(`   Organization: ${pedro.organizationId}`);
  console.log('');
  
  // 2. Verificar matrículas do Pedro (TurmaStudent)
  const enrollments = await prisma.turmaStudent.findMany({
    where: {
      studentId: PEDRO_ID
    },
    include: {
      turma: true
    }
  });
  
  console.log(`📚 MATRÍCULAS DO PEDRO: ${enrollments.length}`);
  if (enrollments.length === 0) {
    console.log('   ⚠️ PEDRO NÃO ESTÁ MATRICULADO EM NENHUMA TURMA!');
  } else {
    for (const enrollment of enrollments) {
      console.log(`   ✅ ${enrollment.turma.name} (${enrollment.turma.id})`);
    }
  }
  console.log('');
  
  // 3. Verificar TurmaLessons disponíveis
  const lessons = await prisma.turmaLesson.findMany({
    where: {
      status: 'SCHEDULED',
      turma: {
        organizationId: ORG_ID,
        isActive: true
      }
    },
    include: {
      turma: {
        select: {
          id: true,
          name: true,
          schedule: true
        }
      }
    },
    orderBy: {
      scheduledDate: 'asc'
    }
  });
  
  console.log(`📅 TURMALESSONS DISPONÍVEIS: ${lessons.length}`);
  for (const lesson of lessons) {
    const schedule = lesson.turma.schedule;
    console.log(`   ${lesson.turma.name} - ${schedule.time || 'N/A'}`);
    console.log(`      Lesson ID: ${lesson.id}`);
    console.log(`      Turma ID: ${lesson.turmaId}`);
  }
  console.log('');
  
  // 4. Verificar se as turmas das lessons estão nas matrículas do Pedro
  const enrolledTurmaIds = enrollments.map(e => e.turmaId);
  const lessonTurmaIds = lessons.map(l => l.turmaId);
  
  console.log('🔄 ANÁLISE DE RELACIONAMENTO:');
  console.log(`   Turmas matriculadas: ${enrolledTurmaIds.length}`);
  console.log(`   Turmas com lessons: ${lessonTurmaIds.length}`);
  
  const matchingTurmas = lessonTurmaIds.filter(id => enrolledTurmaIds.includes(id));
  console.log(`   Turmas em comum: ${matchingTurmas.length}`);
  console.log('');
  
  if (matchingTurmas.length === 0) {
    console.log('❌ PROBLEMA IDENTIFICADO:');
    console.log('   Pedro não está matriculado nas turmas que têm TurmaLessons!');
    console.log('');
    console.log('💡 SOLUÇÃO:');
    console.log('   Precisamos matricular Pedro nas turmas ou ajustar a query da API');
    console.log('   para não filtrar por matrícula.');
    console.log('');
  }
  
  // 5. Verificar endpoint da API
  console.log('🔍 VERIFICANDO ENDPOINT /api/turmas-available:');
  console.log('   Este endpoint filtra turmas onde o aluno está matriculado?');
  console.log('');
  
} catch (error) {
  console.error('❌ Erro:', error);
} finally {
  await prisma.$disconnect();
}
