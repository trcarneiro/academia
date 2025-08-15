import { PrismaClient, UserRole, CourseLevel, BillingType, ClassStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function tryDelete(model: string) {
  const anyClient: any = prisma as any;
  const m = anyClient[model];
  if (m && typeof m.deleteMany === 'function') {
    try {
      await m.deleteMany();
    } catch {
      // ignore
    }
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    const modelsToClear = [
      // Gamification & feedback
      'pointsTransaction', 'badgeUnlock', 'badge',
      'feedbackActivity', 'feedbackLesson',
      // Assessments
      'assessmentAttempt', 'assessmentDefinition',
      'physicalTestAttempt', 'physicalTestDefinition',
      // Activities
      'classActivity', 'lessonPlanActivity',
      // Core flows
      'attendance', 'attendanceRecord',
      'challengeProgress', 'courseChallenge', 'weeklyChallenge',
      'studentSubscription', 'payment', 'asaasCustomer',
      'planCourse', 'studentCourse',
      'techniqueProgress', 'evaluationRecord', 'evaluation', 'progress', 'techniqueDetail',
      'class', 'classSchedule',
      'lessonPlan',
      'course', 'courseTemplate',
      'instructor', 'student', 'user',
      'martialArt', 'billingPlan',
      'organization',
    ];
    for (const m of modelsToClear) {
      await tryDelete(m);
    }
  }

  // Create base Organization
  console.log('🏢 Creating organization...');
  const org = await prisma.organization.create({
    data: {
      id: uuidv4(),
      name: 'Academia Demo',
      slug: 'demo',
      email: 'contato@academia.demo',
    },
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      email: 'admin@academia.demo',
      password: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // Create instructors
  console.log('🥋 Creating instructors...');
  const instructorPassword = await bcrypt.hash('instructor123', 12);

  const rafaelUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      email: 'rafael@academia.demo',
      password: instructorPassword,
      role: UserRole.INSTRUCTOR,
      firstName: 'Rafael',
      lastName: 'Silva',
    },
  });
  const mariaUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      email: 'maria@academia.demo',
      password: instructorPassword,
      role: UserRole.INSTRUCTOR,
      firstName: 'Maria',
      lastName: 'Costa',
    },
  });

  const instructor1 = await prisma.instructor.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      userId: rafaelUser.id,
      specializations: ['Krav Maga'],
      certifications: ['IKMF L3'],
      martialArts: ['Krav Maga'],
    },
  });

  const instructor2 = await prisma.instructor.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      userId: mariaUser.id,
      specializations: ['Self Defense'],
      certifications: ['IKMF L2'],
      martialArts: ['Krav Maga'],
    },
  });

  // Create martial art
  console.log('🗂️ Creating martial art...');
  const krav = await prisma.martialArt.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      name: 'Krav Maga',
      description: 'Sistema de defesa pessoal',
    },
  });

  // Create course
  console.log('📚 Creating course...');
  const course = await prisma.course.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      martialArtId: krav.id,
      name: 'Krav Maga - Iniciante',
      description: 'Curso introdutório com técnicas básicas',
      level: CourseLevel.BEGINNER,
      duration: 12,
      classesPerWeek: 2,
      totalClasses: 24,
      prerequisites: [],
      objectives: ['Postura básica', 'Defesas iniciais'],
      requirements: [],
      category: 'ADULT',
    },
  });

  // Create lesson plan
  console.log('📝 Creating lesson plan...');
  await prisma.lessonPlan.create({
    data: {
      id: uuidv4(),
      courseId: course.id,
      title: 'Aula 1 - Fundamentos',
      description: 'Postura, deslocamento e defesas básicas',
      lessonNumber: 1,
      weekNumber: 1,
      level: 1,
      warmup: { items: ['Corrida leve', 'Mobilidade articular'] },
      techniques: { items: ['Guarda alta', 'Deslocamento básico'] },
      simulations: { items: [] },
      cooldown: { items: ['Alongamento'] },
      objectives: ['Entender base e guarda'],
      equipment: ['Tatame'],
      activities: ['Apresentação', 'Aquecimento', 'Técnicas', 'Jogo'],
    },
  });

  // Create schedule and class
  console.log('⏰ Creating schedule and class...');
  const schedule = await prisma.classSchedule.create({
    data: {
      id: uuidv4(),
      dayOfWeek: 1,
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      maxStudents: 20,
    },
  });

  const klass = await prisma.class.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      scheduleId: schedule.id,
      instructorId: instructor1.id,
      courseId: course.id,
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      status: ClassStatus.SCHEDULED,
    },
  });

  // Create students
  console.log('🎓 Creating students...');
  const studentPassword = await bcrypt.hash('student123', 12);
  const studentsData = [
    { email: 'joao@academia.demo', firstName: 'João', lastName: 'Silva' },
    { email: 'ana@academia.demo', firstName: 'Ana', lastName: 'Santos' },
  ];

  const createdStudents = [] as { userId: string; studentId: string }[];
  for (const s of studentsData) {
    const u = await prisma.user.create({
      data: {
        id: uuidv4(),
        organizationId: org.id,
        email: s.email,
        password: studentPassword,
        role: UserRole.STUDENT,
        firstName: s.firstName,
        lastName: s.lastName,
      },
    });
    const st = await prisma.student.create({
      data: {
        id: uuidv4(),
        organizationId: org.id,
        userId: u.id,
      },
    });
    createdStudents.push({ userId: u.id, studentId: st.id });
  }

  // Create billing plan and subscription for first student
  console.log('💳 Creating billing plan and subscription...');
  const plan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      name: 'Plano Básico',
      description: '8 aulas/mês',
      price: '150.00',
      billingType: 'MONTHLY',
      classesPerWeek: 2,
      maxInstallments: 1,
      isRecurring: false,
      accessAllModalities: false,
      allowFreeze: true,
      freezeMaxDays: 30,
      isActive: true,
    },
  });

  await prisma.studentSubscription.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      studentId: createdStudents[0].studentId,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      currentPrice: '150.00',
      billingType: BillingType.MONTHLY,
      isActive: true,
      autoRenew: true,
    },
  });

  // Mark attendance for first student in the created class
  console.log('✅ Creating sample attendance...');
  await prisma.attendance.create({
    data: {
      id: uuidv4(),
      organizationId: org.id,
      studentId: createdStudents[0].studentId,
      classId: klass.id,
      status: 'PRESENT',
    },
  });

  console.log('🌾 Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });