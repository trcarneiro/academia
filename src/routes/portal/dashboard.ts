import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { generateAccessQrCode } from '@/services/portal/authService';

export default async function portalDashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', portalAuthMiddleware);

  fastify.get('/access-qrcode', async (request, reply) => {
    const studentId = request.studentId;
    const organizationId = request.organizationId;
    
    if (!studentId || !organizationId) {
      return ResponseHelper.error(reply, 'Dados de autenticação incompletos', 400);
    }

    try {
      const qrCode = await generateAccessQrCode(studentId, organizationId);
      return ResponseHelper.success(reply, { qrCode });
    } catch (error) {
      request.log.error(error);
      return ResponseHelper.error(reply, 'Erro ao gerar QR Code', 500);
    }
  });

  fastify.get('/', async (request, reply) => {
    const studentId = request.studentId;
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      // Fetch student data
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          enrollments: {
            include: {
              course: true
            }
          },
          techniqueProgress: true,
          attendances: {
            take: 10,
            orderBy: { checkInTime: 'desc' }
          }
        }
      });

      if (!student) {
        return ResponseHelper.error(reply, 'Aluno não encontrado', 404);
      }

      // Security check: Ensure student belongs to the authenticated organization
      if (student.user.organizationId !== request.organizationId) {
        return ResponseHelper.error(reply, 'Acesso negado', 403);
      }

      // Calculate stats (mocked for now or simple logic)
      const stats = {
        nextClass: {
          date: new Date(Date.now() + 86400000).toISOString(), // Mock: tomorrow
          name: student.enrollments[0]?.course.name || 'Krav Maga'
        },
        financial: {
          status: 'OK', // TODO: Check Asaas
          nextDueDate: new Date(Date.now() + 5 * 86400000).toISOString()
        },
        frequency: {
          percentage: 85, // TODO: Calculate real frequency
          label: 'este mês'
        },
        progress: {
          current: student.techniqueProgress.length,
          total: 48, // TODO: Get from course
          label: 'técnicas'
        }
      };

      return ResponseHelper.success(reply, {
        student: {
          name: `${student.user.firstName} ${student.user.lastName}`,
          belt: 'Branca', // TODO: Get belt from graduation
          since: student.enrollmentDate
        },
        stats
      });

    } catch (error: any) {
      console.error(error);
      return ResponseHelper.error(reply, `Erro ao carregar dashboard: ${error.message}`, 500);
    }
  });
}
