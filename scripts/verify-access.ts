
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    console.log(`✅ Successfully connected to database!`);
    console.log(`📊 Stats: ${userCount} users, ${orgCount} organizations found.`);
    
    // List first 3 organizations to verify data
    const orgs = await prisma.organization.findMany({ take: 3 });
    console.log('🏢 Organizations:', orgs.map(o => o.name).join(', '));
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
