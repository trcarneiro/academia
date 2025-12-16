/**
 * Portal do Aluno - Payment Service
 * 
 * Handles PIX payment creation, status checking, and webhook processing
 * Integrates with Asaas payment gateway
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface CreateChargeParams {
  studentId: string;
  subscriptionId?: string;
  amount: number;
  dueDate: Date;
  description?: string;
}

interface CreateChargeResult {
  success: boolean;
  paymentId?: string;
  pixCode?: string;
  qrCodeUrl?: string;
  invoiceUrl?: string;
  error?: string;
}

interface PaymentStatusResult {
  success: boolean;
  status?: string;
  paidDate?: Date | null;
  error?: string;
}

interface WebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    value: number;
    netValue?: number;
    paymentDate?: string;
    billingType?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCodeId?: string;
  };
}

// ============================================================================
// ASAAS API HELPERS
// ============================================================================

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ASAAS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Asaas API error:', { status: response.status, error: errorText });
    throw new Error(`Asaas API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export const paymentService = {
  /**
   * Creates a PIX charge for a student enrollment
   */
  async createCharge(params: CreateChargeParams): Promise<CreateChargeResult> {
    const { studentId, subscriptionId, amount, dueDate, description } = params;

    try {
      // 1. Get student with Asaas customer relation
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          asaasCustomer: true, // Relation to AsaasCustomer
        },
      });

      if (!student) {
        return { success: false, error: 'Aluno não encontrado' };
      }

      // 2. Ensure student has Asaas customer ID
      let asaasCustomerId = student.asaasCustomer?.asaasId;
      
      if (!asaasCustomerId) {
        // Create customer in Asaas
        const customerResult = await this.ensureAsaasCustomer(student);
        if (!customerResult.success) {
          return { success: false, error: customerResult.error };
        }
        asaasCustomerId = customerResult.asaasId;
      }

      // 3. Create payment in database first (PENDING status)
      const payment = await prisma.payment.create({
        data: {
          studentId,
          subscriptionId,
          amount,
          dueDate,
          description: description || 'Mensalidade',
          paymentMethod: 'PIX',
          status: 'PENDING',
          organizationId: student.organizationId,
          financialResponsibleId: studentId, // Use student as financial responsible by default
        },
      });

      // 4. Create charge in Asaas
      const chargePayload = {
        customer: asaasCustomerId,
        billingType: 'PIX',
        value: amount,
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        description: description || `Mensalidade - ${student.user?.firstName || 'Aluno'} ${student.user?.lastName || ''}`.trim(),
        externalReference: payment.id,
      };

      const asaasCharge = await asaasRequest<{
        id: string;
        invoiceUrl: string;
        status: string;
      }>('/payments', {
        method: 'POST',
        body: JSON.stringify(chargePayload),
      });

      // 5. Get PIX QR Code
      const pixData = await asaasRequest<{
        payload: string;
        encodedImage: string;
      }>(`/payments/${asaasCharge.id}/pixQrCode`, {
        method: 'GET',
      });

      // 6. Update payment with Asaas info
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          asaasPaymentId: asaasCharge.id,
          asaasChargeUrl: asaasCharge.invoiceUrl,
          pixCode: pixData.payload,
        },
      });

      // 7. Create notification for student
      await this.createPaymentNotification(studentId, 'PAYMENT_DUE', {
        paymentId: payment.id,
        amount,
        dueDate,
      });

      logger.info('Payment created successfully', {
        paymentId: payment.id,
        asaasChargeId: asaasCharge.id,
        studentId,
      });

      return {
        success: true,
        paymentId: payment.id,
        pixCode: pixData.payload,
        qrCodeUrl: `data:image/png;base64,${pixData.encodedImage}`,
        invoiceUrl: asaasCharge.invoiceUrl,
      };
    } catch (error) {
      logger.error('Error creating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar cobrança',
      };
    }
  },

  /**
   * Ensures student has an Asaas customer record
   */
  async ensureAsaasCustomer(student: {
    id: string;
    organizationId: string;
    user?: { firstName?: string | null; lastName?: string | null; email?: string | null; cpf?: string | null } | null;
  }): Promise<{ success: boolean; asaasId?: string; error?: string }> {
    try {
      if (!student.user || !student.user.email) {
        return { success: false, error: 'Aluno sem usuário ou email vinculado' };
      }

      // Create customer in Asaas
      const fullName = `${student.user.firstName || 'Aluno'} ${student.user.lastName || ''}`.trim();
      const customerPayload = {
        name: fullName,
        email: student.user.email,
        cpfCnpj: student.user.cpf?.replace(/\D/g, '') || undefined,
      };

      const asaasCustomer = await asaasRequest<{
        id: string;
        name: string;
      }>('/customers', {
        method: 'POST',
        body: JSON.stringify(customerPayload),
      });

      // Save to database
      await prisma.asaasCustomer.create({
        data: {
          asaasId: asaasCustomer.id,
          studentId: student.id,
          organizationId: student.organizationId,
          name: asaasCustomer.name,
          email: student.user.email || '',
        },
      });

      return { success: true, asaasId: asaasCustomer.id };
    } catch (error) {
      logger.error('Error creating Asaas customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar cliente no Asaas',
      };
    }
  },

  /**
   * Gets payment status from Asaas
   */
  async getPaymentStatus(paymentId: string, studentId?: string): Promise<PaymentStatusResult> {
    try {
      const where: any = { id: paymentId };
      if (studentId) {
        where.studentId = studentId;
      }

      const payment = await prisma.payment.findFirst({
        where,
      });

      if (!payment) {
        return { success: false, error: 'Pagamento não encontrado' };
      }

      if (!payment.asaasPaymentId) {
        return { success: true, status: payment.status, paidDate: payment.paidDate };
      }

      // Check status in Asaas
      const asaasPayment = await asaasRequest<{
        status: string;
        paymentDate?: string;
      }>(`/payments/${payment.asaasPaymentId}`, {
        method: 'GET',
      });

      // Map Asaas status to our status
      const statusMap: Record<string, string> = {
        PENDING: 'PENDING',
        RECEIVED: 'PAID',
        CONFIRMED: 'PAID',
        OVERDUE: 'PENDING', // Keep as PENDING in our system
        REFUNDED: 'REFUNDED',
        RECEIVED_IN_CASH: 'PAID',
        REFUND_REQUESTED: 'REFUNDED',
        CHARGEBACK_REQUESTED: 'REFUNDED',
        CHARGEBACK_DISPUTE: 'REFUNDED',
        AWAITING_CHARGEBACK_REVERSAL: 'REFUNDED',
        DUNNING_REQUESTED: 'PENDING',
        DUNNING_RECEIVED: 'PAID',
        AWAITING_RISK_ANALYSIS: 'PENDING',
      };

      const mappedStatus = statusMap[asaasPayment.status] || 'PENDING';
      const paidDate = asaasPayment.paymentDate ? new Date(asaasPayment.paymentDate) : null;

      // Update local payment if status changed
      if (payment.status !== mappedStatus || (paidDate && !payment.paidDate)) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: mappedStatus as 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED',
            paidDate: paidDate || payment.paidDate,
          },
        });
      }

      return { success: true, status: mappedStatus, paidDate };
    } catch (error) {
      logger.error('Error getting payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar status',
      };
    }
  },

  /**
   * Gets payment details by ID
   */
  async getPaymentById(paymentId: string, studentId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        studentId,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return payment;
  },

  /**
   * Lists payments for a student
   */
  async listPayments(studentId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { status, limit = 20, offset = 0 } = options || {};

    const where: Record<string, unknown> = { studentId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { dueDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  },

  /**
   * Gets PIX QR code for a payment
   */
  async getPixQrCode(paymentId: string, studentId?: string): Promise<{
    success: boolean;
    pixCode?: string;
    qrCodeImage?: string;
    error?: string;
  }> {
    try {
      const where: any = { id: paymentId };
      if (studentId) {
        where.studentId = studentId;
      }

      const payment = await prisma.payment.findFirst({
        where,
      });

      if (!payment) {
        return { success: false, error: 'Pagamento não encontrado' };
      }

      if (payment.status !== 'PENDING') {
        return { success: false, error: 'Pagamento não está pendente' };
      }

      // If we have cached PIX code, use it
      if (payment.pixCode) {
        return {
          success: true,
          pixCode: payment.pixCode,
        };
      }

      // Otherwise, fetch from Asaas
      if (!payment.asaasPaymentId) {
        return { success: false, error: 'Cobrança não encontrada no Asaas' };
      }

      const pixData = await asaasRequest<{
        payload: string;
        encodedImage: string;
      }>(`/payments/${payment.asaasPaymentId}/pixQrCode`, {
        method: 'GET',
      });

      // Cache the PIX code
      await prisma.payment.update({
        where: { id: paymentId },
        data: { pixCode: pixData.payload },
      });

      return {
        success: true,
        pixCode: pixData.payload,
        qrCodeImage: `data:image/png;base64,${pixData.encodedImage}`,
      };
    } catch (error) {
      logger.error('Error getting PIX QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter QR Code',
      };
    }
  },

  /**
   * Processes Asaas webhook events
   */
  async processWebhook(payload: WebhookPayload): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { event, payment: asaasPayment } = payload;

      if (!asaasPayment) {
        return { success: true }; // Non-payment event, ignore
      }

      logger.info('Processing Asaas webhook', { event, paymentId: asaasPayment.id });

      // Find local payment by Asaas ID
      const payment = await prisma.payment.findFirst({
        where: { asaasPaymentId: asaasPayment.id },
        include: { student: true },
      });

      if (!payment) {
        logger.warn('Payment not found for webhook', { asaasPaymentId: asaasPayment.id });
        return { success: true }; // Not our payment
      }

      // Handle different events
      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED': {
          const paidDate = asaasPayment.paymentDate
            ? new Date(asaasPayment.paymentDate)
            : new Date();

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              paidDate,
            },
          });

          // Notify student
          await this.createPaymentNotification(payment.studentId, 'PAYMENT_CONFIRMED', {
            paymentId: payment.id,
            amount: payment.amount,
          });

          logger.info('Payment confirmed', { paymentId: payment.id });
          break;
        }

        case 'PAYMENT_OVERDUE': {
          // Keep status as PENDING but notify
          await this.createPaymentNotification(payment.studentId, 'PAYMENT_OVERDUE', {
            paymentId: payment.id,
            amount: payment.amount,
            dueDate: payment.dueDate,
          });

          logger.info('Payment overdue notification sent', { paymentId: payment.id });
          break;
        }

        case 'PAYMENT_REFUNDED': {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' },
          });

          logger.info('Payment refunded', { paymentId: payment.id });
          break;
        }

        case 'PAYMENT_DELETED': {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'CANCELLED' },
          });

          logger.info('Payment cancelled', { paymentId: payment.id });
          break;
        }

        default:
          logger.debug('Unhandled webhook event', { event });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error processing webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar webhook',
      };
    }
  },

  /**
   * Creates a notification for payment events
   */
  async createPaymentNotification(
    studentId: string,
    type: 'PAYMENT_DUE' | 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE',
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const titles: Record<string, string> = {
        PAYMENT_DUE: 'Nova Cobrança Disponível',
        PAYMENT_CONFIRMED: 'Pagamento Confirmado',
        PAYMENT_OVERDUE: 'Pagamento Vencido',
      };

      const messages: Record<string, string> = {
        PAYMENT_DUE: `Você tem uma nova cobrança de R$ ${Number(data.amount).toFixed(2)} disponível para pagamento.`,
        PAYMENT_CONFIRMED: `Seu pagamento de R$ ${Number(data.amount).toFixed(2)} foi confirmado. Obrigado!`,
        PAYMENT_OVERDUE: `Sua cobrança de R$ ${Number(data.amount).toFixed(2)} está vencida. Regularize sua situação.`,
      };

      await prisma.studentNotification.create({
        data: {
          studentId,
          type,
          title: titles[type],
          message: messages[type],
          metadata: data as object,
        },
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      // Don't throw - notifications are not critical
    }
  },

  /**
   * Generates monthly charges for all active subscriptions
   * Called by cron job or admin action
   */
  async generateMonthlyCharges(organizationId: string): Promise<{
    success: boolean;
    created: number;
    errors: number;
  }> {
    let created = 0;
    let errors = 0;

    try {
      // Find active subscriptions without payment for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const subscriptions = await prisma.studentSubscription.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          isActive: true,
          student: {
            isActive: true,
          },
          // No payment for this month
          payments: {
            none: {
              dueDate: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
        },
        include: {
          student: {
            include: { user: true },
          },
          plan: true,
        },
      });

      logger.info(`Found ${subscriptions.length} subscriptions needing charges`);

      for (const subscription of subscriptions) {
        try {
          // Calculate due date based on nextBillingDate or day 10
          const dueDate = subscription.nextBillingDate 
            ? new Date(subscription.nextBillingDate)
            : new Date(now.getFullYear(), now.getMonth(), 10);
          
          // If due date has passed, set to next month
          if (dueDate < now) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }

          const result = await this.createCharge({
            studentId: subscription.studentId,
            subscriptionId: subscription.id,
            amount: Number(subscription.currentPrice || 0),
            dueDate,
            description: `Mensalidade ${now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
          });

          if (result.success) {
            created++;
          } else {
            errors++;
            logger.error('Error creating charge for subscription', {
              subscriptionId: subscription.id,
              error: result.error,
            });
          }
        } catch (error) {
          errors++;
          logger.error('Exception creating charge', {
            subscriptionId: subscription.id,
            error,
          });
        }
      }

      return { success: true, created, errors };
    } catch (error) {
      logger.error('Error generating monthly charges:', error);
      return { success: false, created, errors };
    }
  },
};

export default paymentService;
