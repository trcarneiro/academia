import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🥋 SETUP SMART DEFENCE - Planos e Turmas');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. PLANOS (usando BillingPlan)
  console.log('📦 CONFIGURANDO PLANOS...\n');

  // Desativar planos antigos
  await prisma.billingPlan.updateMany({
    where: { organizationId: ORG_ID },
    data: { isActive: false }
  });
  console.log('   ❌ Planos antigos desativados');

  // Criar plano Anual Ilimitado
  const planoAnual = await prisma.billingPlan.upsert({
    where: { 
      id: 'plano-anual-ilimitado' 
    },
    update: {
      name: 'Ilimitado Anual',
      description: 'Plano anual com acesso a todas as modalidades (Defesa Pessoal, Jiu-Jitsu, Boxe). Fidelidade de 12 meses. Promoção Black Friday!',
      price: 229.90,
      billingType: 'MONTHLY',
      isUnlimitedAccess: true,
      accessAllModalities: true,
      isActive: true,
      features: {
        tipo: 'anual',
        fidelidade: 12,
        blackFriday: true,
        modalidades: ['Defesa Pessoal', 'Jiu-Jitsu', 'Boxe'],
        descontoFamilia: {
          segundo: 10,
          terceiro: 20
        },
        indicacao: '1 mensalidade grátis ao trazer amigo para plano anual',
        descontoAVista: 5
      }
    },
    create: {
      id: 'plano-anual-ilimitado',
      name: 'Ilimitado Anual',
      description: 'Plano anual com acesso a todas as modalidades (Defesa Pessoal, Jiu-Jitsu, Boxe). Fidelidade de 12 meses. Promoção Black Friday!',
      price: 229.90,
      billingType: 'MONTHLY',
      isUnlimitedAccess: true,
      accessAllModalities: true,
      isActive: true,
      organizationId: ORG_ID,
      features: {
        tipo: 'anual',
        fidelidade: 12,
        blackFriday: true,
        modalidades: ['Defesa Pessoal', 'Jiu-Jitsu', 'Boxe'],
        descontoFamilia: {
          segundo: 10,
          terceiro: 20
        },
        indicacao: '1 mensalidade grátis ao trazer amigo para plano anual',
        descontoAVista: 5
      }
    }
  });
  console.log(`   ✅ ${planoAnual.name}: R$ ${planoAnual.price}/mês (12 meses)`);

  // Criar plano Mensal Ilimitado
  const planoMensal = await prisma.billingPlan.upsert({
    where: { 
      id: 'plano-mensal-ilimitado' 
    },
    update: {
      name: 'Ilimitado Mensal',
      description: 'Plano mensal sem fidelidade com acesso a todas as modalidades (Defesa Pessoal, Jiu-Jitsu, Boxe).',
      price: 269.90,
      billingType: 'MONTHLY',
      isUnlimitedAccess: true,
      accessAllModalities: true,
      isActive: true,
      features: {
        tipo: 'mensal',
        fidelidade: 0,
        modalidades: ['Defesa Pessoal', 'Jiu-Jitsu', 'Boxe'],
        descontoFamilia: {
          segundo: 10,
          terceiro: 20
        }
      }
    },
    create: {
      id: 'plano-mensal-ilimitado',
      name: 'Ilimitado Mensal',
      description: 'Plano mensal sem fidelidade com acesso a todas as modalidades (Defesa Pessoal, Jiu-Jitsu, Boxe).',
      price: 269.90,
      billingType: 'MONTHLY',
      isUnlimitedAccess: true,
      accessAllModalities: true,
      isActive: true,
      organizationId: ORG_ID,
      features: {
        tipo: 'mensal',
        fidelidade: 0,
        modalidades: ['Defesa Pessoal', 'Jiu-Jitsu', 'Boxe'],
        descontoFamilia: {
          segundo: 10,
          terceiro: 20
        }
      }
    }
  });
  console.log(`   ✅ ${planoMensal.name}: R$ ${planoMensal.price}/mês (sem fidelidade)`);

  // 2. UNIDADES (Tatames)
  console.log('\n🏢 CONFIGURANDO UNIDADES (TATAMES)...\n');

  const tatame1 = await prisma.unit.upsert({
    where: { id: 'tatame-1' },
    update: { name: 'Tatame 1', description: 'Jiu-Jitsu' },
    create: {
      id: 'tatame-1',
      name: 'Tatame 1',
      description: 'Jiu-Jitsu',
      address: 'Smart Defence',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000',
      organizationId: ORG_ID
    }
  });
  console.log(`   ✅ ${tatame1.name} (${tatame1.description})`);

  const tatame2 = await prisma.unit.upsert({
    where: { id: 'tatame-2' },
    update: { name: 'Tatame 2', description: 'Defesa Pessoal & Boxe' },
    create: {
      id: 'tatame-2',
      name: 'Tatame 2',
      description: 'Defesa Pessoal & Boxe',
      address: 'Smart Defence',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000',
      organizationId: ORG_ID
    }
  });
  console.log(`   ✅ ${tatame2.name} (${tatame2.description})`);

  // 3. CURSOS/MODALIDADES
  console.log('\n📚 CONFIGURANDO CURSOS/MODALIDADES...\n');

  // Criar ou buscar cursos
  let cursoJiuJitsu = await prisma.course.findFirst({
    where: { organizationId: ORG_ID, name: { contains: 'Jiu' } }
  });
  if (!cursoJiuJitsu) {
    cursoJiuJitsu = await prisma.course.create({
      data: {
        id: 'curso-jiujitsu',
        name: 'Jiu-Jitsu',
        description: 'Arte marcial brasileira focada em técnicas de solo',
        organizationId: ORG_ID,
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 48,
        classesPerWeek: 2
      }
    });
  }
  console.log(`   ✅ ${cursoJiuJitsu.name}`);

  let cursoDefesa = await prisma.course.findFirst({
    where: { organizationId: ORG_ID, name: { contains: 'Defesa' } }
  });
  if (!cursoDefesa) {
    cursoDefesa = await prisma.course.create({
      data: {
        id: 'curso-defesa-pessoal',
        name: 'Defesa Pessoal',
        description: 'Técnicas de autodefesa baseadas em Krav Maga',
        organizationId: ORG_ID,
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 48,
        classesPerWeek: 2
      }
    });
  }
  console.log(`   ✅ ${cursoDefesa.name}`);

  let cursoBoxe = await prisma.course.findFirst({
    where: { organizationId: ORG_ID, name: { contains: 'Boxe' } }
  });
  if (!cursoBoxe) {
    cursoBoxe = await prisma.course.create({
      data: {
        id: 'curso-boxe',
        name: 'Boxe',
        description: 'Arte marcial de socos e movimentação',
        organizationId: ORG_ID,
        level: 'BEGINNER',
        duration: 12,
        totalClasses: 48,
        classesPerWeek: 2
      }
    });
  }
  console.log(`   ✅ ${cursoBoxe.name}`);

  // 4. TURMAS
  console.log('\n📅 CONFIGURANDO TURMAS...\n');

  // Desativar turmas antigas
  await prisma.turma.updateMany({
    where: { organizationId: ORG_ID },
    data: { isActive: false }
  });

  // Instrutor padrão (Thiago Carneiro)
  const INSTRUCTOR_ID = 'cbe69948-5bc7-4877-afa8-b895e7752cbe';
  const START_DATE = new Date('2024-01-01');

  // Formato de schedule: { daysOfWeek: [2, 4], time: '12:00', duration: 60 }
  // daysOfWeek: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  const turmasConfig = [
    // ═══════════════════════════════════════════════════════════
    // TATAME 1 - JIU-JITSU (Ter & Qui)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'jj-ter-qui-1200',
      name: 'Jiu-Jitsu Adulto - Ter/Qui 12:00',
      courseId: cursoJiuJitsu.id,
      unitId: tatame1.id,
      schedule: { daysOfWeek: [2, 4], time: '12:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },
    {
      id: 'jj-ter-qui-kids1',
      name: 'Jiu-Jitsu Kids 1 - Ter/Qui 16:30',
      courseId: cursoJiuJitsu.id,
      unitId: tatame1.id,
      schedule: { daysOfWeek: [2, 4], time: '16:30', duration: 30, nivel: 'kids1' },
      maxStudents: 15
    },
    {
      id: 'jj-ter-qui-kids23',
      name: 'Jiu-Jitsu Kids 2-3 - Ter/Qui 17:15',
      courseId: cursoJiuJitsu.id,
      unitId: tatame1.id,
      schedule: { daysOfWeek: [2, 4], time: '17:15', duration: 45, nivel: 'kids2-3' },
      maxStudents: 15
    },
    {
      id: 'jj-ter-qui-1900',
      name: 'Jiu-Jitsu Adulto - Ter/Qui 19:00',
      courseId: cursoJiuJitsu.id,
      unitId: tatame1.id,
      schedule: { daysOfWeek: [2, 4], time: '19:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },

    // ═══════════════════════════════════════════════════════════
    // TATAME 2 - DEFESA PESSOAL (Seg & Qua)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'dp-seg-qua-kids1',
      name: 'Defesa Pessoal Kids 1 - Seg/Qua 16:30',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [1, 3], time: '16:30', duration: 30, nivel: 'kids1' },
      maxStudents: 15
    },
    {
      id: 'dp-seg-qua-kids23',
      name: 'Defesa Pessoal Kids 2-3 - Seg/Qua 18:15',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [1, 3], time: '18:15', duration: 45, nivel: 'kids2-3' },
      maxStudents: 15
    },
    {
      id: 'dp-seg-qua-1900',
      name: 'Defesa Pessoal Adulto - Seg/Qua 19:00',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [1, 3], time: '19:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },
    {
      id: 'dp-seg-qua-2000',
      name: 'Defesa Pessoal Adulto - Seg/Qua 20:00',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [1, 3], time: '20:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },

    // ═══════════════════════════════════════════════════════════
    // TATAME 2 - DEFESA PESSOAL (Ter & Qui)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'dp-ter-qui-0700',
      name: 'Defesa Pessoal Adulto - Ter/Qui 07:00',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [2, 4], time: '07:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },
    {
      id: 'dp-ter-qui-1200',
      name: 'Defesa Pessoal Adulto - Ter/Qui 12:00',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [2, 4], time: '12:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },
    {
      id: 'dp-ter-qui-1800',
      name: 'Defesa Pessoal Adulto - Ter/Qui 18:00',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [2, 4], time: '18:00', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    },

    // ═══════════════════════════════════════════════════════════
    // TATAME 2 - BOXE (Ter & Qui)
    // ═══════════════════════════════════════════════════════════
    {
      id: 'bx-ter-qui-1900',
      name: 'Boxe Adulto - Ter/Qui 19:00',
      courseId: cursoBoxe.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [2, 4], time: '19:00', duration: 60, nivel: 'adulto' },
      maxStudents: 15
    },
    {
      id: 'bx-ter-qui-2000',
      name: 'Boxe Adulto - Ter/Qui 20:00',
      courseId: cursoBoxe.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [2, 4], time: '20:00', duration: 60, nivel: 'adulto' },
      maxStudents: 15
    },

    // ═══════════════════════════════════════════════════════════
    // TATAME 2 - SÁBADO
    // ═══════════════════════════════════════════════════════════
    {
      id: 'dp-sab-kids23',
      name: 'Defesa Pessoal Kids 2-3 - Sáb 09:45',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [6], time: '09:45', duration: 45, nivel: 'kids2-3' },
      maxStudents: 15
    },
    {
      id: 'dp-sab-adulto',
      name: 'Defesa Pessoal Adulto - Sáb 10:30',
      courseId: cursoDefesa.id,
      unitId: tatame2.id,
      schedule: { daysOfWeek: [6], time: '10:30', duration: 60, nivel: 'adulto' },
      maxStudents: 20
    }
  ];

  // Criar/atualizar turmas
  for (const turmaConfig of turmasConfig) {
    const turma = await prisma.turma.upsert({
      where: { id: turmaConfig.id },
      update: {
        name: turmaConfig.name,
        courseId: turmaConfig.courseId,
        unitId: turmaConfig.unitId,
        schedule: turmaConfig.schedule,
        maxStudents: turmaConfig.maxStudents,
        isActive: true
      },
      create: {
        id: turmaConfig.id,
        name: turmaConfig.name,
        courseId: turmaConfig.courseId,
        unitId: turmaConfig.unitId,
        instructorId: INSTRUCTOR_ID,
        schedule: turmaConfig.schedule,
        maxStudents: turmaConfig.maxStudents,
        startDate: START_DATE,
        isActive: true,
        organizationId: ORG_ID
      }
    });
    console.log(`   ✅ ${turma.name}`);
  }

  // 5. RESUMO FINAL
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('📊 RESUMO FINAL');
  console.log('════════════════════════════════════════════════════════════\n');

  const planosAtivos = await prisma.billingPlan.count({ where: { organizationId: ORG_ID, isActive: true } });
  const turmasAtivas = await prisma.turma.count({ where: { organizationId: ORG_ID, isActive: true } });
  const cursosAtivos = await prisma.course.count({ where: { organizationId: ORG_ID } });

  console.log(`   📦 Planos ativos: ${planosAtivos}`);
  console.log(`      • Ilimitado Anual: R$ 229,90/mês (12 meses)`);
  console.log(`      • Ilimitado Mensal: R$ 269,90/mês (sem fidelidade)`);
  console.log('');
  console.log(`   📚 Modalidades: ${cursosAtivos}`);
  console.log(`      • Jiu-Jitsu`);
  console.log(`      • Defesa Pessoal`);
  console.log(`      • Boxe`);
  console.log('');
  console.log(`   📅 Turmas ativas: ${turmasAtivas}`);
  console.log('');
  console.log('   🎁 Benefícios configurados:');
  console.log('      • Desconto família (2º=10%, 3º+=20%)');
  console.log('      • Indicação: 1 mensalidade grátis');
  console.log('      • À vista (PIX/cartão): 5% OFF');
  console.log('');

  await prisma.$disconnect();
  console.log('✅ Setup concluído com sucesso!\n');
}

main().catch(console.error);
