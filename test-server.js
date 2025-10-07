// Servidor mínimo para teste
const Fastify = require('fastify');

const server = Fastify({ logger: true });

server.get('/', async (request, reply) => {
  return { hello: 'world' };
});

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Servidor teste rodando na porta 3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();