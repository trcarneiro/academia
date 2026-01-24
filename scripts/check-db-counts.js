
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function checkData() {
    try {
        const targetOrgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

        console.log(`Checking for Target Org: ${targetOrgId}`);

        const orgCount = await prisma.organization.count();
        const userCount = await prisma.user.count();
        const studentCount = await prisma.student.count();
        const courseCount = await prisma.course.count();

        console.log('\n--- Total Database Counts ---');
        console.log(`Organizations: ${orgCount}`);
        console.log(`Users: ${userCount}`);
        console.log(`Students: ${studentCount}`);
        console.log(`Courses: ${courseCount}`);

        const courses = await prisma.course.findMany({ select: { id: true, name: true, organizationId: true } });
        console.log('\n--- All Courses ---');
        courses.forEach(c => {
            const match = c.organizationId === targetOrgId ? "MATCH" : "MISMATCH";
            console.log(`[${match}] ${c.name} (${c.id}) - Org: ${c.organizationId}`);
        });

        const orgs = await prisma.organization.findMany();
        console.log('\n--- All Organizations ---');
        orgs.forEach(o => console.log(`${o.name} (${o.id})`));

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
