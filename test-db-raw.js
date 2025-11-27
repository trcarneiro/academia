const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to DB...');
    // Try to query something simple, e.g. count users in public schema (if mapped)
    // or use $queryRaw to check auth schema
    
    // Check if we can access auth.users
    const users = await prisma.$queryRaw`SELECT id, email FROM auth.users WHERE email = 'trcampos@Gmail.com'`;
    console.log('User found:', users);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
