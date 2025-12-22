// /public/js/modules/quick-enrollment/index.js

if (typeof window.QuickEnrollment !== 'undefined') {
    console.log('QuickEnrollment already loaded');
} else {

const QuickEnrollment = {
    container: null,
    moduleAPI: null,
    currentStep: 1,
    totalSteps: 4,
    formData: {
        student: {},
        plan: null,
        course: null,
        financial: {}
    },
    plans: [],
    courses: [],
    stream: null,
    
    // Edit mode properties
    activeTab: 'new', // 'new' or 'edit'
    students: [],
    searchQuery: '',
    selectedStudent: null,
    isEditMode: false,

    async init() {
        console.log('🚀 QuickEnrollment init');
        await this.initializeAPI();
        this.loadCSS();
        this.render();
        await this.loadData();
        this.setupEvents();
        
        window.quickEnrollment = this;
        window.app?.dispatchEvent('module:loaded', { name: 'quickEnrollment' });
    },

    async initializeAPI() {
        if (window.createModuleAPI) {
            this.moduleAPI = window.createModuleAPI('QuickEnrollment');
        } else {
            console.error('API Client not found');
            // Fallback or wait
        }
    },

    loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/quick-enrollment.css';
        document.head.appendChild(link);
    },

    async loadData() {
        try {
            // Load Plans
            const plansResponse = await this.moduleAPI.request('/api/billing-plans');
            if (plansResponse.success) {
                this.plans = plansResponse.data;
                this.renderPlans();
            }

            // Load Courses
            const coursesResponse = await this.moduleAPI.request('/api/courses');
            if (coursesResponse.success) {
                this.courses = coursesResponse.data;
                this.renderCourses();
            }
        } catch (error) {
            console.error('Error loading data', error);
        }
    },

    render() {
        this.container.innerHTML = `
            <div class="pvd-container">
                <div class="pvd-header">
                    <h1>Matrícula Rápida</h1>
                    <p>Cadastro e edição simplificados</p>
                </div>

                <!-- Tabs -->
                <div class="pvd-tabs">
                    <button class="pvd-tab active" data-tab="new" onclick="window.quickEnrollment.switchTab('new')">
                        <i class="fas fa-plus-circle"></i> Nova Matrícula
                    </button>
                    <button class="pvd-tab" data-tab="edit" onclick="window.quickEnrollment.switchTab('edit')">
                        <i class="fas fa-edit"></i> Edição Rápida
                    </button>
                </div>

                <!-- NEW ENROLLMENT TAB -->
                <div class="pvd-tab-content active" id="tab-new">
                    <div class="pvd-step-indicator">
                        <div class="pvd-step active" data-step="1">1</div>
                        <div class="pvd-step" data-step="2">2</div>
                        <div class="pvd-step" data-step="3">3</div>
                        <div class="pvd-step" data-step="4">4</div>
                    </div>

                    <form id="pvd-form">
                        <!-- Step 1: Student Info -->
                        <div class="pvd-form-section active" id="step-1">
                            <div class="pvd-photo-capture" id="photo-trigger">
                                <div class="pvd-photo-icon">📷</div>
                                <span>Tirar Foto</span>
                                <input type="hidden" name="photoUrl" id="photoUrl">
                            </div>

                            <div class="pvd-input-group">
                                <label class="pvd-label">Nome Completo</label>
                                <input type="text" class="pvd-input" name="firstName" placeholder="Nome" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Sobrenome</label>
                                <input type="text" class="pvd-input" name="lastName" placeholder="Sobrenome" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">CPF</label>
                                <input type="tel" class="pvd-input" name="cpf" placeholder="000.000.000-00" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Celular</label>
                                <input type="tel" class="pvd-input" name="phone" placeholder="(00) 00000-0000" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Email</label>
                                <input type="email" class="pvd-input" name="email" placeholder="email@exemplo.com" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Data de Nascimento</label>
                                <input type="date" class="pvd-input" name="birthDate" required>
                            </div>
                        </div>

                        <!-- Step 2: Plan & Course -->
                        <div class="pvd-form-section" id="step-2">
                            <h3 class="pvd-label">Escolha o Plano</h3>
                            <div class="pvd-card-select" id="plans-list">
                                <div class="pvd-option-card">Carregando planos...</div>
                            </div>

                            <h3 class="pvd-label" style="margin-top: 1.5rem;">Escolha o Curso</h3>
                            <div class="pvd-card-select" id="courses-list">
                                <div class="pvd-option-card">Carregando cursos...</div>
                            </div>
                        </div>

                        <!-- Step 3: Financial Responsible -->
                        <div class="pvd-form-section" id="step-3">
                            <div class="pvd-input-group">
                                <label style="display:flex; align-items:center; gap: 0.5rem;">
                                    <input type="checkbox" id="same-as-student">
                                    Mesmo que o aluno
                                </label>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Nome do Responsável</label>
                                <input type="text" class="pvd-input" name="fin_name" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">CPF do Responsável</label>
                                <input type="tel" class="pvd-input" name="fin_cpf" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Celular</label>
                                <input type="tel" class="pvd-input" name="fin_phone" required>
                            </div>
                            <div class="pvd-input-group">
                                <label class="pvd-label">Email</label>
                                <input type="email" class="pvd-input" name="fin_email" required>
                            </div>
                        </div>

                        <!-- Step 4: Review -->
                        <div class="pvd-form-section" id="step-4">
                            <h3>Resumo da Matrícula</h3>
                            <div id="summary-content"></div>
                        </div>
                    </form>
                </div>

                <!-- EDIT TAB -->
                <div class="pvd-tab-content" id="tab-edit">
                    <!-- Search Section -->
                    <div class="pvd-search-section">
                        <div class="pvd-input-group">
                            <label class="pvd-label">🔍 Buscar Aluno</label>
                            <input type="text" class="pvd-input" id="edit-search" 
                                   placeholder="Digite nome, CPF ou email..." 
                                   oninput="window.quickEnrollment.searchStudents(this.value)">
                        </div>
                        <div id="search-results" class="pvd-search-results"></div>
                    </div>

                    <!-- Edit Form (hidden until student selected) -->
                    <div id="edit-form-container" class="pvd-edit-form" style="display: none;">
                        <div class="pvd-selected-student-header">
                            <div class="pvd-selected-student-info">
                                <img id="edit-student-photo" src="" alt="" class="pvd-student-avatar">
                                <div>
                                    <h3 id="edit-student-name">Nome do Aluno</h3>
                                    <span id="edit-student-status" class="pvd-status-badge">Ativo</span>
                                </div>
                            </div>
                            <button class="pvd-btn-icon" onclick="window.quickEnrollment.clearEditForm()">
                                ✕
                            </button>
                        </div>

                        <form id="pvd-edit-form">
                            <div class="pvd-edit-section">
                                <h4 class="pvd-section-title">📋 Dados Pessoais</h4>
                                
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Nome</label>
                                    <input type="text" class="pvd-input" name="edit_firstName">
                                </div>
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Sobrenome</label>
                                    <input type="text" class="pvd-input" name="edit_lastName">
                                </div>
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Celular</label>
                                    <input type="tel" class="pvd-input" name="edit_phone">
                                </div>
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Email</label>
                                    <input type="email" class="pvd-input" name="edit_email">
                                </div>
                            </div>

                            <div class="pvd-edit-section">
                                <h4 class="pvd-section-title">🎯 Status e Graduação</h4>
                                
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Status</label>
                                    <select class="pvd-input" name="edit_status">
                                        <option value="ACTIVE">Ativo</option>
                                        <option value="INACTIVE">Inativo</option>
                                        <option value="SUSPENDED">Suspenso</option>
                                        <option value="PENDING">Pendente</option>
                                    </select>
                                </div>
                                <div class="pvd-input-group">
                                    <label class="pvd-label">Faixa/Graduação</label>
                                    <select class="pvd-input" name="edit_beltRank">
                                        <option value="">Selecione...</option>
                                        <option value="Branca">Branca</option>
                                        <option value="Amarela">Amarela</option>
                                        <option value="Laranja">Laranja</option>
                                        <option value="Verde">Verde</option>
                                        <option value="Azul">Azul</option>
                                        <option value="Marrom">Marrom</option>
                                        <option value="Preta">Preta</option>
                                    </select>
                                </div>
                            </div>

                            <div class="pvd-edit-section">
                                <h4 class="pvd-section-title">💳 Plano</h4>
                                <div class="pvd-card-select" id="edit-plans-list"></div>
                            </div>

                            <div class="pvd-edit-section">
                                <h4 class="pvd-section-title">📝 Observações</h4>
                                <div class="pvd-input-group">
                                    <textarea class="pvd-input pvd-textarea" name="edit_notes" 
                                              placeholder="Anotações sobre o aluno..."></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div class="pvd-bottom-bar" id="bottom-bar-new">
                <button class="pvd-btn pvd-btn-secondary" id="btn-back" style="display:none">Voltar</button>
                <button class="pvd-btn pvd-btn-primary" id="btn-next">Próximo</button>
            </div>

            <div class="pvd-bottom-bar" id="bottom-bar-edit" style="display: none;">
                <button class="pvd-btn pvd-btn-secondary" onclick="window.quickEnrollment.clearEditForm()">Cancelar</button>
                <button class="pvd-btn pvd-btn-primary" onclick="window.quickEnrollment.saveEditForm()">
                    💾 Salvar Alterações
                </button>
            </div>

            <!-- Camera Modal -->
            <div class="pvd-camera-modal" id="camera-modal">
                <video id="camera-video" class="pvd-camera-view" autoplay playsinline></video>
                <div class="pvd-camera-controls">
                    <div class="pvd-close-camera" id="btn-close-camera">✕</div>
                    <div class="pvd-shutter-btn" id="btn-shutter"></div>
                    <div style="width: 40px;"></div> <!-- Spacer -->
                </div>
            </div>
        `;
    },

    renderPlans() {
        const container = document.getElementById('plans-list');
        if (!this.plans.length) {
            container.innerHTML = '<div class="pvd-option-card">Nenhum plano disponível</div>';
            return;
        }
        container.innerHTML = this.plans.map(plan => `
            <div class="pvd-option-card" onclick="window.quickEnrollment.selectPlan('${plan.id}', this)">
                <div class="pvd-option-title">${plan.name}</div>
                <div class="pvd-option-price">R$ ${plan.price}</div>
                <div style="font-size: 0.8rem; color: #718096;">${plan.description || ''}</div>
            </div>
        `).join('');
    },

    renderCourses() {
        const container = document.getElementById('courses-list');
        if (!this.courses.length) {
            container.innerHTML = '<div class="pvd-option-card">Nenhum curso disponível</div>';
            return;
        }
        container.innerHTML = this.courses.map(course => `
            <div class="pvd-option-card" onclick="window.quickEnrollment.selectCourse('${course.id}', this)">
                <div class="pvd-option-title">${course.name}</div>
                <div style="font-size: 0.8rem; color: #718096;">${course.category || ''}</div>
            </div>
        `).join('');
    },

    selectPlan(id, element) {
        this.formData.plan = this.plans.find(p => p.id === id);
        document.querySelectorAll('#plans-list .pvd-option-card').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    },

    selectCourse(id, element) {
        this.formData.course = this.courses.find(c => c.id === id);
        document.querySelectorAll('#courses-list .pvd-option-card').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    },

    setupEvents() {
        document.getElementById('btn-next').addEventListener('click', (e) => {
            e.preventDefault();
            this.nextStep();
        });
        document.getElementById('btn-back').addEventListener('click', (e) => {
            e.preventDefault();
            this.prevStep();
        });
        
        document.getElementById('photo-trigger').addEventListener('click', () => this.openCamera());
        document.getElementById('btn-close-camera').addEventListener('click', () => this.closeCamera());
        document.getElementById('btn-shutter').addEventListener('click', () => this.takePhoto());

        document.getElementById('same-as-student').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.copyStudentToFinancial();
            }
        });
    },

    copyStudentToFinancial() {
        const form = document.getElementById('pvd-form');
        form.fin_name.value = (form.firstName.value + ' ' + form.lastName.value).trim();
        form.fin_cpf.value = form.cpf.value;
        form.fin_phone.value = form.phone.value;
        form.fin_email.value = form.email.value;
    },

    async nextStep() {
        if (!this.validateStep(this.currentStep)) return;

        if (this.currentStep === this.totalSteps) {
            await this.submitForm();
            return;
        }

        this.currentStep++;
        this.updateUI();
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateUI();
        }
    },

    updateUI() {
        // Update Steps
        document.querySelectorAll('.pvd-step').forEach(el => {
            const step = parseInt(el.dataset.step);
            el.classList.remove('active', 'completed');
            if (step === this.currentStep) el.classList.add('active');
            if (step < this.currentStep) el.classList.add('completed');
        });

        // Show Section
        document.querySelectorAll('.pvd-form-section').forEach(el => el.classList.remove('active'));
        document.getElementById(`step-${this.currentStep}`).classList.add('active');

        // Buttons
        const btnNext = document.getElementById('btn-next');
        const btnBack = document.getElementById('btn-back');

        btnBack.style.display = this.currentStep === 1 ? 'none' : 'block';
        btnNext.textContent = this.currentStep === this.totalSteps ? 'Finalizar Matrícula' : 'Próximo';

        if (this.currentStep === 4) {
            this.renderSummary();
        }
    },

    validateStep(step) {
        const form = document.getElementById('pvd-form');
        if (step === 1) {
            if (!form.firstName.value || !form.lastName.value || !form.cpf.value || !form.phone.value) {
                alert('Preencha todos os campos obrigatórios');
                return false;
            }
        }
        if (step === 2) {
            if (!this.formData.plan || !this.formData.course) {
                alert('Selecione um plano e um curso');
                return false;
            }
        }
        if (step === 3) {
            if (!form.fin_name.value || !form.fin_cpf.value) {
                alert('Preencha os dados do responsável financeiro');
                return false;
            }
        }
        return true;
    },

    renderSummary() {
        const form = document.getElementById('pvd-form');
        const summary = document.getElementById('summary-content');
        
        summary.innerHTML = `
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">Aluno</span>
                <span class="pvd-summary-value">${form.firstName.value} ${form.lastName.value}</span>
            </div>
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">CPF</span>
                <span class="pvd-summary-value">${form.cpf.value}</span>
            </div>
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">Plano</span>
                <span class="pvd-summary-value">${this.formData.plan?.name}</span>
            </div>
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">Valor</span>
                <span class="pvd-summary-value">R$ ${this.formData.plan?.price}</span>
            </div>
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">Curso</span>
                <span class="pvd-summary-value">${this.formData.course?.name}</span>
            </div>
            <div class="pvd-summary-item">
                <span class="pvd-summary-label">Responsável</span>
                <span class="pvd-summary-value">${form.fin_name.value}</span>
            </div>
        `;
    },

    async openCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = document.getElementById('camera-video');
            video.srcObject = this.stream;
            document.getElementById('camera-modal').classList.add('active');
        } catch (err) {
            console.error('Error accessing camera', err);
            alert('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    },

    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        document.getElementById('camera-modal').classList.remove('active');
    },

    takePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const photoUrl = canvas.toDataURL('image/jpeg');
        document.getElementById('photoUrl').value = photoUrl;
        
        const trigger = document.getElementById('photo-trigger');
        trigger.innerHTML = `<img src="${photoUrl}" />`;
        trigger.classList.add('has-photo');
        
        this.closeCamera();
    },

    async submitForm() {
        const form = document.getElementById('pvd-form');
        const btn = document.getElementById('btn-next');
        
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            // 1. Create Student
            const studentPayload = {
                firstName: form.firstName.value,
                lastName: form.lastName.value,
                cpf: form.cpf.value,
                phone: form.phone.value,
                email: form.email.value,
                birthDate: new Date(form.birthDate.value).toISOString(),
                photoUrl: document.getElementById('photoUrl').value,
                enrollment: { packageId: this.formData.plan.id }
            };

            console.log('Creating student...', studentPayload);
            const studentRes = await this.moduleAPI.request('/api/students', {
                method: 'POST',
                body: JSON.stringify(studentPayload)
            });

            if (!studentRes.success) throw new Error(studentRes.message || 'Erro ao criar aluno');
            
            const studentId = studentRes.data.id;
            console.log('Student created:', studentId);

            // 2. Create Financial Responsible
            const finPayload = {
                name: form.fin_name.value,
                cpfCnpj: form.fin_cpf.value,
                email: form.fin_email.value,
                phone: form.fin_phone.value
            };

            console.log('Creating financial responsible...', finPayload);
            const finRes = await this.moduleAPI.request('/api/financial-responsible', {
                method: 'POST',
                body: JSON.stringify(finPayload)
            });

            if (!finRes.success) throw new Error(finRes.message || 'Erro ao criar responsável financeiro');
            
            const finId = finRes.data.id;
            console.log('Financial responsible created:', finId);

            // 3. Associate
            console.log('Associating...');
            const assocRes = await this.moduleAPI.request(`/api/financial-responsible/${finId}/students`, {
                method: 'POST',
                body: JSON.stringify({ studentIds: [studentId] })
            });

            if (!assocRes.success) throw new Error(assocRes.message || 'Erro ao associar responsável');

            alert('Matrícula realizada com sucesso!');
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert('Erro ao realizar matrícula: ' + error.message);
            btn.disabled = false;
            btn.textContent = 'Finalizar Matrícula';
        }
    },

    // ============================================
    // EDIT MODE METHODS
    // ============================================

    switchTab(tab) {
        this.activeTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.pvd-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Update tab content
        document.querySelectorAll('.pvd-tab-content').forEach(c => {
            c.classList.remove('active');
        });
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        // Update bottom bars
        document.getElementById('bottom-bar-new').style.display = tab === 'new' ? 'flex' : 'none';
        document.getElementById('bottom-bar-edit').style.display = tab === 'edit' && this.selectedStudent ? 'flex' : 'none';
        
        // Load students for edit tab
        if (tab === 'edit' && this.students.length === 0) {
            this.loadStudents();
        }
    },

    async loadStudents() {
        try {
            const response = await this.moduleAPI.request('/api/students');
            if (response.success) {
                this.students = response.data;
                this.renderSearchResults(this.students.slice(0, 10)); // Show first 10
            }
        } catch (error) {
            console.error('Error loading students', error);
        }
    },

    searchStudents(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (!this.searchQuery) {
            this.renderSearchResults(this.students.slice(0, 10));
            return;
        }
        
        const filtered = this.students.filter(s => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
            const email = (s.email || s.user?.email || '').toLowerCase();
            const cpf = (s.cpf || '').replace(/\D/g, '');
            const phone = (s.phone || '').replace(/\D/g, '');
            const searchClean = this.searchQuery.replace(/\D/g, '');
            
            return fullName.includes(this.searchQuery) ||
                   email.includes(this.searchQuery) ||
                   cpf.includes(searchClean) ||
                   phone.includes(searchClean);
        });
        
        this.renderSearchResults(filtered.slice(0, 15));
    },

    renderSearchResults(students) {
        const container = document.getElementById('search-results');
        
        if (!students.length) {
            container.innerHTML = `
                <div class="pvd-empty-state">
                    <span>😔</span>
                    <p>Nenhum aluno encontrado</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = students.map(s => {
            const statusClass = this.getStatusClass(s.status);
            const statusLabel = this.getStatusLabel(s.status);
            const photoUrl = s.photoUrl || s.user?.image || '';
            const initials = `${(s.firstName || '')[0] || ''}${(s.lastName || '')[0] || ''}`.toUpperCase();
            
            return `
                <div class="pvd-student-card" onclick="window.quickEnrollment.selectStudent('${s.id}')">
                    <div class="pvd-student-avatar">
                        ${photoUrl ? `<img src="${photoUrl}" alt="">` : `<span>${initials}</span>`}
                    </div>
                    <div class="pvd-student-info">
                        <div class="pvd-student-name">${s.firstName || ''} ${s.lastName || ''}</div>
                        <div class="pvd-student-meta">
                            ${s.phone || ''} • ${s.email || s.user?.email || ''}
                        </div>
                    </div>
                    <span class="pvd-status-badge ${statusClass}">${statusLabel}</span>
                </div>
            `;
        }).join('');
    },

    getStatusClass(status) {
        const classes = {
            'ACTIVE': 'status-active',
            'INACTIVE': 'status-inactive',
            'SUSPENDED': 'status-suspended',
            'PENDING': 'status-pending'
        };
        return classes[status] || 'status-pending';
    },

    getStatusLabel(status) {
        const labels = {
            'ACTIVE': 'Ativo',
            'INACTIVE': 'Inativo',
            'SUSPENDED': 'Suspenso',
            'PENDING': 'Pendente'
        };
        return labels[status] || status || 'Pendente';
    },

    async selectStudent(id) {
        this.selectedStudent = this.students.find(s => s.id === id);
        if (!this.selectedStudent) return;
        
        const s = this.selectedStudent;
        
        // Show edit form
        document.getElementById('edit-form-container').style.display = 'block';
        document.getElementById('search-results').style.display = 'none';
        document.querySelector('.pvd-search-section .pvd-input-group').style.display = 'none';
        
        // Fill form
        const form = document.getElementById('pvd-edit-form');
        form.edit_firstName.value = s.firstName || '';
        form.edit_lastName.value = s.lastName || '';
        form.edit_phone.value = s.phone || '';
        form.edit_email.value = s.email || s.user?.email || '';
        form.edit_status.value = s.status || 'ACTIVE';
        form.edit_beltRank.value = s.beltRank || '';
        form.edit_notes.value = s.notes || '';
        
        // Update header
        const photoUrl = s.photoUrl || s.user?.image || '';
        const initials = `${(s.firstName || '')[0] || ''}${(s.lastName || '')[0] || ''}`.toUpperCase();
        
        document.getElementById('edit-student-name').textContent = `${s.firstName || ''} ${s.lastName || ''}`;
        document.getElementById('edit-student-status').textContent = this.getStatusLabel(s.status);
        document.getElementById('edit-student-status').className = `pvd-status-badge ${this.getStatusClass(s.status)}`;
        
        const photoEl = document.getElementById('edit-student-photo');
        if (photoUrl) {
            photoEl.src = photoUrl;
            photoEl.style.display = 'block';
        } else {
            photoEl.style.display = 'none';
        }
        
        // Render plans for edit
        this.renderEditPlans();
        
        // Show bottom bar
        document.getElementById('bottom-bar-edit').style.display = 'flex';
    },

    renderEditPlans() {
        const container = document.getElementById('edit-plans-list');
        if (!this.plans.length) {
            container.innerHTML = '<div class="pvd-option-card">Nenhum plano disponível</div>';
            return;
        }
        
        // Get current plan from enrollment
        const currentPlanId = this.selectedStudent?.enrollments?.[0]?.billingPlanId;
        
        container.innerHTML = this.plans.map(plan => `
            <div class="pvd-option-card ${plan.id === currentPlanId ? 'selected' : ''}" 
                 onclick="window.quickEnrollment.selectEditPlan('${plan.id}', this)">
                <div class="pvd-option-title">${plan.name}</div>
                <div class="pvd-option-price">R$ ${plan.price}</div>
            </div>
        `).join('');
    },

    selectEditPlan(id, element) {
        this.formData.plan = this.plans.find(p => p.id === id);
        document.querySelectorAll('#edit-plans-list .pvd-option-card').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    },

    clearEditForm() {
        this.selectedStudent = null;
        this.formData.plan = null;
        
        document.getElementById('edit-form-container').style.display = 'none';
        document.getElementById('search-results').style.display = 'block';
        document.querySelector('.pvd-search-section .pvd-input-group').style.display = 'block';
        document.getElementById('bottom-bar-edit').style.display = 'none';
        document.getElementById('edit-search').value = '';
        
        this.renderSearchResults(this.students.slice(0, 10));
    },

    async saveEditForm() {
        if (!this.selectedStudent) return;
        
        const form = document.getElementById('pvd-edit-form');
        const btn = document.querySelector('#bottom-bar-edit .pvd-btn-primary');
        
        btn.disabled = true;
        btn.innerHTML = '⏳ Salvando...';

        try {
            const payload = {
                firstName: form.edit_firstName.value,
                lastName: form.edit_lastName.value,
                phone: form.edit_phone.value,
                email: form.edit_email.value,
                status: form.edit_status.value,
                beltRank: form.edit_beltRank.value || null,
                notes: form.edit_notes.value || null
            };

            console.log('Updating student...', this.selectedStudent.id, payload);
            
            const response = await this.moduleAPI.request(`/api/students/${this.selectedStudent.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao atualizar aluno');
            }

            // Update local data
            const index = this.students.findIndex(s => s.id === this.selectedStudent.id);
            if (index !== -1) {
                this.students[index] = { ...this.students[index], ...payload };
            }

            // Show success feedback
            btn.innerHTML = '✅ Salvo!';
            btn.style.background = 'var(--pvd-success)';
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = '💾 Salvar Alterações';
                btn.style.background = '';
                this.clearEditForm();
            }, 1500);

        } catch (error) {
            console.error('Error updating student:', error);
            alert('Erro ao salvar: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '💾 Salvar Alterações';
        }
    }
};

window.quickEnrollment = QuickEnrollment;
}
