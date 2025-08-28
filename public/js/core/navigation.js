/**
 * Navigation System Module
 * Handles all page navigation, sidebar, and data loading functionality
 */

class NavigationSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.sidebarOpen = false;
        this.initialized = false;
    }

    /**
     * Initialize the navigation system
     */
    init() {
        if (this.initialized) return;
        
        console.log('🚀 Initializing Navigation System...');
        
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.loadInitialPage();
        
        this.initialized = true;
        console.log('✅ Navigation System initialized');
    }

    /**
     * Setup navigation event listeners
     */
    setupEventListeners() {
        // Navigation button listeners
        document.addEventListener('click', (e) => {
            const navButton = e.target.closest('[data-page]');
            if (navButton) {
                e.preventDefault();
                const targetPage = navButton.getAttribute('data-page');
                this.showSection(targetPage);
            }
        });

        // Sidebar toggle
        document.addEventListener('click', (e) => {
            // Botão de toggle do menu
            if (e.target.closest('.menu-toggle')) {
                e.preventDefault();
                this.toggleSidebar();
            }
            // Compatibilidade com onclick
            if (e.target.matches('[onclick*="toggleSidebar"]')) {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    /**
     * Setup keyboard navigation shortcuts
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes sidebar
            if (e.key === 'Escape' && this.sidebarOpen) {
                this.toggleSidebar();
                return;
            }

            // Ctrl + Number keys for quick navigation
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const pages = ['dashboard', 'students', 'classes', 'evaluations', 'progress', 'financial', 'attendance', 'settings'];
                const pageIndex = parseInt(e.key) - 1;
                if (pages[pageIndex]) {
                    this.showSection(pages[pageIndex]);
                }
            }
        });
    }

    /**
     * Main page switching function
     */
    showSection(pageName) {
        if (!pageName || !this.pageExists(pageName)) {
            console.warn('❌ Invalid page name:', pageName);
            return;
        }

        console.log(`🔄 Navigating to: ${pageName}`);

        try {
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            // Remove active from all buttons
            document.querySelectorAll('.nav-link').forEach(button => {
                button.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(pageName);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
            } else {
                console.warn('Section not found:', pageName);
                return;
            }

            // Activate current button
            const activeButton = document.querySelector(`[data-page="${pageName}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }

            // Update current page
            this.currentPage = pageName;

            // Load page data
            this.loadPageData(pageName);

            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }

        } catch (error) {
            console.error('❌ Navigation error:', error);
            this.showToast('Erro na navegação', 'error');
        }
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        this.sidebarOpen = !this.sidebarOpen;
        
        if (this.sidebarOpen) {
            sidebar.classList.add('expanded');
        } else {
            sidebar.classList.remove('expanded');
        }

        console.log(`📱 Sidebar ${this.sidebarOpen ? 'expanded' : 'collapsed'}`);
    }

    /**
     * Close sidebar
     */
    closeSidebar() {
        this.sidebarOpen = false;
        const sidebar = document.getElementById('dashboardSidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    /**
     * Load data for specific page
     */
    async loadPageData(pageName) {
        console.log(`📊 Loading data for: ${pageName}`);

        try {
            switch (pageName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'students':
                    await this.loadStudentsData();
                    break;
                case 'classes':
                    await this.loadClassesData();
                    break;
                case 'courses':
                    await this.loadCoursesData();
                    break;
                case 'financial':
                    await this.loadFinancialData();
                    break;
                case 'attendance':
                    await this.loadAttendanceData();
                    break;
                case 'public-checkin':
                    await this.loadPublicCheckinData();
                    break;
                default:
                    console.log(`ℹ️ No specific data loader for: ${pageName}`);
            }
        } catch (error) {
            console.error(`❌ Error loading data for ${pageName}:`, error);
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            const response = await fetch('/api/students');
            if (response.ok) {
                const data = await response.json();
                this.updateElementText('student-count', data.data?.length || 0);
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
        }
    }

    /**
     * Load students data
     */
    async loadStudentsData() {
        // Delegate to students module if available
        if (window.loadStudents) {
            await window.loadStudents();
        } else if (window.loadStudentsData) {
            await window.loadStudentsData();
        }
    }

    /**
     * Load classes data
     */
    async loadClassesData() {
        // Delegate to classes module if available
        if (window.loadClasses) {
            await window.loadClasses();
        }
    }

    /**
     * Load courses data
     */
    async loadCoursesData() {
        // Delegate to courses module if available
        if (window.loadCourses) {
            await window.loadCourses();
        }
    }

    /**
     * Load financial data
     */
    async loadFinancialData() {
        // Delegate to financial module if available
        if (window.loadFinancial) {
            await window.loadFinancial();
        }
    }

    /**
     * Load attendance data
     */
    async loadAttendanceData() {
        // Delegate to attendance module if available
        if (window.loadAttendance) {
            await window.loadAttendance();
        }
    }

    /**
     * Load public check-in data
     */
    async loadPublicCheckinData() {
        console.log('📋 Loading public check-in interface...');
        this.resetStudentPortal();
    }

    /**
     * Reset student portal to login screen
     */
    resetStudentPortal() {
        const portal = document.getElementById('student-portal-content');
        if (portal) {
            portal.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">🥋</div>
                    <h2 style="color: #F8FAFC; margin-bottom: 1rem;">Portal do Aluno</h2>
                    <p style="color: #94A3B8; margin-bottom: 2rem;">Digite seu código de matrícula</p>
                    <input type="text" id="student-code" placeholder="Código de matrícula" 
                           style="padding: 1rem; border-radius: 8px; border: 1px solid #334155; background: #1E293B; color: #F8FAFC; width: 300px; margin-bottom: 1rem;">
                    <br>
                    <button onclick="loginStudent()" style="background: #3B82F6; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">
                        Entrar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Check if page exists
     */
    pageExists(pageName) {
        return document.getElementById(pageName) !== null;
    }

    /**
     * Load initial page
     */
    loadInitialPage() {
        const urlHash = window.location.hash.replace('#', '');
        const initialPage = urlHash || 'dashboard';
        this.showSection(initialPage);
    }

    /**
     * Get current active page
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Navigate to page (alias for showSection)
     */
    navigateTo(pageName) {
        this.showSection(pageName);
    }

    /**
     * Update element text safely
     */
    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Simple toast implementation
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        // Try to use existing toast system if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Fallback: Simple alert for now
        if (type === 'error') {
            alert('Erro: ' + message);
        }
    }
}

// Initialize navigation system
const navigationSystem = new NavigationSystem();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => navigationSystem.init());
} else {
    navigationSystem.init();
}

// Export for ES6 modules
export default navigationSystem;
export const { showSection, toggleSidebar, navigateTo, getCurrentPage } = navigationSystem;

// Global access for legacy compatibility
window.navigationSystem = navigationSystem;
window.showSection = (pageName) => navigationSystem.showSection(pageName);
window.toggleSidebar = () => navigationSystem.toggleSidebar();
window.navigateTo = (pageName) => navigationSystem.navigateTo(pageName);
window.getCurrentPage = () => navigationSystem.getCurrentPage();