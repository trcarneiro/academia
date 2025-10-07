const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPlan() {
    try {
        const planId = '67c3c6f3-5d65-46e6-bcb3-bb596850e797'; // Plano "Ilimitado"
        const correctCourseId = 'krav-maga-faixa-branca-2025';
        
        console.log('🔧 Atualizando plano "Ilimitado" com ID correto do curso...');
        
        const updated = await prisma.billingPlan.update({
            where: { id: planId },
            data: {
                features: {
                    courseIds: [correctCourseId]
                }
            },
            select: {
                id: true,
                name: true,
                features: true
            }
        });
        
        console.log('✅ Plano atualizado com sucesso:');
        console.log(JSON.stringify(updated, null, 2));
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixPlan();
