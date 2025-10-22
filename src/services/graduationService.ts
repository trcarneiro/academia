import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

interface ProgressionResult {
  studentId: string;
  courseId: string;
  studentName: string;
  courseName: string;
  currentBelt: string;
  
  // Progressão atual
  totalLessonsInCourse: number;
  completedLessons: number;
  progressPercentage: number;
  currentDegree: number; // 0-4 (0 = sem grau, 1-4 = graus conquistados)
  degreePercentage: number; // 0, 20, 40, 60, 80
  
  // Próximo milestone
  nextDegree: number | null; // null se já completou 4º grau
  lessonsForNextDegree: number | null;
  percentageForNextDegree: number | null;
  
  // Elegibilidade para graduação (mudança de faixa)
  isEligibleForBeltChange: boolean;
  eligibilityDetails: {
    hasAllDegrees: boolean; // 4 graus completos (80%)
    meetsAttendanceRate: boolean; // >= 80%
    meetsQualityRating: boolean; // >= 3.0/5.0
    meetsMinimumReps: boolean; // >= 500 total
    meetsMinimumMonths: boolean; // >= 3 meses
    currentAttendanceRate: number;
    currentQualityRating: number;
    totalRepetitions: number;
    monthsEnrolled: number;
  };
  
  // Histórico de graus
  degreeHistory: Array<{
    degree: number;
    achievedAt: Date;
    completedLessons: number;
    degreePercentage: number;
  }>;
}

