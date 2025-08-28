import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '@/services/aiService';
import { prisma } from '@/utils/database';
import logger from '@/utils/logger';
import path from 'path';
import fs from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { randomUUID } from 'crypto';

// Helper: resolve organizationId (first org fallback)
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization found');
  return org.id;
}

// Middleware de autenticação (simulado)
async function authenticate(_request: FastifyRequest, reply: FastifyReply) {
  try {
    // Em um app real, isso verificaria o token JWT
    // await request.jwtVerify();
  } catch (err) {
    reply.send(err as any);
  }
}

interface CourseDocumentAnalysisRequest {
  Body: {
    courseId: string;
    file?: any; // Multipart file
    aiProvider?: 'claude' | 'openai' | 'gemini';
    analysisType?: 'full' | 'techniques' | 'lesson-plans';
  };
}

interface GenerateTechniquesRequest {
  Body: {
    courseId: string;
    documentAnalysis: string;
    aiProvider?: 'claude' | 'openai' | 'gemini';
    generateCount?: number;
    difficulty?: string;
    focusAreas?: string[];
  };
}

interface GenerateLessonPlansRequest {
  Body: {
    courseId: string;
    documentAnalysis: string;
    aiProvider?: 'claude' | 'openai' | 'gemini';
    generateCount?: number;
    weekRange?: { start: number; end: number };
  };
}

export async function aiRoutes(app: FastifyInstance) {
  // Aplica o hook de autenticação para todas as rotas de AI
  app.addHook('preHandler', authenticate);

  // Configure multipart support for file uploads
  app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Analyze course document endpoint
  app.post('/analyze-course-document', async (request, reply) => {
    try {
      logger.info('🤖 Starting course document analysis...');

      // Check if request has multipart data
      if (!request.isMultipart()) {
        return reply.code(400).send({
          success: false,
          error: 'Request must be multipart/form-data',
        });
      }

      // Process multipart form data
      const parts = request.parts();
      let courseId = '';
      let aiProvider = 'claude';
      let analysisType = 'full';
      let fileContent = '';
      let fileName = '';
      let fileType = '';

      for await (const part of parts) {
        if (part.type === 'field') {
          const fieldValue = part.value;
          switch (part.fieldname) {
            case 'courseId':
              courseId = fieldValue as string;
              break;
            case 'aiProvider':
              aiProvider = fieldValue as string;
              break;
            case 'analysisType':
              analysisType = fieldValue as string;
              break;
          }
        } else if (part.type === 'file' && part.fieldname === 'file') {
          fileName = part.filename || 'unknown';
          fileType = part.mimetype || 'unknown';
          
          // Read file content
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          // Process based on file type
          if (fileType.includes('text') || fileName.endsWith('.txt')) {
            fileContent = buffer.toString('utf-8');
          } else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
            // For now, return error for PDF - would need PDF parsing library
            return reply.code(400).send({
              success: false,
              error: 'PDF processing not yet implemented. Please use text files for now.',
            });
          } else {
            return reply.code(400).send({
              success: false,
              error: 'Unsupported file type. Please use .txt files for now.',
            });
          }
        }
      }

      if (!courseId) {
        return reply.code(400).send({
          success: false,
          error: 'courseId is required',
        });
      }

      if (!fileContent.trim()) {
        return reply.code(400).send({
          success: false,
          error: 'No file content received or file is empty',
        });
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          courseTechniques: {
            include: {
              technique: true,
            },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({
          success: false,
          error: 'Course not found',
        });
      }

      // Analyze document with AI
      const analysis = await AIService.analyzeCourseDocument({
        courseId,
        courseName: course.name,
        courseLevel: course.level,
        courseDescription: course.description || '',
        documentContent: fileContent,
        fileName,
        analysisType,
        aiProvider,
      });

      logger.info({ courseId, analysisType, aiProvider }, '✅ Course document analysis completed');

      return reply.send({
        success: true,
        data: {
          analysis,
          course: {
            id: course.id,
            name: course.name,
            level: course.level,
            description: course.description,
          },
          document: {
            fileName,
            fileType,
            contentLength: fileContent.length,
          },
        },
      });
    } catch (error: any) {
      logger.error({ error }, '❌ Error analyzing course document');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to analyze course document',
      });
    }
  });

  // Generate techniques endpoint
  app.post<GenerateTechniquesRequest>('/generate-techniques', async (request, reply) => {
    try {
      const { courseId, documentAnalysis, aiProvider = 'claude', generateCount = 5, difficulty, focusAreas } = request.body;

      logger.info({ courseId, generateCount, aiProvider }, '🤖 Starting technique generation...');

      if (!courseId) {
        return reply.code(400).send({
          success: false,
          error: 'courseId is required',
        });
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.code(404).send({
          success: false,
          error: 'Course not found',
        });
      }

      // Generate techniques with AI using course data directly
      const courseAnalysis = `Course: ${course.name}\nLevel: ${course.level}\nDescription: ${course.description || 'No description'}\nObjectives: ${course.objectives ? course.objectives.join(', ') : 'No objectives'}\nRequirements: ${course.requirements ? course.requirements.join(', ') : 'No requirements'}`;
      
      const techniques = await AIService.generateTechniques({
        courseId,
        courseName: course.name,
        courseLevel: course.level.toString(),
        documentAnalysis: documentAnalysis || courseAnalysis,
        generateCount,
        difficulty: difficulty || 'medium',
        focusAreas: focusAreas || [],
        aiProvider,
      });

      // Save techniques to database
      const orgId = await getOrganizationId();
      const savedTechniques = [];

      for (const technique of techniques) {
        try {
          const saved = await prisma.technique.create({
            data: {
              organizationId: orgId,
              name: technique.name,
              description: technique.description,
              type: technique.type || 'TECHNIQUE',
              difficulty: technique.difficulty || 1,
              equipment: technique.equipment || [],
              safety: technique.safety,
              isActive: true,
            },
          });

          // Link to course if needed
          await prisma.courseTechnique.create({
            data: {
              courseId,
              techniqueId: saved.id,
              orderIndex: savedTechniques.length + 1,
              isRequired: true,
            },
          });

          savedTechniques.push(saved);
        } catch (error: any) {
          logger.warn({ error, techniqueName: technique.name }, 'Failed to save technique, skipping...');
        }
      }

      logger.info({ courseId, generatedCount: savedTechniques.length }, '✅ Technique generation completed');

      return reply.send({
        success: true,
        data: {
          techniques: savedTechniques,
          course: {
            id: course.id,
            name: course.name,
          },
          summary: {
            requested: generateCount,
            generated: techniques.length,
            saved: savedTechniques.length,
          },
        },
      });
    } catch (error: any) {
      logger.error({ error }, '❌ Error generating techniques');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate techniques',
      });
    }
  });

  // Generate lesson plans endpoint
  app.post<GenerateLessonPlansRequest>('/generate-lesson-plans', async (request, reply) => {
    try {
      const { courseId, documentAnalysis, aiProvider = 'claude', generateCount = 8, weekRange } = request.body;

      logger.info({ courseId, generateCount, aiProvider }, '🤖 Starting lesson plan generation...');

      if (!courseId) {
        return reply.code(400).send({
          success: false,
          error: 'courseId is required',
        });
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.code(404).send({
          success: false,
          error: 'Course not found',
        });
      }

      // Get existing techniques for this course
      const existingTechniques = await prisma.technique.findMany({
        where: {
          courseTechniques: {
            some: {
              courseId: courseId,
            },
          },
        },
      });

      // Generate course analysis from course data
      const courseAnalysis = `Course: ${course.name}\nLevel: ${course.level}\nDescription: ${course.description || 'No description'}\nObjectives: ${course.objectives ? course.objectives.join(', ') : 'No objectives'}\nRequirements: ${course.requirements ? course.requirements.join(', ') : 'No requirements'}`;

      // Generate lesson plans with AI using course data
      const lessonPlans = await AIService.generateLessonPlans({
        courseId,
        courseName: course.name,
        courseLevel: course.level.toString(),
        documentAnalysis: documentAnalysis || courseAnalysis,
        techniques: existingTechniques,
        generateCount,
        weekRange,
        aiProvider,
      });

      // Save lesson plans to database
      const savedLessonPlans = [];

      for (let i = 0; i < lessonPlans.length; i++) {
        const plan = lessonPlans[i];
        try {
          const saved = await prisma.lessonPlan.create({
            data: {
              courseId,
              title: plan.title,
              description: plan.description,
              lessonNumber: plan.lessonNumber || (i + 1),
              weekNumber: plan.weekNumber || Math.ceil((i + 1) / 2),
              duration: plan.duration || 60,
              objectives: plan.objectives || [],
              activities: plan.activities || [],
              materials: plan.materials || [],
              notes: plan.notes,
              isActive: true,
            },
          });

          savedLessonPlans.push(saved);
        } catch (error: any) {
          logger.warn({ error, planTitle: plan.title }, 'Failed to save lesson plan, skipping...');
        }
      }

      logger.info({ courseId, generatedCount: savedLessonPlans.length }, '✅ Lesson plan generation completed');

      return reply.send({
        success: true,
        data: {
          lessonPlans: savedLessonPlans,
          course: {
            id: course.id,
            name: course.name,
          },
          summary: {
            requested: generateCount,
            generated: lessonPlans.length,
            saved: savedLessonPlans.length,
          },
        },
      });
    } catch (error: any) {
      logger.error({ error }, '❌ Error generating lesson plans');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate lesson plans',
      });
    }
  });

  // Get AI generation status endpoint (for progress tracking)
  app.get('/status/:taskId', async (request: any, reply) => {
    try {
      const { taskId } = request.params;

      // This would typically check a background job status
      // For now, return a simple response
      return reply.send({
        success: true,
        data: {
          taskId,
          status: 'completed',
          progress: 100,
          message: 'Task completed successfully',
        },
      });
    } catch (error: any) {
      logger.error({ error }, '❌ Error checking AI status');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to check status',
      });
    }
  });
}
