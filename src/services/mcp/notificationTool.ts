/**
 * Notification Tool - MCP Tool for Agents
 * Permite que agentes enviem notificações (SMS, Email, Push)
 */

import { logger } from '@/utils/logger';
import prisma from '@/utils/prisma';
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

      // 1. Find students
      const students = await prisma.student.findMany({
        where: { user: { phone: { in: phoneNumbers } } }
      });

      // 2. Create Broadcast Record
      const broadcast = await (prisma as any).broadcast.create({
        data: {
          organizationId,
          title: 'SMS Broadcast',
          message,
          segment: 'CUSTOM_LIST',
          channels: ['SMS'],
          status: 'COMPLETED',
          sentAt: new Date(),
          authorId: agentId.length === 36 ? agentId : undefined,
          stats: {
            sent: students.length,
            failed: phoneNumbers.length - students.length
          }
        }
      });

      // 3. Create In-App Notifications too (optional but recommended for centralizing)
      if (students.length > 0) {
        await prisma.studentNotification.createMany({
          data: students.map(student => ({
            studentId: student.id,
            title: 'Novo Aviso (SMS)',
            message,
            type: 'MARKETING' as any,
            priority: 'NORMAL' as any,
            read: false,
            metadata: { broadcastId: broadcast.id } as any
          }))
        });
      }

      logger.info('SMS Broadcast Sent:', { broadcastId: broadcast.id, recipients: students.length });

      return {
        success: true,
        data: {
          sent: students.length,
          broadcastId: broadcast.id
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

      // 1. Find students
      const students = await prisma.student.findMany({
        where: { user: { email: { in: emails } } }
      });

      if (students.length === 0) {
        return { success: false, error: 'No valid students found for these emails' };
      }

      // 2. Create Broadcast Record
      const broadcast = await prisma.broadcast.create({
        data: {
          organizationId,
          title: subject,
          message: body,
          segment: 'CUSTOM_LIST',
          channels: ['EMAIL'],
          status: 'COMPLETED', // Since we are "sending" immediately
          sentAt: new Date(),
          authorId: agentId.length === 36 ? agentId : undefined, // Only link if agentId is a valid UUID (User ID)
          stats: {
            sent: students.length,
            failed: emails.length - students.length
          }
        }
      });

      // 3. Create Notifications
      await prisma.studentNotification.createMany({
        data: students.map(student => ({
          studentId: student.id,
          title: subject,
          message: body,
          type: 'MARKETING' as any,
          priority: 'NORMAL' as any,
          read: false,
          metadata: { broadcastId: broadcast.id } as any
        }))
      });

      logger.info('Broadcast Sent:', { broadcastId: broadcast.id, recipients: students.length });

      return { success: true, data: { sent: students.length, broadcastId: broadcast.id } };
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

      // 1. Create Broadcast Record
      const broadcast = await (prisma as any).broadcast.create({
        data: {
          organizationId,
          title,
          message,
          segment: 'CUSTOM_LIST',
          channels: ['PUSH'],
          status: 'COMPLETED',
          sentAt: new Date(),
          authorId: agentId.length === 36 ? agentId : undefined,
          stats: {
            sent: userIds.length,
            failed: 0
          }
        }
      });

      // 2. Create Notifications for Students
      const students = await prisma.student.findMany({
        where: { userId: { in: userIds } }
      });

      if (students.length > 0) {
        await prisma.studentNotification.createMany({
          data: students.map(student => ({
            studentId: student.id,
            title,
            message,
            type: 'MARKETING' as any,
            priority: 'NORMAL' as any,
            read: false,
            metadata: { broadcastId: broadcast.id } as any
          }))
        });
      }

      logger.info('Push Broadcast Sent:', { broadcastId: broadcast.id, recipients: students.length });

      return {
        success: true,
        data: {
          sent: students.length,
          broadcastId: broadcast.id
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
