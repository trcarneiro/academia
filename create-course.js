const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // First check if course already exists
    const existing = await prisma.course.findUnique({
      where: { id: 'krav-maga-faixa-branca-2025' }
    });
    
    if (existing) {
      console.log('✅ Curso já existe:', existing.name);
      return;
    }
    
    // Create the course
    const course = await prisma.course.create({
      data: {
        id: 'krav-maga-faixa-branca-2025',
        organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        name: 'Krav Maga - Faixa Branca',
        description: 'Curso de Krav Maga nível iniciante. Fundamentos de defesa pessoal, golpes básicos e postura.',
        level: 'BEGINNER',
        duration: 6,
        totalClasses: 24,
        classesPerWeek: 2,
        minAge: 16,
        category: 'ADULT',
        orderIndex: 1,
        sequence: 1,
        isBaseCourse: true,
        isActive: true,
        objectives: [
          'Dominar postura básica de combate',
          'Aprender golpes fundamentais',
          'Desenvolver consciência situacional'
        ],
        requirements: [],
        prerequisites: []
      }
    });
    
    console.log('✅ Curso criado com sucesso!');
    console.log('ID:', course.id);
    console.log('Nome:', course.name);
    console.log('Nível:', course.level);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
