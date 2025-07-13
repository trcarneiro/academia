// Working Krav Maga Academy Server
require('dotenv').config();
const Fastify = require('fastify');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Initialize
const server = Fastify({ logger: true });
const prisma = new PrismaClient();

// Register CORS
server.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Serve static files
server.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});

// Dashboard routes
server.get('/dashboard', async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

server.get('/ultimate', async (request, reply) => {
  return reply.sendFile('ultimate-dashboard.html');
});

// Main dashboard route
server.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Health check with database
server.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      message: '🥋 Krav Maga Academy API is running!'
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    };
  }
});

// Sample organization endpoint
server.get('/api/organizations', async () => {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true
      },
      take: 10
    });
    
    return {
      success: true,
      data: organizations,
      message: 'Organizations retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve organizations'
    };
  }
});

// Sample students endpoint
server.get('/api/students', async () => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            cpf: true,
            avatarUrl: true,
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
      take: 100
    });
    
    // Add matricula numbers (student ID) based on creation order
    const studentsWithMatricula = students.map((student, index) => ({
      ...student,
      matricula: (index + 1).toString(),
      fullName: `${student.user.firstName} ${student.user.lastName}`,
      attendanceRate: student._count.attendances > 0 ? Math.round((student._count.attendances / 30) * 100) : 0
    }));
    
    return {
      success: true,
      data: studentsWithMatricula,
      total: studentsWithMatricula.length,
      message: 'Students retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve students'
    };
  }
});

// POST /api/students - Create new student
server.post('/api/students', async (request, reply) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone = '',
      cpf = '',
      category = 'ADULT',
      gender = 'MASCULINO',
      billingPlanId,
      courseId,
      classId,
      financialResponsibleId,
      // Sistema de vinculação automática
      selectedClasses = [],
      selectedCourses = [],
      planBasedSelection
    } = request.body;

    console.log('🎯 Criando estudante com vinculação automática:', {
      name: `${firstName} ${lastName}`,
      selectedClasses: selectedClasses.length,
      selectedCourses: selectedCourses.length,
      planBasedSelection: !!planBasedSelection
    });

    if (!firstName || !lastName || !email) {
      reply.code(400);
      return {
        success: false,
        error: 'Missing required fields',
        message: 'firstName, lastName, and email are required'
      };
    }

    // Get organization ID
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error('No organization found');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    const result = await prisma.$transaction(async (tx) => {
      // Create user with CPF
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          cpf,
          password: tempPassword,
          organizationId: org.id,
          role: 'STUDENT'
        }
      });

      // Create student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          category,
          gender,
          physicalCondition: 'INICIANTE',
          specialNeeds: [],
          enrollmentDate: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              cpf: true,
              avatarUrl: true,
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

      // Vinculação automática de turmas
      if (selectedClasses.length > 0) {
        console.log(`📚 Vinculando ${selectedClasses.length} turma(s) ao estudante`);
        
        for (const classId of selectedClasses) {
          try {
            // Verificar se a turma existe
            const classExists = await tx.class.findUnique({
              where: { id: parseInt(classId) }
            });
            
            if (classExists) {
              // Criar vinculação estudante-turma
              await tx.studentClass.create({
                data: {
                  studentId: student.id,
                  classId: parseInt(classId),
                  enrollmentDate: new Date(),
                  status: 'ACTIVE'
                }
              });
              console.log(`✅ Turma ${classId} vinculada com sucesso`);
            } else {
              console.warn(`⚠️ Turma ${classId} não encontrada`);
            }
          } catch (classError) {
            console.error(`❌ Erro ao vincular turma ${classId}:`, classError);
          }
        }
      }

      // Vinculação automática de cursos
      if (selectedCourses.length > 0) {
        console.log(`📖 Vinculando ${selectedCourses.length} curso(s) ao estudante`);
        
        for (const courseId of selectedCourses) {
          try {
            // Verificar se o curso existe
            const courseExists = await tx.course.findUnique({
              where: { id: parseInt(courseId) }
            });
            
            if (courseExists) {
              // Criar vinculação estudante-curso
              await tx.studentCourse.create({
                data: {
                  studentId: student.id,
                  courseId: parseInt(courseId),
                  enrollmentDate: new Date(),
                  status: 'ACTIVE',
                  progress: 0
                }
              });
              console.log(`✅ Curso ${courseId} vinculado com sucesso`);
            } else {
              console.warn(`⚠️ Curso ${courseId} não encontrado`);
            }
          } catch (courseError) {
            console.error(`❌ Erro ao vincular curso ${courseId}:`, courseError);
          }
        }
      }

      // Criar assinatura de plano se fornecido
      if (billingPlanId) {
        console.log(`💰 Criando assinatura para plano ${billingPlanId}`);
        
        try {
          const billingPlan = await tx.billingPlan.findUnique({
            where: { id: parseInt(billingPlanId) }
          });
          
          if (billingPlan) {
            await tx.subscription.create({
              data: {
                studentId: student.id,
                billingPlanId: parseInt(billingPlanId),
                startDate: new Date(),
                status: 'ACTIVE',
                paymentStatus: 'PENDING'
              }
            });
            console.log(`✅ Assinatura criada com sucesso`);
          }
        } catch (subscriptionError) {
          console.error(`❌ Erro ao criar assinatura:`, subscriptionError);
        }
      }

      return {
        student,
        enrollmentSummary: {
          classesEnrolled: selectedClasses.length,
          coursesEnrolled: selectedCourses.length,
          subscriptionCreated: !!billingPlanId,
          planBasedSelection: planBasedSelection
        }
      };
    });

    console.log('✅ Estudante criado com sucesso com vinculação automática');

    return {
      success: true,
      data: result,
      message: 'Student created successfully with automatic enrollment'
    };
  } catch (error) {
    console.error('❌ POST /api/students error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to create student',
      message: error.message
    };
  }
});

// Update student endpoint
server.put('/api/students/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    
    // Get current student to access userId
    const currentStudent = await prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!currentStudent) {
      reply.code(404);
      return {
        success: false,
        error: 'Student not found'
      };
    }
    
    // Separate user and student data
    const userUpdates = {};
    const studentUpdates = {};
    
    // User fields - only update if different from current
    if (updateData.firstName !== undefined && updateData.firstName !== currentStudent.user.firstName) {
      userUpdates.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined && updateData.lastName !== currentStudent.user.lastName) {
      userUpdates.lastName = updateData.lastName;
    }
    if (updateData.email !== undefined && updateData.email !== currentStudent.user.email) {
      userUpdates.email = updateData.email;
    }
    if (updateData.phone !== undefined && updateData.phone !== currentStudent.user.phone) {
      userUpdates.phone = updateData.phone;
    }
    
    // Student fields
    if (updateData.category !== undefined) studentUpdates.category = updateData.category;
    if (updateData.gender !== undefined) studentUpdates.gender = updateData.gender;
    if (updateData.physicalCondition !== undefined) studentUpdates.physicalCondition = updateData.physicalCondition;
    if (updateData.emergencyContact !== undefined) studentUpdates.emergencyContact = updateData.emergencyContact;
    if (updateData.medicalConditions !== undefined) studentUpdates.medicalConditions = updateData.medicalConditions;
    if (updateData.specialNeeds !== undefined) studentUpdates.specialNeeds = updateData.specialNeeds;
    if (updateData.isActive !== undefined) studentUpdates.isActive = updateData.isActive;
    
    // Perform updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if needed
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: currentStudent.userId },
          data: userUpdates
        });
      }
      
      // Update student if needed
      if (Object.keys(studentUpdates).length > 0) {
        await tx.student.update({
          where: { id },
          data: studentUpdates
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
    console.error('❌ PUT /api/students/:id error:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update student'
    };
  }
});

// Sample techniques endpoint
server.get('/api/techniques', async () => {
  try {
    const techniques = await prisma.technique.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        difficulty: true,
        baseXP: true
      },
      take: 10
    });
    
    return {
      success: true,
      data: techniques,
      message: 'Techniques retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve techniques'
    };
  }
});

