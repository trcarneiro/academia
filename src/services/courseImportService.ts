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
  id?: string;
  courseId: string;
  name: string;
  description: string;
  durationTotalWeeks: number;
  totalLessons: number;
  lessonDurationMinutes: number;
  objectives: string[];
  requirements?: string[];
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
  
  // ==========================================
  // NOVOS CAMPOS v2.0 (Enhanced Course Model)
  // ==========================================
  
  graduation?: {
    currentBelt: string;
    nextBelt: string;
    beltColor?: string;
    nextBeltColor?: string;
    progressionSystem: {
      type: string;
      totalDegrees: number;
      degreePercentageIncrement: number;
      description?: string;
    };
    degrees: Array<{
      degree: number;
      name: string;
      requiredPercentage: number;
      requiredLessons: number;
      badge?: string;
      color?: string;
      description?: string;
      keyTechniques?: string[];
      estimatedWeeks?: string;
    }>;
    requirements: {
      forGraduation: {
        minimumAttendanceRate: number;
        minimumQualityRating: number;
        minimumRepetitionsTotal: number;
        minimumMonthsEnrolled: number;
        requiresInstructorApproval: boolean;
        requiresSimulationPass?: boolean;
      };
    };
  };
  
  activityCategories?: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    order: number;
    minimumForGraduation: number;
  }>;
  
  lessons?: Array<{
    lessonNumber: number;
    name: string;
    description?: string;
    durationMinutes?: number;
    objectives?: string[];
    isCheckpoint?: boolean;
    checkpointType?: string;
    degreeAchieved?: number;
    completionMessage?: string;
    nextStepMessage?: string;
    celebrationMessage?: string;
    isFinalExam?: boolean;
    
    activities: Array<{
      name: string;
      description?: string;
      categoryId: string;
      durationMinutes: number;
      repetitionsPerClass: number;
      intensityMultiplier: number;
      minimumForGraduation?: number;
      keyPoints?: string[];
      notes?: string;
      isEvaluation?: boolean;
      isSimulation?: boolean;
      requiresPass?: boolean;
      passingScore?: number;
    }>;
    
    totalRepetitionsPlanned?: number;
    estimatedIntensity?: string;
  }>;
  
  metadata?: {
    totalPlannedRepetitions?: number;
    averageRepetitionsPerLesson?: number;
    estimatedCompletionTimeWeeks?: number;
    requiredWeeklyFrequency?: number;
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    author?: string;
    notes?: string[];
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
      console.log('📊 Course model version:', courseData.metadata?.version || 'legacy');
      console.log('✨ Create missing techniques:', createMissingTechniques);

      const courseIdValue = courseData.courseId ?? courseData.id;
      if (!courseIdValue) {
        return createResponse.error('courseId é obrigatório para importação do curso');
      }

      // 0. Check for existing course with same ID
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseIdValue }
      });

      if (existingCourse) {
        console.log('❌ Course with this ID already exists:', existingCourse.name);
        return createResponse.error(
          `Curso já existe com ID "${courseIdValue}". Delete o curso existente antes de importar novamente.`,
          { existingCourseId: existingCourse.id, existingCourseName: existingCourse.name }
        );
      }

      // 1. Validate techniques exist in system
      const techniqueValidation = await this.validateTechniques(courseData.techniques);
      
      let techniquesCreated = 0;
      
      if (!techniqueValidation.allValid) {
        console.log('❌ Missing techniques found:', techniqueValidation.missing);
        
        if (createMissingTechniques) {
          console.log('✨ Creating missing techniques automatically...');
          
          // Criar técnicas faltantes
          const failedTechniques: Array<{ id: string; name: string; error: string }> = [];
          
          for (const missingTech of techniqueValidation.missing) {
            try {
              console.log(`🔄 Tentando criar técnica: "${missingTech.name}" (ID: ${missingTech.id})`);
              
              // Extrair categoria do nome (se possível)
              const category = this.extractCategoryFromName(missingTech.name);
              
              const newTechnique = await prisma.technique.create({
                data: {
                  id: missingTech.id,
                  name: missingTech.name,
                  slug: missingTech.name.toLowerCase().replace(/\s+/g, '-'),
                  category: category,
                  description: `Técnica importada automaticamente do curso ${courseData.name}`,
                  difficulty: 1, // BEGINNER = 1
                  objectives: [`Dominar a técnica: ${missingTech.name}`],
                  resources: [],
                  assessmentCriteria: [],
                  risksMitigation: [],
                  tags: [],
                  references: [],
                  prerequisites: [],
                  instructions: [],
                  stepByStep: [],
                  bnccCompetencies: []
                }
              });
              
              techniquesCreated++;
              console.log(`✅ Técnica criada com sucesso: ${newTechnique.name} (ID: ${newTechnique.id})`);
              
              // Adicionar ao mapeamento
              if (!techniqueValidation.slugMapping) {
                techniqueValidation.slugMapping = new Map();
              }
              techniqueValidation.slugMapping.set(missingTech.id, newTechnique.id);
              techniqueValidation.existing.push({ id: newTechnique.id, name: newTechnique.name });
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`❌ ERRO ao criar técnica "${missingTech.name}" (ID: ${missingTech.id}):`, errorMessage);
              failedTechniques.push({
                id: missingTech.id,
                name: missingTech.name,
                error: errorMessage
              });
            }
          }
          
          console.log(`✨ ${techniquesCreated} técnicas criadas automaticamente`);
          
          // SE ALGUMA TÉCNICA FALHOU, PARAR A IMPORTAÇÃO
          if (failedTechniques.length > 0) {
            console.error(`❌ ${failedTechniques.length} técnicas falharam na criação!`);
            console.error('Técnicas com falha:', JSON.stringify(failedTechniques, null, 2));
            return createResponse.error(
              `Falha ao criar ${failedTechniques.length} técnica(s). Importação cancelada.`,
              {
                failedTechniques,
                successfulTechniques: techniquesCreated,
                totalAttempted: techniqueValidation.missing.length
              }
            );
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

  const techniqueLookup = this.buildTechniqueLookup(courseData.techniques, techniqueValidation.slugMapping);

      // ==========================================
      // NEW v2.0: Enhanced Course Model Support
      // ==========================================
      
      let graduationResult = null;
      let categoriesResult = null;
      let lessonsResult = null;
      
      // 4a. NEW: Create graduation system if present
      if (courseData.graduation) {
        graduationResult = await this.createGraduationSystem(course.id, courseData.graduation);
      }
      
      // 4b. NEW: Create activity categories if present
      if (courseData.activityCategories) {
        categoriesResult = await this.createActivityCategories(course.id, courseData.activityCategories);
      }
      
      // 4c. NEW/MODIFIED: Create lessons with activities OR use legacy schedule
      if (courseData.lessons && courseData.lessons.length > 0) {
        // NEW v2.0 format: lessons array with activities
        lessonsResult = await this.createLessonsWithActivities(
          course.id,
          course.organizationId,
          courseData.lessons,
          techniqueLookup,
          categoriesResult?.courseCategoryLookup
        );
      } else if (courseData.schedule) {
        // LEGACY format: schedule.lessonsPerWeek
        const scheduleResult = await this.createSchedule(course.id, courseData.schedule);
        console.log('✅ Legacy schedule created for', courseData.schedule.weeks, 'weeks');
        lessonsResult = { lessonsCount: scheduleResult?.lessonCount || 0, activitiesCount: 0 };
      }
      
      // 4d. NEW: Save metadata
      if (courseData.metadata) {
        await this.saveMetadata(course.id, courseData.metadata);
      }

      // 5. Add extended metadata (legacy fields)
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
        version: courseData.metadata?.version || 'legacy',
        
        // Techniques
        techniqueCount: courseData.techniques.length,
        techniquesCreated: techniquesCreated,
        
        // Graduation (v2.0)
        graduation: graduationResult ? {
          currentBelt: graduationResult.currentBelt,
          nextBelt: graduationResult.nextBelt,
          degreesCount: graduationResult.degreesCount
        } : null,
        
        // Activity Categories (v2.0)
        activityCategories: categoriesResult?.categoriesCount || 0,
        
        // Lessons & Activities (v2.0 or legacy)
        lessonsCount: lessonsResult?.lessonsCount || 0,
        activitiesCount: lessonsResult?.activitiesCount || 0,
        totalRepetitionsPlanned: lessonsResult?.totalRepetitionsPlanned || 0,
        
        // Legacy
        weeksCreated: courseData.schedule?.weeks || null,
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

    const courseIdValue = courseData.courseId ?? courseData.id;
    if (!courseIdValue) {
      throw new Error('Course ID is required for import');
    }

    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseIdValue
      }
    });

    const durationWeeks = this.resolveDurationWeeks(courseData);
    const classesPerWeek = this.resolveClassesPerWeek(courseData, durationWeeks);
    const totalClasses = this.resolveTotalClasses(courseData, durationWeeks, classesPerWeek);
    const objectives = this.normalizeStringArray(courseData.objectives);
    const requirementsSource = courseData.requirements ?? courseData.equipment;
    const requirements = this.normalizeStringArray(requirementsSource);

    const courseCreateData = {
  id: courseIdValue,
      organizationId: organizationId,
      name: courseData.name,
      description: courseData.description,
      level: courseLevel,
      duration: durationWeeks,
      classesPerWeek: classesPerWeek,
      totalClasses: totalClasses,
      objectives: objectives,
      requirements: requirements,
      isActive: true,
      updatedAt: new Date()
    };

    if (existingCourse) {
      return await prisma.course.update({
        where: { id: courseIdValue },
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

  private static resolveDurationWeeks(courseData: any): number {
    const direct = Number(courseData?.durationTotalWeeks);
    if (Number.isFinite(direct) && direct > 0) {
      return Math.round(direct);
    }

    const scheduleWeeks = Number(courseData?.schedule?.weeks);
    if (Number.isFinite(scheduleWeeks) && scheduleWeeks > 0) {
      return Math.round(scheduleWeeks);
    }

    const parsedFromString = this.extractWeeksFromDuration(courseData?.duration);
    if (parsedFromString) {
      return parsedFromString;
    }

    const lessonsCount = this.resolveTotalClasses(courseData, 0, 0);
    const avgLessonsPerWeek = this.calculateAverageLessonsPerWeek(courseData);
    if (lessonsCount > 0 && avgLessonsPerWeek > 0) {
      return Math.max(1, Math.round(lessonsCount / avgLessonsPerWeek));
    }

    return 1;
  }

  private static resolveClassesPerWeek(courseData: any, durationWeeks: number): number {
    const averageFromSchedule = this.calculateAverageLessonsPerWeek(courseData);
    if (averageFromSchedule > 0) {
      return Math.max(1, Math.round(averageFromSchedule));
    }

    const lessonsCountRaw = courseData?.totalLessons ?? (Array.isArray(courseData?.lessons) ? courseData.lessons.length : undefined);
    const lessonsCount = Number(lessonsCountRaw);
    if (Number.isFinite(lessonsCount) && lessonsCount > 0 && durationWeeks > 0) {
      return Math.max(1, Math.round(lessonsCount / durationWeeks));
    }

    return 1;
  }

  private static resolveTotalClasses(courseData: any, durationWeeks?: number, classesPerWeek?: number): number {
    const lessonsCount = Number(courseData?.totalLessons);
    if (Number.isFinite(lessonsCount) && lessonsCount > 0) {
      return Math.round(lessonsCount);
    }

    if (Array.isArray(courseData?.lessons) && courseData.lessons.length > 0) {
      return courseData.lessons.length;
    }

    const scheduleLessons = Array.isArray(courseData?.schedule?.lessonsPerWeek)
      ? (courseData.schedule.lessonsPerWeek as Array<{ lessons?: number }>)
      : [];
    const scheduleTotal = scheduleLessons
      .map((item) => Number(item?.lessons ?? 0))
      .filter((value: number) => Number.isFinite(value) && value > 0)
      .reduce((sum: number, value: number) => sum + value, 0);
    if (scheduleTotal > 0) {
      return scheduleTotal;
    }

    if (durationWeeks && durationWeeks > 0 && classesPerWeek && classesPerWeek > 0) {
      return durationWeeks * classesPerWeek;
    }

    return 1;
  }

  private static calculateAverageLessonsPerWeek(courseData: any): number {
    if (!Array.isArray(courseData?.schedule?.lessonsPerWeek)) {
      return 0;
    }

    const lessonsPerWeek = courseData.schedule.lessonsPerWeek as Array<{ lessons?: number }>;
    const values = lessonsPerWeek
      .map((item) => Number(item?.lessons ?? 0))
      .filter((value: number) => Number.isFinite(value) && value > 0);

    if (!values.length) {
      return 0;
    }

    const average = values.reduce((sum: number, value: number) => sum + value, 0) / values.length;
    return average;
  }

  private static extractWeeksFromDuration(duration: any): number | undefined {
    if (typeof duration !== 'string') {
      return undefined;
    }

    const match = duration.match(/(\d+(?:[.,]\d+)?)\s*(?:semanas?|weeks?)/i);
    if (!match || !match[1]) {
      return undefined;
    }

    const value = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      return undefined;
    }

    return Math.round(value);
  }

  private static normalizeStringArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry.trim();
          }
          if (entry && typeof entry === 'object') {
            if ('description' in entry && typeof entry.description === 'string') {
              return entry.description.trim();
            }
            if ('name' in entry && typeof entry.name === 'string') {
              return entry.name.trim();
            }
          }
          return undefined;
        })
        .filter((entry): entry is string => !!entry && entry.length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }

    return [];
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
      await prisma.lessonPlanTechniques.deleteMany({
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
    // Validate gamificationData has rewards array
    if (!gamificationData || !gamificationData.rewards || !Array.isArray(gamificationData.rewards)) {
      console.log('⚠️ No rewards array in gamificationData, skipping gamification setup');
      return;
    }

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

  // ==========================================
  // NOVOS MÉTODOS v2.0 (Enhanced Course Model)
  // ==========================================

  /**
   * Create graduation system for course (v2.0)
   * Imports CourseGraduationLevel with degrees and requirements
   */
  private static async createGraduationSystem(courseId: string, graduation: any) {
    console.log('🎓 Creating graduation system...');
    
    try {
      // Delete existing graduation system if any
      await prisma.courseGraduationLevel.deleteMany({
        where: { courseId }
      });
      
      // Create CourseGraduationLevel record
      await prisma.courseGraduationLevel.create({
        data: {
          courseId,
          currentBelt: graduation.currentBelt,
          nextBelt: graduation.nextBelt,
          totalDegrees: graduation.progressionSystem.totalDegrees,
          degreePercentageIncrement: graduation.progressionSystem.degreePercentageIncrement,
          minimumAttendanceRate: graduation.requirements.forGraduation.minimumAttendanceRate,
          minimumQualityRating: graduation.requirements.forGraduation.minimumQualityRating,
          minimumRepetitionsTotal: graduation.requirements.forGraduation.minimumRepetitionsTotal,
          minimumMonthsEnrolled: graduation.requirements.forGraduation.minimumMonthsEnrolled,
          requiresInstructorApproval: graduation.requirements.forGraduation.requiresInstructorApproval
        }
      });
      
      console.log(`✅ Graduation system created: ${graduation.currentBelt} → ${graduation.nextBelt} (${graduation.degrees.length} degrees)`);
      
      return {
        currentBelt: graduation.currentBelt,
        nextBelt: graduation.nextBelt,
        degreesCount: graduation.degrees.length
      };
    } catch (error) {
      console.error('❌ Error creating graduation system:', error);
      throw error;
    }
  }

  /**
   * Create activity categories for course (v2.0)
   * Imports ActivityCategory records with minimums for graduation
   */
  private static async createActivityCategories(courseId: string, categories: any[]) {
    console.log('📂 Creating activity categories for course:', courseId);
    
    try {
      // Categories are global in the schema, but we'll store courseId reference in name
      const createdCategories = [];
      const courseCategoryLookup = new Map<string, { id: string; name: string }>();
      
      for (const category of categories) {
        // Check if category already exists (global)
        let existingCategory = await prisma.activityCategory.findFirst({
          where: { name: category.name }
        });
        
        if (!existingCategory) {
          existingCategory = await prisma.activityCategory.create({
            data: {
              name: category.name,
              description: category.description || null,
              color: category.color || null,
              icon: category.icon || null,
              order: category.order,
              minimumForGraduation: category.minimumForGraduation
            }
          });
          console.log(`  ✅ Created category: ${category.name} (min: ${category.minimumForGraduation})`);
        } else {
          console.log(`  ℹ️  Category already exists: ${category.name}`);
        }
        
        createdCategories.push(existingCategory);

        if (category.id) {
          courseCategoryLookup.set(category.id, {
            id: existingCategory.id,
            name: existingCategory.name
          });
        }
      }
      
      console.log(`✅ Activity categories processed: ${createdCategories.length}`);
      
      return {
        categoriesCount: createdCategories.length,
        categories: createdCategories.map(c => c.name),
        courseCategoryLookup
      };
    } catch (error) {
      console.error('❌ Error creating activity categories:', error);
      throw error;
    }
  }

  /**
   * Create lessons with activities array (v2.0)
   * Imports LessonPlan records with LessonPlanActivity children
   */
  private static buildTechniqueLookup(
    techniques: Array<{ id: string; name: string }> = [],
    slugMapping?: Map<string, string>
  ): Map<string, string> {
    const lookup = new Map<string, string>();

    const addKey = (key: string | undefined, value: string) => {
      if (!key) {
        return;
      }
      const normalized = key.trim();
      if (!normalized) {
        return;
      }
      if (!lookup.has(normalized)) {
        lookup.set(normalized, value);
      }
      const lower = normalized.toLowerCase();
      if (!lookup.has(lower)) {
        lookup.set(lower, value);
      }
    };

    techniques.forEach((technique) => {
      if (!technique?.id || !technique?.name) {
        return;
      }
      const resolvedId = slugMapping?.get(technique.id) ?? technique.id;
      const slugFromName = this.generateTechniqueSlug(technique.name);
      const slugFromId = this.generateTechniqueSlug(technique.id);

      addKey(technique.id, resolvedId);
      addKey(resolvedId, resolvedId);
      addKey(technique.name, resolvedId);
      addKey(slugFromName, resolvedId);
      addKey(slugFromId, resolvedId);
    });

    return lookup;
  }

  private static async buildActivityCategoryLookup() {
    const categories = await prisma.activityCategory.findMany({
      select: { id: true, name: true }
    });

    const lookup = new Map<string, { id: string; name: string }>();

    const register = (key: string | undefined, value: { id: string; name: string }) => {
      if (!key) {
        return;
      }
      const normalized = key.trim();
      if (!normalized) {
        return;
      }

      const variants = new Set<string>([
        normalized,
        normalized.toLowerCase(),
        this.generateTechniqueSlug(normalized)
      ]);

      for (const variant of variants) {
        if (variant && !lookup.has(variant)) {
          lookup.set(variant, value);
        }
      }
    };

    for (const category of categories) {
      register(category.id, category);
      register(category.name, category);
    }

    return lookup;
  }

  private static resolveActivityCategory(
    rawValue: string | undefined,
    categoryLookup: Map<string, { id: string; name: string }>
  ) {
    if (!rawValue) {
      return undefined;
    }

    const raw = rawValue.trim();
    if (!raw) {
      return undefined;
    }

    const candidates = [
      raw,
      raw.toLowerCase(),
      this.generateTechniqueSlug(raw)
    ];

    for (const candidate of candidates) {
      const match = categoryLookup.get(candidate);
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  private static generateTechniqueSlug(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private static resolveTechniqueIdForActivity(
    activity: any,
    techniqueLookup: Map<string, string>
  ): string | undefined {
    if (!activity || techniqueLookup.size === 0) {
      return undefined;
    }

    const candidates = new Set<string>();

    const directId = activity?.techniqueId ?? activity?.technique?.id;
    if (typeof directId === 'string') {
      candidates.add(directId);
      candidates.add(directId.toLowerCase());
      candidates.add(this.generateTechniqueSlug(directId));
    }

    if (typeof activity?.name === 'string') {
      candidates.add(activity.name);
      candidates.add(activity.name.toLowerCase());
      candidates.add(this.generateTechniqueSlug(activity.name));
    }

    for (const candidate of candidates) {
      const directHit = techniqueLookup.get(candidate);
      if (directHit) {
        return directHit;
      }
    }

    return undefined;
  }

  private static async createLessonsWithActivities(
    courseId: string,
    organizationId: string,
    lessons: any[],
    techniqueLookup: Map<string, string>,
    activityCategoryLookupFromCourse?: Map<string, { id: string; name: string }>
  ) {
    console.log('📚 Creating lessons with activities...');
    
    try {
      const categoryLookup = await this.buildActivityCategoryLookup();

      if (activityCategoryLookupFromCourse && activityCategoryLookupFromCourse.size > 0) {
        for (const [key, value] of activityCategoryLookupFromCourse.entries()) {
          const variants = new Set<string>([
            key,
            key.toLowerCase(),
            this.generateTechniqueSlug(key),
            value.name,
            value.name.toLowerCase(),
            this.generateTechniqueSlug(value.name)
          ]);

          for (const variant of variants) {
            if (variant && !categoryLookup.has(variant)) {
              categoryLookup.set(variant, value);
            }
          }
        }
      }
      let totalActivitiesCreated = 0;
      let totalTechniqueLinks = 0;
      const createdLessons = [];
      
      for (const lesson of lessons) {
        // Create LessonPlan
        const lessonPlan = await prisma.lessonPlan.create({
          data: {
            courseId,
            title: lesson.name,
            description: lesson.description || null,
            lessonNumber: lesson.lessonNumber,
            weekNumber: Math.ceil(lesson.lessonNumber / 2), // Assuming 2 lessons per week
            objectives: lesson.objectives || [],
            duration: lesson.durationMinutes || 60,
            warmup: lesson.warmup || {},
            techniques: lesson.techniques || {},
            simulations: lesson.simulations || {},
            cooldown: lesson.cooldown || {},
            activities: lesson.activities?.map((a: any) => a.name) || [],
            equipment: []
          }
        });

        const lessonTechniqueLinks: Array<{ techniqueId: string; order: number; allocationMinutes: number; objectiveMapping: string[] }> = [];
        const lessonTechniqueSet = new Set<string>();
        
        // Create activities for this lesson
        let activityOrder = 1;
        for (const activity of lesson.activities) {
          // Support both 'category' and 'categoryId' fields
          const categoryValue = activity.category || activity.categoryId;
          
          if (!categoryValue) {
            console.warn(`  ⚠️  Activity missing category: ${activity.name}, skipping`);
            continue;
          }
          
          // Find the ActivityCategory by name (from categoryId field)
          const category = this.resolveActivityCategory(categoryValue, categoryLookup);
          
          if (!category) {
            console.warn(`  ⚠️  Category not found: ${categoryValue}, skipping activity: ${activity.name}`);
            continue;
          }
          
          // Create a generic Activity record if it doesn't exist
          let activityRecord = await prisma.activity.findFirst({
            where: { 
              title: activity.name,
              categoryId: category.id
            }
          });
          
          if (!activityRecord) {
            activityRecord = await prisma.activity.create({
              data: {
                organizationId: organizationId,
                type: 'EXERCISE', // Default activity type
                title: activity.name,
                categoryId: category.id,
                description: activity.description || null,
                difficulty: 1,
                equipment: [],
                adaptations: []
              }
            });
          }
          
          // Create LessonPlanActivity link
          await prisma.lessonPlanActivity.create({
            data: {
              lessonPlanId: lessonPlan.id,
              activityId: activityRecord.id,
              segment: 'TECHNIQUE', // Default segment (singular)
              ord: activityOrder++,
              repetitionsPerClass: activity.repetitionsPerClass,
              intensityMultiplier: activity.intensityMultiplier,
              minimumForGraduation: activity.minimumForGraduation || null,
              objectives: activity.keyPoints?.join(', ') || null,
              safetyNotes: activity.notes || null
            }
          });
          
          totalActivitiesCreated++;

          const resolvedTechniqueId = this.resolveTechniqueIdForActivity(activity, techniqueLookup);
          if (resolvedTechniqueId && !lessonTechniqueSet.has(resolvedTechniqueId)) {
            lessonTechniqueSet.add(resolvedTechniqueId);
            lessonTechniqueLinks.push({
              techniqueId: resolvedTechniqueId,
              order: lessonTechniqueLinks.length + 1,
              allocationMinutes: Math.max(5, Math.round((lesson.durationMinutes || 60) / Math.max(lessonTechniqueLinks.length + 1, 1))),
              objectiveMapping: [`Praticar técnica: ${activity.name}`]
            });
          } else if (!resolvedTechniqueId) {
            console.warn(`  ⚠️  Could not resolve technique for activity: ${activity.name}`);
          }
        }
        
        if (lessonTechniqueLinks.length > 0) {
          const payload = lessonTechniqueLinks.map((link) => ({
            lessonPlanId: lessonPlan.id,
            techniqueId: link.techniqueId,
            order: link.order,
            allocationMinutes: link.allocationMinutes,
            objectiveMapping: link.objectiveMapping
          }));

          await prisma.lessonPlanTechniques.createMany({
            data: payload,
            skipDuplicates: true
          });

          totalTechniqueLinks += payload.length;
        }

        createdLessons.push(lessonPlan);
        
        if (lesson.isCheckpoint) {
          console.log(`  🎯 Checkpoint lesson created: #${lesson.lessonNumber} - ${lesson.name} (${lesson.activities.length} activities)`);
        } else {
          console.log(`  ✅ Lesson created: #${lesson.lessonNumber} - ${lesson.name} (${lesson.activities.length} activities)`);
        }
      }
      
      console.log(`✅ Lessons created: ${createdLessons.length} with ${totalActivitiesCreated} activities total`);
      console.log(`✅ Lesson technique links created: ${totalTechniqueLinks}`);
      
      return {
        lessonsCount: createdLessons.length,
        activitiesCount: totalActivitiesCreated,
        totalRepetitionsPlanned: lessons.reduce((sum, l) => sum + (l.totalRepetitionsPlanned || 0), 0)
      };
    } catch (error) {
      console.error('❌ Error creating lessons with activities:', error);
      throw error;
    }
  }

  /**
   * Save course metadata (v2.0)
   */
  private static async saveMetadata(courseId: string, metadata: any) {
    console.log('💾 Saving course metadata...');
    
    try {
      // Update course with metadata in prerequisites field (as JSON)
      await prisma.course.update({
        where: { id: courseId },
        data: {
          prerequisites: [JSON.stringify({
            version: metadata.version || '2.0.0',
            totalPlannedRepetitions: metadata.totalPlannedRepetitions,
            averageRepetitionsPerLesson: metadata.averageRepetitionsPerLesson,
            estimatedCompletionTimeWeeks: metadata.estimatedCompletionTimeWeeks,
            requiredWeeklyFrequency: metadata.requiredWeeklyFrequency,
            author: metadata.author,
            notes: metadata.notes || [],
            importDate: new Date().toISOString()
          })]
        }
      });
      
      console.log(`✅ Metadata saved (v${metadata.version})`);
    } catch (error) {
      console.error('❌ Error saving metadata:', error);
      throw error;
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
