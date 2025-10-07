import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      take: 5,
      include: {
        user: true // Include user data to see name and email
      }
    });
    
    console.log('Instructors structure:');
    instructors.forEach(instructor => {
      console.log({
        id: instructor.id,
        userId: instructor.userId,
        userFirstName: instructor.user?.firstName,
        userLastName: instructor.user?.lastName,
        userEmail: instructor.user?.email,
        bio: instructor.bio
      });
    });
    
  } catch (error) {
    console.error('Error checking instructors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors();