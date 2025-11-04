import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Teste Check-in\n");

  const turma = await prisma.turma.findFirst({ where: { isActive: true } });
  const student = await prisma.student.findFirst({ where: { isActive: true }, include: { user: true } });

  if (!turma || !student) {
    console.error("Turma ou aluno não encontrado");
    process.exit(1);
  }

  console.log("Turma:", turma.name);
  console.log("Aluno:", student.user.firstName, "\n");

  const lastLesson = await prisma.turmaLesson.findFirst({ where: { turmaId: turma.id }, orderBy: { lessonNumber: "desc" } });
  const startNum = (lastLesson?.lessonNumber || 0) + 1;

  const today = dayjs();
  const hours = [8, 9, 10, 14, 15];

  console.log("Criando aulas...\n");

  const lessons = [];
  for (let i = 0; i < hours.length; i++) {
    const date = today.hour(hours[i]).minute(0).second(0).millisecond(0).toDate();
    const lesson = await prisma.turmaLesson.create({
      data: {
        turmaId: turma.id,
        lessonNumber: startNum + i,
        title: `Aula ${hours[i]}h`,
        scheduledDate: date,
        duration: i === 3 ? 90 : 60,
        status: "SCHEDULED",
        isActive: true,
      },
    });
    lessons.push(lesson);
    console.log(`  ${hours[i]}h - ${hours[i] + 1}h (ID: ${lesson.id})`);
  }

  console.log("\nFazendo check-ins...\n");

  for (let i = 0; i < lessons.length; i++) {
    try {
      await prisma.turmaAttendance.create({
        data: {
          turmaId: turma.id,
          turmaLessonId: lessons[i].id,
          studentId: student.id,
          present: true,
          late: false,
          notes: "Teste",
          checkedAt: new Date(),
        },
      });
      console.log(`  [${i+1}] OK`);
    } catch (e: any) {
      console.log(`  [${i+1}] ${e.code === "P2002" ? "Já existe" : `Erro: ${e.message}`}`);
    }
  }

  console.log("\nCompleto!\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
