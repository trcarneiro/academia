// @ts-nocheck
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

/**
 * Instructor Dashboard Routes
 * Endpoints for the instructor's "My Class" view
 */
export default async function instructorDashboardRoutes(fastify: FastifyInstance) {

    // Add request logging
    fastify.addHook('onRequest', async (request, _reply) => {
        logger.info(`InstructorDashboard route - ${request.method} ${request.url}`);
    });

    /**
     * GET /api/instructor/my-classes
     * Returns current class (if any) and upcoming classes for the logged-in instructor
     */
    fastify.get('/my-classes', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { requireOrganizationId } = await import('@/utils/tenantHelpers');
            const organizationId = requireOrganizationId(request, reply);
            if (!organizationId) return;

            // Get instructor ID from auth context or query
            // For now, support query param for testing; in production use auth
            const instructorId = (request.query as any).instructorId || (request as any).user?.instructorId;

            if (!instructorId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Instructor ID not provided'
                });
            }

            const now = new Date();
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);

            // Get classes for today and next 7 days
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);

            // Find all classes taught by this instructor
            const classes = await prisma.class.findMany({
                where: {
                    organizationId,
                    instructorId,
                    date: {
                        gte: todayStart,
                        lte: weekEnd
                    }
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    },
                    turma: {
                        select: {
                            id: true,
                            name: true,
                            room: true
                        }
                    },
                    unit: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    lessonPlan: {
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                                include: {
                                    activities: {
                                        orderBy: { order: 'asc' },
                                        include: {
                                            technique: {
                                                select: {
                                                    id: true,
                                                    name: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    attendances: {
                        include: {
                            student: {
                                include: {
                                    user: {
                                        select: {
                                            firstName: true,
                                            lastName: true
                                        }
                                    },
                                    biometricData: {
                                        select: { photoUrl: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { date: 'asc' },
                    { startTime: 'asc' }
                ]
            });

            // Find current class (happening now)
            let currentClass = null;
            const nextClasses: any[] = [];

            for (const cls of classes) {
                // Parse class times
                const classDate = new Date(cls.date);
                const [startHour, startMin] = (cls.startTime || '00:00').split(':').map(Number);
                const [endHour, endMin] = (cls.endTime || '23:59').split(':').map(Number);

                const classStart = new Date(classDate);
                classStart.setHours(startHour, startMin, 0, 0);

                const classEnd = new Date(classDate);
                classEnd.setHours(endHour, endMin, 0, 0);

                // Check if class is happening now (with 15 min buffer before start)
                const bufferStart = new Date(classStart);
                bufferStart.setMinutes(bufferStart.getMinutes() - 15);

                if (now >= bufferStart && now <= classEnd && !currentClass) {
                    // This is the current class
                    currentClass = formatClassForResponse(cls, classStart, classEnd, true);
                } else if (now < classStart) {
                    // This is a future class
                    nextClasses.push(formatClassForResponse(cls, classStart, classEnd, false));
                }
            }

            // If no current class, check if next class is within 30 minutes (show as "upcoming")
            if (!currentClass && nextClasses.length > 0) {
                const nextClass = nextClasses[0];
                const timeToClass = new Date(nextClass.startTime).getTime() - now.getTime();
                const thirtyMinutes = 30 * 60 * 1000;

                if (timeToClass <= thirtyMinutes && timeToClass > 0) {
                    // Show next class as the "current" with scheduled status
                    currentClass = { ...nextClass, status: 'UPCOMING' };
                    nextClasses.shift();
                }
            }

            return reply.send({
                success: true,
                data: {
                    currentClass,
                    nextClasses: nextClasses.slice(0, 10), // Limit to 10 upcoming
                    totalUpcoming: nextClasses.length
                }
            });

        } catch (error) {
            logger.error('Error fetching instructor classes:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch instructor classes'
            });
        }
    });

    /**
     * POST /api/instructor/class/:id/start
     * Mark a class as started
     */
    fastify.post('/class/:id/start', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const updatedClass = await prisma.class.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    actualStartTime: new Date()
                }
            });

            logger.info(`Class ${id} started by instructor`);

            return reply.send({
                success: true,
                data: updatedClass,
                message: 'Aula iniciada com sucesso'
            });

        } catch (error) {
            logger.error('Error starting class:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to start class'
            });
        }
    });

    /**
     * POST /api/instructor/class/:id/finish
     * Mark a class as finished
     */
    fastify.post('/class/:id/finish', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;

            const updatedClass = await prisma.class.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    actualEndTime: new Date()
                }
            });

            logger.info(`Class ${id} finished by instructor`);

            return reply.send({
                success: true,
                data: updatedClass,
                message: 'Aula finalizada com sucesso'
            });

        } catch (error) {
            logger.error('Error finishing class:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to finish class'
            });
        }
    });
}

/**
 * Helper to format class data for API response
 */
function formatClassForResponse(cls: any, startTime: Date, endTime: Date, isCurrentlyActive: boolean) {
    // Format lesson plan activities into a flat list
    let formattedLessonPlan = null;
    if (cls.lessonPlan) {
        const allActivities: any[] = [];

        for (const section of (cls.lessonPlan.sections || [])) {
            for (const activity of (section.activities || [])) {
                allActivities.push({
                    id: activity.id,
                    name: activity.name || activity.title,
                    description: activity.description,
                    duration: activity.durationMinutes || activity.duration,
                    type: section.name || section.type,
                    order: allActivities.length + 1,
                    techniques: activity.technique ? [{ name: activity.technique.name }] : []
                });
            }
        }

        formattedLessonPlan = {
            id: cls.lessonPlan.id,
            name: cls.lessonPlan.name || cls.lessonPlan.title,
            totalDuration: cls.lessonPlan.totalDuration,
            activities: allActivities
        };
    }

    // Format students list
    const students = (cls.attendances || []).map((att: any) => ({
        id: att.student?.id,
        name: `${att.student?.user?.firstName || ''} ${att.student?.user?.lastName || ''}`.trim(),
        photoUrl: att.student?.biometricData?.photoUrl,
        status: att.status
    }));

    return {
        id: cls.id,
        title: cls.title || cls.course?.name || 'Aula',
        description: cls.description || cls.course?.description,
        date: cls.date,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        room: cls.turma?.room || cls.room,
        status: isCurrentlyActive ? (cls.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'SCHEDULED') : 'SCHEDULED',
        course: cls.course,
        turma: cls.turma,
        unit: cls.unit,
        lessonPlan: formattedLessonPlan,
        students,
        studentCount: students.length
    };
}
