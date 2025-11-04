import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlanCourse() {
  const course = await prisma.course.findUnique({
    where: { id: '5f241bc5-62d6-4f83-9dad-02ca019dbd94' },
    include: { martialArt: true }
  });
  
  if (!course) {
    console.log('❌ Curso não encontrado!');
  } else {
    console.log('\n📚 CURSO DO PLANO ILIMIADO:\n');
    console.log(`   Nome: ${course.name}`);
    console.log(`   Arte Marcial: ${course.martialArt?.name}`);
    console.log(`   isBaseCourse: ${(course as any).isBaseCourse}`);
    console.log(`   sequence: ${(course as any).sequence}`);
    console.log(`   Ativo: ${course.isActive ? '✅' : '❌'}`);
    
    if ((course as any).isBaseCourse) {
      console.log('\n✅ Este É um curso base! Sistema configurado corretamente.\n');
    } else {
      console.log('\n⚠️  Este NÃO é um curso base! Adicione um curso base ao plano.\n');
    }
  }
  
  await prisma.$disconnect();
}

checkPlanCourse();
