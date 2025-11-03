/**
 * Script de Teste - Sistema de Orquestração de Tarefas
 * 
 * Testa todos os endpoints do sistema de execução e agendamento
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';
const API_BASE = 'http://localhost:3000/api/agent-tasks';

// Headers padrão
const headers = {
  'Content-Type': 'application/json',
  'x-organization-id': ORG_ID
};

async function testOrchestratorStats() {
  console.log('\n🧪 TESTE 1: Estatísticas do Orquestrador');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${API_BASE}/orchestrator/stats`, { headers });
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Estatísticas:', JSON.stringify(data.data, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testExecuteTaskNow() {
  console.log('\n🧪 TESTE 2: Executar Tarefa Manualmente');
  console.log('='.repeat(50));
  
  try {
    // Buscar uma tarefa aprovada
    const task = await prisma.agentTask.findFirst({
      where: {
        organizationId: ORG_ID,
        approvalStatus: 'APPROVED',
        status: 'PENDING'
      }
    });
    
    if (!task) {
      console.log('⚠️  Nenhuma tarefa aprovada encontrada. Criando uma...');
      
      // Buscar um agente
      const agent = await prisma.agent.findFirst({
        where: { organizationId: ORG_ID }
      });
      
      if (!agent) {
        console.log('❌ Nenhum agente encontrado!');
        return;
      }
      
      // Criar tarefa de teste
      const newTask = await prisma.agentTask.create({
        data: {
          organizationId: ORG_ID,
          agentId: agent.id,
          title: 'Teste: Enviar lembrete de plano vencendo',
          description: 'Tarefa de teste para validar sistema de execução',
          category: 'WHATSAPP_MESSAGE',
          priority: 'MEDIUM',
          approvalStatus: 'APPROVED',
          status: 'PENDING',
          executorType: 'AGENT',
          executorId: agent.id,
          actionPayload: {
            phone: '+5511999998888',
            message: 'Seu plano de Krav Maga vence em 3 dias! Renove agora.'
          },
          reasoning: {
            insights: ['Plano próximo do vencimento detectado'],
            expectedImpact: 'Reduzir inadimplência',
            risks: ['Baixo - apenas notificação'],
            dataSupport: ['StudentId: test-123']
          }
        }
      });
      
      console.log(`✅ Tarefa criada: ${newTask.id}`);
      
      // Executar tarefa
      const response = await fetch(`${API_BASE}/${newTask.id}/execute-now`, {
        method: 'POST',
        headers: {
          ...headers,
          'x-user-id': 'test-user-id'
        }
      });
      
      const data = await response.json();
      console.log('✅ Status:', response.status);
      console.log('📋 Resposta:', JSON.stringify(data, null, 2));
      
      // Aguardar 2 segundos
      console.log('⏳ Aguardando 2 segundos para execução...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar execuções
      const executions = await prisma.taskExecution.findMany({
        where: { taskId: newTask.id },
        orderBy: { startedAt: 'desc' }
      });
      
      console.log(`📜 Execuções registradas: ${executions.length}`);
      executions.forEach(exec => {
        console.log(`  - Tentativa #${exec.attemptNumber}: ${exec.status} (${exec.duration}ms)`);
        if (exec.errorMessage) {
          console.log(`    ❌ Erro: ${exec.errorMessage}`);
        }
      });
      
    } else {
      console.log(`✅ Tarefa encontrada: ${task.id}`);
      console.log(`   Título: ${task.title}`);
      console.log(`   Categoria: ${task.category}`);
      
      // Executar tarefa
      const response = await fetch(`${API_BASE}/${task.id}/execute-now`, {
        method: 'POST',
        headers: {
          ...headers,
          'x-user-id': 'test-user-id'
        }
      });
      
      const data = await response.json();
      console.log('✅ Status:', response.status);
      console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testScheduleTask() {
  console.log('\n🧪 TESTE 3: Agendar Tarefa');
  console.log('='.repeat(50));
  
  try {
    // Buscar uma tarefa aprovada
    const task = await prisma.agentTask.findFirst({
      where: {
        organizationId: ORG_ID,
        approvalStatus: 'APPROVED',
        status: 'PENDING',
        scheduledFor: null
      }
    });
    
    if (!task) {
      console.log('⚠️  Nenhuma tarefa disponível para agendar');
      return;
    }
    
    console.log(`✅ Tarefa encontrada: ${task.id}`);
    
    // Agendar para 2 minutos no futuro
    const scheduledFor = new Date(Date.now() + 2 * 60 * 1000);
    
    const response = await fetch(`${API_BASE}/${task.id}/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scheduledFor: scheduledFor.toISOString()
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📅 Agendada para:', scheduledFor.toLocaleString('pt-BR'));
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testCreateRecurringTask() {
  console.log('\n🧪 TESTE 4: Criar Tarefa Recorrente');
  console.log('='.repeat(50));
  
  try {
    // Buscar um agente
    const agent = await prisma.agent.findFirst({
      where: { organizationId: ORG_ID }
    });
    
    if (!agent) {
      console.log('❌ Nenhum agente encontrado!');
      return;
    }
    
    console.log(`✅ Agente encontrado: ${agent.name}`);
    
    const response = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        agentId: agent.id,
        title: 'Lembrete Semanal de Planos Vencendo',
        description: 'Notifica alunos com planos que vencem em 7 dias (toda segunda às 9h)',
        category: 'WHATSAPP_MESSAGE',
        actionPayload: {
          phone: '+5511999998888',
          message: 'Seu plano vence em breve! Renove agora.'
        },
        recurrenceRule: '0 9 * * 1', // Toda segunda às 9h
        priority: 'MEDIUM',
        executorType: 'AGENT'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('🔁 Recorrência: Toda segunda-feira às 9h');
    console.log('📋 Resposta:', JSON.stringify(data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testGetTaskExecutions() {
  console.log('\n🧪 TESTE 5: Buscar Log de Execuções');
  console.log('='.repeat(50));
  
  try {
    // Buscar uma tarefa com execuções
    const task = await prisma.agentTask.findFirst({
      where: {
        organizationId: ORG_ID,
        executions: {
          some: {}
        }
      },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!task) {
      console.log('⚠️  Nenhuma tarefa com execuções encontrada');
      return;
    }
    
    console.log(`✅ Tarefa encontrada: ${task.id}`);
    console.log(`   Execuções: ${task.executions.length}`);
    
    const response = await fetch(`${API_BASE}/${task.id}/executions`, { headers });
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('📜 Execuções via API:', data.data.length);
    
    data.data.forEach((exec: any) => {
      console.log(`\n  🔹 Tentativa #${exec.attemptNumber}`);
      console.log(`     Status: ${exec.status}`);
      console.log(`     Início: ${new Date(exec.startedAt).toLocaleString('pt-BR')}`);
      console.log(`     Duração: ${exec.duration}ms`);
      if (exec.errorMessage) {
        console.log(`     ❌ Erro: ${exec.errorMessage}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTES DO SISTEMA DE ORQUESTRAÇÃO');
  console.log('='.repeat(50));
  console.log(`📍 Organization ID: ${ORG_ID}`);
  console.log(`🌐 API Base: ${API_BASE}`);
  
  try {
    await testOrchestratorStats();
    await testExecuteTaskNow();
    await testScheduleTask();
    await testCreateRecurringTask();
    await testGetTaskExecutions();
    
    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
