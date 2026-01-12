
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'dev@academia.com';
    console.log(`🔍 Buscando usuário: ${email}...`);

    const user = await prisma.user.findFirst({
        where: { email },
        include: { student: true }
    });

    if (!user) {
        console.error('❌ Usuário dev@academia.com não encontrado. Rode o servidor uma vez para criar o usuário base.');
        return;
    }

    console.log(`✅ Usuário encontrado: ${user.firstName} ${user.lastName}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   CPF: ${user.cpf || 'Não definido'}`);

    if (user.student) {
        console.log('ℹ️ Este usuário SÁ é um aluno.');
        console.log(`   Student ID: ${user.student.id}`);
        return;
    }

    console.log('🚀 Promovendo usuário a Aluno...');

    const student = await prisma.student.create({
        data: {
            userId: user.id,
            organizationId: user.organizationId,
            category: 'ADULT',
            isActive: true,
            enrollmentDate: new Date(),
            registrationNumber: new Date().getTime().toString(), // Simple unique number
            globalLevel: 1,
            totalXP: 0
        }
    });

    console.log('✅ Usuário promovido com sucesso!');
    console.log(`   Student ID: ${student.id}`);

    if (!user.cpf) {
        console.log('⚠️ Usuário sem CPF. Adicionando CPF fictício para testes de busca...');
        const fakeCpf = '12345678900';
        await prisma.user.update({
            where: { id: user.id },
            data: { cpf: fakeCpf }
        });
        console.log(`   CPF Atualizado para: ${fakeCpf}`);
    } else {
        console.log(`   Use este CPF para buscar: ${user.cpf}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
