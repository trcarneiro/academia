const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
        
        console.log('🔍 Procurando Pedro Teste...');
        
        const pedro = await prisma.student.findFirst({
            where: {
                organizationId: orgId,
                user: {
                    OR: [
                        { firstName: { contains: 'Pedro', mode: 'insensitive' } },
                        { lastName: { contains: 'Teste', mode: 'insensitive' } }
                    ]
                }
            },
            include: {
                user: true
            }
        });
        
        if (pedro) {
            console.log('\n✅ Pedro Teste encontrado!');
            console.log('ID:', pedro.id);
            console.log('Nome completo:', pedro.user?.firstName, pedro.user?.lastName);
            console.log('Matrícula:', pedro.registrationNumber);
            console.log('Email:', pedro.user?.email);
            console.log('CPF:', pedro.cpf || pedro.user?.cpf);
            console.log('\n📦 Dados completos:', JSON.stringify(pedro, null, 2));
        } else {
            console.log('\n❌ Pedro Teste NÃO encontrado!');
            
            // Buscar todos alunos com "Pedro" no nome
            const pedros = await prisma.student.findMany({
                where: {
                    organizationId: orgId,
                    user: {
                        firstName: { contains: 'Pedro', mode: 'insensitive' }
                    }
                },
                include: {
                    user: true
                }
            });
            
            console.log(`\n📋 Alunos com "Pedro": ${pedros.length}`);
            pedros.forEach(p => {
                console.log(`- ${p.user?.firstName} ${p.user?.lastName} (ID: ${p.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
})();
