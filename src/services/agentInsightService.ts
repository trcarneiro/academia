import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export interface CreateInsightData {
  organizationId: string;
  agentId: string;
  executionId?: string;
  type: 'INSIGHT' | 'NOTIFICATION' | 'RECOMMENDATION';
  category?: 'GROWTH' | 'ENGAGEMENT' | 'FINANCIAL' | 'OPERATIONAL' | 'RISK';
  title: string;
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  metadata?: any;
  relatedEntity?: string;
  relatedId?: string;
}

export class AgentInsightService {
  /**
   * Create a single insight
   */
  async createInsight(data: CreateInsightData) {
    try {
      const insight = await prisma.agentInsight.create({
        data: {
          organizationId: data.organizationId,
          agentId: data.agentId,
          executionId: data.executionId,
          type: data.type,
          category: data.category,
          title: data.title,
          content: data.content,
          priority: data.priority || 'MEDIUM',
          metadata: data.metadata,
          relatedEntity: data.relatedEntity,
          relatedId: data.relatedId,
          status: 'NEW',
          isPinned: false,
          isRead: false
        }
      });

      logger.info(`✅ [AgentInsightService] Created ${data.type}: ${data.title}`);
      return insight;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error creating insight:', error);
      throw error;
    }
  }

  /**
   * Create multiple insights from agent execution result
   */
  async createInsightsFromExecution(
    agentId: string,
    organizationId: string,
    executionResult: any,
    executionId?: string
  ) {
    try {
      const insights: CreateInsightData[] = [];

      // Convert insights array to INSIGHT type
      if (executionResult.insights && Array.isArray(executionResult.insights)) {
        executionResult.insights.forEach((insight: string, index: number) => {
          insights.push({
            organizationId,
            agentId,
            executionId,
            type: 'INSIGHT',
            category: this.categorizeInsight(insight),
            title: `Insight #${index + 1}`,
            content: insight,
            priority: 'MEDIUM'
          });
        });
      }

      // Convert actions array to NOTIFICATION type
      if (executionResult.actions && Array.isArray(executionResult.actions)) {
        executionResult.actions.forEach((action: string, index: number) => {
          insights.push({
            organizationId,
            agentId,
            executionId,
            type: 'NOTIFICATION',
            category: this.categorizeAction(action),
            title: `Ação Recomendada #${index + 1}`,
            content: action,
            priority: this.getPriorityFromAction(action)
          });
        });
      }

      // Batch create
      if (insights.length > 0) {
        const created = await prisma.agentInsight.createMany({
          data: insights
        });

        logger.info(
          `✅ [AgentInsightService] Created ${created.count} insights/notifications for agent ${agentId}`
        );

        return created;
      }

      return { count: 0 };
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error creating insights from execution:', error);
      throw error;
    }
  }

