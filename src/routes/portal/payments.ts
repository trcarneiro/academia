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
import { validateToken } from '@/services/portal/authService';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

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

// Middleware para autenticação do portal
async function portalAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({
      success: false,
      error: 'Token não fornecido',
      errorCode: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.substring(7);
  const result = await validateToken(token);

  if (!result.valid || !result.payload) {
    return reply.code(401).send({
      success: false,
      error: result.error || 'Token inválido',
      errorCode: 'UNAUTHORIZED',
    });
  }

  // Adiciona dados do usuário ao request
  (request as FastifyRequest & { student: StudentContext }).student = {
    id: result.payload.sub,
    email: result.payload.email,
    name: result.payload.name,
    organizationId: result.payload.orgId,
  };
}

interface StudentContext {
  id: string;
  email: string;
  name: string;
  organizationId: string;
}

export default async function portalPaymentsRoutes(fastify: FastifyInstance) {
  // Aplicar autenticação em todas as rotas
  fastify.addHook('preHandler', portalAuth);

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
      const student = (request as FastifyRequest & { student: StudentContext }).student;

      logger.info('Portal: Criando cobrança PIX', {
        studentId: student.id,
        subscriptionId,
        amount,
      });

      // Validate subscription belongs to student if provided
      if (subscriptionId) {
        const subscription = await prisma.studentSubscription.findFirst({
          where: {
            id: subscriptionId,
            studentId: student.id,
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
        studentId: student.id,
        subscriptionId,
        amount,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        description,
      });

      if (!result.success) {
        logger.warn('Portal: Erro ao criar cobrança', {
          studentId: student.id,
          error: result.error,
        });

        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      logger.info('Portal: Cobrança PIX criada', {
        studentId: student.id,
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
      const student = (request as FastifyRequest & { student: StudentContext }).student;

      const payment = await paymentService.getPaymentById(id, student.id);

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

      const result = await paymentService.getPaymentStatus(id);

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

      const result = await paymentService.getPixQrCode(id);

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
      const student = (request as FastifyRequest & { student: StudentContext }).student;

      const result = await paymentService.listPayments(student.id, {
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
