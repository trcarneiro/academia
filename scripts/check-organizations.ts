import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrgs() {
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
  
  console.log('📊 Organizações encontradas:', JSON.stringify(orgs, null, 2));
  
  await prisma.$disconnect();
}

checkOrgs();
