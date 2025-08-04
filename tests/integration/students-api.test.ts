import { describe, it, expect } from 'vitest';
import { prisma } from '../setup';

describe('Students API Integration', () => {
  describe('Database Operations', () => {
    it('should create a new student in the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a test user
      const user = await prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'test.student@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Student',
          role: 'STUDENT',
        },
      });

      // Create a student record
      const student = await prisma.student.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          category: 'ADULT',
          isActive: true,
        },
      });

      expect(student).toBeDefined();
      expect(student.userId).toBe(user.id);
      expect(student.category).toBe('ADULT');
      expect(student.isActive).toBe(true);

      // Clean up
      await prisma.student.delete({ where: { id: student.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });

    it('should retrieve a student from the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a test user
      const user = await prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'test.student2@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Student2',
          role: 'STUDENT',
        },
      });

      // Create a student record
      const student = await prisma.student.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          category: 'ADULT',
          isActive: true,
        },
        include: {
          user: true,
        },
      });

      // Retrieve the student
      const retrievedStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: { user: true },
      });

      expect(retrievedStudent).toBeDefined();
      expect(retrievedStudent?.userId).toBe(user.id);
      expect(retrievedStudent?.user.email).toBe('test.student2@example.com');
      expect(retrievedStudent?.category).toBe('ADULT');

      // Clean up
      await prisma.student.delete({ where: { id: student.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });

    it('should update a student in the database', async () => {
      // Create a test organization first
      const organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
        },
      });

      // Create a test user
      const user = await prisma.user.create({
        data: {
          organizationId: organization.id,
          email: 'test.student3@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Student3',
          role: 'STUDENT',
        },
      });

      // Create a student record
      let student = await prisma.student.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          category: 'ADULT',
          isActive: true,
        },
      });

      // Update the student
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          category: 'CHILD',
          isActive: false,
        },
      });

      expect(student.category).toBe('CHILD');
      expect(student.isActive).toBe(false);

      // Clean up
      await prisma.student.delete({ where: { id: student.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.organization.delete({ where: { id: organization.id } });
    });
  });
});
