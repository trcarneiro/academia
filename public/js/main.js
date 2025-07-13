import { showToast, toggleSidebar, showSection } from './ui.js';
import { 
    loadAndRenderStudents, 
    initStudentEventListeners,
    loadStudentCourses
} from './students.js';
import { loadDashboard } from './dashboard.js';
import { loadCourses } from './courses.js';
import { loadAttendance } from './attendance.js';
import { loadReports } from './reporting.js';
import { loadGraduation } from './graduation.js';
import { loadSettings } from './settings.js';
import { loadKnowledgeBaseFromStorage } from './knowledge.js';
import { setCurrentEditingStudentId, setAllStudents } from './store.js';

// ==========================================
// GLOBAL VARIABLES
// ==========================================
// let currentEditingStudentId = null;
// let allStudents = []; // Cache for student data

// ==========================================
// NAVIGATION
// ==========================================

function updateActiveLink(page) {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        if (link.getAttribute('onclick').includes(`loadPage('${page}')`)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function loadPage(page, studentId = null) {
    console.log(`loadPage called with page: ${page}, studentId: ${studentId}`);
    const pageContent = document.getElementById('page-content');
    if (!pageContent) {
        console.error('page-content element not found');
        return;
    }

    // Clear previous content
    pageContent.innerHTML = '';

    // Load new content based on the page
    switch (page) {
        case 'dashboard':
            pageContent.innerHTML = `
                <div id="dashboard-container"></div>
            `;
            loadDashboard();
            break;
        case 'students':
            pageContent.innerHTML = `
                <div class="students-header">
                    <input type="text" id="student-search" placeholder="Buscar alunos..." onkeyup="filterStudents(event)">
                    <button onclick="openStudentPage(null)">Novo Aluno</button>
                </div>
                <div id="students-container"></div>
            `;
            loadAndRenderStudents();
            break;
        case 'courses':
            pageContent.innerHTML = `
                <div id="courses-container"></div>
            `;
            loadCourses();
            break;
        case 'attendance':
            pageContent.innerHTML = `
                <div id="attendance-container"></div>
            `;
            loadAttendance();
            break;
        case 'reports':
            pageContent.innerHTML = `
                <div id="reports-container"></div>
            `;
            loadReports();
            break;
        case 'graduation':
            pageContent.innerHTML = `
                <div id="graduation-container"></div>
            `;
            loadGraduation();
            break;
        case 'settings':
            pageContent.innerHTML = `
                <div id="settings-container"></div>
            `;
            loadSettings();
            break;
        case 'knowledge':
            pageContent.innerHTML = `
                <div id="knowledge-base-container"></div>
            `;
            loadKnowledgeBaseFromStorage();
            break;
        default:
            pageContent.innerHTML = '<h2>Página não encontrada</h2>';
    }
    updateActiveLink(page);
}


// ========================================
// Initial Load Function
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Attach main navigation events
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
                // Update active link styling
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Attach other global event listeners
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Initialize event listeners for each module
    initStudentEventListeners();
    // TODO: Add other module initializers here (initCourseEventListeners, etc.)

    // Load initial section
    showSection('dashboard');
    const dashboardLink = document.querySelector('.sidebar-link[data-section="dashboard"]');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
});

// Make critical functions globally available if needed by legacy code or other modules
window.showSection = showSection;
window.showToast = showToast;
window.loadStudentCourses = loadStudentCourses;

// Cleanup obsolete functions from window
// window.loadPage = loadPage;
// window.filterStudents = filterStudents;
// window.setCurrentEditingStudentId = setCurrentEditingStudentId;
// window.setAllStudents = setAllStudents;
