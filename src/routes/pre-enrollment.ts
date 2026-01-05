// src/routes/pre-enrollment.ts
// Public pre-enrollment route (no authentication required)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

interface PreEnrollmentPayload {
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate?: string;
  photoUrl?: string;
  planId?: string;
  courseId?: string;
  customPrice?: number;
  financialResponsible?: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  source: string;
}

interface GenerateLinkPayload {
  planId: string;
  courseId?: string;
  customPrice?: number;
  expiresIn?: number; // dias
}

export default async function preEnrollmentRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /api/pre-enrollment
   * Create a pre-enrollment (public, no auth required)
   */
  fastify.post('/', async (request: FastifyRequest<{ Body: PreEnrollmentPayload }>, reply: FastifyReply) => {
    try {
      const {
        firstName,
        lastName,
        cpf,
        phone,
        email,
        birthDate,
        photoUrl,
        planId,
        courseId,
        customPrice,
        financialResponsible,
        source
      } = request.body;

      logger.info('📝 New pre-enrollment received', { email, source });

      // Verificar se já existe
      const existing = await prisma.preEnrollment.findFirst({
        where: {
          OR: [
            { email },
            { cpf }
          ]
        }
      });

      if (existing) {
        return reply.code(400).send({
          success: false,
          message: 'Email ou CPF já cadastrado'
        });
      }

      // Criar pré-matrícula
      const preEnrollment = await prisma.preEnrollment.create({
        data: {
          firstName,
          lastName,
          cpf,
          phone,
          email,
          birthDate: birthDate ? new Date(birthDate) : null,
          photoUrl,
          planId,
          courseId,
          customPrice,
          financialResponsible: financialResponsible ? JSON.stringify(financialResponsible) : null,
          source,
          status: 'PENDING'
        }
      });

      // TODO: Enviar email de confirmação
      // TODO: Notificar administrador

      logger.info('✅ Pre-enrollment created', { id: preEnrollment.id });

      return reply.send({
        success: true,
        data: {
          id: preEnrollment.id,
          message: 'Pré-matrícula realizada com sucesso! Em breve entraremos em contato.'
        }
      });

    } catch (error: any) {
      logger.error('❌ Error creating pre-enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao processar pré-matrícula'
      });
    }
  });

  /**
   * GET /api/pre-enrollment
   * List all pre-enrollments (requires auth)
   */
  fastify.get('/', async (request, reply: FastifyReply) => {
    try {
      const preEnrollments = await prisma.preEnrollment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              name: true,
              price: true
            }
          },
          course: {
            select: {
              name: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: preEnrollments
      });

    } catch (error: any) {
      logger.error('❌ Error listing pre-enrollments:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao listar pré-matrículas'
      });
    }
  });

  /**
   * POST /api/pre-enrollment/:id/convert
   * Convert pre-enrollment to actual student
   */
  fastify.post('/:id/convert', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const organizationId = request.organizationId;

      const preEnrollment = await prisma.preEnrollment.findUnique({
        where: { id }
      });

      if (!preEnrollment) {
        return reply.code(404).send({
          success: false,
          message: 'Pré-matrícula não encontrada'
        });
      }

      if (preEnrollment.status === 'CONVERTED') {
        return reply.code(400).send({
          success: false,
          message: 'Pré-matrícula já convertida'
        });
      }

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          organizationId: organizationId!,
          email: preEnrollment.email,
          password: 'temp123456', // Temporário
          role: 'STUDENT',
          firstName: preEnrollment.firstName,
          lastName: preEnrollment.lastName,
          phone: preEnrollment.phone,
          avatarUrl: preEnrollment.photoUrl
        }
      });

      // Criar estudante
      const student = await prisma.student.create({
        data: {
          organizationId: organizationId!,
          userId: user.id,
          enrollmentDate: new Date()
        }
      });

      // Criar matrícula no plano se houver
      if (preEnrollment.planId) {
        await prisma.subscription.create({
          data: {
            studentId: student.id,
            packageId: preEnrollment.planId,
            organizationId: organizationId!,
            status: 'ACTIVE',
            startDate: new Date(),
            currentPrice: preEnrollment.customPrice || 0
          }
        });
      }

      // Matricular no curso se houver
      if (preEnrollment.courseId) {
        await prisma.courseEnrollment.create({
          data: {
            studentId: student.id,
            courseId: preEnrollment.courseId,
            enrolledAt: new Date()
          }
        });
      }

      // Criar responsável financeiro se houver
      if (preEnrollment.financialResponsible) {
        const finData = JSON.parse(preEnrollment.financialResponsible as string);
        await prisma.financialResponsible.create({
          data: {
            organizationId: organizationId!,
            name: finData.name,
            cpf: finData.cpf,
            email: finData.email,
            phone: finData.phone,
            students: {
              connect: { id: student.id }
            }
          }
        });
      }

      // Atualizar pré-matrícula
      await prisma.preEnrollment.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          studentId: student.id
        }
      });

      logger.info('✅ Pre-enrollment converted to student', { 
        preEnrollmentId: id, 
        studentId: student.id 
      });

      return reply.send({
        success: true,
        data: {
          student,
          message: 'Pré-matrícula convertida com sucesso!'
        }
      });

    } catch (error: any) {
      logger.error('❌ Error converting pre-enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao converter pré-matrícula'
      });
    }
  });

  /**
   * POST /api/pre-enrollment/generate-link
   * Generate public enrollment link with pre-filled data
   */
  fastify.post('/generate-link', async (request: FastifyRequest<{ Body: GenerateLinkPayload }>, reply: FastifyReply) => {
    try {
      const { planId, courseId, customPrice, expiresIn = 30 } = request.body;
      const organizationId = request.organizationId;

      // Criar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      // Salvar link gerado
      const enrollmentLink = await prisma.enrollmentLink.create({
        data: {
          organizationId: organizationId!,
          token,
          planId,
          courseId,
          customPrice,
          expiresAt,
          isActive: true
        },
        include: {
          plan: {
            select: { name: true, price: true }
          },
          course: {
            select: { name: true }
          }
        }
      });

      // Gerar URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/pre-enrollment.html?plan=${planId}${courseId ? `&course=${courseId}` : ''}${customPrice ? `&price=${customPrice}` : ''}`;

      logger.info('✅ Enrollment link generated', { token, url });

      return reply.send({
        success: true,
        data: {
          link: enrollmentLink,
          url,
          expiresAt
        }
      });

    } catch (error: any) {
      logger.error('❌ Error generating link:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao gerar link'
      });
    }
  });

  /**
   * PUT /api/pre-enrollment/:id
   * Update pre-enrollment
   */
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      const preEnrollment = await prisma.preEnrollment.update({
        where: { id },
        data: updates
      });

      return reply.send({
        success: true,
        data: preEnrollment
      });

    } catch (error: any) {
      logger.error('❌ Error updating pre-enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao atualizar pré-matrícula'
      });
    }
  });

  /**
   * POST /api/pre-enrollment/:id/notes
   * Add note to pre-enrollment
   */
  fastify.post('/:id/notes', async (request: FastifyRequest<{ Params: { id: string }, Body: { note: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { note } = request.body;

      const preEnrollment = await prisma.preEnrollment.findUnique({
        where: { id }
      });

      if (!preEnrollment) {
        return reply.code(404).send({
          success: false,
          message: 'Pré-matrícula não encontrada'
        });
      }

      // Concatenar nota existente
      const currentNotes = preEnrollment.notes || '';
      const timestamp = new Date().toLocaleString('pt-BR');
      const newNotes = currentNotes 
        ? `${currentNotes}\n\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;

      const updated = await prisma.preEnrollment.update({
        where: { id },
        data: { notes: newNotes }
      });

      return reply.send({
        success: true,
        data: updated
      });

    } catch (error: any) {
      logger.error('❌ Error adding note:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao adicionar nota'
      });
    }
  });

  /**
   * DELETE /api/pre-enrollment/:id
   * Reject/delete pre-enrollment
   */
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      await prisma.preEnrollment.update({
        where: { id },
        data: { status: 'REJECTED' }
      });

      return reply.send({
        success: true,
        message: 'Pré-matrícula rejeitada'
      });

    } catch (error: any) {
      logger.error('❌ Error rejecting pre-enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao rejeitar pré-matrícula'
      });
    }
  });
}
