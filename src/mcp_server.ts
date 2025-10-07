import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

const prisma = new PrismaClient();

interface MCPToolRequest {
  tool: string;
  parameters: Record<string, any>;
  context?: {
    userId?: string;
    organizationId?: string;
    permissions?: string[];
  };
}

interface MCPToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    dataSource: string;
    recordCount?: number;
  };
}

export class MCPServer {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async handleToolRequest(request: MCPToolRequest): Promise<MCPToolResponse> {
    const startTime = Date.now();

    try {
      // Validate permissions
      if (!this.validatePermissions(request)) {
        return {
          success: false,
          error: 'Insufficient permissions for this operation'
        };
      }

      switch (request.tool) {
        case 'getStudentData':
          return await this.getStudentData(request.parameters, startTime);

        case 'getCourseData':
          return await this.getCourseData(request.parameters, startTime);

        case 'executeQuery':
          return await this.executeQuery(request.parameters, startTime);

        case 'getSystemAnalytics':
          return await this.getSystemAnalytics(request.parameters, startTime);

        default:
          return {
            success: false,
            error: `Unknown tool: ${request.tool}`
          };
      }
    } catch (error) {
      console.error('MCP Tool execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private validatePermissions(request: MCPToolRequest): boolean {
    const userPermissions = request.context?.permissions || [];
    const requiredPermissions = this.getRequiredPermissions(request.tool);

    return requiredPermissions.some(permission =>
      userPermissions.includes(permission)
    );
  }

  private getRequiredPermissions(tool: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'getStudentData': ['STAFF', 'ADMIN', 'AGENT'],
      'getCourseData': ['STAFF', 'ADMIN', 'AGENT'],
      'executeQuery': ['ADMIN', 'AGENT'],
      'getSystemAnalytics': ['ADMIN', 'AGENT']
    };

    return permissionMap[tool] || [];
  }

