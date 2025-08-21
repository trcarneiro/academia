// Quick test of student creation API directly
const { PrismaClient } = require('./node_modules/@prisma/client');

async function testStudentCreation() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando organizações...');
        const orgs = await prisma.organization.findMany();
        console.log('📊 Organizações encontradas:', orgs.length);
        
        if (orgs.length === 0) {
            console.log('➕ Criando organização...');
            await prisma.organization.create({
                data: {
                    name: 'Academia Teste',
                    slug: 'academia-teste',
                    description: 'Organização para teste'
                }
            });
            console.log('✅ Organização criada');
        }
        
        const orgId = orgs[0]?.id || (await prisma.organization.findFirst()).id;
        console.log('🏛️ Usando organização:', orgId);
        
        console.log('➕ Criando usuário e estudante...');
        
        // Create user and student in transaction (same logic as backend)
        const result = await prisma.$transaction(async (tx) => {
            const tempPassword = Math.random().toString(36).slice(-8);
            
            // Create user first
            const user = await tx.user.create({
                data: {
                    firstName: 'Teste',
                    lastName: 'Usuario',
                    email: 'teste-' + Date.now() + '@gmail.com', // Unique email
                    phone: null,
                    password: tempPassword,
                    organizationId: orgId,
                    role: 'STUDENT'
                }
            });
            
            console.log('👤 Usuário criado:', user.id);
            
            // Create student
            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    organizationId: orgId,
                    isActive: true,
                    category: 'ADULT'
                },
                include: {
                    user: true
                }
            });
            
            console.log('🎓 Estudante criado:', student.id);
            return student;
        });
        
        console.log('✅ Sucesso! Estudante criado:', result.user.firstName, result.user.lastName);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStudentCreation();
