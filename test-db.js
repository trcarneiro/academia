import { prisma } from './src/utils/database.ts';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const count = await prisma.organization.count();
    console.log(`✅ Database connected! Organizations found: ${count}`);

    const users = await prisma.user.count();
    console.log(`👥 Users found: ${users}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();