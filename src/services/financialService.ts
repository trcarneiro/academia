// @ts-nocheck
import { PrismaClient, StudentCategory, BillingType, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { AsaasService, AsaasCustomerData, AsaasPaymentData } from './asaasService';

const prisma = new PrismaClient();

export interface CreatePlanData {
  name: string;
  description?: string | undefined;
  category?: StudentCategory | undefined;
  price: number;
  billingType: BillingType;
  classesPerWeek: number;
  maxClasses?: number | undefined;
  hasPersonalTraining?: boolean | undefined;
  hasNutrition?: boolean | undefined;
}

export interface CreateSubscriptionData {
  studentId: string;
  planId: string;
  startDate?: Date | undefined;
  customPrice?: number | undefined;
}

export interface StudentFinancialSummary {
  student: {
    id: string;
    name: string;
    email: string;
    category: StudentCategory;
  };
  subscription: {
    id: string;
    status: SubscriptionStatus;
    currentPrice: number;
    billingType: BillingType;
    nextBillingDate?: Date | null;
  } | null;
  asaasCustomer: {
    id: string;
    asaasId: string;
  } | null;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    dueDate: Date;
    paidDate?: Date | null;
  }>;
  totalPending: number;
  totalPaid: number;
  isInGoodStanding: boolean;
}

export class FinancialService {
  private asaasService?: AsaasService;
  private organizationId: string;

  constructor(organizationId: string, asaasApiKey?: string, isSandbox = true) {
    this.organizationId = organizationId;

    if (asaasApiKey) {
      this.asaasService = new AsaasService(asaasApiKey, isSandbox);
    } else {
      // Buscar configurações do banco se não fornecido
      this.initializeAsaasService();
    }
  }

  private async initializeAsaasService() {
    const settings = await prisma.financialSettings.findUnique({
      where: { organizationId: this.organizationId }
    });

    if (settings?.asaasApiKey) {
      this.asaasService = new AsaasService(settings.asaasApiKey, settings.isSandbox);
    }
  }

  // ==========================================
  // SUBSCRIPTION PLANS
  // ==========================================

  async createPlan(data: CreatePlanData) {
    return await prisma.billingPlan.create({
      data: {
        ...data,
        organizationId: this.organizationId
      }
    });
  }

  async updatePlan(planId: string, data: Partial<CreatePlanData>) {
    return await prisma.billingPlan.update({
      where: { id: planId },
      data
    });
  }

