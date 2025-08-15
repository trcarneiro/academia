console.log('👨‍🎓 Student Editor Module - Starting...');

let currentStudentId = null;
let currentStudentData = null;

// Initialize the module
function initializeStudentEditorModule() {
    console.log('� Initializing Student Editor Module...');
    
    // Get student ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    currentStudentId = urlParams.get('id') || localStorage.getItem('currentStudentId');
    
    if (!currentStudentId) {
        console.error('❌ No student ID provided');
        showError('ID do aluno não encontrado');
        return;
    }
    
    // Initialize tab system
    initializeTabSystem();
    
    // Load student data
    loadStudentData();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Student Editor Module initialized successfully');
}

// Initialize tab system with proper isolation
function initializeTabSystem() {
    console.log('� Initializing tab system...');
    
    const tabs = document.querySelectorAll('.page-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // Set initial tab
    switchTab('profile');
}

// Switch tabs with proper form isolation
function switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Hide all tab contents and remove active class
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.page-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show target tab content
    const targetContent = document.getElementById(`${tabName}-content`);
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetContent && targetTab) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
        targetTab.classList.add('active');
        
        // Load tab-specific content
        loadTabContent(tabName);
    }
}

// Load tab-specific content
async function loadTabContent(tabName) {
    const contentContainer = document.getElementById(`${tabName}-content`);
    
    try {
        switch (tabName) {
            case 'profile':
                await loadProfileContent(contentContainer);
                break;
            case 'financial':
                await loadFinancialContent(contentContainer);
                break;
            case 'enrollments':
                await loadEnrollmentsContent(contentContainer);
                break;
            case 'classes':
                await loadClassesContent(contentContainer);
                break;
            case 'progress':
                await loadProgressContent(contentContainer);
                break;
            case 'insights':
                await loadInsightsContent(contentContainer);
                break;
        }
    } catch (error) {
        console.error(`❌ Error loading ${tabName} content:`, error);
        showErrorInContainer(contentContainer, `Erro ao carregar ${tabName}`);
    }
}

// Load profile content
async function loadProfileContent(container) {
    console.log('👤 Loading profile content...');
    
    container.innerHTML = `
        <div class="form-section">
            <h4><i class="fas fa-user"></i> Informações Pessoais</h4>
            <form id="profileForm" class="form-grid">
                <div class="form-group">
                    <label for="firstName">Nome</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Sobrenome</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Telefone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="category">Categoria</label>
                    <select id="category" name="category" required>
                        <option value="">Selecione...</option>
                        <option value="ADULT">Adulto</option>
                        <option value="CHILD">Criança</option>
                        <option value="SENIOR">Idoso</option>
                        <option value="FEMALE">Feminino</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="emergencyContact">Contato de Emergência</label>
                    <input type="text" id="emergencyContact" name="emergencyContact">
                </div>
            </form>
        </div>
        
        <div class="form-section">
            <h4><i class="fas fa-heart"></i> Informações Médicas</h4>
            <div class="form-group">
                <label for="medicalConditions">Condições Médicas</label>
                <textarea id="medicalConditions" name="medicalConditions" rows="3" 
                    placeholder="Descreva qualquer condição médica relevante..."></textarea>
            </div>
        </div>
    `;
    
    // Populate form with student data
    if (currentStudentData) {
        populateProfileForm(currentStudentData);
    }
}

// Load financial content with enrollment and course data
async function loadFinancialContent(container) {
    console.log('💳 Loading financial content...');
    
    showLoading(container, 'Carregando dados financeiros...');
    
    try {
        // Get student subscription and enrollment data
        const [subscriptionResponse, enrollmentResponse] = await Promise.all([
            fetch(`/api/students/${currentStudentId}/subscription`),
            fetch(`/api/students/${currentStudentId}/enrollments`)
        ]);
        
        const subscriptionData = await subscriptionResponse.json();
        const enrollmentData = await enrollmentResponse.json();
        
        let currentSubscription = null;
        let currentEnrollments = [];
        
        if (subscriptionData.success && subscriptionData.data) {
            currentSubscription = subscriptionData.data;
        }
        
        if (enrollmentData.success && enrollmentData.data) {
            currentEnrollments = enrollmentData.data;
        }
        
        container.innerHTML = `
            <div class="form-section">
                <h4><i class="fas fa-credit-card"></i> Assinatura Atual</h4>
                <div id="currentSubscriptionContainer">
                    ${currentSubscription ? renderCurrentSubscription(currentSubscription) : renderNoSubscription()}
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-graduation-cap"></i> Matrículas Ativas</h4>
                <div id="currentEnrollmentsContainer">
                    ${currentEnrollments.length > 0 ? renderCurrentEnrollments(currentEnrollments) : renderNoEnrollments()}
                </div>
            </div>
            
            <div class="form-section">
                <h4><i class="fas fa-chart-line"></i> Histórico Financeiro</h4>
                <div id="financialHistoryContainer">
                    <div class="loading-state">Carregando histórico...</div>
                </div>
            </div>
        `;
        
        // Load financial history
        loadFinancialHistory();
        
    } catch (error) {
        console.error('❌ Error loading financial data:', error);
        showErrorInContainer(container, 'Erro ao carregar dados financeiros');
    }
}

