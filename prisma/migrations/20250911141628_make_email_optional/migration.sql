/*
  Warnings:

  - You are about to drop the column `vector` on the `rag_embeddings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registrationNumber]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_organizationId_email_key";

-- AlterTable
ALTER TABLE "billing_plans" ADD COLUMN     "creditsValidity" INTEGER,
ADD COLUMN     "pricePerClass" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "location" TEXT,
ADD COLUMN     "trainingAreaId" TEXT;

-- AlterTable
ALTER TABLE "rag_embeddings" DROP COLUMN "vector";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "turmas" ADD COLUMN     "trainingAreaId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "training_areas" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "areaType" TEXT NOT NULL,
    "dimensions" TEXT,
    "equipment" TEXT[],
    "flooring" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_areas_unitId_name_key" ON "training_areas"("unitId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_registrationNumber_key" ON "students"("registrationNumber");

-- AddForeignKey
ALTER TABLE "training_areas" ADD CONSTRAINT "training_areas_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_trainingAreaId_fkey" FOREIGN KEY ("trainingAreaId") REFERENCES "training_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_trainingAreaId_fkey" FOREIGN KEY ("trainingAreaId") REFERENCES "training_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
