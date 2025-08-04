/**
 * Navigation Module - Krav Academy
 * Handles all navigation-related functionality including page switching,
 * data loading, and sidebar interactions.
 * 
 * @author Claude Code
 * @version 2.0
 */

// ==========================================
// NAVIGATION CORE FUNCTIONS
// ==========================================

/**
 * Shows a specific content section and hides others
 * @param {string} pageName - The ID of the section to show
 */
export function showSection(pageName) {
    try {
        // Hide all sections with explicit display none
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Remove active from all navigation buttons
        document.querySelectorAll('.nav-link').forEach(button => {
            button.classList.remove('active');
        });

        // Show target section with explicit display block
        const targetSection = document.getElementById(pageName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        } else {
            console.warn(`Navigation: Section not found - ${pageName}`);
            showErrorSection(pageName);
            return;
        }

        // Activate current button
        const activeButton = document.querySelector(`[data-page="${pageName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Load data for specific sections
        loadSectionData(pageName);

    } catch (error) {
        console.error('Navigation: Error in showSection:', error);
        showToast('Erro ao navegar para a página', 'error');
    }
}

/**
 * Toggles the sidebar visibility
 */
export function toggleSidebar() {
    try {
        const container = document.getElementById('dashboardContainer');
        const sidebar = document.getElementById('dashboardSidebar');
        
        if (window.innerWidth <= 768) {
            // Mobile: toggle sidebar open/close
            sidebar.classList.toggle('open');
        } else {
            // Desktop: toggle collapsed state
            container.classList.toggle('collapsed');
        }
    } catch (error) {
        console.error('Navigation: Error in toggleSidebar:', error);
    }
}

/**
 * Shows an error section when navigation fails
 * @param {string} sectionName - The name of the section that failed to load
 */
function showErrorSection(sectionName) {
    const content = `
        <div class="error-section">
            <h2>Página não encontrada</h2>
            <p>A seção "${sectionName}" não foi encontrada.</p>
            <button onclick="showSection('dashboard')" class="btn btn-primary">
                Voltar ao Dashboard
            </button>
        </div>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = content;
    }
}

// ==========================================
// DATA LOADING FUNCTIONS
// ==========================================

/**
 * Loads data for specific sections based on page name
 * @param {string} pageName - The page that needs data loading
 */
async function loadSectionData(pageName) {
    try {
        switch (pageName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'students':
                await loadStudentsData();
                break;
            case 'classes':
                await loadClassesData();
                break;
            case 'courses':
                await loadCoursesData();
                break;
            case 'financial':
                await loadFinancialData();
                break;
            case 'financial-responsibles':
                await loadFinancialResponsiblesData();
                break;
            case 'attendance':
                await loadAttendanceData();
                break;
            case 'student-portal':
                resetStudentPortal();
                break;
            case 'public-checkin':
                await loadPublicCheckinData();
                break;
            case 'settings':
                await loadSettingsData();
                break;
            case 'knowledge-base':
                await loadKnowledgeBaseData();
                break;
            default:
                console.log(`Navigation: No specific data loader for ${pageName}`);
        }
    } catch (error) {
        console.error(`Navigation: Error loading data for ${pageName}:`, error);
        showToast(`Erro ao carregar dados da página ${pageName}`, 'error');
    }
}

/**
 * Loads dashboard data including student counts and statistics
 */
async function loadDashboardData() {
    try {
        const response = await fetch('/api/students');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const total = data.data.length;
            const active = data.data.filter(s => s.user && s.user.isActive).length;
            
            updateElementText('total-students', total);
            updateElementText('active-students', active);
            updateElementText('students-count', total);
        } else {
            // Handle empty data gracefully
            updateElementText('total-students', '0');
            updateElementText('active-students', '0');
            updateElementText('students-count', '0');
        }
    } catch (error) {
        console.error('Navigation: Error loading dashboard data:', error);
        // Set default values on error
        updateElementText('total-students', '-');
        updateElementText('active-students', '-');
        updateElementText('students-count', '-');
    }
}

/**
 * Loads students data by calling the appropriate module function
 */
async function loadStudentsData() {
    if (typeof window.loadAndRenderStudents === 'function') {
        await window.loadAndRenderStudents();
    } else if (typeof loadStudentsList === 'function') {
        await loadStudentsList();
    } else {
        console.warn('Navigation: No student loader function available');
    }
}

/**
 * Loads classes data by calling the appropriate module function
 */
async function loadClassesData() {
    if (typeof window.loadAndRenderClasses === 'function') {
        await window.loadAndRenderClasses();
    } else if (typeof loadClassesList === 'function') {
        await loadClassesList();
    } else {
        console.warn('Navigation: No classes loader function available');
    }
}

/**
 * Loads courses data by calling the appropriate module function
 */
async function loadCoursesData() {
    if (typeof window.loadAndRenderCourses === 'function') {
        await window.loadAndRenderCourses();
    } else if (typeof loadCourses === 'function') {
        await loadCourses();
    } else {
        console.warn('Navigation: No courses loader function available');
    }
}

