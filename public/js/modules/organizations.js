/**
 * Organizations Module - CRUD Management
 * Gerencia todas as operações relacionadas a organizações
 */

class OrganizationsModule {
    constructor() {
        this.organizations = [];
        this.currentOrganization = null;
        this.isEditMode = false;
        this.filters = {
            search: '',
            status: ''
        };
        
        this.init();
    }

    async init() {
        console.log('🏢 Inicializando módulo de Organizações...');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar organizações
        await this.loadOrganizations();
        
        console.log('✅ Módulo de Organizações inicializado');
    }

    setupEventListeners() {
        // Botão adicionar organização
        document.getElementById('add-organization-btn')?.addEventListener('click', () => {
            this.openOrganizationModal();
        });

        // Busca em tempo real
        document.getElementById('organization-search')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.filterOrganizations();
        });

        // Filtro por status
        document.getElementById('status-filter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.filterOrganizations();
        });

        // Limpar filtros
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Form submission
        document.getElementById('organization-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrganization();
        });

        // Auto-generate slug from name
        document.getElementById('org-name')?.addEventListener('input', (e) => {
            const slug = this.generateSlug(e.target.value);
            document.getElementById('org-slug').value = slug;
        });
    }

    async loadOrganizations() {
        this.showLoading('Carregando organizações...');
        
        try {
            const response = await fetch('/api/organizations');
            const data = await response.json();
            
            if (data.success) {
                this.organizations = data.data || [];
                this.renderOrganizations();
            } else {
                throw new Error(data.message || 'Erro ao carregar organizações');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar organizações:', error);
            this.showError('Erro ao carregar organizações: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderOrganizations() {
        const container = document.getElementById('organizations-container');
        const tableContainer = document.getElementById('organizations-table');
        const emptyState = document.getElementById('empty-organizations');
        const tbody = document.getElementById('organizations-tbody');

        if (!container || !tbody) return;

        if (this.organizations.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tableContainer.style.display = 'block';

        tbody.innerHTML = this.organizations.map(org => this.renderOrganizationRow(org)).join('');
    }

    renderOrganizationRow(org) {
        const createdDate = new Date(org.createdAt).toLocaleDateString('pt-BR');
        const statusClass = org.isActive ? 'status-active' : 'status-inactive';
        const statusText = org.isActive ? 'Ativo' : 'Inativo';

        return `
            <tr data-id="${org.id}">
                <td>
                    <div class="org-info">
                        <strong>${this.escapeHtml(org.name)}</strong>
                        ${org.description ? `<br><small class="text-muted">${this.escapeHtml(org.description)}</small>` : ''}
                    </div>
                </td>
                <td><code>${this.escapeHtml(org.slug)}</code></td>
                <td>${org.email ? this.escapeHtml(org.email) : '-'}</td>
                <td>${org.phone ? this.escapeHtml(org.phone) : '-'}</td>
                <td>${org.city ? this.escapeHtml(org.city) : '-'}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>${createdDate}</td>
                <td class="actions-column">
                    <div class="btn-group">
                        <button class="btn btn-small btn-primary" onclick="organizationsModule.editOrganization('${org.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-small btn-danger" onclick="organizationsModule.deleteOrganization('${org.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    filterOrganizations() {
        let filtered = [...this.organizations];

        // Filtro de busca
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(org => 
                org.name.toLowerCase().includes(searchTerm) ||
                org.slug.toLowerCase().includes(searchTerm) ||
                (org.email && org.email.toLowerCase().includes(searchTerm)) ||
                (org.city && org.city.toLowerCase().includes(searchTerm))
            );
        }

        // Filtro de status
        if (this.filters.status) {
            const isActive = this.filters.status === 'active';
            filtered = filtered.filter(org => org.isActive === isActive);
        }

        // Renderizar apenas os filtrados
        const tbody = document.getElementById('organizations-tbody');
        if (tbody) {
            tbody.innerHTML = filtered.map(org => this.renderOrganizationRow(org)).join('');
        }

        // Mostrar/ocultar estados
        const tableContainer = document.getElementById('organizations-table');
        const emptyState = document.getElementById('empty-organizations');
        
        if (filtered.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <h3>Nenhuma organização encontrada</h3>
                <p>Tente ajustar os filtros de busca</p>
            `;
        } else {
            emptyState.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }

    clearFilters() {
        this.filters = { search: '', status: '' };
        
        // Limpar inputs
        document.getElementById('organization-search').value = '';
        document.getElementById('status-filter').value = '';
        
        // Re-renderizar
        this.renderOrganizations();
    }

    openOrganizationModal(organizationId = null) {
        this.isEditMode = !!organizationId;
        this.currentOrganization = organizationId;
        
        const modal = document.getElementById('organization-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('organization-form');
        
        if (!modal || !title || !form) return;

        // Configurar título
        title.textContent = this.isEditMode ? 'Editar Organização' : 'Nova Organização';
        
        // Limpar formulário
        form.reset();
        
        // Se for edição, carregar dados
        if (this.isEditMode && organizationId) {
            const org = this.organizations.find(o => o.id === organizationId);
            if (org) {
                this.populateForm(org);
            }
        }
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Focar no primeiro campo
        setTimeout(() => {
            document.getElementById('org-name')?.focus();
        }, 100);
    }

    closeOrganizationModal() {
        const modal = document.getElementById('organization-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        this.currentOrganization = null;
        this.isEditMode = false;
    }

    populateForm(org) {
        const fields = {
            'org-name': org.name,
            'org-slug': org.slug,
            'org-description': org.description,
            'org-email': org.email,
            'org-phone': org.phone,
            'org-website': org.website,
            'org-address': org.address,
            'org-city': org.city,
            'org-state': org.state,
            'org-zipcode': org.zipCode,
            'org-country': org.country,
            'org-max-students': org.maxStudents,
            'org-max-staff': org.maxStaff
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value !== null && value !== undefined) {
                field.value = value;
            }
        });

        // Checkbox
        const activeCheckbox = document.getElementById('org-active');
        if (activeCheckbox) {
            activeCheckbox.checked = org.isActive;
        }
    }

    async saveOrganization() {
        const form = document.getElementById('organization-form');
        if (!form) return;

        // Coletar dados do formulário
        const formData = new FormData(form);
        const organizationData = {
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description') || null,
            email: formData.get('email') || null,
            phone: formData.get('phone') || null,
            website: formData.get('website') || null,
            address: formData.get('address') || null,
            city: formData.get('city') || null,
            state: formData.get('state') || null,
            zipCode: formData.get('zipCode') || null,
            country: formData.get('country') || 'Brazil',
            maxStudents: parseInt(formData.get('maxStudents')) || 100,
            maxStaff: parseInt(formData.get('maxStaff')) || 10,
            isActive: formData.has('isActive')
        };

        // Validação básica
        if (!organizationData.name || !organizationData.slug) {
            this.showError('Nome e slug são obrigatórios');
            return;
        }

        this.showLoading(this.isEditMode ? 'Atualizando organização...' : 'Criando organização...');

        try {
            const url = this.isEditMode 
                ? `/api/organizations/${this.currentOrganization}`
                : '/api/organizations';
                
            const method = this.isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(organizationData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(
                    this.isEditMode 
                        ? 'Organização atualizada com sucesso!' 
                        : 'Organização criada com sucesso!'
                );
                
                this.closeOrganizationModal();
                await this.loadOrganizations();
            } else {
                throw new Error(data.message || 'Erro ao salvar organização');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar organização:', error);
            this.showError('Erro ao salvar: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    editOrganization(organizationId) {
        this.openOrganizationModal(organizationId);
    }

    async deleteOrganization(organizationId) {
        const org = this.organizations.find(o => o.id === organizationId);
        if (!org) return;

        const confirmed = confirm(
            `Tem certeza que deseja excluir a organização "${org.name}"?\n\n` +
            'Esta ação não pode ser desfeita e pode afetar dados relacionados.'
        );

        if (!confirmed) return;

        this.showLoading('Excluindo organização...');

        try {
            const response = await fetch(`/api/organizations/${organizationId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Organização excluída com sucesso!');
                await this.loadOrganizations();
            } else {
                throw new Error(data.message || 'Erro ao excluir organização');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir organização:', error);
            this.showError('Erro ao excluir: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '-') // Substitui espaços por hífen
            .replace(/-+/g, '-') // Remove hífens duplicados
            .trim('-'); // Remove hífens das extremidades
    }

    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loading-overlay');
        const messageElement = document.getElementById('loading-message');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Adicionar estilos inline
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Remover após 4 segundos
        setTimeout(() => {

            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Função para fechar modal (chamada pelo HTML)
function closeOrganizationModal() {
    if (window.organizationsModule) {
        window.organizationsModule.closeOrganizationModal();
    }
}

// Inicializador global para integração com ModuleLoader
window.initializeOrganizationsModule = function() {
    if (!window.organizationsModule) {
        window.organizationsModule = new OrganizationsModule();
    }
};

// Inicializador para tela de edição (full-screen)
window.initializeOrganizationEditor = function() {
    if (!window.organizationEditor) {
        window.organizationEditor = new OrganizationsModule();
        // Pode customizar para modo editor se necessário
    }
};

console.log('📦 Organizations Module carregado e pronto');

// Adicionar estilos CSS para as notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);
