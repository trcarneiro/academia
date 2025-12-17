/*
  Warnings:

  - You are about to drop the column `skills` on the `techniques` table. All the data in the column will be lost.
  - The `category` column on the `techniques` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `instructions` column on the `techniques` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `stepByStep` column on the `techniques` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bnccCompetencies` column on the `techniques` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_billingplancourses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "LessonSegment" AS ENUM ('WARMUP', 'STRETCH', 'TECHNIQUE', 'DRILL', 'SIMULATION', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('TECHNICAL', 'PHYSICAL', 'MIXED');

-- CreateEnum
CREATE TYPE "Metric" AS ENUM ('REPS', 'TIME', 'DISTANCE', 'LOAD');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('COLLECTIVE', 'PRIVATE', 'SEMI_PRIVATE');

-- CreateEnum
CREATE TYPE "TurmaStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- DropForeignKey
ALTER TABLE "_billingplancourses" DROP CONSTRAINT "_billingplancourses_a_fkey";

-- DropForeignKey
ALTER TABLE "_billingplancourses" DROP CONSTRAINT "_billingplancourses_b_fkey";

-- DropForeignKey
ALTER TABLE "educational_plan_techniques" DROP CONSTRAINT "educational_plan_techniques_technique_fkey";

-- DropForeignKey
ALTER TABLE "lesson_plan_techniques" DROP CONSTRAINT "lesson_plan_techniques_lesson_fkey";

-- DropForeignKey
ALTER TABLE "lesson_plan_techniques" DROP CONSTRAINT "lesson_plan_techniques_technique_fkey";

-- DropIndex
DROP INDEX "techniques_category_idx";

-- DropIndex
DROP INDEX "techniques_complexity_idx";

-- DropIndex
DROP INDEX "techniques_martialArtId_name_key";

-- DropIndex
DROP INDEX "techniques_modality_idx";

-- AlterTable
ALTER TABLE "achievements" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "asaas_customers" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "attendance_patterns" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "attendance_records" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "attendances" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "billing_plans" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "challenge_progress" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "challenges" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "class_schedules" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "course_challenges" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "course_enrollments" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "course_templates" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "evaluation_records" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "evaluations" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "financial_responsibles" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "financial_settings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "instructors" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lesson_plan_techniques" ALTER COLUMN "objectiveMapping" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lesson_plans" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "martial_arts" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "mats" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "organization_settings" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "progress_records" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "student_courses" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "student_progressions" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "student_subscriptions" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "technique_details" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "technique_libraries" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "technique_progress" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "technique_records" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "techniques" DROP COLUMN "skills",
ALTER COLUMN "martialArtId" DROP NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT,
ALTER COLUMN "difficulty" DROP NOT NULL,
ALTER COLUMN "difficulty" DROP DEFAULT,
DROP COLUMN "instructions",
ADD COLUMN     "instructions" JSONB[],
ALTER COLUMN "baseXP" DROP NOT NULL,
ALTER COLUMN "baseXP" DROP DEFAULT,
ALTER COLUMN "masteryXP" DROP NOT NULL,
ALTER COLUMN "masteryXP" DROP DEFAULT,
ALTER COLUMN "slug" DROP NOT NULL,
ALTER COLUMN "slug" DROP DEFAULT,
ALTER COLUMN "shortDescription" DROP NOT NULL,
ALTER COLUMN "shortDescription" DROP DEFAULT,
ALTER COLUMN "modality" DROP NOT NULL,
ALTER COLUMN "modality" DROP DEFAULT,
ALTER COLUMN "complexity" DROP NOT NULL,
ALTER COLUMN "complexity" DROP DEFAULT,
ALTER COLUMN "durationMin" DROP NOT NULL,
ALTER COLUMN "durationMin" DROP DEFAULT,
ALTER COLUMN "durationMax" DROP NOT NULL,
ALTER COLUMN "durationMax" DROP DEFAULT,
ALTER COLUMN "groupSizeMin" DROP NOT NULL,
ALTER COLUMN "groupSizeMin" DROP DEFAULT,
ALTER COLUMN "groupSizeMax" DROP NOT NULL,
ALTER COLUMN "groupSizeMax" DROP DEFAULT,
ALTER COLUMN "ageRangeMin" DROP NOT NULL,
ALTER COLUMN "ageRangeMin" DROP DEFAULT,
ALTER COLUMN "ageRangeMax" DROP NOT NULL,
ALTER COLUMN "ageRangeMax" DROP DEFAULT,
ALTER COLUMN "objectives" DROP DEFAULT,
ALTER COLUMN "resources" DROP DEFAULT,
ALTER COLUMN "assessmentCriteria" DROP DEFAULT,
ALTER COLUMN "risksMitigation" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "references" DROP DEFAULT,
DROP COLUMN "stepByStep",
ADD COLUMN     "stepByStep" JSONB[],
DROP COLUMN "bnccCompetencies",
ADD COLUMN     "bnccCompetencies" JSONB[],
ALTER COLUMN "bnccCompetenciesText" DROP NOT NULL;

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "weekly_challenges" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "_billingplancourses";

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safety" TEXT,
    "adaptations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" INTEGER,
    "refTechniqueId" TEXT,
    "defaultParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plan_activities" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "segment" "LessonSegment" NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 1,
    "params" JSONB,
    "objectives" TEXT,
    "safetyNotes" TEXT,
    "adaptations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plan_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_activities" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "segment" "LessonSegment" NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 1,
    "paramsUsed" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "adaptationsUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_criteria" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_definitions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "when" TEXT,
    "rubricId" TEXT,

    CONSTRAINT "assessment_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "evaluatorId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scoreTotal" INTEGER,
    "details" JSONB,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_test_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" "Metric" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "passThreshold" DOUBLE PRECISION,

    CONSTRAINT "physical_test_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_test_attempts" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN,
    "comment" TEXT,

    CONSTRAINT "physical_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_lessons" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "mood" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_activities" (
    "id" TEXT NOT NULL,
    "classActivityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "perceivedDifficulty" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_evaluations" (
    "id" TEXT NOT NULL,
    "classId" TEXT,
    "courseId" TEXT,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "criteria" JSONB,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_unlocks" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "badge_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_transactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "classType" "ClassType" NOT NULL DEFAULT 'COLLECTIVE',
    "status" "TurmaStatus" NOT NULL DEFAULT 'SCHEDULED',
    "instructorId" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 20,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "schedule" JSONB NOT NULL,
    "unitId" TEXT,
    "room" TEXT,
    "price" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_lessons" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" "TurmaStatus" NOT NULL DEFAULT 'SCHEDULED',
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techniques" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_students" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_attendances" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "turmaLessonId" TEXT NOT NULL,
    "turmaStudentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_courses" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plan_activities_lessonPlanId_ord_key" ON "lesson_plan_activities"("lessonPlanId", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "class_activities_classId_ord_key" ON "class_activities"("classId", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_lessons_classId_studentId_key" ON "feedback_lessons"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_activities_classActivityId_studentId_key" ON "feedback_activities"("classActivityId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_organizationId_name_key" ON "badges"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "badge_unlocks_badgeId_studentId_key" ON "badge_unlocks"("badgeId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_organizationId_name_key" ON "turmas"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "turma_lessons_turmaId_lessonNumber_key" ON "turma_lessons"("turmaId", "lessonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "turma_students_turmaId_studentId_key" ON "turma_students"("turmaId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "turma_attendances_turmaLessonId_studentId_key" ON "turma_attendances"("turmaLessonId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "turma_courses_turmaId_courseId_key" ON "turma_courses"("turmaId", "courseId");

-- RenameForeignKey
ALTER TABLE "plan_courses" RENAME CONSTRAINT "plan_courses_courseid_fkey" TO "plan_courses_courseId_fkey";

-- RenameForeignKey
ALTER TABLE "plan_courses" RENAME CONSTRAINT "plan_courses_planid_fkey" TO "plan_courses_planId_fkey";

-- RenameForeignKey
ALTER TABLE "rag_embeddings" RENAME CONSTRAINT "rag_embeddings_chunkid_fkey" TO "rag_embeddings_chunkId_fkey";

-- RenameForeignKey
ALTER TABLE "technique_prerequisite" RENAME CONSTRAINT "technique_prerequisite_prerequisitetechniqueid_fkey" TO "technique_prerequisite_prerequisiteTechniqueId_fkey";

-- RenameForeignKey
ALTER TABLE "technique_prerequisite" RENAME CONSTRAINT "technique_prerequisite_techniqueid_fkey" TO "technique_prerequisite_techniqueId_fkey";

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_refTechniqueId_fkey" FOREIGN KEY ("refTechniqueId") REFERENCES "techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_activities" ADD CONSTRAINT "lesson_plan_activities_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plan_activities" ADD CONSTRAINT "lesson_plan_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_activities" ADD CONSTRAINT "class_activities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_activities" ADD CONSTRAINT "class_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_definitions" ADD CONSTRAINT "assessment_definitions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_definitions" ADD CONSTRAINT "assessment_definitions_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_test_attempts" ADD CONSTRAINT "physical_test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "physical_test_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_test_attempts" ADD CONSTRAINT "physical_test_attempts_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_test_attempts" ADD CONSTRAINT "physical_test_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_lessons" ADD CONSTRAINT "feedback_lessons_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_lessons" ADD CONSTRAINT "feedback_lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_activities" ADD CONSTRAINT "feedback_activities_classActivityId_fkey" FOREIGN KEY ("classActivityId") REFERENCES "class_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_activities" ADD CONSTRAINT "feedback_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_evaluations" ADD CONSTRAINT "teacher_evaluations_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_unlocks" ADD CONSTRAINT "badge_unlocks_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_unlocks" ADD CONSTRAINT "badge_unlocks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_lessons" ADD CONSTRAINT "turma_lessons_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_lessons" ADD CONSTRAINT "turma_lessons_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_students" ADD CONSTRAINT "turma_students_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_students" ADD CONSTRAINT "turma_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_attendances" ADD CONSTRAINT "turma_attendances_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_attendances" ADD CONSTRAINT "turma_attendances_turmaLessonId_fkey" FOREIGN KEY ("turmaLessonId") REFERENCES "turma_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_attendances" ADD CONSTRAINT "turma_attendances_turmaStudentId_fkey" FOREIGN KEY ("turmaStudentId") REFERENCES "turma_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_attendances" ADD CONSTRAINT "turma_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_attendances" ADD CONSTRAINT "turma_attendances_checkedBy_fkey" FOREIGN KEY ("checkedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_courses" ADD CONSTRAINT "turma_courses_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_courses" ADD CONSTRAINT "turma_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "adaptation_snippets_audiencetag_idx" RENAME TO "adaptation_snippets_audienceTag_idx";

-- RenameIndex
ALTER INDEX "rag_chunks_organizationid_type_idx" RENAME TO "rag_chunks_organizationId_type_idx";

-- RenameIndex
ALTER INDEX "rag_embeddings_chunkid_key" RENAME TO "rag_embeddings_chunkId_key";
