
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
});

async function deepAudit() {
    try {
        console.log('--- Deep Audit of All Entities ---');

        // 1. Organizations
        const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
        console.log('\n--- Organizations ---');
        orgs.forEach(o => console.log(`${o.id} | ${o.name}`));

        // 2. Courses (All)
        const courses = await prisma.course.findMany({
            select: { id: true, name: true, organizationId: true, isActive: true }
        });
        console.log(`\n--- Courses (Total: ${courses.length}) ---`);
        courses.forEach(c => {
            const orgName = orgs.find(o => o.id === c.organizationId)?.name || 'Unknown';
            console.log(`[${orgName}] ${c.name} (${c.id}) - Active: ${c.isActive}`);
        });

        // 3. Billing Plans (All)
        const plans = await prisma.billingPlan.findMany({
            select: { id: true, name: true, organizationId: true, isActive: true }
        });
        console.log(`\n--- Billing Plans (Total: ${plans.length}) ---`);
        plans.forEach(p => {
            const orgName = orgs.find(o => o.id === p.organizationId)?.name || 'Unknown';
            console.log(`[${orgName}] ${p.name} (${p.id})`);
        });

        // 4. Students with Asaas ID (Potential matches)
        const students = await prisma.student.findMany({
            where: { asaasCustomerId: { not: null } },
            select: { id: true, asaasCustomerId: true, organizationId: true, user: { select: { firstName: true } } }
        });
        console.log(`\n--- Students with Asaas ID (Total: ${students.length}) ---`);
        students.forEach(s => {
            const orgName = orgs.find(o => o.id === s.organizationId)?.name || 'Unknown';
            console.log(`[${orgName}] ${s.user.firstName} - Asaas: ${s.asaasCustomerId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deepAudit();
