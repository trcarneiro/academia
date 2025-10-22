import { FastifyInstance } from 'fastify';
import { biometricController } from '@/controllers/biometricController';
import { logger } from '@/utils/logger';

/**
 * Biometric Routes - Face recognition check-in endpoints
 * - POST   /api/biometric/students/:studentId/face-embedding    (Save embedding)
 * - GET    /api/biometric/students/:studentId                   (Get biometric data)
 * - POST   /api/biometric/match                                 (Find matching student)
 * - POST   /api/biometric/attempts                              (Log attempt)
 * - GET    /api/biometric/attempts/:studentId                   (Get attempt history)
 * - DELETE /api/biometric/students/:studentId                   (Delete data GDPR)
 * - GET    /api/biometric/check-rate-limit/:studentId           (Check rate limit)
 */
export default async function biometricRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/biometric/students/:studentId/face-embedding
   * Save or update face embedding for a student
   */
  fastify.post<{ Params: { studentId: string } }>(
    '/students/:studentId/face-embedding',
    biometricController.saveFaceEmbedding.bind(biometricController)
  );


  /**
   * GET /api/biometric/students/:studentId
   * Get biometric data and statistics for a student
   */
  fastify.get<{ Params: { studentId: string } }>(
    '/students/:studentId',
    biometricController.getStudentBiometric.bind(biometricController)
  );

  /**
   * POST /api/biometric/match
   * Find matching student by face embedding
   */
  fastify.post(
    '/match',
    biometricController.findMatch.bind(biometricController)
  );

  /**
   * POST /api/biometric/attempts
   * Log a biometric check-in attempt
   */
  fastify.post(
    '/attempts',
    biometricController.logCheckInAttempt.bind(biometricController)
  );

  /**
   * GET /api/biometric/attempts/:studentId
   * Get attempt history for a student
   */
  fastify.get<{ Params: { studentId: string } }>(
    '/attempts/:studentId',
    biometricController.getAttemptHistory.bind(biometricController)
  );

  /**
   * DELETE /api/biometric/students/:studentId
   * Delete biometric data (GDPR compliance)
   */
  fastify.delete<{ Params: { studentId: string } }>(
    '/students/:studentId',
    biometricController.deleteBiometricData.bind(biometricController)
  );

  /**
   * GET /api/biometric/check-rate-limit/:studentId
   * Check if student has exceeded rate limit (5 attempts/minute)
   */
  fastify.get<{ Params: { studentId: string } }>(
    '/check-rate-limit/:studentId',
    biometricController.checkRateLimit.bind(biometricController)
  );

  logger.info('Biometric routes registered successfully (7 endpoints)');
}
