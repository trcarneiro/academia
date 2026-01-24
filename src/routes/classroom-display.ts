// @ts-nocheck
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

/**
 * Classroom Display Routes
 * Endpoints for the TV/monitor display in classrooms
 */
export default async function classroomDisplayRoutes(fastify: FastifyInstance) {

    /**
     * GET /api/classroom-display/current
     * Returns the current class info for display (auto-detects based on time)
     */
    fastify.get('/current', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { requireOrganizationId } = await import('@/utils/tenantHelpers');
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            const now = new Date();

            // Find current or upcoming class (within 15 minutes)
            const bufferTime = new Date(now);
            bufferTime.setMinutes(bufferTime.getMinutes() - 15);

            // Get today's classes
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            const classes = await prisma.class.findMany({
                where: {
                    organizationId,
                    date: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                },
                include: {
                    course: true,
                    instructor: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    lessonPlan: {
                        include: {
                            activityItems: {
                                orderBy: { ord: 'asc' },
                                include: {
                                    activity: true
                                }
                            }
                        }
                    }
                },
                orderBy: [{ startTime: 'asc' }]
            });

            // Find the current class (happening now or about to start)
            let currentClass = null;
            for (const cls of classes) {
                const classDate = new Date(cls.date);

                const startTimeDate = new Date(cls.startTime);
                const startHour = startTimeDate.getHours();
                const startMin = startTimeDate.getMinutes();

                const endTimeDate = new Date(cls.endTime);
                const endHour = endTimeDate.getHours();
                const endMin = endTimeDate.getMinutes();

                const classStart = new Date(classDate);
                classStart.setHours(startHour, startMin, 0, 0);

                const classEnd = new Date(classDate);
                classEnd.setHours(endHour, endMin, 0, 0);

                // Within buffer or during class
                if (now >= new Date(classStart.getTime() - 15 * 60 * 1000) && now <= classEnd) {
                    currentClass = {
                        ...cls,
                        startTime: classStart.toISOString(),
                        endTime: classEnd.toISOString()
                    };
                    break;
                }
            }

            if (!currentClass) {
                return reply.send({
                    success: true,
                    data: {
                        class: null,
                        currentActivity: null,
                        nextActivity: null
                    }
                });
            }

            // Calculate current and next activity based on time elapsed
            const classStart = new Date(currentClass.startTime);
            const elapsedMinutes = Math.floor((now.getTime() - classStart.getTime()) / 60000);

            const activities = flattenLessonPlanActivities(currentClass.lessonPlan);
            const { currentActivity, nextActivity } = findCurrentActivity(activities, elapsedMinutes);

            return reply.send({
                success: true,
                data: {
                    class: {
                        id: currentClass.id,
                        title: currentClass.title || currentClass.course?.name || 'Aula',
                        startTime: currentClass.startTime,
                        endTime: currentClass.endTime,
                        instructor: {
                            name: currentClass.instructor?.user
                                ? `${currentClass.instructor.user.firstName} ${currentClass.instructor.user.lastName}`.trim()
                                : 'Instrutor'
                        },
                        course: currentClass.course
                    },
                    currentActivity,
                    nextActivity
                }
            });

        } catch (error) {
            logger.error('Error fetching classroom display:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch display data'
            });
        }
    });

    /**
     * GET /api/classroom-display/:id
     * Returns display info for a specific class
     */
    fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const cls = await prisma.class.findUnique({
                where: { id },
                include: {
                    course: true,
                    instructor: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    },
                    lessonPlan: {
                        include: {
                            activityItems: {
                                orderBy: { ord: 'asc' },
                                include: {
                                    activity: true
                                }
                            }
                        }
                    }
                }
            });

            if (!cls) {
                return reply.code(404).send({
                    success: false,
                    message: 'Class not found'
                });
            }

            const now = new Date();
            const classDate = new Date(cls.date);

            const startTimeDate = new Date(cls.startTime);
            const startHour = startTimeDate.getHours();
            const startMin = startTimeDate.getMinutes();

            const endTimeDate = new Date(cls.endTime);
            const endHour = endTimeDate.getHours();
            const endMin = endTimeDate.getMinutes();

            const classStart = new Date(classDate);
            classStart.setHours(startHour, startMin, 0, 0);

            const classEnd = new Date(classDate);
            classEnd.setHours(endHour, endMin, 0, 0);

            const elapsedMinutes = Math.floor((now.getTime() - classStart.getTime()) / 60000);
            const activities = flattenLessonPlanActivities(cls.lessonPlan);
            const { currentActivity, nextActivity } = findCurrentActivity(activities, elapsedMinutes);

            return reply.send({
                success: true,
                data: {
                    class: {
                        id: cls.id,
                        title: cls.title || cls.course?.name || 'Aula',
                        startTime: classStart.toISOString(),
                        endTime: classEnd.toISOString(),
                        instructor: {
                            name: cls.instructor?.user
                                ? `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}`.trim()
                                : 'Instrutor'
                        },
                        course: cls.course
                    },
                    currentActivity,
                    nextActivity
                }
            });

        } catch (error) {
            logger.error('Error fetching class display:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch display data'
            });
        }
    });
}

