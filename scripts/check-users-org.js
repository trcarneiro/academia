
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
});

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 20,
            select: { email: true, organizationId: true, firstName: true }
        });

        console.log('\n--- Users and Orgs ---');
        users.forEach(u => console.log(`${u.firstName} (${u.email}) - Org: ${u.organizationId}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
