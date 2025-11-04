require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCourse() {
  try {
    const course = await prisma.course.findUnique({
      where: { id: 'krav-maga-faixa-branca-2025' },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    console.log('📚 CURSO:', JSON.stringify(course, null, 2));

    const packageData = await prisma.billingPlan.findUnique({
      where: { id: '67c3c6f3-5d65-46e6-bcb3-bb596850e797' },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    console.log('📦 PACOTE:', JSON.stringify(packageData, null, 2));

    if (course && packageData) {
      if (course.organizationId === packageData.organizationId) {
        console.log('✅ MESMA ORGANIZAÇÃO! Curso e pacote na mesma org:', course.organizationId);
      } else {
        console.log('❌ ORGANIZAÇÕES DIFERENTES!');
        console.log('   Curso:', course.organizationId);
        console.log('   Pacote:', packageData.organizationId);
      }
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkCourse();
