import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import FinancialService from '@/services/financialService';

export default async function studentsRoutes(fastify: FastifyInstance) {
  // Add request logging for debugging
  fastify.addHook('onRequest', async (request, reply) => {
    logger.info(`Students route - ${request.method} ${request.url}`);
  });
  
  // Get all students
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const students = await prisma.student.findMany({
        include: {
          // Ensure user info is loaded for listing screen
          user: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  billingType: true
                }
              }
            }
          },
          attendances: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              attendances: true,
              subscriptions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const studentsWithStats = students.map(student => {
        const activeSubscription = student.subscriptions[0];
        const totalAttendances = student._count.attendances;
        // Adjust: no 'present' boolean in Attendance; use status === 'PRESENT' (or similar)
        const presentAttendances = student.attendances?.filter(a => (a as any).status === 'PRESENT').length || 0;
        const attendanceRate = totalAttendances > 0 ? Math.round((presentAttendances / totalAttendances) * 100) : 0;

        return {
          ...student,
          activeSubscription,
          stats: {
            totalAttendances,
            attendanceRate,
            totalSubscriptions: student._count.subscriptions
          }
        };
      });

      return reply.send({
        success: true,
        data: studentsWithStats,
        total: studentsWithStats.length
      });
    } catch (error) {
      logger.error('Error fetching students:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch students'
      });
    }
  });

  // Get student by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          user: true,
          subscriptions: {
            include: {
              plan: true
            },
            orderBy: { createdAt: 'desc' }
          },
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 50
          }
        }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      return reply.send({
        success: true,
        data: student
      });
    } catch (error) {
      logger.error('Error fetching student:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student'
      });
    }
  });

  // Create new student
  fastify.post('/', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      logger.info('Creating student with body:', JSON.stringify(body, null, 2));

      // Handle nested user data structure from frontend
      const userData = body.user || {};
      const studentData = body;

      // Extract user fields (support both flat and nested structure)
      const firstName = userData.firstName || body.firstName || '';
      const lastName = userData.lastName || body.lastName || '';
      const email = userData.email || body.email || '';
      const phone = userData.phone || body.phone || null;
      const birthDate = userData.birthDate || body.birthDate || null;
      const cpf = userData.cpf || body.cpf || null;

      logger.info('Extracted user data:', { firstName, lastName, email, phone, birthDate, cpf });

      // Determine organization id (from body or first organization)
      let orgId = body.organizationId as string | undefined;
      logger.info('Initial orgId:', orgId);
      
      if (!orgId) {
        logger.info('No orgId provided, looking for first organization...');
        let firstOrg = await prisma.organization.findFirst();
        logger.info('Found organization:', firstOrg);
        
        if (!firstOrg) {
          logger.info('No organization found, creating default organization...');
          // Create default organization if none exists
          firstOrg = await prisma.organization.create({
            data: {
              name: 'Academia Krav Maga',
              slug: 'academia-krav-maga',
              email: 'contato@academiakravmaga.com.br',
              phone: '(11) 99999-9999',
              address: 'Rua das Artes Marciais, 123',
              city: 'São Paulo',
              state: 'SP',
              zipCode: '01234-567',
              isActive: true
            }
          });
          logger.info('Created default organization:', firstOrg.name);
        }
        orgId = firstOrg.id;
      }
      
      logger.info('Final orgId:', orgId);

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      // Normalize flags and optional fields
      const isActive = body.isActive !== undefined
        ? Boolean(body.isActive)
        : (body.status ? String(body.status).toLowerCase() === 'active' : true);

      // Map frontend category to valid enum value
      const validCategories = ['ADULT', 'FEMALE', 'SENIOR', 'CHILD', 'INICIANTE1', 'INICIANTE2', 'INICIANTE3', 'HEROI1', 'HEROI2', 'HEROI3', 'MASTER_1', 'MASTER_2', 'MASTER_3'];
      let category = body.category || 'ADULT';
      
      // Map common frontend values to valid enum values
      if (category === 'REGULAR' || category === 'ADULTO') {
        category = 'ADULT';
      } else if (category === 'CRIANÇA' || category === 'CRIANCA') {
        category = 'CHILD';
      } else if (category === 'MULHER' || category === 'FEMININO') {
        category = 'FEMALE';
      } else if (!validCategories.includes(category)) {
        category = 'ADULT'; // Default fallback
      }

      logger.info('Mapped category:', category);

      // Check if user already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: {
          organizationId_email: {
            organizationId: orgId!,
            email: email
          }
        }
      });

      let user;
      if (existingUser) {
        logger.info('User already exists, using existing user:', existingUser);
        user = existingUser;
        
        // Check if this user already has a student record
        const existingStudent = await prisma.student.findUnique({
          where: { userId: user.id }
        });
        
        if (existingStudent) {
          return reply.code(400).send({
            success: false,
            message: 'Um estudante com este email já existe'
          });
        }
      } else {
        // First create User
        logger.info('Creating user with data:', {
          firstName,
          lastName,
          email,
          phone,
          cpf,
          birthDate,
          organizationId: orgId
        });
        
        const userCreateData: any = {
          firstName,
          lastName,
          email,
          phone,
          password: tempPassword,
          organizationId: orgId
        };

        if (cpf) userCreateData.cpf = cpf;
        if (birthDate) userCreateData.birthDate = new Date(birthDate);
        
        user = await prisma.user.create({
          data: userCreateData
        });
        
        logger.info('User created successfully:', user);
      }

      // Then create Student linked to User
      const createData: any = {
        userId: user.id,
        category: category, // Use the mapped/validated category
        isActive,
        organizationId: orgId
      };
      
      logger.info('Creating student with data:', createData);

      // Optional fields - handle both nested and flat structure
      if (body.emergencyContact || studentData.emergencyContact) {
        createData.emergencyContact = body.emergencyContact || studentData.emergencyContact;
      }
      if (userData.address || body.address) {
        createData.address = userData.address || body.address;
      }
      if (body.medicalObservations || body.medicalConditions) {
        createData.medicalConditions = body.medicalObservations || body.medicalConditions;
      }

      const result = await prisma.student.create({ 
        data: createData,
        include: {
          user: true
        }
      });
      
      logger.info('Student created successfully:', result);

      return reply.code(201).send({
        success: true,
        data: result,
        message: 'Student created successfully'
      });
    } catch (error) {
      logger.error('Error creating student:', error);
      logger.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      return reply.code(500).send({
        success: false,
        message: 'Failed to create student',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update student - CORRECTED VERSION
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const body = request.body as any;

      // First, find the student to get userId
      const existingStudent = await prisma.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingStudent) {
        return reply.status(404).send({
          success: false,
          error: 'Student not found'
        });
      }

      // Update User model (personal data)
      await prisma.user.update({
        where: { id: existingStudent.userId },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone
        }
      });

      // Update Student model (academic data only)
      const student = await prisma.student.update({
        where: { id },
        data: {
          category: body.category,
          emergencyContact: body.emergencyContact,
          medicalConditions: body.medicalConditions,
          isActive: body.isActive
        },
        include: {
          user: true,
          subscriptions: {
            include: {
              plan: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return reply.send({
        success: true,
        data: student,
        message: 'Student updated successfully'
      });
    } catch (error) {
      logger.error('Error updating student:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update student'
      });
    }
  });

  // Get student subscription info
  fastify.get('/:id/subscription', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const subscription = await prisma.studentSubscription.findFirst({
        where: {
          studentId: id,
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
              hasPersonalTraining: true,
              hasNutrition: true,
              allowFreeze: true,
              features: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: subscription || null
      });
    } catch (error) {
      logger.error('Error fetching student subscription:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student subscription'
      });
    }
  });

  // Get student enrollments info
  fastify.get('/:id/enrollments', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // Note: This assumes you have an enrollment/course system
      // You may need to adjust based on your actual schema
      const enrollments = await (prisma as any).enrollment?.findMany?.({
        where: { 
          studentId: id,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              level: true,
              duration: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      }) || [];

      return reply.send({
        success: true,
        data: enrollments
      });
    } catch (error) {
      logger.error('Error fetching student enrollments:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student enrollments'
      });
    }
  });

  // Get student financial summary
  fastify.get('/:id/financial-summary', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // Get subscription payments
      const payments = await prisma.payment?.findMany({
        where: { 
          subscription: {
            studentId: id
          }
        },
        include: {
          subscription: {
            include: {
              plan: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'desc' },
        take: 20
      }) || [];

      // Calculate summary stats
      // Adjust: no 'value' field; use 'amount' (Decimal) or numeric fallback.
      const getAmount = (p: any) => {
        const a = (p.amount as any);
        if (typeof a === 'number') return a;
        if (a && typeof a.toNumber === 'function') return a.toNumber();
        if (a && typeof a === 'object' && 'value' in a) return Number((a as any).value) || 0;
        return Number(a) || 0;
      };
      // Normalize status to string for safe comparison independent of enum type
      const getStatus = (p: any) => String(p.status || '').toUpperCase();
      const totalPaid = payments.filter(p => getStatus(p) === 'RECEIVED' || getStatus(p) === 'PAID').reduce((sum, p) => sum + getAmount(p), 0);
      const totalPending = payments.filter(p => getStatus(p) === 'PENDING').reduce((sum, p) => sum + getAmount(p), 0);
      const totalOverdue = payments.filter(p => getStatus(p) === 'OVERDUE' || getStatus(p) === 'LATE').reduce((sum, p) => sum + getAmount(p), 0);

      return reply.send({
        success: true,
        data: {
          payments,
          summary: {
            totalPaid,
            totalPending,
            totalOverdue,
            lastPayment: payments.find(p => (p as any).status === 'RECEIVED' || (p as any).status === 'PAID')
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching student financial summary:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student financial summary'
      });
    }
  });

  // Add alias route for attendance history expected by frontend
  fastify.get('/:id/attendances', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;

      const attendances = await prisma.attendance.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return reply.send({
        success: true,
        data: attendances
      });
    } catch (error) {
      logger.error('Error fetching student attendances:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student attendances'
      });
    }
  });

  // Alias: Cancel active subscription by student ID
  fastify.delete('/:id/subscription', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      const sub = await prisma.studentSubscription.findFirst({
        where: { studentId: id, status: 'ACTIVE' },
        select: { id: true, organizationId: true }
      });

      if (!sub) {
        return reply.code(404).send({ success: false, error: 'No active subscription found for this student' });
      }

      const financialService = new FinancialService(sub.organizationId);
      await financialService.deleteSubscription(sub.id);

      return reply.send({ success: true, message: 'Subscription deleted successfully' });
    } catch (error) {
      logger.error('Error cancelling student subscription:', error);
      return reply.code(500).send({ success: false, message: 'Failed to cancel student subscription' });
    }
  });

  // Get student course progress
  fastify.get('/:id/course-progress', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;
      
      // Get student's active subscriptions with courses
      const subscriptions = await prisma.studentSubscription.findMany({
        where: { 
          studentId: id,
          status: 'ACTIVE'
        },
        include: {
          plan: {
            include: {
              planCourses: {
                include: {
                  course: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      level: true,
                      duration: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Get student's attendances to calculate progress
      const attendances = await prisma.attendance.findMany({
        where: { studentId: id },
        include: {
          class: {
            select: {
              courseId: true,
              title: true,
              date: true
            }
          }
        }
      });

      // Calculate progress for each course
      const courseProgress = subscriptions.flatMap(sub => 
        sub.plan.planCourses.map(planCourse => {
          const course = planCourse.course;
          const courseAttendances = attendances.filter(
            att => att.class?.courseId === course.id
          );
          
          const totalClasses = course.duration || 0;
          const attendedClasses = courseAttendances.length;
          const progressPercentage = totalClasses > 0 ? 
            Math.round((attendedClasses / totalClasses) * 100) : 0;

          return {
            courseId: course.id,
            courseName: course.name,
            courseLevel: course.level,
            totalClasses,
            attendedClasses,
            progressPercentage,
            lastAttendance: courseAttendances[courseAttendances.length - 1]?.class?.date || null
          };
        })
      );

      return reply.send({
        success: true,
        data: courseProgress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching student course progress:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student course progress'
      });
    }
  });
}
