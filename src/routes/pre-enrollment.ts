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

      // 1. Procurar usuário existente por CPF ou Email
      const searchConditions: any[] = [];
      if (preEnrollment.cpf) searchConditions.push({ cpf: preEnrollment.cpf });
      if (preEnrollment.email) searchConditions.push({ email: preEnrollment.email });

      let user = null;
      let isUpdate = false;

      if (searchConditions.length > 0) {
        user = await prisma.user.findFirst({
          where: {
            organizationId: organizationId!,
            OR: searchConditions
          }
        });
      }

      // 2. Criar ou Atualizar Usuário
      if (user) {
        logger.info('👤 Found existing user for conversion, updating...', { userId: user.id });
        isUpdate = true;

        // Atualizar dados do usuário
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: preEnrollment.firstName,
            lastName: preEnrollment.lastName,
            phone: preEnrollment.phone,
            avatarUrl: preEnrollment.photoUrl || user.avatarUrl,
            // Mantemos email/cpf se já existiam
          }
        });

      } else {
        logger.info('👤 Creating new user for conversion');
        user = await prisma.user.create({
          data: {
            organizationId: organizationId!,
            email: preEnrollment.email,
            password: 'temp123456', // Temporário
            role: 'STUDENT',
            firstName: preEnrollment.firstName,
            lastName: preEnrollment.lastName,
            phone: preEnrollment.phone,
            cpf: preEnrollment.cpf,
            avatarUrl: preEnrollment.photoUrl
          }
        });
      }

      // 3. Garantir que existe registro de Estudante
      let student = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            organizationId: organizationId!,
            userId: user.id,
            enrollmentDate: new Date(),
            isActive: true
          }
        });
      }

      // 4. Processar Matrícula (Subscription)
      if (preEnrollment.planId) {
        const hasActiveSub = await prisma.subscription.findFirst({
          where: {
            studentId: student.id,
            packageId: preEnrollment.planId,
            status: 'ACTIVE'
          }
        });

        if (!hasActiveSub) {
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
      }

      // 5. Matricular no curso se houver
      if (preEnrollment.courseId) {
        const hasActiveEnrollment = await prisma.courseEnrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: preEnrollment.courseId,
            status: 'ACTIVE'
          }
        });

        if (!hasActiveEnrollment) {
          await prisma.courseEnrollment.create({
            data: {
              studentId: student.id,
              courseId: preEnrollment.courseId,
              enrolledAt: new Date(),
              status: 'ACTIVE'
            }
          });
        }
      }

      // 6. Criar/Vincular Responsável Financeiro
      if (preEnrollment.financialResponsible) {
        const finData = JSON.parse(preEnrollment.financialResponsible as string);

        // Verificar se já existe responsável
        let finResp = await prisma.financialResponsible.findFirst({
          where: {
            organizationId: organizationId!,
            cpfCnpj: finData.cpf
          }
        });

        if (!finResp) {
          finResp = await prisma.financialResponsible.create({
            data: {
              organizationId: organizationId!,
              name: finData.name,
              cpfCnpj: finData.cpf,
              email: finData.email,
              phone: finData.phone
            }
          });
        }

        await prisma.student.update({
          where: { id: student.id },
          data: { financialResponsibleId: finResp.id }
        });
      }

      // 7. Atualizar pré-matrícula
      await prisma.preEnrollment.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          studentId: student.id
        }
      });

      logger.info('✅ Pre-enrollment converted/updated successfully', {
        preEnrollmentId: id,
        studentId: student.id,
        isUpdate
      });

      return reply.send({
        success: true,
        data: {
          student,
          message: isUpdate
            ? 'Dados do aluno atualizados com sucesso!'
            : 'Pré-matrícula convertida e aluno criado com sucesso!'
        }
      });

    } catch (error: any) {
      logger.error('❌ Error converting pre-enrollment:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro ao converter pré-matrícula',
        error: error.message
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