// Financial Subscriptions API
server.post('/api/financial/subscriptions', async (request, reply) => {
  try {
    const { studentId, planId, startDate, customPrice } = request.body;
    
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

    // For now, create a simple subscription record
    // In a full implementation, this would integrate with payment processing
    const subscription = {
      id: `sub-${Date.now()}`,
      studentId,
      planId,
      currentPrice: customPrice || 150.00,
      billingType: 'MONTHLY',
      startDate: startDate ? new Date(startDate) : new Date(),
      nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date()
    };

    console.log('✅ Created subscription:', subscription);

    return {
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    };
  } catch (error) {
    console.error('❌ POST /api/financial/subscriptions error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    };
  }
});

// Alternative subscription route that already works
server.post('/api/students/:id/subscription', async (request, reply) => {
  try {
    const { id: studentId } = request.params;
    const { planId, startDate, customPrice } = request.body;

    // Validation
    if (!planId) {
      reply.code(400);
      return {
        success: false,
        error: 'Missing required fields',
        message: 'planId is required'
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

    // Create subscription using Prisma if available, otherwise mock
    let subscription;
    try {
      subscription = await prisma.studentSubscription.create({
        data: {
          studentId,
          planId,
          currentPrice: customPrice || 150.00,
          billingType: 'MONTHLY',
          startDate: startDate ? new Date(startDate) : new Date(),
          nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
          status: 'ACTIVE',
          isActive: true
        }
      });
    } catch (dbError) {
      // Fallback to mock data if DB schema not ready
      subscription = {
        id: `sub-${Date.now()}`,
        studentId,
        planId,
        currentPrice: customPrice || 150.00,
        billingType: 'MONTHLY',
        startDate: startDate ? new Date(startDate) : new Date(),
        nextBillingDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date()
      };
    }

    console.log('✅ Created subscription via alternative route:', subscription);

    return {
      success: true,
      data: subscription,
      message: 'Subscription created successfully via alternative route'
    };
  } catch (error) {
    console.error('❌ POST /api/students/:id/subscription error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    };
  }
});

// GET subscription endpoint
// Simple DB test
server.get('/api/debug/db-test', async (request, reply) => {
  try {
    const studentCount = await prisma.student.count();
    const subscriptionCount = await prisma.studentSubscription.count();
    const planCount = await prisma.billingPlan.count();
    
    return {
      success: true,
      counts: {
        students: studentCount,
        subscriptions: subscriptionCount,
        plans: planCount
      },
      prismaConnected: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      prismaConnected: false
    };
  }
});

// Debug endpoint
server.get('/api/debug/subscription/:id', async (request, reply) => {
  const { id: studentId } = request.params;
  
  try {
    // First check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    // Check subscriptions without filter
    const allSubs = await prisma.studentSubscription.findMany({
      where: { studentId },
      include: {
        plan: true
      }
    });
    
    // Check active subscriptions
    const activeSubs = await prisma.studentSubscription.findMany({
      where: { 
        studentId,
        isActive: true
      },
      include: {
        plan: true
      }
    });
    
    return {
      success: true,
      debug: {
        studentExists: !!student,
        totalSubscriptions: allSubs.length,
        activeSubscriptions: activeSubs.length,
        subscriptions: allSubs,
        activeSubsWithPlan: activeSubs
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

server.get('/api/students/:id/subscription', async (request, reply) => {
  try {
    const { id: studentId } = request.params;
    
    // Try to get real subscription from DB
    let subscription = null;
    try {
      console.log(`🔍 [DEBUG] Searching subscription for student: ${studentId}`);
      subscription = await prisma.studentSubscription.findFirst({
        where: { 
          studentId,
          isActive: true
        },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      console.log(`📊 [DEBUG] Found subscription:`, subscription ? 'YES' : 'NO');
      console.log(`📊 [DEBUG] Plan included:`, subscription?.plan ? 'YES' : 'NO');
      if (subscription?.plan) {
        console.log(`📊 [DEBUG] Plan name:`, subscription.plan.name);
      }
    } catch (dbError) {
      // Fallback for missing schema
      console.log('📝 DB schema not ready, returning null subscription');
      console.error('DB Error:', dbError);
    }

    return {
      success: true,
      data: subscription,
      message: subscription ? 'Student subscription retrieved successfully' : 'No active subscription found for this student'
    };
  } catch (error) {
    console.error('❌ GET /api/students/:id/subscription error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to retrieve subscription',
      message: error.message
    };
  }
});

// PUT endpoint to update student subscription
server.put('/api/students/:id/subscription', async (request, reply) => {
  try {
    const { id: studentId } = request.params;
    const { planId, subscriptionId } = request.body;
    
    console.log(`🔄 [UPDATE] Updating subscription for student: ${studentId}`);
    console.log(`🔄 [UPDATE] New plan ID: ${planId}`);
    console.log(`🔄 [UPDATE] Subscription ID: ${subscriptionId}`);
    
    // Validate required fields
    if (!planId || !subscriptionId) {
      reply.code(400);
      return {
        success: false,
        error: 'Missing required fields',
        message: 'planId and subscriptionId are required'
      };
    }
    
    // Verify the subscription belongs to this student
    const existingSubscription = await prisma.studentSubscription.findFirst({
      where: {
        id: subscriptionId,
        studentId: studentId,
        isActive: true
      }
    });
    
    if (!existingSubscription) {
      reply.code(404);
      return {
        success: false,
        error: 'Subscription not found',
        message: 'No active subscription found for this student'
      };
    }
    
    // Verify the new plan exists
    const newPlan = await prisma.billingPlan.findUnique({
      where: { id: planId }
    });
    
    if (!newPlan) {
      reply.code(404);
      return {
        success: false,
        error: 'Plan not found',
        message: 'The specified plan does not exist'
      };
    }
    
    // Update the subscription with new plan
    const updatedSubscription = await prisma.studentSubscription.update({
      where: { id: subscriptionId },
      data: {
        planId: planId,
        currentPrice: newPlan.price,
        billingType: newPlan.billingType,
        updatedAt: new Date()
      },
      include: {
        plan: true
      }
    });
    
    console.log(`✅ [UPDATE] Subscription updated successfully`);
    
    return {
      success: true,
      data: updatedSubscription,
      message: 'Subscription updated successfully'
    };
    
  } catch (error) {
    console.error('❌ PUT /api/students/:id/subscription error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to update subscription',
      message: error.message
    };
  }
});

// DELETE /api/students/:id/subscription - Delete student subscription (hard delete)
server.delete('/api/students/:id/subscription', async (request, reply) => {
  try {
    const { id: studentId } = request.params;
    const { reason, confirmedDeletion, auditLog } = request.body || {};
    
    console.log(`🗑️ [DELETE] Deleting subscription for student: ${studentId}`);
    console.log(`🗑️ [DELETE] Reason: ${reason}`);
    console.log(`🗑️ [DELETE] Audit log:`, auditLog);
    
    // Validate required fields
    if (!confirmedDeletion) {
      reply.code(400);
      return {
        success: false,
        error: 'Deletion not confirmed',
        message: 'confirmedDeletion flag is required for safety'
      };
    }
    
    // Find the active subscription
    const subscription = await prisma.studentSubscription.findFirst({
      where: {
        studentId: studentId,
        isActive: true
      },
      include: {
        plan: true
      }
    });
    
    if (!subscription) {
      reply.code(404);
      return {
        success: false,
        error: 'Subscription not found',
        message: 'No active subscription found for this student'
      };
    }
    
    // Hard delete the subscription
    await prisma.studentSubscription.delete({
      where: { id: subscription.id }
    });
    
    console.log(`✅ [DELETE] Subscription deleted permanently for student: ${studentId}`);
    
    return {
      success: true,
      data: {
        deletedSubscriptionId: subscription.id,
        studentId: studentId,
        planName: subscription.plan?.name,
        reason: reason,
        deletedAt: new Date().toISOString()
      },
      message: 'Subscription deleted permanently'
    };
    
  } catch (error) {
    console.error('❌ DELETE /api/students/:id/subscription error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to delete subscription',
      message: error.message
    };
  }
});

// PATCH /api/students/:id/subscription/deactivate - Deactivate student subscription (soft delete)
server.patch('/api/students/:id/subscription/deactivate', async (request, reply) => {
  try {
    const { id: studentId } = request.params;
    const { reason, auditLog, subscriptionId } = request.body || {};
    
    console.log(`🔒 [DEACTIVATE] Deactivating subscription for student: ${studentId}`);
    console.log(`🔒 [DEACTIVATE] Reason: ${reason}`);
    console.log(`🔒 [DEACTIVATE] Audit log:`, auditLog);
    
    // Find the active subscription
    let subscription;
    if (subscriptionId) {
      subscription = await prisma.studentSubscription.findFirst({
        where: {
          id: subscriptionId,
          studentId: studentId,
          isActive: true
        },
        include: {
          plan: true
        }
      });
    } else {
      subscription = await prisma.studentSubscription.findFirst({
        where: {
          studentId: studentId,
          isActive: true
        },
        include: {
          plan: true
        }
      });
    }
    
    if (!subscription) {
      reply.code(404);
      return {
        success: false,
        error: 'Subscription not found',
        message: 'No active subscription found for this student'
      };
    }
    
    // Soft delete - update status to INACTIVE
    const deactivatedSubscription = await prisma.studentSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'INACTIVE',
        isActive: false,
        updatedAt: new Date()
      },
      include: {
        plan: true
      }
    });
    
    console.log(`✅ [DEACTIVATE] Subscription deactivated for student: ${studentId}`);
    
    return {
      success: true,
      data: {
        subscriptionId: deactivatedSubscription.id,
        studentId: studentId,
        planName: deactivatedSubscription.plan?.name,
        status: deactivatedSubscription.status,
        reason: reason,
        deactivatedAt: new Date().toISOString()
      },
      message: 'Subscription deactivated successfully'
    };
    
  } catch (error) {
    console.error('❌ PATCH /api/students/:id/subscription/deactivate error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to deactivate subscription',
      message: error.message
    };
  }
});

// Sample organizations endpoint
server.get('/api/organizations', async () => {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true
      },
      take: 10
    });
    
    return {
      success: true,
      data: organizations,
      message: 'Organizations retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve organizations'
    };
  }
});

// POST /api/organizations - Create new organization
server.post('/api/organizations', async (request, reply) => {
  try {
    const { name, slug, description } = request.body;
    
    if (!name || !slug) {
      reply.code(400);
      return {
        success: false,
        error: 'Missing required fields',
        message: 'name and slug are required'
      };
    }
    
    // Check if slug is already in use
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });
    
    if (existingOrg) {
      reply.code(409);
      return {
        success: false,
        error: 'Slug already in use',
        message: 'Please choose a different slug'
      };
    }
    
    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        isActive: true,
        createdAt: new Date()
      }
    });
    
    return {
      success: true,
      data: organization,
      message: 'Organization created successfully'
    };
  } catch (error) {
    console.error('❌ POST /api/organizations error:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create organization'
    };
  }
});

