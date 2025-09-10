// Courses List Controller - AGENTS.md v2.0 Compliant
// Handles courses listing and navigation with premium UI

class CoursesController {
    constructor() {
        this.moduleAPI = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // AGENTS.md: Wait for API client and create module API
            await this.waitForAPIClient();
            this.moduleAPI = window.createModuleAPI('Courses');
            
            if (!this.moduleAPI) {
                throw new Error('Failed to initialize Courses API client');
            }

            this.setupEventListeners();
            await this.loadCourses();
            this.isInitialized = true;

            // AGENTS.md: Dispatch module loaded event
            window.app?.dispatchEvent('module:loaded', { 
                name: 'courses-controller',
                controller: this 
            });

        } catch (error) {
            window.app?.handleError(error, 'Initializing courses controller');
        }
    }

    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
                return;
            }
            
            const checkAPI = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    setupEventListeners() {
        // Handle "Novo Curso" button clicks
        document.querySelectorAll('[data-action="openNewCourseForm"]').forEach(button => {
            button.addEventListener('click', () => {
                this.navigateToCourseForm();
            });
        });

        // Handle course row single clicks for course details
        document.addEventListener('click', (event) => {
            const courseRow = event.target.closest('.course-row');
            if (courseRow && !event.target.closest('.course-actions')) {
                const courseId = courseRow.dataset.courseId;
                this.navigateToCourseDetails(courseId);
            }
        });

        // Handle course row double-clicks for editing
        document.addEventListener('dblclick', (event) => {
            const courseRow = event.target.closest('.course-row');
            if (courseRow) {
                const courseId = courseRow.dataset.courseId;
                this.navigateToCourseForm(courseId);
            }
        });

        // Handle import course
        document.getElementById('importCourseBtn')?.addEventListener('click', () => {
            document.getElementById('importCourseFile').click();
        });

        document.getElementById('importCourseFile')?.addEventListener('change', (e) => this.handleCourseImport(e));

        // Handle generate with AI
        document.getElementById('generateWithAIBtn')?.addEventListener('click', () => this.generateCourseWithAI());
    }

    async loadCourses() {
        try {
            // AGENTS.md: Use fetchWithStates pattern
            await this.moduleAPI.fetchWithStates('/api/courses', {
                loadingElement: document.getElementById('coursesTable'),
                onSuccess: (data) => {
                    this.renderCourses(data);
                    this.updateStats(data);
                },
                onEmpty: () => this.showEmptyState(),
                onError: (error) => window.app?.handleError(error, "Carregando cursos")
            });
        } catch (error) {
            window.app?.handleError(error, "Carregando cursos");
        }
    }

    renderCourses(courses) {
        const container = document.getElementById('coursesTable');
        if (!container) return;

        // AGENTS.md: Premium UI with enhanced cards
        container.innerHTML = courses.map(course => `
            <div class="data-card-premium course-row" data-course-id="${course.id || course.courseId}" style="cursor: pointer;">
                <div class="course-info">
                    <h3 class="course-name">${course.name}</h3>
                    <p class="course-description">${course.description || ''}</p>
                    <div class="course-meta">
                        <span class="meta-item">📅 ${course.durationTotalWeeks || 0} semanas</span>
                        <span class="meta-item">📚 ${course.totalLessons || 0} aulas</span>
                        <span class="meta-item">🎯 ${course.difficulty || 'N/A'}</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn btn-primary" onclick="window.coursesController.navigateToCourseDetails('${course.id || course.courseId}')">
                        👁️ Detalhes
                    </button>
                    <button class="btn btn-secondary" onclick="window.coursesController.navigateToCourseForm('${course.id || course.courseId}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-danger" onclick="window.coursesController.deleteCourse('${course.id || course.courseId}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats(courses) {
        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => c.active !== false).length;
        const inactiveCourses = totalCourses - activeCourses;

        // Count unique difficulties as categories
        const categories = new Set(courses.map(c => c.difficulty).filter(Boolean)).size;

        // AGENTS.md: Update premium stats cards
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('totalCourses', totalCourses);
        updateElement('activeCourses', activeCourses);
        updateElement('inactiveCourses', inactiveCourses);
        updateElement('categoriesCount', categories);
    }

    showEmptyState() {
        const container = document.getElementById('coursesTable');
        if (!container) return;

        // AGENTS.md: Premium empty state
        container.innerHTML = `
            <div class="empty-state-premium">
                <div class="empty-icon">📚</div>
                <h3>Nenhum curso encontrado</h3>
                <p>Comece criando seu primeiro curso</p>
                <button class="btn btn-primary" data-action="openNewCourseForm">
                    ➕ Criar Primeiro Curso
                </button>
            </div>
        `;
    }

    navigateToCourseForm(courseId = null) {
        if (courseId) {
            // Navigate to course editor with ID
            window.location.hash = `course-editor/${courseId}`;
        } else {
            // Navigate to course editor for new course
            window.location.hash = 'course-editor';
        }
    }

    navigateToCourseDetails(courseId) {
        if (!courseId) {
            console.error('Course ID required for details navigation');
            return;
        }
        // Navigate to course details view
        window.location.hash = `course-details/${courseId}`;
    }

    async deleteCourse(courseId) {
        if (!confirm('Tem certeza que deseja excluir este curso?')) return;

        try {
            // AGENTS.md: Use fetchWithStates for DELETE operations
            await this.moduleAPI.fetchWithStates(`/api/courses/${courseId}`, {
                method: 'DELETE',
                onSuccess: () => {
                    window.app?.dispatchEvent('course:deleted', { courseId });
                    this.loadCourses(); // Reload the list
                },
                onError: (error) => window.app?.handleError(error, "Excluindo curso")
            });
        } catch (error) {
            window.app?.handleError(error, "Excluindo curso");
        }
    }

    async handleCourseImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const courseData = JSON.parse(text);

            // AGENTS.md: Use fetchWithStates for POST operations
            await this.moduleAPI.fetchWithStates('/api/courses', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(courseData),
                onSuccess: () => {
                    window.app?.dispatchEvent('course:imported', { courseData });
                    this.loadCourses(); // Reload the list
                },
                onError: (error) => window.app?.handleError(error, "Importando curso")
            });
        } catch (error) {
            window.app?.handleError(error, "Importando curso");
        }
    }

    async generateCourseWithAI() {
        // AGENTS.md: AI integration dispatch event
        window.app?.dispatchEvent('course:generate-ai');
        // For now, just navigate to form
        this.navigateToCourseForm();
    }

    // Public API for other modules
    refreshCourses() {
        return this.loadCourses();
    }

    isReady() {
        return this.isInitialized && this.moduleAPI !== null;
    }
}

// Create singleton instance and expose globally
const coursesController = new CoursesController();
window.coursesController = coursesController;

// AGENTS.md: Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Controller initializes itself
    console.log('Courses Controller DOM ready');
});
