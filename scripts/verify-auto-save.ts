import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAutoSave() {
  console.log('🔍 Verificando Auto-Save de Insights...\n');

  try {
    // 1. Verificar agentes com autoSaveInsights ativo
    const agentsWithAutoSave = await prisma.aIAgent.findMany({
      where: {
        autoSaveInsights: true,
      },
      select: {
        id: true,
        name: true,
        specialization: true,
        autoSaveInsights: true,
        createdAt: true,
      },
    });

    console.log(`📊 Agentes com Auto-Save ATIVO: ${agentsWithAutoSave.length}`);
    agentsWithAutoSave.forEach((agent) => {
      console.log(`  - ${agent.name} (${agent.specialization})`);
      console.log(`    ID: ${agent.id}`);
      console.log(`    Auto-Save: ${agent.autoSaveInsights ? '✅' : '❌'}`);
      console.log(`    Criado: ${agent.createdAt.toLocaleString('pt-BR')}\n`);
    });

    // 2. Verificar insights salvos
    const insights = await prisma.agentInsight.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        agent: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
    });

    console.log(`\n💡 Insights Salvos no Banco: ${insights.length}`);
    if (insights.length === 0) {
      console.log('  ⚠️ Nenhum insight encontrado. Execute um agente com autoSaveInsights=true.\n');
    } else {
      insights.forEach((insight, index) => {
        console.log(`\n  ${index + 1}. ${insight.title}`);
        console.log(`     Tipo: ${insight.type}`);
        console.log(`     Categoria: ${insight.category || 'N/A'}`);
        console.log(`     Prioridade: ${insight.priority}`);
        console.log(`     Status: ${insight.status}`);
        console.log(`     Agente: ${insight.agent.name}`);
        console.log(`     Criado: ${insight.createdAt.toLocaleString('pt-BR')}`);
        console.log(`     Conteúdo: ${insight.content.substring(0, 80)}...`);
      });
    }

    // 3. Estatísticas por tipo
    const statsByType = await prisma.agentInsight.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    console.log('\n\n📈 Estatísticas por Tipo:');
    statsByType.forEach((stat) => {
      console.log(`  ${stat.type}: ${stat._count.id} registros`);
    });

    // 4. Estatísticas por categoria
    const statsByCategory = await prisma.agentInsight.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    console.log('\n📊 Estatísticas por Categoria:');
    statsByCategory.forEach((stat) => {
      console.log(`  ${stat.category || 'SEM CATEGORIA'}: ${stat._count.id} registros`);
    });

    // 5. Verificar último agente executado
    const lastExecution = await prisma.aIAgent.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        specialization: true,
        autoSaveInsights: true,
        updatedAt: true,
        _count: {
          select: {
            insights: true,
          },
        },
      },
    });

    if (lastExecution) {
      console.log('\n\n🕐 Último Agente Atualizado:');
      console.log(`  Nome: ${lastExecution.name}`);
      console.log(`  Auto-Save: ${lastExecution.autoSaveInsights ? '✅ ATIVO' : '❌ INATIVO'}`);
      console.log(`  Insights Salvos: ${lastExecution._count.insights}`);
      console.log(`  Última Atualização: ${lastExecution.updatedAt.toLocaleString('pt-BR')}`);
    }

    console.log('\n\n✅ Verificação concluída!\n');
  } catch (error) {
    console.error('❌ Erro ao verificar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAutoSave();
