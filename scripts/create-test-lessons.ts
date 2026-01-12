
import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Criando aulas de teste de 5 minutos (Tentativa 2)...');

    // 1. Get Context
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Organization not found');

    const unit = await prisma.unit.findFirst({ where: { organizationId: org.id } });
    if (!unit) throw new Error('Unit not found');

    // 1b. Create FRESH Instructor for Test (Avoid FK issues)
    const instructorEmail = `test.instructor.${Date.now()}@test.local`;
    const instructorUser = await prisma.user.create({
        data: {
            organizationId: org.id,
            email: instructorEmail,
            password: 'mock_password',
            role: 'INSTRUCTOR',
            firstName: 'Instrutor',
            lastName: 'Teste Flash',
            isActive: true
        }
    });

    const instructor = await prisma.instructor.create({
        data: {
            organizationId: org.id,
            userId: instructorUser.id,
            isActive: true
        }
    });

    console.log(`👨‍🏫 Novo Instrutor criado: ${instructor.id} (User: ${instructorUser.id})`);

    // 1c. Get Course
    const course = await prisma.course.findFirst({
        where: { organizationId: org.id, name: { contains: 'Krav Maga' } }
    }) || await prisma.course.findFirst({ where: { organizationId: org.id } });

    if (!course) throw new Error('Course not found');

    // 2. Find Student (Thiago Carneiro)
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { user: { firstName: { contains: 'Thiago', mode: 'insensitive' } } },
                { user: { email: { contains: 'thiago', mode: 'insensitive' } } }
            ]
        },
        include: { user: true }
    });

    if (!student) {
        console.warn('⚠️ Aluno "Thiago" não encontrado automaticamente.');
    } else {
        console.log(`👤 Aluno encontrado: ${student.user.firstName} ${student.user.lastName}`);
    }

    // 3. Create/Get Test Turma
    const turmaName = "Turma Flash (Testes 5min)";

    let turma = await prisma.turma.findFirst({
        where: { name: turmaName, organizationId: org.id }
    });

    if (!turma) {
        // NOTE: In schema, Turma.instructorId refers to User.id, not Instructor.id!
        turma = await prisma.turma.create({
            data: {
                organizationId: org.id,
                courseId: course.id,
                unitId: unit.id,
                instructorId: instructor.userId, // CORRECTED: Use User ID
                name: turmaName,
                description: "Turma para testes rápidos de frequência e graduação",
                classType: "COLLECTIVE",
                maxStudents: 100,
                startDate: new Date(),
                schedule: { "daysOfWeek": [0, 1, 2, 3, 4, 5, 6], "time": "00:00", "duration": 5 },
                isActive: true
            }
        });
        console.log('📦 Turma de teste criada.');
    } else {
        console.log('📦 Turma de teste existente encontrada.');
    }

    // 4. Enroll Student if found
    if (student) {
        // Check if already enrolled in ANY active Turma for this course to act as "main"
        // But we just want to link to THIS turma
        const existingEnrollment = await prisma.turmaStudent.findFirst({
            where: { studentId: student.id, turmaId: turma.id }
        });

        if (!existingEnrollment) {
            await prisma.turmaStudent.create({
                data: {
                    studentId: student.id,
                    turmaId: turma.id,
                    status: 'ACTIVE',
                    enrolledAt: new Date(),
                    paymentStatus: 'PAID'
                }
            });
            console.log('📝 Aluno matriculado na turma de teste.');
        } else {
            console.log('📝 Aluno já matriculado.');
        }
    }

    // 5. Create 3 Lessons starting NOW
    const now = new Date();
    const baseTime = new Date(now);
    baseTime.setSeconds(0);
    baseTime.setMilliseconds(0);

    // Create 10 lessons evenly spaced over the next 60 minutes
    const lessonsData = Array.from({ length: 10 }, (_, i) => ({
        offset: (i * 6) + 5, // Starts at +5min, +11min, ..., +59min
        title: `Aula Teste #${i + 7} (+${(i * 6) + 5}min)`
    }));

    // Get a Lesson Plan
    let lessonPlan = await prisma.lessonPlan.findFirst({ where: { courseId: course.id, isActive: true } });

    if (!lessonPlan) {
        // Create Minimal Lesson Plan
        lessonPlan = await prisma.lessonPlan.create({
            data: {
                courseId: course.id,
                title: "Plano de Aula Teste",
                lessonNumber: 1,
                weekNumber: 1,
                warmup: {},
                techniques: {},
                simulations: {},
                cooldown: {},
                duration: 5
            }
        });
    }

    console.log('\n📅 Agendando aulas:');

    for (let i = 0; i < lessonsData.length; i++) {
        const item = lessonsData[i];
        const lessonDate = addMinutes(baseTime, item.offset);

        const tl = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonPlanId: lessonPlan.id,
                scheduledDate: lessonDate, // CORRECTED: scheduledDate
                lessonNumber: i + 7,      // START FROM 7 (Avoid collision)
                title: item.title,        // REQUIRED: title
                status: 'SCHEDULED',
                duration: 5,
                notes: "Aula gerada automaticamente via script de teste" // CORRECTED: notes
            }
        });

        console.log(`   - ${item.title}: ${lessonDate.toLocaleTimeString()} (ID: ${tl.id})`);
    }

    console.log('\n✅ Tudo pronto! Recarregue o Kiosk de Check-in.');
}

main()
    .catch(e => {
        console.error('❌ Error executing script:');
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
