import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/krav_academy_test_db',
    },
  },
});

beforeAll(async () => {
  // Ensure the test database is set up
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database between tests
  await prisma.attendance.deleteMany();
  await prisma.attendancePattern.deleteMany();
  await prisma.class.deleteMany();
  await prisma.lessonPlan.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.courseProgram.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.progressRecord.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };