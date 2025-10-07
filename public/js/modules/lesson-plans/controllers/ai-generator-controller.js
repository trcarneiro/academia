/**
 * AI Generator Controller for Lesson Plans
 * 
 * Handles the "Gerar com IA" tab interface for generating lesson plans
 * using AI providers (Gemini, Claude, GPT-4)
 */

class AIGeneratorController {
    constructor(moduleAPI) {
        this.moduleAPI = moduleAPI;
        this.aiService = new AIGenerationService(moduleAPI);
        this.container = null;
        this.currentCourse = null;
        this.courseAnalysis = null;
        this.isGenerating = false;
    }

    /**
     * Initialize and render the AI generator interface
     * @param {HTMLElement} container - Container element
     */
    async init(container) {
        console.log('🤖 Initializing AI Generator Controller...');
        
        if (!container) {
            throw new Error('Container is required for AI Generator Controller');
        }

        this.container = container;
        await this.render();
        this.setupEvents();
        await this.loadCourses();

        console.log('✅ AI Generator Controller initialized');
    }

    /**
     * Render the AI generator interface
     */
    async render() {
        this.container.innerHTML = `
            <div class="ai-generator-interface module-isolated-lesson-plans-ai">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🎓</div>
                        <div class="stat-info">
                            <span class="stat-number" id="ai-courses-count">0</span>
                            <span class="stat-label">Cursos Disponíveis</span>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <span class="stat-number" id="ai-existing-plans">0</span>
                            <span class="stat-label">Planos Criados</span>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">❓</div>
                        <div class="stat-info">
                            <span class="stat-number" id="ai-missing-plans">0</span>
                            <span class="stat-label">Planos Faltando</span>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <span class="stat-number" id="ai-coverage">0%</span>
                            <span class="stat-label">Cobertura</span>
                        </div>
                    </div>
                </div>

                <!-- Course Selector -->
                <div class="data-card-premium">
                    <div class="card-header">
                        <h3>🎓 Selecione o Curso</h3>
                        <p>Escolha um curso para analisar e gerar planos de aula</p>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="form-group">
                            <label for="ai-course-select"><strong>Curso*</strong></label>
                            <select id="ai-course-select" class="form-select">
                                <option value="">Carregando cursos...</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Course Analysis (hidden by default) -->
                <div id="course-analysis-section" class="data-card-premium" style="display: none;">
                    <div class="card-header">
                        <h3>📚 Análise do Curso</h3>
                        <p id="course-analysis-description">Planos de aula para este curso</p>
                    </div>
                    <div style="padding: 2rem;">
                        <div id="course-info-display" class="course-info">
                            <!-- Course info will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Existing Plans -->
                <div id="existing-plans-section" class="data-card-premium" style="display: none;">
                    <div class="card-header">
                        <h3>✅ Planos de Aula Existentes</h3>
                        <p>Planos já criados para este curso</p>
                        <div class="header-actions">
                            <button class="btn-secondary" id="refresh-plans-btn">
                                🔄 Atualizar
                            </button>
                        </div>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="existing-plans-grid" id="existing-plans-grid">
                            <!-- Plans will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Missing Plans -->
                <div id="missing-plans-section" class="data-card-premium" style="display: none;">
                    <div class="card-header">
                        <h3>❓ Planos de Aula Faltantes</h3>
                        <p>Planos que precisam ser criados para completar o curso</p>
                        <div class="header-actions">
                            <button class="btn-primary" id="generate-all-btn" disabled>
                                🤖 Gerar Todos os Planos Faltantes
                            </button>
                        </div>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="missing-plans-grid" id="missing-plans-grid">
                            <!-- Missing plans will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Generation Configuration -->
                <div id="generation-config-section" class="data-card-premium" style="display: none;">
                    <div class="card-header">
                        <h3>⚙️ Configurações de Geração</h3>
                        <p>Personalize como a IA deve gerar os planos de aula</p>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="ai-provider-select"><strong>Provedor de IA*</strong></label>
                                <select id="ai-provider-select" class="form-select">
                                    <option value="gemini">Google Gemini (Recomendado)</option>
                                    <option value="anthropic">Anthropic (Claude)</option>
                                    <option value="openai">OpenAI (GPT-4)</option>
                                </select>
                                <small>Gemini oferece melhor custo-benefício e qualidade</small>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="use-rag-checkbox" checked>
                                    <strong>Usar base de conhecimento RAG</strong>
                                </label>
                                <small>Recomendado: melhora a qualidade usando documentos do curso</small>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="include-adaptations-checkbox" checked>
                                    <strong>Incluir adaptações de nível</strong>
                                </label>
                                <small>Gera variações para diferentes níveis de habilidade</small>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="generate-variations-checkbox">
                                    <strong>Gerar variações das técnicas</strong>
                                </label>
                                <small>Cria múltiplas versões de cada técnica (experimental)</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Generation Progress -->
                <div id="generation-progress-section" class="data-card-premium" style="display: none;">
                    <div class="card-header">
                        <h3>⚡ Geração em Andamento</h3>
                        <p>Acompanhe o progresso da geração automática</p>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="generation-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill" style="width: 0%;"></div>
                            </div>
                            <div class="progress-info">
                                <span id="progress-text">Preparando geração...</span>
                                <span id="progress-percent">0%</span>
                            </div>
                            <div class="generation-log" id="generation-log">
                                <!-- Generation steps will be logged here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEvents() {
        // Course selector
        const courseSelect = document.getElementById('ai-course-select');
        courseSelect?.addEventListener('change', () => this.onCourseChange());

        // Generate all button
        const generateAllBtn = document.getElementById('generate-all-btn');
        generateAllBtn?.addEventListener('click', () => this.generateAllMissingPlans());

        // Refresh button
        const refreshBtn = document.getElementById('refresh-plans-btn');
        refreshBtn?.addEventListener('click', () => this.refreshCourseAnalysis());

        // Configuration changes
        const providerSelect = document.getElementById('ai-provider-select');
        const useRagCheck = document.getElementById('use-rag-checkbox');
        const adaptationsCheck = document.getElementById('include-adaptations-checkbox');
        const variationsCheck = document.getElementById('generate-variations-checkbox');

        [providerSelect, useRagCheck, adaptationsCheck, variationsCheck].forEach(el => {
            el?.addEventListener('change', () => this.saveConfig());
        });

        // Load saved configuration
        this.loadConfig();
    }

    /**
     * Load courses into selector
     */
    async loadCourses() {
        console.log('📚 Loading courses...');
        
        const courseSelect = document.getElementById('ai-course-select');
        if (!courseSelect) return;

        try {
            courseSelect.innerHTML = '<option value="">Carregando cursos...</option>';

            const response = await this.moduleAPI.request('/api/courses');
            
            if (response.success && response.data) {
                const courses = response.data;
                
                courseSelect.innerHTML = '<option value="">Selecione um curso...</option>';
                courses.forEach(course => {
                    courseSelect.innerHTML += `<option value="${course.id}">${course.name}</option>`;
                });

                // Update stats
                document.getElementById('ai-courses-count').textContent = courses.length;

                console.log(`✅ Loaded ${courses.length} courses`);
            } else {
                throw new Error('Failed to load courses');
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            courseSelect.innerHTML = '<option value="">Erro ao carregar cursos</option>';
            this.showBanner('Erro ao carregar cursos', 'error');
        }
    }

    /**
     * Handle course selection change
     */
    async onCourseChange() {
        const courseId = document.getElementById('ai-course-select')?.value;
        
        if (!courseId) {
            this.hideCourseAnalysis();
            return;
        }

        console.log(`🔍 Analyzing course: ${courseId}`);
        await this.analyzeCourse(courseId);
    }

    /**
     * Analyze selected course
     */
    async analyzeCourse(courseId) {
        try {
            this.showLoading();

            const analysis = await this.aiService.analyzeCourse(courseId);
            
            if (analysis.success) {
                this.courseAnalysis = analysis.data;
                this.currentCourse = this.courseAnalysis.course;
                this.displayCourseAnalysis();
                this.showConfigSection();
            } else {
                throw new Error(analysis.error || 'Failed to analyze course');
            }
        } catch (error) {
            console.error('❌ Error analyzing course:', error);
            this.showBanner(`Erro ao analisar curso: ${error.message}`, 'error');
            this.hideCourseAnalysis();
        }
    }

    /**
     * Display course analysis results
     */
    displayCourseAnalysis() {
        const { course, existing, missing, coverage } = this.courseAnalysis;

        // Update stats
        document.getElementById('ai-existing-plans').textContent = existing.count;
        document.getElementById('ai-missing-plans').textContent = missing.count;
        document.getElementById('ai-coverage').textContent = coverage + '%';

        // Show course info
        const courseInfoDisplay = document.getElementById('course-info-display');
        courseInfoDisplay.innerHTML = `
            <div class="course-details">
                <h4>${course.name}</h4>
                <div class="course-stats">
                    <div class="course-stat">
                        <span class="stat-icon">📚</span>
                        <span class="stat-label">Total de Aulas:</span>
                        <span class="stat-value">${course.totalLessons}</span>
                    </div>
                    <div class="course-stat">
                        <span class="stat-icon">📊</span>
                        <span class="stat-label">Nível:</span>
                        <span class="stat-value">${course.level || 'N/A'}</span>
                    </div>
                    <div class="course-stat">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-label">Duração:</span>
                        <span class="stat-value">${course.duration || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('course-analysis-section').style.display = 'block';

        // Display existing plans
        if (existing.count > 0) {
            this.displayExistingPlans(existing.plans);
        }

        // Display missing plans
        if (missing.count > 0) {
            this.displayMissingPlans(missing.numbers);
        } else {
            document.getElementById('missing-plans-section').style.display = 'none';
        }
    }

    /**
     * Display existing plans
     */
    displayExistingPlans(plans) {
        const grid = document.getElementById('existing-plans-grid');
        
        grid.innerHTML = plans.map(plan => `
            <div class="plan-card existing-plan">
                <div class="plan-header">
                    <div class="plan-number">Aula ${plan.lessonNumber}</div>
                    <div class="plan-status">
                        <span class="status-badge status-existing">✅ Criado</span>
                        ${plan.versions > 1 ? `<span class="version-badge">📝 ${plan.versions} versões</span>` : ''}
                    </div>
                </div>
                <div class="plan-content">
                    <h5>${plan.title}</h5>
                    <div class="plan-meta">
                        <span>📅 Semana ${plan.weekNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('existing-plans-section').style.display = 'block';
    }

    /**
     * Display missing plans
     */
    displayMissingPlans(lessonNumbers) {
        const grid = document.getElementById('missing-plans-grid');
        
        grid.innerHTML = lessonNumbers.map(lessonNumber => `
            <div class="plan-card missing-plan" data-lesson="${lessonNumber}">
                <div class="plan-header">
                    <div class="plan-number">Aula ${lessonNumber}</div>
                    <div class="plan-actions">
                        <button class="btn-sm btn-primary generate-single-btn" data-lesson="${lessonNumber}">
                            🤖 Gerar
                        </button>
                    </div>
                </div>
                <div class="plan-content">
                    <h5>Plano de Aula ${lessonNumber}</h5>
                    <p>Este plano ainda não foi criado. Clique em "Gerar" para criar automaticamente com IA.</p>
                    <div class="plan-meta">
                        <span class="plan-status">❓ Faltante</span>
                        <span>📅 Semana ${Math.ceil(lessonNumber / 2)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to individual generate buttons
        document.querySelectorAll('.generate-single-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lessonNumber = parseInt(e.target.dataset.lesson);
                this.generateSinglePlan(lessonNumber);
            });
        });

        // Enable/disable generate all button
        const generateAllBtn = document.getElementById('generate-all-btn');
        if (generateAllBtn) {
            generateAllBtn.disabled = false;
            generateAllBtn.textContent = `🤖 Gerar Todos os ${lessonNumbers.length} Planos Faltantes`;
        }

        document.getElementById('missing-plans-section').style.display = 'block';
    }

