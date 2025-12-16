/**
 * Portal do Aluno - Payment Routes
 * Endpoints de pagamentos para alunos
 * 
 * Endpoints:
 * - POST /create - Criar cobrança PIX
 * - GET /:id - Detalhes da cobrança
 * - GET /:id/status - Status da cobrança (polling)
 * - GET /:id/qr-code - QR Code PIX
 * - GET / - Listar cobranças do aluno
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from '@/services/portal/paymentService';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { ResponseHelper } from '@/utils/response';

// Type definitions
interface CreateChargeBody {
  subscriptionId?: string;
  amount: number;
  dueDate?: string;
  description?: string;
}

interface ChargeParams {
  id: string;
}

interface ListChargesQuery {
  status?: string;
  limit?: number;
  offset?: number;
}

export default async function portalPaymentsRoutes(fastify: FastifyInstance) {
  // Aplicar autenticação em todas as rotas
  fastify.addHook('preHandler', portalAuthMiddleware);

  /**
   * POST /create
   * Criar nova cobrança PIX
   */
  fastify.post<{ Body: CreateChargeBody }>(
    '/create',
    {
      schema: {
        body: {
          type: 'object',
          required: ['amount'],
          properties: {
            subscriptionId: { type: 'string' },
            amount: { type: 'number', minimum: 1 },
            dueDate: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              paymentId: { type: 'string' },
              pixCode: { type: 'string' },
              qrCodeUrl: { type: 'string' },
              invoiceUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { subscriptionId, amount, dueDate, description } = request.body;
      const studentId = request.studentId;
      const organizationId = request.organizationId;

      if (!studentId || !organizationId) {
        return ResponseHelper.error(reply, 'Dados de autenticação incompletos', 400);
      }

      logger.info('Portal: Criando cobrança PIX', {
        studentId,
        subscriptionId,
        amount,
      });

      // Validate subscription belongs to student if provided
      if (subscriptionId) {
        const subscription = await prisma.studentSubscription.findFirst({
          where: {
            id: subscriptionId,
            studentId,
          },
        });

        if (!subscription) {
          return reply.code(404).send({
            success: false,
            error: 'Assinatura não encontrada',
            errorCode: 'NOT_FOUND',
          });
        }
      }

      const result = await paymentService.createCharge({
        studentId,
        subscriptionId,
        amount,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        description,
      });

      if (!result.success) {
        logger.warn('Portal: Erro ao criar cobrança', {
          studentId,
          error: result.error,
        });

        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      logger.info('Portal: Cobrança PIX criada', {
        studentId,
        paymentId: result.paymentId,
      });

      return reply.code(201).send({
        success: true,
        paymentId: result.paymentId,
        pixCode: result.pixCode,
        qrCodeUrl: result.qrCodeUrl,
        invoiceUrl: result.invoiceUrl,
      });
    }
  );

  /**
   * GET /:id
   * Detalhes de uma cobrança
   */
  fastify.get<{ Params: ChargeParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const studentId = request.studentId;
      if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

      const payment = await paymentService.getPaymentById(id, studentId);

      if (!payment) {
        return reply.code(404).send({
          success: false,
          error: 'Pagamento não encontrado',
          errorCode: 'NOT_FOUND',
        });
      }

      return reply.send({
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          dueDate: payment.dueDate,
          paidDate: payment.paidDate,
          description: payment.description,
          pixCode: payment.pixCode,
          invoiceUrl: payment.asaasChargeUrl,
          plan: payment.subscription?.plan,
        },
      });
    }
  );

  /**
   * GET /:id/status
   * Status da cobrança (para polling do frontend)
   */
  fastify.get<{ Params: ChargeParams }>(
    '/:id/status',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              status: { type: 'string' },
              paidDate: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const studentId = request.studentId;
      if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

      const result = await paymentService.getPaymentStatus(id, studentId);

      if (!result.success) {
        return reply.code(404).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        status: result.status,
        paidDate: result.paidDate,
      });
    }
  );

  /**
   * GET /:id/qr-code
   * Obter QR Code PIX
   */
  fastify.get<{ Params: ChargeParams }>(
    '/:id/qr-code',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              pixCode: { type: 'string' },
              qrCodeImage: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const studentId = request.studentId;
      if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

      const result = await paymentService.getPixQrCode(id, studentId);

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        pixCode: result.pixCode,
        qrCodeImage: result.qrCodeImage,
      });
    }
  );

  /**
   * GET /
   * Listar cobranças do aluno
   */
  fastify.get<{ Querystring: ListChargesQuery }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'number', default: 10 },
            offset: { type: 'number', default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              payments: { type: 'array' },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { status, limit, offset } = request.query;
      const studentId = request.studentId;
      if (!studentId) return ResponseHelper.error(reply, 'Aluno não identificado', 400);

      const result = await paymentService.listPayments(studentId, {
        status,
        limit: limit || 10,
        offset: offset || 0,
      });

      return reply.send({
        success: true,
        payments: result.payments,
        total: result.total,
      });
    }
  );
}
