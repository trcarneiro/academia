/**
 * VALIDAÇÃO: Impedir Check-in em Aulas Conflitantes
 * 
 * Adicionar ao backend (attendanceService.ts) para validar ANTES de criar TurmaAttendance
 */

// Em src/services/attendanceService.ts, método checkInToClass, ANTES de criar attendance:

// ========== ADICIONAR APÓS LINHA ~120 (depois de verificar student exists) ==========

// ✅ VALIDAÇÃO: Verificar se aluno já tem check-in em aula conflitante no mesmo horário
const currentLessonStart = dayjs(classInfo.startTime);
const currentLessonEnd = currentLessonStart.add(classInfo.duration || 60, 'minute');

// Buscar check-ins do dia para o aluno
const todayStart = dayjs().startOf('day').toDate();
const todayEnd = dayjs().endOf('day').toDate();

const [existingTurmaAttendances, existingLegacyAttendances] = await Promise.all([
  // Check-ins em TurmaLesson (novo sistema)
  prisma.turmaAttendance.findMany({
    where: {
      studentId,
      checkedAt: {
        gte: todayStart,
        lte: todayEnd
      }
    },
    include: {
      turmaLesson: true
    }
  }),
  // Check-ins em Class (sistema legado)
  prisma.attendance.findMany({
    where: {
      studentId,
      checkInTime: {
        gte: todayStart,
        lte: todayEnd
      }
    },
    include: {
      class: true
    }
  })
]);

// Verificar conflitos de horário
const hasConflict = [...existingTurmaAttendances, ...existingLegacyAttendances].some(attendance => {
  let lessonStart, lessonEnd;
  
  if ('turmaLesson' in attendance && attendance.turmaLesson) {
    // TurmaLesson
    lessonStart = dayjs(attendance.turmaLesson.scheduledDate);
    lessonEnd = lessonStart.add(attendance.turmaLesson.duration || 60, 'minute');
  } else if ('class' in attendance && attendance.class) {
    // Legacy Class
    lessonStart = dayjs(attendance.class.date);
    lessonEnd = lessonStart.add(attendance.class.duration || 60, 'minute');
  } else {
    return false; // Sem informação de aula, não pode validar
  }
  
  // Verificar se os horários se sobrepõem
  // Conflito se: (currentStart < lessonEnd) E (currentEnd > lessonStart)
  const overlaps = currentLessonStart.isBefore(lessonEnd) && currentLessonEnd.isAfter(lessonStart);
  
  return overlaps;
});

if (hasConflict) {
  throw new Error('CONFLITO_HORARIO: Você já tem check-in em outra aula neste horário. Não é possível estar em dois lugares ao mesmo tempo.');
}

// ========== CONTINUAR COM O CÓDIGO EXISTENTE DE CRIAÇÃO DE ATTENDANCE ==========
