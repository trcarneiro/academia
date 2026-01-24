import { prisma } from '../src/utils/prisma';
import { AsaasService } from '../src/services/asaasService';
import { BillingService } from '../src/services/billingService';
import dayjs from 'dayjs';

const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjExNmE4NDc3LTg3YWQtNGE0ZS1hZDYxLWQxYmM3ZDU5YzlhMTo6JGFhY2hfMjU0NDRmNTYtNzYwZi00ODkyLWJkZTEtZWY4MDdlODFkZmZk';

async function testAsaasEndToEnd() {
    console.log('🧪 Starting Asaas End-to-End Test...\n');

    const asaas = new AsaasService(API_KEY, true);
    const billing = new BillingService(API_KEY, true);

    try {
        // Step 1: Get or create organization
        console.log('1️⃣  Checking organization...');
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: 'Academia Teste',
                    slug: 'academia-teste'
                }
            });
        }
        console.log(`   ✅ Organization: ${org.name}\n`);

        // Step 2: Create "Ilimitado" plan if doesn't exist
        console.log('2️⃣  Checking "Ilimitado" plan...');
        let plan = await prisma.billingPlan.findFirst({
            where: { name: 'Ilimitado' }
        });

        if (!plan) {
            plan = await prisma.billingPlan.create({
                data: {
                    organizationId: org.id,
                    name: 'Ilimitado',
                    description: 'Plano Ilimitado - Teste Asaas',
                    price: 199.90,
                    billingCycle: 'MONTHLY',
                    isActive: true,
                    classLimit: 999,
                    allowFreeze: true
                }
            });
            console.log(`   ✅ Created plan: ${plan.name}`);
        } else {
            console.log(`   ✅ Plan exists: ${plan.name}`);
        }
        console.log('');

        // Step 3: Create test student
        console.log('3️⃣  Creating test student...');
        const testEmail = `teste.asaas.${Date.now()}@academia.com`;
        const testCPF = '12345678901';

        const user = await prisma.user.create({
            data: {
                name: 'João Teste Asaas',
                email: testEmail,
                phone: '51999999999',
                cpf: testCPF,
                role: 'STUDENT',
                organizationId: org.id
            }
        });

        const student = await prisma.student.create({
            data: {
                userId: user.id,
                organizationId: org.id,
                preferredDays: [],
                preferredTimes: [],
                specialNeeds: []
            }
        });

        console.log(`   ✅ Student created: ${user.name} (${student.id})\n`);

        // Step 4: Create customer in Asaas
        console.log('4️⃣  Creating customer in Asaas...');
        const asaasCustomer = await asaas.createCustomer({
            name: user.name,
            cpfCnpj: testCPF,
            email: testEmail,
            phone: user.phone || '',
            mobilePhone: user.phone || ''
        });

        console.log(`   ✅ Asaas Customer created: ${asaasCustomer.id}\n`);

        // Update student with Asaas customer ID
        await prisma.student.update({
            where: { id: student.id },
            data: { asaasCustomerId: asaasCustomer.id }
        });

        // Step 5: Create subscription
        console.log('5️⃣  Creating subscription...');
        const subscription = await prisma.studentSubscription.create({
            data: {
                organizationId: org.id,
                studentId: student.id,
                planId: plan.id,
                asaasCustomerId: asaasCustomer.id,
                currentPrice: 149.90, // Custom price (different from plan)
                billingType: 'BOLETO',
                status: 'ACTIVE',
                nextBillingDate: dayjs().add(3, 'day').toDate(), // Due in 3 days
                isActive: true,
                autoRenew: true
            }
        });

        console.log(`   ✅ Subscription created: R$ ${subscription.currentPrice}\n`);

        // Step 6: Generate charge
        console.log('6️⃣  Generating charge in Asaas...');
        const results = await billing.generateMonthlyCharges(5); // Look 5 days ahead

        if (results.success > 0) {
            console.log(`   ✅ Charge generated successfully!\n`);
        } else {
            console.log(`   ❌ Failed to generate charge:`);
            results.errors.forEach(err => console.log(`      - ${err.error}`));
            console.log('');
        }

        // Step 7: Verify charge in database
        console.log('7️⃣  Verifying charge in database...');
        const payment = await prisma.payment.findFirst({
            where: { subscriptionId: subscription.id },
            orderBy: { createdAt: 'desc' }
        });

        if (payment) {
            console.log(`   ✅ Payment record found:`);
            console.log(`      ID: ${payment.id}`);
            console.log(`      Amount: R$ ${payment.amount}`);
            console.log(`      Due Date: ${dayjs(payment.dueDate).format('DD/MM/YYYY')}`);
            console.log(`      Status: ${payment.status}`);
            console.log(`      Asaas Payment ID: ${payment.asaasPaymentId}`);
            console.log(`      Invoice URL: ${payment.asaasInvoiceUrl || 'N/A'}\n`);
        } else {
            console.log(`   ❌ No payment record found\n`);
        }

        // Step 8: Fetch from Asaas to confirm
        console.log('8️⃣  Fetching charge from Asaas API...');
        if (payment?.asaasPaymentId) {
            const asaasPayment = await asaas.getPayment(payment.asaasPaymentId);
            console.log(`   ✅ Asaas Payment confirmed:`);
            console.log(`      ID: ${asaasPayment.id}`);
            console.log(`      Value: R$ ${asaasPayment.value}`);
            console.log(`      Status: ${asaasPayment.status}`);
            console.log(`      Due Date: ${asaasPayment.dueDate}`);
            console.log(`      Billing Type: ${asaasPayment.billingType}\n`);
        }

        console.log('✅ End-to-End Test Complete!\n');
        console.log('📊 Summary:');
        console.log(`   Student: ${user.name}`);
        console.log(`   Asaas Customer: ${asaasCustomer.id}`);
        console.log(`   Subscription: R$ ${subscription.currentPrice}/mês`);
        console.log(`   Payment Generated: ${payment ? 'Yes' : 'No'}`);
        console.log(`   Asaas Payment ID: ${payment?.asaasPaymentId || 'N/A'}`);
        console.log('\n🎯 Next: Check Asaas Sandbox dashboard to see the charge!');
        console.log('   URL: https://sandbox.asaas.com/cobrancas');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        throw error;
    }
}

testAsaasEndToEnd();
