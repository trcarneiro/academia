// Seed data for Krav Maga Academy
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Create Organization
    console.log('📊 Criando organização...');
    const org = await prisma.organization.create({
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
    console.log(`✅ Organização criada: ${org.name}`);

    // 2. Create Organization Settings
    await prisma.organizationSettings.create({
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

    // 3. Create Martial Arts
    console.log('🥋 Criando artes marciais...');
    const kravMaga = await prisma.martialArt.create({
      data: {
        organizationId: org.id,
        name: 'Krav Maga',
        description: 'Sistema de combate corpo a corpo desenvolvido para as Forças de Defesa de Israel',
        isActive: true,
      }
    });

    // 4. Create Admin User
    console.log('👤 Criando usuário administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
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

    // 5. Create Instructor Profile
    await prisma.instructor.create({
      data: {
        organizationId: org.id,
        userId: adminUser.id,
        specializations: ['Krav Maga', 'Defesa Pessoal', 'Condicionamento'],
        certifications: ['Instrutor Nível 3 IKMF', 'Personal Trainer CREF'],
        bio: 'Instrutor com mais de 15 anos de experiência em Krav Maga e defesa pessoal.',
        isActive: true,
      }
    });

    // 6. Create Course
    console.log('📚 Criando curso...');
    const course = await prisma.course.create({
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

    // 7. Create Techniques
    console.log('🥊 Criando técnicas...');
    const techniques = [
      {
        name: 'Guarda de Boxe',
        description: 'Posição básica de defesa com punhos cerrados',
        category: 'DEFENSE',
        difficulty: 1,
        instructions: 'Mantenha os punhos na altura do rosto, cotovelos próximos ao corpo',
        safetyTips: 'Sempre mantenha o equilíbrio e a guarda alta'
      },
      {
        name: 'Soco Direto',
        description: 'Golpe linear básico com o punho dominante',
        category: 'ATTACK',
        difficulty: 1,
        instructions: 'Estenda o braço de forma linear, rotacionando o punho no impacto',
        safetyTips: 'Use proteção nas mãos durante o treino'
      },
      {
        name: 'Defesa contra Estrangulamento Frontal',
        description: 'Defesa básica contra agarramento no pescoço pela frente',
        category: 'DEFENSE',
        difficulty: 2,
        instructions: 'Movimentos simultâneos: atacar, agarrar e contra-atacar',
        safetyTips: 'Pratique lentamente até dominar o movimento'
      },
      {
        name: 'Joelhada',
        description: 'Golpe com o joelho em distância curta',
        category: 'ATTACK',
        difficulty: 2,
        instructions: 'Puxar o oponente enquanto eleva o joelho com força',
        safetyTips: 'Cuidado com o equilíbrio ao executar'
      },
      {
        name: 'Defesa contra Agarramento de Ombro',
        description: 'Liberação de agarramento lateral no ombro',
        category: 'DEFENSE',
        difficulty: 3,
        instructions: 'Movimento de alavanca para quebrar a pegada',
        safetyTips: 'Execute com controle para não machucar o parceiro'
      }
    ];

    for (const techData of techniques) {
      const technique = await prisma.technique.create({
        data: {
          organizationId: org.id,
          martialArtId: kravMaga.id,
          ...techData,
          isActive: true,
        }
      });

      // Associate technique with course
      await prisma.courseTechnique.create({
        data: {
          courseId: course.id,
          techniqueId: technique.id,
          week: Math.ceil(Math.random() * 8), // Random week 1-8
          order: techniques.indexOf(techData) + 1,
        }
      });
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
      const hashedStudentPassword = await bcrypt.hash('student123', 10);
      
      const user = await prisma.user.create({
        data: {
          organizationId: org.id,
          email: studentData.email,
          password: hashedStudentPassword,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          role: 'STUDENT',
          isActive: true,
        }
      });

      await prisma.student.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          category: studentData.category,
          dateOfBirth: new Date(studentData.dateOfBirth),
          emergencyContact: '+55 11 88888-8888',
          enrollmentDate: new Date(),
          isActive: true,
        }
      });
    }

    // 9. Create Achievements
    console.log('🏆 Criando conquistas...');
    const achievements = [
      {
        name: 'Primeiro Dia',
        description: 'Completou sua primeira aula',
        icon: '🎯',
        xpReward: 50,
        category: 'MILESTONE'
      },
      {
        name: 'Sequência de 7 Dias',
        description: 'Frequentou aulas por 7 dias consecutivos',
        icon: '🔥',
        xpReward: 100,
        category: 'STREAK'
      },
      {
        name: 'Técnica Master',
        description: 'Dominou 10 técnicas básicas',
        icon: '⚡',
        xpReward: 200,
        category: 'SKILL'
      },
      {
        name: 'Sequência de 30 Dias',
        description: 'Frequentou aulas por 30 dias consecutivos',
        icon: '🏆',
        xpReward: 500,
        category: 'STREAK'
      }
    ];

    for (const achievementData of achievements) {
      await prisma.achievement.create({
        data: {
          organizationId: org.id,
          ...achievementData,
          isActive: true,
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