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

            // Check if student has graduations (to force enrollment for beginners)
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: { graduations: true }
            });
            const hasGraduation = student?.graduations && student.graduations.length > 0;

            // 2. Coletar todos os cursos únicos dos planos ativos
            const coursesToActivate = new Map<string, { name: string, type: 'primary' | 'additional', isBaseCourse: boolean }>();

            // [FIX] Se o aluno não tiver graduação, incluir TODOS os cursos base da organização
            // Isso garante que alunos iniciantes sejam matriculados no curso base mesmo que o plano não esteja explicitamente vinculado
            if (!hasGraduation) {
                const baseCourses = await prisma.course.findMany({
                    where: {
                        organizationId,
                        isBaseCourse: true,
                        isActive: true
                    }
                });

                for (const baseCourse of baseCourses) {
                    coursesToActivate.set(baseCourse.id, {
                        name: baseCourse.name,
                        type: 'primary',
                        isBaseCourse: true
                    });
                }
            }

            const subscriptionDetails: SubscriptionDetail[] = [];

            for (const subscription of activeSubscriptions) {
                const subDetail: SubscriptionDetail = {
                    subscriptionId: subscription.id,
                    planName: subscription.plan.name,
                    courses: []
                };

                // Curso principal do plano
                if (subscription.plan.course) {
                    coursesToActivate.set(subscription.plan.course.id, {
                        name: subscription.plan.course.name,
                        type: 'primary',
                        isBaseCourse: subscription.plan.course.isBaseCourse
                    });
                    subDetail.courses.push({
                        id: subscription.plan.course.id,
                        name: subscription.plan.course.name,
                        type: 'primary'
                    });
                }

                // Cursos adicionais do plano
                for (const planCourse of subscription.plan.planCourses) {
                    coursesToActivate.set(planCourse.course.id, {
                        name: planCourse.course.name,
                        type: 'additional',
                        isBaseCourse: planCourse.course.isBaseCourse
                    });
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
                    courseId: { in: Array.from(coursesToActivate.keys()) },
                    status: 'ACTIVE'
                }
            });

            const existingCourseIds = new Set(
                existingStudentCourses.map(sc => sc.courseId)
            );

            // 4. Buscar classes disponíveis para cada curso que não está ativo
            const newCoursesToActivateIds = Array.from(coursesToActivate.keys()).filter(
                courseId => !existingCourseIds.has(courseId)
            );

            const activatedCourses = [];

            if (newCoursesToActivateIds.length > 0) {
                // Para cada curso, buscar uma classe ativa
                for (const courseId of newCoursesToActivateIds) {
                    const courseInfo = coursesToActivate.get(courseId);
                    const isBaseCourse = courseInfo?.isBaseCourse ?? false;

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
                    } else if (!hasGraduation && isBaseCourse) {
                        // Force enrollment for beginners ONLY if it is a Base Course
                        // "O aluno que não tivert nenhuma graduação deve estar matriculado em todo curso base incluso nos planos"
                        console.log(`⚠️ Forcing enrollment for beginner student ${studentId} in base course ${courseId}`);
                        
                        const studentCourse = await prisma.studentCourse.create({
                            data: {
                                studentId,
                                courseId,
                                classId: null, // Explicitly null
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
     * RETORNA: { enrolledCourses, availableCourses }
     */
    static async getStudentActiveCourses(studentId: string) {
        try {
            console.log('🔍 [Service] Getting active courses for student:', studentId);
            
            // 1. Buscar cursos matriculados (StudentCourse)
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
                            duration: true,
                            level: true,
                            totalClasses: true
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

            // 2. Buscar plano ativo do aluno
            const activeSubscription = await prisma.studentSubscription.findFirst({
                where: {
                    studentId,
                    status: 'ACTIVE',
                    isActive: true
                },
                include: {
                    plan: {
                        include: {
                            planCourses: {
                                include: {
                                    course: {
                                        select: {
                                            id: true,
                                            name: true,
                                            description: true,
                                            category: true,
                                            duration: true,
                                            level: true,
                                            totalClasses: true,
                                            isActive: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // 3. Mapear cursos matriculados
            const enrolledCourses = studentCourses.map(sc => ({
                id: sc.id,
                courseId: sc.courseId,
                startDate: sc.startDate,
                status: sc.status,
                enrolledAt: sc.startDate,
                course: {
                    ...sc.course,
                    durationTotalWeeks: sc.course.duration,
                    totalLessons: sc.course.totalClasses,
                    difficulty: sc.course.level
                },
                class: sc.class
            }));

            // 4. Identificar IDs dos cursos matriculados
            const enrolledCourseIds = new Set(studentCourses.map(sc => sc.courseId));

            // 5. Extrair course IDs do plano (três fontes: courseId principal, planCourses E features.courseIds)
            let planCourseIds: string[] = [];
            
            // 5a. Buscar curso principal do plano
            if (activeSubscription?.plan?.courseId) {
                planCourseIds.push(activeSubscription.plan.courseId);
            }

            // 5b. Buscar em planCourses (tabela intermediária)
            if (activeSubscription?.plan?.planCourses) {
                planCourseIds.push(...activeSubscription.plan.planCourses.map(pc => pc.courseId));
            }
            
            // 5c. Buscar em features.courseIds (campo JSON) - NOVO!
            if (activeSubscription?.plan?.features) {
                const features = activeSubscription.plan.features as any;
                if (features.courseIds && Array.isArray(features.courseIds)) {
                    planCourseIds.push(...features.courseIds);
                }
            }
            
            // Remover duplicatas
            planCourseIds = [...new Set(planCourseIds)];
            
            console.log('🔍 [Service] Plan course IDs:', planCourseIds);
            console.log('🔍 [Service] Enrolled course IDs:', [...enrolledCourseIds]);

            // 6. Buscar cursos disponíveis do plano
            let availableCourses: any[] = [];
            if (planCourseIds.length > 0) {
                const courses = await prisma.course.findMany({
                    where: {
                        id: { in: planCourseIds },
                        isActive: true
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        duration: true,
                        level: true,
                        totalClasses: true
                    }
                });
                
                // Filtrar cursos já matriculados
                availableCourses = courses
                    .filter(c => !enrolledCourseIds.has(c.id))
                    .map(c => ({
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        category: c.category,
                        durationTotalWeeks: c.duration,
                        totalLessons: c.totalClasses,
                        difficulty: c.level
                    }));
            }

            console.log('📊 [Service] Enrolled:', enrolledCourses.length, 'Available:', availableCourses.length);

            return {
                enrolledCourses,
                availableCourses
            };

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

    /**
     * Matricular estudante em um curso específico (manual enrollment)
     */
    static async enrollStudentInCourse(
        studentId: string,
        courseId: string,
        organizationId: string,
        options: {
            status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
            enrolledAt?: Date;
        } = {}
    ) {
        try {
            console.log('📝 [Service] Enrolling student in course:', { studentId, courseId, organizationId });

            // Verificar se o curso existe
            const course = await prisma.course.findUnique({
                where: { id: courseId }
            });

            if (!course) {
                throw new Error('Curso não encontrado');
            }

            // Verificar se já existe matrícula ativa
            const existingEnrollment = await prisma.studentCourse.findFirst({
                where: {
                    studentId,
                    courseId,
                    status: 'ACTIVE'
                }
            });

            if (existingEnrollment) {
                throw new Error('Aluno já está matriculado neste curso');
            }

            // ✅ classId agora é opcional - matrícula manual não requer turma
            // O aluno pode ser associado a uma turma específica posteriormente
            console.log('✅ Creating manual enrollment without Class requirement');

            // Criar matrícula
            const enrollment = await prisma.studentCourse.create({
                data: {
                    studentId,
                    courseId,
                    // classId omitido - opcional para matrículas manuais
                    status: options.status || 'ACTIVE',
                    startDate: options.enrolledAt || new Date(),
                    isActive: true
                }
            });

            console.log('✅ [Service] Enrollment created:', enrollment.id);

            return enrollment;

        } catch (error) {
            console.error('❌ [Service] Error enrolling student:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Erro ao matricular aluno: ${errorMessage}`);
        }
    }

    /**
     * Atualizar status de matrícula existente
     */
    static async updateEnrollmentStatus(
        enrollmentId: string,
        data: {
            status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';
            endDate?: Date;
        }
    ) {
        try {
            console.log('🔄 [Service] Updating enrollment status:', { enrollmentId, ...data });

            const enrollment = await prisma.studentCourse.findUnique({
                where: { id: enrollmentId }
            });

            if (!enrollment) {
                throw new Error('Matrícula não encontrada');
            }

            // Preparar dados de atualização
            const updateData: any = {
                status: data.status,
                updatedAt: new Date()
            };

            // Se status é COMPLETED ou DROPPED, definir completedDate
            if (data.status === 'COMPLETED' || data.status === 'DROPPED') {
                updateData.completedDate = data.endDate || new Date();
                updateData.isActive = false;
            }

            const updatedEnrollment = await prisma.studentCourse.update({
                where: { id: enrollmentId },
                data: updateData
            });

            console.log('✅ [Service] Enrollment status updated:', updatedEnrollment.id);

            return updatedEnrollment;

        } catch (error) {
            console.error('❌ [Service] Error updating enrollment status:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            throw new Error(`Erro ao atualizar status da matrícula: ${errorMessage}`);
        }
    }
}

export default StudentCourseService;
