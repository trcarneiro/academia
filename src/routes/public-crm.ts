import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { CRMService } from '@/services/crmService';
import dayjs from 'dayjs';

/**
 * Public CRM Routes
 * 
 * Accessible without authentication for Leads to:
 * - View their info (context for booking)
 * - List available trial classes
 * - Book a trial class
 * 
 * Prefix: /lp/crm
 */
export default async function publicCrmRoutes(fastify: FastifyInstance) {

    // ============================================================================
    // GET /lp/crm/info/:leadId - Get Lead Context
    // ============================================================================
    fastify.get('/info/:leadId', async (request, reply: FastifyReply) => {
        try {
            console.log('GET /info/:leadId hit:', request.params);
            const { leadId } = request.params as any;

            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    organizationId: true,
                    stage: true,
                    organization: {
                        select: {
                            name: true,
                            slug: true,
                            primaryColor: true,
                            secondaryColor: true,
                            logoUrl: true
                        }
                    }
                }
            });

            if (!lead) {
                return reply.code(404).send({
                    success: false,
                    message: 'Lead not found'
                });
            }

            reply.send({
                success: true,
                data: lead
            });

        } catch (error) {
            logger.error('Error fetching lead info:', error);
            reply.code(500).send({
                success: false,
                message: 'Failed to fetch lead info'
            });
        }
    });

    // ============================================================================
    // GET /lp/crm/classes - List Available Trial Classes
    // ============================================================================
    fastify.get('/classes', async (request, reply: FastifyReply) => {
        try {
            const { organizationId, leadId, date } = request.query as any;

            let orgId = organizationId;

            // If leadId is provided, get orgId from lead
            if (leadId && !orgId) {
                const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { organizationId: true } });
                if (lead) orgId = lead.organizationId;
            }

            if (!orgId) {
                return reply.code(400).send({ success: false, message: 'Organization ID or Lead ID is required' });
            }

            const targetDate = date ? dayjs(date) : dayjs();
            const startOfDay = targetDate.startOf('day').toDate();
            const endOfDay = targetDate.add(7, 'day').endOf('day').toDate(); // Show next 7 days

            // Find classes (TurmaLesson) that allow trials
            const lessons = await prisma.turmaLesson.findMany({
                where: {
                    scheduledDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    turma: {
                        organizationId: orgId,
                        isActive: true
                    },
                    status: 'SCHEDULED',
                    isActive: true
                },
                include: {
                    turma: {
                        select: {
                            id: true,
                            name: true,
                            course: {
                                select: {
                                    name: true,
                                    martialArt: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            },
                            instructor: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    scheduledDate: 'asc'
                }
            });

            // Group by date for easier frontend consumption
            const seenKeys = new Set();
            const grouped = lessons.reduce((acc: any, lesson) => {
                const d = dayjs(lesson.scheduledDate).format('YYYY-MM-DD');

                // Deduplicate by date + time + title + modality
                const start = dayjs(lesson.scheduledDate);
                const modality = lesson.turma.course?.martialArt?.name || 'Geral';
                const key = `${d}-${start.format('HH:mm')}-${lesson.title || lesson.turma.name}-${modality}`;

                if (seenKeys.has(key)) return acc;
                seenKeys.add(key);

                if (!acc[d]) acc[d] = [];

                // Derive start and end times
                const end = start.add(lesson.duration, 'minute');

                acc[d].push({
                    id: lesson.id,
                    title: lesson.title || lesson.turma.name,
                    startTime: start.format('HH:mm'),
                    endTime: end.format('HH:mm'),
                    instructor: lesson.turma.instructor,
                    modality: lesson.turma.course?.martialArt?.name || 'Geral',
                    courseName: lesson.turma.course.name,
                    turmaName: lesson.turma.name
                });
                return acc;
            }, {});

            reply.send({
                success: true,
                data: grouped
            });

        } catch (error) {
            logger.error('Error fetching trial classes:', error);
            reply.code(500).send({
                success: false,
                message: 'Failed to fetch classes'
            });
        }
    });

    // ============================================================================
    // POST /lp/crm/book - Book Trial Class
    // ============================================================================
    fastify.post('/book', async (request, reply: FastifyReply) => {
        try {
            const { leadId, classId, date } = request.body as any;

            if (!leadId || !classId || !date) {
                return reply.code(400).send({ success: false, message: 'Missing required fields' });
            }

            // Validate Lead
            const lead = await prisma.lead.findUnique({ where: { id: leadId } });
            if (!lead) {
                return reply.code(404).send({ success: false, message: 'Lead not found' });
            }

            // Use CRM Service to book
            await CRMService.bookTrial(leadId, classId, new Date(date), lead.organizationId);

            reply.send({
                success: true,
                message: 'Trial booked successfully'
            });

        } catch (error) {
            logger.error('Error booking trial:', error);
            reply.code(500).send({
                success: false,
                message: 'Failed to book trial',
                error: (error as Error).message
            });
        }
    });
    // ============================================================================
    // POST /lp/crm/register - Public Lead Registration (Guest Mode)
    // ============================================================================
    fastify.post('/register', async (request, reply: FastifyReply) => {
        try {
            const { name, email, phone, organizationId } = request.body as any;

            if (!name || !phone || !email) {
                return reply.code(400).send({ success: false, message: 'Missing required fields (name, email, phone)' });
            }

            // Default Organization (if not provided, pick the first one or a default)
            // For now, we require organizationId or find a default one
            let targetOrgId = organizationId;
            if (!targetOrgId) {
                const defaultOrg = await prisma.organization.findFirst();
                if (defaultOrg) targetOrgId = defaultOrg.id;
            }

            if (!targetOrgId) {
                return reply.code(400).send({ success: false, message: 'Organization Context not found' });
            }

            // Check if lead already exists (deduplication by email)
            let lead = await prisma.lead.findFirst({
                where: { email, organizationId: targetOrgId }
            });

            if (!lead) {
                // Create new Lead
                lead = await prisma.lead.create({
                    data: {
                        name,
                        email,
                        phone,
                        organization: { connect: { id: targetOrgId } },
                        stage: 'NEW',
                        status: 'ACTIVE',
                        tags: []
                    }
                });
            } else {
                // Update existing lead info if needed
                lead = await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        name, // Update name if changed
                        phone
                    }
                });
            }

            reply.send({
                success: true,
                data: {
                    id: lead.id,
                    name: lead.name,
                    organizationId: lead.organizationId
                }
            });

        } catch (error) {
            logger.error('Error registering public lead:', error);
            reply.code(500).send({
                success: false,
                message: 'Failed to register lead',
                error: (error as Error).message
            });
        }
    });
}
