#!/usr/bin/env npx tsx

/**
 * 🗑️ Delete Organization (Cascade)
 * Deleta organização secundária e TODAS as suas dependências
 * ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_TO_DELETE = '6fad4290-c504-46e7-ab60-afb76363b1a9'; // Academia Demo

async function main() {
  console.log('🗑️  DELETE ORGANIZAÇÃO - MODO CASCADE\n');
  console.log('⚠️  ATENÇÃO: Esta operação deletará TUDO!\n');
  
  // 1. Listar tudo que será deletado
  const students = await prisma.student.findMany({
    where: { organizationId: ORG_TO_DELETE },
    include: { user: { select: { firstName: true, lastName: true } } }
  });
  
  const instructors = await prisma.instructor.findMany({
    where: { organizationId: ORG_TO_DELETE },
    include: { user: { select: { firstName: true, lastName: true } } }
  });
  
  const courses = await prisma.course.findMany({
    where: { organizationId: ORG_TO_DELETE },
    select: { name: true }
  });
  
  const units = await prisma.unit.findMany({
    where: { organizationId: ORG_TO_DELETE },
    select: { name: true }
  });
  
  console.log('📋 O QUE SERÁ DELETADO:');
  console.log(`\n👥 Alunos (${students.length}):`);
  students.forEach(s => console.log(`  - ${s.user.firstName} ${s.user.lastName}`));
  
  console.log(`\n👨‍🏫 Instrutores (${instructors.length}):`);
  instructors.forEach(i => console.log(`  - ${i.user.firstName} ${i.user.lastName}`));
  
  console.log(`\n📚 Cursos (${courses.length}):`);
  courses.forEach(c => console.log(`  - ${c.name}`));
  
  console.log(`\n🏢 Unidades (${units.length}):`);
  units.forEach(u => console.log(`  - ${u.name}`));
  
  const totalItems = students.length + instructors.length + courses.length + units.length;
  
  console.log(`\n🔢 TOTAL: ${totalItems} registro(s)`);
  console.log('\n⚠️  Esta operação deletará também:');
  console.log('  - Classes (turmas) associadas aos cursos');
  console.log('  - Assinaturas dos alunos');
  console.log('  - Matrículas em cursos');
  console.log('  - Frequências registradas');
  console.log('  - E TODOS os outros dados relacionados\n');
  
  // Prosseguir com deleção em cascata
  console.log('🚀 Executando deleção em cascata...\n');
  
  try {
    // 1. Deletar StudentCourse (matrículas)
    const studentCourses = await prisma.studentCourse.deleteMany({
      where: { student: { organizationId: ORG_TO_DELETE } }
    });
    console.log(`✅ Matrículas deletadas: ${studentCourses.count}`);
    
    // 2. Deletar StudentSubscriptions (assinaturas)
    const subscriptions = await prisma.studentSubscription.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Assinaturas deletadas: ${subscriptions.count}`);
    
    // 3. Deletar TurmaStudents (alunos nas turmas)
    const turmaStudents = await prisma.turmaStudent.deleteMany({
      where: { student: { organizationId: ORG_TO_DELETE } }
    });
    console.log(`✅ Alunos-Turma deletados: ${turmaStudents.count}`);
    
    // 4. Buscar turmas para deletar attendances e lessons
    const turmas = await prisma.turma.findMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    
    for (const turma of turmas) {
      // Deletar attendances
      await prisma.turmaAttendance.deleteMany({
        where: { turmaStudent: { turmaId: turma.id } }
      });
      
      // Deletar lessons
      await prisma.turmaLesson.deleteMany({
        where: { turmaId: turma.id }
      });
    }
    console.log(`✅ Aulas e frequências deletadas de ${turmas.length} turma(s)`);
    
    // 5. Deletar Turmas
    const turmasDeleted = await prisma.turma.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Turmas deletadas: ${turmasDeleted.count}`);
    
    // 6. Deletar Classes
    const classes = await prisma.class.deleteMany({
      where: { course: { organizationId: ORG_TO_DELETE } }
    });
    console.log(`✅ Classes deletadas: ${classes.count}`);
    
    // 7. Deletar Students
    const studentsDeleted = await prisma.student.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Alunos deletados: ${studentsDeleted.count}`);
    
    // 8. Deletar Instructors
    const instructorsDeleted = await prisma.instructor.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Instrutores deletados: ${instructorsDeleted.count}`);
    
    // 9. Deletar Courses
    const coursesDeleted = await prisma.course.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Cursos deletados: ${coursesDeleted.count}`);
    
    // 10. Deletar Units
    const unitsDeleted = await prisma.unit.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Unidades deletadas: ${unitsDeleted.count}`);
    
    // 11. Deletar Billing Plans
    const plansDeleted = await prisma.billingPlan.deleteMany({
      where: { organizationId: ORG_TO_DELETE }
    });
    console.log(`✅ Planos deletados: ${plansDeleted.count}`);
    
    // 12. FINALMENTE deletar a organização
    await prisma.organization.delete({
      where: { id: ORG_TO_DELETE }
    });
    console.log(`✅ Organização deletada!\n`);
    
    console.log('🎉 DELEÇÃO COMPLETA COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ Erro durante deleção:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
