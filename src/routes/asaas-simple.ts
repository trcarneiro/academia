import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function asaasSimpleRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // Check API Key format
  fastify.get('/validate-key', async (request, reply) => {
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
  fastify.get('/test', async (request, reply) => {
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

  // Mock customers endpoint for testing
  fastify.get('/customers', async (request, reply) => {
    try {
      // Return mock data first to test the interface
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
        message: `${mockCustomers.length} customers found (mock data)`
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // Debug Asaas API response
  fastify.get('/debug', async (request, reply) => {
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
  fastify.get('/customers-real', async (request, reply) => {
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
}