/**
 * Course Details Controller - AGENTS.md v2.0 Compliant
 * Premium Implementation for Course Information Display
 */

export class CourseDetailsController {
    constructor(api) {
        this.api = api;
        this.courseData = null;
        this.currentTab = 'overview';
        this.isInitialized = false;
    }

    /**
     * Render course details page
     */
    async render(container, courseId) {
        try {
            console.log('🎓 Rendering course details for:', courseId);
            
            // Load course data
            await this.loadCourseData(courseId);
            
            // Render interface
            container.innerHTML = this.getHTML();
            this.attachEventListeners();
            
            // Load initial tab
            this.switchTab('overview');
            
            this.isInitialized = true;
            console.log('✅ Course details rendered successfully');
            
        } catch (error) {
            console.error('❌ Error rendering course details:', error);
            this.showErrorState(container, error.message);
            window.app?.handleError?.(error, 'CourseDetails:render');
        }
    }

    /**
     * Load course data from API or fallback to example
     */
    async loadCourseData(courseId) {
        try {
            if (this.api && courseId) {
                await this.api.fetchWithStates(`/api/courses/${courseId}`, {
                    onSuccess: (data) => {
                        this.courseData = this.adaptCourseData(data);
                        console.log('✅ Course data loaded from API:', this.courseData);
                    },
                    onError: (error) => {
                        console.log('⚠️ API error, using example data:', error);
                        this.courseData = this.getExampleCourseData();
                    }
                });
            } else {
                this.courseData = this.getExampleCourseData();
            }
            
        } catch (error) {
            console.log('⚠️ Load error, using example data:', error);
            this.courseData = this.getExampleCourseData();
        }
    }

    /**
     * Adapt API data to internal format
     */
    adaptCourseData(apiData) {
        return {
            courseId: apiData.id || apiData.courseId,
            name: apiData.name || 'Curso sem nome',
            description: apiData.description || '',
            durationTotalWeeks: apiData.durationTotalWeeks || apiData.duration || 18,
            totalLessons: apiData.totalLessons || 35,
            lessonDurationMinutes: apiData.lessonDurationMinutes || 60,
            difficulty: apiData.difficulty || apiData.level || 'Iniciante',
            objectives: apiData.objectives || [],
            equipment: apiData.equipment || [],
            techniques: apiData.techniques || [],
            physicalPreparation: apiData.physicalPreparation || null,
            supportResources: apiData.supportResources || [],
            gamification: apiData.gamification || null,
            schedule: apiData.schedule || null
        };
    }

