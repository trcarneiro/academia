
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

// Configuration
const CONFIG = {
    asaasApiKey: process.env.ASAAS_API_KEY,
    asaasBaseUrl: process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3',
    organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472', // Smart Defence Organization
    defaultCourseId: 'aa35e8eb-2aa2-41e5-bb01-f1f9ca0ddb95', // Krav Maga - Iniciante (Migrated)
    defaultClassId: '2e47c8b1-5d4c-4a9b-8f3e-1b2c3d4e5f60', // (Keeping existing)
    defaultPlanId: '62bc6423-7de5-49f2-8ce1-1545dc078dd9', // Plano Padrão (Smart Defence)
    dryRun: process.argv.includes('--dry-run'),
    limit: parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '100'),
};

interface AsaasCustomer {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    mobilePhone: string;
    dateCreated: string;
    // ... other fields
}

interface AsaasSubscription {
    id: string;
    customer: string;
    value: number;
    nextDueDate: string;
    cycle: string; // MONTHLY, WEEKLY, etc.
    status: string; // ACTIVE, EXPIRED
    billingType: string;
    description: string;
    dateCreated: string;
    planId?: string;
}

// Helper to fetch from Asaas
async function fetchAsaas(endpoint: string) {
    const url = `${CONFIG.asaasBaseUrl}${endpoint}`;
    console.log(`[Fetch] Requesting ${url}...`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'access_token': CONFIG.asaasApiKey || '',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Asaas API Error ${response.status}: ${txt}`);
        }
        console.log(`[Fetch] Success`);
        return response.json();
    } catch (e) {
        console.error(`[Fetch] Error fetching ${url}:`, e);
        throw e;
    }
}

async function getAsaasCustomers(limit: number, offset: number) {
    return fetchAsaas(`/customers?limit=${limit}&offset=${offset}`);
}

async function getAsaasSubscriptions(customerId: string) {
    return fetchAsaas(`/subscriptions?customer=${customerId}&status=ACTIVE`);
}

async function getOrCreateBillingPlan(subscription: AsaasSubscription) {
    // Strategy: Find any plan with similar price, or the "Plano Padrão" default 
    const defaultPlanId = CONFIG.defaultPlanId;

    const plan = await prisma.billingPlan.findFirst({
        where: { id: defaultPlanId }
    });

    if (plan) return plan.id;

    // If not found, find ANY active plan
    const anyPlan = await prisma.billingPlan.findFirst({
        where: { organizationId: CONFIG.organizationId, isActive: true }
    });

    if (anyPlan) return anyPlan.id;

    throw new Error("No BillingPlan found in database.");
}

async function syncCustomer(asaasCustomer: AsaasCustomer) {
    console.log(`\n👤 Processing: ${asaasCustomer.name} (${asaasCustomer.email})`);

    // 1. Check/Create User
    let user = await prisma.user.findFirst({
        where: {
            organizationId: CONFIG.organizationId,
            OR: [
                { email: asaasCustomer.email },
                { cpf: asaasCustomer.cpfCnpj }
            ]
        }
    });

    if (CONFIG.dryRun) {
        console.log(`   [DryRun] Would ${user ? 'update' : 'create'} User and Student`);
    } else {
        if (!user) {
            // Create User
            const names = asaasCustomer.name.trim().split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ');

            user = await prisma.user.create({
                data: {
                    organizationId: CONFIG.organizationId,
                    email: asaasCustomer.email || `asaas_${asaasCustomer.id}@temp.com`,
                    firstName,
                    lastName,
                    cpf: asaasCustomer.cpfCnpj,
                    phone: asaasCustomer.mobilePhone || asaasCustomer.phone,
                    password: '$2a$12$G7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1', // Placeholder hash
                    role: 'STUDENT',
                    isActive: true
                }
            });
            console.log(`   ✅ User created: ${user.id}`);
        } else {
            console.log(`   ℹ️ User already exists: ${user.id}`);
        }
    }

    // 2. Check/Create Student
    if (!CONFIG.dryRun && user) {
        let student = await prisma.student.findUnique({
            where: { userId: user.id }
        });

        if (!student) {
            student = await prisma.student.create({
                data: {
                    organizationId: CONFIG.organizationId,
                    userId: user.id,
                    asaasCustomerId: asaasCustomer.id,
                    category: 'ADULT',
                    gender: 'MASCULINO',
                    enrollmentDate: new Date(asaasCustomer.dateCreated),
                    isActive: true
                }
            });
            console.log(`   ✅ Student profile created: ${student.id}`);
        } else {
            // Update Asaas ID if missing
            if (student.asaasCustomerId !== asaasCustomer.id) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { asaasCustomerId: asaasCustomer.id }
                });
                console.log(`   Updated Asaas ID for student`);
            }
        }

        // 3. Sync Subscriptions (Plans)
        const subData = await getAsaasSubscriptions(asaasCustomer.id);
        const activeSubs = subData.data as AsaasSubscription[];

        if (activeSubs.length > 0) {
            console.log(`   💳 Found ${activeSubs.length} active subscriptions in Asaas`);

            for (const asaasSub of activeSubs) {
                const planId = await getOrCreateBillingPlan(asaasSub);

                // Check if local subscription exists
                const localSub = await prisma.studentSubscription.findFirst({
                    where: {
                        studentId: student.id,
                        asaasSubscriptionId: asaasSub.id
                    }
                });

                if (!localSub) {
                    await prisma.studentSubscription.create({
                        data: {
                            organizationId: CONFIG.organizationId,
                            studentId: student.id,
                            planId: planId,
                            asaasCustomerId: asaasCustomer.id,
                            asaasSubscriptionId: asaasSub.id,
                            status: 'ACTIVE',
                            billingType: 'MONTHLY', // Map correctly if needed
                            currentPrice: asaasSub.value,
                            startDate: new Date(asaasSub.dateCreated),
                            nextBillingDate: new Date(asaasSub.nextDueDate),
                            isActive: true,
                            autoRenew: true
                        }
                    });
                    console.log(`   ✨ Created Local Subscription for Asaas Sub ${asaasSub.id} - Value: ${asaasSub.value}`);
                } else {
                    console.log(`   ℹ️ Subscription ${asaasSub.id} already synced.`);
                }
            }
        } else {
            console.log(`   ⚠️ No active subscriptions found in Asaas.`);
        }

        // 4. Enroll in Default Course if not enrolled
        const enrollment = await prisma.studentCourse.findFirst({
            where: {
                studentId: student.id,
                courseId: CONFIG.defaultCourseId
            }
        });

        if (!enrollment) {
            await prisma.studentCourse.create({
                data: {
                    studentId: student.id,
                    courseId: CONFIG.defaultCourseId,
                    status: 'ACTIVE',
                    enrollmentDate: new Date()
                }
            });
            console.log(`   🥋 Enrolled in Krav Maga Course`);
        }
    }
}

async function main() {
    console.log('🚀 Starting Complete Asaas Sync...');
    console.log(`config: ${JSON.stringify(CONFIG, null, 2)}`);

    if (!CONFIG.asaasApiKey) {
        throw new Error("Missing ASAAS_API_KEY");
    }

    let offset = 0;
    let totalProcessed = 0;

    while (totalProcessed < CONFIG.limit) {
        const data = await getAsaasCustomers(10, offset); // Batch size 10
        const customers = data.data as AsaasCustomer[];

        if (customers.length === 0) break;

        for (const customer of customers) {
            if (totalProcessed >= CONFIG.limit) break;
            try {
                await syncCustomer(customer);
            } catch (err) {
                console.error(`Error syncing customer ${customer.email}:`, err);
            }
            totalProcessed++;
        }

        offset += 10;
        if (!data.hasMore) break;
    }

    console.log(`\n🎉 Sync Completed. Processed: ${totalProcessed}`);
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
