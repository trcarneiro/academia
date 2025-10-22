import { FastifyReply, FastifyRequest } from 'fastify';
import { biometricService } from '@/services/biometricService';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';

/**
 * BiometricController - Handles face recognition endpoints
 * Methods: POST/GET embeddings, POST attempts, DELETE for GDPR
 */
export class BiometricController {
  /**
   * POST /api/biometric/students/:studentId/face-embedding
   * Save or update face embedding for a student
   */
  async saveFaceEmbedding(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };
      const { embedding, photoUrl, qualityScore } = request.body as {
        embedding: number[];
        photoUrl: string;
        qualityScore: number;
      };

      // Validate input
      if (!studentId || !embedding || !photoUrl) {
        return reply.code(400).send({
          success: false,
          message: 'Missing required fields: studentId, embedding, photoUrl'
        });
      }

      // Validate embedding dimensions (128 for face-api.js)
      if (!biometricService.validateEmbeddingDimensions(embedding)) {
        return reply.code(400).send({
          success: false,
          message:
            'Invalid embedding: must be array of 128 numbers between -1 and 1'
        });
      }

      // Validate quality score
      if (qualityScore < 0 || qualityScore > 100) {
        return reply.code(400).send({
          success: false,
          message: 'Quality score must be between 0 and 100'
        });
      }

      // Save embedding
      const result = await biometricService.saveEmbedding(
        studentId,
        embedding,
        photoUrl,
        qualityScore
      );

