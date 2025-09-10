import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CourseInfo {
    id: string;
    name: string;
    type: 'primary' | 'additional';
}

interface SubscriptionDetail {
    subscriptionId: string;
    planName: string;
    courses: CourseInfo[];
}

export class StudentCourseService {
    
    /**
     * Ativar cursos de um estudante baseado em suas subscriptions ativas
     */
    static async activateStudentCourses(studentId: string, organizationId: string) {
        try {
            // 1. Buscar todas as subscriptions ativas do estudante
            const activeSubscriptions = await prisma.studentSubscription.findMany({
                where: {
                    studentId,
                    organizationId,
                    status: 'ACTIVE',
                    isActive: true,
                    OR: [
                        { endDate: null }, // Sem data de fim (plano contínuo)
                        { endDate: { gte: new Date() } } // Ou não expirado
                    ]
                },
                include: {
                    plan: {
                        include: {
                            // Curso principal do plano
                            course: true,
                            // Cursos adicionais do plano (através da tabela pivot)
                            planCourses: {
                                include: {
                                    course: true
                                }
                            }
                        }
                    }
                }
            });

            if (activeSubscriptions.length === 0) {
                return {
                    success: true,
                    message: 'Nenhuma subscription ativa encontrada',
                    coursesActivated: []
                };
            }

            // 2. Coletar todos os cursos únicos dos planos ativos
            const coursesToActivate = new Set<string>();
            const subscriptionDetails: SubscriptionDetail[] = [];

            for (const subscription of activeSubscriptions) {
                const subDetail: SubscriptionDetail = {
                    subscriptionId: subscription.id,
                    planName: subscription.plan.name,
                    courses: []
                };

                // Curso principal do plano
                if (subscription.plan.course) {
                    coursesToActivate.add(subscription.plan.course.id);
                    subDetail.courses.push({
                        id: subscription.plan.course.id,
                        name: subscription.plan.course.name,
                        type: 'primary'
                    });
                }

                // Cursos adicionais do plano
                for (const planCourse of subscription.plan.planCourses) {
                    coursesToActivate.add(planCourse.course.id);
                    subDetail.courses.push({
                        id: planCourse.course.id,
                        name: planCourse.course.name,
                        type: 'additional'
                    });
                }

                subscriptionDetails.push(subDetail);
            }

            // 3. Verificar quais cursos já estão ativos para este aluno
            const existingStudentCourses = await prisma.studentCourse.findMany({
                where: {
                    studentId,
                    courseId: { in: Array.from(coursesToActivate) },
                    status: 'ACTIVE'
                }
            });

            const existingCourseIds = new Set(
                existingStudentCourses.map(sc => sc.courseId)
            );

            // 4. Buscar classes disponíveis para cada curso que não está ativo
            const newCoursesToActivate = Array.from(coursesToActivate).filter(
                courseId => !existingCourseIds.has(courseId)
            );

            const activatedCourses = [];

            if (newCoursesToActivate.length > 0) {
                // Para cada curso, buscar uma classe ativa
                for (const courseId of newCoursesToActivate) {
                    const availableClass = await prisma.class.findFirst({
                        where: {
                            courseId,
                            organizationId,
                            status: 'SCHEDULED'
                        }
                    });

                    if (availableClass) {
                        // Criar a relação StudentCourse
                        const studentCourse = await prisma.studentCourse.create({
                            data: {
                                studentId,
                                courseId,
                                classId: availableClass.id,
                                status: 'ACTIVE',
                                startDate: new Date()
                            },
                            include: {
                                course: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true
                                    }
                                }
                            }
                        });

                        activatedCourses.push(studentCourse.course);
                    }
                }
            }

            // 5. Buscar todos os cursos ativos do aluno
            const allActiveCourses = await prisma.studentCourse.findMany({
                where: {
                    studentId,
                    status: 'ACTIVE'
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true
                        }
                    }
                }
            });

            return {
                success: true,
                message: `${activatedCourses.length} cursos ativados com sucesso`,
                data: {
                    subscriptionsProcessed: activeSubscriptions.length,
                    subscriptionDetails,
                    coursesActivated: activatedCourses,
                    totalActiveCourses: allActiveCourses.length,
                    allActiveCourses: allActiveCourses.map(sc => sc.course)
                }
            };

        } catch (error) {
            console.error('Error activating student courses:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Erro ao ativar cursos do estudante: ${errorMessage}`);
        }
    }

    /**
     * Buscar cursos ativos de um estudante
     */
    static async getStudentActiveCourses(studentId: string) {
        try {
            console.log('🔍 [Service] Getting active courses for student:', studentId);
            
            const studentCourses = await prisma.studentCourse.findMany({
                where: {
                    studentId,
                    status: 'ACTIVE'
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            duration: true
                        }
                    },
                    class: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            date: true,
                            startTime: true,
                            endTime: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'desc'
                }
            });

            console.log('📚 [Service] Raw data from DB:', JSON.stringify(studentCourses[0], null, 2));

            const mappedData = studentCourses.map(sc => ({
                id: sc.id,
                startDate: sc.startDate,
                status: sc.status,
                course: sc.course,
                class: sc.class
            }));

            console.log('📊 [Service] Mapped data:', JSON.stringify(mappedData[0], null, 2));

            return mappedData;

        } catch (error) {
            console.error('Error fetching student courses:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Erro ao buscar cursos do estudante: ${errorMessage}`);
        }
    }

    /**
     * Desativar curso de um estudante
     */
    static async deactivateStudentCourse(studentId: string, courseId: string) {
        try {
            const updated = await prisma.studentCourse.updateMany({
                where: {
                    studentId,
                    courseId,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'SUSPENDED',
                    updatedAt: new Date()
                }
            });

            return {
                success: true,
                message: 'Curso desativado com sucesso',
                data: { updated: updated.count }
            };

        } catch (error) {
            console.error('Error deactivating student course:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Erro ao desativar curso: ${errorMessage}`);
        }
    }
}

export default StudentCourseService;
