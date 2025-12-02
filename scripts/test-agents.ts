/**
 * Script de Teste de Agentes IA
 * Testa as principais funcionalidades do sistema de agentes
 */

// IMPORTANTE: Carregar .env ANTES de qualquer import que use process.env
import { config } from 'dotenv';
config();

import { prisma } from '../src/utils/database';
import { agentService } from '../src/services/AgentService';
import { agentExecutorService } from '../src/services/AgentExecutorService';
import { AgentOrchestratorService } from '../src/services/agentOrchestratorService';

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function testAgentList() {
  console.log('\n🔍 ===== TESTE 1: Listar Agentes =====');
  
  try {
    const agents = await agentService.getAgents(ORG_ID, {});
    console.log(`✅ Encontrados ${agents.length} agentes:`);
    agents.forEach((agent: any, i: number) => {
      console.log(`   ${i + 1}. ${agent.name} (${agent.specialization})`);
    });
    return agents;
  } catch (error: any) {
    console.error('❌ Erro ao listar agentes:', error.message);
    return [];
  }
}

async function testAgentStats() {
  console.log('\n📊 ===== TESTE 2: Estatísticas de Agentes =====');
  
  try {
    const stats = await agentService.getAgentStats(ORG_ID);
    console.log('✅ Estatísticas:');
    console.log('   Total de agentes:', stats.total);
    console.log('   Ativos:', stats.active);
    console.log('   Conversas:', stats.totalConversations);
    console.log('   Mensagens:', stats.totalMessages);
    return stats;
  } catch (error: any) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    return null;
  }
}

async function testAgentExecution(agentId: string) {
  console.log('\n🚀 ===== TESTE 3: Execução de Agente =====');
  
  try {
    // Buscar um usuário real para o teste
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', organizationId: ORG_ID },
      select: { id: true, email: true }
    });
    
    if (!adminUser) {
      console.log('⚠️ Nenhum usuário admin encontrado. Pulando teste de execução.');
      return null;
    }
    
    console.log(`📤 Enviando mensagem para agente ${agentId}...`);
    console.log(`   Usando usuário: ${adminUser.email}`);
    
    const result = await agentExecutorService.createConversationAndExecute(
      agentId,
      'Olá! Por favor, faça uma análise rápida do estado atual da academia e sugira 3 ações prioritárias para melhorar a retenção de alunos.',
      {
        userId: adminUser.id,
        metadata: {
          source: 'test-script',
          timestamp: new Date().toISOString()
        }
      }
    );
    
    console.log('✅ Resposta recebida!');
    console.log('   ID da conversa:', result.id);
    console.log('   Total de mensagens:', (result.messages as any[])?.length || 0);
    
    // Exibir última mensagem (resposta do agente)
    const messages = result.messages as any[];
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('\n📩 Resposta do Agente:');
      console.log('---');
      console.log(lastMessage.content?.substring(0, 500) + (lastMessage.content?.length > 500 ? '...' : ''));
      console.log('---');
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Erro na execução:', error.message);
    console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
    return null;
  }
}

async function testOrchestrator() {
  console.log('\n🧠 ===== TESTE 4: Orquestrador de Agentes =====');
  
  try {
    console.log('📤 Solicitando sugestões de agentes...');
    
    const result = await AgentOrchestratorService.suggestAgents(ORG_ID);
    
    if (result.success) {
      console.log('✅ Sugestões recebidas!');
      const data = result.data as any;
      console.log('   Agentes sugeridos:', data?.suggestedAgents?.length || 0);
      console.log('   Total de agentes:', data?.allAgents?.length || 0);
    } else {
      console.log('⚠️ Orquestrador retornou erro:', result.error);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Erro no orquestrador:', error.message);
    return null;
  }
}

async function testAnalytics() {
  console.log('\n📈 ===== TESTE 5: Buscar Dados do Banco =====');
  
  try {
    // Buscar dados básicos para contexto
    const [students, turmas, courses, leads] = await Promise.all([
      prisma.student.count({ where: { organizationId: ORG_ID } }),
      prisma.turma.count({ where: { organizationId: ORG_ID } }),
      prisma.course.count({ where: { organizationId: ORG_ID } }),
      prisma.lead.count({ where: { organizationId: ORG_ID } }).catch(() => 0),
    ]);
    
    console.log('✅ Dados da organização:');
    console.log(`   🎓 Alunos: ${students}`);
    console.log(`   📚 Turmas: ${turmas}`);
    console.log(`   📖 Cursos: ${courses}`);
    console.log(`   🎯 Leads: ${leads}`);
    
    return { students, turmas, courses, leads };
  } catch (error: any) {
    console.error('❌ Erro ao buscar dados:', error.message);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🤖 SUITE DE TESTES DO SISTEMA DE AGENTES IA        ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Organização: ${ORG_ID}`);
  console.log(`⏰ Data/Hora: ${new Date().toISOString()}`);
  
  try {
    // Teste 1: Listar agentes
    const agents = await testAgentList();
    
    // Teste 2: Estatísticas
    await testAgentStats();
    
    // Teste 3: Dados do banco
    await testAnalytics();
    
    // Teste 4: Orquestrador
    await testOrchestrator();
    
    // Teste 5: Execução de um agente (se houver algum)
    if (agents.length > 0) {
      const agent = agents[0];
      console.log(`\n🎯 Testando agente: ${agent.name}`);
      await testAgentExecution(agent.id);
    } else {
      console.log('\n⚠️ Nenhum agente disponível para teste de execução.');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('        ✅ SUITE DE TESTES CONCLUÍDA                        ');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error: any) {
    console.error('\n💥 ERRO FATAL:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
