import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export default async function instructorCoursesRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET /api/instructors/:instructorId/courses - list courses for instructor
  fastify.get('/:instructorId/courses', async (request, reply) => {
    try {
      const { instructorId } = request.params as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;

      // Verify instructor belongs to organization
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, organizationId }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      const courses = await prisma.instructorCourse.findMany({
        where: { instructor_id: instructorId },
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
              isActive: true,
              imageUrl: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return { success: true, data: courses };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch instructor courses' };
    }
  });

  // POST /api/instructors/:instructorId/courses - add course to instructor
  fastify.post('/:instructorId/courses', async (request, reply) => {
    try {
      const { instructorId } = request.params as any;
      const payload = request.body as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;

      // Validate required fields
      if (!payload.courseId) {
        reply.code(400);
        return { success: false, error: 'courseId is required' };
      }

      // Verify instructor exists and belongs to organization
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, organizationId }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Verify course exists and belongs to organization
      const course = await prisma.course.findFirst({
        where: { id: payload.courseId, organizationId }
      });

      if (!course) {
        reply.code(404);
        return { success: false, error: 'Course not found' };
      }

      // Check if association already exists
      const existing = await prisma.instructorCourse.findUnique({
        where: {
          instructor_id_course_id: {
            instructor_id: instructorId,
            course_id: payload.courseId
          }
        }
      });

      if (existing) {
        reply.code(409);
        return { success: false, error: 'Instructor already assigned to this course' };
      }

      // Create association
      const instructorCourse = await prisma.instructorCourse.create({
        data: {
          instructor_id: instructorId,
          course_id: payload.courseId,
          is_lead: payload.isLead || false,
          certified_at: payload.certifiedAt ? new Date(payload.certifiedAt) : new Date(),
          expires_at: payload.expiresAt ? new Date(payload.expiresAt) : null,
          notes: payload.notes || null
        },
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true,
              isActive: true
            }
          }
        }
      });

      return { success: true, data: instructorCourse };
    } catch (error: any) {
      if (error.code === 'P2002') {
        reply.code(409);
        return { success: false, error: 'Instructor already assigned to this course' };
      }
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to assign course to instructor' };
    }
  });

  // DELETE /api/instructors/:instructorId/courses/:courseId - remove course from instructor
  fastify.delete('/:instructorId/courses/:courseId', async (request, reply) => {
    try {
      const { instructorId, courseId } = request.params as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;

      // Verify instructor belongs to organization
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, organizationId }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Delete the association
      const deleted = await prisma.instructorCourse.deleteMany({
        where: {
          instructor_id: instructorId,
          course_id: courseId
        }
      });

      if (deleted.count === 0) {
        reply.code(404);
        return { success: false, error: 'Course assignment not found' };
      }

      return { success: true, message: 'Course removed from instructor' };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to remove course from instructor' };
    }
  });

  // PUT /api/instructors/:instructorId/courses/:courseId - update course assignment
  fastify.put('/:instructorId/courses/:courseId', async (request, reply) => {
    try {
      const { instructorId, courseId } = request.params as any;
      const payload = request.body as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;

      // Verify instructor belongs to organization
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, organizationId }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Find existing assignment
      const existing = await prisma.instructorCourse.findUnique({
        where: {
          instructor_id_course_id: { instructor_id: instructorId, course_id: courseId }
        }
      });

      if (!existing) {
        reply.code(404);
        return { success: false, error: 'Course assignment not found' };
      }

      // Update assignment
      const updateData: any = {};
      if (payload.isLead !== undefined) updateData.is_lead = payload.isLead;
      if (payload.certifiedAt !== undefined) updateData.certified_at = payload.certifiedAt ? new Date(payload.certifiedAt) : null;
      if (payload.expiresAt !== undefined) updateData.expires_at = payload.expiresAt ? new Date(payload.expiresAt) : null;
      if (payload.notes !== undefined) updateData.notes = payload.notes;

      const updated = await prisma.instructorCourse.update({
        where: {
          instructor_id_course_id: { instructor_id: instructorId, course_id: courseId }
        },
        data: updateData,
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              description: true,
              level: true
            }
          }
        }
      });

      return { success: true, data: updated };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to update course assignment' };
    }
  });
}
