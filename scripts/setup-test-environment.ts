import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestEnvironment() {
    try {
        console.log('🎯 Configurando ambiente de teste...\n');

        // 1. Buscar curso Krav Maga
        const course = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga', mode: 'insensitive' } }
        });

        if (!course) {
            console.log('❌ Curso não encontrado');
            return;
        }

        console.log(`✅ Curso: ${course.name}`);

        // 2. Buscar instrutor
        const instructor = await prisma.instructor.findFirst({
            include: { user: true }
        });

        if (!instructor) {
            console.log('❌ Nenhum instrutor encontrado');
            return;
        }

        console.log(`✅ Instrutor: ${instructor.user.firstName}`);

        // 3. Criar ou buscar turma das 18h
        let turma = await prisma.turma.findFirst({
            where: {
                courseId: course.id,
                name: { contains: '18', mode: 'insensitive' }
            }
        });

        if (!turma) {
            turma = await prisma.turma.create({
                data: {
                    organizationId: course.organizationId,
                    courseId: course.id,
                    instructorId: instructor.id,
                    name: 'Turma 18h - Krav Maga Faixa Branca',
                    description: 'Turma iniciante, segunda e quinta 18h-19h',
                    schedule: {
                        monday: { enabled: true, startTime: '18:00', endTime: '19:00' },
                        thursday: { enabled: true, startTime: '18:00', endTime: '19:00' }
                    },
                    maxStudents: 20,
                    startDate: new Date(),
                    isActive: true
                }
            });
            console.log(`✅ Turma criada: ${turma.name}`);
        } else {
            console.log(`✅ Turma encontrada: ${turma.name}`);
        }

        // 4. Criar primeiro plano de aula (Aula 01)
        let lessonPlan = await prisma.lessonPlan.findFirst({
            where: {
                courseId: course.id,
                lessonNumber: 1,
                isActive: true
            }
        });

        if (!lessonPlan) {
            // Buscar técnicas para a aula 1
            const combatTechs = await prisma.technique.findMany({
                where: {
                    OR: [
                        { name: { contains: 'Posição Ortodoxa', mode: 'insensitive' } },
                        { name: { contains: 'Posição Canhota', mode: 'insensitive' } },
                        { name: { contains: 'Queda Frente Suave', mode: 'insensitive' } },
                        { name: { contains: 'Queda Lateral', mode: 'insensitive' } }
                    ]
                },
                take: 4
            });

            lessonPlan = await prisma.lessonPlan.create({
                data: {
                    courseId: course.id,
                    title: 'Aula 01 - Primeira Linha de Defesa',
                    description: 'Introdução às bases do Krav Maga: postura e quedas',
                    lessonNumber: 1,
                    weekNumber: 1,
                    level: 1,
                    difficulty: 1,
                    duration: 60,
                    objectives: [
                        'Dominar postura básica de combate',
                        'Aprender a cair sem se machucar',
                        'Desenvolver consciência corporal'
                    ],
                    equipment: ['Tatame'],
                    warmup: {
                        fase1: 'Cardio e Explosão',
                        fase2: 'Coordenação',
                        fase3: 'Mobilidade',
                        fase4: 'Alongamento'
                    },
                    techniques: {
                        lista: combatTechs.map(t => ({ id: t.id, name: t.name }))
                    },
                    simulations: {
                        descricao: 'Prática em duplas'
                    },
                    cooldown: {
                        alongamento: true
                    }
                }
            });

            console.log(`✅ Plano de aula criado: ${lessonPlan.title}`);
        } else {
            console.log(`✅ Plano de aula encontrado: ${lessonPlan.title}`);
        }

        // 5. Criar TurmaLesson para HOJE
        const today = new Date();
        today.setHours(18, 0, 0, 0);

        let turmaLesson = await prisma.turmaLesson.findFirst({
            where: {
                turmaId: turma.id,
                lessonPlanId: lessonPlan.id,
                scheduledDate: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                    lt: new Date(today.setHours(23, 59, 59, 999))
                }
            }
        });

        if (!turmaLesson) {
            const lessonTime = new Date();
            lessonTime.setHours(18, 0, 0, 0);

            turmaLesson = await prisma.turmaLesson.create({
                data: {
                    turmaId: turma.id,
                    lessonPlanId: lessonPlan.id,
                    scheduledDate: lessonTime,
                    duration: 60,
                    status: 'SCHEDULED',
                    topic: 'Fundamentos e Postura'
                }
            });
            console.log(`✅ Aula de hoje criada: ${lessonTime.toLocaleString('pt-BR')}`);
        } else {
            console.log(`✅ Aula de hoje já existe`);
        }

        // 6. Buscar ou criar aluno de teste
        let testStudent = await prisma.student.findFirst({
            where: {
                user: {
                    firstName: { contains: 'Teste', mode: 'insensitive' }
                }
            },
            include: { user: true }
        });

        if (!testStudent) {
            const testUser = await prisma.user.create({
                data: {
                    organizationId: course.organizationId,
                    email: `teste-${Date.now()}@kravmaga.com`,
                    password: 'teste123',
                    role: 'STUDENT',
                    firstName: 'Aluno',
                    lastName: 'Teste',
                    isActive: true
                }
            });

            testStudent = await prisma.student.create({
                data: {
                    id: testUser.id,
                    organizationId: course.organizationId,
                    userId: testUser.id,
                    registrationNumber: `KM${Date.now().toString().slice(-4)}`,
                    category: 'ADULT',
                    isActive: true
                }
            });

            console.log(`✅ Aluno de teste criado: ${testStudent.registrationNumber}`);
        } else {
            console.log(`✅ Aluno de teste: ${testStudent.registrationNumber}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('📋 RESUMO:');
        console.log(`   Turma ID: ${turma.id}`);
        console.log(`   Aula ID: ${turmaLesson.id}`);
        console.log(`   Aluno: ${testStudent.registrationNumber}`);
        console.log(`   Horário: Hoje às 18h`);
        console.log('='.repeat(50));

        console.log('\n✅ Ambiente pronto para teste!');
        console.log(`\n🔗 Check-in URL: http://localhost:3000/checkin-kiosk`);
        console.log(`   Digite: ${testStudent.registrationNumber}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupTestEnvironment();
