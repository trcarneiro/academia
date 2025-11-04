import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestBillingPlans() {
  console.log('🔧 Criando planos de teste...');
  
  const organizationId = '452c0b35-1822-4890-851e-922356c812fb'; // Academia Demo
  
  const plans = [
    {
      name: 'Plano Básico',
      description: 'Acesso básico às aulas de Krav Maga',
      price: 149.90,
      billingType: 'MONTHLY' as const,
      classesPerWeek: 3,
      organizationId,
      isActive: true
    },
    {
      name: 'Plano Ilimitado',
      description: 'Acesso ilimitado a todas as modalidades',
      price: 249.90,
      billingType: 'MONTHLY' as const,
      isUnlimitedAccess: true,
      organizationId,
      isActive: true
    },
    {
      name: 'Plano Semestral',
      description: 'Plano com desconto para 6 meses',
      price: 799.90,
      billingType: 'RECURRING' as const,
      duration: 6,
      classesPerWeek: 4,
      organizationId,
      isActive: true
    }
  ];
  
  for (const plan of plans) {
    try {
      const created = await prisma.billingPlan.create({
        data: plan
      });
      console.log(`✅ Plano criado: ${created.name} - R$ ${created.price}`);
    } catch (error) {
      console.log(`❌ Erro ao criar plano ${plan.name}:`, error);
    }
  }
  
  console.log('🎉 Planos de teste criados!');
}

createTestBillingPlans()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
