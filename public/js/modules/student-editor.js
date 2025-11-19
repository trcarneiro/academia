console.log('👨‍🎓 Student Editor Module - Starting...');

let currentStudentId = null;
let currentStudentData = null;

// Initialize the module
function initializeStudentEditorModule() {
    console.log('🔧 Initializing Student Editor Module...');
    
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
    console.log('🔧 Initializing tab system...');
    
    const tabs = document.querySelectorAll('.page-tab');
    console.log(`Found ${tabs.length} tabs:`, tabs);
    
    tabs.forEach((tab, index) => {
        const tabName = tab.getAttribute('data-tab');
        console.log(`Setting up tab ${index}: ${tabName}`);
        
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Tab clicked: ${tabName}`);
            const targetTab = e.target.getAttribute('data-tab') || e.target.closest('[data-tab]')?.getAttribute('data-tab');
            if (targetTab) {
                switchTab(targetTab);
            }
        });
    });
    
    // Set initial tab
    console.log('Setting initial tab to profile');
    setTimeout(() => switchTab('profile'), 100);
}

// Switch tabs with proper CSS isolation (no display manipulation)
function switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Remove active class from all tabs and content
    const allTabs = document.querySelectorAll('.page-tab');
    const allContents = document.querySelectorAll('.tab-content');
    
    console.log(`Found ${allTabs.length} tabs and ${allContents.length} content areas`);
    
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    allContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to target tab and content
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`${tabName}-content`);
    
    console.log(`Target tab:`, targetTab);
    console.log(`Target content:`, targetContent);
    
    if (targetTab && targetContent) {
        targetTab.classList.add('active');
        targetContent.classList.add('active');
        
        console.log(`✅ Successfully switched to ${tabName} tab`);
        
        // Load tab-specific content with API-first approach
        loadTabContent(tabName);
    } else {
        console.error(`❌ Tab or content not found: ${tabName}`);
        console.error(`Tab element:`, targetTab);
        console.error(`Content element:`, targetContent);
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
            window.fetchWithOrganization(`/api/students/${currentStudentId}/subscription`),
            window.fetchWithOrganization(`/api/students/${currentStudentId}/enrollments`)
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

// Load financial history
async function loadFinancialHistory() {
    try {
        const response = await window.fetchWithOrganization(`/api/students/${currentStudentId}/financial-summary`);
        const result = await response.json();
        
        const container = document.getElementById('financialHistoryContainer');
        
        if (result.success && result.data) {
            container.innerHTML = renderFinancialHistory(result.data);
        } else {
            container.innerHTML = '<div class="empty-state">Nenhum histórico financeiro encontrado</div>';
        }
    } catch (error) {
        console.error('❌ Error loading financial history:', error);
        const container = document.getElementById('financialHistoryContainer');
        container.innerHTML = '<div class="error-state">Erro ao carregar histórico financeiro</div>';
    }
}

// Render financial history
function renderFinancialHistory(data) {
    const payments = data.payments || [];
    
    if (payments.length === 0) {
        return '<div class="empty-state">Nenhum pagamento registrado</div>';
    }
    
    return `
        <div class="payments-list">
            ${payments.map(payment => `
                <div class="payment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; margin-bottom: 0.5rem;">
                    <div>
                        <p style="color: #F8FAFC; margin: 0; font-weight: 500;">${payment.description || 'Pagamento'}</p>
                        <p style="color: #94A3B8; margin: 0.25rem 0 0 0; font-size: 0.9rem;">
                            ${new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: #10B981; margin: 0; font-weight: bold; font-size: 1.1rem;">
                            R$ ${payment.value.toFixed(2)}
                        </p>
                        <span class="status-badge ${payment.status === 'RECEIVED' ? 'status-active' : payment.status === 'OVERDUE' ? 'status-inactive' : 'status-pending'}">
                            ${payment.status}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load other tab contents (simplified for now)
async function loadEnrollmentsContent(container) {
    showLoading(container, 'Carregando matrículas...');
    // Implementation will be added based on API endpoints
}

async function loadClassesContent(container) {
    showLoading(container, 'Carregando turmas...');
    // Implementation will be added based on API endpoints
}

async function loadProgressContent(container) {
    showLoading(container, 'Carregando progresso...');
    // Implementation will be added based on API endpoints
}

async function loadInsightsContent(container) {
    showLoading(container, 'Carregando insights...');
    // Implementation will be added based on API endpoints
}

// Load student data
async function loadStudentData() {
    console.log('📊 Loading student data...');
    
    try {
        const response = await window.fetchWithOrganization(`/api/students/${currentStudentId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentStudentData = result.data;
            updatePageHeader(currentStudentData);
            updateSidebarStats(currentStudentData);
            hideLoadingState();
        } else {
            showError('Erro ao carregar dados do aluno');
        }
    } catch (error) {
        console.error('❌ Error loading student data:', error);
        showError('Erro ao carregar dados do aluno');
    }
}

// Update page header
function updatePageHeader(student) {
    const nameEl = document.getElementById('editPageStudentName');
    const idEl = document.getElementById('editPageStudentId');
    const categoryEl = document.getElementById('editPageStudentCategory');
    
    if (nameEl) nameEl.textContent = `${student.firstName} ${student.lastName}`;
    if (idEl) idEl.textContent = `ID: ${student.id}`;
    if (categoryEl) categoryEl.textContent = `Categoria: ${student.category || 'N/A'}`;
}

// Update sidebar stats
function updateSidebarStats(student) {
    const stats = student.stats || {};
    
    const activeCoursesEl = document.getElementById('sidebarActiveCourses');
    const activeClassesEl = document.getElementById('sidebarActiveClasses');
    const attendanceRateEl = document.getElementById('sidebarAttendanceRate');
    
    if (activeCoursesEl) activeCoursesEl.textContent = stats.totalEnrollments || '0';
    if (activeClassesEl) activeClassesEl.textContent = stats.activeSubscriptions || '0';
    if (attendanceRateEl) attendanceRateEl.textContent = `${stats.attendanceRate || 0}%`;
}

// Populate profile form
function populateProfileForm(student) {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'category', 'emergencyContact', 'medicalConditions'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && student[field]) {
            element.value = student[field];
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-to-list-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            navigateToModule('students');
        });
    }
    
    // Save button
    const saveBtn = document.getElementById('save-student-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveStudentData);
    }
}

