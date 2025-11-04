/**
 * Instructor Editor
 * Following Activities module pattern (GOLD STANDARD)
 */

const InstructorEditor = {
    // Editor properties
    moduleAPI: null,
    instructorId: null,
    instructor: null,
    form: null,
    initialized: false,

    /**
     * Initialize the editor (Activities pattern)
     */
    async initialize() {
        try {
            console.log('🔧 Initializing Instructor Editor...');
            
            // Initialize API client
            await this.initializeAPI();
            
            // Get instructor ID from URL
            this.instructorId = this.getInstructorIdFromURL();
            
            // Find form elements
            this.findElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load instructor data if editing
            if (this.instructorId) {
                await this.loadInstructor(this.instructorId);
                this.updateUIForEdit();
            } else {
                this.updateUIForNew();
                this.showForm();
            }
            
            this.initialized = true;
            console.log('✅ Instructor Editor initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Instructor Editor:', error);
            if (window.app && typeof window.app.handleError === 'function') {
                window.app.handleError(error, { module: 'instructors', context: 'editor-initialization' });
            }
            this.showError('Não foi possível inicializar o editor de instrutor.');
        }
    },

    /**
     * Initialize API client (Activities pattern)
     */
    async initializeAPI() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                this.moduleAPI = window.createModuleAPI('Instructors');
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.createModuleAPI) {
                        this.moduleAPI = window.createModuleAPI('Instructors');
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    },

    /**
     * Get instructor ID from URL parameters
     */
    getInstructorIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    },

    /**
     * Find DOM elements
     */
    findElements() {
        this.form = document.getElementById('instructor-form');
        this.loadingElement = document.getElementById('loading-state');
        this.errorElement = document.getElementById('error-state');
        this.successElement = document.getElementById('success-state');
        this.formContainer = document.getElementById('form-container');
    },

    /**
     * Setup event listeners (Activities pattern)
     */
    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Input formatting
        this.setupInputFormatting();
    },

    /**
     * Setup input formatting (Activities pattern)
     */
    setupInputFormatting() {
        // CPF formatting
        const documentInput = document.getElementById('document');
        if (documentInput) {
            documentInput.addEventListener('input', (e) => {
                if (window.formatCPF) {
                    e.target.value = window.formatCPF(e.target.value);
                }
            });
        }

        // Phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                if (window.formatPhone) {
                    e.target.value = window.formatPhone(e.target.value);
                }
            });
        }
    },

    /**
     * Load instructor data (Activities pattern)
     */
    async loadInstructor(id) {
        try {
            this.showLoading();
            
            await this.moduleAPI.fetchWithStates(`/api/instructors/${id}`, {
                loadingElement: this.loadingElement,
                onSuccess: (response) => {
                    if (response.success && response.data) {
                        this.instructor = response.data;
                        this.populateForm(response.data);
                        this.showForm();
                    } else {
                        throw new Error('Instrutor não encontrado');
                    }
                },
                onError: (error) => {
                    this.showError(`Erro ao carregar instrutor: ${error.message}`);
                }
            });
        } catch (error) {
            this.showError(`Não foi possível carregar os dados do instrutor: ${error.message}`);
        }
    },

    /**
     * Populate form with instructor data (Activities pattern)
     */
    populateForm(data) {
        if (!this.form) return;

        // Basic information
        this.setFieldValue('name', data.name);
        this.setFieldValue('email', data.email);
        this.setFieldValue('phone', data.phone);
        this.setFieldValue('document', data.document);
        this.setFieldValue('birthDate', data.birthDate ? data.birthDate.split('T')[0] : '');
        this.setFieldValue('status', data.status || 'ACTIVE');

        // Professional information
        this.setFieldValue('belt', data.belt);
        this.setFieldValue('specialties', data.specialties);
        this.setFieldValue('experience', data.experience);
        this.setFieldValue('certifications', data.certifications);
        this.setFieldValue('bio', data.bio);

        // Employment information
        this.setFieldValue('hireDate', data.hireDate ? data.hireDate.split('T')[0] : '');
        this.setFieldValue('salary', data.salary);
        this.setFieldValue('workload', data.workload);
        this.setCheckboxValue('canManageStudents', data.canManageStudents);
        this.setCheckboxValue('canManageClasses', data.canManageClasses);
    },

    /**
     * Set form field value
     */
    setFieldValue(fieldName, value) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field && value !== null && value !== undefined) {
            field.value = value;
        }
    },

    /**
     * Set checkbox value
     */
    setCheckboxValue(fieldName, value) {
        const checkbox = this.form.querySelector(`[name="${fieldName}"]`);
        if (checkbox) {
            checkbox.checked = !!value;
        }
    },

    /**
     * Handle form submission (Activities pattern)
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            this.showLoading();
            this.clearErrors();
            
            // Get form data
            const formData = new FormData(this.form);
            const instructorData = this.prepareFormData(formData);
            
            // Validate data
            if (!this.validateForm(instructorData)) {
                this.showForm();
                return;
            }
            
            // Determine if creating or updating
            const method = this.instructorId ? 'PUT' : 'POST';
            const endpoint = this.instructorId ? `/api/instructors/${this.instructorId}` : '/api/instructors';
            
            // Send to API
            const response = await this.moduleAPI.request(endpoint, {
                method,
                body: JSON.stringify(instructorData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.success) {
                this.showSuccess();
                
                // Redirect after delay
                setTimeout(() => {
                    this.navigateToList();
                }, 2000);
            } else {
                throw new Error(response.error || 'Erro ao salvar instrutor');
            }
            
        } catch (error) {
            console.error('Error saving instructor:', error);
            this.showError(`Erro ao salvar instrutor: ${error.message}`);
        }
    },

    /**
     * Prepare form data for API (Activities pattern)
     */
    prepareFormData(formData) {
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Handle checkboxes (they don't appear in FormData if unchecked)
        data.canManageStudents = this.form.querySelector('[name="canManageStudents"]').checked;
        data.canManageClasses = this.form.querySelector('[name="canManageClasses"]').checked;
        
        // Convert numeric fields
        if (data.experience) data.experience = parseInt(data.experience);
        if (data.salary) data.salary = parseFloat(data.salary);
        if (data.workload) data.workload = parseInt(data.workload);
        
        // Remove formatting from document
        if (data.document) {
            data.document = data.document.replace(/\D/g, '');
        }
        
        return data;
    },

    /**
     * Validate form data
     */
    validateForm(data) {
        let isValid = true;
        
        // Required fields
        if (!data.name || data.name.trim() === '') {
            this.showFieldError('name', 'Nome é obrigatório');
            isValid = false;
        }
        
        if (!data.email || data.email.trim() === '') {
            this.showFieldError('email', 'Email é obrigatório');
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            this.showFieldError('email', 'Email inválido');
            isValid = false;
        }
        
        // Document validation
        if (data.document && data.document.length > 0 && data.document.length !== 11) {
            this.showFieldError('document', 'CPF deve ter 11 dígitos');
            isValid = false;
        }
        
        return isValid;
    },

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },

    /**
     * Clear all errors
     */
    clearErrors() {
        const errorElements = this.form.querySelectorAll('.field-error');
        errorElements.forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Handle cancel button
     */
    handleCancel() {
        if (confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) {
            this.navigateToList();
        }
    },

    /**
     * Handle delete button
     */
    async handleDelete() {
        if (!this.instructorId) return;
        
        if (confirm('Tem certeza que deseja excluir este instrutor? Esta ação não pode ser desfeita.')) {
            try {
                this.showLoading();
                
                const response = await this.moduleAPI.request(`/api/instructors/${this.instructorId}`, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    this.showSuccess('Instrutor excluído com sucesso!');
                    
                    // Redirect after delay
                    setTimeout(() => {
                        this.navigateToList();
                    }, 2000);
                } else {
                    throw new Error(response.error || 'Erro ao excluir instrutor');
                }
            } catch (error) {
                this.showError(`Erro ao excluir instrutor: ${error.message}`);
            }
        }
    },

    /**
     * Update UI for edit mode
     */
    updateUIForEdit() {
        document.getElementById('page-title').textContent = 'Editar Instrutor';
        document.getElementById('editor-title').textContent = 'Editar Instrutor';
        document.getElementById('save-text').textContent = 'Atualizar Instrutor';
        document.getElementById('delete-btn').style.display = 'flex';
    },

    /**
     * Update UI for new mode
     */
    updateUIForNew() {
        document.getElementById('page-title').textContent = 'Novo Instrutor';
        document.getElementById('editor-title').textContent = 'Novo Instrutor';
        document.getElementById('save-text').textContent = 'Salvar Instrutor';
        document.getElementById('delete-btn').style.display = 'none';
    },

    /**
     * Navigate back to list
     */
    navigateToList() {
        if (window.navigateTo) {
            window.navigateTo('/instructors');
        } else {
            window.location.href = '#/instructors';
        }
    },

    /**
     * UI State Management (Activities pattern)
     */
    hideAllStates() {
        if (this.loadingElement) this.loadingElement.style.display = 'none';
        if (this.errorElement) this.errorElement.style.display = 'none';
        if (this.successElement) this.successElement.style.display = 'none';
        if (this.formContainer) this.formContainer.style.display = 'none';
    },

    showLoading() {
        this.hideAllStates();
        if (this.loadingElement) this.loadingElement.style.display = 'flex';
    },

    showForm() {
        this.hideAllStates();
        if (this.formContainer) this.formContainer.style.display = 'block';
    },

    showError(message) {
        this.hideAllStates();
        if (this.errorElement) {
            const errorMessage = this.errorElement.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            this.errorElement.style.display = 'flex';
        }
    },

    showSuccess(message = 'Instrutor salvo com sucesso!') {
        this.hideAllStates();
        if (this.successElement) {
            const successMessage = this.successElement.querySelector('.success-message');
            if (successMessage) {
                successMessage.textContent = message;
            }
            this.successElement.style.display = 'flex';
        }
    }
};

// Export for global access (Activities pattern)
window.instructorEditor = InstructorEditor;