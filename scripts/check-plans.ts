import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.billingPlan.findMany({
    include: {
      organization: { select: { name: true } }
    }
  });
  
  console.log('\n📦 PLANOS CADASTRADOS:\n');
  plans.forEach(pl => {
    console.log(`   - ${pl.name}`);
    console.log(`     Organização: ${pl.organization.name}`);
    console.log(`     Org ID: ${pl.organizationId}`);
    console.log(`     Preço: R$ ${pl.price}`);
    console.log(`     Features:`, pl.features);
    console.log('');
  });
  
  await prisma.$disconnect();
}

checkPlans();
