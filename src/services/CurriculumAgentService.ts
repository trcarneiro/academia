import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { aiService } from './aiService';

/**
 * Curriculum Agent Service
 * 
 * Agente especialista em educação física e artes marciais (Krav Maga e Jiu Jitsu)
 * Responsável por criar e avaliar planos de curso e planos de aula baseados em dados reais
 */
export class CurriculumAgentService {
  private readonly SYSTEM_PROMPT = `Você é um educador físico especialista em preparação física e artes marciais, com profundo conhecimento em:

🥋 **Especialidades**:
- Krav Maga (defesa pessoal israelense)
- Jiu Jitsu Brasileiro (arte suave)
- Preparação física para atletas de combate
- Pedagogia esportiva e progressão técnica
- Fisiologia do exercício aplicada a artes marciais

👨‍🏫 **Sua Função**:
Você analisa e cria planos de curso e planos de aula otimizados, garantindo:
1. **Progressão Segura**: Evolução gradual respeitando capacidades físicas
2. **Equilíbrio Técnico**: Balanceamento entre posturas, golpes, defesas e condicionamento
3. **Periodização**: Distribuição adequada de intensidade e volume ao longo do tempo
4. **Especificidade**: Adaptação ao nível (faixa) e objetivos dos alunos
5. **Recuperação**: Intervalos adequados entre sessões intensas

📊 **Critérios de Avaliação**:
- Variedade de categorias de atividades (evitar monotonia)
- Repetições adequadas por técnica (mínimo para consolidação neuromuscular)
- Intensidade progressiva sem sobrecarga
- Checkpoints de avaliação bem distribuídos
- Alinhamento com sistema de graduação (graus e faixas)

🔍 **Análise Baseada em Dados**:
Você tem acesso aos dados reais da academia via ferramentas MCP:
- Cursos existentes e suas estruturas
- Planos de aula com atividades detalhadas
- Técnicas catalogadas por categoria
- Sistema de graduação e requisitos mínimos
- Histórico de execução de atividades por alunos

💡 **Estilo de Resposta**:
- Técnico porém didático
- Use emojis para facilitar visualização
- Forneça justificativas baseadas em princípios de treinamento esportivo
- Seja específico com números (repetições, séries, duração)
- Sugira ajustes incrementais ao invés de mudanças radicais

⚠️ **Restrições**:
- NUNCA sugira exercícios perigosos sem supervisão
- Sempre considere aquecimento e volta à calma
- Respeite limitações físicas e progressão gradual
- Mantenha foco nas modalidades Krav Maga e Jiu Jitsu`;

