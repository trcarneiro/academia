-- CreateEnum
CREATE TYPE "AgendaItemType" AS ENUM ('TURMA', 'PERSONAL_SESSION');

-- CreateEnum
CREATE TYPE "AgendaItemStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'RESCHEDULED';

-- AlterTable
ALTER TABLE "personal_training_sessions" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "lessonContent" JSONB,
ADD COLUMN     "lessonPlanId" TEXT,
ADD COLUMN     "nextLessonSuggestion" TEXT,
ADD COLUMN     "progressNotes" TEXT,
ADD COLUMN     "trainingAreaId" TEXT,
ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "AgendaItemType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "instructorId" TEXT NOT NULL,
    "unitId" TEXT,
    "trainingAreaId" TEXT,
    "status" "AgendaItemStatus" NOT NULL DEFAULT 'SCHEDULED',
    "maxStudents" INTEGER,
    "actualStudents" INTEGER NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "color" TEXT,
    "notes" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "personal_training_sessions" ADD CONSTRAINT "personal_training_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_sessions" ADD CONSTRAINT "personal_training_sessions_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_sessions" ADD CONSTRAINT "personal_training_sessions_trainingAreaId_fkey" FOREIGN KEY ("trainingAreaId") REFERENCES "training_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_sessions" ADD CONSTRAINT "personal_training_sessions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_trainingAreaId_fkey" FOREIGN KEY ("trainingAreaId") REFERENCES "training_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
