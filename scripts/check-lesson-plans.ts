
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const course = await prisma.course.findFirst({
        where: { name: { contains: 'Krav Maga', mode: 'insensitive' } },
        include: { lessonPlans: true, techniques: true }
    });

    if (!course) {
        console.log('No course found');
        return;
    }

    console.log(`Course: ${course.name}`);
    console.log(`Lesson Plans: ${course.lessonPlans.length}`);
    console.log(`Techniques: ${course.techniques.length}`);

    if (course.lessonPlans.length === 0) {
        console.log('⚠️ No Lesson Plans found! Schedule generation will fail.');
    } else {
        console.log('✅ Lesson Plans exist.');
        course.lessonPlans.slice(0, 3).forEach(lp => {
            console.log(` - Plan ${lp.lessonNumber}: ${lp.title}`);
        });
    }
}

main().finally(() => prisma.$disconnect());
