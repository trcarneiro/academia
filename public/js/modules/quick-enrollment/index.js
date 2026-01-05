// /public/js/modules/quick-enrollment/index-simplified.js
// Matrícula Rápida Simplificada - Versão 3.0

if (typeof window.QuickEnrollment !== 'undefined') {
    console.log('QuickEnrollment already loaded');
} else {

const QuickEnrollment = {
    container: null,
    moduleAPI: null,
    formData: {
        plan: null,
        course: null,
        hasFinancialResponsible: false,
        photo: null,
        isEditMode: false,
        studentId: null
    },
    stream: null,
    plans: [],
    courses: [],

    async init() {
        console.log('🚀 QuickEnrollment init (Simplified v3.0)');
        await this.initializeAPI();
        this.loadCSS();
        
        if (this.container) {
            this.render();
            await this.loadData();
            this.setupEvents();
        }
        
        window.quickEnrollment = this;
        window.app?.dispatchEvent('module:loaded', { name: 'quickEnrollment' });
    },

    async initializeAPI() {
        if (window.createModuleAPI) {
            this.moduleAPI = window.createModuleAPI('QuickEnrollment');
        } else {
            console.error('API Client not found');
        }
    },

    loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/css/modules/quick-enrollment.css?v=${new Date().getTime()}`;
        document.head.appendChild(link);
    },

    async loadData() {
        try {
            // Load Plans
            const plansResponse = await this.moduleAPI.request('/api/billing-plans');
            if (plansResponse.success) {
                this.plans = plansResponse.data.filter(p => p.isActive);
                this.renderPlans();
            }

            // Load Courses
            const coursesResponse = await this.moduleAPI.request('/api/courses');
            if (coursesResponse.success) {
                this.courses = coursesResponse.data;
            }
        } catch (error) {
            console.error('Error loading data', error);
        }
    },

    render() {
        if (!this.container) {
            console.error('Container not set for QuickEnrollment');
            return;
        }
        this.container.innerHTML = `
            <div class="pvd-container">
                <div class="pvd-header">
                    <h1>📝 Matrícula Rápida</h1>
                    <p>Cadastro simplificado em uma única tela</p>
                </div>

                <div class="pvd-mode-toggle">
                    <button type="button" class="pvd-btn-outline" onclick="quickEnrollment.toggleEditMode()">
                        <i class="fas fa-search"></i> Já é aluno? Editar
                    </button>
                </div>

                <form class="pvd-form-simplified" id="quickEnrollmentForm">
                    
                    <!-- FOTO DO ALUNO -->
                    <div class="pvd-photo-section">
                        <div class="pvd-camera-container">
                            <div id="cameraPlaceholder" class="pvd-camera-placeholder" onclick="quickEnrollment.startCamera()">
                                <i class="fas fa-camera"></i>
                                <span>Tirar Foto</span>
                            </div>
                            <video id="cameraPreview" class="pvd-camera-preview" autoplay playsinline style="display: none;"></video>
                            <img id="photoPreview" class="pvd-photo-preview" style="display: none;">
                            <canvas id="photoCanvas" style="display: none;"></canvas>
                        </div>
                        
                        <div class="pvd-camera-controls">
                            <button type="button" id="btnCapture" class="pvd-btn-camera" style="display: none;" onclick="quickEnrollment.takePhoto()">
                                <i class="fas fa-camera"></i> Capturar
                            </button>
                            <button type="button" id="btnRetake" class="pvd-btn-camera retake" style="display: none;" onclick="quickEnrollment.retakePhoto()">
                                <i class="fas fa-redo"></i> Tirar Outra
                            </button>
                        </div>
                    </div>

                    <!-- DADOS DO ALUNO -->
                    <div class="pvd-section">
                        <h2>👤 Dados do Aluno</h2>
                        
                        <div class="pvd-row">
                            <div class="pvd-field">
                                <label>Nome *</label>
                                <input type="text" name="firstName" required>
                            </div>
                            <div class="pvd-field">
                                <label>Sobrenome *</label>
                                <input type="text" name="lastName" required>
                            </div>
                        </div>

                        <div class="pvd-row">
                            <div class="pvd-field">
                                <label>CPF <span class="optional" id="cpfOptional"></span></label>
                                <input type="text" name="cpf" id="studentCpf" maxlength="14" placeholder="000.000.000-00">
                            </div>
                            <div class="pvd-field">
                                <label>Data de Nascimento</label>
                                <input type="date" name="birthDate">
                            </div>
                        </div>

                        <div class="pvd-row">
                            <div class="pvd-field">
                                <label>Telefone <span class="optional" id="phoneOptional"></span></label>
                                <input type="tel" name="phone" id="studentPhone" placeholder="(00) 00000-0000">
                            </div>
                            <div class="pvd-field">
                                <label>Email <span class="optional" id="emailOptional"></span></label>
                                <input type="email" name="email" id="studentEmail">
                            </div>
                        </div>
                    </div>

                    <!-- RESPONSÁVEL FINANCEIRO (OPCIONAL) -->
                    <div class="pvd-section">
                        <div class="pvd-section-header">
                            <h2>💳 Responsável Financeiro (Opcional)</h2>
                            <button type="button" class="pvd-btn-toggle" id="toggleFinancial" onclick="quickEnrollment.toggleFinancialResponsible()">
                                <i class="fas fa-plus"></i> Adicionar Responsável
                            </button>
                        </div>

                        <div id="financialFields" class="pvd-financial-fields" style="display: none;">
                            <div class="pvd-info-box">
                                <i class="fas fa-info-circle"></i>
                                Ao cadastrar responsável financeiro, CPF/telefone/email do aluno ficam opcionais
                            </div>

                            <div class="pvd-row">
                                <div class="pvd-field">
                                    <label>Nome Completo *</label>
                                    <input type="text" name="fin_name" id="finName">
                                </div>
                            </div>

                            <div class="pvd-row">
                                <div class="pvd-field">
                                    <label>CPF *</label>
                                    <input type="text" name="fin_cpf" id="finCpf" maxlength="14" placeholder="000.000.000-00">
                                </div>
                                <div class="pvd-field">
                                    <label>Data de Nascimento</label>
                                    <input type="date" name="fin_birthDate" id="finBirthDate">
                                </div>
                            </div>

                            <div class="pvd-row">
                                <div class="pvd-field">
                                    <label>Telefone *</label>
                                    <input type="tel" name="fin_phone" id="finPhone" placeholder="(00) 00000-0000">
                                </div>
                                <div class="pvd-field">
                                    <label>Email *</label>
                                    <input type="email" name="fin_email" id="finEmail">
                                </div>
                            </div>

                            <button type="button" class="pvd-btn-remove" onclick="quickEnrollment.removeFinancialResponsible()">
                                <i class="fas fa-times"></i> Remover Responsável
                            </button>
                        </div>
                    </div>

                    <!-- PLANO E CURSO -->
                    <div class="pvd-section">
                        <h2>📦 Plano e Curso</h2>
                        
                        <div class="pvd-field">
                            <label>Selecione o Plano *</label>
                            <div id="plansList" class="pvd-plans-grid"></div>
                        </div>

                        <div class="pvd-field" id="customPriceField" style="display: none;">
                            <label>Valor Customizado</label>
                            <input type="number" name="customPrice" id="customPrice" step="0.01" placeholder="R$ 0,00">
                            <small>Deixe em branco para usar o valor padrão do plano</small>
                        </div>

                        <div class="pvd-field" id="courseField" style="display: none;">
                            <label>Curso Base (automático)</label>
                            <div id="selectedCourse" class="pvd-selected-course"></div>
                        </div>
                    </div>

                    <!-- BOTÃO FINALIZAR -->
                    <div class="pvd-actions">
                        <button type="submit" class="pvd-btn-primary" id="submitBtn">
                            <i class="fas fa-check"></i> Finalizar Matrícula
                        </button>
                    </div>

                </form>
            </div>

            <!-- SEARCH OVERLAY -->
            <div id="searchOverlay" class="pvd-search-overlay" style="display: none;" onclick="if(event.target === this) quickEnrollment.toggleEditMode()">
                <div class="pvd-search-box">
                    <div class="pvd-search-input-group">
                        <i class="fas fa-search"></i>
                        <input type="text" id="studentSearchInput" placeholder="Buscar por nome ou CPF..." onkeyup="quickEnrollment.searchStudent(this.value)">
                    </div>
                    <div id="searchResults" class="pvd-search-results"></div>
                    <div style="text-align: right; margin-top: 1rem;">
                        <button type="button" class="pvd-btn-outline" onclick="quickEnrollment.toggleEditMode()">Fechar</button>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        const form = document.getElementById('quickEnrollmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        // Máscaras de CPF e telefone
        this.setupMasks();
    },

    setupMasks() {
        // CPF masks
        const cpfInputs = document.querySelectorAll('[name="cpf"], [name="fin_cpf"]');
        cpfInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    e.target.value = value;
                }
            });
        });

        // Phone masks
        const phoneInputs = document.querySelectorAll('[name="phone"], [name="fin_phone"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    e.target.value = value;
                }
            });
        });
    },

    // --- CAMERA METHODS ---

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.stream = stream;
            
            const video = document.getElementById('cameraPreview');
            video.srcObject = stream;
            video.style.display = 'block';
            
            document.getElementById('cameraPlaceholder').style.display = 'none';
            document.getElementById('photoPreview').style.display = 'none';
            
            document.getElementById('btnCapture').style.display = 'flex';
            document.getElementById('btnRetake').style.display = 'none';
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Erro ao acessar a câmera. Verifique as permissões.');
        }
    },

    takePhoto() {
        const video = document.getElementById('cameraPreview');
        const canvas = document.getElementById('photoCanvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const photoData = canvas.toDataURL('image/jpeg');
        this.formData.photo = photoData;

        // Show preview
        const img = document.getElementById('photoPreview');
        img.src = photoData;
        img.style.display = 'block';
        video.style.display = 'none';

        // Update controls
        document.getElementById('btnCapture').style.display = 'none';
        document.getElementById('btnRetake').style.display = 'flex';

        this.stopCamera();
    },

    retakePhoto() {
        this.formData.photo = null;
        this.startCamera();
    },

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    },

    // --- QUICK EDIT METHODS ---

    toggleEditMode() {
        const overlay = document.getElementById('searchOverlay');
        if (overlay.style.display === 'none') {
            overlay.style.display = 'flex';
            document.getElementById('studentSearchInput').focus();
        } else {
            overlay.style.display = 'none';
        }
    },

    async searchStudent(term) {
        if (!term || term.length < 3) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        try {
            const response = await this.moduleAPI.request(`/api/students?search=${term}`);
            if (response.success) {
                this.renderSearchResults(response.data);
            }
        } catch (error) {
            console.error('Error searching students:', error);
        }
    },

    renderSearchResults(students) {
        const container = document.getElementById('searchResults');
        if (!students.length) {
            container.innerHTML = '<div class="pvd-search-item">Nenhum aluno encontrado</div>';
            return;
        }

        container.innerHTML = students.map(student => `
            <div class="pvd-search-item" onclick="quickEnrollment.selectStudent('${student.id}')">
                <img src="${student.photoUrl || '/img/default-avatar.png'}" alt="${student.firstName}">
                <div class="pvd-search-info">
                    <h4>${student.firstName} ${student.lastName}</h4>
                    <p>${student.cpf || 'Sem CPF'}</p>
                </div>
            </div>
        `).join('');
    },

    async selectStudent(studentId) {
        try {
            const response = await this.moduleAPI.request(`/api/students/${studentId}`);
            if (response.success) {
                this.loadStudentData(response.data);
                this.toggleEditMode();
            }
        } catch (error) {
            console.error('Error loading student:', error);
            alert('Erro ao carregar dados do aluno');
        }
    },

    loadStudentData(student) {
        this.formData.isEditMode = true;
        this.formData.studentId = student.id;
        this.formData.photo = student.photoUrl;

        const form = document.getElementById('quickEnrollmentForm');
        
        // Fill basic data
        form.querySelector('[name="firstName"]').value = student.firstName;
        form.querySelector('[name="lastName"]').value = student.lastName;
        form.querySelector('[name="cpf"]').value = student.cpf || '';
        form.querySelector('[name="email"]').value = student.email || '';
        form.querySelector('[name="phone"]').value = student.phone || '';
        
        if (student.birthDate) {
            form.querySelector('[name="birthDate"]').value = student.birthDate.split('T')[0];
        }

        // Show photo if exists
        if (student.photoUrl) {
            const img = document.getElementById('photoPreview');
            img.src = student.photoUrl;
            img.style.display = 'block';
            document.getElementById('cameraPlaceholder').style.display = 'none';
            document.getElementById('btnRetake').style.display = 'flex';
        }

        // Update submit button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Matrícula';
        
        alert(`Modo de Edição: ${student.firstName} ${student.lastName}`);
    },

    renderPlans() {
        const container = document.getElementById('plansList');
        if (!container) return;

        container.innerHTML = this.plans.map(plan => `
            <div class="pvd-plan-card ${this.formData.plan?.id === plan.id ? 'selected' : ''}" 
                 onclick="quickEnrollment.selectPlan('${plan.id}')">
                <h3>${plan.name}</h3>
                <div class="pvd-plan-price">R$ ${parseFloat(plan.price).toFixed(2)}</div>
                <div class="pvd-plan-info">
                    ${plan.billingType === 'MONTHLY' ? 'Mensal' : 
                      plan.billingType === 'YEARLY' ? 'Anual' : 
                      plan.billingType}
                </div>
                ${plan.isUnlimitedAccess ? '<span class="pvd-badge">Ilimitado</span>' : ''}
            </div>
        `).join('');
    },

    selectPlan(planId) {
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        this.formData.plan = plan;
        this.renderPlans();

        // Mostrar campo de preço customizado
        document.getElementById('customPriceField').style.display = 'block';

        // Buscar e mostrar curso base do plano
        this.showPlanCourse(plan);
    },

    showPlanCourse(plan) {
        const courseField = document.getElementById('courseField');
        const selectedCourseDiv = document.getElementById('selectedCourse');
        
        // Verificar se o plano tem curso base em features.courseIds
        let courseName = 'Nenhum curso associado';
        if (plan.features?.courseIds && plan.features.courseIds.length > 0) {
            const courseId = plan.features.courseIds[0];
            const course = this.courses.find(c => c.id === courseId);
            if (course) {
                courseName = course.name;
                this.formData.course = course;
            }
        }

        selectedCourseDiv.innerHTML = `
            <div class="pvd-course-badge">
                <i class="fas fa-graduation-cap"></i>
                ${courseName}
            </div>
        `;
        
        courseField.style.display = 'block';
    },

    toggleFinancialResponsible() {
        const fieldsDiv = document.getElementById('financialFields');
        const toggleBtn = document.getElementById('toggleFinancial');
        const isVisible = fieldsDiv.style.display !== 'none';

        if (isVisible) {
            fieldsDiv.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Responsável';
            this.formData.hasFinancialResponsible = false;
        } else {
            fieldsDiv.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-minus"></i> Ocultar Responsável';
            this.formData.hasFinancialResponsible = true;
        }

        // Atualizar labels de campos opcionais
        this.updateOptionalLabels();
    },

    removeFinancialResponsible() {
        const fieldsDiv = document.getElementById('financialFields');
        const toggleBtn = document.getElementById('toggleFinancial');
        
        fieldsDiv.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Responsável';
        this.formData.hasFinancialResponsible = false;

        // Limpar campos
        document.querySelectorAll('[name^="fin_"]').forEach(input => input.value = '');

        // Atualizar labels
        this.updateOptionalLabels();
    },

    updateOptionalLabels() {
        const hasFinancial = this.formData.hasFinancialResponsible;
        
        document.getElementById('cpfOptional').textContent = hasFinancial ? '(opcional)' : '*';
        document.getElementById('phoneOptional').textContent = hasFinancial ? '(opcional)' : '*';
        document.getElementById('emailOptional').textContent = hasFinancial ? '(opcional)' : '*';

        // Atualizar required attribute
        document.getElementById('studentCpf').required = !hasFinancial;
        document.getElementById('studentPhone').required = !hasFinancial;
        document.getElementById('studentEmail').required = !hasFinancial;
    },

    async submitForm() {
        const form = document.getElementById('quickEnrollmentForm');
        const submitBtn = document.getElementById('submitBtn');

        // Validações
        if (!this.formData.plan) {
            alert('⚠️ Selecione um plano!');
            return;
        }

        const firstName = form.querySelector('[name="firstName"]')?.value?.trim();
        const lastName = form.querySelector('[name="lastName"]')?.value?.trim();
        
        if (!firstName || !lastName) {
            alert('⚠️ Nome e sobrenome são obrigatórios!');
            return;
        }

        // Validar campos obrigatórios com base em ter ou não responsável financeiro
        if (!this.formData.hasFinancialResponsible) {
            const cpf = form.querySelector('[name="cpf"]')?.value?.trim();
            const phone = form.querySelector('[name="phone"]')?.value?.trim();
            const email = form.querySelector('[name="email"]')?.value?.trim();

            if (!cpf || !phone || !email) {
                alert('⚠️ Sem responsável financeiro: CPF, telefone e email do aluno são obrigatórios!');
                return;
            }
        } else {
            // Validar campos do responsável financeiro
            const finName = form.querySelector('[name="fin_name"]')?.value?.trim();
            const finCpf = form.querySelector('[name="fin_cpf"]')?.value?.trim();
            const finPhone = form.querySelector('[name="fin_phone"]')?.value?.trim();
            const finEmail = form.querySelector('[name="fin_email"]')?.value?.trim();

            if (!finName || !finCpf || !finPhone || !finEmail) {
                alert('⚠️ Todos os campos do responsável financeiro são obrigatórios!');
                return;
            }
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

            // Preparar dados do aluno
            const birthDateValue = form.querySelector('[name="birthDate"]')?.value;
            let birthDate = null;
            if (birthDateValue) {
                const date = new Date(birthDateValue);
                if (!isNaN(date.getTime())) {
                    birthDate = date.toISOString();
                }
            }

            const customPrice = form.querySelector('[name="customPrice"]')?.value;
            const finalPrice = customPrice ? parseFloat(customPrice) : parseFloat(this.formData.plan.price);

            const studentPayload = {
                firstName: firstName,
                lastName: lastName,
                cpf: form.querySelector('[name="cpf"]')?.value?.replace(/\D/g, '') || null,
                phone: form.querySelector('[name="phone"]')?.value?.replace(/\D/g, '') || null,
                email: form.querySelector('[name="email"]')?.value?.trim() || null,
                birthDate: birthDate,
                photoUrl: this.formData.photo,
                enrollment: { 
                    packageId: this.formData.plan.id,
                    customPrice: finalPrice
                }
            };

            let studentId;

            if (this.formData.isEditMode && this.formData.studentId) {
                // UPDATE MODE
                console.log('📤 Updating student...', studentPayload);
                const studentRes = await this.moduleAPI.request(`/api/students/${this.formData.studentId}`, {
                    method: 'PUT',
                    body: JSON.stringify(studentPayload)
                });

                if (!studentRes.success) {
                    throw new Error(studentRes.message || 'Erro ao atualizar aluno');
                }
                studentId = this.formData.studentId;
                console.log('✅ Student updated:', studentId);
            } else {
                // CREATE MODE
                console.log('📤 Creating student...', studentPayload);
                const studentRes = await this.moduleAPI.request('/api/students', {
                    method: 'POST',
                    body: JSON.stringify(studentPayload)
                });

                if (!studentRes.success) {
                    throw new Error(studentRes.message || 'Erro ao criar aluno');
                }
                studentId = studentRes.data.id;
                console.log('✅ Student created:', studentId);
            }

            // 2. Criar responsável financeiro se necessário
            if (this.formData.hasFinancialResponsible) {
                const finBirthDateValue = form.querySelector('[name="fin_birthDate"]')?.value;
                let finBirthDate = null;
                if (finBirthDateValue) {
                    const date = new Date(finBirthDateValue);
                    if (!isNaN(date.getTime())) {
                        finBirthDate = date.toISOString();
                    }
                }

                const financialPayload = {
                    name: form.querySelector('[name="fin_name"]')?.value?.trim(),
                    cpf: form.querySelector('[name="fin_cpf"]')?.value?.replace(/\D/g, ''),
                    email: form.querySelector('[name="fin_email"]')?.value?.trim(),
                    phone: form.querySelector('[name="fin_phone"]')?.value?.replace(/\D/g, ''),
                    birthDate: finBirthDate,
                    studentIds: [studentId]
                };

                console.log('📤 Creating financial responsible...', financialPayload);
                const finRes = await this.moduleAPI.request('/api/financial-responsible', {
                    method: 'POST',
                    body: JSON.stringify(financialPayload)
                });

                if (!finRes.success) {
                    console.warn('⚠️ Falha ao criar responsável financeiro:', finRes.message);
                }
            }

            // 3. Matricular no curso se existir
            if (this.formData.course) {
                const enrollmentPayload = {
                    courseId: this.formData.course.id
                };

                console.log('📤 Enrolling in course...', enrollmentPayload);
                const courseRes = await this.moduleAPI.request(`/api/students/${studentId}/courses`, {
                    method: 'POST',
                    body: JSON.stringify(enrollmentPayload)
                });

                if (courseRes.success) {
                    console.log('✅ Student enrolled in course');
                }
            }

            // 4. Sucesso!
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Matrícula Concluída!';
            submitBtn.classList.add('success');

            setTimeout(() => {
                alert(`✅ Matrícula realizada com sucesso!\n\nAluno: ${firstName} ${lastName}\nPlano: ${this.formData.plan.name}\n${this.formData.course ? `Curso: ${this.formData.course.name}` : ''}`);
                
                // Resetar formulário
                form.reset();
                this.formData = { 
                    plan: null, 
                    course: null, 
                    hasFinancialResponsible: false,
                    photo: null,
                    isEditMode: false,
                    studentId: null
                };

                // Reset Photo UI
                const photoPreview = document.getElementById('photoPreview');
                if (photoPreview) photoPreview.style.display = 'none';
                
                const cameraPlaceholder = document.getElementById('cameraPlaceholder');
                if (cameraPlaceholder) cameraPlaceholder.style.display = 'flex';
                
                const btnRetake = document.getElementById('btnRetake');
                if (btnRetake) btnRetake.style.display = 'none';
                
                const btnCapture = document.getElementById('btnCapture');
                if (btnCapture) btnCapture.style.display = 'none';

                this.renderPlans();
                document.getElementById('customPriceField').style.display = 'none';
                document.getElementById('courseField').style.display = 'none';
                document.getElementById('financialFields').style.display = 'none';
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar Matrícula';
                submitBtn.classList.remove('success');

                // Navegar para estudantes
                if (window.router) {
                    window.router.navigateTo('students');
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Error submitting form:', error);
            alert('❌ Erro ao processar matrícula: ' + error.message);
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar Matrícula';
        }
    }
};

// Export with both names for compatibility
window.QuickEnrollment = QuickEnrollment;
window.quickEnrollment = QuickEnrollment;

} // end if
