import { z } from 'zod';

// Schema alinhado ao modelo CourseTemplate atual (prisma)
export const CourseTemplateCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.enum(['MARTIAL_ARTS', 'DANCE', 'FITNESS', 'LANGUAGE', 'MUSIC', 'OTHER']),
  duration: z.number().int().positive('Duração deve ser positiva'),
  classesPerWeek: z.number().int().min(1).max(14).default(2),
  totalClasses: z.number().int().positive('Total de aulas deve ser positivo'),
  minAge: z.number().int().min(1).default(16),
  maxAge: z.number().int().min(1).optional(),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  structure: z.any(),
  ragSettings: z.any().optional(),
  isSystemTemplate: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const CourseTemplateUpdateSchema = CourseTemplateCreateSchema.partial();

export type CourseTemplateCreateInput = z.infer<typeof CourseTemplateCreateSchema>;
export type CourseTemplateUpdateInput = z.infer<typeof CourseTemplateUpdateSchema>;
