/**
 * MARKETING MODULE - Single-file pattern
 * Módulo de Marketing com gerenciamento de Landing Pages via Agente IA
 * 
 * Features:
 * - Dashboard de Marketing (campanhas, leads, ROI)
 * - Landing Pages (gerenciadas via chat com Agente de Marketing)
 * - Integração com CRM (leads)
 * - Analytics de páginas
 * 
 * @version 1.0.0
 * @follows AGENTS.md v2.1 - Single-file pattern
 */

// Prevent re-declaration
if (typeof window.MarketingModule !== 'undefined') {
    console.log('✅ Marketing Module already loaded');
} else {

const MarketingModule = {
    container: null,
    moduleAPI: null,
    currentView: 'dashboard', // dashboard, landing-pages, landing-detail, campaigns, analytics
    currentLandingPageId: null,
    landingPages: [],
    campaigns: [],
    stats: null,
    
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    async init(container) {
        console.log('📣 [Marketing] Initializing module...');
        
        if (!container) {
            console.log('ℹ️ [Marketing] Initialized without container');
            await this.initializeAPI();
            window.marketing = this;
            return;
        }
        
        this.container = container;
        
        try {
            await this.initializeAPI();
            await this.loadInitialData();
            this.render();
            this.setupEvents();
            
            window.marketing = this;
            window.MarketingModule = this;
            
            window.app?.dispatchEvent('module:loaded', { name: 'marketing' });
            console.log('✅ [Marketing] Module initialized');
        } catch (error) {
            console.error('❌ [Marketing] Init failed:', error);
            window.app?.handleError?.(error, { module: 'marketing', context: 'init' });
        }
    },
    
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('Marketing');
        console.log('✅ [Marketing] API client ready');
    },
    
    async loadInitialData() {
        try {
            const [landingRes, statsRes] = await Promise.all([
                this.moduleAPI.request('/api/marketing/landing-pages'),
                this.moduleAPI.request('/api/marketing/analytics/summary').catch(() => ({ data: null }))
            ]);
            
            this.landingPages = landingRes?.data || [];
            this.stats = statsRes?.data || { totalPages: 0, totalViews: 0, totalLeads: 0 };
            
            console.log('📊 [Marketing] Data loaded:', {
                landingPages: this.landingPages.length,
                stats: this.stats
            });
        } catch (error) {
            console.warn('⚠️ [Marketing] Could not load data:', error);
            this.landingPages = [];
            this.stats = { totalPages: 0, totalViews: 0, totalLeads: 0 };
        }
    },
    
    // =========================================================================
    // RENDERING
    // =========================================================================
    
    render() {
        switch (this.currentView) {
            case 'landing-pages':
                this.renderLandingPages();
                break;
            case 'landing-detail':
                this.renderLandingDetail();
                break;
            case 'campaigns':
                this.renderCampaigns();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            default:
                this.renderDashboard();
        }
    },
    
    renderDashboard() {
        const stats = this.stats || {};
        
        this.container.innerHTML = `
            <div class="module-isolated-marketing">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1><i class="fas fa-bullhorn"></i> Marketing</h1>
                            <nav class="breadcrumb">
                                <span>🏠 Home</span>
                                <span>›</span>
                                <span>📣 Marketing</span>
                            </nav>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid-premium">
                    <div class="stat-card-enhanced" onclick="marketing.navigateTo('landing-pages')">
                        <div class="stat-icon">🌐</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.totalPages || 0}</div>
                            <div class="stat-label">Landing Pages</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatNumber(stats.totalViews || 0)}</div>
                            <div class="stat-label">Visualizações</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.totalLeads || 0}</div>
                            <div class="stat-label">Leads Capturados</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📈</div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.conversionRate || '0'}%</div>
                            <div class="stat-label">Taxa Conversão</div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="marketing-tabs data-card-premium">
                    <div class="tabs-header">
                        <button class="tab-btn ${this.currentView === 'dashboard' ? 'active' : ''}" 
                                onclick="marketing.navigateTo('dashboard')">
                            <i class="fas fa-home"></i> Dashboard
                        </button>
                        <button class="tab-btn ${this.currentView === 'landing-pages' ? 'active' : ''}" 
                                onclick="marketing.navigateTo('landing-pages')">
                            <i class="fas fa-globe"></i> Landing Pages
                        </button>
                        <button class="tab-btn ${this.currentView === 'campaigns' ? 'active' : ''}" 
                                onclick="marketing.navigateTo('campaigns')">
                            <i class="fas fa-bullseye"></i> Campanhas
                        </button>
                        <button class="tab-btn ${this.currentView === 'analytics' ? 'active' : ''}" 
                                onclick="marketing.navigateTo('analytics')">
                            <i class="fas fa-chart-line"></i> Analytics
                        </button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="marketing-grid">
                    <!-- Left: Recent Landing Pages -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3><i class="fas fa-globe"></i> Landing Pages Recentes</h3>
                            <button class="btn-action-secondary btn-sm" onclick="marketing.navigateTo('landing-pages')">
                                Ver Todas
                            </button>
                        </div>
                        <div class="landing-pages-list">
                            ${this.renderRecentLandingPages()}
                        </div>
                    </div>

                    <!-- Right: AI Agent Integration -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3><i class="fas fa-robot"></i> Agente de Marketing</h3>
                        </div>
                        <div class="agent-integration">
                            <div class="agent-info">
                                <div class="agent-avatar">🤖</div>
                                <div class="agent-details">
                                    <h4>Assistente de Marketing IA</h4>
                                    <p>Crie e edite landing pages conversando com o agente</p>
                                </div>
                            </div>
                            <div class="agent-actions">
                                <button class="btn-action-premium" onclick="marketing.openAgentChat()">
                                    <i class="fas fa-comments"></i>
                                    Abrir Chat
                                </button>
                                <button class="btn-action-secondary" onclick="marketing.createNewLandingPage()">
                                    <i class="fas fa-plus"></i>
                                    Nova Landing Page
                                </button>
                            </div>
                            <div class="agent-prompts">
                                <h5>Prompts Sugeridos:</h5>
                                <div class="prompt-chips">
                                    <span class="prompt-chip" onclick="marketing.sendPrompt('Crie uma landing page para defesa pessoal feminina')">
                                        📝 LP Defesa Feminina
                                    </span>
                                    <span class="prompt-chip" onclick="marketing.sendPrompt('Atualize os depoimentos da página SmartDefence')">
                                        ✏️ Atualizar Depoimentos
                                    </span>
                                    <span class="prompt-chip" onclick="marketing.sendPrompt('Adicione uma seção de FAQ na landing page')">
                                        ❓ Adicionar FAQ
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderRecentLandingPages() {
        if (!this.landingPages.length) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <p>Nenhuma landing page criada</p>
                    <button class="btn-action-primary btn-sm" onclick="marketing.createNewLandingPage()">
                        <i class="fas fa-plus"></i> Criar Primeira
                    </button>
                </div>
            `;
        }
        
        return this.landingPages.slice(0, 5).map(page => `
            <div class="landing-page-item" onclick="marketing.viewLandingPage('${page.id}')">
                <div class="page-status ${page.status.toLowerCase()}">
                    ${page.status === 'PUBLISHED' ? '🟢' : page.status === 'DRAFT' ? '🟡' : '⚫'}
                </div>
                <div class="page-info">
                    <div class="page-name">${page.name}</div>
                    <div class="page-meta">
                        <span>/${page.slug}</span>
                        <span>•</span>
                        <span>${page._count?.pageViews || 0} views</span>
                    </div>
                </div>
                <div class="page-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); marketing.previewPage('${page.id}')" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); marketing.editWithAgent('${page.id}')" title="Editar com IA">
                        <i class="fas fa-robot"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // =========================================================================
    // LANDING PAGES TAB
    // =========================================================================
    
    renderLandingPages() {
        this.container.innerHTML = `
            <div class="module-isolated-marketing">
                <!-- Header -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1><i class="fas fa-globe"></i> Landing Pages</h1>
                            <nav class="breadcrumb">
                                <span onclick="marketing.navigateTo('dashboard')" style="cursor:pointer">📣 Marketing</span>
                                <span>›</span>
                                <span>🌐 Landing Pages</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <button class="btn-action-secondary" onclick="marketing.navigateTo('dashboard')">
                                <i class="fas fa-arrow-left"></i> Voltar
                            </button>
                            <button class="btn-action-premium" onclick="marketing.createNewLandingPage()">
                                <i class="fas fa-plus"></i> Nova Landing Page
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Info Banner -->
                <div class="info-banner data-card-premium">
                    <div class="banner-icon">🤖</div>
                    <div class="banner-content">
                        <h4>Gerencie suas Landing Pages com IA</h4>
                        <p>Use o chat do Agente de Marketing para criar, editar e otimizar suas páginas. 
                           Basta descrever o que você quer e a IA gera o conteúdo completo!</p>
                    </div>
                    <button class="btn-action-primary" onclick="marketing.openAgentChat()">
                        <i class="fas fa-comments"></i> Abrir Chat
                    </button>
                </div>

                <!-- Landing Pages Grid -->
                <div class="landing-pages-grid">
                    ${this.renderLandingPagesGrid()}
                </div>
            </div>
        `;
    },
    
    renderLandingPagesGrid() {
        if (!this.landingPages.length) {
            return `
                <div class="empty-state-large data-card-premium">
                    <div class="empty-icon">🌐</div>
                    <h3>Nenhuma Landing Page</h3>
                    <p>Crie sua primeira landing page usando o Agente de Marketing</p>
                    <div class="empty-actions">
                        <button class="btn-action-premium" onclick="marketing.createNewLandingPage()">
                            <i class="fas fa-plus"></i> Criar Landing Page
                        </button>
                        <button class="btn-action-secondary" onclick="marketing.openAgentChat()">
                            <i class="fas fa-robot"></i> Pedir para IA Criar
                        </button>
                    </div>
                </div>
            `;
        }
        
        return this.landingPages.map(page => `
            <div class="landing-page-card data-card-premium" onclick="marketing.viewLandingPage('${page.id}')">
                <div class="card-header-row">
                    <span class="status-badge ${page.status.toLowerCase()}">
                        ${page.status === 'PUBLISHED' ? '🟢 Publicada' : page.status === 'DRAFT' ? '🟡 Rascunho' : '⚫ Arquivada'}
                    </span>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); marketing.previewPage('${page.id}')" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); marketing.copyPageUrl('${page.slug}')" title="Copiar URL">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body">
                    <h3>${page.name}</h3>
                    <p class="page-url">/lp/${page.slug}</p>
                    <p class="page-description">${page.description || 'Sem descrição'}</p>
                </div>
                
                <div class="card-stats">
                    <div class="stat">
                        <span class="stat-value">${page._count?.pageViews || 0}</span>
                        <span class="stat-label">Views</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${page._count?.forms || 0}</span>
                        <span class="stat-label">Formulários</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.formatDate(page.updatedAt)}</span>
                        <span class="stat-label">Atualizado</span>
                    </div>
                </div>
                
                <div class="card-footer">
                    <button class="btn-action-secondary btn-sm" onclick="event.stopPropagation(); marketing.editWithAgent('${page.id}')">
                        <i class="fas fa-robot"></i> Editar com IA
                    </button>
                    ${page.status === 'DRAFT' ? `
                        <button class="btn-action-primary btn-sm" onclick="event.stopPropagation(); marketing.publishPage('${page.id}')">
                            <i class="fas fa-rocket"></i> Publicar
                        </button>
                    ` : `
                        <button class="btn-action-secondary btn-sm" onclick="event.stopPropagation(); marketing.unpublishPage('${page.id}')">
                            <i class="fas fa-pause"></i> Despublicar
                        </button>
                    `}
                </div>
            </div>
        `).join('');
    },
    
    // =========================================================================
    // LANDING PAGE DETAIL
    // =========================================================================
    
    async renderLandingDetail() {
        if (!this.currentLandingPageId) {
            this.navigateTo('landing-pages');
            return;
        }
        
        // Show loading
        this.container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Carregando landing page...</p>
            </div>
        `;
        
        try {
            const res = await this.moduleAPI.request(`/api/marketing/landing-pages/${this.currentLandingPageId}`);
            const page = res.data;
            
            this.container.innerHTML = `
                <div class="module-isolated-marketing">
                    <!-- Header -->
                    <div class="module-header-premium">
                        <div class="header-content">
                            <div class="header-title-section">
                                <h1><i class="fas fa-file-alt"></i> ${page.name}</h1>
                                <nav class="breadcrumb">
                                    <span onclick="marketing.navigateTo('dashboard')" style="cursor:pointer">📣 Marketing</span>
                                    <span>›</span>
                                    <span onclick="marketing.navigateTo('landing-pages')" style="cursor:pointer">🌐 Landing Pages</span>
                                    <span>›</span>
                                    <span>${page.name}</span>
                                </nav>
                            </div>
                            <div class="header-actions">
                                <button class="btn-action-secondary" onclick="marketing.navigateTo('landing-pages')">
                                    <i class="fas fa-arrow-left"></i> Voltar
                                </button>
                                <button class="btn-action-secondary" onclick="marketing.previewPage('${page.id}')">
                                    <i class="fas fa-eye"></i> Preview
                                </button>
                                <button class="btn-action-primary" onclick="marketing.editWithAgent('${page.id}')">
                                    <i class="fas fa-robot"></i> Editar com IA
                                </button>
                                ${page.status === 'DRAFT' ? `
                                    <button class="btn-action-premium" onclick="marketing.publishPage('${page.id}')">
                                        <i class="fas fa-rocket"></i> Publicar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Page Info -->
                    <div class="landing-detail-grid">
                        <!-- Left: Info -->
                        <div class="data-card-premium">
                            <h3><i class="fas fa-info-circle"></i> Informações</h3>
                            <div class="info-list">
                                <div class="info-item">
                                    <label>Status</label>
                                    <span class="status-badge ${page.status.toLowerCase()}">
                                        ${page.status === 'PUBLISHED' ? '🟢 Publicada' : '🟡 Rascunho'}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <label>URL</label>
                                    <span class="page-url-copy">
                                        /lp/${page.slug}
                                        <button class="btn-icon btn-xs" onclick="marketing.copyPageUrl('${page.slug}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                                <div class="info-item">
                                    <label>Título SEO</label>
                                    <span>${page.title || '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Descrição</label>
                                    <span>${page.description || '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>WhatsApp</label>
                                    <span>${page.whatsappNumber || '-'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Última Geração IA</label>
                                    <span>${page.lastGeneratedAt ? this.formatDateTime(page.lastGeneratedAt) : 'Nunca'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Stats -->
                        <div class="data-card-premium">
                            <h3><i class="fas fa-chart-bar"></i> Estatísticas</h3>
                            <div class="stats-grid-small">
                                <div class="stat-item">
                                    <div class="stat-value">${page._count?.pageViews || 0}</div>
                                    <div class="stat-label">Visualizações</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${page._count?.forms || 0}</div>
                                    <div class="stat-label">Formulários</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${page.conversionRate || 0}%</div>
                                    <div class="stat-label">Conversão</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview Frame -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3><i class="fas fa-desktop"></i> Preview</h3>
                            <button class="btn-action-secondary btn-sm" onclick="marketing.openFullPreview('${page.id}')">
                                <i class="fas fa-external-link-alt"></i> Abrir em Nova Aba
                            </button>
                        </div>
                        <div class="preview-frame-container">
                            ${page.htmlContent ? `
                                <iframe 
                                    id="page-preview-frame" 
                                    srcdoc="${this.escapeHtml(page.htmlContent)}"
                                    class="preview-frame"
                                ></iframe>
                            ` : `
                                <div class="empty-preview">
                                    <div class="empty-icon">📝</div>
                                    <p>Conteúdo não gerado ainda</p>
                                    <button class="btn-action-primary" onclick="marketing.editWithAgent('${page.id}')">
                                        <i class="fas fa-robot"></i> Gerar com IA
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Error loading landing page:', error);
            this.showNotification('Erro ao carregar landing page', 'error');
            this.navigateTo('landing-pages');
        }
    },
    
    // =========================================================================
    // CAMPAIGNS & ANALYTICS (Placeholder)
    // =========================================================================
    
    renderCampaigns() {
        this.container.innerHTML = `
            <div class="module-isolated-marketing">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1><i class="fas fa-bullseye"></i> Campanhas</h1>
                            <nav class="breadcrumb">
                                <span onclick="marketing.navigateTo('dashboard')" style="cursor:pointer">📣 Marketing</span>
                                <span>›</span>
                                <span>🎯 Campanhas</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <button class="btn-action-secondary" onclick="marketing.navigateTo('dashboard')">
                                <i class="fas fa-arrow-left"></i> Voltar
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="coming-soon data-card-premium">
                    <div class="coming-soon-icon">🚀</div>
                    <h2>Em Breve</h2>
                    <p>Gerenciamento de campanhas Google Ads e Facebook será implementado em breve.</p>
                    <p>Por enquanto, use o módulo CRM para acompanhar leads.</p>
                    <button class="btn-action-primary" onclick="router.navigateTo('crm')">
                        <i class="fas fa-users"></i> Ir para CRM
                    </button>
                </div>
            </div>
        `;
    },
    
    renderAnalytics() {
        this.container.innerHTML = `
            <div class="module-isolated-marketing">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1><i class="fas fa-chart-line"></i> Analytics</h1>
                            <nav class="breadcrumb">
                                <span onclick="marketing.navigateTo('dashboard')" style="cursor:pointer">📣 Marketing</span>
                                <span>›</span>
                                <span>📈 Analytics</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <button class="btn-action-secondary" onclick="marketing.navigateTo('dashboard')">
                                <i class="fas fa-arrow-left"></i> Voltar
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="coming-soon data-card-premium">
                    <div class="coming-soon-icon">📊</div>
                    <h2>Em Breve</h2>
                    <p>Analytics detalhado de landing pages e campanhas.</p>
                    <p>Por enquanto, visualize métricas básicas em cada landing page.</p>
                </div>
            </div>
        `;
    },
    
    // =========================================================================
    // ACTIONS
    // =========================================================================
    
    navigateTo(view) {
        this.currentView = view;
        this.render();
    },
    
    async createNewLandingPage() {
        const name = prompt('Nome da Landing Page:');
        if (!name) return;
        
        const slug = this.slugify(name);
        
        try {
            const res = await this.moduleAPI.request('/api/marketing/landing-pages', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    slug,
                    title: name,
                    status: 'DRAFT'
                })
            });
            
            if (res.success) {
                this.showNotification('Landing page criada! Use o chat do Agente para gerar o conteúdo.', 'success');
                await this.loadInitialData();
                this.currentLandingPageId = res.data.id;
                this.currentView = 'landing-detail';
                this.render();
            }
        } catch (error) {
            console.error('❌ Error creating landing page:', error);
            this.showNotification('Erro ao criar landing page', 'error');
        }
    },
    
    viewLandingPage(id) {
        this.currentLandingPageId = id;
        this.currentView = 'landing-detail';
        this.render();
    },
    
    async previewPage(id) {
        window.open(`/lp/preview/${id}`, '_blank');
    },
    
    async openFullPreview(id) {
        const page = this.landingPages.find(p => p.id === id);
        if (page && page.status === 'PUBLISHED') {
            window.open(`/lp/${page.slug}`, '_blank');
        } else {
            window.open(`/lp/preview/${id}`, '_blank');
        }
    },
    
    copyPageUrl(slug) {
        const url = `${window.location.origin}/lp/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('URL copiada!', 'success');
        });
    },
    
    async publishPage(id) {
        if (!confirm('Publicar esta landing page? Ela ficará acessível publicamente.')) return;
        
        try {
            const res = await this.moduleAPI.request(`/api/marketing/landing-pages/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'PUBLISHED' })
            });
            
            if (res.success) {
                this.showNotification('Landing page publicada!', 'success');
                await this.loadInitialData();
                this.render();
            }
        } catch (error) {
            this.showNotification('Erro ao publicar', 'error');
        }
    },
    
    async unpublishPage(id) {
        if (!confirm('Despublicar esta landing page?')) return;
        
        try {
            const res = await this.moduleAPI.request(`/api/marketing/landing-pages/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'DRAFT' })
            });
            
            if (res.success) {
                this.showNotification('Landing page despublicada', 'success');
                await this.loadInitialData();
                this.render();
            }
        } catch (error) {
            this.showNotification('Erro ao despublicar', 'error');
        }
    },
    
    // =========================================================================
    // AGENT INTEGRATION
    // =========================================================================
    
    openAgentChat() {
        // Navigate to AI module with marketing context
        if (window.router) {
            window.router.navigateTo('ai');
            // Set marketing context for the agent
            setTimeout(() => {
                if (window.aiModule) {
                    window.aiModule.setContext?.('marketing', {
                        landingPages: this.landingPages,
                        currentPage: this.currentLandingPageId
                    });
                }
            }, 500);
        }
    },
    
    editWithAgent(pageId) {
        const page = this.landingPages.find(p => p.id === pageId);
        if (!page) return;
        
        // Navigate to AI with context
        if (window.router) {
            window.router.navigateTo('ai');
            setTimeout(() => {
                if (window.aiModule) {
                    const prompt = `Estou editando a landing page "${page.name}" (slug: ${page.slug}). 
O que você gostaria de alterar nesta página?`;
                    window.aiModule.setContext?.('marketing', {
                        currentPage: page,
                        mode: 'edit'
                    });
                    window.aiModule.addSystemMessage?.(prompt);
                }
            }, 500);
        }
    },
    
    sendPrompt(prompt) {
        if (window.router) {
            window.router.navigateTo('ai');
            setTimeout(() => {
                if (window.aiModule) {
                    window.aiModule.sendMessage?.(prompt);
                }
            }, 500);
        }
    },
    
    // =========================================================================
    // UTILITIES
    // =========================================================================
    
    slugify(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    },
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    },
    
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    },
    
    escapeHtml(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },
    
    showNotification(message, type = 'info') {
        if (window.app?.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    },
    
    setupEvents() {
        // Add any global event listeners
    }
};

// Wait for API client
async function waitForAPIClient() {
    while (!window.createModuleAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Export globally
window.MarketingModule = MarketingModule;
window.marketing = MarketingModule;

console.log('✅ Marketing Module loaded');

} // end if
