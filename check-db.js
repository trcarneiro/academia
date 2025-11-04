import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando organizações...');
    const orgs = await prisma.organization.findMany();
    console.log(`📊 Organizações encontradas: ${orgs.length}`);
    orgs.forEach(org => {
      console.log(`  - ID: ${org.id}`);
      console.log(`    Nome: ${org.name}`);
      console.log(`    Slug: ${org.slug}`);
      console.log(`    Ativo: ${org.isActive}`);
    });

    console.log('\n👥 Verificando usuários...');
    const users = await prisma.user.findMany({
      include: { organization: true }
    });
    console.log(`📊 Usuários encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  - Email: ${user.email}`);
      console.log(`    Nome: ${user.firstName} ${user.lastName}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Org: ${user.organization?.name || 'Nenhuma'}`);
      console.log(`    Org ID: ${user.organizationId}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();