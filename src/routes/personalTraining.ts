import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PersonalTrainingController } from '@/controllers/personalTrainingController';

export default async function personalTrainingRoutes(fastify: FastifyInstance) {
  // Add request logging for debugging
  fastify.addHook('onRequest', async (request, _reply) => {
    fastify.log.info(`Personal Training route - ${request.method} ${request.url}`);
  });

  // Personal Training Classes Routes
  
  // Create a new personal training class
  fastify.post('/classes', {
    schema: {
      body: {
        type: 'object',
        required: ['studentId', 'instructorId', 'title', 'focusAreas'],
        properties: {
          studentId: { type: 'string' },
          instructorId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          focusAreas: { type: 'array', items: { type: 'string' } },
          trainingType: { type: 'string', enum: ['INDIVIDUAL', 'SEMI_PRIVATE', 'SMALL_GROUP'] },
          intensity: { type: 'string' },
          duration: { type: 'number', minimum: 30, maximum: 180 },
          location: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, PersonalTrainingController.createPersonalClass);

  // Get personal classes for a student
  fastify.get('/classes/student/:studentId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' }
        },
        required: ['studentId']
      }
    }
  }, PersonalTrainingController.getStudentPersonalClasses);

  // Get personal classes for an instructor
  fastify.get('/classes/instructor/:instructorId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          instructorId: { type: 'string' }
        },
        required: ['instructorId']
      }
    }
  }, PersonalTrainingController.getInstructorPersonalClasses);

  // Personal Training Sessions Routes
  
  // Create a new session
  fastify.post('/sessions', {
    schema: {
      body: {
        type: 'object',
        required: ['personalClassId', 'date', 'startTime', 'endTime'],
        properties: {
          personalClassId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          startTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
          endTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
          location: { type: 'string' }
        }
      }
    }
  }, PersonalTrainingController.createSession);

  // Update session status and details
  fastify.patch('/sessions/:sessionId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
          attendanceConfirmed: { type: 'boolean' },
          studentNotes: { type: 'string' },
          instructorNotes: { type: 'string' },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          feedback: { type: 'string' },
          actualDuration: { type: 'number', minimum: 1 }
        }
      }
    }
  }, PersonalTrainingController.updateSession);

  // Get available time slots
  fastify.get('/slots/available', {
    schema: {
      querystring: {
        type: 'object',
        required: ['instructorId', 'date'],
        properties: {
          instructorId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          duration: { type: 'string', pattern: '^[0-9]+$' }
        }
      }
    }
  }, PersonalTrainingController.getAvailableSlots);

  // Student Preferences Routes
  
  // Set student preferences
  fastify.post('/preferences', {
    schema: {
      body: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' },
          preferredDays: { type: 'array', items: { type: 'string' } },
          preferredTimes: { type: 'array', items: { type: 'string' } },
          preferredInstructors: { type: 'array', items: { type: 'string' } },
          trainingFocus: { type: 'array', items: { type: 'string' } },
          intensity: { type: 'string' },
          sessionDuration: { type: 'number', minimum: 30, maximum: 180 },
          maxSessionsPerWeek: { type: 'number', minimum: 1, maximum: 7 },
          notes: { type: 'string' }
        }
      }
    }
  }, PersonalTrainingController.setStudentPreferences);

  // Get student preferences
  fastify.get('/preferences/:studentId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' }
        },
        required: ['studentId']
      }
    }
  }, PersonalTrainingController.getStudentPreferences);

  // Schedule and Analytics Routes
  
  // Get instructor schedule for date range
  fastify.get('/schedule/instructor/:instructorId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          instructorId: { type: 'string' }
        },
        required: ['instructorId']
      },
      querystring: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, PersonalTrainingController.getInstructorSchedule);

  // Get personal training statistics
  fastify.get('/stats', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          organizationId: { type: 'string' },
          studentId: { type: 'string' },
          instructorId: { type: 'string' }
        }
      }
    }
  }, PersonalTrainingController.getPersonalTrainingStats);

  // Additional utility endpoints
  
  // Get all available instructors for personal training
  fastify.get('/instructors/available', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Mock data for available instructors
      const mockInstructors = [
        {
          id: 'inst-maria',
          name: 'Prof. Maria Silva',
          specializations: ['Krav Maga Feminino', 'Autodefesa'],
          martialArts: ['Krav Maga'],
          bio: 'Especialista em Krav Maga Feminino com 8 anos de experiência',
          hourlyRate: 120,
          isAvailable: true
        },
        {
          id: 'inst-ana',
          name: 'Prof. Ana Santos',
          specializations: ['Condicionamento', 'Personal Training'],
          martialArts: ['Krav Maga', 'Fitness'],
          bio: 'Personal trainer e instrutora de Krav Maga',
          hourlyRate: 100,
          isAvailable: true
        }
      ];

      return reply.send({
        success: true,
        data: mockInstructors
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Get personal training dashboard data
  fastify.get('/dashboard/:studentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = request.params as any;
      const studentId = params.studentId;

      // Mock dashboard data for Lorraine
      const mockDashboardData = {
        summary: {
          totalClasses: 1,
          totalSessions: 5,
          upcomingSessionsCount: 2,
          completedSessionsCount: 3
        },
        personalClasses: [{
          id: 'pt-lorraine-1',
          title: 'Krav Maga Feminino - Personal da Lorraine',
          instructor: {
            user: { firstName: 'Prof.', lastName: 'Maria Silva' }
          },
          _count: { sessions: 5 }
        }],
        upcomingSessions: [
          {
            id: 'session-upcoming-1',
            date: new Date('2025-09-20T08:00:00'),
            startTime: new Date('2025-09-20T08:00:00'),
            endTime: new Date('2025-09-20T09:00:00'),
            status: 'SCHEDULED',
            personalClass: {
              instructor: { user: { firstName: 'Prof.', lastName: 'Maria Silva' } }
            }
          }
        ],
        recentSessions: [
          {
            id: 'session-completed-1',
            date: new Date('2025-09-15T08:00:00'),
            status: 'COMPLETED',
            rating: 5,
            personalClass: {
              instructor: { user: { firstName: 'Prof.', lastName: 'Maria Silva' } }
            }
          }
        ],
        preferences: {
          preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          preferredTimes: ['08:00', '09:00'],
          trainingFocus: ['Técnicas de escape', 'Condicionamento']
        }
      };

      return reply.send({
        success: true,
        data: mockDashboardData
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });
}