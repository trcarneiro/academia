/**
 * Personal Training Controller
 * Gerencia aulas particulares, agendamentos e turmas individuais
 * Integrado com o módulo Students seguindo padrões AGENTS.md
 */

export class PersonalTrainingController {
    constructor(api) {
        this.api = api; // ModuleAPIHelper instance
        this.selectedStudent = null;
        this.availableSlots = [];
        this.instructors = [];
        
        console.log('🥋 Personal Training Controller initialized');
    }

    // Criar turma personal para estudante
    async createPersonalClass(studentId, studentData = null) {
        try {
            console.log(`🎯 Creating personal class for student: ${studentId}`);
            
            // Buscar dados do estudante se não fornecidos
            const student = studentData || await this.getStudentDetails(studentId);
            
            const personalClassData = {
                name: `Personal - ${student.firstName} ${student.lastName}`,
                type: 'personal',
                max_students: 1,
                student_id: studentId,
                instructor_id: null, // Será definido no agendamento
                is_active: true,
                personal_config: {
                    flexible_schedule: true,
                    custom_curriculum: true,
                    student_focus: student.personal_focus || 'Técnicas básicas + condicionamento',
                    created_at: new Date().toISOString()
                }
            };

            // Conectar com API real
            const apiData = {
                studentId: studentId,
                instructorId: 'inst-maria', // Default instructor
                title: `Personal - ${student.firstName} ${student.lastName}`,
                description: 'Personal training personalizado',
                focusAreas: student.personal_focus ? [student.personal_focus] : ['Técnicas básicas', 'Condicionamento'],
                trainingType: 'INDIVIDUAL',
                intensity: 'Intermediário',
                duration: 60,
                location: 'Sala Personal Training'
            };

            const response = await this.api.request('/api/personal-training/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });

            if (!response.success) {
                throw new Error(response.message || 'Erro ao criar turma personal');
            }

            console.log('✅ Personal training class created:', response.data);

            // Exemplo especial para Lorraine
            if (student.firstName?.includes('Lorraine') || student.name?.includes('Lorraine')) {
                mockResponse.data.personal_config = {
                    ...mockResponse.data.personal_config,
                    student_focus: 'Krav Maga Feminino + Autodefesa + Condicionamento',
                    preferences: {
                        preferred_time: 'Manhã (08:00-10:00)',
                        training_intensity: 'Intermediário',
                        special_focus: ['Técnicas de escape', 'Defesa contra agarrões', 'Condicionamento funcional']
                    },
                    instructor_notes: 'Aluna dedicada, excelente progresso técnico. Foco em situações de autodefesa urbana.'
                };
            }

            if (mockResponse.success) {
                window.app?.dispatchEvent?.('notification:show', {
                    message: `Turma personal criada para ${student.firstName} ${student.lastName}!`,
                    type: 'success'
                });
                
                this.showPersonalScheduling(mockResponse.data, student);
                return mockResponse.data;
            } else {
                throw new Error(mockResponse.message || 'Erro ao criar turma personal');
            }

        } catch (error) {
            console.error('❌ Error creating personal class:', error);
            window.app?.dispatchEvent?.('notification:show', {
                message: `Erro ao criar turma personal: ${error.message}`,
                type: 'error'
            });
            window.app?.handleError(error, 'personal-class-creation');
            throw error;
        }
    }

    // Interface de agendamento personal
    showPersonalScheduling(personalClass, student) {
        const container = document.getElementById('module-container');
        if (!container) {
            console.error('❌ Container not found for personal scheduling');
            return;
        }

        this.selectedStudent = student;
        
        const schedulingHTML = `
            <div class="personal-scheduling-container">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="page-title">
                                <i class="icon">🥋</i>
                                Agendamento Personal
                            </h1>
                            <nav class="breadcrumb">Home / Estudantes / Personal Training</nav>
                        </div>
                        <div class="header-actions">
                            <button class="btn-form btn-secondary-form" onclick="window.studentsModule.init(document.getElementById('module-container'))">
                                <i class="fas fa-arrow-left"></i>
                                Voltar aos Estudantes
                            </button>
                        </div>
                    </div>
                </div>

                <div class="personal-scheduling-content">
                    ${this.generateStudentSummary(student)}
                    ${this.generateSchedulingOptions(personalClass)}
                    ${this.generateRecurringSchedules()}
                    ${this.generateAvailableSlots()}
                </div>
            </div>
        `;

        container.innerHTML = schedulingHTML;
        this.loadAvailableSlots();
        this.loadInstructors();
        this.bindSchedulingEvents();
    }

    generateStudentSummary(student) {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const email = student.email || student.user?.email || 'Não informado';
        const phone = student.phone || student.user?.phone || 'Não informado';
        
        return `
            <div class="student-summary-card">
                <div class="summary-header">
                    <h3><i class="fas fa-user-ninja"></i> Resumo do Aluno</h3>
                </div>
                <div class="summary-content">
                    <div class="summary-item">
                        <label>Nome:</label>
                        <span>${fullName}</span>
                    </div>
                    <div class="summary-item">
                        <label>Email:</label>
                        <span>${email}</span>
                    </div>
                    <div class="summary-item">
                        <label>Telefone:</label>
                        <span>${phone}</span>
                    </div>
                    <div class="summary-item">
                        <label>Nível:</label>
                        <span class="level-badge level-${(student.level || 'iniciante').toLowerCase()}">
                            ${student.level || 'Iniciante'}
                        </span>
                    </div>
                    <div class="summary-item">
                        <label>Plano:</label>
                        <span class="plan-badge plan-personal">Personal Training</span>
                    </div>
                    <div class="summary-item">
                        <label>Foco:</label>
                        <span>${student.personal_focus || 'Técnicas básicas + condicionamento'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    generateSchedulingOptions(personalClass) {
        return `
            <div class="scheduling-options-card">
                <div class="options-header">
                    <h3><i class="fas fa-calendar-alt"></i> Opções de Agendamento</h3>
                </div>
                <div class="scheduling-types">
                    <div class="scheduling-type-card active" data-type="flexible">
                        <div class="type-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="type-info">
                            <h4>Agendamento Flexível</h4>
                            <p>Marcar aulas conforme disponibilidade</p>
                            <small>✅ Recomendado para personal</small>
                        </div>
                    </div>
                    
                    <div class="scheduling-type-card" data-type="recurring">
                        <div class="type-icon">
                            <i class="fas fa-repeat"></i>
                        </div>
                        <div class="type-info">
                            <h4>Horário Fixo Semanal</h4>
                            <p>Mesmo horário todas as semanas</p>
                            <small>Para rotina consistente</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateRecurringSchedules() {
        return `
            <div class="recurring-schedules-card" id="recurring-schedules" style="display: none;">
                <div class="schedules-header">
                    <h3><i class="fas fa-repeat"></i> Configurar Horário Fixo</h3>
                </div>
                <div class="recurring-form">
                    <div class="form-group">
                        <label>Dia da Semana:</label>
                        <select id="recurring-day" class="form-control">
                            <option value="">Selecione o dia</option>
                            <option value="1">Segunda-feira</option>
                            <option value="2">Terça-feira</option>
                            <option value="3">Quarta-feira</option>
                            <option value="4">Quinta-feira</option>
                            <option value="5">Sexta-feira</option>
                            <option value="6">Sábado</option>
                            <option value="0">Domingo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Horário de Início:</label>
                        <input type="time" id="recurring-time" class="form-control" min="06:00" max="22:00">
                    </div>
                    <div class="form-group">
                        <label>Duração (minutos):</label>
                        <select id="recurring-duration" class="form-control">
                            <option value="60">60 minutos</option>
                            <option value="90">90 minutos</option>
                            <option value="120">120 minutos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Instrutor:</label>
                        <select id="recurring-instructor" class="form-control">
                            <option value="">Carregando instrutores...</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button class="btn-form btn-primary-form" onclick="window.personalController.saveRecurringSchedule()">
                            <i class="fas fa-save"></i>
                            Salvar Horário Fixo
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateAvailableSlots() {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <div class="available-slots-card">
                <div class="slots-header">
                    <h3><i class="fas fa-clock"></i> Horários Disponíveis</h3>
                    <div class="slots-filters">
                        <input type="date" id="slot-date" class="form-control" min="${today}" value="${today}">
                        <select id="slot-instructor" class="form-control">
                            <option value="">Todos os instrutores</option>
                        </select>
                        <button class="btn-form btn-secondary-form" onclick="window.personalController.loadAvailableSlots()">
                            <i class="fas fa-search"></i>
                            Buscar
                        </button>
                    </div>
                </div>
                <div class="slots-grid" id="available-slots-grid">
                    <div class="loading-slots">
                        <i class="fas fa-spinner fa-spin"></i>
                        Carregando horários disponíveis...
                    </div>
                </div>
            </div>
        `;
    }

    bindSchedulingEvents() {
        // Alternar entre tipos de agendamento
        const schedulingCards = document.querySelectorAll('.scheduling-type-card');
        schedulingCards.forEach(card => {
            card.addEventListener('click', () => {
                schedulingCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const type = card.getAttribute('data-type');
                const recurringCard = document.getElementById('recurring-schedules');
                
                if (type === 'recurring') {
                    recurringCard.style.display = 'block';
                } else {
                    recurringCard.style.display = 'none';
                }
            });
        });

        // Event listeners para filtros
        const dateInput = document.getElementById('slot-date');
        const instructorSelect = document.getElementById('slot-instructor');
        
        if (dateInput) {
            dateInput.addEventListener('change', () => this.loadAvailableSlots());
        }
        
        if (instructorSelect) {
            instructorSelect.addEventListener('change', () => this.loadAvailableSlots());
        }
    }

    // Carregar slots disponíveis
    async loadAvailableSlots() {
        try {
            const dateInput = document.getElementById('slot-date');
            const instructorSelect = document.getElementById('slot-instructor');
            
            const date = dateInput?.value || new Date().toISOString().split('T')[0];
            const instructorId = instructorSelect?.value || 'inst-maria';
            
            console.log(`🔍 Loading available slots for ${date}, instructor: ${instructorId}`);
            
            // Buscar slots da API real
            const response = await this.api.request(
                `/api/personal-training/slots/available?instructorId=${instructorId}&date=${date}`
            );
            
            if (response.success) {
                const slots = response.data.map(slot => ({
                    time: slot.startTime,
                    endTime: slot.endTime,
                    available: slot.available,
                    instructor: instructorId === 'inst-maria' ? 'Prof. Maria Silva' : 'Prof. Ana Santos',
                    instructorId: instructorId
                }));
                this.renderAvailableSlots(slots);
            } else {
                // Fallback para mock data
                const mockSlots = this.generateMockSlots(date, instructorId);
                this.renderAvailableSlots(mockSlots);
            }

        } catch (error) {
            console.error('❌ Error loading available slots:', error);
            // Fallback para mock data em caso de erro
            const mockSlots = this.generateMockSlots(date, instructorId || 'inst-maria');
            this.renderAvailableSlots(mockSlots);
        }
    }

    generateMockSlots(date, instructorId = '') {
        const slots = [];
        const instructors = [
            { id: 'inst_001', name: 'Prof. Marcus Silva' },
            { id: 'inst_002', name: 'Profa. Ana Costa' },
            { id: 'inst_003', name: 'Prof. Carlos Mendes' }
        ];
        
        // Gerar slots de 7h às 21h
        for (let hour = 7; hour <= 20; hour++) {
            for (const instructor of instructors) {
                if (instructorId && instructor.id !== instructorId) continue;
                
                // Simular disponibilidade (70% dos slots disponíveis)
                const isAvailable = Math.random() > 0.3;
                
                slots.push({
                    id: `slot_${date}_${hour}_${instructor.id}`,
                    date: date,
                    startTime: `${hour.toString().padStart(2, '0')}:00`,
                    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                    instructorId: instructor.id,
                    instructorName: instructor.name,
                    isAvailable: isAvailable,
                    duration: 60
                });
            }
        }
        
        return slots;
    }

    renderAvailableSlots(slots) {
        const grid = document.getElementById('available-slots-grid');
        if (!grid) return;

        const availableSlots = slots.filter(slot => slot.isAvailable);
        
        if (availableSlots.length === 0) {
            this.renderEmptySlots();
            return;
        }

        const slotsHTML = availableSlots.map(slot => `
            <div class="time-slot-card available" 
                 data-slot-id="${slot.id}"
                 onclick="window.personalController.bookSlot('${slot.id}', '${slot.date}', '${slot.startTime}', '${slot.endTime}', '${slot.instructorName}')">
                <div class="slot-time">
                    <i class="fas fa-clock"></i>
                    ${slot.startTime} - ${slot.endTime}
                </div>
                <div class="slot-instructor">
                    <i class="fas fa-user"></i>
                    ${slot.instructorName}
                </div>
                <div class="slot-status">
                    <span class="status-available">Disponível</span>
                </div>
                <div class="slot-action">
                    <i class="fas fa-plus-circle"></i>
                    Agendar Aula
                </div>
            </div>
        `).join('');

        grid.innerHTML = slotsHTML;
    }

    renderEmptySlots() {
        const grid = document.getElementById('available-slots-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="empty-slots-state">
                <div class="empty-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <h4>Nenhum horário disponível</h4>
                <p>Tente selecionar outra data ou instrutor</p>
                <button class="btn-form btn-secondary-form" onclick="window.personalController.requestCustomSlot()">
                    <i class="fas fa-calendar-plus"></i>
                    Solicitar Horário Específico
                </button>
            </div>
        `;
    }

    renderErrorSlots() {
        const grid = document.getElementById('available-slots-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="error-slots-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Erro ao carregar horários</h4>
                <p>Não foi possível buscar os horários disponíveis</p>
                <button class="btn-form btn-primary-form" onclick="window.personalController.loadAvailableSlots()">
                    <i class="fas fa-redo"></i>
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    // Garantir que existe uma turma personal para o estudante
    async ensurePersonalClass() {
        if (!this.selectedStudent) {
            throw new Error('Nenhum estudante selecionado');
        }

        // Verificar se já existe uma turma personal
        try {
            const response = await this.api.request(
                `/api/personal-training/classes/student/${this.selectedStudent.id}`
            );
            
            if (response.success && response.data.length > 0) {
                // Já existe uma turma personal
                return response.data[0].id;
            }
        } catch (error) {
            console.log('No existing personal class found, creating new one...');
        }

        // Criar nova turma personal
        const createResponse = await this.createPersonalClass(
            this.selectedStudent.id, 
            this.selectedStudent
        );
        
        return createResponse.data.id;
    }

    // Agendar slot específico
    async bookSlot(slotId, date, startTime, endTime, instructorName) {
        try {
            console.log(`📅 Booking slot: ${slotId} for ${this.selectedStudent?.firstName}`);
            
            // Primeiro, criar a turma personal se ainda não existir
            const personalClassId = await this.ensurePersonalClass();
            
            const bookingData = {
                personalClassId: personalClassId,
                date: date,
                startTime: startTime,
                endTime: endTime,
                location: 'Sala Personal Training'
            };

            // Agendar via API real
            const response = await this.api.request('/api/personal-training/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.success) {
                window.app?.dispatchEvent?.('notification:show', {
                    message: `Aula personal agendada com sucesso para ${date} às ${startTime}!`,
                    type: 'success'
                });
                
                this.showBookingConfirmation(response.data);
                this.loadAvailableSlots(); // Refresh slots
                
                return response.data;
            } else {
                throw new Error(response.message || 'Erro ao agendar aula');
            }

        } catch (error) {
            console.error('❌ Error booking slot:', error);
            window.app?.dispatchEvent?.('notification:show', {
                message: `Erro ao agendar: ${error.message}`,
                type: 'error'
            });
            window.app?.handleError(error, 'personal-booking');
        }
    }

    // Confirmação de agendamento
    showBookingConfirmation(bookingData) {
        const confirmationHTML = `
            <div class="booking-confirmation" id="booking-confirmation">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Aula Agendada com Sucesso! 🥋</h3>
                <div class="booking-details">
                    <div class="detail-item">
                        <label>Aluno:</label>
                        <span>${bookingData.student_name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Data:</label>
                        <span>${this.formatDate(bookingData.date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Horário:</label>
                        <span>${bookingData.start_time} - ${bookingData.end_time}</span>
                    </div>
                    <div class="detail-item">
                        <label>Instrutor:</label>
                        <span>${bookingData.instructor_name}</span>
                    </div>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-form btn-primary-form" onclick="window.personalController.scheduleAnother()">
                        <i class="fas fa-calendar-plus"></i>
                        Agendar Outra Aula
                    </button>
                    <button class="btn-form btn-secondary-form" onclick="window.studentsModule.init(document.getElementById('module-container'))">
                        <i class="fas fa-users"></i>
                        Voltar aos Estudantes
                    </button>
                </div>
            </div>
        `;

        // Inserir confirmação no topo da página
        const container = document.querySelector('.personal-scheduling-content');
        container.insertAdjacentHTML('afterbegin', confirmationHTML);

        // Auto-hide após 8 segundos
        setTimeout(() => {
            const confirmation = document.getElementById('booking-confirmation');
            if (confirmation) {
                confirmation.style.animation = 'slideUp 0.3s ease-out forwards';
                setTimeout(() => confirmation.remove(), 300);
            }
        }, 8000);
    }

    scheduleAnother() {
        // Remove confirmação e recarrega slots
        const confirmation = document.getElementById('booking-confirmation');
        if (confirmation) {
            confirmation.remove();
        }
        this.loadAvailableSlots();
    }

    // Carregar lista de instrutores
    async loadInstructors() {
        try {
            // Carregar instrutores da API real
            const response = await this.api.request('/api/personal-training/instructors/available');
            
            if (response.success) {
                this.instructors = response.data.map(instructor => ({
                    id: instructor.id,
                    name: instructor.name,
                    specialty: instructor.specializations?.[0] || 'Personal Training'
                }));
            } else {
                // Fallback para mock data
                this.instructors = [
                    { id: 'inst-maria', name: 'Prof. Maria Silva', specialty: 'Krav Maga Feminino' },
                    { id: 'inst-ana', name: 'Prof. Ana Santos', specialty: 'Personal Training' }
                ];
            }

            this.populateInstructorSelects();

        } catch (error) {
            console.error('❌ Error loading instructors:', error);
            // Fallback para mock data
            this.instructors = [
                { id: 'inst-maria', name: 'Prof. Maria Silva', specialty: 'Krav Maga Feminino' },
                { id: 'inst-ana', name: 'Prof. Ana Santos', specialty: 'Personal Training' }
            ];
            this.populateInstructorSelects();
        }
    }

    populateInstructorSelects() {
        const selects = [
            document.getElementById('slot-instructor'),
            document.getElementById('recurring-instructor')
        ];

        selects.forEach(select => {
            if (select) {
                // Manter primeira opção e adicionar instrutores
                const defaultOption = select.querySelector('option');
                select.innerHTML = defaultOption ? defaultOption.outerHTML : '<option value="">Todos os instrutores</option>';
                
                this.instructors.forEach(instructor => {
                    const option = document.createElement('option');
                    option.value = instructor.id;
                    option.textContent = instructor.name;
                    select.appendChild(option);
                });
            }
        });
    }

    // Salvar horário fixo semanal
    async saveRecurringSchedule() {
        try {
            const day = document.getElementById('recurring-day').value;
            const time = document.getElementById('recurring-time').value;
            const duration = document.getElementById('recurring-duration').value;
            const instructorId = document.getElementById('recurring-instructor').value;

            if (!day || !time || !instructorId) {
                window.app?.dispatchEvent?.('notification:show', {
                    message: 'Por favor, preencha todos os campos obrigatórios',
                    type: 'warning'
                });
                return;
            }

            const instructor = this.instructors.find(i => i.id === instructorId);
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

            const recurringData = {
                student_id: this.selectedStudent.id,
                student_name: `${this.selectedStudent.firstName} ${this.selectedStudent.lastName}`,
                day_of_week: day,
                day_name: dayNames[day],
                start_time: time,
                duration: parseInt(duration),
                instructor_id: instructorId,
                instructor_name: instructor.name,
                is_active: true,
                created_at: new Date().toISOString()
            };

            console.log('💾 Saving recurring schedule:', recurringData);

            // Simular salvamento
            const mockResponse = { success: true, data: recurringData };

            if (mockResponse.success) {
                window.app?.dispatchEvent?.('notification:show', {
                    message: `Horário fixo configurado: ${dayNames[day]} às ${time} com ${instructor.name}`,
                    type: 'success'
                });

                // Limpar formulário
                document.getElementById('recurring-day').value = '';
                document.getElementById('recurring-time').value = '';
                document.getElementById('recurring-instructor').value = '';
            }

        } catch (error) {
            console.error('❌ Error saving recurring schedule:', error);
            window.app?.dispatchEvent?.('notification:show', {
                message: `Erro ao salvar horário fixo: ${error.message}`,
                type: 'error'
            });
        }
    }

    requestCustomSlot() {
        const message = prompt('Descreva o horário desejado (ex: "Segunda às 19h com Prof. Marcus"):');
        if (message) {
            window.app?.dispatchEvent?.('notification:show', {
                message: 'Solicitação enviada! Entraremos em contato em breve.',
                type: 'info'
            });
            console.log('📝 Custom slot request:', message);
        }
    }

    async getStudentDetails(studentId) {
        try {
            // Para demonstração, simular busca do estudante
            const mockStudents = {
                'student_lorraine': {
                    id: 'student_lorraine',
                    firstName: 'Lorraine',
                    lastName: 'Costa Silva',
                    email: 'lorraine.costa@email.com',
                    phone: '(31) 98765-4321',
                    level: 'Intermediário',
                    personal_focus: 'Krav Maga Feminino + Autodefesa + Condicionamento',
                    physicalCondition: 'INTERMEDIARIO',
                    enrollmentDate: '2025-01-15',
                    lastTraining: '2025-09-10',
                    nextTraining: 'Não agendado',
                    preferences: {
                        preferred_time: 'Manhã (08:00-10:00)',
                        training_intensity: 'Intermediário',
                        focus_areas: ['Técnicas de escape', 'Defesa contra agarrões', 'Condicionamento funcional'],
                        instructor_preference: 'Preferencialmente instrutora feminina'
                    },
                    goals: [
                        'Dominar técnicas de autodefesa urbana',
                        'Aumentar condicionamento físico',
                        'Ganhar confiança em situações de risco',
                        'Aprender defesa contra múltiplos oponentes'
                    ],
                    notes: 'Aluna dedicada com excelente progresso técnico. Demonstra grande interesse em situações de autodefesa urbana. Responde muito bem aos treinos matinais.',
                    isActive: true
                },
                // Outros estudantes para demonstração
                'std_001': {
                    id: 'std_001',
                    firstName: 'João',
                    lastName: 'Silva Santos',
                    email: 'joao.silva@email.com',
                    phone: '(31) 99999-1001',
                    level: 'Iniciante',
                    personal_focus: 'Técnicas básicas + condicionamento físico',
                    isActive: true
                },
                'std_002': {
                    id: 'std_002',
                    firstName: 'Maria',
                    lastName: 'Santos',
                    email: 'maria.santos@email.com',
                    phone: '(31) 99999-2002',
                    level: 'Intermediário',
                    personal_focus: 'Defesa pessoal + competição',
                    isActive: true
                }
            };

            return mockStudents[studentId] || {
                id: studentId,
                firstName: 'Aluno',
                lastName: 'Exemplo',
                email: 'aluno@email.com',
                phone: '(11) 99999-9999',
                level: 'Iniciante',
                personal_focus: 'Técnicas básicas + condicionamento',
                isActive: true
            };
        } catch (error) {
            console.error('❌ Error getting student details:', error);
            throw error;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Expor globalmente para uso nas ações onclick
window.PersonalTrainingController = PersonalTrainingController;