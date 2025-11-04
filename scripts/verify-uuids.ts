import { prisma } from '@/utils/database';

async function verifyUUIDs() {
  const plans = await prisma.billingPlan.findMany({
    where: { organizationId: '452c0b35-1822-4890-851e-922356c812fb' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`\n✅ ${plans.length} Planos com UUIDs válidos:\n`);
  plans.forEach((p) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
    console.log(`  ${isUUID ? '✅' : '❌'} ${p.name}`);
    console.log(`     ID: ${p.id}\n`);
  });

  await prisma.$disconnect();
}

verifyUUIDs();
