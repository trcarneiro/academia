const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFrontendOrg() {
  try {
    // Organização que o FRONTEND está usando
    const frontendOrgId = '452c0b35-1822-4890-851e-922356c812fb';
    
    console.log('\n🔍 Verificando organização do FRONTEND:', frontendOrgId);
    
    const org = await prisma.organization.findUnique({
      where: { id: frontendOrgId }
    });
    
    if (org) {
      console.log('✅ Organização encontrada:', org.name);
      
      const students = await prisma.student.count({ where: { organizationId: frontendOrgId } });
      const courses = await prisma.course.count({ where: { organizationId: frontendOrgId } });
      const instructors = await prisma.instructor.count({ where: { organizationId: frontendOrgId } });
      const turmas = await prisma.turma.count({ where: { organizationId: frontendOrgId } });
      
      console.log('\n📊 Dados dessa organização:');
      console.log('  Alunos:', students);
      console.log('  Cursos:', courses);
      console.log('  Instrutores:', instructors);
      console.log('  Turmas:', turmas);
      
      if (students === 0) {
        console.log('\n⚠️ ESSA É UMA ORGANIZAÇÃO VAZIA!');
      }
    } else {
      console.log('❌ Organização NÃO ENCONTRADA no banco!');
    }
    
    console.log('\n🔍 Organizações disponíveis no banco:');
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true }
    });
    
    orgs.forEach(o => {
      console.log(`  - ${o.name} (${o.slug})`);
      console.log(`    ID: ${o.id}`);
    });
    
    // Verificar organização com dados
    console.log('\n🔍 Verificando organização com DADOS:');
    const orgWithData = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    const orgData = await prisma.organization.findUnique({
      where: { id: orgWithData }
    });
    
    if (orgData) {
      console.log(`✅ ${orgData.name} tem:`);
      const s = await prisma.student.count({ where: { organizationId: orgWithData } });
      console.log(`  - ${s} alunos`);
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFrontendOrg();
