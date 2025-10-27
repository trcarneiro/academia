/**
 * Notification Tool - MCP Tool for Agents
 * Permite que agentes enviem notificações (SMS, Email, Push)
 */

import { logger } from '@/utils/logger';
import { AgentPermissionService } from '../agentPermissionService';

export interface SendSMSParams {
  phoneNumbers: string[];
  message: string;
  agentId: string;
  organizationId: string;
  requirePermission?: boolean;
}

export interface SendEmailParams {
  emails: string[];
  subject: string;
  body: string;
  agentId: string;
  organizationId: string;
  requirePermission?: boolean;
}

export class NotificationTool {
  /**
   * Enviar SMS (requer aprovação se requirePermission = true)
   */
  static async sendSMS(params: SendSMSParams) {
    try {
      const { phoneNumbers, message, agentId, organizationId, requirePermission = true } = params;

      // Validar parâmetros
      if (!phoneNumbers || phoneNumbers.length === 0) {
        return { success: false, error: 'Phone numbers are required' };
      }

      if (!message || message.length === 0) {
        return { success: false, error: 'Message is required' };
      }

      // Se requer permissão, criar solicitação
      if (requirePermission) {
        const permission = await AgentPermissionService.create({
          agentId,
          organizationId,
          action: `Enviar SMS para ${phoneNumbers.length} número(s)`,
          details: {
            type: 'send_sms',
            phoneNumbers,
            message,
            estimatedCost: `R$ ${(phoneNumbers.length * 0.1).toFixed(2)}`,
          },
        });

        return {
          success: true,
          requiresApproval: true,
          permissionId: permission.data?.id,
          message: 'SMS precisa de aprovação antes de ser enviado',
        };
      }

      // TODO: Integrar com serviço de SMS (ex: Asaas, Twilio, etc)
      logger.info('Sending SMS:', {
        phoneNumbers,
        messageLength: message.length,
        agentId,
      });

      // Simular envio por enquanto
      return {
        success: true,
        data: {
          sent: phoneNumbers.length,
          phoneNumbers,
          message,
        },
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      return { success: false, error: 'Failed to send SMS' };
    }
  }

  /**
   * Enviar Email (requer aprovação se requirePermission = true)
   */
  static async sendEmail(params: SendEmailParams) {
    try {
      const { emails, subject, body, agentId, organizationId, requirePermission = true } = params;

      // Validar parâmetros
      if (!emails || emails.length === 0) {
        return { success: false, error: 'Email addresses are required' };
      }

      if (!subject || !body) {
        return { success: false, error: 'Subject and body are required' };
      }

      // Se requer permissão, criar solicitação
      if (requirePermission) {
        const permission = await AgentPermissionService.create({
          agentId,
          organizationId,
          action: `Enviar email para ${emails.length} destinatário(s)`,
          details: {
            type: 'send_email',
            emails,
            subject,
            bodyPreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
          },
        });

        return {
          success: true,
          requiresApproval: true,
          permissionId: permission.data?.id,
          message: 'Email precisa de aprovação antes de ser enviado',
        };
      }

      // TODO: Integrar com serviço de Email (ex: SendGrid, AWS SES, etc)
      logger.info('Sending Email:', {
        emails,
        subject,
        agentId,
      });

      // Simular envio por enquanto
      return {
        success: true,
        data: {
          sent: emails.length,
          emails,
          subject,
        },
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  /**
   * Enviar notificação push (in-app)
   */
  static async sendPushNotification(params: {
    userIds: string[];
    title: string;
    message: string;
    agentId: string;
    organizationId: string;
  }) {
    try {
      const { userIds, title, message, agentId, organizationId } = params;

      // Validar parâmetros
      if (!userIds || userIds.length === 0) {
        return { success: false, error: 'User IDs are required' };
      }

      if (!title || !message) {
        return { success: false, error: 'Title and message are required' };
      }

      // TODO: Implementar notificações push via WebSocket ou Firebase
      logger.info('Sending push notification:', {
        userIds,
        title,
        agentId,
      });

      // Simular envio por enquanto
      return {
        success: true,
        data: {
          sent: userIds.length,
          userIds,
          title,
          message,
        },
      };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      return { success: false, error: 'Failed to send push notification' };
    }
  }

  /**
   * Executar ação de notificação após aprovação
   */
  static async executeApprovedAction(permissionId: string, details: any) {
    try {
      const { type } = details;

      switch (type) {
        case 'send_sms':
          // Chamar sendSMS sem requirePermission
          return await this.sendSMS({
            ...details,
            requirePermission: false,
          });

        case 'send_email':
          // Chamar sendEmail sem requirePermission
          return await this.sendEmail({
            ...details,
            requirePermission: false,
          });

        default:
          return { success: false, error: `Unknown action type: ${type}` };
      }
    } catch (error) {
      logger.error('Error executing approved notification:', error);
      return { success: false, error: 'Failed to execute notification' };
    }
  }

  /**
   * Validar número de telefone brasileiro
   */
  private static validateBrazilianPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Deve ter 10 ou 11 dígitos (com DDD)
    return /^[1-9]{2}9?[0-9]{8}$/.test(cleaned);
  }

  /**
   * Validar email
   */
  private static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
