import { PrismaClient, BillingType } from '@prisma/client';
import { getDefaultOrganizationId } from '../src/config/dev';

const prisma = new PrismaClient();

async function testBillingPlanCreation() {
  try {
    console.log('🧪 Testing billing plan creation...');

    const organizationId = getDefaultOrganizationId();
    console.log('📋 Using organizationId:', organizationId);

    // Verificar se a organização existe
    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    console.log('🏢 Organization found:', org ? org.name : 'NOT FOUND');

    if (!org) {
      console.error('❌ Organization does not exist!');
      process.exit(1);
    }

    // Dados de teste (mesmo formato do frontend)
    const testData = {
      name: "Teste Ilimitado",
      description: "Teste de criação",
      billingType: BillingType.RECURRING,
      hasPersonalTraining: false,
      hasNutrition: false,
      isActive: true,
      allowInstallments: false,
      maxInstallments: 1,
      isRecurring: false,
      allowFreeze: true,
      freezeMaxDays: 30,
      accessAllModalities: false,
      price: 250,
      classesPerWeek: 2,
      isUnlimitedAccess: true,
      organizationId: organizationId
    };

    console.log('📦 Test data:', JSON.stringify(testData, null, 2));

    // Tentar criar
    const plan = await prisma.billingPlan.create({
      data: testData,
      include: {
        _count: { select: { subscriptions: true } },
        organization: true
      }
    });

    console.log('✅ Billing plan created successfully!');
    console.log('📋 Plan ID:', plan.id);
    console.log('📋 Plan name:', plan.name);

    // Limpar: deletar o plano de teste
    await prisma.billingPlan.delete({
      where: { id: plan.id }
    });

    console.log('🧹 Test plan deleted');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('❌ Code:', error.code);
    console.error('❌ Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testBillingPlanCreation();
