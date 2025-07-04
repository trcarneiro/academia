// Working Krav Maga Academy Server
require('dotenv').config();
const Fastify = require('fastify');
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
  root: __dirname,
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
  return reply.sendFile('public/index.html');
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
      gender = 'MASCULINO'
    } = request.body;

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

      return student;
    });

    return {
      success: true,
      data: result,
      message: 'Student created successfully'
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

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🥋 Krav Maga Academy API Server running!');
    console.log('🌐 URL: http://localhost:3000');
    console.log('📊 DASHBOARD BÁSICO: http://localhost:3000/dashboard');
    console.log('🚀 ULTIMATE DASHBOARD: http://localhost:3000/ultimate');
    console.log('❤️  Health: http://localhost:3000/health');
    console.log('🏢 Organizations: http://localhost:3000/api/organizations');
    console.log('👥 Students: http://localhost:3000/api/students');
    console.log('🥊 Techniques: http://localhost:3000/api/techniques');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

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
            name: true
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  await server.close();
  process.exit(0);
});

start();