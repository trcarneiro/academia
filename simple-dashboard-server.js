// Simple server to serve the Ultimate Dashboard
const fastify = require('fastify')({ logger: true });
const path = require('path');

// Register static files
fastify.register(require('@fastify/static'), {
  root: __dirname,
  prefix: '/'
});

// Routes
fastify.get('/', async (request, reply) => {
  return reply.sendFile('public/index.html');
});

fastify.get('/ultimate', async (request, reply) => {
  return reply.sendFile('public/index.html');
});

fastify.get('/dashboard', async (request, reply) => {
  return reply.sendFile('dashboard.html');
});

fastify.get('/test', async (request, reply) => {
  return reply.sendFile('dashboard-test.html');
});

fastify.get('/health', async () => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Ultimate Dashboard Server Running!'
  };
});

// Mock API endpoints for the dashboard
fastify.get('/api/students', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'João Santos',
        category: 'Adult',
        progress: 85,
        attendance: 92,
        risk: 'low',
        status: 'active'
      },
      {
        id: 2,
        name: 'Maria Silva', 
        category: 'Master 1',
        progress: 76,
        attendance: 88,
        risk: 'low',
        status: 'active'
      }
    ]
  };
});

fastify.get('/api/organizations', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Elite Krav Maga Academy',
        slug: 'elite-krav-maga',
        studentsCount: 156,
        isActive: true
      }
    ]
  };
});

fastify.get('/api/techniques', async () => {
  return {
    success: true,
    data: [
      {
        id: 1,
        name: 'Guarda de Boxe',
        category: 'DEFENSE',
        difficulty: 1,
        masteryRate: 95
      },
      {
        id: 2,
        name: 'Defesa Lateral',
        category: 'DEFENSE', 
        difficulty: 3,
        masteryRate: 67
      }
    ]
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('\n🚀 =================================');
    console.log('🥋 ULTIMATE DASHBOARD SERVER RUNNING!');
    console.log('🚀 =================================');
    console.log('🌐 URL: http://localhost:3000');
    console.log('🚀 ULTIMATE DASHBOARD: http://localhost:3000/ultimate');
    console.log('📊 BASIC DASHBOARD: http://localhost:3000/dashboard');
    console.log('❤️  HEALTH: http://localhost:3000/health');
    console.log('🔥 =================================\n');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();