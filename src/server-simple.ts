// @ts-nocheck
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
        
        console.log(`[DEBUG] Fetching subscription for student: ${id}`);
        
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

        console.log(`[DEBUG] Found subscription:`, subscription ? 'YES' : 'NO');
        console.log(`[DEBUG] Subscription plan included:`, subscription?.plan ? 'YES' : 'NO');

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
        console.error(`[DEBUG] Error fetching subscription:`, error);
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

        // Return empty array if no responsibles exist (CLAUDE.md compliance)

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

    // Update financial responsible endpoint
    server.put('/api/financial-responsibles/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { name, cpfCnpj, email, phone, birthDate, address, addressNumber, complement, neighborhood, city, state, zipCode, relationshipType } = request.body as any;

        // Find existing responsible
        const existingResponsible = await prisma.financialResponsible.findUnique({
          where: { id }
        });

        if (!existingResponsible) {
          reply.code(404);
          return {
            success: false,
            error: 'Financial responsible not found'
          };
        }

        // Validate email format if provided
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            reply.code(400);
            return {
              success: false,
              error: 'Invalid email format',
              message: 'Please provide a valid email address'
            };
          }
        }

        // Validate CPF/CNPJ format if provided
        if (cpfCnpj) {
          const cpfCnpjCleaned = cpfCnpj.replace(/\D/g, '');
          if (cpfCnpjCleaned.length !== 11 && cpfCnpjCleaned.length !== 14) {
            reply.code(400);
            return {
              success: false,
              error: 'Invalid CPF/CNPJ',
              message: 'CPF must have 11 digits or CNPJ must have 14 digits'
            };
          }
        }

        // Check for duplicate email or CPF/CNPJ (excluding current record)
        if (email || cpfCnpj) {
          const duplicateCheck = await prisma.financialResponsible.findFirst({
            where: {
              AND: [
                { id: { not: id } },
                { isActive: true },
                {
                  OR: [
                    ...(email ? [{ email: email.toLowerCase() }] : []),
                    ...(cpfCnpj ? [{ cpfCnpj: cpfCnpj.replace(/\D/g, '') }] : [])
                  ]
                }
              ]
            }
          });

          if (duplicateCheck) {
            reply.code(409);
            return {
              success: false,
              error: 'Financial responsible already exists',
              message: 'Another financial responsible with this CPF/CNPJ or email already exists'
            };
          }
        }

        // Update the financial responsible
        const updatedResponsible = await prisma.financialResponsible.update({
          where: { id },
          data: {
            ...(name && { name: name.trim() }),
            ...(cpfCnpj && { cpfCnpj: cpfCnpj.replace(/\D/g, '') }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(phone !== undefined && { phone: phone?.trim() || null }),
            ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
            ...(address !== undefined && { address: address?.trim() || null }),
            ...(addressNumber !== undefined && { addressNumber: addressNumber?.trim() || null }),
            ...(complement !== undefined && { complement: complement?.trim() || null }),
            ...(neighborhood !== undefined && { neighborhood: neighborhood?.trim() || null }),
            ...(city !== undefined && { city: city?.trim() || null }),
            ...(state !== undefined && { state: state?.trim() || null }),
            ...(zipCode !== undefined && { zipCode: zipCode?.replace(/\D/g, '') || null }),
            ...(relationshipType !== undefined && { relationshipType: relationshipType?.trim() || null }),
            updatedAt: new Date()
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
            id: updatedResponsible.id,
            name: updatedResponsible.name,
            cpfCnpj: updatedResponsible.cpfCnpj,
            email: updatedResponsible.email,
            phone: updatedResponsible.phone,
            relationshipType: updatedResponsible.relationshipType,
            studentsCount: updatedResponsible._count.students,
            updatedAt: updatedResponsible.updatedAt
          },
          message: 'Financial responsible updated successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to update financial responsible',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Delete financial responsible endpoint
    server.delete('/api/financial-responsibles/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        // Find existing responsible
        const existingResponsible = await prisma.financialResponsible.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        });

        if (!existingResponsible) {
          reply.code(404);
          return {
            success: false,
            error: 'Financial responsible not found'
          };
        }

        // Check if responsible has students
        if (existingResponsible._count.students > 0) {
          reply.code(400);
          return {
            success: false,
            error: 'Cannot delete responsible with students',
            message: `This financial responsible has ${existingResponsible._count.students} student(s) associated. Please transfer or remove students first.`
          };
        }

        // Soft delete by setting isActive to false (recommended approach)
        await prisma.financialResponsible.update({
          where: { id },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        });

        return {
          success: true,
          message: 'Financial responsible deactivated successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to delete financial responsible',
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
            category: true,
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

    // Update billing plan endpoint
    server.put('/api/billing-plans/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as any;
        
        // Find existing plan
        const existingPlan = await prisma.billingPlan.findUnique({
          where: { id }
        });

        if (!existingPlan) {
          reply.code(404);
          return {
            success: false,
            error: 'Billing plan not found'
          };
        }

        // Update the billing plan
        const updatedPlan = await prisma.billingPlan.update({
          where: { id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.description && { description: body.description }),
            ...(body.price !== undefined && { price: parseFloat(body.price) }),
            ...(body.billingType && { billingType: body.billingType }),
            ...(body.category && { category: body.category }),
            ...(body.classesPerWeek !== undefined && { classesPerWeek: parseInt(body.classesPerWeek) }),
            ...(body.maxClasses !== undefined && { maxClasses: body.maxClasses ? parseInt(body.maxClasses) : null }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
            ...(body.hasPersonalTraining !== undefined && { hasPersonalTraining: body.hasPersonalTraining }),
            ...(body.hasNutrition !== undefined && { hasNutrition: body.hasNutrition }),
            ...(body.allowFreeze !== undefined && { allowFreeze: body.allowFreeze }),
            ...(body.features && { features: body.features }),
            updatedAt: new Date()
          },
          include: {
            course: {
              select: { name: true }
            }
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

    // Delete billing plan endpoint
    server.delete('/api/billing-plans/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        // Find existing plan
        const existingPlan = await prisma.billingPlan.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                studentSubscriptions: true
              }
            }
          }
        });

        if (!existingPlan) {
          reply.code(404);
          return {
            success: false,
            error: 'Billing plan not found'
          };
        }

        // Check if plan has active subscriptions
        if (existingPlan._count.studentSubscriptions > 0) {
          reply.code(400);
          return {
            success: false,
            error: 'Cannot delete plan with active subscriptions',
            message: `This plan has ${existingPlan._count.studentSubscriptions} active subscription(s). Please deactivate or transfer subscriptions first.`
          };
        }

        // Delete the billing plan
        await prisma.billingPlan.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Billing plan deleted successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to delete billing plan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Financial Subscriptions API
    server.post('/api/financial/subscriptions', async (request, reply) => {
      try {
        const { studentId, planId, startDate, customPrice } = request.body as any;
        
        // Validation
        if (!studentId || !planId) {
          reply.code(400);
          return {
            success: false,
            error: 'Missing required fields',
            message: 'studentId and planId are required'
          };
        }

        // Verify student exists
        const student = await prisma.student.findUnique({
          where: { id: studentId }
        });

        if (!student) {
          reply.code(404);
          return {
            success: false,
            error: 'Student not found',
            message: 'Student with provided ID does not exist'
          };
        }

        // Verify plan exists
        const plan = await prisma.billingPlan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          reply.code(404);
          return {
            success: false,
            error: 'Plan not found',
            message: 'Billing plan with provided ID does not exist'
          };
        }

        // Create subscription
        const subscription = await prisma.studentSubscription.create({
          data: {
            studentId,
            planId,
            currentPrice: customPrice || plan.price,
            billingType: plan.billingType,
            startDate: startDate ? new Date(startDate) : new Date(),
            nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
            status: 'ACTIVE',
            isActive: true
          }
        });

        return {
          success: true,
          data: subscription,
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
        // Simple response for now since this endpoint is not critical for production API configuration
        return {
          success: true,
          data: [],
          count: 0,
          message: 'Attendance endpoint available (stub)'
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

    // Start the server
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🥋 Krav Maga Academy API Server running at http://localhost:${port}`);
    console.log(`📊 Dashboard available at http://localhost:${port}/dashboard`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start the server
start();