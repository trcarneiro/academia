import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Health check routes for monitoring database and server status
 * @see dev/DATABASE_ERROR_HANDLING.md
 */
export default async function healthRoutes(fastify: FastifyInstance) {
  
  /**
   * Basic health check - quick database ping
   * Returns 200 if healthy, 503 if database is down
   */
  fastify.get('/health', {
    schema: {
      description: 'Quick health check with database ping',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string' },
            database: { type: 'string', enum: ['connected', 'disconnected'] }
          }
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            database: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    
    try {
      // Quick database ping
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      const status = latency < 500 ? 'healthy' : 'degraded';
      
      return reply.send({
        status,
        timestamp: new Date().toISOString(),
        database: 'connected',
        latency: `${latency}ms`
      });
      
    } catch (error: any) {
      logger.error('Health check failed:', error);
      
      return reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.code || error.message
      });
    }
  });

  /**
   * Detailed health check - comprehensive status with metrics
   */
  fastify.get('/health/detailed', {
    schema: {
      description: 'Comprehensive health check with database metrics and server info'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const start = Date.now();
    let dbStatus = { connected: false, latency: -1, error: null as string | null };
    let poolInfo = null;
    
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = {
        connected: true,
        latency: Date.now() - start,
        error: null
      };
      
      // Try to get connection info (may fail due to permissions)
      try {
        const result: any[] = await prisma.$queryRaw`
          SELECT count(*) as active_connections
          FROM pg_stat_activity
          WHERE datname = current_database()
        `;
        poolInfo = {
          activeConnections: parseInt(result[0]?.active_connections || '0')
        };
      } catch (e) {
        // Ignore - may not have permission
      }
      
    } catch (error: any) {
      dbStatus = {
        connected: false,
        latency: -1,
        error: error.code || error.message
      };
    }
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // Response
    const response = {
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        latency: dbStatus.latency > 0 ? `${dbStatus.latency}ms` : 'N/A',
        error: dbStatus.error,
        poolInfo,
        config: {
          connectionLimit: 5,
          poolTimeout: '10s',
          connectTimeout: '5s',
          provider: 'Supabase + PgBouncer'
        }
      },
      
      server: {
        uptime: `${Math.floor(process.uptime())}s`,
        uptimeFormatted: formatUptime(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development'
      },
      
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      }
    };
    
    return reply.code(dbStatus.connected ? 200 : 503).send(response);
  });

  /**
   * Readiness probe - for container orchestration
   */
  fastify.get('/health/ready', {
    schema: {
      description: 'Returns 200 when server is ready to accept requests'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check database is accessible
      await prisma.$queryRaw`SELECT 1`;
      
      return reply.send({
        ready: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return reply.code(503).send({
        ready: false,
        timestamp: new Date().toISOString(),
        reason: 'Database not accessible'
      });
    }
  });

  /**
   * Liveness probe - for container orchestration
   */
  fastify.get('/health/live', {
    schema: {
      description: 'Returns 200 if server process is alive'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // If we can respond, we're alive
    return reply.send({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`
    });
  });

  // Get system version
  fastify.get('/version', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return reply.send({ 
        success: true, 
        version: packageJson.version,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      logger.error('Error reading version:', error);
      return reply.send({ 
        success: false, 
        version: 'unknown',
        environment: 'unknown'
      });
    }
  });

  logger.info('✅ Health check routes registered (5 endpoints)');
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}
