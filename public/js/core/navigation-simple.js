/**
 * Navigation System - Simplified version
 */

class NavigationSystem {
    constructor() {
        this.currentModule = 'dashboard';
        this.elements = {
            container: null,
            sidebar: null,
            navLinks: null
        };
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.updateActiveNavigation();
    }
    
    initializeElements() {
        this.elements.container = document.querySelector('#dashboardContainer');
        this.elements.sidebar = document.querySelector('#dashboardSidebar');
        this.elements.navLinks = document.querySelectorAll('.nav-link[data-page]');
        
        if (!this.elements.container) {
            console.error('❌ Navigation: Dashboard container not found');
            return;
        }
        
        console.log('🧭 Navigation: Elements initialized');
    }
    
    bindEvents() {
        // Navigation link clicks
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.navigateTo(page);
                }
            });
        });
    }
    
    navigateTo(moduleId) {
        console.log(`🧭 Navigation: Navigating to ${moduleId}`);
        
        // Update current module
        this.currentModule = moduleId;
        
        // Update UI
        this.updateActiveNavigation();
        this.showSection(moduleId);
        
        // Close mobile sidebar if open
        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
        }
        
        return true;
    }
    
    updateActiveNavigation() {
        this.elements.navLinks.forEach(link => {
            const isActive = link.dataset.page === this.currentModule;
            
            if (isActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    showSection(moduleId) {
        const sections = document.querySelectorAll('.content-section');
        
        sections.forEach(section => {
            if (section.id === moduleId) {
                section.classList.add('active');
                // Load module content if needed
                this.loadModuleContent(moduleId);
            } else {
                section.classList.remove('active');
            }
        });
    }
    
    async loadModuleContent(moduleId) {
        console.log(`📦 Loading module content for: ${moduleId}`);
        
        try {
            switch (moduleId) {
                case 'students':
                    // Navigate to full students page in same tab
                    window.location.href = '/index.html#students';
                    return; // Don't continue with showSection
                case 'classes':
                    // Navigate to full classes page in same tab
                    window.location.href = '/views/classes.html';
                    return; // Don't continue with showSection
                case 'financial':
                    await this.loadFinancialModule();
                    break;
                case 'attendance':
                    await this.loadAttendanceModule();
                    break;
                default:
                    console.log(`No specific loader for module: ${moduleId}`);
            }
        } catch (error) {
            console.error(`❌ Error loading module ${moduleId}:`, error);
            this.showModuleError(moduleId, error.message);
        }
    }
    
    async loadClassesModule() {
        // Navigate to full classes page in same tab
        window.location.href = '/views/classes.html';
    }
    
    async loadFinancialModule() {
        // Placeholder for financial module
        const financialContent = document.getElementById('financialContent');
        if (financialContent) {
            financialContent.innerHTML = `
                <div class="placeholder-content">
                    <h3>💰 Módulo Financeiro</h3>
                    <p>Em desenvolvimento...</p>
                </div>
            `;
        }
    }
    
    async loadAttendanceModule() {
        // Placeholder for attendance module
        const attendanceContent = document.getElementById('attendanceContent');
        if (attendanceContent) {
            attendanceContent.innerHTML = `
                <div class="placeholder-content">
                    <h3>📋 Módulo de Presença</h3>
                    <p>Em desenvolvimento...</p>
                </div>
            `;
        }
    }
    
    showModuleError(moduleId, errorMessage) {
        const content = document.getElementById(`${moduleId}Content`);
        if (content) {
            content.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">Erro ao carregar módulo</div>
                    <div class="error-details">${errorMessage}</div>
                    <button class="btn btn-primary" onclick="navigation.navigateTo('${moduleId}')">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
    
    // Student management methods
    createStudent() {
        console.log('📝 Creating new student...');
        // Navigate to student editor for creation
        window.location.href = '/views/student-editor.html';
    }
    
    viewStudent(studentId) {
        console.log(`👁️ Viewing student: ${studentId}`);
        // Navigate to student editor in view mode
        window.location.href = `/views/student-editor.html?id=${studentId}&mode=view`;
    }
    
    editStudent(studentId) {
        console.log(`✏️ Editing student: ${studentId}`);
        // Navigate to student editor in edit mode
        window.location.href = `/views/student-editor.html?id=${studentId}&mode=edit`;
    }
    
    toggleSidebar() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            this.toggleMobileSidebar();
        } else {
            this.toggleDesktopSidebar();
        }
    }
    
    toggleDesktopSidebar() {
        this.elements.container.classList.toggle('sidebar-collapsed');
    }
    
    toggleMobileSidebar() {
        this.elements.container.classList.toggle('sidebar-open');
    }
    
    closeMobileSidebar() {
        this.elements.container.classList.remove('sidebar-open');
    }
    
    getCurrentModule() {
        return this.currentModule;
    }
}

// Create instance
const navigation = new NavigationSystem();

// Export for module use
export { navigation, NavigationSystem };
export default navigation;
