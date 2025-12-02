/**
 * Test Agent with Real Data - Comprehensive test
 */
import 'dotenv/config';
import { prisma } from '../src/utils/database';
import { agentExecutorService } from '../src/services/AgentExecutorService';

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('🚀 Teste Completo de Agente com MCP Tools');
  console.log('═'.repeat(60));
  
  // 1. Buscar um agente com ferramentas
  const agent = await prisma.aIAgent.findFirst({
    where: {
      organizationId: ORG_ID,
      isActive: true,
      mcpTools: { isEmpty: false } // Agente com ferramentas
    }
  });

  if (!agent) {
    console.error('❌ Nenhum agente com ferramentas encontrado');
    return;
  }

  console.log(`✅ Agente: ${agent.name}`);
  console.log(`   ID: ${agent.id}`);
  console.log(`   Modelo: ${agent.model}`);
  console.log(`   Ferramentas: ${agent.mcpTools.join(', ')}`);
  console.log('');

  // 2. Buscar usuário
  const user = await prisma.user.findFirst({
    where: { email: 'admin@smartdefence.com.br' }
  });

  if (!user) {
    console.error('❌ Usuário não encontrado');
    return;
  }

  // 3. Verificar API key
  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY?.substring(0, 15)}...`);
  console.log('');

  // 4. Executar agente com pergunta sobre dados reais
  console.log('📤 Pergunta: "Quantos alunos temos e qual a taxa de frequência?"');
  console.log('─'.repeat(60));

  const startTime = Date.now();
  
  try {
    const result = await agentExecutorService.executeAgent(
      agent.id,
      'Quantos alunos temos atualmente na academia? Qual a taxa de frequência? Me dê os números reais.',
      {
        userId: user.id,
        metadata: { 
          organizationId: ORG_ID
        }
      }
    );

    const elapsed = Date.now() - startTime;
    
    console.log('');
    console.log('✅ Resposta recebida em', elapsed, 'ms');
    console.log('─'.repeat(60));
    console.log(result.content);
    console.log('─'.repeat(60));
    console.log('');
    console.log('📊 Metadados:');
    console.log(`   Tokens: ${result.tokensUsed}`);
    console.log(`   MCP Tools: ${result.mcpToolsUsed?.join(', ') || 'nenhum'}`);
    console.log(`   RAG Sources: ${result.ragSourcesUsed?.join(', ') || 'nenhum'}`);
    console.log(`   Tempo: ${result.executionTime}ms`);
    
    // Verificar se é resposta real ou mock
    if (result.content.includes('modo mock') || result.content.includes('Resposta gerada em modo')) {
      console.log('\n⚠️  RESPOSTA MOCK DETECTADA!');
    } else if (result.content.includes('96') || result.content.includes('alunos')) {
      console.log('\n🎉 RESPOSTA REAL COM DADOS!');
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
