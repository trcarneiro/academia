import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTestStudent() {
  try {
    const student = await prisma.student.findFirst({
      where: {
        organizationId: '452c0b35-1822-4890-851e-922356c812fb',
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (student) {
      console.log('✅ Aluno encontrado:');
      console.log(`ID: ${student.id}`);
      console.log(`Matrícula: ${student.registrationNumber}`);
      console.log(`Nome: ${student.user.firstName} ${student.user.lastName}`);
      console.log(`CPF: ${student.cpf || 'N/A'}`);
    } else {
      console.log('❌ Nenhum aluno ativo encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestStudent();