  /**
   * Analisa um curso completo e fornece recomendações
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

      // Calcular métricas
      const metrics = this.calculateCourseMetrics(course);

      // Preparar contexto para o agente
      const context = this.buildCourseContext(course, metrics);

      // Consultar agente de currículo
      const analysis = await aiService.chat(
        [
          {
            role: 'system',
            content: this.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Analise este curso de ${course.name} e forneça recomendações pedagógicas:\n\n${context}`
          }
        ],
        {
          model: 'gemini-1.5-pro', // Modelo mais avançado para análise complexa
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
   * Cria um novo plano de aula com assistência da IA
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

      // Verificar se já existe aula com este número
      const existingLesson = course.lessonPlans.find(l => l.lessonNumber === lessonNumber);
      if (existingLesson) {
        throw new Error(`Lesson ${lessonNumber} already exists for this course`);
      }

      // Buscar técnicas disponíveis
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
  "title": "Título da aula",
  "objectives": ["objetivo 1", "objetivo 2"],
  "activities": [
    {
      "techniqueId": "UUID da técnica",
      "techniqueName": "Nome da técnica",
      "category": "CATEGORIA",
      "repetitions": 20,
      "sets": 3,
      "duration": 10,
      "intensity": "MEDIUM",
      "notes": "Observações pedagógicas"
    }
  ],
  "pedagogicalNotes": "Notas gerais sobre a aula",
  "estimatedDuration": 60
}`
          }
        ],
        {
          model: 'gemini-1.5-pro',
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

      // Calcular métricas da aula
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
            content: `Avalie este plano de aula e forneça feedback detalhado:\n\n${context}`
          }
        ],
        {
          model: 'gemini-1.5-pro',
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
   * Calcula métricas do curso
   */
  private calculateCourseMetrics(course: any) {
    const totalLessons = course.lessonPlans.length;
    const totalActivities = course.lessonPlans.reduce(
      (sum: number, lesson: any) => sum + lesson.activities.length,
      0
    );
    
    // Distribuição por categoria
    const categoriesDistribution: Record<string, number> = {};
    course.lessonPlans.forEach((lesson: any) => {
      lesson.activities.forEach((activity: any) => {
        const category = activity.technique?.category || 'UNKNOWN';
        categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;
      });
    });

    // Repetições totais planejadas
    const totalRepetitions = course.lessonPlans.reduce(
      (sum: number, lesson: any) => sum + lesson.activities.reduce(
        (actSum: number, act: any) => actSum + (act.repetitions * act.sets),
        0
      ),
      0
    );

    // Distribuição de intensidade
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
   * Constrói contexto do curso para análise
   */
  private buildCourseContext(course: any, metrics: any) {
    return `📚 **Curso**: ${course.name}
🎯 **Nível**: ${course.level}
📝 **Descrição**: ${course.description || 'Não fornecida'}

📊 **Métricas Gerais**:
- Total de aulas: ${metrics.totalLessons}
- Total de atividades: ${metrics.totalActivities}
- Média de atividades por aula: ${metrics.averageActivitiesPerLesson.toFixed(1)}
- Repetições totais planejadas: ${metrics.totalRepetitions}
- Alunos matriculados: ${metrics.studentCount}

🏋️ **Distribuição por Categoria**:
${Object.entries(metrics.categoriesDistribution)
  .map(([cat, count]) => `- ${cat}: ${count} atividades`)
  .join('\n')}

⚡ **Distribuição de Intensidade**:
${Object.entries(metrics.intensityDistribution)
  .map(([int, count]) => `- ${int}: ${count} atividades`)
  .join('\n')}

🎓 **Sistema de Graduação**: ${metrics.hasGraduationSystem ? 'Sim' : 'Não'}
${course.graduationLevels.length > 0 ? `
Níveis configurados:
${course.graduationLevels.map((g: any) => `- ${g.name}: ${g.requiredProgressPercentage}% de progresso`).join('\n')}
` : ''}

${course.activityCategories.length > 0 ? `
📋 **Categorias de Atividades Definidas**:
${course.activityCategories.map((c: any) => `- ${c.name}: Mínimo ${c.minimumForGraduation} para graduação`).join('\n')}
` : ''}`;
  }

  /**
   * Constrói contexto para criação de plano de aula
   */
  private buildLessonContext(
    course: any,
    lessonNumber: number,
    techniques: any[],
    userRequirements?: string
  ) {
    return `📚 **Curso**: ${course.name} (${course.level})
📖 **Aula**: #${lessonNumber} de ${course.totalLessons || '?'}

${course.lessonPlans.length > 0 ? `
📝 **Aulas Anteriores** (últimas 3):
${course.lessonPlans.slice(-3).map((l: any) => 
  `- Aula ${l.lessonNumber}: ${l.title} (${l.activities.length} atividades)`
).join('\n')}
` : 'Esta é a primeira aula do curso.'}

🥋 **Técnicas Disponíveis**:
${techniques.slice(0, 20).map(t => `- ${t.name} (${t.category})`).join('\n')}
${techniques.length > 20 ? `\n... e mais ${techniques.length - 20} técnicas` : ''}

${course.activityCategories.length > 0 ? `
📋 **Categorias Obrigatórias**:
${course.activityCategories.map((c: any) => `- ${c.name}`).join(', ')}
` : ''}

${userRequirements ? `
💡 **Requisitos do Instrutor**:
${userRequirements}
` : ''}

Crie um plano de aula equilibrado, progressivo e pedagogicamente adequado.`;
  }

  /**
   * Constrói contexto para avaliação de plano de aula
   */
  private buildLessonEvaluationContext(lessonPlan: any, metrics: any) {
    return `📖 **Aula**: ${lessonPlan.title} (#${lessonPlan.lessonNumber})
📚 **Curso**: ${lessonPlan.course.name}
⏱️ **Duração Estimada**: ${lessonPlan.estimatedDuration || '?'} minutos

📊 **Métricas**:
- Total de atividades: ${metrics.totalActivities}
- Repetições totais: ${metrics.totalRepetitions}
- Duração total estimada: ${metrics.totalDuration} minutos

🏋️ **Atividades Planejadas**:
${lessonPlan.activities.map((a: any) => 
  `- ${a.technique?.name || 'Técnica não identificada'} (${a.technique?.category}): ${a.repetitions}x${a.sets} séries, ${a.duration}min, ${a.intensity}`
).join('\n')}

⚡ **Distribuição de Intensidade**:
${Object.entries(metrics.intensityDistribution)
  .map(([int, count]) => `- ${int}: ${count}`)
  .join('\n')}

🎯 **Categorias Cobertas**:
${Object.keys(metrics.categoriesDistribution).join(', ')}

${lessonPlan.pedagogicalNotes ? `
📝 **Notas Pedagógicas**: ${lessonPlan.pedagogicalNotes}
` : ''}`;
  }

  /**
   * Calcula métricas de um plano de aula
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
   * Calcula equilíbrio de distribuição
   */
  private calculateBalance(distribution: Record<string, number>): number {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    
    // Normalizar para 0-100 (quanto menor a variância, melhor o equilíbrio)
    return Math.max(0, 100 - Math.sqrt(variance) * 10);
  }

  /**
   * Calcula score geral do plano de aula
   */
  private calculateLessonScore(metrics: any): number {
    let score = 0;

    // Variedade de categorias (0-30 pontos)
    score += Math.min(30, metrics.categoryVariety * 5);

    // Equilíbrio de intensidade (0-30 pontos)
    score += Math.min(30, metrics.intensityBalance * 0.3);

    // Quantidade adequada de atividades (0-20 pontos)
    const activitiesScore = metrics.totalActivities >= 4 && metrics.totalActivities <= 8 ? 20 : 10;
    score += activitiesScore;

    // Duração adequada (0-20 pontos)
    const durationScore = metrics.totalDuration >= 45 && metrics.totalDuration <= 75 ? 20 : 10;
    score += durationScore;

    return Math.round(score);
  }

  /**
   * Parse da sugestão de plano de aula
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
   * Extrai recomendações da análise
   */
  private extractRecommendations(analysis: string): string[] {
    const recommendations: string[] = [];
    
    // Buscar por listas de recomendações
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
