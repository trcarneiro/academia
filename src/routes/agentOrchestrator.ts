/**
 * AGENT ORCHESTRATOR ROUTES
 * API para criar, gerenciar e executar agentes autônomos
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AgentOrchestratorService, AgentType, AgentConfig } from '@/services/agentOrchestratorService';

// Schemas de validação
const CreateAgentSchema = z.object({
    name: z.string().min(3).max(100),
    type: z.nativeEnum(AgentType),
    description: z.string().optional(),
    systemPrompt: z.string().min(10),
    tools: z.array(z.string()),
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
     */
    fastify.post('/orchestrator/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = (request.headers['x-organization-id'] as string) || 
                                   (request.body as any)?.organizationId;
            
            if (!organizationId) {
                return reply.status(400).send({
                    success: false,
                    error: 'organizationId is required'
                });
            }
            
            const result = await AgentOrchestratorService.suggestAgents(organizationId);
            
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
            fastify.log.error('Error suggesting agents:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to suggest agents'
            });
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
     * Executar uma tarefa com um agente específico
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
     * Obter templates de agentes pré-configurados
     */
    fastify.get('/orchestrator/templates', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const templates = [
                {
                    name: 'Agente de Marketing',
                    type: AgentType.MARKETING,
                    description: 'Gerencia campanhas do Google Ads, envia emails marketing e posta em redes sociais',
                    systemPrompt: 'Você é um especialista em marketing digital para academias de artes marciais. Seu objetivo é atrair novos alunos através de campanhas bem planejadas.',
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
                    systemPrompt: 'Você é um vendedor especializado em academias. Seja cordial, profissional e use linguagem natural. Sempre tente marcar uma visita presencial.',
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
                    name: 'Agente Pedagógico',
                    type: AgentType.PEDAGOGICO,
                    description: 'Cria planos de aula personalizados, sugere técnicas e analisa progresso dos alunos',
                    systemPrompt: 'Você é um instrutor experiente de Krav Maga. Crie planos de aula desafiadores mas seguros, adaptados ao nível dos alunos.',
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
                    description: 'Monitora pagamentos, envia cobranças automáticas via Asaas e detecta inadimplência',
                    systemPrompt: 'Você gerencia as finanças da academia. Seja gentil mas firme com cobranças. Ofereça alternativas de pagamento quando necessário.',
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
                    description: 'Chatbot 24/7 que responde perguntas frequentes e escalona para humanos quando necessário',
                    systemPrompt: 'Você é um assistente virtual da academia. Responda perguntas sobre horários, valores, modalidades e localização. Se não souber, ofereça transferir para um atendente humano.',
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
}
