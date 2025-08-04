/**
 * Lessons Module
 * Manages lessons for Krav Maga Academy
 */
class LessonsModule {
    constructor() {
        this.lessons = [];
        this.filteredLessons = [];
        this.courses = [];
        this.units = [];
        this.currentLesson = null;
        this.filters = {
            course: '',
            unit: '',
            status: '',
            search: ''
        };
        this.sortConfig = {
            key: 'date',
            direction: 'desc'
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            console.error('Error initializing lessons module:', error);
            this.showError('Erro ao carregar módulo de aulas');
        }
    }

    async loadData() {
        try {
            // Load lessons
            const lessonsResponse = await fetch('/api/lessons');
            if (lessonsResponse.ok) {
                this.lessons = await lessonsResponse.json();
            } else {
                // Fallback data
                this.lessons = this.getFallbackLessons();
            }

            // Load courses for filtering
            const coursesResponse = await fetch('/api/courses');
            if (coursesResponse.ok) {
                this.courses = await coursesResponse.json();
            } else {
                this.courses = this.getFallbackCourses();
            }

            // Load units
            const unitsResponse = await fetch('/api/units');
            if (unitsResponse.ok) {
                this.units = await unitsResponse.json();
            } else {
                this.units = this.getFallbackUnits();
            }

            this.filteredLessons = [...this.lessons];
        } catch (error) {
            console.error('Error loading data:', error);
            this.lessons = this.getFallbackLessons();
            this.courses = this.getFallbackCourses();
            this.units = this.getFallbackUnits();
            this.filteredLessons = [...this.lessons];
        }
    }

    getFallbackLessons() {
        return [
            {
                id: 1,
                courseId: 1,
                unitId: 1,
                lessonNumber: 1,
                title: "Introdução ao Krav Maga",
                date: "2024-01-15",
                time: "19:00",
                duration: 90,
                status: "completed",
                techniques: ["Postura básica", "Guarda", "Movimento lateral"],
                attendance: [
                    { studentId: 1, name: "João Silva", present: true },
                    { studentId: 2, name: "Maria Santos", present: true }
                ],
                notes: "Primeira aula do curso básico. Excelente participação dos alunos."
            },
            {
                id: 2,
                courseId: 1,
                unitId: 1,
                lessonNumber: 2,
                title: "Defesa Pessoal Básica",
                date: "2024-01-17",
                time: "19:00",
                duration: 90,
                status: "completed",
                techniques: ["Defesa de soco", "Defesa de agarrão", "Sai de frente"],
                attendance: [
                    { studentId: 1, name: "João Silva", present: true },
                    { studentId: 3, name: "Pedro Oliveira", present: true }
                ],
                notes: "Foco nas técnicas de defesa básica. Progresso notável dos alunos."
            },
            {
                id: 3,
                courseId: 2,
                unitId: 2,
                lessonNumber: 1,
                title: "Técnicas Avançadas de Defesa",
                date: "2024-01-20",
                time: "20:30",
                duration: 120,
                status: "scheduled",
                techniques: ["Defesa contra arma", "Técnicas de imobilização", "Contra-ataque"],
                attendance: [],
                notes: "Primeira aula do módulo avançado. Revisão de técnicas básicas necessária."
            }
        ];
    }

    getFallbackCourses() {
        return [
            { id: 1, name: "Krav Maga Básico", level: "Iniciante" },
            { id: 2, name: "Krav Maga Avançado", level: "Avançado" },
            { id: 3, name: "Defesa Pessoal Feminina", level: "Iniciante" }
        ];
    }

    getFallbackUnits() {
        return [
            { id: 1, courseId: 1, name: "Unidade 1 - Fundamentos", order: 1 },
            { id: 2, courseId: 2, name: "Unidade 1 - Técnicas Avançadas", order: 1 },
            { id: 3, courseId: 1, name: "Unidade 2 - Defesa Pessoal", order: 2 }
        ];
    }

