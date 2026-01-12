// @ts-nocheck
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export default async function instructorsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET /api/instructors - list instructors (lightweight)
  fastify.get('/', async (request, reply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      const instructors = await prisma.instructor.findMany({
        where: { organizationId },

        select: {
          id: true,

          userId: true,

          bio: true,

          isActive: true,

          specializations: true,
          certifications: true,
          martialArts: true,

          hourlyRate: true,
          preferredUnits: true,
          experience: true,
          availability: true,
          maxStudentsPerClass: true,
          createdAt: true,

          updatedAt: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },

        orderBy: { createdAt: 'desc' },
      });

      // Map to friendly shape
      const data = instructors.map((i) => ({
        id: i.id,
        name: `${i.user.firstName} ${i.user.lastName}`.trim(),
        email: i.user.email,
        userId: i.userId,
        isActive: i.isActive,
        bio: i.bio,
        specializations: i.specializations,
        certifications: i.certifications,
        martialArts: i.martialArts,
        hourlyRate: i.hourlyRate ? Number(i.hourlyRate) : null,
        preferredUnits: i.preferredUnits,
        experience: i.experience,
        availability: i.availability,
        maxStudentsPerClass: i.maxStudentsPerClass,
        phone: i.user.phone,
      }));

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
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }
      const instructor = await prisma.instructor.findFirst({
        where: { id, organizationId },
        include: { user: true },
      });
      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }
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
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }
      if (payload.organizationId && payload.organizationId !== organizationId) {
        reply.code(403);
        return { success: false, error: 'Access denied to this organization' };
      }

      console.log('Using organizationId:', organizationId);

      // Split name into firstName and lastName
      const nameParts = payload.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if user already exists (using findFirst since no unique index on organizationId + email)
      let user = await prisma.user.findFirst({
        where: {
          organizationId,
          email: payload.email,
        },
        include: {
          instructor: true, // Check if already has instructor profile
        },
      });

      console.log('User found:', user ? 'YES' : 'NO');
      if (user) {
        console.log('User has instructor:', user.instructor ? 'YES' : 'NO');

        // Check if user already has an instructor profile
        if (user.instructor) {
          reply.code(400);
          return { success: false, error: 'This user already has an instructor profile' };
        }
      }

      if (!user) {
        console.log('Creating new user...');
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
            isActive: true,
          },
        });
        console.log('User created:', user.id);
      }

      // Create instructor
      const instructorData: any = {
        userId: user.id,
        organizationId,
        bio: payload.bio || null,
        specializations: payload.specializations || payload.specialties || [],
        martialArts: payload.martialArts || (payload.belt ? [payload.belt] : []),
        experience: payload.experience || null,
        certifications: payload.certifications || [],
        hireDate: payload.hireDate ? new Date(payload.hireDate) : new Date(),
        maxStudentsPerClass: payload.maxStudentsPerClass || 20,
        preferredUnits: payload.preferredUnits || [],
        isActive: true,
      };

      // Add hourlyRate only if provided (it's optional Decimal field)
      if (payload.hourlyRate || payload.salary) {
        instructorData.hourlyRate = payload.hourlyRate || payload.salary;
      }

      // Add availability only if provided (it's JSON field)
      if (payload.availability) {
        instructorData.availability = payload.availability;
      }

      console.log('Creating instructor with data:', instructorData);

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
              birthDate: true,
            },
          },
        },
      });

      console.log('Instructor created:', instructor.id);

      // Transform to frontend format
      const result = {
        id: instructor.id,
        name: `${instructor.user.firstName} ${instructor.user.lastName}`,
        email: instructor.user.email,
        phone: instructor.user.phone,
        document: instructor.user.cpf,
        birthDate: instructor.user.birthDate,
        specializations: instructor.specializations,
        experience: instructor.experience,
        certifications: instructor.certifications,
        bio: instructor.bio,
        hireDate: instructor.hireDate,
        hourlyRate: instructor.hourlyRate,
        maxStudentsPerClass: instructor.maxStudentsPerClass,
        preferredUnits: instructor.preferredUnits,
        availability: instructor.availability,
        martialArts: instructor.martialArts,
        isActive: instructor.isActive,
        userId: instructor.userId,
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('=== ERROR CREATING INSTRUCTOR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.code) console.error('Error code:', error.code);
      if (error.meta) console.error('Error meta:', error.meta);

      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to create instructor',
        details: error.message, // Add error details for debugging
      };
    }
  });

  // PUT /api/instructors/:id - update instructor
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const payload = request.body as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) {
        return;
      }

      console.log('=== PUT INSTRUCTOR DEBUG ===');
      console.log('ID:', id);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Find existing instructor
      const existingInstructor = await prisma.instructor.findFirst({
        where: { id, organizationId },
        include: {
          user: {
            select: {
              id: true,
              organizationId: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              cpf: true,
              birthDate: true,
            },
          },
        },
      });

      if (!existingInstructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      console.log('Existing instructor email:', existingInstructor.user.email);
      console.log('New email from payload:', payload.email);

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
      if (payload.birthDate !== undefined)
        userUpdateData.birthDate = payload.birthDate ? new Date(payload.birthDate) : null;

      // Check for email uniqueness if email is being updated
      if (payload.email) {
        console.log('=== EMAIL UPDATE DEBUG ===');
        console.log('Current email:', existingInstructor.user.email);
        console.log('New email:', payload.email);
        console.log('User ID:', existingInstructor.userId);
        console.log('Organization ID:', existingInstructor.user.organizationId);
        console.log('Email comparison:', payload.email !== existingInstructor.user.email);

        // Only check for duplicates if email is actually different
        if (
          payload.email.toLowerCase().trim() !== existingInstructor.user.email.toLowerCase().trim()
        ) {
          console.log('📧 Checking for email duplicates...');

          const existingUserWithEmail = await prisma.user.findFirst({
            where: {
              email: payload.email.toLowerCase().trim(),
              organizationId: existingInstructor.user.organizationId,
              id: { not: existingInstructor.userId }, // Exclude current user
            },
          });

          console.log(
            'Existing user with email:',
            existingUserWithEmail
              ? {
                id: existingUserWithEmail.id,
                email: existingUserWithEmail.email,
                firstName: existingUserWithEmail.firstName,
                lastName: existingUserWithEmail.lastName,
              }
              : null
          );

          if (existingUserWithEmail) {
            console.log('❌ Email conflict detected!');
            reply.code(400);
            return {
              success: false,
              error: `Este email já está sendo usado por ${existingUserWithEmail.firstName} ${existingUserWithEmail.lastName}`,
            };
          }
          console.log('✅ Email is unique, proceeding...');
        } else {
          console.log('📧 Email unchanged, skipping duplicate check');
        }
      } else {
        console.log('=== NO EMAIL IN PAYLOAD ===');
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: existingInstructor.userId },
          data: userUpdateData,
        });
      }

      // Update instructor data
      const instructorUpdateData: any = {};
      if (payload.bio !== undefined) instructorUpdateData.bio = payload.bio;
      if (payload.specializations !== undefined)
        instructorUpdateData.specializations = payload.specializations;
      if (payload.experience !== undefined) instructorUpdateData.experience = payload.experience;
      if (payload.certifications !== undefined)
        instructorUpdateData.certifications = payload.certifications;
      if (payload.hireDate !== undefined)
        instructorUpdateData.hireDate = payload.hireDate ? new Date(payload.hireDate) : null;
      if (payload.hourlyRate !== undefined) instructorUpdateData.hourlyRate = payload.hourlyRate;
      if (payload.maxStudentsPerClass !== undefined)
        instructorUpdateData.maxStudentsPerClass = payload.maxStudentsPerClass;
      if (payload.preferredUnits !== undefined)
        instructorUpdateData.preferredUnits = payload.preferredUnits;
      if (payload.availability !== undefined)
        instructorUpdateData.availability = payload.availability;
      if (payload.martialArts !== undefined) instructorUpdateData.martialArts = payload.martialArts;
      if (payload.isActive !== undefined) instructorUpdateData.isActive = payload.isActive;

      let updatedInstructor = existingInstructor;
      if (Object.keys(instructorUpdateData).length > 0) {
        updatedInstructor = (await prisma.instructor.update({
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
                birthDate: true,
              },
            },
          },
        })) as any;
      }

      // Transform to frontend format
      const result = {
        id: (updatedInstructor as any).id,
        name: `${(updatedInstructor as any).user.firstName} ${(updatedInstructor as any).user.lastName}`,
        email: (updatedInstructor as any).user.email,
        phone: (updatedInstructor as any).user.phone,
        document: (updatedInstructor as any).user.cpf,
        birthDate: (updatedInstructor as any).user.birthDate,
        specializations: (updatedInstructor as any).specializations,
        experience: (updatedInstructor as any).experience,
        certifications: (updatedInstructor as any).certifications,
        bio: (updatedInstructor as any).bio,
        hireDate: (updatedInstructor as any).hireDate,
        hourlyRate: (updatedInstructor as any).hourlyRate,
        maxStudentsPerClass: (updatedInstructor as any).maxStudentsPerClass,
        preferredUnits: (updatedInstructor as any).preferredUnits,
        availability: (updatedInstructor as any).availability,
        martialArts: (updatedInstructor as any).martialArts,
        isActive: (updatedInstructor as any).isActive,
        userId: (updatedInstructor as any).userId,
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
        select: { userId: true },
      });

      if (!instructor) {
        reply.code(404);
        return { success: false, error: 'Instructor not found' };
      }

      // Delete instructor (this will cascade to user if configured, but let's be safe)
      await prisma.instructor.delete({
        where: { id },
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
  // --- INSTRUCTOR FACING ROUTES ---

  // GET /api/instructors/me/classes - Get current instructor's classes
  fastify.get('/me/classes', async (request, reply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      const user = (request as any).user;

      if (!organizationId || !user) return;

      // 1. Find the instructor profile for the logged user
      const instructor = await prisma.instructor.findFirst({
        where: { userId: user.id, organizationId }
      });

      if (!instructor) {
        return reply.code(403).send({
          success: false,
          message: 'Usuário não é um instrutor'
        });
      }

      // 2. Get classes (default to today if no date provided)
      const { date } = request.query as any;

      let dateFilter: any = {};

      if (date) {
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        dateFilter = {
          gte: startOfDay,
          lte: endOfDay
        };
      } else {
        // Default: Today
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        dateFilter = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      const classes = await prisma.class.findMany({
        where: {
          organizationId,
          instructorId: instructor.id,
          date: dateFilter
        },
        include: {
          course: { select: { name: true } },
          trainingArea: { select: { name: true } },
          unit: { select: { name: true } },
          _count: {
            select: { attendances: true } // Count check-ins
          }
        },
        orderBy: { startTime: 'asc' }
      });

      return {
        success: true,
        data: classes.map(c => ({
          id: c.id,
          title: c.title || c.course.name,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.trainingArea?.name || c.unit?.name || c.location,
          status: c.status,
          enrolledCount: c.actualStudents, // Pre-calculated or need to count?
          checkInCount: c._count.attendances
        }))
      };

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false, message: 'Erro ao buscar aulas' });
    }
  });

  // GET /api/instructors/classes/:id - Get class details & students
  fastify.get('/classes/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;

      const classData = await prisma.class.findUnique({
        where: { id },
        include: {
          course: true,
          lessonPlan: true,
          attendances: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
                }
              }
            }
          }
        }
      });

      if (!classData) return reply.code(404).send({ success: false });

      // Check if user is the instructor (optional security check)

      // We need list of "Expected Students" vs "Checked-in Students".
      // Usually classes have "CourseEnrollment" (fixed students) or "ClassBooking" (registrations).
      // Assuming CourseEnrollment for fixed classes.

      let expectedStudents: any[] = [];

      if (classData.courseId) {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: {
            courseId: classData.courseId,
            status: 'ACTIVE',
            // organizationId // Schema check needed
          },
          include: {
            student: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
              }
            }
          }
        });
        expectedStudents = enrollments.map(e => e.student);
      }

      // Merge Attendance status
      const studentList = expectedStudents.map(student => {
        const attendance = classData.attendances.find(a => a.studentId === student.id);
        return {
          studentId: student.id,
          userId: student.userId,
          name: `${student.user.firstName} ${student.user.lastName}`,
          avatarUrl: student.user.avatarUrl,
          checkedIn: !!attendance,
          attendanceId: attendance?.id
        };
      });

      return {
        success: true,
        data: {
          class: {
            id: classData.id,
            title: classData.title || classData.course.name,
            date: classData.date,
            startTime: classData.startTime,
            endTime: classData.endTime,
            lessonPlan: classData.lessonPlan
          },
          students: studentList
        }
      };

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false });
    }
  });

  // POST /api/instructors/classes/:id/check-in - Toggle Check-in
  fastify.post('/classes/:id/check-in', async (request, reply) => {
    try {
      const { id } = request.params as any; // Class ID
      const { studentId, status } = request.body as any; // status: PRESENT, ABSENT (or boolean)
      const organizationId = requireOrganizationId(request as any, reply as any) as string;

      // Check if attendance exists
      const existing = await prisma.attendance.findFirst({
        where: {
          classId: id,
          studentId: studentId
        }
      });

      if (existing) {
        if (status === false || status === 'ABSENT') {
          // Remove check-in
          await prisma.attendance.delete({ where: { id: existing.id } });
        }
      } else {
        if (status === true || status === 'PRESENT') {
          // Create check-in
          await prisma.attendance.create({
            data: {
              classId: id,
              studentId: studentId,
              organizationId,
              date: new Date(),
              status: 'PRESENT'
            }
          });
        }
      }

      return { success: true };

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false });
    }
  });
}
