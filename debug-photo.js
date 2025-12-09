const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPhoto() {
  try {
    const student = await prisma.student.findFirst({
      where: {
        biometricData: {
          isNot: null
        }
      },
      include: {
        biometricData: true,
        user: true
      }
    });

    if (!student) {
      console.log('No student with biometric data found');
      return;
    }

    console.log('Student found:', student.user.firstName);
    
    if (student.biometricData) {
      console.log('Biometric Data:', JSON.stringify(student.biometricData, null, 2));
    } else {
      console.log('No biometric data found');
    }

    if (student.user) {
        console.log('User Data found');
        console.log('User Avatar URL length:', student.user.avatarUrl ? student.user.avatarUrl.length : 0);
        console.log('User Avatar URL start:', student.user.avatarUrl ? student.user.avatarUrl.substring(0, 50) : 'null');
    } else {
        console.log('No user associated');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPhoto();
