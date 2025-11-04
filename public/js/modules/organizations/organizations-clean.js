/**
 * Organizations Module - SIMPLIFIED VERSION (Single-file)  
 * Manages organizations (academies) and their settings
 * Based on Units module template - AGENTS.md v2.1 compliant
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
                window.organizationsController = this;
                
                this.initialized = true;
                console.log('✅ Organizations Module - Loaded (Simplified)');
                
                return this;
            } catch (error) {
                console.error('❌ Organizations Module initialization failed:', error);
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
                console.log('✅ Success:', message);
            }
        },

        /**
         * Show error message
         */
        showError(message) {
            if (window.showError) {
                window.showError(message);
            } else {
                console.error('❌ Error:', message);
            }
        },

        /**
         * Render main organizations list
         */
        render() {
            const totalOrganizations = this.organizations.length;
            const activeOrganizations = this.organizations.filter(org => org.isActive).length;

            this.container.innerHTML = `
                <div class="module-header-premium">
                    <div class="breadcrumb">
                        <span class="breadcrumb-item active">🏫 Organizações</span>
                    </div>
                    <h1 class="module-title-premium">🏫 Gestão de Organizações</h1>
                    <div class="module-subtitle">Gerencie organizações e configurações da academia</div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="window.organizationsModule.showForm()">
                            <i class="fas fa-plus"></i> Nova Organização
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon"><i class="fas fa-university"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${totalOrganizations}</div>
                            <div class="stat-label">Total de Organizações</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-content">
                            <div class="stat-number">${activeOrganizations}</div>
                            <div class="stat-label">Organizações Ativas</div>
                        </div>
                    </div>
                </div>

                <div class="data-card-premium">
                    <div class="card-header"><h3>Lista de Organizações</h3></div>
                    <table class="data-table-premium">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Slug</th>
                                <th>Cidade</th>
                                <th>Plano</th>
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
         * Render single organization row
         */
        renderOrganizationRow(org) {
            const statusClass = org.isActive ? 'status-active' : 'status-inactive';
            const statusText = org.isActive ? 'Ativo' : 'Inativo';

            return `
                <tr class="data-row-premium" data-id="${org.id}">
                    <td><div class="organization-name">${org.name}</div></td>
                    <td><div class="organization-slug">${org.slug}</div></td>
                    <td><div class="city">${org.city || 'Não informado'}</div></td>
                    <td><span class="plan-badge">${org.subscriptionPlan || 'BASIC'}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="window.organizationsModule.editOrganization('${org.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="window.organizationsModule.deleteOrganization('${org.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        },

        /**
         * Setup event listeners
         */
        setupEvents() {
            const rows = this.container.querySelectorAll('.data-row-premium');
            rows.forEach(row => {
                row.addEventListener('dblclick', (e) => {
                    const orgId = row.getAttribute('data-id');
                    this.editOrganization(orgId);
                });
            });
        },

        /**
         * Show form for new/edit organization
         */
        showForm(orgId = null) {
            const isEdit = orgId !== null;
            const title = isEdit ? 'Editar Organização' : 'Nova Organização';
            
            this.container.innerHTML = `
                <div class="module-header-premium">
                    <div class="breadcrumb">
                        <span class="breadcrumb-item" onclick="window.organizationsModule.showList()">🏫 Organizações</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item active">${title}</span>
                    </div>
                    <h1>${title}</h1>
                </div>

                <div class="form-container">
                    <form id="organization-form">
                        <div class="form-group">
                            <label for="name">Nome da Organização *</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="slug">Slug *</label>
                            <input type="text" id="slug" name="slug" required>
                        </div>
                        <div class="form-group">
                            <label for="description">Descrição</label>
                            <textarea id="description" name="description" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="city">Cidade</label>
                            <input type="text" id="city" name="city">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="window.organizationsModule.showList()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            `;

            const form = document.getElementById('organization-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveOrganization(orgId);
            });
        },

        /**
         * Save organization
         */
        async saveOrganization(orgId = null) {
            const form = document.getElementById('organization-form');
            const formData = new FormData(form);
            
            const data = {
                name: formData.get('name'),
                slug: formData.get('slug'),
                description: formData.get('description'),
                city: formData.get('city'),
                isActive: true
            };

            try {
                const url = orgId ? `/api/organizations/${orgId}` : '/api/organizations';
                const method = orgId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    this.showSuccess('Organização salva com sucesso!');
                    await this.loadData();
                    this.showList();
                } else {
                    const error = await response.json();
                    this.showError(error.message || 'Erro ao salvar organização');
                }
            } catch (error) {
                console.error('❌ Erro ao salvar:', error);
                this.showError('Erro ao salvar organização');
            }
        },

        /**
         * Edit organization
         */
        editOrganization(orgId) {
            this.showForm(orgId);
        },

        /**
         * Delete organization
         */
        async deleteOrganization(orgId) {
            const org = this.organizations.find(o => o.id === orgId);
            if (!org) return;

            if (confirm(`Confirma a exclusão da organização "${org.name}"?`)) {
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
                        this.showError('Erro ao excluir organização');
                    }
                } catch (error) {
                    console.error('❌ Erro ao excluir:', error);
                    this.showError('Erro ao excluir organização');
                }
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
         * Refresh/reload data
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

    // Register module globally
    window.OrganizationsModule = OrganizationsModule;
    window.organizationsModule = OrganizationsModule;

    console.log('📦 Organizations Module (Simplified) loaded and ready');

} // End of module wrapper

// Initialization function for SPA router compatibility
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
