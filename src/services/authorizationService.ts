/**
 * Authorization Service - Gerenciar permissões de usuários para agentes
 * 
 * Este serviço valida se um usuário tem permissão para:
 * - Aprovar tasks de agentes
 * - Executar tasks de agentes
 * - Criar/deletar agentes
 * - Operar em categorias específicas (WhatsApp, Email, SMS, Database, etc)
 * 
 * HIERARQUIA DE ROLES:
 * - SUPER_ADMIN: Pode tudo
 * - ADMIN: Pode aprovar tasks críticas (DATABASE_CHANGE)
 * - MANAGER: Pode aprovar tasks normais (até HIGH priority)
 * - USER: Não pode aprovar tasks de agentes
 * - STUDENT: Apenas visualização
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { AgentTask } from '@prisma/client';

export type TaskCategory = 
  | 'DATABASE_CHANGE'
  | 'WHATSAPP_MESSAGE'
  | 'EMAIL'
  | 'SMS'
  | 'MARKETING'
  | 'BILLING'
  | 'ENROLLMENT';

export type TaskPriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  requiredPermission?: string;
}

/**
 * Serviço de Autorização
 */
export class AuthorizationService {
  /**
   * Verificar se usuário pode aprovar uma task
   * 
   * @param userId ID do usuário
   * @param task Task a ser aprovada
   * @returns Permissão concedida ou negada
   */
  async canApproveTask(userId: string, task: AgentTask): Promise<PermissionCheck> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          canApproveAgentTasks: true,
          canApproveCategories: true,
          maxTaskPriority: true
        }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found'
        };
      }

      // 1. Verificar permissão base
      if (!user.canApproveAgentTasks) {
        return {
          allowed: false,
          reason: 'User does not have permission to approve agent tasks',
          requiredPermission: 'canApproveAgentTasks'
        };
      }

      // 2. Verificar role para categorias críticas
      if (task.category === 'DATABASE_CHANGE' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return {
          allowed: false,
          reason: 'Only ADMIN or SUPER_ADMIN can approve DATABASE_CHANGE tasks',
          requiredRole: 'ADMIN'
        };
      }

      // 3. Verificar categoria permitida
      const allowedCategories = user.canApproveCategories as string[];
      if (!allowedCategories.includes(task.category)) {
        return {
          allowed: false,
          reason: `User cannot approve ${task.category} tasks. Allowed categories: ${allowedCategories.join(', ')}`
        };
      }

      // 4. Verificar nível de prioridade
      const priorityLevels: TaskPriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const userMaxLevel = priorityLevels.indexOf(user.maxTaskPriority as TaskPriorityLevel);
      const taskLevel = priorityLevels.indexOf(task.priority as TaskPriorityLevel);

      if (taskLevel > userMaxLevel) {
        return {
          allowed: false,
          reason: `User max priority is ${user.maxTaskPriority}, but task priority is ${task.priority}`
        };
      }

      // 5. Todas validações passaram
      logger.info(`[Authorization] User ${userId} CAN approve task ${task.id} (${task.category}, ${task.priority})`);

      return {
        allowed: true
      };

    } catch (error: any) {
      logger.error('[Authorization] Error checking approval permission:', error);
      
      return {
        allowed: false,
        reason: `Authorization check failed: ${error.message}`
      };
    }
  }

  /**
   * Verificar se usuário pode executar uma task
   * 
   * @param userId ID do usuário
   * @param task Task a ser executada
   * @returns Permissão concedida ou negada
   */
  async canExecuteTask(userId: string, task: AgentTask): Promise<PermissionCheck> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          canExecuteAgentTasks: true
        }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found'
        };
      }

      // 1. Verificar permissão base
      if (!user.canExecuteAgentTasks) {
        return {
          allowed: false,
          reason: 'User does not have permission to execute agent tasks',
          requiredPermission: 'canExecuteAgentTasks'
        };
      }

      // 2. Apenas executar tasks já aprovadas
      if (task.approvalStatus !== 'APPROVED') {
        return {
          allowed: false,
          reason: `Task must be APPROVED before execution (current status: ${task.approvalStatus})`
        };
      }

      logger.info(`[Authorization] User ${userId} CAN execute task ${task.id}`);

      return {
        allowed: true
      };

    } catch (error: any) {
      logger.error('[Authorization] Error checking execution permission:', error);
      
      return {
        allowed: false,
        reason: `Authorization check failed: ${error.message}`
      };
    }
  }

  /**
   * Verificar se usuário pode criar agentes
   * 
   * @param userId ID do usuário
   * @returns Permissão concedida ou negada
   */
  async canCreateAgent(userId: string): Promise<PermissionCheck> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          canCreateAgents: true,
          role: true
        }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found'
        };
      }

      if (!user.canCreateAgents && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return {
          allowed: false,
          reason: 'User does not have permission to create agents',
          requiredPermission: 'canCreateAgents'
        };
      }

      return {
        allowed: true
      };

    } catch (error: any) {
      logger.error('[Authorization] Error checking create agent permission:', error);
      
      return {
        allowed: false,
        reason: `Authorization check failed: ${error.message}`
      };
    }
  }

  /**
   * Verificar se usuário pode deletar agentes
   * 
   * @param userId ID do usuário
   * @returns Permissão concedida ou negada
   */
  async canDeleteAgent(userId: string): Promise<PermissionCheck> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          canDeleteAgents: true,
          role: true
        }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found'
        };
      }

      // Apenas ADMIN e SUPER_ADMIN podem deletar agentes
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return {
          allowed: false,
          reason: 'Only ADMIN or SUPER_ADMIN can delete agents',
          requiredRole: 'ADMIN'
        };
      }

      return {
        allowed: true
      };

    } catch (error: any) {
      logger.error('[Authorization] Error checking delete agent permission:', error);
      
      return {
        allowed: false,
        reason: `Authorization check failed: ${error.message}`
      };
    }
  }

  /**
   * Configurar permissões padrão para um usuário
   * 
   * @param userId ID do usuário
   * @param role Role do usuário
   * @returns Permissões configuradas
   */
  async setupDefaultPermissions(userId: string, role: string): Promise<void> {
    try {
      let permissions: any = {
        canApproveAgentTasks: false,
        canExecuteAgentTasks: false,
        canCreateAgents: false,
        canDeleteAgents: false,
        maxTaskPriority: 'LOW',
        canApproveCategories: []
      };

      switch (role) {
        case 'SUPER_ADMIN':
          permissions = {
            canApproveAgentTasks: true,
            canExecuteAgentTasks: true,
            canCreateAgents: true,
            canDeleteAgents: true,
            maxTaskPriority: 'URGENT',
            canApproveCategories: ['DATABASE_CHANGE', 'WHATSAPP_MESSAGE', 'EMAIL', 'SMS', 'MARKETING', 'BILLING', 'ENROLLMENT']
          };
          break;

        case 'ADMIN':
          permissions = {
            canApproveAgentTasks: true,
            canExecuteAgentTasks: true,
            canCreateAgents: true,
            canDeleteAgents: true,
            maxTaskPriority: 'URGENT',
            canApproveCategories: ['DATABASE_CHANGE', 'WHATSAPP_MESSAGE', 'EMAIL', 'SMS', 'MARKETING', 'BILLING', 'ENROLLMENT']
          };
          break;

        case 'MANAGER':
          permissions = {
            canApproveAgentTasks: true,
            canExecuteAgentTasks: true,
            canCreateAgents: true,
            canDeleteAgents: false,
            maxTaskPriority: 'HIGH',
            canApproveCategories: ['WHATSAPP_MESSAGE', 'EMAIL', 'SMS', 'MARKETING', 'ENROLLMENT']
          };
          break;

        case 'INSTRUCTOR':
          permissions = {
            canApproveAgentTasks: false,
            canExecuteAgentTasks: false,
            canCreateAgents: false,
            canDeleteAgents: false,
            maxTaskPriority: 'MEDIUM',
            canApproveCategories: ['EMAIL']
          };
          break;

        default:
          // USER, STUDENT - sem permissões de agentes
          break;
      }

      await prisma.user.update({
        where: { id: userId },
        data: permissions
      });

      logger.info(`[Authorization] Default permissions set for user ${userId} (role: ${role})`);

    } catch (error) {
      logger.error('[Authorization] Error setting default permissions:', error);
      throw error;
    }
  }
}

// Singleton instance
export const authorizationService = new AuthorizationService();
