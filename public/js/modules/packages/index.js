/**
 * 📦 Packages Module - Sistema Unificado de Planos e Financeiro
 * Academia Krav Maga v2.0
 * 
 * Integra: Planos + Assinaturas + Créditos + Conciliação Bancária
 * Seguindo: Guidelines.MD + AcademyApp Integration + Premium UI
 * 
 * @version 2.0.1 - Fixed emoji encoding issue
 */

class PackagesModule {
    constructor() {
        this.name = 'packages';
        this.version = '1.0.0';
        this.api = null;
        this.currentView = 'dashboard';
        
        // Estado unificado
        this.state = {
            packages: [],           // Planos/pacotes disponíveis
            subscriptions: [],      // Assinaturas ativas
            creditPurchases: [],    // Compras de crédito
            transactions: [],       // Transações bancárias
            students: [],          // Cache de alunos
            metrics: {},           // Métricas calculadas
            loading: false,
            filters: {
                type: 'all',       // 'subscription', 'credits', 'all'
                status: 'all',     // 'active', 'inactive', 'expired'
                period: 'month'    // 'week', 'month', 'year'
            }
        };

        // Controladores
        this.controllers = {
            packages: null,
            billing: null,
            payments: null
        };

        // Serviços
        this.services = {
            asaas: null,
            analytics: null
        };
    }

    /**
     * Inicialização principal do módulo
     */
    async init() {
        console.log('📦 Inicializando PackagesModule...');
        
        try {
            // 1. API Integration (Guidelines.MD compliance)
            await this.initializeAPI();
            
            // 2. Load controllers
            await this.loadControllers();
            
            // 3. Load services
            await this.loadServices();
            
            // 4. Load initial data
            await this.loadInitialData();
            
            // 5. Setup event listeners
            this.setupEventListeners();
            
            // 6. AcademyApp integration
            this.integrateWithApp();
            
            console.log('✅ PackagesModule inicializado com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar PackagesModule:', error);
            
            // AcademyApp error handling
            if (window.app?.handleError) {
                window.app.handleError(error, 'PackagesModule.init');
            }
            
            return false;
        }
    }

    /**
     * API Client integration (Guidelines.MD compliance)
     */
    async initializeAPI() {
        console.log('🌐 Inicializando API Client para Packages...');
        // Aguardar API Client estar disponível
        if (!window.apiClient || !window.createModuleAPI) {
            await this.waitForAPIClient();
        }
        // Criar módulo API helper com headers padrão para organização
        this.apiHelper = window.createModuleAPI('Packages', {
            defaultHeaders: {
                'x-organization-id': 'a55ad715-2eb0-493c-996c-bb0f60bacec9' // ID da organização padrão (Academia Demo)
            }
        });
        // manter alias para compatibilidade
        this.api = this.apiHelper;
        console.log('✅ Packages API helper inicializado');
    }

    async waitForAPIClient() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.apiClient && window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    /**
     * Renderização principal do módulo
     */
    render() {
        const container = document.getElementById('module-container') ||
            document.getElementById('main-content') || document.body;
        if (!container) return;
        container.innerHTML = this.getMainTemplate();
        this.attachEventListeners();
        this.renderCurrentView();
    }

    /**
     * Template premium do módulo com navegação
     */
    getMainTemplate() {
        return `
            <div class="module-isolated-packages">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="breadcrumb">
                            <span>Academia</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-current">📦 Pacotes</span>
                        </div>
                        <h2>Gestão de Pacotes</h2>
                        <p class="header-subtitle">Planos, assinaturas, créditos e conciliação financeira</p>
                    </div>
                </div>
                <div class="packages-navigation" role="tablist">
                    <button class="nav-tab active" data-view="dashboard" role="tab" aria-selected="true">📊 Dashboard</button>
                    <button class="nav-tab" data-view="packages" role="tab">📦 Pacotes</button>
                    <button class="nav-tab" data-view="subscriptions" role="tab">📅 Assinaturas</button>
                    <button class="nav-tab" data-view="credits" role="tab">🎫 Créditos</button>
                    <button class="nav-tab" data-view="payments" role="tab">💳 Pagamentos</button>
                    <button class="nav-tab" data-view="reports" role="tab">📈 Relatórios</button>
                </div>
                <div id="packages-content" class="packages-content" aria-live="polite"></div>
            </div>
        `;
    }

    attachEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.navigateTo(view);
            });
        });
    }

    navigateTo(view, params = {}) {
        this.currentView = view;
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
            btn.setAttribute('aria-selected', btn.dataset.view === view ? 'true' : 'false');
        });
        this.renderCurrentView(params);
    }

    renderCurrentView(params = {}) {
        const content = document.getElementById('packages-content');
        if (!content) return;
        switch (this.currentView) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'packages':
                content.innerHTML = this.renderPackages();
                break;
            case 'package-editor':
                content.innerHTML = '<div id="packageEditorMount"></div>';
                this.openPackageEditor(params?.id || null, document.getElementById('packageEditorMount'));
                break;
            case 'subscriptions':
                content.innerHTML = this.renderSubscriptions();
                break;
            case 'credits':
                content.innerHTML = this.renderCredits();
                break;
            case 'payments':
                content.innerHTML = this.renderPayments();
                break;
            case 'reports':
                content.innerHTML = this.renderReports();
                break;
            default:
                content.innerHTML = this.renderDashboard();
        }
        this.attachViewEventListeners();
    }

    renderDashboard() {
        const m = this.state.metrics || {};
        return `
            <div class="packages-dashboard">
                <div class="stats-grid">
                    <div class="stat-card-enhanced primary">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatCurrency(m.totalRevenue || 0)}</div>
                            <div class="stat-label">Receita Total</div>
                        </div>
                        <div class="stat-trend positive">${m.revenueTrend || '+0%'}</div>
                    </div>
                    <div class="stat-card-enhanced secondary">
                        <div class="stat-icon">📦</div>
                        <div class="stat-content">
                            <div class="stat-value">${m.activePackages || 0}</div>
                            <div class="stat-label">Pacotes Ativos</div>
                        </div>
                        <div class="stat-trend neutral">${m.totalPackages || 0} total</div>
                    </div>
                    <div class="stat-card-enhanced success">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value">${m.activeSubscriptions || 0}</div>
                            <div class="stat-label">Assinaturas Ativas</div>
                        </div>
                        <div class="stat-trend positive">${m.subscriptionsTrend || '+0'}</div>
                    </div>
                    <div class="stat-card-enhanced warning">
                        <div class="stat-icon">🎫</div>
                        <div class="stat-content">
                            <div class="stat-value">${m.totalCreditsRestantes || 0}</div>
                            <div class="stat-label">Créditos Restantes</div>
                        </div>
                        <div class="stat-trend neutral">${m.totalCreditsVendidos || 0} vendidos</div>
                    </div>
                </div>

                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>🚀 Ações Rápidas</h3>
                    </div>
                    <div class="quick-actions">
                        <button class="action-btn primary" onclick="window.packagesModule.navigateTo('package-editor', { id: null })">➕ Novo Pacote</button>
                        <button class="action-btn secondary" onclick="window.packagesModule.navigateTo('subscriptions', {action: 'new'})">📅 Nova Assinatura</button>
                        <button class="action-btn success" onclick="window.packagesModule.navigateTo('credits', {action: 'sell'})">🎫 Vender Créditos</button>
                        <button class="action-btn warning" onclick="window.packagesModule.navigateTo('payments')">💳 Conciliar Pagamentos</button>
                    </div>
                </div>

                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>📋 Atividade Recente</h3>
                        <button class="btn-secondary" onclick="window.packagesModule.loadInitialData()">🔄 Atualizar</button>
                    </div>
                    <div class="recent-activity">${this.renderRecentActivity()}</div>
                </div>
            </div>
        `;
    }

    renderRecentActivity() {
        const recent = [
            ...this.state.subscriptions.slice(-3).map(s => ({
                type: 'subscription',
                icon: '📅',
                title: `Nova assinatura: ${s.student?.firstName || 'Aluno'}`,
                subtitle: `${s.plan?.name || 'Plano'} - ${this.formatCurrency(s.currentPrice)}`,
                time: this.formatDate(s.createdAt)
            })),
            ...this.state.creditPurchases.slice(-3).map(c => ({
                type: 'credit',
                icon: '🎫',
                title: `Créditos vendidos: ${c.student?.firstName || 'Aluno'}`,
                subtitle: `${c.creditsTotal} créditos - ${this.formatCurrency(c.price)}`,
                time: this.formatDate(c.purchaseDate)
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        if (recent.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
        }

        return recent.map(item => `
            <div class="activity-item">
                <div class="activity-icon">${item.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${item.title}</div>
                    <div class="activity-subtitle">${item.subtitle}</div>
                </div>
                <div class="activity-time">${item.time}</div>
            </div>
        `).join('');
    }

    renderPackages() {
        return `
            <div class="packages-view">
                <div class="view-header">
                    <div class="view-title">
                        <h2>📦 Gestão de Pacotes</h2>
                        <p>Criar e gerenciar planos, assinaturas e pacotes de crédito</p>
                    </div>
                    <div class="view-actions">
                        <button class="btn-primary" onclick="window.packagesModule.createPackage()">
                            ➕ Novo Pacote
                        </button>
                    </div>
                </div>
                
                <div class="module-filters-premium">
                    <select class="filter-select" id="packageTypeFilter">
                        <option value="">Todos os tipos</option>
                        <option value="MONTHLY">Assinatura Mensal</option>
                        <option value="YEARLY">Assinatura Anual</option>
                        <option value="CREDITS">Pacote de Créditos</option>
                    </select>
                    <select class="filter-select" id="packageStatusFilter">
                        <option value="">Todos os status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                </div>

                <div class="data-card-premium">
                    ${this.renderPackagesTable()}
                </div>
            </div>
        `;
    }

    renderPackagesTable() {
        if (this.state.packages.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Nenhum pacote criado</h3>
                    <p>Crie seu primeiro pacote para começar a vender</p>
                    <button class="btn-primary" onclick="window.packagesModule.createPackage()">
                        ➕ Criar Primeiro Pacote
                    </button>
                </div>
            `;
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Preço</th>
                        <th>Categoria</th>
                        <th>Aulas/Semana</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.state.packages.map(pkg => `
                        <tr ondblclick="window.packagesModule.editPackage('${pkg.id}')">
                            <td>
                                <div class="package-name">
                                    <strong>${pkg.name}</strong>
                                    <small>${pkg.description || ''}</small>
                                </div>
                            </td>
                            <td>
                                <span class="package-type-badge ${pkg.billingType.toLowerCase()}">
                                    ${this.getPackageTypeLabel(pkg.billingType)}
                                </span>
                            </td>
                            <td>
                                <span class="price">${this.formatCurrency(pkg.price)}</span>
                            </td>
                            <td>
                                <span class="category">${pkg.category}</span>
                            </td>
                            <td>
                                <span class="classes">${pkg.classesPerWeek || '-'}</span>
                            </td>
                            <td>
                                <span class="status-badge ${pkg.isActive ? 'active' : 'inactive'}">
                                    ${pkg.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.packagesModule.editPackage('${pkg.id}')" title="Editar">
                                        ✏️
                                    </button>
                                    <button class="btn-icon" onclick="window.packagesModule.togglePackage('${pkg.id}')" title="Ativar/Desativar">
                                        ${pkg.isActive ? '⏸️' : '▶️'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // View placeholders - implementar conforme necessário
    renderSubscriptions() {
        return `<div class="view-placeholder">🚧 View Assinaturas em desenvolvimento...</div>`;
    }

    renderCredits() {
        return `<div class="view-placeholder">🚧 View Créditos em desenvolvimento...</div>`;
    }

    renderPayments() {
        return `<div class="view-placeholder">🚧 View Pagamentos em desenvolvimento...</div>`;
    }

    renderReports() {
        return `<div class="view-placeholder">🚧 View Relatórios em desenvolvimento...</div>`;
    }

    /**
     * Event listeners específicos das views
     */
    attachViewEventListeners() {
        // Filtros
        const typeFilter = document.getElementById('packageTypeFilter');
        const statusFilter = document.getElementById('packageStatusFilter');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    /**
     * Utility methods
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    formatDate(date) {
        if (!date) return '-';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    }

    getPackageTypeLabel(type) {
        const types = {
            MONTHLY: 'Mensal',
            YEARLY: 'Anual', 
            QUARTERLY: 'Trimestral',
            CREDITS: 'Créditos',
            CREDIT_CARD_INSTALLMENT: 'Parcelado'
        };
        return types[type] || type;
    }

    /**
     * Action methods - implementar conforme necessário
     */
    async createPackage() {
    console.log('➕ Criando novo pacote (full-screen)...');
    this.navigateTo('package-editor', { id: null });
    }

    async editPackage(id) {
    console.log('✏️ Editando pacote (full-screen):', id);
    this.navigateTo('package-editor', { id });
    }

    /**
     * Abrir editor de pacote em página full-screen
     */
    async openPackageEditor(packageId = null, container = null) {
        console.log('📝 Abrindo editor de pacote:', packageId ? `ID: ${packageId}` : 'Novo pacote');
        
        // Se não tiver container, usar o container principal
        if (!container) {
            container = document.getElementById('module-container');
        }
        
        // Carregar dados do pacote se estiver editando
        let packageData = null;
        if (packageId) {
            try {
                const response = await this.apiHelper.api.request('GET', `/api/billing-plans/${packageId}`);
                if (response.success) {
                    packageData = response.data;
                } else {
                    this.showNotification('❌ Erro ao carregar dados do pacote', 'error');
                    window.router.navigateTo('packages');
                    return;
                }
            } catch (error) {
                console.error('❌ Erro ao carregar pacote:', error);
                this.showNotification('❌ Erro ao carregar pacote: ' + error.message, 'error');
                window.router.navigateTo('packages');
                return;
            }
        }
        
        // Renderizar editor full-screen
        this.renderPackageEditor(packageData, container);
    }

    /**
     * Renderizar editor de pacote full-screen com tabs
     */
    renderPackageEditor(packageData = null, container) {
        const isEdit = !!packageData;
        const title = isEdit ? 'Editar Pacote' : 'Novo Pacote';
        
        const editorHTML = `
            <div class="module-isolated-packages package-editor-fullscreen">
                <!-- Header com breadcrumb -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="breadcrumb">
                            <a href="#/packages">📦 Pacotes</a>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-current">${title}</span>
                        </div>
                        <h2>${title}</h2>
                        <p class="header-subtitle">Configure os detalhes do pacote conforme o tipo selecionado</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-secondary" onclick="window.packagesModule.navigateTo('packages')">
                            ← Voltar aos Pacotes
                        </button>
                    </div>
                </div>

                <!-- Tabs de navegação -->
                <div class="editor-tabs">
                    <button class="tab-btn active" data-tab="basic">
                        <i class="fas fa-info-circle"></i> Informações Básicas
                    </button>
                    <button class="tab-btn" data-tab="courses">
                        <i class="fas fa-graduation-cap"></i> Cursos Disponíveis
                    </button>
                    <button class="tab-btn" data-tab="advanced">
                        <i class="fas fa-cog"></i> Configurações Avançadas
                    </button>
                </div>

                <!-- Formulário principal -->
                <form id="packageEditorForm" class="package-form-enhanced">
                    <!-- Tab: Informações Básicas -->
                    <div class="tab-content active" data-tab="basic">
                        ${this.renderBasicInfoTab(packageData)}
                    </div>

                    <!-- Tab: Cursos Disponíveis -->
                    <div class="tab-content" data-tab="courses">
                        ${this.renderCoursesTab(packageData)}
                    </div>

                    <!-- Tab: Configurações Avançadas -->
                    <div class="tab-content" data-tab="advanced">
                        ${this.renderAdvancedTab(packageData)}
                    </div>

                    <!-- Ações do formulário -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.packagesModule.navigateTo('packages')">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? '💾 Atualizar' : '➕ Criar'} Pacote
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Inserir no container
        container.innerHTML = editorHTML;
        
        // Armazenar dados do pacote atual para acesso posterior
        this.currentPlan = packageData;
        
        // Configurar comportamentos do formulário
        this.initializeEditorBehavior(packageData);
        
        // Configurar tabs
        this.setupTabs();
        
        // Carregar cursos disponíveis
        this.loadAvailableCourses();
        
        // Configurar evento de submit
        const form = document.getElementById('packageEditorForm');
        form.addEventListener('submit', (e) => this.handleEditorSubmit(e, packageData));
    }

    /**
     * Renderizar tab de informações básicas
     */
    renderBasicInfoTab(packageData) {
        return `
            <div class="tab-section">
                <div class="section-header">
                    <h3><i class="fas fa-info-circle"></i> Informações Básicas</h3>
                    <p>Configure as informações principais do pacote</p>
                </div>

                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="packageName">Nome do Pacote *</label>
                            <input type="text" id="packageName" name="name" value="${packageData?.name || ''}" 
                                   required aria-describedby="packageNameHelp" placeholder="Ex: Plano Premium">
                            <small id="packageNameHelp" class="form-help">Nome que aparecerá para os alunos</small>
                        </div>
                        <div class="form-group">
                            <label for="billingType">Tipo de Pacote *</label>
                            <select id="billingType" name="billingType" required onchange="window.packagesModule.togglePackageFields(this.value)">
                                <option value="">Selecione o tipo</option>
                                <option value="RECURRING" ${packageData?.billingType === 'RECURRING' ? 'selected' : ''}>📅 Assinatura Recorrente</option>
                                <option value="MONTHLY" ${packageData?.billingType === 'MONTHLY' ? 'selected' : ''}>💳 Pacote de Créditos</option>
                            </select>
                            <small class="form-help">Defina como será cobrado este pacote</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="packageDescription">Descrição</label>
                        <textarea id="packageDescription" name="description" rows="3" 
                                  placeholder="Descreva os benefícios e características deste pacote...">${packageData?.description || ''}</textarea>
                        <small class="form-help">Descrição detalhada para apresentar aos alunos</small>
                    </div>

                    <!-- Configurações de Assinatura -->
                    <div class="form-subsection subscription-section" id="subscriptionSection" style="display: none;">
                        <h4 class="subsection-title">📅 Configurações de Assinatura</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="subscriptionPrice">Valor da Assinatura (R$) *</label>
                                <input type="number" id="subscriptionPrice" name="price" 
                                       value="${packageData?.price || ''}" step="0.01" min="0" 
                                       placeholder="149.90" aria-describedby="subscriptionPriceHelp">
                                <small id="subscriptionPriceHelp" class="form-help">Valor cobrado por período de assinatura</small>
                            </div>
                            <div class="form-group">
                                <label for="classesPerWeek">Aulas por Semana *</label>
                                <input type="number" id="classesPerWeek" name="classesPerWeek" 
                                       value="${packageData?.classesPerWeek || ''}" min="1" max="7" 
                                       placeholder="3" aria-describedby="classesHelp">
                                <small id="classesHelp" class="form-help">Quantidade de aulas permitidas por semana</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="isUnlimitedAccess" id="unlimitedClasses" 
                                       onchange="window.packagesModule.toggleUnlimited(this.checked)"
                                       ${packageData?.isUnlimitedAccess ? 'checked' : ''}>
                                <span>Permitir aulas ilimitadas</span>
                            </label>
                            <small class="form-help">Se ativado, remove limite de aulas por semana</small>
                        </div>
                    </div>

                    <!-- Configurações de Créditos -->
                    <div class="form-subsection credits-section" id="creditsSection" style="display: none;">
                        <h4 class="subsection-title">💳 Configurações de Créditos</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="creditQuantity">Quantidade de Créditos *</label>
                                <input type="number" id="creditQuantity" name="maxClasses" 
                                       value="${packageData?.maxClasses || ''}" min="1" 
                                       placeholder="10" aria-describedby="creditQuantityHelp"
                                       onchange="window.packagesModule.calculateTotalCredits()">
                                <small id="creditQuantityHelp" class="form-help">Número de aulas/créditos no pacote</small>
                            </div>
                            <div class="form-group">
                                <label for="pricePerClass">Valor por Aula (R$) *</label>
                                <input type="number" id="pricePerClass" name="pricePerClass" 
                                       value="${packageData?.pricePerClass || ''}"
                                       step="0.01" min="0" placeholder="35.00" 
                                       aria-describedby="pricePerClassHelp"
                                       onchange="window.packagesModule.calculateTotalCredits()">
                                <small id="pricePerClassHelp" class="form-help">Preço individual de cada aula</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="totalPackagePrice">Valor Total do Pacote (R$)</label>
                                <input type="number" id="totalPackagePrice" name="price" 
                                       step="0.01" min="0" readonly 
                                       aria-describedby="totalPriceHelp" class="calculated-field">
                                <small id="totalPriceHelp" class="form-help">Calculado automaticamente (Quantidade × Valor por aula)</small>
                            </div>
                            <div class="form-group">
                                <label for="creditsValidity">Validade dos Créditos (dias)</label>
                                <input type="number" id="creditsValidity" name="creditsValidity" 
                                       value="${packageData?.creditsValidity || 90}"
                                       min="1" placeholder="90" 
                                       aria-describedby="validityHelp">
                                <small id="validityHelp" class="form-help">Dias para usar os créditos após compra</small>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="isActive" ${packageData?.isActive !== false ? 'checked' : ''}>
                            <span>Pacote ativo</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar tab de cursos disponíveis
     */
    renderCoursesTab(packageData) {
        return `
            <div class="tab-section">
                <div class="section-header">
                    <h3><i class="fas fa-graduation-cap"></i> Cursos Associados</h3>
                    <p>Selecione quais cursos estão incluídos neste pacote</p>
                </div>

                <div class="courses-container" id="courses-container">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> Carregando cursos...
                    </div>
                </div>

                <div class="course-access-settings">
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="accessAllModalities" ${packageData?.accessAllModalities ? 'checked' : ''}>
                            <span class="checkbox-custom"></span>
                            Acesso a todas as modalidades
                        </label>
                        <small>Se marcado, o aluno terá acesso a todos os cursos da academia</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar tab de configurações avançadas
     */
    renderAdvancedTab(packageData) {
        return `
            <div class="tab-section">
                <div class="section-header">
                    <h3><i class="fas fa-cog"></i> Configurações Avançadas</h3>
                    <p>Configure opções adicionais e serviços extras</p>
                </div>

                <div class="form-section">
                    <h4 class="section-title">⭐ Serviços Adicionais</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="hasPersonalTraining" 
                                       ${packageData?.hasPersonalTraining ? 'checked' : ''}>
                                <span>🏋️ Personal Training Incluso</span>
                            </label>
                            <small class="form-help">Inclui sessões de personal training</small>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="hasNutrition" 
                                       ${packageData?.hasNutrition ? 'checked' : ''}>
                                <span>🥗 Consultoria Nutricional</span>
                            </label>
                            <small class="form-help">Inclui acompanhamento nutricional</small>
                        </div>
                    </div>

                    <h4 class="section-title">💳 Configurações de Pagamento</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="allowInstallments" 
                                       ${packageData?.allowInstallments ? 'checked' : ''}>
                                <span>Permitir Parcelamento</span>
                            </label>
                            <small class="form-help">Permite parcelamento no cartão de crédito</small>
                        </div>
                        <div class="form-group">
                            <label for="maxInstallments">Máximo de Parcelas</label>
                            <input type="number" id="maxInstallments" name="maxInstallments" 
                                   value="${packageData?.maxInstallments || 1}" min="1" max="12" 
                                   placeholder="1">
                            <small class="form-help">Número máximo de parcelas permitidas</small>
                        </div>
                    </div>

                    <h4 class="section-title">🔄 Configurações de Renovação</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="isRecurring" 
                                       ${packageData?.isRecurring ? 'checked' : ''}>
                                <span>Renovação Automática</span>
                            </label>
                            <small class="form-help">Renovar automaticamente quando expirar</small>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="allowFreeze" 
                                       ${packageData?.allowFreeze !== false ? 'checked' : ''}>
                                <span>Permitir Congelamento</span>
                            </label>
                            <small class="form-help">Permite que o aluno congele o plano temporariamente</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="freezeMaxDays">Máximo de Dias Congelado</label>
                        <input type="number" id="freezeMaxDays" name="freezeMaxDays" 
                               value="${packageData?.freezeMaxDays || 30}" min="1" 
                               placeholder="30">
                        <small class="form-help">Número máximo de dias que o plano pode ficar congelado</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Inicializar comportamentos do editor full-screen
     */
    initializeEditorBehavior(packageData) {
        // Configurar funções globais para o formulário (mesmo do modal)
        window.togglePackageFields = (billingType) => {
            const subscriptionSection = document.getElementById('subscriptionSection');
            const creditsSection = document.getElementById('creditsSection');
            
            if (billingType === 'RECURRING') {
                subscriptionSection.style.display = 'block';
                creditsSection.style.display = 'none';
                
                // Tornar campos de assinatura obrigatórios
                document.getElementById('subscriptionPrice').required = true;
                document.getElementById('classesPerWeek').required = true;
                
                // Remover obrigatoriedade dos campos de crédito
                document.getElementById('creditQuantity').required = false;
                document.getElementById('pricePerClass').required = false;
                
            } else if (billingType === 'MONTHLY') {
                subscriptionSection.style.display = 'none';
                creditsSection.style.display = 'block';
                
                // Tornar campos de crédito obrigatórios
                document.getElementById('creditQuantity').required = true;
                document.getElementById('pricePerClass').required = true;
                
                // Remover obrigatoriedade dos campos de assinatura
                document.getElementById('subscriptionPrice').required = false;
                document.getElementById('classesPerWeek').required = false;
                
            } else {
                subscriptionSection.style.display = 'none';
                creditsSection.style.display = 'none';
                
                // Remover todas as obrigatoriedades
                document.getElementById('subscriptionPrice').required = false;
                document.getElementById('classesPerWeek').required = false;
                document.getElementById('creditQuantity').required = false;
                document.getElementById('pricePerClass').required = false;
            }
        };

        window.toggleUnlimited = (isUnlimited) => {
            const classesPerWeekInput = document.getElementById('classesPerWeek');
            if (isUnlimited) {
                classesPerWeekInput.disabled = true;
                classesPerWeekInput.value = '';
                classesPerWeekInput.required = false;
            } else {
                classesPerWeekInput.disabled = false;
                classesPerWeekInput.required = true;
            }
        };

        window.calculateTotalCredits = () => {
            const quantity = parseFloat(document.getElementById('creditQuantity').value) || 0;
            const pricePerClass = parseFloat(document.getElementById('pricePerClass').value) || 0;
            const total = quantity * pricePerClass;
            
            document.getElementById('totalPackagePrice').value = total.toFixed(2);
        };

        // Mostrar seção correta baseada no tipo existente
        if (packageData?.billingType) {
            window.togglePackageFields(packageData.billingType);
            
            // Preencher campos específicos do tipo
            if (packageData.billingType === 'SUBSCRIPTION') {
                document.getElementById('subscriptionPrice').value = packageData.price || '';
                document.getElementById('billingCycle').value = packageData.billingCycle || 'MONTHLY';
                // Para planos ilimitados ou com 0 aulas, deixar campo vazio para evitar erro de validação
                const classesValue = packageData.isUnlimitedAccess || packageData.classesPerWeek === 0 ? '' : (packageData.classesPerWeek || '');
                document.getElementById('classesPerWeek').value = classesValue;
                document.getElementById('unlimitedClasses').checked = packageData.unlimitedClasses || false;
                window.toggleUnlimited(packageData.unlimitedClasses || false);
            } else if (packageData.billingType === 'CREDIT') {
                document.getElementById('creditQuantity').value = packageData.maxClasses || '';
                document.getElementById('pricePerClass').value = packageData.pricePerClass || '';
                document.getElementById('creditsValidity').value = packageData.creditsValidity || 90;
                window.calculateTotalCredits();
            }
        }
    }

    /**
     * Manipular envio do formulário do editor
     */
    async handleEditorSubmit(e, existingPackageData = null) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const billingType = formData.get('billingType');
        
        // Validação específica por tipo
        if (!billingType) {
            this.showNotification('Por favor, selecione o tipo de pacote', 'warning');
            return;
        }
        
        let packageData = {
            name: formData.get('name'),
            description: formData.get('description'),
            billingType: billingType,
            hasPersonalTraining: formData.has('hasPersonalTraining'),
            hasNutrition: formData.has('hasNutrition'),
            isActive: formData.has('isActive'),
            // Configurações avançadas
            allowInstallments: formData.has('allowInstallments'),
            maxInstallments: parseInt(formData.get('maxInstallments')) || 1,
            isRecurring: formData.has('isRecurring'),
            allowFreeze: formData.has('allowFreeze'),
            freezeMaxDays: parseInt(formData.get('freezeMaxDays')) || 30,
            accessAllModalities: formData.has('accessAllModalities')
        };
        
        // Coletar cursos selecionados
        const selectedCourses = this.getCurrentSelectedCourses();
        if (selectedCourses.length > 0) {
            packageData.features = {
                courseIds: selectedCourses
            };
        }
        
        // Campos específicos para assinatura
        if (billingType === 'RECURRING') {
            const subscriptionPrice = parseFloat(formData.get('price'));
            const classesPerWeek = parseInt(formData.get('classesPerWeek'));
            const isUnlimited = formData.has('isUnlimitedAccess');
            
            if (!subscriptionPrice || subscriptionPrice <= 0) {
                this.showNotification('Valor da assinatura deve ser maior que zero', 'warning');
                return;
            }
            
            if (!isUnlimited && (!classesPerWeek || classesPerWeek <= 0)) {
                this.showNotification('Número de aulas por semana é obrigatório para assinaturas limitadas', 'warning');
                return;
            }
            
            packageData = {
                ...packageData,
                price: subscriptionPrice.toString(),
                isUnlimitedAccess: isUnlimited
            };
            
            // Only set classesPerWeek if not unlimited
            if (!isUnlimited) {
                packageData.classesPerWeek = classesPerWeek;
            }
        }
        
        // Campos específicos para créditos
        else if (billingType === 'MONTHLY') {
            const creditQuantity = parseInt(formData.get('maxClasses'));
            const pricePerClass = parseFloat(formData.get('pricePerClass'));
            const creditsValidity = parseInt(formData.get('creditsValidity'));
            
            if (!creditQuantity || creditQuantity <= 0) {
                this.showNotification('Quantidade de créditos deve ser maior que zero', 'warning');
                return;
            }
            
            if (!pricePerClass || pricePerClass <= 0) {
                this.showNotification('Valor por aula deve ser maior que zero', 'warning');
                return;
            }
            
            const totalPrice = creditQuantity * pricePerClass;
            
            packageData = {
                ...packageData,
                maxClasses: creditQuantity,
                pricePerClass: pricePerClass.toString(),
                price: totalPrice.toString(),
                creditsValidity: creditsValidity || 90
            };
        }
        
        try {
            const isEdit = !!existingPackageData;
            const endpoint = isEdit ? `/api/billing-plans/${existingPackageData.id}` : '/api/billing-plans';
            const method = isEdit ? 'PUT' : 'POST';
            
            // Log data being sent
            console.log('📦 Sending package data:', JSON.stringify(packageData, null, 2));
            console.log('📊 Package data types:', {
                price: typeof packageData.price,
                priceValue: packageData.price,
                pricePerClass: packageData.pricePerClass ? typeof packageData.pricePerClass : 'undefined',
                maxClasses: packageData.maxClasses ? typeof packageData.maxClasses : 'undefined',
                classesPerWeek: packageData.classesPerWeek ? typeof packageData.classesPerWeek : 'undefined'
            });
            
            // Send as object, not stringified JSON - Fastify will handle serialization
            const response = await this.apiHelper.api.request(method, endpoint, packageData, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.success) {
                this.showNotification(
                    `✅ Pacote ${isEdit ? 'atualizado' : 'criado'} com sucesso!`, 
                    'success'
                );
                
                // Navegar de volta para a lista
                setTimeout(() => {
                    this.navigateTo('packages');
                    this.loadPackages();
                }, 1000);
                
            } else {
                throw new Error(response.message || response.details || 'Erro ao salvar pacote');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar pacote:', error);
            console.error('❌ Error details:', {
                message: error.message,
                response: error.response,
                data: error.data
            });
            
            // Show more detailed error message
            let errorMessage = error.message;
            if (error.data?.details) {
                errorMessage = `${errorMessage} - ${error.data.details}`;
            }
            
            this.showNotification(
                `❌ Erro ao ${existingPackageData ? 'atualizar' : 'criar'} pacote: ${errorMessage}`, 
                'error'
            );
        }
    }

    async togglePackage(id) {
        console.log('🔄 Alternando status do pacote:', id);
        try {
            const package_ = this.state.packages.find(p => p.id === id);
            if (!package_) {
                console.error('❌ Pacote não encontrado:', id);
                return;
            }

            const newStatus = !package_.isActive;
            await this.apiHelper.fetchWithStates(`/api/billing-plans/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: newStatus }),
                headers: { 'Content-Type': 'application/json' },
                onSuccess: (data) => {
                    console.log('✅ Status do pacote atualizado');
                    this.loadPackages(); // Recarregar lista
                },
                onError: (error) => {
                    console.error('❌ Erro ao atualizar status:', error);
                }
            });
        } catch (error) {
            console.error('❌ Erro ao alternar status do pacote:', error);
        }
    }

    /**
     * Inicializar comportamentos do formulário
     */
    initializeFormBehavior(packageData) {
        // Configurar funções globais para o formulário
        window.togglePackageFields = (billingType) => {
            const subscriptionSection = document.getElementById('subscriptionSection');
            const creditsSection = document.getElementById('creditsSection');
            
            if (billingType === 'SUBSCRIPTION') {
                subscriptionSection.style.display = 'block';
                creditsSection.style.display = 'none';
                
                // Tornar campos de assinatura obrigatórios
                document.getElementById('subscriptionPrice').required = true;
                document.getElementById('classesPerWeek').required = true;
                
                // Remover obrigatoriedade dos campos de crédito
                document.getElementById('creditQuantity').required = false;
                document.getElementById('pricePerClass').required = false;
                
            } else if (billingType === 'CREDIT') {
                subscriptionSection.style.display = 'none';
                creditsSection.style.display = 'block';
                
                // Tornar campos de crédito obrigatórios
                document.getElementById('creditQuantity').required = true;
                document.getElementById('pricePerClass').required = true;
                
                // Remover obrigatoriedade dos campos de assinatura
                document.getElementById('subscriptionPrice').required = false;
                document.getElementById('classesPerWeek').required = false;
                
            } else {
                subscriptionSection.style.display = 'none';
                creditsSection.style.display = 'none';
                
                // Remover todas as obrigatoriedades
                document.getElementById('subscriptionPrice').required = false;
                document.getElementById('classesPerWeek').required = false;
                document.getElementById('creditQuantity').required = false;
                document.getElementById('pricePerClass').required = false;
            }
        };

        window.toggleUnlimited = (isUnlimited) => {
            const classesPerWeekInput = document.getElementById('classesPerWeek');
            if (isUnlimited) {
                classesPerWeekInput.disabled = true;
                classesPerWeekInput.value = '';
                classesPerWeekInput.required = false;
            } else {
                classesPerWeekInput.disabled = false;
                classesPerWeekInput.required = true;
            }
        };

        window.calculateTotalCredits = () => {
            const quantity = parseFloat(document.getElementById('creditQuantity').value) || 0;
            const pricePerClass = parseFloat(document.getElementById('pricePerClass').value) || 0;
            const total = quantity * pricePerClass;
            
            document.getElementById('totalPackagePrice').value = total.toFixed(2);
        };

        // Mostrar seção correta baseada no tipo existente
        if (packageData?.billingType) {
            window.togglePackageFields(packageData.billingType);
            
            // Preencher campos específicos do tipo
            if (packageData.billingType === 'SUBSCRIPTION') {
                document.getElementById('subscriptionPrice').value = packageData.price || '';
                document.getElementById('billingCycle').value = packageData.billingCycle || 'MONTHLY';
                // Para planos ilimitados ou com 0 aulas, deixar campo vazio para evitar erro de validação
                const classesValue = packageData.isUnlimitedAccess || packageData.classesPerWeek === 0 ? '' : (packageData.classesPerWeek || '');
                document.getElementById('classesPerWeek').value = classesValue;
                document.getElementById('unlimitedClasses').checked = packageData.unlimitedClasses || false;
                window.toggleUnlimited(packageData.unlimitedClasses || false);
            } else if (packageData.billingType === 'CREDIT') {
                document.getElementById('creditQuantity').value = packageData.maxClasses || '';
                document.getElementById('pricePerClass').value = packageData.pricePerClass || '';
                document.getElementById('creditsValidity').value = packageData.creditsValidity || 90;
                window.calculateTotalCredits();
            }
        }
    }

    /**
     * Mostrar notificação ao usuário
     */
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `packages-notification packages-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Adicionar estilos inline se necessário
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            padding: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            font-family: inherit;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Salvar pacote (criar ou atualizar)
     */
    async savePackage(form, isEdit, packageId) {
        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                billingType: formData.get('billingType'),
                classesPerWeek: parseInt(formData.get('classesPerWeek')),
                maxClasses: formData.get('maxClasses') ? parseInt(formData.get('maxClasses')) : null,
                hasPersonalTraining: formData.has('hasPersonalTraining'),
                hasNutrition: formData.has('hasNutrition')
            };

            const url = isEdit ? `/api/billing-plans/${packageId}` : '/api/billing-plans';
            const method = isEdit ? 'PUT' : 'POST';

            await this.apiHelper.fetchWithStates(url, {
                method,
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
                onSuccess: (result) => {
                    console.log('✅ Pacote salvo com sucesso');
                    this.showNotification('✅ Pacote salvo com sucesso!', 'success');
                    this.navigateTo('packages');
                    this.loadPackages();
                },
                onError: (error) => {
                    console.error('❌ Erro ao salvar pacote:', error);
                    this.showNotification('❌ Erro ao salvar pacote: ' + error.message, 'error');
                }
            });
        } catch (error) {
            console.error('❌ Erro ao salvar pacote:', error);
            this.showNotification('❌ Erro ao salvar pacote. Verifique os dados e tente novamente.', 'error');
        }
    }

    /**
     * Carregamento de controladores (stub)
     */
    async loadControllers() {
        // Mantido simples: controllers podem ser adicionados futuramente
        this.controllers = this.controllers || {};
    }

    /**
     * Carregamento de serviços (stub)
     */
    async loadServices() {
        this.services = this.services || {};
    }

    /**
     * Dados iniciais do módulo
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadPackages(),
            ]);
            this.calculateMetrics();
            if (this.currentView === 'dashboard') {
                this.renderCurrentView();
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais do Packages:', error);
            window.app?.handleError?.(error, 'Packages.loadInitialData');
        }
    }

    /**
     * Buscar pacotes no backend
     */
    async loadPackages() {
        try {
            const res = await this.apiHelper.api.request('GET', '/api/billing-plans');
            if (res?.success) {
                this.state.packages = Array.isArray(res.data) ? res.data : [];
                if (this.currentView === 'packages') {
                    this.renderCurrentView();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar pacotes:', error);
        }
    }

    /**
     * Calcular métricas locais básicas
     */
    calculateMetrics() {
        const totalPackages = this.state.packages.length;
        const activePackages = this.state.packages.filter(p => p.isActive).length;
        this.state.metrics = {
            totalPackages,
            activePackages,
            totalRevenue: 0,
            activeSubscriptions: 0,
            totalCreditsRestantes: 0,
            totalCreditsVendidos: 0
        };
    }

    /**
     * Listeners globais do módulo (stub)
     */
    setupEventListeners() {
        // Hooks de integração podem ser adicionados aqui
    }

    /**
     * Integração com AcademyApp
     */
    integrateWithApp() {
        try {
            window.app?.dispatchEvent?.('module:loaded', { name: this.name });
        } catch (e) {
            // Fallback silencioso
        }
    }

    applyFilters() {
        console.log('🔍 Aplicando filtros...');
        // TODO: Implementar filtros
    }

    /**
     * Configurar funcionamento das tabs
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Atualizar botões ativos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Atualizar conteúdo ativo
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.dataset.tab === targetTab) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    /**
     * Carregar cursos disponíveis
     */
    async loadAvailableCourses() {
        try {
            console.log('🎓 Carregando cursos disponíveis...');
            
            const response = await this.apiHelper.api.request('GET', '/api/courses');
            
            if (response.success) {
                this.availableCourses = response.data || [];
                console.log('✅ Cursos carregados:', this.availableCourses.length);
                this.renderCoursesSelection();
            } else {
                console.error('❌ Erro ao carregar cursos:', response.error);
                this.showCoursesError('Erro ao carregar cursos disponíveis');
            }
        } catch (error) {
            console.error('❌ Erro na requisição de cursos:', error);
            this.showCoursesError('Erro na conexão com o servidor');
        }
    }

    /**
     * Renderizar seleção de cursos
     */
    renderCoursesSelection() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        if (!this.availableCourses || this.availableCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h4>Nenhum curso encontrado</h4>
                    <p>Cadastre cursos para associá-los a este pacote</p>
                </div>
            `;
            return;
        }

        // Obter cursos já selecionados do pacote atual
        const selectedCourseIds = this.getCurrentSelectedCourses();

        const coursesHTML = this.availableCourses.map(course => `
            <div class="course-item" data-course-id="${course.id}">
                <label class="course-checkbox-label">
                    <input type="checkbox" 
                           name="selectedCourses" 
                           value="${course.id}" 
                           ${selectedCourseIds.includes(course.id) ? 'checked' : ''}
                           onchange="window.packagesModule.handleCourseSelection('${course.id}', this.checked)">
                    <span class="checkbox-custom"></span>
                    <div class="course-info">
                        <div class="course-name">${course.name}</div>
                        <div class="course-description">${course.description || 'Sem descrição'}</div>
                        <div class="course-meta">
                            <span class="course-level">${course.level || 'Todos os níveis'}</span>
                            ${course.isActive ? '<span class="status-badge active">Ativo</span>' : '<span class="status-badge inactive">Inativo</span>'}
                        </div>
                    </div>
                </label>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="courses-selection">
                <div class="courses-header">
                    <h4>Selecione os cursos (${this.availableCourses.length} disponíveis)</h4>
                    <div class="selection-actions">
                        <button type="button" class="btn-link" onclick="window.packagesModule.selectAllCourses()">
                            Selecionar todos
                        </button>
                        <button type="button" class="btn-link" onclick="window.packagesModule.clearCourseSelection()">
                            Limpar seleção
                        </button>
                    </div>
                </div>
                <div class="courses-list">
                    ${coursesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Obter cursos atualmente selecionados
     */
    getCurrentSelectedCourses() {
        // Se estamos editando um pacote, obter os cursos já associados
        if (this.currentPlan && this.currentPlan.features && this.currentPlan.features.courseIds) {
            return this.currentPlan.features.courseIds;
        }
        
        // Ou obter das checkboxes marcadas
        const checkedBoxes = document.querySelectorAll('input[name="selectedCourses"]:checked');
        return Array.from(checkedBoxes).map(cb => cb.value);
    }

    /**
     * Manipular seleção de curso
     */
    handleCourseSelection(courseId, isSelected) {
        console.log(`🎓 Curso ${courseId} ${isSelected ? 'selecionado' : 'desmarcado'}`);
        
        // Atualizar visualmente se necessário
        const courseItem = document.querySelector(`[data-course-id="${courseId}"]`);
        if (courseItem) {
            courseItem.classList.toggle('selected', isSelected);
        }
    }

    /**
     * Selecionar todos os cursos
     */
    selectAllCourses() {
        const checkboxes = document.querySelectorAll('input[name="selectedCourses"]');
        checkboxes.forEach(cb => {
            cb.checked = true;
            this.handleCourseSelection(cb.value, true);
        });
    }

    /**
     * Limpar seleção de cursos
     */
    clearCourseSelection() {
        const checkboxes = document.querySelectorAll('input[name="selectedCourses"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
            this.handleCourseSelection(cb.value, false);
        });
    }

    /**
     * Mostrar erro na seção de cursos
     */
    showCoursesError(message) {
        const container = document.getElementById('courses-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erro ao carregar cursos</h4>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="window.packagesModule.loadAvailableCourses()">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    /**
     * Alternar campos baseado no tipo de pacote
     */
    togglePackageFields(billingType) {
        const subscriptionSection = document.getElementById('subscriptionSection');
        const creditsSection = document.getElementById('creditsSection');
        
        if (billingType === 'RECURRING') {
            if (subscriptionSection) subscriptionSection.style.display = 'block';
            if (creditsSection) creditsSection.style.display = 'none';
            
            // Tornar campos de assinatura obrigatórios
            const subscriptionPrice = document.getElementById('subscriptionPrice');
            const classesPerWeek = document.getElementById('classesPerWeek');
            if (subscriptionPrice) subscriptionPrice.required = true;
            if (classesPerWeek) classesPerWeek.required = true;
            
            // Remover obrigatoriedade dos campos de crédito
            const creditQuantity = document.getElementById('creditQuantity');
            const pricePerClass = document.getElementById('pricePerClass');
            if (creditQuantity) creditQuantity.required = false;
            if (pricePerClass) pricePerClass.required = false;
            
        } else if (billingType === 'MONTHLY') {
            if (subscriptionSection) subscriptionSection.style.display = 'none';
            if (creditsSection) creditsSection.style.display = 'block';
            
            // Tornar campos de crédito obrigatórios
            const creditQuantity = document.getElementById('creditQuantity');
            const pricePerClass = document.getElementById('pricePerClass');
            if (creditQuantity) creditQuantity.required = true;
            if (pricePerClass) pricePerClass.required = true;
            
            // Remover obrigatoriedade dos campos de assinatura
            const subscriptionPrice = document.getElementById('subscriptionPrice');
            const classesPerWeek = document.getElementById('classesPerWeek');
            if (subscriptionPrice) subscriptionPrice.required = false;
            if (classesPerWeek) classesPerWeek.required = false;
            
        } else {
            if (subscriptionSection) subscriptionSection.style.display = 'none';
            if (creditsSection) creditsSection.style.display = 'none';
            
            // Remover todas as obrigatoriedades
            const fields = ['subscriptionPrice', 'classesPerWeek', 'creditQuantity', 'pricePerClass'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.required = false;
            });
        }
    }

    /**
     * Alternar aulas ilimitadas
     */
    toggleUnlimited(isUnlimited) {
        const classesPerWeekInput = document.getElementById('classesPerWeek');
        if (classesPerWeekInput) {
            if (isUnlimited) {
                classesPerWeekInput.disabled = true;
                classesPerWeekInput.value = '';
                classesPerWeekInput.required = false;
            } else {
                classesPerWeekInput.disabled = false;
                classesPerWeekInput.required = true;
            }
        }
    }

    /**
     * Calcular total de créditos
     */
    calculateTotalCredits() {
        const quantityField = document.getElementById('creditQuantity');
        const pricePerClassField = document.getElementById('pricePerClass');
        const totalField = document.getElementById('totalPackagePrice');
        
        if (quantityField && pricePerClassField && totalField) {
            const quantity = parseFloat(quantityField.value) || 0;
            const pricePerClass = parseFloat(pricePerClassField.value) || 0;
            const total = quantity * pricePerClass;
            
            totalField.value = total.toFixed(2);
        }
    }

    /**
     * Cleanup do módulo
     */
    destroy() {
        console.log('🧹 Limpando recursos do PackagesModule...');
        
        // Remover event listeners
        document.removeEventListener('packages:navigate', this.handleNavigation);
        document.removeEventListener('packages:refresh', this.handleRefresh);
        
        // Limpar estado
        this.state = null;
        this.api = null;
        this.controllers = null;
        this.services = null;
        
        console.log('✅ Recursos do PackagesModule limpos');
    }
}

/**
 * Função de inicialização global (AcademyApp integration)
 */
window.initializePackagesModule = async function() {
    console.log('🚀 Inicializando PackagesModule...');
    
    const module = new PackagesModule();
    const initialized = await module.init();
    
    if (initialized) {
        module.render();
        
        // Expor módulo globalmente para acesso via onclick
        window.packagesModule = module;
        
        console.log('✅ PackagesModule inicializado e renderizado');
        return module;
    } else {
        console.error('❌ Falha ao inicializar PackagesModule');
        return null;
    }
};

// Auto-inicialização
if (typeof window !== 'undefined') {
    console.log('📦 PackagesModule carregado e pronto');
}
