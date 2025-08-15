const { PrismaClient } = require('./node_modules/@prisma/client');

async function checkDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando organizações...');
        const orgs = await prisma.organization.findMany();
        console.log('📊 Organizações encontradas:', orgs.length);
        orgs.forEach(org => {
            console.log(`  - ${org.name} (ID: ${org.id})`);
        });
        
        console.log('\n🔍 Verificando usuários...');
        const users = await prisma.user.findMany();
        console.log('👥 Usuários encontrados:', users.length);
        
        console.log('\n🔍 Verificando estudantes...');
        const students = await prisma.student.findMany();
        console.log('🎓 Estudantes encontrados:', students.length);
        
    } catch (error) {
        console.error('❌ Erro ao consultar banco:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
