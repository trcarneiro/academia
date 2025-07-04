import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Fastify
const server = Fastify({
  logger: {
    level: 'info'
  }
});

const start = async (): Promise<void> => {
  try {
    // Register CORS
    await server.register(cors, {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    });

    // Register static files
    await server.register(fastifyStatic, {
      root: path.join(process.cwd(), 'public'),
      prefix: '/',
    });

    // Serve dashboard on root
    server.get('/', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    // Alternative dashboard routes
    server.get('/dashboard', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    server.get('/ultimate', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    // Health check
    server.get('/health', async (request, reply) => {
      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          message: '🥋 Krav Maga Academy API is running!'
        };
      } catch (error) {
        reply.code(500);
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Students API
    server.get('/api/students', async (request, reply) => {
      try {
        const students = await prisma.student.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            financialResponsible: {
              select: {
                id: true,
                name: true,
                email: true,
                relationshipType: true
              }
            }
          },
          take: 10 // Limit for performance
        });

        return {
          success: true,
          data: students,
          count: students.length,
          message: 'Students retrieved successfully'
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

    // Financial Responsibles API
    server.get('/api/financial-responsibles', async (request, reply) => {
      try {
        const responsibles = await prisma.financialResponsible.findMany({
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            email: true,
            phone: true,
            relationshipType: true,
            _count: {
              select: {
                students: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        });

        // Add mock data if no responsibles exist
        if (responsibles.length === 0) {
          const mockResponsibles = [
            {
              id: 'mock-1',
              name: 'José Silva',
              cpfCnpj: '123.456.789-00',
              email: 'jose.silva@email.com',
              phone: '(11) 99999-1234',
              relationshipType: 'Pai',
              _count: { students: 0 }
            },
            {
              id: 'mock-2',
              name: 'Maria Oliveira',
              cpfCnpj: '987.654.321-00',
              email: 'maria.oliveira@email.com',
              phone: '(11) 99999-5678',
              relationshipType: 'Mãe',
              _count: { students: 0 }
            },
            {
              id: 'mock-3',
              name: 'Carlos Rodrigues Sr.',
              cpfCnpj: '456.789.123-00',
              email: 'carlos.sr@email.com',
              phone: '(11) 99999-9012',
              relationshipType: 'Pai',
              _count: { students: 0 }
            }
          ];
          
          return {
            success: true,
            data: mockResponsibles,
            count: mockResponsibles.length,
            message: 'Mock financial responsibles loaded'
          };
        }

        return {
          success: true,
          data: responsibles,
          count: responsibles.length
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch financial responsibles',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/financial-responsibles - Criar novo responsável financeiro
    server.post('/api/financial-responsibles', async (request, reply) => {
      try {
        const { name, cpfCnpj, email, phone, birthDate, address, addressNumber, complement, neighborhood, city, state, zipCode, relationshipType } = request.body as any;

        // Validações obrigatórias
        if (!name || !cpfCnpj || !email) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'Name, CPF/CNPJ and email are required fields'
          };
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          reply.code(400);
          return {
            success: false,
            error: 'Invalid email format',
            message: 'Please provide a valid email address'
          };
        }

        // Validar CPF/CNPJ (formato básico)
        const cpfCnpjCleaned = cpfCnpj.replace(/\D/g, '');
        if (cpfCnpjCleaned.length !== 11 && cpfCnpjCleaned.length !== 14) {
          reply.code(400);
          return {
            success: false,
            error: 'Invalid CPF/CNPJ',
            message: 'CPF must have 11 digits or CNPJ must have 14 digits'
          };
        }

        // Verificar se já existe um responsável com mesmo CPF/CNPJ ou email
        const existingResponsible = await prisma.financialResponsible.findFirst({
          where: {
            OR: [
              { cpfCnpj: cpfCnpjCleaned },
              { email: email.toLowerCase() }
            ],
            isActive: true
          }
        });

        if (existingResponsible) {
          reply.code(409);
          return {
            success: false,
            error: 'Financial responsible already exists',
            message: 'A financial responsible with this CPF/CNPJ or email already exists'
          };
        }

        // Buscar organização ativa (assumindo single-tenant por agora)
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found',
            message: 'Cannot create financial responsible without an active organization'
          };
        }

        // Criar novo responsável financeiro
        const newResponsible = await prisma.financialResponsible.create({
          data: {
            organizationId: organization.id,
            name: name.trim(),
            cpfCnpj: cpfCnpjCleaned,
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            address: address?.trim() || null,
            addressNumber: addressNumber?.trim() || null,
            complement: complement?.trim() || null,
            neighborhood: neighborhood?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            zipCode: zipCode?.replace(/\D/g, '') || null,
            relationshipType: relationshipType?.trim() || null,
            isActive: true
          },
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        });

        return {
          success: true,
          data: {
            id: newResponsible.id,
            name: newResponsible.name,
            cpfCnpj: newResponsible.cpfCnpj,
            email: newResponsible.email,
            phone: newResponsible.phone,
            relationshipType: newResponsible.relationshipType,
            studentsCount: newResponsible._count.students,
            createdAt: newResponsible.createdAt
          },
          message: 'Financial responsible created successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create financial responsible',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Organizations API
    server.get('/api/organizations', async (request, reply) => {
      try {
        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                students: true,
                instructors: true,
                classes: true
              }
            }
          },
          take: 10
        });

        return {
          success: true,
          data: organizations,
          count: organizations.length,
          message: 'Organizations retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch organizations',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Techniques API
    server.get('/api/techniques', async (request, reply) => {
      try {
        const techniques = await prisma.technique.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
            createdAt: true
          },
          take: 20
        });

        return {
          success: true,
          data: techniques,
          count: techniques.length,
          message: 'Techniques retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch techniques',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Create student endpoint
    server.post('/api/students', async (request, reply) => {
      try {
        const body = request.body as any;
        
        // Validation
        if (!body.email || !body.firstName || !body.lastName) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: email, firstName, lastName'
          };
        }

        // Get default organization (for now, use the first one)
        const organization = await prisma.organization.findFirst();
        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No organization found'
          };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: {
            organizationId_email: {
              organizationId: organization.id,
              email: body.email
            }
          }
        });

        if (existingUser) {
          reply.code(400);
          return {
            success: false,
            error: 'User with this email already exists'
          };
        }

        // Create user and student in transaction
        const result = await prisma.$transaction(async (tx) => {
          let financialResponsible = null;
          
          // Se tem responsável financeiro, criar primeiro
          if (body.hasFinancialResponsible && body.responsibleName && body.responsibleEmail) {
            financialResponsible = await tx.financialResponsible.create({
              data: {
                organizationId: organization.id,
                name: body.responsibleName,
                cpfCnpj: body.responsibleCpfCnpj || '',
                email: body.responsibleEmail,
                phone: body.responsiblePhone || '',
                address: body.responsibleAddress || '',
                addressNumber: body.responsibleAddressNumber || '',
                complement: body.responsibleComplement || '',
                neighborhood: body.responsibleNeighborhood || '',
                city: body.responsibleCity || '',
                state: body.responsibleState || '',
                zipCode: body.responsibleZipCode || '',
                country: 'Brazil'
              }
            });
          }
          
          // Create user
          const user = await tx.user.create({
            data: {
              organizationId: organization.id,
              email: body.email,
              password: await require('bcryptjs').hash(body.password || '123456', 10),
              firstName: body.firstName,
              lastName: body.lastName,
              phone: body.phone || '',
              birthDate: body.birthDate ? new Date(body.birthDate) : null,
              role: 'STUDENT',
              isActive: true,
            }
          });

          // Create student
          const student = await tx.student.create({
            data: {
              organizationId: organization.id,
              userId: user.id,
              financialResponsibleId: financialResponsible?.id,
              category: body.category || 'ADULT',
              emergencyContact: body.emergencyContact || '',
              isActive: true,
            }
          });
          
          // NOVA FUNCIONALIDADE: Associação automática de plano de pagamento
          let createdSubscription = null;
          if (body.courseId) {
            try {
              // Verificar se curso existe
              const course = await tx.course.findUnique({
                where: { id: body.courseId },
                include: { organization: true }
              });

              if (course) {
                let planId = body.planId;
                
                // Se não especificou plano, buscar ou criar automaticamente
                if (!planId) {
                  // Buscar plano existente para a categoria e curso
                  let existingPlan = await tx.billingPlan.findFirst({
                    where: {
                      organizationId: organization.id,
                      category: student.category,
                      isActive: true
                    },
                    orderBy: { createdAt: 'desc' }
                  });

                  // Se não existe, criar novo plano baseado na categoria
                  if (!existingPlan) {
                    const planPrices = {
                      'ADULT': 180.00,
                      'INICIANTE1': 120.00,
                      'INICIANTE2': 120.00,
                      'INTERMEDIARIO1': 150.00,
                      'INTERMEDIARIO2': 150.00,
                      'AVANCADO1': 200.00,
                      'AVANCADO2': 200.00,
                      'MASTER': 250.00,
                      'INSTRUCTOR': 300.00
                    };

                    const planPrice = body.customPrice ? parseFloat(body.customPrice) : (planPrices[student.category] || 150.00);

                    existingPlan = await tx.billingPlan.create({
                      data: {
                        organizationId: organization.id,
                        name: `${course.name} - ${student.category}`,
                        description: `Plano automático para ${course.name} categoria ${student.category}`,
                        category: student.category,
                        price: planPrice,
                        billingType: 'MONTHLY',
                        classesPerWeek: 2,
                        maxClasses: 8,
                        hasPersonalTraining: false,
                        hasNutrition: false,
                        isActive: true
                      }
                    });
                  }

                  planId = existingPlan.id;
                }

                // Criar subscription automaticamente
                if (planId) {
                  const { FinancialService } = await import('../services/financialService.js');
                  const financialService = new FinancialService(organization.id);
                  
                  createdSubscription = await financialService.createSubscription({
                    studentId: student.id,
                    planId: planId,
                    startDate: new Date(),
                    customPrice: body.customPrice
                  });

                  // Criar matrícula no curso automaticamente
                  await tx.courseEnrollment.create({
                    data: {
                      studentId: student.id,
                      courseId: body.courseId,
                      status: 'ACTIVE',
                      category: student.category,
                      gender: body.gender || 'MASCULINO',
                      expectedEndDate: new Date(Date.now() + (course.duration || 12) * 7 * 24 * 60 * 60 * 1000)
                    }
                  });

                  // Vincular às turmas do curso se existirem
                  const courseClasses = await tx.class.findMany({
                    where: { courseId: body.courseId, isActive: true }
                  });

                  for (const courseClass of courseClasses) {
                    await tx.studentCourse.create({
                      data: {
                        studentId: student.id,
                        courseId: body.courseId,
                        classId: courseClass.id,
                        isActive: true
                      }
                    });
                  }
                }
              }
            } catch (error) {
              console.log('Erro na matrícula inteligente:', error);
            }
          }

          return { user, student, financialResponsible, createdSubscription };
        });

        return {
          success: true,
          message: 'Student created successfully',
          data: {
            id: result.student.id,
            userId: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            category: result.student.category,
            hasFinancialResponsible: !!result.financialResponsible,
            financialResponsible: result.financialResponsible ? {
              id: result.financialResponsible.id,
              name: result.financialResponsible.name,
              email: result.financialResponsible.email
            } : null,
            automaticEnrollment: body.courseId ? {
              courseId: body.courseId,
              subscriptionCreated: !!result.createdSubscription,
              hasActiveSubscription: !!result.createdSubscription
            } : null
          }
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

    // Update student endpoint
    server.put('/api/students/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as any;
        
        // Find existing student
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

        // Update user and student in transaction
        const result = await prisma.$transaction(async (tx) => {
          // Update user if needed
          if (body.firstName || body.lastName || body.email) {
            await tx.user.update({
              where: { id: existingStudent.userId },
              data: {
                ...(body.firstName && { firstName: body.firstName }),
                ...(body.lastName && { lastName: body.lastName }),
                ...(body.email && { email: body.email }),
              }
            });
          }

          // Update student
          const student = await tx.student.update({
            where: { id },
            data: {
              ...(body.category && { category: body.category }),
              ...(body.emergencyContact && { emergencyContact: body.emergencyContact }),
              ...(body.isActive !== undefined && { isActive: body.isActive }),
              ...(body.financialResponsibleId !== undefined && { 
                financialResponsibleId: body.financialResponsibleId || null 
              }),
            },
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              },
              financialResponsible: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  relationshipType: true
                }
              }
            }
          });

          return student;
        });

        return {
          success: true,
          message: 'Student updated successfully',
          data: result
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

    // Delete student endpoint
    server.delete('/api/students/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        // Find existing student
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

        // Delete student and user in transaction
        await prisma.$transaction(async (tx) => {
          // Delete student first (foreign key constraint)
          await tx.student.delete({
            where: { id }
          });

          // Delete user
          await tx.user.delete({
            where: { id: existingStudent.userId }
          });
        });

        return {
          success: true,
          message: 'Student deleted successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to delete student',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get single student endpoint
    server.get('/api/students/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const student = await prisma.student.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                createdAt: true
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
          data: student,
          message: 'Student retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve student',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // COURSES AND CLASSES APIs
    // ========================================

    // Get all courses
    server.get('/api/courses', async (request, reply) => {
      try {
        const courses = await prisma.course.findMany({
          include: {
            martialArt: {
              select: { name: true }
            },
            _count: {
              select: {
                studentCourses: true,
                lessonPlans: true,
                classes: true
              }
            }
          },
          take: 10
        });

        return {
          success: true,
          data: courses,
          count: courses.length,
          message: 'Courses retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch courses',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get course details with lesson plans
    server.get('/api/courses/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const course = await prisma.course.findUnique({
          where: { id },
          include: {
            martialArt: true,
            lessonPlans: {
              orderBy: { lessonNumber: 'asc' },
              take: 10
            },
            classes: {
              include: {
                instructor: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
            },
            studentCourses: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                studentCourses: true,
                lessonPlans: true,
                techniqueDetails: true,
                weeklyChallenges: true
              }
            }
          }
        });

        if (!course) {
          reply.code(404);
          return {
            success: false,
            error: 'Course not found'
          };
        }

        return {
          success: true,
          data: course,
          message: 'Course details retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve course',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get classes/turmas
    server.get('/api/classes', async (request, reply) => {
      try {
        const classes = await prisma.class.findMany({
          include: {
            course: {
              select: { name: true, totalClasses: true }
            },
            instructor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            _count: {
              select: {
                studentCourses: true,
                attendanceRecords: true
              }
            }
          },
          orderBy: { startTime: 'asc' },
          take: 10
        });

        return {
          success: true,
          data: classes,
          count: classes.length,
          message: 'Classes retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch classes',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get today's lesson plan for a class
    server.get('/api/classes/:id/today-lesson', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const today = new Date();
        
        // Calculate which lesson should be today based on course start date
        const classInfo = await prisma.class.findUnique({
          where: { id },
          include: {
            course: {
              include: {
                studentCourses: {
                  take: 1,
                  orderBy: { startDate: 'asc' }
                }
              }
            }
          }
        });

        if (!classInfo) {
          reply.code(404);
          return {
            success: false,
            error: 'Class not found'
          };
        }

        // Calculate current lesson number (simplified)
        const startDate = classInfo.course.studentCourses[0]?.startDate || new Date('2025-06-01');
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentLesson = Math.min(Math.floor(daysDiff / 3.5) * 2 + 1, 48);

        const lessonPlan = await prisma.lessonPlan.findFirst({
          where: {
            courseId: classInfo.courseId,
            lessonNumber: currentLesson
          },
          include: {
            course: {
              select: { name: true }
            }
          }
        });

        return {
          success: true,
          data: {
            currentLesson,
            lessonPlan,
            classInfo: {
              title: classInfo.title,
              startTime: classInfo.startTime,
              endTime: classInfo.endTime
            }
          },
          message: 'Today\'s lesson plan retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve lesson plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // ATTENDANCE MANAGEMENT APIs
    // ========================================

    // Get attendance for a specific class lesson
    server.get('/api/classes/:classId/lessons/:lessonNumber/attendance', async (request, reply) => {
      try {
        const { classId, lessonNumber } = request.params as { classId: string, lessonNumber: string };
        
        const attendance = await prisma.attendanceRecord.findMany({
          where: { 
            classId, 
            lessonNumber: parseInt(lessonNumber) 
          },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          },
          orderBy: { student: { user: { firstName: 'asc' } } }
        });

        return {
          success: true,
          data: attendance,
          count: attendance.length,
          stats: {
            present: attendance.filter(a => a.present).length,
            absent: attendance.filter(a => !a.present).length,
            late: attendance.filter(a => a.arrived_late).length,
            leftEarly: attendance.filter(a => a.left_early).length
          },
          message: 'Attendance retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch attendance',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Mark attendance for a student in a class lesson
    server.post('/api/attendance', async (request, reply) => {
      try {
        const body = request.body as any;
        
        // Validation
        if (!body.studentId || !body.classId || !body.lessonNumber) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: studentId, classId, lessonNumber'
          };
        }

        // Check if attendance already exists
        const existingAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: body.studentId,
            classId: body.classId,
            lessonNumber: parseInt(body.lessonNumber)
          }
        });

        if (existingAttendance) {
          // Update existing attendance
          const updatedAttendance = await prisma.attendanceRecord.update({
            where: { id: existingAttendance.id },
            data: {
              present: body.present ?? true,
              arrived_late: body.arrived_late ?? false,
              left_early: body.left_early ?? false,
              notes: body.notes || null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: updatedAttendance,
            message: 'Attendance updated successfully'
          };
        } else {
          // Create new attendance record
          const newAttendance = await prisma.attendanceRecord.create({
            data: {
              studentId: body.studentId,
              classId: body.classId,
              courseId: body.courseId,
              lessonNumber: parseInt(body.lessonNumber),
              date: new Date(body.date || new Date()),
              present: body.present ?? true,
              arrived_late: body.arrived_late ?? false,
              left_early: body.left_early ?? false,
              notes: body.notes || null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: newAttendance,
            message: 'Attendance marked successfully'
          };
        }
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to mark attendance',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Bulk mark attendance for all students in a class
    server.post('/api/classes/:classId/lessons/:lessonNumber/attendance/bulk', async (request, reply) => {
      try {
        const { classId, lessonNumber } = request.params as { classId: string, lessonNumber: string };
        const body = request.body as { students: Array<{ studentId: string, present: boolean, arrived_late?: boolean, left_early?: boolean, notes?: string }>, courseId: string, date?: string };
        
        if (!body.students || !Array.isArray(body.students)) {
          reply.code(400);
          return {
            success: false,
            error: 'Students array is required'
          };
        }

        const results = await prisma.$transaction(async (tx) => {
          const attendanceRecords = [];
          
          for (const studentData of body.students) {
            // Check if attendance already exists
            const existingAttendance = await tx.attendanceRecord.findFirst({
              where: {
                studentId: studentData.studentId,
                classId: classId,
                lessonNumber: parseInt(lessonNumber)
              }
            });

            if (existingAttendance) {
              // Update existing
              const updated = await tx.attendanceRecord.update({
                where: { id: existingAttendance.id },
                data: {
                  present: studentData.present,
                  arrived_late: studentData.arrived_late ?? false,
                  left_early: studentData.left_early ?? false,
                  notes: studentData.notes || null
                },
                include: {
                  student: {
                    include: {
                      user: {
                        select: { firstName: true, lastName: true }
                      }
                    }
                  }
                }
              });
              attendanceRecords.push(updated);
            } else {
              // Create new
              const created = await tx.attendanceRecord.create({
                data: {
                  studentId: studentData.studentId,
                  classId: classId,
                  courseId: body.courseId,
                  lessonNumber: parseInt(lessonNumber),
                  date: new Date(body.date || new Date()),
                  present: studentData.present,
                  arrived_late: studentData.arrived_late ?? false,
                  left_early: studentData.left_early ?? false,
                  notes: studentData.notes || null
                },
                include: {
                  student: {
                    include: {
                      user: {
                        select: { firstName: true, lastName: true }
                      }
                    }
                  }
                }
              });
              attendanceRecords.push(created);
            }
          }
          
          return attendanceRecords;
        });

        return {
          success: true,
          data: results,
          count: results.length,
          message: 'Bulk attendance marked successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to mark bulk attendance',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get attendance statistics for a class
    server.get('/api/classes/:classId/attendance/stats', async (request, reply) => {
      try {
        const { classId } = request.params as { classId: string };
        
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: { classId },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        });

        // Calculate statistics
        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter(a => a.present).length;
        const lateRecords = attendanceRecords.filter(a => a.arrived_late).length;
        const leftEarlyRecords = attendanceRecords.filter(a => a.left_early).length;
        
        // Group by student
        const studentStats = attendanceRecords.reduce((acc, record) => {
          const studentId = record.studentId;
          if (!acc[studentId]) {
            acc[studentId] = {
              student: record.student,
              totalClasses: 0,
              presentClasses: 0,
              lateClasses: 0,
              leftEarlyClasses: 0,
              attendanceRate: 0
            };
          }
          
          acc[studentId].totalClasses++;
          if (record.present) acc[studentId].presentClasses++;
          if (record.arrived_late) acc[studentId].lateClasses++;
          if (record.left_early) acc[studentId].leftEarlyClasses++;
          
          acc[studentId].attendanceRate = Math.round((acc[studentId].presentClasses / acc[studentId].totalClasses) * 100);
          
          return acc;
        }, {} as any);

        // Group by lesson
        const lessonStats = attendanceRecords.reduce((acc, record) => {
          const lessonNumber = record.lessonNumber;
          if (!acc[lessonNumber]) {
            acc[lessonNumber] = {
              lessonNumber,
              totalStudents: 0,
              presentStudents: 0,
              attendanceRate: 0,
              date: record.date
            };
          }
          
          acc[lessonNumber].totalStudents++;
          if (record.present) acc[lessonNumber].presentStudents++;
          acc[lessonNumber].attendanceRate = Math.round((acc[lessonNumber].presentStudents / acc[lessonNumber].totalStudents) * 100);
          
          return acc;
        }, {} as any);

        return {
          success: true,
          data: {
            overall: {
              totalRecords,
              presentRecords,
              lateRecords,
              leftEarlyRecords,
              overallAttendanceRate: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0
            },
            byStudent: Object.values(studentStats),
            byLesson: Object.values(lessonStats).sort((a: any, b: any) => a.lessonNumber - b.lessonNumber)
          },
          message: 'Attendance statistics retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch attendance statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get students enrolled in a class for attendance marking
    server.get('/api/classes/:classId/students', async (request, reply) => {
      try {
        const { classId } = request.params as { classId: string };
        
        const students = await prisma.studentCourse.findMany({
          where: { classId },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            },
            course: {
              select: { name: true }
            }
          },
          orderBy: { student: { user: { firstName: 'asc' } } }
        });

        return {
          success: true,
          data: students,
          count: students.length,
          message: 'Class students retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch class students',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get student progress in course
    server.get('/api/students/:studentId/progress/:courseId', async (request, reply) => {
      try {
        const { studentId, courseId } = request.params as { studentId: string, courseId: string };
        
        // Get student course enrollment
        const studentCourse = await prisma.studentCourse.findFirst({
          where: { studentId, courseId },
          include: {
            course: { select: { name: true, totalClasses: true } },
            class: { select: { title: true } }
          }
        });

        if (!studentCourse) {
          reply.code(404);
          return {
            success: false,
            error: 'Student not enrolled in this course'
          };
        }

        // Get attendance records
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Get progress records
        const progressRecords = await prisma.progress.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Calculate statistics
        const totalClasses = attendanceRecords.length;
        const presentClasses = attendanceRecords.filter(a => a.present).length;
        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
        
        const totalTechniques = progressRecords.reduce((acc, p) => acc + p.techniquesLearned.length, 0);
        const totalPoints = progressRecords.reduce((acc, p) => acc + p.points, 0);
        const completedChallenges = progressRecords.reduce((acc, p) => acc + p.challengesCompleted.length, 0);

        return {
          success: true,
          data: {
            studentCourse,
            stats: {
              attendanceRate,
              totalClasses,
              presentClasses,
              totalTechniques,
              totalPoints,
              completedChallenges,
              currentLesson: Math.max(...attendanceRecords.map(a => a.lessonNumber), 0)
            },
            attendanceRecords: attendanceRecords.slice(-10), // Last 10 classes
            progressRecords: progressRecords.slice(-5) // Last 5 progress entries
          },
          message: 'Student progress retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve student progress',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // PROGRESS AND TECHNIQUES MANAGEMENT
    // ========================================

    // Get techniques for a specific lesson
    server.get('/api/courses/:courseId/lessons/:lessonNumber/techniques', async (request, reply) => {
      try {
        const { courseId, lessonNumber } = request.params as { courseId: string, lessonNumber: string };
        
        const techniques = await prisma.techniqueDetail.findMany({
          where: { 
            courseId,
            lessonNumber: parseInt(lessonNumber)
          },
          orderBy: { orderInLesson: 'asc' }
        });

        return {
          success: true,
          data: techniques,
          count: techniques.length,
          message: 'Lesson techniques retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch lesson techniques',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Record student progress for a lesson
    server.post('/api/progress', async (request, reply) => {
      try {
        const body = request.body as any;
        
        // Validation
        if (!body.studentId || !body.courseId || !body.lessonNumber) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: studentId, courseId, lessonNumber'
          };
        }

        // Check if progress already exists for this lesson
        const existingProgress = await prisma.progress.findFirst({
          where: {
            studentId: body.studentId,
            courseId: body.courseId,
            lessonNumber: parseInt(body.lessonNumber)
          }
        });

        if (existingProgress) {
          // Update existing progress
          const updatedProgress = await prisma.progress.update({
            where: { id: existingProgress.id },
            data: {
              techniquesLearned: body.techniquesLearned || [],
              challengesCompleted: body.challengesCompleted || [],
              points: body.points || 0,
              reflections: body.reflections || body.notes || null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: updatedProgress,
            message: 'Progress updated successfully'
          };
        } else {
          // Create new progress record
          const newProgress = await prisma.progress.create({
            data: {
              studentId: body.studentId,
              courseId: body.courseId,
              lessonNumber: parseInt(body.lessonNumber),
              techniquesLearned: body.techniquesLearned || [],
              challengesCompleted: body.challengesCompleted || [],
              points: body.points || 0,
              reflections: body.reflections || body.notes || null
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: newProgress,
            message: 'Progress recorded successfully'
          };
        }
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to record progress',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Mark technique as mastered by student
    server.post('/api/techniques/:techniqueId/master', async (request, reply) => {
      try {
        const { techniqueId } = request.params as { techniqueId: string };
        const body = request.body as any;
        
        if (!body.studentId || !body.courseId) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: studentId, courseId'
          };
        }

        // Get technique details
        const technique = await prisma.techniqueDetail.findUnique({
          where: { id: techniqueId }
        });

        if (!technique) {
          reply.code(404);
          return {
            success: false,
            error: 'Technique not found'
          };
        }

        // Find or create progress record for this lesson
        let progress = await prisma.progress.findFirst({
          where: {
            studentId: body.studentId,
            courseId: body.courseId,
            lessonNumber: technique.lessonNumber
          }
        });

        if (!progress) {
          progress = await prisma.progress.create({
            data: {
              studentId: body.studentId,
              courseId: body.courseId,
              lessonNumber: technique.lessonNumber,
              techniquesLearned: [],
              challengesCompleted: [],
              points: 0
            }
          });
        }

        // Add technique to learned techniques if not already present
        const learnedTechniques = progress.techniquesLearned as string[];
        if (!learnedTechniques.includes(techniqueId)) {
          const updatedTechniques = [...learnedTechniques, techniqueId];
          const bonusPoints = 10; // Points for mastering a technique

          const updatedProgress = await prisma.progress.update({
            where: { id: progress.id },
            data: {
              techniquesLearned: updatedTechniques,
              points: progress.points + bonusPoints
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: {
              progress: updatedProgress,
              technique: technique,
              pointsEarned: bonusPoints
            },
            message: 'Technique mastered successfully'
          };
        } else {
          return {
            success: true,
            message: 'Technique already mastered',
            data: { progress, technique }
          };
        }
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to mark technique as mastered',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get student's overall progress summary
    server.get('/api/students/:studentId/progress-summary/:courseId', async (request, reply) => {
      try {
        const { studentId, courseId } = request.params as { studentId: string, courseId: string };
        
        // Get all progress records for this student and course
        const progressRecords = await prisma.progress.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Get all techniques for the course
        const allTechniques = await prisma.techniqueDetail.findMany({
          where: { courseId },
          orderBy: [{ lessonNumber: 'asc' }, { orderInLesson: 'asc' }]
        });

        // Calculate statistics
        const totalLessons = 48; // Total lessons in course
        const completedLessons = progressRecords.filter(p => p.completedAt).length;
        const totalTechniques = allTechniques.length;
        const masteredTechniques = progressRecords.reduce((acc, p) => acc + (p.techniquesLearned as string[]).length, 0);
        const totalPoints = progressRecords.reduce((acc, p) => acc + p.points, 0);
        const totalChallenges = progressRecords.reduce((acc, p) => acc + (p.challengesCompleted as string[]).length, 0);
        
        // Group techniques by unit
        const techniquesByUnit = allTechniques.reduce((acc, technique) => {
          const lessonNumber = technique.lessonNumber;
          let unit = 'Fundamentos';
          if (lessonNumber >= 40) unit = 'Integração';
          else if (lessonNumber >= 30) unit = 'Defesas Avançadas';
          else if (lessonNumber >= 20) unit = 'Defesas Básicas';
          else if (lessonNumber >= 10) unit = 'Golpes Básicos';
          
          if (!acc[unit]) acc[unit] = [];
          acc[unit].push(technique);
          return acc;
        }, {} as any);

        // Calculate mastered techniques by unit
        const masteredByUnit = {} as any;
        const learnedTechniqueIds = progressRecords.flatMap(p => p.techniquesLearned as string[]);
        
        for (const [unit, techniques] of Object.entries(techniquesByUnit)) {
          const unitTechniques = techniques as any[];
          const masteredInUnit = unitTechniques.filter(t => learnedTechniqueIds.includes(t.id)).length;
          masteredByUnit[unit] = {
            mastered: masteredInUnit,
            total: unitTechniques.length,
            percentage: Math.round((masteredInUnit / unitTechniques.length) * 100)
          };
        }

        return {
          success: true,
          data: {
            overall: {
              completedLessons,
              totalLessons,
              lessonProgress: Math.round((completedLessons / totalLessons) * 100),
              masteredTechniques,
              totalTechniques,
              techniqueProgress: Math.round((masteredTechniques / totalTechniques) * 100),
              totalPoints,
              totalChallenges,
              currentLesson: Math.max(...progressRecords.map(p => p.lessonNumber), 0) + 1
            },
            byUnit: masteredByUnit,
            recentProgress: progressRecords.slice(-5), // Last 5 progress entries
            upcomingTechniques: allTechniques.filter(t => 
              t.lessonNumber <= Math.max(...progressRecords.map(p => p.lessonNumber), 0) + 2 &&
              !learnedTechniqueIds.includes(t.id)
            ).slice(0, 5)
          },
          message: 'Progress summary retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve progress summary',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // EVALUATION SYSTEM
    // ========================================

    // Get all evaluations for a course
    server.get('/api/courses/:courseId/evaluations', async (request, reply) => {
      try {
        const { courseId } = request.params as { courseId: string };
        
        const evaluations = await prisma.evaluationRecord.findMany({
          where: { courseId },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          },
          orderBy: [{ lessonNumber: 'asc' }, { createdAt: 'desc' }]
        });

        // Group by evaluation type (modular vs final - lesson 48 is final)
        const modularEvaluations = evaluations.filter(e => e.lessonNumber < 48);
        const finalEvaluations = evaluations.filter(e => e.lessonNumber === 48);

        return {
          success: true,
          data: {
            modular: modularEvaluations,
            final: finalEvaluations,
            total: evaluations.length
          },
          message: 'Evaluations retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch evaluations',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Submit evaluation for a student
    server.post('/api/evaluations', async (request, reply) => {
      try {
        const body = request.body as any;
        
        // Validation
        if (!body.studentId || !body.courseId || !body.lessonNumber) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: studentId, courseId, lessonNumber'
          };
        }

        // Check if evaluation already exists
        const existingEvaluation = await prisma.evaluationRecord.findFirst({
          where: {
            studentId: body.studentId,
            courseId: body.courseId,
            lessonNumber: parseInt(body.lessonNumber)
          }
        });

        if (existingEvaluation) {
          // Update existing evaluation
          const updatedEvaluation = await prisma.evaluationRecord.update({
            where: { id: existingEvaluation.id },
            data: {
              techniquesEvaluated: body.techniquesEvaluated || [],
              physicalTest: body.physicalTest || null,
              physicalTestResult: body.physicalTestResult || null,
              simulationScenarios: body.simulationScenarios || [],
              simulationResults: body.simulationResults || [],
              precision: body.precision || null,
              status: body.status || 'PENDING',
              instructorNotes: body.instructorNotes || null,
              certificateIssued: body.certificateIssued || false
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: updatedEvaluation,
            message: 'Evaluation updated successfully'
          };
        } else {
          // Create new evaluation
          const newEvaluation = await prisma.evaluationRecord.create({
            data: {
              studentId: body.studentId,
              courseId: body.courseId,
              lessonNumber: parseInt(body.lessonNumber),
              techniquesEvaluated: body.techniquesEvaluated || [],
              physicalTest: body.physicalTest || null,
              physicalTestResult: body.physicalTestResult || null,
              simulationScenarios: body.simulationScenarios || [],
              simulationResults: body.simulationResults || [],
              precision: body.precision || null,
              status: body.status || 'PENDING',
              instructorNotes: body.instructorNotes || null,
              certificateIssued: body.certificateIssued || false
            },
            include: {
              student: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true }
                  }
                }
              }
            }
          });

          return {
            success: true,
            data: newEvaluation,
            message: 'Evaluation created successfully'
          };
        }
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create/update evaluation',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get student's evaluation history
    server.get('/api/students/:studentId/evaluations/:courseId', async (request, reply) => {
      try {
        const { studentId, courseId } = request.params as { studentId: string, courseId: string };
        
        const evaluations = await prisma.evaluationRecord.findMany({
          where: { studentId, courseId },
          orderBy: { lessonNumber: 'asc' }
        });

        // Calculate evaluation statistics
        const completedEvaluations = evaluations.filter(e => e.status === 'COMPLETED');
        const averagePrecision = completedEvaluations.length > 0 
          ? Math.round(completedEvaluations.reduce((acc, e) => acc + (e.precision || 0), 0) / completedEvaluations.length)
          : 0;

        const modularEvaluations = evaluations.filter(e => e.lessonNumber < 48);
        const finalEvaluations = evaluations.filter(e => e.lessonNumber === 48);

        return {
          success: true,
          data: {
            evaluations,
            statistics: {
              total: evaluations.length,
              completed: completedEvaluations.length,
              pending: evaluations.filter(e => e.status === 'PENDING').length,
              averagePrecision,
              modularCount: modularEvaluations.length,
              finalCount: finalEvaluations.length
            }
          },
          message: 'Student evaluations retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve student evaluations',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Update evaluation status (approve/reject)
    server.patch('/api/evaluations/:evaluationId/status', async (request, reply) => {
      try {
        const { evaluationId } = request.params as { evaluationId: string };
        const body = request.body as any;
        
        if (!body.status) {
          reply.code(400);
          return {
            success: false,
            error: 'Status is required'
          };
        }

        const updatedEvaluation = await prisma.evaluationRecord.update({
          where: { id: evaluationId },
          data: {
            status: body.status,
            instructorNotes: body.instructorNotes || null,
            precision: body.precision || undefined,
            certificateIssued: body.status === 'COMPLETED' && body.certificateIssued
          },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        });

        return {
          success: true,
          data: updatedEvaluation,
          message: 'Evaluation status updated successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to update evaluation status',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get evaluation statistics for a course
    server.get('/api/courses/:courseId/evaluation-stats', async (request, reply) => {
      try {
        const { courseId } = request.params as { courseId: string };
        
        const evaluations = await prisma.evaluationRecord.findMany({
          where: { courseId },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        });

        // Calculate comprehensive statistics
        const totalEvaluations = evaluations.length;
        const completedEvaluations = evaluations.filter(e => e.status === 'COMPLETED');
        const pendingEvaluations = evaluations.filter(e => e.status === 'PENDING');
        
        const averagePrecision = completedEvaluations.length > 0
          ? Math.round(completedEvaluations.reduce((acc, e) => acc + (e.precision || 0), 0) / completedEvaluations.length)
          : 0;

        // Group by student
        const studentStats = evaluations.reduce((acc, evaluation) => {
          const studentId = evaluation.studentId;
          if (!acc[studentId]) {
            acc[studentId] = {
              student: evaluation.student,
              evaluations: [],
              completed: 0,
              pending: 0,
              averagePrecision: 0
            };
          }
          
          acc[studentId].evaluations.push(evaluation);
          if (evaluation.status === 'COMPLETED') acc[studentId].completed++;
          if (evaluation.status === 'PENDING') acc[studentId].pending++;
          
          const studentCompleted = acc[studentId].evaluations.filter(e => e.status === 'COMPLETED');
          acc[studentId].averagePrecision = studentCompleted.length > 0
            ? Math.round(studentCompleted.reduce((sum, e) => sum + (e.precision || 0), 0) / studentCompleted.length)
            : 0;
          
          return acc;
        }, {} as any);

        return {
          success: true,
          data: {
            overall: {
              totalEvaluations,
              completedEvaluations: completedEvaluations.length,
              pendingEvaluations: pendingEvaluations.length,
              averagePrecision,
              completionRate: totalEvaluations > 0 ? Math.round((completedEvaluations.length / totalEvaluations) * 100) : 0
            },
            byStudent: Object.values(studentStats)
          },
          message: 'Evaluation statistics retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve evaluation statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // FINANCIAL MANAGEMENT APIs
    // ========================================

    // Import and register financial routes
    try {
      const financialModule = await import('./routes/financial');
      await server.register(financialModule.default, { prefix: '/api/financial' });
    } catch (error) {
      console.log('⚠️ Financial routes not available:', error);
    }

    // Import and register financial responsible routes
    try {
      const financialResponsibleModule = await import('./routes/financialResponsible');
      await server.register(financialResponsibleModule.default, { prefix: '/api/financial-responsible' });
    } catch (error) {
      console.log('⚠️ Financial responsible routes not available:', error);
    }

    // ========================================
    // BILLING PLANS APIs - Para seu fluxo
    // ========================================

    // GET /api/billing-plans - Lista todos os planos
    server.get('/api/billing-plans', async (request, reply) => {
      try {
        const plans = await prisma.billingPlan.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { subscriptions: true } }
          },
          orderBy: { price: 'asc' }
        });

        return {
          success: true,
          data: plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            category: plan.category,
            price: parseFloat(plan.price.toString()),
            billingType: plan.billingType,
            classesPerWeek: plan.classesPerWeek,
            maxClasses: plan.maxClasses,
            features: {
              hasPersonalTraining: plan.hasPersonalTraining,
              hasNutrition: plan.hasNutrition
            },
            activeSubscriptions: plan._count.subscriptions
          })),
          message: 'Billing plans retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve billing plans',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/billing-plans - Criar novo plano
    server.post('/api/billing-plans', async (request, reply) => {
      try {
        const { name, description, category, price, billingType, classesPerWeek, maxClasses, hasPersonalTraining, hasNutrition } = request.body as any;

        // Buscar primeira organização ativa
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found',
            message: 'Cannot create billing plan without an active organization'
          };
        }

        const plan = await prisma.billingPlan.create({
          data: {
            organizationId: organization.id,
            name,
            description,
            category,
            price: parseFloat(price),
            billingType: billingType || 'MONTHLY',
            classesPerWeek: classesPerWeek || 2,
            maxClasses,
            hasPersonalTraining: hasPersonalTraining || false,
            hasNutrition: hasNutrition || false,
            isActive: true
          }
        });

        return {
          success: true,
          data: plan,
          message: 'Billing plan created successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create billing plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // PUT /api/billing-plans/:id - Atualizar plano existente
    server.put('/api/billing-plans/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { name, description, category, price, billingType, classesPerWeek, maxClasses, hasPersonalTraining, hasNutrition } = request.body as any;

        // Validações obrigatórias
        if (!name || !price || !billingType) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'Nome, preço e tipo de cobrança são obrigatórios'
          };
        }

        // Verificar se o plano existe
        const existingPlan = await prisma.billingPlan.findUnique({
          where: { id }
        });

        if (!existingPlan) {
          reply.code(404);
          return {
            success: false,
            error: 'Plan not found',
            message: 'Plano não encontrado'
          };
        }

        // Atualizar o plano
        const updatedPlan = await prisma.billingPlan.update({
          where: { id },
          data: {
            name,
            description,
            category,
            price: parseFloat(price),
            billingType,
            classesPerWeek: parseInt(classesPerWeek) || 2,
            maxClasses: maxClasses ? parseInt(maxClasses) : classesPerWeek * 4,
            hasPersonalTraining: hasPersonalTraining || false,
            hasNutrition: hasNutrition || false
          }
        });

        return {
          success: true,
          data: updatedPlan,
          message: 'Billing plan updated successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to update billing plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/payment-plans - Criar plano de pagamento personalizado
    server.post('/api/payment-plans', async (request, reply) => {
      try {
        const { courseId, category, customPrice, name, description, billingType, classesPerWeek } = request.body as any;

        // Validações obrigatórias
        if (!courseId || !category) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'courseId and category are required fields'
          };
        }

        // Validar se o curso existe
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: { organization: true }
        });

        if (!course) {
          reply.code(404);
          return {
            success: false,
            error: 'Course not found',
            message: 'The specified course does not exist'
          };
        }

        // Validar categoria
        const validCategories = ['ADULT', 'INICIANTE1', 'INICIANTE2', 'INTERMEDIARIO1', 'INTERMEDIARIO2', 'AVANCADO1', 'AVANCADO2', 'MASTER', 'INSTRUCTOR'];
        if (!validCategories.includes(category)) {
          reply.code(400);
          return {
            success: false,
            error: 'Invalid category',
            message: `Category must be one of: ${validCategories.join(', ')}`
          };
        }

        // Buscar plano padrão existente para a categoria ou usar valores default
        let defaultPlan = await prisma.billingPlan.findFirst({
          where: {
            organizationId: course.organizationId,
            category: category,
            isActive: true
          },
          orderBy: { createdAt: 'desc' }
        });

        // Se não encontrou plano padrão, criar valores baseados na categoria
        let planPrice = customPrice ? parseFloat(customPrice) : 150.00;
        let planName = name || `${course.name} - ${category}`;
        let planDescription = description || `Plano personalizado para ${course.name} categoria ${category}`;
        let planClassesPerWeek = classesPerWeek || 2;

        if (defaultPlan && !customPrice) {
          planPrice = parseFloat(defaultPlan.price.toString());
        }

        // Ajustar preço baseado na categoria se não especificado
        if (!customPrice && !defaultPlan) {
          switch (category) {
            case 'ADULT':
              planPrice = 180.00;
              break;
            case 'INICIANTE1':
            case 'INICIANTE2':
              planPrice = 120.00;
              break;
            case 'INTERMEDIARIO1':
            case 'INTERMEDIARIO2':
              planPrice = 150.00;
              break;
            case 'AVANCADO1':
            case 'AVANCADO2':
              planPrice = 200.00;
              break;
            case 'MASTER':
              planPrice = 250.00;
              break;
            case 'INSTRUCTOR':
              planPrice = 300.00;
              break;
            default:
              planPrice = 150.00;
          }
        }

        // Verificar se já existe um plano similar
        const existingPlan = await prisma.billingPlan.findFirst({
          where: {
            organizationId: course.organizationId,
            name: planName,
            category: category,
            isActive: true
          }
        });

        if (existingPlan) {
          return {
            success: true,
            data: {
              id: existingPlan.id,
              name: existingPlan.name,
              description: existingPlan.description,
              category: existingPlan.category,
              price: parseFloat(existingPlan.price.toString()),
              billingType: existingPlan.billingType,
              courseId: courseId,
              courseName: course.name,
              isExisting: true
            },
            message: 'Found existing payment plan for this course and category'
          };
        }

        // Criar novo plano de pagamento
        const newPlan = await prisma.billingPlan.create({
          data: {
            organizationId: course.organizationId,
            name: planName,
            description: planDescription,
            category: category,
            price: planPrice,
            billingType: billingType || 'MONTHLY',
            classesPerWeek: planClassesPerWeek,
            maxClasses: planClassesPerWeek * 4, // Assumindo 4 semanas por mês
            hasPersonalTraining: false,
            hasNutrition: false,
            isActive: true
          }
        });

        return {
          success: true,
          data: {
            id: newPlan.id,
            name: newPlan.name,
            description: newPlan.description,
            category: newPlan.category,
            price: parseFloat(newPlan.price.toString()),
            billingType: newPlan.billingType,
            classesPerWeek: newPlan.classesPerWeek,
            maxClasses: newPlan.maxClasses,
            courseId: courseId,
            courseName: course.name,
            isExisting: false
          },
          message: 'Payment plan created successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create payment plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // STUDENT SUBSCRIPTIONS APIs - Controle de assinaturas
    // ========================================

    // GET /api/students/:studentId/subscription - Verificar assinatura ativa
    server.get('/api/students/:studentId/subscription', async (request, reply) => {
      try {
        const { studentId } = request.params as any;

        const subscription = await prisma.studentSubscription.findFirst({
          where: {
            studentId,
            status: 'ACTIVE',
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          },
          include: {
            plan: true,
            student: {
              include: { user: true }
            },
            payments: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              where: { status: { in: ['PENDING', 'PAID'] } }
            }
          }
        });

        if (!subscription) {
          return {
            success: false,
            data: null,
            message: 'No active subscription found for this student'
          };
        }

        // Verificar pagamentos em atraso
        const pendingPayments = subscription.payments.filter(p => p.status === 'PENDING');
        const isBlocked = pendingPayments.length > 0;

        return {
          success: true,
          data: {
            id: subscription.id,
            status: subscription.status,
            isActive: subscription.isActive && !isBlocked,
            isBlocked,
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              category: subscription.plan.category,
              classesPerWeek: subscription.plan.classesPerWeek,
              maxClasses: subscription.plan.maxClasses,
              price: parseFloat(subscription.plan.price.toString())
            },
            student: {
              name: subscription.student.user?.name,
              email: subscription.student.user?.email
            },
            period: {
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              nextBillingDate: subscription.nextBillingDate
            },
            pendingPayments: pendingPayments.length,
            lastPayments: subscription.payments.map(p => ({
              amount: parseFloat(p.amount.toString()),
              dueDate: p.dueDate,
              status: p.status
            }))
          },
          message: 'Subscription details retrieved successfully'
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

    // GET /api/subscriptions - Listar todas as assinaturas
    server.get('/api/subscriptions', async (request, reply) => {
      try {
        const subscriptions = await prisma.studentSubscription.findMany({
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                financialResponsible: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                billingType: true,
                classesPerWeek: true,
                category: true
              }
            },
            financialResponsible: {
              select: {
                name: true,
                email: true,
                relationshipType: true
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                dueDate: true,
                paidDate: true,
                status: true,
                paymentMethod: true
              },
              orderBy: {
                dueDate: 'desc'
              },
              take: 3
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const formattedSubscriptions = subscriptions.map(sub => {
          const student = sub.student;
          const user = student.user;
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          
          // Calculate next billing date based on billing type
          let nextBillingDate = sub.nextBillingDate;
          if (!nextBillingDate && sub.startDate) {
            const start = new Date(sub.startDate);
            switch (sub.plan.billingType) {
              case 'MONTHLY':
                nextBillingDate = new Date(start.setMonth(start.getMonth() + 1));
                break;
              case 'QUARTERLY':
                nextBillingDate = new Date(start.setMonth(start.getMonth() + 3));
                break;
              case 'YEARLY':
                nextBillingDate = new Date(start.setFullYear(start.getFullYear() + 1));
                break;
              default:
                nextBillingDate = new Date(start.setMonth(start.getMonth() + 1));
            }
          }

          return {
            id: sub.id,
            status: sub.status,
            isActive: sub.isActive,
            startDate: sub.startDate,
            endDate: sub.endDate,
            nextBillingDate: nextBillingDate,
            currentPrice: parseFloat(sub.currentPrice.toString()),
            billingType: sub.billingType,
            autoRenew: sub.autoRenew,
            student: {
              id: student.id,
              name: fullName,
              email: user.email,
              category: student.category,
              financialResponsible: student.financialResponsible
            },
            plan: {
              id: sub.plan.id,
              name: sub.plan.name,
              description: sub.plan.description,
              price: parseFloat(sub.plan.price.toString()),
              billingType: sub.plan.billingType,
              classesPerWeek: sub.plan.classesPerWeek,
              category: sub.plan.category
            },
            financialResponsible: sub.financialResponsible,
            recentPayments: sub.payments.map(payment => ({
              id: payment.id,
              amount: parseFloat(payment.amount.toString()),
              dueDate: payment.dueDate,
              paidDate: payment.paidDate,
              status: payment.status,
              paymentMethod: payment.paymentMethod
            })),
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
          };
        });

        return {
          success: true,
          data: formattedSubscriptions,
          count: formattedSubscriptions.length,
          message: 'Subscriptions retrieved successfully'
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

    // POST /api/subscriptions - Criar assinatura para aluno
    server.post('/api/subscriptions', async (request, reply) => {
      try {
        const { studentId, planId, startDate, endDate, customPrice, financialResponsibleId } = request.body as any;

        // Verificar se aluno existe
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: { user: true }
        });

        if (!student) {
          reply.code(404);
          return {
            success: false,
            error: 'Student not found',
            message: 'The specified student does not exist'
          };
        }

        // Verificar se plano existe
        const plan = await prisma.billingPlan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          reply.code(404);
          return {
            success: false,
            error: 'Billing plan not found',
            message: 'The specified billing plan does not exist'
          };
        }

        // Buscar organização ativa
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found',
            message: 'Cannot create subscription without an active organization'
          };
        }

        // Desativar assinaturas ativas anteriores
        await prisma.studentSubscription.updateMany({
          where: {
            studentId,
            status: 'ACTIVE'
          },
          data: {
            status: 'CANCELLED',
            isActive: false
          }
        });

        // Criar nova assinatura
        // Calculate next billing date based on billing type
        const startDateObj = startDate ? new Date(startDate) : new Date();
        let nextBillingDate = new Date(startDateObj);
        
        switch (plan.billingType) {
          case 'MONTHLY':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            break;
          case 'QUARTERLY':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
            break;
          case 'YEARLY':
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            break;
          default:
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        const subscription = await prisma.studentSubscription.create({
          data: {
            organizationId: organization.id,
            studentId,
            planId,
            financialResponsibleId: financialResponsibleId || null,
            status: 'ACTIVE',
            startDate: startDateObj,
            endDate: endDate ? new Date(endDate) : null,
            currentPrice: customPrice ? parseFloat(customPrice) : plan.price,
            billingType: plan.billingType,
            nextBillingDate: nextBillingDate,
            isActive: true,
            autoRenew: true
          },
          include: {
            plan: true,
            student: { include: { user: true } }
          }
        });

        return {
          success: true,
          data: {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan.name,
            student: subscription.student.user?.name,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            price: parseFloat(subscription.currentPrice.toString())
          },
          message: 'Subscription created successfully'
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

    // ========================================
    // ATTENDANCE VALIDATION APIs - Validação de frequência
    // ========================================

    // POST /api/attendance/validate - Validar se aluno pode marcar frequência
    server.post('/api/attendance/validate', async (request, reply) => {
      try {
        const { studentId, classId } = request.body as any;

        // 1. Verificar assinatura ativa
        const subscription = await prisma.studentSubscription.findFirst({
          where: {
            studentId,
            status: 'ACTIVE',
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          },
          include: {
            plan: true,
            payments: {
              where: { status: 'PENDING' },
              take: 1
            }
          }
        });

        if (!subscription) {
          return {
            success: false,
            canAttend: false,
            reason: 'NO_ACTIVE_SUBSCRIPTION',
            message: 'Aluno não possui plano ativo'
          };
        }

        // 2. Verificar pagamentos pendentes
        if (subscription.payments.length > 0) {
          return {
            success: false,
            canAttend: false,
            reason: 'PENDING_PAYMENT',
            message: 'Aluno possui pagamentos pendentes'
          };
        }

        // 3. Verificar compatibilidade de categoria
        const classData = await prisma.class.findUnique({
          where: { id: classId },
          include: { course: true }
        });

        if (!classData) {
          reply.code(404);
          return {
            success: false,
            canAttend: false,
            reason: 'CLASS_NOT_FOUND',
            message: 'Turma não encontrada'
          };
        }

        if (subscription.plan.category && subscription.plan.category !== classData.course.category) {
          return {
            success: false,
            canAttend: false,
            reason: 'PLAN_CATEGORY_MISMATCH',
            message: `Plano ${subscription.plan.category} não permite acesso ao curso ${classData.course.category}`
          };
        }

        // 4. Verificar limite semanal de aulas
        const today = new Date();
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const weeklyAttendances = await prisma.attendance.count({
          where: {
            studentId,
            createdAt: {
              gte: weekStart,
              lt: weekEnd
            },
            status: 'PRESENT'
          }
        });

        if (weeklyAttendances >= subscription.plan.classesPerWeek) {
          return {
            success: false,
            canAttend: false,
            reason: 'WEEKLY_LIMIT_EXCEEDED',
            message: `Limite semanal excedido (${weeklyAttendances}/${subscription.plan.classesPerWeek} aulas)`
          };
        }

        // 5. Verificar se já marcou presença nesta aula
        const existingAttendance = await prisma.attendance.findFirst({
          where: {
            studentId,
            classId
          }
        });

        if (existingAttendance) {
          return {
            success: false,
            canAttend: false,
            reason: 'ALREADY_CHECKED_IN',
            message: 'Presença já registrada para esta aula'
          };
        }

        return {
          success: true,
          canAttend: true,
          reason: 'APPROVED',
          message: 'Aluno autorizado a marcar frequência',
          data: {
            plan: subscription.plan.name,
            weeklyUsage: `${weeklyAttendances}/${subscription.plan.classesPerWeek}`,
            className: classData.name,
            courseName: classData.course.name
          }
        };

      } catch (error) {
        reply.code(500);
        return {
          success: false,
          canAttend: false,
          reason: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Erro na validação'
        };
      }
    });

    // POST /api/attendance/checkin - Marcar frequência com validação
    server.post('/api/attendance/checkin', async (request, reply) => {
      try {
        const { studentId, classId, checkInMethod } = request.body as any;

        // Primeiro validar se pode marcar frequência
        const validation = await server.inject({
          method: 'POST',
          url: '/api/attendance/validate',
          payload: { studentId, classId }
        });

        const validationResult = JSON.parse(validation.payload);

        if (!validationResult.canAttend) {
          reply.code(403);
          return validationResult;
        }

        // Buscar organização ativa
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found',
            message: 'Cannot create attendance without an active organization'
          };
        }

        // Se validação passou, marcar frequência
        const attendance = await prisma.attendance.create({
          data: {
            organizationId: organization.id,
            studentId,
            classId,
            status: 'PRESENT',
            checkInTime: new Date(),
            checkInMethod: checkInMethod || 'MANUAL',
            xpEarned: 5 // XP por frequência
          },
          include: {
            student: { include: { user: true } },
            class: { include: { course: true } }
          }
        });

        return {
          success: true,
          data: {
            id: attendance.id,
            student: attendance.student.user?.name,
            class: attendance.class.name,
            course: attendance.class.course.name,
            checkInTime: attendance.checkInTime,
            xpEarned: attendance.xpEarned
          },
          message: 'Frequência registrada com sucesso!'
        };

      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to check in',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // COURSE MANAGEMENT APIs - CRUD de Cursos
    // ========================================

    // GET /api/courses-management - Lista cursos para administração
    server.get('/api/courses-management', async (request, reply) => {
      try {
        const courses = await prisma.course.findMany({
          include: {
            martialArt: true,
            classes: {
              include: {
                _count: { select: { studentCourses: true } }
              }
            },
            techniques: {
              include: { technique: true },
              orderBy: { orderIndex: 'asc' }
            },
            _count: {
              select: {
                enrollments: true,
                classes: true
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        });

        return {
          success: true,
          data: courses.map(course => ({
            id: course.id,
            name: course.name,
            description: course.description,
            level: course.level,
            category: course.category,
            duration: course.duration,
            classesPerWeek: course.classesPerWeek,
            totalClasses: course.totalClasses,
            minAge: course.minAge,
            maxAge: course.maxAge,
            objectives: course.objectives,
            requirements: course.requirements,
            prerequisites: course.prerequisites,
            imageUrl: course.imageUrl,
            isActive: course.isActive,
            martialArt: course.martialArt.name,
            stats: {
              totalEnrollments: course._count.enrollments,
              totalClasses: course._count.classes,
              totalTechniques: course.techniques.length
            },
            classes: course.classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              schedule: cls.dayOfWeek + ' ' + cls.startTime,
              maxStudents: cls.maxStudents,
              enrolledStudents: cls._count.studentCourses
            })),
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
          })),
          message: 'Courses retrieved for management successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve courses',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/courses-management - Criar novo curso
    server.post('/api/courses-management', async (request, reply) => {
      try {
        const {
          name, description, level, category, duration, classesPerWeek, totalClasses,
          minAge, maxAge, objectives, requirements, prerequisites, imageUrl,
          martialArtId, lessonPlans, techniques
        } = request.body as any;

        // Buscar organização ativa
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });

        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found',
            message: 'Cannot create course without an active organization'
          };
        }

        // Buscar próximo orderIndex
        const lastCourse = await prisma.course.findFirst({
          where: { organizationId: organization.id },
          orderBy: { orderIndex: 'desc' }
        });

        const nextOrderIndex = lastCourse ? lastCourse.orderIndex + 1 : 1;

        // Criar curso em transação
        const course = await prisma.$transaction(async (tx) => {
          // Criar curso
          const newCourse = await tx.course.create({
            data: {
              organizationId: organization.id,
              martialArtId: martialArtId || (await tx.martialArt.findFirst({ where: { organizationId: organization.id } }))?.id || '',
              name,
              description,
              level: level || 'BEGINNER',
              category: category || 'ADULT',
              duration: parseInt(duration) || 12,
              classesPerWeek: parseInt(classesPerWeek) || 2,
              totalClasses: parseInt(totalClasses) || 48,
              minAge: parseInt(minAge) || 16,
              maxAge: maxAge ? parseInt(maxAge) : null,
              objectives: objectives || [],
              requirements: requirements || [],
              prerequisites: prerequisites || [],
              imageUrl,
              orderIndex: nextOrderIndex,
              isActive: true
            }
          });

          // Criar planos de aula se fornecidos
          if (lessonPlans && Array.isArray(lessonPlans)) {
            for (let i = 0; i < lessonPlans.length; i++) {
              const plan = lessonPlans[i];
              await tx.lessonPlan.create({
                data: {
                  courseId: newCourse.id,
                  lessonNumber: i + 1,
                  title: plan.title || `Aula ${i + 1}`,
                  objectives: plan.objectives || [],
                  warmUp: plan.warmUp || '',
                  mainContent: plan.mainContent || '',
                  coolDown: plan.coolDown || '',
                  equipment: plan.equipment || [],
                  duration: plan.duration || 60,
                  difficulty: plan.difficulty || 'BEGINNER',
                  notes: plan.notes || '',
                  adaptations: plan.adaptations || ''
                }
              });
            }
          }

          // Vincular técnicas se fornecidas
          if (techniques && Array.isArray(techniques)) {
            for (let i = 0; i < techniques.length; i++) {
              const tech = techniques[i];
              await tx.courseTechnique.create({
                data: {
                  courseId: newCourse.id,
                  techniqueId: tech.techniqueId,
                  orderIndex: i + 1,
                  weekNumber: tech.weekNumber || Math.ceil((i + 1) / 4),
                  lessonNumber: tech.lessonNumber || (i + 1),
                  isRequired: tech.isRequired !== false
                }
              });
            }
          }

          return newCourse;
        });

        return {
          success: true,
          data: {
            id: course.id,
            name: course.name,
            level: course.level,
            category: course.category,
            totalClasses: course.totalClasses,
            duration: course.duration
          },
          message: 'Course created successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create course',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // PUT /api/courses-management/:id - Editar curso
    server.put('/api/courses-management/:id', async (request, reply) => {
      try {
        const { id } = request.params as any;
        const updateData = request.body as any;

        const course = await prisma.course.update({
          where: { id },
          data: {
            name: updateData.name,
            description: updateData.description,
            level: updateData.level,
            category: updateData.category,
            duration: updateData.duration ? parseInt(updateData.duration) : undefined,
            classesPerWeek: updateData.classesPerWeek ? parseInt(updateData.classesPerWeek) : undefined,
            totalClasses: updateData.totalClasses ? parseInt(updateData.totalClasses) : undefined,
            minAge: updateData.minAge ? parseInt(updateData.minAge) : undefined,
            maxAge: updateData.maxAge ? parseInt(updateData.maxAge) : undefined,
            objectives: updateData.objectives,
            requirements: updateData.requirements,
            prerequisites: updateData.prerequisites,
            imageUrl: updateData.imageUrl,
            isActive: updateData.isActive,
            updatedAt: new Date()
          },
          include: {
            martialArt: true,
            _count: { select: { enrollments: true, classes: true } }
          }
        });

        return {
          success: true,
          data: course,
          message: 'Course updated successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to update course',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // GET /api/courses-management/:id/lesson-plans - Planos de aula do curso
    server.get('/api/courses-management/:id/lesson-plans', async (request, reply) => {
      try {
        const { id } = request.params as any;

        const lessonPlans = await prisma.lessonPlan.findMany({
          where: { courseId: id },
          orderBy: { lessonNumber: 'asc' },
          include: {
            course: { select: { name: true, totalClasses: true } }
          }
        });

        return {
          success: true,
          data: lessonPlans.map(plan => ({
            id: plan.id,
            lessonNumber: plan.lessonNumber,
            title: plan.title,
            objectives: plan.objectives,
            warmUp: plan.warmUp,
            mainContent: plan.mainContent,
            coolDown: plan.coolDown,
            equipment: plan.equipment,
            duration: plan.duration,
            difficulty: plan.difficulty,
            notes: plan.notes,
            adaptations: plan.adaptations,
            feedbackEnabled: true // Para sistema de feedback
          })),
          course: lessonPlans[0]?.course,
          message: 'Lesson plans retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve lesson plans',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/courses-management/:id/lesson-plans - Criar/Atualizar plano de aula
    server.post('/api/courses-management/:id/lesson-plans', async (request, reply) => {
      try {
        const { id: courseId } = request.params as any;
        const { lessonNumber, title, objectives, warmUp, mainContent, coolDown, equipment, duration, difficulty, notes, adaptations } = request.body as any;

        const lessonPlan = await prisma.lessonPlan.upsert({
          where: {
            courseId_lessonNumber: {
              courseId,
              lessonNumber: parseInt(lessonNumber)
            }
          },
          update: {
            title,
            objectives: objectives || [],
            warmUp,
            mainContent,
            coolDown,
            equipment: equipment || [],
            duration: parseInt(duration) || 60,
            difficulty: difficulty || 'BEGINNER',
            notes,
            adaptations,
            updatedAt: new Date()
          },
          create: {
            courseId,
            lessonNumber: parseInt(lessonNumber),
            title,
            objectives: objectives || [],
            warmUp,
            mainContent,
            coolDown,
            equipment: equipment || [],
            duration: parseInt(duration) || 60,
            difficulty: difficulty || 'BEGINNER',
            notes,
            adaptations
          }
        });

        return {
          success: true,
          data: lessonPlan,
          message: 'Lesson plan saved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to save lesson plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/lesson-feedback - Sistema de feedback pós-aula
    server.post('/api/lesson-feedback', async (request, reply) => {
      try {
        const { courseId, lessonNumber, classId, instructorId, feedback, studentsPresent, improvements, nextClassAdjustments } = request.body as any;

        // Criar registro de feedback (usando tabela de avaliações como base)
        const feedbackRecord = await prisma.evaluationRecord.create({
          data: {
            studentId: instructorId, // Instrutor dando feedback
            courseId,
            lessonNumber: parseInt(lessonNumber),
            evaluationType: 'LESSON_FEEDBACK',
            completed: true,
            observations: feedback,
            recommendations: improvements,
            createdAt: new Date()
          }
        });

        // Se há ajustes para próxima aula, atualizar plano
        if (nextClassAdjustments) {
          const nextLessonNumber = parseInt(lessonNumber) + 1;
          await prisma.lessonPlan.updateMany({
            where: {
              courseId,
              lessonNumber: nextLessonNumber
            },
            data: {
              adaptations: nextClassAdjustments,
              updatedAt: new Date()
            }
          });
        }

        return {
          success: true,
          data: {
            id: feedbackRecord.id,
            lessonNumber,
            feedbackDate: feedbackRecord.createdAt,
            applied: !!nextClassAdjustments
          },
          message: 'Lesson feedback recorded successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to record lesson feedback',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // ========================================
    // STUDENT-COURSE ENROLLMENT APIs - Vinculação de alunos
    // ========================================

    // POST /api/students/:studentId/enroll-course - Vincular aluno a curso
    server.post('/api/students/:studentId/enroll-course', async (request, reply) => {
      try {
        const { studentId } = request.params as any;
        const { courseId, classIds, restrictToClasses } = request.body as any;

        // Verificar se aluno tem assinatura ativa
        const subscription = await prisma.studentSubscription.findFirst({
          where: {
            studentId,
            status: 'ACTIVE',
            isActive: true
          },
          include: { plan: true }
        });

        if (!subscription) {
          reply.code(400);
          return {
            success: false,
            error: 'No active subscription',
            message: 'Student must have an active subscription to enroll in courses'
          };
        }

        // Verificar compatibilidade de categoria
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: { classes: true }
        });

        if (!course) {
          reply.code(404);
          return {
            success: false,
            error: 'Course not found',
            message: 'The specified course does not exist'
          };
        }

        if (subscription.plan.category && subscription.plan.category !== course.category) {
          reply.code(400);
          return {
            success: false,
            error: 'Category mismatch',
            message: `Student plan (${subscription.plan.category}) is not compatible with course category (${course.category})`
          };
        }

        // Criar matrícula no curso
        const enrollment = await prisma.courseEnrollment.create({
          data: {
            studentId,
            courseId,
            status: 'ACTIVE',
            category: course.category,
            gender: 'MASCULINO', // Buscar do perfil do aluno
            expectedEndDate: new Date(Date.now() + course.duration * 7 * 24 * 60 * 60 * 1000)
          }
        });

        // Se especificou turmas específicas, vincular
        if (classIds && Array.isArray(classIds) && classIds.length > 0) {
          for (const classId of classIds) {
            await prisma.studentCourse.create({
              data: {
                studentId,
                courseId,
                classId,
                isActive: true
              }
            });
          }
        } else if (!restrictToClasses) {
          // Se não restringiu, vincular a todas as turmas do curso
          for (const courseClass of course.classes) {
            await prisma.studentCourse.create({
              data: {
                studentId,
                courseId,
                classId: courseClass.id,
                isActive: true
              }
            });
          }
        }

        return {
          success: true,
          data: {
            enrollmentId: enrollment.id,
            courseId,
            courseName: course.name,
            restrictedToClasses: !!classIds,
            classCount: classIds?.length || course.classes.length,
            expectedEndDate: enrollment.expectedEndDate
          },
          message: 'Student enrolled in course successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to enroll student',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // GET /api/students/:studentId/courses - Cursos do aluno
    server.get('/api/students/:studentId/courses', async (request, reply) => {
      try {
        const { studentId } = request.params as any;

        const enrollments = await prisma.courseEnrollment.findMany({
          where: { studentId },
          include: {
            course: {
              include: {
                classes: {
                  include: {
                    studentCourses: {
                      where: { studentId }
                    }
                  }
                }
              }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        });

        return {
          success: true,
          data: enrollments.map(enrollment => ({
            enrollmentId: enrollment.id,
            course: {
              id: enrollment.course.id,
              name: enrollment.course.name,
              description: enrollment.course.description,
              level: enrollment.course.level,
              category: enrollment.course.category,
              totalClasses: enrollment.course.totalClasses,
              currentLesson: enrollment.currentLesson,
              progress: Math.round((enrollment.currentLesson / enrollment.course.totalClasses) * 100)
            },
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            expectedEndDate: enrollment.expectedEndDate,
            allowedClasses: enrollment.course.classes
              .filter(cls => cls.studentCourses.length > 0)
              .map(cls => ({
                id: cls.id,
                name: cls.name,
                schedule: `${cls.dayOfWeek} ${cls.startTime}`,
                location: cls.location
              })),
            hasClassRestriction: enrollment.course.classes.some(cls => cls.studentCourses.length > 0)
          })),
          message: 'Student courses retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to retrieve student courses',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Quick test financial endpoint
    server.get('/api/financial/test', async (request, reply) => {
      try {
        const plans = await prisma.billingPlan.findMany({
          include: {
            _count: { select: { subscriptions: true } }
          }
        });
        return { success: true, data: plans };
      } catch (error) {
        reply.code(500);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Start server
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    console.log('\n🚀 =====================================');
    console.log('🥋 KRAV MAGA ACADEMY API RUNNING!');
    console.log('🚀 =====================================');
    console.log(`🌐 Server: http://localhost:${port}`);
    console.log(`❤️  Health: http://localhost:${port}/health`);
    console.log(`👥 Students: http://localhost:${port}/api/students`);
    console.log(`🏢 Organizations: http://localhost:${port}/api/organizations`);
    console.log(`📚 Courses: http://localhost:${port}/api/courses`);
    console.log(`🏫 Classes: http://localhost:${port}/api/classes`);
    console.log(`✅ Attendance: http://localhost:${port}/api/attendance`);
    console.log(`📈 Progress: http://localhost:${port}/api/progress`);
    console.log(`🥊 Techniques: http://localhost:${port}/api/techniques/master`);
    console.log(`📋 Evaluations: http://localhost:${port}/api/evaluations`);
    console.log(`💰 Financial: http://localhost:${port}/api/financial/plans`);
    console.log(`💳 Payments: http://localhost:${port}/api/financial/reports`);
    console.log(`👨‍👩‍👧‍👦 Responsáveis: http://localhost:${port}/api/financial-responsible`);
    console.log(`📥 Import Asaas: http://localhost:${port}/api/financial-responsible/asaas/customers`);
    console.log(`💰 Billing Plans: http://localhost:${port}/api/billing-plans`);
    console.log(`📝 Subscriptions: http://localhost:${port}/api/subscriptions`);
    console.log(`✅ Check Subscription: http://localhost:${port}/api/students/:id/subscription`);
    console.log(`🎯 Validate Attendance: http://localhost:${port}/api/attendance/validate`);
    console.log(`📍 Check-in: http://localhost:${port}/api/attendance/checkin`);
    console.log(`📚 Course Management: http://localhost:${port}/api/courses-management`);
    console.log(`📖 Lesson Plans: http://localhost:${port}/api/courses-management/:id/lesson-plans`);
    console.log(`💬 Lesson Feedback: http://localhost:${port}/api/lesson-feedback`);
    console.log(`🎓 Student Enrollments: http://localhost:${port}/api/students/:id/enroll-course`);
    console.log('🔥 =====================================\n');
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

start();