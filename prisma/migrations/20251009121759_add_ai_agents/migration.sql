/*
  Warnings:

  - A unique constraint covering the columns `[studentId,courseId]` on the table `student_courses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'TRIAL_SCHEDULED', 'TRIAL_ATTENDED', 'NEGOTIATION', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'MEETING', 'TRIAL_CLASS', 'FOLLOW_UP', 'NOTE', 'STATUS_CHANGE', 'DOCUMENT_SENT', 'PAYMENT_RECEIVED');

-- CreateEnum
CREATE TYPE "AgentSpecialization" AS ENUM ('pedagogical', 'analytical', 'support', 'progression', 'commercial');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudentCategory" ADD VALUE 'TEEN';
ALTER TYPE "StudentCategory" ADD VALUE 'KIDS';
ALTER TYPE "StudentCategory" ADD VALUE 'WOMEN';
ALTER TYPE "StudentCategory" ADD VALUE 'MEN';
ALTER TYPE "StudentCategory" ADD VALUE 'MIXED';
ALTER TYPE "StudentCategory" ADD VALUE 'LAW_ENFORCEMENT';

-- DropIndex
DROP INDEX "student_courses_studentId_courseId_classId_key";

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "isBaseCourse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "lesson_plan_activities" ADD COLUMN     "intensityMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "minimumForGraduation" INTEGER,
ADD COLUMN     "repetitionsPerClass" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "allowInstructorOverride" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoMarkActivitiesComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireActivityNotes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "student_courses" ALTER COLUMN "classId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "turmas" ADD COLUMN     "requireAttendanceForProgress" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "activity_tracking_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "autoCompleteOnCheckin" BOOLEAN NOT NULL DEFAULT false,
    "requireInstructorValidation" BOOLEAN NOT NULL DEFAULT true,
    "enablePerformanceRating" BOOLEAN NOT NULL DEFAULT true,
    "enableVideos" BOOLEAN NOT NULL DEFAULT false,
    "defaultActivityDuration" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_tracking_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "birthDate" TIMESTAMP(3),
    "sourceCampaign" TEXT,
    "sourceAdGroup" TEXT,
    "sourceKeyword" TEXT,
    "gclid" TEXT,
    "landingPage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "deviceType" TEXT,
    "browserInfo" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedToId" TEXT,
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "courseInterest" TEXT,
    "billingPlanInterest" TEXT,
    "modalityInterest" TEXT,
    "preferredSchedule" TEXT,
    "budget" DECIMAL(10,2),
    "message" TEXT,
    "leadCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstContactAt" TIMESTAMP(3),
    "qualifiedAt" TIMESTAMP(3),
    "trialScheduledAt" TIMESTAMP(3),
    "trialAttendedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3),
    "convertedStudentId" TEXT,
    "conversionUploaded" BOOLEAN NOT NULL DEFAULT false,
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "timeToContact" INTEGER,
    "timeToQualify" INTEGER,
    "timeToTrial" INTEGER,
    "timeToEnrollment" INTEGER,
    "costPerClick" DECIMAL(10,2),
    "costPerLead" DECIMAL(10,2),
    "costPerAcquisition" DECIMAL(10,2),
    "estimatedLTV" DECIMAL(10,2),
    "actualRevenue" DECIMAL(10,2),
    "tags" TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "outcome" TEXT,
    "nextAction" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_ads_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignStatus" TEXT NOT NULL,
    "campaignType" TEXT,
    "budget" DECIMAL(10,2),
    "budgetType" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,2),
    "cpc" DECIMAL(10,2),
    "conversionRate" DECIMAL(5,2),
    "costPerConversion" DECIMAL(10,2),
    "roi" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_ads_ad_groups" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "adGroupName" TEXT NOT NULL,
    "adGroupStatus" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_ad_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_ads_keywords" (
    "id" TEXT NOT NULL,
    "adGroupId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "keywordText" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "qualityScore" INTEGER,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "googleAdsCustomerId" TEXT,
    "googleAdsClientId" TEXT,
    "googleAdsClientSecret" TEXT,
    "googleAdsRefreshToken" TEXT,
    "googleAdsDeveloperToken" TEXT,
    "googleAdsConversionAction" TEXT,
    "googleAdsConnected" BOOLEAN NOT NULL DEFAULT false,
    "googleAdsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "conversionActionId" TEXT,
    "defaultLTV" DECIMAL(10,2),
    "autoAssignLeads" BOOLEAN NOT NULL DEFAULT false,
    "defaultAssigneeId" TEXT,
    "notifyNewLead" BOOLEAN NOT NULL DEFAULT true,
    "notifyHotLead" BOOLEAN NOT NULL DEFAULT true,
    "notifyLostLead" BOOLEAN NOT NULL DEFAULT false,
    "autoFollowUpDays" INTEGER NOT NULL DEFAULT 3,
    "autoArchiveDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "minimumForGraduation" INTEGER DEFAULT 50,

    CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_activity_executions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "turmaLessonId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repetitionsCount" INTEGER NOT NULL DEFAULT 1,
    "durationMinutes" INTEGER,
    "intensityApplied" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "performanceRating" INTEGER,
    "instructorNotes" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_activity_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_graduation_levels" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "currentBelt" TEXT NOT NULL,
    "nextBelt" TEXT NOT NULL,
    "totalDegrees" INTEGER NOT NULL DEFAULT 4,
    "degreePercentageIncrement" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "minimumAttendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "minimumQualityRating" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "minimumRepetitionsTotal" INTEGER NOT NULL DEFAULT 500,
    "minimumMonthsEnrolled" INTEGER NOT NULL DEFAULT 3,
    "requiresInstructorApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_graduation_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_degree_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "degree" INTEGER NOT NULL,
    "degreePercentage" DOUBLE PRECISION NOT NULL,
    "belt" TEXT NOT NULL,
    "completedLessons" INTEGER NOT NULL,
    "totalRepetitions" INTEGER NOT NULL,
    "averageQuality" DOUBLE PRECISION,
    "attendanceRate" DOUBLE PRECISION NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_degree_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_graduations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fromBelt" TEXT NOT NULL,
    "toBelt" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalAttendanceRate" DOUBLE PRECISION NOT NULL,
    "finalQualityRating" DOUBLE PRECISION NOT NULL,
    "totalRepetitions" INTEGER NOT NULL,
    "totalLessonsCompleted" INTEGER NOT NULL,
    "certificateGenerated" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT,
    "ceremonyDate" TIMESTAMP(3),
    "ceremonyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_graduations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "specialization" "AgentSpecialization" NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "systemPrompt" TEXT NOT NULL,
    "ragSources" TEXT[],
    "mcpTools" TEXT[],
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "noCodeMode" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "averageRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "messages" JSONB NOT NULL,
    "rating" INTEGER,
    "feedback" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_tracking_settings_organizationId_key" ON "activity_tracking_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_gclid_key" ON "leads"("gclid");

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertedStudentId_key" ON "leads"("convertedStudentId");

-- CreateIndex
CREATE INDEX "leads_organizationId_stage_status_idx" ON "leads"("organizationId", "stage", "status");

-- CreateIndex
CREATE INDEX "leads_gclid_idx" ON "leads"("gclid");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_notes_leadId_createdAt_idx" ON "lead_notes"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_campaigns_campaignId_key" ON "google_ads_campaigns"("campaignId");

-- CreateIndex
CREATE INDEX "google_ads_campaigns_organizationId_campaignStatus_idx" ON "google_ads_campaigns"("organizationId", "campaignStatus");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_ad_groups_adGroupId_key" ON "google_ads_ad_groups"("adGroupId");

-- CreateIndex
CREATE INDEX "google_ads_ad_groups_campaignId_idx" ON "google_ads_ad_groups"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "google_ads_keywords_keywordId_key" ON "google_ads_keywords"("keywordId");

-- CreateIndex
CREATE INDEX "google_ads_keywords_adGroupId_idx" ON "google_ads_keywords"("adGroupId");

-- CreateIndex
CREATE INDEX "google_ads_keywords_keywordText_idx" ON "google_ads_keywords"("keywordText");

-- CreateIndex
CREATE UNIQUE INDEX "crm_settings_organizationId_key" ON "crm_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_categories_name_key" ON "activity_categories"("name");

-- CreateIndex
CREATE INDEX "lesson_activity_executions_studentId_activityId_idx" ON "lesson_activity_executions"("studentId", "activityId");

-- CreateIndex
CREATE INDEX "lesson_activity_executions_turmaLessonId_idx" ON "lesson_activity_executions"("turmaLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_activity_executions_attendanceId_activityId_key" ON "lesson_activity_executions"("attendanceId", "activityId");

-- CreateIndex
CREATE UNIQUE INDEX "course_graduation_levels_courseId_currentBelt_key" ON "course_graduation_levels"("courseId", "currentBelt");

-- CreateIndex
CREATE INDEX "student_degree_history_studentId_courseId_idx" ON "student_degree_history"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "student_graduations_studentId_courseId_toBelt_key" ON "student_graduations"("studentId", "courseId", "toBelt");

-- CreateIndex
CREATE INDEX "ai_agents_organizationId_isActive_idx" ON "ai_agents"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ai_agents_specialization_idx" ON "ai_agents"("specialization");

-- CreateIndex
CREATE INDEX "agent_conversations_agentId_idx" ON "agent_conversations"("agentId");

-- CreateIndex
CREATE INDEX "agent_conversations_userId_idx" ON "agent_conversations"("userId");

-- CreateIndex
CREATE INDEX "agent_conversations_studentId_idx" ON "agent_conversations"("studentId");

-- CreateIndex
CREATE INDEX "agent_conversations_createdAt_idx" ON "agent_conversations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "activity_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_tracking_settings" ADD CONSTRAINT "activity_tracking_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_campaigns" ADD CONSTRAINT "google_ads_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_ad_groups" ADD CONSTRAINT "google_ads_ad_groups_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "google_ads_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_keywords" ADD CONSTRAINT "google_ads_keywords_adGroupId_fkey" FOREIGN KEY ("adGroupId") REFERENCES "google_ads_ad_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_settings" ADD CONSTRAINT "crm_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activity_executions" ADD CONSTRAINT "lesson_activity_executions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activity_executions" ADD CONSTRAINT "lesson_activity_executions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "lesson_plan_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activity_executions" ADD CONSTRAINT "lesson_activity_executions_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "turma_attendances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activity_executions" ADD CONSTRAINT "lesson_activity_executions_turmaLessonId_fkey" FOREIGN KEY ("turmaLessonId") REFERENCES "turma_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_activity_executions" ADD CONSTRAINT "lesson_activity_executions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_graduation_levels" ADD CONSTRAINT "course_graduation_levels_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_degree_history" ADD CONSTRAINT "student_degree_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_degree_history" ADD CONSTRAINT "student_degree_history_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_graduations" ADD CONSTRAINT "student_graduations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_graduations" ADD CONSTRAINT "student_graduations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
