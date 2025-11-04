/**
 * Profile Tab Component
 * Handles student profile information and personal data
 */

export class ProfileTab {
    constructor(editorController) {
        this.editor = editorController;
        this.formData = {};
        this.validationErrors = {};
        
        this.init();
    }

    init() {
        console.log('👤 Inicializando aba de Perfil...');
    }

    /**
     * Render profile tab content
     */
    render(container) {
        const html = `
            <div class="profile-tab-content">
                <div class="form-sections">
                    <!-- Personal Information Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">👤</span>
                            Informações Pessoais
                        </h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="firstName" class="required">Nome</label>
                                <input type="text" 
                                       id="firstName" 
                                       name="firstName"
                                       class="form-control"
                                       placeholder="Digite o nome"
                                       required>
                                <div class="field-error" id="firstName-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="lastName" class="required">Sobrenome</label>
                                <input type="text" 
                                       id="lastName" 
                                       name="lastName"
                                       class="form-control"
                                       placeholder="Digite o sobrenome"
                                       required>
                                <div class="field-error" id="lastName-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="email" class="required">Email</label>
                                <input type="email" 
                                       id="email" 
                                       name="email"
                                       class="form-control"
                                       placeholder="email@exemplo.com"
                                       required>
                                <div class="field-error" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone">Telefone</label>
                                <input type="tel" 
                                       id="phone" 
                                       name="phone"
                                       class="form-control"
                                       placeholder="(11) 99999-9999">
                                <div class="field-error" id="phone-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="birthDate">Data de Nascimento</label>
                                <input type="date" 
                                       id="birthDate" 
                                       name="birthDate"
                                       class="form-control">
                                <div class="field-error" id="birthDate-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="cpf">CPF</label>
                                <input type="text" 
                                       id="cpf" 
                                       name="cpf"
                                       class="form-control"
                                       placeholder="000.000.000-00">
                                <div class="field-error" id="cpf-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Status and Category Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">⚙️</span>
                            Status e Categoria
                        </h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="isActive">Status</label>
                                <select id="isActive" 
                                        name="isActive"
                                        class="form-control">
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                                <div class="field-error" id="isActive-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="category">Categoria</label>
                                <select id="category" 
                                        name="category"
                                        class="form-control">
                                    <option value="REGULAR">Regular</option>
                                    <option value="VIP">VIP</option>
                                    <option value="STUDENT">Estudante</option>
                                    <option value="SENIOR">Senior</option>
                                </select>
                                <div class="field-error" id="category-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">📞</span>
                            Informações de Contato
                        </h3>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="whatsapp">WhatsApp</label>
                                <input type="tel" 
                                       id="whatsapp" 
                                       name="whatsapp"
                                       class="form-control"
                                       placeholder="(11) 99999-9999">
                                <div class="field-error" id="whatsapp-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="emergencyContact">Contato de Emergência</label>
                                <input type="text" 
                                       id="emergencyContact" 
                                       name="emergencyContact"
                                       class="form-control"
                                       placeholder="Nome e telefone">
                                <div class="field-error" id="emergencyContact-error"></div>
                            </div>
                            
                            <div class="form-group full-width">
                                <label for="address">Endereço</label>
                                <textarea id="address" 
                                          name="address"
                                          class="form-control"
                                          rows="3"
                                          placeholder="Endereço completo"></textarea>
                                <div class="field-error" id="address-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Medical Information Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">🏥</span>
                            Informações Médicas
                        </h3>
                        
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label for="medicalObservations">Observações Médicas</label>
                                <textarea id="medicalObservations" 
                                          name="medicalObservations"
                                          class="form-control"
                                          rows="4"
                                          placeholder="Alergias, medicamentos, condições médicas, etc."></textarea>
                                <div class="field-error" id="medicalObservations-error"></div>
                            </div>
                            
                            <div class="form-group full-width">
                                <label for="internalNotes">Notas Internas</label>
                                <textarea id="internalNotes" 
                                          name="internalNotes"
                                          class="form-control"
                                          rows="3"
                                          placeholder="Notas para uso interno da academia"></textarea>
                                <div class="field-error" id="internalNotes-error"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                    <button type="button" 
                            id="save-profile-btn"
                            class="btn btn-primary">
                        💾 Salvar Perfil
                    </button>
                    <button type="button" 
                            id="reset-profile-btn"
                            class="btn btn-secondary">
                        🔄 Resetar
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
        this.loadFormData();
    }

    /**
     * Load data into form fields
     */
    loadData(studentData) {
        this.studentData = studentData;
        this.loadFormData();
    }

    /**
     * Load form data into fields
     */
    loadFormData() {
        if (!this.studentData) return;

        const user = this.studentData.user || {};
        
        // Personal information
        this.setFieldValue('firstName', user.firstName || '');
        this.setFieldValue('lastName', user.lastName || '');
        this.setFieldValue('email', user.email || '');
        this.setFieldValue('phone', user.phone || '');
        this.setFieldValue('birthDate', user.birthDate ? user.birthDate.split('T')[0] : '');
        this.setFieldValue('cpf', user.cpf || '');
        
        // Status and category
        this.setFieldValue('isActive', this.studentData.isActive ? 'true' : 'false');
        this.setFieldValue('category', this.studentData.category || 'REGULAR');
        
        // Contact information
        this.setFieldValue('whatsapp', user.whatsapp || '');
        this.setFieldValue('emergencyContact', this.studentData.emergencyContact || '');
        this.setFieldValue('address', user.address || '');
        
        // Medical information
        this.setFieldValue('medicalObservations', this.studentData.medicalObservations || '');
        this.setFieldValue('internalNotes', this.studentData.internalNotes || '');
    }

    /**
     * Set field value safely
     */
    setFieldValue(fieldName, value) {
        const field = document.getElementById(fieldName);
        if (field) {
            field.value = value;
            this.formData[fieldName] = value;
        }
    }

    /**
     * Get form data
     */
    getData() {
        return {
            user: {
                firstName: this.formData.firstName || '',
                lastName: this.formData.lastName || '',
                email: this.formData.email || '',
                phone: this.formData.phone || '',
                birthDate: this.formData.birthDate || null,
                cpf: this.formData.cpf || '',
                whatsapp: this.formData.whatsapp || '',
                address: this.formData.address || ''
            },
            isActive: this.formData.isActive === 'true',
            category: this.formData.category || 'REGULAR',
            emergencyContact: this.formData.emergencyContact || '',
            medicalObservations: this.formData.medicalObservations || '',
            internalNotes: this.formData.internalNotes || ''
        };
    }

    /**
     * Validate form data
     */
    async validate() {
        const errors = [];
        this.validationErrors = {};

        // Required fields
        if (!this.formData.firstName?.trim()) {
            errors.push('Nome é obrigatório');
            this.validationErrors.firstName = 'Nome é obrigatório';
        }

        if (!this.formData.lastName?.trim()) {
            errors.push('Sobrenome é obrigatório');
            this.validationErrors.lastName = 'Sobrenome é obrigatório';
        }

        if (!this.formData.email?.trim()) {
            errors.push('Email é obrigatório');
            this.validationErrors.email = 'Email é obrigatório';
        } else if (!this.isValidEmail(this.formData.email)) {
            errors.push('Email inválido');
            this.validationErrors.email = 'Email inválido';
        }

        // CPF validation
        if (this.formData.cpf && !this.isValidCPF(this.formData.cpf)) {
            errors.push('CPF inválido');
            this.validationErrors.cpf = 'CPF inválido';
        }

        // Update field error displays
        this.updateFieldErrors();

        return errors;
    }

    /**
     * Update field error displays
     */
    updateFieldErrors() {
        Object.keys(this.validationErrors).forEach(fieldName => {
            const errorElement = document.getElementById(`${fieldName}-error`);
            const fieldElement = document.getElementById(fieldName);
            
            if (errorElement && fieldElement) {
                errorElement.textContent = this.validationErrors[fieldName];
                fieldElement.classList.add('error');
            }
        });

        // Clear errors for valid fields
        Object.keys(this.formData).forEach(fieldName => {
            if (!this.validationErrors[fieldName]) {
                const errorElement = document.getElementById(`${fieldName}-error`);
                const fieldElement = document.getElementById(fieldName);
                
                if (errorElement && fieldElement) {
                    errorElement.textContent = '';
                    fieldElement.classList.remove('error');
                }
            }
        });
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate CPF format and checksum
     */
    isValidCPF(cpf) {
        // Remove formatting
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Check for known invalid sequences
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validate checksum
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    /**
     * Bind event listeners
     */
    bindEvents(container) {
        // Form field changes
        const formFields = container.querySelectorAll('.form-control');
        formFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.onFieldChange(e.target.name, e.target.value);
            });
            
            field.addEventListener('blur', (e) => {
                this.onFieldBlur(e.target.name, e.target.value);
            });
        });

        // Action buttons
        const saveBtn = container.querySelector('#save-profile-btn');
        const resetBtn = container.querySelector('#reset-profile-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.onSave());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.onReset());
        }

        // Phone and CPF formatting
        const phoneFields = container.querySelectorAll('#phone, #whatsapp');
        phoneFields.forEach(field => {
            field.addEventListener('input', (e) => {
                e.target.value = this.formatPhone(e.target.value);
            });
        });

        const cpfField = container.querySelector('#cpf');
        if (cpfField) {
            cpfField.addEventListener('input', (e) => {
                e.target.value = this.formatCPF(e.target.value);
            });
        }
    }

    /**
     * Handle field changes
     */
    onFieldChange(fieldName, value) {
        this.formData[fieldName] = value;
        this.editor.markAsChanged();
        
        // Clear field error when user starts typing
        if (this.validationErrors[fieldName]) {
            delete this.validationErrors[fieldName];
            this.updateFieldErrors();
        }
    }

    /**
     * Handle field blur (validation)
     */
    onFieldBlur(fieldName, value) {
        // Perform field-specific validation
        this.validateField(fieldName, value);
    }

    /**
     * Validate single field
     */
    validateField(fieldName, value) {
        delete this.validationErrors[fieldName];

        switch (fieldName) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.validationErrors[fieldName] = 'Email inválido';
                }
                break;
            case 'cpf':
                if (value && !this.isValidCPF(value)) {
                    this.validationErrors[fieldName] = 'CPF inválido';
                }
                break;
        }

        this.updateFieldErrors();
    }

    /**
     * Format phone number
     */
    formatPhone(value) {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
    }

    /**
     * Format CPF
     */
    formatCPF(value) {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }

    /**
     * Handle save action
     */
    async onSave() {
        await this.editor.saveStudent();
    }

    /**
     * Handle reset action
     */
    onReset() {
        if (confirm('Deseja descartar todas as alterações no perfil?')) {
            this.loadFormData();
            this.validationErrors = {};
            this.updateFieldErrors();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        console.log('🧹 Profile Tab destruído');
    }
}
