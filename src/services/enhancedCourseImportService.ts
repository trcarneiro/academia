import { ActivitySyncService } from './activitySyncService';
import { PrismaClient, CourseLevel, StudentCategory, LessonSegment } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Enhanced Course Import Service
 * 
 * Serviço aprimorado para importação de cursos que:
 * 1. Verifica e cria atividades para todas as técnicas do cronograma
 * 2. Suporta diferentes tipos de atividades (TECHNIQUE, STRETCH, DRILL, etc.)
 * 3. Gerencia associações curso-técnica corretamente
 */
export class EnhancedCourseImportService {

  /**
   * Importar curso completo com cronograma e atividades
   */
  static async importCourseWithActivities(
    courseData: any, 
    organizationId: string,
    options = {
      createMissingTechniques: true,
      createMissingActivities: true,
      syncExistingTechniques: false,
      dryRun: false
    }
  ) {
    console.log(`🚀 Iniciando importação do curso: ${courseData.name}`);
    
    const importStats = {
      courseCreated: false,
      courseTechniquesLinked: 0,
      activitiesCreated: 0,
      activitiesFound: 0,
      techniquesCreated: 0,
      lessonPlansCreated: 0,
      warnings: [] as string[],
      errors: [] as string[]
    };

    try {
      // 1. Sincronizar técnicas existentes primeiro (se solicitado)
      if (options.syncExistingTechniques) {
        console.log('🔄 Sincronizando técnicas existentes...');
        await ActivitySyncService.syncTechniquesToActivities(organizationId, {
          createMissing: true,
          updateExisting: false,
          dryRun: options.dryRun
        });
      }

      // 2. Processar cronograma para identificar todas as atividades necessárias
      const requiredActivities = await this.extractActivitiesFromSchedule(
        courseData.schedule,
        organizationId,
        options
      );

      console.log(`📋 Identificadas ${requiredActivities.length} atividades no cronograma`);
      importStats.activitiesFound = requiredActivities.filter(a => !a.created).length;
      importStats.activitiesCreated = requiredActivities.filter(a => a.created).length;
      importStats.techniquesCreated = requiredActivities.filter(a => a.techniqueCreated).length;

      // 3. Criar o curso (se não estiver em modo dry run)
      let course = null;
      if (!options.dryRun) {
        course = await this.createCourse(courseData, organizationId);
        importStats.courseCreated = true;
        console.log(`✅ Curso criado: ${course.name} (${course.id})`);
      } else {
        console.log(`🧪 [DRY RUN] Curso seria criado: ${courseData.name}`);
      }

      // 4. Vincular técnicas ao curso
      if (course && courseData.techniques) {
        const techniqueActivities = requiredActivities.filter(
          ra => ra.activity?.type === 'TECHNIQUE'
        );
        
        for (let i = 0; i < techniqueActivities.length; i++) {
          const activityRef = techniqueActivities[i];
          if (activityRef.activity?.refTechniqueId) {
            await this.linkTechniqueToCourse(
              course.id,
              activityRef.activity.refTechniqueId,
              i + 1, // orderIndex
              this.inferWeekFromTechnique(courseData, activityRef.originalRef)
            );
            importStats.courseTechniquesLinked++;
          }
        }
        
        console.log(`🔗 ${importStats.courseTechniquesLinked} técnicas vinculadas ao curso`);
      }

      // 5. Criar planos de aula baseados no cronograma
      if (course && courseData.schedule) {
        const lessonPlans = await this.createLessonPlansFromSchedule(
          course.id,
          courseData.schedule,
          requiredActivities
        );
        importStats.lessonPlansCreated = lessonPlans.length;
        console.log(`📚 ${lessonPlans.length} planos de aula criados`);
      }

      // 6. Relatório final
      console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
      console.log(`📚 Curso: ${importStats.courseCreated ? 'Criado' : 'Não criado (dry run)'}`);
      console.log(`🔗 Técnicas vinculadas: ${importStats.courseTechniquesLinked}`);
      console.log(`➕ Atividades criadas: ${importStats.activitiesCreated}`);
      console.log(`✅ Atividades encontradas: ${importStats.activitiesFound}`);
      console.log(`🆕 Técnicas criadas: ${importStats.techniquesCreated}`);
      console.log(`📋 Planos de aula: ${importStats.lessonPlansCreated}`);

      if (importStats.warnings.length > 0) {
        console.log(`⚠️  Avisos: ${importStats.warnings.length}`);
        importStats.warnings.forEach(w => console.log(`  - ${w}`));
      }

      if (importStats.errors.length > 0) {
        console.log(`❌ Erros: ${importStats.errors.length}`);
        importStats.errors.forEach(e => console.log(`  - ${e}`));
      }

      return {
        success: true,
        course,
        stats: importStats
      };

    } catch (error) {
      console.error('❌ Erro na importação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stats: importStats
      };
    }
  }

