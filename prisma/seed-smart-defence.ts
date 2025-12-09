/**
 * Seed Smart Defence - Academia Krav Maga BH
 * Organização: Smart Defence
 * Unidade: Santo Agostinho (2 tatames)
 * 
 * Planos, horários e estrutura completa
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🥋 Iniciando seed Smart Defence...\n');

  // ===== 1. ORGANIZAÇÃO =====
  console.log('📋 Criando organização...');
  const organization = await prisma.organization.upsert({
    where: { slug: 'smart-defence' },
    update: {},
    create: {
      name: 'Smart Defence',
      slug: 'smart-defence',
      email: 'contato@smartdefence.com.br',
      phone: '(31) 99999-9999',
      address: 'Rua Santo Agostinho',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000',
      isActive: true
    }
  });
  console.log(`✅ Organização: ${organization.name} (${organization.id})\n`);

  // ===== 2. USUÁRIO ADMIN =====
  console.log('👤 Criando usuário admin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  let adminUser = await prisma.user.findFirst({
    where: { 
      email: 'admin@smartdefence.com.br',
      organizationId: organization.id
    }
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        organizationId: organization.id,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@smartdefence.com.br',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        canApproveAgentTasks: true,
        canExecuteAgentTasks: true,
        canCreateAgents: true,
        canDeleteAgents: true,
        maxTaskPriority: 'URGENT',
        canApproveCategories: ['DATABASE_CHANGE', 'WHATSAPP_MESSAGE', 'EMAIL', 'SMS', 'MARKETING', 'BILLING', 'ENROLLMENT']
      }
    });
    console.log(`✅ Admin criado: ${adminUser.email}`);
  } else {
    console.log(`✅ Admin já existe: ${adminUser.email}`);
  }
  console.log();

  // ===== 3. UNIDADE SANTO AGOSTINHO =====
  console.log('🏢 Criando unidade Santo Agostinho...');
  const unit = await prisma.unit.upsert({
    where: { 
      organizationId_name: {
        organizationId: organization.id,
        name: 'Santo Agostinho'
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Santo Agostinho',
      address: 'Rua Santo Agostinho',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000',
      phone: '(31) 99999-9999',
      email: 'santoagostinho@smartdefence.com.br',
      isActive: true
    }
  });
  console.log(`✅ Unidade: ${unit.name} (${unit.id})\n`);

  // ===== 4. TATAMES =====
  console.log('🥋 Criando tatames...');
  
  const tatame1 = await prisma.trainingArea.upsert({
    where: {
      unitId_name: {
        unitId: unit.id,
        name: 'Tatame 1 - Jiu-Jitsu'
      }
    },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Tatame 1 - Jiu-Jitsu',
      capacity: 20,
      areaType: 'TATAME',
      isActive: true,
  equipment: ['Tatame', 'Kimono', 'Faixa'],
      description: 'Tatame especializado em Jiu-Jitsu Brasileiro'
    }
  });

  const tatame2 = await prisma.trainingArea.upsert({
    where: {
      unitId_name: {
        unitId: unit.id,
        name: 'Tatame 2 - Defesa Pessoal & Boxe'
      }
    },
    update: {},
    create: {
      unitId: unit.id,
      name: 'Tatame 2 - Defesa Pessoal & Boxe',
      capacity: 20,
      areaType: 'TATAME',
      isActive: true,
  equipment: ['Tatame', 'Luvas de Boxe', 'Saco de Pancada', 'Manopla'],
      description: 'Tatame para Krav Maga, Defesa Pessoal e Boxe'
    }
  });
  
  console.log(`✅ ${tatame1.name}`);
  console.log(`✅ ${tatame2.name}\n`);

  // ===== 5. PLANOS ADULTOS =====
  console.log('💰 Criando plano único...');
  
  let planoIlimitado = await prisma.billingPlan.findFirst({
    where: {
      organizationId: organization.id,
      name: 'Plano Ilimitado'
    }
  });

  if (!planoIlimitado) {
    planoIlimitado = await prisma.billingPlan.create({
      data: {
        organizationId: organization.id,
        name: 'Plano Ilimitado',
        description: 'Acesso total a todas as modalidades e horários.',
        price: 250.00,
        billingType: 'MONTHLY',
        isActive: true,
        isUnlimitedAccess: true,
        accessAllModalities: true,
        features: JSON.stringify([
          'Acesso ilimitado a todas as modalidades',
          'Horários livres',
          'Sem taxa de matrícula',
          'Cancele quando quiser'
        ])
      }
    });
  } else {
    // Ensure price is correct
    await prisma.billingPlan.update({
      where: { id: planoIlimitado.id },
      data: { 
        price: 250.00,
        isActive: true,
        isUnlimitedAccess: true,
        accessAllModalities: true
      }
    });
  }

  console.log(`✅ ${planoIlimitado.name} - R$ ${planoIlimitado.price}/mês\n`);

  // Deactivate other plans if they exist (cleanup)
  await prisma.billingPlan.updateMany({
    where: {
      organizationId: organization.id,
      id: { not: planoIlimitado.id },
      isActive: true
    },
    data: { isActive: false }
  });



  // ===== 7. CRIAR CURSOS BÁSICOS =====
  console.log('\n📚 Criando cursos básicos...');
  
  let cursoJJ = await prisma.course.findFirst({
    where: {
      organizationId: organization.id,
      name: 'Jiu-Jitsu'
    }
  });

  if (!cursoJJ) {
    cursoJJ = await prisma.course.create({
      data: {
        organizationId: organization.id,
        name: 'Jiu-Jitsu',
        description: 'Programa completo de Jiu-Jitsu Brasileiro',
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 96, // 2x semana * 4 semanas * 12 meses
        classesPerWeek: 2,
        minAge: 4,
        category: 'ADULT',
        isActive: true
      }
    });
  }
  console.log(`✅ Curso: ${cursoJJ.name}`);

  let cursoKM = await prisma.course.findFirst({
    where: {
      organizationId: organization.id,
      name: 'Krav Maga'
    }
  });

  if (!cursoKM) {
    cursoKM = await prisma.course.create({
      data: {
        organizationId: organization.id,
        name: 'Krav Maga',
        description: 'Sistema de Defesa Pessoal Israelense',
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 96,
        classesPerWeek: 2,
        minAge: 4,
        category: 'ADULT',
        isActive: true
      }
    });
  }
  console.log(`✅ Curso: ${cursoKM.name}`);

  let cursoBoxe = await prisma.course.findFirst({
    where: {
      organizationId: organization.id,
      name: 'Boxe'
    }
  });

  if (!cursoBoxe) {
    cursoBoxe = await prisma.course.create({
      data: {
        organizationId: organization.id,
        name: 'Boxe',
        description: 'Programa de Boxe para todos os níveis',
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 96,
        classesPerWeek: 2,
        minAge: 16,
        category: 'ADULT',
        isActive: true
      }
    });
  }
  console.log(`✅ Curso: ${cursoBoxe.name}`);

  // ===== 8. TURMAS - TATAME 1 (JIU-JITSU) =====
  console.log('\n📅 Criando turmas Tatame 1 - Jiu-Jitsu...');
  
  // Terça e Quinta
  const turmasJJ = [
    {
      name: 'Jiu-Jitsu Adulto - Almoço',
      description: 'Jiu-Jitsu para adultos - Horário de almoço',
      dayOfWeek: 2, // Terça
      startTime: '12:00',
      endTime: '13:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Jiu-Jitsu Adulto - Almoço',
      description: 'Jiu-Jitsu para adultos - Horário de almoço',
      dayOfWeek: 4, // Quinta
      startTime: '12:00',
      endTime: '13:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Jiu-Jitsu Kids 1',
      description: 'Jiu-Jitsu para crianças iniciantes (4-6 anos)',
      dayOfWeek: 2,
      startTime: '16:30',
      endTime: '17:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Jiu-Jitsu Kids 1',
      description: 'Jiu-Jitsu para crianças iniciantes (4-6 anos)',
      dayOfWeek: 4,
      startTime: '16:30',
      endTime: '17:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Jiu-Jitsu Kids 2-3',
      description: 'Jiu-Jitsu para crianças intermediário/avançado (7-12 anos)',
      dayOfWeek: 2,
      startTime: '17:15',
      endTime: '18:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Jiu-Jitsu Kids 2-3',
      description: 'Jiu-Jitsu para crianças intermediário/avançado (7-12 anos)',
      dayOfWeek: 4,
      startTime: '17:15',
      endTime: '18:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Jiu-Jitsu Adulto - Noite',
      description: 'Jiu-Jitsu para adultos - Horário noturno',
      dayOfWeek: 2,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Jiu-Jitsu Adulto - Noite',
      description: 'Jiu-Jitsu para adultos - Horário noturno',
      dayOfWeek: 4,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    }
  ];

  for (const turma of turmasJJ) {
    let turmaExiste = await prisma.turma.findFirst({
      where: {
        organizationId: organization.id,
        name: `${turma.name} - ${turma.dayOfWeek === 2 ? 'Ter' : turma.dayOfWeek === 4 ? 'Qui' : 'Sáb'} ${turma.startTime}`
      }
    });

    if (!turmaExiste) {
      turmaExiste = await prisma.turma.create({
        data: {
          organizationId: organization.id,
          courseId: cursoJJ.id,
          instructorId: adminUser.id,
          unitId: unit.id,
          trainingAreaId: tatame1.id,
          name: `${turma.name} - ${turma.dayOfWeek === 2 ? 'Ter' : turma.dayOfWeek === 4 ? 'Qui' : 'Sáb'} ${turma.startTime}`,
          description: turma.description,
          maxStudents: turma.capacity,
          startDate: new Date(),
          schedule: JSON.stringify({ dayOfWeek: turma.dayOfWeek, startTime: turma.startTime, endTime: turma.endTime }),
          isActive: true
        }
      });
    }
    console.log(`  ✅ ${turma.name} - ${turma.dayOfWeek === 2 ? 'Ter' : 'Qui'} ${turma.startTime}-${turma.endTime}`);
  }

  // ===== 8. TURMAS - TATAME 2 (DEFESA PESSOAL & BOXE) =====
  console.log('\n📅 Criando turmas Tatame 2 - Defesa Pessoal & Boxe...');
  
  const turmasTatame2 = [
    // Segunda e Quarta
    {
      name: 'Krav Maga Kids 1',
      description: 'Krav Maga para crianças iniciantes (4-6 anos)',
      dayOfWeek: 1, // Segunda
      startTime: '16:30',
      endTime: '17:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Krav Maga Kids 1',
      description: 'Krav Maga para crianças iniciantes (4-6 anos)',
      dayOfWeek: 3, // Quarta
      startTime: '16:30',
      endTime: '17:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Krav Maga Kids 2-3',
      description: 'Krav Maga para crianças intermediário/avançado (7-12 anos)',
      dayOfWeek: 1,
      startTime: '18:15',
      endTime: '19:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Krav Maga Kids 2-3',
      description: 'Krav Maga para crianças intermediário/avançado (7-12 anos)',
      dayOfWeek: 3,
      startTime: '18:15',
      endTime: '19:00',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Defesa Pessoal Adulto',
      description: 'Krav Maga e técnicas de defesa pessoal para adultos',
      dayOfWeek: 1,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Adulto',
      description: 'Krav Maga e técnicas de defesa pessoal para adultos',
      dayOfWeek: 3,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Avançado',
      description: 'Krav Maga avançado para adultos',
      dayOfWeek: 1,
      startTime: '20:00',
      endTime: '21:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Avançado',
      description: 'Krav Maga avançado para adultos',
      dayOfWeek: 3,
      startTime: '20:00',
      endTime: '21:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    // Terça e Quinta
    {
      name: 'Defesa Pessoal Manhã',
      description: 'Krav Maga para adultos - Horário matutino',
      dayOfWeek: 2,
      startTime: '07:00',
      endTime: '08:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Manhã',
      description: 'Krav Maga para adultos - Horário matutino',
      dayOfWeek: 4,
      startTime: '07:00',
      endTime: '08:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Almoço',
      description: 'Krav Maga para adultos - Horário de almoço',
      dayOfWeek: 2,
      startTime: '12:00',
      endTime: '13:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Almoço',
      description: 'Krav Maga para adultos - Horário de almoço',
      dayOfWeek: 4,
      startTime: '12:00',
      endTime: '13:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Tarde',
      description: 'Krav Maga para adultos - Horário vespertino',
      dayOfWeek: 2,
      startTime: '18:00',
      endTime: '19:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Defesa Pessoal Tarde',
      description: 'Krav Maga para adultos - Horário vespertino',
      dayOfWeek: 4,
      startTime: '18:00',
      endTime: '19:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Boxe - Horário 1',
      description: 'Boxe para adultos',
      dayOfWeek: 2,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Boxe - Horário 1',
      description: 'Boxe para adultos',
      dayOfWeek: 4,
      startTime: '19:00',
      endTime: '20:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Boxe - Horário 2',
      description: 'Boxe para adultos',
      dayOfWeek: 2,
      startTime: '20:00',
      endTime: '21:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    {
      name: 'Boxe - Horário 2',
      description: 'Boxe para adultos',
      dayOfWeek: 4,
      startTime: '20:00',
      endTime: '21:00',
      capacity: 20,
      ageGroup: 'ADULTO'
    },
    // Sábado
    {
      name: 'Krav Maga Kids 2-3 - Sábado',
      description: 'Krav Maga para crianças intermediário/avançado (7-12 anos)',
      dayOfWeek: 6,
      startTime: '09:45',
      endTime: '10:30',
      capacity: 15,
      ageGroup: 'INFANTIL'
    },
    {
      name: 'Defesa Pessoal Adulto - Sábado',
      description: 'Krav Maga para adultos - Sábado manhã',
      dayOfWeek: 6,
      startTime: '10:30',
      endTime: '11:30',
      capacity: 20,
      ageGroup: 'ADULTO'
    }
  ];

  for (const turma of turmasTatame2) {
    const dayName = turma.dayOfWeek === 1 ? 'Seg' : 
                    turma.dayOfWeek === 2 ? 'Ter' : 
                    turma.dayOfWeek === 3 ? 'Qua' : 
                    turma.dayOfWeek === 4 ? 'Qui' : 'Sáb';
    
    let turmaExiste = await prisma.turma.findFirst({
      where: {
        organizationId: organization.id,
        name: `${turma.name} - ${dayName} ${turma.startTime}`
      }
    });

    if (!turmaExiste) {
      // Determinar curso baseado no nome da turma
      const courseId = turma.name.includes('Boxe') ? cursoBoxe.id : cursoKM.id;
      
      turmaExiste = await prisma.turma.create({
        data: {
          organizationId: organization.id,
          courseId: courseId,
          instructorId: adminUser.id,
          unitId: unit.id,
          trainingAreaId: tatame2.id,
          name: `${turma.name} - ${dayName} ${turma.startTime}`,
          description: turma.description,
          maxStudents: turma.capacity,
          startDate: new Date(),
          schedule: JSON.stringify({ dayOfWeek: turma.dayOfWeek, startTime: turma.startTime, endTime: turma.endTime }),
          isActive: true
        }
      });
    }
    console.log(`  ✅ ${turma.name} - ${dayName} ${turma.startTime}-${turma.endTime}`);
  }

  // ===== RESUMO FINAL =====
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED CONCLUÍDO COM SUCESSO!\n');
  console.log('📊 RESUMO:');
  console.log(`   Organização: ${organization.name}`);
  console.log(`   Unidade: ${unit.name}`);
  console.log(`   Tatames: 2`);
  console.log(`   Planos: 6 (2 adultos + 4 kids)`);
  console.log(`   Turmas: ${turmasJJ.length + turmasTatame2.length}`);
  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log(`   Email: admin@smartdefence.com.br`);
  console.log(`   Senha: admin123`);
  console.log('\n💰 DESCONTOS DISPONÍVEIS:');
  console.log('   • Família: 1º cheio, 2º -10%, 3º -20%');
  console.log('   • À vista (Pix): 5% OFF + camiseta');
  console.log('   • Indicação: 1 mês grátis (anual)');
  console.log('   • Kids: 1º cheio, 2º -20%, 3º -30%');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
