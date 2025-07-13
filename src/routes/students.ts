import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';
import FinancialService from '../services/financialService';

// Helper function to get organization ID dynamically
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

// Helper function to generate a temporary password
async function generateTempPassword(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function studentsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // GET /api/students - List all students
  fastify.get('/', {
    schema: {
      description: 'List all students',
      tags: ['Students'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          offset: { type: 'number' },
          category: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const { limit = 50, offset = 0, category, isActive } = request.query as any;
      
      const whereClause: any = {
        organizationId
      };
      
      if (category) {
        whereClause.category = category;
      }
      
      if (isActive !== undefined) {
        whereClause.isActive = isActive;
      }
      
      const students = await prisma.student.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              phone: true,
              isActive: true
            }
          },
          financialResponsible: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              attendances: true,
              evaluations: true,
              progressions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.student.count({
        where: whereClause
      });

      return {
        success: true,
        data: students,
        pagination: {
          total: totalCount,
          limit,
          offset,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch students',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/students/:id - Get student by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get student by ID',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          user: true,
          financialResponsible: true,
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          progressions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              attendances: true,
              evaluations: true,
              progressions: true
            }
          }
        }
      });

      if (!student) {
        reply.code(404);
        return {
          success: false,
          error: 'Student not found'
        };
      }

      return {
        success: true,
        data: student
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch student',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/students - Create new student
  fastify.post('/', {
    schema: {
      description: 'Create new student',
      tags: ['Students'],
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'category'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          category: { type: 'string' },
          gender: { type: 'string' },
          age: { type: 'number' },
          emergencyContact: { type: 'string' },
          medicalConditions: { type: 'string' },
          financialResponsibleId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const studentData = request.body as any;
      
      // Create user first
      const user = await prisma.user.create({
        data: {
          organizationId,
          email: studentData.email,
          password: await generateTempPassword(),
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          phone: studentData.phone,
          role: 'STUDENT'
        }
      });

      // Create student
      const student = await prisma.student.create({
        data: {
          organizationId,
          userId: user.id,
          category: studentData.category,
          gender: studentData.gender,
          age: studentData.age,
          emergencyContact: studentData.emergencyContact,
          medicalConditions: studentData.medicalConditions,
          financialResponsibleId: studentData.financialResponsibleId
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          financialResponsible: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return {
        success: true,
        data: student,
        message: 'Student created successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create student',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // PUT /api/students/:id - Update student
  fastify.put('/:id', {
    schema: {
      description: 'Update student',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          category: { type: 'string' },
          emergencyContact: { type: 'string' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as any;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingStudent) {
        reply.code(404);
        return {
          success: false,
          error: 'Student not found'
        };
      }

      // Prepare update data for user table
      const userUpdateData: any = {};
      if (updateData.firstName !== undefined) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdateData.lastName = updateData.lastName;
      if (updateData.email !== undefined) userUpdateData.email = updateData.email;

      // Prepare update data for student table
      const studentUpdateData: any = {};
      if (updateData.category !== undefined) studentUpdateData.category = updateData.category;
      if (updateData.emergencyContact !== undefined) studentUpdateData.emergencyContact = updateData.emergencyContact;
      if (updateData.isActive !== undefined) studentUpdateData.isActive = updateData.isActive;

      // Perform updates using transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update user if there's user data to update
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: existingStudent.userId },
            data: userUpdateData
          });
        }

        // Update student if there's student data to update
        if (Object.keys(studentUpdateData).length > 0) {
          await tx.student.update({
            where: { id },
            data: studentUpdateData
          });
        }

        // Return updated student with user data
        return await tx.student.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                phone: true,
                isActive: true
              }
            },
            financialResponsible: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            },
            _count: {
              select: {
                attendances: true,
                evaluations: true,
                progressions: true
              }
            }
          }
        });
      });

      return {
        success: true,
        data: result,
        message: 'Student updated successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to update student',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // POST /api/students/:id/subscription - Create subscription for student (Alternative route)
  fastify.post('/:id/subscription', {
    schema: {
      description: 'Create subscription for student (Alternative route)',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['planId'],
        properties: {
          planId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          customPrice: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      const { planId, startDate, customPrice } = request.body as any;
      
      const organizationId = await getOrganizationId();
      
      const financialService = new FinancialService(organizationId);
      
      const subscriptionData: any = {
        studentId,
        planId,
        customPrice
      };
      
      if (startDate) {
        subscriptionData.startDate = new Date(startDate);
      }
      
      const subscription = await financialService.createSubscription(subscriptionData);

      return {
        success: true,
        data: subscription,
        message: 'Subscription created successfully via alternative route'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/students/:id/subscription - Get student subscription
  fastify.get('/:id/subscription', {
    schema: {
      description: 'Get student subscription',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      
      const subscription = await prisma.studentSubscription.findFirst({
        where: { 
          studentId,
          status: 'ACTIVE'
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              billingType: true,
              classesPerWeek: true,
              isActive: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!subscription) {
        return {
          success: true,
          data: null,
          message: 'No active subscription found for this student'
        };
      }

      return {
        success: true,
        data: subscription,
        message: 'Student subscription retrieved successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to retrieve subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/students/:id/subscriptions - Get all student subscriptions
  fastify.get('/:id/subscriptions', {
    schema: {
      description: 'Get all student subscriptions',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      
      const subscriptions = await prisma.studentSubscription.findMany({
        where: { studentId },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              billingType: true,
              classesPerWeek: true,
              isActive: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        data: subscriptions,
        message: 'Student subscriptions retrieved successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to retrieve subscriptions',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/students/:id/enrollments - Get student enrollments
  fastify.get('/:id/enrollments', {
    schema: {
      description: 'Get student enrollments',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
              isActive: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        data: enrollments,
        message: 'Student enrollments retrieved successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to retrieve enrollments',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // PUT /api/students/:id/subscription - Update student subscription
  fastify.put('/:id/subscription', {
    schema: {
      description: 'Update student subscription',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['planId'],
        properties: {
          planId: { type: 'string' },
          customPrice: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      const { planId, customPrice } = request.body as any;
      
      const organizationId = await getOrganizationId();
      const financialService = new FinancialService(organizationId);

      // Get current active subscription
      const currentSubscription = await prisma.studentSubscription.findFirst({
        where: { 
          studentId,
          status: 'ACTIVE'
        }
      });

      if (!currentSubscription) {
        reply.code(404);
        return {
          success: false,
          error: 'No active subscription found for this student'
        };
      }

      // Update subscription plan
      const updatedSubscription = await financialService.updateSubscriptionPlan(
        currentSubscription.id,
        planId,
        customPrice
      );

      return {
        success: true,
        data: updatedSubscription,
        message: 'Student subscription updated successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to update subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // DELETE /api/students/:id/subscription - Cancel student subscription
  fastify.delete('/:id/subscription', {
    schema: {
      description: 'Cancel student subscription',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      
      // Get current active subscription
      const currentSubscription = await prisma.studentSubscription.findFirst({
        where: { 
          studentId,
          status: 'ACTIVE'
        }
      });

      if (!currentSubscription) {
        reply.code(404);
        return {
          success: false,
          error: 'No active subscription found for this student'
        };
      }

      // Cancel subscription
      const cancelledSubscription = await prisma.studentSubscription.update({
        where: { id: currentSubscription.id },
        data: { 
          status: 'CANCELLED',
          isActive: false,
          updatedAt: new Date()
        },
        include: {
          student: { include: { user: true } },
          plan: true
        }
      });

      return {
        success: true,
        data: cancelledSubscription,
        message: 'Student subscription cancelled successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ENDPOINT TEMPORÁRIO: Aplicar matrículas automáticas retroativamente
  fastify.post('/:id/apply-auto-enrollments', {
    schema: {
      description: 'Apply automatic course enrollments retroactively',
      tags: ['Students'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id: studentId } = request.params as { id: string };
      
      const organizationId = await getOrganizationId();
      const financialService = new FinancialService(organizationId);

      const result = await financialService.applyRetroactiveCourseEnrollments(studentId);

      return {
        success: true,
        data: result,
        message: 'Automatic enrollments applied successfully'
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to apply automatic enrollments',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}