/**
 * Analyze subscriptions origin - where did they come from?
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('\n📊 ANÁLISE DE ORIGEM DAS MATRÍCULAS');
  console.log('====================================\n');
  
  // Matrículas ativas
  const activeSubs = await prisma.studentSubscription.findMany({
    where: { 
      student: { organizationId: ORG_ID },
      isActive: true 
    },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          asaasCustomer: true
        }
      },
      plan: { select: { name: true } }
    }
  });
  
  // Separar por origem
  const withAsaas = activeSubs.filter(s => s.student.asaasCustomer);
  const withoutAsaas = activeSubs.filter(s => !s.student.asaasCustomer);
  
  console.log('Total de matrículas ativas:', activeSubs.length);
  console.log('');
  console.log('✅ Com vínculo Asaas:', withAsaas.length);
  console.log('❌ SEM vínculo Asaas:', withoutAsaas.length);
  console.log('');
  
  // Quando foram criadas?
  const byDate: Record<string, number> = {};
  activeSubs.forEach(s => {
    const date = s.createdAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });
  
  console.log('📅 Matrículas por data de criação:');
  Object.entries(byDate).sort().forEach(([date, count]) => {
    console.log(`   ${date}: ${count}`);
  });
  
  console.log('');
  console.log('❌ Alunos SEM Asaas mas COM matrícula ativa:');
  withoutAsaas.forEach(s => {
    const name = `${s.student.user.firstName} ${s.student.user.lastName}`;
    console.log(`   - ${name.padEnd(40)} | Plano: ${s.plan.name} | Criado: ${s.createdAt.toISOString().split('T')[0]}`);
  });
  
  // Verificar se essas matrículas foram criadas pelo script
  console.log('\n');
  console.log('🔍 CONCLUSÃO:');
  console.log('─────────────');
  
  if (withoutAsaas.length > 0) {
    console.log(`   ${withoutAsaas.length} matrículas foram criadas SEM vínculo com Asaas.`);
    console.log('   Provavelmente criadas por scripts de migração/importação.');
    console.log('');
    console.log('   Deseja manter apenas alunos COM Asaas?');
    console.log('   Execute: npx tsx scripts/cleanup-subscriptions-without-asaas.ts');
  } else {
    console.log('   Todas as matrículas têm vínculo com Asaas ✓');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
