// @ts-nocheck
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

interface AnalyzeCourseResult {
  success: boolean;
  course?: any;
  metrics?: Record<string, number>;
  analysis?: string;
  recommendations?: string[];
  message?: string;
}

interface LessonPlanSuggestionResult {
  success: boolean;
  suggestion?: Record<string, unknown>;
  raw?: string;
  message?: string;
}

interface EvaluateLessonResult {
  success: boolean;
  lessonPlan?: any;
  metrics?: Record<string, number>;
  evaluation?: string;
  score?: number;
  message?: string;
}

async function getCourseWithRelations(courseId: string, organizationId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, organizationId },
    include: {
      lessonPlans: { include: { activityItems: true } },
      activityCategories: { include: { activities: true } },
      students: true
    }
  });
}

async function getLessonPlan(lessonPlanId: string, organizationId: string) {
  return prisma.lessonPlan.findFirst({
    where: { id: lessonPlanId, organizationId },
    include: { activities: true, activityItems: true }
  });
}

export const curriculumAgentService = {
  async analyzeCourse(courseId: string, organizationId: string): Promise<AnalyzeCourseResult> {
    const course = await getCourseWithRelations(courseId, organizationId);
    if (!course) {
      return { success: false, message: 'Course not found for organization' };
    }

    const lessonCount = course.lessonPlans?.length ?? 0;
    const activityCount = course.activityCategories?.reduce((total, cat) => total + (cat.activities?.length ?? 0), 0) ?? 0;
    const studentCount = course.students?.length ?? 0;

    logger.info(`Curriculum agent analyzed course ${courseId}`);

    return {
      success: true,
      course,
      metrics: {
        lessons: lessonCount,
        activities: activityCount,
        students: studentCount
      },
      analysis: 'Baseline curriculum analysis completed.',
      recommendations: [
        'Review lesson pacing based on student progress.',
        'Balance technical drills with sparring sessions.',
        'Ensure warm-up and cooldown are present in every lesson.'
      ]
    };
  },

  async createLessonPlan(courseId: string, lessonNumber: number, organizationId: string, userRequirements?: string): Promise<LessonPlanSuggestionResult> {
    const course = await getCourseWithRelations(courseId, organizationId);
    if (!course) {
      return { success: false, message: 'Course not found for organization' };
    }

    const suggestion = {
      lessonNumber,
      title: `Lesson ${lessonNumber}`,
      objectives: ['Refine fundamentals', 'Improve conditioning'],
      activities: [
        { name: 'Warm-up mobility', durationMinutes: 10 },
        { name: 'Technical drill', durationMinutes: 20 },
        { name: 'Applied practice', durationMinutes: 20 },
        { name: 'Cooldown', durationMinutes: 10 }
      ],
      notes: userRequirements || 'No additional requirements provided.'
    };

    logger.info(`Curriculum agent created lesson suggestion ${lessonNumber} for course ${courseId}`);

    return {
      success: true,
      suggestion,
      raw: JSON.stringify(suggestion)
    };
  },

  async evaluateLessonPlan(lessonPlanId: string, organizationId: string): Promise<EvaluateLessonResult> {
    const lessonPlan = await getLessonPlan(lessonPlanId, organizationId);
    if (!lessonPlan) {
      return { success: false, message: 'Lesson plan not found for organization' };
    }

    const activitiesCount = lessonPlan.activityItems?.length ?? lessonPlan.activities?.length ?? 0;
    const metrics = {
      activities: activitiesCount,
      durationMinutes: activitiesCount * 10
    };

    logger.info(`Curriculum agent evaluated lesson plan ${lessonPlanId}`);

    return {
      success: true,
      lessonPlan,
      metrics,
      evaluation: 'Lesson plan reviewed. Ensure objectives map to activities and include cooldown.',
      score: 0.8
    };
  }
};

