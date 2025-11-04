/**
 * 🤖 Agent Activity Module - Administração de Atividades de Agentes
 * 
 * RESPONSABILIDADE:
 * - Gerenciar TODO histórico de insights, tasks e notificações geradas por agentes
 * - Tabela profissional com filtros, busca, paginação
 * - 3 abas: Insights | Tasks | Notificações
 * - Ações em lote: deletar, arquivar, marcar como lido
 * - Exportar para CSV
 * 
 * PADRÃO: Single-file Module (inspirado em Instructors)
 * INTEGRAÇÃO: AcademyApp, API Client, Design System
 */

// Helper: Wait for API Client
async function waitForAPIClient() {
    let attempts = 0;
    while (typeof window.createModuleAPI !== 'function' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (typeof window.createModuleAPI !== 'function') {
        throw new Error('API Client não carregou após 5 segundos');
    }
}

if (typeof window.agentActivityModule !== 'undefined') {
    console.log('⚠️ [AgentActivity] Module already loaded');
} else {

const AgentActivityModule = {
    container: null,
    moduleAPI: null,
    
    // State
    currentTab: 'insights', // 'insights' | 'tasks' | 'notifications'
    filters: {
        search: '',
        agentId: null,
        category: null,
        priority: null,
        status: null,
        startDate: null,
        endDate: null
    },
    pagination: {
        page: 1,
        pageSize: 20,
        total: 0
    },
    selectedItems: new Set(),
    
    // Data
    insights: [],
    tasks: [],
    notifications: [],
    agents: [],
    stats: null,

    // 🚀 INICIALIZAÇÃO
    async init() {
        console.log('🤖 [AgentActivity] Initializing module...');
        
        if (!this.container) {
            console.warn('⚠️ [AgentActivity] Container not set, init called without container');
        }
        
        await this.initializeAPI();
        await this.loadAgents();
        await this.loadStats();
        this.render();
        this.setupEvents();
        
        // Despachar evento para AcademyApp
        window.app?.dispatchEvent('module:loaded', { name: 'agentActivity' });
        
        console.log('✅ [AgentActivity] Module initialized');
    },

    // 🔌 SETUP API CLIENT
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('AgentActivity');
        console.log('✅ [AgentActivity] API client initialized');
    },

    // 📊 CARREGAR AGENTES (para filtros)
    async loadAgents() {
        try {
            const response = await this.moduleAPI.request('/api/agents');
            this.agents = response.data || [];
            console.log(`📊 [AgentActivity] Loaded ${this.agents.length} agents`);
        } catch (error) {
            console.error('❌ [AgentActivity] Error loading agents:', error);
            this.agents = [];
        }
    },

    // 📊 CARREGAR ESTATÍSTICAS GERAIS
    async loadStats() {
        try {
            const response = await this.moduleAPI.request('/api/agent-insights/stats');
            this.stats = response.data || {
                totalInsights: 0,
                totalTasks: 0,
                totalNotifications: 0,
                byCategory: {},
                byPriority: {},
                byStatus: {}
            };
            console.log('📊 [AgentActivity] Stats loaded:', this.stats);
        } catch (error) {
            console.error('❌ [AgentActivity] Error loading stats:', error);
            this.stats = null;
        }
    },

    // 📥 CARREGAR DADOS DA ABA ATUAL
    async loadCurrentTabData() {
        const { page, pageSize } = this.pagination;
        const offset = (page - 1) * pageSize;
        
        try {
            let response;
            
            if (this.currentTab === 'insights') {
                response = await this.loadInsights(offset, pageSize);
            } else if (this.currentTab === 'tasks') {
                response = await this.loadTasks(offset, pageSize);
            } else if (this.currentTab === 'notifications') {
                response = await this.loadNotifications(offset, pageSize);
            }
            
            this.pagination.total = response.total || 0;
            this.renderTable();
            
        } catch (error) {
            console.error(`❌ [AgentActivity] Error loading ${this.currentTab}:`, error);
            this.showToast(`Erro ao carregar ${this.currentTab}`, 'error');
        }
    },

    // 💡 CARREGAR INSIGHTS
    async loadInsights(offset = 0, limit = 20) {
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });
        
        // Aplicar filtros
        if (this.filters.search) queryParams.append('search', this.filters.search);
        if (this.filters.agentId) queryParams.append('agentId', this.filters.agentId);
        if (this.filters.category) queryParams.append('category', this.filters.category);
        if (this.filters.priority) queryParams.append('priority', this.filters.priority);
        if (this.filters.status) queryParams.append('status', this.filters.status);
        if (this.filters.startDate) queryParams.append('startDate', this.filters.startDate);
        if (this.filters.endDate) queryParams.append('endDate', this.filters.endDate);
        
        const response = await this.moduleAPI.request(`/api/agent-insights?${queryParams.toString()}`);
        this.insights = response.data || [];
        
        return { data: this.insights, total: response.total || this.insights.length };
    },

    // ✅ CARREGAR TASKS
    async loadTasks(offset = 0, limit = 20) {
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });
        
        if (this.filters.search) queryParams.append('search', this.filters.search);
        if (this.filters.agentId) queryParams.append('agentId', this.filters.agentId);
        if (this.filters.category) queryParams.append('category', this.filters.category);
        if (this.filters.priority) queryParams.append('priority', this.filters.priority);
        if (this.filters.status) queryParams.append('approvalStatus', this.filters.status);
        
        const response = await this.moduleAPI.request(`/api/agent-tasks?${queryParams.toString()}`);
        this.tasks = response.data || [];
        
        return { data: this.tasks, total: response.total || this.tasks.length };
    },

    // 🔔 CARREGAR NOTIFICAÇÕES (via insights com type=NOTIFICATION)
    async loadNotifications(offset = 0, limit = 20) {
        const queryParams = new URLSearchParams({
            type: 'NOTIFICATION',
            offset: offset.toString(),
            limit: limit.toString()
        });
        
        if (this.filters.search) queryParams.append('search', this.filters.search);
        if (this.filters.agentId) queryParams.append('agentId', this.filters.agentId);
        if (this.filters.category) queryParams.append('category', this.filters.category);
        if (this.filters.priority) queryParams.append('priority', this.filters.priority);
        if (this.filters.status) queryParams.append('status', this.filters.status);
        
        const response = await this.moduleAPI.request(`/api/agent-insights?${queryParams.toString()}`);
        this.notifications = response.data || [];
        
        return { data: this.notifications, total: response.total || this.notifications.length };
    },

    // 🎨 RENDERIZAR MÓDULO COMPLETO
    render() {
        this.container.innerHTML = `
            <div class="module-isolated-agent-activity">
                <!-- HEADER -->
                <div class="module-header-premium">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h1>🤖 Atividade de Agentes</h1>
                            <nav class="breadcrumb">Home > Agentes > Atividade</nav>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.exportToCSV()">
                                <i class="fas fa-download"></i> Exportar CSV
                            </button>
                            <button class="btn-form btn-primary-form" onclick="window.agentActivityModule.loadCurrentTabData()">
                                <i class="fas fa-sync-alt"></i> Atualizar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ESTATÍSTICAS CARDS -->
                ${this.renderStatsCards()}

                <!-- ABAS + FILTROS + TABELA -->
                <div class="data-card-premium mt-3">
                    ${this.renderTabs()}
                    ${this.renderFilters()}
                    ${this.renderTablePlaceholder()}
                </div>
            </div>
        `;
        
        // Carregar dados da primeira aba
        this.loadCurrentTabData();
    },

    // 📊 RENDERIZAR CARDS DE ESTATÍSTICAS
    renderStatsCards() {
        if (!this.stats) return '';
        
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0;">
                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">💡</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.totalInsights || 0}</div>
                        <div class="stat-label">Insights</div>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">✅</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.totalTasks || 0}</div>
                        <div class="stat-label">Tasks</div>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">🔔</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.totalNotifications || 0}</div>
                        <div class="stat-label">Notificações</div>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">🤖</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.agents.length}</div>
                        <div class="stat-label">Agentes Ativos</div>
                    </div>
                </div>
            </div>
        `;
    },

    // 📑 RENDERIZAR ABAS
    renderTabs() {
        const tabs = [
            { id: 'insights', label: '💡 Insights', count: this.stats?.totalInsights || 0 },
            { id: 'tasks', label: '✅ Tasks', count: this.stats?.totalTasks || 0 },
            { id: 'notifications', label: '🔔 Notificações', count: this.stats?.totalNotifications || 0 }
        ];
        
        return `
            <div class="module-tabs" style="border-bottom: 2px solid #e5e7eb; margin-bottom: 20px;">
                ${tabs.map(tab => `
                    <button 
                        class="tab-btn ${this.currentTab === tab.id ? 'active' : ''}" 
                        data-tab="${tab.id}"
                        onclick="window.agentActivityModule.switchTab('${tab.id}')"
                    >
                        ${tab.label} <span class="tab-count">(${tab.count})</span>
                    </button>
                `).join('')}
            </div>
        `;
    },

    // 🔍 RENDERIZAR FILTROS
    renderFilters() {
        return `
            <div class="filters-section" style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <!-- Busca -->
                    <input 
                        type="text" 
                        id="filter-search" 
                        class="form-control" 
                        placeholder="🔍 Buscar..."
                        value="${this.filters.search}"
                    />
                    
                    <!-- Agente -->
                    <select id="filter-agent" class="form-control">
                        <option value="">Todos os Agentes</option>
                        ${this.agents.map(agent => `
                            <option value="${agent.id}" ${this.filters.agentId === agent.id ? 'selected' : ''}>
                                ${agent.name}
                            </option>
                        `).join('')}
                    </select>
                    
                    <!-- Categoria -->
                    <select id="filter-category" class="form-control">
                        <option value="">Todas as Categorias</option>
                        <option value="ENGAGEMENT">👥 Engajamento</option>
                        <option value="FINANCIAL">💰 Financeiro</option>
                        <option value="GROWTH">📈 Crescimento</option>
                        <option value="OPERATIONAL">⚙️ Operacional</option>
                        <option value="MARKETING">📢 Marketing</option>
                        <option value="SUPPORT">🎧 Suporte</option>
                    </select>
                    
                    <!-- Prioridade -->
                    <select id="filter-priority" class="form-control">
                        <option value="">Todas as Prioridades</option>
                        <option value="LOW">🟢 Baixa</option>
                        <option value="MEDIUM">🟡 Média</option>
                        <option value="HIGH">🟠 Alta</option>
                        <option value="URGENT">🔴 Urgente</option>
                    </select>
                    
                    <!-- Status -->
                    <select id="filter-status" class="form-control">
                        <option value="">Todos os Status</option>
                        ${this.currentTab === 'tasks' ? `
                            <option value="PENDING">⏳ Pendente</option>
                            <option value="APPROVED">✅ Aprovado</option>
                            <option value="REJECTED">❌ Rejeitado</option>
                            <option value="IN_PROGRESS">🔄 Em Progresso</option>
                            <option value="COMPLETED">✔️ Completo</option>
                        ` : `
                            <option value="NEW">🆕 Novo</option>
                            <option value="PINNED">📌 Fixado</option>
                            <option value="READ">👁️ Lido</option>
                            <option value="ARCHIVED">🗄️ Arquivado</option>
                        `}
                    </select>
                    
                    <!-- Botões de Ação -->
                    <button class="btn-form btn-primary-form" onclick="window.agentActivityModule.applyFilters()">
                        <i class="fas fa-filter"></i> Filtrar
                    </button>
                    <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.clearFilters()">
                        <i class="fas fa-times"></i> Limpar
                    </button>
                </div>
            </div>
        `;
    },

    // 📋 RENDERIZAR PLACEHOLDER DA TABELA
    renderTablePlaceholder() {
        return `
            <div id="table-container">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando dados...</p>
                </div>
            </div>
        `;
    },

    // 📋 RENDERIZAR TABELA COM DADOS
    renderTable() {
        const tableContainer = document.getElementById('table-container');
        if (!tableContainer) return;
        
        let data = [];
        if (this.currentTab === 'insights') data = this.insights;
        else if (this.currentTab === 'tasks') data = this.tasks;
        else if (this.currentTab === 'notifications') data = this.notifications;
        
        if (data.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 64px; margin-bottom: 16px;">📭</div>
                    <h3>Nenhum registro encontrado</h3>
                    <p>Tente ajustar os filtros ou execute um agente para gerar dados.</p>
                </div>
            `;
            return;
        }
        
        tableContainer.innerHTML = `
            <!-- AÇÕES EM LOTE -->
            <div class="bulk-actions" style="display: ${this.selectedItems.size > 0 ? 'flex' : 'none'}; justify-content: space-between; align-items: center; background: #fff3cd; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
                <span><strong>${this.selectedItems.size}</strong> itens selecionados</span>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-form btn-sm btn-secondary-form" onclick="window.agentActivityModule.bulkMarkAsRead()">
                        ✓ Marcar como Lido
                    </button>
                    <button class="btn-form btn-sm btn-warning-form" onclick="window.agentActivityModule.bulkArchive()">
                        🗄️ Arquivar
                    </button>
                    <button class="btn-form btn-sm btn-danger-form" onclick="window.agentActivityModule.bulkDelete()">
                        🗑️ Deletar
                    </button>
                </div>
            </div>
            
            <!-- TABELA -->
            <div class="table-responsive">
                <table class="table-premium">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input 
                                    type="checkbox" 
                                    id="select-all" 
                                    onchange="window.agentActivityModule.toggleSelectAll(this.checked)"
                                />
                            </th>
                            ${this.currentTab === 'tasks' ? `
                                <th>Task</th>
                                <th>Categoria</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Agente</th>
                                <th>Criado</th>
                                <th style="width: 200px;">Ações</th>
                            ` : `
                                <th>Título</th>
                                <th>Categoria</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Agente</th>
                                <th>Criado</th>
                                <th style="width: 200px;">Ações</th>
                            `}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => this.renderTableRow(item)).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- PAGINAÇÃO -->
            ${this.renderPagination()}
        `;
    },

    // 📄 RENDERIZAR LINHA DA TABELA
    renderTableRow(item) {
        const isTask = this.currentTab === 'tasks';
        const id = item.id;
        const isSelected = this.selectedItems.has(id);
        
        return `
            <tr class="${isSelected ? 'row-selected' : ''}" data-id="${id}" ondblclick="window.agentActivityModule.openDetailPage('${id}')">
                <td onclick="event.stopPropagation()">
                    <input 
                        type="checkbox" 
                        ${isSelected ? 'checked' : ''}
                        onchange="window.agentActivityModule.toggleSelectItem('${id}', this.checked)"
                    />
                </td>
                <td>
                    <div style="max-width: 300px;">
                        <strong>${this.escapeHtml(item.title)}</strong>
                        ${item.description || item.content ? `
                            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                                ${this.truncate(item.description || item.content, 80)}
                            </div>
                        ` : ''}
                    </div>
                </td>
                <td>${this.renderCategoryBadge(item.category)}</td>
                <td>${this.renderPriorityBadge(item.priority)}</td>
                <td>${this.renderStatusBadge(isTask ? item.approvalStatus : item.status)}</td>
                <td>
                    <div style="font-size: 13px;">
                        ${item.agent?.name || 'N/A'}
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px; color: #6b7280;">
                        ${this.formatDate(item.createdAt)}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${isTask ? `
                            ${item.approvalStatus === 'PENDING' ? `
                                <button class="btn-action btn-success" onclick="event.stopPropagation(); window.agentActivityModule.approveTask('${id}')" title="Aprovar">
                                    ✅
                                </button>
                                <button class="btn-action btn-danger" onclick="event.stopPropagation(); window.agentActivityModule.rejectTask('${id}')" title="Rejeitar">
                                    ❌
                                </button>
                            ` : ''}
                            ${item.approvalStatus === 'APPROVED' && item.status === 'PENDING' ? `
                                <button class="btn-action btn-primary" onclick="event.stopPropagation(); window.agentActivityModule.executeTaskNow('${id}')" title="Executar Agora">
                                    ⚡
                                </button>
                                <button class="btn-action btn-info" onclick="event.stopPropagation(); window.agentActivityModule.scheduleTask('${id}')" title="Agendar">
                                    📅
                                </button>
                            ` : ''}
                            ${item.status === 'COMPLETED' || item.status === 'FAILED' ? `
                                <button class="btn-action btn-secondary" onclick="event.stopPropagation(); window.agentActivityModule.viewExecutionLog('${id}')" title="Ver Log">
                                    📜
                                </button>
                            ` : ''}
                        ` : `
                            <button class="btn-action" onclick="event.stopPropagation(); window.agentActivityModule.togglePin('${id}')" title="Fixar">
                                ${item.isPinned ? '📌' : '📍'}
                            </button>
                            <button class="btn-action" onclick="event.stopPropagation(); window.agentActivityModule.markAsRead('${id}')" title="Marcar como lido">
                                ✓
                            </button>
                        `}
                        <button class="btn-action" onclick="event.stopPropagation(); window.agentActivityModule.viewDetails('${id}')" title="Ver detalhes">
                            👁️
                        </button>
                        <button class="btn-action btn-warning" onclick="event.stopPropagation(); window.agentActivityModule.archiveItem('${id}')" title="Arquivar">
                            🗄️
                        </button>
                        <button class="btn-action btn-danger" onclick="event.stopPropagation(); window.agentActivityModule.deleteItem('${id}')" title="Deletar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    // 📄 RENDERIZAR PAGINAÇÃO
    renderPagination() {
        const totalPages = Math.ceil(this.pagination.total / this.pagination.pageSize);
        const currentPage = this.pagination.page;
        
        if (totalPages <= 1) return '';
        
        return `
            <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 14px; color: #6b7280;">
                    Mostrando ${((currentPage - 1) * this.pagination.pageSize) + 1} - ${Math.min(currentPage * this.pagination.pageSize, this.pagination.total)} de ${this.pagination.total}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button 
                        class="btn-form btn-sm btn-secondary-form" 
                        onclick="window.agentActivityModule.goToPage(${currentPage - 1})"
                        ${currentPage === 1 ? 'disabled' : ''}
                    >
                        ← Anterior
                    </button>
                    ${this.renderPageNumbers(currentPage, totalPages)}
                    <button 
                        class="btn-form btn-sm btn-secondary-form" 
                        onclick="window.agentActivityModule.goToPage(${currentPage + 1})"
                        ${currentPage === totalPages ? 'disabled' : ''}
                    >
                        Próxima →
                    </button>
                </div>
            </div>
        `;
    },

    renderPageNumbers(current, total) {
        let html = '';
        const maxButtons = 5;
        let start = Math.max(1, current - 2);
        let end = Math.min(total, start + maxButtons - 1);
        
        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }
        
        for (let i = start; i <= end; i++) {
            html += `
                <button 
                    class="btn-form btn-sm ${i === current ? 'btn-primary-form' : 'btn-secondary-form'}"
                    onclick="window.agentActivityModule.goToPage(${i})"
                >
                    ${i}
                </button>
            `;
        }
        
        return html;
    },

    // 🎨 HELPERS DE RENDERIZAÇÃO
    renderCategoryBadge(category) {
        const badges = {
            'ENGAGEMENT': '<span class="badge badge-info">👥 Engajamento</span>',
            'FINANCIAL': '<span class="badge badge-success">💰 Financeiro</span>',
            'GROWTH': '<span class="badge badge-primary">📈 Crescimento</span>',
            'OPERATIONAL': '<span class="badge badge-secondary">⚙️ Operacional</span>',
            'MARKETING': '<span class="badge badge-warning">📢 Marketing</span>',
            'SUPPORT': '<span class="badge badge-info">🎧 Suporte</span>',
            'DATABASE_CHANGE': '<span class="badge badge-danger">💾 DB</span>',
            'WHATSAPP_MESSAGE': '<span class="badge badge-success">📱 WhatsApp</span>',
            'EMAIL': '<span class="badge badge-info">📧 Email</span>',
            'SMS': '<span class="badge badge-warning">📱 SMS</span>'
        };
        return badges[category] || `<span class="badge badge-secondary">${category || 'N/A'}</span>`;
    },

    renderPriorityBadge(priority) {
        const badges = {
            'LOW': '<span class="badge badge-success">🟢 Baixa</span>',
            'MEDIUM': '<span class="badge badge-warning">🟡 Média</span>',
            'HIGH': '<span class="badge badge-danger">🟠 Alta</span>',
            'URGENT': '<span class="badge badge-danger badge-pulse">🔴 Urgente</span>'
        };
        return badges[priority] || '<span class="badge badge-secondary">N/A</span>';
    },

    renderStatusBadge(status) {
        const badges = {
            // Insights/Notifications
            'NEW': '<span class="badge badge-info">🆕 Novo</span>',
            'PINNED': '<span class="badge badge-warning">📌 Fixado</span>',
            'READ': '<span class="badge badge-secondary">👁️ Lido</span>',
            'ARCHIVED': '<span class="badge badge-secondary">🗄️ Arquivado</span>',
            // Tasks
            'PENDING': '<span class="badge badge-warning">⏳ Pendente</span>',
            'APPROVED': '<span class="badge badge-success">✅ Aprovado</span>',
            'REJECTED': '<span class="badge badge-danger">❌ Rejeitado</span>',
            'IN_PROGRESS': '<span class="badge badge-info">🔄 Em Progresso</span>',
            'COMPLETED': '<span class="badge badge-success">✔️ Completo</span>',
            'FAILED': '<span class="badge badge-danger">❌ Falhou</span>'
        };
        return badges[status] || `<span class="badge badge-secondary">${status || 'N/A'}</span>`;
    },

    // 🔄 TROCA DE ABA
    async switchTab(tabId) {
        this.currentTab = tabId;
        this.pagination.page = 1;
        this.selectedItems.clear();
        
        // Re-renderizar abas e filtros
        const container = this.container.querySelector('.data-card-premium');
        const statsCards = this.container.querySelector('.stat-card-enhanced')?.parentElement;
        
        this.render();
    },

    // 🔍 APLICAR FILTROS
    applyFilters() {
        this.filters.search = document.getElementById('filter-search')?.value || '';
        this.filters.agentId = document.getElementById('filter-agent')?.value || null;
        this.filters.category = document.getElementById('filter-category')?.value || null;
        this.filters.priority = document.getElementById('filter-priority')?.value || null;
        this.filters.status = document.getElementById('filter-status')?.value || null;
        
        this.pagination.page = 1;
        this.loadCurrentTabData();
    },

    clearFilters() {
        this.filters = {
            search: '',
            agentId: null,
            category: null,
            priority: null,
            status: null,
            startDate: null,
            endDate: null
        };
        
        this.pagination.page = 1;
        
        // Re-renderizar filtros
        const container = this.container.querySelector('.data-card-premium');
        container.innerHTML = this.renderTabs() + this.renderFilters() + this.renderTablePlaceholder();
        
        this.loadCurrentTabData();
    },

    // 📄 PAGINAÇÃO
    goToPage(page) {
        this.pagination.page = page;
        this.loadCurrentTabData();
    },

    // ✅ SELEÇÃO DE ITENS
    toggleSelectAll(checked) {
        if (checked) {
            const data = this.currentTab === 'insights' ? this.insights : 
                        this.currentTab === 'tasks' ? this.tasks : 
                        this.notifications;
            data.forEach(item => this.selectedItems.add(item.id));
        } else {
            this.selectedItems.clear();
        }
        this.renderTable();
    },

    toggleSelectItem(id, checked) {
        if (checked) {
            this.selectedItems.add(id);
        } else {
            this.selectedItems.delete(id);
        }
        this.renderTable();
    },

    // 🎬 AÇÕES INDIVIDUAIS
    
    // 📄 ABRIR PÁGINA DE DETALHES (DUPLO-CLIQUE)
    async openDetailPage(id) {
        console.log(`🔍 [AgentActivity] Opening detail page for: ${id}`);
        
        try {
            // Determinar endpoint baseado na aba atual
            const endpoint = this.currentTab === 'tasks' ? 
                `/api/agent-tasks/${id}` : 
                `/api/agent-insights/${id}`;
            
            const response = await this.moduleAPI.request(endpoint);
            const item = response.data || response;
            
            // Renderizar página full-screen de detalhes
            this.renderDetailPage(item);
            
        } catch (error) {
            console.error('❌ [AgentActivity] Error loading details:', error);
            this.showToast('Erro ao carregar detalhes', 'error');
        }
    },
    
    // 📄 RENDERIZAR PÁGINA DE DETALHES FULL-SCREEN
    renderDetailPage(item) {
        const isTask = this.currentTab === 'tasks';
        
        // Obter logs de execução (se existir)
        const executionLogs = item.executionResult?.logs || [];
        const executionError = item.executionResult?.error;
        const executionResult = item.executionResult?.result;
        
        this.container.innerHTML = `
            <!-- HEADER COM BREADCRUMB -->
            <div class="module-header-premium">
                <div>
                    <h1>📋 ${isTask ? 'Tarefa' : 'Insight'} - Detalhes</h1>
                    <nav class="breadcrumb">
                        <a href="#agent-activity">Atividades de Agentes</a> 
                        <span>></span> 
                        <span>${this.escapeHtml(item.title)}</span>
                    </nav>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.backToList()">
                        ← Voltar
                    </button>
                </div>
            </div>
            
            <!-- CONTEÚDO PRINCIPAL -->
            <div class="data-card-premium" style="margin-top: 24px;">
                
                <!-- STATUS E BADGES -->
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
                    <div>
                        <h3 style="margin: 0; font-size: 24px; color: #1f2937;">
                            ${this.escapeHtml(item.title)}
                        </h3>
                        <div style="display: flex; gap: 8px; margin-top: 12px;">
                            ${this.renderCategoryBadge(item.category)}
                            ${this.renderPriorityBadge(item.priority)}
                            ${this.renderStatusBadge(isTask ? item.approvalStatus : item.status)}
                            ${isTask && item.status ? this.renderStatusBadge(item.status) : ''}
                        </div>
                    </div>
                    <div style="margin-left: auto;">
                        ${this.renderStatusCircle(isTask ? item.status : item.status)}
                    </div>
                </div>
                
                <!-- INFORMAÇÕES GERAIS -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
                    <div class="info-box">
                        <label>🤖 Agente</label>
                        <div>${item.agent?.name || 'N/A'}</div>
                    </div>
                    <div class="info-box">
                        <label>📅 Criado em</label>
                        <div>${this.formatDate(item.createdAt)}</div>
                    </div>
                    ${isTask ? `
                        ${item.approvedBy ? `
                            <div class="info-box">
                                <label>✅ Aprovado por</label>
                                <div>${item.approvedBy} em ${this.formatDate(item.approvedAt)}</div>
                            </div>
                        ` : ''}
                        ${item.executedAt ? `
                            <div class="info-box">
                                <label>⚡ Executado em</label>
                                <div>${this.formatDate(item.executedAt)}</div>
                            </div>
                        ` : ''}
                        ${item.scheduledFor ? `
                            <div class="info-box">
                                <label>⏰ Agendado para</label>
                                <div>${this.formatDate(item.scheduledFor)}</div>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
                
                <!-- DESCRIÇÃO / CONTEÚDO -->
                <div style="margin-bottom: 32px;">
                    <h3 style="font-size: 18px; color: #374151; margin-bottom: 12px;">
                        📝 ${isTask ? 'Descrição' : 'Conteúdo'}
                    </h3>
                    <div class="content-box">
                        ${this.escapeHtml(item.description || item.content || 'Sem descrição')}
                    </div>
                </div>
                
                ${isTask && item.actionPayload ? `
                    <!-- PAYLOAD DA AÇÃO -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 18px; color: #374151; margin-bottom: 12px;">
                            ⚙️ Payload da Ação
                        </h3>
                        <pre class="code-box">${JSON.stringify(item.actionPayload, null, 2)}</pre>
                    </div>
                ` : ''}
                
                ${isTask && item.reasoning ? `
                    <!-- RACIOCÍNIO DO AGENTE -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 18px; color: #374151; margin-bottom: 12px;">
                            🧠 Raciocínio do Agente
                        </h3>
                        <div class="content-box">
                            ${item.reasoning.insights ? `
                                <div style="margin-bottom: 16px;">
                                    <strong>Insights:</strong>
                                    <ul style="margin: 8px 0 0 20px;">
                                        ${item.reasoning.insights.map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            ${item.reasoning.expectedImpact ? `
                                <div style="margin-bottom: 16px;">
                                    <strong>Impacto Esperado:</strong>
                                    <p style="margin: 4px 0 0 0;">${this.escapeHtml(item.reasoning.expectedImpact)}</p>
                                </div>
                            ` : ''}
                            ${item.reasoning.risks && item.reasoning.risks.length > 0 ? `
                                <div style="margin-bottom: 16px;">
                                    <strong>⚠️ Riscos:</strong>
                                    <ul style="margin: 8px 0 0 20px;">
                                        ${item.reasoning.risks.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- LOG DE EXECUÇÃO -->
                ${isTask && (executionLogs.length > 0 || executionError || executionResult) ? `
                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 18px; color: #374151; margin-bottom: 12px;">
                            📜 Log de Execução
                        </h3>
                        
                        ${executionLogs.length > 0 ? `
                            <div class="log-box">
                                ${executionLogs.map(log => `
                                    <div class="log-entry">
                                        <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                                        <span class="log-level log-level-${log.level || 'info'}">${log.level || 'INFO'}</span>
                                        <span class="log-message">${this.escapeHtml(log.message)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${executionResult ? `
                            <div style="margin-top: 16px;">
                                <strong style="color: #059669;">✅ Resultado:</strong>
                                <pre class="code-box" style="margin-top: 8px;">${JSON.stringify(executionResult, null, 2)}</pre>
                            </div>
                        ` : ''}
                        
                        ${executionError ? `
                            <div style="margin-top: 16px;">
                                <strong style="color: #dc2626;">❌ Erro:</strong>
                                <div class="error-box" style="margin-top: 8px;">
                                    ${this.escapeHtml(executionError)}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${!isTask && executionLogs.length === 0 && !executionError && !executionResult ? `
                    <div class="empty-state">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <p style="color: #6b7280;">Nenhum log de execução disponível</p>
                    </div>
                ` : ''}
                
                <!-- BOTÕES DE AÇÃO -->
                <div style="display: flex; gap: 12px; flex-wrap: wrap; padding-top: 24px; border-top: 2px solid #e5e7eb; margin-top: 32px;">
                    ${isTask ? this.renderTaskActionButtons(item) : this.renderInsightActionButtons(item)}
                </div>
            </div>
            
            <style>
                .info-box {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    border-left: 4px solid var(--primary-color);
                }
                .info-box label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                .info-box div {
                    font-size: 14px;
                    color: #1f2937;
                    font-weight: 500;
                }
                .content-box {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #374151;
                }
                .code-box {
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    overflow-x: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.5;
                }
                .log-box {
                    background: #1f2937;
                    padding: 16px;
                    border-radius: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }
                .log-entry {
                    display: flex;
                    gap: 12px;
                    padding: 8px 0;
                    border-bottom: 1px solid #374151;
                    align-items: baseline;
                }
                .log-entry:last-child {
                    border-bottom: none;
                }
                .log-timestamp {
                    color: #9ca3af;
                    font-size: 12px;
                    min-width: 80px;
                }
                .log-level {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    min-width: 60px;
                    text-align: center;
                }
                .log-level-info { background: #3b82f6; color: white; }
                .log-level-success { background: #059669; color: white; }
                .log-level-warning { background: #f59e0b; color: white; }
                .log-level-error { background: #dc2626; color: white; }
                .log-message {
                    color: #f9fafb;
                    flex: 1;
                }
                .error-box {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    padding: 16px;
                    border-radius: 8px;
                    color: #991b1b;
                }
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
            </style>
        `;
    },
    
    // 📄 RENDERIZAR BOTÕES DE AÇÃO (TASKS)
    renderTaskActionButtons(task) {
        let buttons = '';
        
        // Botões baseados no status
        if (task.approvalStatus === 'PENDING') {
            buttons += `
                <button class="btn-form btn-success-form" onclick="window.agentActivityModule.approveTaskDetail('${task.id}')">
                    ✅ Aprovar
                </button>
                <button class="btn-form btn-danger-form" onclick="window.agentActivityModule.rejectTaskDetail('${task.id}')">
                    ❌ Rejeitar
                </button>
            `;
        }
        
        if (task.approvalStatus === 'APPROVED' && task.status === 'PENDING') {
            buttons += `
                <button class="btn-form btn-primary-form" onclick="window.agentActivityModule.executeTaskDetail('${task.id}')">
                    ⚡ Executar Agora
                </button>
                <button class="btn-form btn-info-form" onclick="window.agentActivityModule.scheduleTask('${task.id}')">
                    📅 Agendar
                </button>
            `;
        }
        
        if (task.status === 'IN_PROGRESS') {
            buttons += `
                <button class="btn-form btn-warning-form" onclick="window.agentActivityModule.cancelTaskDetail('${task.id}')">
                    ⏸️ Cancelar Execução
                </button>
            `;
        }
        
        // Botões sempre disponíveis
        buttons += `
            <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.archiveItemDetail('${task.id}')">
                🗄️ Arquivar
            </button>
            <button class="btn-form btn-danger-form" onclick="window.agentActivityModule.deleteItemDetail('${task.id}')">
                🗑️ Deletar
            </button>
        `;
        
        return buttons;
    },
    
    // 📄 RENDERIZAR BOTÕES DE AÇÃO (INSIGHTS)
    renderInsightActionButtons(insight) {
        return `
            <button class="btn-form btn-primary-form" onclick="window.agentActivityModule.togglePinDetail('${insight.id}')">
                ${insight.isPinned ? '📌 Desafixar' : '📍 Fixar'}
            </button>
            <button class="btn-form btn-info-form" onclick="window.agentActivityModule.markAsReadDetail('${insight.id}')">
                ✓ Marcar como Lido
            </button>
            <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.archiveItemDetail('${insight.id}')">
                🗄️ Arquivar
            </button>
            <button class="btn-form btn-danger-form" onclick="window.agentActivityModule.deleteItemDetail('${insight.id}')">
                🗑️ Deletar
            </button>
        `;
    },
    
    // 📄 RENDERIZAR CÍRCULO DE STATUS
    renderStatusCircle(status) {
        const statusConfig = {
            'PENDING': { color: '#f59e0b', label: 'Pendente', icon: '⏳' },
            'IN_PROGRESS': { color: '#3b82f6', label: 'Em Execução', icon: '⚡' },
            'COMPLETED': { color: '#059669', label: 'Completo', icon: '✅' },
            'FAILED': { color: '#dc2626', label: 'Falhou', icon: '❌' },
            'CANCELLED': { color: '#6b7280', label: 'Cancelado', icon: '⏸️' },
            'SCHEDULED': { color: '#8b5cf6', label: 'Agendado', icon: '📅' }
        };
        
        const config = statusConfig[status] || statusConfig['PENDING'];
        
        return `
            <div style="text-align: center;">
                <div style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: ${config.color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin: 0 auto 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                ">
                    ${config.icon}
                </div>
                <div style="font-size: 14px; font-weight: 600; color: ${config.color};">
                    ${config.label}
                </div>
            </div>
        `;
    },
    
    // 🔙 VOLTAR PARA LISTA
    backToList() {
        this.render();
        this.loadCurrentTabData();
    },
    
    // 🎬 AÇÕES DA PÁGINA DE DETALHES
    async approveTaskDetail(id) {
        await this.approveTask(id);
        await this.openDetailPage(id); // Recarregar detalhes
    },
    
    async rejectTaskDetail(id) {
        await this.rejectTask(id);
        await this.openDetailPage(id);
    },
    
    async executeTaskDetail(id) {
        await this.executeTaskNow(id);
        await this.openDetailPage(id);
    },
    
    async cancelTaskDetail(id) {
        if (!confirm('⏸️ Cancelar a execução desta tarefa?')) return;
        
        try {
            await this.moduleAPI.request(`/api/agent-tasks/${id}/cancel`, { method: 'PATCH' });
            this.showToast('Tarefa cancelada', 'success');
            await this.openDetailPage(id);
        } catch (error) {
            this.showToast('Erro ao cancelar tarefa', 'error');
        }
    },
    
    async archiveItemDetail(id) {
        await this.archiveItem(id);
        this.backToList();
    },
    
    async deleteItemDetail(id) {
        await this.deleteItem(id);
        this.backToList();
    },
    
    async togglePinDetail(id) {
        await this.togglePin(id);
        await this.openDetailPage(id);
    },
    
    async markAsReadDetail(id) {
        await this.markAsRead(id);
        await this.openDetailPage(id);
    },
    
    async togglePin(id) {
        try {
            await this.moduleAPI.request(`/api/agent-insights/${id}/pin`, { method: 'PATCH' });
            this.showToast('Status de fixação alterado', 'success');
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro ao fixar item', 'error');
        }
    },

    async markAsRead(id) {
        try {
            await this.moduleAPI.request(`/api/agent-insights/${id}/read`, { method: 'PATCH' });
            this.showToast('Marcado como lido', 'success');
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro ao marcar como lido', 'error');
        }
    },

    async archiveItem(id) {
        if (!confirm('Arquivar este item?')) return;
        
        try {
            const endpoint = this.currentTab === 'tasks' ? 
                `/api/agent-tasks/${id}/archive` : 
                `/api/agent-insights/${id}/archive`;
            
            await this.moduleAPI.request(endpoint, { method: 'PATCH' });
            this.showToast('Item arquivado', 'success');
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro ao arquivar', 'error');
        }
    },

    async deleteItem(id) {
        if (!confirm('❌ Deletar permanentemente este item?')) return;
        
        try {
            const endpoint = this.currentTab === 'tasks' ? 
                `/api/agent-tasks/${id}` : 
                `/api/agent-insights/${id}`;
            
            await this.moduleAPI.request(endpoint, { method: 'DELETE' });
            this.showToast('Item deletado', 'success');
            this.loadCurrentTabData();
            this.loadStats(); // Atualizar estatísticas
        } catch (error) {
            this.showToast('Erro ao deletar', 'error');
        }
    },

    async approveTask(id) {
        if (!confirm('✅ Aprovar esta task?')) return;
        
        try {
            await this.moduleAPI.request(`/api/agent-tasks/${id}/approve`, { method: 'PATCH' });
            this.showToast('Task aprovada', 'success');
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro ao aprovar task', 'error');
        }
    },

    async rejectTask(id) {
        const reason = prompt('Motivo da rejeição (opcional):');
        
        try {
            await this.moduleAPI.request(`/api/agent-tasks/${id}/reject`, { 
                method: 'PATCH',
                body: JSON.stringify({ reason })
            });
            this.showToast('Task rejeitada', 'success');
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro ao rejeitar task', 'error');
        }
    },

    viewDetails(id) {
        // TODO: Implementar modal de detalhes
        console.log('View details:', id);
        this.showToast('Detalhes em desenvolvimento', 'info');
    },

    // 🆕 NOVOS MÉTODOS - ORQUESTRAÇÃO DE TAREFAS

    async executeTaskNow(id) {
        if (!confirm('⚡ Executar esta tarefa agora?')) return;
        
        try {
            this.showToast('⏳ Iniciando execução...', 'info');
            
            const response = await this.moduleAPI.request(`/api/agent-tasks/${id}/execute-now`, { 
                method: 'POST'
            });
            
            this.showToast('✅ Tarefa executada com sucesso!', 'success');
            
            // Aguardar 2 segundos e recarregar para ver resultado
            setTimeout(() => {
                this.loadCurrentTabData();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao executar task:', error);
            this.showToast('❌ Erro ao executar tarefa', 'error');
        }
    },

    async scheduleTask(id) {
        // Modal de agendamento
        const html = `
            <div class="modal-overlay" onclick="window.agentActivityModule.closeModal(event)">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>📅 Agendar Tarefa</h3>
                        <button class="btn-close" onclick="window.agentActivityModule.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="scheduledFor">Data e Hora:</label>
                            <input type="datetime-local" id="scheduledFor" class="form-control" required>
                            <small class="form-text">Quando a tarefa deve ser executada</small>
                        </div>
                        <div class="form-group">
                            <label for="recurrenceRule">Recorrência (opcional):</label>
                            <select id="recurrenceRule" class="form-control">
                                <option value="">Executar apenas uma vez</option>
                                <option value="0 9 * * *">📅 Todo dia às 9h</option>
                                <option value="0 9 * * 1">📅 Toda segunda-feira às 9h</option>
                                <option value="0 9 * * 1-5">📅 Dias úteis às 9h</option>
                                <option value="*/30 * * * *">⏰ A cada 30 minutos</option>
                                <option value="0 */2 * * *">⏰ A cada 2 horas</option>
                                <option value="0 8-18 * * *">⏰ Cada hora entre 8h-18h</option>
                                <option value="0 0 1 * *">📆 Primeiro dia do mês às 00:00</option>
                                <option value="0 9 * * 0">📆 Todo domingo às 9h</option>
                            </select>
                            <small class="form-text">Se definido, a tarefa será recorrente</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.closeModal()">
                            Cancelar
                        </button>
                        <button class="btn-form btn-primary-form" onclick="window.agentActivityModule.confirmSchedule('${id}')">
                            ✅ Confirmar Agendamento
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Definir datetime mínimo como agora
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajuste timezone
        document.getElementById('scheduledFor').min = now.toISOString().slice(0, 16);
        document.getElementById('scheduledFor').value = now.toISOString().slice(0, 16);
    },

    async confirmSchedule(id) {
        const scheduledFor = document.getElementById('scheduledFor').value;
        const recurrenceRule = document.getElementById('recurrenceRule').value;
        
        if (!scheduledFor) {
            this.showToast('⚠️ Data/hora obrigatória', 'warning');
            return;
        }
        
        try {
            this.showToast('⏳ Agendando tarefa...', 'info');
            
            const body = { scheduledFor: new Date(scheduledFor).toISOString() };
            if (recurrenceRule) {
                body.recurrenceRule = recurrenceRule;
            }
            
            await this.moduleAPI.request(`/api/agent-tasks/${id}/schedule`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            
            this.closeModal();
            
            const dateStr = new Date(scheduledFor).toLocaleString('pt-BR');
            const msg = recurrenceRule ? 
                `✅ Tarefa recorrente agendada! Primeira execução: ${dateStr}` :
                `✅ Tarefa agendada para ${dateStr}`;
            
            this.showToast(msg, 'success');
            this.loadCurrentTabData();
            
        } catch (error) {
            console.error('❌ Erro ao agendar:', error);
            this.showToast('❌ Erro ao agendar tarefa', 'error');
        }
    },

    async viewExecutionLog(id) {
        try {
            this.showToast('⏳ Carregando log de execuções...', 'info');
            
            const response = await this.moduleAPI.request(`/api/agent-tasks/${id}/executions`);
            const executions = response.data || [];
            
            if (executions.length === 0) {
                this.showToast('ℹ️ Nenhuma execução registrada', 'info');
                return;
            }
            
            const html = `
                <div class="modal-overlay" onclick="window.agentActivityModule.closeModal(event)">
                    <div class="modal-content modal-large" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3>📜 Log de Execuções</h3>
                            <button class="btn-close" onclick="window.agentActivityModule.closeModal()">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="execution-log-table">
                                <table class="table-premium">
                                    <thead>
                                        <tr>
                                            <th>Tentativa</th>
                                            <th>Executor</th>
                                            <th>Status</th>
                                            <th>Início</th>
                                            <th>Duração</th>
                                            <th>Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${executions.map(exec => `
                                            <tr class="execution-row execution-${exec.status.toLowerCase()}">
                                                <td><strong>#${exec.attemptNumber}</strong></td>
                                                <td>
                                                    <div>${exec.executorType}</div>
                                                    ${exec.executor ? `<small>${this.escapeHtml(exec.executor.name || exec.executor.email || 'N/A')}</small>` : ''}
                                                </td>
                                                <td>
                                                    <span class="badge badge-${this.getExecutionStatusClass(exec.status)}">
                                                        ${this.getExecutionStatusIcon(exec.status)} ${exec.status}
                                                    </span>
                                                </td>
                                                <td>${this.formatDate(exec.startedAt)}</td>
                                                <td>${exec.duration ? `${exec.duration}ms` : 'N/A'}</td>
                                                <td>
                                                    ${exec.status === 'COMPLETED' ? 
                                                        '<span class="text-success">✅ Sucesso</span>' : 
                                                        exec.status === 'FAILED' ? 
                                                            `<span class="text-error">❌ ${this.escapeHtml(exec.errorMessage || 'Erro desconhecido')}</span>` :
                                                            `<span class="text-warning">⏳ ${exec.status}</span>`
                                                    }
                                                </td>
                                            </tr>
                                            ${exec.errorMessage && exec.status === 'FAILED' ? `
                                                <tr class="execution-error-details">
                                                    <td colspan="6">
                                                        <details>
                                                            <summary>🔍 Detalhes do erro</summary>
                                                            <pre>${this.escapeHtml(exec.errorStack || exec.errorMessage)}</pre>
                                                        </details>
                                                    </td>
                                                </tr>
                                            ` : ''}
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-form btn-secondary-form" onclick="window.agentActivityModule.closeModal()">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
        } catch (error) {
            console.error('❌ Erro ao buscar log:', error);
            this.showToast('❌ Erro ao carregar log de execuções', 'error');
        }
    },

    async loadOrchestratorStats() {
        try {
            const response = await this.moduleAPI.request('/api/agent-tasks/orchestrator/stats');
            return response.data || null;
        } catch (error) {
            console.error('❌ Erro ao carregar stats do orquestrador:', error);
            return null;
        }
    },

    // 🎨 UTILITÁRIOS PARA ORQUESTRAÇÃO
    getExecutionStatusClass(status) {
        const map = {
            'COMPLETED': 'success',
            'STARTED': 'warning',
            'FAILED': 'error',
            'TIMEOUT': 'error'
        };
        return map[status] || 'secondary';
    },

    getExecutionStatusIcon(status) {
        const map = {
            'COMPLETED': '✅',
            'STARTED': '⏳',
            'FAILED': '❌',
            'TIMEOUT': '⏰'
        };
        return map[status] || '❓';
    },

    closeModal(event) {
        if (event && event.target.classList.contains('modal-content')) return;
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    },

    // 📦 AÇÕES EM LOTE
    async bulkMarkAsRead() {
        if (this.selectedItems.size === 0) return;
        if (!confirm(`Marcar ${this.selectedItems.size} itens como lidos?`)) return;
        
        try {
            const ids = Array.from(this.selectedItems);
            await this.moduleAPI.request('/api/agent-insights/bulk-read', {
                method: 'PATCH',
                body: JSON.stringify({ ids })
            });
            
            this.showToast(`${ids.length} itens marcados como lidos`, 'success');
            this.selectedItems.clear();
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro em ação em lote', 'error');
        }
    },

    async bulkArchive() {
        if (this.selectedItems.size === 0) return;
        if (!confirm(`Arquivar ${this.selectedItems.size} itens?`)) return;
        
        try {
            const ids = Array.from(this.selectedItems);
            const endpoint = this.currentTab === 'tasks' ? 
                '/api/agent-tasks/bulk-archive' : 
                '/api/agent-insights/bulk-archive';
            
            await this.moduleAPI.request(endpoint, {
                method: 'PATCH',
                body: JSON.stringify({ ids })
            });
            
            this.showToast(`${ids.length} itens arquivados`, 'success');
            this.selectedItems.clear();
            this.loadCurrentTabData();
        } catch (error) {
            this.showToast('Erro em ação em lote', 'error');
        }
    },

    async bulkDelete() {
        if (this.selectedItems.size === 0) return;
        if (!confirm(`❌ DELETAR PERMANENTEMENTE ${this.selectedItems.size} itens?`)) return;
        
        try {
            const ids = Array.from(this.selectedItems);
            const endpoint = this.currentTab === 'tasks' ? 
                '/api/agent-tasks/bulk' : 
                '/api/agent-insights/bulk';
            
            await this.moduleAPI.request(endpoint, {
                method: 'DELETE',
                body: JSON.stringify({ ids })
            });
            
            this.showToast(`${ids.length} itens deletados`, 'success');
            this.selectedItems.clear();
            this.loadCurrentTabData();
            this.loadStats();
        } catch (error) {
            this.showToast('Erro em ação em lote', 'error');
        }
    },

    // 📥 EXPORTAR CSV
    exportToCSV() {
        const data = this.currentTab === 'insights' ? this.insights : 
                    this.currentTab === 'tasks' ? this.tasks : 
                    this.notifications;
        
        if (data.length === 0) {
            this.showToast('Nenhum dado para exportar', 'warning');
            return;
        }
        
        // Cabeçalhos
        const headers = ['ID', 'Título', 'Categoria', 'Prioridade', 'Status', 'Agente', 'Criado'];
        
        // Linhas
        const rows = data.map(item => [
            item.id,
            (item.title || '').replace(/"/g, '""'),
            item.category || '',
            item.priority || '',
            this.currentTab === 'tasks' ? item.approvalStatus : item.status,
            item.agent?.name || '',
            this.formatDate(item.createdAt)
        ]);
        
        // Gerar CSV
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agent-activity-${this.currentTab}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showToast('CSV exportado com sucesso', 'success');
    },

    // 🎨 UTILITÁRIOS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    truncate(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    showToast(message, type = 'info') {
        window.app?.showToast?.(message, type);
        console.log(`[AgentActivity] ${type.toUpperCase()}: ${message}`);
    },

    // 🎬 SETUP EVENTOS
    setupEvents() {
        // Eventos delegados são tratados via onclick inline
        console.log('✅ [AgentActivity] Events setup complete');
    }
};

// Exportar globalmente
window.agentActivityModule = AgentActivityModule;
console.log('🌐 [AgentActivity] Module exported to window.agentActivityModule');

} // end if
