import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { AIAgent, AgentConversation, AgentSpecialization, Prisma } from '@prisma/client';

/**
 * AI Agent Service
 * Handles CRUD operations for AI Agents with no-code enforcement
 */
export class AgentService {
  /**
   * Create a new AI agent
   */
  async createAgent(data: Prisma.AIAgentCreateInput): Promise<AIAgent> {
    try {
      // Validate no-code enforcement on system prompt
      this.validateNoCodePrompt(data.systemPrompt);

      const agent = await prisma.aIAgent.create({
        data,
        include: {
          _count: {
            select: { conversations: true }
          }
        }
      });

      logger.info(`Created AI agent: ${agent.name} (${agent.id})`);
      return agent as any;
    } catch (error) {
      logger.error('Error creating AI agent:', error);
      throw error;
    }
  }

  /**
   * Get all agents for an organization with optional filters
   */
  async getAgents(
    organizationId: string,
    filters?: {
      specialization?: AgentSpecialization;
      isActive?: boolean;
    }
  ): Promise<AIAgent[]> {
    try {
      const agents = await prisma.aIAgent.findMany({
        where: {
          organizationId,
          ...(filters?.specialization && { specialization: filters.specialization }),
          ...(filters?.isActive !== undefined && { isActive: filters.isActive })
        },
        include: {
          _count: {
            select: { conversations: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info(`Retrieved ${agents.length} agents for organization ${organizationId}`);
      return agents as any;
    } catch (error) {
      logger.error('Error fetching agents:', error);
      throw error;
    }
  }

  /**
   * Get a single agent by ID
   */
  async getAgentById(id: string): Promise<AIAgent | null> {
    try {
      const agent = await prisma.aIAgent.findUnique({
        where: { id },
        include: {
          _count: {
            select: { conversations: true }
          }
        }
      });

      return agent as any;
    } catch (error) {
      logger.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update an agent
   */
  async updateAgent(id: string, data: Prisma.AIAgentUpdateInput): Promise<AIAgent> {
    try {
      // Validate system prompt if being updated
      if (data.systemPrompt && typeof data.systemPrompt === 'string') {
        this.validateNoCodePrompt(data.systemPrompt);
      }

      const agent = await prisma.aIAgent.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { conversations: true }
          }
        }
      });

      logger.info(`Updated AI agent: ${agent.name} (${id})`);
      return agent as any;
    } catch (error) {
      logger.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(id: string): Promise<void> {
    try {
      await prisma.aIAgent.delete({
        where: { id }
      });

      logger.info(`Deleted AI agent ${id}`);
    } catch (error) {
      logger.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * Toggle agent active status
   */
  async toggleAgent(id: string): Promise<AIAgent> {
    try {
      const agent = await prisma.aIAgent.findUnique({ where: { id } });
      
      if (!agent) {
        throw new Error(`Agent ${id} not found`);
      }

      const updated = await prisma.aIAgent.update({
        where: { id },
        data: { isActive: !agent.isActive },
        include: {
          _count: {
            select: { conversations: true }
          }
        }
      });

      logger.info(`Toggled agent ${id} to ${updated.isActive ? 'active' : 'inactive'}`);
      return updated as any;
    } catch (error) {
      logger.error(`Error toggling agent ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(organizationId: string) {
    try {
      const [totalAgents, activeAgents, totalConversations, avgRating] = await Promise.all([
        prisma.aIAgent.count({ where: { organizationId } }),
        prisma.aIAgent.count({ where: { organizationId, isActive: true } }),
        prisma.agentConversation.count({
          where: { agent: { organizationId } }
        }),
        prisma.agentConversation.aggregate({
          where: {
            agent: { organizationId },
            rating: { not: null }
          },
          _avg: { rating: true }
        })
      ]);

      const stats = {
        totalAgents,
        activeAgents,
        inactiveAgents: totalAgents - activeAgents,
        totalConversations,
        averageRating: avgRating._avg.rating || 0,
        agentsBySpecialization: await this.getAgentsBySpecialization(organizationId)
      };

      return stats;
    } catch (error) {
      logger.error('Error fetching agent stats:', error);
      throw error;
    }
  }

  /**
   * Get agents grouped by specialization
   */
  private async getAgentsBySpecialization(organizationId: string) {
    const agents = await prisma.aIAgent.groupBy({
      by: ['specialization'],
      where: { organizationId },
      _count: true
    });

    return agents.reduce((acc, item) => {
      acc[item.specialization] = item._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Create a conversation
   */
  async createConversation(data: {
    agentId: string;
    userId?: string;
    studentId?: string;
    messages: any[];
    metadata?: any;
  }): Promise<AgentConversation> {
    try {
      const conversation = await prisma.agentConversation.create({
        data: {
          agentId: data.agentId,
          userId: data.userId,
          studentId: data.studentId,
          messages: data.messages,
          metadata: data.metadata || {}
        },
        include: {
          agent: true
        }
      });

      logger.info(`Created conversation ${conversation.id} for agent ${data.agentId}`);
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation (add messages, rating, feedback)
   */
  async updateConversation(
    id: string,
    data: {
      messages?: any[];
      rating?: number;
      feedback?: string;
    }
  ): Promise<AgentConversation> {
    try {
      const conversation = await prisma.agentConversation.update({
        where: { id },
        data,
        include: { agent: true }
      });

      // Update agent average rating
      if (data.rating) {
        await this.updateAgentRating(conversation.agentId);
      }

      return conversation;
    } catch (error) {
      logger.error(`Error updating conversation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get conversation history for an agent
   */
  async getAgentConversations(
    agentId: string,
    limit: number = 50
  ): Promise<AgentConversation[]> {
    try {
      const conversations = await prisma.agentConversation.findMany({
        where: { agentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return conversations;
    } catch (error) {
      logger.error(`Error fetching conversations for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Update agent average rating based on conversation ratings
   */
  private async updateAgentRating(agentId: string): Promise<void> {
    try {
      const avgRating = await prisma.agentConversation.aggregate({
        where: {
          agentId,
          rating: { not: null }
        },
        _avg: { rating: true }
      });

      if (avgRating._avg.rating) {
        await prisma.aIAgent.update({
          where: { id: agentId },
          data: { averageRating: avgRating._avg.rating }
        });
      }
    } catch (error) {
      logger.error(`Error updating agent rating for ${agentId}:`, error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Validate system prompt for no-code enforcement
   * Throws error if code patterns are detected
   */
  private validateNoCodePrompt(prompt: string): void {
    const codePatterns = [
      {
        pattern: /```[\s\S]*?```/g,
        name: 'Code blocks'
      },
      {
        pattern: /\b(function|class|import|require|export|const|let|var)\s*[\(\{]/gi,
        name: 'JavaScript/TypeScript code'
      },
      {
        pattern: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi,
        name: 'SQL statements'
      },
      {
        pattern: /\b(eval|exec|system|spawn)\s*\(/gi,
        name: 'Dangerous functions'
      },
      {
        pattern: /<script[\s\S]*?<\/script>/gi,
        name: 'Script tags'
      },
      {
        pattern: /\$\{.*?\}/g,
        name: 'Template literals with code'
      }
    ];

    for (const { pattern, name } of codePatterns) {
      if (pattern.test(prompt)) {
        throw new Error(
          `System prompt validation failed: ${name} detected. ` +
          `AI Agents must use natural language instructions only. ` +
          `No code, SQL, or executable content is allowed.`
        );
      }
    }

    // Additional validation: minimum length
    if (prompt.trim().length < 50) {
      throw new Error('System prompt must be at least 50 characters long');
    }

    // Additional validation: maximum length
    if (prompt.length > 10000) {
      throw new Error('System prompt cannot exceed 10,000 characters');
    }
  }

  /**
   * Validate agent configuration
   */
  validateAgentConfig(data: {
    name: string;
    specialization: string;
    model: string;
    systemPrompt: string;
    ragSources: string[];
    mcpTools: string[];
    temperature: number;
    maxTokens: number;
  }): void {
    // Name validation
    if (!data.name || data.name.trim().length < 3) {
      throw new Error('Agent name must be at least 3 characters');
    }

    if (data.name.length > 100) {
      throw new Error('Agent name cannot exceed 100 characters');
    }

    // Specialization validation
    const validSpecializations: AgentSpecialization[] = [
      'pedagogical',
      'analytical',
      'support',
      'progression',
      'commercial'
    ];

    if (!validSpecializations.includes(data.specialization as AgentSpecialization)) {
      throw new Error(`Invalid specialization. Must be one of: ${validSpecializations.join(', ')}`);
    }

    // Model validation
    const validModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    if (!validModels.includes(data.model)) {
      throw new Error(`Invalid model. Must be one of: ${validModels.join(', ')}`);
    }

    // Temperature validation
    if (data.temperature < 0 || data.temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }

    // Max tokens validation
    if (data.maxTokens < 256 || data.maxTokens > 8192) {
      throw new Error('Max tokens must be between 256 and 8192');
    }

    // RAG sources validation (optional but must be array)
    if (!Array.isArray(data.ragSources)) {
      throw new Error('RAG sources must be an array');
    }

    // MCP tools validation (optional but must be array)
    if (!Array.isArray(data.mcpTools)) {
      throw new Error('MCP tools must be an array');
    }

    // System prompt validation
    this.validateNoCodePrompt(data.systemPrompt);
  }
}

export const agentService = new AgentService();
