export default class TrainingAreasController {
  constructor() {
    this.init();
  }

  async init() {
    console.log('🏃 Initializing Training Areas Controller...');
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="create-training-area"]')) {
        this.openCreateForm();
      }
      
      if (e.target.matches('[data-action="edit-training-area"]')) {
        const areaId = e.target.dataset.id;
        this.openEditForm(areaId);
      }
      
      if (e.target.matches('[data-action="delete-training-area"]')) {
        const areaId = e.target.dataset.id;
        this.deleteTrainingArea(areaId);
      }
      
      if (e.target.matches('[data-action="save-training-area"]')) {
        e.preventDefault();
        this.saveTrainingArea();
      }
      
      if (e.target.matches('[data-action="cancel-training-area"]')) {
        this.closeForm();
      }
    });
  }

  async loadTrainingAreas(unitId) {
    if (!window.unitsModule || !window.unitsModule.api) {
      console.error('[TrainingAreasController] API not available');
      return;
    }

    try {
      // Use fetchWithStates pattern per AGENTS.md
      await window.unitsModule.api.fetchWithStates(`/api/training-areas?unitId=${unitId}`, {
        onSuccess: (data) => {
          this.renderTrainingAreas(data);
        },
        onEmpty: () => {
          this.renderTrainingAreas([]);
        },
        onError: (error) => {
          console.error('[TrainingAreasController] Error loading training areas:', error);
          if (window.app && window.app.handleError) {
            window.app.handleError(error, 'training-areas:load');
          }
          this.showError('Erro ao carregar áreas de treino');
        }
      });
    } catch (error) {
      console.error('[TrainingAreasController] Error loading training areas:', error);
      if (window.app && window.app.handleError) {
        window.app.handleError(error, 'training-areas:load');
      }
      this.showError('Erro ao carregar áreas de treino');
    }
  }

  renderTrainingAreas(trainingAreas) {
    const container = document.getElementById('training-areas-list');
    if (!container) return;

    if (!trainingAreas || trainingAreas.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-8">
          <div class="text-6xl mb-4">🏃</div>
          <h3 class="text-lg font-semibold text-gray-600 mb-2">Nenhuma área de treino cadastrada</h3>
          <p class="text-gray-500 mb-4">Crie a primeira área de treino para esta unidade</p>
          <button class="btn btn-primary" data-action="create-training-area">
            <i class="fas fa-plus mr-2"></i>
            Criar Área de Treino
          </button>
        </div>
      `;
      return;
    }

    const html = `
      <div class="training-areas-header mb-6">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">Áreas de Treino</h3>
          <button class="btn btn-primary" data-action="create-training-area">
            <i class="fas fa-plus mr-2"></i>
            Nova Área
          </button>
        </div>
      </div>
      
      <div class="training-areas-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${trainingAreas.map(area => this.renderTrainingAreaCard(area)).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  renderTrainingAreaCard(area) {
    const areaTypeLabels = {
      DOJO: '🥋 Dojo',
      OUTDOOR: '🌳 Externo',
      WEIGHT_ROOM: '🏋️ Musculação',
      CARDIO: '❤️ Cardio',
      CROSSTRAINING: '🔥 Cross Training',
      FUNCTIONAL: '⚡ Funcional',
      OTHER: '📍 Outro'
    };

    const flooringLabels = {
      TATAMI: 'Tatami',
      WOOD: 'Madeira',
      CONCRETE: 'Concreto',
      RUBBER: 'Borracha',
      SYNTHETIC: 'Sintético',
      GRASS: 'Grama',
      OTHER: 'Outro'
    };

    return `
      <div class="data-card-premium p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-800">${area.name}</h4>
            <p class="text-sm text-gray-600">${areaTypeLabels[area.areaType] || area.areaType}</p>
          </div>
          <div class="flex space-x-2">
            <button class="btn btn-sm btn-secondary" data-action="edit-training-area" data-id="${area.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete-training-area" data-id="${area.id}" title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        ${area.description ? `<p class="text-sm text-gray-600 mb-3">${area.description}</p>` : ''}
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">Capacidade:</span>
            <span class="text-gray-600">${area.capacity} pessoas</span>
          </div>
          ${area.flooring ? `
            <div>
              <span class="font-medium text-gray-700">Piso:</span>
              <span class="text-gray-600">${flooringLabels[area.flooring] || area.flooring}</span>
            </div>
          ` : ''}
          ${area.dimensions ? `
            <div class="col-span-2">
              <span class="font-medium text-gray-700">Dimensões:</span>
              <span class="text-gray-600">${area.dimensions}</span>
            </div>
          ` : ''}
        </div>
        
        ${area.equipment && area.equipment.length > 0 ? `
          <div class="mt-3">
            <span class="font-medium text-gray-700 text-sm">Equipamentos:</span>
            <div class="flex flex-wrap gap-1 mt-1">
              ${area.equipment.map(eq => `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${eq}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="mt-4 flex justify-between items-center">
          <span class="text-xs ${area.isActive ? 'text-green-600' : 'text-red-600'}">
            ${area.isActive ? '✅ Ativa' : '❌ Inativa'}
          </span>
          ${area._count ? `
            <span class="text-xs text-gray-500">
              ${area._count.classes + area._count.turmas} aulas/turmas
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  openCreateForm() {
    const unitId = this.getCurrentUnitId();
    if (!unitId) {
      this.showError('Unidade não identificada');
      return;
    }

    this.showForm({
      unitId,
      name: '',
      description: '',
      capacity: 20,
      areaType: 'DOJO',
      dimensions: '',
      equipment: [],
      flooring: 'TATAMI',
      isActive: true
    });
  }

  async openEditForm(areaId) {
    if (!window.unitsModule || !window.unitsModule.api) {
      console.error('[TrainingAreasController] API not available');
      return;
    }

    try {
      const response = await window.unitsModule.api.get(`/api/training-areas/${areaId}`);
      
      if (response.success) {
        this.showForm(response.data);
      } else {
        this.showError('Erro ao carregar área de treino');
      }
    } catch (error) {
      console.error('[TrainingAreasController] Error loading training area:', error);
      this.showError('Erro ao carregar área de treino');
    }
  }

  showForm(data = {}) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'training-area-modal';

    const areaTypeOptions = [
      { value: 'DOJO', label: '🥋 Dojo' },
      { value: 'OUTDOOR', label: '🌳 Externo' },
      { value: 'WEIGHT_ROOM', label: '🏋️ Musculação' },
      { value: 'CARDIO', label: '❤️ Cardio' },
      { value: 'CROSSTRAINING', label: '🔥 Cross Training' },
      { value: 'FUNCTIONAL', label: '⚡ Funcional' },
      { value: 'OTHER', label: '📍 Outro' }
    ];

    const flooringOptions = [
      { value: 'TATAMI', label: 'Tatami' },
      { value: 'WOOD', label: 'Madeira' },
      { value: 'CONCRETE', label: 'Concreto' },
      { value: 'RUBBER', label: 'Borracha' },
      { value: 'SYNTHETIC', label: 'Sintético' },
      { value: 'GRASS', label: 'Grama' },
      { value: 'OTHER', label: 'Outro' }
    ];

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div class="module-header-premium p-6 border-b">
          <h3 class="text-xl font-semibold text-gray-800">
            ${data.id ? 'Editar' : 'Nova'} Área de Treino
          </h3>
        </div>
        
        <form id="training-area-form" class="p-6 space-y-4">
          <input type="hidden" id="area-id" value="${data.id || ''}">
          <input type="hidden" id="unit-id" value="${data.unitId || ''}">
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input type="text" id="area-name" class="form-input w-full" 
                   value="${data.name || ''}" required maxlength="100">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Área *</label>
            <select id="area-type" class="form-select w-full" required>
              ${areaTypeOptions.map(option => `
                <option value="${option.value}" ${data.areaType === option.value ? 'selected' : ''}>
                  ${option.label}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea id="area-description" class="form-textarea w-full" rows="3">${data.description || ''}</textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Capacidade *</label>
              <input type="number" id="area-capacity" class="form-input w-full" 
                     value="${data.capacity || 20}" required min="1">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Piso</label>
              <select id="area-flooring" class="form-select w-full">
                <option value="">Selecione...</option>
                ${flooringOptions.map(option => `
                  <option value="${option.value}" ${data.flooring === option.value ? 'selected' : ''}>
                    ${option.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dimensões</label>
            <input type="text" id="area-dimensions" class="form-input w-full" 
                   value="${data.dimensions || ''}" placeholder="Ex: 10m x 8m">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Equipamentos</label>
            <textarea id="area-equipment" class="form-textarea w-full" rows="2" 
                      placeholder="Digite os equipamentos separados por vírgula">${Array.isArray(data.equipment) ? data.equipment.join(', ') : ''}</textarea>
          </div>
          
          <div class="flex items-center">
            <input type="checkbox" id="area-active" class="form-checkbox" ${data.isActive !== false ? 'checked' : ''}>
            <label for="area-active" class="ml-2 text-sm text-gray-700">Área ativa</label>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" class="btn btn-secondary" data-action="cancel-training-area">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" data-action="save-training-area">
              ${data.id ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeForm();
      }
    });
  }

  async saveTrainingArea() {
    const form = document.getElementById('training-area-form');
    if (!form) return;

    if (!window.unitsModule || !window.unitsModule.api) {
      console.error('[TrainingAreasController] API not available');
      return;
    }

    try {
      const areaId = document.getElementById('area-id').value;
      const equipmentText = document.getElementById('area-equipment').value;
      
      const data = {
        unitId: document.getElementById('unit-id').value,
        name: document.getElementById('area-name').value.trim(),
        areaType: document.getElementById('area-type').value,
        description: document.getElementById('area-description').value.trim() || undefined,
        capacity: parseInt(document.getElementById('area-capacity').value),
        flooring: document.getElementById('area-flooring').value || undefined,
        dimensions: document.getElementById('area-dimensions').value.trim() || undefined,
        equipment: equipmentText ? equipmentText.split(',').map(eq => eq.trim()).filter(eq => eq) : [],
        isActive: document.getElementById('area-active').checked
      };

      if (!data.name) {
        this.showError('Nome é obrigatório');
        return;
      }

      if (!data.capacity || data.capacity < 1) {
        this.showError('Capacidade deve ser maior que zero');
        return;
      }

      const response = areaId 
        ? await window.unitsModule.api.put(`/api/training-areas/${areaId}`, data)
        : await window.unitsModule.api.post('/api/training-areas', data);

      if (response.success) {
        this.closeForm();
        this.showSuccess(areaId ? 'Área de treino atualizada com sucesso!' : 'Área de treino criada com sucesso!');
        this.loadTrainingAreas(data.unitId);
      } else {
        this.showError(response.error || 'Erro ao salvar área de treino');
      }
    } catch (error) {
      console.error('[TrainingAreasController] Error saving training area:', error);
      this.showError('Erro ao salvar área de treino');
    }
  }

  async deleteTrainingArea(areaId) {
    if (!confirm('Tem certeza que deseja excluir esta área de treino?')) {
      return;
    }

    if (!window.unitsModule || !window.unitsModule.api) {
      console.error('[TrainingAreasController] API not available');
      return;
    }

    try {
      const response = await window.unitsModule.api.delete(`/api/training-areas/${areaId}`);
      
      if (response.success) {
        this.showSuccess('Área de treino excluída com sucesso!');
        const unitId = this.getCurrentUnitId();
        if (unitId) {
          this.loadTrainingAreas(unitId);
        }
      } else {
        this.showError(response.error || 'Erro ao excluir área de treino');
      }
    } catch (error) {
      console.error('[TrainingAreasController] Error deleting training area:', error);
      this.showError('Erro ao excluir área de treino');
    }
  }

  closeForm() {
    const modal = document.getElementById('training-area-modal');
    if (modal) {
      modal.remove();
    }
  }

  getCurrentUnitId() {
    // Try to get from URL or current context
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || document.querySelector('[data-unit-id]')?.dataset.unitId;
  }

  showError(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'success');
    } else {
      alert(message);
    }
  }
}
