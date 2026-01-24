
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);

interface ScheduleConfig {
    days: number[]; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm
    endTime?: string; // HH:mm
    duration?: number; // minutes
}

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

        const schedule = turma.schedule as unknown as ScheduleConfig;
        if (!schedule.days || schedule.days.length === 0 || !schedule.startTime) {
            logger.warn({ turmaId, schedule }, 'Invalid schedule configuration');
            return;
        }

        // 1. Calculate Time Window
        const today = dayjs().startOf('day');
        const endDate = today.add(windowMonths, 'month').endOf('day');

        // Use stored startDate or today, whichever is later (don't backfill past too far if just activated)
        // But if we are re-generating, we should respect the Turma start date.
        let generationStart = dayjs(turma.startDate).startOf('day');
        if (generationStart.isBefore(today)) {
            generationStart = today; // Only generate/fix future from today onwards
        }

        // Parse Start Time
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);

        // 2. Generate Expected Dates
        const expectedDates: Date[] = [];
        let current = generationStart;

        while (current.isBefore(endDate)) {
            if (schedule.days.includes(current.day())) {
                const lessonDate = current.hour(startHour).minute(startMinute).second(0).toDate();
                expectedDates.push(lessonDate);
            }
            current = current.add(1, 'day');
        }

        logger.info({ turmaId, count: expectedDates.length }, 'Calculated expected lesson dates');

        // 3. Reconcile with Existing Lessons
        const existingLessons = turma.lessons;
        const futureLessons = existingLessons.filter(l => dayjs(l.scheduledDate).isAfter(today.subtract(1, 'day')));

        // Set of expected timestamps for O(1) lookup
        const expectedTimestamps = new Set(expectedDates.map(d => d.getTime()));

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
        const toCreate = expectedDates.filter(d => !existingTimestamps.has(d.getTime()));

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

                const dataToCreate = toCreate.map(date => ({
                    turmaId,
                    lessonNumber: nextNumber++,
                    title: `Aula - ${dayjs(date).format('DD/MM/YYYY')}`,
                    scheduledDate: date,
                    status: 'SCHEDULED' as const, // Force literal type if needed by Prisma types
                    duration: schedule.duration || 60,
                    isActive: true,
                    materials: [],
                    objectives: []
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

        // Find all active recurring turmas
        // We assume all 'ACTIVE' turmas should have recurrence if they have a schedule
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
