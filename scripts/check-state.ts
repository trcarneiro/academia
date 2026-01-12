import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const courses = await prisma.course.count();
    const techniques = await prisma.technique.count();
    const lessonPlans = await prisma.lessonPlan.count();
    const turmas = await prisma.turma.count();
    const students = await prisma.student.count();

    console.log(`
📊 ESTADO ATUAL:
   Cursos: ${courses}
   Técnicas: ${techniques}
   Planos de Aula: ${lessonPlans}
   Turmas: ${turmas}
   Alunos: ${students}
  `);

    await prisma.$disconnect();
}

check().catch(console.error);
