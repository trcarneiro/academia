import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { validateActivity } from '../schemas/activitySchema';

export const createActivity = async (req: Request, res: Response) => {
  const { error } = validateActivity(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const activity = await prisma.activity.create({ data: req.body });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao criar atividade' });
  }
};

export const updateActivity = async (req: Request, res: Response) => {
  const { error } = validateActivity(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
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