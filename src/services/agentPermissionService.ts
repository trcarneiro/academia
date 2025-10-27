/**
 * Agent Permission Service
 * Gerencia permissões solicitadas por agentes
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export type PermissionStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXECUTED';

export interface CreatePermissionData {
  agentId: string;
  organizationId: string;
  action: string;
  details: any;
}

export interface ApprovePermissionData {
  permissionId: string;
  approvedBy: string;
  approved: boolean;
  deniedReason?: string;
}

export class AgentPermissionService {
  /**
   * Criar nova solicitação de permissão
   */
  static async create(data: CreatePermissionData) {
    try {
      const permission = await prisma.agentPermission.create({
        data: {
          agentId: data.agentId,
          organizationId: data.organizationId,
          action: data.action,
          details: data.details,
          status: 'PENDING',
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

      logger.info('Agent permission created:', {
        permissionId: permission.id,
        agentId: data.agentId,
        action: data.action,
      });

      return { success: true, data: permission };
    } catch (error) {
      logger.error('Error creating agent permission:', error);
      return { success: false, error: 'Failed to create permission' };
    }
  }

  /**
   * Listar permissões pendentes de uma organização
   */
  static async listPending(organizationId: string) {
    try {
      const permissions = await prisma.agentPermission.findMany({
        where: {
          organizationId,
          status: 'PENDING',
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
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: permissions };
    } catch (error) {
      logger.error('Error listing pending permissions:', error);
      return { success: false, error: 'Failed to list pending permissions' };
    }
  }

  /**
   * Listar todas as permissões de uma organização
   */
  static async listByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      status?: PermissionStatus;
    } = {}
  ) {
    try {
      const { limit = 50, status } = options;

      const where: any = { organizationId };

      if (status) {
        where.status = status;
      }

      const permissions = await prisma.agentPermission.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return { success: true, data: permissions };
    } catch (error) {
      logger.error('Error listing agent permissions:', error);
      return { success: false, error: 'Failed to list permissions' };
    }
  }

  /**
   * Aprovar ou recusar permissão
   */
  static async updateStatus(data: ApprovePermissionData) {
    try {
      const { permissionId, approvedBy, approved, deniedReason } = data;

      const permission = await prisma.agentPermission.update({
        where: { id: permissionId },
        data: {
          status: approved ? 'APPROVED' : 'DENIED',
          approvedBy,
          approvedAt: new Date(),
          deniedReason: approved ? null : deniedReason || 'Recusado pelo usuário',
        },
        include: {
          agent: true,
        },
      });

      logger.info('Agent permission updated:', {
        permissionId,
        status: permission.status,
        approvedBy,
      });

      return { success: true, data: permission };
    } catch (error) {
      logger.error('Error updating permission status:', error);
      return { success: false, error: 'Failed to update permission' };
    }
  }

  /**
   * Marcar permissão como executada
   */
  static async markAsExecuted(permissionId: string, executionResult?: any) {
    try {
      const permission = await prisma.agentPermission.update({
        where: { id: permissionId },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executionResult: executionResult || null,
        },
      });

      logger.info('Agent permission executed:', {
        permissionId,
        executedAt: permission.executedAt,
      });

      return { success: true, data: permission };
    } catch (error) {
      logger.error('Error marking permission as executed:', error);
      return { success: false, error: 'Failed to mark as executed' };
    }
  }

  /**
   * Obter detalhes de uma permissão
   */
  static async getById(permissionId: string) {
    try {
      const permission = await prisma.agentPermission.findUnique({
        where: { id: permissionId },
        include: {
          agent: true,
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!permission) {
        return { success: false, error: 'Permission not found' };
      }

      return { success: true, data: permission };
    } catch (error) {
      logger.error('Error getting permission:', error);
      return { success: false, error: 'Failed to get permission' };
    }
  }

  /**
   * Deletar permissão
   */
  static async delete(permissionId: string) {
    try {
      await prisma.agentPermission.delete({
        where: { id: permissionId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting permission:', error);
      return { success: false, error: 'Failed to delete permission' };
    }
  }

  /**
   * Contar permissões pendentes
   */
  static async countPending(organizationId: string) {
    try {
      const count = await prisma.agentPermission.count({
        where: {
          organizationId,
          status: 'PENDING',
        },
      });

      return { success: true, data: { count } };
    } catch (error) {
      logger.error('Error counting pending permissions:', error);
      return { success: false, error: 'Failed to count pending' };
    }
  }

  /**
   * Obter estatísticas de permissões
   */
  static async getStats(organizationId: string) {
    try {
      const [pending, approved, denied, executed] = await Promise.all([
        prisma.agentPermission.count({
          where: { organizationId, status: 'PENDING' },
        }),
        prisma.agentPermission.count({
          where: { organizationId, status: 'APPROVED' },
        }),
        prisma.agentPermission.count({
          where: { organizationId, status: 'DENIED' },
        }),
        prisma.agentPermission.count({
          where: { organizationId, status: 'EXECUTED' },
        }),
      ]);

      return {
        success: true,
        data: {
          pending,
          approved,
          denied,
          executed,
          total: pending + approved + denied + executed,
        },
      };
    } catch (error) {
      logger.error('Error getting permission stats:', error);
      return { success: false, error: 'Failed to get stats' };
    }
  }
}
