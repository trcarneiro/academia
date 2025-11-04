import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { aiService } from './aiService';

/**
 * Curriculum Agent Service
 * 
 * Agente especialista em educaÃ§Ã£o fÃ­sica e artes marciais (Krav Maga e Jiu Jitsu)
 * ResponsÃ¡vel por criar e avaliar planos de curso e planos de aula baseados em dados reais
 */
export class CurriculumAgentService {
  private readonly SYSTEM_PROMPT = `VocÃª Ã© um educador fÃ­sico especialista em preparaÃ§Ã£o fÃ­sica e artes marciais, com profundo conhecimento em:

ðŸ¥‹ **Especialidades**:
- Krav Maga (defesa pessoal israelense)
- Jiu Jitsu Brasileiro (arte suave)
- PreparaÃ§Ã£o fÃ­sica para atletas de combate
- Pedagogia esportiva e progressÃ£o tÃ©cnica
- Fisiologia do exercÃ­cio aplicada a artes marciais

ðŸ‘¨â€ðŸ« **Sua FunÃ§Ã£o**:
VocÃª analisa e cria planos de curso e planos de aula otimizados, garantindo:
1. **ProgressÃ£o Segura**: EvoluÃ§Ã£o gradual respeitando capacidades fÃ­sicas
2. **EquilÃ­brio TÃ©cnico**: Balanceamento entre posturas, golpes, defesas e condicionamento
3. **PeriodizaÃ§Ã£o**: DistribuiÃ§Ã£o adequada de intensidade e volume ao longo do tempo
4. **Especificidade**: AdaptaÃ§Ã£o ao nÃ­vel (faixa) e objetivos dos alunos
5. **RecuperaÃ§Ã£o**: Intervalos adequados entre sessÃµes intensas

ðŸ“Š **CritÃ©rios de AvaliaÃ§Ã£o**:
- Variedade de categorias de atividades (evitar monotonia)
- RepetiÃ§Ãµes adequadas por tÃ©cnica (mÃ­nimo para consolidaÃ§Ã£o neuromuscular)
- Intensidade progressiva sem sobrecarga
- Checkpoints de avaliaÃ§Ã£o bem distribuÃ­dos
- Alinhamento com sistema de graduaÃ§Ã£o (graus e faixas)

ðŸ” **AnÃ¡lise Baseada em Dados**:
VocÃª tem acesso aos dados reais da academia via ferramentas MCP:
- Cursos existentes e suas estruturas
- Planos de aula com atividades detalhadas
- TÃ©cnicas catalogadas por categoria
- Sistema de graduaÃ§Ã£o e requisitos mÃ­nimos
- HistÃ³rico de execuÃ§Ã£o de atividades por alunos

ðŸ’¡ **Estilo de Resposta**:
- TÃ©cnico porÃ©m didÃ¡tico
- Use emojis para facilitar visualizaÃ§Ã£o
- ForneÃ§a justificativas baseadas em princÃ­pios de treinamento esportivo
- Seja especÃ­fico com nÃºmeros (repetiÃ§Ãµes, sÃ©ries, duraÃ§Ã£o)
- Sugira ajustes incrementais ao invÃ©s de mudanÃ§as radicais

âš ï¸ **RestriÃ§Ãµes**:
- NUNCA sugira exercÃ­cios perigosos sem supervisÃ£o
- Sempre considere aquecimento e volta Ã  calma
- Respeite limitaÃ§Ãµes fÃ­sicas e progressÃ£o gradual
- Mantenha foco nas modalidades Krav Maga e Jiu Jitsu`;

