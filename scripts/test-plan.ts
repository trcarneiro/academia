import { prisma } from '@/utils/database';

async function testPlan() {
  const plan = await prisma.billingPlan.findFirst({
    where: {
      organizationId: '452c0b35-1822-4890-851e-922356c812fb',
      name: { contains: 'Trial' }
    }
  });

  console.log('\n✅ TESTE DE PLANO PARA API:\n');
  console.log(`   Plan: ${plan?.name}`);
  console.log(`   ID: ${plan?.id}`);
  console.log(`   Is valid UUID? ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan?.id || '')}`);
  
  console.log('\n📋 Payload para POST /api/financial/subscriptions:');
  console.log(`{`);
  console.log(`  "studentId": "e2ce2a98-6198-4398-844a-5a5ac3126256",`);
  console.log(`  "planId": "${plan?.id}"`);
  console.log(`}`);
  console.log('\n✅ Este payload agora deve ser aceito pela API!\n');

  await prisma.$disconnect();
}

testPlan();
