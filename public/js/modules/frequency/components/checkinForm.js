/**
 * CheckinForm - Componente para formulário de check-in
 */

export class CheckinForm {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            enableQRScanner: true,
            showNotes: true,
            ...options
        };
        
        this.students = [];
        this.sessions = [];
        
        console.log('📝 CheckinForm initialized');
    }

    /**
     * Renderizar formulário
     */
    render(students = [], sessions = []) {
        this.students = students;
        this.sessions = sessions;
        
        this.container.innerHTML = this.getHTML();
        this.bindEvents();
        
        // Popular selects
        this.populateStudentSelect();
        this.populateSessionSelect();
    }

    /**
     * HTML do formulário
     */
    getHTML() {
        return `
            <div class="checkin-form-container data-card-premium">
                <div class="form-header">
                    <h3>✅ Registrar Presença</h3>
                    <p>Selecione o aluno e a sessão para confirmar a presença</p>
                </div>

                <form id="checkin-form" class="checkin-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="studentSearch">👤 Aluno *</label>
                            <input 
                                type="text" 
                                id="studentSearch" 
                                placeholder="Digite o nome do aluno..."
                                autocomplete="off"
                                required
                            />
                            <input type="hidden" id="studentId" name="studentId" />
                            <div id="student-suggestions" class="autocomplete-suggestions"></div>
                            ${this.options.enableQRScanner ? `
                                <button type="button" class="btn-qr" id="scan-student">
                                    📷 Escanear QR
                                </button>
                            ` : ''}
                        </div>

                        <div class="form-group">
                            <label for="sessionDate">📅 Data da Aula *</label>
                            <input 
                                type="date" 
                                id="sessionDate" 
                                name="sessionDate" 
                                required
                                max="${new Date().toISOString().split('T')[0]}"
                            />
                            <small class="form-hint">Selecione a data da aula (incluindo aulas passadas)</small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="sessionId">🏃 Sessão *</label>
                            <select id="sessionId" name="sessionId" required disabled>
                                <option value="">Primeiro selecione uma data...</option>
                            </select>
                            <small class="form-hint" id="session-hint">Mostrando todas as aulas do dia selecionado</small>
                        </div>
                    </div>

                    ${this.options.showNotes ? `
                        <div class="form-group">
                            <label for="notes">📝 Observações</label>
                            <textarea 
                                id="notes" 
                                name="notes" 
                                placeholder="Observações opcionais..."
                                maxlength="500"
                            ></textarea>
                            <div class="char-counter">
                                <span id="notes-counter">0</span>/500
                            </div>
                        </div>
                    ` : ''}

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            ✅ Confirmar Check-in
                        </button>
                        <button type="button" class="btn-secondary" id="clear-form">
                            🗑️ Limpar
                        </button>
                    </div>
                </form>

                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-label">Hoje:</span>
                        <span class="stat-value" id="today-count">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Esta semana:</span>
                        <span class="stat-value" id="week-count">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Online:</span>
                        <span class="stat-value" id="offline-queue">0</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Popular select de alunos
     */
    populateStudentSelect() {
        const select = document.getElementById('studentId');
        if (!select) return;

        // Limpar opções existentes (exceto primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Adicionar alunos ordenados por nome
        const sortedStudents = this.students.sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
        );

        sortedStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} - ${student.belt || 'Sem graduação'}`;
            
            // Adicionar informações extras
            if (student.status !== 'ACTIVE') {
                option.textContent += ` (${student.status})`;
                option.disabled = true;
            }
            
            select.appendChild(option);
        });

        console.log(`👥 Loaded ${sortedStudents.length} students`);
    }

    /**
     * Popular select de sessões
     */
    populateSessionSelect() {
        const select = document.getElementById('sessionId');
        if (!select) return;

        // Limpar opções existentes (exceto primeira)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Filtrar sessões de hoje e futuras próximas
        const now = new Date();
        const validSessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.startAt);
            const diffHours = (sessionDate - now) / (1000 * 60 * 60);
            
            // Permitir sessões de até 1 hora atrás até 24 horas no futuro
            return diffHours >= -1 && diffHours <= 24;
        });

        // Ordenar por horário
        validSessions.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

        validSessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            
            const startTime = new Date(session.startAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const courseInfo = session.course ? ` - ${session.course.name}` : '';
            const instructorInfo = session.instructor ? ` (${session.instructor.name})` : '';
            
            option.textContent = `${startTime}${courseInfo}${instructorInfo}`;
            
            // Marcar sessões já em andamento
            if (session.status === 'IN_PROGRESS') {
                option.textContent += ' ⚡ Em andamento';
            }
            
            select.appendChild(option);
        });

        console.log(`🏃 Loaded ${validSessions.length} valid sessions`);
    }

    /**
     * Bind eventos do formulário
     */
    bindEvents() {
        // Contador de caracteres
        const notesField = document.getElementById('notes');
        const notesCounter = document.getElementById('notes-counter');
        
        if (notesField && notesCounter) {
            notesField.addEventListener('input', (e) => {
                notesCounter.textContent = e.target.value.length;
            });
        }

        // Botão limpar
        const clearBtn = document.getElementById('clear-form');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }

        // Scanner QR para aluno
        const scanBtn = document.getElementById('scan-student');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.triggerQRScan('student');
            });
        }

        // Auto-atualizar sessões quando aluno muda
        const studentSelect = document.getElementById('studentId');
        if (studentSelect) {
            studentSelect.addEventListener('change', (e) => {
                this.onStudentChange(e.target.value);
            });
        }

        // Carregar stats iniciais
        this.loadQuickStats();
    }

    /**
     * Limpar formulário
     */
    clearForm() {
        const form = document.getElementById('checkin-form');
        if (form) {
            form.reset();
            
            // Reset contador
            const notesCounter = document.getElementById('notes-counter');
            if (notesCounter) {
                notesCounter.textContent = '0';
            }
        }
    }

    /**
     * Quando aluno muda, filtrar sessões relevantes
     */
    async onStudentChange(studentId) {
        if (!studentId) return;

        try {
            // Buscar planos ativos do aluno
            const student = this.students.find(s => s.id === studentId);
            if (!student) return;

            // Filtrar sessões compatíveis com os planos do aluno
            // Por enquanto, mostrar todas as sessões
            console.log(`👤 Selected student: ${student.name}`);
            
        } catch (error) {
            console.error('Error filtering sessions for student:', error);
        }
    }

    /**
     * Carregar estatísticas rápidas
     */
    async loadQuickStats() {
        try {
            // Buscar stats do dia/semana
            const stats = await this.fetchQuickStats();
            
            // Atualizar UI
            this.updateQuickStats(stats);
            
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    /**
     * Buscar estatísticas rápidas (mock)
     */
    async fetchQuickStats() {
        // Em produção, fazer chamada real para API
        return {
            today: Math.floor(Math.random() * 50),
            week: Math.floor(Math.random() * 200),
            offlineQueue: 0
        };
    }

    /**
     * Atualizar estatísticas na UI
     */
    updateQuickStats(stats) {
        const todayEl = document.getElementById('today-count');
        const weekEl = document.getElementById('week-count');
        const queueEl = document.getElementById('offline-queue');
        
        if (todayEl) todayEl.textContent = stats.today || '0';
        if (weekEl) weekEl.textContent = stats.week || '0';
        if (queueEl) {
            queueEl.textContent = stats.offlineQueue || '0';
            queueEl.parentElement.style.color = stats.offlineQueue > 0 ? '#f39c12' : '#27ae60';
        }
    }

    /**
     * Disparar scan QR
     */
    triggerQRScan(type) {
        // Disparar evento para o controller
        const event = new CustomEvent('qr-scan-requested', {
            detail: { type }
        });
        
        document.dispatchEvent(event);
        console.log(`📷 QR scan requested for: ${type}`);
    }

    /**
     * Preencher campo com resultado do QR
     */
    fillFromQR(type, value) {
        if (type === 'student') {
            const studentSelect = document.getElementById('studentId');
            if (studentSelect) {
                studentSelect.value = value;
                this.onStudentChange(value);
            }
        }
    }

    /**
     * Mostrar mensagem de validação
     */
    showValidationMessage(field, message, type = 'error') {
        const fieldEl = document.getElementById(field);
        if (!fieldEl) return;

        // Remover mensagens anteriores
        const parent = fieldEl.parentElement;
        const existingMsg = parent.querySelector('.field-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        // Adicionar nova mensagem
        const msgEl = document.createElement('div');
        msgEl.className = `field-message field-${type}`;
        msgEl.textContent = message;
        
        parent.appendChild(msgEl);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (msgEl.parentElement) {
                msgEl.remove();
            }
        }, 5000);
    }

    /**
     * Validar formulário antes do submit
     */
    validate() {
        const studentId = document.getElementById('studentId').value;
        const sessionId = document.getElementById('sessionId').value;
        
        let isValid = true;

        if (!studentId) {
            this.showValidationMessage('studentId', 'Selecione um aluno');
            isValid = false;
        }

        if (!sessionId) {
            this.showValidationMessage('sessionId', 'Selecione uma sessão');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Obter dados do formulário
     */
    getFormData() {
        const form = document.getElementById('checkin-form');
        if (!form) return null;

        const formData = new FormData(form);
        
        return {
            studentId: formData.get('studentId'),
            sessionId: formData.get('sessionId'),
            notes: formData.get('notes') || ''
        };
    }

    /**
     * Habilitar/desabilitar formulário
     */
    setEnabled(enabled) {
        const form = document.getElementById('checkin-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    }

    /**
     * Atualizar dados (re-render)
     */
    updateData(students, sessions) {
        this.students = students;
        this.sessions = sessions;
        
        this.populateStudentSelect();
        this.populateSessionSelect();
        this.loadQuickStats();
    }
}
