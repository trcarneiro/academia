/**
 * CRM Module - Lead Management & Google Ads Integration
 * Single-file architecture following Instructors module pattern
 * 
 * Features:
 * - Dashboard with key metrics
 * - Lead list with advanced filters
 * - Lead details with timeline
 * - Kanban board (drag & drop pipeline)
 * - Convert lead to student (wizard)
 * - Analytics (ROI by campaign, conversion funnel)
 * 
 * @version 1.0.0
 * @follows AGENTS.md v2.1 - Single-file pattern
 */

// Prevent re-declaration
if (typeof window.CrmModule !== 'undefined') {
    console.log('✅ CRM Module already loaded');
} else {

const CrmModule = {
    container: null,
    moduleAPI: null,
    currentView: 'dashboard', // dashboard, list, details, kanban, analytics, settings
    currentLeadId: null,
    leads: [],
    pipelineStats: null,
    filters: {
        stage: 'all',
        status: 'ACTIVE',
        temperature: 'all',
        assignedTo: 'all',
        search: ''
    },

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async init() {
        console.log('🚀 Initializing CRM Module...');
        
        try {
            await this.initializeAPI();
            await this.loadInitialData();
            this.render();
            this.setupEvents();
            
            // Register globally
            window.crm = this;
            window.app?.dispatchEvent('module:loaded', { name: 'crm' });
            
            console.log('✅ CRM Module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing CRM:', error);
            window.app?.handleError(error, { module: 'crm', context: 'init' });
        }
    },

    async initializeAPI() {
        console.log('🌐 Initializing API Client for CRM...');
        
        // Ensure organization context is available before proceeding
        if (typeof window.ensureOrganizationContext === 'function') {
            await window.ensureOrganizationContext();
            console.log('✅ Organization context ready:', window.currentOrganizationId);
        }
        
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('CRM');
        console.log('✅ CRM API helper initialized');
        
        // Adicionar método request() compatível com a API antiga
        this.moduleAPI.request = async (url, options = {}) => {
            const method = (options.method || 'GET').toUpperCase();
            const body = options.body ? JSON.parse(options.body) : undefined;
            
            switch (method) {
                case 'GET':
                    return await this.moduleAPI.api.get(url, options);
                case 'POST':
                    return await this.moduleAPI.api.post(url, body, options);
                case 'PUT':
                    return await this.moduleAPI.api.put(url, body, options);
                case 'DELETE':
                    return await this.moduleAPI.api.delete(url, options);
                case 'PATCH':
                    return await this.moduleAPI.api.patch(url, body, options);
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
        };
    },

    async loadInitialData() {
        try {
            // Load dashboard data in parallel
            const [leadsResponse, pipelineResponse] = await Promise.all([
                this.moduleAPI.request('/api/crm/leads?limit=10&sortBy=createdAt&sortOrder=desc'),
                this.moduleAPI.request('/api/crm/pipeline')
            ]);

            this.leads = leadsResponse.data || [];
            this.pipelineStats = pipelineResponse.data || null;
            
            console.log('✅ Initial CRM data loaded:', {
                leads: this.leads.length,
                pipeline: this.pipelineStats ? 'loaded' : 'empty'
            });
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            throw error;
        }
    },

    // ========================================================================
    // RENDERING
    // ========================================================================

    render() {
        if (!this.container) {
            console.warn('⚠️ Container not set before render');
            return;
        }

        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'list':
                this.renderLeadList();
                break;
            case 'details':
                this.renderLeadDetails();
                break;
            case 'kanban':
                this.renderKanbanBoard();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            case 'settings':
                this.renderSettings();
                break;
            default:
                this.renderDashboard();
        }
    },

    renderDashboard() {
        const stats = this.pipelineStats?.metrics || {};
        const pipeline = this.pipelineStats?.pipeline || [];
        
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <i class="fas fa-users-cog"></i>
                        <div>
                            <h1>CRM - Customer Relationship Management</h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item">Home</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-item active">CRM Dashboard</span>
                            </nav>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="crm.navigateTo('settings')">
                            <i class="fas fa-cog"></i>
                            Settings
                        </button>
                        <button class="btn-secondary" onclick="crm.navigateTo('analytics')">
                            <i class="fas fa-chart-line"></i>
                            Analytics
                        </button>
                        <button class="btn-secondary" onclick="crm.navigateTo('kanban')">
                            <i class="fas fa-columns"></i>
                            Pipeline Kanban
                        </button>
                        <button class="btn-primary" onclick="crm.showCreateLeadForm()">
                            <i class="fas fa-plus"></i>
                            Novo Lead
                        </button>
                    </div>
                </div>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total de Leads</div>
                        <div class="stat-value">${stats.totalLeads || 0}</div>
                        <div class="stat-trend positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+15% este mês</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Taxa de Conversão</div>
                        <div class="stat-value">${stats.conversionRate?.toFixed(1) || 0}%</div>
                        <div class="stat-trend ${stats.conversionRate > 15 ? 'positive' : 'negative'}">
                            <i class="fas fa-${stats.conversionRate > 15 ? 'arrow-up' : 'arrow-down'}"></i>
                            <span>${stats.conversionRate > 15 ? '+3%' : '-2%'} vs meta</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tempo Médio p/ Contato</div>
                        <div class="stat-value">${this.formatMinutes(stats.avgTimeToContact || 0)}</div>
                        <div class="stat-subtitle">Meta: &lt; 30 min</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Leads Convertidos</div>
                        <div class="stat-value">${stats.convertedLeads || 0}</div>
                        <div class="stat-subtitle">últimos 30 dias</div>
                    </div>
                </div>
            </div>

            <!-- Conversion Funnel -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h2><i class="fas fa-filter"></i> Funil de Conversão</h2>
                    <button class="btn-link" onclick="crm.navigateTo('kanban')">
                        Ver Kanban <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="funnel-container">
                    ${this.renderFunnelStages(pipeline)}
                </div>
            </div>

            <!-- Recent Leads & Hot Leads -->
            <div class="dashboard-grid">
                <!-- Recent Leads -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-clock"></i> Leads Recentes</h2>
                        <button class="btn-link" onclick="crm.navigateTo('list')">
                            Ver todos <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                    <div class="leads-list-compact">
                        ${this.renderRecentLeads()}
                    </div>
                </div>

                <!-- Hot Leads (Precisam de Follow-up) -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-fire"></i> Leads Quentes</h2>
                        <span class="badge badge-hot">${this.getHotLeadsCount()} precisam de ação</span>
                    </div>
                    <div class="hot-leads-list">
                        ${this.renderHotLeads()}
                    </div>
                </div>
            </div>
        `;
    },

    renderFunnelStages(pipeline) {
        if (!pipeline || pipeline.length === 0) {
            return '<div class="empty-state">Nenhum dado de funil disponível</div>';
        }

        const stageLabels = {
            'NEW': 'Novos',
            'CONTACTED': 'Contatados',
            'QUALIFIED': 'Qualificados',
            'TRIAL_SCHEDULED': 'Experimental Agendada',
            'TRIAL_ATTENDED': 'Compareceram',
            'NEGOTIATION': 'Negociação',
            'CONVERTED': 'Convertidos',
            'LOST': 'Perdidos'
        };

        const maxCount = Math.max(...pipeline.map(s => s.count));

        return pipeline
            .filter(stage => stage.stage !== 'LOST') // Não mostrar "perdidos" no funil
            .map(stage => {
                const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                const stageClass = stage.stage.toLowerCase();
                
                return `
                    <div class="funnel-stage" data-stage="${stage.stage}">
                        <div class="funnel-stage-label">
                            <span class="stage-name">${stageLabels[stage.stage] || stage.stage}</span>
                            <span class="stage-count">${stage.count} leads</span>
                        </div>
                        <div class="funnel-bar-container">
                            <div class="funnel-bar funnel-bar-${stageClass}" style="width: ${widthPercent}%">
                                <span class="funnel-percentage">${stage.percentage?.toFixed(1) || 0}%</span>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');
    },

    renderRecentLeads() {
        if (!this.leads || this.leads.length === 0) {
            return '<div class="empty-state">Nenhum lead cadastrado ainda</div>';
        }

        return this.leads.slice(0, 5).map(lead => `
            <div class="lead-item-compact" onclick="crm.viewLeadDetails('${lead.id}')">
                <div class="lead-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="lead-info">
                    <div class="lead-name">${lead.name}</div>
                    <div class="lead-meta">
                        <span><i class="fas fa-envelope"></i> ${lead.email}</span>
                        ${lead.phone ? `<span><i class="fas fa-phone"></i> ${lead.phone}</span>` : ''}
                    </div>
                </div>
                <div class="lead-status">
                    ${this.renderLeadBadge(lead)}
                    ${this.renderTemperatureBadge(lead.temperature)}
                </div>
            </div>
        `).join('');
    },

    renderHotLeads() {
        const hotLeads = this.leads.filter(lead => 
            lead.temperature === 'HOT' || 
            (lead.stage === 'TRIAL_SCHEDULED' && !lead.trialAttendedAt) ||
            (lead.stage === 'CONTACTED' && !lead.qualifiedAt && this.daysSince(lead.firstContactAt) > 3)
        );

        if (hotLeads.length === 0) {
            return '<div class="empty-state">✅ Nenhum lead precisando de follow-up urgente</div>';
        }

        return hotLeads.map(lead => `
            <div class="hot-lead-item" onclick="crm.viewLeadDetails('${lead.id}')">
                <div class="hot-lead-icon">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="hot-lead-content">
                    <div class="hot-lead-name">${lead.name}</div>
                    <div class="hot-lead-reason">
                        ${this.getHotLeadReason(lead)}
                    </div>
                </div>
                <button class="btn-action" onclick="event.stopPropagation(); crm.quickContact('${lead.id}')">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        `).join('');
    },

    renderLeadList() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <i class="fas fa-list"></i>
                        <div>
                            <h1>Lista de Leads</h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item" onclick="crm.navigateTo('dashboard')">CRM</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-item active">Leads</span>
                            </nav>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="crm.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i>
                            Voltar
                        </button>
                        <button class="btn-primary" onclick="crm.showCreateLeadForm()">
                            <i class="fas fa-plus"></i>
                            Novo Lead
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="module-filters-premium">
                <div class="filter-group">
                    <label>Buscar</label>
                    <input type="text" 
                           id="search-leads" 
                           placeholder="Nome, email ou telefone..." 
                           value="${this.filters.search}">
                </div>
                <div class="filter-group">
                    <label>Etapa</label>
                    <select id="filter-stage" onchange="crm.applyFilters()">
                        <option value="all">Todas</option>
                        <option value="NEW">Novos</option>
                        <option value="CONTACTED">Contatados</option>
                        <option value="QUALIFIED">Qualificados</option>
                        <option value="TRIAL_SCHEDULED">Experimental Agendada</option>
                        <option value="TRIAL_ATTENDED">Compareceram</option>
                        <option value="NEGOTIATION">Negociação</option>
                        <option value="CONVERTED">Convertidos</option>
                        <option value="LOST">Perdidos</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Temperatura</label>
                    <select id="filter-temperature" onchange="crm.applyFilters()">
                        <option value="all">Todas</option>
                        <option value="HOT">Quente 🔥</option>
                        <option value="WARM">Morno</option>
                        <option value="COLD">Frio ❄️</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status</label>
                    <select id="filter-status" onchange="crm.applyFilters()">
                        <option value="ACTIVE">Ativos</option>
                        <option value="INACTIVE">Inativos</option>
                        <option value="ARCHIVED">Arquivados</option>
                    </select>
                </div>
            </div>

            <!-- Leads Table -->
            <div class="data-card-premium">
                <div id="leads-table-container">
                    ${this.renderLeadsTable()}
                </div>
            </div>
        `;

        // Setup search with debounce
        this.setupSearchDebounce();
    },

    renderLeadsTable() {
        if (!this.leads || this.leads.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-user-slash fa-3x"></i>
                    <h3>Nenhum lead encontrado</h3>
                    <p>Comece adicionando seu primeiro lead</p>
                    <button class="btn-primary" onclick="crm.showCreateLeadForm()">
                        <i class="fas fa-plus"></i>
                        Adicionar Lead
                    </button>
                </div>
            `;
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Contato</th>
                        <th>Origem</th>
                        <th>Etapa</th>
                        <th>Temperatura</th>
                        <th>Responsável</th>
                        <th>Criado em</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.leads.map(lead => `
                        <tr class="clickable-row" ondblclick="crm.viewLeadDetails('${lead.id}')">
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div>
                                        <div class="user-name">${lead.name}</div>
                                        ${lead.courseInterest ? `<div class="user-subtitle">${lead.courseInterest}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="contact-cell">
                                    <div><i class="fas fa-envelope"></i> ${lead.email}</div>
                                    ${lead.phone ? `<div><i class="fas fa-phone"></i> ${lead.phone}</div>` : ''}
                                </div>
                            </td>
                            <td>
                                ${lead.sourceCampaign ? `
                                    <div class="source-cell">
                                        <i class="fab fa-google"></i>
                                        <span>${lead.sourceCampaign}</span>
                                    </div>
                                ` : '<span class="text-muted">Direto</span>'}
                            </td>
                            <td>${this.renderLeadBadge(lead)}</td>
                            <td>${this.renderTemperatureBadge(lead.temperature)}</td>
                            <td>
                                ${lead.assignedTo ? `
                                    <div class="assigned-user">
                                        <i class="fas fa-user-circle"></i>
                                        ${lead.assignedTo.firstName} ${lead.assignedTo.lastName}
                                    </div>
                                ` : '<span class="text-muted">Não atribuído</span>'}
                            </td>
                            <td>${this.formatDate(lead.createdAt)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action" onclick="event.stopPropagation(); crm.viewLeadDetails('${lead.id}')" title="Ver detalhes">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action" onclick="event.stopPropagation(); crm.editLead('${lead.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    ${lead.stage !== 'CONVERTED' ? `
                                        <button class="btn-action btn-success" onclick="event.stopPropagation(); crm.convertLead('${lead.id}')" title="Converter em aluno">
                                            <i class="fas fa-user-check"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    async renderLeadDetails() {
        if (!this.currentLeadId) {
            this.showNotification('ID do lead não especificado', 'error');
            this.navigateTo('list');
            return;
        }

        try {
            // Load lead details
            const response = await this.moduleAPI.request(`/api/crm/leads/${this.currentLeadId}`);
            const lead = response.data;

            this.container.innerHTML = `
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <i class="fas fa-user-circle"></i>
                            <div>
                                <h1>${lead.name}</h1>
                                <nav class="breadcrumb">
                                    <span class="breadcrumb-item" onclick="crm.navigateTo('dashboard')">CRM</span>
                                    <i class="fas fa-chevron-right"></i>
                                    <span class="breadcrumb-item" onclick="crm.navigateTo('list')">Leads</span>
                                    <i class="fas fa-chevron-right"></i>
                                    <span class="breadcrumb-item active">${lead.name}</span>
                                </nav>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="crm.navigateTo('list')">
                                <i class="fas fa-arrow-left"></i>
                                Voltar
                            </button>
                            <button class="btn-secondary" onclick="crm.editLead('${lead.id}')">
                                <i class="fas fa-edit"></i>
                                Editar
                            </button>
                            ${lead.stage !== 'CONVERTED' ? `
                                <button class="btn-success" onclick="crm.convertLead('${lead.id}')">
                                    <i class="fas fa-user-check"></i>
                                    Converter em Aluno
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="lead-details-container">
                    <!-- Lead Info Card -->
                    <div class="lead-info-section">
                        <div class="data-card-premium">
                            <div class="card-header">
                                <h2>Informações do Lead</h2>
                                <div class="lead-badges">
                                    ${this.renderLeadBadge(lead)}
                                    ${this.renderTemperatureBadge(lead.temperature)}
                                </div>
                            </div>
                            <div class="lead-info-grid">
                                <div class="info-item">
                                    <label><i class="fas fa-envelope"></i> Email</label>
                                    <a href="mailto:${lead.email}">${lead.email}</a>
                                </div>
                                ${lead.phone ? `
                                    <div class="info-item">
                                        <label><i class="fas fa-phone"></i> Telefone</label>
                                        <a href="tel:${lead.phone}">${lead.phone}</a>
                                    </div>
                                ` : ''}
                                ${lead.courseInterest ? `
                                    <div class="info-item">
                                        <label><i class="fas fa-graduation-cap"></i> Curso de Interesse</label>
                                        <span>${lead.courseInterest}</span>
                                    </div>
                                ` : ''}
                                ${lead.sourceCampaign ? `
                                    <div class="info-item">
                                        <label><i class="fab fa-google"></i> Campanha</label>
                                        <span>${lead.sourceCampaign}</span>
                                    </div>
                                ` : ''}
                                ${lead.assignedTo ? `
                                    <div class="info-item">
                                        <label><i class="fas fa-user-tie"></i> Responsável</label>
                                        <span>${lead.assignedTo.firstName} ${lead.assignedTo.lastName}</span>
                                    </div>
                                ` : ''}
                                <div class="info-item">
                                    <label><i class="fas fa-calendar"></i> Criado em</label>
                                    <span>${this.formatDate(lead.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Timeline -->
                        <div class="data-card-premium">
                            <div class="card-header">
                                <h2><i class="fas fa-stream"></i> Timeline de Atividades</h2>
                                <button class="btn-primary" onclick="crm.addActivity('${lead.id}')">
                                    <i class="fas fa-plus"></i>
                                    Nova Atividade
                                </button>
                            </div>
                            <div class="timeline-container">
                                ${this.renderTimeline(lead.activities)}
                            </div>
                        </div>
                    </div>

                    <!-- Notes Sidebar -->
                    <div class="lead-notes-section">
                        <div class="data-card-premium">
                            <div class="card-header">
                                <h2><i class="fas fa-sticky-note"></i> Anotações</h2>
                                <button class="btn-primary" onclick="crm.addNote('${lead.id}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="notes-container">
                                ${this.renderNotes(lead.notes)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading lead details:', error);
            this.showNotification('Erro ao carregar detalhes do lead', 'error');
            this.navigateTo('list');
        }
    },

    renderKanbanBoard() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <i class="fas fa-columns"></i>
                        <div>
                            <h1>Pipeline Kanban</h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item" onclick="crm.navigateTo('dashboard')">CRM</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-item active">Kanban</span>
                            </nav>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="crm.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i>
                            Voltar
                        </button>
                        <button class="btn-primary" onclick="crm.showCreateLeadForm()">
                            <i class="fas fa-plus"></i>
                            Novo Lead
                        </button>
                    </div>
                </div>
            </div>

            <div class="kanban-board">
                ${this.renderKanbanColumns()}
            </div>
        `;

        // Setup drag and drop
        this.setupKanbanDragDrop();
    },

    renderKanbanColumns() {
        const stages = [
            { id: 'NEW', name: 'Novos', icon: 'fa-star' },
            { id: 'CONTACTED', name: 'Contatados', icon: 'fa-phone' },
            { id: 'QUALIFIED', name: 'Qualificados', icon: 'fa-check' },
            { id: 'TRIAL_SCHEDULED', name: 'Experimental Agendada', icon: 'fa-calendar-check' },
            { id: 'TRIAL_ATTENDED', name: 'Compareceram', icon: 'fa-user-check' },
            { id: 'NEGOTIATION', name: 'Negociação', icon: 'fa-handshake' },
            { id: 'CONVERTED', name: 'Convertidos', icon: 'fa-trophy' },
        ];

        return stages.map(stage => {
            const stageLeads = this.leads.filter(lead => lead.stage === stage.id);
            
            return `
                <div class="kanban-column" data-stage="${stage.id}">
                    <div class="kanban-column-header">
                        <div class="column-title">
                            <i class="fas ${stage.icon}"></i>
                            <span>${stage.name}</span>
                        </div>
                        <span class="column-count">${stageLeads.length}</span>
                    </div>
                    <div class="kanban-column-content" data-stage="${stage.id}">
                        ${stageLeads.map(lead => this.renderKanbanCard(lead)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderKanbanCard(lead) {
        return `
            <div class="kanban-card" 
                 draggable="true" 
                 data-lead-id="${lead.id}"
                 ondblclick="crm.viewLeadDetails('${lead.id}')">
                <div class="kanban-card-header">
                    <span class="lead-name">${lead.name}</span>
                    ${this.renderTemperatureBadge(lead.temperature)}
                </div>
                <div class="kanban-card-body">
                    ${lead.email ? `<div class="card-meta"><i class="fas fa-envelope"></i> ${lead.email}</div>` : ''}
                    ${lead.phone ? `<div class="card-meta"><i class="fas fa-phone"></i> ${lead.phone}</div>` : ''}
                    ${lead.courseInterest ? `<div class="card-meta"><i class="fas fa-graduation-cap"></i> ${lead.courseInterest}</div>` : ''}
                </div>
                <div class="kanban-card-footer">
                    <span class="card-date">${this.formatDate(lead.createdAt)}</span>
                    ${lead.assignedTo ? `
                        <span class="assigned-user">
                            <i class="fas fa-user"></i> ${lead.assignedTo.firstName}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderAnalytics() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <i class="fas fa-chart-line"></i>
                        <div>
                            <h1>Analytics & ROI</h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item" onclick="crm.navigateTo('dashboard')">CRM</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-item active">Analytics</span>
                            </nav>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="crm.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i>
                            Voltar
                        </button>
                    </div>
                </div>
            </div>

            <div class="analytics-container">
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-dollar-sign"></i> ROI por Campanha</h2>
                    </div>
                    <div id="roi-chart-container">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Carregando dados...</span>
                        </div>
                    </div>
                </div>

                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-filter"></i> Funil de Conversão Detalhado</h2>
                    </div>
                    <div id="funnel-chart-container">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Carregando dados...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load analytics data
        this.loadAnalyticsData();
    },

    // ========================================================================
    // HELPER METHODS - RENDERING
    // ========================================================================

    renderLeadBadge(lead) {
        const stageConfig = {
            'NEW': { label: 'Novo', class: 'badge-new' },
            'CONTACTED': { label: 'Contatado', class: 'badge-contacted' },
            'QUALIFIED': { label: 'Qualificado', class: 'badge-qualified' },
            'TRIAL_SCHEDULED': { label: 'Experimental Agendada', class: 'badge-trial' },
            'TRIAL_ATTENDED': { label: 'Compareceu', class: 'badge-attended' },
            'NEGOTIATION': { label: 'Negociação', class: 'badge-negotiation' },
            'CONVERTED': { label: 'Convertido', class: 'badge-success' },
            'LOST': { label: 'Perdido', class: 'badge-lost' }
        };

        const config = stageConfig[lead.stage] || { label: lead.stage, class: 'badge-default' };
        return `<span class="badge ${config.class}">${config.label}</span>`;
    },

    renderTemperatureBadge(temperature) {
        const tempConfig = {
            'HOT': { label: '🔥 Quente', class: 'badge-hot' },
            'WARM': { label: '☀️ Morno', class: 'badge-warm' },
            'COLD': { label: '❄️ Frio', class: 'badge-cold' }
        };

        const config = tempConfig[temperature] || { label: temperature, class: 'badge-default' };
        return `<span class="badge ${config.class}">${config.label}</span>`;
    },

    renderTimeline(activities) {
        if (!activities || activities.length === 0) {
            return '<div class="empty-state">Nenhuma atividade registrada</div>';
        }

        return activities.map(activity => `
            <div class="timeline-item">
                <div class="timeline-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <strong>${activity.title}</strong>
                        <span class="timeline-date">${this.formatDate(activity.createdAt)}</span>
                    </div>
                    ${activity.description ? `<p>${activity.description}</p>` : ''}
                    ${activity.user ? `
                        <div class="timeline-user">
                            <i class="fas fa-user"></i>
                            ${activity.user.firstName} ${activity.user.lastName}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    renderNotes(notes) {
        if (!notes || notes.length === 0) {
            return '<div class="empty-state">Nenhuma anotação</div>';
        }

        return notes.map(note => `
            <div class="note-item ${note.isPinned ? 'note-pinned' : ''}">
                ${note.isPinned ? '<div class="note-pin"><i class="fas fa-thumbtack"></i></div>' : ''}
                <div class="note-content">${note.content}</div>
                <div class="note-footer">
                    <span class="note-author">
                        <i class="fas fa-user"></i>
                        ${note.user.firstName} ${note.user.lastName}
                    </span>
                    <span class="note-date">${this.formatDate(note.createdAt)}</span>
                </div>
            </div>
        `).join('');
    },

    getActivityIcon(type) {
        const icons = {
            'CALL': 'fa-phone',
            'EMAIL': 'fa-envelope',
            'WHATSAPP': 'fa-whatsapp',
            'SMS': 'fa-sms',
            'MEETING': 'fa-handshake',
            'TRIAL_CLASS': 'fa-graduation-cap',
            'FOLLOW_UP': 'fa-redo',
            'NOTE': 'fa-sticky-note',
            'STATUS_CHANGE': 'fa-exchange-alt',
            'DOCUMENT_SENT': 'fa-file-pdf',
            'PAYMENT_RECEIVED': 'fa-dollar-sign'
        };
        return icons[type] || 'fa-circle';
    },

    // ========================================================================
    // ACTIONS
    // ========================================================================

    async showCreateLeadForm() {
        // TODO: Implement modal or full-screen form
        const name = prompt('Nome do lead:');
        if (!name) return;

        const email = prompt('Email:');
        if (!email) return;

        const phone = prompt('Telefone (opcional):');

        try {
            const response = await this.moduleAPI.request('/api/crm/leads', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    email,
                    phone
                })
            });

            if (response.success) {
                this.showNotification('Lead criado com sucesso!', 'success');
                await this.loadInitialData();
                this.render();
            }
        } catch (error) {
            console.error('❌ Error creating lead:', error);
            this.showNotification('Erro ao criar lead', 'error');
        }
    },

    async convertLead(leadId) {
        if (!confirm('Deseja converter este lead em aluno?')) return;

        try {
            // Get current user ID (assuming default user)
            const userId = 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1'; // TODO: Get from auth

            const response = await this.moduleAPI.request(`/api/crm/leads/${leadId}/convert`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });

            if (response.success) {
                this.showNotification('Lead convertido em aluno com sucesso!', 'success');
                await this.loadInitialData();
                this.render();
            }
        } catch (error) {
            console.error('❌ Error converting lead:', error);
            this.showNotification('Erro ao converter lead', 'error');
        }
    },

    async addActivity(leadId) {
        // TODO: Implement activity form modal
        const title = prompt('Título da atividade:');
        if (!title) return;

        const description = prompt('Descrição (opcional):');
        const userId = 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1'; // TODO: Get from auth

        try {
            const response = await this.moduleAPI.request(`/api/crm/leads/${leadId}/activities`, {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    type: 'NOTE',
                    title,
                    description
                })
            });

            if (response.success) {
                this.showNotification('Atividade adicionada!', 'success');
                this.renderLeadDetails(); // Reload details
            }
        } catch (error) {
            console.error('❌ Error adding activity:', error);
            this.showNotification('Erro ao adicionar atividade', 'error');
        }
    },

    async addNote(leadId) {
        const content = prompt('Anotação:');
        if (!content) return;

        const userId = 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1'; // TODO: Get from auth

        try {
            const response = await this.moduleAPI.request(`/api/crm/leads/${leadId}/notes`, {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    content
                })
            });

            if (response.success) {
                this.showNotification('Anotação adicionada!', 'success');
                this.renderLeadDetails(); // Reload details
            }
        } catch (error) {
            console.error('❌ Error adding note:', error);
            this.showNotification('Erro ao adicionar anotação', 'error');
        }
    },

    viewLeadDetails(leadId) {
        this.currentLeadId = leadId;
        this.navigateTo('details');
    },

    editLead(leadId) {
        // TODO: Implement edit form
        this.showNotification('Função de edição em desenvolvimento', 'info');
    },

    quickContact(leadId) {
        // TODO: Implement quick contact modal
        this.showNotification('Função de contato rápido em desenvolvimento', 'info');
    },

    // ========================================================================
    // NAVIGATION & FILTERS
    // ========================================================================

    navigateTo(view) {
        this.currentView = view;
        this.render();
    },

    async applyFilters() {
        // Get filter values
        this.filters.stage = document.getElementById('filter-stage')?.value || 'all';
        this.filters.temperature = document.getElementById('filter-temperature')?.value || 'all';
        this.filters.status = document.getElementById('filter-status')?.value || 'ACTIVE';

        await this.loadLeads();
        document.getElementById('leads-table-container').innerHTML = this.renderLeadsTable();
    },

    setupSearchDebounce() {
        const searchInput = document.getElementById('search-leads');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                this.filters.search = e.target.value;
                await this.loadLeads();
                document.getElementById('leads-table-container').innerHTML = this.renderLeadsTable();
            }, 300);
        });
    },

    async loadLeads() {
        try {
            const params = new URLSearchParams();
            if (this.filters.stage !== 'all') params.append('stage', this.filters.stage);
            if (this.filters.temperature !== 'all') params.append('temperature', this.filters.temperature);
            if (this.filters.status) params.append('status', this.filters.status);
            if (this.filters.search) params.append('search', this.filters.search);

            const response = await this.moduleAPI.request(`/api/crm/leads?${params.toString()}`);
            this.leads = response.data || [];
        } catch (error) {
            console.error('❌ Error loading leads:', error);
            this.showNotification('Erro ao carregar leads', 'error');
        }
    },

    async loadAnalyticsData() {
        try {
            const [roiResponse, funnelResponse] = await Promise.all([
                this.moduleAPI.request('/api/crm/analytics/roi'),
                this.moduleAPI.request('/api/crm/analytics/funnel')
            ]);

            // Render ROI chart
            document.getElementById('roi-chart-container').innerHTML = this.renderROIChart(roiResponse.data);
            
            // Render Funnel chart
            document.getElementById('funnel-chart-container').innerHTML = this.renderFunnelChart(funnelResponse.data);

        } catch (error) {
            console.error('❌ Error loading analytics:', error);
            this.showNotification('Erro ao carregar analytics', 'error');
        }
    },

    renderROIChart(roiData) {
        if (!roiData || roiData.length === 0) {
            return '<div class="empty-state">Nenhum dado de ROI disponível</div>';
        }

        return `
            <div class="roi-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Campanha</th>
                            <th>Conversões</th>
                            <th>Custo Total</th>
                            <th>Receita Total</th>
                            <th>ROI</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${roiData.map(item => `
                            <tr>
                                <td><strong>${item.campaign}</strong></td>
                                <td>${item.conversions}</td>
                                <td>R$ ${item.totalCost.toFixed(2)}</td>
                                <td>R$ ${item.totalRevenue.toFixed(2)}</td>
                                <td>
                                    <span class="roi-badge ${item.roi > 500 ? 'roi-excellent' : item.roi > 200 ? 'roi-good' : 'roi-fair'}">
                                        ${item.roi.toFixed(0)}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderFunnelChart(funnelData) {
        if (!funnelData || funnelData.length === 0) {
            return '<div class="empty-state">Nenhum dado de funil disponível</div>';
        }

        return `
            <div class="funnel-chart">
                ${funnelData.map((stage, index) => {
                    const prevStage = index > 0 ? funnelData[index - 1] : null;
                    const dropOff = prevStage ? prevStage.count - stage.count : 0;
                    
                    return `
                        <div class="funnel-stage-detailed">
                            <div class="stage-info">
                                <h3>${stage.stage}</h3>
                                <div class="stage-metrics">
                                    <div class="metric">
                                        <span class="metric-value">${stage.count}</span>
                                        <span class="metric-label">Leads</span>
                                    </div>
                                    <div class="metric">
                                        <span class="metric-value">${stage.conversionRate.toFixed(1)}%</span>
                                        <span class="metric-label">Conv. Rate</span>
                                    </div>
                                    ${dropOff > 0 ? `
                                        <div class="metric metric-dropoff">
                                            <span class="metric-value">-${dropOff}</span>
                                            <span class="metric-label">Drop-off</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // ========================================================================
    // KANBAN DRAG & DROP
    // ========================================================================

    setupKanbanDragDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-column-content');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', card.innerHTML);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');

                const draggedCard = document.querySelector('.dragging');
                if (!draggedCard) return;

                const leadId = draggedCard.dataset.leadId;
                const newStage = column.dataset.stage;

                // Move card visually first
                column.appendChild(draggedCard);

                // Update backend
                await this.moveLeadToStage(leadId, newStage);
            });
        });
    },

    async moveLeadToStage(leadId, newStage) {
        try {
            const userId = 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1'; // TODO: Get from auth

            const response = await this.moduleAPI.request(`/api/crm/leads/${leadId}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    stage: newStage,
                    userId
                })
            });

            if (response.success) {
                this.showNotification('Lead movido com sucesso!', 'success');
                await this.loadInitialData();
            }
        } catch (error) {
            console.error('❌ Error moving lead:', error);
            this.showNotification('Erro ao mover lead', 'error');
            // Reload to restore correct state
            this.renderKanbanBoard();
        }
    },

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatMinutes(minutes) {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    },

    daysSince(dateString) {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    getHotLeadsCount() {
        return this.leads.filter(lead => 
            lead.temperature === 'HOT' || 
            (lead.stage === 'TRIAL_SCHEDULED' && !lead.trialAttendedAt) ||
            (lead.stage === 'CONTACTED' && !lead.qualifiedAt && this.daysSince(lead.firstContactAt) > 3)
        ).length;
    },

    getHotLeadReason(lead) {
        if (lead.temperature === 'HOT') {
            return '🔥 Lead muito interessado';
        }
        if (lead.stage === 'TRIAL_SCHEDULED' && !lead.trialAttendedAt) {
            return '📅 Experimental agendada - fazer follow-up';
        }
        if (lead.stage === 'CONTACTED' && !lead.qualifiedAt && this.daysSince(lead.firstContactAt) > 3) {
            return '⏰ Sem retorno há 3+ dias';
        }
        return 'Precisa de atenção';
    },

    // ========================================================================
    // GOOGLE ADS SETTINGS
    // ========================================================================

    async renderSettings() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <i class="fas fa-cog"></i>
                        <div>
                            <h1>Configurações do CRM</h1>
                            <nav class="breadcrumb">
                                <span class="breadcrumb-item" onclick="crm.navigateTo('dashboard')">CRM</span>
                                <i class="fas fa-chevron-right"></i>
                                <span class="breadcrumb-item active">Settings</span>
                            </nav>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="crm.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i>
                            Voltar ao Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div class="settings-container">
                <div id="settings-loading" class="loading-state" style="display: none;">
                    <div class="spinner"></div>
                    <p>Carregando configurações...</p>
                </div>

                <!-- Google Ads Integration Section -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fab fa-google"></i> Integração Google Ads</h2>
                        <div id="google-ads-status-badge"></div>
                    </div>

                    <div class="settings-section">
                        <!-- Step 1: API Credentials -->
                        <div class="settings-group">
                            <h3><i class="fas fa-key"></i> 1. Credenciais da API</h3>
                            <p class="settings-description">
                                Configure as credenciais obtidas no Google Cloud Console e Google Ads.
                                <a href="GOOGLE_ADS_SETUP.md" target="_blank">Ver guia completo</a>
                            </p>

                            <form id="google-ads-credentials-form" class="settings-form">
                                <div class="form-group">
                                    <label for="clientId">Client ID</label>
                                    <input type="text" id="clientId" name="clientId" 
                                           placeholder="123456789.apps.googleusercontent.com"
                                           class="form-control">
                                    <small>Obtenha no Google Cloud Console → APIs & Services → Credentials</small>
                                </div>

                                <div class="form-group">
                                    <label for="clientSecret">Client Secret</label>
                                    <input type="password" id="clientSecret" name="clientSecret" 
                                           placeholder="GOCSPX-xxxxxxxxxxxxx"
                                           class="form-control">
                                    <small>Disponível ao criar OAuth 2.0 Client ID</small>
                                </div>

                                <div class="form-group">
                                    <label for="developerToken">Developer Token</label>
                                    <input type="text" id="developerToken" name="developerToken" 
                                           placeholder="abcdefghijklmnopqrstuvwx"
                                           class="form-control">
                                    <small>Obtenha em Google Ads → Admin → API Center</small>
                                </div>

                                <div class="form-group">
                                    <label for="customerId">Customer ID</label>
                                    <input type="text" id="customerId" name="customerId" 
                                           placeholder="123-456-7890"
                                           class="form-control">
                                    <small>Encontre no canto superior direito do Google Ads (formato: XXX-XXX-XXXX)</small>
                                </div>

                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i>
                                    Salvar Credenciais
                                </button>
                            </form>
                        </div>

                        <!-- Step 2: OAuth Connection -->
                        <div class="settings-group">
                            <h3><i class="fas fa-link"></i> 2. Conectar Conta Google Ads</h3>
                            <p class="settings-description">
                                Após salvar as credenciais, clique no botão abaixo para autorizar o acesso.
                            </p>

                            <div id="oauth-section">
                                <button id="btn-connect-google-ads" class="btn-secondary" onclick="crm.connectGoogleAds()">
                                    <i class="fab fa-google"></i>
                                    Conectar Google Ads
                                </button>
                                <button id="btn-test-connection" class="btn-secondary" onclick="crm.testGoogleAdsConnection()" style="display: none;">
                                    <i class="fas fa-vial"></i>
                                    Testar Conexão
                                </button>
                                <button id="btn-disconnect" class="btn-danger" onclick="crm.disconnectGoogleAds()" style="display: none;">
                                    <i class="fas fa-unlink"></i>
                                    Desconectar
                                </button>
                            </div>

                            <div id="connection-status" class="status-message"></div>
                        </div>

                        <!-- Step 3: Campaign Sync -->
                        <div class="settings-group" id="campaigns-section" style="display: none;">
                            <h3><i class="fas fa-sync"></i> 3. Sincronizar Campanhas</h3>
                            <p class="settings-description">
                                Sincronize suas campanhas do Google Ads para acompanhar métricas e ROI.
                            </p>

                            <div class="action-buttons">
                                <button class="btn-primary" onclick="crm.syncGoogleAdsCampaigns(event)">
                                    <i class="fas fa-sync"></i>
                                    Sincronizar Campanhas
                                </button>
                                <button class="btn-secondary" onclick="crm.loadSyncedCampaigns()">
                                    <i class="fas fa-list"></i>
                                    Ver Campanhas Sincronizadas
                                </button>
                            </div>

                            <div id="campaigns-list" class="campaigns-container"></div>
                        </div>

                        <!-- Step 4: Conversion Action -->
                        <div class="settings-group" id="conversion-section" style="display: none;">
                            <h3><i class="fas fa-chart-line"></i> 4. Ação de Conversão</h3>
                            <p class="settings-description">
                                Selecione a ação de conversão que será usada para upload de conversões offline.
                            </p>

                            <form id="conversion-action-form" class="settings-form">
                                <div class="form-group">
                                    <label for="conversionAction">Ação de Conversão</label>
                                    <input type="text" id="conversionAction" name="conversionAction" 
                                           placeholder="customers/1234567890/conversionActions/987654321"
                                           class="form-control">
                                    <small>Encontre em Google Ads → Tools → Conversions → Click ID of your conversion action</small>
                                </div>

                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i>
                                    Salvar Ação de Conversão
                                </button>
                            </form>

                            <div class="conversion-stats">
                                <h4>Upload de Conversões</h4>
                                <div id="pending-conversions-info"></div>
                                <button class="btn-secondary" onclick="crm.uploadPendingConversions()">
                                    <i class="fas fa-upload"></i>
                                    Upload de Conversões Pendentes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CSV Import Section -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-file-csv"></i> Importar Dados do Google Ads (CSV)</h2>
                        <span class="badge badge-info">
                            <i class="fas fa-info-circle"></i> Use enquanto aguarda aprovação da API
                        </span>
                    </div>

                    <div class="settings-section">
                        <div class="settings-group">
                            <h3><i class="fas fa-upload"></i> Upload de Arquivos CSV</h3>
                            <p class="settings-description">
                                Arraste e solte os arquivos CSV exportados do Google Ads ou clique para selecionar.
                                Você pode importar múltiplos arquivos de uma vez.
                            </p>

                            <!-- Drag & Drop Zone -->
                            <div id="csv-dropzone" class="csv-dropzone">
                                <div class="dropzone-content">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <h4>Arraste os arquivos CSV aqui</h4>
                                    <p>ou</p>
                                    <button type="button" class="btn-primary" onclick="document.getElementById('csv-file-input').click()">
                                        <i class="fas fa-folder-open"></i>
                                        Selecionar Arquivos
                                    </button>
                                    <input type="file" id="csv-file-input" multiple accept=".csv" style="display: none;">
                                </div>
                            </div>

                            <!-- Files List -->
                            <div id="csv-files-list" class="csv-files-list" style="display: none;"></div>

                            <!-- Upload Progress -->
                            <div id="upload-progress" class="upload-progress" style="display: none;">
                                <div class="progress-header">
                                    <span id="progress-text">Processando arquivos...</span>
                                    <span id="progress-percentage">0%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div id="progress-bar" class="progress-bar" style="width: 0%"></div>
                                </div>
                            </div>

                            <!-- Import Summary -->
                            <div id="import-summary" class="import-summary" style="display: none;"></div>

                            <!-- Action Buttons -->
                            <div id="import-actions" class="action-buttons" style="display: none; margin-top: 1rem;">
                                <button class="btn-primary" onclick="crm.startCsvImport()">
                                    <i class="fas fa-play"></i>
                                    Iniciar Importação
                                </button>
                                <button class="btn-secondary" onclick="crm.clearCsvFiles()">
                                    <i class="fas fa-times"></i>
                                    Limpar Arquivos
                                </button>
                            </div>

                            <!-- Help Text -->
                            <div class="info-box" style="margin-top: 1.5rem;">
                                <i class="fas fa-question-circle"></i>
                                <div>
                                    <strong>Arquivos aceitos</strong>
                                    <ul style="margin: 0.5rem 0 0 1.5rem; font-size: 0.875rem;">
                                        <li>Campanhas (Campanhas_*.csv)</li>
                                        <li>Série Temporal (Série_temporal_*.csv)</li>
                                        <li>Dispositivos (Dispositivos_*.csv)</li>
                                        <li>Demografia - Idade (Informações_demográficas_-_idade_*.csv)</li>
                                        <li>Demografia - Sexo (Informações_demográficas_-_sexo_*.csv)</li>
                                        <li>Palavras-chave (Palavras-chave_de_pesquisa_*.csv)</li>
                                        <li>Dia e Hora (Dia_e_hora_*.csv)</li>
                                        <li>Redes (Redes_*.csv)</li>
                                    </ul>
                                    <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                                        <strong>Dica:</strong> Exporte esses arquivos do Google Ads em 
                                        <em>Campanhas → Exportar → CSV</em>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Automation Settings -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h2><i class="fas fa-robot"></i> Automação</h2>
                    </div>

                    <div class="settings-section">
                        <div class="settings-group">
                            <h3><i class="fas fa-clock"></i> Sincronização Automática</h3>
                            <p class="settings-description">
                                A sincronização automática roda a cada 6 horas via cron job.
                                Próxima execução: <strong id="next-sync-time">--:--</strong>
                            </p>

                            <div class="automation-info">
                                <div class="info-box">
                                    <i class="fas fa-info-circle"></i>
                                    <div>
                                        <strong>Sincronização automática configurada</strong>
                                        <p>Script: <code>scripts/sync-google-ads.ts</code></p>
                                        <p>Comando: <code>npm run sync:google-ads</code></p>
                                        <p>Frequência: A cada 6 horas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load current settings
        await this.loadGoogleAdsSettings();
        
        // Setup CSV dropzone
        this.setupCsvDropzone();
    },

    async loadGoogleAdsSettings() {
        try {
            console.log('[GOOGLE ADS] Loading settings...');
            const response = await this.moduleAPI.request('/api/google-ads/auth/status');
            
            console.log('[GOOGLE ADS] Status response:', response);
            
            if (response.success && response.data) {
                const { connected, enabled, customerId, clientId, clientSecret, developerToken } = response.data;
                
                // ⭐ PREENCHER CAMPOS COM CREDENCIAIS SALVAS
                if (clientId) {
                    const clientIdInput = document.getElementById('clientId');
                    if (clientIdInput) {
                        clientIdInput.value = clientId;
                        console.log('[GOOGLE ADS] ✅ Client ID loaded:', clientId.substring(0, 20) + '...');
                    }
                }
                
                if (clientSecret) {
                    const clientSecretInput = document.getElementById('clientSecret');
                    if (clientSecretInput) {
                        clientSecretInput.value = clientSecret;
                        console.log('[GOOGLE ADS] ✅ Client Secret loaded');
                    }
                }
                
                if (developerToken) {
                    const devTokenInput = document.getElementById('developerToken');
                    if (devTokenInput) {
                        devTokenInput.value = developerToken;
                        console.log('[GOOGLE ADS] ✅ Developer Token loaded');
                    }
                }
                
                if (customerId) {
                    const customerIdInput = document.getElementById('customerId');
                    if (customerIdInput) {
                        customerIdInput.value = customerId;
                        console.log('[GOOGLE ADS] ✅ Customer ID loaded:', customerId);
                    }
                }
                
                // Update status badge
                const badge = document.getElementById('google-ads-status-badge');
                const btnConnect = document.getElementById('btn-connect-google-ads');
                const connectionStatus = document.getElementById('connection-status');
                
                if (connected) {
                    badge.innerHTML = '<span class="badge badge-success"><i class="fas fa-check-circle"></i> ✅ Conectado</span>';
                    if (btnConnect) {
                        btnConnect.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Conectado';
                        btnConnect.disabled = true;
                        btnConnect.style.backgroundColor = '#10b981';
                    }
                    if (connectionStatus) {
                        connectionStatus.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> ✅ Google Ads conectado com sucesso! Seus dados estão sendo sincronizados.</div>';
                    }
                    document.getElementById('campaigns-section').style.display = 'block';
                    document.getElementById('conversion-section').style.display = 'block';
                    document.getElementById('btn-test-connection').style.display = 'inline-block';
                    document.getElementById('btn-disconnect').style.display = 'inline-block';
                } else if (clientId && clientSecret && developerToken) {
                    badge.innerHTML = '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Credenciais Salvas</span>';
                    if (btnConnect) {
                        btnConnect.innerHTML = '<i class="fas fa-link"></i> Conectar Google Ads';
                        btnConnect.disabled = false;
                        btnConnect.style.backgroundColor = '';
                    }
                    if (connectionStatus) {
                        connectionStatus.innerHTML = '<div class="alert alert-warning"><i class="fas fa-info-circle"></i> Credenciais salvas. Clique no botão abaixo para autorizar o acesso.</div>';
                    }
                    console.log('[GOOGLE ADS] Credentials saved, ready to connect');
                } else {
                    badge.innerHTML = '<span class="badge badge-secondary"><i class="fas fa-times-circle"></i> Não Configurado</span>';
                    if (btnConnect) {
                        btnConnect.innerHTML = '<i class="fas fa-link"></i> Conectar Google Ads';
                        btnConnect.disabled = false;
                        btnConnect.style.backgroundColor = '';
                    }
                    if (connectionStatus) {
                        connectionStatus.innerHTML = '<div class="alert alert-secondary"><i class="fas fa-exclamation-circle"></i> Configure e salve as credenciais para começar.</div>';
                    }
                    console.log('[GOOGLE ADS] No credentials saved');
                }

                // Load pending conversions count
                await this.loadPendingConversionsCount();
            }
        } catch (error) {
            console.error('[GOOGLE ADS] Error loading settings:', error);
        }

        // Setup form handlers
        this.setupSettingsEventHandlers();
    },

    setupSettingsEventHandlers() {
        // Credentials form
        const credentialsForm = document.getElementById('google-ads-credentials-form');
        if (credentialsForm) {
            credentialsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveGoogleAdsCredentials();
            });
        }

        // Conversion action form
        const conversionForm = document.getElementById('conversion-action-form');
        if (conversionForm) {
            conversionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveConversionAction();
            });
        }
    },

    async saveGoogleAdsCredentials() {
        const clientId = document.getElementById('clientId').value;
        const clientSecret = document.getElementById('clientSecret').value;
        const developerToken = document.getElementById('developerToken').value;
        const customerId = document.getElementById('customerId').value;

        if (!clientId || !clientSecret || !developerToken || !customerId) {
            this.showNotification('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await this.moduleAPI.request('/api/google-ads/auth/save-credentials', {
                method: 'POST',
                body: JSON.stringify({ clientId, clientSecret, developerToken, customerId })
            });

            if (response.success) {
                this.showNotification('Credenciais salvas com sucesso!', 'success');
                await this.loadGoogleAdsSettings(); // Reload to update UI
            } else {
                this.showNotification(response.message || 'Erro ao salvar credenciais', 'error');
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
            this.showNotification('Erro ao salvar credenciais', 'error');
        }
    },

    async connectGoogleAds() {
        try {
            console.log('[CONNECT] Starting Google Ads OAuth connection...');
            
            // Backend will fetch credentials from database automatically
            const response = await this.moduleAPI.request('/api/google-ads/auth/url');
            
            console.log('[CONNECT] Auth URL response:', response);
            
            if (!response.success) {
                this.showNotification(
                    response.message || 'Erro ao gerar URL de autorização. Verifique se salvou as credenciais.',
                    'error'
                );
                return;
            }
            
            if (!response.data?.authUrl) {
                this.showNotification('URL de autorização não foi gerada', 'error');
                return;
            }
            
            if (response.success && response.data?.authUrl) {
                // Open OAuth window
                const width = 600;
                const height = 700;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                
                window.open(
                    response.data.authUrl,
                    'Google Ads OAuth',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                // Listen for OAuth callback
                window.addEventListener('message', async (event) => {
                    if (event.data.type === 'google-ads-oauth-success') {
                        this.showNotification('Conectado ao Google Ads com sucesso!', 'success');
                        await this.loadGoogleAdsSettings();
                    }
                });
            } else {
                this.showNotification(response.message || 'Erro ao gerar URL de autorização', 'error');
            }
        } catch (error) {
            console.error('Error connecting Google Ads:', error);
            this.showNotification('Erro ao conectar Google Ads', 'error');
        }
    },

    async testGoogleAdsConnection() {
        const statusEl = document.getElementById('connection-status');
        
        const tests = [
            { name: 'Cliente ID configurado', key: 'clientId' },
            { name: 'Client Secret configurado', key: 'clientSecret' },
            { name: 'Developer Token configurado', key: 'developerToken' },
            { name: 'Customer ID configurado', key: 'customerId' },
            { name: 'Refresh Token válido', key: 'refreshToken' },
            { name: 'Conexão com Google Ads API', key: 'apiConnection' }
        ];
        
        try {
            // Show progress container
            statusEl.innerHTML = `
                <div class="test-progress-container">
                    <div class="test-progress-header">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Testando conexão...</span>
                    </div>
                    <div class="test-progress-list" id="test-progress-list"></div>
                    <div class="test-progress-bar">
                        <div class="test-progress-fill" id="test-progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            `;
            
            const listEl = document.getElementById('test-progress-list');
            const progressBar = document.getElementById('test-progress-fill');
            
            // Get settings from API
            await this.updateTestProgress(listEl, progressBar, 0, tests.length, 
                'Carregando configurações', 'testing');
            
            const settingsResponse = await this.moduleAPI.request('/api/google-ads/auth/status');
            const settings = settingsResponse?.data || {};
            
            // Test 1: Client ID
            await this.updateTestProgress(listEl, progressBar, 0, tests.length, 
                tests[0].name, 'testing');
            await this.sleep(300);
            const hasClientId = !!settings.clientId?.trim();
            await this.updateTestProgress(listEl, progressBar, 1, tests.length, 
                tests[0].name, hasClientId ? 'success' : 'error');
            
            if (!hasClientId) {
                throw new Error('Client ID não configurado');
            }
            
            // Test 2: Client Secret
            await this.updateTestProgress(listEl, progressBar, 1, tests.length, 
                tests[1].name, 'testing');
            await this.sleep(300);
            const hasClientSecret = !!settings.clientSecret?.trim();
            await this.updateTestProgress(listEl, progressBar, 2, tests.length, 
                tests[1].name, hasClientSecret ? 'success' : 'error');
            
            if (!hasClientSecret) {
                throw new Error('Client Secret não configurado');
            }
            
            // Test 3: Developer Token
            await this.updateTestProgress(listEl, progressBar, 2, tests.length, 
                tests[2].name, 'testing');
            await this.sleep(300);
            const hasDeveloperToken = !!settings.developerToken?.trim();
            await this.updateTestProgress(listEl, progressBar, 3, tests.length, 
                tests[2].name, hasDeveloperToken ? 'success' : 'error');
            
            if (!hasDeveloperToken) {
                throw new Error('Developer Token não configurado');
            }
            
            // Test 4: Customer ID
            await this.updateTestProgress(listEl, progressBar, 3, tests.length, 
                tests[3].name, 'testing');
            await this.sleep(300);
            const hasCustomerId = !!settings.customerId?.trim();
            await this.updateTestProgress(listEl, progressBar, 4, tests.length, 
                tests[3].name, hasCustomerId ? 'success' : 'error');
            
            if (!hasCustomerId) {
                throw new Error('Customer ID não configurado');
            }
            
            // Test 5 & 6: API Connection (includes refresh token check)
            await this.updateTestProgress(listEl, progressBar, 4, tests.length, 
                tests[4].name, 'testing');
            await this.sleep(300);
            
            // Check if connected (has refresh token)
            if (!settings.connected) {
                await this.updateTestProgress(listEl, progressBar, 5, tests.length, 
                    tests[4].name, 'error', 'OAuth não autorizado');
                throw new Error('Clique em "Conectar Google Ads" para autorizar o acesso');
            }
            
            const response = await this.moduleAPI.request('/api/google-ads/auth/test', {
                method: 'POST'
            });

            if (response.success) {
                await this.updateTestProgress(listEl, progressBar, 5, tests.length, 
                    tests[4].name, 'success');
                await this.sleep(200);
                await this.updateTestProgress(listEl, progressBar, 5, tests.length, 
                    tests[5].name, 'testing');
                await this.sleep(300);
                await this.updateTestProgress(listEl, progressBar, 6, tests.length, 
                    tests[5].name, 'success');
                
                // Show final success message
                await this.sleep(500);
                statusEl.innerHTML = `
                    <div class="success-message" style="animation: slideInUp 0.3s ease;">
                        <i class="fas fa-check-circle"></i>
                        <strong>Conexão estabelecida com sucesso!</strong>
                        <br>
                        <small>Customer ID: ${response.data?.customerId || 'N/A'}</small>
                    </div>
                `;
            } else {
                await this.updateTestProgress(listEl, progressBar, 5, tests.length, 
                    tests[4].name, 'error', response.message);
                throw new Error(response.message || 'Erro ao testar conexão com API');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            
            // Show error state
            await this.sleep(300);
            statusEl.innerHTML = `
                <div class="error-message" style="animation: slideInUp 0.3s ease;">
                    <i class="fas fa-times-circle"></i>
                    <strong>${error.message || 'Erro ao testar conexão'}</strong>
                    <br>
                    <small>Verifique as configurações e tente novamente</small>
                </div>
            `;
        }
    },
    
    async updateTestProgress(listEl, progressBar, current, total, testName, status, errorMsg = '') {
        const percentage = Math.round((current / total) * 100);
        progressBar.style.width = `${percentage}%`;
        
        const icons = {
            testing: '<i class="fas fa-spinner fa-spin" style="color: #667eea;"></i>',
            success: '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            error: '<i class="fas fa-times-circle" style="color: #ef4444;"></i>'
        };
        
        const existingItem = listEl.querySelector(`[data-test="${testName}"]`);
        
        if (existingItem) {
            existingItem.innerHTML = `
                ${icons[status]}
                <span>${testName}</span>
                ${errorMsg ? `<small style="color: #ef4444;">${errorMsg}</small>` : ''}
            `;
            existingItem.className = `test-progress-item test-${status}`;
        } else {
            const item = document.createElement('div');
            item.className = `test-progress-item test-${status}`;
            item.setAttribute('data-test', testName);
            item.innerHTML = `
                ${icons[status]}
                <span>${testName}</span>
                ${errorMsg ? `<small style="color: #ef4444;">${errorMsg}</small>` : ''}
            `;
            listEl.appendChild(item);
        }
    },
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async disconnectGoogleAds() {
        if (!confirm('Tem certeza que deseja desconectar o Google Ads?')) {
            return;
        }

        try {
            const response = await this.moduleAPI.request('/api/google-ads/auth/disconnect', {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification('Desconectado do Google Ads', 'success');
                await this.loadGoogleAdsSettings();
            } else {
                this.showNotification(response.message || 'Erro ao desconectar', 'error');
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
            this.showNotification('Erro ao desconectar', 'error');
        }
    },

    async syncGoogleAdsCampaigns(evt) {
        let btn = null;
        
        try {
            // Get button reference from event if available, otherwise find it by ID
            if (evt?.target) {
                btn = evt.target;
            } else {
                btn = document.querySelector('button[onclick*="syncGoogleAdsCampaigns"]');
            }
            
            if (!btn) {
                console.warn('Could not find sync button element');
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';

            const response = await this.moduleAPI.request('/api/google-ads/sync/campaigns', {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification(`${response.data.count} campanhas sincronizadas!`, 'success');
                await this.loadSyncedCampaigns();
            } else {
                this.showNotification(response.message || 'Erro ao sincronizar campanhas', 'error');
            }
        } catch (error) {
            console.error('Error syncing campaigns:', error);
            this.showNotification('Erro ao sincronizar campanhas', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sync"></i> Sincronizar Campanhas';
            }
        }
    },

    async loadSyncedCampaigns() {
        try {
            const response = await this.moduleAPI.request('/api/google-ads/campaigns');
            
            if (response.success && response.data) {
                const campaigns = response.data;
                const container = document.getElementById('campaigns-list');
                
                if (campaigns.length === 0) {
                    container.innerHTML = '<p class="empty-state">Nenhuma campanha sincronizada ainda.</p>';
                    return;
                }

                container.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nome da Campanha</th>
                                <th>Status</th>
                                <th>Impressões</th>
                                <th>Cliques</th>
                                <th>Custo</th>
                                <th>Conversões</th>
                                <th>Última Sync</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${campaigns.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td><span class="badge badge-${c.status === 'ENABLED' ? 'success' : 'secondary'}">${c.status}</span></td>
                                    <td>${this.formatNumber(c.impressions)}</td>
                                    <td>${this.formatNumber(c.clicks)}</td>
                                    <td>R$ ${this.formatCurrency(c.cost)}</td>
                                    <td>${this.formatNumber(c.conversions)}</td>
                                    <td>${this.formatDate(c.lastSyncAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
        }
    },

    // ========================================================================
    // CSV IMPORT FUNCTIONALITY
    // ========================================================================

    csvFiles: [],

    setupCsvDropzone() {
        const dropzone = document.getElementById('csv-dropzone');
        const fileInput = document.getElementById('csv-file-input');

        if (!dropzone || !fileInput) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight dropzone when file is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            });
        });

        // Handle dropped files
        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
            this.handleCsvFiles(files);
        });

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleCsvFiles(files);
        });
    },

    handleCsvFiles(files) {
        if (files.length === 0) {
            this.showNotification('Nenhum arquivo CSV selecionado', 'warning');
            return;
        }

        // Add new files to the list (avoid duplicates)
        files.forEach(file => {
            const exists = this.csvFiles.some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                this.csvFiles.push(file);
            }
        });

        this.renderCsvFilesList();
    },

    renderCsvFilesList() {
        const container = document.getElementById('csv-files-list');
        const actionsContainer = document.getElementById('import-actions');

        if (this.csvFiles.length === 0) {
            container.style.display = 'none';
            actionsContainer.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        actionsContainer.style.display = 'flex';

        container.innerHTML = `
            <h4><i class="fas fa-list"></i> Arquivos Selecionados (${this.csvFiles.length})</h4>
            <div class="csv-files-grid">
                ${this.csvFiles.map((file, index) => `
                    <div class="csv-file-item">
                        <div class="file-icon">
                            <i class="fas fa-file-csv"></i>
                        </div>
                        <div class="file-info">
                            <strong>${file.name}</strong>
                            <small>${this.formatFileSize(file.size)}</small>
                        </div>
                        <button class="btn-icon-danger" onclick="crm.removeCsvFile(${index})" title="Remover">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    removeCsvFile(index) {
        this.csvFiles.splice(index, 1);
        this.renderCsvFilesList();
    },

    clearCsvFiles() {
        this.csvFiles = [];
        this.renderCsvFilesList();
        document.getElementById('csv-file-input').value = '';
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    async startCsvImport() {
        if (this.csvFiles.length === 0) {
            this.showNotification('Nenhum arquivo selecionado', 'warning');
            return;
        }

        const progressContainer = document.getElementById('upload-progress');
        const summaryContainer = document.getElementById('import-summary');
        const actionsContainer = document.getElementById('import-actions');

        progressContainer.style.display = 'block';
        summaryContainer.style.display = 'none';
        actionsContainer.style.display = 'none';

        const formData = new FormData();
        this.csvFiles.forEach((file, index) => {
            formData.append('csvFiles', file);
        });

        try {
            // Update progress
            document.getElementById('progress-text').textContent = 'Enviando arquivos...';
            document.getElementById('progress-percentage').textContent = '20%';
            document.getElementById('progress-bar').style.width = '20%';

            // Use fetch directly for multipart/form-data (browser handles Content-Type with boundary)
            const organizationId = localStorage.getItem('activeOrganizationId') || 
                                  'a55ad715-2eb0-493c-996c-bb0f60bacec9'; // Fallback
            
            const response = await fetch('/api/google-ads/import-csv', {
                method: 'POST',
                headers: {
                    'X-Organization-ID': organizationId
                    // DO NOT set Content-Type - browser will set it with boundary
                },
                body: formData
            });

            document.getElementById('progress-percentage').textContent = '60%';
            document.getElementById('progress-bar').style.width = '60%';
            document.getElementById('progress-text').textContent = 'Processando dados...';

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            document.getElementById('progress-percentage').textContent = '100%';
            document.getElementById('progress-bar').style.width = '100%';
            document.getElementById('progress-text').textContent = 'Concluído!';

            setTimeout(() => {
                progressContainer.style.display = 'none';
                this.showImportSummary(result);
            }, 1000);

        } catch (error) {
            console.error('Error importing CSV:', error);
            progressContainer.style.display = 'none';
            this.showNotification('Erro ao importar arquivos: ' + error.message, 'error');
        }
    },

    showImportSummary(result) {
        const summaryContainer = document.getElementById('import-summary');
        summaryContainer.style.display = 'block';

        if (result.success) {
            summaryContainer.innerHTML = `
                <div class="success-message">
                    <div class="success-header">
                        <i class="fas fa-check-circle"></i>
                        <h3>Importação Concluída com Sucesso!</h3>
                    </div>
                    <div class="import-stats">
                        <div class="stat-item">
                            <i class="fas fa-bullhorn"></i>
                            <div>
                                <strong>${result.data?.campaignsImported || 0}</strong>
                                <span>Campanhas Importadas</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-calendar"></i>
                            <div>
                                <strong>${result.data?.daysOfHistory || 0}</strong>
                                <span>Dias de Histórico</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-key"></i>
                            <div>
                                <strong>${result.data?.keywordsImported || 0}</strong>
                                <span>Palavras-chave</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-dollar-sign"></i>
                            <div>
                                <strong>R$ ${result.data?.totalCost?.toFixed(2) || '0.00'}</strong>
                                <span>Total Investido</span>
                            </div>
                        </div>
                    </div>
                    <p class="summary-text">${result.message}</p>
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="crm.navigateTo('dashboard')">
                            <i class="fas fa-chart-line"></i>
                            Ver Dashboard
                        </button>
                        <button class="btn-secondary" onclick="crm.clearCsvFiles(); document.getElementById('import-summary').style.display = 'none';">
                            <i class="fas fa-redo"></i>
                            Nova Importação
                        </button>
                    </div>
                </div>
            `;
        } else {
            summaryContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro na Importação</h3>
                    <p>${result.message || 'Erro desconhecido ao processar arquivos'}</p>
                    <button class="btn-secondary" onclick="document.getElementById('import-summary').style.display = 'none';">
                        <i class="fas fa-times"></i>
                        Fechar
                    </button>
                </div>
            `;
        }
    },

    // ========================================================================
    // END CSV IMPORT
    // ========================================================================

    async saveConversionAction() {
        const conversionAction = document.getElementById('conversionAction').value;

        if (!conversionAction) {
            this.showNotification('Informe a ação de conversão', 'error');
            return;
        }

        try {
            const response = await this.moduleAPI.request('/api/google-ads/auth/save-credentials', {
                method: 'POST',
                body: JSON.stringify({ conversionAction })
            });

            if (response.success) {
                this.showNotification('Ação de conversão salva com sucesso!', 'success');
            } else {
                this.showNotification(response.message || 'Erro ao salvar ação de conversão', 'error');
            }
        } catch (error) {
            console.error('Error saving conversion action:', error);
            this.showNotification('Erro ao salvar ação de conversão', 'error');
        }
    },

    async loadPendingConversionsCount() {
        try {
            const response = await this.moduleAPI.request('/api/google-ads/conversions/pending');
            
            if (response.success && response.data) {
                const count = response.data.length;
                const container = document.getElementById('pending-conversions-info');
                
                if (count > 0) {
                    container.innerHTML = `
                        <div class="info-box warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <strong>${count} conversão(ões) pendente(s) de upload</strong>
                                <p>Leads convertidos aguardando envio ao Google Ads</p>
                            </div>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="info-box success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Todas as conversões foram enviadas!</strong>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading pending conversions:', error);
        }
    },

    async uploadPendingConversions() {
        try {
            const btn = event.target;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const response = await this.moduleAPI.request('/api/google-ads/conversions/upload-batch', {
                method: 'POST'
            });

            if (response.success) {
                const { success, failed } = response.data;
                this.showNotification(`${success} conversões enviadas! ${failed > 0 ? `${failed} falharam.` : ''}`, 'success');
                await this.loadPendingConversionsCount();
            } else {
                this.showNotification(response.message || 'Erro ao enviar conversões', 'error');
            }
        } catch (error) {
            console.error('Error uploading conversions:', error);
            this.showNotification('Erro ao enviar conversões', 'error');
        } finally {
            const btn = event.target;
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload"></i> Upload de Conversões Pendentes';
        }
    },

    showNotification(message, type = 'info') {
        // TODO: Implement proper notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    },

    // ========================================================================
    // EVENT SETUP
    // ========================================================================

    setupEvents() {
        // Global events can be added here
        console.log('✅ CRM events setup complete');
    }
};

// Wait for API client helper
async function waitForAPIClient() {
    return new Promise((resolve) => {
        const checkAPI = setInterval(() => {
            if (window.createModuleAPI) {
                clearInterval(checkAPI);
                resolve();
            }
        }, 100);
    });
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Module will be initialized by AcademyApp or SPA Router
    });
}

// Export module (expose both names for compatibility)
window.CrmModule = CrmModule;
window.crm = CrmModule; // Expose for AcademyApp.loadModules() detection

console.log('✅ CRM Module loaded and ready');

} // end if
