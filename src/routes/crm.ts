import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { getDefaultOrganizationId } from '@/config/dev';
import { requireOrganizationId } from '@/utils/tenantHelpers';
import { LeadStage, LeadStatus, LeadTemperature, Prisma } from '@prisma/client';

/**
 * CRM Routes - Lead Management & Google Ads Integration
 * Follows Academia system patterns (API-first, proper error handling)
 */
export default async function crmRoutes(fastify: FastifyInstance) {

  // ============================================================================
  // LEADS MANAGEMENT
  // ============================================================================

  /**
   * GET /leads - List all leads with filters
   */
  fastify.get('/leads', async (request, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }

      const { 
        stage, 
        status, 
        temperature,
        assignedToId, 
        search,
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query as any;

      // Build where clause
      const where: Prisma.LeadWhereInput = {
        organizationId
      };

      if (stage) where.stage = stage as LeadStage;
      if (status) where.status = status as LeadStatus;
      if (temperature) where.temperature = temperature as LeadTemperature;
      if (assignedToId) where.assignedToId = assignedToId;
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            },
            convertedStudent: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            _count: {
              select: {
                activities: true,
                notes: true
              }
            }
          },
          skip,
          take: limitNum,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.lead.count({ where })
      ]);

      reply.send({
        success: true,
        data: leads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      logger.error('❌ Error fetching leads:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch leads',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/crm/leads/:id - Get single lead with details
   */
  fastify.get('/leads/:id', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }

      const lead = await prisma.lead.findFirst({
        where: { id, organizationId },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true
            }
          },
          convertedStudent: {
            include: {
              user: true
            }
          },
          activities: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          notes: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
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
      logger.error('❌ Error fetching lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/crm/leads - Create new lead (from form submission)
   */
  fastify.post('/leads', async (request, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string; if (!organizationId) { return; }

      const leadData = request.body as any;

      // Calculate timeToContact if firstContactAt is provided
      let timeToContact = null;
      if (leadData.firstContactAt) {
        const created = new Date();
        const contacted = new Date(leadData.firstContactAt);
        timeToContact = Math.floor((contacted.getTime() - created.getTime()) / 60000); // minutes
      }

      const lead = await prisma.lead.create({
        data: {
          ...leadData,
          organizationId,
          timeToContact,
          stage: leadData.stage || LeadStage.NEW,
          status: leadData.status || LeadStatus.ACTIVE,
          temperature: leadData.temperature || LeadTemperature.COLD
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`✅ Lead created: ${lead.name} (${lead.email})`);

      reply.code(201).send({
        success: true,
        data: lead,
        message: 'Lead created successfully'
      });

    } catch (error) {
      logger.error('❌ Error creating lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to create lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * PUT /api/crm/leads/:id - Update lead
   */
  fastify.put('/leads/:id', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const updateData = request.body as any;

      const lead = await prisma.lead.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`✅ Lead updated: ${lead.name}`);

      reply.send({
        success: true,
        data: lead,
        message: 'Lead updated successfully'
      });

    } catch (error) {
      logger.error('❌ Error updating lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to update lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * DELETE /api/crm/leads/:id - Delete lead
   */
  fastify.delete('/leads/:id', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      await prisma.lead.delete({
        where: { id }
      });

      logger.info(`✅ Lead deleted: ${id}`);

      reply.send({
        success: true,
        message: 'Lead deleted successfully'
      });

    } catch (error) {
      logger.error('❌ Error deleting lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to delete lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================================================
  // PIPELINE MANAGEMENT
  // ============================================================================

  /**
   * GET /api/crm/pipeline - Get pipeline statistics
   */
  fastify.get('/pipeline', async (request, reply: FastifyReply) => {
    try {
      const organizationId = (request.headers as any)['x-organization-id'] ||
                            (request.query as any).organizationId ||
                            getDefaultOrganizationId();

      // Count leads by stage
      const leadsByStage = await prisma.lead.groupBy({
        by: ['stage'],
        where: {
          organizationId,
          status: LeadStatus.ACTIVE
        },
        _count: true
      });

      // Get conversion metrics
      const totalLeads = await prisma.lead.count({
        where: { organizationId }
      });

      const convertedLeads = await prisma.lead.count({
        where: {
          organizationId,
          stage: LeadStage.CONVERTED
        }
      });

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Get average time metrics
      const metrics = await prisma.lead.aggregate({
        where: {
          organizationId,
          stage: LeadStage.CONVERTED
        },
        _avg: {
          timeToContact: true,
          timeToEnrollment: true
        }
      });

      // Pipeline by stage
      const pipeline = Object.values(LeadStage).map(stage => {
        const stageData = leadsByStage.find(s => s.stage === stage);
        return {
          stage,
          count: stageData?._count || 0,
          percentage: totalLeads > 0 ? ((stageData?._count || 0) / totalLeads) * 100 : 0
        };
      });

      reply.send({
        success: true,
        data: {
          pipeline,
          metrics: {
            totalLeads,
            convertedLeads,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            avgTimeToContact: metrics._avg.timeToContact || 0,
            avgTimeToEnrollment: metrics._avg.timeToEnrollment || 0
          }
        }
      });

    } catch (error) {
      logger.error('❌ Error fetching pipeline stats:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch pipeline statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/crm/leads/:id/move - Move lead to different stage
   */
  fastify.post('/leads/:id/move', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { stage, userId } = request.body as any;

      const lead = await prisma.lead.update({
        where: { id },
        data: {
          stage: stage as LeadStage,
          // Update timestamps based on stage
          ...(stage === LeadStage.CONTACTED && { firstContactAt: new Date() }),
          ...(stage === LeadStage.QUALIFIED && { qualifiedAt: new Date() }),
          ...(stage === LeadStage.TRIAL_SCHEDULED && { trialScheduledAt: new Date() }),
          ...(stage === LeadStage.TRIAL_ATTENDED && { trialAttendedAt: new Date() }),
          ...(stage === LeadStage.CONVERTED && { enrolledAt: new Date() }),
          ...(stage === LeadStage.LOST && { lostAt: new Date() })
        }
      });

      // Create activity record
      await prisma.leadActivity.create({
        data: {
          leadId: id,
          userId,
          type: 'STATUS_CHANGE' as any,
          title: `Movido para ${stage}`,
          description: `Lead movido para a etapa ${stage}`
        }
      });

      logger.info(`✅ Lead ${lead.name} moved to ${stage}`);

      reply.send({
        success: true,
        data: lead,
        message: 'Lead stage updated successfully'
      });

    } catch (error) {
      logger.error('❌ Error moving lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to update lead stage',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/crm/leads/:id/convert - Convert lead to student
   */
  fastify.post('/leads/:id/convert', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { userId, billingPlanId, courseId } = request.body as any;

      const lead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!lead) {
        return reply.code(404).send({
          success: false,
          message: 'Lead not found'
        });
      }

      // Create user and student in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            organizationId: lead.organizationId,
            email: lead.email,
            password: 'temp123', // TODO: Generate secure password
            role: 'STUDENT' as any,
            firstName: lead.name.split(' ')[0],
            lastName: lead.name.split(' ').slice(1).join(' ') || '',
            phone: lead.phone,
            cpf: lead.cpf,
            birthDate: lead.birthDate,
            isActive: true
          }
        });

        // Create student
        const newStudent = await tx.student.create({
          data: {
            organizationId: lead.organizationId,
            userId: newUser.id,
            enrollmentDate: new Date(),
            isActive: true
          }
        });

        // Update lead
        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            stage: LeadStage.CONVERTED,
            enrolledAt: new Date(),
            convertedStudentId: newStudent.id
          }
        });

        // Create activity
        await tx.leadActivity.create({
          data: {
            leadId: id,
            userId,
            type: 'STATUS_CHANGE' as any,
            title: 'Lead convertido em aluno',
            description: `Lead ${lead.name} foi convertido em aluno`
          }
        });

        return { newUser, newStudent, updatedLead };
      });

      logger.info(`✅ Lead ${lead.name} converted to student`);

      reply.send({
        success: true,
        data: result,
        message: 'Lead converted to student successfully'
      });

    } catch (error) {
      logger.error('❌ Error converting lead:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to convert lead to student',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================================================
  // LEAD ACTIVITIES
  // ============================================================================

  /**
   * POST /api/crm/leads/:id/activities - Add activity to lead
   */
  fastify.post('/leads/:id/activities', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const activityData = request.body as any;

      const activity = await prisma.leadActivity.create({
        data: {
          ...activityData,
          leadId: id
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });

      reply.code(201).send({
        success: true,
        data: activity,
        message: 'Activity added successfully'
      });

    } catch (error) {
      logger.error('❌ Error adding activity:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to add activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/crm/leads/:id/notes - Add note to lead
   */
  fastify.post('/leads/:id/notes', async (request, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const noteData = request.body as any;

      const note = await prisma.leadNote.create({
        data: {
          ...noteData,
          leadId: id
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });

      reply.code(201).send({
        success: true,
        data: note,
        message: 'Note added successfully'
      });

    } catch (error) {
      logger.error('❌ Error adding note:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to add note',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * GET /api/crm/analytics/roi - Get ROI by source
   */
  fastify.get('/analytics/roi', async (request, reply: FastifyReply) => {
    try {
      const organizationId = (request.headers as any)['x-organization-id'] ||
                            (request.query as any).organizationId ||
                            getDefaultOrganizationId();

      const { startDate, endDate } = request.query as any;

      const where: Prisma.LeadWhereInput = {
        organizationId,
        stage: LeadStage.CONVERTED
      };

      if (startDate) {
        where.enrolledAt = { gte: new Date(startDate) };
      }
      if (endDate) {
        where.enrolledAt = { ...where.enrolledAt, lte: new Date(endDate) };
      }

      // Group by campaign
      const campaignStats = await prisma.lead.groupBy({
        by: ['sourceCampaign'],
        where,
        _count: true,
        _sum: {
          costPerAcquisition: true,
          estimatedLTV: true
        }
      });

      const roiData = campaignStats
        .filter(stat => stat.sourceCampaign)
        .map(stat => {
          const totalCost = parseFloat(stat._sum.costPerAcquisition?.toString() || '0');
          const totalRevenue = parseFloat(stat._sum.estimatedLTV?.toString() || '0');
          const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

          return {
            campaign: stat.sourceCampaign,
            conversions: stat._count,
            totalCost,
            totalRevenue,
            roi: parseFloat(roi.toFixed(2))
          };
        })
        .sort((a, b) => b.roi - a.roi);

      reply.send({
        success: true,
        data: roiData
      });

    } catch (error) {
      logger.error('❌ Error fetching ROI analytics:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch ROI analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/crm/analytics/funnel - Get conversion funnel data
   */
  fastify.get('/analytics/funnel', async (request, reply: FastifyReply) => {
    try {
      const organizationId = (request.headers as any)['x-organization-id'] ||
                            (request.query as any).organizationId ||
                            getDefaultOrganizationId();

      const stages = Object.values(LeadStage);
      
      const funnelData = await Promise.all(
        stages.map(async (stage, index) => {
          const count = await prisma.lead.count({
            where: {
              organizationId,
              stage
            }
          });

          // Calculate conversion rate from previous stage
          let conversionRate = 100;
          if (index > 0) {
            const previousCount = await prisma.lead.count({
              where: {
                organizationId,
                stage: stages[index - 1]
              }
            });
            conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;
          }

          return {
            stage,
            count,
            conversionRate: parseFloat(conversionRate.toFixed(2))
          };
        })
      );

      reply.send({
        success: true,
        data: funnelData
      });

    } catch (error) {
      logger.error('❌ Error fetching funnel analytics:', error);
      reply.code(500).send({
        success: false,
        message: 'Failed to fetch funnel analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  logger.info('✅ CRM routes registered');
}
