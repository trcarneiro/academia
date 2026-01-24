
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

async function listClasses() {
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);

    console.log(`Checking classes for today (${format(today, 'yyyy-MM-dd')})...\n`);

    const turmas = await prisma.turma.findMany({
        where: {
            name: { contains: 'TEST' },
            startDate: { gte: start } // Created recently/for today
        },
        include: {
            lessons: true,
            students: {
                include: {
                    student: {
                        include: { user: true }
                    }
                }
            }
        }
    });

    if (turmas.length === 0) {
        console.log('❌ No TEST classes found.');
    } else {
        turmas.forEach(t => {
            console.log(`Class: ${t.name} (ID: ${t.id})`);
            console.log(`  Schedule: ${t.schedule}`);
            t.lessons.forEach(l => {
                console.log(`  - Lesson: ${l.title} @ ${l.scheduledDate.toLocaleString()}`);
            });
            t.students.forEach(s => {
                console.log(`  - Student: ${s.student.user.firstName} ${s.student.user.lastName}`);
            });
            console.log('');
        });
    }
    await prisma.$disconnect();
}

listClasses();
