import Joi from 'joi';

const ACTIVITY_TYPES = [
  'TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT'
];

export const activitySchema = Joi.object({
  type: Joi.string().valid(...ACTIVITY_TYPES).required(),
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().allow('').max(1000),
  equipment: Joi.array().items(Joi.string().max(100)).default([]),
  safety: Joi.string().allow('').max(500),
  adaptations: Joi.array().items(Joi.string().max(200)).default([]),
  difficulty: Joi.number().integer().min(1).max(10).allow(null),
  refTechniqueId: Joi.string().uuid().allow(null),
  defaultParams: Joi.object().allow(null)
});

export const validateActivity = (data: any) => activitySchema.validate(data);