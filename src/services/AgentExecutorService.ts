import 'dotenv/config'; // Must be first to load env vars before singleton instantiation
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { agentService } from './AgentService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAgent, AgentConversation } from '@prisma/client';
import { DatabaseTool } from './mcp/databaseTool';
import { ReportTool } from './mcp/reportTool';

interface ExecutionContext {
  userId?: string;
  studentId?: string;
  courseId?: string;
  lessonId?: string;
  metadata?: Record<string, any>;
}

interface AIResponse {
  content: string;
  mcpToolsUsed: string[];
  ragSourcesUsed: string[];
  tokensUsed: number;
  executionTime: number;
}

/**
 * AgentExecutorService
 * 
 * Orquestra a execuÃ§Ã£o de agentes IA:
 * 1. Prepara contexto (RAG + MCP Tools)
 * 2. Chama Gemini AI com system prompt
 * 3. Processa resposta
 * 4. Salva histÃ³rico de conversa
 */
class AgentExecutorService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      logger.info('AgentExecutorService initialized with Gemini API');
    } else {
      logger.warn('GEMINI_API_KEY not found - AgentExecutorService running in mock mode');
    }
  }

  /**
   * Executa um agente com uma mensagem do usuÃ¡rio
   */
  async executeAgent(
    agentId: string,
    userMessage: string,
    context: ExecutionContext
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Buscar agente
      const agent = await agentService.getAgentById(agentId);
      
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      if (!agent.isActive) {
        throw new Error(`Agent ${agent.name} is not active`);
      }

      // 2. Preparar contexto RAG (se tiver fontes configuradas)
      const ragContext = await this.prepareRAGContext(agent.ragSources, userMessage);

      // 3. Preparar contexto MCP Tools (se tiver ferramentas configuradas)
      const mcpContext = await this.prepareMCPContext(agent.mcpTools, context);

      // 4. Construir prompt completo
      const fullPrompt = this.buildPrompt(agent, userMessage, ragContext, mcpContext, context);

      // 5. Chamar Gemini AI
      const response = await this.callGemini(agent, fullPrompt);

      // 6. Retornar resultado
      const executionTime = Date.now() - startTime;
      
      return {
        content: response.content,
        mcpToolsUsed: response.mcpToolsUsed,
        ragSourcesUsed: ragContext.sourcesUsed,
        tokensUsed: response.tokensUsed,
        executionTime
      };

    } catch (error: any) {
      logger.error('Error executing agent:', error);
      throw new Error(`Agent execution failed: ${error.message}`);
    }
  }

  /**
   * Prepara contexto RAG buscando documentos relevantes
   */
  private async prepareRAGContext(
    ragSources: string[],
    userMessage: string
  ): Promise<{ context: string; sourcesUsed: string[] }> {
    if (!ragSources || ragSources.length === 0) {
      return { context: '', sourcesUsed: [] };
    }

    try {
      // TODO: Integrar com RAG Service existente (src/services/ragService.ts)
      // Por enquanto, retorna contexto mockado
      
      const sourcesUsed: string[] = [];
      const contextParts: string[] = [];

      // Exemplo de busca em documentos (implementar quando RAG estiver pronto)
      for (const sourceId of ragSources) {
        // const docs = await ragService.search(sourceId, userMessage, { topK: 3 });
        // contextParts.push(docs.map(d => d.content).join('\n\n'));
        // sourcesUsed.push(sourceId);
        
        sourcesUsed.push(sourceId);
        contextParts.push(`[RAG Source: ${sourceId} - Contextual information will be loaded here]`);
      }

      return {
        context: contextParts.join('\n\n---\n\n'),
        sourcesUsed
      };

    } catch (error: any) {
      logger.error('Error preparing RAG context:', error);
      return { context: '', sourcesUsed: [] };
    }
  }

  /**
   * Prepara contexto MCP Tools executando ferramentas autorizadas
   * INTEGRADO com DatabaseTool e ReportTool reais
   */
  private async prepareMCPContext(
    mcpTools: string[],
    context: ExecutionContext
  ): Promise<{ context: string; toolsUsed: string[] }> {
    if (!mcpTools || mcpTools.length === 0) {
      return { context: '', toolsUsed: [] };
    }

    // Precisamos do organizationId do contexto
    const organizationId = context.metadata?.organizationId;
    if (!organizationId) {
      logger.warn('No organizationId in context, MCP tools may have limited data');
    }

    try {
      const toolsUsed: string[] = [];
      const contextParts: string[] = [];

      for (const toolName of mcpTools) {
        toolsUsed.push(toolName);
        
        switch (toolName.toLowerCase()) {
          case 'database': {
            // Execute key queries to provide context
            const queries = ['attendance_rate', 'popular_plans', 'overdue_payments', 'inactive_students'];
            const results: Record<string, any> = {};
            
            for (const queryName of queries) {
              if (organizationId) {
                const result = await DatabaseTool.executeQuery(queryName, organizationId, {});
                if (result.success) {
                  results[queryName] = result.data;
                }
              }
            }
            
            // Also get summary stats
            const [studentsCount, turmasCount, coursesCount, leadsCount, subscriptionsCount] = await Promise.all([
              prisma.student.count({ where: organizationId ? { organizationId } : {} }),
              prisma.turma.count({ where: organizationId ? { organizationId } : {} }),
              prisma.course.count({ where: organizationId ? { organizationId } : {} }),
              prisma.lead.count({ where: organizationId ? { organizationId } : {} }),
              prisma.studentSubscription.count({ where: organizationId ? { organizationId } : {} })
            ]);
            
            contextParts.push(`=== DATABASE TOOL RESULTS ===
📊 Resumo da Academia:
- Total de Alunos: ${studentsCount}
- Total de Turmas: ${turmasCount}
- Total de Cursos: ${coursesCount}
- Total de Leads: ${leadsCount}
- Assinaturas Ativas: ${subscriptionsCount}

📈 Taxa de Frequência: ${JSON.stringify(results.attendance_rate || 'N/A')}

💰 Pagamentos Atrasados: ${Array.isArray(results.overdue_payments) ? results.overdue_payments.length : 0} pendente(s)
${Array.isArray(results.overdue_payments) && results.overdue_payments.length > 0 
  ? results.overdue_payments.slice(0, 5).map((p: any) => 
      `  - ${p.student?.user?.firstName || 'N/A'} ${p.student?.user?.lastName || ''}: R$ ${p.amount || 0}`
    ).join('\n')
  : '  (Nenhum pagamento atrasado)'}

😴 Alunos Inativos (>30 dias): ${Array.isArray(results.inactive_students) ? results.inactive_students.length : 0}
${Array.isArray(results.inactive_students) && results.inactive_students.length > 0
  ? results.inactive_students.slice(0, 5).map((s: any) => 
      `  - ${s.user?.firstName || 'N/A'} ${s.user?.lastName || ''} (${s.user?.email || 'sem email'})`
    ).join('\n')
  : '  (Nenhum aluno inativo)'}

📦 Planos Mais Populares:
${Array.isArray(results.popular_plans) && results.popular_plans.length > 0
  ? results.popular_plans.slice(0, 5).map((p: any) => 
      `  - ${p.name}: ${p._count?.subscriptions || 0} assinaturas`
    ).join('\n')
  : '  (Nenhum plano encontrado)'}`);
            break;
          }
          
          case 'reports': {
            // List available report types
            contextParts.push(`=== REPORTS TOOL ===
📋 Relatórios Disponíveis:
- overdue_payments: Pagamentos Atrasados
- inactive_students: Alunos Inativos
- new_students: Novos Alunos
- attendance_summary: Resumo de Frequência
- popular_plans: Planos Mais Vendidos
- unconverted_leads: Leads Não Convertidos

Use: "Gerar relatório de [tipo] em [formato: JSON/CSV/PDF]"`);
            break;
          }
          
          case 'notifications': {
            contextParts.push(`=== NOTIFICATIONS TOOL ===
📧 Ações de Notificação Disponíveis:
- Enviar email para aluno/grupo
- Enviar WhatsApp (requer integração)
- Criar lembrete interno
- Agendar notificação futura

Use: "Notificar [destinatário] sobre [assunto]"`);
            break;
          }
          
          default:
            contextParts.push(`[MCP Tool: ${toolName} - Ferramenta disponível mas sem dados carregados]`);
        }
      }

      return {
        context: contextParts.join('\n\n'),
        toolsUsed
      };

    } catch (error: any) {
      logger.error('Error preparing MCP context:', error.message);
      logger.error('Stack:', error.stack);
      return { context: '', toolsUsed: [] };
    }
  }

  /**
   * ConstrÃ³i o prompt completo combinando:
   * - System prompt do agente
   * - Contexto RAG
   * - Contexto MCP
   * - Mensagem do usuÃ¡rio
   */
  private buildPrompt(
    agent: AIAgent,
    userMessage: string,
    ragContext: { context: string; sourcesUsed: string[] },
    mcpContext: { context: string; toolsUsed: string[] },
    executionContext: ExecutionContext
  ): string {
    const parts: string[] = [];

    // 1. System Prompt
    parts.push('=== INSTRUÃ‡Ã•ES DO AGENTE ===');
    parts.push(agent.systemPrompt);
    parts.push('');

    // 2. Contexto RAG (documentos relevantes)
    if (ragContext.context) {
      parts.push('=== CONTEXTO DE DOCUMENTOS RELEVANTES ===');
      parts.push(ragContext.context);
      parts.push('');
    }

    // 3. Contexto MCP (dados de ferramentas)
    if (mcpContext.context) {
      parts.push('=== DADOS DE FERRAMENTAS ===');
      parts.push(mcpContext.context);
      parts.push('');
    }

    // 4. Contexto adicional (aluno, curso, etc.)
    if (executionContext.studentId || executionContext.courseId) {
      parts.push('=== CONTEXTO DA SOLICITAÃ‡ÃƒO ===');
      if (executionContext.studentId) {
        parts.push(`ID do Aluno: ${executionContext.studentId}`);
      }
      if (executionContext.courseId) {
        parts.push(`ID do Curso: ${executionContext.courseId}`);
      }
      if (executionContext.metadata) {
        parts.push(`Metadados: ${JSON.stringify(executionContext.metadata)}`);
      }
      parts.push('');
    }

    // 5. Mensagem do usuÃ¡rio
    parts.push('=== PERGUNTA DO USUÃRIO ===');
    parts.push(userMessage);
    parts.push('');
    parts.push('=== SUA RESPOSTA ===');
    parts.push('(Responda de forma clara, objetiva e em portuguÃªs brasileiro)');

    return parts.join('\n');
  }

  /**
   * Chama Gemini AI com o prompt construÃ­do
   */
  private async callGemini(
    agent: AIAgent,
    prompt: string
  ): Promise<{ content: string; mcpToolsUsed: string[]; tokensUsed: number }> {
    
    logger.info('🚀 ===== STARTING GEMINI API CALL =====');
    logger.info('Agent ID:', agent.id);
    logger.info('Agent Name:', agent.name);
    logger.info('Agent Model:', agent.model);
    logger.info('Prompt Length:', prompt.length);
    logger.info('Prompt Preview:', prompt.substring(0, 200) + '...');
    logger.info('==========================================');
    
    // Modo mock (sem API key)
    if (!this.genAI) {
      logger.warn('⚠️ Gemini API not configured - returning mock response');
      return {
        content: this.generateMockResponse(agent, prompt),
        mcpToolsUsed: [],
        tokensUsed: 0
      };
    }

    try {
      // Selecionar modelo baseado na configuração do agente
      const modelName = agent.model || process.env.GEMINI_MODEL || process.env.RAG_MODEL || 'gemini-2.5-flash';
      logger.info('📊 Using Gemini model:', modelName);
      
      const model = this.genAI.getGenerativeModel({ 
        model: modelName
      });

      // Configurar parÃ¢metros de geraÃ§Ã£o
      const generationConfig = {
        temperature: agent.temperature || 0.7,
        maxOutputTokens: agent.maxTokens || 2048,
        topP: 0.95,
        topK: 40,
      };

      // Chamar API
      logger.info('📤 Sending request to Gemini API...');
      const startTime = Date.now();
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });

      const elapsedTime = Date.now() - startTime;
      logger.info(`📥 Received response from Gemini API in ${elapsedTime}ms`);

      const response = result.response;
      const text = response.text();

      // Calcular tokens (aproximação)
      const tokensUsed = Math.ceil((prompt.length + text.length) / 4);

      logger.info('✅ ===== GEMINI API SUCCESS =====');
      logger.info('Model:', modelName);
      logger.info('Tokens Used:', tokensUsed);
      logger.info('Response Length:', text.length);
      logger.info('Response Preview:', text.substring(0, 200) + '...');
      logger.info('Finish Reason:', response.candidates?.[0]?.finishReason);
      logger.info('Safety Ratings:', JSON.stringify(response.candidates?.[0]?.safetyRatings || []));
      logger.info('Time Elapsed:', `${elapsedTime}ms`);
      logger.info('=================================');


      return {
        content: text,
        mcpToolsUsed: [], // TODO: Extrair ferramentas usadas da resposta
        tokensUsed
      };

    } catch (error: any) {
      // Log completo do erro para debug (usando console.log para ver valores)
      console.error('❌ ===== GEMINI API ERROR =====');
      console.error('Error Type:', error?.constructor?.name);
      console.error('Error Message:', error?.message);
      console.error('Error Code:', error?.code);
      console.error('Error Status:', error?.status || error?.statusCode);
      console.error('Error Status Text:', error?.statusText);
      console.error('Model:', agent.model || 'gemini-2.0-flash-exp');
      console.error('Agent ID:', agent.id);
      console.error('Agent Name:', agent.name);
      console.error('Prompt Length:', prompt.length);
      
      // Log do stack trace completo
      if (error?.stack) {
        console.error('Stack Trace:', error.stack);
      }
      
      // Log de propriedades adicionais do erro
      console.error('Error Object Keys:', Object.keys(error || {}));
      console.error('Full Error:', error);
      console.error('===============================');
      
      // Re-throw para não silenciar o erro
      throw error;
    }
  }

  /**
   * Gera resposta mockada baseada na especializaÃ§Ã£o do agente
   */
  private generateMockResponse(agent: AIAgent, prompt: string): string {
    const responses: Record<string, string> = {
      pedagogical: `Como agente pedagógico ${agent.name}, sugiro os seguintes exercícios:\n\n1. **Aquecimento Dinâmico**: 10 minutos de movimentação corporal progressiva\n2. **Técnicas Básicas**: Revisão de golpes fundamentais com foco em postura\n3. **Aplicação Prática**: Simulações de defesa em duplas\n\n(Resposta gerada em modo mock - configure GEMINI_API_KEY para respostas reais)`,

      analytical: `Baseado na análise de dados (${agent.name}):\n\n📊 **Métricas Identificadas**:\n- Taxa de presença média: 78%\n- Alunos em risco de evasão: 5 (abaixo de 50% presença)\n- Performance geral: Crescente (+12% vs mês anterior)\n\n🎯 **Recomendações**:\n1. Contatar alunos com presença < 50%\n2. Intensificar aulas de técnicas avançadas (alta demanda)\n\n(Resposta gerada em modo mock - configure GEMINI_API_KEY para análises reais)`,

      support: `Olá! Como assistente de suporte ${agent.name}, estou aqui para ajudar! 💪\n\n**Para melhorar sua técnica:**\n- Pratique movimentos lentos inicialmente\n- Foque na postura e equilíbrio\n- Aumente velocidade gradualmente\n- Peça feedback ao instrutor\n\n**Dica motivacional**: Todo mestre foi iniciante um dia. Continue praticando!\n\n(Resposta gerada em modo mock - configure GEMINI_API_KEY para suporte personalizado)`,

      progression: `Análise de progressão (${agent.name}):\n\n📈 **Status Atual**: Faixa intermediária\n🔜 **Próximos Passos**:\n1. Dominar 3 técnicas avançadas pendentes\n2. Completar 8 aulas antes da próxima avaliação\n3. Melhorar tempo de reação em 15%\n\n✅ **Pontos Fortes**: Defesa, condicionamento\n⚠️ **Áreas de Melhoria**: Velocidade de contra-ataque\n\n(Resposta gerada em modo mock - configure GEMINI_API_KEY para análises detalhadas)`,

      commercial: `Análise comercial (${agent.name}):\n\n💰 **Indicadores Chave**:\n- CAC (Custo Aquisição Cliente): R$ 120\n- LTV (Lifetime Value): R$ 1.800\n- Churn Rate: 8% ao mês\n- ROI Campanhas: 340%\n\n📋 **Ações Recomendadas**:\n1. Investir em remarketing (conversão 2.5x maior)\n2. Programa de indicação (custo 60% menor)\n3. Reduzir churn nos primeiros 3 meses\n\n(Resposta gerada em modo mock - configure GEMINI_API_KEY para análises financeiras reais)`
    };

    return (
      responses[agent.specialization] ||
      `Resposta do agente ${agent.name} (${agent.specialization}).\n\n(Configure GEMINI_API_KEY no arquivo .env para obter respostas reais da IA)`
    );
  }

  /**
   * Cria uma nova conversa e executa o agente em um Ãºnico fluxo
   */
  async createConversationAndExecute(
    agentId: string,
    userMessage: string,
    context: ExecutionContext
  ): Promise<AgentConversation> {
    
    // 1. Executar agente
    const aiResponse = await this.executeAgent(agentId, userMessage, context);

    // 2. Criar conversa com mensagens completas
    const conversation = await agentService.createConversation({
      agentId,
      userId: context.userId,
      studentId: context.studentId,
      messages: [
        {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
          mcpToolsUsed: aiResponse.mcpToolsUsed,
          ragSourcesUsed: aiResponse.ragSourcesUsed,
          tokensUsed: aiResponse.tokensUsed,
          executionTime: aiResponse.executionTime
        }
      ],
      metadata: {
        ...context.metadata,
        initialMessage: userMessage,
        agentSpecialization: (await agentService.getAgentById(agentId))?.specialization,
        executionStats: {
          tokensUsed: aiResponse.tokensUsed,
          executionTime: aiResponse.executionTime
        }
      }
    });

    logger.info(`Conversation created - Agent: ${agentId}, ConversationId: ${conversation.id}`);

    return conversation;
  }

  /**
   * Continua uma conversa existente com nova mensagem
   */
  async continueConversation(
    conversationId: string,
    userMessage: string,
    context: ExecutionContext
  ): Promise<AgentConversation> {
    
    // 1. Buscar conversa existente
    const existingConversation = await prisma.agentConversation.findUnique({
      where: { id: conversationId },
      include: { agent: true }
    });

    if (!existingConversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 2. Executar agente com contexto de mensagens anteriores
    const aiResponse = await this.executeAgent(
      existingConversation.agentId, 
      userMessage, 
      {
        ...context,
        metadata: {
          ...context.metadata,
          conversationHistory: existingConversation.messages
        }
      }
    );

    // 3. Atualizar conversa com novas mensagens
    const updatedMessages = [
      ...(existingConversation.messages as any[]),
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        mcpToolsUsed: aiResponse.mcpToolsUsed,
        ragSourcesUsed: aiResponse.ragSourcesUsed,
        tokensUsed: aiResponse.tokensUsed,
        executionTime: aiResponse.executionTime
      }
    ];

    try {
      const updatedConversation = await agentService.updateConversation(conversationId, {
        messages: updatedMessages
      });

      logger.info(`✅ Conversation continued - ConversationId: ${conversationId}, Messages: ${updatedMessages.length}`);
      return updatedConversation;
    } catch (error: any) {
      logger.error(`❌ Failed to persist conversation update:`, {
        conversationId,
        error: error.message,
        code: error.code
      });

      // Return a temporary conversation object even if DB update fails
      // This allows the user to see the AI response even during DB issues
      logger.warn(`⚠️ Returning temporary conversation due to DB error`);
      return {
        ...existingConversation,
        messages: updatedMessages,
        updatedAt: new Date()
      } as any;
    }
  }
}

// Export singleton instance
export const agentExecutorService = new AgentExecutorService();
export default agentExecutorService;


