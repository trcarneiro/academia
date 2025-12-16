import { FastifyRequest, FastifyReply } from 'fastify';
import { TurmasService, CreateTurmaData, MarkAttendanceData } from '@/services/turmasService';
import { ResponseHelper } from '@/utils/response';
import { z } from 'zod';

const CreateTurmaSchema = z.object({
  name: z.string().min(1),
  courseId: z.string().min(1).optional(), // Accept any string (UUID or custom ID like "krav-maga-faixa-branca-2025")
  courseIds: z.array(z.string().min(1)).optional(), // Accept any string IDs
  type: z.enum(['COLLECTIVE', 'PRIVATE', 'SEMI_PRIVATE']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  maxStudents: z.number().int().positive().optional(),
  instructorId: z.string().uuid(),
  organizationId: z.string().uuid(),
  unitId: z.string().uuid(),
  trainingAreaId: z.string().uuid().optional(),
  room: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  description: z.string().optional(),
  schedule: z.object({
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    time: z.string(),
    duration: z.number().int().positive()
  }),
  requireAttendanceForProgress: z.boolean().optional()
}).refine(data => data.courseId || (data.courseIds && data.courseIds.length > 0), {
  message: "Either courseId or courseIds must be provided",
  path: ["courseIds"]
});

const UpdateTurmaSchema = z.object({
  name: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(), // Accept any string
  courseIds: z.array(z.string().min(1)).optional(), // Accept any string IDs
  type: z.enum(['COLLECTIVE', 'PRIVATE', 'SEMI_PRIVATE']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
  maxStudents: z.number().int().positive().optional(),
  instructorId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  trainingAreaId: z.string().uuid().optional(),
  room: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  description: z.string().optional(),
  schedule: z.object({
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    time: z.string(),
    duration: z.number().int().positive()
  }).optional(),
  requireAttendanceForProgress: z.boolean().optional()
});

const MarkAttendanceSchema = z.object({
  lessonId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
});

export class TurmasController {
  private turmasService: TurmasService;

  constructor() {
    this.turmasService = new TurmasService();
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { organizationId, unitId, status, type, isActive } = request.query as any;
      
      const turmas = await this.turmasService.list({
        organizationId,
        unitId,
        status,
        type,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });

      return ResponseHelper.success(reply, turmas);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar turmas', 500);
    }
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      console.log('[TurmasController] Get request for ID:', id);
      
      const turma = await this.turmasService.getById(id);
      
      console.log('[TurmasController] Turma found:', !!turma);
      
      if (!turma) {
        return ResponseHelper.notFound(reply, 'Turma não encontrada');
      }

      return ResponseHelper.success(reply, turma);
    } catch (error) {
      console.error('[TurmasController] Get error:', error);
      return ResponseHelper.error(reply, 'Erro ao buscar turma', 500);
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('[TurmasController] Create request body:', JSON.stringify(request.body, null, 2));
      
      const validatedData = CreateTurmaSchema.parse(request.body);
      console.log('[TurmasController] Validation passed, validated data:', JSON.stringify(validatedData, null, 2));
      
      // Convert Instructor.id to User.id if needed
      if (validatedData.instructorId) {
        const instructor = await this.turmasService.getInstructorUserId(validatedData.instructorId);
        if (!instructor) {
          console.error('[TurmasController] Instructor not found:', validatedData.instructorId);
          return ResponseHelper.badRequest(reply, 'Instrutor não encontrado');
        }
        console.log('[TurmasController] Converting Instructor.id to User.id:', instructor.userId);
        validatedData.instructorId = instructor.userId;
      }
      
      const turma = await this.turmasService.create(validatedData as CreateTurmaData);
      if (!turma) {
        console.error('[TurmasController] Service returned null on create');
        return ResponseHelper.error(reply, 'Erro ao criar turma', 500);
      }
      console.log('[TurmasController] Turma created successfully:', turma.id);
      return ResponseHelper.created(reply, turma);
    } catch (error) {
      console.error('[TurmasController] Create error:', error);
      
      if (error instanceof z.ZodError) {
        console.error('[TurmasController] Validation errors:', error.errors);
        return ResponseHelper.badRequest(reply, 'Dados inválidos', error.errors);
      }
      
      return ResponseHelper.error(reply, 'Erro ao criar turma', 500);
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      console.log('[TurmasController] Update request for ID:', id);
      console.log('[TurmasController] Update request body:', JSON.stringify(request.body, null, 2));
      
      console.log('[TurmasController] Starting validation with UpdateTurmaSchema...');
      const validatedData = UpdateTurmaSchema.parse(request.body);
      console.log('[TurmasController] Validation passed, validated data:', JSON.stringify(validatedData, null, 2));
      
      // Convert Instructor.id to User.id if needed (same as create)
      if (validatedData.instructorId) {
        const instructor = await this.turmasService.getInstructorUserId(validatedData.instructorId);
        if (!instructor) {
          console.error('[TurmasController] Instructor not found:', validatedData.instructorId);
          return ResponseHelper.badRequest(reply, 'Instrutor não encontrado');
        }
        console.log('[TurmasController] Converting Instructor.id to User.id:', instructor.userId);
        validatedData.instructorId = instructor.userId;
      }
      
      console.log('[TurmasController] Calling turmasService.update...');
      const turma = await this.turmasService.update(id, validatedData as any);
      console.log('[TurmasController] Service update completed successfully');
      
      if (!turma) {
        console.log('[TurmasController] No turma returned from service');
        return ResponseHelper.notFound(reply, 'Turma não encontrada');
      }

      console.log('[TurmasController] Returning success response');
      return ResponseHelper.success(reply, turma);
    } catch (error) {
      console.error('[TurmasController] Update error:', error);
      if (error instanceof Error) {
        console.error('[TurmasController] Error stack:', error.stack);
      }
      
      if (error instanceof z.ZodError) {
        console.error('[TurmasController] Validation errors:', error.errors);
        return ResponseHelper.badRequest(reply, 'Dados inválidos', error.errors);
      }
      // Map Prisma FK errors to 400 with a helpful message
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2003') {
        const prismaError = error as any;
        const field = prismaError?.meta?.field_name || 'referência';
        return ResponseHelper.badRequest(reply, `Referência inválida: ${field}`);
      }
      return ResponseHelper.error(reply, 'Erro ao atualizar turma', 500);
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const success = await this.turmasService.delete(id);
      
      if (!success) {
        return ResponseHelper.notFound(reply, 'Turma não encontrada');
      }

      return ResponseHelper.success(reply, { message: 'Turma removida com sucesso' });
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao remover turma', 500);
    }
  }

  async generateSchedule(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const schedule = await this.turmasService.generateSchedule(id);
      
      return ResponseHelper.success(reply, schedule);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao gerar cronograma', 500);
    }
  }

  async getLessons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.query as any;
      
      const lessons = await this.turmasService.getLessons(id, { status });
      
      return ResponseHelper.success(reply, lessons);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar aulas', 500);
    }
  }

  async updateLessonStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
  const { lessonId } = request.params as { id: string; lessonId: string };
      const { status } = request.body as { status: string };
      
      const lesson = await this.turmasService.updateLessonStatus(lessonId, status);
      
      return ResponseHelper.success(reply, lesson);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao atualizar status da aula', 500);
    }
  }

  async getStudents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const students = await this.turmasService.getStudents(id);
      
      return ResponseHelper.success(reply, students);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar alunos', 500);
    }
  }

  async addStudent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { studentId } = request.body as { studentId: string };
      
      const turmaStudent = await this.turmasService.addStudent(id, studentId);
      
      return ResponseHelper.created(reply, turmaStudent);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao adicionar aluno', 500);
    }
  }

  async removeStudent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, studentId } = request.params as { id: string; studentId: string };
      
      const success = await this.turmasService.removeStudent(id, studentId);
      
      if (!success) {
        return ResponseHelper.notFound(reply, 'Aluno não encontrado na turma');
      }

      return ResponseHelper.success(reply, { message: 'Aluno removido da turma' });
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao remover aluno', 500);
    }
  }

  async getAttendance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { lessonId, studentId, startDate, endDate } = request.query as any;
      
      const attendance = await this.turmasService.getAttendance(id, {
        lessonId,
        studentId,
        startDate,
        endDate
      });
      
      return ResponseHelper.success(reply, attendance);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar frequência', 500);
    }
  }

  async markAttendance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const validatedData = MarkAttendanceSchema.parse(request.body);
      
      const attendance = await this.turmasService.markAttendance(id, validatedData as MarkAttendanceData);
      
      return ResponseHelper.success(reply, attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ResponseHelper.badRequest(reply, 'Dados inválidos', error.errors);
      }
      return ResponseHelper.error(reply, 'Erro ao marcar frequência', 500);
    }
  }

  async getReports(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { type, startDate, endDate } = request.query as any;
      
      const reports = await this.turmasService.getReports(id, {
        type,
        startDate,
        endDate
      });
      
      return ResponseHelper.success(reply, reports);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao gerar relatórios', 500);
    }
  }

  async search(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { q, filters } = request.query as any;
      
      const turmas = await this.turmasService.search(q, filters);
      
      return ResponseHelper.success(reply, turmas);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao pesquisar turmas', 500);
    }
  }

  async getByInstructor(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { instructorId } = request.params as { instructorId: string };
      const { status } = request.query as any;
      
      const turmas = await this.turmasService.getByInstructor(instructorId, { status });
      
      return ResponseHelper.success(reply, turmas);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar turmas do instrutor', 500);
    }
  }

  // ===== Operações administrativas =====
  async clearAllEndDates(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.turmasService.clearAllEndDates();
      return ResponseHelper.success(reply, { updated: result.count }, 'Datas de término removidas de todas as turmas');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao limpar datas de término', 500);
    }
  }

  // ===== Gestão de Cursos da Turma =====

  async getTurmaCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const courses = await this.turmasService.getTurmaCourses(id);
      return ResponseHelper.success(reply, courses);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar cursos da turma', 500);
    }
  }

  async addCourseToTurma(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { courseId } = request.body as { courseId: string };

      console.log(`[TurmasController] addCourseToTurma - turmaId: ${id}, courseId: ${courseId}`);
      
      const result = await this.turmasService.addCourseToTurma(id, courseId);
      return ResponseHelper.created(reply, result);
    } catch (error) {
      console.error('[TurmasController] Erro ao adicionar curso:', error);
      
      // Retornar mensagem específica se for erro conhecido
      if (error instanceof Error) {
        if (error.message === 'Curso já está associado à turma') {
          return ResponseHelper.error(reply, error.message, 409); // Conflict
        }
        if (error.message === 'Turma não encontrada' || error.message === 'Curso não encontrado') {
          return ResponseHelper.error(reply, error.message, 404);
        }
        return ResponseHelper.error(reply, error.message, 500);
      }
      
      return ResponseHelper.error(reply, 'Erro ao adicionar curso à turma', 500);
    }
  }

  async removeCourseFromTurma(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, courseId } = request.params as { id: string; courseId: string };

      await this.turmasService.removeCourseFromTurma(id, courseId);
      return ResponseHelper.success(reply, null, 'Curso removido da turma');
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao remover curso da turma', 500);
    }
  }

  async registerInterest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { studentId } = request.body as { studentId: string };

      if (!studentId) {
        return ResponseHelper.badRequest(reply, 'Student ID is required');
      }

      const interest = await this.turmasService.registerInterest(id, studentId);
      return ResponseHelper.success(reply, interest);
    } catch (error) {
      return ResponseHelper.error(reply, 'Error registering interest', 500);
    }
  }

  async removeInterest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, studentId } = request.params as { id: string, studentId: string };
      
      await this.turmasService.removeInterest(id, studentId);
      return ResponseHelper.success(reply, { success: true });
    } catch (error) {
      return ResponseHelper.error(reply, 'Error removing interest', 500);
    }
  }
}
