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
     * Navigate to editor - CORRECTED NAVIGATION
     */
    navigateToEditor(instructorId = null) {
        console.log('🔄 Navigating to editor:', instructorId ? `edit ${instructorId}` : 'create new');
        
        // Use the working instructor editor in public directory
        const baseUrl = window.location.origin;
        let editorUrl;
        
        if (instructorId) {
            editorUrl = `${baseUrl}/instructor-editor.html?id=${instructorId}&mode=edit`;
        } else {
            editorUrl = `${baseUrl}/instructor-editor.html?mode=create`;
        }
        
        console.log('🚀 Opening:', editorUrl);
        window.location.href = editorUrl;
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
