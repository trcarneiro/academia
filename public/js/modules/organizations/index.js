/**
 * Organizations Module - SIMPLIFIED VERSION (Single-file)
 * Manages organizations (academies) and their settings
 * Based on Instructors module template - AGENTS.md v2.1 compliant
 */

// Prevent multiple declarations
if (typeof window.OrganizationsModule !== 'undefined') {
    console.log('🏫 Organizations Module already loaded, skipping...');
} else {

const OrganizationsModule = {
    // Module properties
    container: null,
    organizations: [],
    initialized: false,

    /**
     * Initialize the module - SIMPLIFIED
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('🏫 Organizations Module already initialized, skipping...');
                return this;
            }
            
            console.log('🏫 Organizations Module - Starting (Simplified)...');
            
            if (!this.container) {
                throw new Error('Container not set before initialization');
            }
            
            // Load data and render in one go
            await this.loadData();
            this.render();
            this.setupEvents();
            
            // Register module globally for compatibility
            window.organizationsModule = this;
            window.organizationsController = this; // Compatibility with existing code
            
            // Dispatch module loaded event
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'organizations' });
            }
            
            this.initialized = true;
            console.log('✅ Organizations Module - Loaded (Simplified)');
            
            return this;
        } catch (error) {
            console.error('❌ Organizations Module initialization failed:', error);
            if (window.app) {
                window.app.handleError(error, 'Organizations Module Init');
            }
            throw error;
        }
    },

    /**
     * Load organizations data from API
     */
    async loadData() {
        try {
            console.log('📡 Loading organizations data...');
            
            const response = await fetch('/api/organizations');
            const data = await response.json();
            
            if (data.success) {
                this.organizations = data.data || [];
                console.log(`📊 Loaded ${this.organizations.length} organizations`);
            } else {
                throw new Error(data.error || 'Failed to load organizations');
            }
        } catch (error) {
            console.error('❌ Error loading organizations:', error);
            throw error;
        }
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.showSuccess) {
            window.showSuccess(message);
        } else {
            // Fallback: create inline notification
            this.showNotification(message, 'success');
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        if (window.showError) {
            window.showError(message);
        } else {
            // Fallback: create inline notification
            this.showNotification(message, 'error');
        }
    },

    /**
     * Show inline notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.organization-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `organization-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Insert at top of container
        this.container.insertBefore(notification, this.container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    /**
     * Render main organizations list - EXACT SAME STRUCTURE AS INSTRUCTORS
     */
    render() {
        const totalOrganizations = this.organizations.length;
        const activeOrganizations = this.organizations.filter(org => org.isActive).length;
        const totalStudents = this.organizations.reduce((sum, org) => sum + (org.maxStudents || 0), 0);

        this.container.innerHTML = `
            <!-- Premium Header -->
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <span class="breadcrumb-item active">🏫 Organizações</span>
                </div>
                <h1 class="module-title-premium">
                    🏫 Gestão de Organizações
                </h1>
                <div class="module-subtitle">
                    Gerencie organizações e configurações da academia
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="window.organizationsModule.navigateToEditor()">
                        <i class="fas fa-plus"></i>
                        Nova Organização
                    </button>
                </div>
            </div>

            <!-- Stats Cards - EXACT SAME AS INSTRUCTORS -->
            <div class="stats-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-university"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalOrganizations}</div>
                        <div class="stat-label">Total de Organizações</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${activeOrganizations}</div>
                        <div class="stat-label">Organizações Ativas</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalStudents}</div>
                        <div class="stat-label">Capacidade Total</div>
                    </div>
                </div>
            </div>

            <!-- Organizations Table - PREMIUM STYLE -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h3>Lista de Organizações</h3>
                    <div class="search-filter">
                        <input type="text" placeholder="🔍 Buscar organizações..." class="search-input">
                    </div>
                </div>
                <table class="data-table-premium">
                    <thead>
                        <tr>
                            <th>Organização</th>
                            <th>Localização</th>
                            <th>Plano</th>
                            <th>Capacidade</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.organizations.map(org => this.renderOrganizationRow(org)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render single organization row - EXACT SAME PATTERN AS INSTRUCTORS
     */
    renderOrganizationRow(org) {
        const statusClass = org.isActive ? 'status-active' : 'status-inactive';
        const statusText = org.isActive ? 'Ativo' : 'Inativo';
        const planText = this.getPlanText(org.subscriptionPlan);

        return `
            <tr class="data-row-premium" data-id="${org.id}">
                <td>
                    <div class="organization-info-premium">
                        <div class="organization-avatar-premium">
                            <span>🏫</span>
                        </div>
                        <div class="organization-details">
                            <div class="organization-name">${org.name}</div>
                            <div class="organization-slug">${org.slug}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="location-info">
                        <div class="city">${org.city || 'Não informado'}</div>
                        <div class="state">${org.state || ''} - ${org.country || 'Brasil'}</div>
                    </div>
                </td>
                <td>
                    <span class="plan-badge plan-${org.subscriptionPlan?.toLowerCase()}">${planText}</span>
                </td>
                <td>
                    <div class="capacity-info">
                        <span class="capacity-number">${org.maxStudents}</span>
                        <span class="capacity-label">alunos</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.organizationsModule.navigateToEditor('${org.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="window.organizationsModule.confirmDelete('${org.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Get plan text
     */
    getPlanText(plan) {
        const plans = {
            'BASIC': 'Básico',
            'PREMIUM': 'Premium',
            'ENTERPRISE': 'Empresarial'
        };
        return plans[plan] || 'Básico';
    },

    /**
     * Setup event listeners - SAME PATTERN AS INSTRUCTORS
     */
    setupEvents() {
        // Double-click to edit (SPA navigation standard)
        const rows = this.container.querySelectorAll('.data-row-premium');
        rows.forEach(row => {
            row.addEventListener('dblclick', (e) => {
                const orgId = row.getAttribute('data-id');
                this.navigateToEditor(orgId);
            });
        });

        // Search functionality
        const searchInput = this.container.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterOrganizations(e.target.value);
            });
        }
    },

    /**
     * Filter organizations by search term
     */
    filterOrganizations(searchTerm) {
        const rows = this.container.querySelectorAll('.data-row-premium');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const orgName = row.querySelector('.organization-name')?.textContent.toLowerCase() || '';
            const orgSlug = row.querySelector('.organization-slug')?.textContent.toLowerCase() || '';
            const city = row.querySelector('.city')?.textContent.toLowerCase() || '';
            
            const matches = orgName.includes(term) || orgSlug.includes(term) || city.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    },

    /**
     * Delete organization with confirmation
     */
    async confirmDelete(orgId) {
        const org = this.organizations.find(o => o.id === orgId);
        if (!org) {
            this.showError('Organização não encontrada');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir a organização "${org.name}"?`)) {
            try {
                const response = await fetch(`/api/organizations/${orgId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.showSuccess('Organização excluída com sucesso!');
                    await this.loadData();
                    this.render();
                    this.setupEvents();
                } else {
                    const error = await response.json();
                    this.showError(error.message || 'Erro ao excluir organização');
                }
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                this.showError('Erro ao excluir organização');
            }
        }
    },

    /**
     * Navigate to editor - INTERNAL NAVIGATION (SPA Style)
     */
    async navigateToEditor(orgId = null) {
        console.log('🔄 Navigating to editor internally:', orgId ? `edit ${orgId}` : 'create new');
        
        try {
            // Render editor within the container
            await this.renderEditor(orgId);
        } catch (error) {
            console.error('❌ Erro ao abrir editor:', error);
            this.showError('Erro ao carregar editor de organização');
        }
    },

    /**
     * Render inline editor - NEW METHOD
     */
    async renderEditor(orgId = null) {
        const isEdit = orgId !== null;
        const title = isEdit ? 'Editar Organização' : 'Nova Organização';
        
        // Get organization data if editing
        let orgData = null;
        if (isEdit) {
            try {
                const response = await fetch(`/api/organizations/${orgId}`);
                if (response.ok) {
                    const result = await response.json();
                    orgData = result.data;
                    
                    // Convert isActive boolean to status string
                    orgData.status = orgData.isActive ? 'ACTIVE' : 'INACTIVE';
                }
            } catch (error) {
                console.error('❌ Erro ao carregar organização:', error);
                this.showError('Erro ao carregar dados da organização');
                return;
            }
        }

        // Render editor form
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <span class="breadcrumb-item" onclick="window.organizationsModule.showList()">🏫 Organizações</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item active">${title}</span>
                </div>
                <h1>${title}</h1>
            </div>

            <div class="organization-editor-container">
                <form id="organization-form" class="organization-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="name">Nome da Organização *</label>
                            <input type="text" id="name" name="name" required 
                                   value="${orgData?.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="slug">Slug *</label>
                            <input type="text" id="slug" name="slug" required 
                                   value="${orgData?.slug || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="description">Descrição</label>
                        <textarea id="description" name="description" rows="3">${orgData?.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" 
                                   value="${orgData?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" 
                                   value="${orgData?.phone || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="city">Cidade</label>
                            <input type="text" id="city" name="city" 
                                   value="${orgData?.city || ''}">
                        </div>
                        <div class="form-group">
                            <label for="state">Estado</label>
                            <select id="state" name="state">
                                <option value="">Selecione...</option>
                                <option value="SP" ${orgData?.state === 'SP' ? 'selected' : ''}>São Paulo</option>
                                <option value="RJ" ${orgData?.state === 'RJ' ? 'selected' : ''}>Rio de Janeiro</option>
                                <option value="MG" ${orgData?.state === 'MG' ? 'selected' : ''}>Minas Gerais</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="subscriptionPlan">Plano de Assinatura</label>
                            <select id="subscriptionPlan" name="subscriptionPlan">
                                <option value="BASIC" ${orgData?.subscriptionPlan === 'BASIC' ? 'selected' : ''}>Básico</option>
                                <option value="PREMIUM" ${orgData?.subscriptionPlan === 'PREMIUM' ? 'selected' : ''}>Premium</option>
                                <option value="ENTERPRISE" ${orgData?.subscriptionPlan === 'ENTERPRISE' ? 'selected' : ''}>Empresarial</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="maxStudents">Máximo de Alunos</label>
                            <input type="number" id="maxStudents" name="maxStudents" min="1" 
                                   value="${orgData?.maxStudents || 100}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="maxStaff">Máximo de Funcionários</label>
                            <input type="number" id="maxStaff" name="maxStaff" min="1" 
                                   value="${orgData?.maxStaff || 10}">
                        </div>
                        <div class="form-group">
                            <label for="status">Status</label>
                            <select id="status" name="status">
                                <option value="ACTIVE" ${orgData?.status === 'ACTIVE' ? 'selected' : ''}>Ativo</option>
                                <option value="INACTIVE" ${orgData?.status === 'INACTIVE' ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.organizationsModule.showList()">
                            ← Voltar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Atualizar' : 'Criar'} Organização
                        </button>
                        ${isEdit ? `
                            <button type="button" class="btn btn-danger" onclick="window.organizationsModule.confirmDelete('${orgId}')">
                                🗑️ Excluir
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        `;

        // Setup form events
        this.setupEditorEvents(orgId);
    },

    /**
     * Setup editor form events
     */
    setupEditorEvents(orgId = null) {
        const form = document.getElementById('organization-form');
        const self = this; // Preserve context

        // Auto-generate slug from name
        const nameInput = document.getElementById('name');
        const slugInput = document.getElementById('slug');
        
        if (nameInput && slugInput) {
            nameInput.addEventListener('input', (e) => {
                if (!orgId) { // Only auto-generate for new organizations
                    const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .trim();
                    slugInput.value = slug;
                }
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await self.handleFormSubmit(orgId);
        });
    },

    /**
     * Handle form submission
     */
    async handleFormSubmit(orgId = null) {
        const form = document.getElementById('organization-form');
        const formData = new FormData(form);
        const isEdit = orgId !== null;

        // Prepare data in correct API format
        const data = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            city: formData.get('city'),
            state: formData.get('state'),
            subscriptionPlan: formData.get('subscriptionPlan'),
            maxStudents: parseInt(formData.get('maxStudents')) || 100,
            maxStaff: parseInt(formData.get('maxStaff')) || 10,
            isActive: formData.get('status') === 'ACTIVE' // Convert string to boolean
        };

        try {
            const url = isEdit ? `/api/organizations/${orgId}` : '/api/organizations';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess(isEdit ? 'Organização atualizada com sucesso!' : 'Organização criada com sucesso!');
                await this.loadData();
                this.showList();
            } else {
                const error = await response.json();
                this.showError(error.message || error.error || 'Erro ao salvar organização');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.showError('Erro ao salvar organização');
        }
    },

    /**
     * Show main list view
     */
    showList() {
        this.render();
        this.setupEvents();
    },

    /**
     * Refresh/reload data - SAME AS INSTRUCTORS
     */
    async refresh() {
        try {
            await this.loadData();
            this.render();
            this.setupEvents();
        } catch (error) {
            console.error('❌ Error refreshing organizations:', error);
            this.showError('Erro ao atualizar dados');
        }
    }
};

// Register module globally and expose for compatibility
window.OrganizationsModule = OrganizationsModule;
window.organizationsModule = OrganizationsModule;

// Global registration
console.log('📦 Organizations Module (Simplified) loaded and ready');

} // End of module wrapper

// Initialization function for SPA router compatibility (ALWAYS AVAILABLE)
window.initOrganizationsModule = async function(container) {
    console.log('🔧 initOrganizationsModule called...');
    if (window.OrganizationsModule) {
        window.OrganizationsModule.container = container;
        return await window.OrganizationsModule.init();
    } else {
        console.error('❌ OrganizationsModule not available');
        throw new Error('OrganizationsModule not loaded');
    }
};

// Export for module loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OrganizationsModule;
}
