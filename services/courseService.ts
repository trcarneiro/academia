
import { PrismaClient, Course, CourseLevel } from '@prisma/client';

const prisma = new PrismaClient();

export interface CourseData {
  name: string;
  description: string | null;
  level: CourseLevel | null;
  duration: number;
  isActive: boolean;
  isBaseCourse?: boolean;
  organizationId: string;
  martialArtId: string;
  classesPerWeek?: number;
  totalClasses?: number;
}

export interface UpdateCourseData {
  name?: string | null | undefined;
  description?: string | null | undefined;
  level?: CourseLevel | null | undefined;
  duration?: number | null | undefined;
  isActive?: boolean | null | undefined;
  isBaseCourse?: boolean | null | undefined;
  organizationId?: string;
  martialArtId?: string;
}

// Mapeia os dados do Prisma para o formato esperado pelo frontend
const mapCourseToViewModel = (course: Course) => ({
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
  isBaseCourse: course.isBaseCourse,
  martialArtId: course.martialArtId,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
});

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
    });

    if (!course) {
      return null;
    }
    return mapCourseToViewModel(course);
  },

  async createCourse(data: CourseData) {
    const { classesPerWeek, totalClasses, ...rest } = data;
    
    // Preparar os dados para o Prisma, garantindo que null seja usado corretamente
    const prismaData: any = {
      ...rest,
      classesPerWeek: classesPerWeek ?? 2, // Valor padrão
      totalClasses: totalClasses ?? data.duration * 2, // Valor padrão
    };
    
    // Garantir que description e level sejam definidos corretamente
    prismaData.description = data.description;
    prismaData.level = data.level;

    const newCourse = await prisma.course.create({
      data: prismaData,
    });
    return mapCourseToViewModel(newCourse);
  },

  async updateCourse(id: string, data: UpdateCourseData, organizationId: string) {
    // Remover campos undefined para evitar erros no Prisma
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    
    const updatedCourse = await prisma.course.update({
      where: { id },
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
