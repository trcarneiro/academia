/**
 * Instructors Module - SIMPLIFIED VERSION
 * Replaces complex multi-file architecture with single, maintainable file
 * Maintains exact same functionality and appearance as original
 */

// Prevent multiple declarations
if (typeof window.InstructorsModule !== 'undefined') {
    console.log('👨‍🏫 Instructors Module already loaded, skipping...');
} else {

const InstructorsModule = {
    // Module properties
    container: null,
    instructors: [],
    initialized: false,

    /**
     * Initialize the module - SIMPLIFIED
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('👨‍🏫 Instructors Module already initialized, skipping...');
                return this;
            }
            
            console.log('👨‍🏫 Instructors Module - Starting (Simplified)...');
            
            if (!this.container) {
                throw new Error('Container not set before initialization');
            }
            
            // Load data and render in one go
            await this.loadData();
            this.render();
            this.setupEvents();
            
            // Register module globally for compatibility
            window.instructorsModule = this;
            window.instructorsController = this; // Compatibility with existing code
            
            // Dispatch module loaded event
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'instructors' });
            }
            
            this.initialized = true;
            console.log('✅ Instructors Module - Loaded (Simplified)');
            
        } catch (error) {
            console.error('❌ Error initializing Instructors Module:', error);
            if (window.app && typeof window.app.handleError === 'function') {
                window.app.handleError(error, { module: 'instructors', context: 'module-initialization' });
            }
            this.renderError(error.message);
        }
    },

    /**
     * Load instructors data from API
     */
    async loadData() {
        try {
            console.log('📡 Loading instructors data...');
            
            const response = await fetch('/api/instructors');
            const data = await response.json();
            
            if (data.success) {
                this.instructors = data.data || [];
                console.log(`📊 Loaded ${this.instructors.length} instructors`);
            } else {
                throw new Error(data.error || 'Failed to load instructors');
            }
        } catch (error) {
            console.error('❌ Error loading instructors:', error);
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
        const existing = document.querySelector('.instructor-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `instructor-notification notification-${type}`;
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
     * Render the instructors interface - EXACT SAME VISUAL AS ORIGINAL
     */
    render() {
        if (!this.container) return;

        const totalInstructors = this.instructors.length;
        const activeInstructors = this.instructors.filter(i => i.isActive !== false).length;

        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb-premium">
                    <span class="breadcrumb-item active">Instrutores</span>
                </div>
                <h1>👨‍🏫 Instrutores</h1>
                <div class="header-actions">
                    <button id="add-instructor-btn" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Novo Instrutor
                    </button>
                </div>
            </div>

            <!-- Stats Cards - EXACT SAME AS ORIGINAL -->
            <div class="stats-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${totalInstructors}</div>
                        <div class="stat-label">Total de Instrutores</div>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${activeInstructors}</div>
                        <div class="stat-label">Instrutores Ativos</div>
                    </div>
                </div>
            </div>

            <!-- Filters - EXACT SAME AS ORIGINAL -->
            <div class="module-filters-premium">
                <div class="filter-group">
                    <div class="search-input-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="instructor-search" placeholder="Buscar instrutores..." class="search-input">
                    </div>
                </div>
            </div>

            <!-- Data Table - EXACT SAME AS ORIGINAL -->
            <div class="data-card-premium">
                ${this.renderInstructorsTable()}
            </div>
        `;
    },

    /**
     * Render instructors table - EXACT SAME AS ORIGINAL
     */
    renderInstructorsTable() {
        if (this.instructors.length === 0) {
            return `
                <div class="empty-state-premium">
                    <div class="empty-icon-premium">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h3>Nenhum instrutor encontrado</h3>
                    <p>Não há instrutores cadastrados no sistema.</p>
                    <button id="add-first-instructor" class="btn-primary">
                        <i class="fas fa-plus"></i>
                        Adicionar Primeiro Instrutor
                    </button>
                </div>
            `;
        }

        return `
            <div class="table-header-premium">
                <h3>Lista de Instrutores</h3>
            </div>
            <div class="table-container-premium">
                <table class="data-table-premium">
                    <thead>
                        <tr>
                            <th>Instrutor</th>
                            <th>Contato</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.instructors.map(instructor => this.renderInstructorRow(instructor)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render single instructor row - EXACT SAME AS ORIGINAL
     */
    renderInstructorRow(instructor) {
        const statusClass = instructor.isActive ? 'status-active' : 'status-inactive';
        const statusText = instructor.isActive ? 'Ativo' : 'Inativo';

        return `
            <tr class="data-row-premium" data-id="${instructor.id}">
                <td>
                    <div class="user-info-premium">
                        <div class="user-avatar-premium">
                            <span>${instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I'}</span>
                        </div>
                        <div class="user-details-premium">
                            <span class="user-name-premium">${instructor.name || 'Nome não informado'}</span>
                            <span class="user-email-premium">${instructor.email || 'Email não informado'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <div>${instructor.phone || '-'}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="table-actions-premium">
                        <button class="btn-icon edit-btn" title="Editar" data-id="${instructor.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" title="Excluir" data-id="${instructor.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Render error state - EXACT SAME AS ORIGINAL
     */
    renderError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb-premium">
                    <span class="breadcrumb-item active">Instrutores</span>
                </div>
                <h1>👨‍🏫 Instrutores</h1>
            </div>
            <div class="error-state-premium">
                <div class="error-icon-premium">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar módulo</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">
                    Tentar Novamente
                </button>
            </div>
        `;
    },

    /**
     * Setup event listeners - SIMPLIFIED BUT SAME FUNCTIONALITY
     */
    setupEvents() {
        if (!this.container) return;

        // Add instructor button (header)
        const addBtn = this.container.querySelector('#add-instructor-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.navigateToEditor());
        }

        // Add first instructor button (empty state)
        const addFirstBtn = this.container.querySelector('#add-first-instructor');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => this.navigateToEditor());
        }

        // Search input
        const searchInput = this.container.querySelector('#instructor-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Edit buttons
        const editBtns = this.container.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instructorId = btn.dataset.id;
                this.navigateToEditor(instructorId);
            });
        });

        // Delete buttons
        const deleteBtns = this.container.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instructorId = btn.dataset.id;
                this.handleDelete(instructorId);
            });
        });

        // Row double click
        const rows = this.container.querySelectorAll('.data-row-premium');
        rows.forEach(row => {
            row.addEventListener('dblclick', () => {
                const instructorId = row.dataset.id;
                this.navigateToEditor(instructorId);
            });
        });
    },

    /**
     * Handle search functionality - EXACT SAME AS ORIGINAL
     */
    handleSearch(searchTerm) {
        const rows = this.container.querySelectorAll('.data-row-premium');
        rows.forEach(row => {
            const name = row.querySelector('.user-name-premium')?.textContent.toLowerCase() || '';
            const email = row.querySelector('.user-email-premium')?.textContent.toLowerCase() || '';
            const searchLower = searchTerm.toLowerCase();
            
            if (name.includes(searchLower) || email.includes(searchLower)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    },

    /**
     * Handle delete instructor - SIMPLIFIED BUT SAME RESULT
     */
    async handleDelete(instructorId) {
        const instructor = this.instructors.find(i => i.id === instructorId);
        const confirmMsg = `Tem certeza que deseja excluir o instrutor "${instructor?.name || 'Selecionado'}"?`;
        
        if (!confirm(confirmMsg)) return;

        try {
            console.log('🗑️ Deleting instructor:', instructorId);
            
            const response = await fetch(`/api/instructors/${instructorId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Instructor deleted successfully');
                
                // Remove from local array and re-render
                this.instructors = this.instructors.filter(i => i.id !== instructorId);
                this.render();
                this.setupEvents();
                
                // Show success message (if available)
                if (window.showSuccess) {
                    window.showSuccess('Instrutor excluído com sucesso!');
                }
                
            } else {
                throw new Error(result.error || 'Erro ao excluir instrutor');
            }
            
        } catch (error) {
            console.error('❌ Error deleting instructor:', error);
            
            if (window.showError) {
                window.showError('Erro ao excluir instrutor: ' + error.message);
            } else {
                alert('Erro ao excluir instrutor: ' + error.message);
            }
        }
    },

    /**
     * Navigate to editor - INTERNAL NAVIGATION (SPA Style)
     */
    async navigateToEditor(instructorId = null) {
        console.log('🔄 Navigating to editor internally:', instructorId ? `edit ${instructorId}` : 'create new');
        
        try {
            // Render editor within the container
            await this.renderEditor(instructorId);
        } catch (error) {
            console.error('❌ Erro ao abrir editor:', error);
            this.showError('Erro ao carregar editor de instrutor');
        }
    },

    /**
     * Render inline editor - NEW METHOD
     */
    async renderEditor(instructorId = null) {
        const isEdit = instructorId !== null;
        const title = isEdit ? 'Editar Instrutor' : 'Novo Instrutor';
        
        // Get instructor data if editing
        let instructorData = null;
        if (isEdit) {
            try {
                const response = await fetch(`/api/instructors/${instructorId}`);
                if (response.ok) {
                    const result = await response.json();
                    instructorData = result.data;
                    
                    // Extract firstName and lastName from user data
                    if (instructorData.user) {
                        instructorData.firstName = instructorData.user.firstName || '';
                        instructorData.lastName = instructorData.user.lastName || '';
                        instructorData.email = instructorData.user.email || '';
                        instructorData.phone = instructorData.user.phone || '';
                        instructorData.cpf = instructorData.user.cpf || '';
                        instructorData.birthDate = instructorData.user.birthDate || null;
                    }
                    
                    // Convert isActive boolean to status string
                    instructorData.status = instructorData.isActive ? 'ACTIVE' : 'INACTIVE';
                }
            } catch (error) {
                console.error('❌ Erro ao carregar instrutor:', error);
                this.showError('Erro ao carregar dados do instrutor');
                return;
            }
        }

        // Render editor form
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="breadcrumb">
                    <span class="breadcrumb-item" onclick="window.instructorsModule.showList()">👨‍🏫 Instrutores</span>
                    <span class="breadcrumb-separator">></span>
                    <span class="breadcrumb-item active">${title}</span>
                </div>
                <h1>${title}</h1>
            </div>

            <div class="instructor-editor-container">
                <form id="instructor-form" class="instructor-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">Nome *</label>
                            <input type="text" id="firstName" name="firstName" required 
                                   value="${instructorData?.firstName || ''}">
                        </div>
                        <div class="form-group">
                            <label for="lastName">Sobrenome *</label>
                            <input type="text" id="lastName" name="lastName" required 
                                   value="${instructorData?.lastName || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required 
                                   value="${instructorData?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Telefone</label>
                            <input type="tel" id="phone" name="phone" 
                                   value="${instructorData?.phone || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="cpf">CPF</label>
                            <input type="text" id="cpf" name="cpf" 
                                   value="${instructorData?.cpf || ''}">
                        </div>
                        <div class="form-group">
                            <label for="birthDate">Data de Nascimento</label>
                            <input type="date" id="birthDate" name="birthDate" 
                                   value="${instructorData?.birthDate ? new Date(instructorData.birthDate).toISOString().split('T')[0] : ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="bio">Biografia</label>
                        <textarea id="bio" name="bio" rows="4">${instructorData?.bio || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status">
                            <option value="ACTIVE" ${instructorData?.status === 'ACTIVE' ? 'selected' : ''}>Ativo</option>
                            <option value="INACTIVE" ${instructorData?.status === 'INACTIVE' ? 'selected' : ''}>Inativo</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.instructorsModule.showList()">
                            ← Voltar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Atualizar' : 'Criar'} Instrutor
                        </button>
                        ${isEdit ? `
                            <button type="button" class="btn btn-danger" onclick="window.instructorsModule.confirmDelete(${instructorId})">
                                🗑️ Excluir
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        `;

        // Setup form events
        this.setupEditorEvents(instructorId);
    },

    /**
     * Setup editor form events
     */
    setupEditorEvents(instructorId = null) {
        const form = document.getElementById('instructor-form');
        const isEdit = instructorId !== null;
        const self = this; // Preserve context

        // Format CPF and phone inputs
        const cpfInput = document.getElementById('cpf');
        const phoneInput = document.getElementById('phone');

        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                e.target.value = self.formatCPF(e.target.value);
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = self.formatPhone(e.target.value);
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await self.handleFormSubmit(instructorId);
        });
    },

    /**
     * Handle form submission
     */
    async handleFormSubmit(instructorId = null) {
        const form = document.getElementById('instructor-form');
        const formData = new FormData(form);
        const isEdit = instructorId !== null;

        // Prepare data in correct API format
        const data = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
            email: formData.get('email'),
            phone: formData.get('phone'),
            document: formData.get('cpf'), // API expects 'document', not 'cpf'
            birthDate: formData.get('birthDate') || null,
            bio: formData.get('bio'),
            isActive: formData.get('status') === 'ACTIVE' // Convert string to boolean
        };

        console.log('=== FRONTEND DEBUG ===');
        console.log('Instructor ID:', instructorId);
        console.log('Is Edit:', isEdit);
        console.log('Form Data:', data);

        try {
            const url = isEdit ? `/api/instructors/${instructorId}` : '/api/instructors';
            const method = isEdit ? 'PUT' : 'POST';

            console.log('Request URL:', url);
            console.log('Request Method:', method);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Response Status:', response.status);

            if (response.ok) {
                this.showSuccess(isEdit ? 'Instrutor atualizado com sucesso!' : 'Instrutor criado com sucesso!');
                await this.loadData();
                this.showList();
            } else {
                const error = await response.json();
                console.log('Error Response:', error);
                
                // Show detailed error message
                let errorMessage = 'Erro ao salvar instrutor';
                if (error.details) {
                    errorMessage += `: ${error.details}`;
                } else if (error.error) {
                    errorMessage = error.error;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                this.showError(errorMessage);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.showError(`Erro ao salvar instrutor: ${error.message || error}`);
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
     * Format CPF
     */
    formatCPF(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },

    /**
     * Format phone
     */
    formatPhone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4,5})(\d{4})/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    /**
     * Refresh/reload data - SAME AS ORIGINAL
     */
    async refresh() {
        try {
            await this.loadData();
            this.render();
            this.setupEvents();
        } catch (error) {
            this.renderError(error.message);
        }
    },

    /**
     * Compatibility methods for existing code
     */
    async loadList() {
        return this.refresh();
    },

    // Method aliases for compatibility with existing controller calls
    navigateToNewInstructor() {
        return this.navigateToEditor();
    },

    navigateToEditInstructor(id) {
        return this.navigateToEditor(id);
    },

    confirmDelete(id) {
        return this.handleDelete(id);
    }
};

// Make InstructorsModule available globally
window.InstructorsModule = InstructorsModule;

// Initialization function for compatibility
async function initInstructorsModule(container) {
    if (!container) {
        console.error('❌ Container is required for instructors module');
        return;
    }
    
    console.log('🔧 initInstructorsModule called...');
    
    // Set container and initialize
    InstructorsModule.container = container;
    await InstructorsModule.init();
    
    return InstructorsModule;
}

// Make init function available globally
window.initInstructorsModule = initInstructorsModule;

}

console.log('📦 Instructors Module (Simplified) loaded and ready');