  /**
   * Analisa um curso completo e fornece recomendaÃ§Ãµes
   */
  async analyzeCourse(courseId: string, organizationId: string) {
    try {
      logger.info(`Analyzing course ${courseId} for organization ${organizationId}`);

      // Buscar dados completos do curso
      const course = await prisma.course.findUnique({
        where: { id: courseId, organizationId },
        include: {
          graduationLevels: true,
          activityCategories: {
            include: {
              activities: true
            }
          },
          lessonPlans: {
            include: {
              activities: {
                include: {
                  technique: true
                }
              }
            },
            orderBy: { lessonNumber: 'asc' }
          },
          _count: {
            select: {
              students: true,
              lessonPlans: true
            }
          }
        }
      });

      if (!course) {
        throw new Error(`Course ${courseId} not found`);
      }

      // Calcular mÃ©tricas
      const metrics = this.calculateCourseMetrics(course);

      // Preparar contexto para o agente
      const context = this.buildCourseContext(course, metrics);

      // Consultar agente de currÃ­culo
      const analysis = await aiService.chat(
        [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Analise este curso de ${course.name} e forneÃ§a recomendaÃ§Ãµes pedagÃ³gicas:\n\n${context}`
          }
        ],
        {
          model: (process.env.GEMINI_MODEL || process.env.RAG_MODEL || 'gemini-2.5-pro'), // Modelo mais avanÃ§ado para anÃ¡lise complexa
          temperature: 0.7,
          maxTokens: 4096
        }
      );

      logger.info(`Course analysis completed for ${courseId}`);

      return {
        success: true,
        course: {
          id: course.id,
          name: course.name,
          level: course.level
        },
        metrics,
        analysis: analysis.choices[0].message.content,
        recommendations: this.extractRecommendations(analysis.choices[0].message.content)
      };

    } catch (error) {
      logger.error('Error analyzing course:', error);
      throw error;
    }
  }

  /**
   * Cria um novo plano de aula com assistÃªncia da IA
   */
  async createLessonPlan(
    courseId: string,
    lessonNumber: number,
    organizationId: string,
    userRequirements?: string
  ) {
    try {
      logger.info(`Creating lesson plan ${lessonNumber} for course ${courseId}`);

      // Buscar curso e aulas existentes
      const course = await prisma.course.findUnique({
        where: { id: courseId, organizationId },
        include: {
          lessonPlans: {
            orderBy: { lessonNumber: 'asc' }
          },
          activityCategories: {
            include: {
              activities: true
            }
          },
          graduationLevels: true
        }
      });

      if (!course) {
        throw new Error(`Course ${courseId} not found`);
      }

      // Verificar se jÃ¡ existe aula com este nÃºmero
      const existingLesson = course.lessonPlans.find(l => l.lessonNumber === lessonNumber);
      if (existingLesson) {
        throw new Error(`Lesson ${lessonNumber} already exists for this course`);
      }

      // Buscar tÃ©cnicas disponÃ­veis
      const techniques = await prisma.technique.findMany({
        where: { organizationId },
        orderBy: { category: 'asc' }
      });

      // Preparar contexto
      const context = this.buildLessonContext(course, lessonNumber, techniques, userRequirements);

      // Consultar agente
      const suggestion = await aiService.chat(
        [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Crie um plano de aula detalhado para:\n\n${context}\n\nFormate sua resposta em JSON com esta estrutura:
{
  "title": "TÃ­tulo da aula",
  "objectives": ["objetivo 1", "objetivo 2"],
  "activities": [
    {
      "techniqueId": "UUID da tÃ©cnica",
      "techniqueName": "Nome da tÃ©cnica",
      "category": "CATEGORIA",
      "repetitions": 20,
      "sets": 3,
      "duration": 10,
      "intensity": "MEDIUM",
      "notes": "ObservaÃ§Ãµes pedagÃ³gicas"
    }
  ],
  "pedagogicalNotes": "Notas gerais sobre a aula",
  "estimatedDuration": 60
}`
          }
        ],
        {
          model: (process.env.GEMINI_MODEL || process.env.RAG_MODEL || 'gemini-2.5-pro'),
          temperature: 0.8,
          maxTokens: 4096
        }
      );

      // Parse da resposta
      const lessonData = this.parseLessonSuggestion(suggestion.choices[0].message.content);

      return {
        success: true,
        suggestion: lessonData,
        raw: suggestion.choices[0].message.content
      };

    } catch (error) {
      logger.error('Error creating lesson plan:', error);
      throw error;
    }
  }

  /**
   * Avalia um plano de aula existente e sugere melhorias
   */
  async evaluateLessonPlan(lessonPlanId: string, organizationId: string) {
    try {
      logger.info(`Evaluating lesson plan ${lessonPlanId}`);

      const lessonPlan = await prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          activities: {
            include: {
              technique: true
            }
          },
          course: {
            include: {
              graduationLevels: true,
              activityCategories: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new Error(`Lesson plan ${lessonPlanId} not found`);
      }

      // Calcular mÃ©tricas da aula
      const metrics = this.calculateLessonMetrics(lessonPlan);

      // Preparar contexto
      const context = this.buildLessonEvaluationContext(lessonPlan, metrics);

      // Consultar agente
      const evaluation = await aiService.chat(
        [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Avalie este plano de aula e forneÃ§a feedback detalhado:\n\n${context}`
          }
        ],
        {
          model: (process.env.GEMINI_MODEL || process.env.RAG_MODEL || 'gemini-2.5-pro'),
          temperature: 0.7,
          maxTokens: 3072
        }
      );

      return {
        success: true,
        lessonPlan: {
          id: lessonPlan.id,
          title: lessonPlan.title,
          lessonNumber: lessonPlan.lessonNumber
        },
        metrics,
        evaluation: evaluation.choices[0].message.content,
        score: this.calculateLessonScore(metrics)
      };

    } catch (error) {
      logger.error('Error evaluating lesson plan:', error);
      throw error;
    }
  }

  /**
   * Calcula mÃ©tricas do curso
   */
  private calculateCourseMetrics(course: any) {
    const totalLessons = course.lessonPlans.length;
    const totalActivities = course.lessonPlans.reduce(
      (sum: number, lesson: any) => sum + lesson.activities.length,
      0
    );
    
    // DistribuiÃ§Ã£o por categoria
    const categoriesDistribution: Record<string, number> = {};
    course.lessonPlans.forEach((lesson: any) => {
      lesson.activities.forEach((activity: any) => {
        const category = activity.technique?.category || 'UNKNOWN';
        categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;
      });
    });

    // RepetiÃ§Ãµes totais planejadas
    const totalRepetitions = course.lessonPlans.reduce(
      (sum: number, lesson: any) => sum + lesson.activities.reduce(
        (actSum: number, act: any) => actSum + (act.repetitions * act.sets),
        0
      ),
      0
    );

    // DistribuiÃ§Ã£o de intensidade
    const intensityDistribution: Record<string, number> = {};
    course.lessonPlans.forEach((lesson: any) => {
      lesson.activities.forEach((activity: any) => {
        const intensity = activity.intensity || 'MEDIUM';
        intensityDistribution[intensity] = (intensityDistribution[intensity] || 0) + 1;
      });
    });

    return {
      totalLessons,
      totalActivities,
      averageActivitiesPerLesson: totalActivities / totalLessons,
      categoriesDistribution,
      totalRepetitions,
      intensityDistribution,
      hasGraduationSystem: course.graduationLevels.length > 0,
      studentCount: course._count.students
    };
  }

  /**
   * ConstrÃ³i contexto do curso para anÃ¡lise
   */
  private buildCourseContext(course: any, metrics: any) {
    return `ðŸ“š **Curso**: ${course.name}
ðŸŽ¯ **NÃ­vel**: ${course.level}
ðŸ“ **DescriÃ§Ã£o**: ${course.description || 'NÃ£o fornecida'}

ðŸ“Š **MÃ©tricas Gerais**:
- Total de aulas: ${metrics.totalLessons}
- Total de atividades: ${metrics.totalActivities}
- MÃ©dia de atividades por aula: ${metrics.averageActivitiesPerLesson.toFixed(1)}
- RepetiÃ§Ãµes totais planejadas: ${metrics.totalRepetitions}
- Alunos matriculados: ${metrics.studentCount}

ðŸ‹ï¸ **DistribuiÃ§Ã£o por Categoria**:
${Object.entries(metrics.categoriesDistribution)
  .map(([cat, count]) => `- ${cat}: ${count} atividades`)
  .join('\n')}

âš¡ **DistribuiÃ§Ã£o de Intensidade**:
${Object.entries(metrics.intensityDistribution)
  .map(([int, count]) => `- ${int}: ${count} atividades`)
  .join('\n')}

ðŸŽ“ **Sistema de GraduaÃ§Ã£o**: ${metrics.hasGraduationSystem ? 'Sim' : 'NÃ£o'}
${course.graduationLevels.length > 0 ? `
NÃ­veis configurados:
${course.graduationLevels.map((g: any) => `- ${g.name}: ${g.requiredProgressPercentage}% de progresso`).join('\n')}
` : ''}

${course.activityCategories.length > 0 ? `
ðŸ“‹ **Categorias de Atividades Definidas**:
${course.activityCategories.map((c: any) => `- ${c.name}: MÃ­nimo ${c.minimumForGraduation} para graduaÃ§Ã£o`).join('\n')}
` : ''}`;
  }

  /**
   * ConstrÃ³i contexto para criaÃ§Ã£o de plano de aula
   */
  private buildLessonContext(
    course: any,
    lessonNumber: number,
    techniques: any[],
    userRequirements?: string
  ) {
    return `ðŸ“š **Curso**: ${course.name} (${course.level})
ðŸ“– **Aula**: #${lessonNumber} de ${course.totalLessons || '?'}

${course.lessonPlans.length > 0 ? `
ðŸ“ **Aulas Anteriores** (Ãºltimas 3):
${course.lessonPlans.slice(-3).map((l: any) => 
  `- Aula ${l.lessonNumber}: ${l.title} (${l.activities.length} atividades)`
).join('\n')}
` : 'Esta Ã© a primeira aula do curso.'}

ðŸ¥‹ **TÃ©cnicas DisponÃ­veis**:
${techniques.slice(0, 20).map(t => `- ${t.name} (${t.category})`).join('\n')}
${techniques.length > 20 ? `\n... e mais ${techniques.length - 20} tÃ©cnicas` : ''}

${course.activityCategories.length > 0 ? `
ðŸ“‹ **Categorias ObrigatÃ³rias**:
${course.activityCategories.map((c: any) => `- ${c.name}`).join(', ')}
` : ''}

${userRequirements ? `
ðŸ’¡ **Requisitos do Instrutor**:
${userRequirements}
` : ''}

Crie um plano de aula equilibrado, progressivo e pedagogicamente adequado.`;
  }

  /**
   * ConstrÃ³i contexto para avaliaÃ§Ã£o de plano de aula
   */
  private buildLessonEvaluationContext(lessonPlan: any, metrics: any) {
    return `ðŸ“– **Aula**: ${lessonPlan.title} (#${lessonPlan.lessonNumber})
ðŸ“š **Curso**: ${lessonPlan.course.name}
â±ï¸ **DuraÃ§Ã£o Estimada**: ${lessonPlan.estimatedDuration || '?'} minutos

ðŸ“Š **MÃ©tricas**:
- Total de atividades: ${metrics.totalActivities}
- RepetiÃ§Ãµes totais: ${metrics.totalRepetitions}
- DuraÃ§Ã£o total estimada: ${metrics.totalDuration} minutos

ðŸ‹ï¸ **Atividades Planejadas**:
${lessonPlan.activities.map((a: any) => 
  `- ${a.technique?.name || 'TÃ©cnica nÃ£o identificada'} (${a.technique?.category}): ${a.repetitions}x${a.sets} sÃ©ries, ${a.duration}min, ${a.intensity}`
).join('\n')}

âš¡ **DistribuiÃ§Ã£o de Intensidade**:
${Object.entries(metrics.intensityDistribution)
  .map(([int, count]) => `- ${int}: ${count}`)
  .join('\n')}

ðŸŽ¯ **Categorias Cobertas**:
${Object.keys(metrics.categoriesDistribution).join(', ')}

${lessonPlan.pedagogicalNotes ? `
ðŸ“ **Notas PedagÃ³gicas**: ${lessonPlan.pedagogicalNotes}
` : ''}`;
  }

  /**
   * Calcula mÃ©tricas de um plano de aula
   */
  private calculateLessonMetrics(lessonPlan: any) {
    const totalActivities = lessonPlan.activities.length;
    const totalRepetitions = lessonPlan.activities.reduce(
      (sum: number, act: any) => sum + (act.repetitions * act.sets),
      0
    );
    const totalDuration = lessonPlan.activities.reduce(
      (sum: number, act: any) => sum + (act.duration || 0),
      0
    );

    const categoriesDistribution: Record<string, number> = {};
    const intensityDistribution: Record<string, number> = {};

    lessonPlan.activities.forEach((activity: any) => {
      const category = activity.technique?.category || 'UNKNOWN';
      categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;

      const intensity = activity.intensity || 'MEDIUM';
      intensityDistribution[intensity] = (intensityDistribution[intensity] || 0) + 1;
    });

    return {
      totalActivities,
      totalRepetitions,
      totalDuration,
      categoriesDistribution,
      intensityDistribution,
      categoryVariety: Object.keys(categoriesDistribution).length,
      intensityBalance: this.calculateBalance(intensityDistribution)
    };
  }

  /**
   * Calcula equilÃ­brio de distribuiÃ§Ã£o
   */
  private calculateBalance(distribution: Record<string, number>): number {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    
    // Normalizar para 0-100 (quanto menor a variÃ¢ncia, melhor o equilÃ­brio)
    return Math.max(0, 100 - Math.sqrt(variance) * 10);
  }

  /**
   * Calcula score geral do plano de aula
   */
  private calculateLessonScore(metrics: any): number {
    let score = 0;

    // Variedade de categorias (0-30 pontos)
    score += Math.min(30, metrics.categoryVariety * 5);

    // EquilÃ­brio de intensidade (0-30 pontos)
    score += Math.min(30, metrics.intensityBalance * 0.3);

    // Quantidade adequada de atividades (0-20 pontos)
    const activitiesScore = metrics.totalActivities >= 4 && metrics.totalActivities <= 8 ? 20 : 10;
    score += activitiesScore;

    // DuraÃ§Ã£o adequada (0-20 pontos)
    const durationScore = metrics.totalDuration >= 45 && metrics.totalDuration <= 75 ? 20 : 10;
    score += durationScore;

    return Math.round(score);
  }

  /**
   * Parse da sugestÃ£o de plano de aula
   */
  private parseLessonSuggestion(response: string) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: retornar resposta raw
      return { raw: response };
    } catch (error) {
      logger.warn('Failed to parse lesson suggestion as JSON:', error);
      return { raw: response };
    }
  }

  /**
   * Extrai recomendaÃ§Ãµes da anÃ¡lise
   */
  private extractRecommendations(analysis: string): string[] {
    const recommendations: string[] = [];
    
    // Buscar por listas de recomendaÃ§Ãµes
    const lines = analysis.split('\n');
    lines.forEach(line => {
      if (line.match(/^[-*]\s+/)) {
        recommendations.push(line.replace(/^[-*]\s+/, '').trim());
      }
    });

    return recommendations.slice(0, 10); // Top 10
  }
}

export const curriculumAgentService = new CurriculumAgentService();

