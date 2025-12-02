/**
 * Teste do Orquestrador - Geração de Tarefas e Sugestões
 * 
 * Métodos disponíveis (todos estáticos):
 * - AgentOrchestratorService.suggestAgents(orgId) - IA sugere agentes
 * - AgentOrchestratorService.executeAgent(agentId, task, context) - Executa agente
 * - AgentOrchestratorService.listAgents(orgId) - Lista agentes ativos
 * - AgentOrchestratorService.monitorAgents(orgId) - Métricas dos agentes
 */

import 'dotenv/config';
import { AgentOrchestratorService } from '../src/services/AgentOrchestratorService.js';
import { prisma } from '../src/utils/database.js';

async function testOrchestratorTasks() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  console.log('🎯 Testando Orquestrador - Geração de Tarefas e Sugestões');
  console.log('═'.repeat(60));
  
  // 1. Listar agentes disponíveis
  console.log('\n📋 1. Listando agentes ativos...');
  const agentsResult = await AgentOrchestratorService.listAgents(orgId);
  
  if (!agentsResult.success) {
    console.error('❌ Erro ao listar agentes:', agentsResult.error);
    return;
  }
  
  const agents = agentsResult.data;
  console.log(`   Encontrados: ${agents.length} agentes`);
  agents.forEach((a: any) => {
    console.log(`   - ${a.name} (${a.specialization})`);
  });
  
  // 2. Executar agente pedagógico para análise
  const pedagogicoAgent = agents.find((a: any) => 
    a.specialization === 'pedagogical' || a.name.toLowerCase().includes('pedagog')
  );
  
  if (!pedagogicoAgent) {
    console.log('\n⚠️ Nenhum agente pedagógico encontrado. Usando primeiro agente disponível.');
  }
  
  const targetAgent = pedagogicoAgent || agents[0];
  
  console.log(`\n🤖 2. Executando agente: ${targetAgent.name}`);
  console.log('   Task: "Analise a situação atual da academia e sugira ações prioritárias"');
  
  const result = await AgentOrchestratorService.executeAgent(
    targetAgent.id,
    'Analise a situação atual da academia e sugira ações prioritárias para melhorar a retenção de alunos.',
    { organizationId: orgId }
  );
  
  console.log('📊 Resultado do Orquestrador:');
  console.log('─'.repeat(60));
  
  if (!result.success) {
    console.error('\n❌ Erro na execução:', result.error);
    await prisma.$disconnect();
    return;
  }
  
  const data = result.data;
  
  // Summary
  console.log('\n📝 RESUMO:', data.summary || 'N/A');
  
  // Insights
  console.log('\n💡 INSIGHTS:', data.insights?.length || 0);
  if (data.insights?.length > 0) {
    data.insights.forEach((insight: string, i: number) => {
      console.log(`   ${i+1}. ${insight}`);
    });
  }
  
  // Actions (que viram tarefas)
  console.log('\n⚡ AÇÕES GERADAS:', data.actions?.length || 0);
  if (data.actions?.length > 0) {
    data.actions.forEach((action: any, i: number) => {
      console.log(`\n   ${i+1}. ${action.description}`);
      console.log(`      Método: ${action.executionMethod || 'N/A'}`);
      console.log(`      Detalhes: ${action.executionDetails || 'N/A'}`);
      console.log(`      Aprovação: ${action.requiresApproval ? 'SIM' : 'NÃO'}`);
    });
  }
  
  // Priority
  console.log('\n🎯 PRIORIDADE:', data.priority || 'MEDIUM');
  
  // Verificar se tarefas foram salvas no banco
  console.log('\n\n📊 3. Verificando tarefas salvas no banco...');
  try {
    const tasks = await prisma.agentTask.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`   Tarefas encontradas: ${tasks.length}`);
    tasks.forEach((task: any) => {
      console.log(`   - [${task.status}] ${task.title}`);
    });
  } catch (e: any) {
    console.log(`   ⚠️ Modelo AgentTask não disponível: ${e.message}`);
  }
  
  // Verificar insights salvos
  console.log('\n📊 4. Verificando insights salvos no banco...');
  try {
    const insights = await prisma.agentInsight.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`   Insights encontrados: ${insights.length}`);
    insights.forEach((insight: any) => {
      console.log(`   - [${insight.type}] ${insight.title?.substring(0, 50)}...`);
    });
  } catch (e: any) {
    console.log(`   ⚠️ Modelo AgentInsight não disponível: ${e.message}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Teste concluído! Tempo total: ${result.executionTime}ms`);
  
  await prisma.$disconnect();
}

testOrchestratorTasks().catch(async (err) => {
  console.error('❌ Erro:', err);
  await prisma.$disconnect();
  process.exit(1);
});
