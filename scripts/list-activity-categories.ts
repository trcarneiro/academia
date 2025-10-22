import { prisma } from '../src/utils/database';

async function main() {
  const categories = await prisma.activityCategory.findMany({
    select: { id: true, name: true }
  });

  console.log('Activity categories:', categories);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
});
