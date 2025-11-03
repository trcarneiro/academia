/**
 * AGENT ORCHESTRATOR ROUTES
 * API para criar, gerenciar e executar agentes autônomos
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/utils/database';
import { AgentOrchestratorService, AgentType, AgentConfig } from '@/services/agentOrchestratorService';
import { AgentInteractionService } from '@/services/agentInteractionService';
import { AgentPermissionService } from '@/services/agentPermissionService';
import { AgentAutomationService } from '@/services/agentAutomationService';
import { authorizationService } from '@/services/authorizationService';

// Schemas de validaÃ§Ã£o
const CreateAgentSchema = z.object({
    name: z.string().min(3).max(100),
    type: z.nativeEnum(AgentType),
    description: z.string().optional(),
    systemPrompt: z.string().min(10),
    tools: z.array(z.string()),
    autoSaveInsights: z.boolean().optional().default(false),
    automationRules: z.array(z.object({
        trigger: z.string(),
        action: z.string(),
        schedule: z.string().optional()
    })).optional(),
    isActive: z.boolean().default(true)
});

const ExecuteAgentSchema = z.object({
    task: z.string().min(5),
    context: z.any().optional()
});

export async function agentOrchestratorRoutes(fastify: FastifyInstance) {
    
    /**
     * POST /api/agents/orchestrator/suggest
     * Sugerir agentes para criar baseado no negócio
     * ✅ RETORNA: Agentes existentes + Novas sugestões da IA
     */
    fastify.post('/orchestrator/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = (request.headers['x-organization-id'] as string) || (request.body as any)?.organizationId;
            if (!organizationId) {
                return reply.status(400).send({ success: false, error: 'organizationId is required' });
            }

            // 🆕 BUSCAR AGENTES EXISTENTES (já criados)
            const existingAgents = await prisma.aIAgent.findMany({
                where: { 
                    organizationId,
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    specialization: true,
                    mcpTools: true,
                    createdAt: true
                }
            });

            request.log.info(`[AgentOrchestrator] Found ${existingAgents.length} existing agents`);

            const result = await AgentOrchestratorService.suggestAgents(organizationId);

            // Fallback suggestions when AI is unavailable or returns non-JSON/empty
            const fallbackSuggestions = [
                { name: 'Assistente Administrativo', type: 'financeiro', description: 'Monitora planos, pagamentos e inscrições; sugere ações e relatórios.', tools: ['database', 'reports', 'notifications'] },
                { name: 'Agente Pedagógico', type: 'pedagogico', description: 'Analisa cursos e planos de aula; sugere melhorias baseadas em dados.', tools: ['lesson_plans', 'courses', 'activity_stats'] },
                { name: 'Agente de Marketing', type: 'marketing', description: 'Analisa leads e campanhas; propõe próximas ações comerciais.', tools: ['crm', 'google_ads'] }
            ];

            // 🆕 COMBINAR: Agentes existentes + Sugestões novas
            const existingFormatted = existingAgents.map(agent => ({
                id: agent.id,
                name: agent.name,
                type: agent.specialization,
                description: agent.description || 'Agente já criado',
                tools: agent.mcpTools || [],
                status: 'created',
                createdAt: agent.createdAt
            }));

            if (result.success) {
                const stats = (result as any).data?.organizationStats;
                const suggested = (result as any).data?.suggestedAgents;
                const hasSuggestions = Array.isArray(suggested) && suggested.length > 0;

                if (!hasSuggestions) {
                    request.log.info('[AgentOrchestrator] Using fallback suggestions (AI returned empty or invalid JSON)');
                }

                const suggestionsWithStatus = (hasSuggestions ? suggested : fallbackSuggestions).map(s => ({
                    ...s,
                    status: 'suggested'
                }));

                return reply.send({
                    success: true,
                    data: {
                        organizationStats: stats || null,
                        existingAgents: existingFormatted,
                        suggestedAgents: suggestionsWithStatus,
                        allAgents: [...existingFormatted, ...suggestionsWithStatus]
                    },
                    message: hasSuggestions ? undefined : (result as any).error || 'AI fallback'
                });
            }

            request.log.warn('[AgentOrchestrator] AI suggestAgents failed; returning fallback suggestions');
            const fallbackWithStatus = fallbackSuggestions.map(s => ({ ...s, status: 'suggested' }));
            
            return reply.send({ 
                success: true, 
                data: { 
                    organizationStats: null, 
                    existingAgents: existingFormatted,
                    suggestedAgents: fallbackWithStatus,
                    allAgents: [...existingFormatted, ...fallbackWithStatus]
                }, 
                message: (result as any).error || 'AI fallback' 
            });

        } catch (error) {
            fastify.log.error('Error suggesting agents:', error);
            const fb = [
                { name: 'Assistente Administrativo', type: 'financeiro', description: 'Acompanha finanças e inscrições.', tools: ['database', 'reports'], status: 'suggested' }
            ];
            return reply.send({ success: true, data: { organizationStats: null, existingAgents: [], suggestedAgents: fb, allAgents: fb }, message: 'AI unavailable, using fallback' });
        }
    });
    
    /**
     * POST /api/agents/orchestrator/create
     * Criar um novo agente
     */
    fastify.post('/orchestrator/create', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = (request.headers['x-organization-id'] as string) || 
                                   (request.body as any)?.organizationId;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            // 🔒 AUTHORIZATION CHECK
            const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
            
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    error: 'User authentication required'
                });
            }
            
            // Verificar permissão de criação
            const authCheck = await authorizationService.canCreateAgent(userId);
            
            if (!authCheck.allowed) {
                return reply.status(403).send({
                    success: false,
                    error: authCheck.reason,
                    requiredRole: authCheck.requiredRole,
                    requiredPermission: authCheck.requiredPermission
                });
            }
            
            const body = request.body as any;
            const validated = CreateAgentSchema.parse(body);
            
            const config: AgentConfig = {
                ...validated,
                organizationId
            };
            
            const result = await AgentOrchestratorService.createAgent(config);
            
            if (result.success) {
                reply.send({
                    success: true,
                    data: result.data
                });
            } else {
                reply.status(500).send({
                    success: false,
                    error: result.error
                });
            }
            
        } catch (error) {
            fastify.log.error('Error creating agent:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to create agent'
            });
        }
    });
    
    /**
     * GET /api/agents/orchestrator/list
     * Listar todos os agentes ativos
     */
    fastify.get('/orchestrator/list', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            const result = await AgentOrchestratorService.listAgents(organizationId);
            
            if (result.success) {
                reply.send({
                    success: true,
                    data: result.data
                });
            } else {
                reply.status(500).send({
                    success: false,
                    error: result.error
                });
            }
            
        } catch (error) {
            fastify.log.error('Error listing agents:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to list agents'
            });
        }
    });
    
    /**
     * POST /api/agents/orchestrator/execute/:agentId
     * Executar uma tarefa com um agente especÃ­fico
     */
    fastify.post('/orchestrator/execute/:agentId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = request.params as { agentId: string };
            const body = request.body as any;
            const validated = ExecuteAgentSchema.parse(body);
            
            const result = await AgentOrchestratorService.executeAgent(
                agentId,
                validated.task,
                validated.context
            );
            
            if (result.success) {
                reply.send({
                    success: true,
                    data: result.data,
                    executionTime: result.executionTime
                });
            } else {
                reply.status(500).send({
                    success: false,
                    error: result.error
                });
            }
            
        } catch (error) {
            fastify.log.error('Error executing agent:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to execute agent'
            });
        }
    });
    
    /**
     * GET /api/agents/orchestrator/monitor
     * Monitorar performance de todos os agentes
     */
    fastify.get('/orchestrator/monitor', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            const result = await AgentOrchestratorService.monitorAgents(organizationId);
            
            if (result.success) {
                reply.send({
                    success: true,
                    data: result.data
                });
            } else {
                reply.status(500).send({
                    success: false,
                    error: result.error
                });
            }
            
        } catch (error) {
            fastify.log.error('Error monitoring agents:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to monitor agents'
            });
        }
    });
    
    /**
     * GET /api/agents/orchestrator/templates
     * Obter templates de agentes prÃ©-configurados
     */
    fastify.get('/orchestrator/templates', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const templates = [
                {
                    name: 'Agente de Marketing',
                    type: AgentType.MARKETING,
                    description: 'Gerencia campanhas do Google Ads, envia emails marketing e posta em redes sociais',
                    systemPrompt: 'VocÃª Ã© um especialista em marketing digital para academias de artes marciais. Seu objetivo Ã© atrair novos alunos atravÃ©s de campanhas bem planejadas.',
                    tools: ['google_ads_api', 'email_sender', 'social_media_poster'],
                    automationRules: [
                        {
                            trigger: 'new_lead_created',
                            action: 'send_welcome_email'
                        },
                        {
                            trigger: 'cron:0 9 * * 1',
                            action: 'create_weekly_ad_report'
                        }
                    ]
                },
                {
                    name: 'Agente Comercial WhatsApp',
                    type: AgentType.COMERCIAL,
                    description: 'Responde leads via WhatsApp Business, agenda visitas e faz follow-up de vendas',
                    systemPrompt: 'VocÃª Ã© um vendedor especializado em academias. Seja cordial, profissional e use linguagem natural. Sempre tente marcar uma visita presencial.',
                    tools: ['whatsapp_business_api', 'crm_api', 'calendar_api'],
                    automationRules: [
                        {
                            trigger: 'whatsapp_message_received',
                            action: 'respond_to_lead'
                        },
                        {
                            trigger: 'lead_inactive_for_3_days',
                            action: 'send_followup_message'
                        }
                    ]
                },
                {
                    name: 'Agente PedagÃ³gico',
                    type: AgentType.PEDAGOGICO,
                    description: 'Cria planos de aula personalizados, sugere tÃ©cnicas e analisa progresso dos alunos',
                    systemPrompt: 'VocÃª Ã© um instrutor experiente de Krav Maga. Crie planos de aula desafiadores mas seguros, adaptados ao nÃ­vel dos alunos.',
                    tools: ['database_read', 'database_write', 'lesson_generator'],
                    automationRules: [
                        {
                            trigger: 'new_course_created',
                            action: 'generate_lesson_plans'
                        },
                        {
                            trigger: 'student_attendance_low',
                            action: 'analyze_and_suggest_engagement'
                        }
                    ]
                },
                {
                    name: 'Agente Financeiro',
                    type: AgentType.FINANCEIRO,
                    description: 'Monitora pagamentos, envia cobranÃ§as automÃ¡ticas via Asaas e detecta inadimplÃªncia',
                    systemPrompt: 'VocÃª gerencia as finanÃ§as da academia. Seja gentil mas firme com cobranÃ§as. OfereÃ§a alternativas de pagamento quando necessÃ¡rio.',
                    tools: ['asaas_api', 'database_read', 'email_sender', 'sms_sender'],
                    automationRules: [
                        {
                            trigger: 'payment_overdue',
                            action: 'send_payment_reminder'
                        },
                        {
                            trigger: 'cron:0 10 * * *',
                            action: 'check_overdue_payments'
                        }
                    ]
                },
                {
                    name: 'Agente de Atendimento',
                    type: AgentType.ATENDIMENTO,
                    description: 'Chatbot 24/7 que responde perguntas frequentes e escalona para humanos quando necessÃ¡rio',
                    systemPrompt: 'VocÃª Ã© um assistente virtual da academia. Responda perguntas sobre horÃ¡rios, valores, modalidades e localizaÃ§Ã£o. Se nÃ£o souber, ofereÃ§a transferir para um atendente humano.',
                    tools: ['knowledge_base_search', 'email_sender'],
                    automationRules: [
                        {
                            trigger: 'website_chat_message',
                            action: 'respond_to_visitor'
                        }
                    ]
                }
            ];
            
            reply.send({
                success: true,
                data: templates
            });
            
        } catch (error) {
            fastify.log.error('Error getting templates:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to get templates'
            });
        }
    });
    
    /**
     * GET /api/agents/orchestrator/interactions
     * Obter interaÃ§Ãµes e permissÃµes pendentes dos agentes
     */
    fastify.get('/orchestrator/interactions', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            // Buscar interaÃ§Ãµes recentes (Ãºltimas 10, incluindo jÃ¡ lidas)
            const interactionsResult = await AgentInteractionService.listByOrganization(
                organizationId, 
                { limit: 10, includeRead: true }
            );
            
            // Buscar permissÃµes pendentes
            const permissionsResult = await AgentPermissionService.listPending(organizationId);
            
            if (!interactionsResult.success || !permissionsResult.success) {
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to fetch data from database'
                });
            }
            
            // Formatar interaÃ§Ãµes para o frontend
            const formattedInteractions = (interactionsResult.data || []).map((interaction: any) => ({
                id: interaction.id,
                agentId: interaction.agentId,
                agentName: interaction.agent?.name || 'Unknown Agent',
                agentType: interaction.agent?.type || 'ADMINISTRATIVE',
                type: interaction.type,
                message: interaction.message,
                createdAt: interaction.createdAt,
                isRead: interaction.isRead,
                action: interaction.action // JSON com { label, url }
            }));
            
            // Formatar permissÃµes pendentes para o frontend
            const formattedPermissions = (permissionsResult.data || []).map((permission: any) => ({
                id: permission.id,
                agentId: permission.agentId,
                agentName: permission.agent?.name || 'Unknown Agent',
                agentType: permission.agent?.type || 'ADMINISTRATIVE',
                action: permission.action,
                createdAt: permission.createdAt,
                details: permission.details // JSON com detalhes da aÃ§Ã£o
            }));
            
            reply.send({
                success: true,
                data: {
                    interactions: formattedInteractions,
                    pendingPermissions: formattedPermissions
                }
            });
            
        } catch (error) {
            fastify.log.error('Error getting interactions:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to get interactions'
            });
        }
    });
    
    /**
     * PATCH /api/agents/orchestrator/permissions/:permissionId
     * Aprovar ou recusar uma permissÃ£o solicitada por um agente
     */
    fastify.patch('/orchestrator/permissions/:permissionId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { permissionId } = request.params as { permissionId: string };
            const body = request.body as { approved: boolean };
            const userId = request.headers['x-user-id'] as string; // Assumir que vem do middleware de auth
            
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    error: 'User ID is required (authentication needed)'
                });
            }
            
            // Atualizar status da permissÃ£o
            const result = await AgentPermissionService.updateStatus({
                permissionId,
                status: body.approved ? 'APPROVED' : 'DENIED',
                approvedBy: userId,
                deniedReason: body.approved ? undefined : 'Recusado pelo usuÃ¡rio'
            });
            
            if (!result.success) {
                return reply.status(500).send({
                    success: false,
                    error: result.error || 'Failed to update permission'
                });
            }
            
            // Se aprovado, executar a aÃ§Ã£o (isso pode ser feito em background tambÃ©m)
            if (body.approved && result.data) {
                // TODO: Implementar execuÃ§Ã£o da aÃ§Ã£o aprovada
                // Por exemplo: NotificationTool.executeApprovedAction(permissionId, details)
                fastify.log.info('Permission approved, action will be executed:', {
                    permissionId,
                    action: result.data.action
                });
            }
            
            reply.send({
                success: true,
                data: {
                    permissionId,
                    approved: body.approved,
                    status: result.data?.status,
                    message: body.approved 
                        ? 'PermissÃ£o aprovada. Agente executarÃ¡ a aÃ§Ã£o em breve.' 
                        : 'PermissÃ£o recusada. Nenhuma aÃ§Ã£o serÃ¡ tomada.'
                }
            });
            
        } catch (error) {
            fastify.log.error('Error handling permission:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to handle permission'
            });
        }
    });
    
    /**
     * POST /api/agents/orchestrator/triggers/payment-overdue
     * Disparar verificaÃ§Ã£o de pagamentos atrasados (trigger manual)
     */
    fastify.post('/orchestrator/triggers/payment-overdue', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            const body = request.body as { daysOverdue?: number };
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            const result = await AgentAutomationService.checkPaymentOverdue(
                organizationId,
                body.daysOverdue || 7
            );
            
            reply.send(result);
            
        } catch (error) {
            fastify.log.error('Error triggering payment overdue check:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to trigger payment overdue check'
            });
        }
    });
    
    /**
     * POST /api/agents/orchestrator/triggers/student-inactive
     * Disparar verificaÃ§Ã£o de alunos inativos (trigger manual)
     */
    fastify.post('/orchestrator/triggers/student-inactive', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            const body = request.body as { daysInactive?: number };
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            const result = await AgentAutomationService.checkStudentInactive(
                organizationId,
                body.daysInactive || 30
            );
            
            reply.send(result);
            
        } catch (error) {
            fastify.log.error('Error triggering student inactive check:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to trigger student inactive check'
            });
        }
    });
    
    /**
     * GET /api/agents/orchestrator/executions/:agentId
     * Obter histórico de execuções de um agente
     */
    fastify.get('/orchestrator/executions/:agentId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId } = request.params as { agentId: string };
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            // Buscar execuções do agente no banco de dados
            const executions = await prisma.agentExecution.findMany({
                where: {
                    agentId,
                    organizationId
                },
                orderBy: {
                    startedAt: 'desc'
                },
                take: 50, // Últimas 50 execuções
                select: {
                    id: true,
                    agentId: true,
                    task: true,
                    status: true,
                    startedAt: true,
                    completedAt: true,
                    executionTime: true,
                    result: true,
                    error: true,
                    createdAt: true
                }
            });
            
            reply.send({
                success: true,
                data: executions
            });
            
        } catch (error) {
            fastify.log.error('Error fetching agent executions:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch agent executions'
            });
        }
    });
}






