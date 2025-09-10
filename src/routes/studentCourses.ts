import { FastifyInstance } from 'fastify';
import StudentCourseController from '@/controllers/studentCourseController';

export async function studentCoursesRoutes(fastify: FastifyInstance) {
    // Prefixo para todas as rotas: /api/students/:studentId/courses
    
    /**
     * Ativar cursos baseado nas subscriptions ativas do estudante
     * POST /api/students/:studentId/courses/activate
     */
    fastify.post('/:studentId/courses/activate', {
        schema: {
            description: 'Ativar cursos baseado nas subscriptions ativas do estudante',
            tags: ['Student Courses'],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string', format: 'uuid' }
                },
                required: ['studentId']
            },
            headers: {
                type: 'object',
                properties: {
                    'x-organization-id': { type: 'string', format: 'uuid' }
                },
                required: ['x-organization-id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                subscriptionsProcessed: { type: 'number' },
                                coursesActivated: { type: 'array' },
                                totalActiveCourses: { type: 'number' },
                                allActiveCourses: { type: 'array' }
                            }
                        }
                    }
                }
            }
        },
        handler: StudentCourseController.activateStudentCourses
    });

    /**
     * Buscar cursos ativos de um estudante
     * GET /api/students/:studentId/courses
     */
    fastify.get('/:studentId/courses', {
        schema: {
            description: 'Buscar cursos ativos de um estudante',
            tags: ['Student Courses'],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string', format: 'uuid' }
                },
                required: ['studentId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    startDate: { type: 'string', format: 'date-time' },
                                    status: { type: 'string' },
                                    course: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            name: { type: 'string' },
                                            description: { type: 'string' },
                                            category: { type: 'string' },
                                            duration: { type: 'number' }
                                        }
                                    },
                                    class: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            title: { type: 'string' },
                                            description: { type: 'string' },
                                            date: { type: 'string', format: 'date-time' },
                                            startTime: { type: 'string', format: 'date-time' },
                                            endTime: { type: 'string', format: 'date-time' },
                                            status: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: StudentCourseController.getStudentActiveCourses
    });

    /**
     * Desativar curso de um estudante
     * DELETE /api/students/:studentId/courses/:courseId
     */
    fastify.delete('/:studentId/courses/:courseId', {
        schema: {
            description: 'Desativar curso de um estudante',
            tags: ['Student Courses'],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string', format: 'uuid' },
                    courseId: { type: 'string', format: 'uuid' }
                },
                required: ['studentId', 'courseId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                updated: { type: 'number' }
                            }
                        }
                    }
                }
            }
        },
        handler: StudentCourseController.deactivateStudentCourse
    });
}

export default studentCoursesRoutes;
