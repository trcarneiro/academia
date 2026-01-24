import { prisma } from '../src/utils/prisma';

async function checkUsers() {
    const names = ['Thiago Roberto Carneiro', 'Ana Paula Santos Carneiro'];

    console.log('🔍 Checking for users...');

    for (const name of names) {
        const user = await prisma.user.findFirst({
            where: { name: { contains: name } },
            include: { student: true }
        });

        if (user) {
            console.log(`✅ Found: ${user.name} (ID: ${user.id})`);
            console.log(`   Student ID: ${user.student?.id || 'N/A'}`);
        } else {
            console.log(`❌ Not found: ${name}`);
        }
    }
}

checkUsers();
