import { z } from 'zod';

// Course Enrollment Schemas
export const CourseEnrollmentCreateSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID'),
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3'], {
    errorMap: () => ({ message: 'Invalid student category' }),
  }),
  gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Gender must be M or F' }),
  }),
  expectedEndDate: z.string().datetime('Expected end date must be a valid ISO datetime').optional(),
});

export const CourseEnrollmentUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'TRANSFERRED']).optional(),
  currentLesson: z.number().int().min(1).max(48).optional(),
  lessonsCompleted: z.number().int().min(0).max(48).optional(),
  attendanceRate: z.number().min(0).max(1).optional(),
  currentXP: z.number().int().min(0).optional(),
  currentLevel: z.number().int().min(1).optional(),
});

export const CourseEnrollmentQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'TRANSFERRED']).optional(),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['enrolledAt', 'attendanceRate', 'currentLevel', 'lessonsCompleted']).default('enrolledAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Technique Progress Schemas
export const TechniqueProgressCreateSchema = z.object({
  enrollmentId: z.string().uuid('Enrollment ID must be a valid UUID'),
  techniqueId: z.string().uuid('Technique ID must be a valid UUID'),
  status: z.enum(['LEARNING', 'PRACTICING', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTERED'], {
    errorMap: () => ({ message: 'Invalid technique proficiency status' }),
  }).optional(),
  accuracy: z.number().min(0, 'Accuracy cannot be negative').max(100, 'Accuracy cannot exceed 100').optional(),
  videoUrl: z.string().url('Video URL must be valid').optional(),
  instructorNotes: z.string().max(1000, 'Instructor notes cannot exceed 1000 characters').optional(),
});

export const TechniqueProgressUpdateSchema = TechniqueProgressCreateSchema.omit({
  enrollmentId: true,
  techniqueId: true,
});

export const TechniqueProgressQuerySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  techniqueId: z.string().uuid().optional(),
  status: z.enum(['LEARNING', 'PRACTICING', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTERED']).optional(),
  minAccuracy: z.coerce.number().min(0).max(100).optional(),
  instructorValidated: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Challenge Progress Schemas
export const ChallengeProgressCreateSchema = z.object({
  enrollmentId: z.string().uuid('Enrollment ID must be a valid UUID'),
  challengeId: z.string().uuid('Challenge ID must be a valid UUID'),
  actualMetric: z.number().int().min(0, 'Actual metric cannot be negative').optional(),
  actualTime: z.number().int().min(0, 'Actual time cannot be negative').optional(),
  videoUrl: z.string().url('Video URL must be valid').optional(),
  imageUrl: z.string().url('Image URL must be valid').optional(),
  instructorNotes: z.string().max(500, 'Instructor notes cannot exceed 500 characters').optional(),
});

export const ChallengeProgressUpdateSchema = ChallengeProgressCreateSchema.omit({
  enrollmentId: true,
  challengeId: true,
}).extend({
  instructorValidated: z.boolean().optional(),
});

export const ChallengeProgressQuerySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  challengeId: z.string().uuid().optional(),
  completed: z.coerce.boolean().optional(),
  attempted: z.coerce.boolean().optional(),
  instructorValidated: z.coerce.boolean().optional(),
  weekNumber: z.coerce.number().int().min(1).max(24).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Evaluation Schemas
export const TechniqueTestedSchema = z.object({
  techniqueId: z.string().uuid('Technique ID must be a valid UUID'),
  accuracy: z.number().min(0, 'Accuracy cannot be negative').max(100, 'Accuracy cannot exceed 100'),
  passed: z.boolean(),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export const PhysicalTestSchema = z.object({
  type: z.string().min(1, 'Physical test type is required').max(100),
  completed: z.number().int().min(0, 'Completed count cannot be negative'),
  target: z.number().int().min(0, 'Target cannot be negative'),
  passed: z.boolean(),
  timeInSeconds: z.number().int().min(0).optional(),
  notes: z.string().max(200).optional(),
});

export const EvaluationCreateSchema = z.object({
  enrollmentId: z.string().uuid('Enrollment ID must be a valid UUID'),
  type: z.enum(['GRADING', 'PROGRESS', 'TECHNIQUE', 'SPARRING', 'FITNESS', 'KNOWLEDGE'], {
    errorMap: () => ({ message: 'Invalid evaluation type' }),
  }),
  lessonNumber: z.number().int().min(1, 'Lesson number must be at least 1').max(48, 'Lesson number cannot exceed 48'),
  techniquesTested: z.array(TechniqueTestedSchema).min(1, 'At least one technique must be tested'),
  physicalTest: PhysicalTestSchema.optional(),
  overallScore: z.number().min(0, 'Overall score cannot be negative').max(100, 'Overall score cannot exceed 100'),
  passed: z.boolean(),
  instructorNotes: z.string().max(1000, 'Instructor notes cannot exceed 1000 characters').optional(),
  videoUrl: z.string().url('Video URL must be valid').optional(),
  recommendedActions: z.array(z.string().max(200)).max(10, 'Cannot have more than 10 recommended actions').optional(),
});

export const EvaluationUpdateSchema = EvaluationCreateSchema.omit({
  enrollmentId: true,
}).partial();

export const EvaluationQuerySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  type: z.enum(['GRADING', 'PROGRESS', 'TECHNIQUE', 'SPARRING', 'FITNESS', 'KNOWLEDGE']).optional(),
  passed: z.coerce.boolean().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  lessonNumber: z.coerce.number().int().min(1).max(48).optional(),
  evaluatedBy: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['evaluatedAt', 'overallScore', 'lessonNumber']).default('evaluatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Course Management Schemas
export const CourseCreateSchema = z.object({
  martialArtId: z.string().uuid('Martial art ID must be a valid UUID'),
  name: z.string().min(1, 'Course name is required').max(255, 'Course name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER'], {
    errorMap: () => ({ message: 'Invalid course level' }),
  }),
  duration: z.number().int().min(1, 'Duration must be at least 1 week').max(52, 'Duration cannot exceed 52 weeks'),
  classesPerWeek: z.number().int().min(1, 'Must have at least 1 class per week').max(7, 'Cannot have more than 7 classes per week').default(2),
  minAge: z.number().int().min(3, 'Minimum age cannot be less than 3').max(100, 'Minimum age cannot exceed 100').default(16),
  maxAge: z.number().int().min(3, 'Maximum age cannot be less than 3').max(100, 'Maximum age cannot exceed 100').optional(),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).default('ADULT'),
  prerequisites: z.array(z.string().uuid()).max(10, 'Cannot have more than 10 prerequisites').default([]),
  objectives: z.array(z.string().max(200)).max(20, 'Cannot have more than 20 objectives').default([]),
  requirements: z.array(z.string().max(200)).max(20, 'Cannot have more than 20 requirements').default([]),
  imageUrl: z.string().url('Image URL must be valid').optional(),
  nextCourseId: z.string().uuid().optional(),
}).refine(
  (data) => !data.maxAge || data.maxAge >= data.minAge,
  {
    message: 'Maximum age must be greater than or equal to minimum age',
    path: ['maxAge'],
  }
);

export const CourseUpdateSchema = CourseCreateSchema.omit({
  martialArtId: true,
}).partial();

export const CourseQuerySchema = z.object({
  martialArtId: z.string().uuid().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']).optional(),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).optional(),
  isActive: z.coerce.boolean().optional(),
  minAge: z.coerce.number().int().min(3).max(100).optional(),
  maxAge: z.coerce.number().int().min(3).max(100).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'level', 'duration', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Course Challenge Schemas
export const CourseChallengeCreateSchema = z.object({
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  weekNumber: z.number().int().min(1, 'Week number must be at least 1').max(24, 'Week number cannot exceed 24'),
  type: z.enum(['ATTENDANCE', 'TECHNIQUE', 'STREAK', 'SOCIAL', 'FITNESS', 'CUSTOM'], {
    errorMap: () => ({ message: 'Invalid challenge type' }),
  }),
  baseActivity: z.string().min(1, 'Base activity is required').max(255, 'Base activity cannot exceed 255 characters'),
  baseMetric: z.number().int().min(1, 'Base metric must be at least 1'),
  baseTime: z.number().int().min(1, 'Base time must be at least 1 second').optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  xpReward: z.number().int().min(1, 'XP reward must be at least 1').max(1000, 'XP reward cannot exceed 1000').default(15),
});

export const CourseChallengeUpdateSchema = CourseChallengeCreateSchema.omit({
  courseId: true,
  weekNumber: true,
}).partial();

export const CourseChallengeQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  type: z.enum(['ATTENDANCE', 'TECHNIQUE', 'STREAK', 'SOCIAL', 'FITNESS', 'CUSTOM']).optional(),
  weekNumber: z.coerce.number().int().min(1).max(24).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Student Stats and Progress Schemas
export const StudentStatsQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  includeProjections: z.coerce.boolean().default(false),
});

export const ProgressAnalysisQuerySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  includeRecommendations: z.coerce.boolean().default(true),
  includeDropoutRisk: z.coerce.boolean().default(true),
  includeCompletion: z.coerce.boolean().default(true),
});

// Gamification Schemas
export const AwardXPSchema = z.object({
  studentId: z.string().uuid('Student ID must be a valid UUID'),
  amount: z.number().int().min(1, 'XP amount must be at least 1').max(10000, 'XP amount cannot exceed 10000'),
  type: z.enum(['ATTENDANCE', 'TECHNIQUE', 'CHALLENGE', 'ACHIEVEMENT', 'EVALUATION'], {
    errorMap: () => ({ message: 'Invalid XP type' }),
  }),
  source: z.string().max(100, 'Source cannot exceed 100 characters').optional(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
});

export const LeaderboardQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  category: z.enum(['ADULT', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'HERO_1', 'HERO_2', 'HERO_3']).optional(),
  martialArtId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  metric: z.enum(['xp', 'level', 'attendance', 'techniques', 'challenges']).default('xp'),
});

// Validation helpers
export const validateUUID = (id: string, fieldName: string = 'ID') => {
  const result = z.string().uuid().safeParse(id);
  if (!result.success) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  return result.data;
};

export const validatePagination = (page?: number, limit?: number) => {
  const schema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  });
  
  return schema.parse({ page, limit });
};

export const validateDateRange = (fromDate?: string, toDate?: string) => {
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from > to) {
      throw new Error('From date cannot be after to date');
    }
    
    if (to > new Date()) {
      throw new Error('To date cannot be in the future');
    }
  }
  
  return {
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  };
};