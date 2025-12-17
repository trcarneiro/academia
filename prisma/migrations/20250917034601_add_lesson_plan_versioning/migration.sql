/*
  Warnings:

  - A unique constraint covering the columns `[courseId,lessonNumber,isActive]` on the table `lesson_plans` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "lesson_plans_courseId_lessonNumber_key";

-- AlterTable
ALTER TABLE "lesson_plans" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plans_courseId_lessonNumber_isActive_key" ON "lesson_plans"("courseId", "lessonNumber", "isActive");

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
