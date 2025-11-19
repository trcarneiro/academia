const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPedro() {
  console.log('🔍 Verificando dados de Pedro Teste...\n');
  
  const pedro = await prisma.student.findFirst({
    where: {
      user: {
        firstName: 'Pedro',
        lastName: 'Teste'
      }
    },
    include: {
      user: true
    }
  });
  
  if (pedro) {
    console.log('✅ Pedro Teste encontrado:');
    console.log('ID:', pedro.id);
    console.log('Nome:', `${pedro.user.firstName} ${pedro.user.lastName}`);
    console.log('Matrícula:', pedro.registrationNumber || '❌ SEM MATRÍCULA');
    console.log('Email:', pedro.user.email);
    console.log('Ativo:', pedro.isActive);
    
    if (!pedro.registrationNumber) {
      console.log('\n⚠️ Pedro Teste NÃO tem número de matrícula!');
      console.log('💡 Vou adicionar um número de matrícula...\n');
      
      const updated = await prisma.student.update({
        where: { id: pedro.id },
        data: { registrationNumber: '2025001' }
      });
      
      console.log('✅ Matrícula adicionada:', updated.registrationNumber);
    }
  } else {
    console.log('❌ Pedro Teste não encontrado');
  }
  
  await prisma.$disconnect();
}

checkPedro().catch(console.error);
