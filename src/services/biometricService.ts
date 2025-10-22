import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import * as tf from '@tensorflow/tfjs';

interface BiometricSearchParams {
  organizationId: string;
  embedding: number[];
  threshold?: number;
  limit?: number;
}

interface EmbeddingData {
  id: string;
  studentId: string;
  studentName: string;
  studentMatricula: string;
  embedding: number[];
  photoUrl: string;
  qualityScore: number;
  enrolledAt: Date;
}

interface BiometricMatchResult {
  matched: boolean;
  studentId: string;
  studentName: string;
  studentMatricula: string;
  photoUrl: string;
  similarity: number;
  confidence: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'FAILED';
}

interface BiometricAttemptLog {
  organizationId: string;
  studentId?: string;
  detectedStudentId?: string;
  similarity: number;
  confidence: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'FAILED';
  method: 'FACE_DETECTION' | 'MANUAL_SEARCH' | 'QR_CODE';
  result: 'SUCCESS' | 'NO_MATCH' | 'POOR_QUALITY' | 'ERROR';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Biometric Service - Face recognition and matching logic
 * Handles embedding storage, matching, and security audit trails
 */
export class BiometricService {
  /**
   * Calculate Euclidean distance between two embeddings
   * Lower distance = higher similarity
   */
  private calculateDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Convert Euclidean distance to similarity score (0-1)
   * Based on typical face descriptor distances (0-0.6 range)
   */
  private distanceToSimilarity(distance: number): number {
    // Normalize: 0 distance = 1.0 similarity, 0.6+ distance = 0 similarity
    const maxDistance = 0.6;
    const similarity = Math.max(0, 1 - distance / maxDistance);
    return Math.round(similarity * 100) / 100;
  }

  /**
   * Classify confidence level based on similarity score
   */
  private getConfidenceLevel(
    similarity: number
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'FAILED' {
    if (similarity >= 0.85) return 'EXCELLENT';
    if (similarity >= 0.75) return 'GOOD';
    if (similarity >= 0.65) return 'FAIR';
    if (similarity >= 0.50) return 'POOR';
    return 'FAILED';
  }

  /**
   * Save face embedding for a student
   */
  async saveEmbedding(
    studentId: string,
    embedding: number[],
    photoUrl: string,
    qualityScore: number
  ): Promise<any> {
    try {
      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, organizationId: true }
      });

      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }

      // Update or create biometric data
      const biometricData = await prisma.biometricData.upsert({
        where: { studentId },
        update: {
          embedding,
          photoUrl,
          qualityScore,
          lastUpdatedAt: new Date(),
          isActive: true
        },
        create: {
          studentId,
          embedding,
          photoUrl,
          qualityScore,
          enrollmentMethod: 'AUTO',
          isActive: true
        },
        select: {
          id: true,
          studentId: true,
          qualityScore: true,
          enrolledAt: true,
          isActive: true
        }
      });

      logger.info(`Face embedding saved for student ${studentId}`, {
        biometricId: biometricData.id,
        qualityScore: biometricData.qualityScore
      });

