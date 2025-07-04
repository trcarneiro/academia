// Simple server test
require('dotenv').config();
const Fastify = require('fastify');

const server = Fastify({
  logger: true
});

// Simple health check
server.get('/health', async () => {
  return { status: 'ok', time: new Date().toISOString() };
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Simple server running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();