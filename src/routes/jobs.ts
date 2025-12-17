// @ts-nocheck
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Validation Schemas
const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'VOLUNTEER']).default('FULL_TIME'),
  level: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER']).default('MID'),
  location: z.string().optional(),
  remoteOption: z.boolean().default(false),
  salary: z.string().optional(),
  unitId: z.string().uuid().optional(),
  department: z.string().optional(),
  vacancies: z.number().int().positive().default(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional()
});

const updateJobSchema = createJobSchema.partial();

const applyToJobSchema = z.object({
  coverLetter: z.string().optional(),
  resume: z.string().optional()
});

const reviewApplicationSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'HIRED']),
  reviewNotes: z.string().optional(),
  interviewDate: z.string().datetime().optional()
});

interface AuthRequest extends FastifyRequest {
  user: {
    id: string;
    organizationId: string;
    role: string;
  };
}

export default async function jobsRoutes(fastify: FastifyInstance) {
  // ==================== JOB ROUTES ====================

  // GET /api/jobs - List all jobs
  fastify.get('/', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { status, type, level, unitId } = request.query as {
        status?: string;
        type?: string;
        level?: string;
        unitId?: string;
      };

      const where: any = {
        organizationId: request.user?.organizationId
      };

      if (status) where.status = status;
      if (type) where.type = type;
      if (level) where.level = level;
      if (unitId) where.unitId = unitId;

      const jobs = await prisma.job.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true }
          },
          unit: {
            select: { id: true, name: true, city: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      logger.error('Error fetching jobs:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch jobs'
      });
    }
  });

  // GET /api/jobs/public - List public active jobs (no auth required)
  fastify.get('/public', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { organizationId } = request.query as { organizationId?: string };

      const where: any = {
        status: 'ACTIVE',
        publishedAt: { lte: new Date() }
      };

      if (organizationId) {
        where.organizationId = organizationId;
      }

      const jobs = await prisma.job.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true, logoUrl: true }
          },
          unit: {
            select: { id: true, name: true, city: true, address: true }
          },
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { publishedAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      logger.error('Error fetching public jobs:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch public jobs'
      });
    }
  });

  // GET /api/jobs/:id - Get job by ID
  fastify.get('/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              website: true,
              description: true
            }
          },
          unit: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              address: true,
              phone: true,
              email: true
            }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          applications: {
            where: { userId: request.user?.id },
            select: { id: true, status: true, appliedAt: true }
          },
          _count: {
            select: { applications: true }
          }
        }
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      return reply.send({
        success: true,
        data: job
      });
    } catch (error) {
      logger.error('Error fetching job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch job'
      });
    }
  });

  // POST /api/jobs - Create new job
  fastify.post('/', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const data = createJobSchema.parse(request.body);

      const job = await prisma.job.create({
        data: {
          ...data,
          organizationId: request.user!.organizationId,
          createdById: request.user!.id,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined
        },
        include: {
          organization: {
            select: { id: true, name: true }
          },
          unit: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      logger.info(`Job created: ${job.id} by user ${request.user!.id}`);

      return reply.code(201).send({
        success: true,
        data: job,
        message: 'Job created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      logger.error('Error creating job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create job'
      });
    }
  });

  // PUT /api/jobs/:id - Update job
  fastify.put('/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateJobSchema.parse(request.body);

      // Check if job exists and belongs to organization
      const existingJob = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId
        }
      });

      if (!existingJob) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      const job = await prisma.job.update({
        where: { id },
        data: {
          ...data,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined
        },
        include: {
          organization: {
            select: { id: true, name: true }
          },
          unit: {
            select: { id: true, name: true }
          },
          _count: {
            select: { applications: true }
          }
        }
      });

      logger.info(`Job updated: ${job.id} by user ${request.user!.id}`);

      return reply.send({
        success: true,
        data: job,
        message: 'Job updated successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      logger.error('Error updating job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update job'
      });
    }
  });

  // DELETE /api/jobs/:id - Delete job
  fastify.delete('/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if job exists and belongs to organization
      const existingJob = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId
        }
      });

      if (!existingJob) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      await prisma.job.delete({
        where: { id }
      });

      logger.info(`Job deleted: ${id} by user ${request.user!.id}`);

      return reply.send({
        success: true,
        message: 'Job deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to delete job'
      });
    }
  });

  // POST /api/jobs/:id/publish - Publish job
  fastify.post('/:id/publish', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId
        }
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      const updatedJob = await prisma.job.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          publishedAt: new Date()
        },
        include: {
          _count: {
            select: { applications: true }
          }
        }
      });

      logger.info(`Job published: ${id} by user ${request.user!.id}`);

      return reply.send({
        success: true,
        data: updatedJob,
        message: 'Job published successfully'
      });
    } catch (error) {
      logger.error('Error publishing job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to publish job'
      });
    }
  });

  // POST /api/jobs/:id/close - Close job
  fastify.post('/:id/close', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.job.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId
        }
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      const updatedJob = await prisma.job.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      });

      logger.info(`Job closed: ${id} by user ${request.user!.id}`);

      return reply.send({
        success: true,
        data: updatedJob,
        message: 'Job closed successfully'
      });
    } catch (error) {
      logger.error('Error closing job:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to close job'
      });
    }
  });

  // ==================== JOB APPLICATION ROUTES ====================

  // GET /api/jobs/:jobId/applications - Get all applications for a job
  fastify.get('/:jobId/applications', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      const { status } = request.query as { status?: string };

      // Check if job exists and belongs to organization
      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          organizationId: request.user!.organizationId
        }
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      const where: any = { jobId };
      if (status) where.status = status;

      const applications = await prisma.jobApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true
            }
          },
          student: {
            select: {
              id: true,
              registrationNumber: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              specializations: true,
              certifications: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: applications,
        total: applications.length
      });
    } catch (error) {
      logger.error('Error fetching applications:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch applications'
      });
    }
  });

  // POST /api/jobs/:jobId/apply - Apply to a job
  fastify.post('/:jobId/apply', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      const data = applyToJobSchema.parse(request.body);

      // Check if job exists and is active
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          message: 'Job not found'
        });
      }

      if (job.status !== 'ACTIVE') {
        return reply.code(400).send({
          success: false,
          message: 'This job is not accepting applications'
        });
      }

      // Check if user already applied
      const existingApplication = await prisma.jobApplication.findUnique({
        where: {
          jobId_userId: {
            jobId,
            userId: request.user!.id
          }
        }
      });

      if (existingApplication) {
        return reply.code(400).send({
          success: false,
          message: 'You have already applied to this job'
        });
      }

      // Get student or instructor data if exists
      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
        include: {
          student: true,
          instructor: true
        }
      });

      const application = await prisma.jobApplication.create({
        data: {
          jobId,
          userId: request.user!.id,
          studentId: user?.student?.id,
          instructorId: user?.instructor?.id,
          coverLetter: data.coverLetter,
          resume: data.resume,
          status: 'PENDING'
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              level: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info(`Job application created: ${application.id} for job ${jobId} by user ${request.user!.id}`);

      return reply.code(201).send({
        success: true,
        data: application,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      logger.error('Error creating application:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to submit application'
      });
    }
  });

  // GET /api/jobs/applications/my - Get current user's applications
  fastify.get('/applications/my', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const applications = await prisma.jobApplication.findMany({
        where: { userId: request.user!.id },
        include: {
          job: {
            include: {
              organization: {
                select: { id: true, name: true, logoUrl: true }
              },
              unit: {
                select: { id: true, name: true, city: true }
              }
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: applications,
        total: applications.length
      });
    } catch (error) {
      logger.error('Error fetching user applications:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch applications'
      });
    }
  });

  // GET /api/jobs/applications/:id - Get application by ID
  fastify.get('/applications/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const application = await prisma.jobApplication.findUnique({
        where: { id },
        include: {
          job: {
            include: {
              organization: {
                select: { id: true, name: true, logoUrl: true }
              },
              unit: {
                select: { id: true, name: true, city: true }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              cpf: true,
              birthDate: true
            }
          },
          student: {
            select: {
              id: true,
              registrationNumber: true,
              category: true,
              enrollmentDate: true
            }
          },
          instructor: {
            select: {
              id: true,
              specializations: true,
              certifications: true,
              experience: true,
              hireDate: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!application) {
        return reply.code(404).send({
          success: false,
          message: 'Application not found'
        });
      }

      // Check authorization: user can see their own application or if they're from the same org as the job
      const job = await prisma.job.findUnique({
        where: { id: application.jobId },
        select: { organizationId: true }
      });

      if (
        application.userId !== request.user!.id &&
        job?.organizationId !== request.user!.organizationId
      ) {
        return reply.code(403).send({
          success: false,
          message: 'Unauthorized to view this application'
        });
      }

      return reply.send({
        success: true,
        data: application
      });
    } catch (error) {
      logger.error('Error fetching application:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch application'
      });
    }
  });

  // PUT /api/jobs/applications/:id/review - Review application
  fastify.put('/applications/:id/review', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const data = reviewApplicationSchema.parse(request.body);

      const application = await prisma.jobApplication.findUnique({
        where: { id },
        include: {
          job: true
        }
      });

      if (!application) {
        return reply.code(404).send({
          success: false,
          message: 'Application not found'
        });
      }

      // Check if user is from the same organization as the job
      if (application.job.organizationId !== request.user!.organizationId) {
        return reply.code(403).send({
          success: false,
          message: 'Unauthorized to review this application'
        });
      }

      const updatedApplication = await prisma.jobApplication.update({
        where: { id },
        data: {
          status: data.status,
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date(),
          reviewedById: request.user!.id,
          interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Application reviewed: ${id} by user ${request.user!.id} - status: ${data.status}`);

      return reply.send({
        success: true,
        data: updatedApplication,
        message: 'Application reviewed successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      logger.error('Error reviewing application:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to review application'
      });
    }
  });

  // DELETE /api/jobs/applications/:id - Withdraw application
  fastify.delete('/applications/:id', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const application = await prisma.jobApplication.findUnique({
        where: { id }
      });

      if (!application) {
        return reply.code(404).send({
          success: false,
          message: 'Application not found'
        });
      }

      // Check if user owns the application
      if (application.userId !== request.user!.id) {
        return reply.code(403).send({
          success: false,
          message: 'Unauthorized to withdraw this application'
        });
      }

      // Update status to WITHDRAWN instead of deleting
      await prisma.jobApplication.update({
        where: { id },
        data: {
          status: 'WITHDRAWN'
        }
      });

      logger.info(`Application withdrawn: ${id} by user ${request.user!.id}`);

      return reply.send({
        success: true,
        message: 'Application withdrawn successfully'
      });
    } catch (error) {
      logger.error('Error withdrawing application:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to withdraw application'
      });
    }
  });

  // GET /api/jobs/stats - Get job statistics
  fastify.get('/stats', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      const [
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
      ] = await Promise.all([
        prisma.job.count({
          where: { organizationId: request.user!.organizationId }
        }),
        prisma.job.count({
          where: {
            organizationId: request.user!.organizationId,
            status: 'ACTIVE'
          }
        }),
        prisma.jobApplication.count({
          where: {
            job: {
              organizationId: request.user!.organizationId
            }
          }
        }),
        prisma.jobApplication.count({
          where: {
            job: {
              organizationId: request.user!.organizationId
            },
            status: 'PENDING'
          }
        })
      ]);

      return reply.send({
        success: true,
        data: {
          totalJobs,
          activeJobs,
          totalApplications,
          pendingApplications
        }
      });
    } catch (error) {
      logger.error('Error fetching job stats:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch job statistics'
      });
    }
  });
}
