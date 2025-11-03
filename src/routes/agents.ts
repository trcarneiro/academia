import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { agentService } from '@/services/AgentService';
import { agentExecutorService } from '@/services/AgentExecutorService';
import { authorizationService } from '@/services/authorizationService';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';
import { z } from 'zod';
import { requireOrganizationId } from '@/utils/tenantHelpers';

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  specialization: z.enum(['pedagogical', 'analytical', 'support', 'progression', 'commercial', 'curriculum']),
  model: z.enum([
    'gemini-2.5-flash','gemini-2.5-pro','gemini-2.5-flash-exp','gemini-2.5-pro-exp','gemini-2.5-flash','gemini-2.5-pro','gemini-2.5-flash-exp','gemini-2.5-pro-exp','gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-pro-exp-0827',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.0-pro'
  ]),
  systemPrompt: z.string().min(50).max(10000),
  ragSources: z.array(z.string()).optional().default([]),
  mcpTools: z.array(z.string()).optional().default([]),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().min(256).max(8192).optional().default(2048),
  isActive: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(false)
});

const updateAgentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  specialization: z.enum(['pedagogical', 'analytical', 'support', 'progression', 'commercial', 'curriculum']).optional(),
  model: z.enum([
    'gemini-2.5-flash','gemini-2.5-pro','gemini-2.5-flash-exp','gemini-2.5-pro-exp','gemini-2.5-flash','gemini-2.5-pro','gemini-2.5-flash-exp','gemini-2.5-pro-exp','gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-pro-exp-0827',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.0-pro'
  ]).optional(),
  systemPrompt: z.string().min(50).max(10000).optional(),
  ragSources: z.array(z.string()).optional(),
  mcpTools: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(256).max(8192).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

const createConversationSchema = z.object({
  agentId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  message: z.string().min(1),
  conversationId: z.string().optional() // Para continuar conversa existente (aceita qualquer string)
});

