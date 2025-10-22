import { prisma } from '../src/utils/database';

async function main() {
  const courseId = process.argv[2] || 'krav-maga-faixa-branca-2025';

  const lessonPlans = await prisma.lessonPlan.findMany({
    where: { courseId },
    orderBy: { lessonNumber: 'asc' },
    include: {
      techniqueLinks: {
        select: { techniqueId: true },
      }
    }
  });

  console.log(`Course ${courseId} has ${lessonPlans.length} lessons`);
  const totalLinks = lessonPlans.reduce((sum, lesson) => sum + lesson.techniqueLinks.length, 0);
  console.log(`Total technique links: ${totalLinks}`);
  console.log('First 5 lessons with link counts:');
  lessonPlans.slice(0, 5).forEach((lesson) => {
    console.log(`#${lesson.lessonNumber}: ${lesson.title} -> ${lesson.techniqueLinks.length}`);
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
});
