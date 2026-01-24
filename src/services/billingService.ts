import prisma from '../utils/prisma';
import { AsaasService } from './asaasService';
import dayjs from 'dayjs';

export class BillingService {
    private asaasService: AsaasService;

    constructor(apiKey: string, isSandbox: boolean = true) {
        this.asaasService = new AsaasService(apiKey, isSandbox);
    }

    /**
     * Generate monthly charges for all active subscriptions
     * @param daysAhead - How many days ahead to generate charges (default: 5)
     */
    async generateMonthlyCharges(daysAhead: number = 5): Promise<{
        success: number;
        failed: number;
        errors: Array<{ studentId: string; error: string }>;
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ studentId: string; error: string }>
        };

        try {
            // Find all active subscriptions that need billing
            const targetDate = dayjs().add(daysAhead, 'day').toDate();

            const subscriptions = await prisma.studentSubscription.findMany({
                where: {
                    isActive: true,
                    status: 'ACTIVE',
                    OR: [
                        { nextBillingDate: { lte: targetDate } },
                        { nextBillingDate: null } // First billing
                    ]
                },
                include: {
                    student: {
                        include: {
                            user: true
                        }
                    },
                    plan: true,
                    financialResponsible: true
                }
            });

            console.log(`📊 Found ${subscriptions.length} subscriptions to process`);

            for (const subscription of subscriptions) {
                try {
                    await this.generateChargeForSubscription(subscription);
                    results.success++;
                } catch (error: any) {
                    console.error(`❌ Failed to generate charge for student ${subscription.studentId}:`, error.message);
                    results.failed++;
                    results.errors.push({
                        studentId: subscription.studentId,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error: any) {
            console.error('❌ Error in generateMonthlyCharges:', error);
            throw error;
        }
    }

    /**
     * Generate a single charge for a subscription
     */
    private async generateChargeForSubscription(subscription: any): Promise<void> {
        const { student, plan, currentPrice, billingType, nextBillingDate } = subscription;

        // Determine the customer ID (prefer financial responsible, fallback to student)
        const asaasCustomerId = subscription.financialResponsible?.asaasId || subscription.student.asaasCustomerId;

        console.log(`[DEBUG] Sub ID: ${subscription.id}`);
        console.log(`[DEBUG] Student:`, JSON.stringify(subscription.student, null, 2));
        console.log(`[DEBUG] Resolved AsaasCustomerID: ${asaasCustomerId}`);

        if (!asaasCustomerId) {
            throw new Error(`No Asaas customer ID found for student ${student.id}`);
        }

        // Calculate due date
        const dueDate = nextBillingDate
            ? dayjs(nextBillingDate).format('YYYY-MM-DD')
            : dayjs().add(5, 'day').format('YYYY-MM-DD');

        // Map billing type
        const asaasBillingType = this.mapBillingType(billingType);

        // Create payment in Asaas
        // Create payment in Asaas
        const asaasPayment = await this.asaasService.createPayment({
            customer: asaasCustomerId,
            billingType: asaasBillingType,
            value: Number(currentPrice),
            dueDate: dueDate,
            description: `${plan.name} - ${dayjs().format('MMMM/YYYY')}`,
            externalReference: subscription.id
        });

        // Resolve Local AsaasCustomer UUID
        const localAsaasCustomer = await prisma.asaasCustomer.findUnique({
            where: { asaasId: asaasCustomerId } // asaasCustomerId here is the string "cus_..."
        });

        if (!localAsaasCustomer) {
            throw new Error(`Local AsaasCustomer not found for asaasId: ${asaasCustomerId}`);
        }

        // Save payment record locally
        await prisma.payment.create({
            data: {
                organizationId: subscription.organizationId,
                studentId: student.id,
                subscriptionId: subscription.id,
                asaasCustomerId: localAsaasCustomer.id, // Use UUID

                financialResponsibleId: subscription.financialResponsibleId,
                amount: currentPrice,
                description: `${plan.name} - ${dayjs().format('MMMM/YYYY')}`,
                dueDate: new Date(dueDate),
                status: 'PENDING',
                asaasPaymentId: asaasPayment.id,
                asaasInvoiceUrl: asaasPayment.invoiceUrl,
                asaasChargeUrl: asaasPayment.bankSlipUrl || asaasPayment.invoiceUrl
            }
        });

        // Update subscription's next billing date
        const nextBilling = dayjs(dueDate).add(1, 'month').toDate();
        await prisma.studentSubscription.update({
            where: { id: subscription.id },
            data: { nextBillingDate: nextBilling }
        });

        console.log(`✅ Generated charge for student ${student.user.name} - R$ ${currentPrice}`);
    }

    /**
     * Map internal billing type to Asaas format
     */
    private mapBillingType(billingType: string): 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'BANK_TRANSFER' {
        const mapping: Record<string, any> = {
            'MONTHLY': 'BOLETO',
            'BOLETO': 'BOLETO',
            'PIX': 'PIX',
            'CREDIT_CARD': 'CREDIT_CARD',
            'BANK_TRANSFER': 'BANK_TRANSFER'
        };

        return mapping[billingType] || 'BOLETO';
    }

    /**
     * Process webhook from Asaas
     */
    async processWebhook(payload: any): Promise<void> {
        const { event, payment } = payload;

        if (!payment?.id) {
            throw new Error('Invalid webhook payload');
        }

        // Find local payment record
        const localPayment = await prisma.payment.findUnique({
            where: { asaasPaymentId: payment.id }
        });

        if (!localPayment) {
            console.warn(`⚠️  Payment ${payment.id} not found in local database`);
            return;
        }

        // Update payment status based on event
        let newStatus: string;
        switch (event) {
            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_CONFIRMED':
                newStatus = 'PAID';
                break;
            case 'PAYMENT_OVERDUE':
                newStatus = 'OVERDUE';
                break;
            case 'PAYMENT_DELETED':
                newStatus = 'CANCELLED';
                break;
            default:
                newStatus = localPayment.status;
        }

        await prisma.payment.update({
            where: { id: localPayment.id },
            data: {
                status: newStatus as any,
                paidDate: event === 'PAYMENT_RECEIVED' ? new Date() : localPayment.paidDate,
                webhookData: payload
            }
        });

        console.log(`✅ Updated payment ${payment.id} to status ${newStatus}`);
    }
}

export default BillingService;