    setupEventListeners() {
        // Filter listeners
        document.getElementById('courseFilter')?.addEventListener('change', (e) => {
            this.filters.course = e.target.value;
            this.applyFilters();
        });

        document.getElementById('unitFilter')?.addEventListener('change', (e) => {
            this.filters.unit = e.target.value;
            this.applyFilters();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchFilter')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Global event listeners for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-lesson')) {
                const lessonId = parseInt(e.target.dataset.lessonId);
                this.showLessonDetails(lessonId);
            }
        });
    }

    applyFilters() {
        this.filteredLessons = this.lessons.filter(lesson => {
            const matchesCourse = !this.filters.course || lesson.courseId === parseInt(this.filters.course);
            const matchesUnit = !this.filters.unit || lesson.unitId === parseInt(this.filters.unit);
            const matchesStatus = !this.filters.status || lesson.status === this.filters.status;
            const matchesSearch = !this.filters.search || 
                lesson.title.toLowerCase().includes(this.filters.search) ||
                this.getCourseName(lesson.courseId).toLowerCase().includes(this.filters.search);

            return matchesCourse && matchesUnit && matchesStatus && matchesSearch;
        });

        this.sortLessons();
        this.renderLessons();
        this.updateStats();
    }

    sortLessons() {
        this.filteredLessons.sort((a, b) => {
            const aValue = a[this.sortConfig.key];
            const bValue = b[this.sortConfig.key];
            
            if (this.sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    getCourseName(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        return course ? course.name : 'Curso não encontrado';
    }

    getUnitName(unitId) {
        const unit = this.units.find(u => u.id === unitId);
        return unit ? unit.name : 'Unidade não encontrada';
    }

    render() {
        this.hideLoading();
        
        if (this.lessons.length === 0) {
            this.showEmptyState();
            return;
        }

        this.showContent();
        this.populateFilters();
        this.renderLessons();
        this.updateStats();
    }

    hideLoading() {
        const loading = document.getElementById('lessonsLoading');
        if (loading) loading.style.display = 'none';
    }

    showEmptyState() {
        const empty = document.getElementById('lessonsEmpty');
        if (empty) empty.style.display = 'block';
        
        const content = document.getElementById('lessonsContent');
        if (content) content.style.display = 'none';
    }

    showContent() {
        const empty = document.getElementById('lessonsEmpty');
        if (empty) empty.style.display = 'none';
        
        const content = document.getElementById('lessonsContent');
        if (content) content.style.display = 'block';
    }

    populateFilters() {
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">Todos os Cursos</option>';
            this.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseFilter.appendChild(option);
            });
        }

        const unitFilter = document.getElementById('unitFilter');
        if (unitFilter) {
            unitFilter.innerHTML = '<option value="">Todas as Unidades</option>';
            this.units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit.id;
                option.textContent = unit.name;
                unitFilter.appendChild(option);
            });
        }
    }

    renderLessons() {
        const grid = document.getElementById('lessonsGrid');
        if (!grid) return;

        if (this.filteredLessons.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>Nenhuma aula encontrada</h3>
                    <p>Tente ajustar seus filtros.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredLessons.map(lesson => this.renderLessonCard(lesson)).join('');
    }

    renderLessonCard(lesson) {
        const course = this.courses.find(c => c.id === lesson.courseId);
        const unit = this.units.find(u => u.id === lesson.unitId);
        
        const statusClass = `status-${lesson.status}`;
        const statusText = this.getStatusText(lesson.status);
        
        return `
            <div class="lesson-card">
                <div class="lesson-header">
                    <div class="lesson-number">Aula ${lesson.lessonNumber}</div>
                    <div class="lesson-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="lesson-content">
                    <h3 class="lesson-title">${lesson.title}</h3>
                    <p class="lesson-course">${course?.name || 'Curso não encontrado'}</p>
                    <p class="lesson-unit">${unit?.name || 'Unidade não encontrada'}</p>
                    
                    <div class="lesson-details">
                        <div class="detail-item">
                            <span class="icon">📅</span>
                            <span>${this.formatDate(lesson.date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="icon">🕐</span>
                            <span>${lesson.time} (${lesson.duration}min)</span>
                        </div>
                        <div class="detail-item">
                            <span class="icon">🥋</span>
                            <span>${lesson.techniques?.length || 0} técnicas</span>
                        </div>
                        <div class="detail-item">
                            <span class="icon">👥</span>
                            <span>${lesson.attendance?.filter(a => a.present).length || 0} alunos</span>
                        </div>
                    </div>
                    
                    <div class="lesson-actions">
                        <button class="btn btn-primary view-lesson" data-lesson-id="${lesson.id}">
                            Ver Detalhes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'scheduled': 'Agendada',
            'completed': 'Concluída',
            'cancelled': 'Cancelada'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    updateStats() {
        const total = this.filteredLessons.length;
        const completed = this.filteredLessons.filter(l => l.status === 'completed').length;
        const scheduled = this.filteredLessons.filter(l => l.status === 'scheduled').length;
        
        // Calculate unique students from attendance
        const allStudents = new Set();
        this.filteredLessons.forEach(lesson => {
            lesson.attendance?.forEach(att => {
                if (att.present) allStudents.add(att.studentId);
            });
        });

        document.getElementById('totalLessons').textContent = total;
        document.getElementById('completedLessons').textContent = completed;
        document.getElementById('scheduledLessons').textContent = scheduled;
        document.getElementById('totalStudents').textContent = allStudents.size;
    }

    showLessonDetails(lessonId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        this.currentLesson = lesson;
        
        // Populate modal
        document.getElementById('modalTitle').textContent = `Aula ${lesson.lessonNumber} - ${lesson.title}`;
        document.getElementById('modalCourse').textContent = this.getCourseName(lesson.courseId);
        document.getElementById('modalUnit').textContent = this.getUnitName(lesson.unitId);
        document.getElementById('modalLessonNumber').textContent = lesson.lessonNumber;
        document.getElementById('modalTitleDetail').textContent = lesson.title;
        document.getElementById('modalDate').textContent = this.formatDate(lesson.date);
        document.getElementById('modalTime').textContent = lesson.time;
        document.getElementById('modalDuration').textContent = `${lesson.duration} minutos`;
        document.getElementById('modalStatus').textContent = this.getStatusText(lesson.status);
        document.getElementById('modalNotes').textContent = lesson.notes || 'Sem observações';

        // Render techniques
        const techniquesContainer = document.getElementById('modalTechniques');
        if (techniquesContainer) {
            if (lesson.techniques && lesson.techniques.length > 0) {
                techniquesContainer.innerHTML = lesson.techniques.map(tech => 
                    `<div class="technique-tag">${tech}</div>`
                ).join('');
            } else {
                techniquesContainer.innerHTML = '<p>Nenhuma técnica cadastrada</p>';
            }
        }

        // Render attendance
        const attendanceContainer = document.getElementById('modalAttendance');
        if (attendanceContainer) {
            if (lesson.attendance && lesson.attendance.length > 0) {
                attendanceContainer.innerHTML = lesson.attendance.map(att => `
                    <div class="attendance-item ${att.present ? 'present' : 'absent'}">
                        <span>${att.name}</span>
                        <span class="status">${att.present ? '✅ Presente' : '❌ Ausente'}</span>
                    </div>
                `).join('');
            } else {
                attendanceContainer.innerHTML = '<p>Nenhum aluno registrado</p>';
            }
        }

        // Show modal
        const modal = document.getElementById('lessonModal');
        if (modal) modal.style.display = 'block';
    }

    editLesson() {
        if (!this.currentLesson) return;
        
        // In a real implementation, this would open an edit form
        showToast('Funcionalidade de edição em desenvolvimento', 'info');
    }

    async deleteLesson() {
        if (!this.currentLesson) return;

        if (confirm(`Tem certeza que deseja excluir a aula ${this.currentLesson.lessonNumber} - ${this.currentLesson.title}?`)) {
            try {
                const response = await fetch(`/api/lessons/${this.currentLesson.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.lessons = this.lessons.filter(l => l.id !== this.currentLesson.id);
                    this.filteredLessons = this.filteredLessons.filter(l => l.id !== this.currentLesson.id);
                    this.renderLessons();
                    this.updateStats();
                    this.closeLessonModal();
                    showToast('Aula excluída com sucesso', 'success');
                } else {
                    showToast('Erro ao excluir aula', 'error');
                }
            } catch (error) {
                console.error('Error deleting lesson:', error);
                showToast('Erro ao excluir aula', 'error');
            }
        }
    }

    closeLessonModal() {
        const modal = document.getElementById('lessonModal');
        if (modal) modal.style.display = 'none';
        this.currentLesson = null;
    }

    exportToCSV() {
        const headers = ['Aula', 'Curso', 'Unidade', 'Data', 'Horário', 'Duração', 'Status', 'Técnicas', 'Alunos Presentes'];
        const rows = this.filteredLessons.map(lesson => [
            lesson.lessonNumber,
            this.getCourseName(lesson.courseId),
            this.getUnitName(lesson.unitId),
            lesson.date,
            lesson.time,
            lesson.duration,
            this.getStatusText(lesson.status),
            lesson.techniques?.join('; ') || '',
            lesson.attendance?.filter(a => a.present).length || 0
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'aulas.csv';
        link.click();
    }

    showError(message) {
        const container = document.querySelector('.lessons-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Erro</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}

// Initialize module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lessonsModule = new LessonsModule();
});

// Global functions for modal
function closeLessonModal() {
    window.lessonsModule?.closeLessonModal();
}

function editLesson() {
    window.lessonsModule?.editLesson();
}

function deleteLesson() {
    window.lessonsModule?.deleteLesson();
}