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
            
            console.log('📚 [Controller] Courses returned from service:', courses.enrolledCourses.length, 'enrolled courses');
            
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
}

export default StudentCourseController;
