import { prisma } from './src/utils/database';

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create organization if not exists
    const organizationId = 'd961f738-9552-4385-8c1d-e10d8b1047e5';
    let organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          id: organizationId,
          name: 'Academia Krav Maga',
          slug: 'academia-krav-maga',
          description: 'Academia de Krav Maga',
          address: 'São Paulo, SP',
          phone: '(11) 99999-9999',
          email: 'contato@academiakmg.com.br'
        }
      });
      console.log('✅ Organization created:', organization.name);
    } else {
      console.log('✅ Organization already exists:', organization.name);
    }

    // Create martial art if not exists
    let martialArt = await prisma.martialArt.findFirst({
      where: { organizationId: organizationId, name: 'Krav Maga' }
    });

    if (!martialArt) {
      martialArt = await prisma.martialArt.create({
        data: {
          organizationId: organizationId,
          name: 'Krav Maga',
          description: 'Sistema de combate e autodefesa desenvolvido pelo exército israelense'
        }
      });
      console.log('✅ Martial Art created:', martialArt.name);
    } else {
      console.log('✅ Martial Art already exists:', martialArt.name);
    }

    // Create courses if not exist
    const existingCourses = await prisma.course.findMany({
      where: { organizationId: organizationId }
    });

    if (existingCourses.length === 0) {
      const courses = [
        {
          name: 'Krav Maga Iniciante',
          description: 'Curso básico de Krav Maga para iniciantes',
          level: 'BEGINNER' as const,
          duration: 12,
          classesPerWeek: 2,
          totalClasses: 24,
          organizationId: organizationId,
          martialArtId: martialArt.id,
          isActive: true
        },
        {
          name: 'Krav Maga Intermediário',
          description: 'Curso intermediário de Krav Maga',
          level: 'INTERMEDIATE' as const,
          duration: 16,
          classesPerWeek: 2,
          totalClasses: 32,
          organizationId: organizationId,
          martialArtId: martialArt.id,
          isActive: true
        },
        {
          name: 'Krav Maga Avançado',
          description: 'Curso avançado de Krav Maga',
          level: 'ADVANCED' as const,
          duration: 20,
          classesPerWeek: 3,
          totalClasses: 60,
          organizationId: organizationId,
          martialArtId: martialArt.id,
          isActive: true
        }
      ];

      for (const courseData of courses) {
        const course = await prisma.course.create({
          data: courseData
        });
        console.log('✅ Course created:', course.name);
      }
    } else {
      console.log('✅ Courses already exist:', existingCourses.length, 'courses found');
    }

    // Create units if not exist
    const existingUnits = await prisma.unit.findMany({
      where: { organizationId: organizationId }
    });

    if (existingUnits.length === 0) {
      const units = [
        {
          name: 'Unidade Principal',
          address: 'Rua dos Bandeirantes, 123 - Vila Olímpia, São Paulo - SP',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '04548-000',
          phone: '(11) 99999-9999',
          email: 'principal@academiakmg.com.br',
          organizationId: organizationId,
          isActive: true
        },
        {
          name: 'Unidade Zona Norte',
          address: 'Av. Paulista, 456 - Consolação, São Paulo - SP',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          phone: '(11) 88888-8888',
          email: 'zonanorte@academiakmg.com.br',
          organizationId: organizationId,
          isActive: true
        }
      ];

      for (const unitData of units) {
        const unit = await prisma.unit.create({
          data: unitData
        });
        console.log('✅ Unit created:', unit.name);
      }
    } else {
      console.log('✅ Units already exist:', existingUnits.length, 'units found');
    }

    // Create instructors if not exist
    const existingInstructors = await prisma.instructor.findMany({
      where: { organizationId: organizationId }
    });

    if (existingInstructors.length === 0) {
      // First create users for instructors
      const instructorUsers = [
        {
          email: 'marcus@academiakmg.com.br',
          password: '$2b$10$dummy.hash.placeholder', // In real app, this would be properly hashed
          role: 'INSTRUCTOR' as const,
          firstName: 'Marcus',
          lastName: 'Silva',
          phone: '(11) 97777-7777',
          organizationId: organizationId,
          isActive: true,
          emailVerified: true
        },
        {
          email: 'ana@academiakmg.com.br',
          password: '$2b$10$dummy.hash.placeholder',
          role: 'INSTRUCTOR' as const,
          firstName: 'Ana',
          lastName: 'Santos',
          phone: '(11) 96666-6666',
          organizationId: organizationId,
          isActive: true,
          emailVerified: true
        },
        {
          email: 'carlos@academiakmg.com.br',
          password: '$2b$10$dummy.hash.placeholder',
          role: 'INSTRUCTOR' as const,
          firstName: 'Carlos',
          lastName: 'Oliveira',
          phone: '(11) 95555-5555',
          organizationId: organizationId,
          isActive: true,
          emailVerified: true
        }
      ];

      const createdUsers: any[] = [];
      for (const userData of instructorUsers) {
        const user = await prisma.user.create({
          data: userData
        });
        createdUsers.push(user);
        console.log('✅ Instructor user created:', user.firstName, user.lastName);
      }

      // Now create instructor profiles
      const instructors = [
        {
          userId: createdUsers[0].id,
          specializations: ['Krav Maga', 'Defesa Pessoal'],
          certifications: ['Instrutor Krav Maga Nível 3', 'First Aid'],
          experience: '8 anos de experiência',
          martialArts: ['Krav Maga'],
          organizationId: organizationId,
          isActive: true
        },
        {
          userId: createdUsers[1].id,
          specializations: ['Krav Maga', 'Condicionamento Físico'],
          certifications: ['Instrutor Krav Maga Nível 2', 'Personal Trainer'],
          experience: '5 anos de experiência',
          martialArts: ['Krav Maga'],
          organizationId: organizationId,
          isActive: true
        },
        {
          userId: createdUsers[2].id,
          specializations: ['Krav Maga', 'Defesa Feminina'],
          certifications: ['Instrutor Krav Maga Nível 4', 'Especialista em Defesa Feminina'],
          experience: '12 anos de experiência',
          martialArts: ['Krav Maga'],
          organizationId: organizationId,
          isActive: true
        }
      ];

      for (let i = 0; i < instructors.length; i++) {
        const instructor = await prisma.instructor.create({
          data: instructors[i]
        });
        console.log('✅ Instructor profile created for:', createdUsers[i].firstName, createdUsers[i].lastName);
      }
    } else {
      console.log('✅ Instructors already exist:', existingInstructors.length, 'instructors found');
    }

    console.log('🎉 Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
