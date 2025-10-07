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
  existing: Array<{ id: string; name: string }>;
  missing: Array<{ id: string; name: string }>;
  slugMapping?: Map<string, string>; // Maps JSON technique ID to real technique ID
}

export class CourseImportService {
  /**
   * Import a complete course with schedule and techniques
   */
  static async importFullCourse(courseData: CourseImportData, organizationId: string, createMissingTechniques: boolean = false) {
    try {
      console.log('🔍 Starting course import for:', courseData.name);
      console.log('✨ Create missing techniques:', createMissingTechniques);

      // 1. Validate techniques exist in system
      const techniqueValidation = await this.validateTechniques(courseData.techniques);
      
      let techniquesCreated = 0;
      
      if (!techniqueValidation.allValid) {
        console.log('❌ Missing techniques found:', techniqueValidation.missing);
        
        if (createMissingTechniques) {
          console.log('✨ Creating missing techniques automatically...');
          
          // Criar técnicas faltantes
          for (const missingTech of techniqueValidation.missing) {
            try {
              // Extrair categoria do nome (se possível)
              const category = this.extractCategoryFromName(missingTech.name);
              
              const newTechnique = await prisma.technique.create({
                data: {
                  id: missingTech.id,
                  name: missingTech.name,
                  slug: missingTech.name.toLowerCase().replace(/\s+/g, '-'),
                  category: category,
                  description: `Técnica importada automaticamente do curso ${courseData.name}`,
                  difficulty: 1 // BEGINNER = 1
                }
              });
              
              techniquesCreated++;
              console.log(`✅ Técnica criada: ${newTechnique.name}`);
              
              // Adicionar ao mapeamento
              if (!techniqueValidation.slugMapping) {
                techniqueValidation.slugMapping = new Map();
              }
              techniqueValidation.slugMapping.set(missingTech.id, newTechnique.id);
              techniqueValidation.existing.push({ id: newTechnique.id, name: newTechnique.name });
              
            } catch (error) {
              console.error(`❌ Erro ao criar técnica ${missingTech.name}:`, error);
            }
          }
          
          console.log(`✨ ${techniquesCreated} técnicas criadas automaticamente`);
          
        } else {
          return createResponse.error('Algumas técnicas não foram encontradas no sistema', {
            missingTechniques: techniqueValidation.missing,
            existingTechniques: techniqueValidation.existing.length,
            hint: 'Ative a opção "Criar técnicas automaticamente" para criar as técnicas faltantes'
          });
        }
      }

      console.log('✅ All techniques validated/created successfully');

      // 2. Create or update the main course
      const course = await this.createOrUpdateCourse(courseData, organizationId);
      console.log('✅ Course created/updated:', course.id);

      // 3. Associate techniques with the course
      await this.associateTechniques(course.id, courseData.techniques, techniqueValidation.slugMapping);
      console.log('✅ Techniques associated:', courseData.techniques.length);

      // 4. Create detailed schedule
      const scheduleResult = await this.createSchedule(course.id, courseData.schedule);
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
        techniqueCount: courseData.techniques.length,
        techniquesCreated: techniquesCreated,
        lessonCount: scheduleResult?.lessonCount || courseData.totalLessons,
        weeksCreated: courseData.schedule.weeks,
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
   * Extract category from technique name
   */
  private static extractCategoryFromName(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('soco') || nameLower.includes('jab') || nameLower.includes('direto')) {
      return 'PUNCH';
    } else if (nameLower.includes('chute') || nameLower.includes('kick')) {
      return 'KICK';
    } else if (nameLower.includes('defesa') || nameLower.includes('defense')) {
      return 'DEFENSE';
    } else if (nameLower.includes('cotovelo')) {
      return 'ELBOW';
    } else if (nameLower.includes('joelho')) {
      return 'KNEE';
    } else if (nameLower.includes('queda') || nameLower.includes('rolamento')) {
      return 'FALL';
    } else if (nameLower.includes('postura') || nameLower.includes('guarda')) {
      return 'STANCE';
    } else if (nameLower.includes('agarramento') || nameLower.includes('estrangulamento')) {
      return 'GRAPPLING';
    }
    
    return 'OTHER';
  }

  /**
   * Validate that all techniques exist in the system
   */
  static async validateTechniques(techniques: Array<{ id: string; name: string }>): Promise<TechniqueValidation> {
    console.log(`🔍 Validating ${techniques.length} techniques...`);
    
    // First try to find by ID in technique table (exact match)
    const techniqueIds = techniques.map(t => t.id);
    
    console.log(`🔍 Looking for techniques by ID...`);
    const existingById = await prisma.technique.findMany({
      where: {
        id: { in: techniqueIds }
      },
      select: { id: true, name: true }
    });
    console.log(`✅ Found ${existingById.length} techniques by ID`);

    // If not found by ID, try intelligent name mapping
    const notFoundByIds = techniques.filter(t => !existingById.find(e => e.id === t.id));
    
    const nameMapping = new Map<string, string>();
    const existingByName: Array<{ id: string; name: string }> = [];
    
    if (notFoundByIds.length > 0) {
      console.log(`⚠️ ${notFoundByIds.length} techniques not found by ID, will try name matching`);
      console.log(`⚠️ Missing IDs:`, notFoundByIds.map(t => t.id).slice(0, 5).join(', '), '...');
      
      // OPTIMIZATION: Only do name matching if < 50 missing (otherwise too slow)
      if (notFoundByIds.length < 50) {
        console.log(`🔍 Starting name similarity matching...`);
        
        // Get all techniques from database for comparison
        const allTechniques = await prisma.technique.findMany({
          select: { id: true, name: true }
        });
        console.log(`📊 Database has ${allTechniques.length} techniques to compare`);
        
        for (const jsonTech of notFoundByIds) {
          // Extract keywords from JSON technique name
          const jsonKeywords = jsonTech.name
            .toLowerCase()
            .split(/[-\s,]+/)
            .filter(word => word.length > 2 && !['com', 'para', 'por', 'pela', 'pelo', 'contra', 'dos', 'das'].includes(word));
          
          let bestMatch = null;
          let bestScore = 0;
          
          // Evaluate each technique in database
          for (const dbTech of allTechniques) {
            const dbName = dbTech.name.toLowerCase();
            const dbId = dbTech.id.toLowerCase();
            let score = 0;

            // Calculate score based on keyword matches
            for (const keyword of jsonKeywords) {
              if (dbName.includes(keyword) || dbId.includes(keyword)) {
                score += keyword.length; // Longer words have more weight
              }
            }

            // Bonus for exact matches of specific words
            if (jsonKeywords.includes('soco') && (dbName.includes('soco') || dbId.includes('soco'))) {
              score += 10;
            }
            if (jsonKeywords.includes('defesa') && (dbName.includes('defesa') || dbId.includes('defesa'))) {
              score += 10;
            }
            if (jsonKeywords.includes('estrangulamento') && (dbName.includes('estrangulamento') || dbId.includes('estrangulamento'))) {
              score += 15;
            }
            if (jsonKeywords.includes('uppercut') && (dbName.includes('uppercut') || dbId.includes('uppercut'))) {
              score += 15;
            }
            if (jsonKeywords.includes('combinação') && (dbName.includes('combinação') || dbId.includes('combinacao'))) {
              score += 15;
            }
            if (jsonKeywords.includes('cotovelada') && (dbName.includes('cotovelada') || dbId.includes('cotovelada'))) {
              score += 15;
            }

            if (score > bestScore) {
              bestScore = score;
              bestMatch = dbTech;
            }
          }
          
          // Only map if confidence score is high enough
          if (bestMatch && bestScore >= 5) {
            nameMapping.set(jsonTech.id, bestMatch.id);
            existingByName.push(bestMatch);
            console.log(`🔍 Mapped "${jsonTech.name}" -> "${bestMatch.name}" (${bestMatch.id}) [score: ${bestScore}]`);
          } else {
            console.log(`⚠️ Could not find good match for "${jsonTech.name}" (best score: ${bestScore})`);
          }
        }
      } else {
        console.log(`⏭️ Skipping name matching (too many missing: ${notFoundByIds.length})`);
      }
    } else {
      console.log(`✅ All ${existingById.length} techniques found by exact ID match`);
    }

    // Combine results
    const existing = [
      ...existingById,
      ...existingByName
    ];

    const existingIds = new Set([
      ...existingById.map(t => t.id),
      ...notFoundByIds.filter(t => nameMapping.has(t.id)).map(t => t.id)
    ]);

    const missing = techniques.filter(t => !existingIds.has(t.id) && !nameMapping.has(t.id));

    console.log(`📊 Validation complete: ${existing.length} found, ${missing.length} missing`);

    return {
      allValid: missing.length === 0,
      existing: existing,
      missing: missing,
      slugMapping: nameMapping // Contains JSON ID -> Real Technique ID mapping
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
  private static async associateTechniques(
    courseId: string, 
    techniques: Array<{ id: string; name: string }>, 
    slugMapping?: Map<string, string>
  ) {
    // Remove existing associations
    await prisma.courseTechnique.deleteMany({
      where: { courseId }
    });

    // Create new associations, mapping IDs if needed and removing duplicates
    const seenTechniqueIds = new Set<string>();
    const associations: Array<{
      courseId: string;
      techniqueId: string;
      orderIndex: number;
      isRequired: boolean;
    }> = [];

    techniques.forEach((technique) => {
      // Use mapped ID if available, otherwise use original ID
      const techniqueId = slugMapping?.get(technique.id) || technique.id;
      
      // Only add if we haven't seen this technique ID before
      if (!seenTechniqueIds.has(techniqueId)) {
        seenTechniqueIds.add(techniqueId);
        associations.push({
          courseId: courseId,
          techniqueId: techniqueId,
          orderIndex: associations.length + 1, // Use actual index in final array
          isRequired: true
        });
        console.log(`📌 Adding technique association: ${technique.name} → ${techniqueId} (order: ${associations.length})`);
      } else {
        console.log(`⚠️ Skipping duplicate technique: ${technique.name} → ${techniqueId}`);
      }
    });

    console.log(`✅ Creating ${associations.length} unique technique associations`);

    if (associations.length > 0) {
      await prisma.courseTechnique.createMany({
        data: associations
      });
    }
  }

  /**
   * Create detailed schedule entries
   * OPTIMIZED: Uses batch operations to avoid N+1 queries
   */
  private static async createSchedule(courseId: string, schedule: CourseImportData['schedule']) {
    console.log(`📅 Creating schedule for course ${courseId}: ${schedule.weeks} weeks, ${schedule.lessonsPerWeek.length} week entries`);
    
    // 🧹 CLEANUP: Delete existing lesson plans for this course to avoid unique constraint errors
    const existingLessonPlans = await prisma.lessonPlan.findMany({
      where: { courseId: courseId, isActive: true },
      select: { id: true, lessonNumber: true }
    });
    
    if (existingLessonPlans.length > 0) {
      console.log(`  🧹 Found ${existingLessonPlans.length} existing lesson plans, deleting...`);
      
      // Delete technique links first (foreign key constraint)
      await prisma.lessonPlanTechnique.deleteMany({
        where: {
          lessonPlanId: { in: existingLessonPlans.map(lp => lp.id) }
        }
      });
      
      // Delete lesson plans
      await prisma.lessonPlan.deleteMany({
        where: { courseId: courseId, isActive: true }
      });
      
      console.log(`  ✅ Cleanup complete, ready for fresh import`);
    }
    
    // OPTIMIZATION: Prepare all lesson plans data first
    const lessonPlansToCreate: any[] = [];
    const lessonTechniquesMap = new Map<number, Array<{ id: string; name: string }>>();
    
    let lessonNumber = 1;
    
    for (const weekData of schedule.lessonsPerWeek) {
      console.log(`  📌 Week ${weekData.week}: ${weekData.lessons} lessons, focus: ${weekData.focus?.length || 0} items`);
      
      for (let lesson = 1; lesson <= weekData.lessons; lesson++) {
        const lessonName = `${courseId} - Semana ${weekData.week} - Aula ${lesson}`;
        
        // Prepare lesson plan data
        lessonPlansToCreate.push({
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
          duration: 60,
          createdAt: new Date()
        });
        
        // Store techniques for this lesson
        if (weekData.focus && weekData.focus.length > 0) {
          const techniques = weekData.focus
            .filter(item => typeof item === 'object' && item.id)
            .map(item => ({ id: (item as any).id, name: (item as any).name }));
          
          if (techniques.length > 0) {
            lessonTechniquesMap.set(lessonNumber, techniques);
          }
        }
        
        lessonNumber++;
      }
    }
    
    console.log(`  ⚡ Creating ${lessonPlansToCreate.length} lesson plans in batch...`);
    
    // BATCH INSERT: Create all lesson plans at once
    const createdLessonPlans = await prisma.$transaction(
      lessonPlansToCreate.map(data => prisma.lessonPlan.create({ data }))
    );
    
    console.log(`  ✅ Created ${createdLessonPlans.length} lesson plans`);
    
    // Now link techniques to lesson plans
    if (lessonTechniquesMap.size > 0) {
      console.log(`  🔗 Linking techniques to ${lessonTechniquesMap.size} lessons...`);
      
      // Fetch all techniques we need (batch fetch)
      const allTechniqueIds = Array.from(lessonTechniquesMap.values())
        .flat()
        .map(t => t.id);
      
      const uniqueTechniqueIds = [...new Set(allTechniqueIds)];
      
      console.log(`  🔍 Fetching ${uniqueTechniqueIds.length} unique techniques...`);
      
      const techniques = await prisma.technique.findMany({
        where: { id: { in: uniqueTechniqueIds } },
        select: { id: true, name: true }
      });
      
      const techniqueMap = new Map(techniques.map(t => [t.id, t]));
      console.log(`  ✅ Found ${techniques.length} techniques in database`);
      
      // Prepare all technique links
      const techniqueLinksToCreate: any[] = [];
      
      for (const lessonPlan of createdLessonPlans) {
        const lessonTechniques = lessonTechniquesMap.get(lessonPlan.lessonNumber);
        
        if (lessonTechniques && lessonTechniques.length > 0) {
          let order = 1;
          
          for (const tech of lessonTechniques) {
            const technique = techniqueMap.get(tech.id);
            
            if (technique) {
              techniqueLinksToCreate.push({
                lessonPlanId: lessonPlan.id,
                techniqueId: technique.id,
                order: order++,
                allocationMinutes: 15,
                objectiveMapping: [`Praticar técnica: ${technique.name}`]
              });
            } else {
              console.warn(`    ⚠️ Technique not found: ${tech.id} (${tech.name})`);
            }
          }
        }
      }
      
      if (techniqueLinksToCreate.length > 0) {
        console.log(`  ⚡ Creating ${techniqueLinksToCreate.length} technique links in batch...`);
        
        // BATCH INSERT: Create all technique links at once
        await prisma.lessonPlanTechniques.createMany({
          data: techniqueLinksToCreate,
          skipDuplicates: true
        });
        
        console.log(`  ✅ Created ${techniqueLinksToCreate.length} technique links`);
      }
    }
    
    console.log(`✅ Schedule created: ${createdLessonPlans.length} lessons total`);
    
    return {
      lessonCount: createdLessonPlans.length,
      weeks: schedule.weeks
    };
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
   * @deprecated Not used anymore - functionality moved to createSchedule for batch operations
   */
  /* private static async addActivitiesToLessonPlan(lessonPlanId: string, focus: Array<any>) {
    if (!focus || focus.length === 0) {
      console.log(`  ⏭️ No focus items for lesson ${lessonPlanId}`);
      return;
    }
    
    console.log(`  🎯 Processing ${focus.length} focus items for lesson ${lessonPlanId}`);
    
    // Collect all technique IDs from focus array
    const techniqueIds = focus
      .filter(item => typeof item === 'object' && item.id)
      .map(item => item.id);
    
    // Batch fetch all techniques at once (OPTIMIZATION: 1 query instead of N queries)
    let techniques: Array<{ id: string; name: string }> = [];
    if (techniqueIds.length > 0) {
      console.log(`  🔍 Fetching ${techniqueIds.length} techniques...`);
      techniques = await prisma.technique.findMany({
        where: { id: { in: techniqueIds } },
        select: { id: true, name: true }
      });
      console.log(`  ✅ Found ${techniques.length} techniques in database`);
    }
    
    const techniqueMap = new Map(techniques.map(t => [t.id, t]));
    
    let order = 1;
    const techniquesToLink = [];

    for (const focusItem of focus) {
      if (typeof focusItem === 'object' && focusItem.id) {
        // This is a technique reference
        const technique = techniqueMap.get(focusItem.id);

        if (technique) {
          techniquesToLink.push({
            lessonPlanId: lessonPlanId,
            techniqueId: technique.id,
            order: order++,
            allocationMinutes: 15, // Default 15 minutes per technique
            objectiveMapping: [`Praticar técnica: ${technique.name}`]
          });
        } else {
          console.warn(`  ⚠️ Technique not found: ${focusItem.id} (${focusItem.name})`);
        }
      } else if (typeof focusItem === 'string') {
        // Handle activity types like "STRETCH", "DRILL", "CHALLENGE"
        console.log(`  ℹ️ Activity type: ${focusItem}`);
      }
    }
    
    // Batch create all technique links (OPTIMIZATION: 1 query instead of N queries)
    if (techniquesToLink.length > 0) {
      await prisma.lessonPlanTechniques.createMany({
        data: techniquesToLink
      });
      console.log(`  ✅ Created ${techniquesToLink.length} lesson plan technique links`);
    }
  } */
}
