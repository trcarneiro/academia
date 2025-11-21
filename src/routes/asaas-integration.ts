import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

interface ImportCustomerBody {
  customerId: string;
}

// Fetch customer details from Asaas
async function fetchAsaasCustomer(customerId: string): Promise<any> {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY not configured');
  }

  try {
    const response = await fetch(`${baseUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Asaas API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching Asaas customer:', error);
    throw error;
  }
}

export default async function asaasIntegrationRoutes(fastify: FastifyInstance) {
  // POST /api/asaas/import-customer - Import single customer
  fastify.post<{ Body: ImportCustomerBody }>(
    '/import-customer',
    async (request, reply: FastifyReply) => {
      try {
        const { customerId } = request.body;
        const organizationId = request.headers['x-organization-id'] as string;

        if (!organizationId) {
          return reply.code(400).send({
            success: false,
            message: 'Organization ID is required',
          });
        }

        if (!customerId) {
          return reply.code(400).send({
            success: false,
            message: 'Customer ID is required',
          });
        }

        logger.info(`Importing customer ${customerId} for organization ${organizationId}`);

        // Fetch customer from Asaas
        const asaasCustomer = await fetchAsaasCustomer(customerId);

        if (!asaasCustomer.email) {
          return reply.code(400).send({
            success: false,
            message: 'Customer has no email address',
          });
        }

        // Check if user already exists (using findFirst with composite filter)
        const existingUser = await prisma.user.findFirst({
          where: {
            email: asaasCustomer.email.toLowerCase(),
            organizationId,
          },
        });

        if (existingUser) {
          return reply.code(409).send({
            success: false,
            message: 'Customer already exists in the system',
          });
        }

        // Parse name
        const names = (asaasCustomer.name || '').trim().split(' ');
        const firstName = names[0] || asaasCustomer.name;
        const lastName = names.slice(1).join(' ') || '';

        // Generate temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15);

        // Create user and student in transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email: asaasCustomer.email.toLowerCase(),
              password: tempPassword,
              firstName,
              lastName,
              phone: asaasCustomer.phone || asaasCustomer.mobilePhone || '',
              cpf: asaasCustomer.cpfCnpj || '',
              role: 'STUDENT',
              isActive: true,
              organizationId,
            },
          });

          // Create student
          const student = await tx.student.create({
            data: {
              userId: user.id,
              organizationId,
              category: 'ADULT', // StudentCategory enum value
              gender: 'MASCULINO', // Gender enum value (default)
              physicalCondition: 'INICIANTE', // PhysicalCondition enum value
              specialNeeds: [],
              medicalConditions: `Imported from Asaas on ${new Date().toLocaleDateString('pt-BR')} - Customer ID: ${customerId}`,
              enrollmentDate: new Date(),
              isActive: true,
            },
          });

          return { user, student };
        });

        logger.info(`Customer ${asaasCustomer.name} imported successfully`);

        return reply.send({
          success: true,
          data: {
            userId: result.user.id,
            studentId: result.student.id,
            name: asaasCustomer.name,
          },
          message: `${asaasCustomer.name} importado com sucesso`,
        });
      } catch (error) {
        logger.error('Error importing customer:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return reply.code(500).send({
          success: false,
          message: 'Failed to import customer',
          error: errorMessage,
        });
      }
    }
  );

  // POST /api/asaas/import-batch - Import multiple customers
  fastify.post('/import-batch', async (request, reply: FastifyReply) => {
    try {
      const { customerIds } = request.body as { customerIds: string[] };
      const organizationId = request.headers['x-organization-id'] as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      if (!customerIds || !Array.isArray(customerIds)) {
        return reply.code(400).send({
          success: false,
          message: 'Customer IDs array is required',
        });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const customerId of customerIds) {
        try {
          const asaasCustomer = await fetchAsaasCustomer(customerId);

          if (!asaasCustomer.email) {
            results.failed++;
            results.errors.push(`${asaasCustomer.name}: No email provided`);
            continue;
          }

          // Check if exists
          const existingUser = await prisma.user.findFirst({
            where: {
              email: asaasCustomer.email.toLowerCase(),
              organizationId,
            },
          });

          if (existingUser) {
            results.failed++;
            results.errors.push(`${asaasCustomer.name}: Already exists`);
            continue;
          }

          // Parse name
          const names = (asaasCustomer.name || '').trim().split(' ');
          const firstName = names[0] || asaasCustomer.name;
          const lastName = names.slice(1).join(' ') || '';

          // Generate temporary password
          const tempPassword = Math.random().toString(36).substring(2, 15);

          // Create user and student
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email: asaasCustomer.email.toLowerCase(),
                password: tempPassword,
                firstName,
                lastName,
                phone: asaasCustomer.phone || asaasCustomer.mobilePhone || '',
                cpf: asaasCustomer.cpfCnpj || '',
                role: 'STUDENT',
                isActive: true,
                organizationId,
              },
            });

            await tx.student.create({
              data: {
                userId: user.id,
                organizationId,
                category: 'ADULT',
                gender: 'MASCULINO',
                physicalCondition: 'INICIANTE',
                specialNeeds: [],
                medicalConditions: `Imported from Asaas on ${new Date().toLocaleDateString('pt-BR')} - Customer ID: ${customerId}`,
                enrollmentDate: new Date(),
                isActive: true,
              },
            });
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return reply.send({
        success: true,
        data: results,
        message: `Imported ${results.success} of ${customerIds.length} customers`,
      });
    } catch (error) {
      logger.error('Error in batch import:', error);

      return reply.code(500).send({
        success: false,
        message: 'Failed to import customers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
