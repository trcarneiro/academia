import { z } from 'zod';

/**
 * Techniques Schema (BNCC-aligned)
 * - API-first contracts for Techniques module
 * - Follow CLAUDE.md: no hardcoded UI data; server validates/normalizes
 *
 * Enums reflect the confirmed design:
 * - category: pedagogical/educational technique taxonomy
 * - subcategory: optional, nested under category
 * - modality: delivery format
 * - complexity: effort/cognitive/operational complexity
 */

export const TechniqueCategoryEnum = z.enum([
  'ATIVA',
  'COLABORATIVA',
  'EXPOSITIVA',
  'AVALIACAO',
  'PRATICA',
  'DIGITAL',
  'SOCIOEMOCIONAL',
]);

export type TechniqueCategory = z.infer<typeof TechniqueCategoryEnum>;

export const TechniqueSubcategoryEnum = z.enum([
  // Examples (non-exhaustive). Server accepts as enum for consistency.
  'PROBLEMATIZACAO',
  'STUDY_CASE',
  'PEER_INSTRUCTION',
  'DEBATE',
  'SEMINARIO',
  'PALESTRA_ORIENTADA',
  'RUBRICA',
  'QUIZ_FORMATIVO',
  'PROJETO',
  'LABORATORIO',
  'SIMULACAO',
  'GAMIFICACAO',
  'APRENDIZAGEM_SOCIOEMOCIONAL',
  'ROLE_PLAY',
  'FLIPPED_CLASSROOM',
  'MAPA_MENTAL',
  'PAINEL',
  'JIGSAW',
  'SALA_DE_AULA_INVERTIDA',
  'DESIGN_THINKING',
  'KANBAN_EDUCACIONAL',
  'ESTUDO_DIRIGIDO',
  'AVALIACAO_PARES',
  'PORTFOLIO',
  'APRESENTACAO',
  'DISCUSSÃO_GUIADA',
]);

export type TechniqueSubcategory = z.infer<typeof TechniqueSubcategoryEnum>;

export const TechniqueModalityEnum = z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']);
export type TechniqueModality = z.infer<typeof TechniqueModalityEnum>;

export const TechniqueComplexityEnum = z.enum(['BASICA', 'INTERMEDIARIA', 'AVANCADA']);
export type TechniqueComplexity = z.infer<typeof TechniqueComplexityEnum>;

/**
 * Step definition:
 * - Allows rich step-by-step authoring with optional timing/resources and notes
 */
export const TechniqueStepSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  minutes: z.number().int().min(0).max(480).optional(),
  resources: z.array(z.string().min(1).max(160)).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * BNCC alignment item:
 * - code: BNCC code (e.g., EF06LP01)
 * - description: optional human-readable description
 */
export const BNCCAlignmentSchema = z.object({
  code: z.string().min(2).max(32),
  description: z.string().max(500).optional(),
});

/**
 * Core Technique schema (Create/Update payload)
 * Notes:
 * - slug should be URL-safe; service will normalize if needed
 * - objectives: learning objectives
 * - skills: transversal/disciplinary skills (not restricted to BNCC)
 * - tags: string[] (pragmatic choice; DB can later normalize into tag tables)
 * - relatedTechniqueIds handled via relational table in DB; here as string[] for convenience
 */
export const TechniqueBaseSchema = z.object({
  name: z.string().min(3).max(140),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9\-]+$/i, 'slug deve ser URL-safe (letras, números, hífens)'),
  shortDescription: z.string().min(10).max(400),
  objectives: z.array(z.string().min(3).max(400)).min(1),
  category: TechniqueCategoryEnum,
  subcategory: TechniqueSubcategoryEnum.optional(),
  modality: TechniqueModalityEnum,
  complexity: TechniqueComplexityEnum,

  durationMin: z.number().int().min(0).max(480),
  durationMax: z.number().int().min(0).max(480),

  groupSizeMin: z.number().int().min(1).max(500),
  groupSizeMax: z.number().int().min(1).max(500),

  ageRangeMin: z.number().int().min(0).max(120),
  ageRangeMax: z.number().int().min(0).max(120),

  resources: z.array(z.string().min(1).max(240)).default([]),
  stepByStep: z.array(TechniqueStepSchema).min(1),

  assessmentCriteria: z.array(z.string().min(3).max(400)).default([]),
  risksMitigation: z.array(z.string().min(3).max(400)).default([]),

  bnccCompetencies: z.array(BNCCAlignmentSchema).default([]),
  skills: z.array(z.string().min(2).max(160)).default([]),

  references: z.array(z.string().url().or(z.string().min(3).max(240))).default([]),
  tags: z.array(z.string().min(1).max(64)).default([]),

  // relatedTechniqueIds as convenience for API; persistence via relational table
  relatedTechniqueIds: z.array(z.string().min(1)).default([]),
}).refine((data) => {
  // Cross-field validation moved to object-level to satisfy Zod v3 signatures
  if (data.durationMax < data.durationMin) return false;
  if (data.groupSizeMax < data.groupSizeMin) return false;
  if (data.ageRangeMax < data.ageRangeMin) return false;
  return true;
}, {
  message: 'Parâmetros máximos devem ser maiores ou iguais aos mínimos (duração, tamanho do grupo, faixa etária)',
  path: ['durationMax'], // generic path; UI can surface message globally
});

