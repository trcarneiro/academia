import prisma from '../src/utils/prisma';
import { AsaasService } from '../src/services/asaasService';
import { BillingService } from '../src/services/billingService';
import dayjs from 'dayjs';

const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjExNmE4NDc3LTg3YWQtNGE0ZS1hZDYxLWQxYmM3ZDU5YzlhMTo6JGFhY2hfMjU0NDRmNTYtNzYwZi00ODkyLWJkZTEtZWY4MDdlODFkZmZk';

async function createSpecificUsers() {
    console.log('🧪 Creating/Verifying Specific Users for Asaas Test...\n');

    const asaas = new AsaasService(API_KEY, true);
    const billing = new BillingService(API_KEY, true);

    // Helper to generate valid CPF
    function generateCPF() {
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
        let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
        d1 = 11 - (mod(d1, 11));
        if (d1 >= 10) d1 = 0;
        let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
        d2 = 11 - (mod(d2, 11));
        if (d2 >= 10) d2 = 0;
        return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
    }

    const targets = [
        { name: 'Thiago Roberto Carneiro', cpf: generateCPF(), email: 'thiago.test@academia.com' },
        { name: 'Ana Paula Santos Carneiro', cpf: generateCPF(), email: 'ana.test@academia.com' }
    ];

    try {
        // 1. Get Organization
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No organization found');

        // 2. Ensure "Ilimitado" Plan
        let plan = await prisma.billingPlan.findFirst({ where: { name: 'Ilimitado' } });
        if (!plan) {
            plan = await prisma.billingPlan.create({
                data: {
                    organizationId: org.id,
                    name: 'Ilimitado',
                    description: 'Plano Ilimitado - Importado do Asaas',
                    isActive: true,
                    billingType: 'MONTHLY',
                    price: 199.90,
                    isUnlimitedAccess: true
                }
            });
            console.log('✅ Created Plan: Ilimitado');
        }

        for (const target of targets) {
            console.log(`\n👤 Processing: ${target.name}`);

            // 3. Find or Create User/Student
            let user = await prisma.user.findFirst({
                where: { email: target.email }
            });

            if (!user) {
                const [firstName, ...lastNameParts] = target.name.split(' ');

                user = await prisma.user.create({
                    data: {
                        firstName: firstName,
                        lastName: lastNameParts.join(' '),
                        email: target.email,
                        cpf: target.cpf,
                        phone: '51999999999', // Dummy phone
                        role: 'STUDENT',
                        organizationId: org.id,
                        password: 'defaultPassword123' // Required field
                    }
                });

                await prisma.student.create({
                    data: {
                        userId: user.id,
                        organizationId: org.id,
                        preferredDays: [],
                        preferredTimes: [],
                        specialNeeds: []
                    }
                });
                console.log('   ✅ Created Local User & Student');
            } else {
                console.log('   ✅ User already exists');
                // Update CPF if invalid/test one
                if (user.cpf !== target.cpf) {
                    console.log('   🔄 Updating CPF to valid test CPF...');
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { cpf: target.cpf }
                    });
                }
            }

            const student = await prisma.student.findUnique({ where: { userId: user.id } });
            if (!student) throw new Error(`Student not found for user ${user.id}`);

            // 4. Create/Sync Asaas Customer
            let asaasId = student.asaasCustomerId;
            if (!asaasId) {
                console.log('   Drafting Asaas Customer...');
                const fullName = user.firstName ? `${user.firstName} ${user.lastName}` : target.name;
                console.log(`   Sending to Asaas: Name=${fullName}, CPF=${user.cpf}`);
                const customer = await asaas.createCustomer({
                    name: fullName,
                    email: user.email!,
                    cpfCnpj: user.cpf!
                });
                asaasId = customer.id;

                await prisma.student.update({
                    where: { id: student.id },
                    data: { asaasCustomerId: asaasId }
                });
                console.log(`   ✅ Created Asaas Customer: ${asaasId}`);
            } else {
                console.log(`   ✅ Asaas ID already linked: ${asaasId}`);
            }

            // Sync AsaasCustomer locally (CRITICAL for FK in StudentSubscription)
            console.log('   Syncing AsaasCustomer locally...');
            const localAsaasCustomer = await prisma.asaasCustomer.upsert({
                where: { asaasId: asaasId },
                create: {
                    organizationId: org.id,
                    studentId: student.id,
                    asaasId: asaasId,
                    name: user.firstName + ' ' + user.lastName,
                    email: user.email!,
                    cpfCnpj: user.cpf,
                    mobilePhone: user.phone || '51999999999'
                },
                update: {
                    studentId: student.id
                }
            });
            console.log(`   ✅ Synced local AsaasCustomer: ${localAsaasCustomer.id}`);

            // 5. Create Subscription (if none active)
            const existingSub = await prisma.studentSubscription.findFirst({
                where: { studentId: student.id, isActive: true }
            });

            let subId = existingSub?.id;

            if (!existingSub) {
                const sub = await prisma.studentSubscription.create({
                    data: {
                        organizationId: org.id,
                        studentId: student.id,
                        planId: plan!.id,
                        asaasCustomerId: localAsaasCustomer.id, // Must be UUID
                        currentPrice: '150.00',
                        billingType: 'MONTHLY'
                    }
                });
                console.log('   ✅ Created Subscription data object used.');
                subId = sub.id;
                console.log(`   ✅ Created Subscription: R$ 150,00 (ID: ${sub.id})`);

                // DEBUG: Retrieve and log subscription
                const checkSub = await prisma.studentSubscription.findUnique({
                    where: { id: sub.id }
                });
                console.log('   🔍 Sub Details:', JSON.stringify(checkSub, null, 2));
            } else {
                console.log('   ✅ Active Subscription exists');
            }

            // 6. Generate Charge (Billing Cycle)
            console.log('   💰 triggering charge generation...');
            // Force nextBillingDate to be soon if it's far away, for testing
            await prisma.studentSubscription.update({
                where: { id: subId },
                data: { nextBillingDate: dayjs().add(1, 'day').toDate() }
            });

            // DEBUG: Check Student Asaas ID
            const verifyStudent = await prisma.student.findUnique({ where: { id: student.id } });
            console.log(`   🔍 Student AsaasID for Billing: ${verifyStudent?.asaasCustomerId}`);

            const chargeResult = await billing.generateMonthlyCharges(5);
            if (chargeResult.success > 0) {
                console.log('   ✅ Charge Generated successfully!');
            } else {
                console.log('   ⚠️  No charge generated (maybe already billed?)');
            }
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

createSpecificUsers();
