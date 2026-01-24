import { prisma } from '../src/utils/prisma';
import { AsaasService } from '../src/services/asaasService';
import dayjs from 'dayjs';

// Configuration
const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjExNmE4NDc3LTg3YWQtNGE0ZS1hZDYxLWQxYmM3ZDU5YzlhMTo6JGFhY2hfMjU0NDRmNTYtNzYwZi00ODkyLWJkZTEtZWY4MDdlODFkZmZk';
const UNLIMITED_PLAN_NAME = 'Ilimitado';

async function importFromAsaas() {
    console.log('🚀 Starting Asaas Sandbox Import...\n');

    const asaas = new AsaasService(API_KEY, true);

    try {
        // Step 1: Ensure "Ilimitado" plan exists
        console.log('1️⃣  Checking for "Ilimitado" plan...');
        let unlimitedPlan = await prisma.billingPlan.findFirst({
            where: { name: UNLIMITED_PLAN_NAME }
        });

        if (!unlimitedPlan) {
            console.log('   Creating "Ilimitado" plan...');
            const org = await prisma.organization.findFirst();
            if (!org) throw new Error('No organization found');

            unlimitedPlan = await prisma.billingPlan.create({
                data: {
                    organizationId: org.id,
                    name: UNLIMITED_PLAN_NAME,
                    description: 'Plano Ilimitado - Importado do Asaas',
                    price: 0, // Will be overridden per student
                    billingCycle: 'MONTHLY',
                    isActive: true,
                    classLimit: 999,
                    allowFreeze: true
                }
            });
            console.log(`   ✅ Created plan: ${unlimitedPlan.id}`);
        } else {
            console.log(`   ✅ Plan exists: ${unlimitedPlan.id}`);
        }

        // Step 2: Fetch Asaas subscriptions
        console.log('\n2️⃣  Fetching Asaas subscriptions...');
        const subscriptions = await asaas.listSubscriptions({ limit: 100 });
        console.log(`   Found ${subscriptions.totalCount} subscriptions`);

        if (subscriptions.data.length === 0) {
            console.log('   ℹ️  No subscriptions to import. Exiting.');
            return;
        }

        // Step 3: Process each subscription
        console.log('\n3️⃣  Processing subscriptions...');
        let imported = 0;
        let skipped = 0;

        for (const asaasSub of subscriptions.data) {
            try {
                // Fetch customer details
                const customer = await asaas.getCustomer(asaasSub.customer);

                console.log(`\n   Processing: ${customer.name} (${customer.email})`);

                // Find or create student
                let student = await prisma.student.findFirst({
                    where: {
                        OR: [
                            { user: { email: customer.email } },
                            { asaasCustomerId: customer.id }
                        ]
                    },
                    include: { user: true }
                });

                if (!student) {
                    console.log('      Creating new student...');
                    const org = await prisma.organization.findFirst();
                    if (!org) throw new Error('No organization found');

                    // Create user first
                    const user = await prisma.user.create({
                        data: {
                            name: customer.name,
                            email: customer.email,
                            phone: customer.mobilePhone || customer.phone,
                            cpf: customer.cpfCnpj,
                            role: 'STUDENT',
                            organizationId: org.id
                        }
                    });

                    // Create student
                    student = await prisma.student.create({
                        data: {
                            userId: user.id,
                            organizationId: org.id,
                            asaasCustomerId: customer.id,
                            preferredDays: [],
                            preferredTimes: [],
                            specialNeeds: []
                        },
                        include: { user: true }
                    });
                    console.log(`      ✅ Created student: ${student.id}`);
                } else {
                    console.log(`      ✅ Found existing student: ${student.id}`);
                    // Update asaasCustomerId if missing
                    if (!student.asaasCustomerId) {
                        await prisma.student.update({
                            where: { id: student.id },
                            data: { asaasCustomerId: customer.id }
                        });
                    }
                }

                // Check if subscription already imported
                const existingSub = await prisma.studentSubscription.findFirst({
                    where: { asaasSubscriptionId: asaasSub.id }
                });

                if (existingSub) {
                    console.log(`      ⏭️  Subscription already imported, skipping`);
                    skipped++;
                    continue;
                }

                // Create local subscription
                await prisma.studentSubscription.create({
                    data: {
                        organizationId: student.organizationId,
                        studentId: student.id,
                        planId: unlimitedPlan.id,
                        asaasCustomerId: customer.id,
                        asaasSubscriptionId: asaasSub.id,
                        currentPrice: asaasSub.value,
                        billingType: asaasSub.billingType || 'MONTHLY',
                        status: asaasSub.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                        nextBillingDate: asaasSub.nextDueDate ? new Date(asaasSub.nextDueDate) : null,
                        isActive: asaasSub.status === 'ACTIVE',
                        autoRenew: true
                    }
                });

                console.log(`      ✅ Imported subscription - R$ ${asaasSub.value}`);
                imported++;

            } catch (error: any) {
                console.error(`      ❌ Error processing subscription:`, error.message);
                skipped++;
            }
        }

        console.log(`\n✅ Import Complete!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped: ${skipped}`);

    } catch (error: any) {
        console.error('\n❌ Import failed:', error.message);
        throw error;
    }
}

importFromAsaas();
