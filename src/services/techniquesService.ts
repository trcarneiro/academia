import { PrismaClient } from '@prisma/client';
import { CreateTechniqueDto, TechniqueSearchQuery, UpdateTechniqueDto } from '../schemas/techniques';

const prisma = new PrismaClient();

// Helpers
function normalizeSlug(input: string) {
  // simple slug normalization without external dependency
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')                      // non-alphanum to hyphen
    .replace(/^-+|-+$/g, '')                          // trim hyphens
    .substring(0, 160) || `tech-${Math.floor(Math.random()*1e9)}`;
}

function paginate(page: number, limit: number) {
  const take = limit;
  const skip = (page - 1) * limit;
  return { take, skip };
}

export type TechniqueEntity = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  objectives: string[];
  category: string;
  subcategory?: string | null;
  modality?: string;
  complexity?: string;
  durationMin?: number;
  durationMax?: number;
  groupSizeMin?: number;
  groupSizeMax?: number;
  ageRangeMin?: number;
  ageRangeMax?: number;
  resources?: string[];
  stepByStep?: any[];
  assessmentCriteria?: string[];
  risksMitigation?: string[];
  bnccCompetencies?: { code: string; description?: string | null }[] | any[];
  skills?: string[];
  references?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const TechniquesService = {
  async list(query: TechniqueSearchQuery) {
    const {
      q,
      category,
      subcategory,
      modality,
      complexity,
      minDuration,
      maxDuration,
      minGroupSize,
      maxGroupSize,
      tag,
      bncc,
      skill,
      page = 1,
      limit = 20,
    } = query;

    const { take, skip } = paginate(page, limit);

    // Build where clause
    const where: any = {};

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (modality) where.modality = modality;
    if (complexity) where.complexity = complexity;

    if (minDuration !== undefined || maxDuration !== undefined) {
      where.AND = where.AND || [];
      if (minDuration !== undefined) {
        where.AND.push({ durationMax: { gte: minDuration } });
      }
      if (maxDuration !== undefined) {
        where.AND.push({ durationMin: { lte: maxDuration } });
      }
    }

    if (minGroupSize !== undefined || maxGroupSize !== undefined) {
      where.AND = where.AND || [];
      if (minGroupSize !== undefined) {
        where.AND.push({ groupSizeMax: { gte: minGroupSize } });
      }
      if (maxGroupSize !== undefined) {
        where.AND.push({ groupSizeMin: { lte: maxGroupSize } });
      }
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (skill) {
      where.skills = { has: skill };
    }

    if (bncc) {
      // search using denormalized text if present
      where.OR = where.OR || [];
      where.OR.push(
        { bnccCompetenciesText: { contains: bncc, mode: 'insensitive' } },
      );
    }

    if (q) {
      where.OR = where.OR || [];
      where.OR.push(
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      );
    }

    const [total, items] = await Promise.all([
      prisma.technique.count({ where }),
      prisma.technique.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true as const,
      data: {
        techniques: items as unknown as TechniqueEntity[],
        pagination: { page, limit, total, totalPages },
      },
    };
  },

  async search(q: string, page = 1, limit = 20) {
    const { take, skip } = paginate(page, limit);
    const where: any = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { shortDescription: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
            { bnccCompetenciesText: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.technique.count({ where }),
      prisma.technique.findMany({
        where,
        skip,
        take,
        orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      success: true as const,
      data: {
        techniques: items as unknown as TechniqueEntity[],
        pagination: { page, limit, total, totalPages },
      },
    };
  },

  async getById(id: string) {
    const technique = await prisma.technique.findUnique({
      where: { id },
    });
    if (!technique) {
      return { success: false as const, error: 'Technique not found', code: 'TECHNIQUE_NOT_FOUND' };
    }
    return { success: true as const, data: { technique: technique as unknown as TechniqueEntity } };
  },

  async create(payload: CreateTechniqueDto) {
    const slug = normalizeSlug(payload.slug || payload.name);
    const bnccText = payload.bnccCompetencies?.map((c) => `${c.code} ${c.description ?? ''}`).join(' | ') ?? '';

    // check duplicates by slug or name
    const exists = await prisma.technique.findFirst({
      where: { OR: [{ slug }, { name: payload.name }] },
      select: { id: true },
    });
    if (Array.isArray(exists) ? exists.length > 0 : !!exists) {
      return { success: false as const, error: 'Technique already exists', code: 'TECHNIQUE_EXISTS' };
    }

    const created = await prisma.technique.create({
      data: {
        ...payload,
        slug,
        bnccCompetenciesText: bnccText,
      } as any,
    });
    return { success: true as const, data: { technique: created as unknown as TechniqueEntity } };
  },

  async update(id: string, payload: UpdateTechniqueDto) {
    const toUpdate: any = { ...payload };
    if (toUpdate.slug) toUpdate.slug = normalizeSlug(toUpdate.slug);

    if (toUpdate.bnccCompetencies) {
      toUpdate.bnccCompetenciesText = toUpdate.bnccCompetencies
        ?.map((c: any) => `${c.code} ${c.description ?? ''}`)
        .join(' | ');
    }

    // Usar update via raw para compatibilidade temporária com schema prisma
    const fields: string[] = [];
    const values: any[] = [];
    let param = 1;

    const pushField = (col: string, val: any, cast?: string) => {
      fields.push(`"${col}" = $${param}${cast ? `::${cast}` : ''}`);
      values.push(val);
      param++;
    };

    if (toUpdate.name !== undefined) pushField('name', toUpdate.name);
    if (toUpdate.slug !== undefined) pushField('slug', toUpdate.slug);
    if (toUpdate.shortDescription !== undefined) pushField('shortDescription', toUpdate.shortDescription);
    if (toUpdate.category !== undefined) pushField('category', toUpdate.category);
    if (toUpdate.subcategory !== undefined) pushField('subcategory', toUpdate.subcategory);
    if (toUpdate.modality !== undefined) pushField('modality', toUpdate.modality);
    if (toUpdate.complexity !== undefined) pushField('complexity', toUpdate.complexity);
    if (toUpdate.durationMin !== undefined) pushField('durationMin', toUpdate.durationMin);
    if (toUpdate.durationMax !== undefined) pushField('durationMax', toUpdate.durationMax);
    if (toUpdate.groupSizeMin !== undefined) pushField('groupSizeMin', toUpdate.groupSizeMin);
    if (toUpdate.groupSizeMax !== undefined) pushField('groupSizeMax', toUpdate.groupSizeMax);
    if (toUpdate.ageRangeMin !== undefined) pushField('ageRangeMin', toUpdate.ageRangeMin);
    if (toUpdate.ageRangeMax !== undefined) pushField('ageRangeMax', toUpdate.ageRangeMax);
    if (toUpdate.objectives !== undefined) pushField('objectives', JSON.stringify(toUpdate.objectives), 'jsonb');
    if (toUpdate.resources !== undefined) pushField('resources', JSON.stringify(toUpdate.resources), 'jsonb');
    if (toUpdate.stepByStep !== undefined) pushField('stepByStep', JSON.stringify(toUpdate.stepByStep), 'jsonb');
    if (toUpdate.assessmentCriteria !== undefined) pushField('assessmentCriteria', JSON.stringify(toUpdate.assessmentCriteria), 'jsonb');
    if (toUpdate.risksMitigation !== undefined) pushField('risksMitigation', JSON.stringify(toUpdate.risksMitigation), 'jsonb');
    if (toUpdate.bnccCompetencies !== undefined) pushField('bnccCompetencies', JSON.stringify(toUpdate.bnccCompetencies), 'jsonb');
    if (toUpdate.bnccCompetenciesText !== undefined) pushField('bnccCompetenciesText', toUpdate.bnccCompetenciesText);
    if (toUpdate.skills !== undefined) pushField('skills', JSON.stringify(toUpdate.skills), 'jsonb');
    if (toUpdate.references !== undefined) pushField('references', JSON.stringify(toUpdate.references), 'jsonb');
    if (toUpdate.tags !== undefined) pushField('tags', JSON.stringify(toUpdate.tags), 'jsonb');

    // updatedAt
    fields.push(`"updatedAt" = now()`);

    const setClause = fields.join(', ');
    await prisma.$executeRawUnsafe(
      `UPDATE techniques SET ${setClause} WHERE id = $${param}`,
      ...values, id
    );

    const updated = await prisma.technique.findUnique({ where: { id } as any });
    return { success: true as const, data: { technique: updated as any } };
  },

  async remove(id: string) {
    await prisma.technique.delete({ where: { id } });
    return { success: true as const, data: { technique: null } };
  },

  async linkToEducationalPlan(params: { techniqueId: string; educationalPlanId: string; order?: number; notes?: string }) {
    const { techniqueId, educationalPlanId, order = 0, notes } = params;

    // Ensure existence
    const technique = await prisma.technique.findUnique({ where: { id: techniqueId }, select: { id: true } });
    if (!technique) return { success: false as const, error: 'Technique not found', code: 'TECHNIQUE_NOT_FOUND' };

    // Use raw SQL if pivot model is not in Prisma client
    await prisma.$executeRawUnsafe(
      `INSERT INTO educational_plan_techniques ("educationalPlanId","techniqueId","order","notes")
       VALUES ($1,$2,$3,$4)
       ON CONFLICT ("educationalPlanId","techniqueId")
       DO UPDATE SET "order" = EXCLUDED."order", "notes" = EXCLUDED."notes"`,
      educationalPlanId, techniqueId, order, notes ?? null
    );

    return { success: true as const, data: { techniqueId, educationalPlanId, order, notes } };
  },

  async linkToLessonPlan(params: { techniqueId: string; lessonPlanId: string; order?: number; allocationMinutes?: number; objectiveMapping?: string[] }) {
    const { techniqueId, lessonPlanId, order = 0, allocationMinutes = 0, objectiveMapping = [] } = params;

    // Ensure existence
    const technique = await prisma.technique.findUnique({ where: { id: techniqueId }, select: { id: true } });
    if (!technique) return { success: false as const, error: 'Technique not found', code: 'TECHNIQUE_NOT_FOUND' };

    await prisma.$executeRawUnsafe(
      `INSERT INTO lesson_plan_techniques ("lessonPlanId","techniqueId","order","allocationMinutes","objectiveMapping")
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT ("lessonPlanId","techniqueId")
       DO UPDATE SET "order" = EXCLUDED."order", "allocationMinutes" = EXCLUDED."allocationMinutes", "objectiveMapping" = EXCLUDED."objectiveMapping"`,
      lessonPlanId, techniqueId, order, allocationMinutes, objectiveMapping as any
    );

    return { success: true as const, data: { techniqueId, lessonPlanId, order, allocationMinutes, objectiveMapping } };
  },
};

export default TechniquesService;