      return reply.code(201).send({
        success: true,
        data: result,
        message: 'Face embedding saved successfully'
      });
    } catch (error) {
      logger.error('Error in saveFaceEmbedding:', error);

      if ((error as any).message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Failed to save face embedding'
      });
    }
  }

  /**
   * GET /api/biometric/students/:studentId
   * Get biometric data and statistics for a student
   */
  async getStudentBiometric(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };

      // Get biometric data
      const biometricData = await prisma.biometricData.findUnique({
        where: { studentId },
        select: {
          id: true,
          qualityScore: true,
          enrolledAt: true,
          isActive: true,
          photoUrl: true,
          lastUpdatedAt: true
        }
      });

      if (!biometricData) {
        return reply.code(404).send({
          success: false,
          message: 'No biometric data found for this student'
        });
      }

      // Get statistics
      const stats = await biometricService.getStudentStatistics(studentId);

      return reply.code(200).send({
        success: true,
        data: {
          ...biometricData,
          statistics: stats
        }
      });
    } catch (error) {
      logger.error('Error in getStudentBiometric:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to retrieve biometric data'
      });
    }
  }

  /**
   * POST /api/biometric/match
   * Find matching student by face embedding
   */
  async findMatch(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { embedding, threshold } = request.body as {
        embedding: number[];
        threshold?: number;
      };
      const organizationId = (request.headers['x-organization-id'] ||
        request.headers['x-organization-slug']) as string;

      // Validate
      if (!embedding || !organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Missing required fields: embedding, x-organization-id'
        });
      }

      if (!biometricService.validateEmbeddingDimensions(embedding)) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid embedding dimensions'
        });
      }

      // Search for match
      const match = await biometricService.findMatchingStudent({
        organizationId,
        embedding,
        threshold: threshold || 0.60,
        limit: 1
      });

      if (!match) {
        return reply.code(200).send({
          success: true,
          data: null,
          message: 'No matching student found'
        });
      }

      // Log successful attempt
      await biometricService.logAttempt({
        organizationId,
        detectedStudentId: match.studentId,
        similarity: match.similarity,
        confidence: match.confidence,
        method: 'FACE_DETECTION',
        result: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return reply.code(200).send({
        success: true,
        data: match
      });
    } catch (error) {
      logger.error('Error in findMatch:', error);

      // Log failed attempt
      const organizationId = (request.headers['x-organization-id'] ||
        request.headers['x-organization-slug']) as string;
      if (organizationId) {
        await biometricService.logAttempt({
          organizationId,
          similarity: 0,
          confidence: 'FAILED',
          method: 'FACE_DETECTION',
          result: 'ERROR',
          errorMessage: (error as any).message,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        });
      }

      return reply.code(500).send({
        success: false,
        message: 'Failed to process biometric match'
      });
    }
  }

  /**
   * POST /api/biometric/attempts
   * Log a biometric check-in attempt
   */
  async logCheckInAttempt(request: FastifyRequest, reply: FastifyReply) {
    try {
      const {
        studentId,
        detectedStudentId,
        similarity,
        confidence,
        method,
        result,
        errorMessage
      } = request.body as {
        studentId?: string;
        detectedStudentId?: string;
        similarity: number;
        confidence:
          | 'EXCELLENT'
          | 'GOOD'
          | 'FAIR'
          | 'POOR'
          | 'FAILED';
        method: 'FACE_DETECTION' | 'MANUAL_SEARCH' | 'QR_CODE';
        result: 'SUCCESS' | 'NO_MATCH' | 'POOR_QUALITY' | 'ERROR';
        errorMessage?: string;
      };
      const organizationId = (request.headers['x-organization-id'] ||
        request.headers['x-organization-slug']) as string;

      if (!organizationId || !similarity || !confidence) {
        return reply.code(400).send({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Log attempt
      const logResult = await biometricService.logAttempt({
        organizationId,
        studentId,
        detectedStudentId,
        similarity,
        confidence,
        method,
        result,
        errorMessage,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      });

      return reply.code(201).send({
        success: true,
        data: logResult,
        message: 'Attempt logged successfully'
      });
    } catch (error) {
      logger.error('Error in logCheckInAttempt:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to log attempt'
      });
    }
  }

  /**
   * GET /api/biometric/attempts/:studentId
   * Get attempt history for a student
   */
  async getAttemptHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };
      const { limit = '50', offset = '0' } = request.query as {
        limit?: string;
        offset?: string;
      };

      const attempts = await prisma.biometricAttempt.findMany({
        where: { studentId },
        select: {
          id: true,
          result: true,
          confidence: true,
          similarity: true,
          method: true,
          attemptedAt: true,
          errorMessage: true
        },
        orderBy: { attemptedAt: 'desc' },
        take: Math.min(parseInt(limit) || 50, 100),
        skip: parseInt(offset) || 0
      });

      const total = await prisma.biometricAttempt.count({
        where: { studentId }
      });

      return reply.code(200).send({
        success: true,
        data: attempts,
        pagination: {
          total,
          limit: Math.min(parseInt(limit) || 50, 100),
          offset: parseInt(offset) || 0
        }
      });
    } catch (error) {
      logger.error('Error in getAttemptHistory:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to retrieve attempt history'
      });
    }
  }

  /**
   * DELETE /api/biometric/students/:studentId
   * Delete biometric data (GDPR compliance)
   */
  async deleteBiometricData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };

      // Verify ownership or admin privilege
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true }
      });

      if (!student) {
        return reply.code(404).send({
          success: false,
          message: 'Student not found'
        });
      }

      // Delete biometric data
      await biometricService.deleteBiometricData(studentId);

      return reply.code(200).send({
        success: true,
        message: 'Biometric data deleted successfully (GDPR compliance)'
      });
    } catch (error) {
      logger.error('Error in deleteBiometricData:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to delete biometric data'
      });
    }
  }

  /**
   * GET /api/biometric/check-rate-limit/:studentId
   * Check if student has exceeded rate limit
   */
  async checkRateLimit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = request.params as { studentId: string };
      const organizationId = (request.headers['x-organization-id'] ||
        request.headers['x-organization-slug']) as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Missing organization ID'
        });
      }

      const allowed = await biometricService.checkRateLimit(
        studentId,
        organizationId
      );

      return reply.code(200).send({
        success: true,
        data: { allowed, message: allowed ? 'OK' : 'Rate limit exceeded' }
      });
    } catch (error) {
      logger.error('Error in checkRateLimit:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to check rate limit'
      });
    }
  }
}

// Export singleton instance
export const biometricController = new BiometricController();
