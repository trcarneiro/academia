import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function portalFinancialRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', portalAuthMiddleware);

  // List all payments
  fastify.get('/', async (request, reply) => {
    const studentId = request.studentId;
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      const payments = await prisma.payment.findMany({
        where: { studentId },
        orderBy: { dueDate: 'desc' },
        take: 20
      });

      return ResponseHelper.success(reply, {
        payments: payments.map(p => ({
          id: p.id,
          description: p.description || 'Mensalidade',
          amount: Number(p.amount),
          dueDate: p.dueDate,
          status: p.status,
          invoiceUrl: p.asaasInvoiceUrl,
          pixCode: p.asaasPixQrCode || p.pixCode
        }))
      });

    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao carregar financeiro', 500);
    }
  });

  // Get payment details
  fastify.get('/:id', async (request, reply) => {
    const studentId = request.studentId;
    const { id } = request.params as { id: string };
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      const payment = await prisma.payment.findFirst({
        where: { 
          id,
          studentId // Ensure student can only see their own payments
        }
      });

      if (!payment) {
        return ResponseHelper.error(reply, 'Pagamento não encontrado', 404);
      }

      return ResponseHelper.success(reply, {
        id: payment.id,
        description: payment.description || 'Mensalidade',
        amount: Number(payment.amount),
        dueDate: payment.dueDate,
        status: payment.status,
        invoiceUrl: payment.asaasInvoiceUrl,
        pixCode: payment.asaasPixQrCode || payment.pixCode
      });

    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao carregar pagamento', 500);
    }
  });
}