// Save student data
async function saveStudentData() {
    console.log('💾 Saving student data...');
    
    try {
        // Get data from current active form
        const activeForm = document.querySelector('.tab-content.active form');
        if (!activeForm) {
            showMessage('Nenhum formulário ativo encontrado', 'warning');
            return;
        }
        
        const formData = new FormData(activeForm);
        const data = Object.fromEntries(formData);
        
        const response = await window.fetchWithOrganization(`/api/students/${currentStudentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Dados salvos com sucesso!', 'success');
            currentStudentData = result.data;
            updatePageHeader(currentStudentData);
        } else {
            showMessage('Erro ao salvar dados: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ Error saving student data:', error);
        showMessage('Erro ao salvar dados', 'error');
    }
}

// Utility functions
function showLoading(container, message = 'Carregando...') {
    container.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 3rem; color: #CBD5E1;">
            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
    `;
}

function showErrorInContainer(container, message) {
    container.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: 1rem;">
                Tentar Novamente
            </button>
        </div>
    `;
}

function showError(message) {
    console.error('❌ Error:', message);
    // You can implement a toast notification here
    alert(message);
}

function showMessage(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    // You can implement a toast notification system here
    alert(message);
}

function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'none';
    }
}

// Global test function for debugging
window.testStudentEditorTabs = function() {
    console.log('🧪 Testing Student Editor Tabs...');
    
    const tabs = document.querySelectorAll('.page-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    console.log(`Found ${tabs.length} tabs and ${contents.length} contents`);
    
    // Test each tab
    ['profile', 'financial', 'enrollments', 'classes', 'progress', 'insights'].forEach((tabName, index) => {
        setTimeout(() => {
            console.log(`Testing tab: ${tabName}`);
            if (typeof switchTab === 'function') {
                switchTab(tabName);
            } else {
                console.error('switchTab function not available');
            }
        }, index * 1000);
    });
};

// Global function to manually switch tabs
window.switchToTab = function(tabName) {
    console.log(`🔄 Manual switch to: ${tabName}`);
    if (typeof switchTab === 'function') {
        switchTab(tabName);
    } else {
        console.error('switchTab function not available');
    }
};

// Quick action functions
function generateStudentQR() {
    console.log('📱 Generating QR code for student:', currentStudentId);
    showMessage('Funcionalidade de QR Code será implementada em breve', 'info');
}

function exportStudentData() {
    console.log('📊 Exporting student data:', currentStudentId);
    showMessage('Funcionalidade de exportação será implementada em breve', 'info');
}

function sendNotification() {
    console.log('📧 Sending notification to student:', currentStudentId);
    showMessage('Funcionalidade de notificação será implementada em breve', 'info');
}

// Financial action functions
function editSubscription(subscriptionId) {
    console.log('✏️ Editing subscription:', subscriptionId);
    if (window.studentEditor && typeof window.studentEditor.editSubscription === 'function') {
        window.studentEditor.editSubscription(subscriptionId);
    } else {
        showMessage('❌ Editor de assinatura não disponível', 'error');
    }
}

function cancelSubscription(subscriptionId) {
    if (confirm('Tem certeza que deseja cancelar esta assinatura?')) {
        console.log('❌ Cancelling subscription:', subscriptionId);
        showMessage('Funcionalidade de cancelamento será implementada em breve', 'info');
    }
}

function createNewSubscription() {
    console.log('➕ Creating new subscription for student:', currentStudentId);
    showMessage('Editor de nova assinatura será implementado em breve', 'info');
}

function enrollInCourse() {
    console.log('🎓 Enrolling student in course:', currentStudentId);
    showMessage('Funcionalidade de matrícula será implementada em breve', 'info');
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    console.log('🔄 Student Editor - Checking document ready state...');
    
    if (document.readyState === 'loading') {
        console.log('📄 Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOMContentLoaded fired, initializing...');
            initializeStudentEditorModule();
        });
    } else {
        console.log('📄 Document already loaded, initializing immediately...');
        // Add small delay to ensure CSS is loaded
        setTimeout(() => {
            initializeStudentEditorModule();
        }, 100);
    }
} else {
    console.log('🚫 Window not available (server-side?)');
}

console.log('👨‍🎓 Student Editor Module - Script Loaded');
