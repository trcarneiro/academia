
import { PrismaClient } from '@prisma/client';
import { AttendanceService } from '@/services/attendanceService';
import { logger } from '@/utils/logger';

// Mock logger
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;
logger.debug = () => { };

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando verificação de Gamification...\n');

    // 1. Setup Student & Class
    const turma = await prisma.turma.findFirst({
        where: { name: 'Defesa Pessoal - Turma 18h' },
        include: { students: { include: { student: { include: { user: true } } } } }
    });
    if (!turma) throw new Error('Turma não encontrada');

    // Get first student from turma or find any student
    let student = turma.students[0]?.student;

    if (!student) {
        console.log('⚠️ Nenhum aluno na turma. Buscando qualquer aluno...');
        student = await prisma.student.findFirst({ include: { user: true } });
    }

    if (!student) {
        console.error('❌ Nenhum aluno encontrado no sistema.');
        process.exit(1);
    }
    console.log(`✅ Aluno: ${student.user.firstName} (${student.id})`);

    // Verify enrollment
    const enrollment = await prisma.turmaStudent.findUnique({
        where: {
            turmaId_studentId: {
                turmaId: turma.id,
                studentId: student.id
            }
        }
    });

    if (!enrollment) {
        console.log('⚠️ Aluno não matriculado na turma. Matriculando...');
        await prisma.turmaStudent.create({
            data: {
                turmaId: turma.id,
                studentId: student.id
            }
        });
    }

    let lesson = await prisma.turmaLesson.findFirst({
        where: { turmaId: turma.id }
    });

    if (!lesson) {
        console.log('⚠️ Nenhuma aula encontrada. Criando aula de teste...');
        lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonNumber: 99,
                title: 'Aula Teste Gamification',
                scheduledDate: new Date(),
                status: 'SCHEDULED',
                duration: 60
            }
        });
    }

    // Ensure lesson is today for check-in
    await prisma.turmaLesson.update({
        where: { id: lesson.id },
        data: { scheduledDate: new Date() }
    });

    // 2. Cleanup
    console.log('🧹 Limpando dados de teste (attendance, XP, streaks, conquistas)...');
    await prisma.turmaAttendance.deleteMany({
        where: { turmaLessonId: lesson.id, studentId: student.id }
    });
    // Reset Student Stats
    await prisma.student.update({
        where: { id: student.id },
        data: { totalXP: 0, currentStreak: 0, globalLevel: 1, lastCheckinDate: null }
    });
    await prisma.pointsTransaction.deleteMany({
        where: { studentId: student.id }
    });
    await prisma.studentAchievement.deleteMany({
        where: { studentId: student.id }
    });

    // Explicitly delete BadgeUnlocks too if you want
    await prisma.badgeUnlock.deleteMany({
        where: { studentId: student.id }
    });

    // 3. Perform Check-in
    console.log('\n📲 Realizando Check-in...');
    try {
        const result = await AttendanceService.checkInToClass(student.id, {
            classId: lesson.id,
            method: 'QR_CODE',
            status: 'PRESENT'
        });

        console.log('✅ Check-in realizado:', result.id);

        if (result.gamification) {
            console.log('\n🎁 GAMIFICATION RESPONSE DETECTED:');
            console.log(JSON.stringify(result.gamification, null, 2));
        } else {
            console.error('❌ Missing gamification in response!');
        }
    } catch (e) {
        console.error('Check-in failed:', e);
        process.exit(1);
    }

    // 4. Verify DB
    const updatedStudent = await prisma.student.findUnique({
        where: { id: student.id }
    });

    console.log('\n📊 Verificação no Banco de Dados:');
    console.log(`- XP: ${updatedStudent.totalXP} (Esperado > 0)`);
    console.log(`- Nível: ${updatedStudent.globalLevel}`);
    console.log(`- Streak: ${updatedStudent.currentStreak}`);

    if (updatedStudent.totalXP > 0) console.log('✅ XP concedido corretamente.');
    else console.error('❌ XP NÃO foi concedido.');

    const transactions = await prisma.pointsTransaction.findMany({
        where: { studentId: student.id }
    });
    console.log(`- Transações criadas: ${transactions.length}`);
    transactions.forEach(t => console.log(`  > ${t.points} XP por ${t.reason} (${t.type})`));

    // Check Achievements (Maybe First Check-in?)
    const achievements = await prisma.studentAchievement.findMany({
        where: { studentId: student.id },
        include: { achievement: true }
    });

    if (achievements.length > 0) {
        console.log(`\n🏆 Conquistas Desbloqueadas: ${achievements.length}`);
        achievements.forEach(a => console.log(`  > ${a.achievement.name}`));
    } else {
        console.log('\nℹ️ Nenhuma conquista desbloqueada (Talvez normal para primeiro check-in se não houver conquista de "Primeira Aula").');
    }

    console.log('\n🎉 Teste completo!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
