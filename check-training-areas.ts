import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTrainingAreas() {
  try {
    const trainingAreas = await prisma.trainingArea.findMany({
      select: {
        id: true,
        name: true,
        unitId: true,
        unit: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('Training Areas in database:');
    trainingAreas.forEach((area, index) => {
      console.log(`${index + 1}. ID: ${area.id} | Name: ${area.name} | Unit: ${area.unit?.name || 'N/A'}`);
    });
    
    if (trainingAreas.length === 0) {
      console.log('No training areas found in database!');
    }
  } catch (error) {
    console.error('Error checking training areas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainingAreas();
