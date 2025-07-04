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
  courseProgramId: z.string().uuid('ID do programa inválido'),
  lessonPlanId: z.string().uuid().optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

export const updateClassSchema = z.object({
  instructorId: z.string().uuid().optional(),
  lessonPlanId: z.string().uuid().optional(),
  status: z.nativeEnum(ClassStatus).optional(),
  notes: z.string().optional(),
});

export type UpcomingClassesQuery = z.infer<typeof upcomingClassesQuerySchema>;
export type ClassIdParams = z.infer<typeof classIdParamsSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;