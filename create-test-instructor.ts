import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestInstructor() {
  try {
    console.log('🔧 Criando instrutor de teste...');

    // Primeiro, obter a organização existente
    let organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('🏢 Criando organização...');
      organization = await prisma.organization.create({
        data: {
          name: 'Academia Krav Maga',
          slug: 'academia-krav-maga',
          email: 'contato@academiakravmaga.com.br',
          country: 'Brazil',
          maxStudents: 100,
          maxStaff: 10,
          isActive: true
        }
      });
    }

    console.log('🏢 Organização encontrada:', organization.name);

    // Criar usuário para o instrutor
    console.log('👤 Criando usuário...');
    const userEmail = `marcus.silva+${Date.now()}@academia.com`; // Email único
    
    const user = await prisma.user.create({
      data: {
        firstName: 'Marcus',
        lastName: 'Silva',
        email: userEmail,
        password: 'temp123456',
        phone: '(11) 99999-1234',
        cpf: '123.456.789-00',
        birthDate: new Date('1985-03-15'),
        organizationId: organization.id,
        role: 'INSTRUCTOR',
        isActive: true
      }
    });

    console.log('👤 Usuário criado:', user.firstName, user.lastName);

    // Criar instrutor
    console.log('🥋 Criando instrutor...');
    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        bio: 'Instrutor experiente em Krav Maga com mais de 10 anos de prática. Especialista em defesa pessoal e técnicas de combate urbano.',
        specializations: ['Defesa Pessoal', 'Combate Urbano', 'Técnicas de Imobilização'],
        martialArts: ['Krav Maga', 'Jiu-Jitsu'],
        experience: 'Mais de 10 anos de experiência em artes marciais, com foco em Krav Maga e defesa pessoal. Formado pela International Krav Maga Federation.',
        certifications: ['Certificado IKMF', 'Instrutor Nivel 3', 'Primeiros Socorros'],
        hireDate: new Date('2020-01-15'),
        hourlyRate: 80.00,
        maxStudentsPerClass: 25,
        preferredUnits: [organization.id],
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            cpf: true
          }
        }
      }
    });

    console.log('✅ Instrutor criado com sucesso!');
    console.log('📋 Dados do instrutor:');
    console.log('  - ID:', instructor.id);
    console.log('  - Nome:', `${instructor.user.firstName} ${instructor.user.lastName}`);
    console.log('  - Email:', instructor.user.email);
    console.log('  - Telefone:', instructor.user.phone);
    console.log('  - Bio:', instructor.bio);
    console.log('  - Ativo:', instructor.isActive);

    return instructor;

  } catch (error) {
    console.error('❌ Erro ao criar instrutor:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestInstructor()
    .then(() => {
      console.log('🎉 Processo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no processo:', error);
      process.exit(1);
    });
}

export { createTestInstructor };