  async getPlan(planId: string) {
    return await prisma.billingPlan.findUnique({
      where: { id: planId },
      include: {
        subscriptions: {
          include: {
            student: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  async listPlans(filters?: {
    category?: StudentCategory;
    isActive?: boolean;
  }) {
    return await prisma.billingPlan.findMany({
      where: {
        organizationId: this.organizationId,
        ...filters
      },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==========================================
  // ASAAS CUSTOMER MANAGEMENT
  // ==========================================

  async createOrUpdateAsaasCustomer(studentId: string) {
    // Buscar dados do aluno
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        asaasCustomer: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Se já existe customer, retornar
    if (student.asaasCustomer) {
      return student.asaasCustomer;
    }

    if (!this.asaasService) {
      throw new Error('Asaas service not configured');
    }

    // Criar customer no Asaas
    const asaasCustomerData: AsaasCustomerData = {
      name: `${student.user.firstName} ${student.user.lastName}`,
      cpfCnpj: '', // Documento não está disponível no schema atual
      email: student.user.email,
      phone: student.user.phone || '',
      mobilePhone: student.user.phone || '',
      externalReference: student.id
    };

    const asaasCustomer = await this.asaasService.createCustomer(asaasCustomerData);

    // Salvar no banco
    return await prisma.asaasCustomer.create({
      data: {
        organizationId: this.organizationId,
        studentId: student.id,
        asaasId: asaasCustomer.id,
        name: asaasCustomer.name,
        cpfCnpj: asaasCustomer.cpfCnpj,
        email: asaasCustomer.email,
        externalReference: student.id
      }
    });
  }

  async createOrUpdateAsaasCustomerForResponsible(responsible: any) {
    // Verificar se já existe cliente Asaas para este responsável
    const existingAsaasCustomer = await prisma.asaasCustomer.findFirst({
      where: {
        organizationId: this.organizationId,
        financialResponsibleId: responsible.id
      }
    });

    if (existingAsaasCustomer) {
      return existingAsaasCustomer;
    }

    // Criar dados do customer no Asaas
    const asaasCustomerData = {
      name: responsible.name,
      cpfCnpj: responsible.cpfCnpj,
      email: responsible.email,
      phone: responsible.phone,
      postalCode: responsible.zipCode,
      address: responsible.address,
      addressNumber: responsible.addressNumber,
      complement: responsible.complement,
      province: responsible.neighborhood,
      city: responsible.city,
      state: responsible.state,
      externalReference: responsible.id
    };

    // Criar no Asaas
    const asaasCustomer = await this.asaasService.createCustomer(asaasCustomerData);

    // Salvar no banco
    return await prisma.asaasCustomer.create({
      data: {
        organizationId: this.organizationId,
        financialResponsibleId: responsible.id,
        asaasId: asaasCustomer.id,
        name: asaasCustomer.name,
        cpfCnpj: asaasCustomer.cpfCnpj,
        email: asaasCustomer.email,
        externalReference: responsible.id
      }
    });
  }

  // ==========================================
  // STUDENT SUBSCRIPTIONS
  // ==========================================

  async createSubscription(data: CreateSubscriptionData) {
    const { studentId, planId, startDate = new Date(), customPrice } = data;

    // Buscar estudante com responsável financeiro
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        financialResponsible: true,
        user: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Buscar plano
    const plan = await prisma.billingPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Se houver responsável financeiro, usar ele para cobrança
    // Senão, usar o próprio estudante
    const financialEntityId = student.financialResponsible?.id || studentId;
    const isFinancialResponsible = !!student.financialResponsible;

    // Criar/buscar customer Asaas apropriado APENAS se Asaas estiver configurado
    let asaasCustomer = null;
    if (this.asaasService) {
      try {
        if (isFinancialResponsible) {
          asaasCustomer = await this.createOrUpdateAsaasCustomerForResponsible(student.financialResponsible!);
        } else {
          asaasCustomer = await this.createOrUpdateAsaasCustomer(studentId);
        }
      } catch (error) {
        console.warn('Asaas customer creation failed, continuing without:', error.message);
      }
    }

    // Calcular próxima data de cobrança
    const nextBillingDate = this.asaasService && plan.billingType !== 'LIFETIME'
      ? this.asaasService.calculateDueDate(startDate, plan.billingType as any)
      : this.calculateNextBillingDate(startDate, plan.billingType);

    // Criar subscription no banco
    const subscription = await prisma.studentSubscription.create({
      data: {
        organizationId: this.organizationId,
        studentId,
        planId,
        asaasCustomerId: asaasCustomer?.id || null,
        financialResponsibleId: isFinancialResponsible ? financialEntityId : null,
        currentPrice: customPrice || plan.price,
        billingType: plan.billingType,
        startDate,
        nextBillingDate,
        status: 'ACTIVE' as SubscriptionStatus
      },
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true
      }
    });

    // Criar primeira cobrança APENAS se Asaas estiver configurado
    if (this.asaasService) {
      try {
        await this.createPaymentForSubscription(subscription.id);
      } catch (error) {
        console.warn('Payment creation failed, subscription created without payment:', (error as Error).message);
      }
    }

    // Criar matrículas automáticas nos cursos do plano
    await this.createAutomaticCourseEnrollments(studentId, planId);

    return subscription;
  }

  // Método auxiliar para calcular próxima data de cobrança sem Asaas
  private calculateNextBillingDate(startDate: Date, billingType: any): Date {
    const nextDate = new Date(startDate);

    switch (billingType) {
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'LIFETIME':
        // For lifetime, no next billing
        return new Date(2099, 11, 31); // Far future date
      default:
        nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
    }

    return nextDate;
  }

  // Criar matrículas automáticas nos cursos associados ao plano
  private async createAutomaticCourseEnrollments(studentId: string, planId: string) {
    try {
      // Buscar plano com cursos associados
      const plan = await prisma.billingPlan.findUnique({
        where: { id: planId }
      });

      if (!plan || !plan.features) {
        return;
      }

      // Extrair courseIds do plano
      const features = plan.features as any;
      let courseIds: string[] = [];

      if (features.courseIds && Array.isArray(features.courseIds)) {
        courseIds = features.courseIds;
      } else if (plan.courseId) {
        courseIds = [plan.courseId];
      }

      if (courseIds.length === 0) {
        console.log(`Plano ${planId} não possui cursos associados`);
        return;
      }

      // Buscar dados do aluno
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Criar matrículas para cada curso
      const enrollments = [];
      for (const courseId of courseIds) {
        try {
          // Verificar se já existe matrícula
          const existingEnrollment = await prisma.courseEnrollment.findFirst({
            where: {
              studentId: studentId,
              courseId: courseId,
              status: 'ACTIVE'
            }
          });

          if (existingEnrollment) {
            console.log(`Aluno ${studentId} já está matriculado no curso ${courseId}`);
            continue;
          }

          // Buscar informações do curso
          const course = await prisma.course.findUnique({
            where: { id: courseId }
          });

          if (!course) {
            console.warn(`Curso ${courseId} não encontrado`);
            continue;
          }

          // Calcular data prevista de término
          const expectedEndDate = new Date();
          expectedEndDate.setDate(expectedEndDate.getDate() + (course.duration * 7));

          // Criar matrícula
          const enrollment = await prisma.courseEnrollment.create({
            data: {
              studentId: studentId,
              courseId: courseId,
              status: 'ACTIVE',
              category: student.category,
              gender: student.gender || 'MASCULINO',
              enrolledAt: new Date(),
              expectedEndDate: expectedEndDate
            }
          });

          enrollments.push(enrollment);
          console.log(`✅ Matrícula automática criada: Aluno ${studentId} no curso ${courseId}`);

        } catch (courseError) {
          console.error(`Erro ao criar matrícula no curso ${courseId}:`, courseError);
        }
      }

      console.log(`✅ Criadas ${enrollments.length} matrículas automáticas para o aluno ${studentId}`);
      return enrollments;

    } catch (error) {
      console.error('Erro ao criar matrículas automáticas:', error);
      // Não relançar o erro para não quebrar a criação da subscription
    }
  }

  // Aplicar matrículas automáticas para subscriptions existentes
  async applyRetroactiveCourseEnrollments(studentId?: string) {
    try {
      // Buscar subscriptions ativas
      const subscriptions = await prisma.studentSubscription.findMany({
        where: {
          organizationId: this.organizationId,
          status: 'ACTIVE',
          isActive: true,
          ...(studentId && { studentId })
        },
        include: {
          student: { include: { user: true } },
          plan: true
        }
      });

      console.log(`🔄 Processando ${subscriptions.length} subscriptions ativas para matrículas automáticas`);

      let totalEnrollments = 0;
      for (const subscription of subscriptions) {
        try {
          const enrollments = await this.createAutomaticCourseEnrollments(
            subscription.studentId,
            subscription.planId
          );
          if (enrollments) {
            totalEnrollments += enrollments.length;
          }
        } catch (error) {
          console.error(`Erro ao processar subscription ${subscription.id}:`, error);
        }
      }

      console.log(`✅ Processo concluído: ${totalEnrollments} matrículas criadas`);
      return { processedSubscriptions: subscriptions.length, enrollmentsCreated: totalEnrollments };

    } catch (error) {
      console.error('Erro ao aplicar matrículas retroativas:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string, customPrice?: number) {
    // Get current subscription
    const subscription = await prisma.studentSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true,
        financialResponsible: true
      }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Get new plan
    const newPlan = await prisma.billingPlan.findUnique({
      where: { id: newPlanId }
    });

    if (!newPlan) {
      throw new Error('New plan not found');
    }

    // Calculate next billing date based on new plan
    const nextBillingDate = this.asaasService && newPlan.billingType !== 'LIFETIME'
      ? this.asaasService.calculateDueDate(new Date(), newPlan.billingType as any)
      : this.calculateNextBillingDate(new Date(), newPlan.billingType);

    // Update subscription
    const updatedSubscription = await prisma.studentSubscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        currentPrice: customPrice || newPlan.price,
        billingType: newPlan.billingType,
        nextBillingDate,
        updatedAt: new Date()
      },
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true,
        financialResponsible: true
      }
    });

    return updatedSubscription;
  }

  async updateSubscription(subscriptionId: string, data: {
    startDate?: Date;
    endDate?: Date;
    status?: any;
    customPrice?: number;
  }) {
    // Get current subscription
    const subscription = await prisma.studentSubscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    };

    // If we're changing the status to ACTIVE and it was previously not active,
    // we might need to update the nextBillingDate
    if (data.status === 'ACTIVE' && subscription.status !== 'ACTIVE') {
      const plan = await prisma.billingPlan.findUnique({
        where: { id: subscription.planId }
      });

      if (plan) {
        const nextBillingDate = this.asaasService?.calculateDueDate(new Date(), plan.billingType as any) ||
          this.calculateNextBillingDate(new Date(), plan.billingType);
        updateData.nextBillingDate = nextBillingDate;
      }
    }

    // Update subscription
    const updatedSubscription = await prisma.studentSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true,
        financialResponsible: true
      }
    });

    return updatedSubscription;
  }

  async deleteSubscription(subscriptionId: string) {
    // Get subscription to verify it exists and get related data
    const subscription = await prisma.studentSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        payments: true,
        asaasCustomer: true
      }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if there are pending payments that need to be handled
    const pendingPayments = subscription.payments.filter(
      payment => payment.status === 'PENDING'
    );

    // If using Asaas integration, cancel any pending payments
    if (this.asaasService && subscription.asaasCustomer) {
      for (const payment of pendingPayments) {
        if (payment.asaasPaymentId) {
          try {
            await this.asaasService.cancelPayment(payment.asaasPaymentId);
          } catch (error) {
            console.warn(`Failed to cancel Asaas payment ${payment.asaasPaymentId}:`, error);
          }
        }
      }
    }

    // Update subscription status to CANCELLED instead of hard delete
    // This preserves financial history for auditing purposes
    const cancelledSubscription = await prisma.studentSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true,
        financialResponsible: true
      }
    });

    return cancelledSubscription;
  }

  async getSubscription(subscriptionId: string) {
    return await prisma.studentSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        student: { include: { user: true } },
        plan: true,
        asaasCustomer: true,
        financialResponsible: true
      }
    });
  }

  async createPaymentForSubscription(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId);

    if (!subscription || !subscription.asaasCustomer) {
      throw new Error('Subscription or Asaas customer not found');
    }

    // Skip payment creation for LIFETIME subscriptions
    if (subscription.billingType === 'LIFETIME') {
      return null;
    }

    if (!this.asaasService) {
      throw new Error('Asaas service not configured');
    }

    // Determinar o nome para a descrição da cobrança
    const payerName = subscription.financialResponsible?.name || subscription.student.user.firstName;
    const studentName = subscription.student.user.firstName;

    // Criar cobrança no Asaas
    const dueDate = subscription.nextBillingDate || new Date();
    const asaasPaymentData: AsaasPaymentData = {
      customer: subscription.asaasCustomer.asaasId,
      billingType: 'PIX', // Padrão PIX, pode ser configurável
      value: Number(subscription.currentPrice),
      dueDate: this.asaasService.formatDate(dueDate),
      description: subscription.financialResponsible
        ? `${subscription.plan.name} - Aluno: ${studentName} (Resp: ${payerName})`
        : `${subscription.plan.name} - ${studentName}`,
      externalReference: subscription.id
    };

    const asaasPayment = await this.asaasService.createPayment(asaasPaymentData);

    // Salvar pagamento no banco
    const payment = await prisma.payment.create({
      data: {
        organizationId: this.organizationId,
        studentId: subscription.studentId,
        subscriptionId: subscription.id,
        asaasCustomerId: subscription.asaasCustomer.id,
        financialResponsibleId: subscription.financialResponsibleId,
        amount: subscription.currentPrice,
        description: asaasPaymentData.description!,
        dueDate,
        status: 'PENDING',
        asaasPaymentId: asaasPayment.id,
        asaasChargeUrl: (asaasPayment as any).invoiceUrl || undefined,
        pixCode: (asaasPayment as any).qrCode?.payload || undefined
      }
    });

    // Atualizar próxima data de cobrança da subscription (skip for LIFETIME)
    if (subscription.billingType !== 'LIFETIME') {
      const validBillingType = subscription.billingType as 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      const nextBilling = this.asaasService.calculateDueDate(dueDate, validBillingType);
      await prisma.studentSubscription.update({
        where: { id: subscriptionId },
        data: { nextBillingDate: nextBilling }
      });
    }

    return payment;
  }

  // ==========================================
  // WEBHOOK PROCESSING
  // ==========================================

  async processWebhook(payload: any) {
    if (!this.asaasService) {
      throw new Error('Asaas service not configured');
    }

    const webhookData = this.asaasService.parseWebhookPayload(JSON.stringify(payload));

    switch (webhookData.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(webhookData.payment!);
        break;

      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(webhookData.payment!);
        break;

      default:
        console.log('Webhook event not handled:', webhookData.event);
    }

    return { success: true };
  }

  private async handlePaymentConfirmed(asaasPayment: any) {
    const payment = await prisma.payment.findUnique({
      where: { asaasPaymentId: asaasPayment.id },
      include: { subscription: true }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: this.mapAsaasBillingType(asaasPayment.billingType),
          webhookData: asaasPayment
        }
      });

      // Se tem subscription, criar próxima cobrança
      if (payment.subscription && payment.subscription.isActive) {
        await this.createPaymentForSubscription(payment.subscription.id);
      }
    }
  }

  private async handlePaymentOverdue(asaasPayment: any) {
    await prisma.payment.updateMany({
      where: { asaasPaymentId: asaasPayment.id },
      data: {
        status: 'FAILED',
        webhookData: asaasPayment
      }
    });
  }

  private mapAsaasBillingType(asaasBillingType: string) {
    const mapping: Record<string, any> = {
      'PIX': 'PIX',
      'CREDIT_CARD': 'CREDIT_CARD',
      'DEBIT_CARD': 'DEBIT_CARD',
      'BOLETO': 'BANK_TRANSFER'
    };
    return mapping[asaasBillingType] || 'PIX';
  }

  // ==========================================
  // FINANCIAL REPORTS
  // ==========================================

  async getStudentFinancialSummary(studentId: string): Promise<StudentFinancialSummary> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        subscriptions: {
          where: { isActive: true },
          include: { plan: true }
        },
        asaasCustomer: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const totalPending = student.payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPaid = student.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const activeSubscription = student.subscriptions[0];

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        category: student.category
      },
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        currentPrice: Number(activeSubscription.currentPrice),
        billingType: activeSubscription.billingType,
        nextBillingDate: activeSubscription.nextBillingDate
      } : null,
      asaasCustomer: student.asaasCustomer ? {
        id: student.asaasCustomer.id,
        asaasId: student.asaasCustomer.asaasId
      } : null,
      recentPayments: student.payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        dueDate: p.dueDate,
        paidDate: p.paidDate
      })),
      totalPending,
      totalPaid,
      isInGoodStanding: totalPending === 0
    };
  }

  async getOrganizationFinancialReport(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        organizationId: this.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        student: { include: { user: true } },
        subscription: { include: { plan: true } }
      }
    });

    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOverdue = payments
      .filter(p => p.status === 'FAILED' && p.dueDate < new Date())
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalRevenue,
      totalPending,
      totalOverdue,
      paymentCount: payments.length,
      paidCount: payments.filter(p => p.status === 'PAID').length,
      pendingCount: payments.filter(p => p.status === 'PENDING').length,
      overdueCount: payments.filter(p => p.status === 'FAILED').length,
      payments: payments.map(p => ({
        id: p.id,
        student: `${p.student.user.firstName} ${p.student.user.lastName}`,
        amount: Number(p.amount),
        status: p.status,
        dueDate: p.dueDate,
        paidDate: p.paidDate,
        plan: p.subscription?.plan.name
      }))
    };
  }
}

export default FinancialService;
