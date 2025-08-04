// ===========================================
// DASHBOARD CONTROLLER - ORIGINAL SYSTEM
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard original inicializado com sucesso!');
    
    // Initialize the dashboard
    initializeDashboard();
    
    // Set up navigation
    setupNavigation();
    
    // Load initial content
    showSection('dashboard');
});

// ===========================================
// NAVIGATION SYSTEM
// ===========================================

function setupNavigation() {
    // Add click handlers to navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showSection(page);
            }
        });
    });
}

function showSection(sectionName) {
    console.log(`📄 Navegando para: ${sectionName}`);
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update active navigation link
        updateActiveNavLink(sectionName);
        
        // Load section data if needed
        loadSectionData(sectionName);
    } else {
        console.warn(`❌ Seção '${sectionName}' não encontrada`);
        // Fallback to dashboard
        showSection('dashboard');
    }
}

function updateActiveNavLink(sectionName) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current nav link
    const activeLink = document.querySelector(`[data-page="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// ===========================================
// SECTION DATA LOADING
// ===========================================

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudentsData();
            break;
        case 'classes':
            loadClassesData();
            break;
        case 'financial':
            loadFinancialData();
            break;
        case 'subscriptions':
            loadSubscriptionsData();
            break;
        // Add other sections as needed
        default:
            console.log(`📝 Seção '${sectionName}' não requer carregamento específico`);
    }
}

async function loadDashboardData() {
    try {
        console.log('📊 Carregando dados do dashboard...');
        
        // Load basic stats
        const response = await fetch('/api/students');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateDashboardStats(result.data);
            }
        }
        
        // Load other dashboard data as needed
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
    }
}

function updateDashboardStats(studentsData) {
    const totalStudents = studentsData.length;
    const activeStudents = studentsData.filter(s => s.user && s.user.isActive).length;
    
    // Update dashboard stats if elements exist
    const totalElement = document.getElementById('total-students');
    const activeElement = document.getElementById('active-students');
    
    if (totalElement) totalElement.textContent = totalStudents;
    if (activeElement) activeElement.textContent = activeStudents;
}

async function loadStudentsData() {
    try {
        console.log('👥 Carregando dados dos alunos...');
        
        // If students.js module is loaded, use it
        if (typeof loadStudentsModule === 'function') {
            loadStudentsModule();
        } else {
            // Fallback: basic student loading
            const response = await fetch('/api/students');
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log(`✅ ${result.data.length} alunos carregados`);
                    // Basic rendering would go here
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados dos alunos:', error);
    }
}

async function loadClassesData() {
    try {
        console.log('🏫 Carregando dados das turmas...');
        // Implementation depends on your classes API
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados das turmas:', error);
    }
}

async function loadFinancialData() {
    try {
        console.log('💰 Carregando dados financeiros...');
        // Implementation depends on your financial API
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados financeiros:', error);
    }
}

async function loadSubscriptionsData() {
    try {
        console.log('📋 Carregando dados de assinaturas...');
        
        const response = await fetch('/api/billing-plans');
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log(`✅ ${result.data.length} planos carregados`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados de assinaturas:', error);
    }
}

// ===========================================
// DASHBOARD INITIALIZATION
// ===========================================

function initializeDashboard() {
    console.log('🔧 Inicializando dashboard...');
    
    // Initialize sidebar toggle
    setupSidebarToggle();
    
    // Initialize any other dashboard components
    initializeComponents();
    
    console.log('✅ Dashboard inicializado com sucesso!');
}

function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.quick-action-btn');
    const sidebar = document.getElementById('dashboardSidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
}

function initializeComponents() {
    // Initialize any additional components here
    // This could include modals, tooltips, etc.
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function toggleSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// ===========================================
// GLOBAL EXPORT FOR COMPATIBILITY
// ===========================================

// Export functions that might be used by other modules
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.loadSectionData = loadSectionData;

console.log('📝 Dashboard.js carregado - Sistema original restaurado');