    /**
     * Get example course data from provided JSON
     */
    getExampleCourseData() {
        return {
            "courseId": "krav-maga-faixa-branca-2025",
            "name": "Krav Maga Faixa Branca",
            "description": "Curso introdutório de Krav Maga para iniciantes, focado em autodefesa básica, técnicas de ataque e defesa, quedas, rolamentos e fundamentos de mentalidade e tática.",
            "durationTotalWeeks": 18,
            "totalLessons": 35,
            "lessonDurationMinutes": 60,
            "difficulty": "Iniciante",
            "objectives": [
                "Desenvolver habilidades básicas de autodefesa",
                "Aprender técnicas de ataque (socos, chutes, cotoveladas)",
                "Dominar defesas contra estrangulamentos e agarramentos frontais",
                "Praticar quedas e rolamentos com segurança",
                "Introduzir conceitos de vigilância e regulação emocional"
            ],
            "equipment": [
                "Luvas de boxe (opcional)",
                "Bandagens (opcional)", 
                "Tatame macio",
                "Protetor de canela (opcional)",
                "Protetor de joelho (opcional)"
            ],
            "techniques": [
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789001", "name": "postura-guarda-de-boxe"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789004", "name": "soco-jab"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789005", "name": "soco-direto"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789006", "name": "chute-reto"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789009", "name": "cotovelada-frontal"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789011", "name": "defesa-estrangulamento-dedos-frontal"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789017", "name": "queda-tras"},
                {"id": "a1b2c3d4-e5f6-7890-abcd-123456789020", "name": "rolamento-frente"}
            ],
            "physicalPreparation": {
                "description": "Exercícios para condicionamento físico, incluindo corrida, flexões, abdominais e saltos para melhorar resistência e força.",
                "exercises": [
                    {"name": "Corrida suave", "duration": "5 minutos", "type": "EXERCISE"},
                    {"name": "Flexões", "repetitions": 15, "type": "EXERCISE"},
                    {"name": "Abdominais", "repetitions": 20, "type": "EXERCISE"},
                    {"name": "Saltos laterais", "duration": "2 minutos", "type": "EXERCISE"}
                ]
            },
            "supportResources": [
                {"type": "Vídeo", "description": "Vídeos tutoriais de técnicas básicas de Krav Maga", "url": "https://example.com/krav-maga-videos"},
                {"type": "Manual", "description": "Manual digital com descrição das técnicas e posturas", "url": "https://example.com/krav-maga-manual"},
                {"type": "Guia", "description": "Guia de segurança para treinos", "url": "https://example.com/krav-maga-safety"}
            ],
            "gamification": {
                "description": "Sistema de recompensas para motivar os alunos, com pontos por participação, domínio de técnicas e desafios completados.",
                "rewards": [
                    {"name": "Ponto de Participação", "criteria": "Comparecer a uma aula", "points": 10},
                    {"name": "Ponto de Técnica", "criteria": "Dominar uma técnica com 80% de precisão", "points": 20},
                    {"name": "Ponto de Desafio", "criteria": "Completar uma simulação", "points": 30},
                    {"name": "Badge de Progresso", "criteria": "Completar 50% do curso", "points": 50}
                ]
            }
        };
    }

