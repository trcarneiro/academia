export const ActivitiesService = {
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/api/activities?${query}` : '/api/activities';
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch activities');
    }
    
    return response.json();
  },

  async get(id) {
    // First try to fetch from activities
    let response = await fetch(`/api/activities/${id}`);
    
    if (!response.ok) {
      // If not found in activities, try techniques
      console.log(`🔍 Activity ${id} not found, trying techniques endpoint...`);
      response = await fetch(`/api/techniques/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Atividade não encontrada');
      }
      
      // Convert technique format to activity format
      const techniqueData = await response.json();
      if (techniqueData.success && techniqueData.data && techniqueData.data.technique) {
        const technique = techniqueData.data.technique;
        console.log(`✅ Found technique: ${technique.name}`);
        return {
          success: true,
          data: {
            id: technique.id,
            title: technique.name,
            type: 'TECHNIQUE',
            description: technique.description,
            difficulty: technique.difficulty,
            // Map other technique fields to activity fields
            shortDescription: technique.shortDescription,
            complexity: technique.complexity,
            objectives: technique.objectives,
            resources: technique.resources,
            assessmentCriteria: technique.assessmentCriteria,
            instructions: technique.instructions,
            tags: technique.tags,
            category: technique.category
          }
        };
      }
    }
    
    return response.json();
  },

  async create(activity) {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create activity');
    }
    
    return response.json();
  },

  async update(id, activity) {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activity)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update activity');
    }
    
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete activity');
    }
    
    return response.status === 204;
  },

  // Métodos auxiliares
  async getTypes() {
    const response = await fetch('/api/activities/types');
    
    if (!response.ok) {
      return this.getDefaultTypes();
    }
    
    return response.json();
  },

  async getStats() {
    const response = await fetch('/api/activities/stats');
    
    if (!response.ok) {
      return { total: 0, byType: [], byDifficulty: [] };
    }
    
    return response.json();
  },

  getDefaultTypes() {
    return {
      success: true,
      data: [
        { value: 'TECHNIQUE', label: 'Técnica', description: 'Ensino de técnicas específicas' },
        { value: 'STRETCH', label: 'Alongamento', description: 'Exercícios de flexibilidade' },
        { value: 'DRILL', label: 'Drill', description: 'Exercícios de repetição' },
        { value: 'EXERCISE', label: 'Exercício', description: 'Condicionamento físico' },
        { value: 'GAME', label: 'Jogo', description: 'Atividades lúdicas' },
        { value: 'CHALLENGE', label: 'Desafio', description: 'Testes e competições' },
        { value: 'ASSESSMENT', label: 'Avaliação', description: 'Testes de progresso' }
      ]
    };
  }
};