// Test endpoint for debugging turmas update
import { FastifyInstance } from 'fastify';

export default async function testRoutes(fastify: FastifyInstance) {
  // Debug endpoint for turmas update
  fastify.put('/test/turmas/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      console.log('🔧 TEST ENDPOINT - Update request for ID:', id);
      console.log('🔧 TEST ENDPOINT - Request body:', JSON.stringify(request.body, null, 2));
      console.log('🔧 TEST ENDPOINT - Request headers:', JSON.stringify(request.headers, null, 2));
      
      // Just return success without doing anything
      return {
        success: true,
        message: 'Test endpoint - data received successfully',
        receivedData: request.body,
        id: id
      };
      
    } catch (error) {
      console.error('🔧 TEST ENDPOINT - Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Test endpoint error: ' + error.message
      });
    }
  });
}