/**
 * Create/Update DTOs
 */
export const CreateTechniqueSchema = TechniqueBaseSchema;
export type CreateTechniqueDto = z.infer<typeof CreateTechniqueSchema>;

/**
 * Nota: TechniqueBaseSchema está encadeado com superRefine, o que o transforma em ZodEffects.
 * Para obter uma versão parcial compatível, reconstruímos o objeto base explicitamente e aplicamos .partial().
 */
const TechniqueBasePlainObject = z.object({
  name: z.string().min(3).max(140),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9\-]+$/i, 'slug deve ser URL-safe (letras, números, hífens)'),
  shortDescription: z.string().min(10).max(400),
  objectives: z.array(z.string().min(3).max(400)).min(1),
  category: TechniqueCategoryEnum,
  subcategory: TechniqueSubcategoryEnum.optional(),
  modality: TechniqueModalityEnum,
  complexity: TechniqueComplexityEnum,

  durationMin: z.number().int().min(0).max(480),
  durationMax: z.number().int().min(0).max(480),

  groupSizeMin: z.number().int().min(1).max(500),
  groupSizeMax: z.number().int().min(1).max(500),

  ageRangeMin: z.number().int().min(0).max(120),
  ageRangeMax: z.number().int().min(0).max(120),

  resources: z.array(z.string().min(1).max(240)).default([]),
  stepByStep: z.array(TechniqueStepSchema).min(1),

  assessmentCriteria: z.array(z.string().min(3).max(400)).default([]),
  risksMitigation: z.array(z.string().min(3).max(400)).default([]),

  bnccCompetencies: z.array(BNCCAlignmentSchema).default([]),
  bnccCompetenciesText: z.string().optional(), // campo derivado opcional para serviços
  skills: z.array(z.string().min(2).max(160)).default([]),

  references: z.array(z.string().url().or(z.string().min(3).max(240))).default([]),
  tags: z.array(z.string().min(1).max(64)).default([]),

  relatedTechniqueIds: z.array(z.string().min(1)).default([]),
});

export const UpdateTechniqueSchema = TechniqueBasePlainObject.partial().extend({
  id: z.string().min(1).optional(),
});
export type UpdateTechniqueDto = z.infer<typeof UpdateTechniqueSchema>;

/**
 * Filtering and search
 */
export const TechniqueSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  category: TechniqueCategoryEnum.optional(),
  subcategory: TechniqueSubcategoryEnum.optional(),
  modality: TechniqueModalityEnum.optional(),
  complexity: TechniqueComplexityEnum.optional(),
  minDuration: z.number().int().min(0).max(480).optional(),
  maxDuration: z.number().int().min(0).max(480).optional(),
  minGroupSize: z.number().int().min(1).max(500).optional(),
  maxGroupSize: z.number().int().min(1).max(500).optional(),
  tag: z.string().optional(),
  bncc: z.string().optional(), // e.g., EF06LP01
  skill: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine((q) => {
  if (q.minDuration !== undefined && q.maxDuration !== undefined && q.maxDuration < q.minDuration) {
    return false;
  }
  if (q.minGroupSize !== undefined && q.maxGroupSize !== undefined && q.maxGroupSize < q.minGroupSize) {
    return false;
  }
  return true;
}, { message: 'Parâmetros mínimos não podem exceder os máximos' });

export type TechniqueSearchQuery = z.infer<typeof TechniqueSearchQuerySchema>;

/**
 * Response shapes
 * Follow docs/SYSTEM_ARCHITECTURE.md: { success, data, message? }
 */
export const TechniqueIdParamSchema = z.object({
  id: z.string().min(1),
});

export const TechniqueResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    technique: z.any(), // service will return typed entity; kept any in schema helper
  }),
  message: z.string().optional(),
});

export const TechniquesListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    techniques: z.array(z.any()),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }),
  message: z.string().optional(),
});

export const GenericErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

/**
 * Reference linking payloads
 * - EducationalPlanTechniques: order, notes
 * - LessonPlanTechniques: order, allocationMinutes, objectiveMapping
 */
export const LinkTechniqueToEducationalPlanSchema = z.object({
  educationalPlanId: z.string().min(1),
  techniqueId: z.string().min(1),
  order: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

export const LinkTechniqueToLessonPlanSchema = z.object({
  lessonPlanId: z.string().min(1),
  techniqueId: z.string().min(1),
  order: z.number().int().min(0).default(0),
  allocationMinutes: z.number().int().min(0).max(480).default(0),
  objectiveMapping: z.array(z.string().min(1).max(240)).default([]), // map objectives to technique usage
});

/**
 * Export helpers to plug into Fastify routes
 */
export const schemas = {
  TechniqueCategoryEnum,
  TechniqueSubcategoryEnum,
  TechniqueModalityEnum,
  TechniqueComplexityEnum,
  TechniqueStepSchema,
  BNCCAlignmentSchema,
  CreateTechniqueSchema,
  UpdateTechniqueSchema,
  TechniqueSearchQuerySchema,
  TechniqueIdParamSchema,
  TechniqueResponseSchema,
  TechniquesListResponseSchema,
  GenericErrorResponseSchema,
  LinkTechniqueToEducationalPlanSchema,
  LinkTechniqueToLessonPlanSchema,
};

export default schemas;