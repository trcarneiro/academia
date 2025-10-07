import { FastifyInstance } from 'fastify';
import { TurmasController } from '@/controllers/turmasController';

export default async function turmasRoutes(fastify: FastifyInstance) {
  const turmasController = new TurmasController();

  // CRUD Turmas
  fastify.get('/turmas', turmasController.list.bind(turmasController));
  fastify.get('/turmas/:id', turmasController.get.bind(turmasController));
  fastify.post('/turmas', turmasController.create.bind(turmasController));
  fastify.put('/turmas/:id', turmasController.update.bind(turmasController));
  fastify.delete('/turmas/:id', turmasController.delete.bind(turmasController));

  // Gestão de cronograma
  fastify.post('/turmas/:id/schedule', turmasController.generateSchedule.bind(turmasController));
  fastify.get('/turmas/:id/lessons', turmasController.getLessons.bind(turmasController));
  fastify.put('/turmas/:id/lessons/:lessonId', turmasController.updateLessonStatus.bind(turmasController));

  // Gestão de alunos
  fastify.get('/turmas/:id/students', turmasController.getStudents.bind(turmasController));
  fastify.post('/turmas/:id/students', turmasController.addStudent.bind(turmasController));
  fastify.delete('/turmas/:id/students/:studentId', turmasController.removeStudent.bind(turmasController));

  // Gestão de cursos da turma
  fastify.get('/turmas/:id/courses', turmasController.getTurmaCourses.bind(turmasController));
  fastify.post('/turmas/:id/courses', turmasController.addCourseToTurma.bind(turmasController));
  fastify.delete('/turmas/:id/courses/:courseId', turmasController.removeCourseFromTurma.bind(turmasController));

  // Frequência e relatórios
  fastify.get('/turmas/:id/attendance', turmasController.getAttendance.bind(turmasController));
  fastify.post('/turmas/:id/attendance', turmasController.markAttendance.bind(turmasController));
  fastify.get('/turmas/:id/reports', turmasController.getReports.bind(turmasController));

  // Busca e filtros
  fastify.get('/turmas/search', turmasController.search.bind(turmasController));
  fastify.get('/turmas/by-instructor/:instructorId', turmasController.getByInstructor.bind(turmasController));

  // Operação administrativa: limpar datas de término de todas as turmas
  fastify.post('/turmas/clear-end-dates', turmasController.clearAllEndDates.bind(turmasController));
}
