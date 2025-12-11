import { safeNavigateTo } from '../../../shared/utils/navigation.js';

export class TurmasStudentsView {
    constructor(service, controller) {
        this.service = service;
        this.controller = controller;
        this.api = service.api; // ✅ API do service
        this.container = null;
        this.currentTurma = null;
        this.students = [];
        this.allStudents = [];
        this.events = {
            onBack: null,
            onStudentUpdate: null
        };
    }

    render(container, turma) {
        this.container = container;
        this.currentTurma = turma;
        
        // Registrar instância globalmente para callbacks inline
        window.turmasStudentsView = this;
        
        container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header com navegação -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-header-nav">
                            <button id="backToDetail" class="btn-back">
                                <span class="icon">←</span>
                                <span>Voltar</span>
                            </button>
                            <div class="breadcrumb">
                                <span>Turmas</span>
                                <span>/</span>
                                <span>${turma.course?.name || 'Curso'}</span>
                                <span>/</span>
                                <span>Alunos</span>
                            </div>
                        </div>
                        <h1>👥 Alunos da Turma</h1>
                        <p>Gerencie as matrículas e acompanhe o progresso dos alunos</p>
                    </div>
                </div>

                <!-- Informações da turma -->
                <div class="turma-info-bar">
                    <div class="turma-basic-info">
                        <h3>${turma.course?.name || 'Curso'}</h3>
                        <p><strong>Instrutor:</strong> ${turma.instructor?.name || 'Não definido'}</p>
                        <p><strong>Período:</strong> ${this.formatDate(turma.startDate)} - ${this.formatDate(turma.endDate)}</p>
                        <p><strong>Status:</strong> ${this.getStatusText(turma.status)}</p>
                    </div>
                    <div class="turma-stats">
                        <div class="stat-item">
                            <span class="stat-value" id="totalStudents">0</span>
                            <span class="stat-label">Total de Alunos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="activeStudents">0</span>
                            <span class="stat-label">Ativos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="avgAttendance">0%</span>
                            <span class="stat-label">Frequência Média</span>
                        </div>
                    </div>
                </div>

                <!-- Controles e filtros -->
                <div class="students-controls">
                    <div class="controls-left">
                        <div class="search-container">
                            <input type="text" id="searchStudents" placeholder="🔍 Buscar alunos..." class="search-input">
                        </div>
                        <div class="filter-container">
                            <select id="statusFilter" class="filter-select">
                                <option value="">Todos os status</option>
                                <option value="active">Ativos</option>
                                <option value="inactive">Inativos</option>
                                <option value="pending">Pendentes</option>
                            </select>
                        </div>
                    </div>
                    <div class="controls-right">
                        <button id="addStudent" class="btn-action btn-primary">
                            <span>➕</span>
                            <span>Adicionar Aluno</span>
                        </button>
                        <button id="importStudents" class="btn-action">
                            <span>📥</span>
                            <span>Importar</span>
                        </button>
                        <button id="exportStudents" class="btn-action">
                            <span>📊</span>
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                <!-- Lista de alunos -->
                <div class="students-list-container">
                    <div id="studentsList" class="students-grid">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                    
                    <!-- Estado vazio -->
                    <div id="emptyState" class="empty-state" style="display: none;">
                        <div class="empty-icon">👥</div>
                        <h3>Nenhum aluno matriculado</h3>
                        <p>Adicione alunos à turma para começar as aulas</p>
                        <button class="btn-action btn-primary" onclick="document.getElementById('addStudent').click()">
                            <span>➕</span>
                            <span>Adicionar Primeiro Aluno</span>
                        </button>
                    </div>
                    
                    <!-- Loading -->
                    <div id="loadingState" class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Carregando alunos...</p>
                    </div>
                </div>

                <!-- Dialog para adicionar/editar aluno -->
                <div id="studentDialog" class="selector-overlay" style="display: none;">
                    <div class="selector-container">
                        <div class="selector-header">
                            <h3 id="dialogTitle">Adicionar Aluno</h3>
                            <button id="closeDialog" class="selector-close">×</button>
                        </div>
                        <div class="selector-body">
                            <div class="student-selection">
                                <div class="form-group">
                                    <label for="studentSelect">Selecionar Aluno</label>
                                    <select id="studentSelect" class="form-input">
                                        <option value="">Carregando alunos...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="enrollmentDate">Data de Matrícula</label>
                                    <input type="date" id="enrollmentDate" class="form-input" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="studentStatus">Status</label>
                                    <select id="studentStatus" class="form-input" required>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="pending">Pendente</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="notes">Observações</label>
                                    <textarea id="notes" class="form-input" rows="3" placeholder="Observações sobre a matrícula..."></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="selector-footer">
                            <button id="dialogCancel" class="btn-secondary">Cancelar</button>
                            <button id="dialogSave" class="btn-primary">
                                <span id="saveText">Adicionar</span>
                                <div id="saveLoading" class="btn-loading" style="display: none;"></div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Dialog de confirmação -->
                <div id="confirmDialog" class="selector-overlay" style="display: none;">
                    <div class="selector-container">
                        <div class="selector-header">
                            <h3 id="confirmTitle">Confirmar Ação</h3>
                            <button id="closeConfirmDialog" class="selector-close">×</button>
                        </div>
                        <div class="selector-body">
                            <p id="confirmMessage">Tem certeza que deseja realizar esta ação?</p>
                        </div>
                        <div class="selector-footer">
                            <button id="confirmCancel" class="btn-secondary">Cancelar</button>
                            <button id="confirmOk" class="btn-danger">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Navegação
        const backBtn = this.container.querySelector('#backToDetail');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.events.onBack) {
                    this.events.onBack();
                }
            });
        }

        // Busca e filtros
        const searchInput = this.container.querySelector('#searchStudents');
        const statusFilter = this.container.querySelector('#statusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterStudents());
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterStudents());
        }

        // Ações principais
        const addBtn = this.container.querySelector('#addStudent');
        const importBtn = this.container.querySelector('#importStudents');
        const exportBtn = this.container.querySelector('#exportStudents');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddStudentDialog());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => this.importStudents());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStudents());
        }

        // Dialog eventos
        this.setupDialogEvents();
    }

    setupDialogEvents() {
        // Dialog principal
        const dialog = this.container.querySelector('#studentDialog');
        const closeDialog = this.container.querySelector('#closeDialog');
        const dialogCancel = this.container.querySelector('#dialogCancel');
        const dialogSave = this.container.querySelector('#dialogSave');

        if (closeDialog) {
            closeDialog.addEventListener('click', () => this.hideDialog());
        }

        if (dialogCancel) {
            dialogCancel.addEventListener('click', () => this.hideDialog());
        }

        if (dialogSave) {
            dialogSave.addEventListener('click', () => this.saveStudent());
        }

        // Dialog de confirmação
        const confirmDialog = this.container.querySelector('#confirmDialog');
        const closeConfirmDialog = this.container.querySelector('#closeConfirmDialog');
        const confirmCancel = this.container.querySelector('#confirmCancel');

        if (closeConfirmDialog) {
            closeConfirmDialog.addEventListener('click', () => this.hideConfirmDialog());
        }

        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => this.hideConfirmDialog());
        }

        // Fechar dialog clicando fora
        dialog?.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.hideDialog();
            }
        });

        confirmDialog?.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                this.hideConfirmDialog();
            }
        });
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Carregar alunos da turma e todos os alunos disponíveis
            const [turmaStudents, allStudents] = await Promise.all([
                this.loadTurmaStudents(),
                this.loadAllStudents()
            ]);
            
            this.students = turmaStudents || [];
            this.allStudents = allStudents || [];
            
            this.renderStudents();
            this.updateStats();
            this.populateStudentSelect();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados dos alunos');
        } finally {
            this.hideLoading();
        }
    }

    async loadTurmaStudents() {
        try {
            const response = await this.api.request(`/api/turmas/${this.currentTurma.id}/students`);
            return response.data || [];
        } catch (error) {
            console.error('Erro ao carregar alunos da turma:', error);
            return [];
        }
    }

    async loadAllStudents() {
        try {
            const response = await this.api.request('/api/students');
            return response.data || [];
        } catch (error) {
            console.error('Erro ao carregar todos os alunos:', error);
            return [];
        }
    }

    renderStudents() {
        const container = this.container.querySelector('#studentsList');
        const emptyState = this.container.querySelector('#emptyState');
        
        if (!this.students || this.students.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        const filteredStudents = this.getFilteredStudents();
        
        container.innerHTML = filteredStudents.map(studentData => {
            const student = studentData.student || studentData;
            const enrollment = studentData.enrollment || studentData;
            
            return `
                <div class="student-card" data-student-id="${student.id}">
                    <div class="student-card-header">
                        <div class="student-avatar">
                            <span>${this.getInitials(student.name)}</span>
                        </div>
                        <div class="student-info">
                            <h4>${student.name}</h4>
                            <p>${student.email || 'Email não informado'}</p>
                        </div>
                        <div class="student-status status-${enrollment.status || 'active'}">
                            ${this.getStatusText(enrollment.status || 'active')}
                        </div>
                    </div>
                    
                    <div class="student-card-body">
                        <div class="student-stats">
                            <div class="stat-item">
                                <span class="stat-label">Matrícula</span>
                                <span class="stat-value">${this.formatDate(enrollment.enrollmentDate || enrollment.createdAt)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Frequência</span>
                                <span class="stat-value">${enrollment.attendanceRate || 0}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Aulas</span>
                                <span class="stat-value">${enrollment.attendedLessons || 0}/${enrollment.totalLessons || 0}</span>
                            </div>
                        </div>
                        
                        ${enrollment.notes ? `
                            <div class="student-notes">
                                <p><strong>Observações:</strong> ${enrollment.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="student-card-actions">
                        <button class="btn-action btn-small" onclick="window.turmasStudentsView.viewStudent('${student.id}')">
                            <span>👁️</span>
                            <span>Ver</span>
                        </button>
                        <button class="btn-action btn-small" onclick="window.turmasStudentsView.editStudent('${student.id}')">
                            <span>✏️</span>
                            <span>Editar</span>
                        </button>
                        <button class="btn-action btn-small btn-warning" onclick="window.turmasStudentsView.removeStudent('${student.id}')">
                            <span>🗑️</span>
                            <span>Remover</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getFilteredStudents() {
        const searchTerm = this.container.querySelector('#searchStudents')?.value?.toLowerCase() || '';
        const statusFilter = this.container.querySelector('#statusFilter')?.value || '';
        
        return this.students.filter(studentData => {
            const student = studentData.student || studentData;
            const enrollment = studentData.enrollment || studentData;
            
            const matchesSearch = !searchTerm || 
                student.name?.toLowerCase().includes(searchTerm) ||
                student.email?.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || 
                (enrollment.status || 'active') === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }

    filterStudents() {
        this.renderStudents();
    }

    updateStats() {
        const totalElement = this.container.querySelector('#totalStudents');
        const activeElement = this.container.querySelector('#activeStudents');
        const avgAttendanceElement = this.container.querySelector('#avgAttendance');
        
        const total = this.students.length;
        const active = this.students.filter(s => (s.enrollment?.status || s.status || 'active') === 'active').length;
        const avgAttendance = this.students.length > 0 
            ? Math.round(this.students.reduce((sum, s) => sum + (s.enrollment?.attendanceRate || s.attendanceRate || 0), 0) / this.students.length)
            : 0;
        
        if (totalElement) totalElement.textContent = total;
        if (activeElement) activeElement.textContent = active;
        if (avgAttendanceElement) avgAttendanceElement.textContent = `${avgAttendance}%`;
    }

    populateStudentSelect() {
        const select = this.container.querySelector('#studentSelect');
        if (!select) return;
        
        // Filtrar alunos que já não estão na turma
        const enrolledIds = this.students.map(s => (s.student?.id || s.id));
        const availableStudents = this.allStudents.filter(s => !enrolledIds.includes(s.id));
        
        select.innerHTML = `
            <option value="">Selecione um aluno</option>
            ${availableStudents.map(student => `
                <option value="${student.id}">${student.name} (${student.email || 'Sem email'})</option>
            `).join('')}
        `;
    }

    showAddStudentDialog() {
        const dialog = this.container.querySelector('#studentDialog');
        const title = this.container.querySelector('#dialogTitle');
        const saveText = this.container.querySelector('#saveText');
        
        // Resetar formulário
        this.container.querySelector('#studentSelect').value = '';
        this.container.querySelector('#enrollmentDate').value = new Date().toISOString().split('T')[0];
        this.container.querySelector('#studentStatus').value = 'active';
        this.container.querySelector('#notes').value = '';
        
        title.textContent = 'Adicionar Aluno';
        saveText.textContent = 'Adicionar';
        
        dialog.style.display = 'flex';
        
        // Focar no select
        setTimeout(() => {
            this.container.querySelector('#studentSelect').focus();
        }, 100);
    }

    async saveStudent() {
        const studentId = this.container.querySelector('#studentSelect').value;
        const enrollmentDate = this.container.querySelector('#enrollmentDate').value;
        const status = this.container.querySelector('#studentStatus').value;
        const notes = this.container.querySelector('#notes').value;
        
        if (!studentId) {
            this.showError('Por favor, selecione um aluno');
            return;
        }
        
        if (!enrollmentDate) {
            this.showError('Por favor, informe a data de matrícula');
            return;
        }
        
        try {
            this.showSaveLoading();
            
            await this.api.request(`/api/turmas/${this.currentTurma.id}/students`, {
                method: 'POST',
                body: JSON.stringify({
                    studentId,
                    enrollmentDate,
                    status,
                    notes
                })
            });
            
            this.showSuccess('Aluno adicionado com sucesso');
            this.hideDialog();
            this.loadData(); // Recarregar dados
            
        } catch (error) {
            console.error('Erro ao adicionar aluno:', error);
            this.showError('Erro ao adicionar aluno à turma');
        } finally {
            this.hideSaveLoading();
        }
    }

    removeStudent(studentId) {
        const student = this.students.find(s => (s.student?.id || s.id) === studentId);
        const studentName = student?.student?.name || student?.name || 'aluno';
        
        this.showConfirmDialog(
            'Remover Aluno',
            `Tem certeza que deseja remover ${studentName} desta turma? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    await this.api.request(`/api/turmas/${this.currentTurma.id}/students/${studentId}`, {
                        method: 'DELETE'
                    });
                    
                    this.showSuccess('Aluno removido da turma');
                    this.loadData(); // Recarregar dados
                    
                } catch (error) {
                    console.error('Erro ao remover aluno:', error);
                    this.showError('Erro ao remover aluno da turma');
                }
            }
        );
    }

    viewStudent(studentId) {
        // Navegar para detalhes do aluno
        safeNavigateTo(`students/detail/${studentId}`, {
            context: 'turmas:students:viewStudent'
        });
    }

    editStudent(studentId) {
        // Implementar edição de matrícula
        console.log('Editar aluno:', studentId);
    }

    async importStudents() {
        // Implementar importação de alunos
        this.showError('Funcionalidade de importação em desenvolvimento');
    }

    async exportStudents() {
        try {
            const data = {
                turma: this.currentTurma,
                students: this.students,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alunos-turma-${this.currentTurma.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Lista de alunos exportada com sucesso');
        } catch (error) {
            console.error('Erro ao exportar alunos:', error);
            this.showError('Erro ao exportar lista de alunos');
        }
    }

    // Métodos de UI auxiliares
    showDialog() {
        const dialog = this.container.querySelector('#studentDialog');
        if (dialog) dialog.style.display = 'flex';
    }

    hideDialog() {
        const dialog = this.container.querySelector('#studentDialog');
        if (dialog) dialog.style.display = 'none';
    }

    showConfirmDialog(title, message, onConfirm) {
        const dialog = this.container.querySelector('#confirmDialog');
        const titleElement = dialog.querySelector('#confirmTitle');
        const messageElement = dialog.querySelector('#confirmMessage');
        const confirmBtn = dialog.querySelector('#confirmOk');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Remove listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmDialog();
            onConfirm();
        });
        
        dialog.style.display = 'flex';
    }

    hideConfirmDialog() {
        const dialog = this.container.querySelector('#confirmDialog');
        if (dialog) dialog.style.display = 'none';
    }

    showLoading() {
        const loading = this.container.querySelector('#loadingState');
        const list = this.container.querySelector('#studentsList');
        const empty = this.container.querySelector('#emptyState');
        
        if (loading) loading.style.display = 'flex';
        if (list) list.style.display = 'none';
        if (empty) empty.style.display = 'none';
    }

    hideLoading() {
        const loading = this.container.querySelector('#loadingState');
        if (loading) loading.style.display = 'none';
    }

    showSaveLoading() {
        const saveText = this.container.querySelector('#saveText');
        const saveLoading = this.container.querySelector('#saveLoading');
        const saveBtn = this.container.querySelector('#dialogSave');
        
        if (saveText) saveText.style.display = 'none';
        if (saveLoading) saveLoading.style.display = 'inline-block';
        if (saveBtn) saveBtn.disabled = true;
    }

    hideSaveLoading() {
        const saveText = this.container.querySelector('#saveText');
        const saveLoading = this.container.querySelector('#saveLoading');
        const saveBtn = this.container.querySelector('#dialogSave');
        
        if (saveText) saveText.style.display = 'inline';
        if (saveLoading) saveLoading.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
    }

    showSuccess(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    // Utility methods
    formatDate(date) {
        if (!date) return 'Não informado';
        return new Date(date).toLocaleDateString('pt-BR');
    }

    getStatusText(status) {
        switch (status) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'pending': return 'Pendente';
            default: return 'Indefinido';
        }
    }

    getInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Métodos públicos para eventos
    onBack(callback) {
        this.events.onBack = callback;
    }

    onStudentUpdate(callback) {
        this.events.onStudentUpdate = callback;
    }
}

// Tornar classe disponível globalmente (não instanciar ainda)
window.TurmasStudentsView = TurmasStudentsView;
