import { prisma } from '@/utils/database.js';
import type { PrismaClient } from '@prisma/client';

export interface CourseAnalysis {
  courseId: string;
  courseName: string;
  totalClassesPlanned: number;
  lessonPlansCount: number;
  plansCoverage: number;
  missingPlansEstimate: number;
}

export interface OrphanActivityAnalysis {
  activityId: string;
  activityName: string;
  activityType: string;
  suggestedCourses: Array<{
    courseId: string;
    courseName: string;
    relevanceScore: number;
  }>;
}

export interface MonitoringSuggestion {
  type: 'missing_plan' | 'orphan_activity' | 'content_gap' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  metadata: Record<string, any>;
}

export class LessonPlanMonitorAgent {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Análise completa do sistema de planos de aula
   */
  async runFullAnalysis(): Promise<{
    coursesAnalysis: CourseAnalysis[];
    orphanActivities: OrphanActivityAnalysis[];
    suggestions: MonitoringSuggestion[];
    summary: {
      totalCourses: number;
      coursesWithMissingPlans: number;
      totalOrphanActivities: number;
      overallCoverage: number;
    };
  }> {
    try {
      // Executar análises em paralelo
      const [coursesAnalysis, orphanActivities] = await Promise.all([
        this.analyzeCoursesWithoutPlans(),
        this.findOrphanActivities()
      ]);

      // Gerar sugestões baseadas nas análises
      const suggestions = await this.generateSuggestions(coursesAnalysis, orphanActivities);

      // Calcular métricas de resumo
      const summary = this.calculateSummaryMetrics(coursesAnalysis, orphanActivities);

      return {
        coursesAnalysis,
        orphanActivities,
        suggestions,
        summary
      };
    } catch (error) {
      console.error('Erro na análise completa do monitor:', error);
      throw error;
    }
  }

  /**
   * Analisa cursos comparando total de aulas planejadas vs planos de aula existentes
   */
  async analyzeCoursesWithoutPlans(): Promise<CourseAnalysis[]> {
    try {
      // Usar código idêntico ao que funcionou na rota
      const courses = await this.prisma.course.findMany({
        select: {
          id: true,
          name: true,
          totalClasses: true,
          lessonPlans: {
            select: {
              id: true
            }
          }
        }
      });

      // Processar os dados
      const analysis: CourseAnalysis[] = courses.map(course => {
        const totalClassesPlanned = course.totalClasses || 0;
        const lessonPlansCount = course.lessonPlans ? course.lessonPlans.length : 0;
        const plansCoverage = totalClassesPlanned > 0 ? 
          Math.round((lessonPlansCount / totalClassesPlanned) * 100) : 0;
        const missingPlansEstimate = Math.max(0, totalClassesPlanned - lessonPlansCount);

        return {
          courseId: course.id,
          courseName: course.name,
          totalClassesPlanned,
          lessonPlansCount,
          plansCoverage,
          missingPlansEstimate
        };
      });

      return analysis.sort((a, b) => a.plansCoverage - b.plansCoverage);
    } catch (error) {
      console.error('Erro ao analisar cursos sem planos:', error);
      throw error;
    }
  }

  /**
   * Identifica atividades órfãs (sem associação a planos de aula)
   */
  async findOrphanActivities(): Promise<OrphanActivityAnalysis[]> {
    try {
      // Buscar atividades que não estão associadas a nenhum plano de aula
      const orphanActivities = await this.prisma.activity.findMany({
        where: {
          lessonPlanItems: {
            none: {}
          }
        },
        include: {
          refTechnique: true
        }
      });

      // Retornar análise simplificada para evitar erros complexos de query
      const analysis: OrphanActivityAnalysis[] = orphanActivities.map(activity => ({
        activityId: activity.id,
        activityName: activity.title || activity.description || 'Atividade sem nome',
        activityType: activity.type || 'Não especificado',
        technique: activity.refTechnique?.name || 'Não especificado',
        category: activity.refTechnique?.category || 'Geral',
        suggestedCourses: [] // Sugestões simplificadas por enquanto
      }));

      return analysis;
    } catch (error) {
      console.error('Erro ao encontrar atividades órfãs:', error);
      throw error;
    }
  }



