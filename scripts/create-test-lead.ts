import { prisma } from '../src/utils/database';
import { LeadStage } from '@prisma/client';

async function main() {
    // 1. Get or Create Organization
    let org = await prisma.organization.findFirst({ where: { slug: 'default' } });
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Academia Demo',
                slug: 'default',
                primaryColor: '#2563eb',
                secondaryColor: '#1e40af'
            }
        });
    }

    // 2. Create Lead
    const lead = await prisma.lead.create({
        data: {
            organizationId: org.id,
            name: 'Frontend Test Lead',
            email: `front-test-${Date.now()}@example.com`,
            phone: '11999998888',
            stage: LeadStage.NEW,
            tags: []
        }
    });

    // 3. Create Instructor User
    const instructor = await prisma.user.create({
        data: {
            organizationId: org.id,
            email: `instr-${Date.now()}@test.com`,
            password: 'password',
            firstName: 'Mestre',
            lastName: 'Miyagi',
            role: 'INSTRUCTOR',
            isActive: true
        }
    });

    // 4. Get or Create Course
    let course = await prisma.course.findFirst({
        where: {
            name: 'Krav Maga Iniciante',
            organizationId: org.id
        }
    });

    if (!course) {
        course = await prisma.course.create({
            data: {
                name: 'Krav Maga Iniciante',
                organizationId: org.id,
                duration: 60,
                totalClasses: 10,
                level: 'BEGINNER',
                category: 'ADULT',
                prerequisites: [],
                objectives: [],
                requirements: []
            }
        });
    }

    // 5. Create Turma & Lesson
    const turma = await prisma.turma.create({
        data: {
            organizationId: org.id,
            courseId: course.id,
            instructorId: instructor.id,
            name: 'Turma Manhã',
            startDate: new Date(),
            isActive: true,
            schedule: []
        }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await prisma.turmaLesson.create({
        data: {
            turmaId: turma.id,
            lessonNumber: 1,
            title: 'Aula Experimental',
            scheduledDate: tomorrow,
            duration: 60,
            status: 'SCHEDULED'
        }
    });

    console.log(`\n✅ Valid Class Created for: ${tomorrow.toISOString()}`);
    console.log(`\n✅ Lead Created!`);
    console.log(`Lead ID: ${lead.id}`);
    console.log(`Test URL: http://localhost:4000/trial-booking.html?leadId=${lead.id}`);

    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
