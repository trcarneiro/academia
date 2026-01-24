
import { PrismaClient } from '@prisma/client';
import { addHours, addDays, startOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

async function createTestCheckinClassesV2() {
    console.log('🧪 V2: Creating Test Classes for Check-in...\n');

    try {
        console.log('1. Fetching Organization...');
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No Organization found.');
        console.log(`   -> Org: ${org.name} (${org.id})`);

        console.log('2. Fetching Unit...');
        const unit = await prisma.unit.findFirst({ where: { organizationId: org.id } });
        if (!unit) throw new Error('No Unit found.');
        console.log(`   -> Unit: ${unit.name}`);

        console.log('3. Fetching Course...');
        const course = await prisma.course.findFirst({ where: { organizationId: org.id } });
        if (!course) throw new Error('No Course found.');
        console.log(`   -> Course: ${course.name}`);

        console.log('4. Fetching Instructor...');
        const instructor = await prisma.instructor.findFirst({ where: { organizationId: org.id } });
        if (!instructor) throw new Error('No Instructor found.');
        console.log(`   -> Instructor ID: ${instructor.id}, UserID: ${instructor.userId}`);

        console.log('5. Fetching Student...');
        const student = await prisma.student.findFirst({
            where: { organizationId: org.id },
            include: { user: true }
        });
        if (!student) throw new Error('No Student found.');
        console.log(`   -> Student: ${student.user.firstName} (ID: ${student.id})`);

        // Create Helper
        const createClass = async (title: string, startDate: Date, startTimeStr: string, days: number[]) => {
            console.log(`   Creating Turma: "${title}"...`);

            const turma = await prisma.turma.create({
                data: {
                    name: title,
                    description: 'Test V2 Checkin',
                    courseId: course.id,
                    instructorId: instructor.userId,
                    organizationId: org.id,
                    unitId: unit.id,
                    classType: 'COLLECTIVE',
                    startDate: startOfDay(startDate),
                    maxStudents: 20,
                    status: 'SCHEDULED', // Use explicit enum string if known
                    schedule: { daysOfWeek: days, startTime: startTimeStr, durationMinutes: 60 }
                }
            });
            console.log(`      -> Turma Created: ${turma.id}`);

            // Create Lesson
            const lessonStart = new Date(startDate);
            const [h, m] = startTimeStr.split(':').map(Number);
            lessonStart.setHours(h, m, 0, 0);

            console.log(`      Creating Lesson for ${lessonStart.toLocaleString()}...`);
            await prisma.turmaLesson.create({
                data: {
                    turmaId: turma.id,
                    scheduledDate: lessonStart,
                    lessonNumber: 1,
                    title: `${title} - Lesson 1`,
                    status: 'SCHEDULED',
                    duration: 60
                }
            });
            console.log(`      -> Lesson Created.`);

            // Enroll Student
            console.log(`      Enrolling Student...`);
            await prisma.turmaStudent.create({
                data: {
                    turmaId: turma.id,
                    studentId: student.id,
                    status: 'ACTIVE',
                    enrolledAt: new Date()
                }
            });
            console.log(`      -> Student Enrolled.`);
            return turma;
        };

        const now = new Date();
        const twoHours = addHours(now, 2);

        await createClass(`TEST V2: NOW`, now, format(now, 'HH:mm'), [now.getDay()]);
        await createClass(`TEST V2: +2 HOURS`, twoHours, format(twoHours, 'HH:mm'), [twoHours.getDay()]);

        console.log('\n✅ DONE (V2).');

    } catch (e) {
        console.error('❌ FATAL ERROR IN V2 SCRIPT:', e);
        // @ts-ignore
        if (e.meta) console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

createTestCheckinClassesV2();