  /**
   * Extrair todas as atividades necessárias do cronograma
   */
  private static async extractActivitiesFromSchedule(
    schedule: any,
    organizationId: string,
    options: any
  ) {
    const requiredActivities: any[] = [];
    const processedItems = new Set();

    for (const weekData of schedule.lessonsPerWeek) {
      if (weekData.focus && Array.isArray(weekData.focus)) {
        for (const focusItem of weekData.focus) {
          // Evitar duplicatas
          const itemKey = typeof focusItem === 'object' 
            ? focusItem.id 
            : focusItem;
          
          if (processedItems.has(itemKey)) continue;
          processedItems.add(itemKey);

          try {
            const activityResult = await ActivitySyncService.findOrCreateActivity(
              focusItem,
              organizationId,
              { createIfMissing: options.createMissingActivities }
            );

            requiredActivities.push({
              ...activityResult,
              originalRef: focusItem,
              week: weekData.week
            });

          } catch (error) {
            console.error(`❌ Erro ao processar item do cronograma:`, focusItem, error);
            requiredActivities.push({
              activity: null,
              created: false,
              originalRef: focusItem,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    return requiredActivities;
  }

  /**
   * Criar curso básico
   */
  private static async createCourse(courseData: any, organizationId: string) {
    // Buscar martial art padrão - primeiro pela organização, senão qualquer uma
    let martialArt = await prisma.martialArt.findFirst({
      where: { organizationId }
    });

    if (!martialArt) {
      // Se não houver arte marcial específica da organização, buscar qualquer uma
      martialArt = await prisma.martialArt.findFirst();
      
      if (!martialArt) {
        throw new Error('Nenhuma arte marcial encontrada no sistema');
      }
      
      console.log(`⚠️ Usando arte marcial padrão: ${martialArt.name} (organização diferente)`);
    }

    const courseCreateData = {
      id: courseData.courseId || undefined,
      organizationId,
      martialArtId: martialArt.id,
      name: courseData.title || courseData.name,
      description: courseData.description || '',
      level: courseData.level as CourseLevel,
      duration: courseData.estimatedDuration || 16,
      totalClasses: courseData.totalClasses || 32,
      category: courseData.studentCategory as StudentCategory,
      isActive: true,
      objectives: courseData.objectives || [],
      requirements: courseData.equipment || []
    };

    return await prisma.course.create({ data: courseCreateData });
  }

  /**
   * Vincular técnica ao curso
   */
  private static async linkTechniqueToCourse(
    courseId: string,
    techniqueId: string,
    orderIndex: number,
    weekNumber?: number
  ) {
    await prisma.courseTechnique.create({
      data: {
        courseId,
        techniqueId,
        orderIndex,
        weekNumber: weekNumber || Math.ceil(orderIndex / 3), // Estimar semana
        isRequired: true
      }
    });
  }

  /**
   * Inferir semana a partir da técnica no cronograma
   */
  private static inferWeekFromTechnique(courseData: any, techniqueRef: any): number {
    if (courseData.schedule && courseData.schedule.lessonsPerWeek) {
      for (const weekData of courseData.schedule.lessonsPerWeek) {
        if (weekData.focus && weekData.focus.some((item: any) => 
          (typeof item === 'object' && item.id === techniqueRef.id) ||
          item === techniqueRef
        )) {
          return weekData.week;
        }
      }
    }
    return 1; // Default para semana 1
  }

  /**
   * Criar planos de aula baseados no cronograma
   */
  private static async createLessonPlansFromSchedule(
    courseId: string,
    schedule: any,
    requiredActivities: any[]
  ) {
    const lessonPlans: any[] = [];
    let globalLessonNumber = 1; // Contador global de aulas

    for (const weekData of schedule.lessonsPerWeek) {
      for (let lessonInWeek = 1; lessonInWeek <= weekData.lessons; lessonInWeek++) {
        const lessonPlan = await prisma.lessonPlan.upsert({
          where: {
            courseId_lessonNumber: {
              courseId,
              lessonNumber: globalLessonNumber // Usar contador global
            }
          },
          create: {
            courseId,
            title: `Semana ${weekData.week} - Aula ${lessonInWeek}`,
            weekNumber: weekData.week,
            lessonNumber: globalLessonNumber, // Usar contador global
            objectives: [`Objetivos da semana ${weekData.week}`],
            duration: 60, // Default 60 minutos
            warmup: 'Aquecimento padrão',
            techniques: 'Técnicas da semana',
            simulations: 'Simulações práticas',
            cooldown: 'Relaxamento final'
          },
          update: {
            title: `Semana ${weekData.week} - Aula ${lessonInWeek}`,
            weekNumber: weekData.week,
            objectives: [`Objetivos da semana ${weekData.week}`]
          }
        });

        // Adicionar atividades do foco da semana
        if (weekData.focus) {
          let orderIndex = 1;
          
          for (const focusItem of weekData.focus) {
            const activityRef = requiredActivities.find(ra => 
              (typeof focusItem === 'object' && typeof ra.originalRef === 'object' && 
               focusItem.id === ra.originalRef.id) ||
              (typeof focusItem === 'string' && ra.originalRef === focusItem)
            );

            if (activityRef && activityRef.activity) {
              await prisma.lessonPlanActivity.upsert({
                where: {
                  lessonPlanId_ord: {
                    lessonPlanId: lessonPlan.id,
                    ord: orderIndex
                  }
                },
                create: {
                  lessonPlanId: lessonPlan.id,
                  activityId: activityRef.activity.id,
                  segment: this.inferSegmentFromActivity(activityRef.activity.type) as LessonSegment,
                  ord: orderIndex++,
                  objectives: `Praticar: ${activityRef.activity.title}`
                },
                update: {
                  activityId: activityRef.activity.id,
                  segment: this.inferSegmentFromActivity(activityRef.activity.type) as LessonSegment,
                  objectives: `Praticar: ${activityRef.activity.title}`
                }
              });
            }
          }
        }

        lessonPlans.push(lessonPlan);
        globalLessonNumber++; // Incrementar contador global
      }
    }

    return lessonPlans;
  }

  /**
   * Mapear dificuldade para nível
   */
  private static mapDifficultyToLevel(difficulty?: string): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'MASTER' {
    const mapping: { [key: string]: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'MASTER' } = {
      'Iniciante': 'BEGINNER',
      'Intermediário': 'INTERMEDIATE',
      'Avançado': 'ADVANCED',
      'Expert': 'EXPERT',
      'Mestre': 'MASTER'
    };
    
    return mapping[difficulty || 'Iniciante'] || 'BEGINNER';
  }

  /**
   * Inferir segmento da aula baseado no tipo de atividade
   */
  private static inferSegmentFromActivity(activityType: string): string {
    const segmentMapping: { [key: string]: string } = {
      'STRETCH': 'STRETCH',
      'TECHNIQUE': 'TECHNIQUE',
      'DRILL': 'DRILL',
      'EXERCISE': 'WARMUP',
      'CHALLENGE': 'SIMULATION',
      'ASSESSMENT': 'SIMULATION',
      'GAME': 'DRILL'
    };

    return segmentMapping[activityType] || 'TECHNIQUE';
  }
}

export default EnhancedCourseImportService;
