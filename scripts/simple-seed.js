// Simple seed with minimal data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando dados básicos...');

  try {
    // Check if organization exists
    let org = await prisma.organization.findFirst();
    
    if (!org) {
      // Create Organization
      org = await prisma.organization.create({
        data: {
          name: 'Elite Krav Maga Academy',
          slug: 'elite-krav-maga',
          description: 'Academia de Krav Maga e defesa pessoal',
          email: 'contato@elitekravmaga.com',
          phone: '+55 11 99999-9999',
          city: 'São Paulo',
          state: 'SP',
          plan: 'PREMIUM',
          isActive: true,
        }
      });
      console.log(`✅ Organização criada: ${org.name}`);
    }

    // Create some basic students data
    const studentData = [
      { firstName: 'João', lastName: 'Santos', email: 'joao@email.com' },
      { firstName: 'Maria', lastName: 'Silva', email: 'maria@email.com' },
      { firstName: 'Pedro', lastName: 'Costa', email: 'pedro@email.com' },
      { firstName: 'Ana', lastName: 'Oliveira', email: 'ana@email.com' },
      { firstName: 'Carlos', lastName: 'Rodrigues', email: 'carlos@email.com' }
    ];

    for (const student of studentData) {
      // Check if user exists using compound unique key
      const existingUser = await prisma.user.findUnique({
        where: { 
          organizationId_email: {
            organizationId: org.id,
            email: student.email
          }
        }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const user = await prisma.user.create({
          data: {
            organizationId: org.id,
            email: student.email,
            password: hashedPassword,
            firstName: student.firstName,
            lastName: student.lastName,
            role: 'STUDENT',
            isActive: true,
          }
        });

        await prisma.student.create({
          data: {
            organizationId: org.id,
            userId: user.id,
            category: 'ADULT',
            emergencyContact: '+55 11 99999-9999',
            isActive: true,
          }
        });

        console.log(`✅ Aluno criado: ${student.firstName} ${student.lastName}`);
      }
    }

    console.log('✅ Seed básico concluído!');

    // Test query
    const studentsCount = await prisma.student.count();
    const orgsCount = await prisma.organization.count();
    
    console.log(`📊 Total: ${orgsCount} organização, ${studentsCount} alunos`);

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();