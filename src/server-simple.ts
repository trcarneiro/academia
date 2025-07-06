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

    // Get student subscription endpoint
    server.get('/api/students/:id/subscription', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const subscription = await prisma.studentSubscription.findFirst({
          where: { 
            studentId: id,
            isActive: true 
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
                category: true,
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
          error: 'Failed to fetch student subscription',
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

    // Billing Plans API
    server.get('/api/billing-plans', async (request, reply) => {
      try {
        const billingPlans = await prisma.billingPlan.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billingType: true,
            isActive: true,
            features: true,
            targetCategory: true,
            classesPerWeek: true,
            hasPersonalTraining: true,
            hasNutrition: true,
            allowFreeze: true,
            createdAt: true,
            updatedAt: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            price: 'asc'
          }
        });

        return {
          success: true,
          data: billingPlans,
          count: billingPlans.length,
          message: 'Billing plans retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch billing plans',
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

    // POST /api/attendance/checkin - Universal check-in endpoint with subscription validation
    server.post('/api/attendance/checkin', async (request, reply) => {
      try {
        const { studentId, classId, checkInMethod = 'MANUAL', allowBasicMode = true } = request.body as any;
        
        if (!studentId || !classId) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'Student ID and Class ID are required'
          };
        }

        // Get student details
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        if (!student) {
          reply.code(404);
          return {
            success: false,
            error: 'Student not found',
            message: 'The specified student does not exist'
          };
        }

        // Get class details
        const classData = await prisma.class.findUnique({
          where: { id: classId },
          include: {
            course: {
              select: { id: true, name: true, category: true }
            }
          }
        });

        if (!classData) {
          reply.code(404);
          return {
            success: false,
            error: 'Class not found',
            message: 'The specified class does not exist'
          };
        }

        // SIMPLIFIED CHECK-IN: Skip strict subscription validation for now
        console.log(`✅ Check-in básico permitido para ${student.user.firstName} ${student.user.lastName} (ID: ${student.id})`);

        // Check for duplicate attendance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            studentId,
            classId,
            date: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (existingAttendance) {
          return {
            success: false,
            error: 'ALREADY_CHECKED_IN',
            message: 'Aluno já marcou presença hoje nesta turma',
            details: {
              existingAttendance: {
                id: existingAttendance.id,
                checkInTime: existingAttendance.date,
                lesson: existingAttendance.lessonNumber
              }
            }
          };
        }

        // Get current lesson number (simplified logic)
        const lessonNumber = 1; // Simplified for now

        // Create attendance record
        const attendance = await prisma.attendanceRecord.create({
          data: {
            studentId,
            classId,
            courseId: classData.course.id,
            lessonNumber,
            date: new Date(),
            present: true,
            notes: `Check-in via ${checkInMethod} at ${new Date().toLocaleTimeString()}`
          },
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            class: {
              include: {
                course: {
                  select: { name: true, category: true }
                }
              }
            }
          }
        });

        return {
          success: true,
          data: {
            id: attendance.id,
            student: {
              id: student.id,
              name: `${student.user.firstName} ${student.user.lastName}`,
              enrollmentCode: student.id,
              email: student.user.email
            },
            class: {
              id: classData.id,
              course: classData.course
            },
            checkInTime: attendance.date,
            lessonNumber: attendance.lessonNumber,
            method: checkInMethod,
            mode: 'BASIC'
          },
          message: `✅ Check-in realizado com sucesso! Bem-vindo(a), ${student.user.firstName}!`
        };

      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to process check-in',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/attendance/validate - Validate if student can check-in
    server.post('/api/attendance/validate', async (request, reply) => {
      try {
        const { studentId, classId } = request.body as any;
        
        if (!studentId || !classId) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'Student ID and Class ID are required'
          };
        }

        // Try the check-in validation without actually creating attendance
        const validationResponse = await server.inject({
          method: 'POST',
          url: '/api/attendance/checkin',
          payload: { 
            studentId, 
            classId, 
            validateOnly: true 
          }
        });

        const validationResult = JSON.parse(validationResponse.payload);

        return {
          success: validationResult.success,
          eligible: validationResult.success,
          reason: validationResult.error || 'ELIGIBLE',
          message: validationResult.message || 'Student eligible for check-in',
          details: validationResult.details || {}
        };

      } catch (error) {
        reply.code(500);
        return {
          success: false,
          eligible: false,
          reason: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        };
      }
    });

    // POST /api/students/:id/quick-activate - Quick activation to enable check-in
    server.post('/api/students/:id/quick-activate', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Check if student exists
        const student = await prisma.student.findUnique({
          where: { id },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        });

        if (!student) {
          reply.code(404);
          return {
            success: false,
            error: 'Student not found',
            message: 'The specified student does not exist'
          };
        }

        // Check if already has active subscription
        const existingSubscription = await prisma.studentSubscription.findFirst({
          where: {
            studentId: id,
            status: 'ACTIVE',
            isActive: true
          }
        });

        if (existingSubscription) {
          return {
            success: true,
            data: existingSubscription,
            message: `✅ ${student.user.firstName} já possui assinatura ativa! Check-in liberado.`
          };
        }

        // Find or create a basic billing plan
        let billingPlan = await prisma.billingPlan.findFirst({
          where: { 
            category: student.category,
            isActive: true 
          }
        });

        if (!billingPlan) {
          // Create a basic plan for this category
          const planPrices = {
            'ADULT': 180.00,
            'INICIANTE1': 120.00,
            'INICIANTE2': 120.00,
            'MASTER1': 200.00,
            'MASTER2': 220.00,
            'MASTER3': 250.00,
            'HEROI1': 150.00,
            'HEROI2': 170.00,
            'HEROI3': 190.00
          };

          billingPlan = await prisma.billingPlan.create({
            data: {
              organizationId: student.organizationId,
              name: `Plano ${student.category}`,
              description: `Plano básico para categoria ${student.category}`,
              price: planPrices[student.category as keyof typeof planPrices] || 180.00,
              category: student.category,
              maxClasses: 3,
              isActive: true
            }
          });
        }

        // Create new subscription
        const subscription = await prisma.studentSubscription.create({
          data: {
            organizationId: student.organizationId,
            studentId: id,
            planId: billingPlan.id,
            status: 'ACTIVE',
            isActive: true,
            startDate: new Date(),
            endDate: null, // Unlimited for now
            currentPrice: billingPlan.price,
            billingType: 'MONTHLY',
            autoRenew: true
          },
          include: {
            plan: {
              select: { name: true, price: true, category: true }
            }
          }
        });

        return {
          success: true,
          data: {
            subscriptionId: subscription.id,
            student: {
              id: student.id,
              name: `${student.user.firstName} ${student.user.lastName}`,
              category: student.category
            },
            billingPlan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate
          },
          message: `✅ Assinatura ativada com sucesso para ${student.user.firstName}! Check-in liberado.`
        };

      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to activate subscription',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // POST /api/courses - Create new course with complete preview
    server.post('/api/courses', async (request, reply) => {
      try {
        const body = request.body as any;
        
        // Validation
        if (!body.name || !body.category) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields: name, category'
          };
        }

        // Get default organization
        const organization = await prisma.organization.findFirst({
          where: { isActive: true }
        });
        
        if (!organization) {
          reply.code(400);
          return {
            success: false,
            error: 'No active organization found'
          };
        }

        // Get default martial art (create if doesn't exist)
        let martialArt = await prisma.martialArt.findFirst({
          where: { 
            organizationId: organization.id,
            name: 'Krav Maga'
          }
        });

        if (!martialArt) {
          martialArt = await prisma.martialArt.create({
            data: {
              organizationId: organization.id,
              name: 'Krav Maga',
              description: 'Sistema de defesa pessoal desenvolvido para as forças armadas israelenses',
              hasGrading: true,
              gradingSystem: 'BELT',
              maxLevel: 10,
              isActive: true
            }
          });
        }

        // Create course in a transaction to include sample data
        const result = await prisma.$transaction(async (tx) => {
          // Create the main course
          const course = await tx.course.create({
            data: {
              organizationId: organization.id,
              martialArtId: martialArt.id,
              name: body.name.trim(),
              description: body.description?.trim() || `Curso completo de ${body.name} para categoria ${body.category}`,
              category: body.category,
              level: body.level || 1,
              duration: body.duration || 12, // weeks
              totalClasses: body.totalClasses || 48,
              isActive: true
            }
          });

          // Create sample lesson plans for the course
          const sampleLessonPlans = [];
          for (let i = 1; i <= Math.min(8, body.totalClasses || 8); i++) {
            const lessonPlan = await tx.lessonPlan.create({
              data: {
                courseId: course.id,
                lessonNumber: i,
                weekNumber: Math.ceil(i / 4), // Assume 4 lessons per week
                title: `Aula ${i} - ${body.category} ${body.name}`,
                description: `Plano de aula ${i} do curso ${body.name}`,
                duration: 50,
                difficulty: 1,
                objectives: [`Objetivo principal da aula ${i}`, `Objetivo secundário da aula ${i}`],
                equipment: ['Tatame', 'Proteções'],
                activities: [`Atividade principal ${i}`, `Atividade complementar ${i}`],
                warmup: { exercises: ['Aquecimento básico'], duration: 10 },
                techniques: { list: ['Técnica básica'], duration: 30 },
                simulations: { scenarios: ['Simulação prática'], duration: 10 },
                cooldown: { exercises: ['Relaxamento'], duration: 5 }
              }
            });
            sampleLessonPlans.push(lessonPlan);
          }

          // Create a sample class schedule for the course
          await tx.class.create({
            data: {
              organizationId: organization.id,
              courseId: course.id,
              instructorId: organization.id, // Will be updated later when instructor is assigned
              date: new Date(),
              startTime: new Date(`1970-01-01T${body.startTime || '19:00'}:00.000Z`),
              endTime: new Date(`1970-01-01T${body.endTime || '20:00'}:00.000Z`),
              title: `Turma ${body.name} - ${body.category}`,
              description: `Turma principal do curso ${body.name}`,
              maxStudents: body.maxStudents || 20,
              status: 'SCHEDULED'
            }
          });

          // Return basic course data and manually calculate counts
          return {
            course,
            martialArt,
            organization,
            lessonPlansCount: sampleLessonPlans.length,
            classesCount: 1
          };
        });

        // Manually query for complete data to avoid TypeScript issues
        const courseWithIncludes = await prisma.course.findUnique({
          where: { id: result.course.id },
          include: {
            organization: { select: { id: true, name: true } },
            martialArt: { select: { id: true, name: true, description: true, gradingSystem: true } },
            lessonPlans: { orderBy: { lessonNumber: 'asc' }, take: 10 },
            classes: true,
            studentCourses: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } },
            enrollments: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } }
          }
        }) as any;

        // Prepare comprehensive preview data
        const preview = {
          course: courseWithIncludes,
          summary: {
            totalStudents: courseWithIncludes?.studentCourses?.length || 0,
            totalLessonPlans: courseWithIncludes?.lessonPlans?.length || 0,
            totalClasses: courseWithIncludes?.classes?.length || 0,
            totalEnrollments: courseWithIncludes?.enrollments?.length || 0,
            totalTechniques: 0, // Will be populated when techniques are added
            totalChallenges: 0, // Will be populated when challenges are added
            weeklySchedule: courseWithIncludes?.classes?.map((c: any) => ({
              startTime: c.startTime?.toISOString() || '',
              endTime: c.endTime?.toISOString() || '',
              maxStudents: c.maxStudents || 0,
              title: c.title || ''
            })) || [],
            category: courseWithIncludes?.category,
            level: courseWithIncludes?.level,
            duration: `${courseWithIncludes?.duration} semanas`,
            status: courseWithIncludes?.isActive ? 'ATIVO' : 'INATIVO'
          },
          features: {
            hasLessonPlans: (courseWithIncludes?.lessonPlans?.length || 0) > 0,
            hasClasses: (courseWithIncludes?.classes?.length || 0) > 0,
            hasEnrollments: (courseWithIncludes?.enrollments?.length || 0) > 0,
            hasTechniques: false, // Will be updated when techniques are added
            hasChallenges: false, // Will be updated when challenges are added
            isReadyForStudents: (courseWithIncludes?.lessonPlans?.length || 0) > 0 && (courseWithIncludes?.classes?.length || 0) > 0,
            gradingSystem: courseWithIncludes?.martialArt?.gradingSystem || 'BELT'
          },
          nextSteps: [
            {
              action: 'ENROLL_STUDENTS',
              title: 'Matricular Alunos',
              description: 'Adicionar alunos ao curso',
              completed: (courseWithIncludes?.enrollments?.length || 0) > 0
            },
            {
              action: 'ASSIGN_INSTRUCTOR',
              title: 'Designar Instrutor',
              description: 'Atribuir instrutor às turmas',
              completed: courseWithIncludes?.classes?.some((c: any) => c.instructorId && c.instructorId !== courseWithIncludes?.organizationId) || false
            },
            {
              action: 'COMPLETE_LESSON_PLANS',
              title: 'Completar Planos de Aula',
              description: `Criar todos os ${courseWithIncludes?.totalClasses || 48} planos de aula`,
              completed: (courseWithIncludes?.lessonPlans?.length || 0) >= (courseWithIncludes?.totalClasses || 48)
            },
            {
              action: 'ADD_TECHNIQUES',
              title: 'Adicionar Técnicas',
              description: 'Configurar técnicas do curso',
              completed: false // Will be updated when techniques are added
            },
            {
              action: 'CREATE_CHALLENGES',
              title: 'Criar Desafios',
              description: 'Adicionar desafios semanais',
              completed: false // Will be updated when challenges are added
            }
          ],
          recommendations: [
            'Configure pelo menos 3 técnicas básicas para o nível iniciante',
            'Crie desafios progressivos para manter o engajamento dos alunos',
            'Defina horários regulares para as aulas',
            'Prepare material didático e vídeos de apoio',
            'Adicione descrições detalhadas aos planos de aula',
            'Configure avaliações periódicas para acompanhar o progresso'
          ]
        };

        return {
          success: true,
          data: courseWithIncludes,
          preview,
          message: `✅ Curso "${body.name}" criado com sucesso! Preview completo disponível.`
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

    // Billing Plans API
    server.get('/api/billing-plans', async (request, reply) => {
      try {
        const billingPlans = await prisma.billingPlan.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billingType: true,
            isActive: true,
            features: true,
            targetCategory: true,
            classesPerWeek: true,
            hasPersonalTraining: true,
            hasNutrition: true,
            allowFreeze: true,
            createdAt: true,
            updatedAt: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            price: 'asc'
          }
        });

        return {
          success: true,
          data: billingPlans,
          count: billingPlans.length,
          message: 'Billing plans retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch billing plans',
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
        const {