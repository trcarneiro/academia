#!/usr/bin/env npx tsx

/**
 * 🎯 ACADEMIA KRAV MAGA - SCRIPT DE INSERÇÃO DE DADOS DEMO
 * ======================================================
 * 
 * Script completo para inserção de dados demo na aplicação
 * Academia Krav Maga v2.0. Execute este script sempre que
 * precisar recriar os dados de demonstração.
 * 
 * COMO USAR:
 * 1. npm run seed:demo
 * 2. Ou execute: npx tsx scripts/seed-demo-data.ts
 * 
 * IMPORTANTE: Este script limpa e recria TODOS os dados demo!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configurações
const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb'; // ID fixo da organização demo
const PASSWORD_HASH = '$2a$12$RzWS/zz4OrQr4SuKSZxN2OuNTBrj4E/.fR7IdgWi.wlpiEmK23xrO'; // Hash para "demo123"

// 📊 Dados Demo Estruturados
const DEMO_DATA = {
  // 🏢 Organização
  organization: {
    id: ORG_ID,
    name: 'Academia Krav Maga Demo',
    slug: 'academia-demo',
    description: 'Academia de demonstração do sistema',
    email: 'contato@academia-demo.com',
    phone: '(11) 99999-9999',
    address: 'Rua Demo, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  },

  // 🏛️ Unidades
  units: [
    {
      id: 'unit-1',
      name: 'Unidade Centro',
      address: 'Rua Centro, 100',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 1111-1111'
    }
  ],

  // 🥋 Artes Marciais
  martialArts: [
    {
      id: 'krav-maga-1',
      name: 'Krav Maga',
      description: 'Sistema de combate desenvolvido para o exército israelense',
      hasGrading: true,
      maxLevel: 10
    }
  ],

  // 👨‍🏫 Instrutores
  instructors: [
    {
      firstName: 'Marcus',
      lastName: 'Silva',
      email: 'marcus@academia.demo',
      specializations: ['Krav Maga', 'Defesa Pessoal'],
      certifications: ['Instrutor Nível 3', 'Primeiros Socorros'],
      experience: '15 anos de experiência em artes marciais'
    },
    {
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana.costa@academia.demo',
      specializations: ['Krav Maga Feminino', 'Autodefesa'],
      certifications: ['Instrutora Nível 2', 'Especialista em Defesa Feminina'],
      experience: '8 anos focada em defesa pessoal feminina'
    },
    {
      firstName: 'Roberto',
      lastName: 'Santos',
      email: 'roberto@academia.demo',
      specializations: ['Krav Maga Avançado', 'Combate'],
      certifications: ['Instrutor Master', 'Técnico em Segurança'],
      experience: '20 anos em segurança e combate'
    }
  ],

  // 🎓 Cursos
  courses: [
    {
      id: 'course-iniciante',
      name: 'Krav Maga - Iniciante',
      description: 'Curso introdutório com técnicas básicas de defesa pessoal',
      level: 'BEGINNER',
      duration: 12,
      classesPerWeek: 2,
      totalClasses: 24,
      category: 'ADULT',
      objectives: [
        'Aprender postura básica de combate',
        'Dominar defesas contra agarrões',
        'Desenvolver reflexos defensivos',
        'Fortalecer condicionamento físico'
      ]
    },
    {
      id: 'course-intermediario',
      name: 'Krav Maga - Intermediário',
      description: 'Técnicas avançadas e combinações de movimentos',
      level: 'INTERMEDIATE',
      duration: 16,
      classesPerWeek: 3,
      totalClasses: 48,
      category: 'ADULT',
      objectives: [
        'Combinar técnicas básicas',
        'Defesa contra armas brancas',
        'Trabalho de solo e chão',
        'Cenários de múltiplos atacantes'
      ]
    }
  ],

  // 💰 Planos de Cobrança
  billingPlans: [
    {
      id: 'plan-basico',
      name: 'Plano Básico',
      description: 'Acesso a 2 aulas por semana',
      price: 150.00,
      billingType: 'MONTHLY',
      classesPerWeek: 2,
      category: 'ADULT',
      features: {
        aulas: '2x por semana',
        horarios: 'Flexíveis',
        acesso: 'Todas as modalidades básicas'
      }
    },
    {
      id: 'plan-premium',
      name: 'Plano Premium',
      description: 'Acesso ilimitado + acompanhamento personalizado',
      price: 250.00,
      billingType: 'MONTHLY',
      classesPerWeek: 5,
      category: 'ADULT',
      isUnlimitedAccess: true,
      hasPersonalTraining: true,
      features: {
        aulas: 'Ilimitadas',
        personal: '2x por mês incluído',
        nutricao: 'Consulta incluída',
        horarios: 'Acesso total'
      }
    },
    {
      id: 'plan-teen',
      name: 'Plano Adolescente',
      description: 'Plano especial para adolescentes 13-17 anos',
      price: 120.00,
      billingType: 'MONTHLY',
      classesPerWeek: 2,
      category: 'TEEN',
      features: {
        aulas: '2x por semana',
        horarios: 'Especiais para teens',
        foco: 'Disciplina e autoconfiança'
      }
    }
  ],

  // 👥 Estudantes
  students: [
    {
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@academia.demo',
      gender: 'MASCULINO',
      age: 28,
      physicalCondition: 'INICIANTE',
      category: 'ADULT',
      planId: 'plan-basico'
    },
    {
      firstName: 'Ana',
      lastName: 'Santos',
      email: 'ana@academia.demo',
      gender: 'FEMININO',
      age: 32,
      physicalCondition: 'INTERMEDIARIO',
      category: 'ADULT',
      planId: 'plan-premium'
    },
    {
      firstName: 'Carlos',
      lastName: 'Oliveira',
      email: 'carlos@academia.demo',
      gender: 'MASCULINO',
      age: 25,
      physicalCondition: 'AVANCADO',
      category: 'ADULT',
      planId: 'plan-premium'
    },
    {
      firstName: 'Maria',
      lastName: 'Costa',
      email: 'maria@academia.demo',
      gender: 'FEMININO',
      age: 29,
      physicalCondition: 'INICIANTE',
      category: 'ADULT',
      planId: 'plan-basico'
    },
    {
      firstName: 'Pedro',
      lastName: 'Ferreira',
      email: 'pedro@academia.demo',
      gender: 'MASCULINO',
      age: 15,
      physicalCondition: 'INICIANTE',
      category: 'TEEN',
      planId: 'plan-teen'
    },
    {
      firstName: 'Julia',
      lastName: 'Almeida',
      email: 'julia@academia.demo',
      gender: 'FEMININO',
      age: 16,
      physicalCondition: 'INTERMEDIARIO',
      category: 'TEEN',
      planId: 'plan-teen'
    }
  ],

  // 📚 Técnicas
  techniques: [
    {
      name: 'Posição de Combate',
      description: 'Postura básica defensiva do Krav Maga',
      difficulty: 1,
      category: 'POSTURA',
      objectives: ['Equilíbrio', 'Prontidão', 'Mobilidade'],
      instructions: [
        'Pés afastados na largura dos ombros',
        'Perna dominante levemente atrás',
        'Joelhos semiflexionados',
        'Mãos na altura do peito'
      ]
    },
    {
      name: 'Straight Punch',
      description: 'Soco reto básico do Krav Maga',
      difficulty: 2,
      category: 'ATAQUE',
      prerequisites: ['Posição de Combate'],
      objectives: ['Força', 'Precisão', 'Velocidade'],
      instructions: [
        'Partir da posição de combate',
        'Rotação do quadril',
        'Extensão completa do braço',
        'Retorno à guarda'
      ]
    }
  ],

  // 🏃 Atividades
  activities: [
    {
      name: 'Aquecimento Dinâmico',
      description: 'Sequência de aquecimento com movimentos funcionais',
      duration: 15,
      category: 'AQUECIMENTO',
      difficulty: 1
    },
    {
      name: 'Treino de Combos',
      description: 'Prática de combinações de técnicas',
      duration: 20,
      category: 'TECNICA',
      difficulty: 3
    }
  ]
};

// 🛠️ Funções de Inserção

async function clearDemoData() {
  console.log('🧹 Limpando dados demo existentes...');
  
  // Deletar em ordem para respeitar foreign keys
  const tables = [
    'attendances',
    'student_subscriptions', 
    'payments',
    'course_techniques',
    'lesson_plans',
    'classes',
    'students',
    'instructors', 
    'billing_plans',
    'courses',
    'techniques',
    'martial_arts',
    'units',
    'users'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE organization_id = $1`, ORG_ID);
      console.log(`   ✅ ${table} limpa`);
    } catch (error) {
      console.log(`   ⚠️  ${table} - ${error.message}`);
    }
  }
}

async function createOrganization() {
  console.log('🏢 Criando organização...');
  
  const org = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: DEMO_DATA.organization,
    create: DEMO_DATA.organization
  });
  
  console.log(`   ✅ Organização: ${org.name}`);
  return org;
}

async function createUnits() {
  console.log('🏛️  Criando unidades...');
  
  const units = [];
  for (const unitData of DEMO_DATA.units) {
    const unit = await prisma.unit.create({
      data: {
        ...unitData,
        organizationId: ORG_ID
      }
    });
    units.push(unit);
    console.log(`   ✅ Unidade: ${unit.name}`);
  }
  
  return units;
}

async function createMartialArts() {
  console.log('🥋 Criando artes marciais...');
  
  const martialArts = [];
  for (const artData of DEMO_DATA.martialArts) {
    const art = await prisma.martialArt.create({
      data: {
        ...artData,
        organizationId: ORG_ID
      }
    });
    martialArts.push(art);
    console.log(`   ✅ Arte Marcial: ${art.name}`);
  }
  
  return martialArts;
}

async function createInstructors() {
  console.log('👨‍🏫 Criando instrutores...');
  
  const instructors = [];
  for (const instrData of DEMO_DATA.instructors) {
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        organizationId: ORG_ID,
        email: instrData.email,
        password: PASSWORD_HASH,
        role: 'INSTRUCTOR',
        firstName: instrData.firstName,
        lastName: instrData.lastName
      }
    });

    // Criar instrutor
    const instructor = await prisma.instructor.create({
      data: {
        organizationId: ORG_ID,
        userId: user.id,
        specializations: instrData.specializations,
        certifications: instrData.certifications,
        bio: instrData.experience,
        martialArts: ['Krav Maga']
      }
    });

    instructors.push(instructor);
    console.log(`   ✅ Instrutor: ${user.firstName} ${user.lastName}`);
  }
  
  return instructors;
}

async function createCourses() {
  console.log('🎓 Criando cursos...');
  
  const courses = [];
  for (const courseData of DEMO_DATA.courses) {
    const course = await prisma.course.create({
      data: {
        ...courseData,
        organizationId: ORG_ID,
        totalLessons: courseData.totalClasses // Compatibilidade
      }
    });
    courses.push(course);
    console.log(`   ✅ Curso: ${course.name}`);
  }
  
  return courses;
}

async function createBillingPlans(courses: any[]) {
  console.log('💰 Criando planos de cobrança...');
  
  const plans = [];
  for (const planData of DEMO_DATA.billingPlans) {
    try {
      const plan = await prisma.billingPlan.create({
        data: {
          ...planData,
          organizationId: ORG_ID,
          courseId: courses[0]?.id // Associar ao primeiro curso disponível
        }
      });
      plans.push(plan);
      console.log(`   ✅ Plano: ${plan.name} - R$ ${plan.price}`);
    } catch (error) {
      console.log(`   ❌ Erro ao criar plano ${planData.name}: ${error.message}`);
    }
  }
  
  return plans;
}

async function createStudents(plans: any[]) {
  console.log('👥 Criando estudantes...');
  
  const students = [];
  for (const studentData of DEMO_DATA.students) {
    // Encontrar plano
    const plan = plans.find(p => p.id === studentData.planId);
    if (!plan) {
      console.log(`   ⚠️  Plano ${studentData.planId} não encontrado para ${studentData.firstName}`);
      continue;
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        organizationId: ORG_ID,
        email: studentData.email,
        password: PASSWORD_HASH,
        role: 'STUDENT',
        firstName: studentData.firstName,
        lastName: studentData.lastName
      }
    });

    // Criar estudante
    const student = await prisma.student.create({
      data: {
        organizationId: ORG_ID,
        userId: user.id,
        gender: studentData.gender,
        age: studentData.age,
        physicalCondition: studentData.physicalCondition,
        category: studentData.category
      }
    });

    // Criar assinatura
    await prisma.studentSubscription.create({
      data: {
        organizationId: ORG_ID,
        studentId: student.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPrice: plan.price,
        billingType: plan.billingType
      }
    });

    students.push(student);
    console.log(`   ✅ Estudante: ${user.firstName} ${user.lastName} (${plan.name})`);
  }
  
  return students;
}

async function createTechniques() {
  console.log('📚 Criando técnicas...');
  
  const techniques = [];
  for (const techData of DEMO_DATA.techniques) {
    const technique = await prisma.technique.create({
      data: {
        ...techData,
        slug: techData.name.toLowerCase().replace(/\s+/g, '-')
      }
    });
    techniques.push(technique);
    console.log(`   ✅ Técnica: ${technique.name}`);
  }
  
  return techniques;
}

async function createActivities() {
  console.log('🏃 Criando atividades...');
  
  const activities = [];
  for (const actData of DEMO_DATA.activities) {
    const activity = await prisma.activity.create({
      data: {
        ...actData,
        organizationId: ORG_ID
      }
    });
    activities.push(activity);
    console.log(`   ✅ Atividade: ${activity.name}`);
  }
  
  return activities;
}

async function createSampleClasses(courses: any[], instructors: any[], students: any[]) {
  console.log('📅 Criando aulas exemplo...');
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Criar algumas aulas para demonstração
  const classes = [];
  
  for (let i = 0; i < 3; i++) {
    const classDate = new Date(tomorrow);
    classDate.setDate(classDate.getDate() + i);
    classDate.setHours(19, 0, 0, 0); // 19:00
    
    const endTime = new Date(classDate);
    endTime.setHours(20, 30, 0, 0); // 20:30
    
    const classObj = await prisma.class.create({
      data: {
        organizationId: ORG_ID,
        instructorId: instructors[i % instructors.length]?.id,
        courseId: courses[0]?.id,
        date: classDate,
        startTime: classDate,
        endTime: endTime,
        title: `Krav Maga - ${classDate.toLocaleDateString('pt-BR')}`,
        description: 'Aula de técnicas básicas de Krav Maga'
      }
    });
    
    classes.push(classObj);
    
    // Criar algumas presenças
    if (students.length > 0) {
      await prisma.attendance.create({
        data: {
          organizationId: ORG_ID,
          studentId: students[0].id,
          classId: classObj.id,
          status: 'PRESENT'
        }
      });
    }
    
    console.log(`   ✅ Aula: ${classObj.title}`);
  }
  
  return classes;
}

// 🚀 Função Principal
async function seedDemoData() {
  console.log('🎯 INICIANDO INSERÇÃO DE DADOS DEMO');
  console.log('=====================================\n');
  
  try {
    // Limpar dados existentes
    await clearDemoData();
    
    // Criar dados em ordem
    const organization = await createOrganization();
    const units = await createUnits();
    const martialArts = await createMartialArts();
    const instructors = await createInstructors();
    const courses = await createCourses();
    const plans = await createBillingPlans(courses);
    const students = await createStudents(plans);
    const techniques = await createTechniques();
    const activities = await createActivities();
    const classes = await createSampleClasses(courses, instructors, students);
    
    console.log('\n🎉 DADOS DEMO INSERIDOS COM SUCESSO!');
    console.log('====================================');
    console.log(`📊 Resumo:`);
    console.log(`   • ${instructors.length} instrutores`);
    console.log(`   • ${courses.length} cursos`);
    console.log(`   • ${plans.length} planos de cobrança`);
    console.log(`   • ${students.length} estudantes`);
    console.log(`   • ${techniques.length} técnicas`);
    console.log(`   • ${activities.length} atividades`);
    console.log(`   • ${classes.length} aulas exemplo`);
    console.log('\n🌐 Acesse: http://localhost:3000');
    console.log('👤 Login: joao@academia.demo / demo123');
    
  } catch (error) {
    console.error('❌ Erro durante a inserção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 🎯 Executar script
if (require.main === module) {
  seedDemoData()
    .catch((error) => {
      console.error('💥 Falha fatal:', error);
      process.exit(1);
    });
}

export { seedDemoData };
