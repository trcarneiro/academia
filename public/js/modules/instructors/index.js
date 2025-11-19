/**
 * Instructors Module - SIMPLIFIED VERSION
 * Version: 2.1.1 (2025-11-13T04:21 - POST organizationId Debug)
 * Replaces complex multi-file architecture with single, maintainable file
 * Maintains exact same functionality and appearance as original
 * 
 * CHANGELOG v2.1.1:
 * - Added debug logging for organizationId in POST requests
 * - Verified organizationId is being added to data object
 * 
 * CHANGELOG v2.1.0:
 * - Added organizationId context to loadData() GET request
 * - Added organizationId context to handleFormSubmit() POST/PUT body
 * - Fixed 400 Bad Request "Organization context required" error
 */

// Prevent multiple declarations
if (typeof window.InstructorsModule !== 'undefined') {
    console.log('👨‍🏫 Instructors Module already loaded (v2.1.1), skipping...');
} else {

console.log('👨‍🏫 Instructors Module v2.1.1 - Starting (POST Debug)...');

const InstructorsModule = {
    // Module properties
    container: null,
    instructors: [],
    initialized: false,
    availableCourses: [],
    instructorCourses: [],
    currentInstructorId: null,

    /**
     * Initialize the module - SIMPLIFIED
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('👨‍🏫 Instructors Module v2.1.1 already initialized, skipping...');
                return this;
            }
            
            console.log('👨‍🏫 Instructors Module v2.1.1 - Initializing (POST Debug)...');
            
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
            
            // Get organization context
            const organizationId = window.currentOrganizationId || 
                                 localStorage.getItem('currentOrganizationId');
            
            if (!organizationId) {
                throw new Error('Organization context required');
            }
            
            const response = await fetch(`/api/instructors?organizationId=${organizationId}`);
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
     * Render single instructor row - ENHANCED WITH PROFESSIONAL FIELDS
     */
    renderInstructorRow(instructor) {
        const statusClass = instructor.isActive ? 'status-active' : 'status-inactive';
        const statusText = instructor.isActive ? 'Ativo' : 'Inativo';
        
        // Professional badges
        const specializations = instructor.specializations || [];
        const martialArts = instructor.martialArts || [];
        const hourlyRate = instructor.hourlyRate ? `R$ ${parseFloat(instructor.hourlyRate).toFixed(2)}/h` : null;

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
                            
                            <!-- Professional Badges -->
                            <div class="instructor-badges-container">
                                ${specializations.length > 0 ? `
                                    ${specializations.slice(0, 2).map(spec => 
                                        `<span class="badge badge-specialization">${spec}</span>`
                                    ).join('')}
                                    ${specializations.length > 2 ? `<span class="badge badge-count">+${specializations.length - 2}</span>` : ''}
                                ` : ''}
                                
                                ${martialArts.length > 0 ? `
                                    ${martialArts.slice(0, 2).map(art => 
                                        `<span class="badge badge-martial-art">🥋 ${art}</span>`
                                    ).join('')}
                                    ${martialArts.length > 2 ? `<span class="badge badge-count">+${martialArts.length - 2}</span>` : ''}
                                ` : ''}
                                
                                ${hourlyRate ? `<span class="badge badge-rate">💰 ${hourlyRate}</span>` : ''}
                            </div>
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
            // Store current instructor ID for course management
            this.currentInstructorId = instructorId;
            
            try {
                // Get organization context
                const organizationId = window.currentOrganizationId || 
                                     localStorage.getItem('currentOrganizationId');
                
                if (!organizationId) {
                    this.showError('Organization context required');
                    return;
                }
                
                const response = await fetch(`/api/instructors/${instructorId}?organizationId=${organizationId}`);
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
        } else {
            // Clear instructor ID for new instructor
            this.currentInstructorId = null;
            this.instructorCourses = [];
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

                    <!-- Professional Fields Section -->
                    <div class="form-section-header">
                        <h3>📋 Informações Profissionais</h3>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="specializations">Especializações</label>
                            <input type="text" id="specializations" name="specializations" 
                                   placeholder="Ex: Defesa Pessoal, Combate, Tático"
                                   value="${instructorData?.specializations?.join(', ') || ''}">
                            <small class="form-help">Separe múltiplas especializações por vírgula</small>
                        </div>
                        <div class="form-group">
                            <label for="certifications">Certificações</label>
                            <input type="text" id="certifications" name="certifications" 
                                   placeholder="Ex: Instrutor Nível 3, First Aid"
                                   value="${instructorData?.certifications?.join(', ') || ''}">
                            <small class="form-help">Separe múltiplas certificações por vírgula</small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="martialArts">Artes Marciais</label>
                            <input type="text" id="martialArts" name="martialArts" 
                                   placeholder="Ex: Krav Maga, Muay Thai, BJJ"
                                   value="${instructorData?.martialArts?.join(', ') || ''}">
                            <small class="form-help">Separe múltiplas artes marciais por vírgula</small>
                        </div>
                        <div class="form-group">
                            <label for="experience">Tempo de Experiência</label>
                            <input type="text" id="experience" name="experience" 
                                   placeholder="Ex: 10 anos ensinando Krav Maga"
                                   value="${instructorData?.experience || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="maxStudentsPerClass">Máximo de Alunos por Aula</label>
                            <input type="number" id="maxStudentsPerClass" name="maxStudentsPerClass" 
                                   min="1" max="50" value="${instructorData?.maxStudentsPerClass || 20}">
                            <small class="form-help">Padrão: 20 alunos</small>
                        </div>
                        <div class="form-group">
                            <label for="hourlyRate">Valor por Hora (R$)</label>
                            <input type="number" id="hourlyRate" name="hourlyRate" 
                                   step="0.01" min="0" placeholder="150.00"
                                   value="${instructorData?.hourlyRate || ''}">
                            <small class="form-help">Valor para aulas particulares</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="preferredUnits">Unidades Preferidas</label>
                        <input type="text" id="preferredUnits" name="preferredUnits" 
                               placeholder="Ex: Unidade Centro, Unidade Zona Sul"
                               value="${instructorData?.preferredUnits?.join(', ') || ''}">
                        <small class="form-help">Separe múltiplas unidades por vírgula</small>
                    </div>

                    <!-- Courses Section -->
                    <div class="form-section-header">
                        <h3>🎓 Cursos Certificados</h3>
                    </div>

                    <div id="instructor-courses-section" class="courses-section">
                        <div class="courses-selector">
                            <select id="course-select" class="form-select">
                                <option value="">Selecione um curso...</option>
                            </select>
                            <button type="button" class="btn btn-secondary" onclick="window.instructorsModule.addCourse()">
                                <i class="fas fa-plus"></i> Adicionar Curso
                            </button>
                        </div>
                        <div id="selected-courses-list" class="selected-courses-list">
                            <!-- Courses will be rendered here -->
                        </div>
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
        
        // Load courses data
        await this.loadAvailableCourses();
        
        // If editing, load instructor's courses
        if (instructorId) {
            await this.loadInstructorCourses(instructorId);
        } else {
            // For new instructor, show empty state
            this.renderSelectedCourses();
        }
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

        // Get organization context
        const organizationId = window.currentOrganizationId || 
                             localStorage.getItem('currentOrganizationId');
        
        console.log('🔍 [DEBUG] organizationId retrieval:', {
            fromWindow: window.currentOrganizationId,
            fromLocalStorage: localStorage.getItem('currentOrganizationId'),
            final: organizationId
        });
        
        if (!organizationId) {
            this.showError('Organization context required');
            return;
        }

        // Prepare data in correct API format
        const data = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
            email: formData.get('email'),
            phone: formData.get('phone'),
            document: formData.get('cpf'), // API expects 'document', not 'cpf'
            birthDate: formData.get('birthDate') || null,
            bio: formData.get('bio'),
            isActive: formData.get('status') === 'ACTIVE', // Convert string to boolean
            organizationId: organizationId, // Add organization context
            
            // Professional fields (arrays from comma-separated strings)
            specializations: this.parseArrayField(formData.get('specializations')),
            certifications: this.parseArrayField(formData.get('certifications')),
            martialArts: this.parseArrayField(formData.get('martialArts')),
            preferredUnits: this.parseArrayField(formData.get('preferredUnits')),
            
            // Professional fields (simple values)
            experience: formData.get('experience') || null,
            maxStudentsPerClass: parseInt(formData.get('maxStudentsPerClass')) || 20,
            hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate')) : null
        };

        console.log('=== FRONTEND DEBUG ===');
        console.log('Instructor ID:', instructorId);
        console.log('Is Edit:', isEdit);
        console.log('Form Data:', data);
        console.log('🔍 [DEBUG] organizationId in data object:', data.organizationId);

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
                const result = await response.json();
                const message = isEdit ? 'Instrutor atualizado com sucesso!' : 'Instrutor criado com sucesso!';
                
                this.showSuccess(message);
                
                // If creating new instructor, stay on form to allow course assignment
                if (!isEdit && result.data?.id) {
                    this.currentInstructorId = result.data.id;
                    
                    // Update form to show it's now in edit mode
                    const submitBtn = document.querySelector('#instructor-form button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.textContent = 'Atualizar Instrutor';
                    }
                    
                    // Add delete button
                    const formActions = document.querySelector('.form-actions');
                    if (formActions && !formActions.querySelector('.btn-danger')) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.type = 'button';
                        deleteBtn.className = 'btn btn-danger';
                        deleteBtn.onclick = () => this.confirmDelete(result.data.id);
                        deleteBtn.innerHTML = '🗑️ Excluir';
                        formActions.appendChild(deleteBtn);
                    }
                    
                    // Load available courses so user can assign
                    await this.loadAvailableCourses();
                    
                    // Show success message with instruction
                    this.showSuccess('Instrutor criado! Agora você pode adicionar cursos certificados.');
                } else {
                    // For updates, return to list
                    await this.loadData();
                    this.showList();
                }
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
     * Parse comma-separated string into array
     */
    parseArrayField(value) {
        if (!value || typeof value !== 'string') return [];
        return value
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
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
    },

    /**
     * Load available courses for selection
     */
    async loadAvailableCourses() {
        try {
            const organizationId = window.currentOrganizationId || 
                                 localStorage.getItem('currentOrganizationId');
            
            if (!organizationId) {
                console.error('Organization context required');
                return;
            }
            
            const response = await fetch(`/api/courses?organizationId=${organizationId}`);
            const data = await response.json();
            
            if (data.success) {
                this.availableCourses = data.data || [];
                this.renderCourseSelector();
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    },

    /**
     * Load instructor's assigned courses
     */
    async loadInstructorCourses(instructorId) {
        if (!instructorId) return;
        
        try {
            const organizationId = window.currentOrganizationId || 
                                 localStorage.getItem('currentOrganizationId');
            
            if (!organizationId) {
                console.error('Organization context required');
                return;
            }
            
            const response = await fetch(`/api/instructors/${instructorId}/courses?organizationId=${organizationId}`);
            const data = await response.json();
            
            if (data.success) {
                this.instructorCourses = data.data || [];
                this.renderSelectedCourses();
            }
        } catch (error) {
            console.error('Error loading instructor courses:', error);
            this.instructorCourses = [];
            this.renderSelectedCourses();
        }
    },

    /**
     * Render course selector dropdown
     */
    renderCourseSelector() {
        const select = document.getElementById('course-select');
        if (!select) return;
        
        // Filter out already assigned courses
        const assignedCourseIds = this.instructorCourses.map(ic => ic.courseId);
        const availableForSelection = this.availableCourses.filter(
            course => !assignedCourseIds.includes(course.id) && course.isActive
        );
        
        select.innerHTML = '<option value="">Selecione um curso...</option>' +
            availableForSelection.map(course => 
                `<option value="${course.id}">${course.name} (${course.level})</option>`
            ).join('');
    },

    /**
     * Render selected courses list
     */
    renderSelectedCourses() {
        const container = document.getElementById('selected-courses-list');
        if (!container) return;
        
        if (this.instructorCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-courses-state">
                    <p>Nenhum curso atribuído ainda</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.instructorCourses.map(ic => {
            const course = ic.course;
            const isLead = ic.isLead ? '<span class="badge-lead">⭐ Principal</span>' : '';
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-card-header">
                        <div class="course-info">
                            <h4>${course.name}</h4>
                            <span class="course-level">${course.level}</span>
                            ${isLead}
                        </div>
                        <button type="button" class="btn-icon delete-btn" 
                                onclick="window.instructorsModule.removeCourse('${course.id}')" 
                                title="Remover curso">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
                    <div class="course-meta">
                        <small>Certificado em: ${new Date(ic.certifiedAt).toLocaleDateString('pt-BR')}</small>
                        ${ic.expiresAt ? `<small>Expira em: ${new Date(ic.expiresAt).toLocaleDateString('pt-BR')}</small>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Add course to instructor
     */
    async addCourse() {
        const select = document.getElementById('course-select');
        const courseId = select?.value;
        
        if (!courseId) {
            alert('Por favor, selecione um curso');
            return;
        }
        
        if (!this.currentInstructorId) {
            alert('Salve o instrutor primeiro antes de adicionar cursos');
            return;
        }
        
        try {
            const organizationId = window.currentOrganizationId || 
                                 localStorage.getItem('currentOrganizationId');
            
            const response = await fetch(`/api/instructors/${this.currentInstructorId}/courses?organizationId=${organizationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    isLead: false,
                    certifiedAt: new Date().toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Curso adicionado com sucesso!');
                await this.loadInstructorCourses(this.currentInstructorId);
                this.renderCourseSelector(); // Update dropdown
            } else {
                this.showError(data.error || 'Erro ao adicionar curso');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            this.showError('Erro ao adicionar curso');
        }
    },

    /**
     * Remove course from instructor
     */
    async removeCourse(courseId) {
        if (!confirm('Tem certeza que deseja remover este curso?')) {
            return;
        }
        
        if (!this.currentInstructorId) return;
        
        try {
            const organizationId = window.currentOrganizationId || 
                                 localStorage.getItem('currentOrganizationId');
            
            const response = await fetch(
                `/api/instructors/${this.currentInstructorId}/courses/${courseId}?organizationId=${organizationId}`,
                { method: 'DELETE' }
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Curso removido com sucesso!');
                await this.loadInstructorCourses(this.currentInstructorId);
                this.renderCourseSelector(); // Update dropdown
            } else {
                this.showError(data.error || 'Erro ao remover curso');
            }
        } catch (error) {
            console.error('Error removing course:', error);
            this.showError('Erro ao remover curso');
        }
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