  /**
   * List insights with filters
   */
  async listInsights(filters: {
    organizationId: string;
    agentId?: string;
    type?: string;
    category?: string;
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {
        organizationId: filters.organizationId
      };

      if (filters.agentId) where.agentId = filters.agentId;
      if (filters.type) where.type = filters.type;
      if (filters.category) where.category = filters.category;
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;

      const [insights, total] = await Promise.all([
        prisma.agentInsight.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: filters.limit || 50,
          skip: filters.offset || 0,
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                specialization: true
              }
            }
          }
        }),
        prisma.agentInsight.count({ where })
      ]);

      return { insights, total };
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error listing insights:', error);
      throw error;
    }
  }

  /**
   * Pin/Unpin insight
   */
  async togglePin(insightId: string, isPinned: boolean) {
    try {
      const updated = await prisma.agentInsight.update({
        where: { id: insightId },
        data: { isPinned, updatedAt: new Date() }
      });

      logger.info(`📌 [AgentInsightService] Insight ${insightId} pinned: ${isPinned}`);
      return updated;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error toggling pin:', error);
      throw error;
    }
  }

  /**
   * Mark as read
   */
  async markAsRead(insightId: string, isRead: boolean = true) {
    try {
      const updated = await prisma.agentInsight.update({
        where: { id: insightId },
        data: { isRead, updatedAt: new Date() }
      });

      logger.info(`✓ [AgentInsightService] Insight ${insightId} marked as read: ${isRead}`);
      return updated;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Archive insight
   */
  async archive(insightId: string) {
    try {
      const updated = await prisma.agentInsight.update({
        where: { id: insightId },
        data: { status: 'ARCHIVED', updatedAt: new Date() }
      });

      logger.info(`🗑️ [AgentInsightService] Insight ${insightId} archived`);
      return updated;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error archiving insight:', error);
      throw error;
    }
  }

  /**
   * Delete insight
   */
  async delete(insightId: string) {
    try {
      await prisma.agentInsight.delete({
        where: { id: insightId }
      });

      logger.info(`🗑️ [AgentInsightService] Insight ${insightId} deleted`);
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error deleting insight:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats(organizationId: string, agentId?: string) {
    try {
      const where: any = { organizationId };
      if (agentId) where.agentId = agentId;

      const [total, byType, byStatus, byPriority, pinned, unread] = await Promise.all([
        prisma.agentInsight.count({ where }),
        prisma.agentInsight.groupBy({
          by: ['type'],
          where,
          _count: true
        }),
        prisma.agentInsight.groupBy({
          by: ['status'],
          where,
          _count: true
        }),
        prisma.agentInsight.groupBy({
          by: ['priority'],
          where,
          _count: true
        }),
        prisma.agentInsight.count({ where: { ...where, isPinned: true } }),
        prisma.agentInsight.count({ where: { ...where, isRead: false } })
      ]);

      return {
        total,
        byType,
        byStatus,
        byPriority,
        pinned,
        unread
      };
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error getting stats:', error);
      throw error;
    }
  }

  // Helper methods for categorization

  /**
   * Get insight by ID
   */
  async getInsightById(insightId: string) {
    try {
      const insight = await prisma.agentInsight.findUnique({
        where: { id: insightId },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          }
        }
      });

      return insight;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error getting insight:', error);
      throw error;
    }
  }

  /**
   * Update insight status
   */
  async updateStatus(insightId: string, status: string) {
    try {
      const insight = await prisma.agentInsight.update({
        where: { id: insightId },
        data: { status }
      });

      logger.info(`✅ [AgentInsightService] Updated status to ${status} for insight ${insightId}`);
      return insight;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error updating status:', error);
      throw error;
    }
  }

  /**
   * Bulk delete insights
   */
  async bulkDelete(insightIds: string[]) {
    try {
      const result = await prisma.agentInsight.deleteMany({
        where: {
          id: {
            in: insightIds
          }
        }
      });

      logger.info(`✅ [AgentInsightService] Bulk deleted ${result.count} insights`);
      return result;
    } catch (error) {
      logger.error('❌ [AgentInsightService] Error bulk deleting:', error);
      throw error;
    }
  }

  private categorizeInsight(content: string): 'GROWTH' | 'ENGAGEMENT' | 'FINANCIAL' | 'OPERATIONAL' | 'RISK' {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('crescimento') || lowerContent.includes('novos alunos') || lowerContent.includes('expansão')) {
      return 'GROWTH';
    }
    if (lowerContent.includes('frequência') || lowerContent.includes('engajamento') || lowerContent.includes('retenção')) {
      return 'ENGAGEMENT';
    }
    if (lowerContent.includes('plano') || lowerContent.includes('pagamento') || lowerContent.includes('receita') || lowerContent.includes('financeiro')) {
      return 'FINANCIAL';
    }
    if (lowerContent.includes('risco') || lowerContent.includes('problema') || lowerContent.includes('alerta')) {
      return 'RISK';
    }

    return 'OPERATIONAL';
  }

  private categorizeAction(content: string): 'GROWTH' | 'ENGAGEMENT' | 'FINANCIAL' | 'OPERATIONAL' | 'RISK' {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('onboarding') || lowerContent.includes('acolhimento') || lowerContent.includes('novo aluno')) {
      return 'OPERATIONAL';
    }
    if (lowerContent.includes('comunicação') || lowerContent.includes('comunidade') || lowerContent.includes('feedback')) {
      return 'ENGAGEMENT';
    }
    if (lowerContent.includes('marketing') || lowerContent.includes('campanha') || lowerContent.includes('renovação')) {
      return 'GROWTH';
    }
    if (lowerContent.includes('plano') || lowerContent.includes('cobrança') || lowerContent.includes('pagamento')) {
      return 'FINANCIAL';
    }

    return 'OPERATIONAL';
  }

  private getPriorityFromAction(content: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('urgente') || lowerContent.includes('crítico') || lowerContent.includes('imediato')) {
      return 'URGENT';
    }
    if (lowerContent.includes('importante') || lowerContent.includes('prioritário')) {
      return 'HIGH';
    }
    if (lowerContent.includes('considerar') || lowerContent.includes('avaliar')) {
      return 'LOW';
    }

    return 'MEDIUM';
  }
}

export const agentInsightService = new AgentInsightService();
