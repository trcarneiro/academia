/**
 * MCP Tool: CreateTask
 * 
 * Permite que agentes criem tasks que requerem aprovação humana
 * antes de executar ações sensíveis (database changes, notifications, etc.)
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export interface CreateTaskParams {
  agentId: string;
  organizationId: string;
  title: string;
  description: string;
  category: 'DATABASE_CHANGE' | 'WHATSAPP_MESSAGE' | 'EMAIL' | 'SMS' | 'MARKETING' | 'BILLING' | 'ENROLLMENT';
  actionType: 'UPDATE_RECORD' | 'SEND_MESSAGE' | 'CREATE_RECORD' | 'DELETE_RECORD';
  targetEntity?: string;
  actionPayload: any;
  reasoning?: {
    insights: string[];
    expectedImpact: string;
    risks: string[];
    dataSupport: any;
  };
  requiresApproval?: boolean;
  autoExecute?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

export interface CreateTaskResult {
  success: boolean;
  taskId?: string;
  message: string;
  task?: any;
}

/**
 * Tool para criar task de aprovação
 */
export async function createTaskTool(params: CreateTaskParams): Promise<CreateTaskResult> {
  try {
    logger.info(`[MCP CreateTask] Agent ${params.agentId} creating task: ${params.title}`);

    // Determinar automação baseada na categoria
    const automationRules = getAutomationRules(params.category);

    // Criar task no banco
    const task = await prisma.agentTask.create({
      data: {
        organizationId: params.organizationId,
        agentId: params.agentId,
        title: params.title,
        description: params.description,
        category: params.category,
        actionType: params.actionType,
        targetEntity: params.targetEntity,
        actionPayload: params.actionPayload,
        reasoning: params.reasoning || {},
        requiresApproval: params.requiresApproval ?? automationRules.requiresApproval,
        autoExecute: params.autoExecute ?? automationRules.autoExecute,
        automationLevel: automationRules.level,
        priority: params.priority ?? automationRules.defaultPriority,
        dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
        approvalStatus: 'PENDING',
        status: 'PENDING',
      },
      include: {
        agent: { select: { id: true, name: true, specialization: true } },
      },
    });

    logger.info(`[MCP CreateTask] Task created successfully: ${task.id}`);

    return {
      success: true,
      taskId: task.id,
      message: `Task "${params.title}" created successfully and waiting for approval`,
      task: {
        id: task.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        requiresApproval: task.requiresApproval,
        automationLevel: task.automationLevel,
      },
    };
  } catch (error) {
    logger.error('[MCP CreateTask] Error creating task:', error);
    return {
      success: false,
      message: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Regras de automação por categoria
 */
function getAutomationRules(category: string) {
  const rules = {
    DATABASE_CHANGE: {
      requiresApproval: true,
      autoExecute: false,
      level: 'MANUAL',
      defaultPriority: 'HIGH',
    },
    WHATSAPP_MESSAGE: {
      requiresApproval: true,
      autoExecute: false,
      level: 'SEMI_AUTO', // Pode automatizar em horários específicos
      defaultPriority: 'MEDIUM',
    },
    EMAIL: {
      requiresApproval: true,
      autoExecute: false,
      level: 'SEMI_AUTO',
      defaultPriority: 'MEDIUM',
    },
    SMS: {
      requiresApproval: true,
      autoExecute: false,
      level: 'MANUAL', // SMS tem custo
      defaultPriority: 'MEDIUM',
    },
    MARKETING: {
      requiresApproval: true,
      autoExecute: false,
      level: 'AUTO_LOW_RISK',
      defaultPriority: 'LOW',
    },
    BILLING: {
      requiresApproval: true,
      autoExecute: false,
      level: 'AUTO_LOW_RISK',
      defaultPriority: 'HIGH',
    },
    ENROLLMENT: {
      requiresApproval: true,
      autoExecute: false,
      level: 'MANUAL',
      defaultPriority: 'MEDIUM',
    },
  };

  return rules[category as keyof typeof rules] || {
    requiresApproval: true,
    autoExecute: false,
    level: 'MANUAL',
    defaultPriority: 'MEDIUM',
  };
}

/**
 * Validar parâmetros de task
 */
export function validateTaskParams(params: any): { valid: boolean; error?: string } {
  if (!params.agentId) {
    return { valid: false, error: 'agentId is required' };
  }

  if (!params.organizationId) {
    return { valid: false, error: 'organizationId is required' };
  }

  if (!params.title || params.title.length < 3) {
    return { valid: false, error: 'title must be at least 3 characters' };
  }

  if (!params.description || params.description.length < 10) {
    return { valid: false, error: 'description must be at least 10 characters' };
  }

  if (!params.category) {
    return { valid: false, error: 'category is required' };
  }

  if (!params.actionType) {
    return { valid: false, error: 'actionType is required' };
  }

  if (!params.actionPayload || typeof params.actionPayload !== 'object') {
    return { valid: false, error: 'actionPayload must be an object' };
  }

  return { valid: true };
}

/**
 * Helper: Criar task de notificação WhatsApp
 */
export async function createWhatsAppNotificationTask(params: {
  agentId: string;
  organizationId: string;
  recipients: Array<{ name: string; phone: string }>;
  message: string;
  reasoning: any;
}): Promise<CreateTaskResult> {
  return createTaskTool({
    agentId: params.agentId,
    organizationId: params.organizationId,
    title: `Enviar WhatsApp para ${params.recipients.length} aluno(s)`,
    description: `Mensagem: "${params.message.substring(0, 100)}..."`,
    category: 'WHATSAPP_MESSAGE',
    actionType: 'SEND_MESSAGE',
    targetEntity: 'Student',
    actionPayload: {
      recipients: params.recipients,
      message: params.message,
    },
    reasoning: params.reasoning,
    priority: 'MEDIUM',
  });
}

/**
 * Helper: Criar task de atualização de banco
 */
export async function createDatabaseUpdateTask(params: {
  agentId: string;
  organizationId: string;
  entity: string;
  action: 'UPDATE' | 'CREATE' | 'DELETE';
  records: any[];
  reasoning: any;
}): Promise<CreateTaskResult> {
  return createTaskTool({
    agentId: params.agentId,
    organizationId: params.organizationId,
    title: `${params.action} ${params.records.length} ${params.entity} record(s)`,
    description: `Modificação solicitada pelo agente baseada em análise de dados`,
    category: 'DATABASE_CHANGE',
    actionType: params.action === 'UPDATE' ? 'UPDATE_RECORD' : params.action === 'CREATE' ? 'CREATE_RECORD' : 'DELETE_RECORD',
    targetEntity: params.entity,
    actionPayload: {
      records: params.records,
    },
    reasoning: params.reasoning,
    priority: 'HIGH',
  });
}
