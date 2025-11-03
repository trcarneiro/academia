/**
 * Twilio Service - Integração real com Twilio API
 * 
 * Envia WhatsApp e SMS via Twilio
 * 
 * Documentação: https://www.twilio.com/docs/whatsapp/api
 */

import twilio from 'twilio';
import { logger } from '@/utils/logger';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  mediaUrl?: string;
}

export interface SMSMessage {
  phone: string;
  message: string;
}

export interface MessageResult {
  messageId: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  cost?: string;
  errorMessage?: string;
  sentAt: Date;
}

/**
 * Serviço de integração com Twilio
 */
export class TwilioService {
  private client: twilio.Twilio | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializar cliente Twilio
   */
  private initialize(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      logger.warn('[Twilio] Missing credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
      logger.info('[Twilio] ✅ Client initialized successfully');
    } catch (error) {
      logger.error('[Twilio] Failed to initialize client:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verificar se Twilio está configurado
   */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Enviar mensagem WhatsApp
   * 
   * @param data Dados da mensagem
   * @returns Resultado do envio
   */
  async sendWhatsApp(data: WhatsAppMessage): Promise<MessageResult> {
    if (!this.isReady()) {
      throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not set');
    }

    try {
      logger.info(`[Twilio] Sending WhatsApp to ${data.phone}`);

      // Formatar número (adicionar whatsapp: prefix)
      const to = data.phone.startsWith('whatsapp:') ? data.phone : `whatsapp:${data.phone}`;
      const from = whatsappNumber.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${whatsappNumber}`;

      // Enviar mensagem
      const messagePayload: any = {
        from,
        to,
        body: data.message
      };

      // Adicionar mídia se fornecida
      if (data.mediaUrl) {
        messagePayload.mediaUrl = [data.mediaUrl];
      }

      const message = await this.client!.messages.create(messagePayload);

      logger.info(`[Twilio] ✅ WhatsApp sent: ${message.sid}`);

      return {
        messageId: message.sid,
        status: message.status as any,
        cost: message.price || undefined,
        sentAt: message.dateCreated
      };
    } catch (error: any) {
      logger.error('[Twilio] Failed to send WhatsApp:', error);
      
      return {
        messageId: '',
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        sentAt: new Date()
      };
    }
  }

  /**
   * Enviar SMS
   * 
   * @param data Dados da mensagem
   * @returns Resultado do envio
   */
  async sendSMS(data: SMSMessage): Promise<MessageResult> {
    if (!this.isReady()) {
      throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!phoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not set');
    }

    try {
      logger.info(`[Twilio] Sending SMS to ${data.phone}`);

      const message = await this.client!.messages.create({
        from: phoneNumber,
        to: data.phone,
        body: data.message
      });

      logger.info(`[Twilio] ✅ SMS sent: ${message.sid}`);

      return {
        messageId: message.sid,
        status: message.status as any,
        cost: message.price || undefined,
        sentAt: message.dateCreated
      };
    } catch (error: any) {
      logger.error('[Twilio] Failed to send SMS:', error);
      
      return {
        messageId: '',
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        sentAt: new Date()
      };
    }
  }

  /**
   * Verificar status de mensagem
   * 
   * @param messageId SID da mensagem
   * @returns Status da mensagem
   */
  async getMessageStatus(messageId: string): Promise<MessageResult> {
    if (!this.isReady()) {
      throw new Error('Twilio not configured');
    }

    try {
      const message = await this.client!.messages(messageId).fetch();

      return {
        messageId: message.sid,
        status: message.status as any,
        cost: message.price || undefined,
        sentAt: message.dateCreated
      };
    } catch (error: any) {
      logger.error(`[Twilio] Failed to get message status for ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Verificar saldo da conta Twilio
   * 
   * @returns Saldo em USD
   */
  async getBalance(): Promise<{ balance: string; currency: string }> {
    if (!this.isReady()) {
      throw new Error('Twilio not configured');
    }

    try {
      const balance = await this.client!.balance.fetch();

      return {
        balance: balance.balance,
        currency: balance.currency
      };
    } catch (error: any) {
      logger.error('[Twilio] Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Simular envio (modo desenvolvimento sem credenciais)
   * 
   * @param type 'whatsapp' ou 'sms'
   * @param data Dados da mensagem
   * @returns Resultado simulado
   */
  simulateSend(type: 'whatsapp' | 'sms', data: WhatsAppMessage | SMSMessage): MessageResult {
    logger.warn(`[Twilio] SIMULATED ${type.toUpperCase()} send (no credentials configured)`);
    logger.info(`[Twilio] Would send to: ${data.phone}`);
    logger.info(`[Twilio] Message: ${data.message}`);

    return {
      messageId: `simulated-${Date.now()}`,
      status: 'sent',
      cost: '0.00',
      sentAt: new Date()
    };
  }
}

// Singleton instance
export const twilioService = new TwilioService();
