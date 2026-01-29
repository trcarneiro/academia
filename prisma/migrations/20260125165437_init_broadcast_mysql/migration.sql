-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Brazil',
    `zipCode` VARCHAR(191) NULL,
    `subscriptionPlan` ENUM('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE') NOT NULL DEFAULT 'BASIC',
    `maxStudents` INTEGER NOT NULL DEFAULT 100,
    `maxStaff` INTEGER NOT NULL DEFAULT 10,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#1f2937',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `customDomain` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_settings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `enableGamification` BOOLEAN NOT NULL DEFAULT true,
    `enableVideoAnalysis` BOOLEAN NOT NULL DEFAULT false,
    `enableAIRecommendations` BOOLEAN NOT NULL DEFAULT true,
    `enableMultipleArts` BOOLEAN NOT NULL DEFAULT true,
    `aiProvider` ENUM('CLAUDE', 'GEMINI', 'OPENAI', 'OPENROUTER') NOT NULL DEFAULT 'CLAUDE',
    `openaiApiKey` VARCHAR(191) NULL,
    `anthropicApiKey` VARCHAR(191) NULL,
    `geminiApiKey` VARCHAR(191) NULL,
    `openRouterApiKey` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `language` VARCHAR(191) NOT NULL DEFAULT 'pt-BR',
    `allowQRCheckin` BOOLEAN NOT NULL DEFAULT true,
    `allowManualCheckin` BOOLEAN NOT NULL DEFAULT true,
    `allowFacialCheckin` BOOLEAN NOT NULL DEFAULT false,
    `checkinWindowStart` INTEGER NOT NULL DEFAULT 30,
    `checkinWindowEnd` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `allowInstructorOverride` BOOLEAN NOT NULL DEFAULT true,
    `autoMarkActivitiesComplete` BOOLEAN NOT NULL DEFAULT false,
    `requireActivityNotes` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `organization_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `martial_arts` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `hasGrading` BOOLEAN NOT NULL DEFAULT true,
    `gradingSystem` ENUM('BELT', 'LEVEL', 'STRIPE', 'CUSTOM') NOT NULL DEFAULT 'BELT',
    `maxLevel` INTEGER NOT NULL DEFAULT 10,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `martial_arts_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `martialArtId` VARCHAR(191) NULL,
    `courseTemplateId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER') NOT NULL,
    `duration` INTEGER NOT NULL,
    `classesPerWeek` INTEGER NOT NULL DEFAULT 2,
    `totalClasses` INTEGER NOT NULL,
    `minAge` INTEGER NOT NULL DEFAULT 16,
    `maxAge` INTEGER NULL,
    `category` ENUM('ADULT', 'FEMALE', 'SENIOR', 'CHILD', 'INICIANTE1', 'INICIANTE2', 'INICIANTE3', 'HEROI1', 'HEROI2', 'HEROI3', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'TEEN', 'KIDS', 'WOMEN', 'MEN', 'MIXED', 'LAW_ENFORCEMENT') NOT NULL DEFAULT 'ADULT',
    `orderIndex` INTEGER NOT NULL DEFAULT 1,
    `nextCourseId` VARCHAR(191) NULL,
    `prerequisites` JSON NOT NULL,
    `objectives` JSON NOT NULL,
    `requirements` JSON NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isBaseCourse` BOOLEAN NOT NULL DEFAULT false,
    `sequence` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `courses_nextCourseId_key`(`nextCourseId`),
    UNIQUE INDEX `courses_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_programs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_templates` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('MARTIAL_ARTS', 'DANCE', 'FITNESS', 'LANGUAGE', 'MUSIC', 'OTHER') NOT NULL,
    `duration` INTEGER NOT NULL,
    `classesPerWeek` INTEGER NOT NULL DEFAULT 2,
    `totalClasses` INTEGER NOT NULL,
    `minAge` INTEGER NOT NULL DEFAULT 16,
    `maxAge` INTEGER NULL,
    `objectives` JSON NOT NULL,
    `requirements` JSON NOT NULL,
    `structure` JSON NOT NULL,
    `ragSettings` JSON NULL,
    `isSystemTemplate` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `course_templates_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technique_libraries` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('STRIKING', 'GRAPPLING', 'DEFENSE', 'SUBMISSION', 'WEAPON', 'FITNESS') NOT NULL,
    `content` JSON NOT NULL,
    `ragEmbeddings` JSON NULL,
    `prerequisites` JSON NOT NULL,
    `relatedTechniques` JSON NOT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `technique_libraries_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_plans` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `lessonNumber` INTEGER NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `unit` VARCHAR(191) NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `warmup` JSON NOT NULL,
    `techniques` JSON NOT NULL,
    `simulations` JSON NOT NULL,
    `cooldown` JSON NOT NULL,
    `mentalModule` JSON NULL,
    `tacticalModule` VARCHAR(191) NULL,
    `adaptations` JSON NULL,
    `duration` INTEGER NOT NULL DEFAULT 60,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `objectives` JSON NOT NULL,
    `equipment` JSON NOT NULL,
    `activities` JSON NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archivedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `previousVersionId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `lesson_plans_courseId_lessonNumber_isActive_key`(`courseId`, `lessonNumber`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `techniques` (
    `id` VARCHAR(191) NOT NULL,
    `martialArtId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `difficulty` INTEGER NULL,
    `prerequisites` JSON NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `baseXP` INTEGER NULL,
    `masteryXP` INTEGER NULL,
    `badgeIcon` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `shortDescription` VARCHAR(191) NULL,
    `subcategory` VARCHAR(191) NULL,
    `modality` VARCHAR(191) NULL,
    `complexity` VARCHAR(191) NULL,
    `durationMin` INTEGER NULL,
    `durationMax` INTEGER NULL,
    `groupSizeMin` INTEGER NULL,
    `groupSizeMax` INTEGER NULL,
    `ageRangeMin` INTEGER NULL,
    `ageRangeMax` INTEGER NULL,
    `objectives` JSON NOT NULL,
    `resources` JSON NOT NULL,
    `assessmentCriteria` JSON NOT NULL,
    `risksMitigation` JSON NOT NULL,
    `tags` JSON NOT NULL,
    `references` JSON NOT NULL,
    `bnccCompetenciesText` VARCHAR(191) NULL DEFAULT '',
    `category` VARCHAR(191) NULL,
    `instructions` JSON NOT NULL,
    `stepByStep` JSON NOT NULL,
    `bnccCompetencies` JSON NOT NULL,

    UNIQUE INDEX `techniques_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_techniques` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `weekNumber` INTEGER NULL,
    `lessonNumber` INTEGER NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `course_techniques_courseId_techniqueId_key`(`courseId`, `techniqueId`),
    UNIQUE INDEX `course_techniques_courseId_orderIndex_key`(`courseId`, `orderIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `avatarUrl` LONGTEXT NULL,
    `phone` VARCHAR(191) NULL,
    `cpf` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `canApproveAgentTasks` BOOLEAN NOT NULL DEFAULT false,
    `canExecuteAgentTasks` BOOLEAN NOT NULL DEFAULT false,
    `canCreateAgents` BOOLEAN NOT NULL DEFAULT false,
    `canDeleteAgents` BOOLEAN NOT NULL DEFAULT false,
    `maxTaskPriority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `canApproveCategories` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `emergencyContact` VARCHAR(191) NULL,
    `medicalConditions` VARCHAR(191) NULL,
    `category` ENUM('ADULT', 'FEMALE', 'SENIOR', 'CHILD', 'INICIANTE1', 'INICIANTE2', 'INICIANTE3', 'HEROI1', 'HEROI2', 'HEROI3', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'TEEN', 'KIDS', 'WOMEN', 'MEN', 'MIXED', 'LAW_ENFORCEMENT') NOT NULL DEFAULT 'ADULT',
    `gender` ENUM('MASCULINO', 'FEMININO', 'OUTRO') NULL DEFAULT 'MASCULINO',
    `age` INTEGER NULL,
    `physicalCondition` ENUM('INICIANTE', 'REGULAR', 'AVANCADO') NULL DEFAULT 'INICIANTE',
    `specialNeeds` JSON NOT NULL,
    `totalXP` INTEGER NOT NULL DEFAULT 0,
    `globalLevel` INTEGER NOT NULL DEFAULT 1,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastCheckinDate` DATETIME(3) NULL,
    `preferredDays` JSON NOT NULL,
    `preferredTimes` JSON NOT NULL,
    `notifications` BOOLEAN NOT NULL DEFAULT true,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `financialResponsibleId` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `financialResponsibleStudentId` VARCHAR(191) NULL,
    `consolidatedDiscountValue` DECIMAL(65, 30) NULL DEFAULT 0,
    `consolidatedDiscountType` VARCHAR(191) NULL DEFAULT 'FIXED',
    `passwordHash` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `asaasCustomerId` VARCHAR(191) NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    UNIQUE INDEX `students_registrationNumber_key`(`registrationNumber`),
    UNIQUE INDEX `students_asaasCustomerId_key`(`asaasCustomerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `educational_plan_techniques` (
    `educationalPlanId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`educationalPlanId`, `techniqueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_plan_techniques` (
    `lessonPlanId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `allocationMinutes` INTEGER NOT NULL DEFAULT 0,
    `objectiveMapping` JSON NOT NULL,
    `expectedRepetitions` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`lessonPlanId`, `techniqueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_responsibles` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `address` VARCHAR(191) NULL,
    `addressNumber` VARCHAR(191) NULL,
    `complement` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `relationshipType` VARCHAR(191) NULL,
    `asaasId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `consolidateBilling` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `financial_responsibles_organizationId_cpfCnpj_key`(`organizationId`, `cpfCnpj`),
    UNIQUE INDEX `financial_responsibles_organizationId_email_key`(`organizationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technique_records` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `lessonPlanId` VARCHAR(191) NULL,
    `proficiency` ENUM('LEARNING', 'PRACTICING', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTERED') NOT NULL DEFAULT 'LEARNING',
    `practiceCount` INTEGER NOT NULL DEFAULT 1,
    `masteryScore` INTEGER NOT NULL DEFAULT 0,
    `firstPracticed` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastPracticed` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `masteredAt` DATETIME(3) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `aiAnalysis` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `technique_records_studentId_techniqueId_key`(`studentId`, `techniqueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `addressNumber` VARCHAR(191) NULL,
    `complement` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `zipCode` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 100,
    `totalMats` INTEGER NOT NULL DEFAULT 1,
    `responsibleName` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `units_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_areas` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 20,
    `areaType` VARCHAR(191) NOT NULL,
    `dimensions` VARCHAR(191) NULL,
    `equipment` JSON NOT NULL,
    `flooring` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `training_areas_unitId_name_key`(`unitId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mats` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 20,
    `dimensions` VARCHAR(191) NULL,
    `equipment` JSON NOT NULL,
    `materialType` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `mats_unitId_name_key`(`unitId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructors` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `specializations` JSON NOT NULL,
    `certifications` JSON NOT NULL,
    `bio` VARCHAR(191) NULL,
    `martialArts` JSON NOT NULL,
    `maxStudentsPerClass` INTEGER NOT NULL DEFAULT 20,
    `experience` VARCHAR(191) NULL,
    `availability` JSON NULL,
    `hourlyRate` DECIMAL(10, 2) NULL,
    `preferredUnits` JSON NOT NULL,
    `hireDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `instructors_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructor_courses` (
    `id` VARCHAR(191) NOT NULL,
    `instructor_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `is_lead` BOOLEAN NULL DEFAULT false,
    `certified_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_instructor_courses_course`(`course_id`),
    INDEX `idx_instructor_courses_instructor`(`instructor_id`),
    UNIQUE INDEX `unique_instructor_course`(`instructor_id`, `course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `maxStudents` INTEGER NOT NULL DEFAULT 20,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `matId` VARCHAR(191) NULL,
    `scheduleId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseProgramId` VARCHAR(191) NULL,
    `lessonPlanId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED') NOT NULL DEFAULT 'SCHEDULED',
    `actualStudents` INTEGER NOT NULL DEFAULT 0,
    `maxStudents` INTEGER NOT NULL DEFAULT 20,
    `agenda` JSON NULL,
    `notes` VARCHAR(191) NULL,
    `qrCode` VARCHAR(191) NULL,
    `qrCodeExpiry` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(191) NULL,
    `trainingAreaId` VARCHAR(191) NULL,

    UNIQUE INDEX `classes_qrCode_key`(`qrCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'PRESENT',
    `checkInTime` DATETIME(3) NULL,
    `checkInMethod` ENUM('QR_CODE', 'MANUAL', 'FACIAL_RECOGNITION', 'GEOLOCATION', 'NFC') NULL,
    `location` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attendances_studentId_classId_key`(`studentId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `expectedEndDate` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    `category` ENUM('ADULT', 'FEMALE', 'SENIOR', 'CHILD', 'INICIANTE1', 'INICIANTE2', 'INICIANTE3', 'HEROI1', 'HEROI2', 'HEROI3', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'TEEN', 'KIDS', 'WOMEN', 'MEN', 'MIXED', 'LAW_ENFORCEMENT') NOT NULL DEFAULT 'ADULT',
    `gender` VARCHAR(191) NOT NULL,
    `currentLesson` INTEGER NOT NULL DEFAULT 1,
    `lessonsCompleted` INTEGER NOT NULL DEFAULT 0,
    `attendanceRate` DOUBLE NOT NULL DEFAULT 0,
    `currentXP` INTEGER NOT NULL DEFAULT 0,
    `currentLevel` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `course_enrollments_studentId_courseId_key`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technique_progress` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `status` ENUM('LEARNING', 'PRACTICING', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTERED') NOT NULL DEFAULT 'LEARNING',
    `accuracy` DOUBLE NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `practiceCount` INTEGER NOT NULL DEFAULT 0,
    `masteredAt` DATETIME(3) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `aiAnalysis` JSON NULL,
    `instructorValidated` BOOLEAN NOT NULL DEFAULT false,
    `validatedBy` VARCHAR(191) NULL,
    `validatedAt` DATETIME(3) NULL,
    `instructorNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `technique_progress_enrollmentId_techniqueId_key`(`enrollmentId`, `techniqueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_challenges` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `type` ENUM('ATTENDANCE', 'TECHNIQUE', 'STREAK', 'SOCIAL', 'FITNESS', 'CUSTOM') NOT NULL,
    `baseActivity` VARCHAR(191) NOT NULL,
    `baseMetric` INTEGER NOT NULL,
    `baseTime` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `course_challenges_courseId_weekNumber_key`(`courseId`, `weekNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenge_progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `challengeId` VARCHAR(191) NOT NULL,
    `attempted` BOOLEAN NOT NULL DEFAULT false,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `actualMetric` INTEGER NULL,
    `actualTime` INTEGER NULL,
    `videoUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `instructorValidated` BOOLEAN NOT NULL DEFAULT false,
    `validatedBy` VARCHAR(191) NULL,
    `validatedAt` DATETIME(3) NULL,
    `instructorNotes` VARCHAR(191) NULL,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `challenge_progress_enrollmentId_challengeId_key`(`enrollmentId`, `challengeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `type` ENUM('GRADING', 'PROGRESS', 'TECHNIQUE', 'SPARRING', 'FITNESS', 'KNOWLEDGE') NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `techniquesTested` JSON NOT NULL,
    `physicalTest` JSON NULL,
    `overallScore` DOUBLE NOT NULL,
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `instructorNotes` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `recommendedActions` JSON NOT NULL,
    `evaluatedBy` VARCHAR(191) NOT NULL,
    `evaluatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_progressions` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `martialArtId` VARCHAR(191) NOT NULL,
    `currentLevel` INTEGER NOT NULL DEFAULT 1,
    `currentGrade` VARCHAR(191) NOT NULL DEFAULT 'White Belt',
    `totalXP` INTEGER NOT NULL DEFAULT 0,
    `techniquesLearned` INTEGER NOT NULL DEFAULT 0,
    `techniquesTotal` INTEGER NOT NULL DEFAULT 0,
    `classesAttended` INTEGER NOT NULL DEFAULT 0,
    `evaluationsCompleted` INTEGER NOT NULL DEFAULT 0,
    `nextGrade` VARCHAR(191) NULL,
    `progressToNextGrade` DOUBLE NOT NULL DEFAULT 0,
    `estimatedTimeToNext` VARCHAR(191) NULL,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_progressions_studentId_martialArtId_key`(`studentId`, `martialArtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `martialArtId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` ENUM('ATTENDANCE', 'TECHNIQUE', 'PROGRESSION', 'SOCIAL', 'CHALLENGE', 'SPECIAL') NOT NULL,
    `criteria` JSON NOT NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `badgeImageUrl` VARCHAR(191) NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL DEFAULT 'COMMON',
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progress` DOUBLE NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_achievements_studentId_achievementId_key`(`studentId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenges` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` ENUM('ATTENDANCE', 'TECHNIQUE', 'STREAK', 'SOCIAL', 'FITNESS', 'CUSTOM') NOT NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD', 'EXTREME') NOT NULL DEFAULT 'EASY',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringType` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY') NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `badgeReward` VARCHAR(191) NULL,
    `criteria` JSON NOT NULL,
    `targetValue` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_courses` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `paymentPlanId` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedEndDate` DATETIME(3) NULL,
    `completedDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_courses_studentId_courseId_key`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `present` BOOLEAN NOT NULL DEFAULT false,
    `arrived_late` BOOLEAN NOT NULL DEFAULT false,
    `left_early` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attendance_records_studentId_classId_lessonNumber_key`(`studentId`, `classId`, `lessonNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_records` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `techniquesLearned` JSON NOT NULL,
    `challengesCompleted` JSON NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `reflections` VARCHAR(191) NULL,
    `progressDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `progress_records_studentId_courseId_lessonNumber_key`(`studentId`, `courseId`, `lessonNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technique_details` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('STRIKING', 'GRAPPLING', 'DEFENSE', 'SUBMISSION', 'WEAPON', 'FITNESS') NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `instructions` JSON NOT NULL,
    `objectives` JSON NOT NULL,
    `adaptations` JSON NULL,
    `orderInLesson` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `technique_details_courseId_lessonNumber_orderInLesson_key`(`courseId`, `lessonNumber`, `orderInLesson`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weekly_challenges` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `baseRepetitions` JSON NOT NULL,
    `baseTime` INTEGER NULL,
    `pointsReward` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `weekly_challenges_courseId_weekNumber_key`(`courseId`, `weekNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluation_records` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `techniquesEvaluated` JSON NOT NULL,
    `physicalTest` VARCHAR(191) NULL,
    `physicalTestResult` VARCHAR(191) NULL,
    `simulationScenarios` JSON NOT NULL,
    `simulationResults` JSON NOT NULL,
    `precision` DOUBLE NULL,
    `status` ENUM('AUTONOMIA', 'EM_DESENVOLVIMENTO', 'PRECISA_INTERVENCAO') NOT NULL,
    `certificateIssued` BOOLEAN NOT NULL DEFAULT false,
    `certificateUrl` VARCHAR(191) NULL,
    `instructorNotes` VARCHAR(191) NULL,
    `evaluationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `evaluation_records_studentId_courseId_lessonNumber_key`(`studentId`, `courseId`, `lessonNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_patterns` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `totalClasses` INTEGER NOT NULL DEFAULT 0,
    `attendedClasses` INTEGER NOT NULL DEFAULT 0,
    `attendanceRate` DOUBLE NOT NULL DEFAULT 0,
    `consecutiveAbsences` INTEGER NOT NULL DEFAULT 0,
    `averageCheckInTime` VARCHAR(191) NULL,
    `preferredDays` JSON NOT NULL,
    `preferredTimeSlots` JSON NOT NULL,
    `recentTrend` ENUM('IMPROVING', 'DECLINING', 'STABLE', 'VOLATILE') NOT NULL DEFAULT 'STABLE',
    `trendConfidence` DOUBLE NOT NULL DEFAULT 0,
    `dropoutRisk` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
    `riskFactors` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `aiInsights` JSON NULL,
    `lastAnalyzed` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attendance_patterns_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asaas_customers` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `financialResponsibleId` VARCHAR(191) NULL,
    `asaasId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `mobilePhone` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `addressNumber` VARCHAR(191) NULL,
    `complement` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `externalReference` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `asaas_customers_studentId_key`(`studentId`),
    UNIQUE INDEX `asaas_customers_financialResponsibleId_key`(`financialResponsibleId`),
    UNIQUE INDEX `asaas_customers_asaasId_key`(`asaasId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_plans` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` ENUM('ADULT', 'FEMALE', 'SENIOR', 'CHILD', 'INICIANTE1', 'INICIANTE2', 'INICIANTE3', 'HEROI1', 'HEROI2', 'HEROI3', 'MASTER_1', 'MASTER_2', 'MASTER_3', 'TEEN', 'KIDS', 'WOMEN', 'MEN', 'MIXED', 'LAW_ENFORCEMENT') NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `billingType` ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME', 'CREDIT_CARD_INSTALLMENT', 'RECURRING', 'CREDITS') NOT NULL DEFAULT 'MONTHLY',
    `classesPerWeek` INTEGER NULL DEFAULT 2,
    `maxClasses` INTEGER NULL,
    `duration` INTEGER NULL,
    `isUnlimitedAccess` BOOLEAN NOT NULL DEFAULT false,
    `hasPersonalTraining` BOOLEAN NOT NULL DEFAULT false,
    `hasNutrition` BOOLEAN NOT NULL DEFAULT false,
    `allowInstallments` BOOLEAN NOT NULL DEFAULT false,
    `maxInstallments` INTEGER NOT NULL DEFAULT 1,
    `installmentInterestRate` DECIMAL(5, 2) NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringInterval` INTEGER NULL,
    `recurrencePeriod` ENUM('WEEKLY', 'MONTHLY', 'YEARLY') NULL,
    `accessAllModalities` BOOLEAN NOT NULL DEFAULT false,
    `allowFreeze` BOOLEAN NOT NULL DEFAULT true,
    `freezeMaxDays` INTEGER NOT NULL DEFAULT 30,
    `features` JSON NULL,
    `paymentDiscounts` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creditsValidity` INTEGER NULL,
    `pricePerClass` DECIMAL(10, 2) NULL,
    `allowPartialCredit` BOOLEAN NULL DEFAULT false,
    `allowRefund` BOOLEAN NULL DEFAULT false,
    `allowTransfer` BOOLEAN NULL DEFAULT false,
    `autoRenewChargeMethod` VARCHAR(191) NULL,
    `autoRenewCredits` BOOLEAN NULL DEFAULT false,
    `bulkDiscountTiers` JSON NULL,
    `creditQuantity` INTEGER NULL,
    `creditRenewalMethod` ENUM('INCLUDED', 'SEPARATE', 'SUBSCRIPTION') NULL DEFAULT 'INCLUDED',
    `creditRenewalTrigger` ENUM('MONTHLY', 'ON_CONSUMPTION', 'MANUAL') NULL DEFAULT 'MONTHLY',
    `creditType` ENUM('CLASS', 'HOUR', 'PERSONAL_HOUR', 'PACKAGE') NULL,
    `creditValidityDays` INTEGER NULL DEFAULT 90,
    `maxAutoRenewals` INTEGER NULL,
    `minCreditsPerClass` INTEGER NULL DEFAULT 1,
    `planType` ENUM('MONTHLY', 'CREDIT_PACK', 'ONE_TIME', 'TRIAL', 'HYBRID', 'GIFT', 'CORPORATE', 'PARTNERSHIP') NULL,
    `refundDaysBeforeExp` INTEGER NULL DEFAULT 7,
    `renewalIntervalDays` INTEGER NULL,
    `transferFeePercent` DECIMAL(5, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discounts` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    `value` DECIMAL(10, 2) NOT NULL,
    `triggerType` ENUM('MANUAL', 'PAYMENT_METHOD', 'COUPON', 'CAMPAIGN') NOT NULL DEFAULT 'MANUAL',
    `triggerValue` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_plan_discounts` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `discountId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `billing_plan_discounts_planId_discountId_key`(`planId`, `discountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `asaasCustomerId` VARCHAR(191) NULL,
    `financialResponsibleId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `currentPrice` DECIMAL(10, 2) NOT NULL,
    `billingType` ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME', 'CREDIT_CARD_INSTALLMENT', 'RECURRING', 'CREDITS') NOT NULL,
    `nextBillingDate` DATETIME(3) NULL,
    `asaasSubscriptionId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `asaasCustomerId` VARCHAR(191) NULL,
    `financialResponsibleId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'CASH', 'PAYPAL', 'STRIPE') NULL,
    `asaasPaymentId` VARCHAR(191) NULL,
    `asaasChargeId` VARCHAR(191) NULL,
    `asaasInvoiceUrl` VARCHAR(191) NULL,
    `asaasPixCode` VARCHAR(191) NULL,
    `asaasPixQrCode` VARCHAR(191) NULL,
    `asaasBoletoUrl` VARCHAR(191) NULL,
    `asaasBoletoCode` VARCHAR(191) NULL,
    `asaasChargeUrl` VARCHAR(191) NULL,
    `pixCode` VARCHAR(191) NULL,
    `webhookData` JSON NULL,
    `notes` VARCHAR(191) NULL,
    `isManual` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_asaasPaymentId_key`(`asaasPaymentId`),
    UNIQUE INDEX `payments_asaasChargeId_key`(`asaasChargeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_settings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `asaasApiKey` VARCHAR(191) NULL,
    `asaasWebhookUrl` VARCHAR(191) NULL,
    `asaasWebhookToken` VARCHAR(191) NULL,
    `isSandbox` BOOLEAN NOT NULL DEFAULT true,
    `defaultBillingType` ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME', 'CREDIT_CARD_INSTALLMENT', 'RECURRING', 'CREDITS') NOT NULL DEFAULT 'MONTHLY',
    `lateFeePercentage` DECIMAL(5, 2) NOT NULL DEFAULT 2.0,
    `interestRate` DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    `sendReminders` BOOLEAN NOT NULL DEFAULT true,
    `reminderDaysBefore` INTEGER NOT NULL DEFAULT 3,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `financial_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_credits` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `totalCredits` INTEGER NOT NULL,
    `creditsUsed` INTEGER NOT NULL DEFAULT 0,
    `creditsAvailable` INTEGER NOT NULL,
    `creditType` ENUM('CLASS', 'HOUR', 'PERSONAL_HOUR', 'PACKAGE') NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `autoRenew` BOOLEAN NOT NULL DEFAULT false,
    `nextRenewalDate` DATETIME(3) NULL,
    `previousCreditId` VARCHAR(191) NULL,
    `renewalChargeId` VARCHAR(191) NULL,
    `renewalCount` INTEGER NOT NULL DEFAULT 0,

    INDEX `student_credits_studentId_status_idx`(`studentId`, `status`),
    INDEX `student_credits_expiresAt_idx`(`expiresAt`),
    INDEX `student_credits_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_usages` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `creditId` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NULL,
    `creditsUsed` INTEGER NOT NULL,
    `usedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_usages_studentId_idx`(`studentId`),
    INDEX `credit_usages_creditId_idx`(`creditId`),
    INDEX `credit_usages_attendanceId_idx`(`attendanceId`),
    INDEX `credit_usages_usedAt_idx`(`usedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_renewals` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `originalCreditId` VARCHAR(191) NOT NULL,
    `renewedCreditId` VARCHAR(191) NOT NULL,
    `renewalDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `renewalReason` VARCHAR(191) NULL,
    `chargedAmount` DECIMAL(10, 2) NULL,
    `chargeMethod` VARCHAR(191) NULL,
    `chargeId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_renewals_studentId_renewalDate_idx`(`studentId`, `renewalDate`),
    INDEX `credit_renewals_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_courses` (
    `planId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`planId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technique_prerequisite` (
    `techniqueId` VARCHAR(191) NOT NULL,
    `prerequisiteTechniqueId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`techniqueId`, `prerequisiteTechniqueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mental_modules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `objective` VARCHAR(191) NOT NULL,
    `recommendedPhase` VARCHAR(191) NULL,
    `durationMin` INTEGER NULL,
    `tags` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `mental_modules_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adaptation_snippets` (
    `id` VARCHAR(191) NOT NULL,
    `audienceTag` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `adaptation_snippets_audienceTag_idx`(`audienceTag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rag_chunks` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NULL,
    `sourceId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `lang` VARCHAR(191) NOT NULL DEFAULT 'pt-BR',
    `tags` JSON NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `embedding` LONGBLOB NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rag_chunks_hash_key`(`hash`),
    INDEX `rag_chunks_organizationId_type_idx`(`organizationId`, `type`),
    INDEX `rag_chunks_type_version_idx`(`type`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rag_embeddings` (
    `id` VARCHAR(191) NOT NULL,
    `chunkId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `modelVersion` VARCHAR(191) NOT NULL,
    `dim` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rag_embeddings_chunkId_key`(`chunkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `type` ENUM('TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `equipment` JSON NOT NULL,
    `safety` VARCHAR(191) NULL,
    `adaptations` JSON NOT NULL,
    `difficulty` INTEGER NULL,
    `refTechniqueId` VARCHAR(191) NULL,
    `defaultParams` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `categoryId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_plan_activities` (
    `id` VARCHAR(191) NOT NULL,
    `lessonPlanId` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `segment` ENUM('WARMUP', 'STRETCH', 'TECHNIQUE', 'DRILL', 'SIMULATION', 'COOLDOWN') NOT NULL,
    `ord` INTEGER NOT NULL DEFAULT 1,
    `params` JSON NULL,
    `objectives` VARCHAR(191) NULL,
    `safetyNotes` VARCHAR(191) NULL,
    `adaptations` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `intensityMultiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `minimumForGraduation` INTEGER NULL,
    `repetitionsPerClass` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `lesson_plan_activities_lessonPlanId_ord_key`(`lessonPlanId`, `ord`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_activities` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `segment` ENUM('WARMUP', 'STRETCH', 'TECHNIQUE', 'DRILL', 'SIMULATION', 'COOLDOWN') NOT NULL,
    `ord` INTEGER NOT NULL DEFAULT 1,
    `paramsUsed` JSON NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `adaptationsUsed` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `class_activities_classId_ord_key`(`classId`, `ord`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rubrics` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minScore` INTEGER NOT NULL DEFAULT 0,
    `maxScore` INTEGER NOT NULL DEFAULT 100,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rubric_criteria` (
    `id` VARCHAR(191) NOT NULL,
    `rubricId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `weight` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TECHNICAL', 'PHYSICAL', 'MIXED') NOT NULL,
    `when` VARCHAR(191) NULL,
    `rubricId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assessment_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `evaluatorId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `scoreTotal` INTEGER NULL,
    `details` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_test_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `metric` ENUM('REPS', 'TIME', 'DISTANCE', 'LOAD') NOT NULL,
    `targetValue` DOUBLE NULL,
    `passThreshold` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_test_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `value` DOUBLE NOT NULL,
    `passed` BOOLEAN NULL,
    `comment` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_lessons` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `mood` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `feedback_lessons_classId_studentId_key`(`classId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_activities` (
    `id` VARCHAR(191) NOT NULL,
    `classActivityId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `perceivedDifficulty` INTEGER NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `feedback_activities_classActivityId_studentId_key`(`classActivityId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `criteria` JSON NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `criteria` JSON NULL,
    `iconUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `badges_organizationId_name_key`(`organizationId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badge_unlocks` (
    `id` VARCHAR(191) NOT NULL,
    `badgeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(191) NULL,

    UNIQUE INDEX `badge_unlocks_badgeId_studentId_key`(`badgeId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `refType` VARCHAR(191) NULL,
    `refId` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turmas` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `classType` ENUM('COLLECTIVE', 'PRIVATE', 'SEMI_PRIVATE') NOT NULL DEFAULT 'COLLECTIVE',
    `status` ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `instructorId` VARCHAR(191) NOT NULL,
    `maxStudents` INTEGER NOT NULL DEFAULT 20,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `schedule` JSON NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `room` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `inactiveReason` VARCHAR(191) NULL,
    `minimumStudents` INTEGER NOT NULL DEFAULT 5,
    `activationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `trainingAreaId` VARCHAR(191) NULL,
    `requireAttendanceForProgress` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turma_interests` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `turma_interests_turmaId_studentId_key`(`turmaId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horarios_sugeridos` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `courseType` VARCHAR(191) NULL,
    `level` VARCHAR(191) NULL,
    `preferredUnit` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `votes` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `createdTurmaId` VARCHAR(191) NULL,

    INDEX `horarios_sugeridos_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `horarios_sugeridos_dayOfWeek_startTime_idx`(`dayOfWeek`, `startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `horario_supporters` (
    `id` VARCHAR(191) NOT NULL,
    `horarioId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `horario_supporters_horarioId_studentId_key`(`horarioId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turma_lessons` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `lessonPlanId` VARCHAR(191) NULL,
    `lessonNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `actualDate` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `duration` INTEGER NOT NULL DEFAULT 60,
    `notes` VARCHAR(191) NULL,
    `materials` JSON NOT NULL,
    `objectives` JSON NOT NULL,
    `techniques` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `turma_lessons_turmaId_lessonNumber_key`(`turmaId`, `lessonNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turma_students` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `turma_students_turmaId_studentId_key`(`turmaId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turma_attendances` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `turmaLessonId` VARCHAR(191) NOT NULL,
    `turmaStudentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `present` BOOLEAN NOT NULL DEFAULT false,
    `late` BOOLEAN NOT NULL DEFAULT false,
    `justified` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `checkedAt` DATETIME(3) NULL,
    `checkedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `turma_attendances_turmaLessonId_studentId_key`(`turmaLessonId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_tracking_settings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `autoCompleteOnCheckin` BOOLEAN NOT NULL DEFAULT false,
    `requireInstructorValidation` BOOLEAN NOT NULL DEFAULT true,
    `enablePerformanceRating` BOOLEAN NOT NULL DEFAULT true,
    `enableVideos` BOOLEAN NOT NULL DEFAULT false,
    `defaultActivityDuration` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `activity_tracking_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turma_courses` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `turma_courses_turmaId_courseId_key`(`turmaId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_training_classes` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `focusAreas` JSON NOT NULL,
    `trainingType` ENUM('INDIVIDUAL', 'SEMI_PRIVATE', 'SMALL_GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `intensity` VARCHAR(191) NOT NULL DEFAULT 'Intermediário',
    `duration` INTEGER NOT NULL DEFAULT 60,
    `location` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_training_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `personalClassId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `actualDuration` INTEGER NULL,
    `status` ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `attendanceConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `studentNotes` VARCHAR(191) NULL,
    `instructorNotes` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `feedback` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `courseId` VARCHAR(191) NULL,
    `lessonContent` JSON NULL,
    `lessonPlanId` VARCHAR(191) NULL,
    `nextLessonSuggestion` VARCHAR(191) NULL,
    `progressNotes` VARCHAR(191) NULL,
    `trainingAreaId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_training_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `preferredDays` JSON NOT NULL,
    `preferredTimes` JSON NOT NULL,
    `preferredInstructors` JSON NOT NULL,
    `trainingFocus` JSON NOT NULL,
    `intensity` VARCHAR(191) NOT NULL DEFAULT 'Intermediário',
    `sessionDuration` INTEGER NOT NULL DEFAULT 60,
    `maxSessionsPerWeek` INTEGER NOT NULL DEFAULT 2,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `personal_training_preferences_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda_items` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `type` ENUM('TURMA', 'PERSONAL_SESSION') NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `trainingAreaId` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED') NOT NULL DEFAULT 'SCHEDULED',
    `maxStudents` INTEGER NULL,
    `actualStudents` INTEGER NOT NULL DEFAULT 0,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrenceRule` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `isVirtual` BOOLEAN NOT NULL DEFAULT false,
    `meetingUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `cpf` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `sourceCampaign` VARCHAR(191) NULL,
    `sourceAdGroup` VARCHAR(191) NULL,
    `sourceKeyword` VARCHAR(191) NULL,
    `gclid` VARCHAR(191) NULL,
    `landingPage` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `utmContent` VARCHAR(191) NULL,
    `utmTerm` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `browserInfo` VARCHAR(191) NULL,
    `stage` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'TRIAL_SCHEDULED', 'TRIAL_ATTENDED', 'NEGOTIATION', 'CONVERTED', 'LOST') NOT NULL DEFAULT 'NEW',
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `assignedToId` VARCHAR(191) NULL,
    `temperature` ENUM('HOT', 'WARM', 'COLD') NOT NULL DEFAULT 'COLD',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `courseInterest` VARCHAR(191) NULL,
    `billingPlanInterest` VARCHAR(191) NULL,
    `modalityInterest` VARCHAR(191) NULL,
    `preferredSchedule` VARCHAR(191) NULL,
    `budget` DECIMAL(10, 2) NULL,
    `message` VARCHAR(191) NULL,
    `leadCreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `firstContactAt` DATETIME(3) NULL,
    `qualifiedAt` DATETIME(3) NULL,
    `trialScheduledAt` DATETIME(3) NULL,
    `trialAttendedAt` DATETIME(3) NULL,
    `enrolledAt` DATETIME(3) NULL,
    `convertedStudentId` VARCHAR(191) NULL,
    `conversionUploaded` BOOLEAN NOT NULL DEFAULT false,
    `lostAt` DATETIME(3) NULL,
    `lostReason` VARCHAR(191) NULL,
    `timeToContact` INTEGER NULL,
    `timeToQualify` INTEGER NULL,
    `timeToTrial` INTEGER NULL,
    `timeToEnrollment` INTEGER NULL,
    `costPerClick` DECIMAL(10, 2) NULL,
    `costPerLead` DECIMAL(10, 2) NULL,
    `costPerAcquisition` DECIMAL(10, 2) NULL,
    `estimatedLTV` DECIMAL(10, 2) NULL,
    `actualRevenue` DECIMAL(10, 2) NULL,
    `tags` JSON NOT NULL,
    `customFields` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `leads_gclid_key`(`gclid`),
    UNIQUE INDEX `leads_convertedStudentId_key`(`convertedStudentId`),
    INDEX `leads_organizationId_stage_status_idx`(`organizationId`, `stage`, `status`),
    INDEX `leads_gclid_idx`(`gclid`),
    INDEX `leads_email_idx`(`email`),
    INDEX `leads_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_activities` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'MEETING', 'TRIAL_CLASS', 'FOLLOW_UP', 'NOTE', 'STATUS_CHANGE', 'DOCUMENT_SENT', 'PAYMENT_RECEIVED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `outcome` VARCHAR(191) NULL,
    `nextAction` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lead_activities_leadId_createdAt_idx`(`leadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_notes` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lead_notes_leadId_createdAt_idx`(`leadId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_ads_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `campaignName` VARCHAR(191) NOT NULL,
    `campaignStatus` VARCHAR(191) NOT NULL,
    `campaignType` VARCHAR(191) NULL,
    `budget` DECIMAL(10, 2) NULL,
    `budgetType` VARCHAR(191) NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `conversionValue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ctr` DECIMAL(5, 2) NULL,
    `cpc` DECIMAL(10, 2) NULL,
    `conversionRate` DECIMAL(5, 2) NULL,
    `costPerConversion` DECIMAL(10, 2) NULL,
    `roi` DECIMAL(10, 2) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `lastSyncAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `google_ads_campaigns_campaignId_key`(`campaignId`),
    INDEX `google_ads_campaigns_organizationId_campaignStatus_idx`(`organizationId`, `campaignStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_ads_ad_groups` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `adGroupId` VARCHAR(191) NOT NULL,
    `adGroupName` VARCHAR(191) NOT NULL,
    `adGroupStatus` VARCHAR(191) NOT NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `conversionValue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `lastSyncAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `google_ads_ad_groups_adGroupId_key`(`adGroupId`),
    INDEX `google_ads_ad_groups_campaignId_idx`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_ads_keywords` (
    `id` VARCHAR(191) NOT NULL,
    `adGroupId` VARCHAR(191) NOT NULL,
    `keywordId` VARCHAR(191) NOT NULL,
    `keywordText` VARCHAR(191) NOT NULL,
    `matchType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `conversionValue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `qualityScore` INTEGER NULL,
    `lastSyncAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `google_ads_keywords_keywordId_key`(`keywordId`),
    INDEX `google_ads_keywords_adGroupId_idx`(`adGroupId`),
    INDEX `google_ads_keywords_keywordText_idx`(`keywordText`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_ads_configs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `google_ads_configs_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_settings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `googleAdsCustomerId` VARCHAR(191) NULL,
    `googleAdsClientId` VARCHAR(191) NULL,
    `googleAdsClientSecret` VARCHAR(191) NULL,
    `googleAdsRefreshToken` VARCHAR(191) NULL,
    `googleAdsDeveloperToken` VARCHAR(191) NULL,
    `googleAdsConversionAction` VARCHAR(191) NULL,
    `googleAdsConnected` BOOLEAN NOT NULL DEFAULT false,
    `googleAdsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `conversionActionId` VARCHAR(191) NULL,
    `defaultLTV` DECIMAL(10, 2) NULL,
    `autoAssignLeads` BOOLEAN NOT NULL DEFAULT false,
    `defaultAssigneeId` VARCHAR(191) NULL,
    `notifyNewLead` BOOLEAN NOT NULL DEFAULT true,
    `notifyHotLead` BOOLEAN NOT NULL DEFAULT true,
    `notifyLostLead` BOOLEAN NOT NULL DEFAULT false,
    `autoFollowUpDays` INTEGER NOT NULL DEFAULT 3,
    `autoArchiveDays` INTEGER NOT NULL DEFAULT 30,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `crm_settings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `minimumForGraduation` INTEGER NULL DEFAULT 50,

    UNIQUE INDEX `activity_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_activity_executions` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NOT NULL,
    `turmaLessonId` VARCHAR(191) NOT NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `repetitionsCount` INTEGER NOT NULL DEFAULT 1,
    `durationMinutes` INTEGER NULL,
    `intensityApplied` DOUBLE NOT NULL DEFAULT 1.0,
    `performanceRating` INTEGER NULL,
    `instructorNotes` VARCHAR(191) NULL,
    `validatedBy` VARCHAR(191) NULL,
    `validatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lesson_activity_executions_studentId_activityId_idx`(`studentId`, `activityId`),
    INDEX `lesson_activity_executions_turmaLessonId_idx`(`turmaLessonId`),
    UNIQUE INDEX `lesson_activity_executions_attendanceId_activityId_key`(`attendanceId`, `activityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_graduation_levels` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `currentBelt` VARCHAR(191) NOT NULL,
    `nextBelt` VARCHAR(191) NOT NULL,
    `totalDegrees` INTEGER NOT NULL DEFAULT 4,
    `degreePercentageIncrement` DOUBLE NOT NULL DEFAULT 20,
    `minimumAttendanceRate` DOUBLE NOT NULL DEFAULT 80,
    `minimumQualityRating` DOUBLE NOT NULL DEFAULT 3.0,
    `minimumRepetitionsTotal` INTEGER NOT NULL DEFAULT 500,
    `minimumMonthsEnrolled` INTEGER NOT NULL DEFAULT 3,
    `requiresInstructorApproval` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `course_graduation_levels_courseId_currentBelt_key`(`courseId`, `currentBelt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_degree_history` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `degree` INTEGER NOT NULL,
    `degreePercentage` DOUBLE NOT NULL,
    `belt` VARCHAR(191) NOT NULL,
    `completedLessons` INTEGER NOT NULL,
    `totalRepetitions` INTEGER NOT NULL,
    `averageQuality` DOUBLE NULL,
    `attendanceRate` DOUBLE NOT NULL,
    `achievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_degree_history_studentId_courseId_idx`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_graduations` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `fromBelt` VARCHAR(191) NOT NULL,
    `toBelt` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finalAttendanceRate` DOUBLE NOT NULL,
    `finalQualityRating` DOUBLE NOT NULL,
    `totalRepetitions` INTEGER NOT NULL,
    `totalLessonsCompleted` INTEGER NOT NULL,
    `certificateGenerated` BOOLEAN NOT NULL DEFAULT false,
    `certificateUrl` VARCHAR(191) NULL,
    `ceremonyDate` DATETIME(3) NULL,
    `ceremonyNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_graduations_studentId_courseId_toBelt_key`(`studentId`, `courseId`, `toBelt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_agents` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `specialization` ENUM('pedagogical', 'analytical', 'support', 'progression', 'commercial', 'curriculum') NOT NULL,
    `model` VARCHAR(191) NOT NULL DEFAULT 'gemini-1.5-flash',
    `systemPrompt` VARCHAR(191) NOT NULL,
    `ragSources` JSON NOT NULL,
    `mcpTools` JSON NOT NULL,
    `temperature` DOUBLE NOT NULL DEFAULT 0.7,
    `maxTokens` INTEGER NOT NULL DEFAULT 2048,
    `noCodeMode` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `autoSaveInsights` BOOLEAN NOT NULL DEFAULT true,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `averageRating` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_agents_organizationId_isActive_idx`(`organizationId`, `isActive`),
    INDEX `ai_agents_specialization_idx`(`specialization`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_conversations` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `messages` JSON NOT NULL,
    `rating` INTEGER NULL,
    `feedback` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_conversations_agentId_idx`(`agentId`),
    INDEX `agent_conversations_userId_idx`(`userId`),
    INDEX `agent_conversations_studentId_idx`(`studentId`),
    INDEX `agent_conversations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_interactions` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `action` JSON NULL,
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_interactions_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `agent_interactions_agentId_idx`(`agentId`),
    INDEX `agent_interactions_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `deniedReason` VARCHAR(191) NULL,
    `executedAt` DATETIME(3) NULL,
    `executionResult` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `agent_permissions_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `agent_permissions_agentId_idx`(`agentId`),
    INDEX `agent_permissions_status_idx`(`status`),
    INDEX `agent_permissions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `lessonNumber` INTEGER NOT NULL,
    `activityName` VARCHAR(191) NOT NULL,
    `completedReps` INTEGER NOT NULL DEFAULT 0,
    `targetReps` INTEGER NOT NULL,
    `completionPercentage` DOUBLE NOT NULL DEFAULT 0,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_progress_studentId_courseId_idx`(`studentId`, `courseId`),
    INDEX `student_progress_courseId_lessonNumber_idx`(`courseId`, `lessonNumber`),
    UNIQUE INDEX `student_progress_studentId_courseId_lessonNumber_activityNam_key`(`studentId`, `courseId`, `lessonNumber`, `activityName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualitative_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `studentProgressId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `qualitative_assessments_studentProgressId_idx`(`studentProgressId`),
    INDEX `qualitative_assessments_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `beltLevel` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `activityName` VARCHAR(191) NOT NULL,
    `minimumReps` INTEGER NOT NULL,
    `minimumRating` DOUBLE NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_requirements_courseId_beltLevel_idx`(`courseId`, `beltLevel`),
    UNIQUE INDEX `course_requirements_courseId_beltLevel_activityName_key`(`courseId`, `beltLevel`, `activityName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biometric_data` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `embedding` JSON NOT NULL,
    `photoUrl` VARCHAR(191) NOT NULL,
    `photoBase64` LONGTEXT NULL,
    `qualityScore` INTEGER NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUpdatedAt` DATETIME(3) NOT NULL,
    `enrollmentMethod` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `biometric_data_studentId_key`(`studentId`),
    INDEX `biometric_data_studentId_idx`(`studentId`),
    INDEX `biometric_data_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biometric_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `detectedStudentId` VARCHAR(191) NULL,
    `similarity` DOUBLE NOT NULL,
    `confidence` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `errorMessage` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `biometric_attempts_organizationId_idx`(`organizationId`),
    INDEX `biometric_attempts_studentId_idx`(`studentId`),
    INDEX `biometric_attempts_detectedStudentId_idx`(`detectedStudentId`),
    INDEX `biometric_attempts_attemptedAt_idx`(`attemptedAt`),
    INDEX `biometric_attempts_method_idx`(`method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentTask` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `assignedToUserId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `targetEntity` VARCHAR(191) NULL,
    `actionPayload` JSON NOT NULL,
    `reasoning` JSON NULL,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT true,
    `autoExecute` BOOLEAN NOT NULL DEFAULT false,
    `automationLevel` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedReason` VARCHAR(191) NULL,
    `executorType` VARCHAR(191) NULL DEFAULT 'AGENT',
    `executorId` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `recurrenceRule` VARCHAR(191) NULL,
    `maxRetries` INTEGER NOT NULL DEFAULT 3,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `lastRetryAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `executedAt` DATETIME(3) NULL,
    `executionResult` JSON NULL,
    `errorMessage` VARCHAR(191) NULL,
    `executionLog` JSON NULL,
    `dueDate` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgentTask_organizationId_approvalStatus_idx`(`organizationId`, `approvalStatus`),
    INDEX `AgentTask_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `AgentTask_agentId_idx`(`agentId`),
    INDEX `AgentTask_createdByUserId_idx`(`createdByUserId`),
    INDEX `AgentTask_assignedToUserId_idx`(`assignedToUserId`),
    INDEX `AgentTask_executorType_executorId_idx`(`executorType`, `executorId`),
    INDEX `AgentTask_scheduledFor_idx`(`scheduledFor`),
    INDEX `AgentTask_approvalStatus_idx`(`approvalStatus`),
    INDEX `AgentTask_status_idx`(`status`),
    INDEX `AgentTask_priority_idx`(`priority`),
    INDEX `AgentTask_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_executions` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL DEFAULT 1,
    `executorType` VARCHAR(191) NOT NULL,
    `executorId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `result` JSON NULL,
    `errorMessage` VARCHAR(191) NULL,
    `errorStack` VARCHAR(191) NULL,
    `metadata` JSON NULL,

    INDEX `task_executions_taskId_idx`(`taskId`),
    INDEX `task_executions_executorType_executorId_idx`(`executorType`, `executorId`),
    INDEX `task_executions_status_idx`(`status`),
    INDEX `task_executions_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_insights` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `executionId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `relatedEntity` VARCHAR(191) NULL,
    `relatedId` VARCHAR(191) NULL,
    `actionTaken` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `agent_insights_organizationId_type_idx`(`organizationId`, `type`),
    INDEX `agent_insights_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `agent_insights_agentId_idx`(`agentId`),
    INDEX `agent_insights_type_idx`(`type`),
    INDEX `agent_insights_category_idx`(`category`),
    INDEX `agent_insights_priority_idx`(`priority`),
    INDEX `agent_insights_status_idx`(`status`),
    INDEX `agent_insights_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landing_pages` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `keywords` JSON NOT NULL,
    `theme` JSON NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `htmlContent` TEXT NULL,
    `cssContent` TEXT NULL,
    `jsContent` TEXT NULL,
    `sections` JSON NULL,
    `googleAnalyticsId` VARCHAR(191) NULL,
    `facebookPixelId` VARCHAR(191) NULL,
    `googleAdsConversionId` VARCHAR(191) NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `lastGeneratedAt` DATETIME(3) NULL,
    `lastGeneratedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `landing_pages_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `landing_pages_status_idx`(`status`),
    UNIQUE INDEX `landing_pages_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landing_forms` (
    `id` VARCHAR(191) NOT NULL,
    `landingPageId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL DEFAULT 'hero',
    `fields` JSON NOT NULL,
    `submitButtonText` VARCHAR(191) NOT NULL DEFAULT 'Quero Começar!',
    `successMessage` VARCHAR(191) NOT NULL DEFAULT 'Obrigado! Entraremos em contato em breve.',
    `autoCreateLead` BOOLEAN NOT NULL DEFAULT true,
    `leadSource` VARCHAR(191) NOT NULL DEFAULT 'LANDING_PAGE',
    `leadTemperature` VARCHAR(191) NOT NULL DEFAULT 'HOT',
    `assignToUserId` VARCHAR(191) NULL,
    `tags` JSON NOT NULL,
    `submissions` INTEGER NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `landing_forms_landingPageId_idx`(`landingPageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landing_page_views` (
    `id` VARCHAR(191) NOT NULL,
    `landingPageId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `utmContent` VARCHAR(191) NULL,
    `utmTerm` VARCHAR(191) NULL,
    `timeOnPage` INTEGER NULL,
    `scrollDepth` INTEGER NULL,
    `visitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `landing_page_views_landingPageId_visitedAt_idx`(`landingPageId`, `visitedAt`),
    INDEX `landing_page_views_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `magicCode` VARCHAR(191) NULL,
    `codeExpires` DATETIME(3) NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_sessions_token_key`(`token`),
    INDEX `student_sessions_studentId_idx`(`studentId`),
    INDEX `student_sessions_token_idx`(`token`),
    INDEX `student_sessions_magicCode_idx`(`magicCode`),
    INDEX `student_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` ENUM('PAYMENT_DUE', 'PAYMENT_OVERDUE', 'PAYMENT_CONFIRMED', 'CLASS_REMINDER', 'CLASS_CANCELLED', 'CLASS_RESCHEDULED', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'BELT_PROMOTION', 'SYSTEM', 'MARKETING', 'WELCOME', 'REMINDER') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `dismissed` BOOLEAN NOT NULL DEFAULT false,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    `metadata` JSON NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_notifications_studentId_read_idx`(`studentId`, `read`),
    INDEX `student_notifications_studentId_type_idx`(`studentId`, `type`),
    INDEX `student_notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissions_module_action_key`(`module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'STUDENT') NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `scope` ENUM('ALL', 'OWN', 'TEAM', 'NONE') NOT NULL DEFAULT 'ALL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `role_permissions_role_permissionId_key`(`role`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permission_overrides` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL,
    `scope` ENUM('ALL', 'OWN', 'TEAM', 'NONE') NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    UNIQUE INDEX `user_permission_overrides_userId_permissionId_key`(`userId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_technique_progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `techniqueId` VARCHAR(191) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `rating` INTEGER NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_technique_progress_studentId_techniqueId_key`(`studentId`, `techniqueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `requirements` VARCHAR(191) NULL,
    `responsibilities` VARCHAR(191) NULL,
    `benefits` VARCHAR(191) NULL,
    `type` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'VOLUNTEER') NOT NULL DEFAULT 'FULL_TIME',
    `level` ENUM('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER') NOT NULL DEFAULT 'MID',
    `location` VARCHAR(191) NULL,
    `remoteOption` BOOLEAN NOT NULL DEFAULT false,
    `salary` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `vacancies` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NULL,
    `coverLetter` VARCHAR(191) NULL,
    `resume` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'HIRED') NOT NULL DEFAULT 'PENDING',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `interviewDate` DATETIME(3) NULL,

    UNIQUE INDEX `job_applications_jobId_userId_key`(`jobId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deploy_artifacts` (
    `id` VARCHAR(191) NOT NULL,
    `sourceVersion` VARCHAR(191) NOT NULL,
    `buildTimestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aliasesResolved` BOOLEAN NOT NULL DEFAULT true,
    `checksum` VARCHAR(191) NOT NULL,
    `contents` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deploy_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `artifactId` VARCHAR(191) NOT NULL,
    `operator` VARCHAR(191) NOT NULL,
    `targetEnvironment` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ROLLED_BACK') NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deploy_health_checks` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `httpStatus` INTEGER NOT NULL,
    `latencyMs` INTEGER NOT NULL,
    `stabilityWindowMinutes` INTEGER NOT NULL DEFAULT 30,
    `restartsObserved` INTEGER NOT NULL DEFAULT 0,
    `result` ENUM('PASS', 'FAIL') NOT NULL,
    `logExcerpt` VARCHAR(191) NULL,

    UNIQUE INDEX `deploy_health_checks_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deploy_logs` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `level` ENUM('INFO', 'WARN', 'ERROR') NOT NULL DEFAULT 'INFO',
    `message` VARCHAR(191) NOT NULL,
    `data` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pre_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NULL,
    `photoUrl` TEXT NULL,
    `planId` VARCHAR(191) NULL,
    `courseId` VARCHAR(191) NULL,
    `customPrice` DECIMAL(10, 2) NULL,
    `financialResponsible` JSON NULL,
    `source` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `convertedAt` DATETIME(3) NULL,
    `studentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pre_enrollments_email_key`(`email`),
    UNIQUE INDEX `pre_enrollments_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollment_links` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `customPrice` DECIMAL(10, 2) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `enrollment_links_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcasts` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `segment` VARCHAR(191) NOT NULL,
    `channels` JSON NOT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `stats` JSON NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organization_settings` ADD CONSTRAINT `organization_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `martial_arts` ADD CONSTRAINT `martial_arts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_courseTemplateId_fkey` FOREIGN KEY (`courseTemplateId`) REFERENCES `course_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_martialArtId_fkey` FOREIGN KEY (`martialArtId`) REFERENCES `martial_arts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_nextCourseId_fkey` FOREIGN KEY (`nextCourseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_programs` ADD CONSTRAINT `course_programs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_templates` ADD CONSTRAINT `course_templates_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_libraries` ADD CONSTRAINT `technique_libraries_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_previousVersionId_fkey` FOREIGN KEY (`previousVersionId`) REFERENCES `lesson_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `techniques` ADD CONSTRAINT `techniques_martialArtId_fkey` FOREIGN KEY (`martialArtId`) REFERENCES `martial_arts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_techniques` ADD CONSTRAINT `course_techniques_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_techniques` ADD CONSTRAINT `course_techniques_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_financialResponsibleId_fkey` FOREIGN KEY (`financialResponsibleId`) REFERENCES `financial_responsibles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_financialResponsibleStudentId_fkey` FOREIGN KEY (`financialResponsibleStudentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `educational_plan_techniques` ADD CONSTRAINT `educational_plan_techniques_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plan_techniques` ADD CONSTRAINT `lesson_plan_techniques_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plan_techniques` ADD CONSTRAINT `lesson_plan_techniques_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_responsibles` ADD CONSTRAINT `financial_responsibles_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_records` ADD CONSTRAINT `technique_records_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_records` ADD CONSTRAINT `technique_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_records` ADD CONSTRAINT `technique_records_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_areas` ADD CONSTRAINT `training_areas_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mats` ADD CONSTRAINT `mats_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mats` ADD CONSTRAINT `mats_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `instructors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `instructors_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_courses` ADD CONSTRAINT `fk_instructor_courses_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `instructor_courses` ADD CONSTRAINT `fk_instructor_courses_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_courseProgramId_fkey` FOREIGN KEY (`courseProgramId`) REFERENCES `course_programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_matId_fkey` FOREIGN KEY (`matId`) REFERENCES `mats`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `class_schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_trainingAreaId_fkey` FOREIGN KEY (`trainingAreaId`) REFERENCES `training_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_progress` ADD CONSTRAINT `technique_progress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_progress` ADD CONSTRAINT `technique_progress_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_challenges` ADD CONSTRAINT `course_challenges_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `course_challenges`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `course_enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluations` ADD CONSTRAINT `evaluations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_progressions` ADD CONSTRAINT `student_progressions_martialArtId_fkey` FOREIGN KEY (`martialArtId`) REFERENCES `martial_arts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_progressions` ADD CONSTRAINT `student_progressions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_martialArtId_fkey` FOREIGN KEY (`martialArtId`) REFERENCES `martial_arts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_achievements` ADD CONSTRAINT `student_achievements_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_achievements` ADD CONSTRAINT `student_achievements_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_courses` ADD CONSTRAINT `student_courses_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_courses` ADD CONSTRAINT `student_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_courses` ADD CONSTRAINT `student_courses_paymentPlanId_fkey` FOREIGN KEY (`paymentPlanId`) REFERENCES `billing_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_courses` ADD CONSTRAINT `student_courses_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_records` ADD CONSTRAINT `progress_records_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress_records` ADD CONSTRAINT `progress_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_details` ADD CONSTRAINT `technique_details_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weekly_challenges` ADD CONSTRAINT `weekly_challenges_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluation_records` ADD CONSTRAINT `evaluation_records_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluation_records` ADD CONSTRAINT `evaluation_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_patterns` ADD CONSTRAINT `attendance_patterns_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asaas_customers` ADD CONSTRAINT `asaas_customers_financialResponsibleId_fkey` FOREIGN KEY (`financialResponsibleId`) REFERENCES `financial_responsibles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asaas_customers` ADD CONSTRAINT `asaas_customers_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asaas_customers` ADD CONSTRAINT `asaas_customers_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_plans` ADD CONSTRAINT `billing_plans_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_plans` ADD CONSTRAINT `billing_plans_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_plan_discounts` ADD CONSTRAINT `billing_plan_discounts_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_plan_discounts` ADD CONSTRAINT `billing_plan_discounts_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `discounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_asaasCustomerId_fkey` FOREIGN KEY (`asaasCustomerId`) REFERENCES `asaas_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_financialResponsibleId_fkey` FOREIGN KEY (`financialResponsibleId`) REFERENCES `financial_responsibles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_asaasCustomerId_fkey` FOREIGN KEY (`asaasCustomerId`) REFERENCES `asaas_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_financialResponsibleId_fkey` FOREIGN KEY (`financialResponsibleId`) REFERENCES `financial_responsibles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financial_settings` ADD CONSTRAINT `financial_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_credits` ADD CONSTRAINT `student_credits_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_credits` ADD CONSTRAINT `student_credits_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_credits` ADD CONSTRAINT `student_credits_previousCreditId_fkey` FOREIGN KEY (`previousCreditId`) REFERENCES `student_credits`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_credits` ADD CONSTRAINT `student_credits_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_credits` ADD CONSTRAINT `student_credits_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_usages` ADD CONSTRAINT `credit_usages_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `attendances`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_usages` ADD CONSTRAINT `credit_usages_creditId_fkey` FOREIGN KEY (`creditId`) REFERENCES `student_credits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_usages` ADD CONSTRAINT `credit_usages_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_usages` ADD CONSTRAINT `credit_usages_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_renewals` ADD CONSTRAINT `credit_renewals_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_renewals` ADD CONSTRAINT `credit_renewals_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_courses` ADD CONSTRAINT `plan_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_courses` ADD CONSTRAINT `plan_courses_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_prerequisite` ADD CONSTRAINT `technique_prerequisite_prerequisiteTechniqueId_fkey` FOREIGN KEY (`prerequisiteTechniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technique_prerequisite` ADD CONSTRAINT `technique_prerequisite_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rag_embeddings` ADD CONSTRAINT `rag_embeddings_chunkId_fkey` FOREIGN KEY (`chunkId`) REFERENCES `rag_chunks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `activity_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_refTechniqueId_fkey` FOREIGN KEY (`refTechniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plan_activities` ADD CONSTRAINT `lesson_plan_activities_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plan_activities` ADD CONSTRAINT `lesson_plan_activities_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_activities` ADD CONSTRAINT `class_activities_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_activities` ADD CONSTRAINT `class_activities_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rubric_criteria` ADD CONSTRAINT `rubric_criteria_rubricId_fkey` FOREIGN KEY (`rubricId`) REFERENCES `rubrics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_definitions` ADD CONSTRAINT `assessment_definitions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_definitions` ADD CONSTRAINT `assessment_definitions_rubricId_fkey` FOREIGN KEY (`rubricId`) REFERENCES `rubrics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `assessment_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assessment_attempts` ADD CONSTRAINT `assessment_attempts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `physical_test_attempts` ADD CONSTRAINT `physical_test_attempts_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `physical_test_attempts` ADD CONSTRAINT `physical_test_attempts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `physical_test_attempts` ADD CONSTRAINT `physical_test_attempts_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `physical_test_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_lessons` ADD CONSTRAINT `feedback_lessons_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_lessons` ADD CONSTRAINT `feedback_lessons_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_activities` ADD CONSTRAINT `feedback_activities_classActivityId_fkey` FOREIGN KEY (`classActivityId`) REFERENCES `class_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_activities` ADD CONSTRAINT `feedback_activities_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_evaluations` ADD CONSTRAINT `teacher_evaluations_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_evaluations` ADD CONSTRAINT `teacher_evaluations_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_evaluations` ADD CONSTRAINT `teacher_evaluations_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_evaluations` ADD CONSTRAINT `teacher_evaluations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `badges` ADD CONSTRAINT `badges_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `badge_unlocks` ADD CONSTRAINT `badge_unlocks_badgeId_fkey` FOREIGN KEY (`badgeId`) REFERENCES `badges`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `badge_unlocks` ADD CONSTRAINT `badge_unlocks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_trainingAreaId_fkey` FOREIGN KEY (`trainingAreaId`) REFERENCES `training_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turmas` ADD CONSTRAINT `turmas_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_interests` ADD CONSTRAINT `turma_interests_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_interests` ADD CONSTRAINT `turma_interests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_sugeridos` ADD CONSTRAINT `horarios_sugeridos_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_sugeridos` ADD CONSTRAINT `horarios_sugeridos_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horarios_sugeridos` ADD CONSTRAINT `horarios_sugeridos_createdTurmaId_fkey` FOREIGN KEY (`createdTurmaId`) REFERENCES `turmas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horario_supporters` ADD CONSTRAINT `horario_supporters_horarioId_fkey` FOREIGN KEY (`horarioId`) REFERENCES `horarios_sugeridos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `horario_supporters` ADD CONSTRAINT `horario_supporters_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_lessons` ADD CONSTRAINT `turma_lessons_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_lessons` ADD CONSTRAINT `turma_lessons_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_students` ADD CONSTRAINT `turma_students_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_students` ADD CONSTRAINT `turma_students_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_attendances` ADD CONSTRAINT `turma_attendances_checkedBy_fkey` FOREIGN KEY (`checkedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_attendances` ADD CONSTRAINT `turma_attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_attendances` ADD CONSTRAINT `turma_attendances_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_attendances` ADD CONSTRAINT `turma_attendances_turmaLessonId_fkey` FOREIGN KEY (`turmaLessonId`) REFERENCES `turma_lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_attendances` ADD CONSTRAINT `turma_attendances_turmaStudentId_fkey` FOREIGN KEY (`turmaStudentId`) REFERENCES `turma_students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_tracking_settings` ADD CONSTRAINT `activity_tracking_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_courses` ADD CONSTRAINT `turma_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turma_courses` ADD CONSTRAINT `turma_courses_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `turmas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_classes` ADD CONSTRAINT `personal_training_classes_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_classes` ADD CONSTRAINT `personal_training_classes_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_classes` ADD CONSTRAINT `personal_training_classes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_sessions` ADD CONSTRAINT `personal_training_sessions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_sessions` ADD CONSTRAINT `personal_training_sessions_lessonPlanId_fkey` FOREIGN KEY (`lessonPlanId`) REFERENCES `lesson_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_sessions` ADD CONSTRAINT `personal_training_sessions_personalClassId_fkey` FOREIGN KEY (`personalClassId`) REFERENCES `personal_training_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_sessions` ADD CONSTRAINT `personal_training_sessions_trainingAreaId_fkey` FOREIGN KEY (`trainingAreaId`) REFERENCES `training_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_sessions` ADD CONSTRAINT `personal_training_sessions_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personal_training_preferences` ADD CONSTRAINT `personal_training_preferences_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_items` ADD CONSTRAINT `agenda_items_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_items` ADD CONSTRAINT `agenda_items_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_items` ADD CONSTRAINT `agenda_items_trainingAreaId_fkey` FOREIGN KEY (`trainingAreaId`) REFERENCES `training_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agenda_items` ADD CONSTRAINT `agenda_items_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_convertedStudentId_fkey` FOREIGN KEY (`convertedStudentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_notes` ADD CONSTRAINT `lead_notes_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_notes` ADD CONSTRAINT `lead_notes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `google_ads_campaigns` ADD CONSTRAINT `google_ads_campaigns_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `google_ads_ad_groups` ADD CONSTRAINT `google_ads_ad_groups_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `google_ads_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `google_ads_keywords` ADD CONSTRAINT `google_ads_keywords_adGroupId_fkey` FOREIGN KEY (`adGroupId`) REFERENCES `google_ads_ad_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `google_ads_configs` ADD CONSTRAINT `google_ads_configs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_settings` ADD CONSTRAINT `crm_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_activity_executions` ADD CONSTRAINT `lesson_activity_executions_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `lesson_plan_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_activity_executions` ADD CONSTRAINT `lesson_activity_executions_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `turma_attendances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_activity_executions` ADD CONSTRAINT `lesson_activity_executions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_activity_executions` ADD CONSTRAINT `lesson_activity_executions_turmaLessonId_fkey` FOREIGN KEY (`turmaLessonId`) REFERENCES `turma_lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_activity_executions` ADD CONSTRAINT `lesson_activity_executions_validatedBy_fkey` FOREIGN KEY (`validatedBy`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_graduation_levels` ADD CONSTRAINT `course_graduation_levels_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_degree_history` ADD CONSTRAINT `student_degree_history_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_degree_history` ADD CONSTRAINT `student_degree_history_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_graduations` ADD CONSTRAINT `student_graduations_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_graduations` ADD CONSTRAINT `student_graduations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agents` ADD CONSTRAINT `ai_agents_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_conversations` ADD CONSTRAINT `agent_conversations_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_conversations` ADD CONSTRAINT `agent_conversations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_conversations` ADD CONSTRAINT `agent_conversations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_interactions` ADD CONSTRAINT `agent_interactions_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_interactions` ADD CONSTRAINT `agent_interactions_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_permissions` ADD CONSTRAINT `agent_permissions_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_permissions` ADD CONSTRAINT `agent_permissions_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_permissions` ADD CONSTRAINT `agent_permissions_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_progress` ADD CONSTRAINT `student_progress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_progress` ADD CONSTRAINT `student_progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualitative_assessments` ADD CONSTRAINT `qualitative_assessments_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualitative_assessments` ADD CONSTRAINT `qualitative_assessments_studentProgressId_fkey` FOREIGN KEY (`studentProgressId`) REFERENCES `student_progress`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_requirements` ADD CONSTRAINT `course_requirements_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biometric_data` ADD CONSTRAINT `biometric_data_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `biometric_attempts` ADD CONSTRAINT `biometric_attempts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_executorId_fkey` FOREIGN KEY (`executorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_executions` ADD CONSTRAINT `task_executions_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `AgentTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_executions` ADD CONSTRAINT `task_executions_executorId_fkey` FOREIGN KEY (`executorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_insights` ADD CONSTRAINT `agent_insights_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_insights` ADD CONSTRAINT `agent_insights_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `landing_pages` ADD CONSTRAINT `landing_pages_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `landing_forms` ADD CONSTRAINT `landing_forms_landingPageId_fkey` FOREIGN KEY (`landingPageId`) REFERENCES `landing_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `landing_page_views` ADD CONSTRAINT `landing_page_views_landingPageId_fkey` FOREIGN KEY (`landingPageId`) REFERENCES `landing_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_sessions` ADD CONSTRAINT `student_sessions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_notifications` ADD CONSTRAINT `student_notifications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permission_overrides` ADD CONSTRAINT `user_permission_overrides_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_technique_progress` ADD CONSTRAINT `student_technique_progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_technique_progress` ADD CONSTRAINT `student_technique_progress_techniqueId_fkey` FOREIGN KEY (`techniqueId`) REFERENCES `techniques`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deploy_sessions` ADD CONSTRAINT `deploy_sessions_artifactId_fkey` FOREIGN KEY (`artifactId`) REFERENCES `deploy_artifacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deploy_health_checks` ADD CONSTRAINT `deploy_health_checks_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `deploy_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deploy_logs` ADD CONSTRAINT `deploy_logs_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `deploy_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_enrollments` ADD CONSTRAINT `pre_enrollments_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_enrollments` ADD CONSTRAINT `pre_enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_enrollments` ADD CONSTRAINT `pre_enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment_links` ADD CONSTRAINT `enrollment_links_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment_links` ADD CONSTRAINT `enrollment_links_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `billing_plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment_links` ADD CONSTRAINT `enrollment_links_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
