import { prisma } from '../src/utils/database';

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  try {
    console.log('🔍 Verificando agentes da organização:', ORG_ID);
    
    const agents = await prisma.aIAgent.findMany({
      where: { organizationId: ORG_ID },
      select: {
        id: true,
        name: true,
        specialization: true,
        isActive: true,
        description: true,
        mcpTools: true,
        model: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (agents.length === 0) {
      console.log('⚠️ Nenhum agente encontrado.');
      console.log('💡 Execute: npx tsx scripts/create-suggested-agents.ts');
    } else {
      console.log(`\n✅ ${agents.length} agente(s) encontrado(s):\n`);
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Especialização: ${agent.specialization}`);
        console.log(`   Modelo: ${agent.model}`);
        console.log(`   Ativo: ${agent.isActive ? 'Sim' : 'Não'}`);
        console.log(`   Ferramentas: ${agent.mcpTools?.join(', ') || 'Nenhuma'}`);
        console.log(`   Descrição: ${agent.description || 'N/A'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
