const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
        const pedroId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';
        
        console.log('🔍 Verificando Pedro Teste...\n');
        
        const pedro = await prisma.student.findUnique({
            where: { id: pedroId },
            include: { user: true }
        });
        
        if (pedro) {
            console.log('✅ Pedro Teste encontrado!');
            console.log('Student isActive:', pedro.isActive);
            console.log('User isActive:', pedro.user.isActive);
            console.log('OrganizationId:', pedro.organizationId);
            console.log('FirstName:', pedro.user.firstName);
            console.log('LastName:', pedro.user.lastName);
            console.log('Email:', pedro.user.email);
            
            if (!pedro.isActive) {
                console.log('\n⚠️ PROBLEMA: Student está INATIVO!');
            }
            if (!pedro.user.isActive) {
                console.log('\n⚠️ PROBLEMA: User está INATIVO!');
            }
        } else {
            console.log('❌ Pedro Teste não encontrado!');
        }
        
        // Verificar quantos alunos ativos existem
        console.log('\n📊 Estatísticas:');
        const totalStudents = await prisma.student.count({
            where: { organizationId: orgId }
        });
        const activeStudents = await prisma.student.count({
            where: { organizationId: orgId, isActive: true }
        });
        
        console.log(`Total de alunos: ${totalStudents}`);
        console.log(`Alunos ativos: ${activeStudents}`);
        console.log(`Alunos inativos: ${totalStudents - activeStudents}`);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
