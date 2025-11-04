import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Verificando organizações e usuários...\n');

    const orgs = await prisma.organization.findMany();
    console.log(`🏢 Organizações encontradas: ${orgs.length}`);
    orgs.forEach(org => console.log(`  - ID: ${org.id}, Nome: ${org.name}, Ativo: ${org.active}`));

    console.log('\n👥 Usuários encontrados:');
    const users = await prisma.user.findMany({
      include: {
        organization: true
      }
    });
    users.forEach(user => console.log(`  - ID: ${user.id}, Email: ${user.email}, Org: ${user.organization?.name || 'Nenhuma'}`));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();