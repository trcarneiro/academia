/**
 * 🧪 Script de Teste Rápido - AI Agents
 * 
 * Cole este script no console do browser (F12) para testar o sistema completo.
 * Funciona com ou sem GEMINI_API_KEY configurada.
 */

(async function testAIAgents() {
  console.log('🤖 Iniciando testes do sistema AI Agents...\n');

  const organizationId = localStorage.getItem('activeOrganizationId') || 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
  const userId = 'test-user-' + Date.now();

  // Configurações de teste
  const config = {
    organizationId,
    userId,
    baseURL: window.location.origin
  };

  console.log('📋 Configuração:', config);
  console.log('');

  // ==========================================
  // TESTE 1: Criar Agente Pedagógico
  // ==========================================
  console.log('📝 TESTE 1: Criando agente pedagógico...');
  
  const pedagogicalAgent = {
    name: "Professor Virtual Krav Maga",
    description: "Agente especializado em ensino de Krav Maga para iniciantes e intermediários",
    specialization: "pedagogical",
    model: "gemini-1.5-flash",
    systemPrompt: `Você é um instrutor de Krav Maga certificado com 20 anos de experiência.

Suas responsabilidades:
- Sugerir exercícios adequados ao nível do aluno
- Corrigir técnicas com base em descrições
- Criar planos de aula personalizados
- Motivar alunos com feedback construtivo

Sempre responda em português brasileiro de forma clara e didática. Use emojis quando apropriado (🥋💪🎯).`,
    ragSources: [],
    mcpTools: [],
    temperature: 0.8,
    maxTokens: 2048
  };

  let createdAgentId;

  try {
    const response = await fetch(`${config.baseURL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': config.organizationId
      },
      body: JSON.stringify(pedagogicalAgent)
    });

    const result = await response.json();

    if (result.success) {
      createdAgentId = result.data.id;
      console.log('✅ Agente criado com sucesso!');
      console.log(`   ID: ${createdAgentId}`);
      console.log(`   Nome: ${result.data.name}`);
      console.log(`   Especialização: ${result.data.specialization}`);
      console.log(`   Modelo: ${result.data.model}`);
      console.log('');
    } else {
      console.error('❌ Erro ao criar agente:', result.message);
      return;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return;
  }

  // ==========================================
  // TESTE 2: Listar Agentes
  // ==========================================
  console.log('📋 TESTE 2: Listando todos os agentes...');

  try {
    const response = await fetch(`${config.baseURL}/api/agents`, {
      headers: {
        'x-organization-id': config.organizationId
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Encontrados ${result.total} agente(s):`);
      result.data.forEach((agent, index) => {
        console.log(`   ${index + 1}. ${agent.name} (${agent.specialization}) - ${agent.isActive ? '🟢 Ativo' : '🔴 Inativo'}`);
      });
      console.log('');
    } else {
      console.error('❌ Erro ao listar agentes:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }

  // ==========================================
  // TESTE 3: Chat com Agente (Primeira mensagem)
  // ==========================================
  console.log('💬 TESTE 3: Enviando primeira mensagem ao agente...');

  let conversationId;

  try {
    const response = await fetch(`${config.baseURL}/api/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': config.organizationId,
        'x-user-id': config.userId
      },
      body: JSON.stringify({
        agentId: createdAgentId,
        message: "Sou iniciante em Krav Maga. Quais são os 3 exercícios mais importantes para eu começar a praticar?"
      })
    });

    const result = await response.json();

    if (result.success) {
      conversationId = result.data.conversationId;
      const messages = result.data.messages;
      
      console.log('✅ Conversa iniciada!');
      console.log(`   Conversation ID: ${conversationId}`);
      console.log('');
      console.log('📝 Histórico da conversa:');
      console.log('─'.repeat(80));
      
      messages.forEach((msg, index) => {
        const roleIcon = msg.role === 'user' ? '👤' : '🤖';
        const roleName = msg.role === 'user' ? 'USUÁRIO' : 'AGENTE';
        
        console.log(`\n${roleIcon} ${roleName}:`);
        console.log(msg.content);
        
        if (msg.role === 'assistant' && msg.tokensUsed) {
          console.log(`\n   ℹ️ Tokens: ${msg.tokensUsed} | Tempo: ${msg.executionTime}ms`);
          if (msg.ragSourcesUsed?.length > 0) {
            console.log(`   📚 RAG Sources: ${msg.ragSourcesUsed.join(', ')}`);
          }
          if (msg.mcpToolsUsed?.length > 0) {
            console.log(`   🔧 MCP Tools: ${msg.mcpToolsUsed.join(', ')}`);
          }
        }
      });
      
      console.log('\n' + '─'.repeat(80));
      console.log('');
    } else {
      console.error('❌ Erro ao enviar mensagem:', result.message);
      return;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return;
  }

  // ==========================================
  // TESTE 4: Continuar Conversa
  // ==========================================
  console.log('💬 TESTE 4: Continuando conversa existente...');

  try {
    const response = await fetch(`${config.baseURL}/api/agents/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': config.organizationId,
        'x-user-id': config.userId
      },
      body: JSON.stringify({
        agentId: createdAgentId,
        conversationId: conversationId, // 👈 Continua conversa anterior
        message: "E para defesa contra chutes, qual a melhor técnica?"
      })
    });

    const result = await response.json();

    if (result.success) {
      const messages = result.data.messages;
      const lastMessage = messages[messages.length - 1];
      
      console.log('✅ Resposta recebida!');
      console.log(`   Total de mensagens: ${messages.length}`);
      console.log('');
      console.log('🤖 RESPOSTA DO AGENTE:');
      console.log('─'.repeat(80));
      console.log(lastMessage.content);
      console.log('─'.repeat(80));
      console.log('');
    } else {
      console.error('❌ Erro ao continuar conversa:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }

  // ==========================================
  // TESTE 5: Estatísticas
  // ==========================================
  console.log('📊 TESTE 5: Buscando estatísticas...');

  try {
    const response = await fetch(`${config.baseURL}/api/agents/stats`, {
      headers: {
        'x-organization-id': config.organizationId
      }
    });

    const result = await response.json();

    if (result.success) {
      const stats = result.data;
      console.log('✅ Estatísticas obtidas:');
      console.log(`   Total de Agentes: ${stats.totalAgents}`);
      console.log(`   Agentes Ativos: ${stats.activeAgents}`);
      console.log(`   Total de Conversas: ${stats.totalConversations}`);
      console.log(`   Avaliação Média: ${stats.averageRating ? stats.averageRating.toFixed(2) : 'N/A'} ⭐`);
      console.log('');
    } else {
      console.error('❌ Erro ao buscar estatísticas:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }

  // ==========================================
  // TESTE 6: Histórico de Conversas
  // ==========================================
  console.log('📜 TESTE 6: Buscando histórico de conversas...');

  try {
    const response = await fetch(`${config.baseURL}/api/agents/${createdAgentId}/conversations`, {
      headers: {
        'x-organization-id': config.organizationId
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Encontradas ${result.total} conversa(s):`);
      result.data.forEach((conv, index) => {
        const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
        const rating = conv.rating ? `${conv.rating}⭐` : 'Não avaliada';
        console.log(`   ${index + 1}. ID: ${conv.id} | Mensagens: ${messageCount} | Rating: ${rating}`);
      });
      console.log('');
    } else {
      console.error('❌ Erro ao buscar conversas:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }

  // ==========================================
  // TESTE 7: Avaliar Conversa
  // ==========================================
  console.log('⭐ TESTE 7: Avaliando conversa...');

  try {
    const response = await fetch(`${config.baseURL}/api/agents/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-organization-id': config.organizationId
      },
      body: JSON.stringify({
        rating: 5,
        feedback: "Excelente! O agente forneceu respostas muito úteis e didáticas."
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Conversa avaliada com sucesso!');
      console.log(`   Rating: ${result.data.rating}⭐`);
      console.log(`   Feedback: "${result.data.feedback}"`);
      console.log('');
    } else {
      console.error('❌ Erro ao avaliar conversa:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('');
  console.log('🎉 TESTES CONCLUÍDOS!');
  console.log('═'.repeat(80));
  console.log('');
  console.log('📊 Resumo:');
  console.log(`   ✅ Agente criado: ${createdAgentId}`);
  console.log(`   ✅ Conversa criada: ${conversationId}`);
  console.log(`   ✅ Mensagens trocadas: 4 (2 user + 2 assistant)`);
  console.log(`   ✅ Avaliação: 5⭐`);
  console.log('');
  console.log('🔍 Modo de Operação:');
  
  // Detectar se está usando Gemini real ou mock
  const checkResponse = await fetch(`${config.baseURL}/api/agents/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-organization-id': config.organizationId,
      'x-user-id': config.userId
    },
    body: JSON.stringify({
      agentId: createdAgentId,
      message: "teste"
    })
  }).then(r => r.json());

  const isMock = checkResponse.data?.messages?.[1]?.content?.includes('modo mock');
  
  if (isMock) {
    console.log('   ⚠️ MODO MOCK ATIVO');
    console.log('   Configure GEMINI_API_KEY no .env para respostas reais da IA');
    console.log('');
    console.log('   Como configurar:');
    console.log('   1. Obtenha API key em: https://makersuite.google.com/app/apikey');
    console.log('   2. Adicione no .env: GEMINI_API_KEY=sua_chave_aqui');
    console.log('   3. Reinicie o servidor: npm run dev');
  } else {
    console.log('   ✅ GEMINI AI CONECTADO');
    console.log('   Respostas sendo geradas pelo Google Gemini AI');
  }
  
  console.log('');
  console.log('📚 Próximos passos:');
  console.log('   1. Testar no frontend (#ai route)');
  console.log('   2. Criar agentes especializados (analytical, support, progression, commercial)');
  console.log('   3. Configurar RAG sources (documentos da academia)');
  console.log('   4. Configurar MCP tools (ferramentas autorizadas)');
  console.log('');
  console.log('═'.repeat(80));

})();
