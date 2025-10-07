import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCourse() {
  try {
    const course = await prisma.course.findFirst({
      where: { 
        name: { contains: 'Faixa Branca' } 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (course) {
      console.log('Course ID:', course.id);
      console.log('Course Name:', course.name);
      
      // Check lesson plans
      const lessonPlans = await prisma.lessonPlan.count({
        where: { courseId: course.id }
      });
      console.log('Lesson Plans:', lessonPlans);
    } else {
      console.log('NOT FOUND');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCourse();
