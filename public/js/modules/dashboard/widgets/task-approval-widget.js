/**
 * Task Approval Widget para Dashboard
 * 
 * Exibe tasks pendentes de aprovação criadas por agentes.
 * Permite aprovar ou rejeitar diretamente do dashboard.
 */

const TaskApprovalWidget = {
  container: null,
  widgetAPI: null,
  tasks: [],
  refreshInterval: null,
  REFRESH_INTERVAL_MS: 30000, // 30 segundos

  async init(container) {
    console.log('📋 [Task Approval Widget] Initializing...');
    this.container = container;

    // Inicializar API
    await this.initializeAPI();

    // Carregar tasks
    await this.loadTasks();

    // Renderizar
    this.render();

    // Setup de eventos
    this.setupEvents();

    // Auto-refresh a cada 30s
    this.startAutoRefresh();

    console.log('✅ [Task Approval Widget] Initialized');
  },

  async initializeAPI() {
    // Aguardar API client estar disponível
    if (typeof window.createModuleAPI === 'undefined') {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (typeof window.createModuleAPI !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.widgetAPI = window.createModuleAPI('TaskApprovalWidget');
  },

  async loadTasks() {
    try {
      console.log('[Task Approval Widget] Loading tasks...');
      await this.widgetAPI.fetchWithStates('/api/agent-tasks?approvalStatus=PENDING&limit=5', {
        loadingElement: this.container?.querySelector('.widget-content'),
        onSuccess: (data) => {
          console.log('[Task Approval Widget] Tasks loaded:', data);
          // fetchWithStates já extrai result.data, então data é o array direto
          this.tasks = Array.isArray(data) ? data : [];
          console.log('[Task Approval Widget] Tasks array:', this.tasks);
          this.render();
        },
        onEmpty: () => {
          this.tasks = [];
          this.render();
        },
        onError: (error) => {
          console.error('[Task Approval Widget] Error loading tasks:', error);
          this.showError(error);
        }
      });
    } catch (error) {
      console.error('[Task Approval Widget] Error loading tasks:', error);
      this.showError(error);
    }
  },

  render() {
    if (!this.container) {
      console.warn('[Task Approval Widget] No container provided');
      return;
    }

    const pendingCount = this.tasks.length;
    console.log(`[Task Approval Widget] Rendering ${pendingCount} tasks...`);

    this.container.innerHTML = `
      <div class="task-approval-widget">
        <div class="widget-header">
          <div class="widget-title">
            <h3>🤖 Tarefas Pendentes</h3>
            ${pendingCount > 0 ? `<span class="pending-badge pulse">${pendingCount}</span>` : ''}
          </div>
          <button class="btn-refresh" onclick="window.taskApprovalWidget.loadTasks()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
          </button>
        </div>

        <div class="widget-content">
          ${this.renderTasks()}
        </div>

        ${pendingCount > 0 ? `
          <div class="widget-footer">
            <a href="#agent-tasks" class="btn-view-all">
              Ver todas as ${pendingCount} tarefas →
            </a>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderTasks() {
    if (this.tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <p>Nenhuma tarefa pendente</p>
          <small>Os agentes estão trabalhando normalmente</small>
        </div>
      `;
    }

    return this.tasks.map(task => this.renderTaskCard(task)).join('');
  },

  renderTaskCard(task) {
    const categoryColors = {
      'DATABASE_CHANGE': '#ef4444',
      'WHATSAPP_MESSAGE': '#10b981',
      'EMAIL': '#3b82f6',
      'SMS': '#8b5cf6',
      'MARKETING': '#f59e0b',
      'BILLING': '#ec4899',
      'ENROLLMENT': '#06b6d4',
    };

    const priorityIcons = {
      'URGENT': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢',
    };

    const categoryColor = categoryColors[task.category] || '#64748b';
    const priorityIcon = priorityIcons[task.priority] || '🟡';

    return `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-header">
          <div class="task-meta">
            <span class="category-badge" style="background-color: ${categoryColor}20; color: ${categoryColor};">
              ${this.formatCategory(task.category)}
            </span>
            <span class="priority-badge">${priorityIcon} ${task.priority}</span>
          </div>
          <span class="task-time">${this.formatTime(task.createdAt)}</span>
        </div>

        <div class="task-body">
          <h4>${task.title}</h4>
          <p>${task.description}</p>

          ${task.agent ? `
            <div class="task-agent">
              <span class="agent-icon">🤖</span>
              <span>${task.agent.name}</span>
            </div>
          ` : ''}
        </div>

        <div class="task-actions">
          <button class="btn-approve" onclick="window.taskApprovalWidget.approveTask('${task.id}')">
            ✅ Aprovar
          </button>
          <button class="btn-reject" onclick="window.taskApprovalWidget.rejectTask('${task.id}')">
            ❌ Rejeitar
          </button>
          <button class="btn-details" onclick="window.taskApprovalWidget.viewDetails('${task.id}')">
            👁️ Detalhes
          </button>
        </div>
      </div>
    `;
  },

  formatCategory(category) {
    const labels = {
      'DATABASE_CHANGE': 'Banco de Dados',
      'WHATSAPP_MESSAGE': 'WhatsApp',
      'EMAIL': 'E-mail',
      'SMS': 'SMS',
      'MARKETING': 'Marketing',
      'BILLING': 'Cobrança',
      'ENROLLMENT': 'Matrícula',
    };
    return labels[category] || category;
  },

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // segundos

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  },

  setupEvents() {
    // Expor globalmente para botões onclick
    window.taskApprovalWidget = this;
  },

  async approveTask(taskId) {
    try {
      // TODO: Obter userId do usuário logado (usar auth module)
      const userId = localStorage.getItem('userId') || 'user-placeholder';

      const response = await this.widgetAPI.request(`/api/agent-tasks/${taskId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ userId }),
      });

      if (response.success) {
        // Remover task da lista
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.render();

        // Notificar sucesso
        this.showSuccess('Tarefa aprovada com sucesso!');
      }
    } catch (error) {
      console.error('[Task Approval Widget] Error approving task:', error);
      this.showError('Erro ao aprovar tarefa');
    }
  },

  async rejectTask(taskId) {
    try {
      const reason = prompt('Por que você está rejeitando esta tarefa?');
      if (!reason) return;

      const userId = localStorage.getItem('userId') || 'user-placeholder';

      const response = await this.widgetAPI.request(`/api/agent-tasks/${taskId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ userId, reason }),
      });

      if (response.success) {
        // Remover task da lista
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.render();

        // Notificar sucesso
        this.showSuccess('Tarefa rejeitada');
      }
    } catch (error) {
      console.error('[Task Approval Widget] Error rejecting task:', error);
      this.showError('Erro ao rejeitar tarefa');
    }
  },

  async viewDetails(taskId) {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      alert(`
DETALHES DA TAREFA

Título: ${task.title}
Descrição: ${task.description}
Categoria: ${this.formatCategory(task.category)}
Prioridade: ${task.priority}
Agente: ${task.agent?.name || 'N/A'}

Ação: ${task.actionType}
Entidade: ${task.targetEntity || 'N/A'}

Payload: ${JSON.stringify(task.actionPayload, null, 2)}
      `.trim());
    } catch (error) {
      console.error('[Task Approval Widget] Error viewing details:', error);
    }
  },

  startAutoRefresh() {
    // Limpar intervalo anterior
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Criar novo intervalo
    this.refreshInterval = setInterval(() => {
      console.log('[Task Approval Widget] Auto-refreshing...');
      this.loadTasks();
    }, this.REFRESH_INTERVAL_MS);
  },

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },

  showSuccess(message) {
    // TODO: Integrar com sistema de notificações global
    console.log('[Task Approval Widget] Success:', message);
    alert(`✅ ${message}`);
  },

  showError(message) {
    // TODO: Integrar com sistema de notificações global
    console.error('[Task Approval Widget] Error:', message);
    alert(`❌ Erro: ${message}`);
  },

  destroy() {
    this.stopAutoRefresh();
    this.container = null;
    this.widgetAPI = null;
    this.tasks = [];
  }
};

// Exportar como módulo
window.TaskApprovalWidget = TaskApprovalWidget;
