/**
 * Agent Interaction Service
 * Gerencia interações dos agentes (relatórios, sugestões, requests, erros)
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export type InteractionType = 'REPORT' | 'SUGGESTION' | 'REQUEST' | 'ERROR';

export interface CreateInteractionData {
  agentId: string;
  organizationId: string;
  type: InteractionType;
  message: string;
  action?: {
    label: string;
    url: string;
  };
  metadata?: any;
}

export class AgentInteractionService {
  /**
   * Criar nova interação
   */
  static async create(data: CreateInteractionData) {
    try {
      const interaction = await prisma.agentInteraction.create({
        data: {
          agentId: data.agentId,
          organizationId: data.organizationId,
          type: data.type,
          message: data.message,
          action: data.action || null,
          metadata: data.metadata || null,
          isRead: false,
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
      });

      logger.info('Agent interaction created:', {
        interactionId: interaction.id,
        agentId: data.agentId,
        type: data.type,
      });

      return { success: true, data: interaction };
    } catch (error) {
      logger.error('Error creating agent interaction:', error);
      return { success: false, error: 'Failed to create interaction' };
    }
  }

  /**
   * Listar interações recentes de uma organização
   */
  static async listByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      includeRead?: boolean;
      type?: InteractionType;
    } = {}
  ) {
    try {
      const { limit = 10, includeRead = true, type } = options;

      const where: any = { organizationId };

      if (!includeRead) {
        where.isRead = false;
      }

      if (type) {
        where.type = type;
      }

      const interactions = await prisma.agentInteraction.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return { success: true, data: interactions };
    } catch (error) {
      logger.error('Error listing agent interactions:', error);
      return { success: false, error: 'Failed to list interactions' };
    }
  }

  /**
   * Marcar interação como lida
   */
  static async markAsRead(interactionId: string) {
    try {
      const interaction = await prisma.agentInteraction.update({
        where: { id: interactionId },
        data: { isRead: true },
      });

      return { success: true, data: interaction };
    } catch (error) {
      logger.error('Error marking interaction as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  }

  /**
   * Marcar todas interações como lidas
   */
  static async markAllAsRead(organizationId: string) {
    try {
      const result = await prisma.agentInteraction.updateMany({
        where: {
          organizationId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true, data: { count: result.count } };
    } catch (error) {
      logger.error('Error marking all interactions as read:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }
  }

  /**
   * Obter detalhes de uma interação
   */
  static async getById(interactionId: string) {
    try {
      const interaction = await prisma.agentInteraction.findUnique({
        where: { id: interactionId },
        include: {
          agent: true,
        },
      });

      if (!interaction) {
        return { success: false, error: 'Interaction not found' };
      }

      return { success: true, data: interaction };
    } catch (error) {
      logger.error('Error getting interaction:', error);
      return { success: false, error: 'Failed to get interaction' };
    }
  }

  /**
   * Deletar interação
   */
  static async delete(interactionId: string) {
    try {
      await prisma.agentInteraction.delete({
        where: { id: interactionId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting interaction:', error);
      return { success: false, error: 'Failed to delete interaction' };
    }
  }

  /**
   * Contar interações não lidas
   */
  static async countUnread(organizationId: string) {
    try {
      const count = await prisma.agentInteraction.count({
        where: {
          organizationId,
          isRead: false,
        },
      });

      return { success: true, data: { count } };
    } catch (error) {
      logger.error('Error counting unread interactions:', error);
      return { success: false, error: 'Failed to count unread' };
    }
  }
}