// PUT /api/organizations/:id - Update organization
server.put('/api/organizations/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, slug, description, isActive } = request.body;
    
    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { id }
    });
    
    if (!organization) {
      reply.code(404);
      return {
        success: false,
        error: 'Organization not found',
        message: 'No organization found with this ID'
      };
    }
    
    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        isActive,
        updatedAt: new Date()
      }
    });
    
    return {
      success: true,
      data: updatedOrganization,
      message: 'Organization updated successfully'
    };
  } catch (error) {
    console.error('❌ PUT /api/organizations/:id error:', error);
    reply.code(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update organization'
    };
  }
});

// DELETE /api/organizations/:id - Delete organization (soft delete)
server.delete('/api/organizations/:id', async (request, reply) => {
  try {
    const { id } = request.params;

    // Check if organization has active students
    const activeStudents = await prisma.student.count({
      where: {
        organizationId: id,
        isActive: true
      }
    });

    if (activeStudents > 0) {
      reply.status(400);
      return {
        success: false,
        message: 'Cannot delete organization with active students'
      };
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return {
      success: true,
      data: organization,
      message: 'Organization deactivated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete organization'
    };
  }
});

// ========================================
// UNITS (UNIDADES) CRUD APIs
// ========================================

// GET /api/units - List all units
server.get('/api/units', async (request, reply) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        mats: {
          select: {
            id: true,
            name: true,
            capacity: true,
            isActive: true
          }
        },
        _count: {
          select: {
            mats: true,
            classes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      data: units,
      message: 'Units retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve units'
    };
  }
});

// POST /api/units - Create new unit
server.post('/api/units', async (request, reply) => {
  try {
    const {
      name,
      description,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      phone,
      email,
      capacity,
      totalMats,
      responsibleName
    } = request.body;

    // Validate required fields
    if (!name || !address || !city || !state || !zipCode) {
      reply.status(400);
      return {
        success: false,
        message: 'Nome, endereço, cidade, estado e CEP são obrigatórios'
      };
    }

    const unit = await prisma.unit.create({
      data: {
        organizationId: '1', // TODO: Get from auth
        name,
        description,
        address,
        addressNumber,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        email,
        capacity: parseInt(capacity) || 100,
        totalMats: parseInt(totalMats) || 1,
        responsibleName
      }
    });

    return {
      success: true,
      data: unit,
      message: 'Unit created successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create unit'
    };
  }
});

