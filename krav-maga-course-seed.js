// Seed completo para o curso Krav Maga Faixa Branca - Defesa Pessoal 1
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🥋 Criando curso completo Krav Maga Faixa Branca...');

  try {
    // 1. Buscar organização existente
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error('Nenhuma organização encontrada');
    }

    // 2. Buscar arte marcial existente ou criar
    let kravMaga = await prisma.martialArt.findFirst({
      where: { organizationId: org.id, name: 'Krav Maga' }
    });

    if (!kravMaga) {
      kravMaga = await prisma.martialArt.create({
        data: {
          organizationId: org.id,
          name: 'Krav Maga',
          description: 'Sistema de combate corpo a corpo desenvolvido para as Forças de Defesa de Israel',
          hasGrading: true,
          gradingSystem: 'BELT',
          maxLevel: 10,
          isActive: true,
        }
      });
    }

    // 3. Verificar se curso já existe ou criar
    let course = await prisma.course.findFirst({
      where: {
        organizationId: org.id,
        martialArtId: kravMaga.id,
        name: 'Krav Maga Faixa Branca - Defesa Pessoal 1 (Adultos)'
      }
    });

    if (course) {
      console.log(`⚠️ Curso já existe: ${course.name}. Usando existente.`);
    } else {
      course = await prisma.course.create({
      data: {
        organizationId: org.id,
        martialArtId: kravMaga.id,
        name: 'Krav Maga Faixa Branca - Defesa Pessoal 1 (Adultos)',
        description: 'Curso básico de Krav Maga focado em defesa pessoal para adultos. 48 aulas distribuídas em 24 semanas.',
        level: 'BEGINNER',
        duration: 24, // 24 semanas
        classesPerWeek: 2,
        totalClasses: 48,
        minAge: 15,
        category: 'ADULT',
        objectives: [
          'Desenvolver técnicas básicas de defesa pessoal',
          'Aumentar consciência situacional',
          'Melhorar condicionamento físico',
          'Construir autoconfiança',
          'Dominar 42 técnicas fundamentais'
        ],
        requirements: [
          'Frequência mínima de 75%',
          'Participação em 5 avaliações modulares',
          'Aprovação no Dia de Avaliação final'
        ],
        isActive: true,
      }
    });
    console.log(`✅ Curso criado: ${course.name}`);
    }

    console.log(`📚 Usando curso: ${course.name}`);

    // 4. Criar turmas
    const turma1 = await prisma.class.create({
      data: {
        organizationId: org.id,
        instructorId: (await prisma.instructor.findFirst())?.id || 'temp-instructor',
        courseId: course.id,
        date: new Date('2025-06-01'),
        startTime: new Date('2025-06-01T18:00:00'),
        endTime: new Date('2025-06-01T19:00:00'),
        title: 'Turma 1 - Terças e Quintas 18h',
        description: 'Turma regular de terças e quintas às 18h',
        status: 'SCHEDULED',
        maxStudents: 20,
      }
    });

    const turma2 = await prisma.class.create({
      data: {
        organizationId: org.id,
        instructorId: (await prisma.instructor.findFirst())?.id || 'temp-instructor',
        courseId: course.id,
        date: new Date('2025-06-01'),
        startTime: new Date('2025-06-01T19:00:00'),
        endTime: new Date('2025-06-01T20:00:00'),
        title: 'Turma 2 - Segundas e Quartas 19h',
        description: 'Turma regular de segundas e quartas às 19h',
        status: 'SCHEDULED',
        maxStudents: 20,
      }
    });

    console.log(`✅ Turmas criadas: Turma 1 e Turma 2`);

    // 5. Criar 42 técnicas do curso
    const tecnicas = [
      // Fundamentos (Aulas 1-10)
      { name: 'Guarda de Boxe', category: 'DEFENSE', lessons: [1, 2, 3], unit: 'Fundamentos' },
      { name: 'Jab (Soco Direto)', category: 'STRIKING', lessons: [1, 2], unit: 'Fundamentos' },
      { name: 'Cross (Soco Cruzado)', category: 'STRIKING', lessons: [2, 3], unit: 'Fundamentos' },
      { name: 'Movimentação Básica', category: 'DEFENSE', lessons: [1, 2, 3], unit: 'Fundamentos' },
      { name: 'Esquiva Lateral', category: 'DEFENSE', lessons: [3, 4], unit: 'Fundamentos' },
      
      // Golpes Básicos (Aulas 4-15)
      { name: 'Hook (Gancho)', category: 'STRIKING', lessons: [4, 5], unit: 'Golpes' },
      { name: 'Uppercut', category: 'STRIKING', lessons: [5, 6], unit: 'Golpes' },
      { name: 'Joelhada Frontal', category: 'STRIKING', lessons: [6, 7], unit: 'Golpes' },
      { name: 'Chute Frontal', category: 'STRIKING', lessons: [7, 8], unit: 'Golpes' },
      { name: 'Cotovelo Horizontal', category: 'STRIKING', lessons: [8, 9], unit: 'Golpes' },
      
      // Defesas Básicas (Aulas 10-25)
      { name: 'Defesa 360° Interior', category: 'DEFENSE', lessons: [10, 11, 12], unit: 'Defesas Básicas' },
      { name: 'Defesa 360° Exterior', category: 'DEFENSE', lessons: [11, 12, 13], unit: 'Defesas Básicas' },
      { name: 'Defesa contra Soco Circular', category: 'DEFENSE', lessons: [12, 13], unit: 'Defesas Básicas' },
      { name: 'Defesa contra Estrangulamento Frontal', category: 'DEFENSE', lessons: [13, 14, 15], unit: 'Defesas Básicas' },
      { name: 'Defesa contra Estrangulamento Lateral', category: 'DEFENSE', lessons: [14, 15, 16], unit: 'Defesas Básicas' },
      
      // Defesas Avançadas (Aulas 25-35)
      { name: 'Defesa contra Agarramento de Ombros', category: 'DEFENSE', lessons: [25, 26], unit: 'Defesas Avançadas' },
      { name: 'Defesa contra Empurrão', category: 'DEFENSE', lessons: [26, 27], unit: 'Defesas Avançadas' },
      { name: 'Defesa contra Chute Frontal', category: 'DEFENSE', lessons: [27, 28], unit: 'Defesas Avançadas' },
      { name: 'Defesa contra Chute Lateral', category: 'DEFENSE', lessons: [28, 29], unit: 'Defesas Avançadas' },
      { name: 'Liberação de Pegada no Punho', category: 'DEFENSE', lessons: [29, 30], unit: 'Defesas Avançadas' },
      
      // Integração e Combos (Aulas 35-48)
      { name: 'Combo Jab-Cross-Hook', category: 'STRIKING', lessons: [35, 36], unit: 'Integração' },
      { name: 'Combo Defesa-Contra-Ataque', category: 'DEFENSE', lessons: [36, 37], unit: 'Integração' },
      { name: 'Transição Golpe-Defesa', category: 'DEFENSE', lessons: [37, 38], unit: 'Integração' },
      { name: 'Cenário de Múltiplos Ataques', category: 'DEFENSE', lessons: [38, 39, 40], unit: 'Integração' },
      { name: 'Finalização e Fuga', category: 'DEFENSE', lessons: [40, 41, 42], unit: 'Integração' }
    ];

    // Criar técnicas detalhadas - organizadas por aula
    const lessonTechniques = {};
    
    // Organizar técnicas por aula
    for (const tecnica of tecnicas) {
      for (const lessonNum of tecnica.lessons) {
        if (!lessonTechniques[lessonNum]) {
          lessonTechniques[lessonNum] = [];
        }
        lessonTechniques[lessonNum].push(tecnica);
      }
    }
    
    // Criar técnicas com ordem única por aula
    for (const [lessonNum, lessonTecnicas] of Object.entries(lessonTechniques)) {
      for (let i = 0; i < lessonTecnicas.length; i++) {
        const tecnica = lessonTecnicas[i];
        await prisma.techniqueDetail.create({
          data: {
            courseId: course.id,
            name: tecnica.name,
            description: `Técnica ${tecnica.name} - ${tecnica.unit}`,
            category: tecnica.category,
            lessonNumber: parseInt(lessonNum),
            instructions: [
              `Executar ${tecnica.name} com técnica correta`,
              'Manter postura e equilíbrio',
              'Aplicar força adequada',
              'Finalizar em posição segura'
            ],
            objectives: [
              `Dominar a execução de ${tecnica.name}`,
              'Aplicar em cenário de defesa pessoal'
            ],
            adaptations: {
              TEA: 'Demonstração visual clara, repetição estruturada',
              TDAH: 'Instruções curtas e objetivas, pausas frequentes',
              MOBILIDADE_REDUZIDA: 'Adaptação para movimentos limitados'
            },
            orderInLesson: i + 1 // Ordem única na aula
          }
        });
      }
    }

    console.log(`✅ ${tecnicas.length} técnicas criadas para ${tecnicas.reduce((acc, t) => acc + t.lessons.length, 0)} aulas`);

    // 6. Criar desafios semanais (24 semanas)
    const desafios = [
      'Guarda de Boxe (manter posição)',
      'Jabs consecutivos',
      'Movimentação lateral',
      'Combinação Jab-Cross',
      'Esquivas rápidas',
      'Hooks precisos',
      'Joelhadas controladas',
      'Defesa 360° fluida',
      'Contra-ataques rápidos',
      'Resistência em combate',
      'Precisão em alvos',
      'Velocidade de reação',
      'Transições suaves',
      'Combos complexos',
      'Defesas múltiplas',
      'Condicionamento físico',
      'Simulação de estresse',
      'Técnicas sob pressão',
      'Cenários realistas',
      'Múltiplos atacantes',
      'Finalização efetiva',
      'Integração completa',
      'Revisão geral',
      'Preparação para avaliação'
    ];

    for (let week = 1; week <= 24; week++) {
      await prisma.weeklyChallenge.create({
        data: {
          courseId: course.id,
          weekNumber: week,
          name: `Semana ${week}: ${desafios[week - 1]}`,
          description: `Desafio semanal focado em ${desafios[week - 1].toLowerCase()}`,
          baseRepetitions: {
            ADULT_MASCULINO: week <= 12 ? 30 + (week * 2) : 50 + (week - 12) * 3,
            ADULT_FEMININO: week <= 12 ? 25 + (week * 2) : 40 + (week - 12) * 3,
            INICIANTE1_MASCULINO: week <= 12 ? 20 + week : 30 + (week - 12) * 2,
            INICIANTE1_FEMININO: week <= 12 ? 15 + week : 25 + (week - 12) * 2
          },
          baseTime: week <= 12 ? 60 + (week * 10) : 180 + (week - 12) * 15, // segundos
          pointsReward: 15 + Math.floor(week / 4) * 5 // 15-35 pontos
        }
      });
    }

    console.log(`✅ 24 desafios semanais criados`);

    // 7. Criar planos de aula estruturados (48 aulas)
    const unidades = {
      1: { unit: 'Fundamentos', level: 1 },
      10: { unit: 'Golpes Básicos', level: 1 },
      20: { unit: 'Defesas Básicas', level: 2 },
      30: { unit: 'Defesas Avançadas', level: 2 },
      40: { unit: 'Integração', level: 3 }
    };

    for (let lesson = 1; lesson <= 48; lesson++) {
      const weekNum = Math.ceil(lesson / 2);
      const currentUnit = Object.keys(unidades)
        .reverse()
        .find(key => lesson >= parseInt(key));
      
      const { unit, level } = unidades[currentUnit];
      
      // Aulas de avaliação (8, 16, 24, 32, 40)
      const isEvaluation = [8, 16, 24, 32, 40].includes(lesson);
      const isFinalEvaluation = lesson === 48;

      await prisma.lessonPlan.create({
        data: {
          courseId: course.id,
          title: isEvaluation ? `Avaliação Modular ${Math.ceil(lesson / 8)}` : 
                 isFinalEvaluation ? 'Dia de Avaliação Final' :
                 `Aula ${lesson} - ${unit}`,
          description: isEvaluation ? 'Avaliação de técnicas e progresso' :
                      `Desenvolvimento de técnicas da unidade ${unit}`,
          lessonNumber: lesson,
          weekNumber: weekNum,
          unit: unit,
          level: level,
          warmup: {
            duration: 5,
            activities: [
              'Aquecimento articular',
              'Movimentação básica',
              'Ativação muscular'
            ]
          },
          techniques: {
            duration: isEvaluation ? 40 : 35,
            activities: isEvaluation ? ['Avaliação de técnicas', 'Teste físico', 'Simulações'] :
                      ['Revisão técnicas anteriores', 'Novas técnicas', 'Prática em duplas']
          },
          simulations: {
            duration: isEvaluation ? 10 : 15,
            activities: isEvaluation ? ['Cenários de avaliação'] :
                      ['Cenários práticos', 'Simulação de situações']
          },
          cooldown: {
            duration: 5,
            activities: [
              'Alongamento',
              'Relaxamento',
              'Feedback da aula'
            ]
          },
          tacticalModule: lesson % 4 === 0 ? 'Regulação Emocional' :
                         lesson % 4 === 1 ? 'Consciência Situacional' :
                         lesson % 4 === 2 ? 'Tomada de Decisão' : 'Autoconfiança',
          objectives: isEvaluation ? [
            'Avaliar progresso do aluno',
            'Identificar áreas de melhoria',
            'Preparar para próxima fase'
          ] : [
            `Desenvolver técnicas da unidade ${unit}`,
            'Aumentar condicionamento físico',
            'Praticar cenários realistas'
          ],
          equipment: [
            'Tatames',
            'Pads de foco',
            'Proteções',
            'Cronômetro'
          ],
          activities: isEvaluation ? [
            'Demonstração individual de técnicas',
            'Teste físico cronometrado',
            'Simulação de cenários'
          ] : [
            'Aquecimento dinâmico',
            'Prática técnica',
            'Treino em duplas',
            'Simulações práticas'
          ],
          adaptations: {
            TEA: {
              instructions: 'Rotina previsível, sinais visuais claros',
              environment: 'Ambiente controlado, menos estímulos'
            },
            TDAH: {
              instructions: 'Comandos curtos, pausas frequentes',
              activities: 'Atividades dinâmicas, variação constante'
            },
            MOBILIDADE_REDUZIDA: {
              techniques: 'Adaptação de movimentos, foco em membros superiores',
              equipment: 'Suporte adicional, cadeiras adaptadas'
            }
          }
        }
      });
    }

    console.log(`✅ 48 planos de aula criados`);

    // 8. Matricular alunos existentes nas turmas
    const students = await prisma.student.findMany({
      include: { user: true }
    });

    for (const student of students) {
      // Alterna entre Turma 1 e Turma 2
      const classId = students.indexOf(student) % 2 === 0 ? turma1.id : turma2.id;
      
      await prisma.studentCourse.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          classId: classId,
          startDate: new Date('2025-06-01'),
          expectedEndDate: new Date('2025-11-30'), // 24 semanas depois
          status: 'ACTIVE',
          isActive: true
        }
      });
    }

    console.log(`✅ ${students.length} alunos matriculados nas turmas`);

    // 9. Criar algumas presenças de exemplo (até a data atual: 27/06/2025)
    const currentDate = new Date('2025-06-27');
    const startDate = new Date('2025-06-01');
    
    // Calcular quantas aulas já aconteceram
    const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const classesHappened = Math.min(Math.floor(daysDiff / 3.5) * 2, 15); // Aproximadamente 2 aulas por semana

    for (const student of students) {
      const studentCourse = await prisma.studentCourse.findFirst({
        where: { studentId: student.id, courseId: course.id }
      });

      for (let lessonNum = 1; lessonNum <= classesHappened; lessonNum++) {
        // 85% de presença em média
        const present = Math.random() > 0.15;
        
        await prisma.attendanceRecord.create({
          data: {
            studentId: student.id,
            classId: studentCourse.classId,
            courseId: course.id,
            lessonNumber: lessonNum,
            date: new Date(startDate.getTime() + (lessonNum - 1) * 3.5 * 24 * 60 * 60 * 1000),
            present: present,
            arrived_late: present && Math.random() > 0.9,
            left_early: present && Math.random() > 0.95,
            notes: present ? null : 'Falta'
          }
        });
      }
    }

    console.log(`✅ Presenças registradas para ${classesHappened} aulas`);

    // 10. Estatísticas finais
    const totalStudents = await prisma.student.count();
    const totalCourses = await prisma.course.count();
    const totalTechniques = await prisma.techniqueDetail.count();
    const totalLessons = await prisma.lessonPlan.count();
    const totalChallenges = await prisma.weeklyChallenge.count();

    console.log('\n🎉 SISTEMA ACADÊMICO COMPLETO CRIADO!');
    console.log('=====================================');
    console.log(`📚 Cursos: ${totalCourses}`);
    console.log(`👥 Alunos: ${totalStudents}`);
    console.log(`🥊 Técnicas: ${totalTechniques}`);
    console.log(`📖 Planos de Aula: ${totalLessons}`);
    console.log(`🏆 Desafios: ${totalChallenges}`);
    console.log(`🏫 Turmas: 2 (Turma 1 e Turma 2)`);
    console.log('=====================================');
    console.log('📅 Cronograma:');
    console.log('• Início: 01/06/2025');
    console.log('• Data atual: 27/06/2025');
    console.log(`• Aulas realizadas: ${classesHappened}/48`);
    console.log('• Turma 1: Terças e Quintas, 18h');
    console.log('• Turma 2: Segundas e Quartas, 19h');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Erro ao criar curso:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();