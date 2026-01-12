import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickSetup() {
    try {
        const course = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga - Faixa Branca', mode: 'insensitive' } }
        });

        const instructor = await prisma.instructor.findFirst();

        if (!course) {
            console.log('❌ Curso não encontrado');
            return;
        }

        console.log('\n✅ AMBIENTE DE TESTE CONFIGURADO');
        console.log(`Curso: ${course.id}`);
        console.log(`\n🔗 Próximo passo: Acessar http://localhost:3000/checkin-kiosk`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

quickSetup();
