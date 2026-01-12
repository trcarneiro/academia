import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando setup de dados para teste de check-in...\n');

    // 1. Aplicar migration manual do campo expectedRepetitions
    console.log('📝 Aplicando migration: expectedRepetitions...');
    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "lesson_plan_techniques" 
      ADD COLUMN IF NOT EXISTS "expectedRepetitions" INTEGER NOT NULL DEFAULT 1;
    `);
        console.log('✅ Campo expectedRepetitions adicionado com sucesso!\n');
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Campo expectedRepetitions já existe, continuando...\n');
        } else {
            throw error;
        }
    }

    // 2. Buscar organização e dados necessários
    console.log('🔍 Buscando organização...');
    const org = await prisma.organization.findFirst({
        where: { isActive: true }
    });

    if (!org) {
        throw new Error('Nenhuma organização ativa encontrada');
    }
    console.log(`✅ Organização encontrada: ${org.name}\n`);

    // 3. Buscar ou criar curso de Defesa Pessoal
    console.log('🔍 Buscando curso de Defesa Pessoal...');
    let course = await prisma.course.findFirst({
        where: {
            organizationId: org.id,
            name: { contains: 'Defesa' }
        }
    });

    if (!course) {
        console.log('📝 Criando curso de Defesa Pessoal...');
        course = await prisma.course.create({
            data: {
                organizationId: org.id,
                name: 'Defesa Pessoal - Faixa Branca',
                description: 'Curso básico de defesa pessoal',
                level: 'BEGINNER',
                duration: 12,
                classesPerWeek: 2,
                totalClasses: 48,
                minAge: 16,
                category: 'ADULT',
                isActive: true
            }
        });
    }
    console.log(`✅ Curso: ${course.name}\n`);

    // 4. Buscar instrutor
    console.log('🔍 Buscando instrutor...');
    const instructor = await prisma.instructor.findFirst({
        where: {
            organizationId: org.id,
            isActive: true
        },
        include: { user: true }
    });

    if (!instructor) {
        throw new Error('Nenhum instrutor ativo encontrado');
    }
    console.log(`✅ Instrutor: ${instructor.user.firstName} ${instructor.user.lastName}\n`);

    // 5. Buscar unidade
    console.log('🔍 Buscando unidade...');
    const unit = await prisma.unit.findFirst({
        where: {
            organizationId: org.id,
            isActive: true
        }
    });

    if (!unit) {
        throw new Error('Nenhuma unidade ativa encontrada');
    }
    console.log(`✅ Unidade: ${unit.name}\n`);

    // 6. Criar turma das 18h
    console.log('📝 Criando turma das 18h...');
    const today = dayjs();
    const turma = await prisma.turma.create({
        data: {
            organizationId: org.id,
            courseId: course.id,
            name: 'Defesa Pessoal - Turma 18h',
            description: 'Turma de teste para sistema de check-in',
            classType: 'COLLECTIVE',
            status: 'ACTIVE',
            instructorId: instructor.userId,
            maxStudents: 20,
            startDate: today.toDate(),
            endDate: today.add(6, 'month').toDate(),
            schedule: {
                daysOfWeek: [1, 3, 5], // Segunda, Quarta, Sexta
                time: '18:00',
                duration: 60
            },
            unitId: unit.id,
            isActive: true,
            minimumStudents: 5
        }
    });
    console.log(`✅ Turma criada: ${turma.name}\n`);

    // 7. Buscar técnicas
    console.log('🔍 Buscando técnicas...');
    const techniques = await prisma.technique.findMany({
        take: 68,
        orderBy: { createdAt: 'asc' }
    });

    if (techniques.length === 0) {
        throw new Error('Nenhuma técnica encontrada no banco de dados');
    }
    console.log(`✅ Encontradas ${techniques.length} técnicas\n`);

    // 8. Gerar 48 planos de aula
    console.log('📝 Gerando 48 planos de aula...');
    const lessonPlans = [];

    for (let i = 1; i <= 48; i++) {
        const lessonPlan = await prisma.lessonPlan.create({
            data: {
                courseId: course.id,
                title: `Aula ${i.toString().padStart(2, '0')}`,
                description: `Plano de aula ${i} - Defesa Pessoal`,
                lessonNumber: i,
                weekNumber: Math.ceil(i / 2),
                warmup: { exercises: ['Alongamento', 'Aquecimento'] },
                techniques: {},
                simulations: {},
                cooldown: { exercises: ['Relaxamento'] },
                duration: 60,
                difficulty: 1,
                objectives: ['Aprender técnicas básicas'],
                equipment: ['Tatame'],
                activities: [],
                isActive: true
            }
        });
        lessonPlans.push(lessonPlan);
    }
    console.log(`✅ ${lessonPlans.length} planos de aula criados\n`);

    // 9. Distribuir técnicas nos planos de aula
    console.log('📝 Vinculando técnicas aos planos de aula...');
    let techniqueIndex = 0;

    for (let i = 0; i < lessonPlans.length; i++) {
        const lessonPlan = lessonPlans[i];

        // Determinar quantas técnicas para esta aula
        // 68 técnicas em 48 aulas = ~1.4 técnicas por aula
        // Algumas aulas terão 1, outras terão 2
        const techniquesPerLesson = (i % 3 === 0) ? 2 : 1;

        for (let j = 0; j < techniquesPerLesson && techniqueIndex < techniques.length; j++) {
            const technique = techniques[techniqueIndex];

            await prisma.lessonPlanTechniques.create({
                data: {
                    lessonPlanId: lessonPlan.id,
                    techniqueId: technique.id,
                    order: j + 1,
                    allocationMinutes: 20,
                    objectiveMapping: ['Aprender técnica'],
                    expectedRepetitions: 3 // Cada técnica deve ser praticada 3 vezes
                }
            });

            techniqueIndex++;
        }
    }
    console.log(`✅ ${techniqueIndex} técnicas vinculadas aos planos\n`);

    // 10. Criar TurmaLesson para hoje (Aula 01)
    console.log('📝 Criando aula de hoje...');
    const todayLesson = await prisma.turmaLesson.create({
        data: {
            turmaId: turma.id,
            lessonPlanId: lessonPlans[0].id,
            lessonNumber: 1,
            title: 'Aula 01 - Introdução',
            scheduledDate: today.hour(18).minute(0).second(0).toDate(),
            status: 'ACTIVE',
            duration: 60,
            objectives: ['Introdução às técnicas básicas'],
            materials: ['Tatame'],
            isActive: true
        }
    });
    console.log(`✅ Aula criada: ${todayLesson.title}\n`);

    // 11. Buscar ou criar aluno de teste
    console.log('🔍 Buscando aluno de teste...');
    let student = await prisma.student.findFirst({
        where: {
            organizationId: org.id,
            isActive: true
        },
        include: { user: true }
    });

    if (!student) {
        console.log('📝 Criando aluno de teste...');
        const user = await prisma.user.create({
            data: {
                organizationId: org.id,
                email: 'aluno.teste@academia.com',
                password: 'hashed_password',
                role: 'STUDENT',
                firstName: 'Aluno',
                lastName: 'Teste',
                isActive: true
            }
        });

        student = await prisma.student.create({
            data: {
                organizationId: org.id,
                userId: user.id,
                category: 'ADULT',
                registrationNumber: '001',
                isActive: true
            },
            include: { user: true }
        });
    }
    console.log(`✅ Aluno: ${student.user.firstName} ${student.user.lastName}\n`);

    // 12. Matricular aluno na turma
    console.log('📝 Matriculando aluno na turma...');
    const turmaStudent = await prisma.turmaStudent.upsert({
        where: {
            turmaId_studentId: {
                turmaId: turma.id,
                studentId: student.id
            }
        },
        update: {},
        create: {
            turmaId: turma.id,
            studentId: student.id,
            enrolledAt: new Date(),
            status: 'ACTIVE',
            isActive: true
        }
    });
    console.log(`✅ Aluno matriculado na turma\n`);

    console.log('🎉 Setup concluído com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - Organização: ${org.name}`);
    console.log(`   - Curso: ${course.name}`);
    console.log(`   - Turma: ${turma.name}`);
    console.log(`   - Instrutor: ${instructor.user.firstName} ${instructor.user.lastName}`);
    console.log(`   - Planos de aula: ${lessonPlans.length}`);
    console.log(`   - Técnicas vinculadas: ${techniqueIndex}`);
    console.log(`   - Aula de hoje: ${todayLesson.title} às 18:00`);
    console.log(`   - Aluno de teste: ${student.user.firstName} ${student.user.lastName} (matrícula: ${student.registrationNumber})`);
    console.log('\n✅ Pronto para testar check-in!');
}

main()
    .catch((error) => {
        console.error('❌ Erro durante setup:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
