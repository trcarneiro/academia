import { prisma } from '../src/utils/database';

async function main() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        subscriptionPlan: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (organizations.length === 0) {
      console.log('ℹ️  Nenhuma organização encontrada no banco de dados.');
      return;
    }

    console.log('🏢 Lista de organizações registradas:\n');
    organizations.forEach((org, index) => {
      console.log(
        `${index + 1}. ${org.name} (${org.slug || 'sem slug'})\n` +
          `   ID: ${org.id}\n` +
          `   Plano: ${org.subscriptionPlan}\n` +
          `   Status: ${org.isActive ? 'Ativa' : 'Inativa'}\n` +
          `   Criada em: ${org.createdAt.toISOString()}\n`
      );
    });
  } catch (error) {
    console.error('❌ Erro ao listar organizações:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {
      /* ignore disconnect errors */
    });
  }
}

main();
