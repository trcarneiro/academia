import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInstructor() {
  const instructor = await prisma.instructor.findFirst({
    where: { organizationId: '452c0b35-1822-4890-851e-922356c812fb' },
    include: { user: true }
  });

  if (instructor) {
    console.log('✅ Instrutor encontrado:');
    console.log('   ID:', instructor.id);
    console.log('   Nome:', instructor.user?.firstName, instructor.user?.lastName);
  } else {
    console.log('❌ Nenhum instrutor encontrado. Criando instrutor de teste...');
    
    // Criar usuário instrutor
    const user = await prisma.user.create({
      data: {
        email: 'instrutor.teste@teste.com',
        password: 'test123',
        firstName: 'Instrutor',
        lastName: 'Teste',
        role: 'INSTRUCTOR',
        organizationId: '452c0b35-1822-4890-851e-922356c812fb'
      }
    });

    // Criar instrutor
    const newInstructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        organizationId: '452c0b35-1822-4890-851e-922356c812fb',
        specialties: ['Krav Maga']
      }
    });

    console.log('✅ Instrutor criado:');
    console.log('   ID:', newInstructor.id);
  }

  await prisma.$disconnect();
}

checkInstructor();
