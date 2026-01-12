
import { PrismaClient } from '@prisma/client';
import { AttendanceService } from '../src/services/attendanceService';
import { CheckInMethod } from '../src/types';

const prisma = new PrismaClient();
const METHOD_MANUAL: any = 'MANUAL';

async function main() {
    console.log('🚀 Iniciando Teste de Fluxo Completo de Check-in');

    // 1. Encontrar Aluno
    const cpfRaw = '06822689680';
    const cpfFormatted = `${cpfRaw.substring(0, 3)}.${cpfRaw.substring(3, 6)}.${cpfRaw.substring(6, 9)}-${cpfRaw.substring(9, 11)}`;
    const student = await prisma.student.findFirst({
        where: { user: { OR: [{ cpf: cpfRaw }, { cpf: cpfFormatted }] } },
        include: { user: true }
    });

    if (!student) { console.error('❌ Aluno não encontrado!'); return; }
    console.log(`✅ Aluno encontrado: ${student.user.firstName} (ID: ${student.id})`);

    // 2. Encontrar Turma
    const now = new Date();
    const openLessons = await prisma.turmaLesson.findMany({
        where: {
            scheduledDate: {
                gte: new Date(now.getTime() - 60 * 60 * 1000),
                lte: new Date(now.getTime() + 60 * 60 * 1000)
            },
            status: 'SCHEDULED'
        },
        include: { turma: true }
    });

    if (openLessons.length === 0) { console.error('❌ Nenhuma aula disponível.'); return; }
    const lesson = openLessons[0];
    console.log(`📅 Aula: ${lesson.title} (ID: ${lesson.id})`);

    // 3. Realizar Check-in
    console.log('📍 Realizando Check-in...');
    try {
        const result = await AttendanceService.checkInToClass(student.id, {
            classId: lesson.id,
            method: METHOD_MANUAL,
            notes: 'Teste Setup Final'
        });

        console.log('✅ Check-in realizado:', result);
    } catch (error) {
        if (error.message?.includes('já realizou check-in')) {
            console.log('⚠️ Aluno já com check-in (OK).');
        } else {
            console.error('❌ Erro no Check-in:', error.message);
        }
    }

    // 4. Verificar Frequência
    console.log('\n📊 Frequência...');
    const att = await prisma.turmaAttendance.findFirst({
        where: { studentId: student.id, turmaLessonId: lesson.id },
        include: { turma: true }
    });
    console.log(att ? `✅ Presente na turma: ${att.turma.name}` : '❌ Não encontrado.');

    // 5. Graduação
    console.log('\n🎓 Graduação...');
    const prog = await prisma.studentProgress.findFirst({
        where: { studentId: student.id, courseId: lesson.turma.courseId }
    });
    console.log(prog ? `✅ Aulas Computadas: ${prog.attendedClasses}` : '⚠️ Sem progresso de aulas.');

    // Check Faixa
    const grad = await prisma.studentGraduation.findFirst({
        where: { studentId: student.id, courseId: lesson.turma.courseId },
        orderBy: { createdAt: 'desc' }
    });
    console.log(grad ? `✅ Faixa Atual: ${grad.toBelt}` : '⚠️ Sem graduação definida.');


    // 6. Técnicas
    console.log('\n🥋 Técnicas...');
    try {
        const techniques = await prisma.studentTechniqueProgress.findMany({
            where: { studentId: student.id },
            take: 3,
            orderBy: { updatedAt: 'desc' },
            include: { technique: true }
        });
        techniques.forEach(t => console.log(`   - ${t.technique.name} (Progresso: ${t.completed ? '100%' : 'Em andamento'})`));
        if (techniques.length === 0) console.log('ℹ️ Nenhuma técnica recente.');
    } catch (e) { console.warn('Erro ao listar técnicas:', e.message); }

}

main().catch(console.error).finally(() => prisma.$disconnect());
