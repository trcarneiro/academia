/**
 * Portal do Aluno - Webhook Routes
 * Endpoint para receber webhooks do Asaas
 * 
 * Endpoints:
 * - POST /asaas - Webhook de pagamentos Asaas
 * - GET /asaas/health - Health check
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from '@/services/portal/paymentService';
import { logger } from '@/utils/logger';

// Configurações
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || '';

// Type definitions
interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    status: string;
    value: number;
    billingType: string;
    confirmedDate?: string;
    paymentDate?: string;
    externalReference?: string;
  };
}

/**
 * Valida o token do webhook Asaas
 */
function validateAsaasToken(request: FastifyRequest): boolean {
  // Se não tem token configurado, aceita em dev/sandbox
  if (!ASAAS_WEBHOOK_TOKEN) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      logger.warn('Webhook: Token não configurado, aceitando em modo dev');
      return true;
    }
    return false;
  }

  // Verifica header do Asaas
  const token = request.headers['asaas-access-token'] as string;
  
  if (!token) {
    logger.warn('Webhook: Token não fornecido no header');
    return false;
  }

  if (token !== ASAAS_WEBHOOK_TOKEN) {
    logger.warn('Webhook: Token inválido');
    return false;
  }

  return true;
}

export default async function portalWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /asaas
   * Recebe webhooks de pagamento do Asaas
   * 
   * Eventos processados:
   * - PAYMENT_RECEIVED: Pagamento recebido
   * - PAYMENT_CONFIRMED: Pagamento confirmado
   * - PAYMENT_OVERDUE: Pagamento vencido
   * - PAYMENT_DELETED: Pagamento cancelado
   * - PAYMENT_REFUNDED: Pagamento estornado
   */
  fastify.post<{ Body: AsaasWebhookPayload }>(
    '/asaas',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            event: { type: 'string' },
            payment: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                customer: { type: 'string' },
                status: { type: 'string' },
                value: { type: 'number' },
                billingType: { type: 'string' },
                confirmedDate: { type: 'string' },
                paymentDate: { type: 'string' },
                externalReference: { type: 'string' },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // 1. Validar token de autenticação
      if (!validateAsaasToken(request)) {
        logger.error('Webhook: Tentativa de acesso não autorizado', {
          ip: request.ip,
        });

        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const payload = request.body;

      // 2. Log do evento recebido
      logger.info('Webhook Asaas recebido', {
        event: payload.event,
        paymentId: payload.payment?.id,
        status: payload.payment?.status,
        value: payload.payment?.value,
      });

      // 3. Validar payload
      if (!payload.event) {
        logger.warn('Webhook: Payload sem evento');
        return reply.code(400).send({
          success: false,
          error: 'Invalid payload',
        });
      }

      // 4. Processar webhook
      try {
        const result = await paymentService.processWebhook({
          event: payload.event,
          payment: payload.payment ? {
            id: payload.payment.id,
            status: payload.payment.status,
            value: payload.payment.value,
            billingType: payload.payment.billingType,
            paymentDate: payload.payment.paymentDate,
          } : undefined,
        });

        logger.info('Webhook Asaas processado', {
          event: payload.event,
          paymentId: payload.payment?.id,
          success: result.success,
        });

        // Sempre retorna 200 para o Asaas não retentar
        return reply.code(200).send({
          success: result.success,
        });
      } catch (error) {
        logger.error('Webhook: Erro ao processar', {
          error,
          event: payload.event,
          paymentId: payload.payment?.id,
        });

        // Retorna 200 mesmo com erro para evitar retentativas infinitas
        return reply.code(200).send({
          success: false,
        });
      }
    }
  );

  /**
   * GET /asaas/health
   * Health check para validar configuração do webhook
   */
  fastify.get(
    '/asaas/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              configured: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const configured = !!ASAAS_WEBHOOK_TOKEN;
      
      return reply.send({
        success: true,
        configured,
        message: configured 
          ? 'Webhook configurado corretamente'
          : 'Token não configurado - usando modo dev',
      });
    }
  );
}