  private async getStudentData(
    params: Record<string, any>,
    startTime: number
  ): Promise<MCPToolResponse> {
    const { studentId, organizationId, includeHistory = false } = params;

    if (!studentId) {
      return { success: false, error: 'studentId is required' };
    }

    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              birthDate: true
            }
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: {
              plan: {
                select: {
                  name: true,
                  description: true,
                  price: true
                }
              }
            }
          },
          attendances: includeHistory ? {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              class: {
                select: {
                  title: true,
                  date: true,
                  startTime: true,
                  endTime: true
                }
              }
            }
          } : false
        }
      });

      if (!student) {
        return { success: false, error: 'Student not found' };
      }

      // Get course progress
      const courseProgress = await this.getStudentCourseProgress(studentId);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          student: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            email: student.user.email,
            phone: student.user.phone,
            birthDate: student.user.birthDate,
            category: student.category,
            isActive: student.isActive,
            emergencyContact: student.emergencyContact,
            medicalConditions: student.medicalConditions
          },
          subscriptions: student.subscriptions,
          courseProgress,
          recentAttendance: includeHistory ? student.attendances : undefined
        },
        metadata: {
          executionTime,
          dataSource: 'prisma',
          recordCount: 1
        }
      };
    } catch (error) {
      console.error('Error in getStudentData:', error);
      return {
        success: false,
        error: 'Failed to retrieve student data'
      };
    }
  }

  private async getCourseData(
    params: Record<string, any>,
    startTime: number
  ): Promise<MCPToolResponse> {
    const { courseId, organizationId, includeStudents = false } = params;

    if (!courseId) {
      return { success: false, error: 'courseId is required' };
    }

    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          classes: {
            where: { status: 'SCHEDULED' },
            orderBy: { date: 'asc' },
            take: 10
          },
          studentCourses: includeStudents ? {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          } : false
        }
      });

      if (!course) {
        return { success: false, error: 'Course not found' };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          course: {
            id: course.id,
            name: course.name,
            description: course.description,
            category: course.category,
            level: course.level,
            duration: course.duration,
            requirements: course.requirements
          },
          upcomingClasses: course.classes,
          enrolledStudents: includeStudents ? course.studentCourses?.map((sc: any) => ({
            id: sc.student.id,
            name: `${sc.student.user.firstName} ${sc.student.user.lastName}`,
            status: sc.status,
            startDate: sc.startDate
          })) : undefined
        },
        metadata: {
          executionTime,
          dataSource: 'prisma',
          recordCount: 1
        }
      };
    } catch (error) {
      console.error('Error in getCourseData:', error);
      return {
        success: false,
        error: 'Failed to retrieve course data'
      };
    }
  }

  private async executeQuery(
    params: Record<string, any>,
    startTime: number
  ): Promise<MCPToolResponse> {
    const { query, organizationId, limit = 100 } = params;

    if (!query) {
      return { success: false, error: 'query is required' };
    }

    try {
      // Basic query validation (this should be enhanced with proper SQL injection protection)
      const allowedQueries = [
        'SELECT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
      ];

      const upperQuery = query.toUpperCase();
      const isAllowed = allowedQueries.some(keyword =>
        upperQuery.includes(keyword)
      );

      if (!isAllowed) {
        return { success: false, error: 'Query type not allowed' };
      }

      // Execute the query using Prisma's $queryRaw
      const result = await prisma.$queryRaw(query);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: Array.isArray(result) ? result.slice(0, limit) : result,
        metadata: {
          executionTime,
          dataSource: 'prisma',
          recordCount: Array.isArray(result) ? result.length : 1
        }
      };
    } catch (error) {
      console.error('Error in executeQuery:', error);
      return {
        success: false,
        error: 'Failed to execute query'
      };
    }
  }

  private async getSystemAnalytics(
    params: Record<string, any>,
    startTime: number
  ): Promise<MCPToolResponse> {
    const { organizationId, timeRange = '30_days', metrics = ['students', 'courses', 'attendance'] } = params;

    try {
      const analytics: Record<string, any> = {};

      if (metrics.includes('students')) {
        const whereClause = organizationId ? { organizationId } : undefined;
        
        const totalStudents = await prisma.student.count({
          where: whereClause
        });

        const activeStudents = await prisma.student.count({
          where: {
            ...(organizationId && { organizationId }),
            isActive: true
          }
        });

        analytics.students = {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents
        };
      }

      if (metrics.includes('courses')) {
        const whereClause = organizationId ? { organizationId } : undefined;
        
        const totalCourses = await prisma.course.count({
          where: whereClause
        });

        analytics.courses = {
          total: totalCourses
        };
      }

      if (metrics.includes('attendance')) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentAttendance = await prisma.attendance.count({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            ...(organizationId && {
              student: { organizationId }
            })
          }
        });

        analytics.attendance = {
          last30Days: recentAttendance
        };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: analytics,
        metadata: {
          executionTime,
          dataSource: 'prisma',
          recordCount: Object.keys(analytics).length
        }
      };
    } catch (error) {
      console.error('Error in getSystemAnalytics:', error);
      return {
        success: false,
        error: 'Failed to retrieve system analytics'
      };
    }
  }

  private async getStudentCourseProgress(studentId: string): Promise<any[]> {
    try {
      const subscriptions = await prisma.studentSubscription.findMany({
        where: {
          studentId,
          status: 'ACTIVE'
        },
        include: {
          plan: {
            include: {
              planCourses: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      });

      const progress = [];

      for (const subscription of subscriptions) {
        for (const planCourse of subscription.plan.planCourses) {
          const course = planCourse.course;

          const attendances = await prisma.attendance.count({
            where: {
              studentId,
              class: {
                courseId: course.id
              }
            }
          });

          const totalClasses = course.duration || 0;
          const progressPercentage = totalClasses > 0 ?
            Math.round((attendances / totalClasses) * 100) : 0;

          progress.push({
            courseId: course.id,
            courseName: course.name,
            totalClasses,
            attendedClasses: attendances,
            progressPercentage,
            subscriptionName: subscription.plan.name
          });
        }
      }

      return progress;
    } catch (error) {
      console.error('Error getting course progress:', error);
      return [];
    }
  }
}

export default MCPServer;
