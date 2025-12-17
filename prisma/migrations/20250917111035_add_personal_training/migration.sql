-- CreateEnum
CREATE TYPE "PersonalTrainingType" AS ENUM ('INDIVIDUAL', 'SEMI_PRIVATE', 'SMALL_GROUP');

-- CreateEnum
CREATE TYPE "PersonalClassStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "personal_training_classes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "focusAreas" TEXT[],
    "trainingType" "PersonalTrainingType" NOT NULL DEFAULT 'INDIVIDUAL',
    "intensity" TEXT NOT NULL DEFAULT 'Intermediário',
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "notes" TEXT,
    "status" "PersonalClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_training_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_training_sessions" (
    "id" TEXT NOT NULL,
    "personalClassId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "actualDuration" INTEGER,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "studentNotes" TEXT,
    "instructorNotes" TEXT,
    "rating" INTEGER,
    "feedback" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_training_preferences" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "preferredDays" TEXT[],
    "preferredTimes" TEXT[],
    "preferredInstructors" TEXT[],
    "trainingFocus" TEXT[],
    "intensity" TEXT NOT NULL DEFAULT 'Intermediário',
    "sessionDuration" INTEGER NOT NULL DEFAULT 60,
    "maxSessionsPerWeek" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_training_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_training_preferences_studentId_key" ON "personal_training_preferences"("studentId");

-- AddForeignKey
ALTER TABLE "personal_training_classes" ADD CONSTRAINT "personal_training_classes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_classes" ADD CONSTRAINT "personal_training_classes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_classes" ADD CONSTRAINT "personal_training_classes_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_sessions" ADD CONSTRAINT "personal_training_sessions_personalClassId_fkey" FOREIGN KEY ("personalClassId") REFERENCES "personal_training_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_training_preferences" ADD CONSTRAINT "personal_training_preferences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
