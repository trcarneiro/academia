
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
import { normalizeSchedule } from '@/utils/schedule';

dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);

export class RecurrenceService {

    /**
     * Generates lessons for a Turma for the specified window (default 6 months)
     * Handles reconciliation: creates missing, deletes invalid future lessons (if no attendance)
     */
    static async generateLessonsForTurma(turmaId: string, windowMonths: number = 6) {
        logger.info({ turmaId, windowMonths }, 'Starting recurrence generation for Turma');

        const turma = await prisma.turma.findUnique({
            where: { id: turmaId },
            include: {
                lessons: {
                    select: { id: true, scheduledDate: true, _count: { select: { attendances: true } } }
                }
            }
        });

        if (!turma || !turma.isActive || !turma.schedule) {
            logger.warn({ turmaId }, 'Turma not found, inactive or has no schedule');
            return;
        }

        let scheduleData: any;
        try {
            scheduleData = typeof turma.schedule === 'string' ? JSON.parse(turma.schedule) : turma.schedule;
        } catch (e) {
            logger.warn({ turmaId, schedule: turma.schedule }, 'Failed to parse schedule JSON');
            return;
        }

        const slots = normalizeSchedule(scheduleData);
        if (slots.length === 0) {
            logger.warn({ turmaId, schedule: scheduleData }, 'Invalid schedule configuration');
            return;
        }

        // 1. Calculate Time Window
        const today = dayjs().startOf('day');
        const endDate = today.add(windowMonths, 'month').endOf('day');

        let generationStart = dayjs(turma.startDate).startOf('day');
        if (generationStart.isBefore(today)) {
            generationStart = today;
        }

        // 2. Generate Expected Dates
        const expectedDates: { date: Date; duration: number }[] = [];
        let current = generationStart;

        while (current.isBefore(endDate)) {
            const dayOfWeek = current.day();
            const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek);

            for (const slot of daySlots) {
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const lessonDate = current.hour(startHour).minute(startMinute).second(0).toDate();
                expectedDates.push({ date: lessonDate, duration: slot.duration });
            }
            current = current.add(1, 'day');
        }

        logger.info({ turmaId, count: expectedDates.length }, 'Calculated expected lesson dates');

        // 3. Reconcile with Existing Lessons
        const existingLessons = turma.lessons;
        const futureLessons = existingLessons.filter(l => dayjs(l.scheduledDate).isAfter(today.subtract(1, 'day')));

        // Set of expected timestamps for O(1) lookup
        const expectedTimestamps = new Set(expectedDates.map(d => d.date.getTime()));

        // A. Identify Lessons to Delete (Invalid Future Lessons)
        // Condition: Scheduled in future AND not in new schedule AND has NO attendance
        const toDelete = futureLessons.filter(l => {
            const ts = new Date(l.scheduledDate).getTime();
            const hasAttendance = l._count.attendances > 0;
            return !expectedTimestamps.has(ts) && !hasAttendance;
        });

        // B. Identify Lessons to Keep (Already exist and match schedule)
        const existingTimestamps = new Set(futureLessons.map(l => new Date(l.scheduledDate).getTime()));

        // C. Identify Missing Lessons to Create
        const toCreate = expectedDates.filter(d => !existingTimestamps.has(d.date.getTime()));

        logger.info({
            turmaId,
            toDelete: toDelete.length,
            toCreate: toCreate.length,
            preserved: futureLessons.length - toDelete.length
        }, 'Reconciliation analysis complete');

        // 4. Execute Changes via Transaction
        await prisma.$transaction(async (tx) => {
            // Validation before delete
            if (toDelete.length > 0) {
                await tx.turmaLesson.deleteMany({
                    where: {
                        id: { in: toDelete.map(l => l.id) }
                    }
                });
            }

            // Creation
            if (toCreate.length > 0) {
                // Find absolute max lesson number in DB for this Turma (using tx to ensure consistency)
                const lastLesson = await tx.turmaLesson.findFirst({
                    where: { turmaId },
                    orderBy: { lessonNumber: 'desc' },
                    select: { lessonNumber: true }
                });

                let nextNumber = (lastLesson?.lessonNumber || 0) + 1;

                const dataToCreate = toCreate.map(item => ({
                    turmaId,
                    lessonNumber: nextNumber++,
                    title: `Aula - ${dayjs(item.date).format('DD/MM/YYYY')}`,
                    scheduledDate: item.date,
                    status: 'SCHEDULED' as const, // Force literal type if needed by Prisma types
                    duration: item.duration,
                    isActive: true,
                    materials: '',
                    objectives: ''
                }));

                await tx.turmaLesson.createMany({
                    data: dataToCreate
                });
            }
        }, {
            maxWait: 5000, // default: 2000
            timeout: 10000 // default: 5000
        });

        logger.info({ turmaId }, 'Recurrence generation completed successfully');
    }

    /**
     * Process all active turmas in the system
     * Can be called by a cron job
     */
    static async processAllActiveTurmas() {
        logger.info('Starting batch recurrence processing for ALL active turmas');

        const activeTurmas = await prisma.turma.findMany({
            where: { isActive: true, status: 'ACTIVE' },
            select: { id: true }
        });

        logger.info({ count: activeTurmas.length }, 'Found active turmas to process');

        for (const t of activeTurmas) {
            try {
                await this.generateLessonsForTurma(t.id);
            } catch (error) {
                logger.error({ turmaId: t.id, error }, 'Failed to process recurrence for turma');
            }
        }
    }
}
