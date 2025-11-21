import { AgentOrchestratorService, AgentType } from '../src/services/agentOrchestratorService';
import { prisma } from '../src/utils/database';

// Enable MOCK_AI to test logic without API key
process.env.MOCK_AI = 'true'; 

async function generateTestTasks() {
  console.log('🧪 Generating Test Tasks...');
  console.log('ℹ️  MOCK_AI:', process.env.MOCK_AI);

  try {
    // 1. Get an organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ No organization found');
      return;
    }
    console.log(`✅ Organization found: ${org.id}`);

    // 2. Find an existing agent or create one
    let agent = await prisma.aIAgent.findFirst({
      where: { organizationId: org.id, isActive: true }
    });

    if (!agent) {
      console.log('🔧 No active agent found, creating one...');
      const createResult = await AgentOrchestratorService.createAgent({
        organizationId: org.id,
        name: "Agente de Teste",
        description: "Agente para testes automatizados",
        type: AgentType.COMERCIAL,
        systemPrompt: "Você é um agente de teste.",
        isActive: true,
        tools: ['database']
      });
      if (!createResult.success) {
        throw new Error('Failed to create agent');
      }
      agent = createResult.data;
    }
    console.log(`✅ Using agent: ${agent.name} (${agent.id})`);

    // 3. Execute Agent to generate tasks
    console.log('🚀 Executing agent to generate tasks...');
    const task = "Analise a situação e gere tarefas de teste.";
    // The prompt constructed by Orchestrator includes "TAREFA:", which triggers the Mock AI to return actions
    const execResult = await AgentOrchestratorService.executeAgent(agent.id, task, { organizationId: org.id });
    console.log('✅ Execution result:', JSON.stringify(execResult, null, 2));

    // 4. Verify Tasks in DB
    console.log('🔍 Verifying tasks in database...');
    // We need to use 'any' because AgentTask might not be in the generated client types yet if generation failed
    const tasks = await (prisma as any).agentTask.findMany({
      where: { 
        agentId: agent.id,
        organizationId: org.id
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`✅ Found ${tasks.length} tasks created by agent.`);
    if (tasks.length > 0) {
      console.log('📋 Latest Task:', JSON.stringify(tasks[0], null, 2));
    } else {
      console.error('❌ No tasks were created!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestTasks();
