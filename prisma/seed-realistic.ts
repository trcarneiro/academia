import { PrismaClient, UserRole, BillingType, StudentCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting realistic database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    
    try {
      await prisma.attendance.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.studentSubscription.deleteMany();
      await prisma.asaasCustomer.deleteMany();
      await prisma.billingPlan.deleteMany();
      await prisma.financialResponsible.deleteMany();
      await prisma.class.deleteMany();
      await prisma.lesson.deleteMany();
      await prisma.course.deleteMany();
      await prisma.student.deleteMany();
      await prisma.instructor.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();
      await prisma.martialArt.deleteMany();
    } catch (error) {
      console.log('⚠️ Some tables might not exist yet, continuing...');
    }
  }

  // Create organization
  console.log('🏢 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      id: uuidv4(),
      name: 'Academia Elite Krav Maga',
      slug: `elite-krav-maga-${Date.now()}`,
      description: 'Academia especializada em Krav Maga e defesa pessoal',
      logoUrl: 'https://example.com/logo.png',
      website: 'https://elitekravmaga.com.br',
      phone: '+55 11 3456-7890',
      email: 'contato@elitekravmaga.com.br',
      address: 'Rua das Olimpíadas, 500',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brazil',
      zipCode: '04551-000',
      subscriptionPlan: 'PREMIUM',
      maxStudents: 200,
      maxStaff: 20,
      isActive: true,
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6'
    }
  });

  // Create martial art
  console.log('🥋 Creating martial art...');
  const kravMaga = await prisma.martialArt.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Krav Maga',
      description: 'Sistema de combate e defesa pessoal desenvolvido para as forças de defesa israelenses',
      imageUrl: 'https://example.com/krav-maga.jpg',
      hasGrading: true,
      gradingSystem: 'BELT',
      maxLevel: 10,
      isActive: true,
    }
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      email: 'admin@elitekravmaga.com.br',
      password: adminPassword,
      firstName: 'Administrator',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create instructors
  console.log('🥋 Creating instructors...');
  const instructorPassword = await bcrypt.hash('instructor123', 10);
  
  const instructor1User = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      email: 'rafael.silva@elitekravmaga.com.br',
      password: instructorPassword,
      firstName: 'Rafael',
      lastName: 'Silva',
      phone: '+55 11 99999-1111',
      birthDate: new Date('1985-03-15'),
      role: UserRole.INSTRUCTOR,
      isActive: true,
    },
  });

  const instructor1 = await prisma.instructor.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      userId: instructor1User.id,
      specializations: ['Krav Maga Level 3', 'Defesa Pessoal Feminina'],
      certifications: ['IKMF Instructor Level 3', 'Primeiros Socorros'],
      bio: 'Instrutor experiente com 8 anos de ensino em Krav Maga',
      martialArts: [kravMaga.id],
      maxStudentsPerClass: 15,
      isActive: true,
    },
  });

  const instructor2User = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      email: 'maria.costa@elitekravmaga.com.br',
      password: instructorPassword,
      firstName: 'Maria',
      lastName: 'Costa',
      phone: '+55 11 99999-2222',
      birthDate: new Date('1990-07-22'),
      role: UserRole.INSTRUCTOR,
      isActive: true,
    },
  });

  const instructor2 = await prisma.instructor.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      userId: instructor2User.id,
      specializations: ['Krav Maga Level 2', 'Condicionamento Físico'],
      certifications: ['IKMF Instructor Level 2', 'Personal Trainer'],
      bio: 'Instrutora especializada em condicionamento físico e Krav Maga',
      martialArts: [kravMaga.id],
      maxStudentsPerClass: 20,
      isActive: true,
    },
  });

  // Create courses
  console.log('📚 Creating courses...');
  const beginnerCourse = await prisma.course.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      martialArtId: kravMaga.id,
      name: 'Krav Maga Iniciante',
      description: 'Curso básico de Krav Maga para iniciantes',
      level: 'BEGINNER',
      duration: 12,
      totalClasses: 48,
      maxStudents: 15,
      minAge: 16,
      maxAge: 65,
      prerequisites: ['Atestado médico'],
      objectives: [
        'Aprender técnicas básicas de defesa pessoal',
        'Desenvolver coordenação e reflexos',
        'Ganhar confiança e autoestima'
      ],
      curriculum: [
        'Fundamentos do Krav Maga',
        'Postura e movimento',
        'Defesas contra socos',
        'Defesas contra chutes',
        'Libertação de agarramentos'
      ],
      price: 150.00,
      isActive: true,
    }
  });

  const intermediateCourse = await prisma.course.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      martialArtId: kravMaga.id,
      name: 'Krav Maga Intermediário',
      description: 'Curso intermediário com técnicas avançadas',
      level: 'INTERMEDIATE',
      duration: 16,
      totalClasses: 64,
      maxStudents: 12,
      minAge: 18,
      maxAge: 60,
      prerequisites: ['Conclusão do curso iniciante'],
      objectives: [
        'Aprimorar técnicas básicas',
        'Aprender defesas contra armas',
        'Desenvolver combate no solo'
      ],
      curriculum: [
        'Técnicas avançadas de striking',
        'Defesa contra facas',
        'Defesa contra bastões',
        'Ground fighting básico',
        'Situações de múltiplos atacantes'
      ],
      price: 200.00,
      isActive: true,
    }
  });

  // Create lessons
  console.log('📝 Creating lessons...');
  const lessons = [
    {
      courseId: beginnerCourse.id,
      title: 'Introdução ao Krav Maga',
      description: 'Princípios básicos e filosofia do Krav Maga',
      lessonNumber: 1,
      weekNumber: 1,
      objectives: ['Entender a filosofia do Krav Maga', 'Aprender postura básica'],
      content: 'História do Krav Maga, princípios fundamentais, postura de luta',
      duration: 60,
    },
    {
      courseId: beginnerCourse.id,
      title: 'Defesas Básicas contra Socos',
      description: 'Técnicas fundamentais de defesa contra ataques de soco',
      lessonNumber: 2,
      weekNumber: 1,
      objectives: ['Dominar defesas básicas', 'Executar contra-ataques efetivos'],
      content: 'Outside defense, inside defense, straight punch counter',
      duration: 60,
    },
    {
      courseId: intermediateCourse.id,
      title: 'Defesa contra Armas Brancas',
      description: 'Técnicas de defesa contra facas e objetos cortantes',
      lessonNumber: 1,
      weekNumber: 1,
      objectives: ['Identificar ameaças', 'Executar defesas seguras'],
      content: 'Defesa contra estocadas, cortes laterais, controle da arma',
      duration: 75,
    }
  ];

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        id: uuidv4(),
        ...lesson,
      }
    });
  }

  // Create billing plans
  console.log('💳 Creating billing plans...');
  const basicPlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Básico',
      description: 'Acesso a 8 aulas por mês',
      category: StudentCategory.ADULT,
      price: 150.00,
      billingType: BillingType.MONTHLY,
      classesPerWeek: 2,
      maxClasses: 8,
      hasPersonalTraining: false,
      hasNutrition: false,
      isActive: true,
    }
  });

  const intermediatePlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Intermediário',
      description: 'Acesso a 12 aulas por mês',
      category: StudentCategory.ADULT,
      price: 200.00,
      billingType: BillingType.MONTHLY,
      classesPerWeek: 3,
      maxClasses: 12,
      hasPersonalTraining: false,
      hasNutrition: true,
      isActive: true,
    }
  });

  const premiumPlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Premium',
      description: 'Aulas ilimitadas com personal training',
      category: StudentCategory.ADULT,
      price: 350.00,
      billingType: BillingType.MONTHLY,
      classesPerWeek: 5,
      maxClasses: 999,
      hasPersonalTraining: true,
      hasNutrition: true,
      isActive: true,
    }
  });

  // Create financial responsibles
  console.log('👨‍👩‍👧‍👦 Creating financial responsibles...');
  const responsible1 = await prisma.financialResponsible.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Roberto Silva Santos',
      cpfCnpj: '12345678901',
      email: 'roberto.santos@email.com',
      phone: '+55 11 98765-4321',
      address: 'Rua das Flores, 789',
      addressNumber: '789',
      complement: 'Apto 45',
      neighborhood: 'Jardim das Rosas',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '08765-432',
      country: 'Brazil'
    }
  });

  const responsible2 = await prisma.financialResponsible.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Ana Paula Oliveira',
      cpfCnpj: '98765432109',
      email: 'ana.oliveira@email.com',
      phone: '+55 11 99876-5432',
      address: 'Avenida Brasil, 1234',
      addressNumber: '1234',
      complement: 'Casa 2',
      neighborhood: 'Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '12345-678',
      country: 'Brazil'
    }
  });

  // Create students
  console.log('🎓 Creating students...');
  const studentPassword = await bcrypt.hash('student123', 10);
  
  const students = [
    {
      email: 'joao.silva@email.com',
      firstName: 'João',
      lastName: 'Silva',
      phone: '+55 11 99999-3333',
      birthDate: new Date('1990-05-15'),
      emergencyContact: '+55 11 99999-3334',
      medicalConditions: null,
      financialResponsibleId: null,
    },
    {
      email: 'ana.santos@email.com',
      firstName: 'Ana',
      lastName: 'Santos',
      phone: '+55 11 99999-4444',
      birthDate: new Date('1985-08-22'),
      emergencyContact: '+55 11 99999-4445',
      medicalConditions: 'Alergia a látex',
      financialResponsibleId: null,
    },
    {
      email: 'carlos.oliveira@email.com',
      firstName: 'Carlos',
      lastName: 'Oliveira',
      phone: '+55 11 99999-5555',
      birthDate: new Date('1992-12-03'),
      emergencyContact: '+55 11 99999-5556',
      medicalConditions: null,
      financialResponsibleId: null,
    },
    {
      email: 'lucia.costa@email.com',
      firstName: 'Lúcia',
      lastName: 'Costa',
      phone: '+55 11 99999-6666',
      birthDate: new Date('1988-03-18'),
      emergencyContact: '+55 11 99999-6667',
      medicalConditions: null,
      financialResponsibleId: null,
    },
    {
      email: 'pedro.martins@email.com',
      firstName: 'Pedro',
      lastName: 'Martins',
      phone: '+55 11 99999-7777',
      birthDate: new Date('1995-07-11'),
      emergencyContact: '+55 11 99999-7778',
      medicalConditions: 'Problema no joelho direito',
      financialResponsibleId: null,
    },
    {
      email: 'marina.silva@email.com',
      firstName: 'Marina',
      lastName: 'Silva',
      phone: '+55 11 99999-8888',
      birthDate: new Date('2008-09-25'),
      emergencyContact: '+55 11 98765-4321',
      medicalConditions: null,
      financialResponsibleId: responsible1.id,
    },
    {
      email: 'gabriel.oliveira@email.com',
      firstName: 'Gabriel',
      lastName: 'Oliveira',
      phone: '+55 11 99999-9999',
      birthDate: new Date('2010-11-14'),
      emergencyContact: '+55 11 99876-5432',
      medicalConditions: 'TDAH',
      financialResponsibleId: responsible2.id,
    }
  ];

  const createdStudents = [];
  for (const studentData of students) {
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        organizationId: organization.id,
        email: studentData.email,
        password: studentPassword,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        phone: studentData.phone,
        birthDate: studentData.birthDate,
        role: UserRole.STUDENT,
        isActive: true,
      }
    });

    const student = await prisma.student.create({
      data: {
        id: uuidv4(),
        organizationId: organization.id,
        userId: user.id,
        financialResponsibleId: studentData.financialResponsibleId,
        category: studentData.birthDate > new Date('2006-01-01') ? StudentCategory.CHILD : StudentCategory.ADULT,
        emergencyContact: studentData.emergencyContact,
        medicalConditions: studentData.medicalConditions,
        isActive: true,
      }
    });

    createdStudents.push(student);

    // Create subscription for each student
    const randomPlan = [basicPlan, intermediatePlan, premiumPlan][Math.floor(Math.random() * 3)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));

    await prisma.studentSubscription.create({
      data: {
        id: uuidv4(),
        organizationId: organization.id,
        studentId: student.id,
        planId: randomPlan.id,
        currentPrice: randomPlan.price,
        billingType: randomPlan.billingType,
        startDate,
        nextBillingDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      }
    });
  }

  // Create classes
  console.log('🏛️ Creating classes...');
  const classesData = [
    {
      courseId: beginnerCourse.id,
      instructorId: instructor1.id,
      name: 'Krav Maga Iniciante - Manhã',
      description: 'Aula de Krav Maga para iniciantes',
      date: new Date(),
      startTime: new Date('2024-01-01T07:00:00Z'),
      endTime: new Date('2024-01-01T08:00:00Z'),
      maxStudents: 15,
      isActive: true,
    },
    {
      courseId: beginnerCourse.id,
      instructorId: instructor2.id,
      name: 'Krav Maga Iniciante - Noite',
      description: 'Aula de Krav Maga para iniciantes',
      date: new Date(),
      startTime: new Date('2024-01-01T19:00:00Z'),
      endTime: new Date('2024-01-01T20:00:00Z'),
      maxStudents: 15,
      isActive: true,
    },
    {
      courseId: intermediateCourse.id,
      instructorId: instructor1.id,
      name: 'Krav Maga Intermediário',
      description: 'Aula de Krav Maga nivel intermediário',
      date: new Date(),
      startTime: new Date('2024-01-01T20:30:00Z'),
      endTime: new Date('2024-01-01T21:45:00Z'),
      maxStudents: 12,
      isActive: true,
    }
  ];

  const createdClasses = [];
  for (const classData of classesData) {
    const createdClass = await prisma.class.create({
      data: {
        id: uuidv4(),
        organizationId: organization.id,
        ...classData,
      }
    });
    createdClasses.push(createdClass);
  }

  // Create sample attendances
  console.log('✅ Creating sample attendances...');
  for (const classItem of createdClasses) {
    // Random students attending each class
    const attendingStudents = createdStudents
      .filter(() => Math.random() > 0.3)
      .slice(0, Math.min(8, classItem.maxStudents));

    for (const student of attendingStudents) {
      await prisma.attendance.create({
        data: {
          id: uuidv4(),
          organizationId: organization.id,
          studentId: student.id,
          classId: classItem.id,
          isPresent: Math.random() > 0.1, // 90% attendance rate
          checkInTime: new Date(),
          notes: Math.random() > 0.8 ? 'Chegou 5 minutos atrasado' : null,
        }
      });
    }
  }

  console.log('✅ Realistic database seeding completed successfully!');
  console.log(`
📊 Summary:
- 1 Organization created: ${organization.name}
- 1 Martial Art created: ${kravMaga.name}
- 1 Admin user created
- 2 Instructors created  
- 7 Students created (2 with financial responsibles)
- 2 Financial responsibles created
- 2 Courses created
- 3 Lessons created
- 3 Billing plans created
- 3 Classes created
- Sample attendances and subscriptions created

🔑 Login credentials:
Admin: admin@elitekravmaga.com.br / admin123
Instructor 1: rafael.silva@elitekravmaga.com.br / instructor123
Instructor 2: maria.costa@elitekravmaga.com.br / instructor123
Student 1: joao.silva@email.com / student123
Student 2: ana.santos@email.com / student123
Student 3 (minor): marina.silva@email.com / student123
(... more students with password: student123)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });