import { prisma } from '@/utils/database';

// Simple response helper for service responses
const createResponse = {
  success: (message: string, data?: any) => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }),
  error: (message: string, data?: any) => ({
    success: false,
    message,
    data,
    timestamp: new Date().toISOString()
  })
};

export interface CourseImportData {
  courseId: string;
  name: string;
  description: string;
  durationTotalWeeks: number;
  totalLessons: number;
  lessonDurationMinutes: number;
  objectives: string[];
  equipment: string[];
  difficulty: string;
  techniques: Array<{ id: string; name: string }>;
  schedule: {
    weeks: number;
    lessonsPerWeek: Array<{
      week: number;
      lessons: number;
      focus: Array<{ id?: string; name?: string } | string>;
    }>;
  };
  warmup?: {
    description: string;
    duration: number;
    type: string;
  };
  cooldown?: {
    description: string;
    duration: number;
    type: string;
  };
  simulations?: Array<{
    description: string;
    type: string;
  }>;
  activities?: string[];
  physicalPreparation?: {
    description: string;
    exercises: Array<{
      name: string;
      duration?: string;
      repetitions?: number;
      type: string;
    }>;
  };
  supportResources?: Array<{
    type: string;
    description: string;
    url: string;
  }>;
  generalNotes?: string[];
  gamification?: {
    description: string;
    rewards: Array<{
      name: string;
      criteria: string;
      points: number;
    }>;
  };
  finalEvent?: {
    description: string;
    duration: string;
    type: string;
    date: string;
  };
}

export interface TechniqueValidation {
  allValid: boolean;
  existing: Array<{ id: string; title: string }>;
  missing: Array<{ id: string; name: string }>;
}

export class CourseImportService {
  /**
   * Import a complete course with schedule and techniques
   */
  static async importFullCourse(courseData: CourseImportData, organizationId: string) {
    try {
      console.log('🔍 Starting course import for:', courseData.name);

      // 1. Validate techniques exist in system
      const techniqueValidation = await this.validateTechniques(courseData.techniques);
      
      if (!techniqueValidation.allValid) {
        console.log('❌ Missing techniques found:', techniqueValidation.missing);
        return createResponse.error('Algumas técnicas não foram encontradas no sistema', {
          missingTechniques: techniqueValidation.missing,
          existingTechniques: techniqueValidation.existing.length
        });
      }

      console.log('✅ All techniques validated successfully');

      // 2. Create or update the main course
      const course = await this.createOrUpdateCourse(courseData, organizationId);
      console.log('✅ Course created/updated:', course.id);

      // 3. Associate techniques with the course
      await this.associateTechniques(course.id, courseData.techniques);
      console.log('✅ Techniques associated:', courseData.techniques.length);

      // 4. Create detailed schedule
      await this.createSchedule(course.id, courseData.schedule);
      console.log('✅ Schedule created for', courseData.schedule.weeks, 'weeks');

      // 5. Add extended metadata
      await this.addExtendedMetadata(course.id, courseData);
      console.log('✅ Extended metadata added');

      // 6. Setup gamification if present
      if (courseData.gamification) {
        await this.setupGamification(course.id, courseData.gamification);
        console.log('✅ Gamification configured');
      }

      return createResponse.success('Curso importado com sucesso', {
        courseId: course.id,
        courseName: course.name,
        techniquesAssociated: courseData.techniques.length,
        weeksCreated: courseData.schedule.weeks,
        totalLessons: courseData.totalLessons,
        hasGamification: !!courseData.gamification,
        importTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error importing course:', error);
      return createResponse.error('Erro interno na importação do curso', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate that all techniques exist in the system
   */
  static async validateTechniques(techniques: Array<{ id: string; name: string }>): Promise<TechniqueValidation> {
    const techniqueIds = techniques.map(t => t.id);
    
    // Check in activities table for techniques
    const existingActivities = await prisma.activity.findMany({
      where: {
        id: { in: techniqueIds },
        type: 'TECHNIQUE'
      },
      select: { id: true, title: true }
    });

    const existingIds = new Set(existingActivities.map(t => t.id));
    const missing = techniques.filter(t => !existingIds.has(t.id));

    return {
      allValid: missing.length === 0,
      existing: existingActivities,
      missing: missing
    };
  }

  /**
   * Preview import data without creating anything
   */
  static async validateImportData(courseData: CourseImportData) {
    try {
      // Validate basic structure
      const requiredFields = ['courseId', 'name', 'description', 'techniques', 'schedule'];
      const missingFields = requiredFields.filter(field => !(courseData as any)[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      // Validate techniques
      const techniqueValidation = await this.validateTechniques(courseData.techniques);

      // Validate schedule structure
      const scheduleValidation = this.validateSchedule(courseData.schedule);

      return {
        isValid: techniqueValidation.allValid && scheduleValidation.isValid,
        courseInfo: {
          name: courseData.name,
          duration: courseData.durationTotalWeeks,
          totalLessons: courseData.totalLessons,
          difficulty: courseData.difficulty
        },
        techniqueValidation: {
          total: courseData.techniques.length,
          valid: techniqueValidation.existing.length,
          missing: techniqueValidation.missing
        },
        scheduleValidation,
        warnings: [
          ...(techniqueValidation.missing.length > 0 ? ['Algumas técnicas precisam ser importadas primeiro'] : []),
          ...(scheduleValidation.warnings || [])
        ]
      };

    } catch (error) {
      throw new Error(`Erro na validação: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or update the main course record
   */
  private static async createOrUpdateCourse(courseData: CourseImportData, organizationId: string) {
    const courseLevel = this.mapDifficultyToLevel(courseData.difficulty);

    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseData.courseId
      }
    });

    const courseCreateData = {
      id: courseData.courseId,
      organizationId: organizationId,
      name: courseData.name,
      description: courseData.description,
      level: courseLevel,
      duration: courseData.durationTotalWeeks,
      classesPerWeek: Math.ceil(courseData.totalLessons / courseData.durationTotalWeeks),
      totalClasses: courseData.totalLessons,
      objectives: courseData.objectives,
      requirements: courseData.equipment,
      isActive: true,
      updatedAt: new Date()
    };

    if (existingCourse) {
      return await prisma.course.update({
        where: { id: courseData.courseId },
        data: courseCreateData
      });
    } else {
      return await prisma.course.create({
        data: {
          ...courseCreateData,
          createdAt: new Date()
        }
      });
    }
  }

  /**
   * Associate techniques with the course
   */
  private static async associateTechniques(courseId: string, techniques: Array<{ id: string; name: string }>) {
    // Remove existing associations
    await prisma.courseTechnique.deleteMany({
      where: { courseId }
    });

    // Create new associations
    const associations = techniques.map((technique, index) => ({
      courseId: courseId,
      techniqueId: technique.id,
      orderIndex: index + 1,
      isRequired: true,
      createdAt: new Date()
    }));

    await prisma.courseTechnique.createMany({
      data: associations
    });
  }

  /**
   * Create detailed schedule entries
   */
  private static async createSchedule(courseId: string, schedule: CourseImportData['schedule']) {
    // First, check if we have a course_schedule table or need to use a JSON field
    // For now, we'll store in the course metadata since the schema doesn't show a separate schedule table
    
    // Create lesson plans for each week/lesson combination
    let lessonNumber = 1;
    
    for (const weekData of schedule.lessonsPerWeek) {
      for (let lesson = 1; lesson <= weekData.lessons; lesson++) {
        const lessonName = `${courseId} - Semana ${weekData.week} - Aula ${lesson}`;
        
        // Create lesson plan
        const lessonPlan = await prisma.lessonPlan.create({
          data: {
            courseId: courseId,
            title: lessonName,
            description: `Plano de aula da semana ${weekData.week}, aula ${lesson}`,
            lessonNumber: lessonNumber,
            weekNumber: weekData.week,
            objectives: this.extractObjectivesFromFocus(weekData.focus),
            equipment: [],
            activities: [],
            warmup: {},
            techniques: {},
            simulations: {},
            cooldown: {},
            duration: 60, // Default lesson duration
            createdAt: new Date()
          }
        });

        // Associate activities/techniques with this lesson plan
        await this.addActivitiesToLessonPlan(lessonPlan.id, weekData.focus);
        
        lessonNumber++;
      }
    }
  }

  /**
   * Add extended metadata to course
   */
  private static async addExtendedMetadata(courseId: string, courseData: CourseImportData) {
    const extendedMetadata = {
      warmup: courseData.warmup,
      cooldown: courseData.cooldown,
      simulations: courseData.simulations,
      physicalPreparation: courseData.physicalPreparation,
      supportResources: courseData.supportResources,
      generalNotes: courseData.generalNotes,
      finalEvent: courseData.finalEvent,
      activities: courseData.activities,
      importSource: 'course-import-service',
      importDate: new Date().toISOString(),
      lessonDurationMinutes: courseData.lessonDurationMinutes
    };

    // Store in course description or a metadata field if available
    await prisma.course.update({
      where: { id: courseId },
      data: {
        // Store as JSON in prerequisites field for now (would be better with a dedicated metadata field)
        prerequisites: [JSON.stringify(extendedMetadata)]
      }
    });
  }

  /**
   * Setup gamification for the course
   */
  private static async setupGamification(courseId: string, gamificationData: any) {
    // Create challenges based on gamification rewards
    let weekNumber = 1;
    for (const reward of gamificationData.rewards) {
      await prisma.courseChallenge.create({
        data: {
          courseId: courseId,
          weekNumber: weekNumber++,
          type: 'TECHNIQUE',
          baseActivity: reward.name,
          baseMetric: reward.points,
          description: reward.criteria,
          xpReward: reward.points,
          createdAt: new Date()
        }
      });
    }
  }

  /**
   * Validate schedule structure
   */
  private static validateSchedule(schedule: any) {
    const warnings: string[] = [];
    
    if (!schedule.weeks || schedule.weeks <= 0) {
      return { isValid: false, warnings: ['Número de semanas inválido'] };
    }

    if (!schedule.lessonsPerWeek || !Array.isArray(schedule.lessonsPerWeek)) {
      return { isValid: false, warnings: ['Estrutura de aulas por semana inválida'] };
    }

    // Check if all weeks are covered
    const weekNumbers = schedule.lessonsPerWeek.map((w: any) => w.week);
    const maxWeek = Math.max(...weekNumbers);
    const minWeek = Math.min(...weekNumbers);

    if (maxWeek !== schedule.weeks) {
      warnings.push(`Última semana (${maxWeek}) não corresponde ao total de semanas (${schedule.weeks})`);
    }

    if (minWeek !== 1) {
      warnings.push('Cronograma não inicia na semana 1');
    }

    return {
      isValid: true,
      totalWeeks: schedule.weeks,
      totalLessons: schedule.lessonsPerWeek.reduce((sum: number, w: any) => sum + w.lessons, 0),
      warnings
    };
  }

  /**
   * Helper: Map difficulty string to CourseLevel enum
   */
  private static mapDifficultyToLevel(difficulty: string) {
    const difficultyMap: { [key: string]: any } = {
      'Iniciante': 'BEGINNER',
      'Básico': 'BEGINNER',
      'Intermediário': 'INTERMEDIATE',
      'Avançado': 'ADVANCED',
      'Expert': 'ADVANCED'
    };

    return difficultyMap[difficulty] || 'BEGINNER';
  }

  /**
   * Helper: Extract objectives from focus array
   */
  private static extractObjectivesFromFocus(focus: Array<any>): string[] {
    return focus
      .filter(item => typeof item === 'object' && item.name)
      .map(item => `Praticar: ${item.name}`)
      .concat(focus.filter(item => typeof item === 'string'))
      .slice(0, 5); // Limit to 5 objectives per lesson
  }

  /**
   * Helper: Add activities to lesson plan based on focus
   */
  private static async addActivitiesToLessonPlan(lessonPlanId: string, focus: Array<any>) {
    let orderIndex = 1;

    for (const focusItem of focus) {
      if (typeof focusItem === 'object' && focusItem.id) {
        // This is a technique reference
        const technique = await prisma.activity.findUnique({
          where: { id: focusItem.id }
        });

        if (technique) {
          await prisma.lessonPlanActivity.create({
            data: {
              lessonPlanId: lessonPlanId,
              activityId: technique.id,
              segment: 'TECHNIQUE',
              ord: orderIndex++,
              objectives: `Praticar técnica: ${focusItem.name}`,
              createdAt: new Date()
            }
          });
        }
      }
      // Could also handle string-based activities like "STRETCH", "DRILL", etc.
    }
  }
}
