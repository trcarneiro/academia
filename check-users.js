const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log(`Usuários encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user.id}`);
    });

    if (users.length === 0) {
      console.log('\nNenhum usuário encontrado no banco de dados.');
      console.log('Será necessário criar usuários primeiro.');
    }

  } catch (error) {
    console.error('Erro ao consultar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();