import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { validateActivity } from '../schemas/activitySchema';
import type { ValidationErrorItem } from 'joi';

export const createActivity = async (req: Request, res: Response) => {
  const validation = validateActivity(req.body);
  if (validation.error) {
    const errorMessages = validation.error.details
      .map((d: ValidationErrorItem) => d.message)
      .join(', ');
    return res.status(400).json({ error: errorMessages });
  }

  try {
    // Verificar se atividade já existe
    const existing = await prisma.activity.findFirst({
      where: {
        title: req.body.title,
        date: new Date(req.body.date)
      }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Atividade já cadastrada nesta data' });
    }

    const activity = await prisma.activity.create({ data: req.body });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao criar atividade' });
  }
};

export const updateActivity = async (req: Request, res: Response) => {
  const validation = validateActivity(req.body);
  if (validation.error) {
    const errorMessages = validation.error.details
      .map((d: ValidationErrorItem) => d.message)
      .join(', ');
    return res.status(400).json({ error: errorMessages });
  }

  try {
    // Verificar conflito de título/data
    const existing = await prisma.activity.findFirst({
      where: {
        title: req.body.title,
        date: new Date(req.body.date),
        NOT: { id: req.params.id }
      }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Já existe outra atividade com este título na mesma data' });
    }

    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao atualizar atividade' });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    await prisma.activity.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Falha ao excluir atividade' });
  }
};

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao buscar atividades' });
  }
};