/**
 * Test Agent Direct - Teste direto de execução de agente
 */
import 'dotenv/config';
import { prisma } from '../src/utils/database';
import { agentExecutorService } from '../src/services/AgentExecutorService';

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('🚀 Teste Direto de Agente');
  console.log('═'.repeat(50));
  
  // 1. Buscar um agente
  const agent = await prisma.aIAgent.findFirst({
    where: {
      organizationId: ORG_ID,
      isActive: true,
      model: 'gemini-2.5-flash' // Usar modelo mais recente
    }
  });

  if (!agent) {
    console.error('❌ Nenhum agente encontrado');
    return;
  }

  console.log(`✅ Agente encontrado: ${agent.name}`);
  console.log(`   ID: ${agent.id}`);
  console.log(`   Modelo: ${agent.model}`);
  console.log(`   Especialização: ${agent.specialization}`);
  console.log('');

  // 2. Buscar um usuário
  const user = await prisma.user.findFirst({
    where: { email: 'admin@smartdefence.com.br' }
  });

  if (!user) {
    console.error('❌ Usuário não encontrado');
    return;
  }

  console.log(`✅ Usuário: ${user.email}`);
  console.log('');

  // 3. Executar agente
  console.log('📤 Enviando mensagem para o agente...');
  console.log('   Mensagem: "Qual o status atual da academia?"');
  console.log('');

  const startTime = Date.now();
  
  try {
    const result = await agentExecutorService.executeAgent(
      agent.id,
      'Qual o status atual da academia? Quais são os principais indicadores?',
      {
        userId: user.id,
        metadata: { 
          test: true,
          organizationId: ORG_ID  // Pass organization for MCP tools
        }
      }
    );

    const elapsed = Date.now() - startTime;
    
    console.log('✅ Resposta recebida!');
    console.log(`   Tempo: ${elapsed}ms`);
    console.log('');
    console.log('📩 Conteúdo da resposta:');
    console.log('─'.repeat(50));
    console.log(result.content);  // Fixed: use 'content' not 'response'
    console.log('─'.repeat(50));
    console.log('');
    console.log('📊 Metadados:');
    console.log(`   Tokens: ${result.tokensUsed || 0}`);
    console.log(`   Ferramentas MCP: ${result.mcpToolsUsed?.length || 0}`);
    console.log(`   Tempo de execução: ${result.executionTime}ms`);

  } catch (error: any) {
    console.error('❌ Erro na execução:');
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
