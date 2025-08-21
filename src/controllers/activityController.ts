import { Request, Response } from 'express';
import { prisma } from '@/utils/database';
import { validateActivity } from '../schemas/activitySchema';
import type { ValidationErrorItem } from 'joi';

// Helper function to get organization ID dynamically
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

export const createActivity = async (req: Request, res: Response) => {
  const validation = validateActivity(req.body);
  if (validation.error) {
    const errorMessages = validation.error.details
      .map((d: ValidationErrorItem) => d.message)
      .join(', ');
    return res.status(400).json({ error: errorMessages });
  }

  try {
    const organizationId = await getOrganizationId();
    
    // Verificar se atividade já existe
    const existing = await prisma.activity.findFirst({
      where: {
        organizationId,
        title: req.body.title,
        type: req.body.type
      }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Atividade já cadastrada com este título e tipo' });
    }

    const activity = await prisma.activity.create({ 
      data: {
        ...req.body,
        organizationId
      }
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({ error: 'Falha ao criar atividade' });
  }
};

export const updateActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID da atividade é obrigatório' });
  }

  const validation = validateActivity(req.body);
  if (validation.error) {
    const errorMessages = validation.error.details
      .map((d: ValidationErrorItem) => d.message)
      .join(', ');
    return res.status(400).json({ error: errorMessages });
  }

  try {
    const organizationId = await getOrganizationId();
    
    // Verificar se atividade existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });
    
    if (!existingActivity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    // Verificar conflito de título/tipo
    const existing = await prisma.activity.findFirst({
      where: {
        organizationId,
        title: req.body.title,
        type: req.body.type,
        NOT: { id }
      }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Já existe outra atividade com este título e tipo' });
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: activity });
  } catch (err) {
    console.error('Update activity error:', err);
    return res.status(500).json({ error: 'Falha ao atualizar atividade' });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID da atividade é obrigatório' });
  }

  try {
    // Verificar se atividade existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });
    
    if (!existingActivity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    await prisma.activity.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete activity error:', err);
    return res.status(500).json({ error: 'Falha ao excluir atividade' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const organizationId = await getOrganizationId();
    const query = req.query as any || {};
    
    // Filtros
    const where: any = { organizationId };
    if (query.type) where.type = query.type;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } }
      ];
    }
    
    // Paginação
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
    const skip = (page - 1) * pageSize;
    
    // Ordenação
    const sortField = String(query.sortField || '').trim();
    const sortOrder = String((query.sortOrder || 'desc')).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const allowedSortFields: Record<string, any> = {
      'createdAt': { createdAt: sortOrder },
      'title': { title: sortOrder },
      'type': { type: sortOrder },
      'difficulty': { difficulty: sortOrder }
    };
    const orderBy = allowedSortFields[sortField] || { createdAt: 'desc' };
    
    const [activities, count] = await Promise.all([
      prisma.activity.findMany({ 
        where, 
        orderBy, 
        skip, 
        take: pageSize,
        include: {
          refTechnique: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);
    
    return res.json({ 
      success: true, 
      data: activities, 
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    });
  } catch (err) {
    console.error('Get activities error:', err);
    return res.status(500).json({ error: 'Falha ao buscar atividades' });
  }
};

export const getActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID da atividade é obrigatório' });
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        refTechnique: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!activity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }
    
    return res.json({ success: true, data: activity });
  } catch (err) {
    console.error('Get activity error:', err);
    return res.status(500).json({ error: 'Falha ao buscar atividade' });
  }
};