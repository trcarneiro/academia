import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../utils/errors';
import { CourseTemplateCreateSchema, CourseTemplateUpdateSchema } from '../schemas/courseTemplateSchema';

const prisma = new PrismaClient();

export interface CourseTemplateViewModel {
  id: string;
  name: string;
  description: string | null;
  category: string;          // CourseCategory enum as string
  duration: number;          // total duration (e.g. weeks or hours conforme schema)
  classesPerWeek: number;
  totalClasses: number;
  minAge: number;
  maxAge: number | null;
  objectives: string[];
  requirements: string[];
  structure: any;            // JSON structure
  ragSettings: any | null;   // JSON or null
  isSystemTemplate: boolean;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// New: list params/result types
export interface CourseTemplateListParams {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  isSystemTemplate?: boolean;
}
export interface CourseTemplateListResult {
  items: CourseTemplateViewModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CourseTemplateService {
  async getAllTemplates(organizationId: string): Promise<CourseTemplateViewModel[]> {
    const templates = await prisma.courseTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    return templates.map(this.mapToViewModel);
  }

  // New: DB-side pagination + filtering
  async listTemplates(params: CourseTemplateListParams): Promise<CourseTemplateListResult> {
    const { organizationId, page, limit, search, category, isSystemTemplate } = params;

    const where: any = { organizationId };
    if (category) where.category = category;
    if (typeof isSystemTemplate === 'boolean') where.isSystemTemplate = isSystemTemplate;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, templates] = await prisma.$transaction([
      prisma.courseTemplate.count({ where }),
      prisma.courseTemplate.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    return {
      items: templates.map(this.mapToViewModel),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTemplateById(id: string, organizationId: string): Promise<CourseTemplateViewModel | null> {
    const template = await prisma.courseTemplate.findFirst({ where: { id, organizationId } });
    return template ? this.mapToViewModel(template) : null;
  }

  async createTemplate(
    data: z.infer<typeof CourseTemplateCreateSchema>,
    organizationId: string
  ): Promise<CourseTemplateViewModel> {
    // Normalize nullable fields: ensure explicit null instead of undefined
    const normalized: any = { ...data };
    if (normalized.description === undefined) normalized.description = null;
    if (normalized.maxAge === undefined) normalized.maxAge = null;
    if (normalized.ragSettings === undefined) normalized.ragSettings = null;
    if (normalized.structure === undefined) normalized.structure = {};

    const template = await prisma.courseTemplate.create({
      data: {
        ...normalized,
        organizationId,
      }
    });
    return this.mapToViewModel(template);
  }

  async updateTemplate(
    id: string,
    data: z.infer<typeof CourseTemplateUpdateSchema>,
    organizationId: string
  ): Promise<CourseTemplateViewModel> {
    const existing = await prisma.courseTemplate.findFirst({ where: { id, organizationId } });
    if (!existing) throw new AppError('Template not found', 404);

    // Build update payload removing undefined and normalizing nullables
    const payload: Record<string, any> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        if (['description', 'maxAge', 'ragSettings'].includes(k) && v === undefined) {
          payload[k] = null;
        } else {
          payload[k] = v;
        }
      }
    }
    if (payload.description === undefined && data.description === undefined) {
      // leave unchanged
    }

    const updated = await prisma.courseTemplate.update({ where: { id }, data: payload });
    return this.mapToViewModel(updated);
  }

  async deleteTemplate(id: string, organizationId: string): Promise<void> {
    const existing = await prisma.courseTemplate.findFirst({ where: { id, organizationId } });
    if (!existing) throw new AppError('Template not found', 404);
    await prisma.courseTemplate.delete({ where: { id } });
  }

  // Placeholder: Course schema atual não suporta geração direta (campos divergentes).
  async createCourseFromTemplate(): Promise<string> {
    throw new AppError('createCourseFromTemplate indisponível: schema Course não possui campos esperados pelo template. Ajustar antes de habilitar.', 400);
  }

  private mapToViewModel(template: any): CourseTemplateViewModel {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      duration: template.duration,
      classesPerWeek: template.classesPerWeek,
      totalClasses: template.totalClasses,
      minAge: template.minAge,
      maxAge: template.maxAge,
      objectives: template.objectives || [],
      requirements: template.requirements || [],
      structure: template.structure,
      ragSettings: template.ragSettings,
      isSystemTemplate: template.isSystemTemplate,
      isActive: template.isActive,
      organizationId: template.organizationId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}