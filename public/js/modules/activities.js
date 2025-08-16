import ModuleLoader from '../../core/module-loader.js';
import { showLoading, hideLoading } from '../../utils/loading.js';
import { handleApiError } from '../../utils/error-handler.js';

const ActivitiesModule = {
  currentPage: 1,
  pageSize: 10,
  filterType: '',

  async init() {
    this.setupEventListeners();
    await this.loadActivities();
  },

  setupEventListeners() {
    document.getElementById('prev-page').addEventListener('click', () => this.changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => this.changePage(1));
    document.getElementById('page-size').addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value);
      this.loadActivities();
    });
    
    // Novo listener para o filtro de tipo
    document.getElementById('type-filter').addEventListener('change', (e) => {
      this.filterType = e.target.value;
      this.currentPage = 1; // Resetar para a primeira página
      this.loadActivities();
    });
  },

  async loadActivities() {
    showLoading('#activities-table');
    try {
      // Adicionar parâmetro de filtro à URL
      let url = `/api/activities?page=${this.currentPage}&limit=${this.pageSize}`;
      if (this.filterType) url += `&type=${this.filterType}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const { data, total } = await response.json();
      this.renderActivities(data);
      this.renderPagination(total);
    } catch (error) {
      handleApiError(error, '#activities-container');
    } finally {
      hideLoading('#activities-table');
    }
  },

  renderActivities(activities) {
    const tbody = document.querySelector('#activities-table tbody');
    tbody.innerHTML = '';

    if (activities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="activities-isolated-empty">Nenhuma atividade encontrada</td></tr>`;
      return;
    }

    activities.forEach(activity => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${activity.title}</td>
        <td>${activity.type}</td>
        <td>${new Date(activity.date).toLocaleDateString()}</td>
        <td>${activity.duration} minutos</td>
        <td><span class="activities-isolated-status-badge">${activity.status}</span></td>
      `;
      row.addEventListener('dblclick', () => this.openEditor(activity.id));
      tbody.appendChild(row);
    });
  },

  renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.pageSize);
    document.getElementById('current-page').textContent = this.currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('prev-page').disabled = this.currentPage === 1;
    document.getElementById('next-page').disabled = this.currentPage === totalPages;
  },

  changePage(delta) {
    this.currentPage += delta;
    this.loadActivities();
  },

  openEditor(activityId) {
    window.location.href = `/activity-editor?id=${activityId}`;
  }
};

ModuleLoader.register('activities-module', ActivitiesModule);