    /**
     * Generate HTML structure
     */
    getHTML() {
        if (!this.courseData) {
            return '<div class="loading-state">Carregando curso...</div>';
        }

        return `
            <div class="module-isolated-course-details">
                <!-- Premium Header -->
                <div class="module-header-premium">
                    <div class="breadcrumb">
                        <span>🎓 Cursos</span>
                        <span class="separator">›</span>
                        <span class="current">${this.courseData.name}</span>
                    </div>
                    <div class="course-header-main">
                        <div class="course-title-section">
                            <h1>
                                <span class="course-icon">🥋</span>
                                ${this.courseData.name}
                            </h1>
                            <div class="course-badges">
                                <span class="difficulty-badge ${this.courseData.difficulty?.toLowerCase()}">${this.courseData.difficulty}</span>
                                <span class="duration-badge">${this.courseData.durationTotalWeeks} semanas</span>
                                <span class="lessons-badge">${this.courseData.totalLessons} aulas</span>
                            </div>
                        </div>
                        <div class="course-actions">
                            <button class="btn btn-primary btn-lg" id="enrollBtn">
                                ✨ Matricular Aluno
                            </button>
                            <button class="btn btn-secondary" id="editBtn">
                                ✏️ Editar Curso
                            </button>
                            <button class="btn btn-outline" id="backBtn">
                                ← Voltar
                            </button>
                        </div>
                    </div>
                    <p class="course-description">${this.courseData.description}</p>
                </div>

                <!-- Course Stats -->
                <div class="stats-container">
                    <div class="stat-card-enhanced course-stat">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.courseData.lessonDurationMinutes}</div>
                            <div class="stat-label">Minutos por Aula</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced course-stat">
                        <div class="stat-icon">📚</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.courseData.totalLessons}</div>
                            <div class="stat-label">Total de Aulas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced course-stat">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.courseData.techniques?.length || 0}</div>
                            <div class="stat-label">Técnicas Ensinadas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced course-stat">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.courseData.gamification?.rewards?.length || 0}</div>
                            <div class="stat-label">Recompensas</div>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="tab-navigation">
                    <button class="tab-btn active" data-tab="overview">📋 Visão Geral</button>
                    <button class="tab-btn" data-tab="objectives">🎯 Objetivos</button>
                    <button class="tab-btn" data-tab="techniques">🥋 Técnicas</button>
                    <button class="tab-btn" data-tab="equipment">🛡️ Equipamentos</button>
                    <button class="tab-btn" data-tab="preparation">💪 Preparação Física</button>
                    <button class="tab-btn" data-tab="gamification">🏆 Gamificação</button>
                    <button class="tab-btn" data-tab="resources">📖 Recursos</button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content-container">
                    <!-- Overview Tab -->
                    <div id="tab-overview" class="tab-content active">
                        ${this.getOverviewTabHTML()}
                    </div>

                    <!-- Objectives Tab -->
                    <div id="tab-objectives" class="tab-content">
                        ${this.getObjectivesTabHTML()}
                    </div>

                    <!-- Techniques Tab -->
                    <div id="tab-techniques" class="tab-content">
                        ${this.getTechniquesTabHTML()}
                    </div>

                    <!-- Equipment Tab -->
                    <div id="tab-equipment" class="tab-content">
                        ${this.getEquipmentTabHTML()}
                    </div>

                    <!-- Physical Preparation Tab -->
                    <div id="tab-preparation" class="tab-content">
                        ${this.getPreparationTabHTML()}
                    </div>

                    <!-- Gamification Tab -->
                    <div id="tab-gamification" class="tab-content">
                        ${this.getGamificationTabHTML()}
                    </div>

                    <!-- Resources Tab -->
                    <div id="tab-resources" class="tab-content">
                        ${this.getResourcesTabHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Overview tab content
     */
    getOverviewTabHTML() {
        return `
            <div class="overview-grid">
                <!-- Course Summary -->
                <div class="data-card-premium course-summary">
                    <div class="card-header">
                        <h2>📋 Resumo do Curso</h2>
                    </div>
                    <div class="card-content">
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">Duração Total:</span>
                                <span class="value">${this.courseData.durationTotalWeeks} semanas</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Total de Aulas:</span>
                                <span class="value">${this.courseData.totalLessons} aulas</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Duração por Aula:</span>
                                <span class="value">${this.courseData.lessonDurationMinutes} minutos</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Nível:</span>
                                <span class="value difficulty-${this.courseData.difficulty?.toLowerCase()}">${this.courseData.difficulty}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Course Description -->
                <div class="data-card-premium course-info">
                    <div class="card-header">
                        <h2>📝 Sobre o Curso</h2>
                    </div>
                    <div class="card-content">
                        <p class="course-description-full">${this.courseData.description}</p>
                        
                        <div class="course-highlights">
                            <h3>🌟 Destaques</h3>
                            <ul class="highlights-list">
                                <li>✅ Curso estruturado em ${this.courseData.durationTotalWeeks} semanas</li>
                                <li>✅ ${this.courseData.techniques?.length || 0} técnicas fundamentais de Krav Maga</li>
                                <li>✅ Sistema de gamificação com pontos e recompensas</li>
                                <li>✅ Preparação física integrada ao treinamento</li>
                                <li>✅ Recursos de apoio (vídeos, manuais, guias)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="data-card-premium quick-stats">
                    <div class="card-header">
                        <h2>📊 Estatísticas Rápidas</h2>
                    </div>
                    <div class="card-content">
                        <div class="quick-stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">${this.courseData.techniques?.length || 0}</div>
                                <div class="stat-label">Técnicas</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.courseData.equipment?.length || 0}</div>
                                <div class="stat-label">Equipamentos</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.courseData.objectives?.length || 0}</div>
                                <div class="stat-label">Objetivos</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.courseData.supportResources?.length || 0}</div>
                                <div class="stat-label">Recursos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Objectives tab content
     */
    getObjectivesTabHTML() {
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>🎯 Objetivos do Curso</h2>
                    <p class="subtitle">O que você aprenderá ao final deste curso</p>
                </div>
                <div class="card-content">
                    <div class="objectives-list">
                        ${this.courseData.objectives?.map((objective, index) => `
                            <div class="objective-item">
                                <div class="objective-number">${index + 1}</div>
                                <div class="objective-content">
                                    <p>${objective}</p>
                                </div>
                                <div class="objective-icon">✅</div>
                            </div>
                        `).join('') || '<p class="empty-message">Nenhum objetivo definido</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Techniques tab content
     */
    getTechniquesTabHTML() {
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>🥋 Técnicas Ensinadas</h2>
                    <p class="subtitle">Todas as técnicas que serão abordadas no curso</p>
                </div>
                <div class="card-content">
                    <div class="techniques-grid">
                        ${this.courseData.techniques?.map((technique, index) => `
                            <div class="technique-card" data-technique-id="${technique.id}">
                                <div class="technique-icon">🥋</div>
                                <div class="technique-info">
                                    <div class="technique-name">${this.formatTechniqueName(technique.name)}</div>
                                    <div class="technique-id">#${index + 1}</div>
                                </div>
                                <button class="btn btn-sm btn-outline" onclick="window.courseDetailsController.viewTechniqueDetails('${technique.id}')">
                                    👁️ Ver
                                </button>
                            </div>
                        `).join('') || '<p class="empty-message">Nenhuma técnica definida</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Equipment tab content
     */
    getEquipmentTabHTML() {
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>🛡️ Equipamentos Necessários</h2>
                    <p class="subtitle">Lista de equipamentos para participar do curso</p>
                </div>
                <div class="card-content">
                    <div class="equipment-list">
                        ${this.courseData.equipment?.map(item => `
                            <div class="equipment-item">
                                <div class="equipment-icon">
                                    ${item.includes('opcional') ? '🔹' : '🔴'}
                                </div>
                                <div class="equipment-name">${item}</div>
                                <div class="equipment-status">
                                    ${item.includes('opcional') ? 
                                        '<span class="optional">Opcional</span>' : 
                                        '<span class="required">Obrigatório</span>'
                                    }
                                </div>
                            </div>
                        `).join('') || '<p class="empty-message">Nenhum equipamento especificado</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Physical preparation tab content
     */
    getPreparationTabHTML() {
        const physicalPrep = this.courseData.physicalPreparation;
        
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>💪 Preparação Física</h2>
                    <p class="subtitle">Exercícios de condicionamento físico integrados</p>
                </div>
                <div class="card-content">
                    ${physicalPrep ? `
                        <div class="preparation-description">
                            <p>${physicalPrep.description}</p>
                        </div>
                        
                        <h3>🏋️ Exercícios</h3>
                        <div class="exercises-grid">
                            ${physicalPrep.exercises?.map(exercise => `
                                <div class="exercise-card">
                                    <div class="exercise-icon">💪</div>
                                    <div class="exercise-content">
                                        <h4>${exercise.name}</h4>
                                        ${exercise.duration ? `<p>Duração: ${exercise.duration}</p>` : ''}
                                        ${exercise.repetitions ? `<p>Repetições: ${exercise.repetitions}</p>` : ''}
                                        <span class="exercise-type">${exercise.type}</span>
                                    </div>
                                </div>
                            `).join('') || ''}
                        </div>
                    ` : '<p class="empty-message">Preparação física não definida</p>'}
                </div>
            </div>
        `;
    }

    /**
     * Gamification tab content
     */
    getGamificationTabHTML() {
        const gamification = this.courseData.gamification;
        
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>🏆 Sistema de Gamificação</h2>
                    <p class="subtitle">Pontos, recompensas e conquistas</p>
                </div>
                <div class="card-content">
                    ${gamification ? `
                        <div class="gamification-description">
                            <p>${gamification.description}</p>
                        </div>
                        
                        <h3>🎖️ Recompensas Disponíveis</h3>
                        <div class="rewards-list">
                            ${gamification.rewards?.map(reward => `
                                <div class="reward-item">
                                    <div class="reward-icon">🏆</div>
                                    <div class="reward-content">
                                        <h4>${reward.name}</h4>
                                        <p>${reward.criteria}</p>
                                    </div>
                                    <div class="reward-points">${reward.points} pts</div>
                                </div>
                            `).join('') || ''}
                        </div>
                    ` : '<p class="empty-message">Sistema de gamificação não configurado</p>'}
                </div>
            </div>
        `;
    }

    /**
     * Resources tab content
     */
    getResourcesTabHTML() {
        return `
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>📖 Recursos de Apoio</h2>
                    <p class="subtitle">Materiais complementares para estudo</p>
                </div>
                <div class="card-content">
                    <div class="resources-list">
                        ${this.courseData.supportResources?.map(resource => `
                            <div class="resource-item">
                                <div class="resource-icon">
                                    ${resource.type === 'Vídeo' ? '🎥' : 
                                      resource.type === 'Manual' ? '📚' : 
                                      resource.type === 'Guia' ? '📋' : '📄'}
                                </div>
                                <div class="resource-content">
                                    <h4>${resource.type}</h4>
                                    <p>${resource.description}</p>
                                    <a href="${resource.url}" target="_blank" class="resource-link">
                                        🔗 Acessar Recurso
                                    </a>
                                </div>
                            </div>
                        `).join('') || '<p class="empty-message">Nenhum recurso disponível</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Action buttons
        const enrollBtn = document.getElementById('enrollBtn');
        const editBtn = document.getElementById('editBtn');
        const backBtn = document.getElementById('backBtn');
        
        enrollBtn?.addEventListener('click', () => this.enrollStudent());
        editBtn?.addEventListener('click', () => this.editCourse());
        backBtn?.addEventListener('click', () => this.goBack());
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`tab-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }

        this.currentTab = tabName;
        console.log(`📑 Switched to tab: ${tabName}`);
    }

    /**
     * Format technique name for display
     */
    formatTechniqueName(name) {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * View technique details
     */
    viewTechniqueDetails(techniqueId) {
        console.log('👁️ Viewing technique details:', techniqueId);
        // Navigate to technique details or open modal
        window.app?.dispatchEvent?.('technique:view', { techniqueId });
    }

    /**
     * Enroll student action
     */
    enrollStudent() {
        console.log('🎓 Opening student enrollment for course:', this.courseData.name);
        // Implementation for student enrollment
        window.app?.dispatchEvent?.('course:enroll', { 
            courseId: this.courseData.courseId,
            courseName: this.courseData.name 
        });
        
        // Navigate to student enrollment page
        if (window.navigateToModule) {
            window.navigateToModule('students', `enroll-course/${this.courseData.courseId}`);
        }
    }

    /**
     * Edit course action
     */
    editCourse() {
        console.log('✏️ Opening course editor for:', this.courseData.name);
        // Implementation for course editing
        window.app?.dispatchEvent?.('course:edit', { 
            courseId: this.courseData.courseId 
        });
        
        // Navigate to course editor
        if (window.initializeCourseEditorModule) {
            window.currentCourseId = this.courseData.courseId;
            window.location.hash = `course-editor?id=${this.courseData.courseId}`;
        }
    }

    /**
     * Go back to courses list
     */
    goBack() {
        console.log('← Going back to courses list');
        
        if (window.navigateToModule) {
            window.navigateToModule('courses');
        } else if (window.coursesModule) {
            window.coursesModule.navigateToCourses();
        } else {
            window.history.back();
        }
    }

    /**
     * Show error state
     */
    showErrorState(container, message) {
        container.innerHTML = `
            <div class="error-state module-isolated-course-details">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao Carregar Curso</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }

    /**
     * Get controller info for debugging
     */
    getInfo() {
        return {
            isInitialized: this.isInitialized,
            currentTab: this.currentTab,
            courseId: this.courseData?.courseId,
            courseName: this.courseData?.name
        };
    }
}

// Make globally available
window.CourseDetailsController = CourseDetailsController;
window.courseDetailsController = null; // Will be set when instantiated

// Export for ES6 imports
export default CourseDetailsController;
