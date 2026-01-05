// @ts-nocheck
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import FinancialService from '@/services/financialService';

export default async function studentsRoutes(fastify: FastifyInstance) {
  // Add request logging for debugging
  fastify.addHook('onRequest', async (request, _reply) => {
    logger.info(`Students route - ${request.method} ${request.url}`);
  });

  const COURSE_SUMMARY_SELECT = {
    id: true,
    name: true,
    description: true,
    category: true,
    level: true,
    duration: true
  } as const;

  
  // Get all students (scoped by organization)
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { search?: string } }>, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return; // reply already sent
      
      const { search } = request.query;
      
      // Build where clause with search filter
      const where: any = { organizationId };
      
      if (search && search.length >= 2) {
        const searchClean = search.replace(/\D/g, ''); // Remove non-digits for CPF/phone
        where.OR = [
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
        
        // Add CPF search only if search looks like CPF (numeric only)
        if (searchClean.length >= 3) {
          where.OR.push({ user: { cpf: { contains: searchClean, mode: 'insensitive' } } });
        }
      }
      
      const students = await prisma.student.findMany({
        where,
        include: {
          user: true, // Essential for displaying name/email
          biometricData: {
            select: { photoUrl: true }
          },
          _count: {
            select: {
              attendances: true,
              subscriptions: true,
            },
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: { id: true }
          }
        },
        orderBy: [
          { user: { firstName: 'asc' } }, // ✅ Ordenar por nome
          { user: { lastName: 'asc' } },
          { createdAt: 'desc' }
        ],
      });

      // Simplified data transformation
      const studentsWithStats = students.map(student => {
        const totalAttendances = student._count.attendances;
        const totalSubscriptions = student._count.subscriptions;
        const hasActiveSubscription = student.subscriptions.length > 0;
        
        return {
          ...student,
          isActive: hasActiveSubscription, // Override isActive based on active subscription
          totalAttendances,
          totalSubscriptions,
          stats: {
            totalAttendances,
            attendanceRate: 0, // Will be calculated with proper attendance data when needed
            totalSubscriptions
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
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return; // reply already sent

      const student = await prisma.student.findFirst({
        where: { id, organizationId },
        include: {
          user: true,
          financialResponsible: true,
          financialResponsibleStudent: {
            include: {
              user: true
            }
          },
          biometricData: true, // Include biometric data for photo
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

      // Check for active subscription to determine active status
      const hasActiveSubscription = student.subscriptions.some(sub => sub.status === 'ACTIVE');
      const studentWithActiveStatus = {
          ...student,
          isActive: hasActiveSubscription
      };

      return reply.send({
        success: true,
        data: studentWithActiveStatus
      });
    } catch (error) {
      logger.error('Error fetching student:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student'
      });
    }
  });

  // Get student stats (for overview tab)
  fastify.get('/:id/stats', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      // Get student with counts
      const student = await prisma.student.findFirst({
        where: { id, organizationId },
        include: {
          _count: {
            select: {
              attendances: true,
              subscriptions: true,
            }
          },
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          subscriptions: {
            where: {
              status: 'ACTIVE'
            },
            include: {
              plan: true
            }
          }
        }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      // Calculate stats
      const totalAttendances = student._count.attendances;
      const activeSubscriptions = student.subscriptions.length;
      const lastAttendance = student.attendances[0]?.createdAt || null;
      
      // Calculate attendance rate (simple version - last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAttendances = await prisma.attendance.count({
        where: {
          studentId: id,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      return reply.send({
        success: true,
        data: {
          totalAttendances,
          activeSubscriptions,
          lastAttendance,
          recentAttendances,
          attendanceRate: recentAttendances > 0 ? Math.round((recentAttendances / 30) * 100) : 0,
          level: student.globalLevel || 1,
          xp: student.totalXP || 0,
          currentStreak: student.currentStreak || 0,
          longestStreak: student.longestStreak || 0
        }
      });
    } catch (error) {
      logger.error('Error fetching student stats:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student stats'
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
      const existingUser = await prisma.user.findFirst({
        where: {
          organizationId: orgId!,
          email: email
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

      // 🆕 AUTOMATIC ENROLLMENT IN BASE COURSE FROM PLAN
      if (body.enrollment && body.enrollment.packageId) {
        try {
          logger.info('🎯 Processing automatic enrollment for package:', body.enrollment.packageId);
          
          // Get plan with courses
          const plan = await prisma.billingPlan.findUnique({
            where: { id: body.enrollment.packageId }
          });
          
          if (!plan) {
            logger.warn('⚠️ Plan not found, skipping auto-enrollment');
          } else {
            logger.info('📦 Found plan:', plan.name);
            
            // Get course IDs from plan features
            const planFeatures = plan.features as any;
            const courseIds = planFeatures?.courseIds || [];
            
            logger.info('📚 Plan courses:', courseIds);
            
            if (courseIds.length === 0) {
              logger.warn('⚠️ No courses in plan, skipping auto-enrollment');
            } else {
              // Find base course among plan courses
              // Note: Filtering by isBaseCourse in code until Prisma Client regenerates
              const planCourses = await prisma.course.findMany({
                where: {
                  id: { in: courseIds },
                  organizationId: orgId!,
                  isActive: true
                },
                include: {
                  martialArt: true
                }
              });
              
              // Filter for base course
              const baseCourse = planCourses.find((c: any) => c.isBaseCourse === true);
              
              if (!baseCourse) {
                logger.warn('⚠️ No base course found in plan courses, skipping auto-enrollment');
              } else {
                logger.info('✅ Found base course:', baseCourse.name, 'from', baseCourse.martialArt?.name);
                
                // Auto-enroll student in base course
                const expectedEndDate = new Date();
                expectedEndDate.setMonth(expectedEndDate.getMonth() + 12); // 12 months duration
                
                const enrollment = await prisma.courseEnrollment.create({
                  data: {
                    studentId: result.id,
                    courseId: baseCourse.id,
                    enrolledAt: body.enrollment.enrollmentDate ? new Date(body.enrollment.enrollmentDate) : new Date(),
                    expectedEndDate,
                    status: 'ACTIVE',
                    category: category as any,
                    gender: body.gender || body.user?.gender || 'MALE'
                  }
                });
                
                logger.info('🎓 Student auto-enrolled in base course:', {
                  course: baseCourse.name,
                  martialArt: baseCourse.martialArt?.name,
                  enrollmentId: enrollment.id
                });
              }
            }
          }
        } catch (enrollmentError) {
          logger.error('Error during auto-enrollment (non-fatal):', enrollmentError);
          // Don't fail the student creation if enrollment fails
        }
      }

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

      // Get student course enrollments
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { 
          studentId: id
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
      });

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

  // Update enrollment status
  fastify.patch('/:id/enrollments/:enrollmentId/status', async (request: FastifyRequest<{ 
    Params: { id: string, enrollmentId: string },
    Body: { status: string }
  }>, reply: FastifyReply) => {
    try {
      const { id: studentId, enrollmentId } = request.params;
      const { status } = request.body;

      // Validate status against enum
      const validStatuses = ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'TRANSFERRED'];
      if (!validStatuses.includes(status)) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid status'
        });
      }

      // Verify enrollment exists and belongs to the student
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          id: enrollmentId,
          studentId: studentId
        }
      });

      if (!enrollment) {
        return reply.code(404).send({
          success: false,
          message: 'Enrollment not found'
        });
      }

      // Update the enrollment
      await prisma.courseEnrollment.update({
        where: { id: enrollmentId },
        data: { status: status as any }
      });

      return reply.send({
        success: true,
        message: 'Enrollment status updated successfully'
      });

    } catch (error) {
      logger.error('Error updating student enrollment status:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update student enrollment status'
      });
    }
  });

  // Delete student enrollment
  fastify.delete('/:id/enrollments/:enrollmentId', async (request: FastifyRequest<{ 
    Params: { id: string, enrollmentId: string }
  }>, reply: FastifyReply) => {
    try {
      const { id: studentId, enrollmentId } = request.params;

      // Verify enrollment exists and belongs to the student
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          id: enrollmentId,
          studentId: studentId
        }
      });

      if (!enrollment) {
        return reply.code(404).send({
          success: false,
          message: 'Enrollment not found'
        });
      }

      // Delete the enrollment
      await prisma.courseEnrollment.delete({
        where: { id: enrollmentId }
      });

      return reply.send({
        success: true,
        message: 'Enrollment deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting student enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to delete student enrollment'
      });
    }
  });

  // Get available courses for student (not enrolled yet)
  fastify.get('/:id/available-courses', async (request: FastifyRequest<{ 
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id: studentId } = request.params;

      // Get student's enrolled courses
      const enrolledCourses = await prisma.courseEnrollment.findMany({
        where: { studentId },
        select: { courseId: true }
      });

      const enrolledCourseIds = enrolledCourses.map(e => e.courseId);

      // Get student to check their organization
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { organizationId: true }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      // Get all active courses not enrolled yet
      const availableCourses = await prisma.course.findMany({
        where: {
          organizationId: student.organizationId,
          isActive: true,
          id: {
            notIn: enrolledCourseIds
          }
        },
        include: {
          martialArt: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return reply.send({
        success: true,
        data: availableCourses
      });

    } catch (error) {
      logger.error('Error fetching available courses:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch available courses'
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

  // ✅ REMOVIDO: Rota movida para src/routes/course-progress.ts
  // GET /:id/course-progress agora em arquivo dedicado

  // Bulk import students
  fastify.post('/bulk-import', async (request: FastifyRequest<{
    Body: {
      students: Array<{
        nome: string;
        email?: string;
        telefone?: string;
        documento?: string;
        endereco?: string;
        valor_mensalidade?: string;
        empresa?: string;
      }>;
    }
  }>, reply: FastifyReply) => {
    try {
      const { students } = request.body;
      
      if (!students || !Array.isArray(students)) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid students data format'
        });
      }

      logger.info(`Starting bulk import of ${students.length} students`);

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[]
      };

      for (const studentData of students) {
        try {
          // Validate required fields
          if (!studentData.nome || studentData.nome.length < 2) {
            results.skipped++;
            results.errors.push(`Estudante ignorado: Nome inválido (${studentData.nome})`);
            continue;
          }

          // Get default organization (first one available)
          const defaultOrg = await prisma.organization.findFirst({
            where: { isActive: true }
          });

          if (!defaultOrg) {
            results.errors.push('Nenhuma organização ativa encontrada');
            break;
          }

          // Split full name into firstName and lastName
          const nameParts = studentData.nome.trim().split(' ');
          const firstName = nameParts[0] || studentData.nome;
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          // Create user first (email is optional now)
          const userData: any = {
            organizationId: defaultOrg.id,
            firstName: firstName,
            lastName: lastName,
            password: 'temp123', // Temporary password
            role: 'STUDENT'
          };

          // Only add email if provided and valid
          if (studentData.email && studentData.email.includes('@')) {
            userData.email = studentData.email;
          }

          const user = await prisma.user.create({
            data: userData
          });

          // Update user with phone and cpf if available
          if (studentData.telefone || studentData.documento) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                phone: studentData.telefone || null,
                cpf: studentData.documento || null
              }
            });
          }

          // Create student record with available fields
          const student = await prisma.student.create({
            data: {
              organizationId: defaultOrg.id,
              userId: user.id,
              emergencyContact: studentData.telefone || null
            }
          });

          results.imported++;
          logger.info(`Student imported: ${studentData.nome} (ID: ${student.id})`);

        } catch (studentError: any) {
          results.skipped++;
          const errorMsg = `Erro ao importar ${studentData.nome}: ${studentError.message}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg, studentError);
        }
      }

      logger.info(`Bulk import completed: ${results.imported} imported, ${results.skipped} skipped`);

      return reply.send({
        success: true,
        data: {
          ...results,
          total: students.length
        },
        message: `Importação concluída: ${results.imported} estudantes importados, ${results.skipped} ignorados`
      });

    } catch (error) {
      logger.error('Error in bulk import:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to import students'
      });
    }
  });

  // ===== NEW STUDENT TAB ENDPOINTS =====

  // Get student overview data
  fastify.get('/:id/overview', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;

      // Get student basic info
      const student = await prisma.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      // Get attendance statistics
      const attendances = await prisma.attendance.findMany({
        where: { studentId: id },
        include: {
          class: {
            select: { date: true, title: true }
          }
        }
      });

      const totalClasses = attendances.length;
      const presentClasses = attendances.filter(att => att.status === 'PRESENT').length;
      const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

      // Get techniques learned from real data
      const techniquesLearned = 0; // TODO: Calculate from actual technique progress

      // Get course progress
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: id },
        include: {
          course: { select: { name: true, duration: true } }
        }
      });

      const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
      const courseProgress = activeEnrollments.length > 0 
        ? Math.round(activeEnrollments.reduce((acc, e) => acc + (e.attendanceRate || 0), 0) / activeEnrollments.length)
        : 0;

      // Generate goals based on actual progress
      const nextGoals = [];
      if (attendanceRate < 80) {
        nextGoals.push({ icon: '📅', description: 'Melhorar frequência nas aulas' });
      }
      if (activeEnrollments.length === 0) {
        nextGoals.push({ icon: '🎓', description: 'Matricular-se em um curso' });
      }
      if (nextGoals.length === 0) {
        nextGoals.push({ icon: '🎯', description: 'Manter progresso atual' });
      }

      return reply.send({
        success: true,
        data: {
          attendanceRate,
          techniquesLearned,
          courseProgress,
          nextGoals,
          lastUpdate: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching student overview:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student overview'
      });
    }
  });

  // Get student attendance data
  fastify.get('/:id/attendance', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;

      const attendances = await prisma.attendance.findMany({
        where: { studentId: id },
        include: {
          class: {
            select: {
              title: true,
              date: true,
              course: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Calculate statistics
      const totalClasses = attendances.length;
      const attendedClasses = attendances.filter(att => att.status === 'PRESENT').length;
      const missedClasses = totalClasses - attendedClasses;
      const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      // Format attendance history
      const attendanceHistory = attendances.map(att => ({
        date: att.class.date,
        className: att.class.title,
        course: att.class.course?.name || 'Curso não informado',
        status: att.status.toLowerCase()
      }));

      return reply.send({
        success: true,
        data: {
          totalClasses,
          attendedClasses,
          missedClasses,
          attendanceRate,
          attendanceHistory
        }
      });
    } catch (error) {
      logger.error('Error fetching student attendance:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student attendance'
      });
    }
  });
  // Get student techniques data
  fastify.get('/:id/techniques', async (
    _request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      // const { id } = _request.params; // TODO: Implement real techniques tracking system

      // For now, return empty data structure
      
      return reply.send({
        success: true,
        data: {
          categorySummary: {},
          totalAvailable: {},
          techniquesByCategory: {}
        }
      });
    } catch (error) {
      logger.error('Error fetching student techniques:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student techniques'
      });
    }
  });

  // Get student progress data
  fastify.get('/:id/progress', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = request.params;

      // Get student enrollments
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { 
          studentId: id,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              name: true,
              duration: true,
              level: true
            }
          }
        }
      });

      if (enrollments.length === 0) {
        return reply.send({
          success: true,
          data: {
            currentCourse: null,
            overallProgress: 0,
            missingContent: [],
            estimatedCompletion: null
          }
        });
      }

      // Take the first active enrollment as current course
      const currentEnrollment = enrollments[0];
      if (!currentEnrollment) {
        return reply.send({
          success: true,
          data: {
            currentCourse: null,
            overallProgress: 0,
            missingContent: [],
            estimatedCompletion: null
          }
        });
      }
      
      // Calculate progress based on lessons completed and attendance
      const lessonsCompleted = currentEnrollment.lessonsCompleted || 0;
      const totalLessons = currentEnrollment.course.duration || 12;
      const overallProgress = Math.round((lessonsCompleted / totalLessons) * 100);

      // Calculate real technique progress (TODO: implement when technique system is ready)
      const basicTechniques = {
        completed: 0,
        total: 0,
        progress: 0
      };

      const advancedTechniques = {
        completed: 0,
        total: 0,
        progress: 0
      };

      // Get attendance info
      const attendances = await prisma.attendance.findMany({
        where: { studentId: id },
        include: { class: true }
      });

      const attended = attendances.filter(att => att.status === 'PRESENT').length;
      const required = Math.floor(totalLessons * 0.8); // 80% attendance required

      const classAttendance = {
        attended,
        required,
        progress: Math.round((attended / required) * 100)
      };

      // Generate missing content based on real progress
      const missingContent = [];
      
      if (classAttendance.progress < 80) {
        missingContent.push({
          category: 'Frequência',
          items: [
            { icon: '📅', name: `${Math.max(0, required - attended)} aulas para atingir frequência mínima`, priority: 'high' }
          ]
        });
      }

      if (lessonsCompleted < totalLessons) {
        const remainingLessons = totalLessons - lessonsCompleted;
        missingContent.push({
          category: 'Curso',
          items: [
            { icon: '�', name: `${remainingLessons} aulas restantes no curso`, priority: 'medium' }
          ]
        });
      }

      // Calculate realistic completion estimate
      const remainingLessons = Math.max(0, totalLessons - lessonsCompleted);
      const estimatedCompletion = remainingLessons > 0 
        ? `${Math.ceil(remainingLessons / 2)} semanas` 
        : 'Curso concluído';

      return reply.send({
        success: true,
        data: {
          currentCourse: {
            name: currentEnrollment.course.name,
            level: currentEnrollment.course.level
          },
          overallProgress,
          basicTechniques,
          advancedTechniques,
          classAttendance,
          missingContent,
          estimatedCompletion
        }
      });
    } catch (error) {
      logger.error('Error fetching student progress:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch student progress'
      });
    }
  });

  // =====================================================================
  // 📊 FINANCIAL RESPONSIBLE ENDPOINTS
  // =====================================================================

  // GET /api/students/financial-responsibles - List all financial responsibles
  fastify.get('/financial-responsibles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return; // reply already sent

      const responsibles = await prisma.financialResponsible.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' } // ✅ Ordenar alfabeticamente
      });

      return reply.send({
        success: true,
        data: responsibles
      });
    } catch (error) {
      logger.error('Error fetching financial responsibles:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch financial responsibles'
      });
    }
  });

  // POST /api/students/financial-responsibles - Create new financial responsible
  fastify.post('/financial-responsibles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return; // reply already sent
      
      const body = request.body as { name?: string; cpfCnpj?: string; email?: string; phone?: string };
      const { name, cpfCnpj, email, phone } = body;

      // Validate required fields
      if (!name?.trim()) {
        return reply.code(400).send({
          success: false,
          message: 'Name is required'
        });
      }

      if (!cpfCnpj?.trim()) {
        return reply.code(400).send({
          success: false,
          message: 'CPF/CNPJ is required'
        });
      }

      if (!email?.trim()) {
        return reply.code(400).send({
          success: false,
          message: 'Email is required'
        });
      }

      const responsible = await prisma.financialResponsible.create({
        data: {
          organizationId,
          name: name.trim(),
          cpfCnpj: cpfCnpj.trim(),
          email: email.trim(),
          phone: phone?.trim() || null
        }
      });

      return reply.code(201).send({
        success: true,
        data: responsible
      });
    } catch (error) {
      logger.error('Error creating financial responsible:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create financial responsible'
      });
    }
  });

  // PATCH /api/students/:id/financial-responsible - Link/unlink financial responsible to student
  fastify.patch('/:id/financial-responsible', async (request: FastifyRequest<{ Params: { id: string }; Body: { financialResponsibleId?: string | null } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as { financialResponsibleId?: string | null };
      const { financialResponsibleId } = body;

      const student = await prisma.student.update({
        where: { id },
        data: {
          financialResponsibleId: financialResponsibleId || null
        },
        include: {
          user: true,
          financialResponsible: true
        }
      });

      return reply.send({
        success: true,
        data: student,
        message: 'Financial responsible updated successfully'
      });
    } catch (error) {
      logger.error('Error updating financial responsible:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update financial responsible'
      });
    }
  });

  // Set another student as financial responsible
  fastify.post('/:studentId/financial-responsible-student', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const { responsibleStudentId } = request.body as { responsibleStudentId: string | null };

      // Validate student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      // If setting a responsible, validate they exist
      if (responsibleStudentId) {
        const responsibleStudent = await prisma.student.findUnique({
          where: { id: responsibleStudentId }
        });

        if (!responsibleStudent) {
          return reply.code(404).send({
            success: false,
            message: 'Responsible student not found'
          });
        }

        // Prevent circular dependency
        if (responsibleStudentId === studentId) {
          return reply.code(400).send({
            success: false,
            message: 'Student cannot be their own financial responsible'
          });
        }
      }

      // Update student
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          financialResponsibleStudentId: responsibleStudentId
        },
        include: {
          financialResponsibleStudent: {
            include: {
              user: true
            }
          }
        }
      });

      logger.info(`Financial responsible student ${responsibleStudentId ? 'set' : 'removed'} for student ${studentId}`);

      return reply.send({
        success: true,
        data: updatedStudent,
        message: responsibleStudentId 
          ? 'Responsável financeiro vinculado com sucesso' 
          : 'Responsável financeiro removido com sucesso'
      });
    } catch (error) {
      logger.error('Error setting financial responsible student:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to set financial responsible student'
      });
    }
  });

  // Get all financial dependents for a student
  fastify.get('/:studentId/financial-dependents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };

      const responsible = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          consolidatedDiscountValue: true,
          consolidatedDiscountType: true,
          subscriptions: {
            where: { isActive: true },
            include: { plan: true }
          }
        }
      });

      const dependents = await prisma.student.findMany({
        where: {
          financialResponsibleStudentId: studentId
        },
        include: {
          user: true,
          subscriptions: {
            where: {
              isActive: true
            },
            include: {
              plan: true
            }
          },
          _count: {
            select: {
              subscriptions: true
            }
          }
        }
      });

      // Calculate consolidated charges
      const consolidatedCharges = dependents.flatMap(dep => 
        dep.subscriptions.map(sub => ({
          studentId: dep.id,
          studentName: `${dep.user.firstName} ${dep.user.lastName}`,
          planName: sub.plan.name,
          amount: sub.plan.price,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate
        }))
      );

      const subTotal = consolidatedCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
      const responsibleTotal = responsible?.subscriptions.reduce((sum, sub) => sum + Number(sub.price ?? sub.plan?.price ?? 0), 0) || 0;
      
      let discount = 0;
      if (responsible?.consolidatedDiscountValue) {
        const value = Number(responsible.consolidatedDiscountValue);
        if (responsible.consolidatedDiscountType === 'PERCENTAGE') {
          discount = subTotal * (value / 100);
        } else if (responsible.consolidatedDiscountType === 'FIXED_PRICE') {
          // Discount needed to reach the target value for the WHOLE family (Responsible + Dependents)
          // Target = value
          // Current Total = subTotal + responsibleTotal
          // Discount = Current Total - Target
          discount = Math.max(0, (subTotal + responsibleTotal) - value);
        } else {
          discount = value;
        }
      }

      const totalAmount = Math.max(0, subTotal - discount);

      return reply.send({
        success: true,
        data: {
          dependents,
          consolidatedCharges,
          totalDependents: dependents.length,
          subTotal,
          discount,
          discountValue: responsible?.consolidatedDiscountValue || 0,
          discountType: responsible?.consolidatedDiscountType || 'FIXED',
          totalAmount
        }
      });
    } catch (error) {
      logger.error('Error fetching financial dependents:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch financial dependents'
      });
    }
  });

  // Update financial dependents discount
  fastify.put('/:studentId/financial-dependents/discount', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: string };
      const { discountValue, discountType } = request.body as { discountValue: number, discountType: string };

      await prisma.student.update({
        where: { id: studentId },
        data: {
          consolidatedDiscountValue: discountValue,
          consolidatedDiscountType: discountType
        }
      });

      return reply.send({
        success: true,
        message: 'Discount updated successfully'
      });
    } catch (error) {
      logger.error('Error updating financial dependents discount:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to update discount'
      });
    }
  });

  // Get student subscriptions
  fastify.get('/:id/subscriptions', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const subscriptions = await prisma.studentSubscription.findMany({
        where: { studentId: id },
        include: {
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      logger.error('Error fetching subscriptions:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch subscriptions'
      });
    }
  });

  // Get student payments (fallback to empty for now - table doesn't exist)
  fastify.get('/:id/payments', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // For now, return empty array since Charge table structure unclear
      // In future: fetch from Charge/Invoice/Payment table
      // This endpoint intentionally returns empty to avoid 500 errors
      
      return reply.send({
        success: true,
        data: []
      });
    } catch (error) {
      logger.error('Error fetching payments:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  });

  // 🆕 Get consolidated charges for a responsible (sees all dependents + their subscriptions)
  fastify.get('/:id/consolidated-charges', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // Get all students where this student is the financial responsible
      const dependents = await prisma.student.findMany({
        where: { financialResponsibleStudentId: id },
        include: {
          user: true,
          subscriptions: {
            include: { plan: true }
          }
        }
      });

      // Build consolidated charges from all dependents' subscriptions
      const consolidatedCharges = dependents.flatMap(dependent =>
        dependent.subscriptions.map(subscription => ({
          dependentId: dependent.id,
          dependentName: `${dependent.user.firstName} ${dependent.user.lastName}`,
          dependentEmail: dependent.user.email,
          planId: subscription.plan.id,
          planName: subscription.plan.name,
          planPrice: subscription.plan.price,
          subscriptionStatus: subscription.status,
          subscriptionStartDate: subscription.startDate,
          subscriptionEndDate: subscription.endDate,
          createdAt: subscription.createdAt
        }))
      );

      const totalAmount = consolidatedCharges.reduce(
        (sum, charge) => sum + Number(charge.planPrice),
        0
      );

      return reply.send({
        success: true,
        data: {
          dependents: dependents.length,
          charges: consolidatedCharges,
          totalAmount,
          totalCharges: consolidatedCharges.length
        }
      });
    } catch (error) {
      logger.error('Error fetching consolidated charges:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch consolidated charges'
      });
    }
  });

  // Check for duplicate students (for import cleanup)
  fastify.get('/check-duplicates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return; // reply already sent

      // Find students with duplicate emails or CPFs
      const students = await prisma.student.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              email: true,
              cpf: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Group by email and CPF
      const emailMap = new Map<string, any[]>();
      const cpfMap = new Map<string, any[]>();

      students.forEach(student => {
        const email = student.user.email.toLowerCase();
        const cpf = student.user.cpf;

        if (email && !email.includes('@asaas-import.temp')) {
          if (!emailMap.has(email)) {
            emailMap.set(email, []);
          }
          emailMap.get(email)!.push(student);
        }

        if (cpf) {
          if (!cpfMap.has(cpf)) {
            cpfMap.set(cpf, []);
          }
          cpfMap.get(cpf)!.push(student);
        }
      });

      // Find duplicates
      const emailDuplicates = Array.from(emailMap.entries())
        .filter(([_, students]) => students.length > 1)
        .map(([email, students]) => ({
          email,
          count: students.length,
          students: students.map(s => ({
            id: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            createdAt: s.createdAt
          }))
        }));

      const cpfDuplicates = Array.from(cpfMap.entries())
        .filter(([_, students]) => students.length > 1)
        .map(([cpf, students]) => ({
          cpf,
          count: students.length,
          students: students.map(s => ({
            id: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            createdAt: s.createdAt
          }))
        }));

      return reply.send({
        success: true,
        data: {
          emailDuplicates,
          cpfDuplicates,
          totalEmailDuplicates: emailDuplicates.length,
          totalCpfDuplicates: cpfDuplicates.length
        },
        message: 'Duplicate check completed'
      });
    } catch (error) {
      logger.error('Error checking duplicates:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to check duplicates'
      });
    }
  });

  // DELETE student by ID
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Aluno não encontrado'
        });
      }

      // Delete in transaction - student and related user
      await prisma.$transaction(async (tx) => {
        // Delete student enrollments first
        await tx.courseEnrollment.deleteMany({
          where: { studentId: id }
        });
        
        // Delete student subscriptions
        await tx.studentSubscription.deleteMany({
          where: { studentId: id }
        });
        
        // Delete student attendances
        await tx.attendance.deleteMany({
          where: { studentId: id }
        });
        
        // Delete turma associations
        await tx.turmaStudent.deleteMany({
          where: { studentId: id }
        });
        
        // Delete the student
        await tx.student.delete({
          where: { id }
        });

        // Optionally delete the user if no longer needed
        // Note: User might be linked to other roles, so we just delete the student
      });

      logger.info(`Student deleted: ${id}`);

      return reply.send({
        success: true,
        message: 'Aluno deletado com sucesso'
      });
    } catch (error) {
      logger.error('Error deleting student:', error);
      return reply.code(500).send({
        success: false,
        message: 'Falha ao deletar aluno'
      });
    }
  });

  // =========================================================================
  // FINANCIAL RESPONSIBLE BILLING MANAGEMENT
  // =========================================================================

  // GET /api/students/financial-responsibles/:id/billing-summary
  // Returns all dependents, their subscriptions, and total billing for a financial responsible
  fastify.get('/financial-responsibles/:id/billing-summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const { id } = request.params as { id: string };

      // Get the financial responsible with their linked students
      const responsible = await prisma.financialResponsible.findFirst({
        where: { 
          id, 
          organizationId 
        }
      });

      if (!responsible) {
        return reply.code(404).send({
          success: false,
          message: 'Responsável financeiro não encontrado'
        });
      }

      // Find all students linked to this financial responsible
      const students = await prisma.student.findMany({
        where: {
          organizationId,
          financialResponsibleId: id
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          subscriptions: {
            where: {
              status: 'ACTIVE'
            },
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
          }
        }
      });

      // Calculate totals
      let totalMonthlyAmount = 0;
      const dependentsSummary = students.map(student => {
        const studentName = [student.user?.firstName, student.user?.lastName].filter(Boolean).join(' ') || 'Sem nome';
        const activeSubscriptions = student.subscriptions.map(sub => {
          const price = parseFloat(sub.currentPrice?.toString() || sub.plan?.price?.toString() || '0');
          totalMonthlyAmount += price;
          return {
            subscriptionId: sub.id,
            planId: sub.plan?.id,
            planName: sub.plan?.name || 'Plano',
            price,
            billingType: sub.plan?.billingType || 'MONTHLY',
            startDate: sub.startDate
          };
        });

        return {
          studentId: student.id,
          studentName,
          email: student.user?.email,
          isActive: student.isActive,
          subscriptions: activeSubscriptions,
          subtotal: activeSubscriptions.reduce((sum, s) => sum + s.price, 0)
        };
      });

      return reply.send({
        success: true,
        data: {
          responsible: {
            id: responsible.id,
            name: responsible.name,
            email: responsible.email,
            phone: responsible.phone,
            cpfCnpj: responsible.cpfCnpj,
            consolidateBilling: responsible.consolidateBilling
          },
          dependents: dependentsSummary,
          totalDependents: students.length,
          totalActiveSubscriptions: dependentsSummary.reduce((sum, d) => sum + d.subscriptions.length, 0),
          totalMonthlyAmount
        }
      });
    } catch (error) {
      logger.error('Error fetching billing summary:', error);
      return reply.code(500).send({
        success: false,
        message: 'Falha ao buscar resumo de cobrança'
      });
    }
  });

  // PATCH /api/students/financial-responsibles/:id - Update financial responsible settings
  fastify.patch('/financial-responsibles/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const { id } = request.params as { id: string };
      const body = request.body as { 
        name?: string; 
        email?: string; 
        phone?: string;
        consolidateBilling?: boolean;
      };

      // Check if exists
      const existing = await prisma.financialResponsible.findFirst({
        where: { id, organizationId }
      });

      if (!existing) {
        return reply.code(404).send({
          success: false,
          message: 'Responsável financeiro não encontrado'
        });
      }

      // Build update data - only include provided fields
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.consolidateBilling !== undefined) updateData.consolidateBilling = body.consolidateBilling;

      const updated = await prisma.financialResponsible.update({
        where: { id },
        data: updateData
      });

      return reply.send({
        success: true,
        data: updated,
        message: 'Responsável financeiro atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Error updating financial responsible:', error);
      return reply.code(500).send({
        success: false,
        message: 'Falha ao atualizar responsável financeiro'
      });
    }
  });
}
