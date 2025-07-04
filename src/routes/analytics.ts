import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '@/controllers/analyticsController';
import { validateParams, validateQuery } from '@/middlewares/validation';
import { authenticateToken, instructorOrAdmin, allRoles } from '@/middlewares/auth';
import { z } from 'zod';
import { prisma } from '@/utils/database';

// Helper function to get organization ID dynamically
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

const studentIdParamsSchema = z.object({
  studentId: z.string().uuid('ID do estudante inválido'),
});

const patternsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  instructorId: z.string().uuid().optional(),
  courseProgramId: z.string().uuid().optional(),
});

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Get dropout risk analysis for a student
  fastify.get('/dropout-risk/:studentId', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get dropout risk analysis for a student',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                studentId: { type: 'string' },
                riskScore: { type: 'number' },
                riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                factors: { type: 'array', items: { type: 'string' } },
                recommendations: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      authenticateToken,
      instructorOrAdmin,
      validateParams(studentIdParamsSchema),
    ],
    handler: AnalyticsController.getDropoutRisk,
  });

  // Get progress analysis for a student
  fastify.get('/progress/:studentId', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get martial arts progress analysis for a student',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      authenticateToken,
      allRoles,
      validateParams(studentIdParamsSchema),
    ],
    handler: AnalyticsController.getProgressAnalysis,
  });

  // Get class recommendations for a student
  fastify.get('/recommendations/:studentId', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get AI-powered class recommendations for a student',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      classId: { type: 'string' },
                      score: { type: 'number' },
                      reason: { type: 'string' },
                      priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
                    },
                  },
                },
                insights: { type: 'object' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      authenticateToken,
      allRoles,
      validateParams(studentIdParamsSchema),
    ],
    handler: AnalyticsController.getClassRecommendations,
  });

  // Get attendance patterns analysis
  fastify.get('/patterns', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get attendance patterns analysis',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
          instructorId: { type: 'string', format: 'uuid' },
          courseProgramId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalAttendances: { type: 'number' },
                period: { type: 'string' },
                statusDistribution: { type: 'array' },
                dayOfWeekPattern: { type: 'array' },
                hourOfDayPattern: { type: 'array' },
                topStudents: { type: 'array' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      authenticateToken,
      instructorOrAdmin,
      validateQuery(patternsQuerySchema),
    ],
    handler: AnalyticsController.getAttendancePatterns,
  });

  // GET /api/analytics/:chartType - Get chart data for dashboard
  fastify.get('/:chartType', {
    schema: {
      description: 'Get analytics chart data',
      tags: ['Analytics'],
      params: {
        type: 'object',
        properties: {
          chartType: { type: 'string', enum: ['attendance', 'curriculum', 'churn'] }
        },
        required: ['chartType']
      }
    }
  }, async (request, reply) => {
    try {
      const { chartType } = request.params as { chartType: string };
      const organizationId = await getOrganizationId();
      
      let chartData;
      
      switch (chartType) {
        case 'attendance':
          chartData = await getAttendanceData(organizationId);
          break;
        case 'curriculum':
          chartData = await getCurriculumData(organizationId);
          break;
        case 'churn':
          chartData = await getChurnData(organizationId);
          break;
        default:
          throw new Error('Invalid chart type');
      }

      return {
        success: true,
        data: chartData
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

async function getAttendanceData(organizationId: string) {
  // Get attendance data for the last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  
  const attendanceData = await prisma.attendance.groupBy({
    by: ['createdAt'],
    where: {
      student: {
        organizationId
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      present: true
    },
    _count: {
      id: true
    }
  });
  
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const data = new Array(7).fill(0);
  
  attendanceData.forEach(item => {
    const dayIndex = new Date(item.createdAt).getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday to 6, Monday to 0
    data[adjustedIndex] = item._count.id;
  });
  
  return {
    labels,
    datasets: [{
      label: 'Frequência',
      data,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };
}

async function getCurriculumData(organizationId: string) {
  // Get curriculum progress data
  const progressData = await prisma.studentProgression.groupBy({
    by: ['weekNumber'],
    where: {
      student: {
        organizationId
      }
    },
    _avg: {
      score: true
    },
    _count: {
      id: true
    }
  });
  
  const labels = ['Sem 1-4', 'Sem 5-8', 'Sem 9-12', 'Sem 13-16', 'Sem 17-20', 'Sem 21-24'];
  const data = new Array(6).fill(0);
  
  progressData.forEach(item => {
    const groupIndex = Math.floor((item.weekNumber - 1) / 4);
    if (groupIndex >= 0 && groupIndex < 6) {
      data[groupIndex] = Math.round(item._avg.score || 0);
    }
  });
  
  return {
    labels,
    datasets: [{
      label: 'Progresso Médio (%)',
      data,
      backgroundColor: data.map(value => {
        if (value >= 80) return '#10B981'; // Green
        if (value >= 60) return '#F59E0B'; // Yellow
        return '#EF4444'; // Red
      })
    }]
  };
}

async function getChurnData(organizationId: string) {
  // Calculate churn risk based on attendance rates
  const students = await prisma.student.findMany({
    where: {
      organizationId,
      user: {
        isActive: true
      }
    },
    include: {
      _count: {
        select: {
          attendances: true
        }
      }
    }
  });
  
  let lowRisk = 0;
  let mediumRisk = 0;
  let highRisk = 0;
  
  students.forEach(student => {
    const attendanceCount = student._count.attendances;
    if (attendanceCount >= 15) {
      lowRisk++;
    } else if (attendanceCount >= 8) {
      mediumRisk++;
    } else {
      highRisk++;
    }
  });
  
  return {
    labels: ['Baixo Risco', 'Médio Risco', 'Alto Risco'],
    datasets: [{
      data: [lowRisk, mediumRisk, highRisk],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
    }]
  };
}