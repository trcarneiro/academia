const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Update isBaseCourse to true
    await prisma.course.update({
      where: { id: 'krav-maga-faixa-branca-2025' },
      data: { isBaseCourse: true }
    });
    console.log('Updated isBaseCourse to true');
    
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        isActive: true,
        isBaseCourse: true
      }
    });
    
    console.log('Total cursos:', courses.length);
    courses.forEach(c => {
      console.log(`- ${c.name} | org: ${c.organizationId} | active: ${c.isActive} | base: ${c.isBaseCourse}`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