export class GraduationService {
  /**
   * Calcula a progressão completa de um aluno em um curso
   */
  static async calculateProgression(
    studentId: string, 
    courseId: string
  ): Promise<ProgressionResult> {
    try {
      // 1. Buscar informações do aluno e curso
      const [student, course, enrollment] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }),
        prisma.course.findUnique({
          where: { id: courseId },
          include: {
            lessonPlans: {
              where: { isActive: true },
              select: { lessonNumber: true }
            }
          }
        }),
        prisma.studentCourse.findFirst({
          where: {
            studentId,
            courseId,
            isActive: true
          }
        })
      ]);

      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      if (!enrollment) {
        throw new Error(`Student ${studentId} is not enrolled in course ${courseId}`);
      }

      const studentName = `${student.user.firstName} ${student.user.lastName}`;
      const courseName = course.name;
      
      // Buscar última graduação para pegar a faixa atual
      const lastGraduation = await prisma.studentGraduation.findFirst({
        where: {
          studentId,
          courseId
        },
        orderBy: {
          approvedAt: 'desc'
        }
      });

      const currentBelt = lastGraduation?.toBelt || 'Faixa Branca';

      // 2. Contar total de aulas do curso
      const totalLessonsInCourse = course.lessonPlans.length;

      // 3. Buscar aulas completadas (presença confirmada)
      const attendances = await prisma.turmaAttendance.findMany({
        where: {
          studentId,
          present: true,
          lesson: {
            turma: {
              courseId
            }
          }
        },
        include: {
          lesson: {
            select: { lessonNumber: true, scheduledDate: true }
          }
        },
        orderBy: {
          checkedAt: 'asc'
        }
      });

      // 4. Contar aulas únicas completadas (mesmo lesson number conta apenas 1x)
      const uniqueLessons = new Set(attendances.map(a => a.lesson.lessonNumber));
      const completedLessons = uniqueLessons.size;

      // 5. Calcular percentual de progresso
      const progressPercentage = totalLessonsInCourse > 0 
        ? (completedLessons / totalLessonsInCourse) * 100 
        : 0;

      // 6. Calcular grau atual (cada 20% = 1 grau)
      const currentDegree = Math.floor(progressPercentage / 20);
      const degreePercentage = currentDegree * 20;

      // 7. Calcular próximo milestone
      const nextDegree = currentDegree < 4 ? currentDegree + 1 : null;
      const percentageForNextDegree = nextDegree ? nextDegree * 20 : null;
      const lessonsForNextDegree = percentageForNextDegree
        ? Math.ceil((percentageForNextDegree / 100) * totalLessonsInCourse) - completedLessons
        : null;

      // 8. Buscar histórico de graus
      const degreeHistory = await prisma.studentDegreeHistory.findMany({
        where: {
          studentId,
          courseId
        },
        orderBy: {
          achievedAt: 'asc'
        },
        select: {
          degree: true,
          achievedAt: true,
          completedLessons: true,
          degreePercentage: true
        }
      });

      // 9. Verificar elegibilidade para graduação (mudança de faixa)
      const eligibility = await this.checkGraduationEligibility(
        studentId, 
        courseId, 
        currentDegree,
        attendances.length,
        totalLessonsInCourse,
        enrollment.startDate // Usar startDate em vez de enrolledAt
      );

      return {
        studentId,
        courseId,
        studentName,
        courseName,
        currentBelt,
        totalLessonsInCourse,
        completedLessons,
        progressPercentage,
        currentDegree,
        degreePercentage,
        nextDegree,
        lessonsForNextDegree,
        percentageForNextDegree,
        isEligibleForBeltChange: eligibility.isEligible,
        eligibilityDetails: eligibility.details,
        degreeHistory
      };
    } catch (error) {
      logger.error('Error calculating progression:', error);
      throw error;
    }
  }

  /**
   * Verifica elegibilidade para mudança de faixa
   */
  private static async checkGraduationEligibility(
    studentId: string,
    courseId: string,
    currentDegree: number,
    totalAttendances: number,
    totalLessons: number,
    enrolledAt: Date
  ): Promise<{
    isEligible: boolean;
    details: ProgressionResult['eligibilityDetails'];
  }> {
    try {
      // Buscar regras de graduação do curso
      const graduationLevel = await prisma.courseGraduationLevel.findFirst({
        where: { courseId }
      });

      // Valores padrão se não houver configuração
      const requirements = {
        totalDegrees: graduationLevel?.totalDegrees || 4,
        minimumAttendanceRate: graduationLevel?.minimumAttendanceRate || 80,
        minimumQualityRating: graduationLevel?.minimumQualityRating || 3.0,
        minimumRepetitionsTotal: graduationLevel?.minimumRepetitionsTotal || 500,
        minimumMonthsEnrolled: graduationLevel?.minimumMonthsEnrolled || 3
      };

      // 1. Verificar se completou todos os graus (4º grau = 80%)
      const hasAllDegrees = currentDegree >= requirements.totalDegrees;

      // 2. Calcular taxa de presença
      const currentAttendanceRate = totalLessons > 0 
        ? (totalAttendances / totalLessons) * 100 
        : 0;
      const meetsAttendanceRate = currentAttendanceRate >= requirements.minimumAttendanceRate;

      // 3. Calcular rating médio de performance
      const executions = await prisma.lessonActivityExecution.findMany({
        where: {
          studentId,
          performanceRating: { not: null },
          attendance: {
            lesson: {
              turma: {
                courseId
              }
            }
          }
        },
        select: { performanceRating: true }
      });

      const currentQualityRating = executions.length > 0
        ? executions.reduce((sum, e) => sum + (e.performanceRating || 0), 0) / executions.length
        : 0;
      const meetsQualityRating = currentQualityRating >= requirements.minimumQualityRating;

      // 4. Calcular total de repetições
      const repetitionsData = await prisma.lessonActivityExecution.aggregate({
        where: {
          studentId,
          attendance: {
            lesson: {
              turma: {
                courseId
              }
            }
          }
        },
        _sum: {
          repetitionsCount: true
        }
      });

      const totalRepetitions = repetitionsData._sum.repetitionsCount || 0;
      const meetsMinimumReps = totalRepetitions >= requirements.minimumRepetitionsTotal;

      // 5. Calcular meses de matrícula
      const now = new Date();
      const monthsEnrolled = Math.floor(
        (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const meetsMinimumMonths = monthsEnrolled >= requirements.minimumMonthsEnrolled;

      // Elegível apenas se todos os critérios forem atendidos
      const isEligible = 
        hasAllDegrees && 
        meetsAttendanceRate && 
        meetsQualityRating && 
        meetsMinimumReps && 
        meetsMinimumMonths;

      return {
        isEligible,
        details: {
          hasAllDegrees,
          meetsAttendanceRate,
          meetsQualityRating,
          meetsMinimumReps,
          meetsMinimumMonths,
          currentAttendanceRate,
          currentQualityRating,
          totalRepetitions,
          monthsEnrolled
        }
      };
    } catch (error) {
      logger.error('Error checking graduation eligibility:', error);
      throw error;
    }
  }

  /**
   * Registra conquista de novo grau
   * Chamado automaticamente quando aluno atinge 20%, 40%, 60% ou 80%
   */
  static async recordDegreeAchievement(
    studentId: string,
    courseId: string,
    degree: number,
    progression: ProgressionResult
  ): Promise<void> {
    try {
      // Verificar se já existe registro deste grau
      const existing = await prisma.studentDegreeHistory.findFirst({
        where: {
          studentId,
          courseId,
          degree
        }
      });

      if (existing) {
        logger.info(`Degree ${degree} already recorded for student ${studentId} in course ${courseId}`);
        return;
      }

      // Criar registro de conquista de grau
      await prisma.studentDegreeHistory.create({
        data: {
          studentId,
          courseId,
          degree,
          degreePercentage: degree * 20,
          belt: progression.currentBelt,
          completedLessons: progression.completedLessons,
          totalRepetitions: progression.eligibilityDetails.totalRepetitions,
          averageQuality: progression.eligibilityDetails.currentQualityRating,
          attendanceRate: progression.eligibilityDetails.currentAttendanceRate,
          achievedAt: new Date()
        }
      });

      logger.info(`Degree ${degree} recorded for student ${studentId} in course ${courseId}`);

      // TODO: Disparar notificação (FASE 6)
      // await NotificationService.sendDegreeAchievement(studentId, degree, progression);
    } catch (error) {
      logger.error('Error recording degree achievement:', error);
      throw error;
    }
  }

  /**
   * Aprova graduação de faixa
   * Chamado manualmente pelo instrutor
   */
  static async approveGraduation(
    studentId: string,
    courseId: string,
    instructorId: string,
    data: {
      toBelt: string;
      ceremonyDate?: Date;
      ceremonyNotes?: string;
    }
  ): Promise<void> {
    try {
      // Verificar elegibilidade
      const progression = await this.calculateProgression(studentId, courseId);
      
      if (!progression.isEligibleForBeltChange) {
        throw new Error('Student does not meet graduation requirements');
      }

      // Buscar enrollment atual e última graduação
      const enrollment = await prisma.studentCourse.findFirst({
        where: {
          studentId,
          courseId,
          isActive: true
        }
      });

      if (!enrollment) {
        throw new Error('Student enrollment not found');
      }

      // Buscar última graduação para pegar a faixa atual
      const lastGraduation = await prisma.studentGraduation.findFirst({
        where: {
          studentId,
          courseId
        },
        orderBy: {
          approvedAt: 'desc'
        }
      });

      const fromBelt = lastGraduation?.toBelt || 'Faixa Branca';

      // Registrar graduação
      await prisma.studentGraduation.create({
        data: {
          studentId,
          courseId,
          fromBelt,
          toBelt: data.toBelt,
          approvedBy: instructorId,
          approvedAt: new Date(),
          finalAttendanceRate: progression.eligibilityDetails.currentAttendanceRate,
          finalQualityRating: progression.eligibilityDetails.currentQualityRating,
          totalRepetitions: progression.eligibilityDetails.totalRepetitions,
          totalLessonsCompleted: progression.completedLessons,
          ceremonyDate: data.ceremonyDate || null,
          ceremonyNotes: data.ceremonyNotes || null
        }
      });

      // Nota: StudentCourse não tem campo currentBelt
      // A faixa atual é sempre rastreada via StudentGraduation (lastGraduation.toBelt)

      logger.info(`Graduation approved: ${studentId} from ${fromBelt} to ${data.toBelt}`);

      // TODO: Gerar certificado (FASE 8)
      // await CertificateService.generate(graduationId);
    } catch (error) {
      logger.error('Error approving graduation:', error);
      throw error;
    }
  }

  /**
   * Lista alunos elegíveis para graduação em um curso
   */
  static async getEligibleStudents(courseId: string): Promise<ProgressionResult[]> {
    try {
      // Buscar todos os alunos matriculados no curso
      const enrollments = await prisma.studentCourse.findMany({
        where: {
          courseId,
          isActive: true,
          status: 'ACTIVE'
        },
        select: {
          studentId: true
        }
      });

      // Calcular progressão de cada aluno
      const progressions = await Promise.all(
        enrollments.map(e => this.calculateProgression(e.studentId, courseId))
      );

      // Filtrar apenas elegíveis
      return progressions.filter(p => p.isEligibleForBeltChange);
    } catch (error) {
      logger.error('Error fetching eligible students:', error);
      throw error;
    }
  }

  /**
   * Verifica e registra automaticamente conquistas de graus
   * Chamado após cada check-in bem-sucedido
   */
  static async checkAndRecordDegrees(
    studentId: string,
    courseId: string
  ): Promise<void> {
    try {
      const progression = await this.calculateProgression(studentId, courseId);

      // Verificar cada grau (1º a 4º)
      for (let degree = 1; degree <= 4; degree++) {
        if (progression.currentDegree >= degree) {
          // Aluno atingiu este grau, registrar se ainda não existe
          await this.recordDegreeAchievement(studentId, courseId, degree, progression);
        }
      }
    } catch (error) {
      logger.error('Error checking and recording degrees:', error);
      // Não lançar erro para não quebrar o fluxo de check-in
      logger.warn('Continuing despite degree recording error');
    }
  }

  // ==========================================
  // MÉTODOS PARA MÓDULO DE GRADUAÇÃO (Frontend)
  // ==========================================

  /**
   * Lista estudantes com progresso agregado para módulo de graduação
   */
  static async listStudentsWithProgress(
    organizationId: string,
    filters: {
      courseId?: string;
      turmaId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: 'active' | 'inactive' | 'all';
    } = {}
  ) {
    try {
      console.log('🎓 [SERVICE] listStudentsWithProgress called');
      console.log('🎓 [SERVICE] organizationId:', organizationId);
      console.log('🎓 [SERVICE] filters:', filters);
      
      const where: any = { organizationId, isActive: true };

      if (filters.status && filters.status !== 'all') {
        where.isActive = filters.status === 'active';
      }
      
      console.log('🎓 [SERVICE] where:', where);
      console.log('🎓 [SERVICE] Executing Prisma query...');

      const students = await prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          studentCourses: {
            where: filters.courseId ? { courseId: filters.courseId } : {},
            include: {
              course: {
                select: { id: true, name: true, level: true },
              },
            },
          },
          progressTracking: {
            where: filters.courseId ? { courseId: filters.courseId } : {},
            include: {
              qualitativeAssessments: {
                orderBy: { assessmentDate: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      console.log('✅ [SERVICE] Prisma query returned:', students.length, 'students');

      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          const courseIds = student.studentCourses.map((sc) => sc.courseId);
          const stats = courseIds[0]
            ? await this.calculateStudentStats(student.id, filters.courseId || courseIds[0])
            : null;

          const fullName = `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim();

          return {
            id: student.id,
            name: fullName || student.user.email, // Fallback to email if no name
            email: student.user.email,
            avatarUrl: student.user.avatarUrl,
            courses: student.studentCourses.map((sc) => ({
              id: sc.course.id,
              name: sc.course.name,
              level: sc.course.level,
              enrolledAt: sc.enrolledAt,
            })),
            stats,
          };
        })
      );

      return studentsWithStats;
    } catch (error) {
      logger.error('Error listing students with progress:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas de progresso agregado
   */
  static async calculateStudentStats(studentId: string, courseId?: string) {
    try {
      const where: any = { studentId };
      if (courseId) where.courseId = courseId;

      const progressRecords = await prisma.studentProgress.findMany({
        where,
        include: {
          qualitativeAssessments: true,
        },
      });

      if (progressRecords.length === 0) {
        return {
          totalActivities: 0,
          completedActivities: 0,
          completionPercentage: 0,
          totalRepsCompleted: 0,
          totalRepsTarget: 0,
          repsPercentage: 0,
          categories: {},
        };
      }

      const totalActivities = progressRecords.length;
      const completedActivities = progressRecords.filter(
        (p) => p.completionPercentage >= 100
      ).length;
      const totalRepsCompleted = progressRecords.reduce(
        (sum, p) => sum + p.completedReps,
        0
      );
      const totalRepsTarget = progressRecords.reduce(
        (sum, p) => sum + p.targetReps,
        0
      );

      const allAssessments = progressRecords.flatMap(
        (p) => p.qualitativeAssessments
      );
      const averageRating =
        allAssessments.length > 0
          ? allAssessments.reduce((sum, a) => sum + a.rating, 0) /
            allAssessments.length
          : undefined;

      const categories: Record<string, any> = {};
      progressRecords.forEach((record) => {
        const parts = record.activityName.split(':');
        const category = parts.length > 1 ? parts[0].trim() : 'Outras';

        if (!categories[category]) {
          categories[category] = { completed: 0, total: 0, percentage: 0 };
        }

        categories[category].total++;
        if (record.completionPercentage >= 100) {
          categories[category].completed++;
        }
      });

      Object.keys(categories).forEach((cat) => {
        const { completed, total } = categories[cat];
        categories[cat].percentage = (completed / total) * 100;
      });

      return {
        totalActivities,
        completedActivities,
        completionPercentage: (completedActivities / totalActivities) * 100,
        totalRepsCompleted,
        totalRepsTarget,
        repsPercentage: (totalRepsCompleted / totalRepsTarget) * 100,
        averageRating,
        categories,
      };
    } catch (error) {
      logger.error('Error calculating student stats:', error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza progresso quantitativo
   */
  static async upsertStudentProgress(data: {
    studentId: string;
    courseId: string;
    lessonNumber: number;
    activityName: string;
    completedReps: number;
    targetReps: number;
  }) {
    try {
      const completionPercentage = (data.completedReps / data.targetReps) * 100;

      const progress = await prisma.studentProgress.upsert({
        where: {
          studentId_courseId_lessonNumber_activityName: {
            studentId: data.studentId,
            courseId: data.courseId,
            lessonNumber: data.lessonNumber,
            activityName: data.activityName,
          },
        },
        update: {
          completedReps: data.completedReps,
          targetReps: data.targetReps,
          completionPercentage,
          lastUpdated: new Date(),
        },
        create: {
          studentId: data.studentId,
          courseId: data.courseId,
          lessonNumber: data.lessonNumber,
          activityName: data.activityName,
          completedReps: data.completedReps,
          targetReps: data.targetReps,
          completionPercentage,
        },
        include: {
          qualitativeAssessments: {
            orderBy: { assessmentDate: 'desc' },
            take: 1,
          },
        },
      });

      logger.info(
        `Progress updated for student ${data.studentId}, activity ${data.activityName}: ${completionPercentage.toFixed(1)}%`
      );

      return progress;
    } catch (error) {
      logger.error('Error upserting student progress:', error);
      throw error;
    }
  }

  /**
   * Adiciona avaliação qualitativa
   */
  static async addQualitativeAssessment(data: {
    studentProgressId: string;
    instructorId?: string;
    rating: number;
    notes?: string;
  }) {
    try {
      const assessment = await prisma.qualitativeAssessment.create({
        data: {
          studentProgressId: data.studentProgressId,
          instructorId: data.instructorId,
          rating: data.rating,
          notes: data.notes,
        },
        include: {
          studentProgress: {
            include: {
              student: {
                include: { user: true },
              },
            },
          },
          instructor: {
            include: { user: true },
          },
        },
      });

      logger.info(
        `Qualitative assessment created for progress ${data.studentProgressId}, rating ${data.rating}/5`
      );

      return assessment;
    } catch (error) {
      logger.error('Error adding qualitative assessment:', error);
      throw error;
    }
  }

  /**
   * Busca requisitos de graduação
   */
  static async getCourseRequirements(courseId: string, beltLevel?: string) {
    try {
      const where: any = { courseId };
      if (beltLevel) where.beltLevel = beltLevel;

      const requirements = await prisma.courseRequirement.findMany({
        where,
        orderBy: [{ beltLevel: 'asc' }, { category: 'asc' }],
      });

      const grouped = requirements.reduce(
        (acc, req) => {
          if (!acc[req.category]) {
            acc[req.category] = [];
          }
          acc[req.category].push(req);
          return acc;
        },
        {} as Record<string, typeof requirements>
      );

      return { requirements, grouped };
    } catch (error) {
      logger.error('Error getting course requirements:', error);
      throw error;
    }
  }

  /**
   * Obtém progresso detalhado de um aluno específico para o modal
   */
  static async getStudentDetailedProgress(studentId: string, courseId?: string) {
    try {
      console.log(`📊 Getting detailed progress for student ${studentId}, course: ${courseId || 'first enrolled'}`);

      // Buscar aluno
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          studentCourses: {
            where: courseId ? { courseId } : {},
            include: {
              course: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!student || student.studentCourses.length === 0) {
        console.log('❌ Student not found or not enrolled');
        return null;
      }

      const enrollment = student.studentCourses[0];
      const course = enrollment.course;

      // Buscar atividades do plano de aula deste curso
      const lessonActivities = await prisma.lessonPlanActivity.findMany({
        where: {
          lessonPlan: {
            courseId: course.id,
          },
        },
        include: {
          activity: {
            select: {
              title: true,
              type: true,
            },
          },
          lessonPlan: {
            select: {
              lessonNumber: true,
              title: true,
            },
          },
        },
        orderBy: [
          { lessonPlan: { lessonNumber: 'asc' } },
          { ord: 'asc' },
        ],
      });

      console.log(`📋 Found ${lessonActivities.length} activities in course`);

      // Buscar progresso quantitativo do aluno
      const studentProgress = await prisma.studentProgress.findMany({
        where: {
          studentId,
          courseId: course.id,
        },
        include: {
          qualitativeAssessments: {
            orderBy: { assessmentDate: 'desc' },
            take: 1,
          },
        },
      });

      console.log(`📈 Found ${studentProgress.length} progress records`);

      // Buscar check-ins do aluno
      const checkins = await prisma.turmaAttendance.findMany({
        where: {
          studentId,
          turma: {
            courseId: course.id,
          },
        },
        select: {
          id: true,
          checkedAt: true,
          createdAt: true,
        },
      });

      // Mapear atividades com progresso
      const activitiesWithProgress = lessonActivities.map((activity) => {
        // Buscar progresso por lessonNumber + activityName
        const progress = studentProgress.find(
          (p) => 
            p.lessonNumber === activity.lessonPlan.lessonNumber && 
            p.activityName === activity.activity.title
        );
        const qualitative = progress?.qualitativeAssessments?.[0];

        return {
          id: activity.id,
          name: activity.activity.title,
          category: activity.activity.type,
          quantitativeProgress: progress?.completedReps || 0,
          quantitativeTarget: activity.minimumForGraduation || 0,
          qualitativeRating: qualitative?.rating || 0,
          source: progress ? 'checkin' : 'manual', // Simplificado por enquanto
          lessonNumber: activity.lessonPlan.lessonNumber,
          lessonTitle: activity.lessonPlan.title,
        };
      });

      // Calcular estatísticas agregadas
      const totalActivities = lessonActivities.length;
      
      // Para calcular atividades completas, precisamos cruzar com os requisitos do plano
      const completedActivities = lessonActivities.filter((lessonActivity) => {
        const progress = studentProgress.find(
          (p) => 
            p.lessonNumber === lessonActivity.lessonPlan.lessonNumber && 
            p.activityName === lessonActivity.activity.title
        );
        const target = lessonActivity.minimumForGraduation || 0;
        return progress && progress.completedReps >= target;
      }).length;

      const totalRepsCompleted = studentProgress.reduce(
        (sum, p) => sum + p.completedReps,
        0
      );
      const totalRepsTarget = lessonActivities.reduce(
        (sum, a) => sum + (a.minimumForGraduation || 0),
        0
      );

      const ratings = studentProgress
        .map((p) => p.qualitativeAssessments?.[0]?.rating)
        .filter((r): r is number => r !== undefined && r > 0);

      const qualitativeAverage =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;

      const progressPercentage = totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

      // Atividades disponíveis (todas as do curso)
      const availableActivities = lessonActivities.map((a) => ({
        id: a.id,
        name: a.activity.title,
        category: a.activity.type,
        lessonNumber: a.lessonPlan.lessonNumber,
      }));

      return {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          beltLevel: student.beltLevel || 'white',
        },
        courseName: course.name,
        progressPercentage,
        quantitativeCompleted: totalRepsCompleted,
        quantitativeTotal: totalRepsTarget,
        qualitativeAverage,
        checkins: checkins.length,
        manualRegistrations: 0, // TODO: Implementar lógica de registros manuais
        activities: activitiesWithProgress,
        availableActivities,
      };
    } catch (error) {
      logger.error('Error getting detailed student progress:', error);
      throw error;
    }
  }

  /**
   * Atualiza progresso de uma atividade específica (INLINE EDIT)
   */
  static async updateStudentActivity(
    studentId: string,
    activityId: string,
    data: {
      quantitativeProgress?: number;
      qualitativeRating?: number;
      notes?: string;
    }
  ) {
    try {
      console.log(`📝 [SERVICE] Updating activity ${activityId} for student ${studentId}`);
      console.log('📝 [SERVICE] Data:', data);

      // 1. Buscar a atividade (LessonPlanActivity)
      const lessonActivity = await prisma.lessonPlanActivity.findUnique({
        where: { id: activityId },
        include: {
          activity: true,
          lessonPlan: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!lessonActivity) {
        throw new Error('Activity not found');
      }

      console.log(`📝 [SERVICE] Found activity: ${lessonActivity.activity.title} (Lesson ${lessonActivity.lessonPlan.lessonNumber})`);

      // 2. Buscar ou criar StudentProgress
      let studentProgress = await prisma.studentProgress.findFirst({
        where: {
          studentId,
          courseId: lessonActivity.lessonPlan.courseId,
          lessonNumber: lessonActivity.lessonPlan.lessonNumber,
          activityName: lessonActivity.activity.title,
        },
      });

      if (!studentProgress) {
        console.log('📝 [SERVICE] Creating new StudentProgress record...');
        studentProgress = await prisma.studentProgress.create({
          data: {
            studentId,
            courseId: lessonActivity.lessonPlan.courseId,
            lessonNumber: lessonActivity.lessonPlan.lessonNumber,
            activityName: lessonActivity.activity.title,
            completedReps: data.quantitativeProgress || 0,
            targetReps: lessonActivity.minimumForGraduation || 0,
            completionPercentage:
              lessonActivity.minimumForGraduation > 0
                ? ((data.quantitativeProgress || 0) / lessonActivity.minimumForGraduation) * 100
                : 0,
          },
        });
      } else {
        console.log('📝 [SERVICE] Updating existing StudentProgress record...');
        // Atualizar apenas se fornecido
        const updateData: any = {};
        if (data.quantitativeProgress !== undefined) {
          updateData.completedReps = data.quantitativeProgress;
          updateData.completionPercentage =
            lessonActivity.minimumForGraduation > 0
              ? (data.quantitativeProgress / lessonActivity.minimumForGraduation) * 100
              : 0;
        }
        updateData.lastUpdated = new Date();

        studentProgress = await prisma.studentProgress.update({
          where: { id: studentProgress.id },
          data: updateData,
        });
      }

      // 3. Criar ou atualizar QualitativeAssessment (se rating fornecido)
      if (data.qualitativeRating !== undefined && data.qualitativeRating > 0) {
        console.log(`📝 [SERVICE] Saving qualitative assessment: ${data.qualitativeRating} stars`);

        // Buscar assessment existente
        const existingAssessment = await prisma.qualitativeAssessment.findFirst({
          where: {
            studentProgressId: studentProgress.id,
          },
          orderBy: {
            assessmentDate: 'desc',
          },
        });

        if (existingAssessment) {
          // Atualizar existente
          await prisma.qualitativeAssessment.update({
            where: { id: existingAssessment.id },
            data: {
              rating: data.qualitativeRating,
              notes: data.notes || null,
              assessmentDate: new Date(),
            },
          });
        } else {
          // Criar novo
          await prisma.qualitativeAssessment.create({
            data: {
              studentProgressId: studentProgress.id,
              rating: data.qualitativeRating,
              notes: data.notes || null,
              assessmentDate: new Date(),
              instructorId: null, // TODO: Pegar do contexto da sessão
            },
          });
        }
      }

      console.log('✅ [SERVICE] Activity updated successfully');

      return {
        id: activityId,
        quantitativeProgress: studentProgress.completedReps,
        quantitativeTarget: studentProgress.targetReps,
        qualitativeRating: data.qualitativeRating || 0,
        completionPercentage: studentProgress.completionPercentage,
      };
    } catch (error) {
      logger.error('Error updating student activity:', error);
      throw error;
    }
  }
}


