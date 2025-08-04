// Seed data for Krav Maga Academy
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Create Organization
    console.log('📊 Criando organização...');
    // Check if organization already exists
    let org = await prisma.organization.findUnique({
      where: { slug: 'elite-krav-maga' }
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'Elite Krav Maga Academy',
          slug: 'elite-krav-maga',
          description: 'Academia premiada de Krav Maga e defesa pessoal',
          email: 'contato@elitekravmaga.com',
          phone: '+55 11 99999-9999',
          address: 'Rua das Academias, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          subscriptionPlan: 'PREMIUM',
          maxStudents: 500,
          maxStaff: 20,
          isActive: true,
        }
      });
    } else {
      console.log('🏢 Organização já existe, usando a existente');
    }
    console.log(`✅ Organização criada: ${org.name}`);

    // 2. Create Organization Settings
    let orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: org.id }
    });

    if (!orgSettings) {
      orgSettings = await prisma.organizationSettings.create({
        data: {
          organizationId: org.id,
          enableGamification: true,
          enableVideoAnalysis: true,
          enableAIRecommendations: true,
          aiProvider: 'CLAUDE',
          allowQRCheckin: true,
          allowManualCheckin: true,
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          language: 'pt-BR',
        }
      });
    } else {
      console.log('⚙️ Configurações da organização já existem, usando as existentes');
    }

    // 3. Create Martial Arts
    console.log('🥋 Criando artes marciais...');
    let kravMaga = await prisma.martialArt.findUnique({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: 'Krav Maga'
        }
      }
    });

    if (!kravMaga) {
      kravMaga = await prisma.martialArt.create({
        data: {
          organizationId: org.id,
          name: 'Krav Maga',
          description: 'Sistema de combate corpo a corpo desenvolvido para as Forças de Defesa de Israel',
          isActive: true,
        }
      });
    } else {
      console.log('🥋 Arte marcial já existe, usando a existente');
    }

    // 4. Create Admin User
    console.log('👤 Criando usuário administrador...');
    let adminUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email: 'admin@elitekravmaga.com'
        }
      }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          organizationId: org.id,
          email: 'admin@elitekravmaga.com',
          password: hashedPassword,
          firstName: 'Sensei',
          lastName: 'Master',
          role: 'ADMIN',
          isActive: true,
        }
      });
    } else {
      console.log('👤 Usuário administrador já existe, usando o existente');
    }

    // 5. Create Instructor Profile
    let instructor = await prisma.instructor.findUnique({
      where: { userId: adminUser.id }
    });

    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: {
          organizationId: org.id,
          userId: adminUser.id,
          specializations: ['Krav Maga', 'Defesa Pessoal', 'Condicionamento'],
          certifications: ['Instrutor Nível 3 IKMF', 'Personal Trainer CREF'],
          bio: 'Instrutor com mais de 15 anos de experiência em Krav Maga e defesa pessoal.',
          isActive: true,
        }
      });
    } else {
      console.log('👨‍🏫 Perfil de instrutor já existe, usando o existente');
    }

    // 6. Create Course
    console.log('📚 Criando curso...');
    let course = await prisma.course.findUnique({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: 'Krav Maga - Faixa Branca'
        }
      }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          organizationId: org.id,
          martialArtId: kravMaga.id,
          name: 'Krav Maga - Faixa Branca',
          description: 'Curso básico de Krav Maga para iniciantes - 24 semanas',
          category: 'ADULT',
          level: 'BEGINNER',
          duration: 24,
          totalClasses: 48, // 2 aulas por semana x 24 semanas
          isActive: true,
        }
      });
    } else {
      console.log('📚 Curso já existe, usando o existente');
    }

    // 7. Create Techniques
    console.log('🥊 Criando técnicas...');
    const techniqueData = [
      {
        name: 'Guarda de Boxe',
        description: 'Posição básica de defesa com punhos cerrados',
        category: 'DEFENSE',
        difficulty: 1,
        instructions: ['Mantenha os punhos na altura do rosto', 'Mantenha os cotovelos próximos ao corpo']
      },
      {
        name: 'Soco Direto',
        description: 'Golpe linear básico com o punho dominante',
        category: 'STRIKING',
        difficulty: 1,
        instructions: ['Estenda o braço de forma linear', 'Rotacione o punho no impacto']
      },
      {
        name: 'Defesa contra Estrangulamento Frontal',
        description: 'Defesa básica contra agarramento no pescoço pela frente',
        category: 'DEFENSE',
        difficulty: 2,
        instructions: ['Atacar o oponente', 'Agarrar o braço do oponente', 'Contra-atacar com joelhada']
      },
      {
        name: 'Joelhada',
        description: 'Golpe com o joelho em distância curta',
        category: 'STRIKING',
        difficulty: 2,
        instructions: ['Puxe o oponente para perto', 'Eleve o joelho com força']
      },
      {
        name: 'Defesa contra Agarramento de Ombro',
        description: 'Liberação de agarramento lateral no ombro',
        category: 'DEFENSE',
        difficulty: 3,
        instructions: ['Posicione a mão no braço do oponente', 'Use movimento de alavanca para quebrar a pegada']
      }
    ];

    const techniques = [];
    for (const techData of techniqueData) {
      // Check if technique already exists
      let technique = await prisma.technique.findUnique({
        where: {
          martialArtId_name: {
            martialArtId: kravMaga.id,
            name: techData.name
          }
        }
      });

      if (!technique) {
        technique = await prisma.technique.create({
          data: {
            martialArtId: kravMaga.id,
            ...techData,
          }
        });
        console.log(`✅ Técnica criada: ${techData.name}`);
      } else {
        console.log(`🥊 Técnica já existe: ${techData.name}`);
      }
      techniques.push(technique);

      // Associate technique with course
      let courseTechnique = await prisma.courseTechnique.findUnique({
        where: {
          courseId_techniqueId: {
            courseId: course.id,
            techniqueId: technique.id
          }
        }
      });

      if (!courseTechnique) {
        courseTechnique = await prisma.courseTechnique.create({
          data: {
            courseId: course.id,
            techniqueId: technique.id,
            weekNumber: Math.ceil(Math.random() * 8), // Random week 1-8
            orderIndex: techniqueData.indexOf(techData) + 1,
          }
        });
        console.log(`🔗 Técnica associada ao curso: ${techData.name}`);
      } else {
        console.log(`🔗 Técnica já associada ao curso: ${techData.name}`);
      }
    }

    // 8. Create Sample Students
    console.log('👥 Criando alunos de exemplo...');
    const students = [
      {
        firstName: 'João',
        lastName: 'Santos',
        email: 'joao.santos@email.com',
        category: 'ADULT',
        dateOfBirth: '1990-05-15'
      },
      {
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria.silva@email.com',
        category: 'ADULT',
        dateOfBirth: '1985-08-22'
      },
      {
        firstName: 'Pedro',
        lastName: 'Costa',
        email: 'pedro.costa@email.com',
        category: 'MASTER_1',
        dateOfBirth: '1978-12-10'
      },
      {
        firstName: 'Ana',
        lastName: 'Oliveira',
        email: 'ana.oliveira@email.com',
        category: 'ADULT',
        dateOfBirth: '1992-03-08'
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodrigues',
        email: 'carlos.rodrigues@email.com',
        category: 'MASTER_2',
        dateOfBirth: '1970-11-25'
      }
    ];

    for (const studentData of students) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: {
          organizationId_email: {
            organizationId: org.id,
            email: studentData.email
          }
        }
      });

      if (!user) {
        const hashedStudentPassword = await bcrypt.hash('student123', 10);
        
        user = await prisma.user.create({
          data: {
            organizationId: org.id,
            email: studentData.email,
            password: hashedStudentPassword,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            role: 'STUDENT',
            isActive: true,
            birthDate: new Date(studentData.dateOfBirth),
          }
        });
        console.log(`✅ Usuário criado: ${studentData.firstName} ${studentData.lastName}`);
      } else {
        console.log(`👤 Usuário já existe: ${studentData.firstName} ${studentData.lastName}`);
      }

      // Check if student already exists
      let student = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            organizationId: org.id,
            userId: user.id,
            category: studentData.category,
            emergencyContact: '+55 11 88888-8888',
            enrollmentDate: new Date(),
            isActive: true,
          }
        });
        console.log(`✅ Aluno criado: ${studentData.firstName} ${studentData.lastName}`);
      } else {
        console.log(`👥 Aluno já existe: ${studentData.firstName} ${studentData.lastName}`);
      }
    }

    // 9. Create Achievements
    console.log('🏆 Criando conquistas...');
    const achievements = [
      {
        name: 'Primeiro Dia',
        description: 'Completou sua primeira aula',
        xpReward: 50,
        category: 'ATTENDANCE',
        criteria: {
          type: 'attendance',
          count: 1
        }
      },
      {
        name: 'Sequência de 7 Dias',
        description: 'Frequentou aulas por 7 dias consecutivos',
        xpReward: 100,
        category: 'CHALLENGE',
        criteria: {
          type: 'consecutive_days',
          count: 7
        }
      },
      {
        name: 'Técnica Master',
        description: 'Dominou 10 técnicas básicas',
        xpReward: 200,
        category: 'TECHNIQUE',
        criteria: {
          type: 'techniques_mastered',
          count: 10
        }
      },
      {
        name: 'Sequência de 30 Dias',
        description: 'Frequentou aulas por 30 dias consecutivos',
        xpReward: 500,
        category: 'CHALLENGE',
        criteria: {
          type: 'consecutive_days',
          count: 30
        }
      }
    ];

    for (const achievementData of achievements) {
      await prisma.achievement.create({
        data: {
          organizationId: org.id,
          ...achievementData,
        }
      });
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log(`🏢 Organização: ${org.name}`);
    console.log(`👤 Admin: admin@elitekravmaga.com (senha: admin123)`);
    console.log(`👥 Alunos: ${students.length} estudantes`);
    console.log(`🥊 Técnicas: ${techniques.length} técnicas`);
    console.log(`🏆 Conquistas: ${achievements.length} achievements`);
    console.log(`📚 Curso: ${course.name}`);

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
