const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const userId = '81fb8cce-5827-4e70-b999-b4d530f40ac1';
        
        console.log('🔄 Renomeando Lucas Teste → Pedro Teste...');
        
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: 'Pedro',
                lastName: 'Teste'
            }
        });
        
        console.log('✅ Nome atualizado com sucesso!');
        console.log('Novo nome:', updated.firstName, updated.lastName);
        
        // Verificar no check-in
        const student = await prisma.student.findFirst({
            where: { userId: userId },
            include: { user: true }
        });
        
        console.log('\n📋 Dados atualizados:');
        console.log('Nome completo:', student.user.firstName, student.user.lastName);
        console.log('Agora deve aparecer no check-in como "Pedro Teste"');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
