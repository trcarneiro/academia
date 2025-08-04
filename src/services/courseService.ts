
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
}

export interface UpdateCourseData extends Partial<CourseData> {}

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
    const updatedCourse = await prisma.course.update({
      where: { id },
      data,
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
