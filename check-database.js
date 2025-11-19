const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    
    console.log('\n🔍 VERIFICANDO BANCO DE DADOS...\n');
    
    // 1. Organizações
    const orgs = await prisma.organization.count();
    console.log(`📊 Organizações: ${orgs}`);
    
    // 2. Cursos
    const courses = await prisma.course.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, level: true }
    });
    console.log(`📚 Cursos (org específica): ${courses.length}`);
    if (courses.length > 0) {
      courses.forEach(c => console.log(`   - ${c.name} (${c.level})`));
    }
    
    // 3. Alunos
    const students = await prisma.student.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    console.log(`\n👥 Alunos (org específica): ${students.length}`);
    if (students.length > 0) {
      students.slice(0, 5).forEach(s => {
        console.log(`   - ${s.user.firstName} ${s.user.lastName} (${s.category})`);
      });
      if (students.length > 5) console.log(`   ... e mais ${students.length - 5}`);
    }
    
    // 4. Instrutores
    const instructors = await prisma.instructor.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { firstName: true, lastName: true } } }
    });
    console.log(`\n👨‍🏫 Instrutores: ${instructors.length}`);
    if (instructors.length > 0) {
      instructors.forEach(i => {
        console.log(`   - ${i.user.firstName} ${i.user.lastName}`);
      });
    }
    
    // 5. Turmas
    const turmas = await prisma.turma.findMany({
      where: { organizationId: orgId },
      select: { id: true, courseId: true, description: true, status: true }
    });
    console.log(`\n📅 Turmas: ${turmas.length}`);
    if (turmas.length > 0) {
      turmas.slice(0, 3).forEach(t => {
        console.log(`   - ${t.description || 'Sem descrição'} (Status: ${t.status})`);
      });
    }
    
    // 6. Matrículas
    const enrollments = await prisma.studentCourse.findMany({
      where: { 
        student: { organizationId: orgId }
      }
    });
    console.log(`\n🎓 Matrículas (StudentCourse): ${enrollments.length}`);
    
    // 7. Unidades
    const units = await prisma.unit.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, address: true }
    });
    console.log(`\n🏢 Unidades: ${units.length}`);
    if (units.length > 0) {
      units.forEach(u => console.log(`   - ${u.name}: ${u.address || 'Sem endereço'}`));
    }
    
    // 8. Usuários totais
    const users = await prisma.user.count({
      where: { organizationId: orgId }
    });
    console.log(`\n👤 Usuários totais: ${users}`);
    
    console.log('\n✅ Verificação completa!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
