const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to DB...');
    
    // Check public.User
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'trcampos@Gmail.com',
          mode: 'insensitive'
        }
      }
    });
    console.log('User found in public schema:', user);
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
