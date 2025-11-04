import { FastifyRequest, FastifyReply } from 'fastify';
import StudentCourseService from '@/services/studentCourseService';
import { ResponseHelper } from '@/utils/response';

export interface ActivateCoursesParams {
    studentId: string;
}

export interface DeactivateCourseParams {
    studentId: string;
    courseId: string;
}

export interface EnrollCourseParams {
    studentId: string;
}

export interface EnrollCourseBody {
    courseId: string;
    status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
    enrolledAt?: string;
}

export interface UpdateEnrollmentParams {
    studentId: string;
    enrollmentId: string;
}

export interface UpdateEnrollmentBody {
    status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
    endDate?: string;
}

export class StudentCourseController {
    
    /**
     * Ativar cursos baseado nas subscriptions ativas do estudante
     */
    static async activateStudentCourses(
        request: FastifyRequest<{ Params: ActivateCoursesParams }>,
        reply: FastifyReply
    ) {
        try {
            const { studentId } = request.params;
            const organizationId = request.headers['x-organization-id'] as string;

            if (!organizationId) {
                return ResponseHelper.error(reply, 'Organization ID é obrigatório', 400);
            }

            const result = await StudentCourseService.activateStudentCourses(studentId, organizationId);
            
            return ResponseHelper.success(reply, result.data, result.message);

        } catch (error) {
            console.error('Error in activateStudentCourses controller:', error);
            return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
        }
    }

    /**
     * Buscar cursos ativos de um estudante
     */
    static async getStudentActiveCourses(
        request: FastifyRequest<{ Params: ActivateCoursesParams }>,
        reply: FastifyReply
    ) {
        try {
            const { studentId } = request.params;
            console.log('🎯 [Controller] Getting active courses for student:', studentId);

            const courses = await StudentCourseService.getStudentActiveCourses(studentId);
            
            console.log('📚 [Controller] Courses returned from service:', courses.length, 'courses');
            
            return ResponseHelper.success(reply, courses, 'Cursos ativos carregados com sucesso');

        } catch (error) {
            console.error('Error in getStudentActiveCourses controller:', error);
            return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
        }
    }

    /**
     * Desativar curso de um estudante
     */
    static async deactivateStudentCourse(
        request: FastifyRequest<{ Params: DeactivateCourseParams }>,
        reply: FastifyReply
    ) {
        try {
            const { studentId, courseId } = request.params;

            const result = await StudentCourseService.deactivateStudentCourse(studentId, courseId);
            
            return ResponseHelper.success(reply, result.data, result.message);

        } catch (error) {
            console.error('Error in deactivateStudentCourse controller:', error);
            return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
        }
    }

    /**
     * Matricular estudante em um curso (manual enrollment)
     */
    static async enrollStudentInCourse(
        request: FastifyRequest<{ Params: EnrollCourseParams; Body: EnrollCourseBody }>,
        reply: FastifyReply
    ) {
        try {
            const { studentId } = request.params;
            const { courseId, status, enrolledAt } = request.body;
            const organizationId = request.headers['x-organization-id'] as string;

            console.log('📝 [Controller] Enrolling student in course:', { studentId, courseId, status });

            if (!organizationId) {
                return ResponseHelper.error(reply, 'Organization ID é obrigatório', 400);
            }

            const result = await StudentCourseService.enrollStudentInCourse(
                studentId,
                courseId,
                organizationId,
                {
                    status: status || 'ACTIVE',
                    enrolledAt: enrolledAt ? new Date(enrolledAt) : new Date()
                }
            );

            return reply.code(201).send({
                success: true,
                message: 'Aluno matriculado com sucesso',
                data: result
            });

        } catch (error) {
            console.error('Error in enrollStudentInCourse controller:', error);
            return ResponseHelper.error(reply, 'Erro ao matricular aluno no curso', 500);
        }
    }

    /**
     * Atualizar status de matrícula (ex: encerrar matrícula)
     */
    static async updateEnrollmentStatus(
        request: FastifyRequest<{ Params: UpdateEnrollmentParams; Body: UpdateEnrollmentBody }>,
        reply: FastifyReply
    ) {
        try {
            const { enrollmentId } = request.params;
            const { status, endDate } = request.body;

            console.log('🔄 [Controller] Updating enrollment status:', { enrollmentId, status, endDate });

            const result = await StudentCourseService.updateEnrollmentStatus(
                enrollmentId,
                {
                    status,
                    endDate: endDate ? new Date(endDate) : undefined
                }
            );

            return ResponseHelper.success(reply, result, 'Status da matrícula atualizado com sucesso');

        } catch (error) {
            console.error('Error in updateEnrollmentStatus controller:', error);
            return ResponseHelper.error(reply, 'Erro ao atualizar status da matrícula', 500);
        }
    }
}

export default StudentCourseController;
