import prisma from '../../src/utils/prisma';
import { CRMService } from '../../src/services/crmService';
import { BillingService } from '../../src/services/billingService';
import { AsaasService } from '../../src/services/asaasService';
import dayjs from 'dayjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load env if not loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function generateCPF(): string {
    const rnd = (n: number) => Math.round(Math.random() * n);
    const mod = (dividend: number, divisor: number) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
    const n1 = rnd(9);
    const n2 = rnd(9);
    const n3 = rnd(9);
    const n4 = rnd(9);
    const n5 = rnd(9);
    const n6 = rnd(9);
    const n7 = rnd(9);
    const n8 = rnd(9);
    const n9 = rnd(9);
    const d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    const d1rest = mod(d1, 11);
    const dv1 = d1rest < 2 ? 0 : 11 - d1rest;
    const d2 = dv1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    const d2rest = mod(d2, 11);
    const dv2 = d2rest < 2 ? 0 : 11 - d2rest;
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${dv1}${dv2}`;
}

async function run() {
    const sandboxKey = process.env.ASAAS_API_KEY_SANDBOX || process.env.ASAAS_API_KEY;

    if (!sandboxKey || !sandboxKey.includes('aact_hmlg')) {
        console.error('❌ ERRO: Chave de Sandbox não detectada. Verifique o .env');
        console.log('Chave atual:', sandboxKey?.substring(0, 15) + '...');
        return;
    }

    console.log('🚀 Iniciando Teste Completo (Sandbox)');
    console.log('🔑 Usando chave:', sandboxKey.substring(0, 20) + '...');

    const timestamp = Date.now();
    const mockEmail = `sandbox.user.${timestamp}@test.com`;
    let organizationId: string;

    try {
        // 1. Get Organization (or create one if needed)
        const org = await prisma.organization.findFirst() || await prisma.organization.create({
            data: {
                name: 'Krav Maga Sandbox',
                slug: `sandbox-${timestamp}`,
                primaryColor: '#000000',
                secondaryColor: '#ffffff'
            }
        });
        organizationId = org.id;

        console.log(`🏢 Organização: ${org.name} (${org.id})`);

        // 2. Create Lead
        console.log('1️⃣ Criando Lead...');
        const lead = await prisma.lead.create({
            data: {
                name: `Sandbox User ${timestamp}`,
                email: mockEmail,
                phone: '11999998888',
                organizationId,
                stage: 'NEW',
                tags: []
            }
        });
        console.log(`✅ Lead criado: ${lead.id}`);

        // 3. Convert to Student
        console.log('2️⃣ Convertendo para Aluno...');

        // Create User first
        const user = await prisma.user.create({
            data: {
                firstName: 'Sandbox',
                lastName: `User ${timestamp}`,
                email: mockEmail,
                password: 'password123',
                organizationId,
                role: 'STUDENT',
                isActive: true
            }
        });

        // Create Student
        const student = await prisma.student.create({
            data: {
                userId: user.id,
                organizationId,
                specialNeeds: [],
                preferredDays: [],
                preferredTimes: []
            }
        });
        console.log(`✅ Aluno criado: ${student.id}`);

        // Update Lead
        await prisma.lead.update({
            where: { id: lead.id },
            data: {
                stage: 'CONVERTED',
                convertedStudentId: student.id,
                enrolledAt: new Date()
            }
        });

        // 4. Create Subscription (BillingPlan)
        console.log('3️⃣ Criando Assinatura...');
        const plan = await prisma.billingPlan.findFirst({ where: { organizationId } })
            || await prisma.billingPlan.create({
                data: {
                    name: 'Plano Sandbox Teste',
                    price: 50.00,
                    billingType: 'MONTHLY',
                    organizationId,
                    duration: 1
                }
            });

        const subscription = await prisma.studentSubscription.create({
            data: {
                studentId: student.id,
                planId: plan.id,
                organizationId,
                currentPrice: plan.price,
                billingType: plan.billingType,
                startDate: new Date(),
                nextBillingDate: new Date(),
                status: 'ACTIVE',
                isActive: true
            },
            include: {
                student: { include: { user: true } },
                plan: true,
                financialResponsible: true
            }
        });
        console.log(`✅ Assinatura criada: ${subscription.id}`);

        // 5. Generate Charge in Asaas
        console.log('4️⃣ Gerando Cobrança no Asaas...');

        const asaasService = new AsaasService(sandboxKey, true);

        const validCPF = generateCPF();
        const asaasCustomer = await asaasService.createCustomer({
            name: `Sandbox User ${timestamp}`,
            email: mockEmail,
            cpfCnpj: validCPF,
        });

        console.log(`✅ Customer Asaas Criado: ${asaasCustomer.id}`);

        // Helper to create AsaasCustomer relation
        await prisma.asaasCustomer.create({
            data: {
                asaasId: asaasCustomer.id,
                studentId: student.id,
                organizationId,
                name: `Sandbox User ${timestamp}`,
                cpfCnpj: validCPF,
                email: mockEmail
            }
        });

        // UPDATE STUDENT WITH ASAAS ID (Critical for BillingService)
        await prisma.student.update({
            where: { id: student.id },
            data: { asaasCustomerId: asaasCustomer.id }
        });

        // VERIFY UPDATE
        const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
        console.log('🔍 Student updated locally:', updatedStudent?.asaasCustomerId);
        if (updatedStudent?.asaasCustomerId !== asaasCustomer.id) {
            console.error('❌ FATAL: Student local update failed!');
        }

        // Trigger billing
        const billingService = new BillingService(sandboxKey, true);
        const results = await billingService.generateMonthlyCharges(5);

        console.log('\n--- RESULTADO DA COBRANÇA ---');
        console.log(`Sucesso: ${results.success}`);
        console.log(`Falhas: ${results.failed}`);

        if (results.errors.length > 0) {
            console.log('Erros:', results.errors);
        } else {
            console.log('🎉 Cobrança gerada com sucesso no Asaas Sandbox!');
        }

    } catch (e: any) {
        console.error('\n❌ ERRO FATAL:', e.message);
        // Log more details if axios error
        if (e.response) {
            console.error('Dados do erro API:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

run();
