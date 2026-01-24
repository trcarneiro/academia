
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function checkPlans() {
    try {
        const plans = await prisma.billingPlan.findMany({
            select: { id: true, name: true, organizationId: true }
        });

        console.log('\n--- Billing Plans ---');
        plans.forEach(p => console.log(`${p.name} - Org: ${p.organizationId}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPlans();
