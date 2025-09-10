import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';

export default async function instructorsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET /api/instructors - list instructors (lightweight)
  fastify.get('/', async (request, reply) => {
    try {
      const instructors = await prisma.instructor.findMany({
        select: {
          id: true,
          userId: true,
          bio: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Map to friendly shape
      const data = instructors.map(i => ({ id: i.id, name: `${i.user.firstName} ${i.user.lastName}`, email: i.user.email, userId: i.userId, isActive: i.isActive }));

      return { success: true, data };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch instructors' };
    }
  });

  // GET /api/instructors/:id - get instructor
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const instructor = await prisma.instructor.findUnique({
        where: { id },
        include: { user: true }
      });
      if (!instructor) { reply.code(404); return { success: false, error: 'Instructor not found' }; }
      return { success: true, data: instructor };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch instructor' };
    }
  });

  // POST /api/instructors - create instructor with user data
  fastify.post('/', async (request, reply) => {
    try {
      console.log('=== INSTRUCTOR POST REQUEST ===');
      console.log('Request body:', request.body);
      console.log('Headers:', request.headers);
      
      const payload = request.body as any;
      
      // Validate required fields
      if (!payload.name || !payload.email) {
        reply.code(400);
        return { success: false, error: 'Name and email are required' };
      }

      // Get or create organization
      let organizationId = payload.organizationId;
      if (!organizationId) {
        let organization = await prisma.organization.findFirst();
        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: 'Academia Krav Maga',
              slug: 'academia-krav-maga',
              country: 'Brazil',
              maxStudents: 100,
              maxStaff: 10,
              isActive: true
            }
          });
        }
        organizationId = organization.id;
      }

      // Split name into firstName and lastName
      const nameParts = payload.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { 
          organizationId_email: {
            organizationId,
            email: payload.email
          }
        }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email: payload.email,
            password: 'temp123456', // Default password - should be changed on first login
            phone: payload.phone || null,
            cpf: payload.document || null,
            birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
            organizationId,
            role: 'INSTRUCTOR',
            isActive: true
          }
        });
      }

      // Create instructor
      const instructorData: any = {
        userId: user.id,
        organizationId,
        bio: payload.bio || null,
        belt: payload.belt || null,
        specialties: payload.specialties || null,
        experience: payload.experience || null,
        certifications: payload.certifications || null,
        status: payload.status || 'ACTIVE',
        hireDate: payload.hireDate ? new Date(payload.hireDate) : null,
        salary: payload.salary || null,
        workload: payload.workload || null,
        canManageStudents: payload.canManageStudents || false,
        canManageClasses: payload.canManageClasses || false,
        isActive: true
      };

      const instructor = await prisma.instructor.create({
        data: instructorData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              cpf: true,
              birthDate: true
            }
          }
        }
      });

      // Transform to frontend format
      const result = {
        id: instructor.id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        email: instructor.user.email,
        phone: instructor.user.phone,
        document: instructor.user.cpf,
        birthDate: instructor.user.birthDate,
        belt: instructor.belt,
        specialties: instructor.specialties,
        experience: instructor.experience,
        certifications: instructor.certifications,
        bio: instructor.bio,
        status: instructor.status,
        hireDate: instructor.hireDate,
        salary: instructor.salary,
        workload: instructor.workload,
        canManageStudents: instructor.canManageStudents,
        canManageClasses: instructor.canManageClasses,
        isActive: instructor.isActive,
        userId: instructor.userId
      };

      return { success: true, data: result };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to create instructor' };
    }
  });

  // PUT /api/instructors/:id - update instructor
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const payload = request.body as any;

      // Find existing instructor
      const existingInstructor = await prisma.instructor.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingInstructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Split name into firstName and lastName if provided
      let firstName = existingInstructor.user.firstName;
      let lastName = existingInstructor.user.lastName;

      if (payload.name) {
        const nameParts = payload.name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Update user data
      const userUpdateData: any = {};
      if (payload.name) {
        userUpdateData.firstName = firstName;
        userUpdateData.lastName = lastName;
      }
      if (payload.email) userUpdateData.email = payload.email;
      if (payload.phone !== undefined) userUpdateData.phone = payload.phone;
      if (payload.document !== undefined) userUpdateData.cpf = payload.document;
      if (payload.birthDate !== undefined) userUpdateData.birthDate = payload.birthDate ? new Date(payload.birthDate) : null;

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: existingInstructor.userId },
          data: userUpdateData
        });
      }

      // Update instructor data
      const instructorUpdateData: any = {};
      if (payload.bio !== undefined) instructorUpdateData.bio = payload.bio;
      if (payload.belt !== undefined) instructorUpdateData.belt = payload.belt;
      if (payload.specialties !== undefined) instructorUpdateData.specialties = payload.specialties;
      if (payload.experience !== undefined) instructorUpdateData.experience = payload.experience;
      if (payload.certifications !== undefined) instructorUpdateData.certifications = payload.certifications;
      if (payload.status !== undefined) instructorUpdateData.status = payload.status;
      if (payload.hireDate !== undefined) instructorUpdateData.hireDate = payload.hireDate ? new Date(payload.hireDate) : null;
      if (payload.salary !== undefined) instructorUpdateData.salary = payload.salary;
      if (payload.workload !== undefined) instructorUpdateData.workload = payload.workload;
      if (payload.canManageStudents !== undefined) instructorUpdateData.canManageStudents = payload.canManageStudents;
      if (payload.canManageClasses !== undefined) instructorUpdateData.canManageClasses = payload.canManageClasses;
      if (payload.isActive !== undefined) instructorUpdateData.isActive = payload.isActive;

      let updatedInstructor = existingInstructor;
      if (Object.keys(instructorUpdateData).length > 0) {
        updatedInstructor = await prisma.instructor.update({
          where: { id },
          data: instructorUpdateData,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                cpf: true,
                birthDate: true
              }
            }
          }
        }) as any;
      }

      // Transform to frontend format
      const result = {
        id: (updatedInstructor as any).id,
        name: `${(updatedInstructor as any).user.firstName} ${(updatedInstructor as any).user.lastName}`,
        email: (updatedInstructor as any).user.email,
        phone: (updatedInstructor as any).user.phone,
        document: (updatedInstructor as any).user.cpf,
        birthDate: (updatedInstructor as any).user.birthDate,
        belt: (updatedInstructor as any).belt,
        specialties: (updatedInstructor as any).specialties,
        experience: (updatedInstructor as any).experience,
        certifications: (updatedInstructor as any).certifications,
        bio: (updatedInstructor as any).bio,
        status: (updatedInstructor as any).status,
        hireDate: (updatedInstructor as any).hireDate,
        salary: (updatedInstructor as any).salary,
        workload: (updatedInstructor as any).workload,
        canManageStudents: (updatedInstructor as any).canManageStudents,
        canManageClasses: (updatedInstructor as any).canManageClasses,
        isActive: (updatedInstructor as any).isActive,
        userId: (updatedInstructor as any).userId
      };

      return { success: true, data: result };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to update instructor' };
    }
  });

  // DELETE /api/instructors/:id - delete instructor
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;

      // Find instructor to get userId
      const instructor = await prisma.instructor.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Delete instructor (this will cascade to user if configured, but let's be safe)
      await prisma.instructor.delete({
        where: { id }
      });

      // Optionally deactivate the user instead of deleting
      // await prisma.user.update({
      //   where: { id: instructor.userId },
      //   data: { isActive: false }
      // });

      return { success: true, message: 'Instructor deleted successfully' };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to delete instructor' };
    }
  });
}
