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
      fileSize: 50 * 1024 * 1024, // 50MB limit for Google Ads CSV files
      files: 20 // Max 20 files for batch imports
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

  // Generate single lesson plan endpoint
  app.post('/generate-single-lesson', async (request, reply) => {
    try {
      const { courseId, lessonNumber, weekNumber } = request.body as {
        courseId: string;
        lessonNumber: number;
        weekNumber?: number;
      };

      logger.info({ courseId, lessonNumber }, '🎯 Starting single lesson plan generation...');

      if (!courseId || !lessonNumber) {
        return reply.code(400).send({
          success: false,
          error: 'courseId and lessonNumber are required',
        });
      }

      // Get course details with techniques
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          techniques: {
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

      // Generate a single detailed lesson plan
      const weekNum = weekNumber || Math.ceil(lessonNumber / 2);
      const lessonPlans = await AIService.generateLessonPlans({
        courseId,
        courseName: course.name,
        courseLevel: course.level.toString(),
        documentAnalysis: `Course: ${course.name}\nLevel: ${course.level}\nDescription: ${course.description || 'No description'}\nLesson Number: ${lessonNumber}\nWeek: ${weekNum}`,
        techniques: course.techniques.map(ct => ct.technique),
        generateCount: 1,
        aiProvider: 'gemini',
      });

      if (lessonPlans.length === 0) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to generate lesson plan',
        });
      }

      const plan = lessonPlans[0];
      
      // Update plan with correct numbers
      plan.lessonNumber = lessonNumber;
      plan.weekNumber = weekNum;

      try {
        // Save to database with correct structure
        const activities = plan.activities || [];
        const warmupActivities = activities.filter((a: any) => a.type === 'warmup');
        const techniqueActivities = activities.filter((a: any) => a.type === 'technique');
        const drillActivities = activities.filter((a: any) => a.type === 'drill');
        const cooldownActivities = activities.filter((a: any) => a.type === 'cooldown');

        const saved = await prisma.lessonPlan.upsert({
          where: {
            courseId_lessonNumber: {
              courseId,
              lessonNumber: lessonNumber,
            },
          },
          update: {
            title: `${plan.title} - Aula ${lessonNumber}`,
            description: plan.description,
            weekNumber: weekNum,
            duration: plan.duration || 60,
            objectives: plan.objectives || [],
            equipment: plan.materials || [],
            activities: activities.map((a: any) => a.name),
            warmup: warmupActivities,
            techniques: techniqueActivities,
            simulations: drillActivities,
            cooldown: cooldownActivities,
            mentalModule: {},
            tacticalModule: plan.notes || null,
            adaptations: {},
          },
          create: {
            courseId,
            title: `${plan.title} - Aula ${lessonNumber}`,
            description: plan.description,
            lessonNumber: lessonNumber,
            weekNumber: weekNum,
            duration: plan.duration || 60,
            objectives: plan.objectives || [],
            equipment: plan.materials || [],
            activities: activities.map((a: any) => a.name),
            warmup: warmupActivities,
            techniques: techniqueActivities,
            simulations: drillActivities,
            cooldown: cooldownActivities,
            mentalModule: {},
            tacticalModule: plan.notes || null,
            adaptations: {},
          },
        });

        // Create new activities automatically if they don't exist in database
        const organizationId = await getOrganizationId();
        const newActivitiesCreated = [];
        
        for (const activity of activities) {
          if (activity.name && activity.description) {
            try {
              // Check if activity already exists
              const existingActivity = await prisma.activity.findFirst({
                where: {
                  title: activity.name,
                },
              });

              if (!existingActivity) {
                // Create new activity with comprehensive documentation
                const newActivity = await prisma.activity.create({
                  data: {
                    organizationId,
                    title: activity.name,
                    description: activity.description || `Atividade criada automaticamente: ${activity.name}`,
                    type: activity.type?.toUpperCase() || 'ACTIVITY',
                    difficulty: activity.difficulty || 1,
                    equipment: activity.materials || ['Tatame', 'Espaço amplo'],
                    safety: `Instruções de segurança para ${activity.name}. Sempre supervisionar execução.`,
                    adaptations: [
                      'Adaptar intensidade conforme nível do aluno',
                      'Modificar duração se necessário',
                      'Considerar limitações físicas individuais'
                    ],
                  },
                });

                newActivitiesCreated.push(newActivity);
                logger.info({ activityId: newActivity.id, activityName: activity.name }, '🎯 New activity created automatically');
              }
            } catch (activityError: any) {
              logger.warn({ activityError, activityName: activity.name }, 'Failed to create activity, continuing...');
            }
          }
        }

        logger.info({ courseId, lessonNumber, planId: saved.id, newActivities: newActivitiesCreated.length }, '✅ Single lesson plan generated and saved with activities');

        return reply.send({
          success: true,
          data: {
            lessonPlan: saved,
            course: {
              id: course.id,
              name: course.name,
            },
            generatedWith: 'gemini',
          },
        });
      } catch (dbError: any) {
        logger.warn({ dbError, planTitle: plan.title }, 'Failed to save lesson plan');
        return reply.send({
          success: true,
          data: {
            lessonPlan: plan,
            course: {
              id: course.id,
              name: course.name,
            },
            generatedWith: 'gemini',
            note: 'Plan generated but not saved due to database constraints',
          },
        });
      }
    } catch (error: any) {
      logger.error({ error }, '❌ Error generating single lesson plan');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate single lesson plan',
      });
    }
  });

  // Generate draft lesson plan endpoint (no database save)
  app.post('/generate-draft-lesson', async (request, reply) => {
    try {
      const { courseId, lessonNumber, weekNumber } = request.body as {
        courseId: string;
        lessonNumber: number;
        weekNumber?: number;
      };

      logger.info({ courseId, lessonNumber }, '📝 Starting draft lesson plan generation...');

      if (!courseId || !lessonNumber) {
        return reply.code(400).send({
          success: false,
          error: 'courseId and lessonNumber are required',
        });
      }

      // Get course details with techniques
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          techniques: {
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

      // Generate a single detailed lesson plan
      const weekNum = weekNumber || Math.ceil(lessonNumber / 2);
      const lessonPlans = await AIService.generateLessonPlans({
        courseId,
        courseName: course.name,
        courseLevel: course.level.toString(),
        documentAnalysis: `Course: ${course.name}\nLevel: ${course.level}\nDescription: ${course.description || 'No description'}\nLesson Number: ${lessonNumber}\nWeek: ${weekNum}`,
        techniques: course.techniques.map(ct => ct.technique),
        generateCount: 1,
        aiProvider: 'gemini',
      });

      if (lessonPlans.length === 0) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to generate lesson plan',
        });
      }

      const plan = lessonPlans[0];
      
      // Update plan with correct numbers
      plan.lessonNumber = lessonNumber;
      plan.weekNumber = weekNum;

      // Format activities for frontend
      const activities = plan.activities || [];
      const warmupActivities = activities.filter((a: any) => a.type === 'warmup');
      const techniqueActivities = activities.filter((a: any) => a.type === 'technique');
      const drillActivities = activities.filter((a: any) => a.type === 'drill');
      const cooldownActivities = activities.filter((a: any) => a.type === 'cooldown');

      // Create formatted plan without saving to database
      const draftPlan = {
        id: `draft_${Date.now()}_${lessonNumber}`, // Temporary ID for draft
        courseId,
        title: `${plan.title} - Aula ${lessonNumber}`,
        description: plan.description,
        lessonNumber: lessonNumber,
        weekNumber: weekNum,
        level: 1,
        duration: plan.duration || 60,
        difficulty: 1,
        objectives: plan.objectives || [],
        equipment: plan.materials || [],
        activities: activities.map((a: any) => a.name),
        warmup: warmupActivities,
        techniques: techniqueActivities,
        simulations: drillActivities,
        cooldown: cooldownActivities,
        mentalModule: {},
        tacticalModule: plan.notes || null,
        adaptations: {},
        isDraft: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      logger.info({ courseId, lessonNumber }, '✅ Draft lesson plan generated');

      return reply.send({
        success: true,
        data: {
          lessonPlan: draftPlan,
          course: {
            id: course.id,
            name: course.name,
          },
          generatedWith: 'gemini',
          isDraft: true,
        },
      });
    } catch (error: any) {
      logger.error({ error }, '❌ Error generating draft lesson plan');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate draft lesson plan',
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
      const generateOptions: any = {
        courseId,
        courseName: course.name,
        courseLevel: course.level.toString(),
        documentAnalysis: documentAnalysis || courseAnalysis,
        techniques: existingTechniques,
        generateCount,
        aiProvider,
      };
      
      if (weekRange) {
        generateOptions.weekRange = weekRange;
      }
      
      const lessonPlans = await AIService.generateLessonPlans(generateOptions);

      // Save lesson plans to database
      const savedLessonPlans = [];

      for (let i = 0; i < lessonPlans.length; i++) {
        const plan = lessonPlans[i];
        try {
          // Separate activities by type for the schema structure
          const activities = plan.activities || [];
          const warmupActivities = activities.filter((a: any) => a.type === 'warmup');
          const techniqueActivities = activities.filter((a: any) => a.type === 'technique');
          const drillActivities = activities.filter((a: any) => a.type === 'drill');
          const cooldownActivities = activities.filter((a: any) => a.type === 'cooldown');

          const saved = await prisma.lessonPlan.create({
            data: {
              courseId,
              title: plan.title,
              description: plan.description,
              lessonNumber: plan.lessonNumber || (i + 1),
              weekNumber: plan.weekNumber || Math.ceil((i + 1) / 2),
              duration: plan.duration || 60,
              objectives: plan.objectives || [],
              equipment: plan.materials || [],
              activities: activities.map((a: any) => a.name),
              // Required JSON fields from schema
              warmup: warmupActivities,
              techniques: techniqueActivities,
              simulations: drillActivities,
              cooldown: cooldownActivities,
              // Optional fields  
              mentalModule: {},
              tacticalModule: plan.notes || null,
              adaptations: {},
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

  // Generic AI content generation endpoint (Enhanced AI Module)
  app.post('/generate', async (request: any, reply) => {
    try {
      const { 
        courseId, 
        type, 
        provider = 'gemini', 
        useRag = false,
        lessonNumber,
        weekNumber,
        regenerate = false,
        originalLessonId
      } = request.body;

      if (!courseId || !type) {
        return reply.code(400).send({
          success: false,
          error: 'courseId and type are required',
        });
      }

      logger.info({ courseId, type, provider, useRag, lessonNumber, regenerate }, '🤖 AI content generation request');

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          techniques: {
            include: {
              technique: true
            }
          }
        }
      });

      if (!course) {
        return reply.code(404).send({
          success: false,
          error: 'Course not found',
        });
      }

      let result;
      const courseAnalysis = `Course: ${course.name}\nLevel: ${course.level}\nDescription: ${course.description || 'No description'}\nObjectives: ${course.objectives ? course.objectives.join(', ') : 'No objectives'}\nRequirements: ${course.requirements ? course.requirements.join(', ') : 'No requirements'}`;
      
      switch (type) {
        case 'techniques':
          result = await AIService.generateTechniques({
            courseId,
            courseName: course.name,
            courseLevel: course.level.toString(),
            documentAnalysis: courseAnalysis,
            generateCount: 5,
            difficulty: course.level.toLowerCase(),
            focusAreas: ['basic-strikes', 'defensive-moves'],
            aiProvider: provider,
          });
          break;

        case 'lesson':
          // Handle lesson plan generation with versioning support
          let lessonPlanData;
          
          if (lessonNumber) {
            // Generate specific lesson number
            const specificAnalysis = courseAnalysis + 
              `\nGenerate lesson plan for Lesson ${lessonNumber}` +
              (weekNumber ? `, Week ${weekNumber}` : `, Week ${Math.ceil(lessonNumber / 2)}`);
              
            const lessonPlans = await AIService.generateLessonPlans({
              courseId,
              courseName: course.name,
              courseLevel: course.level.toString(),
              documentAnalysis: specificAnalysis,
              techniques: course.techniques.map(ct => ct.technique),
              generateCount: 1,
              aiProvider: provider,
            });
            
            lessonPlanData = lessonPlans.length > 0 ? lessonPlans[0] : null;
            if (lessonPlanData) {
              lessonPlanData.lessonNumber = lessonNumber;
              lessonPlanData.weekNumber = weekNumber || Math.ceil(lessonNumber / 2);
            }
          } else {
            // Generate generic lesson plan
            const lessonPlans = await AIService.generateLessonPlans({
              courseId,
              courseName: course.name,
              courseLevel: course.level.toString(),
              documentAnalysis: courseAnalysis + '\nGenerate a single lesson plan',
              techniques: course.techniques.map(ct => ct.technique),
              generateCount: 1,
              aiProvider: provider,
            });
            lessonPlanData = lessonPlans.length > 0 ? lessonPlans[0] : null;
          }
          
          // Handle regeneration (versioning)
          if (regenerate && originalLessonId && lessonNumber) {
            // Archive the previous version
            await prisma.lessonPlan.update({
              where: { id: originalLessonId },
              data: { 
                isActive: false,
                archivedAt: new Date(),
              },
            });
            
            // Get the current version number
            const existingVersions = await prisma.lessonPlan.findMany({
              where: {
                courseId,
                lessonNumber,
              },
              orderBy: { version: 'desc' },
              take: 1,
            });
            
            const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;
            
            // Save new version to database if lessonPlanData exists
            if (lessonPlanData) {
              const savedLessonPlan = await prisma.lessonPlan.create({
                data: {
                  courseId,
                  title: lessonPlanData.title,
                  description: lessonPlanData.description || '',
                  lessonNumber: lessonNumber,
                  weekNumber: lessonPlanData.weekNumber,
                  level: lessonPlanData.level || 1,
                  duration: lessonPlanData.duration || 60,
                  difficulty: lessonPlanData.difficulty || 1,
                  warmup: lessonPlanData.warmup || [],
                  techniques: lessonPlanData.techniques || [],
                  simulations: lessonPlanData.simulations || [],
                  cooldown: lessonPlanData.cooldown || [],
                  objectives: lessonPlanData.objectives || [],
                  equipment: lessonPlanData.equipment || [],
                  activities: Array.isArray(lessonPlanData.activities) ? 
                    lessonPlanData.activities.map(act => typeof act === 'string' ? act : act.name || act.description || '') :
                    [],
                  version: nextVersion,
                  isActive: true,
                  previousVersionId: originalLessonId,
                  mentalModule: lessonPlanData.mentalModule,
                  tacticalModule: lessonPlanData.tacticalModule,
                  adaptations: lessonPlanData.adaptations,
                },
              });
              
              result = savedLessonPlan;
              logger.info({ lessonNumber, version: nextVersion }, '✅ New lesson plan version created');
            } else {
              result = lessonPlanData;
            }
          } else if (lessonNumber) {
            // Save new lesson plan to database
            if (lessonPlanData) {
              const savedLessonPlan = await prisma.lessonPlan.create({
                data: {
                  courseId,
                  title: lessonPlanData.title,
                  description: lessonPlanData.description || '',
                  lessonNumber: lessonNumber,
                  weekNumber: lessonPlanData.weekNumber,
                  level: lessonPlanData.level || 1,
                  duration: lessonPlanData.duration || 60,
                  difficulty: lessonPlanData.difficulty || 1,
                  warmup: lessonPlanData.warmup || [],
                  techniques: lessonPlanData.techniques || [],
                  simulations: lessonPlanData.simulations || [],
                  cooldown: lessonPlanData.cooldown || [],
                  objectives: lessonPlanData.objectives || [],
                  equipment: lessonPlanData.equipment || [],
                  activities: Array.isArray(lessonPlanData.activities) ? 
                    lessonPlanData.activities.map(act => typeof act === 'string' ? act : act.name || act.description || '') :
                    [],
                  version: 1,
                  isActive: true,
                  mentalModule: lessonPlanData.mentalModule,
                  tacticalModule: lessonPlanData.tacticalModule,
                  adaptations: lessonPlanData.adaptations,
                },
              });
              
              result = savedLessonPlan;
              logger.info({ lessonNumber, version: 1 }, '✅ New lesson plan created');
            } else {
              result = lessonPlanData;
            }
          } else {
            result = lessonPlanData;
          }
          
          break;

        case 'complete':
          result = await AIService.generateLessonPlans({
            courseId,
            courseName: course.name,
            courseLevel: course.level.toString(),
            documentAnalysis: courseAnalysis,
            techniques: course.techniques.map(ct => ct.technique),
            generateCount: 8,
            weekRange: { start: 1, end: 4 },
            aiProvider: provider,
          });
          break;

        default:
          return reply.code(400).send({
            success: false,
            error: `Unsupported generation type: ${type}. Supported types: techniques, lesson, complete`,
          });
      }

      logger.info({ type, resultCount: Array.isArray(result) ? result.length : 1 }, '✅ AI content generated successfully');

      return reply.send({
        success: true,
        data: result,
        metadata: {
          courseId,
          type,
          provider,
          useRag,
          generatedAt: new Date().toISOString(),
        },
      });

    } catch (error: any) {
      logger.error({ error }, '❌ Error in AI content generation');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to generate AI content',
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
