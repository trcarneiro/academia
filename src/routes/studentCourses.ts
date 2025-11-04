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
     * RETORNA: { enrolledCourses: [], availableCourses: [] }
     */
    fastify.get('/:studentId/courses', {
        schema: {
            description: 'Buscar cursos matriculados e disponíveis do estudante',
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
                            type: 'object',
                            properties: {
                                enrolledCourses: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            courseId: { type: 'string' },
                                            startDate: { type: 'string', format: 'date-time' },
                                            status: { type: 'string' },
                                            enrolledAt: { type: 'string', format: 'date-time' },
                                            course: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    name: { type: 'string' },
                                                    description: { type: 'string' },
                                                    category: { type: 'string' },
                                                    durationTotalWeeks: { type: 'number' },
                                                    totalLessons: { type: 'number' },
                                                    difficulty: { type: 'string' }
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
                                },
                                availableCourses: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            name: { type: 'string' },
                                            description: { type: 'string' },
                                            category: { type: 'string' },
                                            durationTotalWeeks: { type: 'number' },
                                            totalLessons: { type: 'number' },
                                            difficulty: { type: 'string' }
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
     * Matricular estudante em um curso (manual enrollment)
     * POST /api/students/:studentId/courses
     */
    fastify.post('/:studentId/courses', {
        schema: {
            description: 'Matricular estudante em um curso específico',
            tags: ['Student Courses'],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string', format: 'uuid' }
                },
                required: ['studentId']
            },
            body: {
                type: 'object',
                properties: {
                    courseId: { type: 'string' },
                    status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED'] },
                    enrolledAt: { type: 'string', format: 'date-time' }
                },
                required: ['courseId']
            },
            headers: {
                type: 'object',
                properties: {
                    'x-organization-id': { type: 'string', format: 'uuid' }
                },
                required: ['x-organization-id']
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                studentId: { type: 'string' },
                                courseId: { type: 'string' },
                                status: { type: 'string' },
                                enrolledAt: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: StudentCourseController.enrollStudentInCourse
    });

    /**
     * Atualizar status da matrícula (ex: encerrar matrícula)
     * PATCH /api/students/:studentId/courses/:enrollmentId
     */
    fastify.patch('/:studentId/courses/:enrollmentId', {
        schema: {
            description: 'Atualizar status de matrícula existente',
            tags: ['Student Courses'],
            params: {
                type: 'object',
                properties: {
                    studentId: { type: 'string', format: 'uuid' },
                    enrollmentId: { type: 'string', format: 'uuid' }
                },
                required: ['studentId', 'enrollmentId']
            },
            body: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED'] },
                    endDate: { type: 'string', format: 'date-time' }
                },
                required: ['status']
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
                                id: { type: 'string' },
                                status: { type: 'string' },
                                endDate: { type: 'string' }
                            }
                        }
                    }
                }
            }
        },
        handler: StudentCourseController.updateEnrollmentStatus
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
