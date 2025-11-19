const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔍 Buscando Pedro Teste da Graduação...');
        
        const pedroGraduacao = await prisma.student.findUnique({
            where: { id: 'dc9c17ff-582c-45c6-bc46-7eee1cee4564' },
            include: { user: true }
        });
        
        if (pedroGraduacao) {
            console.log('\n✅ PEDRO TESTE (GRADUAÇÃO):');
            console.log('ID:', pedroGraduacao.id);
            console.log('Nome:', pedroGraduacao.user?.firstName, pedroGraduacao.user?.lastName);
            console.log('Email:', pedroGraduacao.user?.email);
            console.log('Matrícula:', pedroGraduacao.registrationNumber);
            console.log('\n📦 Dados completos:', JSON.stringify(pedroGraduacao, null, 2));
        } else {
            console.log('\n❌ Pedro Teste da graduação NÃO encontrado!');
        }
        
        // Buscar o "Lucas Teste" que encontramos antes
        console.log('\n🔍 Verificando Lucas Teste...');
        const lucas = await prisma.student.findUnique({
            where: { id: 'dd3fc32a-2c08-42a8-932e-ea063296579d' },
            include: { user: true }
        });
        
        if (lucas) {
            console.log('\n✅ LUCAS TESTE (Check-in):');
            console.log('ID:', lucas.id);
            console.log('Nome:', lucas.user?.firstName, lucas.user?.lastName);
            console.log('Email:', lucas.user?.email);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
