const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateOrgIssue() {
  const wrongOrgId = '452c0b35-1822-4890-851e-922356c812fb';
  const correctOrgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  console.log('\n🔍 INVESTIGAÇÃO DO PROBLEMA\n');
  
  // 1. Usuários com org errada
  const usersWrongOrg = await prisma.user.findMany({
    where: { organizationId: wrongOrgId },
    select: { email: true, firstName: true, lastName: true, role: true }
  });
  
  console.log('1️⃣ Usuários com organizationId ERRADO:');
  if (usersWrongOrg.length > 0) {
    console.log(`   ⚠️ ${usersWrongOrg.length} usuários encontrados:`);
    usersWrongOrg.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - ${u.role}`);
    });
  } else {
    console.log('   ✅ Nenhum usuário com org errada');
  }
  
  // 2. Usuários com org correta  
  const usersCorrect = await prisma.user.count({
    where: { organizationId: correctOrgId }
  });
  console.log(`\n2️⃣ Usuários com organizationId CORRETO: ${usersCorrect}`);
  
  // 3. Diagnóstico
  console.log('\n3️⃣ DIAGNÓSTICO:');
  if (usersWrongOrg.length > 0) {
    console.log('   🎯 CAUSA: Usuário logado tem organizationId errado no banco!');
    console.log('   📝 SOLUÇÃO: Corrigir organizationId do usuário');
  } else {
    console.log('   🎯 CAUSA: localStorage/sessionStorage com cache antigo');
    console.log('   📝 SOLUÇÃO: Limpar storage do navegador (já fornecida)');
  }
  
  await prisma.$disconnect();
}

investigateOrgIssue().catch(console.error);