/**
 * Flatten lesson plan sections into a list of activities with cumulative timing
 */
function flattenLessonPlanActivities(lessonPlan: any): any[] {
    if (!lessonPlan) return [];

    const activities: any[] = [];
    let cumulativeStart = 0;

    // Handle new structure (activityItems)
    if (lessonPlan.activityItems && Array.isArray(lessonPlan.activityItems)) {
        for (const item of lessonPlan.activityItems) {
            const activity = item.activity || {};
            const duration = item.duration || activity.durationMinutes || 10;

            activities.push({
                id: activity.id || item.id,
                name: activity.title || item.name || 'Atividade',
                description: activity.description || item.objectives,
                duration,
                startMinute: cumulativeStart,
                endMinute: cumulativeStart + duration,
                type: item.segment || activity.type
            });
            cumulativeStart += duration;
        }
    }

    // Fallback for legacy structure
    if (lessonPlan.sections && Array.isArray(lessonPlan.sections)) {
        for (const section of lessonPlan.sections) {
            for (const activity of (section.activities || [])) {
                const duration = activity.durationMinutes || activity.duration || 10;
                activities.push({
                    id: activity.id,
                    name: activity.name || activity.title || section.name,
                    description: activity.description,
                    duration,
                    startMinute: cumulativeStart,
                    endMinute: cumulativeStart + duration,
                    type: section.name || section.type
                });
                cumulativeStart += duration;
            }
        }
    }

    return activities;
}

/**
 * Find the current activity based on elapsed minutes
 */
function findCurrentActivity(activities: any[], elapsedMinutes: number): { currentActivity: any; nextActivity: any } {
    if (activities.length === 0) {
        return { currentActivity: null, nextActivity: null };
    }

    let currentActivity = null;
    let nextActivity = null;

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];

        if (elapsedMinutes >= activity.startMinute && elapsedMinutes < activity.endMinute) {
            // Found current activity
            const elapsedInActivity = (elapsedMinutes - activity.startMinute) * 60;
            const remaining = (activity.endMinute - elapsedMinutes) * 60;

            currentActivity = {
                ...activity,
                elapsed: elapsedInActivity,
                remaining,
                duration: activity.duration * 60 // in seconds for display
            };

            // Next activity
            if (i + 1 < activities.length) {
                nextActivity = activities[i + 1];
            }
            break;
        }
    }

    // If no current activity found (before or after class)
    if (!currentActivity && activities.length > 0) {
        if (elapsedMinutes < 0) {
            // Before class - show first activity as upcoming
            nextActivity = activities[0];
        }
    }

    return { currentActivity, nextActivity };
}
