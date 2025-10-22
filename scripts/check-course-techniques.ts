import { prisma } from '../src/utils/database';

async function main() {
  const courseId = 'krav-maga-faixa-branca-2025';
  const techniques = await prisma.courseTechnique.findMany({
    where: { courseId },
    select: { techniqueId: true, orderIndex: true }
  });

  const sorted: Array<{ techniqueId: string; orderIndex: number }> = techniques.sort(
    (a, b) => a.orderIndex - b.orderIndex
  );
  console.log(`Course ${courseId} has ${sorted.length} technique links`);
  sorted.forEach((tech) => console.log(`${tech.orderIndex}: ${tech.techniqueId}`));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
