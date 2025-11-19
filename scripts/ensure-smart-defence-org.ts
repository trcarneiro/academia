import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureSmartDefenceOrg() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  console.log('🔍 Checking if Smart Defence organization exists...');
  
  const existingOrg = await prisma.organization.findUnique({
    where: { id: orgId }
  });
  
  if (existingOrg) {
    console.log('✅ Smart Defence organization already exists:', existingOrg.name);
    return;
  }
  
  console.log('❌ Smart Defence organization not found. Creating...');
  
  const newOrg = await prisma.organization.create({
    data: {
      id: orgId,
      name: 'Smart Defence Krav Maga',
      slug: 'smart-defence',
      description: 'Academia de Krav Maga Smart Defence',
      email: 'contato@smartdefence.com.br',
      phone: '+55 11 99999-9999',
      country: 'Brazil',
      city: 'São Paulo',
      state: 'SP',
      subscriptionPlan: 'PREMIUM',
      maxStudents: 500,
      maxStaff: 50,
      isActive: true,
      primaryColor: '#252831',
      secondaryColor: '#4a5ba1'
    }
  });
  
  console.log('✅ Smart Defence organization created successfully!');
  console.log('   ID:', newOrg.id);
  console.log('   Name:', newOrg.name);
}

ensureSmartDefenceOrg()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
