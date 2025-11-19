import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import AsaasService from '@/services/asaasService';
import { prisma } from '@/utils/database';

// Helper to resolve organizationId from header or first org
async function resolveOrganizationId(request: any): Promise<string> {
  const hdr = request.headers || {};
  const orgId = (hdr['x-organization-id'] as string) || (hdr['x-organization-slug'] as string);
  if (orgId && orgId.includes('-')) return orgId; // assume UUID provided
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found');
  return org.id;
}

export default async function asaasSimpleRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  
  // Check API Key format
  fastify.get('/validate-key', async (_request, _reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      
      if (!apiKey) {
        return {
          success: false,
          error: 'API Key not found',
          suggestion: 'Configure ASAAS_API_KEY in .env file'
        };
      }

      // Check API key format
      const isValidFormat = apiKey.startsWith('$aact_');
      const keyParts = apiKey.split('::');
      
      return {
        success: true,
        data: {
          keyLength: apiKey.length,
          startsWithAact: isValidFormat,
          hasCorrectFormat: keyParts.length === 3,
          keyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`,
          parts: keyParts.length,
          environment: process.env.ASAAS_IS_SANDBOX === 'true' ? 'sandbox' : 'production'
        },
        message: isValidFormat ? 'API Key format looks correct' : 'API Key format may be incorrect'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Validation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Simple test endpoint
  fastify.get('/test', async (_request, reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const baseUrl = process.env.ASAAS_BASE_URL;
      const isSandbox = process.env.ASAAS_IS_SANDBOX;
      
      return {
        success: true,
        message: 'Asaas configuration loaded',
        data: {
          hasApiKey: !!apiKey,
          apiKeyLength: apiKey ? apiKey.length : 0,
          baseUrl: baseUrl || 'not configured',
          sandbox: isSandbox === 'true'
        }
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Configuration error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Get customers from Asaas API (with fallback to mock)
  fastify.get('/customers', async (request, reply) => {
    try {
      // Get API key from environment
      const apiKey = process.env.ASAAS_API_KEY;
      const isSandbox = process.env.ASAAS_IS_SANDBOX === 'true';
      
      if (!apiKey) {
        reply.code(500);
        return {
          success: false,
          error: 'ASAAS_API_KEY not configured',
          message: 'Please set ASAAS_API_KEY in .env file'
        };
      }
      
      const asaasService = new AsaasService(apiKey, isSandbox);
      
      // Get query parameters for pagination
      const { limit = 100, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      try {
        // Try to fetch real customers from Asaas
        const customers = await asaasService.listCustomers({ limit, offset });
        
        return {
          success: true,
          data: customers,
          message: `${customers.totalCount || 0} customers found from Asaas`
        };
      } catch (asaasError: any) {
        // If Asaas API fails (401, invalid key, etc.), return mock data
        console.warn('⚠️ Asaas API failed, using mock data:', asaasError.message);
        
        const mockCustomers = [
          {
            id: 'cus_000001',
            name: 'João Silva',
            email: 'joao@email.com',
            cpfCnpj: '123.456.789-00',
            phone: '(11) 99999-1111',
            dateCreated: '2024-01-15'
          },
          {
            id: 'cus_000002', 
            name: 'Maria Santos',
            email: 'maria@email.com',
            cpfCnpj: '987.654.321-00',
            phone: '(11) 88888-2222',
            dateCreated: '2024-02-20'
          },
          {
            id: 'cus_000003',
            name: 'Pedro Costa',
            email: 'pedro@email.com', 
            cpfCnpj: '456.789.123-00',
            phone: '(11) 77777-3333',
            dateCreated: '2024-03-10'
          }
        ];

        return {
          success: true,
          data: {
            object: 'list',
            hasMore: false,
            totalCount: mockCustomers.length,
            limit: 100,
            offset: 0,
            data: mockCustomers
          },
          message: `${mockCustomers.length} customers (MOCK DATA - Asaas API unavailable: ${asaasError.message})`
        };
      }
    } catch (error) {
      console.error('❌ Error in /customers endpoint:', error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Debug Asaas API response
  fastify.get('/debug', async (_request, _reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const baseUrl = process.env.ASAAS_BASE_URL;
      
      if (!apiKey) {
        return {
          success: false,
          error: 'ASAAS_API_KEY not configured'
        };
      }

      console.log('🔍 Debug Asaas API call...');
      console.log('URL:', `${baseUrl}/customers?limit=5`);
      console.log('API Key length:', apiKey.length);

      // Use correct Asaas authentication format (based on official docs)
      console.log('🔍 Using official Asaas authentication format');
      
      const response = await fetch(`${baseUrl}/customers?limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Krav-Maga-Academy/1.0',
          'access_token': apiKey,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid JSON response',
          details: {
            status: response.status,
            statusText: response.statusText,
            rawResponse: responseText.substring(0, 200),
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }
        };
      }

      return {
        success: response.ok,
        status: response.status,
        data: data,
        message: response.ok ? 'API call successful' : 'API call failed'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network or fetch error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Real Asaas API test (when ready)
  fastify.get('/customers-real', async (_request, reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const baseUrl = process.env.ASAAS_BASE_URL;
      
      if (!apiKey) {
        return reply.code(400 as any).send({
          success: false,
          error: 'ASAAS_API_KEY not configured'
        });
      }

      const response = await fetch(`${baseUrl}/customers?limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Krav-Maga-Academy/1.0',
          'access_token': apiKey,
        },
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        throw new Error(`Asaas API error: ${response.status} - ${data.message || response.statusText}`);
      }

      return {
        success: true,
        data: data,
        message: `${data.data?.length || 0} customers found from Asaas`
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch from Asaas API',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // SYNC: Importar clientes do Asaas -> banco local
  // ==========================================
  fastify.post('/sync/customers', {
    schema: {
      description: 'Sincroniza clientes do Asaas para a tabela local AsaasCustomer',
      tags: ['Asaas'],
      headers: {
        type: 'object',
        properties: {
          'x-organization-id': { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                imported: { type: 'number' },
                updated: { type: 'number' },
                totalRemote: { type: 'number' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const isSandbox = process.env.ASAAS_IS_SANDBOX !== 'false'; // default sandbox
      if (!apiKey) {
        return reply.code(400 as any).send({ success: false, error: 'ASAAS_API_KEY not configured' });
      }

      const organizationId = await resolveOrganizationId(request);
      const asaas = new AsaasService(apiKey, isSandbox);

      const limit = Math.min(Math.max(Number((request.query as any)?.limit ?? 100), 1), 100);
      let offset = 0;
      let hasMore = true;
      let totalRemote = 0;
      let imported = 0;
      let updated = 0;

      while (hasMore) {
        const page: any = await asaas.listCustomers({ offset, limit });
        const items: any[] = page?.data || [];
        totalRemote = page?.totalCount ?? Math.max(totalRemote, items.length + offset);

        // Upsert each customer
        for (const c of items) {
          try {
            // Prepare base data with type conversions
            const baseData = {
              organizationId,
              asaasId: c.id,
              name: c.name,
              cpfCnpj: c.cpfCnpj ?? null,
              email: c.email ?? null,
              phone: c.phone ?? null,
              mobilePhone: c.mobilePhone ?? null,
              postalCode: c.postalCode ?? null,
              address: c.address ?? null,
              addressNumber: c.addressNumber ?? null,
              complement: c.complement ?? null,
              province: c.province ?? null,
              city: c.city ? String(c.city) : null, // Convert to string if present
              state: c.state ?? null,
              externalReference: c.externalReference ?? null,
              isActive: (c.deleted === true) ? false : true
            };

            // Use upsert to handle both create and update atomically
            const { organizationId: _unused, ...updateData } = baseData;
            
            // First check if record exists to track import vs update
            const existingRecord = await prisma.asaasCustomer.findUnique({ 
              where: { asaasId: c.id },
              select: { id: true } // Only select id to minimize data transfer
            });
            
            await prisma.asaasCustomer.upsert({
              where: { asaasId: c.id },
              update: baseData, // For updates, we can use organizationId directly
              create: {
                ...updateData,
                organization: {
                  connect: { id: organizationId }
                }
              }
            });

            // Track statistics based on whether record existed
            if (existingRecord) {
              updated += 1;
            } else {
              imported += 1;
            }
          } catch (err) {
            fastify.log.error({ err, customerId: c?.id }, 'Failed to upsert Asaas customer');
          }
        }

        hasMore = !!page?.hasMore && items.length > 0;
        offset += items.length;
        if (!page || items.length === 0) break;
      }

      return {
        success: true,
        data: { imported, updated, totalRemote },
        message: `Clientes sincronizados: ${imported + updated} (${imported} novos, ${updated} atualizados)`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to sync Asaas customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ==========================================
  // SYNC SINGLE: Importar cliente específico do Asaas
  // ==========================================
  fastify.post('/sync/customer/:asaasId', {
    schema: {
      description: 'Importa um cliente específico do Asaas para a tabela local',
      tags: ['Asaas'],
      headers: {
        type: 'object',
        properties: {
          'x-organization-id': { type: 'string' }
        }
      },
      params: {
        type: 'object',
        properties: {
          asaasId: { type: 'string' }
        },
        required: ['asaasId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                asaasId: { type: 'string' },
                action: { type: 'string' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const isSandbox = process.env.ASAAS_IS_SANDBOX !== 'false';
      if (!apiKey) {
        return reply.code(400 as any).send({ success: false, error: 'ASAAS_API_KEY not configured' });
      }

      const { asaasId } = request.params as any;
      const organizationId = await resolveOrganizationId(request);
      const asaas = new AsaasService(apiKey, isSandbox);

      // Buscar cliente específico no Asaas
      const customer: any = await asaas.getCustomer(asaasId);
      if (!customer) {
        return reply.code(404 as any).send({ 
          success: false, 
          error: 'Customer not found in Asaas',
          message: `Cliente ${asaasId} não encontrado no Asaas`
        });
      }

      // Verificar se já existe localmente
      const existingRecord = await prisma.asaasCustomer.findUnique({ 
        where: { asaasId: customer.id },
        select: { id: true, name: true }
      });

      // Preparar dados para upsert
      const baseData = {
        organizationId,
        asaasId: customer.id,
        name: customer.name,
        cpfCnpj: customer.cpfCnpj ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        mobilePhone: customer.mobilePhone ?? null,
        postalCode: customer.postalCode ?? null,
        address: customer.address ?? null,
        addressNumber: customer.addressNumber ?? null,
        complement: customer.complement ?? null,
        province: customer.province ?? null,
        city: customer.city ? String(customer.city) : null,
        state: customer.state ?? null,
        externalReference: customer.externalReference ?? null,
        isActive: (customer.deleted === true) ? false : true
      };

      // Upsert o cliente
      const { organizationId: _unused, ...updateData } = baseData;
      
      const savedCustomer = await prisma.asaasCustomer.upsert({
        where: { asaasId: customer.id },
        update: baseData,
        create: {
          ...updateData,
          organization: {
            connect: { id: organizationId }
          }
        },
        select: {
          id: true,
          name: true,
          asaasId: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      const action = existingRecord ? 'updated' : 'created';
      
      return {
        success: true,
        data: {
          ...savedCustomer,
          action
        },
        message: `Cliente ${action === 'created' ? 'importado' : 'atualizado'} com sucesso: ${savedCustomer.name}`
      };

    } catch (error) {
      fastify.log.error({ error, asaasId: (request.params as any)?.asaasId }, 'Failed to import single Asaas customer');
      
      return reply.code(500 as any).send({
        success: false,
        error: 'Failed to import customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ==========================================
  // LIST LOCAL: Clientes Asaas sincronizados
  // ==========================================
  fastify.get('/customers/local', {
    schema: {
      description: 'Lista clientes já sincronizados localmente (AsaasCustomer)',
      tags: ['Asaas'],
      headers: {
        type: 'object',
        properties: { 'x-organization-id': { type: 'string' } }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
          q: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const organizationId = await resolveOrganizationId(request);
    const { limit = 50, offset = 0, q } = (request.query as any) || {};

    const where: any = { organizationId };
    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { cpfCnpj: { contains: term } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.asaasCustomer.findMany({ where, skip: offset, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.asaasCustomer.count({ where })
    ]);

    return {
      success: true,
      data: { items, total, offset, limit }
    };
  });
}