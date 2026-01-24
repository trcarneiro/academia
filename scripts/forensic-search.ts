
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
});

async function forensicSearch() {
    console.log('🕵️ Starting forensic search for lost content...');

    // 1. All Courses (Order by updatedAt desc)
    const courses = await prisma.course.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { lessonPlans: true, techniques: true } } }
    });

    console.log(`\n📚 Found ${courses.length} Courses:`);
    courses.forEach(c => {
        console.log(`- [${c.organizationId}] "${c.name}" (ID: ${c.id})`);
        console.log(`  Updated: ${c.updatedAt.toISOString()}`);
        console.log(`  Plans: ${c._count.lessonPlans}, Techs: ${c._count.techniques}, Active: ${c.isActive}`);
    });

    // 2. All Lesson Plans (in case orphaned)
    const totalLessonPlans = await prisma.lessonPlan.count();
    console.log(`\n📄 Total Lesson Plans in DB: ${totalLessonPlans}`);

    // Group by CourseId
    const plansByCourse = await prisma.lessonPlan.groupBy({
        by: ['courseId'],
        _count: { id: true }
    });
    console.log('  Distribution:', plansByCourse);

    // 3. Check for specific keywords in Lesson Plans if any
    // const search = await prisma.lessonPlan.findMany({
    //     where: {  },
    //     select: { id: true, title: true, courseId: true }
    // });

    // 4. Check Organizations
    const orgs = await prisma.organization.findMany();
    console.log(`\n🏢 Organizations:`);
    orgs.forEach(o => console.log(`- ${o.name} (${o.id})`));

}

forensicSearch()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
