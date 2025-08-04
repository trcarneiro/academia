(function() {
    'use strict';

    // --- Global State ---
    let currentStudent = null;
    let currentTab = 'profile';
    let studentId = null;

    // --- Initialization ---
    function initialize() {
        console.log('🚀 Initializing NEW Student Editor...');
        setStudentId();
        setupEventListeners();
        loadInitialData();
    }

    function setStudentId() {
        const editorModeData = localStorage.getItem('studentEditorMode');
        if (editorModeData) {
            try {
                const editorData = JSON.parse(editorModeData);
                studentId = editorData.studentId;
                console.log(`✅ Student ID set from localStorage: ${studentId}`);
            } catch (e) {
                console.error('❌ Failed to parse studentEditorMode', e);
            }
        }

        if (!studentId) {
            const urlParams = new URLSearchParams(window.location.search);
            studentId = urlParams.get('id');
            console.log(`✅ Student ID set from URL: ${studentId}`);
        }

        if (!studentId) {
            showError('Nenhum ID de estudante encontrado. Retornando à lista.');
            setTimeout(() => window.navigateToModule('students'), 3000);
        }
    }

    function setupEventListeners() {
        // Main buttons
        document.getElementById('back-to-list-btn')?.addEventListener('click', () => window.navigateToModule('students'));
        document.getElementById('save-student-btn')?.addEventListener('click', saveStudentChanges);

        // Tab navigation
        const tabContainer = document.querySelector('.tab-navigation');
        tabContainer?.addEventListener('click', (e) => {
            const button = e.target.closest('.page-tab');
            if (button && !button.classList.contains('active')) {
                switchTab(button.dataset.tab);
            }
        });
    }

    // --- Data Loading ---
    async function loadInitialData() {
        if (!studentId) return;

        showLoading('Carregando dados do aluno...');
        try {
            const response = await fetch(`/api/students/${studentId}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                currentStudent = result.data;
                renderPage();
            } else {
                throw new Error(result.message || 'Falha ao carregar dados do aluno.');
            }
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // --- Rendering ---
    function renderPage() {
        renderHeader();
        renderTabs();
    }

    function renderHeader() {
        const user = currentStudent.user || {};
        const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Novo Aluno';
        document.getElementById('editPageStudentName').textContent = studentName;
        document.getElementById('editPageStudentId').textContent = `ID: ${currentStudent.id}`;
        document.getElementById('editPageStudentCategory').textContent = `Categoria: ${currentStudent.category || 'N/A'}`;
        document.title = `Editando: ${studentName}`;
    }

    function renderTabs() {
        // Activate the correct tab button
        document.querySelectorAll('.page-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === currentTab);
        });

        // Show the correct content container
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === `${currentTab}-content` ? 'block' : 'none';
        });

        // Load content for the active tab
        loadTabContent(currentTab);
    }

    function switchTab(tabId) {
        currentTab = tabId;
        renderTabs();
    }

    async function loadTabContent(tabId) {
        const container = document.getElementById(`${tabId}-content`);
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"></div>'; // Show loading spinner

        try {
            switch (tabId) {
                case 'profile':
                    container.innerHTML = getProfileFormHTML();
                    populateProfileForm();
                    break;
                case 'financial':
                    await loadFinancialData(container);
                    break;
                case 'enrollments':
                    await loadEnrollmentsData(container);
                    break;
                case 'classes':
                    await loadClassesData(container);
                    break;
                case 'progress':
                    await loadProgressData(container);
                    break;
                case 'insights':
                    await loadInsightsData(container);
                    break;
                default:
                    container.innerHTML = `<div class="empty-state">Conteúdo para "${tabId}" em breve.</div>`;
            }
        } catch (error) {
            console.error(`❌ Error loading ${tabId} content:`, error);
            container.innerHTML = `<div class="error-state">${error.message}</div>`;
        }
    }

    // --- Enrollments Tab ---
    async function loadEnrollmentsData(container) {
        if (!currentStudent) return;
        try {
            const response = await fetch(`/api/students/${currentStudent.id}/enrollments`);
            if (!response.ok) throw new Error('Failed to fetch enrollments.');
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                container.innerHTML = renderEnrollmentsData(result.data);
            } else {
                container.innerHTML = `<div class="empty-state">Nenhum curso matriculado.</div>`;
            }
        } catch (error) {
            handleError(container, error);
        }
    }

    function renderEnrollmentsData(enrollments) {
        return `
            <div class="form-section"><h4>📚 Cursos Matriculados</h4>` +
            enrollments.map(enrollment => {
                const course = enrollment.course || {};
                return `
                    <div class="info-card">
                        <p><strong>Curso:</strong> ${course.name || 'N/A'}</p>
                        <p><strong>Status:</strong> ${enrollment.status || 'N/A'}</p>
                        <p><strong>Progresso:</strong> ${enrollment.progress || 0}%</p>
                    </div>`;
            }).join('') + '</div>';
    }

    // --- Classes Tab ---
    async function loadClassesData(container) {
        if (!currentStudent) return;
        try {
            const response = await fetch(`/api/students/${currentStudent.id}/classes`);
            if (!response.ok) throw new Error('Failed to fetch classes.');
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                container.innerHTML = renderClassesData(result.data);
            } else {
                container.innerHTML = `<div class="empty-state">Nenhuma turma ativa.</div>`;
            }
        } catch (error) {
            handleError(container, error);
        }
    }

    function renderClassesData(classes) {
        return `
            <div class="form-section"><h4>🏫 Turmas Ativas</h4>` +
            classes.map(cls => {
                return `
                    <div class="info-card">
                        <p><strong>Turma:</strong> ${cls.name || 'N/A'}</p>
                        <p><strong>Instrutor:</strong> ${cls.instructor?.name || 'N/A'}</p>
                        <p><strong>Horário:</strong> ${cls.schedule || 'N/A'}</p>
                    </div>`;
            }).join('') + '</div>';
    }

    // --- Progress Tab ---
    async function loadProgressData(container) {
        if (!currentStudent) return;
        try {
            const response = await fetch(`/api/students/${currentStudent.id}/progress`);
            if (!response.ok) throw new Error('Failed to fetch progress.');
            const result = await response.json();
            if (result.success && result.data) {
                container.innerHTML = renderProgressData(result.data);
            } else {
                container.innerHTML = `<div class="empty-state">Nenhum progresso encontrado.</div>`;
            }
        } catch (error) {
            handleError(container, error);
        }
    }

    function renderProgressData(progress) {
        return `
            <div class="form-section"><h4>📊 Progresso Geral</h4>
                <div class="info-card">
                    <p><strong>Progresso Geral:</strong> ${progress.overallProgress || 0}%</p>
                    <p><strong>Cursos Completos:</strong> ${progress.coursesCompleted || 0}</p>
                    <p><strong>Taxa de Presença:</strong> ${progress.attendanceRate || 0}%</p>
                </div>
            </div>`;
    }

    // --- Insights Tab ---
    async function loadInsightsData(container) {
        if (!currentStudent) return;
        try {
            const response = await fetch(`/api/students/${currentStudent.id}/insights`);
            if (!response.ok) throw new Error('Failed to fetch insights.');
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                container.innerHTML = renderInsightsData(result.data);
            } else {
                container.innerHTML = `<div class="empty-state">Nenhum insight encontrado.</div>`;
            }
        } catch (error) {
            handleError(container, error);
        }
    }

    function renderInsightsData(insights) {
        return `
            <div class="form-section"><h4>🤖 Dashboard IA</h4>` +
            insights.map(insight => {
                return `
                    <div class="info-card">
                        <p><strong>${insight.title}</strong></p>
                        <p>${insight.message}</p>
                    </div>`;
            }).join('') + '</div>';
    }

    function handleError(container, error) {
        console.error('❌ Error loading tab data:', error);
        container.innerHTML = `<div class="error-state">${error.message}</div>`;
    }

    // --- Financial Tab ---
    async function loadFinancialData(container) {
        if (!currentStudent) return;

        try {
            const response = await fetch(`/api/students/${currentStudent.id}/subscription`);
            if (!response.ok) {
                throw new Error('Failed to fetch subscription data.');
            }
            const result = await response.json();
            if (result.success && result.data) {
                container.innerHTML = renderFinancialData(result.data);
            } else {
                container.innerHTML = `<div class="empty-state">Nenhuma assinatura encontrada.</div>`;
            }
        } catch (error) {
            console.error('❌ Error loading financial data:', error);
            container.innerHTML = `<div class="error-state">${error.message}</div>`;
        }
    }

    function renderFinancialData(subscription) {
        const plan = subscription.plan || {};
        return `
            <div class="form-section">
                <h4>💳 Plano Atual</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nome do Plano</label>
                        <input type="text" value="${plan.name || 'N/A'}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Preço</label>
                        <input type="text" value="R$ ${plan.price || '0.00'}" disabled>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Status</label>
                        <input type="text" value="${subscription.status || 'N/A'}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Próximo Vencimento</label>
                        <input type="text" value="${subscription.nextPayment ? new Date(subscription.nextPayment).toLocaleDateString('pt-BR') : 'N/A'}" disabled>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Profile Tab ---
    function getProfileFormHTML() {
        return `
            <div class="form-section">
                <h4>👤 Informações Pessoais</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="student-name">Nome Completo</label>
                        <input type="text" id="student-name" required>
                    </div>
                    <div class="form-group">
                        <label for="student-email">Email</label>
                        <input type="email" id="student-email" required>
                    </div>
                </div>
                 <div class="form-grid">
                    <div class="form-group">
                        <label for="student-phone">Telefone</label>
                        <input type="tel" id="student-phone">
                    </div>
                    <div class="form-group">
                        <label for="student-birth-date">Data de Nascimento</label>
                        <input type="date" id="student-birth-date">
                    </div>
                </div>
            </div>
            <div class="form-section">
                <h4>📝 Notas e Status</h4>
                <div class="form-grid">
                     <div class="form-group">
                        <label for="student-notes">Notas Internas</label>
                        <textarea id="student-notes" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="student-status">Status</label>
                        <select id="student-status">
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    function populateProfileForm() {
        if (!currentStudent) return;
        const user = currentStudent.user || {};

        document.getElementById('student-name').value = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        document.getElementById('student-email').value = user.email || '';
        document.getElementById('student-phone').value = user.phone || currentStudent.phone || '';
        document.getElementById('student-birth-date').value = currentStudent.birthDate ? new Date(currentStudent.birthDate).toISOString().split('T')[0] : '';
        document.getElementById('student-notes').value = currentStudent.notes || '';
        document.getElementById('student-status').value = currentStudent.isActive ? 'ACTIVE' : 'INACTIVE';
    }

    // --- Actions ---
    async function saveStudentChanges() {
        if (!currentStudent) return;

        const formData = {
            // This needs to be adapted based on your actual data model for updates
            // For now, let's assume a flat structure for simplicity
            name: document.getElementById('student-name').value,
            email: document.getElementById('student-email').value,
            phone: document.getElementById('student-phone').value,
            birthDate: document.getElementById('student-birth-date').value,
            notes: document.getElementById('student-notes').value,
            isActive: document.getElementById('student-status').value === 'ACTIVE',
        };

        showLoading('Salvando...');
        try {
            const response = await fetch(`/api/students/${currentStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Falha ao salvar.');
            }

            showSuccess('Aluno salvo com sucesso!');
            setTimeout(() => window.navigateToModule('students'), 2000);

        } catch (error) {
            console.error('❌ Error saving student:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // --- UI Helpers ---
    function showLoading(message = 'Carregando...') {
        document.getElementById('loadingStateMessage').textContent = message;
        document.getElementById('loadingState').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    function showError(message) {
        // A more robust implementation would use a dedicated notification system
        alert(`❌ ERRO: ${message}`);
    }

    function showSuccess(message) {
        alert(`✅ SUCESSO: ${message}`);
    }

    // --- Entry Point ---
    // The module loader in index.html will call this function
    window.initializeStudentEditorNewModule = initialize;

})();
