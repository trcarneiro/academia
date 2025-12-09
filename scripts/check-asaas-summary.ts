/**
 * Check Asaas customers vs subscriptions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('\n📊 RESUMO DE DADOS');
  console.log('═══════════════════════════════════════\n');
  
  // Clientes Asaas vinculados
  const asaasCustomers = await prisma.asaasCustomer.count({
    where: { organizationId: ORG_ID }
  });
  
  // Alunos
  const totalStudents = await prisma.student.count({
    where: { organizationId: ORG_ID }
  });
  
  const activeStudents = await prisma.student.count({
    where: { organizationId: ORG_ID, isActive: true }
  });
  
  // Alunos com Asaas
  const studentsWithAsaas = await prisma.student.count({
    where: { 
      organizationId: ORG_ID,
      asaasCustomer: { isNot: null }
    }
  });
  
  // Matrículas
  const totalSubs = await prisma.studentSubscription.count({
    where: { student: { organizationId: ORG_ID } }
  });
  
  const activeSubs = await prisma.studentSubscription.count({
    where: { 
      student: { organizationId: ORG_ID },
      isActive: true
    }
  });
  
  console.log('👥 ALUNOS');
  console.log('─────────────────────────────────');
  console.log(`   Total: ${totalStudents}`);
  console.log(`   Ativos: ${activeStudents}`);
  console.log(`   Com Asaas: ${studentsWithAsaas}`);
  console.log('');
  
  console.log('💳 ASAAS');
  console.log('─────────────────────────────────');
  console.log(`   Clientes vinculados: ${asaasCustomers}`);
  console.log('');
  
  console.log('📋 MATRÍCULAS');
  console.log('─────────────────────────────────');
  console.log(`   Total: ${totalSubs}`);
  console.log(`   Ativas: ${activeSubs}`);
  console.log('');
  
  // Verificar se matrículas correspondem a assinaturas reais no Asaas
  console.log('⚠️  ANÁLISE:');
  console.log('─────────────────────────────────');
  
  if (activeSubs > studentsWithAsaas) {
    console.log(`   Há ${activeSubs - studentsWithAsaas} matrículas ativas a mais do que`);
    console.log('   clientes com vínculo Asaas.');
    console.log('');
    console.log('   As matrículas foram criadas pelo script de importação,');
    console.log('   mas NÃO representam assinaturas reais no Asaas.');
  }
  
  // Verificar se alunos ativos deveriam estar inativos
  const activeWithoutAsaas = await prisma.student.count({
    where: {
      organizationId: ORG_ID,
      isActive: true,
      asaasCustomer: null
    }
  });
  
  console.log('');
  console.log(`   Alunos ativos SEM Asaas: ${activeWithoutAsaas}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