    /**
     * Generate single plan
     */
    async generateSinglePlan(lessonNumber) {
        if (!this.currentCourse || this.isGenerating) return;

        console.log(`🤖 Generating single plan: Lesson ${lessonNumber}`);

        try {
            this.isGenerating = true;
            this.setCardLoading(lessonNumber, true);

            const options = this.getGenerationOptions();
            const result = await this.aiService.generateSingleLesson(
                this.currentCourse.id,
                lessonNumber,
                options
            );

            if (result.success) {
                this.showBanner(`✅ Aula ${lessonNumber} gerada com sucesso!`, 'success');
                await this.refreshCourseAnalysis();
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (error) {
            console.error(`❌ Error generating lesson ${lessonNumber}:`, error);
            this.showBanner(`❌ Erro ao gerar Aula ${lessonNumber}: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            this.setCardLoading(lessonNumber, false);
        }
    }

    /**
     * Generate all missing plans
     */
    async generateAllMissingPlans() {
        if (!this.currentCourse || !this.courseAnalysis || this.isGenerating) return;

        const { missing } = this.courseAnalysis;
        if (missing.count === 0) return;

        const confirmed = confirm(
            `Gerar ${missing.count} planos de aula automaticamente?\n\n` +
            `Isso pode levar vários minutos. Deseja continuar?`
        );

        if (!confirmed) return;

        console.log(`🚀 Starting batch generation: ${missing.count} lessons`);

        try {
            this.isGenerating = true;
            this.showGenerationProgress(missing.count);

            const options = this.getGenerationOptions();
            const results = await this.aiService.generateBatchLessons(
                this.currentCourse.id,
                missing.numbers,
                options,
                (current, total, message) => this.updateGenerationProgress(current, total, message)
            );

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            this.completeGenerationProgress(successCount, failCount);

            // Refresh analysis after delay
            setTimeout(() => {
                this.refreshCourseAnalysis();
                this.hideGenerationProgress();
            }, 3000);

        } catch (error) {
            console.error('❌ Error in batch generation:', error);
            this.showBanner(`❌ Erro na geração em lote: ${error.message}`, 'error');
            this.hideGenerationProgress();
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Show generation progress
     */
    showGenerationProgress(total) {
        const section = document.getElementById('generation-progress-section');
        const log = document.getElementById('generation-log');
        
        section.style.display = 'block';
        log.innerHTML = `<div class="log-entry">🚀 Iniciando geração de ${total} planos de aula...</div>`;
        
        section.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Update generation progress
     */
    updateGenerationProgress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-text').textContent = message;
        document.getElementById('progress-percent').textContent = percentage + '%';
    }

    /**
     * Add log entry
     */
    addLog(message) {
        const log = document.getElementById('generation-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    /**
     * Complete generation progress
     */
    completeGenerationProgress(successCount, failCount) {
        document.getElementById('progress-text').textContent = `Concluído: ${successCount} sucessos, ${failCount} falhas`;
        document.getElementById('progress-percent').textContent = '100%';
        
        this.addLog(`🎉 Geração concluída! ${successCount} planos criados, ${failCount} falhas.`);
    }

    /**
     * Hide generation progress
     */
    hideGenerationProgress() {
        document.getElementById('generation-progress-section').style.display = 'none';
    }

    /**
     * Set card loading state
     */
    setCardLoading(lessonNumber, isLoading) {
        const card = document.querySelector(`[data-lesson="${lessonNumber}"]`);
        if (!card) return;

        const btn = card.querySelector('.generate-single-btn');
        if (btn) {
            btn.disabled = isLoading;
            btn.textContent = isLoading ? '⏳ Gerando...' : '🤖 Gerar';
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const courseInfoDisplay = document.getElementById('course-info-display');
        courseInfoDisplay.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">⏳</div>
                <p>Analisando curso e planos de aula...</p>
            </div>
        `;
        document.getElementById('course-analysis-section').style.display = 'block';
        document.getElementById('existing-plans-section').style.display = 'none';
        document.getElementById('missing-plans-section').style.display = 'none';
        document.getElementById('generation-config-section').style.display = 'none';
    }

    /**
     * Show config section
     */
    showConfigSection() {
        document.getElementById('generation-config-section').style.display = 'block';
    }

    /**
     * Hide course analysis sections
     */
    hideCourseAnalysis() {
        document.getElementById('course-analysis-section').style.display = 'none';
        document.getElementById('existing-plans-section').style.display = 'none';
        document.getElementById('missing-plans-section').style.display = 'none';
        document.getElementById('generation-config-section').style.display = 'none';
        
        // Reset stats
        document.getElementById('ai-existing-plans').textContent = '0';
        document.getElementById('ai-missing-plans').textContent = '0';
        document.getElementById('ai-coverage').textContent = '0%';
    }

    /**
     * Refresh course analysis
     */
    async refreshCourseAnalysis() {
        if (this.currentCourse) {
            await this.analyzeCourse(this.currentCourse.id);
        }
    }

    /**
     * Get generation options from form
     */
    getGenerationOptions() {
        return {
            provider: document.getElementById('ai-provider-select')?.value || 'gemini',
            useRag: document.getElementById('use-rag-checkbox')?.checked !== false,
            includeAdaptations: document.getElementById('include-adaptations-checkbox')?.checked !== false,
            generateVariations: document.getElementById('generate-variations-checkbox')?.checked || false
        };
    }

    /**
     * Save configuration
     */
    saveConfig() {
        const config = this.getGenerationOptions();
        this.aiService.saveConfiguration(config);
    }

    /**
     * Load configuration
     */
    loadConfig() {
        const config = this.aiService.loadConfiguration();
        
        if (document.getElementById('ai-provider-select')) {
            document.getElementById('ai-provider-select').value = config.provider || 'gemini';
        }
        if (document.getElementById('use-rag-checkbox')) {
            document.getElementById('use-rag-checkbox').checked = config.useRag !== false;
        }
        if (document.getElementById('include-adaptations-checkbox')) {
            document.getElementById('include-adaptations-checkbox').checked = config.includeAdaptations !== false;
        }
        if (document.getElementById('generate-variations-checkbox')) {
            document.getElementById('generate-variations-checkbox').checked = config.generateVariations || false;
        }
    }

    /**
     * Show banner message
     */
    showBanner(message, type = 'info') {
        if (window.showBanner) {
            window.showBanner(message, type);
        } else if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Destroy controller and cleanup
     */
    destroy() {
        this.isGenerating = false;
        this.currentCourse = null;
        this.courseAnalysis = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in lesson-plans module
window.AIGeneratorController = AIGeneratorController;

console.log('✅ AI Generator Controller loaded');
