/**
 * AGENT ORCHESTRATOR SERVICE
 * Sistema mestre que cria, gerencia e monitora agentes autônomos
 * Cada agente tem acesso controlado ao banco de dados via MCP
 */

import { prisma } from '@/utils/database';
import { GeminiService } from './geminiService';

// Tipos de agentes disponíveis
export enum AgentType {
    ORCHESTRATOR = 'orchestrator',      // Agente mestre que cria outros agentes
    MARKETING = 'marketing',            // Google Ads, Email, Redes Sociais
    COMERCIAL = 'comercial',            // WhatsApp, CRM, Vendas
    PEDAGOGICO = 'pedagogico',          // Cursos, Alunos, Planos de Aula
    FINANCEIRO = 'financeiro',          // Pagamentos, Asaas, Inadimplência
    ATENDIMENTO = 'atendimento'         // Suporte, FAQ, Chatbot
}

// Permissões de database por tipo de agente
export const AGENT_PERMISSIONS = {
    [AgentType.ORCHESTRATOR]: {
        tables: ['*'],                  // Acesso total
        operations: ['READ', 'WRITE', 'DELETE', 'CREATE']
    },
    [AgentType.MARKETING]: {
        tables: ['Student', 'Lead', 'Campaign', 'Analytics'],
        operations: ['READ', 'WRITE']
    },
    [AgentType.COMERCIAL]: {
        tables: ['Student', 'Lead', 'Subscription', 'BillingPlan', 'FinancialResponsible'],
        operations: ['READ', 'WRITE', 'CREATE']
    },
    [AgentType.PEDAGOGICO]: {
        tables: ['Student', 'Course', 'LessonPlan', 'Activity', 'TurmaAttendance', 'StudentCourse'],
        operations: ['READ', 'WRITE', 'CREATE']
    },
    [AgentType.FINANCEIRO]: {
        tables: ['Subscription', 'BillingPlan', 'FinancialResponsible', 'Student'],
        operations: ['READ', 'WRITE']
    },
    [AgentType.ATENDIMENTO]: {
        tables: ['Student', 'Lead', 'Course', 'LessonPlan'],
        operations: ['READ']
    }
};

// Interface de configuração de agente
export interface AgentConfig {
    id?: string;
    name: string;
    type: AgentType;
    description: string;
    systemPrompt: string;
    tools: string[];              // Ferramentas MCP disponíveis
    automationRules?: {
        trigger: string;          // Evento que dispara o agente
        action: string;           // Ação a executar
        schedule?: string;        // Cron schedule (opcional)
    }[];
    permissions?: {
        tables: string[];
        operations: string[];
    };
    isActive: boolean;
    organizationId: string;
}

// Interface de resultado de agente
export interface AgentResult {
    success: boolean;
    agentName: string;
    action: string;
    data?: any;
    error?: string;
    executionTime: number;
    databaseOperations?: {
        table: string;
        operation: string;
        recordsAffected: number;
    }[];
}

export class AgentOrchestratorService {
    