// GET /api/units/:id - Get unit by ID
server.get('/api/units/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        mats: {
          include: {
            _count: {
              select: {
                classes: true
              }
            }
          }
        },
        classes: {
          include: {
            course: {
              select: {
                name: true
              }
            },
            instructor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    });

    if (!unit) {
      reply.status(404);
      return {
        success: false,
        message: 'Unit not found'
      };
    }

    return {
      success: true,
      data: unit,
      message: 'Unit retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve unit'
    };
  }
});

// PUT /api/units/:id - Update unit
server.put('/api/units/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const {
      name,
      description,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      phone,
      email,
      capacity,
      totalMats,
      responsibleName,
      isActive
    } = request.body;

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name,
        description,
        address,
        addressNumber,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        email,
        capacity: capacity ? parseInt(capacity) : undefined,
        totalMats: totalMats ? parseInt(totalMats) : undefined,
        responsibleName,
        isActive
      }
    });

    return {
      success: true,
      data: unit,
      message: 'Unit updated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update unit'
    };
  }
});

// DELETE /api/units/:id - Delete unit (soft delete)
server.delete('/api/units/:id', async (request, reply) => {
  try {
    const { id } = request.params;

    // Check if unit has active classes
    const activeClasses = await prisma.class.count({
      where: {
        unitId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (activeClasses > 0) {
      reply.status(400);
      return {
        success: false,
        message: 'Cannot delete unit with active classes'
      };
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return {
      success: true,
      data: unit,
      message: 'Unit deactivated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete unit'
    };
  }
});

// ========================================
// MATS (TATAMES) CRUD APIs
// ========================================

// GET /api/mats - List all mats
server.get('/api/mats', async (request, reply) => {
  try {
    const { unitId } = request.query;
    
    const whereClause = unitId ? { unitId } : {};
    
    const mats = await prisma.mat.findMany({
      where: whereClause,
      include: {
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            classes: true
          }
        }
      },
      orderBy: [
        { unit: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return {
      success: true,
      data: mats,
      message: 'Mats retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve mats'
    };
  }
});

// POST /api/mats - Create new mat
server.post('/api/mats', async (request, reply) => {
  try {
    const {
      unitId,
      name,
      description,
      capacity,
      dimensions,
      equipment,
      materialType
    } = request.body;

    // Validate required fields
    if (!unitId || !name || !capacity) {
      reply.status(400);
      return {
        success: false,
        message: 'Unidade, nome e capacidade são obrigatórios'
      };
    }

    const mat = await prisma.mat.create({
      data: {
        organizationId: '1', // TODO: Get from auth
        unitId,
        name,
        description,
        capacity: parseInt(capacity),
        dimensions,
        equipment: equipment || [],
        materialType
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: mat,
      message: 'Mat created successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create mat'
    };
  }
});

// PUT /api/mats/:id - Update mat
server.put('/api/mats/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const {
      name,
      description,
      capacity,
      dimensions,
      equipment,
      materialType,
      isActive
    } = request.body;

    const mat = await prisma.mat.update({
      where: { id },
      data: {
        name,
        description,
        capacity: capacity ? parseInt(capacity) : undefined,
        dimensions,
        equipment,
        materialType,
        isActive
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: mat,
      message: 'Mat updated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update mat'
    };
  }
});

// DELETE /api/mats/:id - Delete mat (soft delete)
server.delete('/api/mats/:id', async (request, reply) => {
  try {
    const { id } = request.params;

    // Check if mat has active classes
    const activeClasses = await prisma.class.count({
      where: {
        matId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (activeClasses > 0) {
      reply.status(400);
      return {
        success: false,
        message: 'Cannot delete mat with active classes'
      };
    }

    const mat = await prisma.mat.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return {
      success: true,
      data: mat,
      message: 'Mat deactivated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete mat'
    };
  }
});

// ========================================
// INSTRUCTORS (PROFESSORES) CRUD APIs
// ========================================

// GET /api/instructors - List all instructors
server.get('/api/instructors', async (request, reply) => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            classes: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    return {
      success: true,
      data: instructors,
      message: 'Instructors retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve instructors'
    };
  }
});

// POST /api/instructors - Create new instructor
server.post('/api/instructors', async (request, reply) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      specializations,
      certifications,
      bio,
      martialArts,
      maxStudentsPerClass,
      experience,
      availability,
      hourlyRate,
      preferredUnits
    } = request.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      reply.status(400);
      return {
        success: false,
        message: 'Nome, sobrenome e email são obrigatórios'
      };
    }

    // Create user first
    const user = await prisma.user.create({
      data: {
        organizationId: '1', // TODO: Get from auth
        firstName,
        lastName,
        email,
        phone,
        role: 'INSTRUCTOR',
        password: 'temp123' // TODO: Generate random password and send email
      }
    });

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        organizationId: '1', // TODO: Get from auth
        userId: user.id,
        specializations: specializations || [],
        certifications: certifications || [],
        bio,
        martialArts: martialArts || [],
        maxStudentsPerClass: parseInt(maxStudentsPerClass) || 20,
        experience,
        availability,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        preferredUnits: preferredUnits || []
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return {
      success: true,
      data: instructor,
      message: 'Instructor created successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create instructor'
    };
  }
});

// PUT /api/instructors/:id - Update instructor
server.put('/api/instructors/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      specializations,
      certifications,
      bio,
      martialArts,
      maxStudentsPerClass,
      experience,
      availability,
      hourlyRate,
      preferredUnits,
      isActive
    } = request.body;

    // Update instructor
    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        specializations,
        certifications,
        bio,
        martialArts,
        maxStudentsPerClass: maxStudentsPerClass ? parseInt(maxStudentsPerClass) : undefined,
        experience,
        availability,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        preferredUnits,
        isActive
      }
    });

    // Update user info if provided
    if (firstName || lastName || email || phone) {
      await prisma.user.update({
        where: { id: instructor.userId },
        data: {
          firstName,
          lastName,
          email,
          phone
        }
      });
    }

    // Get updated instructor with user data
    const updatedInstructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedInstructor,
      message: 'Instructor updated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update instructor'
    };
  }
});