/**
 * Loads financial/plans data by calling the appropriate module function
 */
async function loadFinancialData() {
    if (typeof window.loadAndRenderPlans === 'function') {
        await window.loadAndRenderPlans();
    } else {
        console.warn('Navigation: No financial/plans loader function available');
    }
}

/**
 * Loads financial responsibles data
 */
async function loadFinancialResponsiblesData() {
    if (typeof loadFinancialResponsiblesList === 'function') {
        await loadFinancialResponsiblesList();
    } else {
        console.warn('Navigation: No financial responsibles loader function available');
    }
}

/**
 * Loads attendance data
 */
async function loadAttendanceData() {
    if (typeof loadAttendanceList === 'function') {
        await loadAttendanceList();
    } else {
        console.warn('Navigation: No attendance loader function available');
    }
}

/**
 * Loads public check-in functionality
 */
async function loadPublicCheckinData() {
    if (typeof loadPublicCheckin === 'function') {
        await loadPublicCheckin();
    } else {
        console.warn('Navigation: No public check-in loader function available');
    }
}

/**
 * Loads settings data
 */
async function loadSettingsData() {
    if (typeof window.loadSettings === 'function') {
        await window.loadSettings();
    } else {
        console.warn('Navigation: No settings loader function available');
    }
}

/**
 * Loads knowledge base data
 */
async function loadKnowledgeBaseData() {
    if (typeof window.loadKnowledgeBaseFromStorage === 'function') {
        await window.loadKnowledgeBaseFromStorage();
    } else {
        console.warn('Navigation: No knowledge base loader function available');
    }
}

/**
 * Resets student portal to login screen
 */
function resetStudentPortal() {
    try {
        const loginSection = document.getElementById('studentLoginSection');
        const dashboard = document.getElementById('studentDashboard');
        
        if (loginSection) loginSection.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        
        // Reset current student if the variable exists
        if (typeof window.currentStudent !== 'undefined') {
            window.currentStudent = null;
        }
    } catch (error) {
        console.error('Navigation: Error resetting student portal:', error);
    }
}

// ==========================================
// NAVIGATION EVENT HANDLERS
// ==========================================

/**
 * Initializes navigation event listeners
 */
export function initializeNavigation() {
    try {
        // Setup navigation buttons
        const navButtons = document.querySelectorAll('.nav-link');
        navButtons.forEach(button => {
            const page = button.getAttribute('data-page');
            
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const targetPage = this.getAttribute('data-page');
                if (targetPage) {
                    showSection(targetPage);
                }
            });
        });

        // Setup sidebar toggle if button exists
        const toggleBtn = document.querySelector('[onclick*="toggleSidebar"]');
        if (toggleBtn) {
            toggleBtn.removeAttribute('onclick');
            toggleBtn.addEventListener('click', toggleSidebar);
        }

        // Load initial data
        loadDashboardData();
        
        console.log('Navigation: Initialized successfully');
    } catch (error) {
        console.error('Navigation: Error during initialization:', error);
    }
}

/**
 * Sets up keyboard navigation shortcuts
 */
export function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        // Escape key to close any open modals or return to dashboard
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal.active');
            if (modals.length > 0) {
                modals.forEach(modal => modal.classList.remove('active'));
            } else {
                showSection('dashboard');
            }
        }
        
        // Ctrl/Cmd + number keys for quick navigation
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
            event.preventDefault();
            const navButtons = document.querySelectorAll('.nav-link');
            const index = parseInt(event.key) - 1;
            if (navButtons[index]) {
                const page = navButtons[index].getAttribute('data-page');
                if (page) showSection(page);
            }
        }
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Safely updates element text content
 * @param {string} elementId - The ID of the element to update
 * @param {string|number} text - The text to set
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Shows a toast notification (requires ui.js showToast function)
 * @param {string} message - The message to show
 * @param {string} type - The type of notification
 */
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`Toast: ${type.toUpperCase()} - ${message}`);
    }
}

/**
 * Gets the current active page
 * @returns {string|null} The current page ID or null if none found
 */
export function getCurrentPage() {
    const activeSection = document.querySelector('.content-section.active');
    return activeSection ? activeSection.id : null;
}

/**
 * Navigates to a specific page (alias for showSection)
 * @param {string} pageName - The page to navigate to
 */
export function navigateTo(pageName) {
    showSection(pageName);
}

/**
 * Checks if a page exists before navigating
 * @param {string} pageName - The page to check
 * @returns {boolean} True if page exists
 */
export function pageExists(pageName) {
    return document.getElementById(pageName) !== null;
}

// ==========================================
// AUTO-INITIALIZATION
// ==========================================

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeNavigation();
        initializeKeyboardNavigation();
    });
} else {
    // DOM already loaded
    initializeNavigation();
    initializeKeyboardNavigation();
}

// Make key functions globally available for backward compatibility
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.navigateTo = navigateTo;