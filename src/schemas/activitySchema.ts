import Joi from 'joi';

export const activitySchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  type: Joi.string().valid('aula', 'evento', 'workshop').required(),
  date: Joi.date().iso().required(),
  duration: Joi.number().integer().min(15).max(480).required(),
  description: Joi.string().allow('').max(500),
});

export const validateActivity = (data: any) => activitySchema.validate(data);