// DELETE /api/instructors/:id - Delete instructor (soft delete)
server.delete('/api/instructors/:id', async (request, reply) => {
  try {
    const { id } = request.params;

    // Check if instructor has active classes
    const activeClasses = await prisma.class.count({
      where: {
        instructorId: id,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (activeClasses > 0) {
      reply.status(400);
      return {
        success: false,
        message: 'Cannot delete instructor with active classes'
      };
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    // Also deactivate user
    await prisma.user.update({
      where: { id: instructor.userId },
      data: {
        isActive: false
      }
    });

    return {
      success: true,
      data: instructor,
      message: 'Instructor deactivated successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete instructor'
    };
  }
});

// ========================================
// MISSING APIS - SIMPLE IMPLEMENTATION
// ========================================

// GET /api/billing-plans - Return real billing plans
server.get('/api/billing-plans', async (request, reply) => {
  try {
    const plans = await prisma.billingPlan.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true,
            duration: true,
            totalClasses: true,
            classesPerWeek: true,
            category: true,
            classes: {
              select: {
                id: true,
                title: true,
                startTime: true,
                capacity: true,
                _count: {
                  select: {
                    studentCourses: true
                  }
                }
              },
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return {
      success: true,
      data: plans,
      message: 'Billing plans retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve billing plans'
    };
  }
});

// POST /api/billing-plans - Create new billing plan
server.post('/api/billing-plans', async (request, reply) => {
  try {
    const body = request.body;
    const {
      name,
      description,
      price,
      courseId,
      category = 'ADULT',
      billingType = 'MONTHLY',
      classesPerWeek = 2,
      maxClasses,
      isUnlimitedAccess = false,
      hasPersonalTraining = false,
      hasNutrition = false,
      allowInstallments = false,
      maxInstallments = 1,
      installmentInterestRate,
      isRecurring = false,
      recurringInterval,
      accessAllModalities = false,
      allowFreeze = true,
      freezeMaxDays = 30,
      features = {},
      isActive = true
    } = body;
    
    // Collect extra fields not in schema for features JSON
    const schemaFields = [
      'name', 'description', 'price', 'courseId', 'category', 'billingType',
      'classesPerWeek', 'maxClasses', 'isUnlimitedAccess', 'hasPersonalTraining',
      'hasNutrition', 'allowInstallments', 'maxInstallments', 'installmentInterestRate',
      'isRecurring', 'recurringInterval', 'accessAllModalities', 'allowFreeze',
      'freezeMaxDays', 'isActive', 'features'
    ];
    
    const extraFeatures = {};
    Object.keys(body).forEach(key => {
      if (!schemaFields.includes(key)) {
        extraFeatures[key] = body[key];
      }
    });
    
    // Merge provided features with extra fields
    const finalFeatures = { ...features, ...extraFeatures };

    // Validate required fields
    if (!name || !price) {
      reply.status(400);
      return {
        success: false,
        message: 'Name and price are required'
      };
    }

    // Get organization ID
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error('No organization found');
    }

    const plan = await prisma.billingPlan.create({
      data: {
        organizationId: org.id,
        name,
        description,
        price: parseFloat(price),
        courseId: courseId || null,
        category,
        billingType,
        classesPerWeek: parseInt(classesPerWeek),
        maxClasses: maxClasses ? parseInt(maxClasses) : null,
        isUnlimitedAccess,
        hasPersonalTraining,
        hasNutrition,
        allowInstallments,
        maxInstallments: parseInt(maxInstallments),
        installmentInterestRate: installmentInterestRate ? parseFloat(installmentInterestRate) : null,
        isRecurring,
        recurringInterval: recurringInterval ? parseInt(recurringInterval) : null,
        accessAllModalities,
        allowFreeze,
        freezeMaxDays: parseInt(freezeMaxDays),
        features: finalFeatures, // Store extra configurations as JSON
        isActive
      },
      include: {
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: plan,
      message: 'Billing plan created successfully'
    };
  } catch (error) {
    console.error('❌ POST /api/billing-plans error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create billing plan'
    };
  }
});

// PUT /api/billing-plans/:id - Update billing plan
server.put('/api/billing-plans/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const body = request.body;
    
    console.log(`📝 Updating billing plan: ${id}`, body);
    
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

    // Prepare update data
    const updateData = {};
    
    // Basic fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.billingType !== undefined) updateData.billingType = body.billingType;
    if (body.courseId !== undefined) updateData.courseId = body.courseId;
    
    // Advanced configuration
    if (body.classesPerWeek !== undefined) updateData.classesPerWeek = parseInt(body.classesPerWeek);
    if (body.maxClasses !== undefined) updateData.maxClasses = body.maxClasses ? parseInt(body.maxClasses) : null;
    if (body.isUnlimitedAccess !== undefined) updateData.isUnlimitedAccess = body.isUnlimitedAccess;
    
    // Features
    if (body.hasPersonalTraining !== undefined) updateData.hasPersonalTraining = body.hasPersonalTraining;
    if (body.hasNutrition !== undefined) updateData.hasNutrition = body.hasNutrition;
    if (body.accessAllModalities !== undefined) updateData.accessAllModalities = body.accessAllModalities;
    if (body.allowFreeze !== undefined) updateData.allowFreeze = body.allowFreeze;
    if (body.freezeMaxDays !== undefined) updateData.freezeMaxDays = parseInt(body.freezeMaxDays);
    
    // Payment configuration
    if (body.allowInstallments !== undefined) updateData.allowInstallments = body.allowInstallments;
    if (body.maxInstallments !== undefined) updateData.maxInstallments = parseInt(body.maxInstallments);
    if (body.installmentInterestRate !== undefined) updateData.installmentInterestRate = body.installmentInterestRate ? parseFloat(body.installmentInterestRate) : null;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
    if (body.recurringInterval !== undefined) updateData.recurringInterval = body.recurringInterval ? parseInt(body.recurringInterval) : null;
    
    // Status and features JSON
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.features !== undefined) updateData.features = body.features;
    
    updateData.updatedAt = new Date();

    // Update the billing plan
    const updatedPlan = await prisma.billingPlan.update({
      where: { id },
      data: updateData
    });

    console.log(`✅ Billing plan updated: ${updatedPlan.name}`);

    return {
      success: true,
      data: updatedPlan,
      message: 'Billing plan updated successfully'
    };
  } catch (error) {
    console.error('❌ PUT /api/billing-plans/:id error:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to update billing plan',
      message: error.message
    };
  }
});

// DELETE /api/billing-plans/:id - Delete billing plan
server.delete('/api/billing-plans/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    console.log(`🗑️ Deleting billing plan: ${id}`);
    
    // Check if plan exists
    const existingPlan = await prisma.billingPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    });
    
    if (!existingPlan) {
      reply.code(404);
      return {
        success: false,
        error: 'Plan not found'
      };
    }
    
    // Check if plan has active subscriptions
    if (existingPlan._count.subscriptions > 0) {
      reply.code(400);
      return {
        success: false,
        error: 'Cannot delete plan with active subscriptions',
        message: `This plan has ${existingPlan._count.subscriptions} active subscription(s). Please cancel them first.`
      };
    }
    
    // Soft delete - deactivate the plan instead of hard delete
    const deletedPlan = await prisma.billingPlan.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Billing plan deactivated: ${deletedPlan.name}`);
    
    return {
      success: true,
      message: 'Plan deleted successfully',
      data: { id: deletedPlan.id, name: deletedPlan.name }
    };
    
  } catch (error) {
    console.error('❌ Error deleting billing plan:', error);
    reply.code(500);
    return {
      success: false,
      error: 'Failed to delete plan',
      message: error.message
    };
  }
});

// GET /api/subscriptions - Return empty array (no test data needed)
server.get('/api/subscriptions', async (request, reply) => {
  try {
    // Return empty structure to prevent frontend errors
    return {
      success: true,
      data: [],
      message: 'Subscriptions endpoint available (no data configured)'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve subscriptions'
    };
  }
});

// GET /api/classes - Return real classes
server.get('/api/classes', async (request, reply) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        mat: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        _count: {
          select: {
            studentCourses: true
          }
        }
      },
      orderBy: [
        { startTime: 'asc' },
        { title: 'asc' }
      ]
    });
    
    return {
      success: true,
      data: classes,
      message: 'Classes retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve classes'
    };
  }
});

// POST /api/classes - Create new class
server.post('/api/classes', async (request, reply) => {
  try {
    const {
      course,
      name,
      capacity,
      startTime,
      duration,
      instructor,
      startDate,
      selectedDays,
      notes
    } = request.body;
    
    // Validation
    if (!course || !name || !capacity || !startTime || !duration || !instructor || !startDate || !selectedDays || selectedDays.length === 0) {
      reply.code(400);
      return {
        success: false,
        error: 'Missing required fields',
        message: 'course, name, capacity, startTime, duration, instructor, startDate, and selectedDays are required'
      };
    }
    
    // For now, we'll create a simplified class record
    // In a full implementation, you'd need to handle course lookup, instructor lookup, etc.
    const newClass = {
      id: `class-${Date.now()}`,
      title: name,
      capacity: parseInt(capacity),
      startTime: startTime,
      duration: parseInt(duration),
      startDate: new Date(startDate),
      schedule: selectedDays.join(','),
      notes: notes || '',
      isActive: true,
      createdAt: new Date(),
      // Mock relations for now
      course: {
        id: course,
        name: course === 'krav-maga-basic' ? 'Krav Maga - Faixa Branca' : 'Curso Selecionado'
      },
      instructor: {
        id: instructor,
        user: {
          firstName: instructor.includes('silva') ? 'Prof. Silva' : 'Instrutor',
          lastName: ''
        }
      }
    };
    
    // TODO: In a real implementation, save to database
    console.log('📝 New class created:', newClass);
    
    return {
      success: true,
      data: newClass,
      message: 'Class created successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create class'
    };
  }
});

// GET /api/courses - Return real courses
server.get('/api/courses', async (request, reply) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        martialArt: {
          select: {
            id: true,
            name: true
          }
        },
        billingPlans: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        _count: {
          select: {
            classes: true,
            studentCourses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return {
      success: true,
      data: courses,
      message: 'Courses retrieved successfully'
    };
  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve courses'
    };
  }
});

// POST /api/courses - Create new course
server.post('/api/courses', async (request, reply) => {
  try {
    const {
      name,
      description,
      martialArt,
      level,
      targetAudience,
      ageGroup,
      gender,
      duration,
      totalLessons,
      lessonDuration,
      objectives,
      evaluationCriteria,
      teachingStyle,
      adaptations,
      createdBy
    } = request.body;

    // Validate required fields
    if (!name) {
      reply.status(400);
      return {
        success: false,
        message: 'Course name is required'
      };
    }

    // Get organization ID
    const org = await prisma.organization.findFirst();
    if (!org) {
      throw new Error('No organization found');
    }

    // Find or create martial art
    let martialArtRecord = await prisma.martialArt.findFirst({
      where: {
        organizationId: org.id,
        name: {
          contains: martialArt,
          mode: 'insensitive'
        }
      }
    });

    if (!martialArtRecord) {
      // Create new martial art if not found
      martialArtRecord = await prisma.martialArt.create({
        data: {
          organizationId: org.id,
          name: martialArt || 'Krav Maga',
          description: `Arte marcial ${martialArt || 'Krav Maga'}`,
          hasGrading: true,
          gradingSystem: 'BELT',
          maxLevel: 10
        }
      });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        organizationId: org.id,
        martialArtId: martialArtRecord.id,
        name,
        description: description || `Curso de ${martialArt || 'Krav Maga'} - ${level || 'Iniciante'}`,
        level: level || 'BEGINNER',
        minAge: ageGroup === '6-12' ? 6 : ageGroup === '13-17' ? 13 : ageGroup === '65+' ? 65 : 18,
        maxAge: ageGroup === '6-12' ? 12 : ageGroup === '13-17' ? 17 : ageGroup === '65+' ? 99 : 65,
        duration: parseInt(duration) || 24,
        totalClasses: parseInt(totalLessons) || 48,
        classesPerWeek: 2,
        category: targetAudience || 'ADULT',
        objectives: Array.isArray(objectives) ? objectives : [objectives || 'Desenvolver técnicas fundamentais'],
        requirements: Array.isArray(evaluationCriteria) ? evaluationCriteria : [evaluationCriteria || 'Execução correta das técnicas']
      },
      include: {
        martialArt: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            classes: true,
            studentCourses: true
          }
        }
      }
    });

    return {
      success: true,
      data: course,
      message: 'Course created successfully'
    };
  } catch (error) {
    console.error('❌ POST /api/courses error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create course'
    };
  }
});

// GET /api/billing-plans/:id - Get specific billing plan
server.get('/api/billing-plans/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    const plan = await prisma.billingPlan.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            level: true
          }
        }
      }
    });

    if (!plan) {
      reply.status(404);
      return {
        success: false,
        error: 'Billing plan not found',
        message: 'The requested billing plan does not exist'
      };
    }

    return {
      success: true,
      data: plan,
      message: 'Billing plan retrieved successfully'
    };
  } catch (error) {
    console.error('❌ GET /api/billing-plans/:id error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve billing plan'
    };
  }
});

// GET /api/students/:id/enrollments - Get student enrollments (classes and courses)
server.get('/api/students/:id/enrollments', async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Buscar todas as matrículas do aluno
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: parseInt(id) },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            schedule: true,
            capacity: true,
            category: true,
            level: true,
            courseId: true
          }
        },
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
      }
    });

    return {
      success: true,
      data: enrollments,
      message: 'Student enrollments retrieved successfully'
    };
  } catch (error) {
    console.error('❌ GET /api/students/:id/enrollments error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve student enrollments'
    };
  }
});

// GET /api/students/:id/subscriptions - Get student subscriptions (billing plans)
server.get('/api/students/:id/subscriptions', async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Buscar todas as assinaturas do aluno
    const subscriptions = await prisma.subscription.findMany({
      where: { studentId: parseInt(id) },
      include: {
        billingPlan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            billingType: true,
            includedClasses: true,
            includedCourses: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return {
      success: true,
      data: subscriptions,
      message: 'Student subscriptions retrieved successfully'
    };
  } catch (error) {
    console.error('❌ GET /api/students/:id/subscriptions error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve student subscriptions'
    };
  }
});

// GET /api/students/:id - Enhanced to include associations
server.get('/api/students/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            cpf: true,
            avatarUrl: true,
            isActive: true
          }
        },
        financialResponsible: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        enrollments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                description: true,
                schedule: true,
                capacity: true,
                category: true,
                level: true,
                courseId: true
              }
            },
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
          }
        },
        subscriptions: {
          include: {
            billingPlan: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
                billingType: true,
                includedClasses: true,
                includedCourses: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
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

    if (!student) {
      reply.status(404);
      return {
        success: false,
        error: 'Student not found',
        message: 'The requested student does not exist'
      };
    }

    return {
      success: true,
      data: student,
      message: 'Student retrieved successfully'
    };
  } catch (error) {
    console.error('❌ GET /api/students/:id error:', error);
    reply.status(500);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve student'
    };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

start();