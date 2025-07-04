import { PrismaClient, UserRole, ClassStatus, AttendanceStatus, CheckInMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    
    await prisma.attendance.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.studentSubscription.deleteMany();
    await prisma.asaasCustomer.deleteMany();
    await prisma.billingPlan.deleteMany();
    await prisma.financialResponsible.deleteMany();
    await prisma.class.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.techniqueProgress.deleteMany();
    await prisma.student.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.martialArt.deleteMany();
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@kravacademy.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  // Create instructors
  console.log('🥋 Creating instructors...');
  const instructorPassword = await bcrypt.hash('instructor123', 12);
  
  const instructor1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'rafael@kravacademy.com',
      password: instructorPassword,
      role: UserRole.INSTRUCTOR,
      instructor: {
        create: {
          id: uuidv4(),
          firstName: 'Rafael',
          lastName: 'Silva',
          phone: '+55 11 99999-1111',
          specialization: 'Krav Maga Level 3, Self Defense',
          certifications: 'IKMF Instructor Level 3, First Aid Certified',
        },
      },
    },
    include: { instructor: true },
  });

  const instructor2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'maria@kravacademy.com',
      password: instructorPassword,
      role: UserRole.INSTRUCTOR,
      instructor: {
        create: {
          id: uuidv4(),
          firstName: 'Maria',
          lastName: 'Costa',
          phone: '+55 11 99999-2222',
          specialization: 'Women Self Defense, Krav Maga Level 2',
          certifications: 'IKMF Instructor Level 2, Women Self Defense Specialist',
        },
      },
    },
    include: { instructor: true },
  });

  // Create course programs
  console.log('📚 Creating course programs...');
  const beginnerProgram = await prisma.courseProgram.create({
    data: {
      id: uuidv4(),
      name: 'Krav Maga - Iniciante',
      description: 'Programa para iniciantes no Krav Maga, focando em técnicas básicas de defesa pessoal',
      level: 'Beginner',
      duration: 12, // 12 weeks
    },
  });

  const intermediateProgram = await prisma.courseProgram.create({
    data: {
      id: uuidv4(),
      name: 'Krav Maga - Intermediário',
      description: 'Programa intermediário com técnicas avançadas e condicionamento físico',
      level: 'Intermediate',
      duration: 16, // 16 weeks
    },
  });

  const advancedProgram = await prisma.courseProgram.create({
    data: {
      id: uuidv4(),
      name: 'Krav Maga - Avançado',
      description: 'Programa avançado para praticantes experientes',
      level: 'Advanced',
      duration: 20, // 20 weeks
    },
  });

  // Create lesson plans
  console.log('📝 Creating lesson plans...');
  const lessonPlans = [
    {
      courseProgramId: beginnerProgram.id,
      title: 'Introdução ao Krav Maga',
      description: 'Princípios básicos, postura e distância',
      objectives: ['Entender os princípios do Krav Maga', 'Aprender postura básica', 'Entender distâncias de combate'],
      techniques: ['Stance básico', 'Movimento de pés', 'Guarda alta'],
      equipment: ['Luvas', 'Protetor bucal'],
      duration: 60,
      sequenceOrder: 1,
    },
    {
      courseProgramId: beginnerProgram.id,
      title: 'Defesas contra Socos',
      description: 'Técnicas de defesa contra ataques de soco direto',
      objectives: ['Defender socos diretos', 'Contra-atacar efetivamente'],
      techniques: ['Outside defense', 'Inside defense', 'Straight punch'],
      equipment: ['Luvas', 'Protetor bucal', 'Pads'],
      duration: 60,
      sequenceOrder: 2,
    },
    {
      courseProgramId: intermediateProgram.id,
      title: 'Defesa contra Agarramentos',
      description: 'Técnicas para se libertar de agarramentos',
      objectives: ['Libertar-se de agarramentos frontais', 'Contra-atacar após libertação'],
      techniques: ['Bear hug defense', 'Choke defense', 'Headlock escape'],
      equipment: ['Protetor bucal'],
      duration: 75,
      sequenceOrder: 1,
    },
  ];

  for (const lessonPlan of lessonPlans) {
    await prisma.lessonPlan.create({
      data: {
        id: uuidv4(),
        ...lessonPlan,
      },
    });
  }

  // Create class schedules
  console.log('⏰ Creating class schedules...');
  const schedules = [
    {
      dayOfWeek: 1, // Monday
      startTime: new Date('2024-01-01T07:00:00Z'),
      endTime: new Date('2024-01-01T08:00:00Z'),
      maxStudents: 15,
    },
    {
      dayOfWeek: 1, // Monday
      startTime: new Date('2024-01-01T19:00:00Z'),
      endTime: new Date('2024-01-01T20:00:00Z'),
      maxStudents: 20,
    },
    {
      dayOfWeek: 3, // Wednesday
      startTime: new Date('2024-01-01T07:00:00Z'),
      endTime: new Date('2024-01-01T08:00:00Z'),
      maxStudents: 15,
    },
    {
      dayOfWeek: 3, // Wednesday
      startTime: new Date('2024-01-01T19:00:00Z'),
      endTime: new Date('2024-01-01T20:00:00Z'),
      maxStudents: 20,
    },
    {
      dayOfWeek: 5, // Friday
      startTime: new Date('2024-01-01T07:00:00Z'),
      endTime: new Date('2024-01-01T08:00:00Z'),
      maxStudents: 15,
    },
    {
      dayOfWeek: 5, // Friday
      startTime: new Date('2024-01-01T19:00:00Z'),
      endTime: new Date('2024-01-01T20:00:00Z'),
      maxStudents: 20,
    },
    {
      dayOfWeek: 6, // Saturday
      startTime: new Date('2024-01-01T09:00:00Z'),
      endTime: new Date('2024-01-01T10:30:00Z'),
      maxStudents: 25,
    },
  ];

  const createdSchedules = [];
  for (const schedule of schedules) {
    const createdSchedule = await prisma.classSchedule.create({
      data: {
        id: uuidv4(),
        ...schedule,
      },
    });
    createdSchedules.push(createdSchedule);
  }

  // Create subscription plans
  console.log('💳 Creating subscription plans...');
  const plans = [
    {
      name: 'Plano Básico',
      description: 'Acesso a 8 aulas por mês',
      price: 150.00,
      duration: 1, // 1 month
      maxClasses: 8,
      features: ['8 aulas/mês', 'Acesso aos equipamentos', 'Suporte básico'],
    },
    {
      name: 'Plano Intermediário',
      description: 'Acesso a 12 aulas por mês',
      price: 200.00,
      duration: 1,
      maxClasses: 12,
      features: ['12 aulas/mês', 'Acesso aos equipamentos', 'Aulas especiais', 'Suporte prioritário'],
    },
    {
      name: 'Plano Ilimitado',
      description: 'Acesso ilimitado a todas as aulas',
      price: 300.00,
      duration: 1,
      maxClasses: 999,
      features: ['Aulas ilimitadas', 'Acesso total aos equipamentos', 'Aulas especiais', 'Personal training mensal', 'Suporte VIP'],
    },
  ];

  const createdPlans = [];
  for (const plan of plans) {
    const createdPlan = await prisma.plan.create({
      data: {
        id: uuidv4(),
        ...plan,
      },
    });
    createdPlans.push(createdPlan);
  }

  // Create students
  console.log('🎓 Creating students...');
  const studentPassword = await bcrypt.hash('student123', 12);
  
  const students = [
    {
      email: 'joao.silva@email.com',
      firstName: 'João',
      lastName: 'Silva',
      phone: '+55 11 99999-3333',
      emergencyContact: '+55 11 99999-3334',
      birthDate: new Date('1990-05-15'),
      medicalConditions: null,
    },
    {
      email: 'ana.santos@email.com',
      firstName: 'Ana',
      lastName: 'Santos',
      phone: '+55 11 99999-4444',
      emergencyContact: '+55 11 99999-4445',
      birthDate: new Date('1985-08-22'),
      medicalConditions: 'Alergia a látex',
    },
    {
      email: 'carlos.oliveira@email.com',
      firstName: 'Carlos',
      lastName: 'Oliveira',
      phone: '+55 11 99999-5555',
      emergencyContact: '+55 11 99999-5556',
      birthDate: new Date('1992-12-03'),
      medicalConditions: null,
    },
    {
      email: 'lucia.costa@email.com',
      firstName: 'Lúcia',
      lastName: 'Costa',
      phone: '+55 11 99999-6666',
      emergencyContact: '+55 11 99999-6667',
      birthDate: new Date('1988-03-18'),
      medicalConditions: null,
    },
    {
      email: 'pedro.martins@email.com',
      firstName: 'Pedro',
      lastName: 'Martins',
      phone: '+55 11 99999-7777',
      emergencyContact: '+55 11 99999-7778',
      birthDate: new Date('1995-07-11'),
      medicalConditions: 'Problema no joelho direito',
    },
  ];

  const createdStudents = [];
  for (let i = 0; i < students.length; i++) {
    const studentData = students[i];
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: studentData.email,
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            id: uuidv4(),
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            phone: studentData.phone,
            emergencyContact: studentData.emergencyContact,
            birthDate: studentData.birthDate,
            medicalConditions: studentData.medicalConditions,
            enrollmentDate: dayjs().subtract(Math.floor(Math.random() * 180), 'days').toDate(),
          },
        },
      },
      include: { student: true },
    });

    if (user.student) {
      createdStudents.push(user.student);

      // Create subscription for each student
      const randomPlan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
      const startDate = dayjs().subtract(Math.floor(Math.random() * 30), 'days');
      
      await prisma.subscription.create({
        data: {
          id: uuidv4(),
          studentId: user.student.id,
          planId: randomPlan.id,
          startDate: startDate.toDate(),
          endDate: startDate.add(randomPlan.duration, 'month').toDate(),
        },
      });
    }
  }

  // Create classes for the next 30 days
  console.log('🏛️ Creating classes...');
  const createdClasses = [];
  
  for (let day = 0; day < 30; day++) {
    const currentDate = dayjs().add(day, 'day');
    const dayOfWeek = currentDate.day();
    
    // Find schedules for this day of week
    const daySchedules = createdSchedules.filter(s => s.dayOfWeek === dayOfWeek);
    
    for (const schedule of daySchedules) {
      // Randomly assign instructor and course program
      const instructor = Math.random() > 0.5 ? instructor1.instructor! : instructor2.instructor!;
      const courseProgram = [beginnerProgram, intermediateProgram, advancedProgram][Math.floor(Math.random() * 3)];
      
      const classDate = currentDate.hour(schedule.startTime.getUTCHours()).minute(schedule.startTime.getUTCMinutes());
      
      const createdClass = await prisma.class.create({
        data: {
          id: uuidv4(),
          scheduleId: schedule.id,
          instructorId: instructor.id,
          courseProgramId: courseProgram.id,
          date: classDate.toDate(),
          startTime: classDate.toDate(),
          endTime: classDate.hour(schedule.endTime.getUTCHours()).minute(schedule.endTime.getUTCMinutes()).toDate(),
          status: day < 0 ? ClassStatus.COMPLETED : ClassStatus.SCHEDULED,
        },
      });
      
      createdClasses.push(createdClass);
    }
  }

  // Create sample attendances for past classes
  console.log('✅ Creating sample attendances...');
  for (const classItem of createdClasses.slice(0, 20)) { // Only for first 20 classes
    // Randomly select 5-15 students for each class
    const numStudents = Math.floor(Math.random() * 10) + 5;
    const shuffledStudents = [...createdStudents].sort(() => 0.5 - Math.random());
    const selectedStudents = shuffledStudents.slice(0, numStudents);
    
    for (const student of selectedStudents) {
      // 85% chance of being present, 10% late, 5% absent
      const rand = Math.random();
      let status: AttendanceStatus;
      let checkInTime: Date | null = null;
      let checkInMethod: CheckInMethod | null = null;
      
      if (rand < 0.85) {
        status = AttendanceStatus.PRESENT;
        checkInTime = dayjs(classItem.startTime).subtract(Math.floor(Math.random() * 15), 'minutes').toDate();
        checkInMethod = Math.random() > 0.7 ? CheckInMethod.QR_CODE : CheckInMethod.MANUAL;
      } else if (rand < 0.95) {
        status = AttendanceStatus.LATE;
        checkInTime = dayjs(classItem.startTime).add(Math.floor(Math.random() * 10) + 1, 'minutes').toDate();
        checkInMethod = CheckInMethod.MANUAL;
      } else {
        status = AttendanceStatus.ABSENT;
      }
      
      await prisma.attendance.create({
        data: {
          id: uuidv4(),
          studentId: student.id,
          classId: classItem.id,
          status,
          checkInTime,
          checkInMethod,
          location: status !== AttendanceStatus.ABSENT ? 'Academia Principal' : null,
        },
      });
    }
    
    // Update class with actual students count
    const attendanceCount = await prisma.attendance.count({
      where: {
        classId: classItem.id,
        status: {
          in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
        },
      },
    });
    
    await prisma.class.update({
      where: { id: classItem.id },
      data: { actualStudents: attendanceCount },
    });
  }

  // Create sample evaluations
  console.log('📊 Creating sample evaluations...');
  for (const student of createdStudents.slice(0, 3)) {
    await prisma.evaluation.create({
      data: {
        id: uuidv4(),
        studentId: student.id,
        instructorId: instructor1.instructor!.id,
        type: 'TECHNICAL',
        score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
        comments: 'Boa evolução técnica. Continue praticando os movimentos básicos.',
        evaluatedAt: dayjs().subtract(Math.floor(Math.random() * 60), 'days').toDate(),
      },
    });
  }

  // Create sample progress records
  console.log('📈 Creating sample progress records...');
  for (const student of createdStudents.slice(0, 2)) {
    await prisma.progressRecord.create({
      data: {
        id: uuidv4(),
        studentId: student.id,
        level: 'Yellow Belt',
        technique: 'Basic Punches',
        mastery: Math.floor(Math.random() * 30) + 70,
        achievedAt: dayjs().subtract(Math.floor(Math.random() * 90), 'days').toDate(),
        notes: 'Demonstrou boa execução das técnicas básicas de soco.',
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
- 1 Admin user created
- 2 Instructors created  
- 5 Students created
- 3 Course programs created
- 3 Lesson plans created
- 7 Class schedules created
- 3 Subscription plans created
- ~210 Classes created (30 days)
- Sample attendances created
- Sample evaluations created
- Sample progress records created

🔑 Login credentials:
Admin: admin@kravacademy.com / admin123
Instructor 1: rafael@kravacademy.com / instructor123
Instructor 2: maria@kravacademy.com / instructor123
Student 1: joao.silva@email.com / student123
Student 2: ana.santos@email.com / student123
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