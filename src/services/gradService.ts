import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { StudentGraduation } from '@prisma/client';

export class GraduationService {
  /**
   * Verificar elegibilidade para graduação
   */
  static async checkEligibility(studentId: string): Promise<{
    eligible: boolean;
    currentBelt: string;
    nextBelt: string | null;
    requirements: {
      minClasses: number;
      attendedClasses: number;
      minMonths: number;
      monthsInBelt: number;
      technicalExam: boolean;
    };
    missing: string[];
  }> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          graduations: {
            orderBy: { approvedAt: 'desc' },
            take: 1
          },
          turmaAttendances: {
            where: {
              present: true
            }
          }
        }
      });

      if (!student) throw new Error('Student not found');

      const currentBeltName = student.graduations?.[0]?.toBelt || 'WHITE';
      const lastGraduationDate = student.graduations?.[0]?.approvedAt || student.createdAt;

      // Buscar próxima faixa na ordem
      const belts = ['WHITE', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'BROWN', 'BLACK'];
      const currentIndex = belts.indexOf(currentBeltName);
      const nextBeltName = currentIndex < belts.length - 1 ? belts[currentIndex + 1] : null;

      if (!nextBeltName) {
        return {
          eligible: false,
          currentBelt: currentBeltName,
          nextBelt: null,
          requirements: {
            minClasses: 0,
            attendedClasses: 0,
            minMonths: 0,
            monthsInBelt: 0,
            technicalExam: false
          },
          missing: []
        };
      }

      // Definir requisitos (exemplo simplificado)
      // Idealmente viria de uma tabela de configuração de faixas
      const requirements = this.getBeltRequirements(nextBeltName);

      // Calcular progresso
      const attendedClasses = await prisma.turmaAttendance.count({
        where: {
          studentId,
          present: true,
          createdAt: { gte: lastGraduationDate }
        }
      });

      const monthsInBelt = this.monthDiff(lastGraduationDate, new Date());

      // Verificar exame técnico (se houve aprovação recente)
      const technicalExam = await prisma.evaluation.findFirst({
        where: {
          studentId,
          type: 'GRADING',
          passed: true,
          createdAt: { gte: lastGraduationDate }
        }
      });

      const missing: string[] = [];
      if (attendedClasses < requirements.minClasses) {
        missing.push(`Faltam ${requirements.minClasses - attendedClasses} aulas`);
      }
      if (monthsInBelt < requirements.minMonths) {
        missing.push(`Faltam ${requirements.minMonths - monthsInBelt} meses na faixa`);
      }
      if (!technicalExam) {
        missing.push('Aprovação em exame técnico necessária');
      }

      return {
        eligible: missing.length === 0,
        currentBelt: currentBeltName,
        nextBelt: nextBeltName,
        requirements: {
          minClasses: requirements.minClasses,
          attendedClasses,
          minMonths: requirements.minMonths,
          monthsInBelt,
          technicalExam: !!technicalExam
        },
        missing
      };

    } catch (error) {
      logger.error('Error checking graduation eligibility:', error);
      throw error;
    }
  }

  private static getBeltRequirements(belt: string): { minClasses: number; minMonths: number } {
    const reqs: Record<string, { minClasses: number; minMonths: number }> = {
      'YELLOW': { minClasses: 40, minMonths: 6 },
      'ORANGE': { minClasses: 60, minMonths: 8 },
      'GREEN': { minClasses: 80, minMonths: 10 },
      'BLUE': { minClasses: 100, minMonths: 12 },
      'BROWN': { minClasses: 120, minMonths: 12 },
      'BLACK': { minClasses: 150, minMonths: 18 }
    };
    return reqs[belt] || { minClasses: 50, minMonths: 6 };
  }

  private static monthDiff(d1: Date, d2: Date): number {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
  }

  /**
   * Processar graduação
   */
  static async graduate(data: {
    studentId: string;
    courseId: string;
    fromBelt: string;
    toBelt: string;
    approvedBy: string;
    certificateUrl?: string;
    ceremonyNotes?: string;
  }): Promise<StudentGraduation> {
    try {
      // Criar registro de graduação
      const graduation = await prisma.studentGraduation.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          fromBelt: data.fromBelt,
          toBelt: data.toBelt,
          approvedBy: data.approvedBy,
          certificateUrl: data.certificateUrl,
          ceremonyNotes: data.ceremonyNotes,
          finalAttendanceRate: 0,
          finalQualityRating: 0,
          totalRepetitions: 0,
          totalLessonsCompleted: 0
        }
      });

      logger.info(`Student ${data.studentId} graduated from ${data.fromBelt} to ${data.toBelt}`);
      
      return graduation;
    } catch (error) {
      logger.error('Error processing graduation:', error);
      throw error;
    }
  }
}
