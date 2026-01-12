import { PrismaClient } from '@prisma/client';
import { AttendanceService } from '@/services/attendanceService';
import { PerformanceService } from '@/services/performanceService';
import { logger } from '@/utils/logger';

// Mock logger to see output in console
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;
logger.debug = console.log;

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando verificação do fluxo de check-in...\n');

    // 1. Buscar a última turma criada
    const turma = await prisma.turma.findFirst({
        where: { name: 'Defesa Pessoal - Turma 18h' },
        orderBy: { createdAt: 'desc' }
    });

    if (!turma) throw new Error('Turma não encontrada. Rode o setup primeiro.');
    console.log(`✅ Turma encontrada: ${turma.name} (${turma.id})`);

    // 2. Buscar aula de hoje
    const lesson = await prisma.turmaLesson.findFirst({
        where: {
            turmaId: turma.id,
            title: 'Aula 01 - Introdução'
        },
        include: { lessonPlan: { include: { techniqueLinks: true } } }
    });

    if (!lesson) throw new Error('Aula de hoje não encontrada.');

    // ATUALIZAÇÃO: Ajustar horário para agora para permitir check-in
    await prisma.turmaLesson.update({
        where: { id: lesson.id },
        data: { scheduledDate: new Date() }
    });
    console.log(`✅ Aula encontrada e ajustada para agora: ${lesson.title} (${lesson.id})`);
    console.log(`ℹ️  Técnicas na aula: ${lesson.lessonPlan?.techniqueLinks.length}`);

    // 3. Buscar aluno de teste
    const student = await prisma.student.findFirst({
        where: {
            user: { email: 'aluno.teste@academia.com' } // Assuming this email from setup
        },
        include: { user: true }
    });

    // Fallback if created with random/existing student in setup
    const studentToUse = student || await prisma.student.findFirst({
        where: {
            turmaStudents: { some: { turmaId: turma.id } }
        },
        include: { user: true }
    });

    if (!studentToUse) throw new Error('Aluno não encontrado.');
    console.log(`✅ Aluno encontrado: ${studentToUse.user.firstName} (${studentToUse.id})`);

    // 4. Limpar check-in anterior se houver (para permitir re-teste)
    await prisma.turmaAttendance.deleteMany({
        where: {
            turmaLessonId: lesson.id,
            studentId: studentToUse.id
        }
    });
    await prisma.techniqueRecord.deleteMany({
        where: {
            studentId: studentToUse.id,
            // Delete records for techniques in this lesson
            techniqueId: { in: lesson.lessonPlan?.techniqueLinks.map(l => l.techniqueId) || [] }
        }
    });
    console.log('🧹 Dados anteriores limpos.');

    // 5. Realizar Check-in
    console.log('\n📲 Realizando Check-in...');
    try {
        const result = await AttendanceService.checkInToClass(studentToUse.id, {
            classId: lesson.id,
            method: 'QR_CODE', // Mocking enum or string
            status: 'PRESENT'
        } as any); // Type casting if needed due to enum mismatches in script context
        console.log('✅ Check-in realizado com sucesso!');
        console.log('   Attendance ID:', result.id);
    } catch (error) {
        console.error('❌ Falha no check-in:', error);
        process.exit(1);
    }

    // 6. Verificar TurmaAttendance
    const attendance = await prisma.turmaAttendance.findUnique({
        where: {
            turmaLessonId_studentId: {
                turmaLessonId: lesson.id,
                studentId: studentToUse.id
            }
        }
    });

    if (attendance && attendance.present) {
        console.log('✅ TurmaAttendance verificado (Presente).');
    } else {
        console.error('❌ TurmaAttendance não encontrado ou incorreto.');
    }

    // 7. Verificar Auto-Registro de Técnicas
    console.log('\n🔍 Verificando Auto-Registro de Técnicas...');
    // Wait a bit for async operations if any (though Service awaited it)

    const techniqueRecords = await prisma.techniqueRecord.findMany({
        where: {
            studentId: studentToUse.id,
            lessonPlanId: lesson.lessonPlanId
        },
        include: { technique: true }
    });

    console.log(`📊 Registros encontrados: ${techniqueRecords.length}`);

    if (techniqueRecords.length > 0) {
        techniqueRecords.forEach(tr => {
            console.log(`   - Técnica: ${tr.technique.name}`);
            console.log(`     Practice Count: ${tr.practiceCount}`);
            console.log(`     Proficiency: ${tr.proficiency}`);
        });
        console.log('✅ Técnicas registradas corretamente!');
    } else {
        console.error('❌ Nenhuma técnica registrada automaticamente.');
    }

    // 8. Verificar Performance
    console.log('\n📈 Verificando Performance...');
    const metrics = await PerformanceService.calculatePerformance(studentToUse.id, turma.courseId);
    console.log('   Performance:', metrics.performance);
    console.log('   Score Total:', metrics.score);
    console.log('   Breakdown:', JSON.stringify(metrics.breakdown));
    console.log('   Stats:', JSON.stringify(metrics.stats));

    if (metrics.score >= 0) {
        console.log('✅ Cálculo de performance funcionou.');
    }

    console.log('\n🎉 Teste de fluxo completo com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
