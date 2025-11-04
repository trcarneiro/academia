import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function executeAgentAndVerify() {
  console.log('🚀 Executando agente e verificando auto-save...\n');

  try {
    const agentId = 'ecb685a1-d50a-4fe2-a3e2-7ec6efb5693a';
    const organizationId = '452c0b35-1822-4890-851e-922356c812fb';

    // 1. Verificar agente antes da execução
    console.log('📋 ANTES DA EXECUÇÃO:');
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      select: {
        name: true,
        autoSaveInsights: true,
        _count: {
          select: { insights: true },
        },
      },
    });
    console.log(`   Agente: ${agent?.name}`);
    console.log(`   Auto-Save: ${agent?.autoSaveInsights ? '✅' : '❌'}`);
    console.log(`   Insights no banco: ${agent?._count.insights}\n`);

    // 2. Executar agente via API
    console.log('⚡ Executando agente via API...');
    const baseUrl = 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/agents/orchestrator/execute/${agentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': organizationId,
      },
      body: JSON.stringify({
        context: {
          organizationId,
          userId: 'test-user',
        },
      }),
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`   Resposta: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ Agente executado com sucesso!');
    console.log(`   Status: ${result.success ? '✅' : '❌'}`);
    
    if (result.data) {
      console.log(`\n📊 Resultado da Execução:`);
      console.log(`   Summary: ${result.data.summary || 'N/A'}`);
      console.log(`   Insights: ${result.data.insights?.length || 0}`);
      console.log(`   Actions: ${result.data.actions?.length || 0}`);
      console.log(`   Priority: ${result.data.priority || 'N/A'}`);
    }

    // 3. Aguardar um pouco para o auto-save processar
    console.log('\n⏳ Aguardando 2 segundos para processamento...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Verificar insights salvos
    console.log('\n📋 DEPOIS DA EXECUÇÃO:');
    const insightsCount = await prisma.agentInsight.count({
      where: { agentId },
    });
    console.log(`   Insights no banco: ${insightsCount}`);

    if (insightsCount > 0) {
      const insights = await prisma.agentInsight.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          type: true,
          category: true,
          title: true,
          priority: true,
          content: true,
          createdAt: true,
        },
      });

      console.log('\n💡 Últimos Insights Salvos:');
      insights.forEach((insight, index) => {
        console.log(`\n   ${index + 1}. [${insight.type}] ${insight.title}`);
        console.log(`      Categoria: ${insight.category}`);
        console.log(`      Prioridade: ${insight.priority}`);
        console.log(`      Conteúdo: ${insight.content.substring(0, 60)}...`);
        console.log(`      Criado: ${insight.createdAt.toLocaleString('pt-BR')}`);
      });

      console.log('\n\n🎉 AUTO-SAVE FUNCIONANDO PERFEITAMENTE! ✅');
    } else {
      console.log('\n⚠️ Nenhum insight foi salvo. Verifique os logs do servidor.');
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Servidor não está rodando!');
      console.error('   Execute: npm run dev');
    } else {
      console.error('\n❌ Erro:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

executeAgentAndVerify();
