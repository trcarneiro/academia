/**
 * Development Auto-Login Route
 * AGENTS.md v2.0 compliant
 * 
 * Automatically creates and logs in a development user
 * Associated with existing organization
 * 
 * ⚠️ REMOVE THIS FILE IN PRODUCTION ⚠️
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import * as bcrypt from 'bcrypt';

export default async function devAuthRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/dev-auth/auto-login
   * Creates dev user if needed and returns login credentials
   */
  fastify.post('/auto-login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('🔧 [DEV] Auto-login requested');

      // Get or create organization
      let organization = await prisma.organization.findFirst({
        where: { isActive: true }
      });

      if (!organization) {
        logger.info('🔧 [DEV] Creating default organization...');
        organization = await prisma.organization.create({
          data: {
            name: 'Academia Demo',
            slug: 'academia-demo',
            email: 'contato@academiademo.com',
            website: 'https://academiademo.com',
            country: 'Brazil',
            maxStudents: 100,
            maxStaff: 10,
            isActive: true
          }
        });
        logger.info(`🔧 [DEV] Organization created: ${organization.id}`);
      }

      // Check if dev user exists
      const devEmail = 'dev@academia.com';
      let devUser = await prisma.user.findFirst({
        where: {
          email: devEmail,
          organizationId: organization.id
        },
        include: {
          organization: true
        }
      });

      if (!devUser) {
        logger.info('🔧 [DEV] Creating dev user...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash('dev123', 10);

        devUser = await prisma.user.create({
          data: {
            firstName: 'Dev',
            lastName: 'User',
            email: devEmail,
            password: hashedPassword,
            organizationId: organization.id,
            role: 'ADMIN',
            isActive: true
          },
          include: {
            organization: true
          }
        });

        logger.info(`🔧 [DEV] Dev user created: ${devUser.id}`);
      }

      // Generate JWT token
      const token = fastify.jwt.sign(
        {
          userId: devUser.id,
          organizationId: organization.id,
          role: devUser.role,
          email: devUser.email
        },
        {
          expiresIn: '7d' // 7 days for development
        }
      );

      logger.info('🔧 [DEV] Auto-login successful');

      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: devUser.id,
            firstName: devUser.firstName,
            lastName: devUser.lastName,
            email: devUser.email,
            role: devUser.role,
            organizationId: devUser.organizationId,
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug
            }
          }
        },
        message: 'Dev user auto-login successful'
      });

    } catch (error) {
      logger.error('🔧 [DEV] Auto-login error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Dev auto-login failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/dev-auth/status
   * Check if dev mode is enabled and user exists
   */
  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organization = await prisma.organization.findFirst({
        where: { isActive: true }
      });

      const devUser = await prisma.user.findFirst({
        where: {
          email: 'dev@academia.com'
        }
      });

      return reply.send({
        success: true,
        data: {
          devMode: true,
          hasOrganization: !!organization,
          hasDevUser: !!devUser,
          organizationName: organization?.name || null,
          devEmail: 'dev@academia.com'
        }
      });

    } catch (error) {
      logger.error('🔧 [DEV] Status check error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Status check failed'
      });
    }
  });
}
