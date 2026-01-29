import { PrismaClient, UserRole } from '@prisma/client';

export interface ClassFilters {
    date?: string;
    startDate?: string;
    endDate?: string;
    instructor?: string;
    course?: string;
    status?: string;
    type?: 'CLASS' | 'PERSONAL_SESSION' | 'TURMA';
    limit: number;
    offset: number;
    organizationId?: string;
}

export class AgendaService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Parse a YYYY-MM-DD string to a local Date (midnight local time)
     */
    private parseLocalDate(dateStr: string): Date {
        const parts = (dateStr || '').split('-');
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        return new Date(isNaN(y) ? 0 : y, (isNaN(m) ? 1 : m) - 1, isNaN(d) ? 1 : d, 0, 0, 0, 0);
    }

    /**
     * Format a Date to local YYYY-MM-DD (no timezone shifts)
     */
    private formatLocalYMD(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private formatTurmaLessonTitle(title: string | null, lessonNumber: number | null): string {
        if (title) return title;
        if (lessonNumber !== null) return `Aula ${lessonNumber}`;
        return 'Aula de Turma';
    }

    async getClasses(filters: ClassFilters, user?: { id: string; role: string }) {
        const whereClause: any = {};
        if (filters.organizationId) {
            whereClause.organizationId = filters.organizationId;
        }

        if (filters.startDate && filters.endDate) {
            const startDate = this.parseLocalDate(filters.startDate);
            const endDate = this.parseLocalDate(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            whereClause.startTime = { gte: startDate, lte: endDate };
        } else if (filters.date) {
            const startDate = this.parseLocalDate(filters.date);
            const endDate = this.parseLocalDate(filters.date);
            endDate.setHours(23, 59, 59, 999);
            whereClause.startTime = { gte: startDate, lte: endDate };
        }

        if (filters.instructor) whereClause.instructorId = filters.instructor;
        if (filters.course) whereClause.courseId = filters.course;
        if (filters.status) whereClause.status = filters.status;

        const classes = await this.prisma.class.findMany({
            where: whereClause,
            include: {
                course: { select: { id: true, name: true, category: true } },
                instructor: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
                attendances: { select: { id: true, studentId: true, status: true } }
            },
            orderBy: { startTime: 'asc' },
            take: filters.limit,
            skip: filters.offset
        });

        const serializedClasses = classes.map(cls => ({
            id: cls.id,
            title: cls.title,
            startTime: cls.startTime.toISOString(),
            endTime: cls.endTime.toISOString(),
            status: cls.status,
            maxStudents: cls.maxStudents,
            actualStudents: cls.actualStudents,
            description: cls.description,
            notes: cls.notes,
            type: 'CLASS',
            course: cls.course ? { id: cls.course.id, name: cls.course.name, category: cls.course.category } : null,
            instructor: cls.instructor ? {
                id: cls.instructor.id,
                name: `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}`.trim(),
                email: cls.instructor.user.email
            } : null,
            attendanceCount: cls.attendances.length,
            attendances: cls.attendances.map(att => ({ id: att.id, studentId: att.studentId, status: att.status }))
        }));

        // Fetch personal training sessions
        let personalSessions: any[] = [];
        try {
            const psWhere: any = {};
            if (whereClause.startTime?.gte) {
                psWhere.startTime = { gte: whereClause.startTime.gte, lte: whereClause.startTime.lte || whereClause.startTime.lt };
            }
            if (filters.status) psWhere.status = filters.status as any;
            if (filters.course) psWhere.courseId = filters.course;

            if (user) {
                if (user.role === UserRole.STUDENT) {
                    const student = await this.prisma.student.findFirst({ where: { userId: user.id } });
                    if (student) psWhere.personalClass = { studentId: student.id };
                    else psWhere.id = '00000000-0000-0000-0000-000000000000';
                } else if (user.role === UserRole.INSTRUCTOR) {
                    const instructor = await this.prisma.instructor.findFirst({ where: { userId: user.id } });
                    if (instructor) psWhere.personalClass = { instructorId: instructor.id };
                }
            }

            const sessions = await this.prisma.personalTrainingSession.findMany({
                where: psWhere,
                include: {
                    course: { select: { id: true, name: true, category: true } },
                    personalClass: {
                        include: {
                            instructor: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
                            student: { include: { user: { select: { firstName: true, lastName: true } } } }
                        }
                    }
                },
                orderBy: { startTime: 'asc' },
                take: filters.limit,
                skip: filters.offset
            });

            personalSessions = sessions.map((s: any) => ({
                id: s.id,
                title: s.personalClass?.title || s.course?.name || 'Sessão Personal',
                startTime: s.startTime.toISOString(),
                endTime: s.endTime.toISOString(),
                status: s.status,
                maxStudents: 1,
                actualStudents: s.attendanceConfirmed ? 1 : 0,
                description: s.instructorNotes || s.feedback || null,
                notes: s.progressNotes || null,
                type: 'PERSONAL_SESSION',
                course: s.course ? { id: s.course.id, name: s.course.name, category: s.course.category } : null,
                instructor: s.personalClass?.instructor ? {
                    id: s.personalClass.instructor.id,
                    name: `${s.personalClass.instructor.user.firstName} ${s.personalClass.instructor.user.lastName}`.trim(),
                    email: s.personalClass.instructor.user.email
                } : null,
                student: s.personalClass?.student ? {
                    id: s.personalClass.student.id,
                    name: `${s.personalClass.student.user.firstName} ${s.personalClass.student.user.lastName}`.trim()
                } : null,
                attendanceCount: s.attendanceConfirmed ? 1 : 0,
                attendances: []
            }));
        } catch (e) {
            console.warn('Failed to fetch personal sessions', e);
        }

        let turmaClasses: any[] = [];
        if (filters.type === 'TURMA' || (!filters.type && filters.startDate && filters.endDate)) {
            turmaClasses = await this.generateVirtualClassesFromTurmas(filters);
        }

        if (filters.type === 'TURMA') return { success: true, data: turmaClasses, total: turmaClasses.length };
        if (filters.type === 'CLASS') return { success: true, data: serializedClasses, total: serializedClasses.length };
        if (filters.type === 'PERSONAL_SESSION') return { success: true, data: personalSessions, total: personalSessions.length };

        const unified = [...serializedClasses, ...personalSessions, ...turmaClasses]
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return {
            success: true,
            data: unified.length > 0 ? unified : turmaClasses,
            total: unified.length > 0 ? unified.length : turmaClasses.length
        };
    }

    async generateVirtualClassesFromTurmas(filters: ClassFilters) {
        if (!filters.startDate || !filters.endDate) return [];
        const startDate = this.parseLocalDate(filters.startDate);
        const endDate = this.parseLocalDate(filters.endDate);
        endDate.setHours(23, 59, 59, 999);

        const turmas = await this.prisma.turma.findMany({
            where: {
                isActive: true,
                organizationId: filters.organizationId,
                instructorId: filters.instructor,
                courseId: filters.course
            },
            include: {
                course: { select: { id: true, name: true, category: true } },
                instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
                unit: { select: { id: true, name: true } }
            }
        });

        const existingLessons = await this.prisma.turmaLesson.findMany({
            where: {
                scheduledDate: { gte: startDate, lte: endDate },
                turma: { isActive: true }
            },
            include: {
                turma: { include: { course: true, instructor: true, unit: true } },
                lessonPlan: { select: { id: true, title: true, description: true } },
                attendances: true
            }
        });

        const lessonMap = new Map<string, any>();
        existingLessons.forEach(lesson => {
            lessonMap.set(`${lesson.turmaId}-${this.formatLocalYMD(lesson.scheduledDate)}`, lesson);
        });

        const virtualClasses: any[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            const dateKey = this.formatLocalYMD(currentDate);

            for (const turma of turmas) {
                if (turma.startDate && currentDate < turma.startDate) continue;
                if (turma.endDate && currentDate > turma.endDate) continue;

                const schedule = turma.schedule as any;
                if (schedule?.daysOfWeek?.includes(dayOfWeek)) {
                    const existing = lessonMap.get(`${turma.id}-${dateKey}`);
                    if (existing) {
                        const startTime = existing.scheduledDate;
                        const endTime = new Date(startTime.getTime() + (existing.duration || 60) * 60 * 1000);
                        virtualClasses.push({
                            id: `turmaLesson-${existing.id}`,
                            type: 'TURMA',
                            title: this.formatTurmaLessonTitle(existing.title, existing.lessonNumber),
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            status: existing.status,
                            maxStudents: turma.maxStudents ?? 0,
                            actualStudents: existing.attendances.length,
                            isVirtual: false,
                            turmaId: existing.turmaId,
                            instructor: turma.instructor ? {
                                name: `${turma.instructor.firstName} ${turma.instructor.lastName}`.trim(),
                                email: turma.instructor.email
                            } : null
                        });
                    } else {
                        const timeParts = (schedule.time || '00:00').split(':');
                        const startTime = new Date(currentDate);
                        startTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                        const endTime = new Date(startTime.getTime() + (parseInt(schedule.duration || '60')) * 60 * 1000);
                        virtualClasses.push({
                            id: `virtual-${turma.id}-${dateKey}`,
                            type: 'TURMA',
                            title: turma.name,
                            startTime: startTime.toISOString(),
                            endTime: endTime.toISOString(),
                            status: 'SCHEDULED',
                            maxStudents: turma.maxStudents ?? 0,
                            actualStudents: 0,
                            isVirtual: true,
                            turmaId: turma.id,
                            instructor: turma.instructor ? {
                                name: `${turma.instructor.firstName} ${turma.instructor.lastName}`.trim(),
                                email: turma.instructor.email
                            } : null
                        });
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return virtualClasses;
    }
}