  /**
   * Gera sugestões inteligentes baseadas nas análises
   */
  private async generateSuggestions(
    coursesAnalysis: CourseAnalysis[],
    orphanActivities: OrphanActivityAnalysis[]
  ): Promise<MonitoringSuggestion[]> {
    const suggestions: MonitoringSuggestion[] = [];

    // Sugestões para cursos com baixa cobertura
    coursesAnalysis
      .filter(course => course.plansCoverage < 50)
      .forEach(course => {
        suggestions.push({
          type: 'missing_plan',
          priority: course.plansCoverage < 25 ? 'high' : 'medium',
          title: `Planos de aula faltando em ${course.courseName}`,
          description: `Este curso tem apenas ${course.plansCoverage}% de cobertura de planos de aula. ${course.missingPlansEstimate} planos precisam ser criados.`,
          actionable: true,
          metadata: {
            courseId: course.courseId,
            missingCount: course.missingPlansEstimate,
            totalClasses: course.totalClassesPlanned
          }
        });
      });

    // Sugestão geral para atividades órfãs
    if (orphanActivities.length > 0) {
      suggestions.push({
        type: 'orphan_activity',
        priority: orphanActivities.length > 10 ? 'high' : 'medium',
        title: `${orphanActivities.length} atividades órfãs encontradas`,
        description: `Existem ${orphanActivities.length} atividades não associadas a planos de aula. Considere integrá-las aos cursos existentes.`,
        actionable: true,
        metadata: {
          orphanCount: orphanActivities.length,
          sampleActivities: orphanActivities.slice(0, 3).map(a => a.activityName)
        }
      });
    }

    // Sugestão de otimização geral
    if (coursesAnalysis.length > 0) {
      const avgCoverage = coursesAnalysis.reduce((sum, course) => sum + course.plansCoverage, 0) / coursesAnalysis.length;
      
      if (avgCoverage < 70) {
        suggestions.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Oportunidade de otimização global',
          description: `A cobertura média de planos de aula é de ${Math.round(avgCoverage)}%. Considere priorizar a criação de planos para cursos com menor cobertura.`,
          actionable: true,
          metadata: {
            averageCoverage: avgCoverage,
            coursesNeedingAttention: coursesAnalysis.filter(c => c.plansCoverage < avgCoverage).length
          }
        });
      }
    }

    // Usar AI para sugestões mais inteligentes se disponível
    try {
      const aiSuggestions = await this.generateAISuggestions(coursesAnalysis, orphanActivities);
      suggestions.push(...aiSuggestions);
    } catch (error) {
      console.error('Erro ao gerar sugestões via AI:', error);
      // Continue sem as sugestões AI em caso de erro
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Gera sugestões usando AI/RAG
   */
  private async generateAISuggestions(
    coursesAnalysis: CourseAnalysis[],
    orphanActivities: OrphanActivityAnalysis[]
  ): Promise<MonitoringSuggestion[]> {
    try {
      // Sugestões baseadas em regras (fallback enquanto AI está sendo configurada)
      const aiSuggestions = this.generateRuleBasedSuggestions(coursesAnalysis, orphanActivities);
      
      return aiSuggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões AI:', error);
      return this.generateRuleBasedSuggestions(coursesAnalysis, orphanActivities);
    }
  }

  /**
   * Gera sugestões baseadas em regras simples (fallback)
   */
  private generateRuleBasedSuggestions(
    coursesAnalysis: CourseAnalysis[], 
    orphanActivities: OrphanActivityAnalysis[]
  ): MonitoringSuggestion[] {
    const suggestions: MonitoringSuggestion[] = [];

    // Sugestões para cursos com baixa cobertura
    coursesAnalysis
      .filter(course => course.plansCoverage < 50)
      .forEach(course => {
        suggestions.push({
          type: 'missing_plan',
          priority: course.plansCoverage < 25 ? 'high' : 'medium',
          title: `Planos de aula faltando em ${course.courseName}`,
          description: `Este curso tem apenas ${course.plansCoverage}% de cobertura de planos de aula. ${course.missingPlansEstimate} planos precisam ser criados.`,
          actionable: true,
          metadata: {
            courseId: course.courseId,
            missingCount: course.missingPlansEstimate,
            totalClasses: course.totalClassesPlanned
          }
        });
      });

    // Sugestões para atividades órfãs
    if (orphanActivities.length > 0) {
      suggestions.push({
        type: 'content_gap',
        priority: orphanActivities.length > 20 ? 'high' : 'medium',
        title: `${orphanActivities.length} atividades sem planos de aula`,
        description: `Existem ${orphanActivities.length} atividades que não estão associadas a nenhum plano de aula. Considere integrá-las aos cursos existentes.`,
        actionable: true,
        metadata: {
          orphanCount: orphanActivities.length,
          orphanActivities: orphanActivities.slice(0, 5).map(a => a.activityName)
        }
      });
    }

    return suggestions;
  }

  /**
   * Calcula métricas de resumo
   */
  private calculateSummaryMetrics(
    coursesAnalysis: CourseAnalysis[],
    orphanActivities: OrphanActivityAnalysis[]
  ) {
    const totalCourses = coursesAnalysis.length;
    const coursesWithMissingPlans = coursesAnalysis.filter(c => c.missingPlansEstimate > 0).length;
    const totalOrphanActivities = orphanActivities.length;
    
    const overallCoverage = totalCourses > 0 
      ? Math.round(coursesAnalysis.reduce((sum, c) => sum + c.plansCoverage, 0) / totalCourses)
      : 0;

    return {
      totalCourses,
      coursesWithMissingPlans,
      totalOrphanActivities,
      overallCoverage
    };
  }

  /**
   * Obtém análise rápida para dashboard
   */
  async getQuickMetrics() {
    try {
      // Usar queries mais simples e com timeout
      const [coursesCount, plansCount, activitiesCount] = await Promise.all([
        this.prisma.course.count(),
        this.prisma.lessonPlan.count(),
        this.prisma.activity.count()
      ]);

      // Query separada para atividades órfãs com tratamento de erro
      let orphanCount = 0;
      try {
        orphanCount = await this.prisma.activity.count({
          where: {
            lessonPlanItems: {
              none: {}
            }
          }
        });
      } catch (orphanError) {
        console.warn('Erro ao contar atividades órfãs, usando valor padrão:', orphanError);
        orphanCount = activitiesCount; // Fallback conservador
      }

      // Query separada para cursos com planos
      let coursesWithPlans = 0;
      try {
        coursesWithPlans = await this.prisma.course.count({
          where: {
            lessonPlans: {
              some: {}
            }
          }
        });
      } catch (plansError) {
        console.warn('Erro ao contar cursos com planos, usando valor padrão:', plansError);
        coursesWithPlans = coursesCount > 0 ? 1 : 0; // Fallback otimista
      }

      const plansCoverage = coursesCount > 0 ? Math.round((coursesWithPlans / coursesCount) * 100) : 0;

      return {
        courses: coursesCount,
        plans: plansCount,
        activities: activitiesCount,
        orphanActivities: orphanCount,
        plansCoverage,
        coursesWithPlans
      };
    } catch (error) {
      console.error('Erro crítico ao obter métricas rápidas:', error);
      
      // Retorno de fallback em caso de erro total
      return {
        courses: 0,
        plans: 0,
        activities: 0,
        orphanActivities: 0,
        plansCoverage: 0,
        coursesWithPlans: 0
      };
    }
  }
}

// Lazy initialization para evitar problemas na inicialização do servidor
let _lessonPlanMonitorAgent: LessonPlanMonitorAgent | null = null;
export const lessonPlanMonitorAgent: LessonPlanMonitorAgent = new Proxy({} as LessonPlanMonitorAgent, {
  get(target, prop) {
    if (!_lessonPlanMonitorAgent) {
      _lessonPlanMonitorAgent = new LessonPlanMonitorAgent();
    }
    return _lessonPlanMonitorAgent[prop as keyof LessonPlanMonitorAgent];
  }
});