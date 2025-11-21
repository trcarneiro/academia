import { AgentOrchestratorService } from '../src/services/agentOrchestratorService';
import { prisma } from '../src/utils/database';

// Enable MOCK_AI to test logic without API key
// Comment this out to test with real Gemini API
process.env.MOCK_AI = 'true'; 

async function verifyAgentSystem() {
  console.log('🧪 Verifying Agent System...');
  console.log('ℹ️  MOCK_AI:', process.env.MOCK_AI);

  try {
    // 1. Get an organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ No organization found');
      return;
    }
    console.log(`✅ Organization found: ${org.id}`);

    // 2. Suggest Agents
    console.log('🤖 Suggesting agents...');
    const suggestions = await AgentOrchestratorService.suggestAgents(org.id);
    console.log('✅ Suggestions result:', JSON.stringify(suggestions, null, 2));

    // 3. Create an Agent (if suggestions worked)
    if (suggestions.success && suggestions.data.suggestedAgents.length > 0) {
      const agentConfig = suggestions.data.suggestedAgents[0];
      agentConfig.organizationId = org.id;
      agentConfig.isActive = true;
      agentConfig.systemPrompt = "Você é um agente comercial focado em vendas."; // Add default system prompt
      agentConfig.tools = ['database']; // Add default tools
      
      console.log('🔧 Creating agent:', agentConfig.name);
      const createResult = await AgentOrchestratorService.createAgent(agentConfig);
      console.log('✅ Create result:', JSON.stringify(createResult, null, 2));

      if (createResult.success) {
        const agentId = createResult.data.id;
        
        // 4. Execute Agent
        console.log('🚀 Executing agent...');
        const task = "Analise os dados de alunos e sugira ações para melhorar a retenção.";
        const execResult = await AgentOrchestratorService.executeAgent(agentId, task, { organizationId: org.id });
        console.log('✅ Execution result:', JSON.stringify(execResult, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAgentSystem();
