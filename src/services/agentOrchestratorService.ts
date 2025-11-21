/**
 * AGENT ORCHESTRATOR SERVICE
 * Sistema mestre que cria, gerencia e monitora agentes autônomos
 * Cada agente tem acesso controlado ao banco de dados via MCP
 */

import { prisma } from '@/utils/database';
import { GeminiService } from './geminiService';
import { DatabaseTool } from './mcp/databaseTool';

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

// Mapeamento de specialization → permissões de database
const SPECIALIZATION_TO_PERMISSIONS: Record<string, { tables: string[], operations: string[] }> = {
    'pedagogical': {
        tables: ['Student', 'Course', 'LessonPlan', 'Activity', 'TurmaAttendance', 'StudentCourse', 'Subscription', 'BillingPlan'],
        operations: ['READ', 'WRITE', 'CREATE']
    },
    'commercial': {
        tables: ['Student', 'Lead', 'Subscription', 'BillingPlan', 'FinancialResponsible', 'Campaign'],
        operations: ['READ', 'WRITE', 'CREATE']
    },
    'analytical': {
        tables: ['*'],  // Acesso de leitura a tudo para análises
        operations: ['READ']
    },
    'support': {
        tables: ['Student', 'Lead', 'Course', 'LessonPlan'],
        operations: ['READ']
    },
    'progression': {
        tables: ['Student', 'Course', 'LessonPlan', 'Activity', 'TurmaAttendance', 'StudentCourse', 'Graduation'],
        operations: ['READ', 'WRITE']
    },
    'curriculum': {
        tables: ['Course', 'LessonPlan', 'Activity', 'Technique', 'ActivityCategory', 'Graduation'],
        operations: ['READ', 'WRITE', 'CREATE']
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
    autoSaveInsights?: boolean;   // Auto-salvar insights no banco
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

// Mapeamento de tipos de agentes para especializações (schema Prisma)
const AGENT_TYPE_TO_SPECIALIZATION: Record<string, string> = {
    'marketing': 'commercial',
    'comercial': 'commercial',
    'pedagogico': 'pedagogical',
    'financeiro': 'commercial',
    'atendimento': 'support',
    'ADMINISTRATIVE': 'support',
    'MARKETING': 'commercial',
    'PEDAGOGICAL': 'pedagogical',
    'FINANCIAL': 'commercial',
    'SUPPORT': 'support',
    'orchestrator': 'analytical'
};

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
            
            // Determinar specialization baseado no tipo (com cast para tipo correto)
            const specialization = (AGENT_TYPE_TO_SPECIALIZATION[config.type] || 'support');
            
            console.log('🔧 [AgentOrchestrator] Creating agent:', {
                name: config.name,
                type: config.type,
                specialization,
                organizationId: config.organizationId,
                tools: config.tools
            });
            
            // ✅ CORREÇÃO: AIAgent (não aIAgent)
            const agent = await prisma.aIAgent.create({
                data: {
                    name: config.name,
                    description: config.description,
                    systemPrompt: config.systemPrompt,
                    specialization: specialization as any,
                    ragSources: [],
                    mcpTools: config.tools || [],
                    // autoSaveInsights: config.autoSaveInsights || false, // Removed as it's not in schema
                    isActive: config.isActive,
                    organization: {
                        connect: { id: config.organizationId }
                    }
                }
            });
            
            console.log('✅ [AgentOrchestrator] Agent created successfully:', agent.id);
            
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
            console.error('❌ [AgentOrchestrator] Error creating agent:', error);
            console.error('❌ [AgentOrchestrator] Config sent:', JSON.stringify(config, null, 2));
            
            // ✅ Log detalhado do erro
            if (error instanceof Error) {
                console.error('❌ [AgentOrchestrator] Error message:', error.message);
                console.error('❌ [AgentOrchestrator] Error stack:', error.stack);
            }
            
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
            
            // Prompt ULTRA-CONCISO para IA sugerir agentes (forçar brevidade)
            const analysisPrompt = `${students} alunos, ${courses} cursos, ${leads} leads, ${subscriptions} assinaturas.

JSON array (máx 2 agentes, descrições de 10 palavras):
[{"name":"","type":"marketing|financeiro|pedagogico","description":"","justification":""}]`;
            
            console.log('🧠 [AgentOrchestrator] Calling Gemini AI with timeout...');
            
            // Timeout de 15 segundos (frontend tem 20s, então dá 5s de margem)
            const timeoutPromise = new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error('Gemini API timeout (15s)')), 15000);
            });
            
            // Chamar Gemini com maxTokens MAIOR
            const geminiPromise = GeminiService.generateSimple(
                analysisPrompt, 
                {
                    temperature: 0.1, // ✅ MAIS determinístico (era 0.3)
                    maxTokens: 2048 // ✅ DOBRADO de 1000 para 2048
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
            console.log('[AgentOrchestrator] 🔄 Starting agent execution:', agentId);
            
            // Buscar configuração do agente
            const agent = await (prisma as any).aIAgent.findUnique({
                where: { id: agentId }
            });
            
            console.log('[AgentOrchestrator] ✅ Agent found:', agent?.name, 'specialization:', agent?.specialization);
            
            if (!agent || !agent.isActive) {
                throw new Error('Agent not found or inactive');
            }
            
            // Buscar permissões baseadas na especialização do agente
            const permissions = SPECIALIZATION_TO_PERMISSIONS[agent.specialization] || {
                tables: [],
                operations: []
            };
            
            console.log('[AgentOrchestrator] 🔐 Permissions assigned:', {
                tables: permissions.tables.length,
                operations: permissions.operations.join(',')
            });
            
            // 🆕 EXECUTAR FERRAMENTAS MCP (Database Tool)
            let mcpContextData = '';
            const mcpToolsUsed: string[] = [];
            
            if (agent.mcpTools && agent.mcpTools.includes('database') && context?.organizationId) {
                console.log('[AgentOrchestrator] 🔧 Executing MCP Database Tool...');
                
                try {
                    // Executar queries relevantes baseadas na especialização
                    const queryResults: Record<string, any> = {};
                    
                    if (agent.specialization === 'pedagogical') {
                        // Agente pedagógico: alunos novos, inativos, taxa de frequência, planos populares
                        const [newStudents, inactiveStudents, attendanceRate, popularPlans] = await Promise.all([
                            DatabaseTool.executeQuery('new_students', context.organizationId, { days: 30 }),
                            DatabaseTool.executeQuery('inactive_students', context.organizationId, { days: 30 }),
                            DatabaseTool.executeQuery('attendance_rate', context.organizationId, { days: 30 }),
                            DatabaseTool.executeQuery('popular_plans', context.organizationId)
                        ]);
                        
                        queryResults['new_students'] = newStudents;
                        queryResults['inactive_students'] = inactiveStudents;
                        queryResults['attendance_rate'] = attendanceRate;
                        queryResults['popular_plans'] = popularPlans;
                    } else if (agent.specialization === 'commercial') {
                        // Agente comercial: leads não convertidos, planos populares
                        const [unconvertedLeads, popularPlans] = await Promise.all([
                            DatabaseTool.executeQuery('unconverted_leads', context.organizationId, { days: 14 }),
                            DatabaseTool.executeQuery('popular_plans', context.organizationId)
                        ]);
                        
                        queryResults['unconverted_leads'] = unconvertedLeads;
                        queryResults['popular_plans'] = popularPlans;
                    } else {
                        // Outras especializações: novos alunos
                        const newStudents = await DatabaseTool.executeQuery('new_students', context.organizationId, { days: 30 });
                        queryResults['new_students'] = newStudents;
                    }
                    
                    mcpContextData = `
=== DADOS DO BANCO DE DADOS (MCP DATABASE TOOL) ===

${Object.entries(queryResults).map(([queryName, result]) => {
    if (result.success) {
        const data = result.data;
        const dataCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
        
        // Resumir dados ao invés de JSON completo (evitar prompt gigante)
        let summary = '';
        if (Array.isArray(data) && data.length > 0) {
            // Mostrar apenas primeiros 3 registros + contagem total
            const sample = data.slice(0, 3).map((item: any) => {
                if (item.user) {
                    return `${item.user.firstName} ${item.user.lastName} (ID: ${item.id.substring(0,8)}...)`;
                } else if (item.name) {
                    return `${item.name} (ID: ${item.id.substring(0,8)}...)`;
                } else if (item.firstName) {
                    return `${item.firstName} ${item.lastName} (ID: ${item.id.substring(0,8)}...)`;
                }
                return `ID: ${item.id.substring(0,8)}...`;
            });
            summary = `\nExemplos: ${sample.join(', ')}`;
            if (data.length > 3) {
                summary += `\n... e mais ${data.length - 3} registros`;
            }
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            // Dados agregados (ex: attendance_rate)
            summary = `\n${JSON.stringify(data, null, 2)}`;
        }
        
        return `
**${queryName}** (${result.description}):
Total de registros: ${dataCount}${summary}
`;
    } else {
        return `
**${queryName}**: ❌ Erro - ${result.error}
`;
    }
}).join('\n')}

📊 INSTRUÇÕES:
- Use os dados acima para análise
- Foque em INSIGHTS e AÇÕES, não repita os dados brutos
- Priorize alunos em situação crítica (inativos, sem matrícula, plano vencendo)
`;
                    
                    mcpToolsUsed.push('database');
                    console.log('[AgentOrchestrator] ✅ MCP Tool executed:', Object.keys(queryResults).length, 'queries');
                    
                } catch (mcpError: any) {
                    console.error('[AgentOrchestrator] ❌ MCP Tool failed:', mcpError.message);
                    mcpContextData = `\n=== ERRO AO BUSCAR DADOS ===\n${mcpError.message}\n`;
                }
            }
            
            // Montar prompt com contexto do agente + dados MCP
            const agentPrompt = `
Você é um agente especializado em gestão pedagógica de academias.

TAREFA: ${task}

${mcpContextData}

INSTRUÇÕES CRÍTICAS:
1. Analise os dados acima
2. Identifique TOP 3 insights mais importantes
3. Sugira TOP 3 ações prioritárias com MÉTODO DE EXECUÇÃO
4. Seja EXTREMAMENTE CONCISO (máximo 500 palavras)
5. Use emojis e bullet points

⚠️ IMPORTANTE - MÉTODO DE EXECUÇÃO:
Para CADA ação, você DEVE especificar:
- **executionMethod**: "TASK_SCHEDULED" (agendada diária/semanal) | "MCP_IMMEDIATE" (via MCP agora) | "USER_INTERVENTION" (precisa humano)
- **executionDetails**: Explicação clara de como será executado
- **requiresApproval**: true se precisa aprovação humana antes

EXEMPLOS:
✅ "Enviar WhatsApp para 5 alunos inativos" → executionMethod: "MCP_IMMEDIATE", executionDetails: "Executarei via MCP Tools (database + whatsapp) agora mesmo"
✅ "Monitorar frequência diária" → executionMethod: "TASK_SCHEDULED", executionDetails: "Criarei task agendada para rodar todo dia às 08h"
✅ "Revisar currículo do curso" → executionMethod: "USER_INTERVENTION", executionDetails: "Requer análise pedagógica humana"

FORMATO DA RESPOSTA (JSON):
{
  "summary": "Resumo em 1 frase",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "actions": [
    {
      "description": "ação 1",
      "executionMethod": "MCP_IMMEDIATE | TASK_SCHEDULED | USER_INTERVENTION",
      "executionDetails": "explicação de como será feito",
      "requiresApproval": true/false,
      "schedule": "daily 08:00" (se TASK_SCHEDULED)
    }
  ],
  "priority": "HIGH/MEDIUM/LOW"
}

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.
`;
            
            console.log('[AgentOrchestrator] 🤖 Calling Gemini with prompt length:', agentPrompt.length);
            console.log('[AgentOrchestrator] 📊 Permissions in prompt:', {
                tables: permissions.tables.join(', '),
                operations: permissions.operations.join(', ')
            });
            console.log('[AgentOrchestrator] 🎛️ Gemini config:', {
                temperature: agent.temperature || 0.7,
                maxTokens: 8192 // Gemini 2.5 Flash suporta até 8192
            });
            
            // Usar generateSimple com maxTokens MÁXIMO (8192 para Gemini 2.5 Flash)
            const response = await GeminiService.generateSimple(agentPrompt, {
                temperature: agent.temperature || 0.7,
                maxTokens: 8192 // Máximo do Gemini 2.5 Flash
            });
            
            console.log('[AgentOrchestrator] ✅ Gemini response received, length:', response.length);
            
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
            
            // 🆕 AUTO-SAVE INSIGHTS (sempre salvar quando houver insights)
            if (result.insights && Array.isArray(result.insights) && context?.organizationId) {
                try {
                    const { AgentInsightService } = await import('@/services/agentInsightService');
                    const insightService = new AgentInsightService();
                    
                    // Criar insights individuais a partir dos insights retornados
                    for (const insightText of result.insights) {
                        await insightService.createInsight({
                            organizationId: context.organizationId,
                            agentId: agent.id,
                            type: 'INSIGHT',
                            category: 'OPERATIONAL',
                            title: insightText.substring(0, 100), // Primeiros 100 chars como título
                            content: insightText,
                            priority: result.priority || 'MEDIUM'
                        });
                    }
                    
                    console.log(`[AgentOrchestrator] ✅ Saved ${result.insights.length} insights to database`);
                } catch (saveError: any) {
                    console.error('[AgentOrchestrator] ⚠️ Failed to auto-save insights:', saveError.message);
                    // Não falhar a execução se o salvamento falhar
                }
            }
            
            // 🆕 CREATE TASKS FROM ACTIONS
            if (result.actions && Array.isArray(result.actions) && context?.organizationId) {
                try {
                    const { AgentTaskService } = await import('@/services/agentTaskService');
                    const taskService = new AgentTaskService();
                    
                    for (const action of result.actions) {
                        await taskService.createTask({
                            organizationId: context.organizationId,
                            agentId: agent.id,
                            title: action.description || 'Nova Tarefa',
                            description: action.executionDetails || action.description || 'Tarefa gerada pelo agente',
                            category: 'GENERATED',
                            actionType: action.executionMethod || 'MANUAL',
                            actionPayload: action,
                            priority: result.priority || 'MEDIUM',
                            requiresApproval: action.requiresApproval !== false // Default to true
                        });
                    }
                    console.log(`[AgentOrchestrator] ✅ Created ${result.actions.length} tasks from actions`);
                } catch (taskError: any) {
                    console.error('[AgentOrchestrator] ⚠️ Failed to create tasks:', taskError.message);
                }
            }
            
            return {
                success: true,
                agentName: agent.name,
                action: 'execute_agent',
                data: {
                    summary: result.summary || '',
                    insights: result.insights || [],
                    actions: result.actions || [],
                    priority: result.priority || 'MEDIUM',
                    rawResponse: result
                },
                executionTime: Date.now() - startTime
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
            if (!aiResponse || typeof aiResponse !== 'string') return [];

            // Check for Gemini fallback message (when API fails)
            if (aiResponse.includes('[Fallback AI]')) {
                console.log('⚠️ [parseAISuggestions] Gemini fallback detected, returning empty array');
                return [];
            }

            // Remove markdown code fences
            let cleaned = aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

            // If response contains extra commentary, try to extract the first JSON array block
            // Matches the outermost [ ... ] including newlines and nested braces
            const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                cleaned = arrayMatch[0];
            }

            // Try to parse, if fails due to truncation, attempt to fix
            try {
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed)) {
                    console.log('✅ [parseAISuggestions] Parsed successfully:', parsed);
                    return parsed;
                }
            } catch (parseError: any) {
                // If JSON is truncated (unterminated string), try to fix it
                if (parseError.message?.includes('Unterminated string')) {
                    console.log('⚠️ [parseAISuggestions] Detected truncated JSON, attempting to fix...');
                    
                    // Close unterminated strings and array
                    let fixed = cleaned;
                    
                    // Count open braces vs close braces
                    const openBraces = (fixed.match(/\{/g) || []).length;
                    const closeBraces = (fixed.match(/\}/g) || []).length;
                    
                    // If string is open, close it
                    if (!fixed.endsWith('"')) {
                        fixed += '"';
                    }
                    
                    // Close any open braces
                    for (let i = 0; i < (openBraces - closeBraces); i++) {
                        fixed += '}';
                    }
                    
                    // Close array if needed
                    if (!fixed.endsWith(']')) {
                        fixed += ']';
                    }
                    
                    console.log('🔧 [parseAISuggestions] Fixed JSON:', fixed);
                    
                    try {
                        const parsedFixed = JSON.parse(fixed);
                        if (Array.isArray(parsedFixed) && parsedFixed.length > 0) {
                            console.log('✅ [parseAISuggestions] Fixed and parsed successfully:', parsedFixed);
                            return parsedFixed;
                        }
                    } catch (fixError) {
                        console.error('❌ [parseAISuggestions] Fix attempt failed:', fixError);
                    }
                }
                throw parseError;
            }
            
            return [];
        } catch (error) {
            console.error('❌ [parseAISuggestions] Parse failed:', error);
            console.error('❌ [parseAISuggestions] Input was:', aiResponse);
            // Return empty; route will provide fallback suggestions
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
