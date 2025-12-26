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
        hasFinancialResponsible: false
    },
    plans: [],
    courses: [],

    async init() {
        console.log('🚀 QuickEnrollment init (Simplified v3.0)');
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
        this.container.innerHTML = `
            <div class="pvd-container">
                <div class="pvd-header">
                    <h1>📝 Matrícula Rápida</h1>
                    <p>Cadastro simplificado em uma única tela</p>
                </div>

                <form class="pvd-form-simplified" id="quickEnrollmentForm">
                    
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
                photoUrl: null,
                enrollment: { 
                    packageId: this.formData.plan.id,
                    customPrice: finalPrice
                }
            };

            console.log('📤 Creating student...', studentPayload);
            const studentRes = await this.moduleAPI.request('/api/students', {
                method: 'POST',
                body: JSON.stringify(studentPayload)
            });

            if (!studentRes.success) {
                throw new Error(studentRes.message || 'Erro ao criar aluno');
            }
            
            const studentId = studentRes.data.id;
            console.log('✅ Student created:', studentId);

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
                    studentId: studentId,
                    courseId: this.formData.course.id,
                    startDate: new Date().toISOString()
                };

                console.log('📤 Enrolling in course...', enrollmentPayload);
                const courseRes = await this.moduleAPI.request('/api/courses/enroll', {
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
                this.formData = { plan: null, course: null, hasFinancialResponsible: false };
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

window.QuickEnrollment = QuickEnrollment;

} // end if
