/**
 * 📋 Lesson Plan Activities Component
 * Gerenciamento de atividades do plano de aula com rastreamento de execução
 * 
 * Features:
 * - Adicionar/editar/remover atividades
 * - Campos: repetitionsPerClass, intensityMultiplier, minimumForGraduation
 * - Drag and drop para reordenação
 * - Validação de dados
 */

export class LessonPlanActivitiesComponent {
  constructor(api) {
    this.api = api;
    this.lessonPlanId = null;
    this.activities = [];
    this.availableActivities = [];
    this.container = null;
  }

  /**
   * Inicializar componente
   */
  async init(lessonPlanId, containerElement) {
    this.lessonPlanId = lessonPlanId;
    this.container = containerElement;

    await this.loadActivities();
    await this.loadAvailableActivities();
    this.render();
  }

  /**
   * Carregar atividades do plano
   */
  async loadActivities() {
    try {
      const response = await this.api.get(`/lesson-plans/${this.lessonPlanId}/activities`);
      this.activities = response.data || [];
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      this.activities = [];
    }
  }

  /**
   * Carregar biblioteca de atividades disponíveis
   */
  async loadAvailableActivities() {
    try {
      const response = await this.api.get('/activities');
      this.availableActivities = response.data || [];
    } catch (error) {
      console.error('Erro ao carregar atividades disponíveis:', error);
      this.availableActivities = [];
    }
  }

  /**
   * Renderizar componente
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="lesson-activities-container">
        <div class="activities-header">
          <h3>📋 Atividades do Plano de Aula</h3>
          <button class="btn-primary" onclick="lessonPlanActivities.showAddActivityModal()">
            <i class="fas fa-plus"></i> Adicionar Atividade
          </button>
        </div>

        <div class="activities-description">
          <p>
            <strong>Rastreamento de Execução:</strong> Configure quantas repetições desta atividade 
            serão executadas em cada aula e os requisitos para graduação.
          </p>
        </div>

        ${this.activities.length === 0 ? this.renderEmptyState() : this.renderActivitiesList()}

        <!-- Add Activity Modal -->
        <div id="add-activity-modal" class="modal-overlay" style="display: none;">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h2>Adicionar Atividade ao Plano</h2>
              <button class="modal-close" onclick="lessonPlanActivities.closeAddActivityModal()">×</button>
            </div>
            <div class="modal-body">
              ${this.renderActivityForm()}
            </div>
          </div>
        </div>

        <!-- Edit Activity Modal -->
        <div id="edit-activity-modal" class="modal-overlay" style="display: none;">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h2>Editar Atividade</h2>
              <button class="modal-close" onclick="lessonPlanActivities.closeEditActivityModal()">×</button>
            </div>
            <div class="modal-body" id="edit-activity-form-container">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Lista de atividades
   */
  renderActivitiesList() {
    return `
      <div class="activities-list" id="activities-list">
        ${this.activities.map((activity, index) => this.renderActivityCard(activity, index)).join('')}
      </div>
    `;
  }

