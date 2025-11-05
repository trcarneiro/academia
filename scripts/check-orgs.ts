import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrgs() {
  try {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    
    console.log('\n📊 Organizações no banco:');
    console.log(JSON.stringify(orgs, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrgs();