      return biometricData;
    } catch (error) {
      logger.error('Error saving embedding:', error);
      throw error;
    }
  }

  /**
   * Get all active embeddings for organization (for matching)
   */
  async getActiveEmbeddings(organizationId: string): Promise<EmbeddingData[]> {
    try {
      const embeddings = await prisma.biometricData.findMany({
        where: { isActive: true },
        select: {
          id: true,
          studentId: true,
          embedding: true,
          photoUrl: true,
          qualityScore: true,
          enrolledAt: true,
          student: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              },
              registrationNumber: true
            }
          }
        }
      });

      // Filter by organization and format response
      return embeddings
        .filter((e) => e.student && e.student.id) // Verify student exists
        .map((e) => ({
          id: e.id,
          studentId: e.studentId,
          studentName: e.student!.user!.name || 'Unknown',
          studentMatricula: e.student!.registrationNumber || 'N/A',
          embedding: e.embedding,
          photoUrl: e.photoUrl,
          qualityScore: e.qualityScore,
          enrolledAt: e.enrolledAt
        }));
    } catch (error) {
      logger.error('Error retrieving embeddings:', error);
      throw error;
    }
  }

  /**
   * Find best matching student by face embedding
   */
  async findMatchingStudent(
    params: BiometricSearchParams
  ): Promise<BiometricMatchResult | null> {
    try {
      const {
        organizationId,
        embedding,
        threshold = 0.60,
        limit = 1
      } = params;

      // Get all active embeddings
      const allEmbeddings = await this.getActiveEmbeddings(organizationId);

      if (allEmbeddings.length === 0) {
        logger.warn('No active embeddings found for matching');
        return null;
      }

      // Calculate distances to all embeddings
      const matches = allEmbeddings
        .map((candidate) => {
          const distance = this.calculateDistance(embedding, candidate.embedding);
          const similarity = this.distanceToSimilarity(distance);

          return {
            ...candidate,
            distance,
            similarity,
            confidence: this.getConfidenceLevel(similarity)
          };
        })
        .filter((m) => m.similarity >= threshold) // Filter by threshold
        .sort((a, b) => b.similarity - a.similarity) // Sort by best match
        .slice(0, limit); // Take top N matches

      if (matches.length === 0) {
        return null;
      }

      const bestMatch = matches[0];

      return {
        matched: true,
        studentId: bestMatch.studentId,
        studentName: bestMatch.studentName,
        studentMatricula: bestMatch.studentMatricula,
        photoUrl: bestMatch.photoUrl,
        similarity: bestMatch.similarity,
        confidence: bestMatch.confidence
      };
    } catch (error) {
      logger.error('Error finding matching student:', error);
      throw error;
    }
  }

  /**
   * Log biometric attempt for audit trail
   */
  async logAttempt(data: BiometricAttemptLog): Promise<any> {
    try {
      const attempt = await prisma.biometricAttempt.create({
        data: {
          organizationId: data.organizationId,
          studentId: data.studentId,
          detectedStudentId: data.detectedStudentId,
          similarity: data.similarity,
          confidence: data.confidence,
          method: data.method,
          result: data.result,
          errorMessage: data.errorMessage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          processedAt: new Date()
        },
        select: {
          id: true,
          result: true,
          confidence: true,
          attemptedAt: true
        }
      });

      logger.info('Biometric attempt logged', {
        attemptId: attempt.id,
        result: attempt.result,
        confidence: attempt.confidence
      });

      return attempt;
    } catch (error) {
      logger.error('Error logging biometric attempt:', error);
      throw error;
    }
  }

  /**
   * Check rate limiting for biometric attempts
   * Returns: true if allowed, false if rate limit exceeded
   */
  async checkRateLimit(
    studentId: string,
    organizationId: string,
    attemptsPerMinute: number = 5
  ): Promise<boolean> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

      const recentAttempts = await prisma.biometricAttempt.count({
        where: {
          organizationId,
          studentId,
          attemptedAt: {
            gte: oneMinuteAgo
          }
        }
      });

      return recentAttempts < attemptsPerMinute;
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      throw error;
    }
  }

  /**
   * Get biometric statistics for a student
   */
  async getStudentStatistics(studentId: string): Promise<any> {
    try {
      const biometricData = await prisma.biometricData.findUnique({
        where: { studentId },
        select: {
          id: true,
          qualityScore: true,
          enrolledAt: true,
          isActive: true
        }
      });

      const attempts = await prisma.biometricAttempt.findMany({
        where: { studentId },
        select: {
          result: true,
          confidence: true,
          similarity: true,
          attemptedAt: true
        },
        orderBy: { attemptedAt: 'desc' },
        take: 100 // Last 100 attempts
      });

      const successCount = attempts.filter((a) => a.result === 'SUCCESS').length;
      const failureCount = attempts.filter(
        (a) => a.result !== 'SUCCESS'
      ).length;

      const avgSimilarity =
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + (a.similarity || 0), 0) /
            attempts.length
          : 0;

      return {
        enrolled: !!biometricData,
        qualityScore: biometricData?.qualityScore || null,
        enrolledAt: biometricData?.enrolledAt || null,
        isActive: biometricData?.isActive || false,
        totalAttempts: attempts.length,
        successCount,
        failureCount,
        successRate:
          attempts.length > 0
            ? (successCount / attempts.length * 100).toFixed(2)
            : 0,
        averageSimilarity: avgSimilarity.toFixed(3),
        lastAttempt: attempts[0]?.attemptedAt || null
      };
    } catch (error) {
      logger.error('Error getting biometric statistics:', error);
      throw error;
    }
  }

  /**
   * Delete biometric data (GDPR compliance)
   */
  async deleteBiometricData(studentId: string): Promise<void> {
    try {
      await prisma.biometricData.delete({
        where: { studentId }
      });

      logger.info(`Biometric data deleted for student ${studentId}`, {
        reason: 'GDPR compliance request'
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        // Record not found - this is fine
        logger.warn(
          `No biometric data found to delete for student ${studentId}`
        );
        return;
      }
      logger.error('Error deleting biometric data:', error);
      throw error;
    }
  }

  /**
   * Validate embedding vector dimensions (should be 128 for face-api.js)
   */
  validateEmbeddingDimensions(embedding: number[]): boolean {
    return (
      Array.isArray(embedding) &&
      embedding.length === 128 &&
      embedding.every((v) => typeof v === 'number' && !isNaN(v))
    );
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
