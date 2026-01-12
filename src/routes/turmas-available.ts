/**
 * GET /api/turmas/available-now
 * Retorna turmas disponíveis AGORA para check-in + próximas turmas
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

interface AvailableQuery {
  organizationId: string;
  studentId?: string;
}

export default async function availableTurmasRoutes(fastify: FastifyInstance) {
  // GET /api/turmas/available-now
  fastify.get<{ Querystring: AvailableQuery }>(
    '/available-now',
    async (request, reply: FastifyReply) => {
      try {
        const { organizationId, studentId } = request.query;

        if (!organizationId) {
          return reply.code(400).send({
            success: false,
            message: 'organizationId é obrigatório',
          });
        }

        const now = new Date();
        const currentDay = now.getDay(); // 0 = domingo, 6 = sábado
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Buscar TurmaLessons de HOJE (não turmas fixas, mas instâncias reais de aulas)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayLessons = await prisma.turmaLesson.findMany({
          where: {
            scheduledDate: {
              gte: todayStart,
              lte: todayEnd
            },
            isActive: true,
            turma: {
              organizationId,
              isActive: true
            }
          },
          include: {
            turma: {
              include: {
                course: true,
                instructor: true,
                unit: true,
                students: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        });

        console.log(`📊 TurmaLessons hoje: ${todayLessons.length}`);

        // Separar em: abertas para check-in AGORA vs próximas
        const openNow: any[] = [];
        const upcoming: any[] = [];

        todayLessons.forEach((lesson) => {
          const turma = lesson.turma;
          const scheduledDate = new Date(lesson.scheduledDate);

          const startTime = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
          const duration = lesson.duration || 90;

          // Calculate end time
          const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
          const endMinutes = startMinutes + duration;
          const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

          // Check-in abre 60min antes e fecha 60min após início (RELAXED FOR TESTING)
          const checkInOpensTime = subtractMinutes(startTime, 60);
          const checkInClosesTime = addMinutes(startTime, 60);

          const isCheckInOpen =
            currentTime >= checkInOpensTime && currentTime <= checkInClosesTime;

          // Calcular vagas disponíveis
          const maxStudents = turma.maxStudents || 20;
          const currentEnrollments = turma.students?.length || 0;
          const availableSlots = maxStudents - currentEnrollments;

          const turmaData = {
            id: turma.id,
            lessonId: lesson.id, // Adicionar ID da aula
            name: lesson.title || turma.name || turma.course?.name || 'Sem nome',
            startTime,
            endTime,
            instructor: turma.instructor
              ? `${turma.instructor.firstName || ''} ${turma.instructor.lastName || ''}`.trim()
              : 'Não definido',
            room: turma.room || turma.unit?.name || 'Sala não definida',
            availableSlots,
            maxStudents,
            currentEnrollments,
            checkInOpens: checkInOpensTime,
            checkInCloses: checkInClosesTime,
            courseId: turma.courseId,
          };

          if (isCheckInOpen) {
            openNow.push(turmaData);
          } else if (currentTime < checkInOpensTime) {
            // Calcular quanto tempo falta para abrir
            const opensInMinutes = calculateMinutesDiff(currentTime, checkInOpensTime);
            upcoming.push({
              ...turmaData,
              opensIn: formatMinutesToHumanTime(opensInMinutes),
              opensInMinutes,
            });
          }
        });

        // Ordenar por horário
        openNow.sort((a, b) => a.startTime.localeCompare(b.startTime));
        upcoming.sort((a, b) => a.opensInMinutes - b.opensInMinutes);

        console.log('✅ Resultado:', {
          openNow: openNow.length,
          upcoming: upcoming.length,
          currentTime,
          openNowNames: openNow.map(t => `${t.name} - ${t.startTime}`)
        });

        return reply.send({
          success: true,
          data: {
            openNow,
            upcoming: upcoming.slice(0, 20), // Mostrar próximas 20 (Expanded for testing)
            total: {
              openNow: openNow.length,
              upcoming: upcoming.length,
            },
            currentTime,
            currentDay: getDayName(currentDay),
          },
        });
      } catch (error) {
        logger.error('Error fetching available turmas:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch available turmas',
        });
      }
    }
  );
}

// Helper functions
function subtractMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins - minutes, 0, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function calculateMinutesDiff(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h2 - h1) * 60 + (m2 - m1);
}

function formatMinutesToHumanTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day];
}
