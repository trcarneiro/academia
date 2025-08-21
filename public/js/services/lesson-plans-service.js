// Lesson Plans Service Module
import { api } from '../services/api-service.js';
import { showToast } from '../utils/toast.js';

class LessonPlansService {
  constructor() {
    this.baseURL = '/api/lesson-plans';
  }

  // Get all lesson plans with filters
  async getAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
      return await api.get(url);
    } catch (error) {
      showToast('Erro ao carregar planos de aula', 'error');
      throw error;
    }
  }

  // Get lesson plan by ID
  async getById(id) {
    try {
      return await api.get(`${this.baseURL}/${id}`);
    } catch (error) {
      showToast('Erro ao carregar plano de aula', 'error');
      throw error;
    }
  }

  // Create new lesson plan
  async create(data) {
    try {
      const result = await api.post(this.baseURL, data);
      showToast('Plano de aula criado com sucesso', 'success');
      return result;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar plano de aula';
      showToast(message, 'error');
      throw error;
    }
  }

  // Update lesson plan
  async update(id, data) {
    try {
      const result = await api.put(`${this.baseURL}/${id}`, data);
      showToast('Plano de aula atualizado com sucesso', 'success');
      return result;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao atualizar plano de aula';
      showToast(message, 'error');
      throw error;
    }
  }

  // Delete lesson plan
  async delete(id) {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      showToast('Plano de aula excluído com sucesso', 'success');
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao excluir plano de aula';
      showToast(message, 'error');
      throw error;
    }
  }

  // Get lesson plan activities
  async getActivities(id) {
    try {
      return await api.get(`${this.baseURL}/${id}/activities`);
    } catch (error) {
      showToast('Erro ao carregar atividades do plano', 'error');
      throw error;
    }
  }

  // Add activity to lesson plan
  async addActivity(lessonPlanId, activityId, segment, ord) {
    try {
      const result = await api.post(`${this.baseURL}/${lessonPlanId}/activities`, {
        activityId,
        segment,
        ord
      });
      showToast('Atividade adicionada ao plano', 'success');
      return result;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao adicionar atividade';
      showToast(message, 'error');
      throw error;
    }
  }

  // Remove activity from lesson plan
  async removeActivity(lessonPlanId, activityId) {
    try {
      await api.delete(`${this.baseURL}/${lessonPlanId}/activities/${activityId}`);
      showToast('Atividade removida do plano', 'success');
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao remover atividade';
      showToast(message, 'error');
      throw error;
    }
  }
}

export const lessonPlansService = new LessonPlansService();
