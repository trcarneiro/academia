// ==============================================
// ACTIVITIES MODULE - GUIDELINES.MD COMPLIANCE
// ==============================================

// Aguardar API Client estar disponível
function waitForAPIClient() {
    return new Promise((resolve) => {
        if (window.createModuleAPI) {
            resolve();
        } else {
            const checkAPI = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(checkAPI);
                    resolve();
                }
            }, 100);
        }
    });
}

// Criar instância do API helper quando disponível
let activitiesAPI = null;

async function initializeAPI() {
    await waitForAPIClient();
    activitiesAPI = window.createModuleAPI('Activities');
    console.log('🌐 Activities API helper inicializado com Guidelines.MD compliance');
}

const ActivitiesModule = {
  currentPage: 1,
  pageSize: 20,
  filterType: '',
  searchQuery: '',
  activities: [],
  totalCount: 0,

  async init() {
    await initializeAPI();
    this.setupEventListeners();
    await this.loadActivities();
  },

  setupEventListeners() {
    // Navegação de páginas
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));
    
    // Tamanho da página
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.loadActivities();
      });
    }
    
    // Filtro por tipo
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.filterType = e.target.value;
        this.currentPage = 1;
        this.loadActivities();
      });
    }

    // Busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.currentPage = 1;
          this.loadActivities();
        }, 300);
      });
    }

    // Botão nova atividade
    const newBtn = document.getElementById('new-activity-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openEditor());
    }

    // Botão atualizar
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadActivities());
    }
  },

  async loadActivities() {
    try {
      // Construct query parameters
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize
      };
      if (this.filterType) params.type = this.filterType;
      if (this.searchQuery) params.q = this.searchQuery;
      
      // Use API Client with loading states
      const response = await activitiesAPI.fetchWithStates('/api/activities', {
        method: 'GET',
        params,
        loadingElement: document.querySelector('#activities-table'),
        onSuccess: (data) => {
          this.activities = data.data || [];
          this.totalCount = data.count || 0;
          this.renderActivities();
          this.renderPagination();
          this.updateStats();
        },
        onError: (error) => {
          console.error('Erro ao carregar atividades:', error);
          window.feedback?.showError('Erro ao carregar atividades');
          this.showEmptyState('Erro ao carregar atividades');
        }
      });
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      window.feedback?.showError('Erro ao carregar atividades');
      this.showEmptyState('Erro ao carregar atividades');
    }
  },

  renderActivities() {
    const tbody = document.querySelector('#activities-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (this.activities.length === 0) {
      this.showEmptyState();
      return;
    }

    this.activities.forEach(activity => {
      const row = document.createElement('tr');
      row.className = 'activities-row';
      row.innerHTML = `
        <td class="activity-title">${activity.title}</td>
        <td class="activity-type">
          <span class="type-badge type-${activity.type.toLowerCase()}">${this.getTypeLabel(activity.type)}</span>
        </td>
        <td class="activity-difficulty">
          ${activity.difficulty ? this.renderDifficulty(activity.difficulty) : '-'}
        </td>
        <td class="activity-equipment">
          ${activity.equipment?.length ? activity.equipment.slice(0, 2).join(', ') + (activity.equipment.length > 2 ? '...' : '') : '-'}
        </td>
        <td class="activity-technique">
          ${activity.refTechnique?.name || '-'}
        </td>
        <td class="activity-actions">
          <button class="btn-action btn-edit" onclick="ActivitiesModule.openEditor('${activity.id}')" title="Editar">
            ✏️
          </button>
          <button class="btn-action btn-delete" onclick="ActivitiesModule.deleteActivity('${activity.id}')" title="Excluir">
            🗑️
          </button>
        </td>
      `;
      
      // Double click para editar
      row.addEventListener('dblclick', () => this.openEditor(activity.id));
      tbody.appendChild(row);
    });
  },

  showEmptyState(message = 'Nenhuma atividade encontrada') {
    const tbody = document.querySelector('#activities-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📝</div>
            <h3>${message}</h3>
            ${message.includes('Erro') ? '' : `
              <p>Comece criando sua primeira atividade</p>
              <button class="btn btn-primary" onclick="ActivitiesModule.openEditor()">
                ➕ Nova Atividade
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  },

  renderPagination() {
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (currentPageElement) currentPageElement.textContent = this.currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
  },

  updateStats() {
    const totalElement = document.getElementById('total-activities');
    const resultCountElement = document.getElementById('result-count');
    
    if (totalElement) totalElement.textContent = this.totalCount;
    if (resultCountElement) {
      const showing = this.activities.length;
      const start = (this.currentPage - 1) * this.pageSize + 1;
      const end = Math.min(start + showing - 1, this.totalCount);
      resultCountElement.textContent = `Mostrando ${start}-${end} de ${this.totalCount} atividades`;
    }
  },

  changePage(delta) {
    const newPage = this.currentPage + delta;
    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    
    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage = newPage;
      this.loadActivities();
    }
  },

  openEditor(activityId = null) {
    const url = activityId 
      ? `/views/modules/activity-editor.html?id=${activityId}`
      : '/views/modules/activity-editor.html';
    window.location.href = url;
  },

  async deleteActivity(activityId) {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) {
      return;
    }

    try {
      await activitiesAPI.fetchWithStates(`/api/activities/${activityId}`, {
        method: 'DELETE',
        onSuccess: () => {
          window.feedback?.showSuccess('Atividade excluída com sucesso');
          this.loadActivities();
        },
        onError: (error) => {
          console.error('Erro ao excluir atividade:', error);
          window.feedback?.showError('Erro ao excluir atividade');
        }
      });
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      window.feedback?.showError('Erro ao excluir atividade');
    }
  },

  getTypeLabel(type) {
    const typeLabels = {
      'TECHNIQUE': 'Técnica',
      'STRETCH': 'Alongamento', 
      'DRILL': 'Drill',
      'EXERCISE': 'Exercício',
      'GAME': 'Jogo',
      'CHALLENGE': 'Desafio',
      'ASSESSMENT': 'Avaliação'
    };
    return typeLabels[type] || type;
  },

  renderDifficulty(difficulty) {
    const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    return `<span class="difficulty-stars" title="Dificuldade ${difficulty}/5">${stars}</span>`;
  }
};

// Exposição global para uso em HTML
window.ActivitiesModule = ActivitiesModule;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  ActivitiesModule.init();
});
