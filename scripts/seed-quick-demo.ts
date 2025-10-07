#!/usr/bin/env npx tsx

/**
 * 🚀 SCRIPT RÁPIDO DE DADOS DEMO
 * ==============================
 * 
 * Script simplificado para inserção rápida de dados essenciais.
 * Use quando quiser apenas os dados básicos sem limpar tudo.
 * 
 * COMO USAR:
 * npm run seed:quick
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';
const PASSWORD_HASH = '$2a$12$RzWS/zz4OrQr4SuKSZxN2OuNTBrj4E/.fR7IdgWi.wlpiEmK23xrO';

async function quickSeed() {
  console.log('⚡ Inserção rápida de dados demo...');
  
  try {
    // 1. Garantir organização existe
    await prisma.organization.upsert({
      where: { id: ORG_ID },
      update: {},
      create: {
        id: ORG_ID,
        name: 'Academia Krav Maga Demo',
        slug: 'academia-demo',
        description: 'Academia de demonstração'
      }
    });

    // 2. Criar plano básico se não existir
    let basicPlan = await prisma.billingPlan.findFirst({
      where: { 
        organizationId: ORG_ID,
        name: 'Plano Básico'
      }
    });

    if (!basicPlan) {
      basicPlan = await prisma.billingPlan.create({
        data: {
          id: '18f7d0e9-c375-4792-afb3-f59b2e4c2157',
          organizationId: ORG_ID,
          name: 'Plano Básico',
          description: 'Acesso básico à academia',
          price: 150.00,
          billingType: 'MONTHLY',
          classesPerWeek: 2
        }
      });
    }

    // 3. Criar curso básico se não existir  
    let basicCourse = await prisma.course.findFirst({
      where: {
        organizationId: ORG_ID,
        name: 'Krav Maga - Iniciante'
      }
    });

    if (!basicCourse) {
      basicCourse = await prisma.course.create({
        data: {
          id: 'f7a3af16-7ccb-407c-8d5e-6d4b97cf8b53',
          organizationId: ORG_ID,
          name: 'Krav Maga - Iniciante',
          description: 'Curso introdutório com técnicas básicas',
          level: 'BEGINNER',
          duration: 12,
          classesPerWeek: 2,
          totalClasses: 24,
          objectives: ['Postura básica', 'Defesas iniciais']
        }
      });
    }

    // 4. Criar usuários demo se não existirem
    const demoUsers = [
      {
        email: 'joao@academia.demo',
        firstName: 'João', 
        lastName: 'Silva',
        role: 'STUDENT'
      },
      {
        email: 'ana@academia.demo',
        firstName: 'Ana',
        lastName: 'Santos', 
        role: 'STUDENT'
      }
    ];

    for (const userData of demoUsers) {
      let user = await prisma.user.findFirst({
        where: { 
          organizationId: ORG_ID, 
          email: userData.email 
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            organizationId: ORG_ID,
            email: userData.email,
            password: PASSWORD_HASH,
            role: userData.role as any,
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        });
      }

      // Criar estudante se for STUDENT
      if (userData.role === 'STUDENT') {
        const student = await prisma.student.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            organizationId: ORG_ID,
            userId: user.id,
            category: 'ADULT',
            gender: 'MASCULINO',
            physicalCondition: 'INICIANTE'
          }
        });

        // Criar assinatura ativa se não existir
        const existingSubscription = await prisma.studentSubscription.findFirst({
          where: {
            organizationId: ORG_ID,
            studentId: student.id,
            planId: basicPlan.id
          }
        });

        if (!existingSubscription) {
          await prisma.studentSubscription.create({
            data: {
              organizationId: ORG_ID,
              studentId: student.id,
              planId: basicPlan.id,
              status: 'ACTIVE',
              currentPrice: basicPlan.price,
              billingType: basicPlan.billingType
            }
          });
        }

        console.log(`✅ Usuário criado: ${user.firstName} ${user.lastName}`);
      }
    }

    // 5. Criar aula exemplo
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(20, 30, 0, 0);

    let demoClass = await prisma.class.findFirst({
      where: {
        organizationId: ORG_ID,
        id: 'f9eed5a6-0f6a-479e-be01-311b05cb3ff5'
      }
    });

    if (!demoClass) {
      // Buscar um instrutor existente ou criar um genérico
      let instructor = await prisma.instructor.findFirst({
        where: { organizationId: ORG_ID }
      });

      if (!instructor) {
        // Criar usuário instrutor
        const instructorUser = await prisma.user.create({
          data: {
            organizationId: ORG_ID,
            email: 'instrutor@academia.demo',
            password: PASSWORD_HASH,
            role: 'INSTRUCTOR',
            firstName: 'Instrutor',
            lastName: 'Demo'
          }
        });

        // Criar instrutor
        instructor = await prisma.instructor.create({
          data: {
            organizationId: ORG_ID,
            userId: instructorUser.id,
            specializations: ['Krav Maga']
          }
        });
      }

      demoClass = await prisma.class.create({
        data: {
          id: 'f9eed5a6-0f6a-479e-be01-311b05cb3ff5',
          organizationId: ORG_ID,
          instructorId: instructor.id,
          courseId: basicCourse.id,
          date: tomorrow,
          startTime: tomorrow,
          endTime: endTime,
          title: 'Krav Maga - Aula Demo',
          description: 'Aula demonstrativa'
        }
      });
    }

    // 6. Criar registro de presença
    const students = await prisma.student.findMany({
      where: { organizationId: ORG_ID }
    });

    if (students.length > 0) {
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          organizationId: ORG_ID,
          studentId: students[0].id,
          classId: 'f9eed5a6-0f6a-479e-be01-311b05cb3ff5'
        }
      });

      if (!existingAttendance) {
        await prisma.attendance.create({
          data: {
            organizationId: ORG_ID,
            studentId: students[0].id,
            classId: 'f9eed5a6-0f6a-479e-be01-311b05cb3ff5',
            status: 'PRESENT'
          }
        });
      }
    }

    console.log('\n🎉 Dados demo básicos criados com sucesso!');
    console.log('🌐 Acesse: http://localhost:3000');
    console.log('👤 Login: joao@academia.demo / demo123');

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  quickSeed().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

export { quickSeed };