const updateConversationSchema = z.object({
  messages: z.array(z.any()).optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

export default async function agentsRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/agents
     * List all agents for an organization
     */
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            // Parse query filters
            const { specialization, isActive } = request.query as any;

            const filters: any = {};
            if (specialization) {
                filters.specialization = specialization;
            }
            if (isActive !== undefined) {
                filters.isActive = isActive === 'true' || isActive === true;
            }

            const agents = await agentService.getAgents(organizationId, filters);

            return reply.send({
                success: true,
                data: agents,
                total: agents.length
            });
        } catch (error: any) {
            logger.error('Error fetching agents:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch agents',
                error: error.message
            });
        }
    });

    /**
     * GET /api/agents/stats
     * Get agent statistics for an organization
     */
    fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            const stats = await agentService.getAgentStats(organizationId);

            return reply.send({
                success: true,
                data: stats
            });
        } catch (error: any) {
            logger.error('Error fetching agent stats:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch agent statistics',
                error: error.message
            });
        }
    });

    /**
     * GET /api/agents/:id
     * Get a single agent by ID
     */
    fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            const agent = await agentService.getAgentById(id);

            if (!agent) {
                return reply.code(404).send({
                    success: false,
                    message: 'Agent not found'
                });
            }

            if ((agent as any).organizationId && (agent as any).organizationId !== organizationId) {
                return reply.code(403).send({ success: false, message: 'Access denied to this organization' });
            }

            return reply.send({
                success: true,
                data: agent
            });
        } catch (error: any) {
            logger.error(`Error fetching agent ${request.params.id}:`, error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch agent',
                error: error.message
            });
        }
    });

    /**
     * POST /api/agents
     * Create a new agent
     */
    fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            // 🔒 AUTHORIZATION CHECK
            const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
            
            if (!userId) {
                return reply.code(401).send({
                    success: false,
                    message: 'User authentication required'
                });
            }
            
            // Verificar permissão de criação
            const authCheck = await authorizationService.canCreateAgent(userId);
            
            if (!authCheck.allowed) {
                return reply.code(403).send({
                    success: false,
                    message: authCheck.reason,
                    requiredRole: authCheck.requiredRole,
                    requiredPermission: authCheck.requiredPermission
                });
            }

            // Validate request body
            const validatedData = createAgentSchema.parse(request.body);

            // Additional validation
            agentService.validateAgentConfig(validatedData as any);

            // Create agent
            const agent = await agentService.createAgent({
                ...validatedData,
                organizationId,
                noCodeMode: true, // Always enforce
                organization: {
                    connect: { id: organizationId }
                }
            });

            return reply.code(201).send({
                success: true,
                data: agent,
                message: 'Agent created successfully'
            });
        } catch (error: any) {
            logger.error('Error creating agent:', error);

            // Handle validation errors
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message || 'Failed to create agent'
            });
        }
    });

    /**
     * PATCH /api/agents/:id
     * Update an agent
     */
    fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            // Validate request body
            const validatedData = updateAgentSchema.parse(request.body);

            // Update agent
            const agent = await agentService.updateAgent(id, validatedData);

            return reply.send({
                success: true,
                data: agent,
                message: 'Agent updated successfully'
            });
        } catch (error: any) {
            logger.error(`Error updating agent ${request.params.id}:`, error);

            // Handle validation errors
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors
                });
            }

            if (error.code === 'P2025') {
                return reply.code(404).send({
                    success: false,
                    message: 'Agent not found'
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message || 'Failed to update agent'
            });
        }
    });

    /**
     * PATCH /api/agents/:id/toggle
     * Toggle agent active status
     */
    fastify.patch('/:id/toggle', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const agent = await agentService.toggleAgent(id);

            return reply.send({
                success: true,
                data: agent,
                message: `Agent ${agent.isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error: any) {
            logger.error(`Error toggling agent ${request.params.id}:`, error);
            return reply.code(400).send({
                success: false,
                message: error.message || 'Failed to toggle agent'
            });
        }
    });

    /**
     * DELETE /api/agents/:id
     * Delete an agent
     */
    fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            // 🔒 AUTHORIZATION CHECK
            const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
            
            if (!userId) {
                return reply.code(401).send({
                    success: false,
                    message: 'User authentication required'
                });
            }
            
            // Verificar permissão de deleção
            const authCheck = await authorizationService.canDeleteAgent(userId);
            
            if (!authCheck.allowed) {
                return reply.code(403).send({
                    success: false,
                    message: authCheck.reason,
                    requiredRole: authCheck.requiredRole,
                    requiredPermission: authCheck.requiredPermission
                });
            }

            await agentService.deleteAgent(id);

            return reply.send({
                success: true,
                message: 'Agent deleted successfully'
            });
        } catch (error: any) {
            logger.error(`Error deleting agent ${request.params.id}:`, error);

            if (error.code === 'P2025') {
                return reply.code(404).send({
                    success: false,
                    message: 'Agent not found'
                });
            }

            return reply.code(500).send({
                success: false,
                message: 'Failed to delete agent'
            });
        }
    });

    /**
     * GET /api/agents/:id/conversations
     * Get conversation history for an agent
     */
    fastify.get('/:id/conversations', async (request: FastifyRequest<{
        Params: { id: string };
        Querystring: { limit?: string };
    }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const limit = request.query.limit ? parseInt(request.query.limit) : 50;

            const conversations = await agentService.getAgentConversations(id, limit);

            return reply.send({
                success: true,
                data: conversations,
                total: conversations.length
            });
        } catch (error: any) {
            logger.error(`Error fetching conversations for agent ${request.params.id}:`, error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch conversations',
                error: error.message
            });
        }
    });

    /**
     * GET /api/agents/conversations
     * Get all conversations for the current user (across all agents)
     */
    fastify.get('/conversations', async (request: FastifyRequest<{
        Querystring: { limit?: string };
    }>, reply: FastifyReply) => {
        try {
            const userId = request.headers['x-user-id'] as string;
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            const limit = request.query.limit ? parseInt(request.query.limit) : 20;

            // Buscar conversas do usuário com informações do agente
            const conversations = await prisma.agentConversation.findMany({
                where: {
                    userId: userId || undefined,
                    agent: {
                        organizationId
                    }
                },
                include: {
                    agent: {
                        select: {
                            id: true,
                            name: true,
                            specialization: true,
                            model: true
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: limit
            });

            return reply.send({
                success: true,
                data: conversations,
                total: conversations.length,
                pagination: {
                    page: 1,
                    limit,
                    total: conversations.length,
                    totalPages: Math.ceil(conversations.length / limit)
                }
            });
        } catch (error: any) {
            logger.error('Error fetching user conversations:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch conversations',
                error: error.message
            });
        }
    });

    /**
     * POST /api/agents/chat
     * Send a message to an agent (creates or continues conversation)
     * 
     * ⚠️ NOTA: Requests de IA podem demorar 30-60 segundos
     * Frontend tem timeout de 60s, backend deixa o servidor gerenciar
     */
    fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Log inicial da requisição
            logger.info('� ===== NEW CHAT REQUEST =====');
            logger.info('Body:', request.body);
            logger.info('Headers:', {
                'content-type': request.headers['content-type'],
                'x-user-id': request.headers['x-user-id'],
                'x-organization-id': request.headers['x-organization-id']
            });
            logger.info('==============================');

            const { agentId, studentId, message, conversationId } = createConversationSchema.parse(request.body);
            const userId = request.headers['x-user-id'] as string;

            logger.info('🔍 Parsed request data:');
            logger.info('Agent ID:', agentId);
            logger.info('Message length:', message?.length);
            logger.info('Conversation ID:', conversationId || 'NEW');
            logger.info('User ID:', userId || 'N/A');
            logger.info('Student ID:', studentId || 'N/A');

            // Get agent to validate it exists and is active
            const agent = await agentService.getAgentById(agentId);

            if (!agent) {
                return reply.code(404).send({
                    success: false,
                    message: 'Agent not found'
                });
            }

            if (!agent.isActive) {
                return reply.code(400).send({
                    success: false,
                    message: 'Agent is not active'
                });
            }

            // Create context for agent execution
            const context = {
                userId,
                studentId,
                metadata: {
                    requestSource: 'api_chat',
                    timestamp: new Date().toISOString()
                }
            };

            // If conversationId provided, try to continue existing conversation
            let conversation;
            if (conversationId) {
                // Verify if conversation exists first
                const existingConversation = await prisma.agentConversation.findUnique({
                    where: { id: conversationId }
                });
                
                if (existingConversation) {
                    // Continue existing conversation
                    conversation = await agentExecutorService.continueConversation(
                        conversationId,
                        message,
                        context
                    );
                } else {
                    // Conversation doesn't exist, create new one
                    console.log(`⚠️ [Agent Chat] Conversation ${conversationId} not found, creating new one`);
                    conversation = await agentExecutorService.createConversationAndExecute(
                        agentId,
                        message,
                        context
                    );
                }
            } else {
                // Create new conversation and execute agent
                conversation = await agentExecutorService.createConversationAndExecute(
                    agentId,
                    message,
                    context
                );
            }

            // Garantir encoding UTF-8 correto na resposta
            logger.info('✅ ===== CHAT RESPONSE READY =====');
            logger.info('Conversation ID:', conversation.id);
            logger.info('Messages count:', (conversation.messages as any[])?.length || 0);
            logger.info('Last message preview:', JSON.stringify(conversation.messages).substring(0, 200) + '...');
            logger.info('==================================');
            
            return reply
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({
                    success: true,
                    data: {
                        conversationId: conversation.id,
                        messages: conversation.messages,
                        agent: {
                            id: agent.id,
                            name: agent.name,
                            specialization: agent.specialization
                        },
                        metadata: conversation.metadata
                    },
                    message: 'Message sent successfully'
                });
        } catch (error: any) {
            // Log explícito e detalhado do erro
            logger.error('❌ ===== ERROR SENDING MESSAGE TO AGENT =====');
            logger.error('Error Message:', error?.message || 'No message');
            logger.error('Error Name:', error?.name || 'No name');
            logger.error('Error Code:', error?.code || 'No code');
            logger.error('Error Stack:', error?.stack || 'No stack');
            logger.error('Request Body:', JSON.stringify(request.body, null, 2));
            logger.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            logger.error('===============================================');
            
            logger.error('Error sending message to agent:', {
                error: error.message,
                stack: error.stack,
                name: error.name,
                body: request.body,
                headers: request.headers
            });

            // Handle validation errors
            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors
                });
            }

            return reply.code(500).send({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    });

    /**
     * PATCH /api/agents/conversations/:id
     * Update a conversation (add rating, feedback)
     */
    fastify.patch('/conversations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const validatedData = updateConversationSchema.parse(request.body);

            const conversation = await agentService.updateConversation(id, validatedData);

            return reply.send({
                success: true,
                data: conversation,
                message: 'Conversation updated successfully'
            });
        } catch (error: any) {
            logger.error(`Error updating conversation ${request.params.id}:`, error);

            if (error.name === 'ZodError') {
                return reply.code(400).send({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors
                });
            }

            return reply.code(400).send({
                success: false,
                message: error.message || 'Failed to update conversation'
            });
        }
    });
}

