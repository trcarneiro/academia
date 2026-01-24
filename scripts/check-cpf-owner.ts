
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCPF() {
    const cpf = '06822689680';
    console.log(`Checking owner of CPF: ${cpf}...`);

    const students = await prisma.student.findMany({
        where: {
            user: { cpf: { contains: cpf } }
        },
        include: { user: true }
    });

    if (students.length > 0) {
        students.forEach(s => {
            console.log(`✅ Found Student: ${s.user.firstName} ${s.user.lastName} (ID: ${s.id})`);
            console.log(`   User ID: ${s.userId}, Email: ${s.user.email}`);
        });
    } else {
        console.log('❌ No student found with this CPF.');
        // Check Users table directly
        const users = await prisma.user.findMany({ where: { cpf: { contains: cpf } } });
        users.forEach(u => {
            console.log(`⚠️ Found User (Not Student?): ${u.firstName} ${u.lastName} (ID: ${u.id})`);
        });
    }

    await prisma.$disconnect();
}

checkCPF();
