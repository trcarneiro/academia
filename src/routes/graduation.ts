import { FastifyInstance } from 'fastify';
import { GraduationController } from '@/controllers/graduationController';

/**
 * Rotas para módulo de graduação
 * Prefix: /api/graduation
 */
export default async function graduationRoutes(fastify: FastifyInstance) {
  /**
   * GET /students
   * Lista estudantes com progresso agregado
   * 
   * Query params:
   * - organizationId (required)
   * - courseId (optional)
   * - turmaId (optional)
   * - startDate (optional)
   * - endDate (optional)
   * - status (optional): active | inactive | all
   */
  fastify.get('/students', GraduationController.listStudents);

  /**
   * GET /student/:id/progress
   * Busca progresso detalhado de um estudante específico (para modal)
   * 
   * Params:
   * - id (required): Student ID
   * 
   * Query params:
   * - courseId (optional): Se não fornecido, usa o primeiro curso matriculado
   */
  fastify.get('/student/:id/progress', GraduationController.getStudentProgress);

  /**
   * GET /progress/:studentId
   * Busca progresso detalhado de um estudante (DEPRECATED - usar /student/:id/progress)
   * 
   * Params:
   * - studentId (required)
   * 
   * Query params:
   * - courseId (optional)
   */
  fastify.get('/progress/:studentId', GraduationController.getStudentProgress);

  /**
   * POST /manual-registration
   * Registra manualmente progresso quantitativo + qualitativo
   * 
   * Body:
   * - studentId (required)
   * - courseId (required)
   * - lessonNumber (required)
   * - activityName (required)
   * - completedReps (required)
   * - targetReps (required)
   * - rating (optional): 1-5
   * - notes (optional)
   * - instructorId (optional)
   */
  fastify.post('/manual-registration', GraduationController.createManualRegistration);

  /**
   * PATCH /activity/:progressId
   * Atualiza apenas repetições de uma atividade existente
   * 
   * Params:
   * - progressId (required)
   * 
   * Body:
   * - completedReps (optional)
   * - targetReps (optional)
   */
  fastify.patch('/activity/:progressId', GraduationController.updateActivity);

  /**
   * POST /save-progress
   * Salva progresso completo de um aluno (múltiplas atividades)
   * 
   * Body:
   * - studentId (required)
   * - courseId (required)
   * - activities (required): Array<{
   *     lessonNumber,
   *     activityName,
   *     completedReps,
   *     targetReps,
   *     rating?,
   *     notes?
   *   }>
   * - instructorId (optional)
   */
  fastify.post('/save-progress', GraduationController.saveProgress);

  /**
   * GET /requirements
   * Busca requisitos de graduação de um curso
   * 
   * Query params:
   * - courseId (required)
   * - beltLevel (optional)
   */
  fastify.get('/requirements', GraduationController.getCourseRequirements);

  /**
   * GET /export
   * Exporta relatório de graduação
   * 
   * Query params:
   * - organizationId (required)
   * - courseId (optional)
   * - format (optional): csv | pdf (default: csv)
   */
  fastify.get('/export', GraduationController.exportReport);

  /**
   * PATCH /student/:studentId/activity/:activityId
   * Atualiza progresso de uma atividade específica (INLINE EDIT)
   * 
   * Params:
   * - studentId (required): ID do aluno
   * - activityId (required): ID da LessonPlanActivity
   * 
   * Body:
   * - quantitativeProgress (optional): Número de repetições completadas
   * - qualitativeRating (optional): Avaliação 1-5 estrelas
   * - notes (optional): Observações do instrutor
   */
  fastify.patch('/student/:studentId/activity/:activityId', GraduationController.updateStudentActivity);
}