    /**
     * CRIAR NOVO AGENTE
     * O agente mestre cria um novo agente com permissões específicas
     */
    static async createAgent(config: AgentConfig): Promise<AgentResult> {
        const startTime = Date.now();
        
        try {
            // Validar permissões
            const permissions = config.permissions || AGENT_PERMISSIONS[config.type];
            
            // Salvar configuração do agente no banco
            const agent = await (prisma as any).aIAgent.create({
                data: {
                    name: config.name,
                    type: config.type,
                    description: config.description,
                    systemPrompt: config.systemPrompt,
                    tools: config.tools,
                    automationRules: config.automationRules as any,
                    permissions: permissions as any,
                    isActive: config.isActive,
                    organizationId: config.organizationId,
                    metadata: {
                        createdBy: 'orchestrator',
                        createdAt: new Date().toISOString()
                    }
                }
            });
            
            return {
                success: true,
                agentName: config.name,
                action: 'create_agent',
                data: agent,
                executionTime: Date.now() - startTime,
                databaseOperations: [{
                    table: 'Agent',
                    operation: 'CREATE',
                    recordsAffected: 1
                }]
            };
            
        } catch (error) {
            return {
                success: false,
                agentName: config.name,
                action: 'create_agent',
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * SUGERIR AGENTES
     * IA analisa o negócio e sugere quais agentes criar
     */
    static async suggestAgents(organizationId: string): Promise<AgentResult> {
        const startTime = Date.now();
        
        try {
            console.log('🤖 [AgentOrchestrator] Starting suggestAgents for org:', organizationId);
            
            // Buscar dados da organização
            const [students, courses, leads, subscriptions] = await Promise.all([
                prisma.student.count({ where: { organizationId } }),
                prisma.course.count({ where: { organizationId } }),
                prisma.lead.count({ where: { organizationId } }),
                prisma.studentSubscription.count({ where: { organizationId } })
            ]);
            
            console.log('📊 [AgentOrchestrator] Organization stats:', { students, courses, leads, subscriptions });
            
            // Prompt para IA sugerir agentes (SIMPLIFICADO e ESTRUTURADO)
            const analysisPrompt = `Você é um consultor de software para academias. Analise estes dados e sugira 2 agentes de automação.

ACADEMIA:
- Alunos: ${students}
- Cursos: ${courses}
- Leads: ${leads}
- Assinaturas: ${subscriptions}

IMPORTANTE: Responda APENAS com um array JSON válido, sem texto adicional.

Formato esperado:
[
  {
    "name": "Agente de Marketing",
    "type": "marketing",
    "description": "Envia campanhas personalizadas",
    "justification": "Academia tem ${leads} leads para converter"
  },
  {
    "name": "Agente de Retenção",
    "type": "retention",
    "description": "Monitora e previne evasão de alunos",
    "justification": "Gerenciar ${students} alunos ativos"
  }
]

Responda SOMENTE com o JSON, sem explicações.`;
            
            console.log('🧠 [AgentOrchestrator] Calling Gemini AI with timeout...');
            
            // Timeout de 8 segundos para não travar o frontend
            const timeoutPromise = new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error('Gemini API timeout (8s)')), 8000);
            });
            
            // Chamar Gemini SEM RAG (método simples, sem contexto)
            const geminiPromise = GeminiService.generateSimple(
                analysisPrompt, 
                {
                    temperature: 0.3, // Mais determinístico para JSON
                    maxTokens: 500
                }
            );
            
            const response = await Promise.race([geminiPromise, timeoutPromise]);
            console.log('✅ [AgentOrchestrator] Gemini response received');
            console.log('📝 [AgentOrchestrator] Raw response:', response);
            console.log('📝 [AgentOrchestrator] Response length:', response?.length || 0);
            
            // Parse da resposta da IA
            const suggestedAgents = this.parseAISuggestions(response);
            console.log('🔍 [AgentOrchestrator] Parsed agents:', suggestedAgents);
            
            return {
                success: true,
                agentName: 'orchestrator',
                action: 'suggest_agents',
                data: {
                    organizationStats: { students, courses, leads, subscriptions },
                    suggestedAgents
                },
                executionTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error('❌ [AgentOrchestrator] Error in suggestAgents:', error);
            return {
                success: false,
                agentName: 'orchestrator',
                action: 'suggest_agents',
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * EXECUTAR AGENTE
     * Executa uma tarefa específica com um agente
     */
    static async executeAgent(
        agentId: string,
        task: string,
        context?: any
    ): Promise<AgentResult> {
        const startTime = Date.now();
        
        try {
            // Buscar configuração do agente
            const agent = await (prisma as any).aIAgent.findUnique({
                where: { id: agentId }
            });
            
            if (!agent || !agent.isActive) {
                throw new Error('Agent not found or inactive');
            }
            
            // Montar prompt com contexto do agente
            const agentPrompt = `
${agent.systemPrompt}

TAREFA: ${task}

CONTEXTO ADICIONAL:
${JSON.stringify(context || {}, null, 2)}

PERMISSÕES DE DATABASE:
Tabelas: ${(agent.permissions as any)?.tables?.join(', ') || 'Nenhuma'}
Operações: ${(agent.permissions as any)?.operations?.join(', ') || 'Nenhuma'}

Execute a tarefa e retorne o resultado em JSON com:
- action: ação realizada
- data: dados processados
- databaseOperations: operações de banco executadas (se houver)
`;
            
            const response = await GeminiService.generateRAGResponse(agentPrompt, []);
            const result = this.parseAgentResponse(response);
            
            // Log da execução
            // Log execution only if the AgentExecution model exists in the Prisma client.
            try {
                const maybeAgentExecution = (prisma as any).agentExecution;
                if (maybeAgentExecution && typeof maybeAgentExecution.create === 'function') {
                    await maybeAgentExecution.create({
                        data: {
                            agentId: agent.id,
                            task,
                            context: context as any,
                            result: result as any,
                            executionTime: Date.now() - startTime,
                            timestamp: new Date()
                        }
                    });
                } else {
                    // Fallback: write to agent conversations if available (best-effort)
                    const maybeAgentConversation = (prisma as any).agentConversation || (prisma as any).agentConversation;
                    if (maybeAgentConversation && typeof maybeAgentConversation.create === 'function') {
                        await maybeAgentConversation.create({
                            data: {
                                agentId: agent.id,
                                messages: [{ task, result }],
                                metadata: { executionTime: Date.now() - startTime }
                            }
                        });
                    }
                }
            } catch (logError) {
                // Do not fail the whole execution if logging is not possible
                // Log server-side for debugging
                console.error('Agent execution logging skipped:', logError);
            }
            
            return {
                success: true,
                agentName: agent.name,
                action: result.action,
                data: result.data,
                executionTime: Date.now() - startTime,
                databaseOperations: result.databaseOperations
            };
            
        } catch (error) {
            return {
                success: false,
                agentName: 'unknown',
                action: 'execute_agent',
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * LISTAR AGENTES ATIVOS
     */
    static async listAgents(organizationId: string): Promise<AgentResult> {
        const startTime = Date.now();
        
        try {
            const agents = await (prisma as any).aIAgent.findMany({
                where: {
                    organizationId,
                    isActive: true
                },
                include: {
                    conversations: {
                        take: 5,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            
            // Transform to include compatibility fields expected by frontend
            const transformed = agents.map((a: any) => ({
                ...a,
                _count: { executions: (a.conversations || []).length },
                lastExecution: (a.conversations && a.conversations.length > 0)
                    ? { timestamp: a.conversations[0].updatedAt || a.conversations[0].createdAt, result: null }
                    : null
            }));

            return {
                success: true,
                agentName: 'orchestrator',
                action: 'list_agents',
                data: transformed,
                executionTime: Date.now() - startTime
            };
            
        } catch (error) {
            return {
                success: false,
                agentName: 'orchestrator',
                action: 'list_agents',
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * MONITORAR PERFORMANCE DOS AGENTES
     */
    static async monitorAgents(organizationId: string): Promise<AgentResult> {
        const startTime = Date.now();
        
        try {
            // Buscar métricas de todos os agentes
            const agents = await (prisma as any).aIAgent.findMany({
                where: { organizationId },
                include: {
                    conversations: {
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
                            }
                        }
                    }
                }
            });
            
            const metrics = agents.map(agent => ({
                agentId: agent.id,
                name: agent.name,
                type: agent.type,
                isActive: agent.isActive,
                totalConversations: agent.conversations.length,
                avgExecutionTime: 0,
                successRate: 0,
                lastConversation: agent.conversations[0]?.updatedAt || agent.conversations[0]?.createdAt || null
            }));
            
            return {
                success: true,
                agentName: 'orchestrator',
                action: 'monitor_agents',
                data: {
                    totalAgents: agents.length,
                    activeAgents: agents.filter(a => a.isActive).length,
                    metrics
                },
                executionTime: Date.now() - startTime
            };
            
        } catch (error) {
            return {
                success: false,
                agentName: 'orchestrator',
                action: 'monitor_agents',
                error: error instanceof Error ? error.message : String(error),
                executionTime: Date.now() - startTime
            };
        }
    }
    
    // =========================================================================
    // HELPERS
    // =========================================================================
    
    private static parseAISuggestions(aiResponse: string): any[] {
        try {
            console.log('🔧 [parseAISuggestions] Input:', aiResponse?.substring(0, 200));
            // Remove markdown code blocks se houver
            const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(cleaned);
            console.log('✅ [parseAISuggestions] Parsed successfully:', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ [parseAISuggestions] Parse failed:', error);
            console.error('❌ [parseAISuggestions] Input was:', aiResponse);
            // Fallback: retornar array vazio se parse falhar
            return [];
        }
    }
    
    private static parseAgentResponse(aiResponse: string): any {
        try {
            const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            return JSON.parse(cleaned);
        } catch {
            return {
                action: 'unknown',
                data: { rawResponse: aiResponse },
                databaseOperations: []
            };
        }
    }
}
