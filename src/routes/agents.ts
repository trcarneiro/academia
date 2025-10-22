import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { agentService } from '@/services/AgentService';
import { agentExecutorService } from '@/services/AgentExecutorService';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  specialization: z.enum(['pedagogical', 'analytical', 'support', 'progression', 'commercial', 'curriculum']),
  model: z.enum([
    'gemini-2.0-flash-exp',
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
    'gemini-2.0-flash-exp',
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
  conversationId: z.string().uuid().optional() // Para continuar conversa existente
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
            const organizationId = request.headers['x-organization-id'] as string;

            if (!organizationId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Organization ID is required'
                });
            }

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
            const organizationId = request.headers['x-organization-id'] as string;

            if (!organizationId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Organization ID is required'
                });
            }

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

            const agent = await agentService.getAgentById(id);

            if (!agent) {
                return reply.code(404).send({
                    success: false,
                    message: 'Agent not found'
                });
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
            const organizationId = request.headers['x-organization-id'] as string;

            if (!organizationId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Organization ID is required'
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
     * POST /api/agents/chat
     * Send a message to an agent (creates or continues conversation)
     */
    fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { agentId, studentId, message, conversationId } = createConversationSchema.parse(request.body);
            const userId = request.headers['x-user-id'] as string;

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

            // If conversationId provided, continue existing conversation
            let conversation;
            if (conversationId) {
                conversation = await agentExecutorService.continueConversation(
                    conversationId,
                    message,
                    context
                );
            } else {
                // Create new conversation and execute agent
                conversation = await agentExecutorService.createConversationAndExecute(
                    agentId,
                    message,
                    context
                );
            }

            return reply.send({
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
            logger.error('Error sending message to agent:', error);

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
