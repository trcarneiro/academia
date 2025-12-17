// @ts-nocheck
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

// Simple Asaas API integration - busca TODOS os clientes com paginaÃ§Ã£o
async function fetchAsaasCustomers() {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
  
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY not configured');
  }

  try {
    const allCustomers: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    console.log('[Asaas] Iniciando busca de todos os clientes...');
    
    while (hasMore) {
      const response = await fetch(`${baseUrl}/customers?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Asaas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { data?: any[]; hasMore?: boolean };
      
      if (data.data && data.data.length > 0) {
        allCustomers.push(...data.data);
        console.log(`[Asaas] Carregados ${allCustomers.length} clientes (offset: ${offset})`);
      }
      
      hasMore = data.hasMore === true;
      offset += limit;
      
      // SeguranÃ§a: limite mÃ¡ximo de 10 pÃ¡ginas (1000 clientes)
      if (offset >= 1000) {
        console.log('[Asaas] Limite de 1000 clientes atingido');
        break;
      }
    }
    
    console.log(`[Asaas] Total de clientes carregados: ${allCustomers.length}`);
    
    return {
      object: 'list',
      hasMore: false,
      totalCount: allCustomers.length,
      limit: allCustomers.length,
      offset: 0,
      data: allCustomers
    };
  } catch (error) {
    console.error('Error fetching Asaas customers:', error);
    throw error;
  }
}

export default async function asaasImportRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // GET /api/asaas/customers - List all customers from Asaas
  fastify.get('/customers', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              properties: {
                object: { type: 'string' },
                hasMore: { type: 'boolean' },
                totalCount: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                data: { 
                  type: 'array',
                  items: { type: 'object', additionalProperties: true }
                }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const asaasData = await fetchAsaasCustomers() as any;
      
      return {
        success: true,
        data: asaasData,
        message: `${asaasData.data?.length || 0} customers found`
      };
    } catch (error) {
      reply.status(500);
      return {
        success: false,
        error: 'Failed to fetch customers from Asaas',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // GET /api/asaas/test - Test Asaas connection
  fastify.get('/test', {
    schema: {
    }
  }, async (request, reply) => {
    try {
      const apiKey = process.env.ASAAS_API_KEY;
      const baseUrl = process.env.ASAAS_BASE_URL;
      
      if (!apiKey) {
        reply.code(400);
        return {
          success: false,
          error: 'ASAAS_API_KEY not configured'
        };
      }

      // Test with a simple API call
      const response = await fetch(`${baseUrl}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'access_token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      return {
        success: true,
        message: 'Asaas API connection successful',
        data: {
          baseUrl,
          status: response.status,
          sandbox: process.env.ASAAS_IS_SANDBOX === 'true'
        }
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Asaas API connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
