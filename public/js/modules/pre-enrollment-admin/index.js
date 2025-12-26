// /public/js/modules/pre-enrollment-admin/index.js
// Módulo de Administração de Pré-Matrículas

if (typeof window.PreEnrollmentAdmin !== 'undefined') {
    console.log('PreEnrollmentAdmin already loaded');
} else {

const PreEnrollmentAdmin = {
    container: null,
    moduleAPI: null,
    preEnrollments: [],
    plans: [],
    courses: [],

    async init() {
        console.log('🚀 PreEnrollmentAdmin init');
        await this.initializeAPI();
        this.loadCSS();
        this.render();
        await this.loadData();
        this.setupEvents();
        
        window.preEnrollmentAdmin = this;
        window.app?.dispatchEvent('module:loaded', { name: 'preEnrollmentAdmin' });
    },

    async initializeAPI() {
        if (window.createModuleAPI) {
            this.moduleAPI = window.createModuleAPI('PreEnrollmentAdmin');
        }
    },

    loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/pre-enrollment-admin.css';
        document.head.appendChild(link);
    },

    async loadData() {
        try {
            // Load pre-enrollments
            const preEnrollResponse = await this.moduleAPI.request('/api/pre-enrollment');
            if (preEnrollResponse.success) {
                this.preEnrollments = preEnrollResponse.data;
                this.renderPreEnrollments();
            }

            // Load plans
            const plansResponse = await this.moduleAPI.request('/api/billing-plans');
            if (plansResponse.success) {
                this.plans = plansResponse.data.filter(p => p.isActive);
            }

            // Load courses
            const coursesResponse = await this.moduleAPI.request('/api/courses');
            if (coursesResponse.success) {
                this.courses = coursesResponse.data;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    render() {
        this.container.innerHTML = `
            <div class="pre-enrollment-admin">
                <div class="admin-header">
                    <h1>📝 Pré-Matrículas & Links Públicos</h1>
                    <button class="btn-primary" onclick="preEnrollmentAdmin.showGenerateLinkModal()">
                        <i class="fas fa-link"></i> Gerar Link de Matrícula
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="stats-cards">
                    <div class="stat-card">
                        <div class="stat-icon pending">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="pendingCount">0</h3>
                            <p>Pendentes</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon converted">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="convertedCount">0</h3>
                            <p>Convertidas</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon total">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalCount">0</h3>
                            <p>Total</p>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters">
                    <input type="text" id="searchInput" placeholder="🔍 Buscar por nome, CPF ou email">
                    <select id="statusFilter">
                        <option value="">Todos os status</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="CONVERTED">Convertidas</option>
                        <option value="REJECTED">Rejeitadas</option>
                    </select>
                </div>

                <!-- Pre-Enrollments List -->
                <div id="preEnrollmentsList" class="pre-enrollments-list"></div>
            </div>

            <!-- Modal Generate Link -->
            <div id="generateLinkModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h2>🔗 Gerar Link de Matrícula</h2>
                    
                    <div class="form-group">
                        <label>Plano *</label>
                        <select id="modalPlan" required></select>
                    </div>

                    <div class="form-group">
                        <label>Curso (opcional)</label>
                        <select id="modalCourse">
                            <option value="">Nenhum</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Preço Customizado</label>
                        <input type="number" id="modalPrice" step="0.01" placeholder="Deixe em branco para usar o valor padrão">
                    </div>

                    <div class="form-group">
                        <label>Válido por (dias)</label>
                        <input type="number" id="modalExpires" value="30" min="1">
                    </div>

                    <div id="generatedLinkContainer" style="display: none;">
                        <div class="generated-link">
                            <label>Link Gerado:</label>
                            <div class="link-display">
                                <input type="text" id="generatedLink" readonly>
                                <button onclick="preEnrollmentAdmin.copyLink()" class="btn-copy">
                                    <i class="fas fa-copy"></i> Copiar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="modal-buttons">
                        <button class="btn-secondary" onclick="preEnrollmentAdmin.closeModal()">Fechar</button>
                        <button class="btn-primary" onclick="preEnrollmentAdmin.generateLink()">
                            <i class="fas fa-link"></i> Gerar Link
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        document.getElementById('searchInput').addEventListener('input', () => this.filterPreEnrollments());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterPreEnrollments());
    },

    renderPreEnrollments() {
        const container = document.getElementById('preEnrollmentsList');
        if (!container) return;

        const pending = this.preEnrollments.filter(p => p.status === 'PENDING');
        const converted = this.preEnrollments.filter(p => p.status === 'CONVERTED');
        
        document.getElementById('pendingCount').textContent = pending.length;
        document.getElementById('convertedCount').textContent = converted.length;
        document.getElementById('totalCount').textContent = this.preEnrollments.length;

        if (this.preEnrollments.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma pré-matrícula encontrada</div>';
            return;
        }

        container.innerHTML = this.preEnrollments.map(pre => `
            <div class="pre-enrollment-card status-${pre.status.toLowerCase()}">
                <div class="card-header">
                    <div class="student-info">
                        ${pre.photoUrl ? `<img src="${pre.photoUrl}" class="student-photo">` : '<div class="photo-placeholder"><i class="fas fa-user"></i></div>'}
                        <div>
                            <h3>${pre.firstName} ${pre.lastName}</h3>
                            <p class="email">${pre.email}</p>
                        </div>
                    </div>
                    <span class="status-badge ${pre.status.toLowerCase()}">${this.getStatusLabel(pre.status)}</span>
                </div>

                <div class="card-body">
                    <div class="info-row">
                        <span><i class="fas fa-id-card"></i> ${this.formatCPF(pre.cpf)}</span>
                        <span><i class="fas fa-phone"></i> ${this.formatPhone(pre.phone)}</span>
                    </div>

                    ${pre.plan ? `
                        <div class="plan-info">
                            <i class="fas fa-box"></i>
                            <strong>${pre.plan.name}</strong>
                            <span class="price">R$ ${parseFloat(pre.customPrice || pre.plan.price).toFixed(2)}</span>
                        </div>
                    ` : ''}

                    ${pre.course ? `
                        <div class="course-info">
                            <i class="fas fa-graduation-cap"></i> ${pre.course.name}
                        </div>
                    ` : ''}

                    <div class="timestamp">
                        <i class="fas fa-clock"></i> ${new Date(pre.createdAt).toLocaleString('pt-BR')}
                    </div>
                </div>

                ${pre.status === 'PENDING' ? `
                    <div class="card-actions">
                        <button class="btn-success" onclick="preEnrollmentAdmin.convertToStudent('${pre.id}')">
                            <i class="fas fa-check"></i> Converter em Aluno
                        </button>
                        <button class="btn-danger" onclick="preEnrollmentAdmin.rejectPreEnrollment('${pre.id}')">
                            <i class="fas fa-times"></i> Rejeitar
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    filterPreEnrollments() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const status = document.getElementById('statusFilter').value;

        const filtered = this.preEnrollments.filter(pre => {
            const matchesSearch = !search || 
                pre.firstName.toLowerCase().includes(search) ||
                pre.lastName.toLowerCase().includes(search) ||
                pre.email.toLowerCase().includes(search) ||
                pre.cpf.includes(search);
            
            const matchesStatus = !status || pre.status === status;

            return matchesSearch && matchesStatus;
        });

        // Re-render with filtered data
        const temp = this.preEnrollments;
        this.preEnrollments = filtered;
        this.renderPreEnrollments();
        this.preEnrollments = temp;
    },

    async convertToStudent(id) {
        if (!confirm('Converter esta pré-matrícula em aluno ativo?')) return;

        try {
            const response = await this.moduleAPI.request(`/api/pre-enrollment/${id}/convert`, {
                method: 'POST'
            });

            if (response.success) {
                alert('✅ Pré-matrícula convertida com sucesso!');
                await this.loadData();
            }
        } catch (error) {
            alert('Erro ao converter: ' + error.message);
        }
    },

    async rejectPreEnrollment(id) {
        if (!confirm('Rejeitar esta pré-matrícula?')) return;

        try {
            const response = await this.moduleAPI.request(`/api/pre-enrollment/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                alert('Pré-matrícula rejeitada');
                await this.loadData();
            }
        } catch (error) {
            alert('Erro ao rejeitar: ' + error.message);
        }
    },

    showGenerateLinkModal() {
        // Populate plans
        const planSelect = document.getElementById('modalPlan');
        planSelect.innerHTML = this.plans.map(p => 
            `<option value="${p.id}">${p.name} - R$ ${parseFloat(p.price).toFixed(2)}</option>`
        ).join('');

        // Populate courses
        const courseSelect = document.getElementById('modalCourse');
        courseSelect.innerHTML = '<option value="">Nenhum</option>' + 
            this.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        document.getElementById('generateLinkModal').style.display = 'flex';
        document.getElementById('generatedLinkContainer').style.display = 'none';
    },

    closeModal() {
        document.getElementById('generateLinkModal').style.display = 'none';
    },

    async generateLink() {
        try {
            const planId = document.getElementById('modalPlan').value;
            const courseId = document.getElementById('modalCourse').value;
            const customPrice = document.getElementById('modalPrice').value;
            const expiresIn = parseInt(document.getElementById('modalExpires').value);

            const response = await this.moduleAPI.request('/api/pre-enrollment/generate-link', {
                method: 'POST',
                body: JSON.stringify({
                    planId,
                    courseId: courseId || undefined,
                    customPrice: customPrice ? parseFloat(customPrice) : undefined,
                    expiresIn
                })
            });

            if (response.success) {
                document.getElementById('generatedLink').value = response.data.url;
                document.getElementById('generatedLinkContainer').style.display = 'block';
            }
        } catch (error) {
            alert('Erro ao gerar link: ' + error.message);
        }
    },

    copyLink() {
        const input = document.getElementById('generatedLink');
        input.select();
        document.execCommand('copy');
        alert('✅ Link copiado!');
    },

    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    formatPhone(phone) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    },

    getStatusLabel(status) {
        const labels = {
            PENDING: 'Pendente',
            CONVERTED: 'Convertida',
            REJECTED: 'Rejeitada'
        };
        return labels[status] || status;
    }
};

window.PreEnrollmentAdmin = PreEnrollmentAdmin;
window.preEnrollmentAdmin = PreEnrollmentAdmin;

} // end if
