import { z } from 'zod';
import { ClassStatus } from '@/types';

export const upcomingClassesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  date: z.string().datetime().optional(),
  instructorId: z.string().uuid().optional(),
  courseProgramId: z.string().uuid().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
});

export const classIdParamsSchema = z.object({
  id: z.string().uuid('ID da aula inválido'),
});

export const createClassSchema = z.object({
  scheduleId: z.string().uuid('ID do horário inválido'),
  instructorId: z.string().uuid('ID do instrutor inválido'),
  courseId: z.string().uuid('ID do curso inválido').optional(),
  // alias legado
  courseProgramId: z.string().uuid('ID do programa inválido').optional(),
  lessonPlanId: z.string().uuid().optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
  unitId: z.string().uuid().optional(),
  matId: z.string().uuid().optional(),
  maxStudents: z.coerce.number().int().min(1).max(500).optional(),
}).refine(d => d.courseId || d.courseProgramId, { message: 'courseId obrigatório', path: ['courseId']});

export const updateClassSchema = z.object({
  instructorId: z.string().uuid().optional(),
  lessonPlanId: z.string().uuid().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
  notes: z.string().optional(),
  unitId: z.string().uuid().optional(),
  matId: z.string().uuid().optional(),
  maxStudents: z.coerce.number().int().min(1).max(500).optional(),
  courseId: z.string().uuid().optional(),
});

export type UpcomingClassesQuery = z.infer<typeof upcomingClassesQuerySchema>;
export type ClassIdParams = z.infer<typeof classIdParamsSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema> & { courseId?: string };
export type UpdateClassInput = z.infer<typeof updateClassSchema>;