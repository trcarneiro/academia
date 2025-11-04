/**
 * 🤖 MCP Task Executor - Execução de Tarefas via Model Context Protocol
 * 
 * RESPONSABILIDADE:
 * - Executar tarefas aprovadas ATRAVÉS do agente AI usando MCP Tools
 * - Permitir que o agente decida COMO executar (não apenas executar diretamente)
 * - Registrar conversa completa (reasoning, decisões, resultados)
 * - Criar AgentInteractions para cada execução
 * 
 * DIFERENÇA DO TaskExecutorService:
 * - TaskExecutorService: Execução DIRETA (código → Twilio/SendGrid/DB)
 * - MCPTaskExecutor: Execução MEDIADA pelo agente AI (código → AI → MCP Tools)
 * 
 * QUANDO USAR:
 * - Tasks que requerem raciocínio contextual
 * - Ações que precisam de decisões adaptativas
 * - Casos onde queremos audit trail completo da decisão do agente
 * 
 * INTEGRAÇÃO:
 * - MCPClient (Model Context Protocol)
 * - AgentInteractionService (registro de interações)
 * - TaskExecutorService (fallback para execução direta)
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { AgentOrchestratorService } from './agentOrchestratorService';
import { AgentInteractionService } from './agentInteractionService';
import type { AgentTask } from '@prisma/client';

interface MCPExecutionContext {
  taskId: string;
  agentId: string;
  userId?: string;
  conversationMode?: boolean; // Se true, permite múltiplas interações
}

interface MCPExecutionResult {
  success: boolean;
  interactionId: string; // ID da AgentInteraction criada
  agentResponse: string; // Resposta textual do agente
  toolsUsed: string[]; // Ferramentas MCP utilizadas
  result?: any; // Resultado estruturado (se houver)
  reasoning?: string; // Raciocínio do agente
  error?: string;
  duration: number;
  requiresApproval?: boolean; // Se agente detectou que precisa de aprovação adicional
}

export class MCPTaskExecutor {
  constructor() {
    // AgentOrchestratorService is static, no need to instantiate
  }

  /**
   * Executar task via agente AI com MCP Tools
   */
  async executeTask(context: MCPExecutionContext): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Buscar task completa
      const task = await this.getTaskWithContext(context.taskId);
      
      if (!task) {
        throw new Error(`Task ${context.taskId} not found`);
      }

      // 2. Validar status
      this.validateTaskStatus(task);

      // 3. Atualizar status para IN_PROGRESS
      await this.updateTaskStatus(context.taskId, 'IN_PROGRESS');

      logger.info(`[MCPTaskExecutor] Starting execution for task ${context.taskId} with agent ${context.agentId}`);

      // 4. Preparar contexto para o agente
      const agentContext = this.buildAgentContext(task);

      // 5. Preparar prompt instruindo o agente a usar MCP Tools
      const prompt = this.buildExecutionPrompt(task);

      // 6. Executar via AgentOrchestratorService (usa MCP Tools internamente)
      const agentResult = await AgentOrchestratorService.executeAgent(
        context.agentId,
        prompt,
        {
          organizationId: task.organizationId,
          userId: context.userId,
          taskId: context.taskId,
          taskTitle: task.title,
          taskCategory: task.category,
          actionPayload: task.actionPayload,
          ...agentContext
        }
      );

      if (!agentResult.success) {
        throw new Error(`Agent execution failed: ${agentResult.error || 'Unknown error'}`);
      }

      const agentResponse = {
        response: agentResult.data?.response || agentResult.data || '',
        toolsUsed: agentResult.data?.mcpToolsUsed || []
      };

      // 7. Extrair informações da resposta
      const executionInfo = this.parseAgentResponse(agentResponse);

      // 8. Criar AgentInteraction para registrar a execução
      const interactionResult = await AgentInteractionService.create({
        organizationId: task.organizationId,
        agentId: context.agentId,
        type: 'REPORT', // Relatório de execução
        message: `Execução: ${task.title}\n\n${agentResponse.response}`,
        metadata: {
          taskId: context.taskId,
          taskTitle: task.title,
          taskCategory: task.category,
          toolsUsed: executionInfo.toolsUsed,
          reasoning: executionInfo.reasoning,
          result: executionInfo.result,
          duration: Date.now() - startTime
        }
      });

      if (!interactionResult.success) {
        logger.warn(`[MCPTaskExecutor] Failed to create interaction: ${interactionResult.error}`);
      }

      const interaction = interactionResult.data;

      // 9. Atualizar task como concluída
      await this.updateTaskCompletion(context.taskId, {
        status: 'COMPLETED',
        result: executionInfo.result,
        interactionId: interaction?.id || null,
        agentResponse: agentResponse.response
      });

      logger.info(`[MCPTaskExecutor] Task ${context.taskId} completed via MCP (${Date.now() - startTime}ms)`);

      return {
        success: true,
        interactionId: interaction?.id || '',
        agentResponse: agentResponse.response,
        toolsUsed: executionInfo.toolsUsed,
        result: executionInfo.result,
        reasoning: executionInfo.reasoning,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      logger.error(`[MCPTaskExecutor] Error executing task ${context.taskId}:`, error);

      // Registrar erro na task
      await this.updateTaskCompletion(context.taskId, {
        status: 'FAILED',
        error: error.message
      });

      return {
        success: false,
        interactionId: '',
        agentResponse: '',
        toolsUsed: [],
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Buscar task com contexto completo
   */
  private async getTaskWithContext(taskId: string) {
    return await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: {
        agent: true,
        organization: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Validar se task pode ser executada
   */
  private validateTaskStatus(task: any) {
    if (task.approvalStatus !== 'APPROVED') {
      throw new Error(`Task ${task.id} is not approved (status: ${task.approvalStatus})`);
    }

    if (task.status === 'COMPLETED') {
      throw new Error(`Task ${task.id} is already completed`);
    }

    if (task.status === 'IN_PROGRESS') {
      throw new Error(`Task ${task.id} is already in progress`);
    }
  }

  /**
   * Construir contexto organizacional para o agente
   */
  private buildAgentContext(task: any): Record<string, any> {
    return {
      organizationId: task.organizationId,
      organizationName: task.organization?.name || 'Unknown',
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      taskCategory: task.category,
      taskPriority: task.priority,
      actionPayload: task.actionPayload,
      reasoning: task.reasoning,
      targetEntity: task.targetEntity,
      createdBy: task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'System'
    };
  }

  /**
   * Construir prompt instruindo o agente a executar a task usando MCP Tools
   */
  private buildExecutionPrompt(task: any): string {
    return `
🎯 **TAREFA: EXECUTAR AÇÃO APROVADA**

Você foi instruído a executar a seguinte tarefa que já foi APROVADA:

**Tarefa**: ${task.title}
**Categoria**: ${task.category}
**Prioridade**: ${task.priority}
**Descrição**: ${task.description}

${task.reasoning ? `
**Raciocínio Original**:
${JSON.stringify(task.reasoning, null, 2)}
` : ''}

**Payload da Ação**:
\`\`\`json
${JSON.stringify(task.actionPayload, null, 2)}
\`\`\`

---

📋 **INSTRUÇÕES DE EXECUÇÃO**:

1. **Analise o payload** para entender exatamente o que deve ser feito
2. **Escolha as ferramentas MCP adequadas** para executar a ação
3. **Execute a ação** usando as ferramentas disponíveis
4. **Valide o resultado** para garantir sucesso
5. **Relate o resultado** de forma clara e estruturada

---

🛠️ **FERRAMENTAS DISPONÍVEIS**:

${this.getToolDescriptionsForCategory(task.category)}

---

⚠️ **IMPORTANTE**:
- Esta tarefa já foi APROVADA - você DEVE executá-la
- Use SEMPRE as ferramentas MCP (não invente resultados)
- Registre cada etapa no seu raciocínio
- Se encontrar erro, explique claramente o problema
- Forneça resultado estruturado ao final

---

🚀 **EXECUTE AGORA**:

Use as ferramentas MCP para executar esta tarefa e relate o resultado.
`.trim();
  }

  /**
   * Obter ferramentas MCP disponíveis para cada categoria
   */
  private getAvailableToolsForCategory(category: string): string[] {
    const toolsByCategory: Record<string, string[]> = {
      'WHATSAPP_MESSAGE': ['whatsapp_send', 'database_query'],
      'EMAIL': ['email_send', 'database_query'],
      'SMS': ['sms_send', 'database_query'],
      'DATABASE_CHANGE': ['database_update', 'database_query'],
      'MARKETING': ['email_send', 'whatsapp_send', 'database_query'],
      'BILLING': ['database_update', 'database_query', 'email_send'],
      'ENROLLMENT': ['database_update', 'database_query', 'whatsapp_send']
    };

    return toolsByCategory[category] || ['database_query'];
  }

  /**
   * Obter descrições das ferramentas para o prompt
   */
  private getToolDescriptionsForCategory(category: string): string {
    const descriptions: Record<string, string> = {
      'WHATSAPP_MESSAGE': `
- **whatsapp_send**: Enviar mensagem WhatsApp via Twilio
  - Parâmetros: to (número), message (texto)
  - Retorna: messageId, status, cost
      
- **database_query**: Buscar dados necessários (ex: telefone do aluno)
  - Parâmetros: query (SQL pré-aprovado)
  - Retorna: dados do banco
      `,
      'EMAIL': `
- **email_send**: Enviar email via SendGrid
  - Parâmetros: to, subject, body (HTML/text)
  - Retorna: messageId, status
      
- **database_query**: Buscar dados necessários (ex: email do aluno)
  - Parâmetros: query (SQL pré-aprovado)
  - Retorna: dados do banco
      `,
      'DATABASE_CHANGE': `
- **database_update**: Atualizar dados no banco (transação segura)
  - Parâmetros: entity, action, data
  - Retorna: updatedRecords, validation
      
- **database_query**: Verificar estado antes/depois da mudança
  - Parâmetros: query (SQL pré-aprovado)
  - Retorna: dados do banco
      `,
      'ENROLLMENT': `
- **database_update**: Criar matrícula no banco
  - Parâmetros: entity=StudentCourse, data={studentId, courseId, ...}
  - Retorna: enrollmentId, validation
      
- **whatsapp_send**: Notificar aluno sobre matrícula
  - Parâmetros: to, message
  - Retorna: messageId
      `
    };

    return descriptions[category] || 'Ferramentas padrão disponíveis';
  }

  /**
   * Parsear resposta do agente para extrair informações estruturadas
   */
  private parseAgentResponse(agentResponse: any): {
    toolsUsed: string[];
    reasoning: string;
    result: any;
  } {
    // Extrair ferramentas usadas do histórico de tool calls
    const toolsUsed = agentResponse.toolCalls?.map((call: any) => call.toolName) || [];
    
    // Extrair raciocínio do texto da resposta
    const reasoning = this.extractReasoning(agentResponse.response);
    
    // Tentar extrair resultado estruturado (JSON no final da resposta)
    const result = this.extractStructuredResult(agentResponse.response);

    return {
      toolsUsed,
      reasoning,
      result
    };
  }

  /**
   * Extrair raciocínio do agente da resposta textual
   */
  private extractReasoning(response: string): string {
    // Buscar seção de raciocínio (entre **Raciocínio**: e próxima seção)
    const reasoningMatch = response.match(/\*\*Raciocínio\*\*:?\s*([\s\S]*?)(?:\n\*\*|$)/i);
    return reasoningMatch ? reasoningMatch[1].trim() : response;
  }

  /**
   * Extrair resultado estruturado (JSON) da resposta
   */
  private extractStructuredResult(response: string): any {
    try {
      // Buscar blocos JSON na resposta
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Tentar parsear JSON direto
      const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        return JSON.parse(jsonObjectMatch[0]);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Atualizar status da task
   */
  private async updateTaskStatus(taskId: string, status: string) {
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === 'IN_PROGRESS' && {
          lastRetryAt: new Date()
        })
      }
    });
  }

  /**
   * Atualizar task com resultado da execução
   */
  private async updateTaskCompletion(
    taskId: string,
    data: {
      status: string;
      result?: any;
      error?: string;
      interactionId?: string;
      agentResponse?: string;
    }
  ) {
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: data.status,
        approvalStatus: data.status === 'COMPLETED' ? 'EXECUTED' : 'FAILED',
        executedAt: data.status === 'COMPLETED' ? new Date() : null,
        executionResult: data.result ? {
          ...data.result,
          agentResponse: data.agentResponse,
          interactionId: data.interactionId,
          executedVia: 'MCP'
        } : null,
        errorMessage: data.error || null
      }
    });
  }
}
