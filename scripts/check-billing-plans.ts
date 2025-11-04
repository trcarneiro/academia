import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBillingPlans() {
  try {
    console.log('📦 Verificando BillingPlans...\n');
    
    const plans = await prisma.billingPlan.findMany({
      include: {
        organization: {
          select: { name: true, id: true }
        }
      }
    });
    
    console.log(`✅ Total de planos: ${plans.length}\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Organização: ${plan.organization.name} (${plan.organizationId})`);
      console.log(`   Preço: R$ ${plan.price}`);
      console.log(`   Tipo: ${plan.billingType}`);
      console.log(`   Ativo: ${plan.isActive}`);
      console.log('');
    });
    
    // Verificar organizações
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true }
    });
    
    console.log('\n🏢 Organizações disponíveis:');
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.slug})`);
      console.log(`     ID: ${org.id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBillingPlans();
