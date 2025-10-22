import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscriptions() {
  console.log('🔍 Verificando Subscriptions...\n');

  // Buscar todas as subscriptions
  const subs = await prisma.studentSubscription.findMany({
    include: {
      student: { include: { user: true } },
      plan: true,
      organization: { select: { name: true } }
    }
  });

  console.log(`📊 Total de subscriptions: ${subs.length}\n`);

  subs.forEach((sub, i) => {
    console.log(`${i + 1}. ${sub.student.user.firstName} ${sub.student.user.lastName}`);
    console.log(`   Plano: ${sub.plan.name}`);
    console.log(`   Organização: ${sub.organization.name}`);
    console.log(`   Status: ${sub.status}`);
    console.log(`   Preço: R$ ${sub.currentPrice}`);
    console.log(`   Billing Type: ${sub.billingType}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkSubscriptions();
