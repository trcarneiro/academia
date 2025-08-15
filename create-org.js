const { PrismaClient } = require('./node_modules/@prisma/client');

async function createOrganization() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando se existe organização...');
        const existingOrg = await prisma.organization.findFirst();
        
        if (existingOrg) {
            console.log('✅ Organização já existe:', existingOrg.name);
            return existingOrg;
        }
        
        console.log('➕ Criando nova organização...');
        const org = await prisma.organization.create({
            data: {
                name: 'Academia Teste',
                slug: 'academia-teste',
                description: 'Organização padrão para testes'
            }
        });
        
        console.log('✅ Organização criada com sucesso:', org);
        return org;
        
    } catch (error) {
        console.error('❌ Erro ao criar organização:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createOrganization()
    .then(() => {
        console.log('🎉 Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Falha no processo:', error);
        process.exit(1);
    });
