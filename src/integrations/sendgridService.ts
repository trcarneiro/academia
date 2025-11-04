/**
 * SendGrid Service - Integração real com SendGrid API
 * 
 * Envia emails transacionais e em massa
 * 
 * Documentação: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

import sgMail from '@sendgrid/mail';
import { logger } from '@/utils/logger';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    type: string;
  }>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface BulkEmailMessage {
  recipients: Array<{
    email: string;
    name?: string;
    substitutions?: Record<string, string>;
  }>;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt: Date;
}

/**
 * Serviço de integração com SendGrid
 */
export class SendGridService {
  private isConfigured: boolean = false;
  private fromEmail: string = '';
  private fromName: string = '';

  constructor() {
    this.initialize();
  }

  /**
   * Inicializar cliente SendGrid
   */
  private initialize(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Academia Krav Maga';

    if (!apiKey) {
      logger.warn('[SendGrid] Missing API key. Set SENDGRID_API_KEY');
      this.isConfigured = false;
      return;
    }

    if (!this.fromEmail) {
      logger.warn('[SendGrid] Missing from email. Set SENDGRID_FROM_EMAIL');
      this.isConfigured = false;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      logger.info('[SendGrid] ✅ Client initialized successfully');
    } catch (error) {
      logger.error('[SendGrid] Failed to initialize client:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verificar se SendGrid está configurado
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Enviar email
   * 
   * @param data Dados do email
   * @returns Resultado do envio
   */
  async sendEmail(data: EmailMessage): Promise<EmailResult> {
    if (!this.isReady()) {
      throw new Error('SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL');
    }

    try {
      logger.info(`[SendGrid] Sending email to ${Array.isArray(data.to) ? data.to.join(', ') : data.to}`);

      const msg: any = {
        to: data.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: data.subject,
        html: data.html
      };

      // Adicionar texto plano se fornecido
      if (data.text) {
        msg.text = data.text;
      }

      // Adicionar reply-to se fornecido
      if (data.replyTo) {
        msg.replyTo = data.replyTo;
      }

      // Adicionar CC se fornecido
      if (data.cc) {
        msg.cc = data.cc;
      }

      // Adicionar BCC se fornecido
      if (data.bcc) {
        msg.bcc = data.bcc;
      }

      // Adicionar anexos se fornecidos
      if (data.attachments && data.attachments.length > 0) {
        msg.attachments = data.attachments;
      }

      // Enviar email
      const [response] = await sgMail.send(msg);

      const messageId = response.headers['x-message-id'] as string;

      logger.info(`[SendGrid] ✅ Email sent: ${messageId}`);

      return {
        messageId: messageId || `sg-${Date.now()}`,
        status: 'sent',
        sentAt: new Date()
      };
    } catch (error: any) {
      logger.error('[SendGrid] Failed to send email:', error);

      // Extrair mensagem de erro do SendGrid
      let errorMessage = 'Unknown error';
      if (error.response && error.response.body) {
        errorMessage = JSON.stringify(error.response.body.errors);
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        messageId: '',
        status: 'failed',
        errorMessage,
        sentAt: new Date()
      };
    }
  }

  /**
   * Enviar email em massa (com substituições personalizadas)
   * 
   * @param data Dados do email em massa
   * @returns Resultados dos envios
   */
  async sendBulkEmail(data: BulkEmailMessage): Promise<EmailResult[]> {
    if (!this.isReady()) {
      throw new Error('SendGrid not configured');
    }

    try {
      logger.info(`[SendGrid] Sending bulk email to ${data.recipients.length} recipients`);

      // Criar mensagens personalizadas
      const messages = data.recipients.map(recipient => {
        let html = data.html;
        let text = data.text || '';
        let subject = data.subject;

        // Aplicar substituições se fornecidas
        if (recipient.substitutions) {
          Object.entries(recipient.substitutions).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            html = html.replace(new RegExp(placeholder, 'g'), value);
            text = text.replace(new RegExp(placeholder, 'g'), value);
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
          });
        }

        return {
          to: {
            email: recipient.email,
            name: recipient.name || recipient.email
          },
          from: {
            email: this.fromEmail,
            name: this.fromName
          },
          subject,
          html,
          text: text || undefined
        };
      });

      // Enviar em batch
      const responses = await sgMail.send(messages);

      const results: EmailResult[] = responses.map((response, index) => {
        const messageId = response.headers['x-message-id'] as string;
        return {
          messageId: messageId || `sg-bulk-${Date.now()}-${index}`,
          status: 'sent',
          sentAt: new Date()
        };
      });

      logger.info(`[SendGrid] ✅ Bulk email sent: ${results.length} emails`);

      return results;
    } catch (error: any) {
      logger.error('[SendGrid] Failed to send bulk email:', error);

      // Retornar erro para todos
      return data.recipients.map(() => ({
        messageId: '',
        status: 'failed' as const,
        errorMessage: error.message || 'Unknown error',
        sentAt: new Date()
      }));
    }
  }

  /**
   * Rastrear status de email (via SendGrid Event Webhook)
   * 
   * Nota: Requer configurar webhook no painel SendGrid
   * 
   * @param messageId ID da mensagem
   * @returns Status do email (se disponível)
   */
  async trackEmail(messageId: string): Promise<{ delivered: boolean; opened: boolean; clicked: boolean }> {
    // SendGrid não tem API direta para rastrear status individual
    // Precisa usar Event Webhook e armazenar eventos no banco
    
    logger.warn('[SendGrid] Email tracking requires Event Webhook configuration');
    
    return {
      delivered: false,
      opened: false,
      clicked: false
    };
  }

  /**
   * Simular envio (modo desenvolvimento sem credenciais)
   * 
   * @param data Dados do email
   * @returns Resultado simulado
   */
  simulateSend(data: EmailMessage): EmailResult {
    logger.warn('[SendGrid] SIMULATED email send (no credentials configured)');
    logger.info(`[SendGrid] Would send to: ${Array.isArray(data.to) ? data.to.join(', ') : data.to}`);
    logger.info(`[SendGrid] Subject: ${data.subject}`);

    return {
      messageId: `simulated-${Date.now()}`,
      status: 'sent',
      sentAt: new Date()
    };
  }
}

// Singleton instance
export const sendGridService = new SendGridService();
