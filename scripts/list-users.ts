import { prisma } from '../src/utils/database';

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        role: true,
        organizationId: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('📋 Usuários encontrados:');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Org: ${user.organizationId}`);
      console.log('');
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
