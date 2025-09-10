
import { PrismaClient, Course, CourseLevel } from '@prisma/client';

const prisma = new PrismaClient();

export interface CourseData {
  name: string;
  description?: string;
  level: CourseLevel;
  duration: number;
  isActive?: boolean;
  organizationId: string;
  martialArtId: string;
  // Extended fields for complex course structure
  objectives?: string[];
  generalObjectives?: string[];
  specificObjectives?: string[];
  requirements?: string[];
  resources?: string[];
  targetAudience?: string;
  methodology?: string;
  teachingStyle?: string;
  evaluation?: {
    criteria?: string[];
    methods?: string[];
    requirements?: string;
  };
  evaluationCriteria?: string[];
}

export interface UpdateCourseData extends Partial<CourseData> {}

// Mapeia os dados do Prisma para o formato esperado pelo frontend
const mapCourseToViewModel = (course: Course) => {
  // Parse objectives into general and specific
  const objectives = course.objectives || [];
  const generalObjectives = objectives.filter(obj => !obj.startsWith('[') && !obj.includes('específico'));
  const specificObjectives = objectives.filter(obj => obj.includes('específico') || obj.startsWith('[ESPECÍFICO]'));
  const evaluationCriteria = objectives.filter(obj => obj.startsWith('[AVALIAÇÃO]')).map(c => c.replace('[AVALIAÇÃO] ', ''));
  
  return {
    id: course.id,
    name: course.name,
    description: course.description || '',
    level: course.level,
    totalLessons: course.totalClasses,
    studentsCount: 0, // Placeholder, a ser implementado futuramente
    avgProgress: 0, // Placeholder, a ser implementado futuramente
    status: course.isActive ? 'active' : 'draft',
    duration: `${course.duration} semanas`,
    category: course.level,
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    // Extended fields
    objectives: objectives,
    generalObjectives: generalObjectives,
    specificObjectives: specificObjectives,
    requirements: course.requirements || [],
    resources: course.requirements || [], // Alias for requirements
    targetAudience: course.category || 'ADULT',
    methodology: course.description || '', // Placeholder
    evaluation: {
      criteria: evaluationCriteria,
      methods: [],
      requirements: null
    },
    evaluationCriteria: evaluationCriteria
  };
};

export const courseService = {
  async getAllCourses(organizationId: string) {
    const courses = await prisma.course.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return courses.map(mapCourseToViewModel);
  },

  async getCourseById(id: string, organizationId: string) {
    const course = await prisma.course.findFirst({
      where: { id, organizationId },
      include: {
        techniques: {
          include: {
            technique: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        lessonPlans: {
          select: {
            id: true,
            title: true,
            weekNumber: true,
            lessonNumber: true,
            objectives: true
          },
          orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }]
        }
      }
    });

    if (!course) {
      return null;
    }
    
    // Map techniques with week information
    const techniques = course.techniques.map(ct => ({
      id: ct.technique.id,
      name: ct.technique.name,
      category: ct.technique.category,
      difficulty: ct.technique.complexity || 'Iniciante',
      time: ct.technique.durationMin ? `${ct.technique.durationMin} min` : 'Não definido',
      description: ct.technique.description || '',
      position: ct.orderIndex,
      weekNumber: ct.weekNumber,
      lessonNumber: ct.lessonNumber,
      isRequired: ct.isRequired
    }));
    
    // Generate schedule from lesson plans
    const schedule = {
      weeks: course.duration,
      lessonsPerWeek: [] as Array<{
        week: number;
        lessons: number;
        focus: string[];
        objectives: string[];
      }>
    };
    
    for (let week = 1; week <= course.duration; week++) {
      const weekPlans = course.lessonPlans.filter(lp => lp.weekNumber === week);
      
      schedule.lessonsPerWeek.push({
        week: week,
        lessons: course.classesPerWeek,
        focus: weekPlans.length > 0 ? weekPlans.map(p => p.title) : [`Semana ${week} - Foco Principal`],
        objectives: weekPlans.length > 0 ? weekPlans.flatMap(p => p.objectives || []) : []
      });
    }
    
    return {
      ...mapCourseToViewModel(course),
      techniques,
      schedule
    };
  },

  async createCourse(data: CourseData) {
    const newCourse = await prisma.course.create({
      data: {
        ...data,
        classesPerWeek: 2, // Valor padrão
        totalClasses: data.duration * 2, // Valor padrão
      },
    });
    return mapCourseToViewModel(newCourse);
  },

  async updateCourse(id: string, data: UpdateCourseData, organizationId: string) {
    // Process complex data structure  
    const updateData: any = { ...data };
    
    // Merge objectives arrays properly
    if (data.generalObjectives || data.specificObjectives) {
      const generalObjectives = data.generalObjectives || [];
      const specificObjectives = data.specificObjectives || [];
      updateData.objectives = [...generalObjectives, ...specificObjectives];
    } else if (data.objectives) {
      updateData.objectives = data.objectives;
    }
    
    // Merge resources and requirements
    if (data.resources) {
      updateData.requirements = data.requirements ? 
        [...data.requirements, ...data.resources] : 
        data.resources;
    }
    
    // Process evaluation criteria
    if (data.evaluation?.criteria) {
      // Store evaluation criteria in objectives for now
      // In future, add dedicated evaluation fields to schema
      const evalPrefix = data.evaluation.criteria.map(c => `[AVALIAÇÃO] ${c}`);
      updateData.objectives = updateData.objectives ? 
        [...updateData.objectives, ...evalPrefix] : 
        evalPrefix;
    }
    
    // Clean up nested objects that Prisma doesn't handle directly
    delete updateData.generalObjectives;
    delete updateData.specificObjectives;
    delete updateData.resources;
    delete updateData.evaluation;
    delete updateData.evaluationCriteria;

    console.log('🔄 Updating course with processed data:', updateData);
    
    const updatedCourse = await prisma.course.update({
      where: { id, organizationId }, // Add organizationId for security
      data: updateData,
    });
    return mapCourseToViewModel(updatedCourse);
  },

  async deleteCourse(id: string, organizationId: string): Promise<void> {
    // Primeiro, verificar se o curso pertence à organização para segurança
    const course = await prisma.course.findFirst({
        where: { id, organizationId },
    });

    if (!course) {
        throw new Error('Curso não encontrado ou não pertence à organização');
    }
      
    await prisma.course.delete({
      where: { id },
    });
  },
  
  async findCourseByName(name: string, organizationId: string, excludeId?: string) {
    const whereClause: any = {
      name,
      organizationId,
    };
    
    if (excludeId) {
      whereClause.NOT = {
        id: excludeId,
      };
    }
    
    return prisma.course.findFirst({
      where: whereClause,
    });
  }
};
