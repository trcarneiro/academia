
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting plan simplification...');

  // Get the organization (assuming single tenant for now or first one)
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found.');
    return;
  }

  console.log(`🏢 Organization: ${org.name} (${org.id})`);

  // Find all plans
  const plans = await prisma.billingPlan.findMany({
    where: { organizationId: org.id },
    include: {
      _count: { select: { subscriptions: true } }
    }
  });

  console.log(`📋 Found ${plans.length} plans.`);

  // Identify "Unlimited" plans
  const unlimitedPlans = plans.filter(p => 
    p.name.toLowerCase().includes('ilimitado') || 
    p.isUnlimitedAccess === true
  );

  let targetPlan;

  if (unlimitedPlans.length > 0) {
    // Pick the best candidate (e.g., most subscriptions or first one)
    // Sort by subscriptions desc
    unlimitedPlans.sort((a, b) => b._count.subscriptions - a._count.subscriptions);
    targetPlan = unlimitedPlans[0];
    console.log(`✅ Found existing Unlimited plan: ${targetPlan.name} (${targetPlan.id})`);
  } else {
    // Create new one
    console.log('✨ Creating new Unlimited plan...');
    targetPlan = await prisma.billingPlan.create({
      data: {
        organizationId: org.id,
        name: 'Plano Ilimitado',
        description: 'Acesso total a todas as modalidades e horários.',
        price: 250.00, // Fixed value
        billingType: 'MONTHLY',
        isUnlimitedAccess: true,
        accessAllModalities: true,
        classesPerWeek: 999,
        isActive: true
      },
      include: {
        _count: { select: { subscriptions: true } }
      }
    });
    console.log(`✅ Created plan: ${targetPlan.name}`);
  }

  // Update the target plan to be the "One True Plan"
  await prisma.billingPlan.update({
    where: { id: targetPlan.id },
    data: {
      name: 'Plano Ilimitado',
      price: 250.00, // Enforcing fixed price
      isActive: true,
      isUnlimitedAccess: true,
      accessAllModalities: true
    }
  });
  console.log(`💰 Updated plan price to R$ 250.00`);

  // Deactivate/Delete other plans
  for (const plan of plans) {
    if (plan.id === targetPlan.id) continue;

    if (plan._count.subscriptions > 0) {
      console.log(`⚠️ Plan "${plan.name}" has ${plan._count.subscriptions} subscriptions. Deactivating instead of deleting.`);
      await prisma.billingPlan.update({
        where: { id: plan.id },
        data: { isActive: false } // Soft delete
      });
    } else {
      console.log(`🗑️ Deleting unused plan: ${plan.name}`);
      await prisma.billingPlan.delete({
        where: { id: plan.id }
      });
    }
  }

  console.log('✅ Plan simplification complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
