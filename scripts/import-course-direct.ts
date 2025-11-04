import fs from 'fs';
import path from 'path';
import { CourseImportService } from '../src/services/courseImportService';
import { prisma } from '../src/utils/database';

const ORGANIZATION_ID = process.argv[2] || '452c0b35-1822-4890-851e-922356c812fb';
const JSON_PATH = process.argv[3] || path.join(process.cwd(), 'cursos', 'cursokravmagafaixabranca-FIXED.json');

async function loadCourseData() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Course JSON not found: ${JSON_PATH}`);
  }

  const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const courseData = raw.course ?? raw;

  if (!courseData) {
    throw new Error('Invalid course JSON: missing course property');
  }

  const lessons: any[] = Array.isArray(courseData.lessons) ? courseData.lessons : [];
  const techniques = new Map<string, { id: string; name: string }>();

  const slugify = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  for (const lesson of lessons) {
    const lessonActivities: any[] = Array.isArray(lesson?.activities) ? lesson.activities : [];
    for (const activity of lessonActivities) {
      if (!activity?.name) {
        continue;
      }
      const id = slugify(activity.name);
      if (!techniques.has(id)) {
        techniques.set(id, { id, name: activity.name });
      }
    }
  }

  courseData.techniques = Array.from(techniques.values());

  if (!courseData.courseId) {
    courseData.courseId = courseData.id;
  }

  if (!courseData.durationTotalWeeks) {
    courseData.durationTotalWeeks = courseData.metadata?.estimatedCompletionTimeWeeks || 24;
  }

  if (!courseData.lessonDurationMinutes) {
    courseData.lessonDurationMinutes = 60;
  }

  if (!Array.isArray(courseData.objectives) || courseData.objectives.length === 0) {
    courseData.objectives = ['Aprender fundamentos do Krav Maga'];
  }

  if (!Array.isArray(courseData.equipment) || courseData.equipment.length === 0) {
    courseData.equipment = ['Luvas de treino', 'Protetor bucal'];
  }

  if (!courseData.schedule) {
    courseData.schedule = {
      weeks: courseData.durationTotalWeeks,
      lessonsPerWeek: []
    };
  }

  return courseData;
}

async function main() {
  try {
    console.log('📦 Loading course data from', JSON_PATH);
    const courseData = await loadCourseData();

    console.log('🏢 Using organization', ORGANIZATION_ID);
    console.log('📘 Course name:', courseData.name);
    console.log('📚 Lessons:', courseData.lessons?.length ?? 0);
    console.log('🥋 Techniques detected:', courseData.techniques?.length ?? 0);

    const result = await CourseImportService.importFullCourse(courseData, ORGANIZATION_ID, true);
    console.log('✅ Import finished:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
