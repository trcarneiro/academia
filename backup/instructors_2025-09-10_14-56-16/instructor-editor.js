// Instructor Editor Module
(function() {
    'use strict';

    // State Management
    let currentInstructorId = null;
    let isEditMode = false;
    let instructorAPI = null;

    // Form Elements
    const elements = {
        form: document.getElementById('instructor-form'),
        saveBtn: document.getElementById('save-btn'),
        deleteBtn: document.getElementById('delete-btn'),
        pageTitle: document.getElementById('page-title'),
        breadcrumbAction: document.getElementById('breadcrumb-action'),
        loadingState: document.getElementById('loading-state'),
        errorState: document.getElementById('error-state'),
        errorMessage: document.getElementById('error-message'),
        successState: document.getElementById('success-state'),
        formContainer: document.getElementById('form-container')
    };

    // Initialize Module
    async function initialize() {
        console.log('🏃‍♂️ Initializing Instructor Editor...');
        
        try {
            await waitForAPIClient();
            // Use pluralized module name per AGENTS.md
            instructorAPI = window.createModuleAPI('Instructors');

            // Ensure editor form structure exists before wiring events
            ensureFormFields();
            refreshElementRefs();
            
            setupEventListeners();
            checkEditMode();
            
            console.log('✅ Instructor Editor initialized successfully');

            // Expose editor globally and dispatch module loaded (AGENTS.md)
            window.instructorsEditor = window.instructorsEditor || { resetForm };
            if (window.app && typeof window.app.dispatchEvent === 'function') {
                window.app.dispatchEvent('module:loaded', { name: 'instructors-editor' });
            }
        } catch (error) {
            console.error('❌ Error initializing Instructor Editor:', error);
            // Use the shared showError function from utils.js
            if (typeof showError === 'function') {
                showError('Erro ao inicializar editor: ' + error.message, 'instructor-editor');
            } else {
                console.error('showError function not available');
            }
        }
    }

    // Wait for API Client
    async function waitForAPIClient() {
        return new Promise((resolve) => {
            const checkAPIClient = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(checkAPIClient, 50);
                }
            };
            checkAPIClient();
        });
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Form submission
        elements.form.addEventListener('submit', handleFormSubmit);
        
        // Save button
        if (elements.saveBtn) {
            elements.saveBtn.addEventListener('click', handleSaveClick);
        }
        
        // Delete button
        if (elements.deleteBtn) {
            elements.deleteBtn.addEventListener('click', handleDeleteClick);
        }
        
        // Field validation on blur
        const fields = elements.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => clearFieldError(field));
        });

        // Special handlers
        setupSpecialHandlers();
    }

    // Setup Special Handlers
    function setupSpecialHandlers() {
        // CPF formatting
        const documentField = document.getElementById('cpf');
        if (documentField) {
            documentField.addEventListener('input', (e) => {
                e.target.value = formatCPF(e.target.value);
            });
        }

        // Phone formatting
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                e.target.value = formatPhone(e.target.value);
            });
        }
    }

        // Phone formatting
        const phoneField = document.getElementById('phone');
        if (phoneField) {
            phoneField.addEventListener('input', formatPhone);
        }

        // ZIP code formatting and lookup
        const zipCodeField = document.getElementById('zipCode');
        if (zipCodeField) {
            zipCodeField.addEventListener('input', formatZipCode);
            zipCodeField.addEventListener('blur', lookupAddress);
        }
    }

    // Check Edit Mode
    function checkEditMode() {
        const hash = window.location.hash;
        const editMatch = hash.match(/#instructor-editor\/(.+)/);
        
        if (editMatch) {
            currentInstructorId = editMatch[1];
            isEditMode = true;
            
            if (elements.pageTitle) {
                elements.pageTitle.textContent = 'Editar Instrutor';
            }
            if (elements.breadcrumbAction) {
                elements.breadcrumbAction.textContent = 'Editar Instrutor';
            }
            
            // Show delete button in edit mode
            if (elements.deleteBtn) {
                elements.deleteBtn.style.display = 'inline-block';
            }
            
            loadInstructorData();
        } else {
            // Hide delete button in create mode
            if (elements.deleteBtn) {
                elements.deleteBtn.style.display = 'none';
            }
        }
    }

    // Load Instructor Data
    async function loadInstructorData() {
        if (!currentInstructorId) return;

        showLoading(true);

        try {
            const response = await instructorAPI.fetchWithStates(`/api/instructors/${currentInstructorId}`, {
                loadingElement: elements.formContainer,
                onSuccess: (data) => {
                    populateForm(data);
                    showLoading(false);
                },
                onError: (error) => {
                    console.error('Error loading instructor:', error);
                    if (typeof showError === 'function') {
                        showError('Erro ao carregar dados do instrutor: ' + error.message, 'instructor-editor');
                    } else {
                        console.error('showError function not available');
                    }
                }
            });
        } catch (error) {
            console.error('Error loading instructor:', error);
            showError('Erro ao carregar dados do instrutor: ' + error.message);
        }
    }

    // Populate Form
    function populateForm(instructor) {
        console.log('📝 Populating form with instructor data:', instructor);
        
        const userData = instructor.user || instructor;
        
        // Basic Information
        setFieldValue('name', `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || instructor.name);
        setFieldValue('email', userData.email || instructor.email);
        setFieldValue('phone', userData.phone || instructor.phone);
        setFieldValue('document', userData.cpf || instructor.document);
        setFieldValue('birthDate', formatDateForInput(userData.birthDate || instructor.birthDate));
        setFieldValue('gender', userData.gender || instructor.gender);

        // Professional Information  (map specializations/martialArts to specialties UI)
        setFieldValue('belt', instructor.belt);
        const specialtiesJoined = Array.isArray(instructor.specialties) ? instructor.specialties.join(', ') :
            (Array.isArray(instructor.specializations) ? instructor.specializations.join(', ') :
            (Array.isArray(instructor.martialArts) ? instructor.martialArts.join(', ') : (instructor.specialties || instructor.specializations || '')));
        setFieldValue('specialties', specialtiesJoined);
        setFieldValue('experience', instructor.experience);
        setFieldValue('certifications', Array.isArray(instructor.certifications) ? instructor.certifications.join(', ') : instructor.certifications);
        setFieldValue('bio', instructor.bio);

        // Employment Information
        setFieldValue('status', instructor.status);
        setFieldValue('hireDate', formatDateForInput(instructor.hireDate));
        setFieldValue('salary', instructor.salary);
        setFieldValue('workload', instructor.workload);
        setFieldValue('canManageStudents', instructor.canManageStudents, 'checkbox');
        setFieldValue('canManageClasses', instructor.canManageClasses, 'checkbox');

        // Address Information
        if (instructor.address) {
            setFieldValue('zipCode', instructor.address.zipCode);
            setFieldValue('street', instructor.address.street);
            setFieldValue('number', instructor.address.number);
            setFieldValue('complement', instructor.address.complement);
            setFieldValue('neighborhood', instructor.address.neighborhood);
            setFieldValue('city', instructor.address.city);
            setFieldValue('state', instructor.address.state);
            setFieldValue('country', instructor.address.country);
        }
    }

    // Helper function to format date for input fields
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Error formatting date:', dateString, error);
            return '';
        }
    }

    // Set Field Value
    function setFieldValue(fieldId, value, type = 'text') {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.warn(`Field with ID '${fieldId}' not found`);
            return;
        }

        if (type === 'checkbox') {
            field.checked = Boolean(value);
        } else {
            field.value = value || '';
        }
    }

    // Handle Form Submit
    async function handleFormSubmit(event) {
        event.preventDefault();
        await saveInstructor();
    }

    // Handle Save Click
    async function handleSaveClick(event) {
        event.preventDefault();
        await saveInstructor();
    }

    // Handle Delete Click
    async function handleDeleteClick(event) {
        event.preventDefault();
        
        if (!currentInstructorId) {
            showError('ID do instrutor não encontrado');
            return;
        }

        // Confirm deletion
        const instructorName = document.getElementById('name')?.value || 'este instrutor';
        const confirmDelete = confirm(
            `Tem certeza que deseja excluir ${instructorName}?\n\n` +
            'Esta ação não pode ser desfeita e removerá:\n' +
            '• Todos os dados do instrutor\n' +
            '• Histórico de aulas ministradas\n' +
            '• Avaliações relacionadas\n\n' +
            'Digite "CONFIRMAR" para prosseguir:'
        );

        if (!confirmDelete) {
            return;
        }

        const confirmText = prompt('Digite "CONFIRMAR" para excluir definitivamente:');
        if (confirmText !== 'CONFIRMAR') {
            showError('Exclusão cancelada. Texto de confirmação incorreto.');
            return;
        }

        showLoading(true);

        try {
            const response = await instructorAPI.fetchWithStates(`/api/instructors/${currentInstructorId}`, {
                method: 'DELETE',
                loadingElement: elements.formContainer,
                onSuccess: () => {
                    showSuccess('Instrutor excluído com sucesso!');
                    setTimeout(() => {
                        window.router.navigateTo('instructors');
                    }, 1500);
                },
                onError: (error) => {
                    console.error('Error deleting instructor:', error);
                    showError('Erro ao excluir instrutor: ' + error.message);
                }
            });
        } catch (error) {
            console.error('Error deleting instructor:', error);
            showError('Erro ao excluir instrutor: ' + error.message);
        }
    }

    // Save Instructor
    async function saveInstructor() {
        if (!validateForm()) {
            return;
        }

        const formData = collectFormData();
        showLoading(true);

        try {
            if (isEditMode) {
                console.log('Updating instructor with data:', formData);
                await instructorAPI.fetchWithStates(`/api/instructors/${currentInstructorId}`, {
                    method: 'PUT',
                    body: formData,
                    loadingElement: elements.formContainer,
                    onSuccess: () => {
                        console.log('Instructor updated successfully');
                        showSuccess();
                    },
                    onError: (error) => {
                        console.error('Error updating instructor:', error);
                        showError('Erro ao atualizar instrutor: ' + (error?.message || 'Erro desconhecido'));
                    }
                });
            } else {
                console.log('Creating instructor with data:', formData);
                await instructorAPI.fetchWithStates('/api/instructors', {
                    method: 'POST',
                    body: formData,
                    loadingElement: elements.formContainer,
                    onSuccess: (data) => {
                        console.log('Instructor created successfully', data);
                        currentInstructorId = data?.id || currentInstructorId;
                        showSuccess();
                    },
                    onError: (error) => {
                        console.error('Error creating instructor:', error);
                        showError('Erro ao criar instrutor: ' + (error?.message || 'Erro desconhecido'));
                    }
                });
            }
        } catch (error) {
            console.error('Error saving instructor:', error);
            showError('Erro ao salvar instrutor: ' + error.message);
        }
    }

    // Collect Form Data
    function collectFormData() {
        const formData = {
            name: getFieldValue('name'),
            email: getFieldValue('email'),
            phone: getFieldValue('phone') || null,
            document: getFieldValue('document') || null,
            birthDate: getFieldValue('birthDate') || null,
            gender: getFieldValue('gender') || null,
            belt: getFieldValue('belt'),
            specialties: getFieldValue('specialties') || null,
            experience: parseInt(getFieldValue('experience')) || null,
            certifications: getFieldValue('certifications') || null,
            bio: getFieldValue('bio') || null,
            status: getFieldValue('status'),
            hireDate: getFieldValue('hireDate') || null,
            salary: parseFloat(getFieldValue('salary')) || null,
            workload: parseInt(getFieldValue('workload')) || null,
            canManageStudents: getFieldValue('canManageStudents', 'checkbox'),
            canManageClasses: getFieldValue('canManageClasses', 'checkbox'),
            address: {
                zipCode: getFieldValue('zipCode') || null,
                street: getFieldValue('street') || null,
                number: getFieldValue('number') || null,
                complement: getFieldValue('complement') || null,
                neighborhood: getFieldValue('neighborhood') || null,
                city: getFieldValue('city') || null,
                state: getFieldValue('state') || null,
                country: getFieldValue('country') || 'Brasil'
            }
        };

        // Remove empty address if all fields are null
        const addressFields = Object.values(formData.address).filter(val => val !== null && val !== '');
        if (addressFields.length === 0 || (addressFields.length === 1 && addressFields[0] === 'Brasil')) {
            delete formData.address;
        }

        return formData;
    }

    // Get Field Value
    function getFieldValue(fieldId, type = 'text') {
        const field = document.getElementById(fieldId);
        if (!field) return '';

        if (type === 'checkbox') {
            return field.checked;
        }
        
        return field.value.trim();
    }

    // Validate Form
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        clearAllErrors();

        // Required fields
        const requiredFields = [
            { id: 'name', message: 'Nome é obrigatório' },
            { id: 'email', message: 'E-mail é obrigatório' },
            { id: 'belt', message: 'Graduação é obrigatória' },
            { id: 'status', message: 'Status é obrigatório' }
        ];

        requiredFields.forEach(field => {
            const value = getFieldValue(field.id);
            if (!value) {
                showFieldError(field.id, field.message);
                isValid = false;
            }
        });

        // Email validation
        const email = getFieldValue('email');
        if (email && !isValidEmail(email)) {
            showFieldError('email', 'E-mail inválido');
            isValid = false;
        }

        // CPF validation
        const document = getFieldValue('document');
        if (document && !isValidCPF(document)) {
            showFieldError('document', 'CPF inválido');
            isValid = false;
        }

        // Phone validation
        const phone = getFieldValue('phone');
        if (phone && !isValidPhone(phone)) {
            showFieldError('phone', 'Telefone inválido');
            isValid = false;
        }

        return isValid;
    }

    // Field Validation
    function validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();

        clearFieldError(field);

        // Required field validation
        if (field.required && !value) {
            showFieldError(fieldId, 'Este campo é obrigatório');
            return false;
        }

        // Specific validations
        switch (fieldId) {
            case 'email':
                if (value && !isValidEmail(value)) {
                    showFieldError(fieldId, 'E-mail inválido');
                    return false;
                }
                break;
            case 'document':
                if (value && !isValidCPF(value)) {
                    showFieldError(fieldId, 'CPF inválido');
                    return false;
                }
                break;
            case 'phone':
                if (value && !isValidPhone(value)) {
                    showFieldError(fieldId, 'Telefone inválido');
                    return false;
                }
                break;
        }

        return true;
    }

    // Create form fields if missing to comply with AGENTS.md UI and IDs used by this module
    function ensureFormFields() {
        if (!elements.form) return;

        // If the name field exists, assume the form is already rendered
        if (document.getElementById('name')) return;

        elements.form.innerHTML = `
            <div class="form-section">
                <div class="section-header">📋 Informações Básicas</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name">Nome Completo *</label>
                        <input type="text" id="name" name="name" required placeholder="Ex: João Silva">
                        <div class="field-error" id="name-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="email">E-mail *</label>
                        <input type="email" id="email" name="email" required placeholder="email@academia.com">
                        <div class="field-error" id="email-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="phone">Telefone</label>
                        <input type="tel" id="phone" name="phone" placeholder="(11) 99999-9999">
                        <div class="field-error" id="phone-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="document">CPF</label>
                        <input type="text" id="document" name="document" placeholder="000.000.000-00">
                        <div class="field-error" id="document-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="birthDate">Data de Nascimento</label>
                        <input type="date" id="birthDate" name="birthDate">
                        <div class="field-error" id="birthDate-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="gender">Gênero</label>
                        <select id="gender" name="gender">
                            <option value="">Selecione</option>
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Feminino</option>
                            <option value="OTHER">Outro</option>
                        </select>
                        <div class="field-error" id="gender-error"></div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="section-header">🏅 Informações Profissionais</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="belt">Graduação *</label>
                        <input type="text" id="belt" name="belt" required placeholder="Ex: Faixa Preta">
                        <div class="field-error" id="belt-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="specialties">Especialidades</label>
                        <input type="text" id="specialties" name="specialties" placeholder="Separadas por vírgula">
                        <div class="field-error" id="specialties-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="experience">Experiência (anos)</label>
                        <input type="number" id="experience" name="experience" min="0" step="1">
                        <div class="field-error" id="experience-error"></div>
                    </div>
                    <div class="form-group full">
                        <label for="certifications">Certificações</label>
                        <textarea id="certifications" name="certifications" placeholder="Separadas por vírgula"></textarea>
                        <div class="field-error" id="certifications-error"></div>
                    </div>
                    <div class="form-group full">
                        <label for="bio">Bio</label>
                        <textarea id="bio" name="bio" rows="3" placeholder="Resumo profissional"></textarea>
                        <div class="field-error" id="bio-error"></div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="section-header">💼 Vínculo</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="status">Status *</label>
                        <select id="status" name="status" required>
                            <option value="">Selecione</option>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                        </select>
                        <div class="field-error" id="status-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="hireDate">Data de Admissão</label>
                        <input type="date" id="hireDate" name="hireDate">
                        <div class="field-error" id="hireDate-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="salary">Salário (R$)</label>
                        <input type="number" id="salary" name="salary" min="0" step="0.01">
                        <div class="field-error" id="salary-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="workload">Carga Horária (h/sem)</label>
                        <input type="number" id="workload" name="workload" min="0" step="1">
                        <div class="field-error" id="workload-error"></div>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" id="canManageStudents" name="canManageStudents"> Pode gerenciar alunos
                        </label>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" id="canManageClasses" name="canManageClasses"> Pode gerenciar turmas
                        </label>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="section-header">📍 Endereço</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="zipCode">CEP</label>
                        <input type="text" id="zipCode" name="zipCode" placeholder="00000-000">
                        <div class="field-error" id="zipCode-error"></div>
                    </div>
                    <div class="form-group full">
                        <label for="street">Rua</label>
                        <input type="text" id="street" name="street">
                    </div>
                    <div class="form-group">
                        <label for="number">Número</label>
                        <input type="text" id="number" name="number">
                    </div>
                    <div class="form-group">
                        <label for="complement">Complemento</label>
                        <input type="text" id="complement" name="complement">
                    </div>
                    <div class="form-group">
                        <label for="neighborhood">Bairro</label>
                        <input type="text" id="neighborhood" name="neighborhood">
                    </div>
                    <div class="form-group">
                        <label for="city">Cidade</label>
                        <input type="text" id="city" name="city">
                    </div>
                    <div class="form-group">
                        <label for="state">UF</label>
                        <input type="text" id="state" name="state" maxlength="2">
                    </div>
                    <div class="form-group">
                        <label for="country">País</label>
                        <input type="text" id="country" name="country" value="Brasil">
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button id="save-btn" class="btn btn-primary">💾 Salvar</button>
                <button id="delete-btn" type="button" class="btn btn-danger" style="display: none;">🗑️ Excluir</button>
            </div>
        `;
    }

    // Refresh cached element references after injecting the form
    function refreshElementRefs() {
        if (!elements) return;
        elements.saveBtn = document.getElementById('save-btn');
        elements.deleteBtn = document.getElementById('delete-btn');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
