import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { getCreditsSummary, getStudentCredits, useCredits, renewCreditsManual, refundCredits, cancelAutoRenewal } from '@/services/creditService';
import { ResponseHelper } from '@/utils/response';
import { z } from 'zod';

export class CreditController {

    static async getSummary(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { organizationId } = request as any;
            const { studentId } = request.params as { studentId: string };

            if (!studentId) {
                return ResponseHelper.error(reply, 'Student ID required', 400);
            }

            const summary = await getCreditsSummary(studentId, organizationId);
            return ResponseHelper.success(reply, summary);
        } catch (error) {
            return ResponseHelper.error(reply, 'Error fetching credit summary', 500);
        }
    }

    static async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { organizationId } = request as any;
            const { studentId } = request.params as { studentId: string };

            if (!studentId) {
                return ResponseHelper.error(reply, 'Student ID required', 400);
            }

            const credits = await getStudentCredits(studentId, organizationId);
            return ResponseHelper.success(reply, credits);
        } catch (error) {
            return ResponseHelper.error(reply, 'Error fetching credits', 500);
        }
    }

    static async generateCharge(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { organizationId } = request as any;
            const { studentId } = request.body as { studentId: string };

            if (!studentId) {
                return ResponseHelper.error(reply, 'Student ID required', 400);
            }

            // 1. Find Student
            const student = await prisma.student.findUnique({
                where: { id: studentId, organizationId },
                include: { financialResponsible: true }
            });

            if (!student) {
                return ResponseHelper.error(reply, 'Student not found', 404);
            }

            // 2. Resolve Automation Plan (Last plan or Default)
            const lastCredit = await prisma.studentCredit.findFirst({
                where: { studentId, organizationId },
                orderBy: { createdAt: 'desc' },
                include: { plan: true }
            });

            let plan = lastCredit?.plan;
            let price = Number(plan?.price || 0);
            let planName = plan?.name || 'Recarga de Créditos';

            if (!plan) {
                const defaultPlan = await prisma.billingPlan.findFirst({
                    where: { organizationId, billingType: 'CREDITS', isActive: true }
                });
                if (defaultPlan) {
                    plan = defaultPlan;
                    price = Number(defaultPlan.price);
                    planName = defaultPlan.name;
                }
            }

            if (price <= 0) {
                return ResponseHelper.error(reply, 'No valid pricing plan found for auto-charge', 400);
            }

            const apiKey = process.env.ASAAS_API_KEY_PROD || process.env.ASAAS_API_KEY || '';
            if (!apiKey) {
                return ResponseHelper.error(reply, 'Payment gateway not configured', 503);
            }

            const isSandbox = process.env.NODE_ENV !== 'production';
            const asaasService = new (require('@/services/asaasService').AsaasService)(apiKey, isSandbox);

            let asaasCustomerId = student.asaasCustomerId;
            if (!asaasCustomerId && student.financialResponsible?.asaasId) {
                asaasCustomerId = student.financialResponsible.asaasId;
            }

            if (!asaasCustomerId) {
                // Try to create or find customer? For now, assume failure if not synced.
                return ResponseHelper.error(reply, 'Student not synced with Payment Gateway', 422);
            }

            // 3. Check for Pending Charge (Prevent Duplicates for today)
            // Implementation: List payments filters
            // For now, simpler: Just create new one. User requested "check if exists".
            // We can query our database if we sync payments, or query Asaas.
            // Asaas query:
            const pendingPayments = await asaasService.listPayments({
                customer: asaasCustomerId,
                status: 'PENDING',
                limit: 5
            });

            // Filter for same value/description created today?
            const today = new Date().toISOString().split('T')[0];
            const existingCharge = pendingPayments?.data?.find((p: any) =>
                p.value === price &&
                p.dueDate >= today &&
                !p.deleted
            );

            if (existingCharge) {
                return ResponseHelper.success(reply, {
                    message: 'Cobrança pendente encontrada.',
                    payment: {
                        id: existingCharge.id,
                        invoiceUrl: existingCharge.invoiceUrl,
                        pixCode: existingCharge.pixQrCode || null, // Might need extra fetch
                        value: existingCharge.value,
                        description: existingCharge.description
                    },
                    isNew: false
                });
            }

            // 4. Create New Charge
            const payment = await asaasService.createPayment({
                customer: asaasCustomerId,
                billingType: 'PIX',
                value: price,
                dueDate: today,
                description: `Recarga Manual: ${planName} (Solicitado pelo Check-in)`,
                externalReference: `MANUAL_RENEW_${studentId}_${Date.now()}`
            });

            // Fetch PIX Code if not returned immediately (usually is)
            let pixCode = payment.pixQRCode || null;
            if (!pixCode && payment.id) {
                try {
                    const pixInfo = await asaasService.getPixQrCode(payment.id);
                    pixCode = pixInfo?.encodedImage || pixInfo?.payload;
                } catch (_) { }
            }

            return ResponseHelper.success(reply, {
                message: 'Nova cobrança gerada com sucesso.',
                payment: {
                    id: payment.id,
                    invoiceUrl: payment.invoiceUrl,
                    pixCode: pixCode,
                    value: price,
                    description: `Recarga: ${planName}`
                },
                isNew: true
            });

        } catch (error: any) {
            logger.error('Error generating manual charge:', error);
            return ResponseHelper.error(reply, error.message || 'Error generating charge', 500);
        }
    }
}
