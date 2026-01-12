import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export interface PerformanceMetrics {
    performance: 'BRONZE' | 'SILVER' | 'GOLD';
    score: number;
    breakdown: {
        frequencyScore: number;
        consistencyScore: number;
        proficiencyScore: number;
    };
    stats: {
        totalTechniques: number;
        masteredTechniques: number;
        proficientTechniques: number;
        practicingTechniques: number;
        learningTechniques: number;
        averagePracticeCount: number;
        totalPracticeCount: number;
        attendanceRate: number;
        consecutiveAttendances: number;
    };
}

export class PerformanceService {
    /**
     * Calcula performance do aluno (Bronze/Prata/Ouro) baseado em:
     * - Frequência de prática (40%)
     * - Consistência de check-ins (30%)
     * - Proficiência nas técnicas (30%)
     */
    static async calculatePerformance(
        studentId: string,
        courseId: string
    ): Promise<PerformanceMetrics> {
        // 1. Buscar técnicas praticadas pelo aluno
        const techniqueRecords = await prisma.techniqueRecord.findMany({
            where: {
                studentId,
                lessonPlan: {
                    courseId
                }
            },
            include: {
                technique: true
            }
        });

        // 2. Calcular estatísticas de técnicas
        const totalTechniques = techniqueRecords.length;
        const masteredTechniques = techniqueRecords.filter(
            (tr) => tr.proficiency === 'MASTERED'
        ).length;
        const proficientTechniques = techniqueRecords.filter(
            (tr) => tr.proficiency === 'PROFICIENT'
        ).length;
        const practicingTechniques = techniqueRecords.filter(
            (tr) => tr.proficiency === 'PRACTICING'
        ).length;
        const learningTechniques = techniqueRecords.filter(
            (tr) => tr.proficiency === 'LEARNING'
        ).length;

        const totalPracticeCount = techniqueRecords.reduce(
            (sum, tr) => sum + tr.practiceCount,
            0
        );
        const averagePracticeCount =
            totalTechniques > 0 ? totalPracticeCount / totalTechniques : 0;

        // 3. Calcular score de proficiência (0-100)
        // Peso: MASTERED=100, PROFICIENT=75, PRACTICING=50, LEARNING=25
        const proficiencyScore =
            totalTechniques > 0
                ? ((masteredTechniques * 100 +
                    proficientTechniques * 75 +
                    practicingTechniques * 50 +
                    learningTechniques * 25) /
                    totalTechniques)
                : 0;

        // 4. Buscar check-ins do aluno no curso
        const turmaAttendances = await prisma.turmaAttendance.findMany({
            where: {
                studentId,
                turma: {
                    courseId
                }
            },
            orderBy: {
                checkedAt: 'desc'
            },
            take: 30 // Últimos 30 check-ins
        });

        // 5. Calcular taxa de frequência
        const totalLessons = await prisma.turmaLesson.count({
            where: {
                turma: {
                    courseId,
                    students: {
                        some: {
                            studentId
                        }
                    }
                },
                scheduledDate: {
                    lte: new Date()
                }
            }
        });

        const attendanceRate =
            totalLessons > 0 ? (turmaAttendances.length / totalLessons) * 100 : 0;

        // 6. Calcular consistência (check-ins consecutivos)
        let consecutiveAttendances = 0;
        for (let i = 0; i < turmaAttendances.length; i++) {
            if (turmaAttendances[i].present || turmaAttendances[i].late) {
                consecutiveAttendances++;
            } else {
                break;
            }
        }

        // 7. Calcular score de frequência (0-100)
        const frequencyScore = Math.min(attendanceRate, 100);

        // 8. Calcular score de consistência (0-100)
        // Peso: 10+ consecutivos = 100, 5-9 = 75, 3-4 = 50, 1-2 = 25
        let consistencyScore = 0;
        if (consecutiveAttendances >= 10) {
            consistencyScore = 100;
        } else if (consecutiveAttendances >= 5) {
            consistencyScore = 75;
        } else if (consecutiveAttendances >= 3) {
            consistencyScore = 50;
        } else if (consecutiveAttendances >= 1) {
            consistencyScore = 25;
        }

        // 9. Calcular score final ponderado
        const finalScore =
            frequencyScore * 0.4 + consistencyScore * 0.3 + proficiencyScore * 0.3;

        // 10. Determinar performance (Bronze/Prata/Ouro)
        let performance: 'BRONZE' | 'SILVER' | 'GOLD';
        if (finalScore >= 80) {
            performance = 'GOLD';
        } else if (finalScore >= 60) {
            performance = 'SILVER';
        } else {
            performance = 'BRONZE';
        }

        logger.info(
            {
                studentId,
                courseId,
                performance,
                finalScore,
                frequencyScore,
                consistencyScore,
                proficiencyScore
            },
            'Performance calculated'
        );

        return {
            performance,
            score: Math.round(finalScore),
            breakdown: {
                frequencyScore: Math.round(frequencyScore),
                consistencyScore: Math.round(consistencyScore),
                proficiencyScore: Math.round(proficiencyScore)
            },
            stats: {
                totalTechniques,
                masteredTechniques,
                proficientTechniques,
                practicingTechniques,
                learningTechniques,
                averagePracticeCount: Math.round(averagePracticeCount * 10) / 10,
                totalPracticeCount,
                attendanceRate: Math.round(attendanceRate * 10) / 10,
                consecutiveAttendances
            }
        };
    }

    /**
     * Busca técnicas praticadas por um aluno em um curso
     */
    static async getStudentTechniques(studentId: string, courseId: string) {
        const techniqueRecords = await prisma.techniqueRecord.findMany({
            where: {
                studentId,
                lessonPlan: {
                    courseId
                }
            },
            include: {
                technique: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        difficulty: true,
                        category: true
                    }
                },
                lessonPlan: {
                    select: {
                        id: true,
                        title: true,
                        lessonNumber: true
                    }
                }
            },
            orderBy: {
                lastPracticed: 'desc'
            }
        });

        return techniqueRecords.map((tr) => ({
            id: tr.id,
            technique: tr.technique,
            lessonPlan: tr.lessonPlan,
            proficiency: tr.proficiency,
            practiceCount: tr.practiceCount,
            masteryScore: tr.masteryScore,
            firstPracticed: tr.firstPracticed,
            lastPracticed: tr.lastPracticed,
            masteredAt: tr.masteredAt
        }));
    }

    /**
     * Busca técnicas de uma aula específica
     */
    static async getLessonTechniques(lessonId: string) {
        const turmaLesson = await prisma.turmaLesson.findUnique({
            where: { id: lessonId },
            include: {
                lessonPlan: {
                    include: {
                        techniqueLinks: {
                            include: {
                                technique: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        difficulty: true,
                                        category: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!turmaLesson?.lessonPlan) {
            return [];
        }

        return turmaLesson.lessonPlan.techniqueLinks.map((link) => ({
            technique: link.technique,
            order: link.order,
            allocationMinutes: link.allocationMinutes,
            expectedRepetitions: (link as any).expectedRepetitions || 1,
            objectiveMapping: link.objectiveMapping
        }));
    }
}