  /**
   * Card de atividade individual
   */
  renderActivityCard(activity, index) {
    const intensityMultiplier = activity.intensityMultiplier || 1.0;
    const totalReps = Math.round((activity.repetitionsPerClass || 0) * intensityMultiplier);
    const isRequired = activity.minimumForGraduation && activity.minimumForGraduation > 0;

    return `
      <div class="activity-card" data-activity-id="${activity.id}" data-index="${index}">
        <div class="activity-drag-handle" title="Arrastar para reordenar">
          <i class="fas fa-grip-vertical"></i>
        </div>

        <div class="activity-content">
          <div class="activity-header-row">
            <div class="activity-title">
              <span class="activity-order">#${activity.ord || index + 1}</span>
              <h4>${activity.activity?.name || 'Atividade sem nome'}</h4>
              ${isRequired ? '<span class="activity-badge required">Obrigatória</span>' : ''}
            </div>
            <div class="activity-actions">
              <button class="btn-icon" onclick="lessonPlanActivities.editActivity(${index})" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-danger" onclick="lessonPlanActivities.deleteActivity(${index})" title="Remover">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="activity-stats-grid">
            <div class="activity-stat">
              <div class="stat-icon" style="background: #3B82F620; color: #3B82F6;">
                🔢
              </div>
              <div class="stat-info">
                <div class="stat-label">Repetições/Aula</div>
                <div class="stat-value">${activity.repetitionsPerClass || 0}</div>
              </div>
            </div>

            <div class="activity-stat">
              <div class="stat-icon" style="background: #F59E0B20; color: #F59E0B;">
                ⚡
              </div>
              <div class="stat-info">
                <div class="stat-label">Intensidade</div>
                <div class="stat-value">${intensityMultiplier.toFixed(1)}x</div>
              </div>
            </div>

            <div class="activity-stat">
              <div class="stat-icon" style="background: #10B98120; color: #10B981;">
                📊
              </div>
              <div class="stat-info">
                <div class="stat-label">Total Efetivo</div>
                <div class="stat-value">${totalReps} reps</div>
              </div>
            </div>

            ${isRequired ? `
              <div class="activity-stat">
                <div class="stat-icon" style="background: #EF444420; color: #EF4444;">
                  🎯
                </div>
                <div class="stat-info">
                  <div class="stat-label">Mínimo Graduação</div>
                  <div class="stat-value">${activity.minimumForGraduation}</div>
                </div>
              </div>
            ` : ''}
          </div>

          ${activity.notes ? `
            <div class="activity-notes">
              <i class="fas fa-sticky-note"></i>
              ${activity.notes}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Formulário de atividade
   */
  renderActivityForm(activityData = null) {
    const isEdit = !!activityData;
    const activity = activityData || {};

    return `
      <form id="activity-form" class="activity-form">
        <!-- Seleção de Atividade -->
        <div class="form-group">
          <label for="activity-select" class="form-label required">
            <i class="fas fa-tasks"></i> Atividade
          </label>
          <select id="activity-select" name="activityId" class="form-control" required ${isEdit ? 'disabled' : ''}>
            <option value="">Selecione uma atividade...</option>
            ${this.availableActivities.map(a => `
              <option value="${a.id}" ${activity.activityId === a.id ? 'selected' : ''}>
                ${a.name}
              </option>
            `).join('')}
          </select>
          <small class="form-help">Técnica ou exercício que será executado nesta aula</small>
        </div>

        <!-- Repetitions Per Class -->
        <div class="form-group">
          <label for="repetitions-per-class" class="form-label required">
            <i class="fas fa-redo"></i> Repetições por Aula
          </label>
          <div class="input-with-addon">
            <input 
              type="number" 
              id="repetitions-per-class" 
              name="repetitionsPerClass" 
              class="form-control"
              value="${activity.repetitionsPerClass || 10}"
              min="1"
              max="1000"
              step="1"
              required
              oninput="lessonPlanActivities.updateTotalReps()"
            />
            <span class="input-addon">reps</span>
          </div>
          <small class="form-help">
            Quantas vezes esta atividade será executada durante a aula
          </small>
        </div>

        <!-- Intensity Multiplier -->
        <div class="form-group">
          <label for="intensity-multiplier" class="form-label">
            <i class="fas fa-bolt"></i> Multiplicador de Intensidade
          </label>
          <div class="intensity-slider-container">
            <input 
              type="range" 
              id="intensity-multiplier" 
              name="intensityMultiplier" 
              class="intensity-slider"
              value="${activity.intensityMultiplier || 1.0}"
              min="0.5"
              max="2.5"
              step="0.1"
              oninput="lessonPlanActivities.updateIntensityLabel(); lessonPlanActivities.updateTotalReps()"
            />
            <div class="intensity-markers">
              <span class="marker">0.5x<br/><small>Leve</small></span>
              <span class="marker">1.0x<br/><small>Normal</small></span>
              <span class="marker">1.5x<br/><small>Forte</small></span>
              <span class="marker">2.0x<br/><small>Intenso</small></span>
              <span class="marker">2.5x<br/><small>Máximo</small></span>
            </div>
          </div>
          <div class="intensity-display">
            <span class="intensity-value" id="intensity-value">${(activity.intensityMultiplier || 1.0).toFixed(1)}x</span>
            <span class="intensity-description" id="intensity-description">
              ${this.getIntensityDescription(activity.intensityMultiplier || 1.0)}
            </span>
          </div>
          <small class="form-help">
            Ajuste a intensidade desta atividade (afeta o total de repetições efetivas)
          </small>
        </div>

        <!-- Total Effective Repetitions (Calculated) -->
        <div class="form-group">
          <div class="calculated-field">
            <div class="calculated-icon">📊</div>
            <div class="calculated-content">
              <div class="calculated-label">Repetições Efetivas</div>
              <div class="calculated-value" id="total-effective-reps">
                ${Math.round((activity.repetitionsPerClass || 10) * (activity.intensityMultiplier || 1.0))}
              </div>
              <div class="calculated-formula">
                = repetitions × multiplier
              </div>
            </div>
          </div>
        </div>

        <!-- Minimum For Graduation (Optional) -->
        <div class="form-group">
          <label for="minimum-graduation" class="form-label">
            <i class="fas fa-graduation-cap"></i> Mínimo para Graduação (Opcional)
          </label>
          <div class="input-with-addon">
            <input 
              type="number" 
              id="minimum-graduation" 
              name="minimumForGraduation" 
              class="form-control"
              value="${activity.minimumForGraduation || ''}"
              min="0"
              max="10000"
              step="1"
              placeholder="Ex: 50"
            />
            <span class="input-addon">reps totais</span>
          </div>
          <small class="form-help">
            Total de repetições que o aluno precisa dominar para graduar de faixa. 
            Deixe em branco se não for obrigatório.
          </small>
        </div>

        <!-- Order (for editing) -->
        ${isEdit ? `
          <div class="form-group">
            <label for="activity-order" class="form-label">
              <i class="fas fa-sort"></i> Ordem na Aula
            </label>
            <input 
              type="number" 
              id="activity-order" 
              name="ord" 
              class="form-control"
              value="${activity.ord || 0}"
              min="0"
              step="1"
            />
            <small class="form-help">
              Sequência em que esta atividade aparece no plano de aula
            </small>
          </div>
        ` : ''}

        <!-- Notes -->
        <div class="form-group">
          <label for="activity-notes" class="form-label">
            <i class="fas fa-sticky-note"></i> Observações
          </label>
          <textarea 
            id="activity-notes" 
            name="notes" 
            class="form-control"
            rows="3"
            placeholder="Ex: Focar na postura, velocidade moderada, etc."
          >${activity.notes || ''}</textarea>
          <small class="form-help">
            Notas adicionais para o instrutor (opcional)
          </small>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-secondary" 
            onclick="lessonPlanActivities.${isEdit ? 'closeEditActivityModal' : 'closeAddActivityModal'}()"
          >
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
            ${isEdit ? 'Salvar Alterações' : 'Adicionar Atividade'}
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Estado vazio
   */
  renderEmptyState() {
    return `
      <div class="empty-state-inline">
        <div class="empty-icon">📋</div>
        <h3>Nenhuma atividade adicionada</h3>
        <p>Adicione atividades para definir o conteúdo desta aula</p>
        <button class="btn-primary" onclick="lessonPlanActivities.showAddActivityModal()">
          <i class="fas fa-plus"></i> Adicionar Primeira Atividade
        </button>
      </div>
    `;
  }

  /**
   * Anexar event listeners
   */
  attachEventListeners() {
    // Form submission
    const addForm = document.getElementById('activity-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddActivity(e);
      });
    }

    // Drag and drop (futuro)
    this.setupDragAndDrop();
  }

  /**
   * Setup drag and drop
   */
  setupDragAndDrop() {
    // TODO: Implement drag and drop reordering
    console.log('🎯 Drag and drop setup (future feature)');
  }

  /**
   * Mostrar modal de adicionar
   */
  showAddActivityModal() {
    const modal = document.getElementById('add-activity-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Reset form
      const form = document.getElementById('activity-form');
      if (form) form.reset();
      this.updateTotalReps();
    }
  }

  /**
   * Fechar modal de adicionar
   */
  closeAddActivityModal() {
    const modal = document.getElementById('add-activity-modal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * Mostrar modal de editar
   */
  editActivity(index) {
    const activity = this.activities[index];
    if (!activity) return;

    const modal = document.getElementById('edit-activity-modal');
    const formContainer = document.getElementById('edit-activity-form-container');
    
    if (modal && formContainer) {
      formContainer.innerHTML = this.renderActivityForm(activity);
      modal.style.display = 'flex';

      // Attach edit form submission
      const editForm = formContainer.querySelector('#activity-form');
      if (editForm) {
        editForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleEditActivity(index, e);
        });
      }
    }
  }

  /**
   * Fechar modal de editar
   */
  closeEditActivityModal() {
    const modal = document.getElementById('edit-activity-modal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * Adicionar atividade
   */
  async handleAddActivity(event) {
    const formData = new FormData(event.target);
    const data = {
      lessonPlanId: this.lessonPlanId,
      activityId: formData.get('activityId'),
      repetitionsPerClass: parseInt(formData.get('repetitionsPerClass')) || 1,
      intensityMultiplier: parseFloat(formData.get('intensityMultiplier')) || 1.0,
      minimumForGraduation: formData.get('minimumForGraduation') ? 
        parseInt(formData.get('minimumForGraduation')) : null,
      ord: this.activities.length,
      notes: formData.get('notes') || null
    };

    try {
      await this.api.post('/lesson-plan-activities', data);
      await this.loadActivities();
      this.render();
      this.closeAddActivityModal();
      window.app?.showToast?.('Atividade adicionada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
      window.app?.handleError?.(error, { context: 'addActivity' });
    }
  }

  /**
   * Editar atividade
   */
  async handleEditActivity(index, event) {
    const activity = this.activities[index];
    const formData = new FormData(event.target);
    
    const data = {
      repetitionsPerClass: parseInt(formData.get('repetitionsPerClass')) || 1,
      intensityMultiplier: parseFloat(formData.get('intensityMultiplier')) || 1.0,
      minimumForGraduation: formData.get('minimumForGraduation') ? 
        parseInt(formData.get('minimumForGraduation')) : null,
      ord: parseInt(formData.get('ord')) || activity.ord,
      notes: formData.get('notes') || null
    };

    try {
      await this.api.patch(`/lesson-plan-activities/${activity.id}`, data);
      await this.loadActivities();
      this.render();
      this.closeEditActivityModal();
      window.app?.showToast?.('Atividade atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao editar atividade:', error);
      window.app?.handleError?.(error, { context: 'editActivity' });
    }
  }

  /**
   * Deletar atividade
   */
  async deleteActivity(index) {
    const activity = this.activities[index];
    
    if (!confirm(`Remover "${activity.activity?.name}" do plano de aula?`)) {
      return;
    }

    try {
      await this.api.delete(`/lesson-plan-activities/${activity.id}`);
      await this.loadActivities();
      this.render();
      window.app?.showToast?.('Atividade removida com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      window.app?.handleError?.(error, { context: 'deleteActivity' });
    }
  }

  /**
   * Atualizar label de intensidade
   */
  updateIntensityLabel() {
    const slider = document.getElementById('intensity-multiplier');
    const valueDisplay = document.getElementById('intensity-value');
    const descriptionDisplay = document.getElementById('intensity-description');

    if (slider && valueDisplay && descriptionDisplay) {
      const value = parseFloat(slider.value);
      valueDisplay.textContent = `${value.toFixed(1)}x`;
      descriptionDisplay.textContent = this.getIntensityDescription(value);
    }
  }

  /**
   * Atualizar total de reps calculado
   */
  updateTotalReps() {
    const repsInput = document.getElementById('repetitions-per-class');
    const intensityInput = document.getElementById('intensity-multiplier');
    const totalDisplay = document.getElementById('total-effective-reps');

    if (repsInput && intensityInput && totalDisplay) {
      const reps = parseInt(repsInput.value) || 0;
      const intensity = parseFloat(intensityInput.value) || 1.0;
      const total = Math.round(reps * intensity);
      totalDisplay.textContent = total;
    }
  }

  /**
   * Descrição da intensidade
   */
  getIntensityDescription(value) {
    if (value < 0.7) return '💤 Ritmo muito leve';
    if (value < 1.0) return '🚶 Ritmo leve';
    if (value === 1.0) return '🏃 Ritmo normal';
    if (value <= 1.5) return '💪 Ritmo forte';
    if (value <= 2.0) return '🔥 Ritmo intenso';
    return '⚡ Ritmo máximo';
  }
}

// Expor globalmente para uso inline
window.LessonPlanActivitiesComponent = LessonPlanActivitiesComponent;
