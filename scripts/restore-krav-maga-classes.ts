
import { PrismaClient } from '@prisma/client';
import { TurmasService } from '../src/services/turmasService';

const prisma = new PrismaClient();
const turmasService = new TurmasService();

async function main() {
    console.log('🔄 Iniciando restauração das turmas de Krav Maga...');

    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Organização não encontrada');

    // Find Krav Maga Course
    let course = await prisma.course.findFirst({
        where: {
            organizationId: org.id,
            name: { contains: 'Krav Maga' }
        }
    });

    if (!course) {
        console.log('⚠️ Curso de Krav Maga não encontrado. Buscando curso genérico ou base...');
        course = await prisma.course.findFirst({
            where: {
                organizationId: org.id,
                isBaseCourse: true
            }
        });
    }

    if (!course) throw new Error('Nenhum curso encontrado para associar as turmas');
    console.log(`✅ Usando curso: ${course.name} (${course.id})`);

    // Get Unit and Instructor (Defaults)
    const unit = await prisma.unit.findFirst({ where: { organizationId: org.id } });
    const instructor = await prisma.instructor.findFirst({ where: { organizationId: org.id } });

    if (!unit || !instructor) throw new Error('Unidade ou Instrutor não encontrados');

    // Schedules to Create
    // Mon/Wed 19:00, Tue/Thu 18:00, Sat 10:30
    // Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const schedules = [
        {
            days: [1, 3],
            time: '19:00',
            name: 'Krav Maga - Seg/Qua 19h',
            duration: 60
        },
        {
            days: [2, 4],
            time: '18:00',
            name: 'Krav Maga - Ter/Qui 18h',
            duration: 60
        },
        {
            days: [6],
            time: '10:30',
            name: 'Krav Maga - Sáb 10:30',
            duration: 90 // Weekend classes might be longer? Defaulting to 90 or 60. Let's use 60 safely.
        }
    ];

    const startDate = '2026-01-01'; // User said "started 01/01", assuming current year 2026 context

    for (const sched of schedules) {
        // Check if Turma already exists to avoid duplicates
        const existing = await prisma.turma.findFirst({
            where: {
                name: sched.name,
                organizationId: org.id
            }
        });

        if (existing) {
            console.log(`⚠️ Turma "${sched.name}" já existe. Pulando criação.`);
            // Optional: Regenerate schedule if needed logic here
            continue;
        }

        console.log(`Creating Turma: ${sched.name} for days [${sched.days.join(',')}] at ${sched.time}`);

        try {
            const result = await turmasService.create({
                name: sched.name,
                courseId: course.id,
                courseIds: [course.id],
                type: 'COLLECTIVE',
                startDate: startDate, // String YYYY-MM-DD
                endDate: null,
                maxStudents: 30,
                instructorId: instructor.id,
                organizationId: org.id,
                unitId: unit.id,
                schedule: {
                    daysOfWeek: sched.days,
                    time: sched.time,
                    duration: sched.duration || 60
                },
                description: 'Turma restaurada via script',
                price: 0, // Or fetch from plan? Assuming 0/null for now as subscriptions handle price
                requireAttendanceForProgress: true
            } as any);
            console.log(`✅ Turma criada com sucesso: ${result.id} - ${result.name}`);
        } catch (err) {
            console.error(`❌ Erro ao criar turma ${sched.name}:`, err);
        }
    }

    console.log('🏁 Restauração concluída!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // We cannot easily disconnect the service's prisma, but the script process will exit.
        await prisma.$disconnect();
    });