// Render current subscription
function renderCurrentSubscription(subscription) {
    const plan = subscription.plan || {};
    const statusClass = subscription.status === 'ACTIVE' ? 'status-active' : 
                       subscription.status === 'CANCELLED' ? 'status-inactive' : 'status-pending';
    
    return `
        <div class="subscription-card" style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h5 style="color: #F8FAFC; margin: 0 0 0.5rem 0;">${plan.name || 'Plano sem nome'}</h5>
                    <p style="color: #94A3B8; margin: 0; font-size: 0.9rem;">${plan.description || 'Sem descrição'}</p>
                </div>
                <span class="status-badge ${statusClass}">${subscription.status}</span>
            </div>
            
            <div class="subscription-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <label style="color: #94A3B8; font-size: 0.8rem;">Valor Mensal</label>
                    <p style="color: #10B981; font-weight: bold; margin: 0.25rem 0 0 0; font-size: 1.2rem;">
                        R$ ${(subscription.customPrice || plan.price || 0).toFixed(2)}
                    </p>
                </div>
                <div>
                    <label style="color: #94A3B8; font-size: 0.8rem;">Início</label>
                    <p style="color: #F8FAFC; margin: 0.25rem 0 0 0;">
                        ${subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                </div>
                <div>
                    <label style="color: #94A3B8; font-size: 0.8rem;">Vencimento</label>
                    <p style="color: #F8FAFC; margin: 0.25rem 0 0 0;">
                        ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('pt-BR') : 'Indefinido'}
                    </p>
                </div>
                <div>
                    <label style="color: #94A3B8; font-size: 0.8rem;">Aulas/Semana</label>
                    <p style="color: #3B82F6; font-weight: bold; margin: 0.25rem 0 0 0;">
                        ${plan.classesPerWeek || 'Unlimited'}
                    </p>
                </div>
            </div>
            
            <div style="margin-top: 1rem; display: flex; gap: 0.75rem;">
                <button onclick="editSubscription('${subscription.id}')" class="btn btn-outline" style="flex: 1;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="cancelSubscription('${subscription.id}')" class="btn btn-danger" style="flex: 1;">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;
}

// Render no subscription state
function renderNoSubscription() {
    return `
        <div class="empty-state">
            <i class="fas fa-credit-card" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>Nenhuma assinatura ativa</p>
            <button onclick="createNewSubscription()" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-plus"></i> Nova Assinatura
            </button>
        </div>
    `;
}

// Render current enrollments
function renderCurrentEnrollments(enrollments) {
    return enrollments.map(enrollment => {
        const course = enrollment.course || {};
        const progressPercent = enrollment.progressPercentage || 0;
        
        return `
            <div class="enrollment-card" style="background: rgba(15, 23, 42, 0.8); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h5 style="color: #F8FAFC; margin: 0 0 0.5rem 0;">${course.name || 'Curso sem nome'}</h5>
                        <p style="color: #94A3B8; margin: 0; font-size: 0.9rem;">${course.description || 'Sem descrição'}</p>
                    </div>
                    <span class="status-badge status-active">${enrollment.status || 'ACTIVE'}</span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="color: #94A3B8; font-size: 0.9rem;">Progresso</span>
                        <span style="color: #10B981; font-weight: bold;">${progressPercent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.9rem;">
                    <div>
                        <label style="color: #94A3B8; font-size: 0.8rem;">Data Matrícula</label>
                        <p style="color: #F8FAFC; margin: 0.25rem 0 0 0;">
                            ${enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label style="color: #94A3B8; font-size: 0.8rem;">Nível Atual</label>
                        <p style="color: #3B82F6; margin: 0.25rem 0 0 0; font-weight: bold;">
                            ${enrollment.currentLevel || 'Iniciante'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render no enrollments state
function renderNoEnrollments() {
    return `
        <div class="empty-state">
            <i class="fas fa-graduation-cap" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            <p>Nenhuma matrícula encontrada</p>
            <button onclick="enrollInCourse()" class="btn btn-primary" style="margin-top: 1rem;">
                <i class="fas fa-plus"></i> Matricular em Curso
            </button>
        </div>
    `;
}
                
                if (editorMode) {
                    try {
                        const modeData = JSON.parse(editorMode);
                        console.log('📱 Parsed mode data:', modeData);
                        
                        if (modeData.studentId && modeData.mode === 'edit') {
                            studentId = modeData.studentId;
                            console.log('✅ Using student ID from localStorage:', studentId);
                            // Clear the localStorage data after use
                            localStorage.removeItem('studentEditorMode');
                        }
                    } catch (error) {
                        console.error('❌ Error parsing editor mode data:', error);
                    }
                }
            }
            
            if (studentId) {
                console.log('🔄 Loading student data for ID:', studentId);
                await loadStudentData(studentId);
            } else {
                console.warn('⚠️ No student ID provided');
                showError('ID do aluno não fornecido');
            }
            
            setupEventListeners();
            
            console.log('✅ Student Editor Module initialized');
            
        } catch (error) {
            console.error('❌ Error initializing student editor:', error);
            showError(`Erro ao inicializar: ${error.message}`);
        }
    }
    
    // Load student data
    async function loadStudentData(studentId) {
        try {
            showLoadingState();
            
            console.log('🌐 Making API request to:', `/api/students/${studentId}`);
            const response = await fetch(`/api/students/${studentId}`);
            console.log('📡 API Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📊 Full API Result:', result);
            console.log('👤 Student data received:', result.data);
            
            if (result.success && result.data) {
                currentStudentData = result.data;
                console.log('💾 Stored student data:', currentStudentData);
                updateHeaderInfo(result.data);
                await loadProfileTab();
                hideLoadingState();
                isLoadingComplete = true;
                console.log('✅ Student data loaded:', result.data.name);
            } else {
                throw new Error(result.error || 'Dados do aluno não encontrados');
            }
            
        } catch (error) {
            console.error('❌ Error loading student:', error);
            showError(`Erro ao carregar aluno: ${error.message}`);
        }
    }
    
    // Update header info
    function updateHeaderInfo(student) {
        const nameElement = document.getElementById('editPageStudentName');
        const idElement = document.getElementById('editPageStudentId');
        const categoryElement = document.getElementById('editPageStudentCategory');
        
        if (nameElement) nameElement.textContent = student.name || 'Nome não disponível';
        if (idElement) idElement.textContent = `ID: ${student.id}`;
        if (categoryElement) categoryElement.textContent = `Status: ${getStatusLabel(student.status)}`;
    }
    
    // Get status label
    function getStatusLabel(status) {
        const labels = {
            'ACTIVE': 'Ativo',
            'INACTIVE': 'Inativo',
            'SUSPENDED': 'Suspenso'
        };
        return labels[status] || status;
    }
    
    // Show loading state
    function showLoadingState() {
        const contents = ['profile', 'financial', 'enrollments', 'classes', 'progress', 'insights'];
        contents.forEach(contentId => {
            const element = document.getElementById(`${contentId}-content`);
            if (element) {
                element.innerHTML = `
                    <div class="loading-state" style="text-align: center; padding: 3rem; color: #CBD5E1;">
                        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                        <p>Carregando ${contentId}...</p>
                    </div>
                `;
            }
        });
    }
    
    // Hide loading state
    function hideLoadingState() {
        console.log('🔄 Hiding loading states...');
        
        // Force remove any remaining loading states in all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
            const loadingStates = tab.querySelectorAll('.loading-state');
            loadingStates.forEach(loading => {
                loading.remove();
                console.log('✅ Removed loading state from tab:', tab.id);
            });
        });
        
        // Force refresh the profile content to ensure it's visible
        const profileContent = document.getElementById('profile-content');
        if (profileContent && currentStudentData) {
            console.log('🔄 Force refreshing profile content...');
            
            // Check if the form is actually visible
            const formContainer = profileContent.querySelector('.form-container');
            const studentNameInput = profileContent.querySelector('#studentName');
            
            console.log('🔍 Profile content check:', {
                hasFormContainer: !!formContainer,
                hasNameInput: !!studentNameInput,
                nameInputValue: studentNameInput?.value,
                contentPreview: profileContent.innerHTML.substring(0, 200) + '...'
            });
            
            // Force the tab to be active
            profileContent.classList.add('active');
            profileContent.style.display = 'block';
            
            console.log('✅ Profile content verified and forced visible');
        }
    }
    
    // Load profile tab
    async function loadProfileTab() {
        console.log('🔄 Loading profile tab...');
        const profileContent = document.getElementById('profile-content');
        
        if (!profileContent) {
            console.error('❌ Profile content element not found');
            return;
        }
        
        // Check if element is visible
        const styles = window.getComputedStyle(profileContent);
        console.log('👁️ Profile content visibility:', {
            display: styles.display,
            visibility: styles.visibility,
            className: profileContent.className,
            offsetHeight: profileContent.offsetHeight,
            offsetWidth: profileContent.offsetWidth
        });
        
        if (!currentStudentData) {
            console.error('❌ No current student data available');
            return;
        }
        
        console.log('📝 Populating profile form with data:', currentStudentData);
        const student = currentStudentData;
        
        profileContent.innerHTML = `
            <div class="form-container" style="background: rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 2rem; border: 1px solid #334155;">
                <h3 style="margin: 0 0 2rem 0; color: #F8FAFC; font-size: 1.25rem;">Informações Pessoais</h3>
                
                <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" id="studentName" value="${student.name || ''}" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="studentEmail" value="${student.email || ''}" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                    
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="tel" id="studentPhone" value="${student.phone || ''}" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                    
                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" id="studentBirthDate" value="${student.birthDate || ''}" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                    
                    <div class="form-group">
                        <label>Status</label>
                        <select id="studentStatus" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                            <option value="ACTIVE" ${student.status === 'ACTIVE' ? 'selected' : ''}>Ativo</option>
                            <option value="INACTIVE" ${student.status === 'INACTIVE' ? 'selected' : ''}>Inativo</option>
                            <option value="SUSPENDED" ${student.status === 'SUSPENDED' ? 'selected' : ''}>Suspenso</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label>Observações</label>
                        <textarea id="studentNotes" rows="3" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC; resize: vertical;">${student.notes || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Profile form HTML updated');
        
        // Force DOM refresh and ensure visibility
        setTimeout(() => {
            const profileContent = document.getElementById('profile-content');
            if (profileContent) {
                // Force reflow
                profileContent.offsetHeight;
                // Ensure it's visible
                profileContent.style.display = 'block';
                profileContent.style.visibility = 'visible';
                console.log('🔄 Forced profile content visibility');
            }
        }, 100);
        
        // Add change listeners to mark as dirty
        const inputs = profileContent.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                isDirty = true;
            });
        });
        
        console.log('✅ Profile tab loaded successfully');
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Prevent accidental navigation
        window.addEventListener('beforeunload', (event) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        });
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Global functions expected by HTML
    window.returnToStudentsList = function() {
        console.log('← Returning to students list');
        
        if (isDirty) {
            if (confirm('Você tem alterações não salvas. Tem certeza que deseja sair?')) {
                navigateToModule('students');
            }
        } else {
            navigateToModule('students');
        }
    };
    
    window.saveStudentChanges = async function() {
        console.log('💾 Saving student changes...');
        
        try {
            if (!currentStudentData) {
                throw new Error('Dados do aluno não carregados');
            }
            
            // Collect form data
            const formData = {
                name: document.getElementById('studentName')?.value.trim() || '',
                email: document.getElementById('studentEmail')?.value.trim() || '',
                phone: document.getElementById('studentPhone')?.value.trim() || '',
                birthDate: document.getElementById('studentBirthDate')?.value || null,
                status: document.getElementById('studentStatus')?.value || 'ACTIVE',
                notes: document.getElementById('studentNotes')?.value.trim() || ''
            };
            
            // Validation
            if (!formData.name) {
                throw new Error('Nome é obrigatório');
            }
            if (!formData.email) {
                throw new Error('Email é obrigatório');
            }
            
            // Disable save button
            const saveBtn = document.querySelector('button[onclick="saveStudentChanges()"]');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span>💾</span> Salvando...';
            }
            
            // Make API call
            const response = await fetch(`/api/students/${currentStudentData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                currentStudentData = { ...currentStudentData, ...formData };
                updateHeaderInfo(currentStudentData);
                isDirty = false;
                
                showSuccess('Alterações salvas com sucesso!');
                
                // Re-enable button
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<span>💾</span> Salvar Alterações';
                }
            } else {
                throw new Error(result.error || 'Erro ao salvar');
            }
            
        } catch (error) {
            console.error('❌ Error saving student:', error);
            showError(`Erro ao salvar: ${error.message}`);
            
            // Re-enable button
            const saveBtn = document.querySelector('button[onclick="saveStudentChanges()"]');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<span>💾</span> Salvar Alterações';
            }
        }
    };
    
    window.switchPageTab = function(tabName) {
        console.log('🔄 Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.page-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const targetContent = document.getElementById(`${tabName}-content`);
        if (targetContent) {
            targetContent.style.display = 'block';
            
            // Load content based on tab
            switch (tabName) {
                case 'profile':
                    // Already loaded
                    break;
                case 'financial':
                    loadFinancialTab();
                    break;
                case 'enrollments':
                    loadEnrollmentsTab();
                    break;
                case 'classes':
                    loadClassesTab();
                    break;
                case 'progress':
                    loadProgressTab();
                    break;
                case 'insights':
                    loadInsightsTab();
                    break;
            }
        }
    };
    
    // Placeholder functions for other tabs
    function loadFinancialTab() {
        const content = document.getElementById('financial-content');
        if (content) {
            content.innerHTML = `
                <div class="empty-state" style="background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); color: #9CA3AF; padding: 2rem; border-radius: 8px; text-align: center;">
                    <p>📊 Dados financeiros em desenvolvimento</p>
                </div>
            `;
        }
    }
    
    function loadEnrollmentsTab() {
        const content = document.getElementById('enrollments-content');
        if (content) {
            content.innerHTML = `
                <div class="empty-state" style="background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); color: #9CA3AF; padding: 2rem; border-radius: 8px; text-align: center;">
                    <p>📚 Matrículas em desenvolvimento</p>
                </div>
            `;
        }
    }
    
    function loadClassesTab() {
        const content = document.getElementById('classes-content');
        if (content) {
            content.innerHTML = `
                <div class="empty-state" style="background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); color: #9CA3AF; padding: 2rem; border-radius: 8px; text-align: center;">
                    <p>🏫 Turmas ativas em desenvolvimento</p>
                </div>
            `;
        }
    }
    
    function loadProgressTab() {
        const content = document.getElementById('progress-content');
        if (content) {
            content.innerHTML = `
                <div class="empty-state" style="background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); color: #9CA3AF; padding: 2rem; border-radius: 8px; text-align: center;">
                    <p>📊 Progresso em desenvolvimento</p>
                </div>
            `;
        }
    }
    
    function loadInsightsTab() {
        const content = document.getElementById('insights-content');
        if (content) {
            content.innerHTML = `
                <div class="empty-state" style="background: rgba(107, 114, 128, 0.1); border: 1px solid rgba(107, 114, 128, 0.3); color: #9CA3AF; padding: 2rem; border-radius: 8px; text-align: center;">
                    <p>🤖 Dashboard IA em desenvolvimento</p>
                </div>
            `;
        }
    }
    
    // Placeholder functions for sidebar actions
    window.generateStudentQR = function() {
        showInfo('QR Code em desenvolvimento');
    };
    
    window.exportStudentData = function() {
        showInfo('Exportação em desenvolvimento');
    };
    
    window.sendNotification = function() {
        showInfo('Notificações em desenvolvimento');
    };
    
    // Utility functions
    function showSuccess(message) {
        console.log('✅ Success:', message);
        alert(message); // TODO: Replace with proper notification
    }
    
    function showError(message) {
        console.error('❌ Error:', message);
        alert(message); // TODO: Replace with proper notification
    }
    
    function showInfo(message) {
        console.log('ℹ️ Info:', message);
        alert(message); // TODO: Replace with proper notification
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeStudentEditor);
    } else {
        initializeStudentEditor();
    }
    
    console.log('📝 Student Editor Module - Loaded');
    
})();
