const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrgs() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('\n=== Organizations in database ===');
    orgs.forEach(org => {
      console.log(`- ${org.name}: ${org.id}`);
    });
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrgs();
