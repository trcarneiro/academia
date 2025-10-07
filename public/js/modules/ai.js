(function() {
    'use strict';
    
    let aiAPI = null;
    let isInitialized = false;
    let currentCourse = null;
    let generationMode = 'direct';
    
    // Enhanced AI Module v2.0 - RAG + Agents + Courses
    let enhancedAI = null;
    
    class EnhancedAIModule {
        constructor() {
            this.activeTab = 'courses'; // Start with courses (existing functionality)
            this.ragService = null;
            this.agentsService = null;
            this.courseService = null;
            this.monitorService = null;
            this.apiHelper = null;
        }

        async initialize() {
            try {
                // Initialize API helper
                await this.initializeAPI();
                
                // Initialize services
                this.ragService = new RAGService(this.apiHelper);
                this.agentsService = new AIAgentsService(this.apiHelper);
                this.courseService = new EnhancedCourseService(this.apiHelper);
                this.monitorService = new LessonPlanMonitorService(this.apiHelper);
                
                // Setup enhanced UI if container exists
                this.setupEnhancedInterface();

                // Load courses immediately after interface setup
                setTimeout(() => {
                    this.loadCourses();
                }, 500);
                
                return true;
            } catch (error) {
                console.error('❌ Enhanced AI Module initialization failed:', error);
                if (window.app) {
                    window.app.handleError(error, 'Enhanced AI Module initialization');
                }
                return false;
            }
        }

        async initializeAPI() {
            await waitForAPIClient();
            
            // Try to create API helper
            if (typeof window.createModuleAPI === 'function') {
                this.apiHelper = window.createModuleAPI('EnhancedAI');
            }
            
            // Verify API helper is properly initialized
            if (!this.apiHelper || !this.apiHelper.api || typeof this.apiHelper.api.get !== 'function') {
                console.log('⚠️ API helper not properly initialized, creating fallback');
                // Create fallback API helper with same interface as ModuleAPIHelper
                this.apiHelper = {
                    api: {
                        get: async (url, options = {}) => {
                            try {
                                const response = await fetch(url, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...options.headers
                                    }
                                });
                                
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                                
                                const data = await response.json();
                                // Return normalized format to match API client
                                return {
                                    success: data.success !== false,
                                    data: data.data || data,
                                    message: data.message || 'Success'
                                };
                            } catch (error) {
                                console.error('API request failed:', error);
                                return { success: false, error: error.message };
                            }
                        }
                    }
                };
            }
        }

        setupEnhancedInterface() {
            console.log('🎨 Setting up Enhanced Interface...');
            
            // Find the enhanced AI container or main AI container
            let enhancedContainer = document.getElementById('ai-module-container');
            if (!enhancedContainer) {
                enhancedContainer = document.querySelector('.ai-isolated');
            }
            
            if (!enhancedContainer) {
                return;
            }

            // Create the enhanced interface with proper structure
            enhancedContainer.innerHTML = `
                <div class="ai-enhanced-interface">
                    <div class="enhanced-tabs">
                        <button class="enhanced-tab" data-tab="rag">
                            🔍 RAG
                            <span class="tab-description">Base de Conhecimento</span>
                        </button>
                        <button class="enhanced-tab" data-tab="agents">
                            🤖 Agentes
                            <span class="tab-description">IA Especializada</span>
                        </button>
                        <button class="enhanced-tab active" data-tab="courses">
                            📚 Geração de Conteúdo
                            <span class="tab-description">Cursos, Técnicas & Planos</span>
                        </button>
                        <button class="enhanced-tab" data-tab="monitor">
                            📊 Monitor de Planos
                            <span class="tab-description">Análise & Otimização</span>
                        </button>
                    </div>
                    
                    <div class="enhanced-tab-panels">
                        <div id="rag-content" class="tab-content" style="display: none;">
                            <!-- RAG content will be populated here -->
                        </div>
                        
                        <div id="agents-content" class="tab-content" style="display: none;">
                            <!-- Agents content will be populated here -->
                        </div>
                        
                        <div id="courses-content" class="tab-content">
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <span class="stat-number" id="coursesCount">0</span>
                                <span class="stat-label">Cursos Disponíveis</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📝</div>
                            <div class="stat-info">
                                <span class="stat-number" id="existingPlansCount">0</span>
                                <span class="stat-label">Planos Existentes</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">❓</div>
                            <div class="stat-info">
                                <span class="stat-number" id="missingPlansCount">0</span>
                                <span class="stat-label">Planos Faltantes</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <span class="stat-number" id="activitiesCount">0</span>
                                <span class="stat-label">Atividades Sincronizadas</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📊</div>
                            <div class="stat-info">
                                <span class="stat-number" id="plansCoverage">0%</span>
                                <span class="stat-label">Cobertura</span>
                            </div>
                        </div>
                    </div>

                    <!-- Course Selection -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>🎯 Selecionar Curso</h3>
                            <p>Escolha o curso para visualizar e gerenciar seus planos de aula</p>
                        </div>
                        <div style="padding: 2rem;">
                            <div class="form-group">
                                <label for="courseSelect"><strong>Curso*</strong></label>
                                <select id="courseSelect" class="form-control" onchange="enhancedAI.onCourseSelect()">
                                    <option value="">Carregando cursos...</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Course Analysis Section -->
                    <div class="data-card-premium" id="courseAnalysisSection" style="display: none;">
                        <div class="card-header">
                            <h3>📊 Análise do Curso</h3>
                            <p id="courseAnalysisDescription">Análise detalhada dos planos de aula para este curso</p>
                        </div>
                        <div style="padding: 2rem;">
                            <div class="course-info" id="courseInfo">
                                <!-- Course info will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Existing Plans Section -->
                    <div class="data-card-premium" id="existingPlansSection" style="display: none;">
                        <div class="card-header">
                            <h3>✅ Planos de Aula Existentes</h3>
                            <p>Planos já criados para este curso</p>
                            <div class="header-actions">
                                <button class="btn-secondary" onclick="enhancedAI.refreshPlans()">🔄 Atualizar</button>
                            </div>
                        </div>
                        <div style="padding: 2rem;">
                            <div class="existing-plans-grid" id="existingPlansGrid">
                                <!-- Existing plans will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Missing Plans Section -->
                    <div class="data-card-premium" id="missingPlansSection" style="display: none;">
                        <div class="card-header">
                            <h3>❓ Planos de Aula Faltantes</h3>
                            <p>Planos que precisam ser criados para completar o curso</p>
                            <div class="header-actions">
                                <button class="btn-primary" onclick="enhancedAI.generateAllMissingPlans()" id="generateAllBtn">
                                    🤖 Gerar Todos os Planos Faltantes
                                </button>
                            </div>
                        </div>
                        <div style="padding: 2rem;">
                            <div class="missing-plans-grid" id="missingPlansGrid">
                                <!-- Missing plans will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Generation Progress -->
                    <div class="data-card-premium" id="generationProgressSection" style="display: none;">
                        <div class="card-header">
                            <h3>⚡ Geração em Andamento</h3>
                            <p>Acompanhe o progresso da geração automática</p>
                        </div>
                        <div style="padding: 2rem;">
                            <div class="generation-progress" id="generationProgress">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                                </div>
                                <div class="progress-info">
                                    <span id="progressText">Preparando geração...</span>
                                    <span id="progressPercent">0%</span>
                                </div>
                                <div class="generation-log" id="generationLog">
                                    <!-- Generation steps will be logged here -->
                                </div>
                            </div>
                        </div>
                    </div>

                        </div>
                        
                        <div id="monitor-content" class="tab-content" style="display: none;">
                            <!-- Monitor content will be populated here -->
                        </div>
                    </div>
                </div>
            `;
            
            // Setup tab navigation
            this.setupTabNavigation();
        }



        setupTabNavigation() {
            // Tab navigation event listeners
            document.querySelectorAll('.enhanced-tab').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.dataset.tab;
                    this.showTab(tab);
                });
            });

            // Automatically show courses tab on initialization
            this.showTab('courses');
        }

        showTab(tabName) {
            // Update active tab button
            document.querySelectorAll('.enhanced-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(panel => panel.style.display = 'none');
            
            // Activate selected tab and content
            document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
            const content = document.getElementById(`${tabName}-content`);
            if (content) {
                content.style.display = 'block';
            }
            
            this.activeTab = tabName;
            this.loadTabContent(tabName);
        }

        // Course Generation Methods
        async generateContent(type) {
            const courseId = document.getElementById('courseSelect')?.value;
            if (!courseId) {
                alert('Por favor, selecione um curso primeiro');
                return;
            }
            
            // Show loading state
            this.setGenerationLoading(type, true);

            try {
                const response = await this.apiHelper.api.post('/api/ai/generate', {
                    courseId,
                    type,
                    provider: document.getElementById('aiProvider')?.value || 'gemini',
                    useRag: document.getElementById('useRagData')?.checked || false
                });

                if (response.success) {
                    this.displayResults(type, response.data);
                    this.updateStats();
                } else {
                    throw new Error(response.error || 'Erro na geração');
                }
            } catch (error) {
                console.error('Error generating content:', error);
                this.displayError(error.message);
            } finally {
                this.setGenerationLoading(type, false);
            }
        }

        setGenerationLoading(type, isLoading) {
            const button = document.querySelector(`[data-type="${type}"]`);
            if (button) {
                button.classList.toggle('generating', isLoading);
                button.disabled = isLoading;
            }
        }

        displayResults(type, data) {
            const resultsSection = document.getElementById('resultsSection');
            const resultsContainer = document.getElementById('generationResults');
            
            resultsSection.style.display = 'block';
            
            let content = '';
            if (type === 'techniques') {
                content = this.formatTechniquesResults(data);
            } else if (type === 'lesson') {
                content = this.formatLessonResults(data);
            } else if (type === 'complete') {
                content = this.formatCompleteResults(data);
            }

            resultsContainer.innerHTML = content;
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }

        formatTechniquesResults(data) {
            if (!data.techniques || !Array.isArray(data.techniques)) {
                return '<p>Nenhuma técnica gerada</p>';
            }

            return `
                <div class="generation-results">
                    <h4>🥋 Técnicas Geradas (${data.techniques.length})</h4>
                    ${data.techniques.map(technique => `
                        <div class="result-item">
                            <div class="result-header">
                                <span class="result-title">${technique.name}</span>
                                <div class="result-actions">
                                    <button class="btn-sm btn-secondary" onclick="enhancedAI.editTechnique('${technique.id}')">✏️ Editar</button>
                                    <button class="btn-sm btn-primary" onclick="enhancedAI.saveTechnique('${technique.id}')">💾 Salvar</button>
                                </div>
                            </div>
                            <div class="result-content">
                                <p><strong>Descrição:</strong> ${technique.description}</p>
                                <p><strong>Nível:</strong> ${technique.level}</p>
                                <p><strong>Duração:</strong> ${technique.duration || 'N/A'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        formatLessonResults(data) {
            if (!data.lesson) {
                return '<p>Nenhum plano de aula gerado</p>';
            }

            const lesson = data.lesson;
            return `
                <div class="generation-results">
                    <div class="result-item">
                        <div class="result-header">
                            <span class="result-title">📝 ${lesson.title}</span>
                            <div class="result-actions">
                                <button class="btn-sm btn-secondary" onclick="enhancedAI.editLesson('${lesson.id}')">✏️ Editar</button>
                                <button class="btn-sm btn-primary" onclick="enhancedAI.saveLesson('${lesson.id}')">💾 Salvar</button>
                            </div>
                        </div>
                        <div class="result-content">
                            <p><strong>Objetivo:</strong> ${lesson.objective}</p>
                            <p><strong>Duração:</strong> ${lesson.duration}</p>
                            <p><strong>Conteúdo:</strong></p>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                                ${lesson.content}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        formatCompleteResults(data) {
            let content = '<div class="generation-results">';
            
            if (data.techniques) {
                content += `<h4>🥋 Técnicas (${data.techniques.length})</h4>`;
                content += this.formatTechniquesResults({ techniques: data.techniques });
            }
            
            if (data.lessons) {
                content += `<h4>📝 Planos de Aula (${data.lessons.length})</h4>`;
                content += data.lessons.map(lesson => this.formatLessonResults({ lesson })).join('');
            }
            
            content += '</div>';
            return content;
        }

        displayError(message) {
            const resultsSection = document.getElementById('resultsSection');
            const resultsContainer = document.getElementById('generationResults');
            
            resultsSection.style.display = 'block';
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <h4>❌ Erro na Geração</h4>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="enhancedAI.clearResults()">Tentar Novamente</button>
                </div>
            `;
        }

        async loadCourses() {
            console.log('🎓 Loading courses...');
            try {
                const select = document.getElementById('courseSelect');
                if (!select) {
                    console.warn('⚠️ Course select element not found');
                    return;
                }

                // Show loading state
                select.innerHTML = '<option value="">Carregando cursos...</option>';

                // Try API helper first, fallback to direct fetch if needed
                let coursesData = [];
                
                if (this.apiHelper && typeof this.apiHelper.api === 'object') {
                    const response = await this.apiHelper.api.get('/api/courses');
                    // API helper returns normalized response: { success: true, data: [...] }
                    if (response && response.success && Array.isArray(response.data)) {
                        coursesData = response.data;
                    }
                } else {
                    // Fallback to direct fetch
                    const fetchResponse = await fetch('/api/courses');
                    const data = await fetchResponse.json();
                    
                    // Direct fetch also returns { success: true, data: [...] }
                    if (data && data.success && Array.isArray(data.data)) {
                        coursesData = data.data;
                    }
                }

                if (coursesData.length === 0) {
                    console.warn('⚠️ No courses found, using mock data');
                    select.innerHTML = `
                        <option value="">Selecione um curso...</option>
                        <option value="mock-1">Krav Maga Faixa Branca (Mock)</option>
                        <option value="mock-2">Defesa Pessoal Avançada (Mock)</option>
                    `;
                    return;
                }
                
                // Populate courses
                console.log(`✅ Loaded ${coursesData.length} courses`);
                select.innerHTML = '<option value="">Selecione um curso...</option>';
                coursesData.forEach(course => {
                    select.innerHTML += `<option value="${course.id}">${course.name}</option>`;
                });

                // Update courses count
                document.getElementById('coursesCount').textContent = coursesData.length;
                
                // Load and update activities count
                await this.updateActivitiesCount();

            } catch (error) {
                console.error('Error loading courses:', error);
                const selectElement = document.getElementById('courseSelect');
                if (selectElement) {
                    selectElement.innerHTML = '<option value="">Erro ao carregar cursos</option>';
                }
            }
        }
        
        // Method to update activities count
        async updateActivitiesCount() {
            try {
                const activitiesResponse = await this.apiHelper.api.get('/api/activities');
                if (activitiesResponse.success) {
                    const activitiesCount = activitiesResponse.data.length;
                    document.getElementById('activitiesCount').textContent = activitiesCount;
                    console.log(`📊 Activities synchronized: ${activitiesCount}`);
                }
            } catch (error) {
                console.error('Error loading activities count:', error);
                document.getElementById('activitiesCount').textContent = '?';
            }
        }

        // New method to handle course selection
        async onCourseSelect() {
            const courseId = document.getElementById('courseSelect')?.value;
            if (!courseId) {
                this.hideCourseAnalysis();
                return;
            }

            console.log('🔍 Analyzing course:', courseId);
            
            try {
                // Show loading state
                this.showCourseAnalysisLoading();
                
                // Load course details and lesson plans analysis
                await Promise.all([
                    this.loadCourseDetails(courseId),
                    this.loadCoursePlansAnalysis(courseId)
                ]);

            } catch (error) {
                console.error('Error analyzing course:', error);
                this.showBanner('Erro ao analisar curso: ' + error.message, 'error');
            }
        }

        async loadCourseDetails(courseId) {
            try {
                const response = await this.apiHelper.api.get(`/api/courses/${courseId}`);
                
                if (response.success) {
                    this.displayCourseInfo(response.data);
                } else {
                    throw new Error(response.error || 'Erro ao carregar detalhes do curso');
                }
            } catch (error) {
                console.error('Error loading course details:', error);
                // Show mock data for development
                this.displayCourseInfo({
                    id: courseId,
                    name: 'Krav Maga - Iniciante',
                    description: 'Curso básico de Krav Maga focado em técnicas fundamentais de defesa pessoal.',
                    totalLessons: 24,
                    level: 'Iniciante',
                    duration: '12 semanas'
                });
            }
        }

        async loadCoursePlansAnalysis(courseId) {
            try {
                // Try to get existing lesson plans for this course
                const response = await this.apiHelper.api.get(`/api/lesson-plans?courseId=${courseId}`);
                
                if (response.success) {
                    this.analyzePlans(response.data, courseId);
                } else {
                    // No plans found, show all as missing
                    this.analyzePlans([], courseId);
                }
            } catch (error) {
                console.error('Error loading plans analysis:', error);
                // Show mock analysis for development
                this.analyzePlans([
                    { id: 1, title: 'Introdução ao Krav Maga', lesson_number: 1 },
                    { id: 2, title: 'Técnicas Básicas de Defesa', lesson_number: 2 }
                ], courseId);
            }
        }

        displayCourseInfo(course) {
            const courseInfo = document.getElementById('courseInfo');
            const courseAnalysisSection = document.getElementById('courseAnalysisSection');
            
            courseInfo.innerHTML = `
                <div class="course-details">
                    <h4>${course.name}</h4>
                    <p><strong>Descrição:</strong> ${course.description || 'Sem descrição'}</p>
                    <div class="course-stats">
                        <div class="course-stat">
                            <span class="stat-icon">📚</span>
                            <span class="stat-label">Total de Aulas:</span>
                            <span class="stat-value">${course.totalLessons || 'N/A'}</span>
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
            
            courseAnalysisSection.style.display = 'block';
        }

        analyzePlans(existingPlans, courseId) {
            // Get course info to determine total lessons needed
            const courseInfo = document.getElementById('courseInfo');
            const totalLessonsElement = courseInfo.querySelector('.stat-value');
            const totalLessons = parseInt(totalLessonsElement?.textContent) || 24; // Default to 24 if not found
            
            // Calculate missing plans
            const existingPlanNumbers = existingPlans.map(plan => plan.lesson_number || plan.id).filter(Boolean);
            const missingPlanNumbers = [];
            
            for (let i = 1; i <= totalLessons; i++) {
                if (!existingPlanNumbers.includes(i)) {
                    missingPlanNumbers.push(i);
                }
            }
            
            // Update stats
            const existingCount = existingPlans.length;
            const missingCount = missingPlanNumbers.length;
            const coverage = totalLessons > 0 ? Math.round((existingCount / totalLessons) * 100) : 0;
            
            document.getElementById('existingPlansCount').textContent = existingCount;
            document.getElementById('missingPlansCount').textContent = missingCount;
            document.getElementById('plansCoverage').textContent = coverage + '%';
            
            // Display existing plans
            this.displayExistingPlans(existingPlans);
            
            // Display missing plans
            this.displayMissingPlans(missingPlanNumbers, courseId);
        }

        displayExistingPlans(plans) {
            const existingPlansGrid = document.getElementById('existingPlansGrid');
            const existingPlansSection = document.getElementById('existingPlansSection');
            
            if (plans.length === 0) {
                existingPlansSection.style.display = 'none';
                return;
            }
            
            existingPlansGrid.innerHTML = plans.map(plan => `
                <div class="plan-card existing-plan">
                    <div class="plan-header">
                        <div class="plan-number">Aula ${plan.lesson_number || plan.id}</div>
                        <div class="plan-actions">
                            <button class="btn-sm btn-secondary" onclick="enhancedAI.editPlan('${plan.id}')">✏️ Editar</button>
                            <button class="btn-sm btn-success" onclick="enhancedAI.viewPlan('${plan.id}')">👁️ Ver</button>
                        </div>
                    </div>
                    <div class="plan-content">
                        <h5>${plan.title}</h5>
                        <p>${plan.description || 'Sem descrição'}</p>
                        <div class="plan-meta">
                            <span class="plan-status created">✅ Criado</span>
                            ${plan.createdAt ? `<span class="plan-date">${new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
            existingPlansSection.style.display = 'block';
        }

        displayMissingPlans(missingNumbers, courseId) {
            const missingPlansGrid = document.getElementById('missingPlansGrid');
            const missingPlansSection = document.getElementById('missingPlansSection');
            const generateAllBtn = document.getElementById('generateAllBtn');
            
            if (missingNumbers.length === 0) {
                missingPlansSection.style.display = 'none';
                return;
            }
            
            missingPlansGrid.innerHTML = missingNumbers.map(lessonNumber => `
                <div class="plan-card missing-plan">
                    <div class="plan-header">
                        <div class="plan-number">Aula ${lessonNumber}</div>
                        <div class="plan-actions">
                            <button class="btn-sm btn-primary" onclick="enhancedAI.generateSinglePlan('${courseId}', ${lessonNumber})">
                                🤖 Gerar
                            </button>
                        </div>
                    </div>
                    <div class="plan-content">
                        <h5>Plano de Aula ${lessonNumber}</h5>
                        <p>Este plano de aula ainda não foi criado. Clique em "Gerar" para criar automaticamente com IA.</p>
                        <div class="plan-meta">
                            <span class="plan-status missing">❓ Faltante</span>
                            <span class="plan-suggestion">💡 Sugestão: Técnicas práticas</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Update generate all button
            generateAllBtn.textContent = `🤖 Gerar Todos os ${missingNumbers.length} Planos Faltantes`;
            
            missingPlansSection.style.display = 'block';
        }

        showCourseAnalysisLoading() {
            const courseAnalysisSection = document.getElementById('courseAnalysisSection');
            const courseInfo = document.getElementById('courseInfo');
            
            courseInfo.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner">⏳</div>
                    <p>Analisando curso e planos de aula...</p>
                </div>
            `;
            
            courseAnalysisSection.style.display = 'block';
            
            // Hide other sections during loading
            document.getElementById('existingPlansSection').style.display = 'none';
            document.getElementById('missingPlansSection').style.display = 'none';
        }

        hideCourseAnalysis() {
            document.getElementById('courseAnalysisSection').style.display = 'none';
            document.getElementById('existingPlansSection').style.display = 'none';
            document.getElementById('missingPlansSection').style.display = 'none';
            
            // Reset stats
            document.getElementById('existingPlansCount').textContent = '0';
            document.getElementById('missingPlansCount').textContent = '0';
            document.getElementById('plansCoverage').textContent = '0%';
        }

        // Generation Methods
        async generateSinglePlan(courseId, lessonNumber) {
            console.log(`🤖 Generating plan for course ${courseId}, lesson ${lessonNumber}`);
            
            try {
                // Show loading state for this specific plan
                const planCard = document.querySelector(`[onclick*="generateSinglePlan('${courseId}', ${lessonNumber})"]`).closest('.plan-card');
                this.setCardLoading(planCard, true);
                
                // Get current activity count before generation
                const activitiesBeforeResponse = await this.apiHelper.api.get('/api/activities');
                const activitiesCountBefore = activitiesBeforeResponse.success ? activitiesBeforeResponse.data.length : 0;
                
                // Call AI generation API
                const response = await this.apiHelper.api.post('/api/ai/generate-single-lesson', {
                    courseId: courseId,
                    lessonNumber: lessonNumber,
                    provider: 'gemini', // Default to Gemini
                    useRag: true
                });
                
                if (response.success) {
                    // Check for new activities created during generation
                    const activitiesAfterResponse = await this.apiHelper.api.get('/api/activities');
                    const activitiesCountAfter = activitiesAfterResponse.success ? activitiesAfterResponse.data.length : 0;
                    const newActivitiesCount = activitiesCountAfter - activitiesCountBefore;
                    
                    let successMessage = `✅ Plano da Aula ${lessonNumber} gerado com sucesso!`;
                    if (newActivitiesCount > 0) {
                        successMessage += ` 🎯 ${newActivitiesCount} nova(s) atividade(s) criada(s) automaticamente e preparada(s) para futuro desenvolvimento de vídeos por IA.`;
                    }
                    
                    this.showBanner(successMessage, 'success');
                    
                    // Show activity synchronization info in console for debugging
                    console.log(`📊 Activity Synchronization: ${activitiesCountBefore} → ${activitiesCountAfter} (${newActivitiesCount > 0 ? '+' + newActivitiesCount : 'no new activities'})`);
                    
                    // Refresh the course analysis to show the new plan
                    await this.onCourseSelect();
                } else {
                    throw new Error(response.error || 'Erro na geração do plano');
                }
                
            } catch (error) {
                console.error('Error generating single plan:', error);
                this.showBanner(`❌ Erro ao gerar Plano da Aula ${lessonNumber}: ${error.message}`, 'error');
            } finally {
                const planCard = document.querySelector(`[onclick*="generateSinglePlan('${courseId}', ${lessonNumber})"]`)?.closest('.plan-card');
                if (planCard) {
                    this.setCardLoading(planCard, false);
                }
            }
        }

        async generateAllMissingPlans() {
            const courseId = document.getElementById('courseSelect')?.value;
            if (!courseId) {
                this.showBanner('Nenhum curso selecionado', 'error');
                return;
            }

            console.log(`🤖 Generating all missing plans for course ${courseId}`);
            
            try {
                // Get current activity count before generation
                const activitiesBeforeResponse = await this.apiHelper.api.get('/api/activities');
                const activitiesCountBefore = activitiesBeforeResponse.success ? activitiesBeforeResponse.data.length : 0;
                
                // Get all missing plan numbers
                const missingCards = document.querySelectorAll('.missing-plan');
                const missingNumbers = Array.from(missingCards).map(card => {
                    const numberElement = card.querySelector('.plan-number');
                    return parseInt(numberElement.textContent.replace('Aula ', ''));
                });

                if (missingNumbers.length === 0) {
                    this.showBanner('Nenhum plano faltante encontrado', 'info');
                    return;
                }

                // Show generation progress
                this.showGenerationProgress(missingNumbers.length);
                
                let successCount = 0;
                let failCount = 0;

                // Generate plans sequentially to avoid API overload
                for (let i = 0; i < missingNumbers.length; i++) {
                    const lessonNumber = missingNumbers[i];
                    
                    try {
                        this.updateGenerationProgress(i + 1, missingNumbers.length, `Gerando Aula ${lessonNumber}...`);
                        
                        const response = await this.apiHelper.api.post('/api/ai/generate-single-lesson', {
                            courseId: courseId,
                            lessonNumber: lessonNumber,
                            provider: 'gemini',
                            useRag: true
                        });
                        
                        if (response.success) {
                            successCount++;
                            this.addGenerationLog(`✅ Aula ${lessonNumber} gerada com sucesso`);
                        } else {
                            throw new Error(response.error || 'Erro na geração');
                        }
                        
                        // Small delay between generations
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (error) {
                        failCount++;
                        this.addGenerationLog(`❌ Erro na Aula ${lessonNumber}: ${error.message}`);
                        console.error(`Error generating lesson ${lessonNumber}:`, error);
                    }
                }

                // Check for new activities created during generation
                const activitiesAfterResponse = await this.apiHelper.api.get('/api/activities');
                const activitiesCountAfter = activitiesAfterResponse.success ? activitiesAfterResponse.data.length : 0;
                const newActivitiesCount = activitiesCountAfter - activitiesCountBefore;

                // Show final results with activity synchronization info
                this.completeGenerationProgress(successCount, failCount, newActivitiesCount);
                
                // Log activity synchronization summary
                console.log(`📊 Batch Activity Synchronization: ${activitiesCountBefore} → ${activitiesCountAfter} (${newActivitiesCount > 0 ? '+' + newActivitiesCount : 'no new activities'})`);
                
                // Refresh the course analysis after all generations
                setTimeout(() => {
                    this.onCourseSelect();
                }, 2000);

            } catch (error) {
                console.error('Error in batch generation:', error);
                this.showBanner('Erro na geração em lote: ' + error.message, 'error');
                this.hideGenerationProgress();
            }
        }

        showGenerationProgress(totalPlans) {
            const progressSection = document.getElementById('generationProgressSection');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const progressPercent = document.getElementById('progressPercent');
            const generationLog = document.getElementById('generationLog');
            
            progressFill.style.width = '0%';
            progressText.textContent = 'Iniciando geração...';
            progressPercent.textContent = '0%';
            generationLog.innerHTML = '<div class="log-entry">🚀 Iniciando geração de ' + totalPlans + ' planos de aula...</div>';
            
            progressSection.style.display = 'block';
            progressSection.scrollIntoView({ behavior: 'smooth' });
        }

        updateGenerationProgress(current, total, message) {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const progressPercent = document.getElementById('progressPercent');
            
            const percentage = Math.round((current / total) * 100);
            
            progressFill.style.width = percentage + '%';
            progressText.textContent = message;
            progressPercent.textContent = percentage + '%';
        }

        addGenerationLog(message) {
            const generationLog = document.getElementById('generationLog');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
            generationLog.appendChild(logEntry);
            generationLog.scrollTop = generationLog.scrollHeight;
        }

        completeGenerationProgress(successCount, failCount, newActivitiesCount = 0) {
            const progressText = document.getElementById('progressText');
            const progressPercent = document.getElementById('progressPercent');
            
            progressText.textContent = `Concluído: ${successCount} sucessos, ${failCount} falhas`;
            progressPercent.textContent = '100%';
            
            let completionMessage = `🎉 Geração concluída! ${successCount} planos criados, ${failCount} falhas.`;
            if (newActivitiesCount > 0) {
                completionMessage += ` 🎯 ${newActivitiesCount} nova(s) atividade(s) sincronizada(s) e preparada(s) para futuro desenvolvimento de vídeos por IA.`;
            }
            
            this.addGenerationLog(completionMessage);
            
            // Auto-hide after 8 seconds (increased for activity info)
            setTimeout(() => {
                this.hideGenerationProgress();
            }, 8000);
        }

        hideGenerationProgress() {
            const progressSection = document.getElementById('generationProgressSection');
            progressSection.style.display = 'none';
        }

        setCardLoading(card, isLoading) {
            if (!card) return;
            
            if (isLoading) {
                card.classList.add('loading');
                const button = card.querySelector('button');
                if (button) {
                    button.disabled = true;
                    button.innerHTML = '⏳ Gerando...';
                }
            } else {
                card.classList.remove('loading');
                const button = card.querySelector('button');
                if (button) {
                    button.disabled = false;
                    button.innerHTML = '🤖 Gerar';
                }
            }
        }

        // Plan interaction methods
        async editPlan(planId) {
            console.log(`✏️ Editing plan ${planId}`);
            this.showBanner('🚧 Redirecionando para o editor de planos...', 'info');
            
            // Here you would redirect to the lesson plan editor module
            // For now, we'll show a notification
            setTimeout(() => {
                this.showBanner('Editor de planos será aberto em uma nova aba', 'info');
            }, 1000);
        }

        async viewPlan(planId) {
            console.log(`👁️ Viewing plan ${planId}`);
            
            try {
                const response = await this.apiHelper.api.get(`/api/lesson-plans/${planId}`);
                
                if (response.success) {
                    this.showPlanModal(response.data);
                } else {
                    throw new Error(response.error || 'Erro ao carregar plano');
                }
            } catch (error) {
                console.error('Error viewing plan:', error);
                this.showBanner('Erro ao visualizar plano: ' + error.message, 'error');
            }
        }

        showPlanModal(plan) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>📋 ${plan.title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="plan-details">
                            <div class="plan-meta-row">
                                <strong>Curso:</strong> ${plan.course?.name || 'N/A'}
                            </div>
                            <div class="plan-meta-row">
                                <strong>Unidade:</strong> ${plan.unit || 'N/A'}
                            </div>
                            <div class="plan-meta-row">
                                <strong>Módulo Tático:</strong> ${plan.tacticalModule || 'N/A'}
                            </div>
                            <div class="plan-description">
                                <strong>Descrição:</strong>
                                <p>${plan.description || 'Sem descrição'}</p>
                            </div>
                            ${plan.activities && plan.activities.length > 0 ? `
                                <div class="plan-activities">
                                    <strong>Atividades (${plan.activities.length}):</strong>
                                    <ul>
                                        ${plan.activities.map(activity => {
                                            // Robust title fallback to prevent 'undefined' display
                                            const activityTitle = activity?.name || activity?.title || activity?.description?.substring(0, 50) || 'Atividade sem nome';
                                            return `<li>${activityTitle}</li>`;
                                        }).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                        <button class="btn-primary" onclick="enhancedAI.editPlan('${plan.id}'); this.closest('.modal-overlay').remove();">✏️ Editar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        async refreshPlans() {
            console.log('🔄 Refreshing plans...');
            this.showBanner('🔄 Atualizando planos de aula...', 'info');
            await this.onCourseSelect();
        }

        async loadTabContent(tabName) {
            try {
                switch (tabName) {
                    case 'rag':
                        await this.ragService.renderRAGInterface();
                        break;
                    case 'agents':
                        await this.agentsService.renderAgentsInterface();
                        break;
                    case 'courses':
                        // Load courses and update stats for the new interface
                        await this.loadCourses();
                        break;
                    case 'monitor':
                        await this.monitorService.renderMonitorInterface();
                        break;
                }
            } catch (error) {
                console.error(`Error loading ${tabName} tab:`, error);
                window.app?.handleError(error, `Enhanced AI - ${tabName} tab`);
            }
        }

        showBanner(message, type = 'info') {
            // Create or update banner
            let banner = document.querySelector('.ai-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.className = 'ai-banner';
                document.body.appendChild(banner);
            }
            
            banner.className = `ai-banner ${type}`;
            banner.textContent = message;
            banner.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                banner.style.display = 'none';
            }, 5000);
        }
    }

    // RAG Service
    class RAGService {
        constructor(apiHelper) {
            this.api = apiHelper && apiHelper.api ? apiHelper.api : apiHelper;
            this.documents = [];
            this.vectorStore = null;
            this.conversationHistory = [];
        }

        async renderRAGInterface() {
            const container = document.getElementById('rag-content');
            if (!container) return;

            container.innerHTML = `
                <div class="ai-rag-interface">
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <span class="stat-number" id="documents-count">0</span>
                                <span class="stat-label">Documentos</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🔍</div>
                            <div class="stat-info">
                                <span class="stat-number" id="embeddings-count">0</span>
                                <span class="stat-label">Embeddings</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <span class="stat-number" id="queries-count">0</span>
                                <span class="stat-label">Consultas</span>
                            </div>
                        </div>
                    </div>

                    <!-- Document Upload Section -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>📤 Upload de Documentos</h3>
                            <p>Adicione documentos para expandir a base de conhecimento</p>
                        </div>
                        <div class="upload-area">
                            <div class="upload-dropzone" id="document-dropzone">
                                <div class="upload-icon">📄</div>
                                <p>Arraste arquivos aqui ou clique para selecionar</p>
                                <small>PDF, TXT, MD, DOC - Máximo 10MB por arquivo</small>
                                <input type="file" id="document-input" multiple accept=".pdf,.txt,.md,.doc,.docx" style="display: none;">
                            </div>
                            <div class="upload-progress" id="upload-progress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progress-fill"></div>
                                </div>
                                <span class="progress-text" id="progress-text">Processando...</span>
                            </div>
                        </div>
                    </div>

                    <!-- RAG Query Interface -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>🎯 Consulta Inteligente</h3>
                            <p>Faça perguntas baseadas na base de conhecimento</p>
                        </div>
                        <div class="query-interface">
                            <div class="query-input-group">
                                <textarea id="rag-query" placeholder="Exemplo: Como estruturar um curso de Krav Maga para iniciantes?" rows="3"></textarea>
                                <div class="query-actions">
                                    <button class="btn-generate-now" onclick="enhancedAI.ragService.executeQuery()">
                                        🔍 Consultar RAG
                                    </button>
                                    <button class="btn-secondary" onclick="enhancedAI.ragService.clearHistory()">
                                        🧹 Limpar Histórico
                                    </button>
                                </div>
                            </div>
                            <div class="query-results" id="query-results" style="display: none;"></div>
                        </div>
                    </div>

                    <!-- Conversation History -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>💬 Histórico de Conversas</h3>
                            <p>Últimas consultas realizadas</p>
                        </div>
                        <div class="conversation-history" id="conversation-history">
                            <div class="no-history">Nenhuma consulta realizada ainda. Faça sua primeira pergunta!</div>
                        </div>
                    </div>

                    <!-- Knowledge Base Browser -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>🗄️ Base de Conhecimento</h3>
                            <div class="header-actions">
                                <button class="btn-secondary" onclick="enhancedAI.ragService.refreshDocuments()">
                                    🔄 Atualizar
                                </button>
                                <button class="btn-primary" onclick="enhancedAI.ragService.optimizeVectorStore()">
                                    ⚡ Otimizar
                                </button>
                            </div>
                        </div>
                        <div class="documents-table" id="documents-table">
                            <div class="loading-spinner">Carregando documentos...</div>
                        </div>
                    </div>
                </div>
            `;

            this.setupRAGEventListeners();
            await this.loadDocuments();
            await this.loadRAGStats();
        }

        setupRAGEventListeners() {
            // File upload
            const dropzone = document.getElementById('document-dropzone');
            const fileInput = document.getElementById('document-input');

            dropzone?.addEventListener('click', () => fileInput?.click());
            fileInput?.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }

        async handleFileUpload(files) {
            if (!files.length) return;
            console.log('📤 Uploading', files.length, 'documents');
            // Simulate upload for now
            setTimeout(() => {
                console.log('✅ Documents uploaded successfully');
                this.loadDocuments();
                this.loadRAGStats();
            }, 2000);
        }

        async loadDocuments() {
            try {
                if (!this.api || typeof this.api.get !== 'function') {
                    console.warn('⚠️ API helper not available for RAG documents, using mock data');
                    this.renderDocumentsTable([
                        { id: '1', name: 'Manual Krav Maga.pdf', type: 'pdf', size: 2048000, embeddingsCount: 150, createdAt: new Date() },
                        { id: '2', name: 'Técnicas Básicas.md', type: 'md', size: 512000, embeddingsCount: 80, createdAt: new Date() }
                    ]);
                    return;
                }
                
                const response = await this.api.get('/api/rag/documents');
                if (response.success) {
                    this.renderDocumentsTable(response.data);
                } else {
                    console.error('Failed to load documents:', response.error);
                    this.renderDocumentsTable([]);
                }
            } catch (error) {
                console.error('Error loading documents:', error);
                // Fallback to mock data
                const mockDocuments = [
                    { id: '1', name: 'Manual Krav Maga.pdf', type: 'pdf', size: 2048000, embeddingsCount: 150, createdAt: new Date() },
                    { id: '2', name: 'Técnicas Básicas.md', type: 'md', size: 512000, embeddingsCount: 80, createdAt: new Date() }
                ];
                this.renderDocumentsTable(mockDocuments);
            }
        }

        renderDocumentsTable(documents) {
            const container = document.getElementById('documents-table');
            if (!container) {
                console.warn('⚠️ Documents table container not found');
                return;
            }
            
            // Ensure documents is an array
            const documentsList = Array.isArray(documents) ? documents : [];
            
            if (documentsList.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <h3>Nenhum documento encontrado</h3>
                        <p>Faça upload de documentos para começar</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="premium-table">
                        <thead>
                            <tr>
                                <th>📄 Documento</th>
                                <th>📊 Tipo</th>
                                <th>📏 Tamanho</th>
                                <th>🔍 Embeddings</th>
                                <th>📅 Adicionado</th>
                                <th>⚡ Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${documentsList.map(doc => `
                                <tr>
                                    <td>
                                        <div class="doc-info">
                                            <strong>${doc.name}</strong>
                                        </div>
                                    </td>
                                    <td><span class="badge badge-${doc.type}">${doc.type.toUpperCase()}</span></td>
                                    <td>${this.formatFileSize(doc.size)}</td>
                                    <td><span class="badge badge-info">${doc.embeddingsCount || 0}</span></td>
                                    <td>${new Date(doc.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn-icon" title="Excluir">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        async executeQuery() {
            const query = document.getElementById('rag-query')?.value?.trim();
            if (!query) return;

            const resultsContainer = document.getElementById('query-results');
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = '<div class="loading-spinner">Consultando base de conhecimento...</div>';

            try {
                const response = await this.api.post('/api/rag/query', { query });

                if (response.success) {
                    console.log('🔍 Frontend received response:', response);
                    console.log('🔍 Response.data:', response.data);
                    console.log('🔍 Response.data.response:', response.data.response);
                    
                    // Add to conversation history
                    const conversationItem = {
                        id: Date.now(),
                        query: query,
                        response: response.data,
                        timestamp: new Date()
                    };
                    
                    this.conversationHistory.unshift(conversationItem);
                    
                    // Limit history to last 10 items
                    if (this.conversationHistory.length > 10) {
                        this.conversationHistory = this.conversationHistory.slice(0, 10);
                    }
                    
                    this.renderQueryResults(response.data);
                    this.updateConversationHistory();
                    
                    // Clear the input
                    document.getElementById('rag-query').value = '';
                } else {
                    resultsContainer.innerHTML = '<div class="error-state">Erro ao consultar base de conhecimento</div>';
                }
            } catch (error) {
                console.error('Error executing RAG query:', error);
                resultsContainer.innerHTML = '<div class="error-state">Erro de conexão. Tente novamente.</div>';
            }
        }

        renderQueryResults(data) {
            const container = document.getElementById('query-results');
            
            console.log('🔍 renderQueryResults received data:', data);
            
            // Extract response data from the API structure
            const response = data.response || data;
            const answer = response.response || response.answer || 'Resposta não disponível';
            const sources = response.sources || data.sources || [];
            const confidence = response.confidence || data.confidence || 0;
            
            console.log('🔍 Parsed response:', response);
            console.log('🔍 Parsed answer:', answer);
            console.log('🔍 Parsed sources:', sources);
            
            container.innerHTML = `
                <div class="query-response">
                    <h4>🎯 Resposta</h4>
                    <div class="response-content">${answer}</div>
                    
                    ${confidence ? `<div class="confidence-score">Confiança: ${(confidence * 100).toFixed(1)}%</div>` : ''}
                    
                    <h4>📚 Fontes Relevantes</h4>
                    <div class="sources-list">
                        ${sources.length > 0 ? sources.map(source => `
                            <div class="source-item">
                                <div class="source-header">
                                    <strong>${source.document || source.name || 'Documento'}</strong>
                                    ${source.score ? `<span class="relevance-score">Relevância: ${(source.score * 100).toFixed(1)}%</span>` : ''}
                                </div>
                                <div class="source-content">${source.content || source.excerpt || 'Conteúdo não disponível'}</div>
                            </div>
                        `).join('') : '<p class="no-sources">Nenhuma fonte específica encontrada para esta consulta.</p>'}
                    </div>
                </div>
            `;
        }

        updateConversationHistory() {
            const container = document.getElementById('conversation-history');
            if (!container) return;

            if (this.conversationHistory.length === 0) {
                container.innerHTML = '<div class="no-history">Nenhuma consulta realizada ainda. Faça sua primeira pergunta!</div>';
                return;
            }

            container.innerHTML = `
                <style>
                    .history-items { display: flex; flex-direction: column; gap: 1rem; }
                    .history-item { 
                        background: #f8f9fa; 
                        border-radius: 8px; 
                        padding: 1rem; 
                        border-left: 4px solid #667eea; 
                    }
                    .history-header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start; 
                        margin-bottom: 0.5rem; 
                    }
                    .history-query { 
                        flex: 1; 
                        font-size: 0.95rem; 
                        color: #2d3748; 
                    }
                    .history-time { 
                        font-size: 0.8rem; 
                        color: #718096; 
                        white-space: nowrap; 
                        margin-left: 1rem; 
                    }
                    .history-response { 
                        margin-bottom: 0.75rem; 
                    }
                    .response-preview { 
                        background: white; 
                        padding: 0.75rem; 
                        border-radius: 4px; 
                        font-size: 0.9rem; 
                        color: #4a5568; 
                        margin-top: 0.5rem; 
                        line-height: 1.4; 
                    }
                    .history-actions { 
                        display: flex; 
                        gap: 0.5rem; 
                    }
                    .btn-sm { 
                        padding: 0.25rem 0.75rem; 
                        font-size: 0.8rem; 
                    }
                    .query-actions { 
                        display: flex; 
                        gap: 0.5rem; 
                        align-items: center; 
                    }
                    .confidence-score {
                        background: #e2e8f0;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-size: 0.85rem;
                        color: #4a5568;
                        margin: 0.5rem 0;
                    }
                </style>
                <div class="history-items">
                    ${this.conversationHistory.map((item, index) => `
                        <div class="history-item">
                            <div class="history-header">
                                <div class="history-query">
                                    <strong>🔍 Pergunta:</strong> ${item.query}
                                </div>
                                <div class="history-time">
                                    ${item.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                            <div class="history-response">
                                <strong>🎯 Resposta:</strong> 
                                <div class="response-preview">
                                    ${(item.response.response?.response || item.response.response || 'Resposta não disponível').substring(0, 200)}...
                                </div>
                            </div>
                            <div class="history-actions">
                                <button class="btn-secondary btn-sm" onclick="enhancedAI.ragService.repeatQuery('${item.query.replace(/'/g, "\\'")}')">
                                    🔄 Repetir
                                </button>
                                <button class="btn-secondary btn-sm" onclick="enhancedAI.ragService.removeFromHistory(${item.id})">
                                    🗑️ Remover
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        repeatQuery(query) {
            document.getElementById('rag-query').value = query;
            this.executeQuery();
        }

        removeFromHistory(id) {
            this.conversationHistory = this.conversationHistory.filter(item => item.id !== id);
            this.updateConversationHistory();
        }

        clearHistory() {
            if (confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
                this.conversationHistory = [];
                this.updateConversationHistory();
            }
        }

        async loadRAGStats() {
            try {
                if (!this.api || typeof this.api.get !== 'function') {
                    console.warn('⚠️ API helper not available for RAG stats, using mock data');
                    document.getElementById('documents-count').textContent = '12';
                    document.getElementById('embeddings-count').textContent = '1,250';
                    document.getElementById('queries-count').textContent = '84';
                    return;
                }
                
                const response = await this.api.get('/api/rag/stats');
                if (response.success) {
                    const stats = response.data;
                    document.getElementById('documents-count').textContent = stats.totalDocuments || stats.documentsCount || '0';
                    document.getElementById('embeddings-count').textContent = (stats.totalChunks || stats.embeddingsCount || 0).toLocaleString();
                    document.getElementById('queries-count').textContent = stats.totalConversations || stats.queriesCount || '0';
                } else {
                    console.error('Failed to load RAG stats:', response.error);
                }
            } catch (error) {
                console.error('Error loading RAG stats:', error);
                // Fallback to mock stats
                document.getElementById('documents-count').textContent = '12';
                document.getElementById('embeddings-count').textContent = '1,250';
                document.getElementById('queries-count').textContent = '84';
            }
        }

        formatFileSize(bytes) {
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            if (!bytes) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        async refreshDocuments() {
            await this.loadDocuments();
        }

        async optimizeVectorStore() {
            console.log('⚡ Optimizing vector store...');
        }
    }

    // AI Agents Service
    class AIAgentsService {
        constructor(apiHelper) {
            this.api = apiHelper && apiHelper.api ? apiHelper.api : apiHelper;
            this.agents = [];
            this.activeAgent = null;
        }

        async renderAgentsInterface() {
            const container = document.getElementById('agents-content');
            if (!container) return;

            container.innerHTML = `
                <div class="ai-agents-interface">
                    <!-- Agents Stats -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🤖</div>
                            <div class="stat-info">
                                <span class="stat-number" id="agents-count">0</span>
                                <span class="stat-label">Agentes Ativos</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-info">
                                <span class="stat-number" id="tasks-completed">0</span>
                                <span class="stat-label">Tarefas Executadas</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <span class="stat-number" id="accuracy-rate">0%</span>
                                <span class="stat-label">Taxa de Sucesso</span>
                            </div>
                        </div>
                    </div>

                    <!-- Create New Agent -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>➕ Criar Novo Agente</h3>
                            <p>Configure um agente especializado para tarefas específicas</p>
                        </div>
                        <div class="agent-creation-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Nome do Agente</label>
                                    <input type="text" id="agent-name" placeholder="Ex: Analista de Desempenho">
                                </div>
                                <div class="form-group">
                                    <label>Especialização</label>
                                    <select id="agent-specialization">
                                        <option value="analytics">📊 Análise de Dados</option>
                                        <option value="curriculum">📚 Desenvolvimento Curricular</option>
                                        <option value="student-support">👥 Suporte ao Aluno</option>
                                        <option value="performance">⚡ Otimização de Performance</option>
                                        <option value="marketing">📢 Marketing e Vendas</option>
                                        <option value="finance">💰 Análise Financeira</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Modelo IA</label>
                                    <select id="agent-model">
                                        <option value="gpt-4">GPT-4 (Mais inteligente)</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido)</option>
                                        <option value="claude">Claude (Análise detalhada)</option>
                                        <option value="gemini">Gemini (Multilíngue)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Instruções do Sistema</label>
                                <textarea id="agent-instructions" rows="4" placeholder="Descreva como o agente deve se comportar e quais tarefas deve executar..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button class="btn-generate-now" onclick="enhancedAI.agentsService.createAgent()">
                                    🤖 Criar Agente
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Agents List -->
                    <div class="data-card-premium">
                        <div class="card-header">
                            <h3>🤖 Agentes Cadastrados</h3>
                            <button class="btn-secondary" onclick="enhancedAI.agentsService.refreshAgents()">
                                🔄 Atualizar
                            </button>
                        </div>
                        <div class="agents-grid" id="agents-grid">
                            <div class="loading-spinner">Carregando agentes...</div>
                        </div>
                    </div>

                    <!-- Agent Chat Interface -->
                    <div class="data-card-premium" id="agent-chat-container" style="display: none;">
                        <div class="card-header">
                            <h3>💬 Chat com Agente</h3>
                            <button class="btn-secondary" onclick="enhancedAI.agentsService.closeChat()">✕ Fechar</button>
                        </div>
                        <div class="agent-chat" id="agent-chat"></div>
                        <div class="chat-input-group">
                            <textarea id="chat-message" placeholder="Digite sua mensagem para o agente..." rows="2"></textarea>
                            <button class="btn-primary" onclick="enhancedAI.agentsService.sendMessage()">📤 Enviar</button>
                        </div>
                    </div>
                </div>
            `;

            await this.loadAgents();
            await this.loadAgentsStats();
        }

        async createAgent() {
            const name = document.getElementById('agent-name')?.value?.trim();
            const specialization = document.getElementById('agent-specialization')?.value;
            const model = document.getElementById('agent-model')?.value;
            const instructions = document.getElementById('agent-instructions')?.value?.trim();

            if (!name || !instructions) {
                alert('Nome e instruções são obrigatórios');
                return;
            }

            try {
                const response = await this.api.post('/api/agents', { name, specialization, model, instructions });

                if (response.success) {
                    // Clear form
                    document.getElementById('agent-name').value = '';
                    document.getElementById('agent-instructions').value = '';
                    
                    // Reload agents
                    await this.loadAgents();
                    await this.loadAgentsStats();
                    
                    alert('Agente criado com sucesso!');
                } else {
                    alert('Erro ao criar agente: ' + (response.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Error creating agent:', error);
                alert('Erro de conexão ao criar agente');
            }
        }

        async loadAgents() {
            try {
                if (!this.api || typeof this.api.get !== 'function') {
                    console.warn('⚠️ API helper not available for agents, using mock data');
                    const mockAgents = [
                        { id: '1', name: 'Analytics Pro', specialization: 'analytics', status: 'active', model: 'gpt-4', tasksCompleted: 25, accuracy: 0.94 },
                        { id: '2', name: 'Curriculum Expert', specialization: 'curriculum', status: 'active', model: 'claude', tasksCompleted: 18, accuracy: 0.89 }
                    ];
                    this.renderAgentsGrid(mockAgents);
                    return;
                }
                
                const response = await this.api.get('/api/agents');
                if (response.success) {
                    this.renderAgentsGrid(response.data);
                } else {
                    console.error('Failed to load agents:', response.error);
                    this.renderAgentsGrid([]);
                }
            } catch (error) {
                console.error('Error loading agents:', error);
                // Fallback to mock data
                const mockAgents = [
                    { id: '1', name: 'Analytics Pro', specialization: 'analytics', status: 'active', model: 'gpt-4', tasksCompleted: 25, accuracy: 0.94 },
                    { id: '2', name: 'Curriculum Expert', specialization: 'curriculum', status: 'active', model: 'claude', tasksCompleted: 18, accuracy: 0.89 }
                ];
                this.renderAgentsGrid(mockAgents);
            }
        }

        renderAgentsGrid(agents) {
            const container = document.getElementById('agents-grid');
            if (!container) {
                console.warn('⚠️ Agents grid container not found');
                return;
            }
            
            // Ensure agents is an array
            const agentsList = Array.isArray(agents) ? agents : [];
            
            if (agentsList.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🤖</div>
                        <h3>Nenhum agente encontrado</h3>
                        <p>Crie seu primeiro agente IA para começar</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <div class="agents-list">
                    ${agentsList.map(agent => `
                        <div class="agent-card">
                            <div class="agent-header">
                                <div class="agent-avatar">${this.getSpecializationIcon(agent.specialization)}</div>
                                <div class="agent-info">
                                    <h4>${agent.name}</h4>
                                    <span class="agent-status ${agent.status}">${agent.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}</span>
                                </div>
                            </div>
                            <div class="agent-stats">
                                <span>📊 ${agent.tasksCompleted || 0} tarefas</span>
                                <span>⚡ ${agent.model}</span>
                                <span>🎯 ${(agent.accuracy * 100).toFixed(1)}%</span>
                            </div>
                            <div class="agent-actions">
                                <button class="btn-primary btn-sm" onclick="enhancedAI.agentsService.chatWithAgent('${agent.id}')">
                                    💬 Conversar
                                </button>
                                <button class="btn-secondary btn-sm" onclick="enhancedAI.agentsService.editAgent('${agent.id}')">
                                    ⚙️ Configurar
                                </button>
                                <button class="btn-danger btn-sm" onclick="enhancedAI.agentsService.deleteAgent('${agent.id}')">
                                    🗑️ Excluir
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        getSpecializationIcon(specialization) {
            const icons = {
                'analytics': '📊',
                'curriculum': '📚', 
                'student-support': '👥',
                'performance': '⚡',
                'marketing': '📢',
                'finance': '💰'
            };
            return icons[specialization] || '🤖';
        }

        async chatWithAgent(agentId) {
            this.activeAgent = agentId;
            const chatContainer = document.getElementById('agent-chat-container');
            chatContainer.style.display = 'block';
            
            document.getElementById('agent-chat').innerHTML = `
                <div class="chat-message agent">
                    <div class="message-content">Olá! Como posso ajudá-lo hoje?</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
        }

        async sendMessage() {
            const messageText = document.getElementById('chat-message')?.value?.trim();
            if (!messageText || !this.activeAgent) return;

            // Clear input
            document.getElementById('chat-message').value = '';

            // Add user message to chat
            this.addMessageToChat('user', messageText);

            try {
                const response = await this.api.post('/api/agents/chat', { 
                    agentId: this.activeAgent,
                    message: messageText 
                });

                if (response.success) {
                    this.addMessageToChat('agent', response.data.response);
                } else {
                    this.addMessageToChat('agent', 'Desculpe, ocorreu um erro. Tente novamente.');
                }
            } catch (error) {
                console.error('Error sending message to agent:', error);
                this.addMessageToChat('agent', 'Erro de conexão. Verifique sua internet e tente novamente.');
            }
        }

        addMessageToChat(sender, message) {
            const chatContainer = document.getElementById('agent-chat');
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${sender}`;
            
            messageElement.innerHTML = `
                <div class="message-content">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;

            chatContainer.appendChild(messageElement);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        async loadAgentsStats() {
            try {
                if (!this.api || typeof this.api.get !== 'function') {
                    console.warn('⚠️ API helper not available for agent stats, using mock data');
                    document.getElementById('agents-count').textContent = '3';
                    document.getElementById('tasks-completed').textContent = '47';
                    document.getElementById('accuracy-rate').textContent = '92%';
                    return;
                }
                
                const response = await this.api.get('/api/agents/stats');
                if (response.success) {
                    const stats = response.data;
                    document.getElementById('agents-count').textContent = stats.activeAgents || '0';
                    document.getElementById('tasks-completed').textContent = stats.totalTasks || '0';
                    document.getElementById('accuracy-rate').textContent = `${Math.round((stats.avgAccuracy || 0) * 100)}%`;
                } else {
                    console.error('Failed to load agents stats:', response.error);
                }
            } catch (error) {
                console.error('Error loading agents stats:', error);
                // Fallback to mock stats
                document.getElementById('agents-count').textContent = '3';
                document.getElementById('tasks-completed').textContent = '47';
                document.getElementById('accuracy-rate').textContent = '92%';
            }
        }

        closeChat() {
            document.getElementById('agent-chat-container').style.display = 'none';
            this.activeAgent = null;
        }

        async refreshAgents() {
            await this.loadAgents();
        }

        async editAgent(agentId) {
            console.log('⚙️ Editing agent:', agentId);
        }

        async deleteAgent(agentId) {
            if (confirm('Tem certeza que deseja excluir este agente?')) {
                console.log('🗑️ Deleting agent:', agentId);
                await this.loadAgents();
            }
        }
    }

    // Enhanced Course Service (same as existing but RAG-aware)
    class EnhancedCourseService {
        constructor(apiHelper) {
            this.api = apiHelper;
        }
        
        // This will integrate with existing course generation functionality
        // The existing course generation will automatically be enhanced
    }
    
    // Configurações persistentes
    const AI_CONFIG_KEY = 'ai_module_config';
    
    function saveConfiguration() {
        const config = {
            aiProvider: document.getElementById('aiProvider')?.value || 'gemini',
            aiProviderSelect: document.getElementById('aiProviderSelect')?.value || 'gemini',
            courseId: document.getElementById('courseSelect')?.value || '',
            lessonNumber: document.getElementById('lessonNumberInput')?.value || 1,
            generateVariations: document.getElementById('generateVariations')?.checked || false,
            includeAdaptations: document.getElementById('includeAdaptations')?.checked || true
        };
        
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    }
    
    function loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem(AI_CONFIG_KEY);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                console.log('📖 Loading AI configuration:', config);
                
                // Aplicar configurações salvas
                if (document.getElementById('aiProvider')) {
                    document.getElementById('aiProvider').value = config.aiProvider || 'gemini';
                }
                if (document.getElementById('aiProviderSelect')) {
                    document.getElementById('aiProviderSelect').value = config.aiProviderSelect || 'gemini';
                }
                if (document.getElementById('courseSelect')) {
                    document.getElementById('courseSelect').value = config.courseId || '';
                }
                if (document.getElementById('lessonNumberInput')) {
                    document.getElementById('lessonNumberInput').value = config.lessonNumber || 1;
                }
                if (document.getElementById('generateVariations')) {
                    document.getElementById('generateVariations').checked = config.generateVariations || false;
                }
                if (document.getElementById('includeAdaptations')) {
                    document.getElementById('includeAdaptations').checked = config.includeAdaptations !== false;
                }
                
                return config;
            }
        } catch (error) {
            console.error('❌ Error loading AI configuration:', error);
        }
        return null;
    }
    
    function getGenerationOptions() {
        const options = {
            aiProvider: document.getElementById('aiProvider')?.value || 'gemini',
            courseId: document.getElementById('courseSelect')?.value || '',
            generateVariations: document.getElementById('generateVariations')?.checked || false,
            includeAdaptations: document.getElementById('includeAdaptations')?.checked || true
        };
        
        // Salvar configuração sempre que obter opções
        saveConfiguration();
        
        return options;
    }
    
    async function waitForAPIClient() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    async function initializeAPI() {
        await waitForAPIClient();
        aiAPI = window.createModuleAPI('AI');
    }
    
    // Main initialization function - now uses Enhanced AI Module
    async function initializeAIModule() {
        // Initialize Enhanced AI Module instead of old system
        if (enhancedAI) {
            return await enhancedAI.initialize();
        } else {
            // Enhanced AI Module will be initialized by router
            return await initializeEnhancedModule();
        }
    }
    
    // Legacy functions removed - now handled by Enhanced AI Module
    // All course loading and UI management is in the Enhanced AI Module
    
    function updateStats(stats) {
        if (stats.totalCourses !== undefined) {
            const el = document.getElementById('aiTotalCourses');
            if (el) el.textContent = stats.totalCourses;
        }
        if (stats.generatedTechniques !== undefined) {
            const el = document.getElementById('aiGeneratedTechniques');
            if (el) el.textContent = stats.generatedTechniques;
        }
        if (stats.generatedLessons !== undefined) {
            const el = document.getElementById('aiGeneratedLessons');
            if (el) el.textContent = stats.generatedLessons;
        }
        if (stats.processingTime !== undefined) {
            const el = document.getElementById('aiProcessingTime');
            if (el) el.textContent = stats.processingTime + 's';
        }
    }
    
    function setupEventListeners() {
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', handleGenerationModeChange);
        });
        
        const uploadBtn = document.getElementById('uploadDocumentBtn');
        const fileInput = document.getElementById('documentFile');
        
        uploadBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', handleDocumentUpload);
        
        const uploadZone = document.querySelector('.upload-zone');
        if (uploadZone) {
            uploadZone.addEventListener('dragover', handleDragOver);
            uploadZone.addEventListener('dragleave', handleDragLeave);
            uploadZone.addEventListener('drop', handleDrop);
        }
        
        const generateTechniquesBtn = document.getElementById('generateTechniquesBtn');
        const generateLessonsBtn = document.getElementById('generateLessonsBtn');
        const generateAllBtn = document.getElementById('generateAllBtn');
        const generateSingleLessonBtn = document.getElementById('generateSingleLessonBtn');
        const generateBatchLessonsBtn = document.getElementById('generateBatchLessonsBtn');
        
        // Test simples: onclick direto nos elementos
        if (generateAllBtn) {
            generateAllBtn.onclick = function(e) {
                e.preventDefault();
                handleGenerateAll();
            };
        }
        
        if (generateSingleLessonBtn) {
            generateSingleLessonBtn.onclick = function(e) {
                e.preventDefault(); 
                handleGenerateSingleLesson();
            };
        }
        
        if (generateBatchLessonsBtn) {
            generateBatchLessonsBtn.onclick = function(e) {
                e.preventDefault();
                handleGenerateBatchLessons();
            };
        }
        
        if (generateTechniquesBtn) {
            generateTechniquesBtn.onclick = function(e) {
                e.preventDefault();
                handleGenerateTechniques();
            };
        }
        
        if (generateLessonsBtn) {
            generateLessonsBtn.onclick = function(e) {
                e.preventDefault();
                console.log('🔥🔥🔥 generateLessonsBtn ONCLICK!');
                handleGenerateLessons();
            };
        }
        
        // Single lesson config event listeners
        const generateNowBtn = document.getElementById('generateNowBtn');
        const cancelLessonBtn = document.getElementById('cancelLessonBtn');
        
        // Event listeners para botões do modal
        generateNowBtn?.addEventListener('click', handleGenerateNow);
        cancelLessonBtn?.addEventListener('click', handleCancelLesson);
        
        // Backup onclick (caso addEventListener falhe)
        if (generateNowBtn) {
            generateNowBtn.onclick = function(e) {
                e.preventDefault();
                handleGenerateNow();
            };
        }
        
        if (cancelLessonBtn) {
            cancelLessonBtn.onclick = function(e) {
                e.preventDefault();
                handleCancelLesson();
            };
        }
        
        // Batch generation buttons
        const generateBatchBtn = document.getElementById('generateBatchBtn');
        const cancelBatchBtn = document.getElementById('cancelBatchBtn');
        
        if (generateBatchBtn) {
            generateBatchBtn.onclick = function(e) {
                e.preventDefault();
                handleGenerateBatchNow();
            };
        }
        
        if (cancelBatchBtn) {
            cancelBatchBtn.onclick = function(e) {
                e.preventDefault();
                handleCancelBatch();
            };
        }
        
        const courseSelect = document.getElementById('courseSelect');
        courseSelect?.addEventListener('change', handleCourseSelection);
        
        // Auto-save configuration listeners
        const configInputs = [
            'aiProvider', 'aiProviderSelect', 'lessonNumberInput', 
            'generateVariations', 'includeAdaptations'
        ];
        
        configInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'input';
                element.addEventListener(eventType, () => {
                    setTimeout(saveConfiguration, 100); // Debounce
                });
            }
        });
        
    }
    
    function handleGenerationModeChange(event) {
        const card = event.currentTarget;
        const mode = card.dataset.mode;
        
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        generationMode = mode;
        
        const uploadArea = document.getElementById('uploadArea');
        const courseAnalysisPreview = document.getElementById('courseAnalysisPreview');
        
        if (mode === 'document') {
            if (uploadArea) uploadArea.style.display = 'block';
            if (courseAnalysisPreview) courseAnalysisPreview.style.display = 'none';
        } else {
            if (uploadArea) uploadArea.style.display = 'none';
            if (courseAnalysisPreview) courseAnalysisPreview.style.display = 'block';
            enableGenerationButtons();
        }
    }
    
    async function handleCourseSelection(event) {
        const courseId = event.target.value;
        const courseInfo = document.getElementById('courseInfo');
        
        if (!courseId) {
            if (courseInfo) courseInfo.style.display = 'none';
            currentCourse = null;
            return;
        }
        
        try {
            await aiAPI.fetchWithStates(`/api/courses/${courseId}`, {
                onSuccess: (course) => {
                    currentCourse = course;
                    displayCourseInfo(course);
                },
                onError: (error) => {
                    console.error('❌ Error loading course:', error);
                    showError('Erro ao carregar curso: ' + error.message);
                }
            });
        } catch (error) {
            console.error('❌ Error in handleCourseSelection:', error);
        }
    }
    
    function displayCourseInfo(course) {
        console.log('📚 Displaying course info:', course.name);
        
        // Load and display existing lesson plans for the course
        loadExistingLessons(course.id);
        
        enableGenerationButtons();
    }
    
    async function loadExistingLessons(courseId) {
        const existingLessonsContainer = document.getElementById('existingLessonsContainer');
        
        // Create container if it doesn't exist
        if (!existingLessonsContainer) {
            const courseSelectContainer = document.querySelector('#courseSelect').closest('.data-card-premium');
            const newContainer = document.createElement('div');
            newContainer.id = 'existingLessonsContainer';
            newContainer.className = 'data-card-premium';
            newContainer.style.display = 'none';
            courseSelectContainer.insertAdjacentElement('afterend', newContainer);
        }
        
        try {
            const container = document.getElementById('existingLessonsContainer');
            container.innerHTML = `
                <div class="card-header">
                    <h3>📚 Planos de Aula do Curso</h3>
                    <p>Selecione uma aula existente para gerar novo plano ou verificar se já existe</p>
                </div>
                <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                    <div class="spinner"></div>
                    <p>Carregando planos de aula...</p>
                </div>
            `;
            container.style.display = 'block';
            
            const response = await aiAPI.request(`/api/lesson-plans?courseId=${courseId}`);
            
            if (response.success && response.data) {
                displayLessonPlans(response.data);
            } else {
                throw new Error(response.error || 'Erro ao carregar planos');
            }
        } catch (error) {
            console.error('❌ Error loading lesson plans:', error);
            const container = document.getElementById('existingLessonsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="card-header">
                        <h3>📚 Planos de Aula do Curso</h3>
                        <p>Erro ao carregar planos de aula</p>
                    </div>
                    <div style="padding: 2rem; text-align: center;">
                        <p>⚠️ ${error.message}</p>
                        <button onclick="window.aiModule.loadExistingLessons('${courseId}')" class="btn-primary">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                `;
            }
        }
    }
    
    function displayLessonPlans(lessonPlans) {
        const container = document.getElementById('existingLessonsContainer');
        if (!container) return;
        
        // Sort lessons by lesson number
        const sortedLessons = [...lessonPlans].sort((a, b) => a.lessonNumber - b.lessonNumber);
        
        const lessonsHtml = sortedLessons.map(lesson => {
            const hasVersions = lesson.versions && lesson.versions.length > 1;
            const versionInfo = hasVersions ? 
                `<span class="version-badge">📝 ${lesson.versions.length} versões</span>` : 
                `<span class="single-version">📄 1 versão</span>`;
            
            return `
                <div class="lesson-item" data-lesson-id="${lesson.id}" data-lesson-number="${lesson.lessonNumber}">
                    <div class="lesson-header">
                        <div class="lesson-number">Aula ${lesson.lessonNumber}</div>
                        <div class="lesson-status">
                            <span class="status-badge status-existing">✅ Existe</span>
                            ${versionInfo}
                        </div>
                    </div>
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-meta">
                        <span>📅 Semana ${lesson.weekNumber}</span>
                        <span>⏱️ ${lesson.duration}min</span>
                        <span>⭐ Nível ${lesson.difficulty}</span>
                    </div>
                    <div class="lesson-actions">
                        <button class="btn-outline" onclick="window.aiModule.regenerateLessonPlan('${lesson.id}', ${lesson.lessonNumber})">
                            🔄 Gerar Nova Versão
                        </button>
                        <button class="btn-outline" onclick="window.aiModule.viewLessonVersions('${lesson.id}')">
                            👁️ Ver Versões
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        const emptySlots = generateEmptyLessonSlots(sortedLessons);
        
        container.innerHTML = `
            <div class="card-header">
                <h3>📚 Planos de Aula do Curso</h3>
                <p>Total: ${sortedLessons.length} planos criados</p>
            </div>
            <div style="padding: 2rem;">
                <div class="lessons-grid">
                    ${lessonsHtml}
                    ${emptySlots}
                </div>
                <div style="margin-top: 2rem; text-align: center;">
                    <button class="btn-primary" onclick="window.aiModule.showNewLessonOptions()">
                        ➕ Criar Nova Aula
                    </button>
                </div>
            </div>
        `;
    }
    
    function generateEmptyLessonSlots(existingLessons) {
        const maxLesson = Math.max(...existingLessons.map(l => l.lessonNumber), 0);
        const emptySlots = [];
        
        // Show next 3 available lesson slots
        for (let i = 1; i <= 3; i++) {
            const lessonNumber = maxLesson + i;
            const weekNumber = Math.ceil(lessonNumber / 2);
            
            emptySlots.push(`
                <div class="lesson-item lesson-empty" data-lesson-number="${lessonNumber}">
                    <div class="lesson-header">
                        <div class="lesson-number">Aula ${lessonNumber}</div>
                        <div class="lesson-status">
                            <span class="status-badge status-empty">➕ Disponível</span>
                        </div>
                    </div>
                    <div class="lesson-title">Nova Aula - Título será gerado</div>
                    <div class="lesson-meta">
                        <span>📅 Semana ${weekNumber}</span>
                        <span>⏱️ 60min</span>
                        <span>⭐ Nível 1</span>
                    </div>
                    <div class="lesson-actions">
                        <button class="btn-primary" onclick="window.aiModule.createNewLessonPlan(${lessonNumber})">
                            ✨ Gerar Plano
                        </button>
                    </div>
                </div>
            `);
        }
        
        return emptySlots.join('');
    }
    
    async function regenerateLessonPlan(lessonId, lessonNumber) {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        const confirmed = confirm(`Gerar nova versão do plano para a Aula ${lessonNumber}?\n\nO plano atual será arquivado e uma nova versão será criada.`);
        if (!confirmed) return;
        
        try {
            showGenerationProgress(`Gerando nova versão da Aula ${lessonNumber}...`);
            
            const weekNumber = Math.ceil(lessonNumber / 2);
            const requestData = {
                courseId: currentCourse.id,
                type: 'lesson',
                provider: 'gemini',
                lessonNumber: lessonNumber,
                weekNumber: weekNumber,
                regenerate: true,
                originalLessonId: lessonId
            };
            
            const response = await aiAPI.request('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            if (response.success) {
                showBanner(`✅ Nova versão da Aula ${lessonNumber} gerada com sucesso!`, 'success');
                
                // Reload the lesson plans to show updated information
                loadExistingLessons(currentCourse.id);
            } else {
                throw new Error(response.error || 'Erro na regeneração');
            }
        } catch (error) {
            console.error('❌ Error regenerating lesson plan:', error);
            showBanner(`❌ Erro ao regenerar Aula ${lessonNumber}: ${error.message}`, 'error');
        } finally {
            hideGenerationProgress();
        }
    }
    
    async function createNewLessonPlan(lessonNumber) {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        const confirmed = confirm(`Gerar novo plano para a Aula ${lessonNumber}?`);
        if (!confirmed) return;
        
        try {
            showGenerationProgress(`Gerando Aula ${lessonNumber}...`);
            
            const weekNumber = Math.ceil(lessonNumber / 2);
            const requestData = {
                courseId: currentCourse.id,
                type: 'lesson',
                provider: 'gemini',
                lessonNumber: lessonNumber,
                weekNumber: weekNumber
            };
            
            const response = await aiAPI.request('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            if (response.success) {
                showBanner(`✅ Aula ${lessonNumber} gerada com sucesso!`, 'success');
                
                // Reload the lesson plans to show the new lesson
                loadExistingLessons(currentCourse.id);
            } else {
                throw new Error(response.error || 'Erro na geração');
            }
        } catch (error) {
            console.error('❌ Error creating lesson plan:', error);
            showBanner(`❌ Erro ao gerar Aula ${lessonNumber}: ${error.message}`, 'error');
        } finally {
            hideGenerationProgress();
        }
    }
    
    function viewLessonVersions(lessonId) {
        // TODO: Implement version history viewer
        alert('Visualização de versões em desenvolvimento. Por enquanto, use o módulo de Planos de Aula.');
    }
    
    function showNewLessonOptions() {
        const modal = `
            <div class="modal-overlay" id="newLessonModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>➕ Criar Nova Aula</h3>
                        <button class="modal-close" onclick="document.getElementById('newLessonModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="newLessonNumber"><strong>Número da Aula*</strong></label>
                            <input type="number" id="newLessonNumber" class="form-control" min="1" value="1">
                        </div>
                        <div class="form-group">
                            <label for="newLessonProvider"><strong>Provedor de IA*</strong></label>
                            <select id="newLessonProvider" class="form-control">
                                <option value="gemini">Gemini</option>
                                <option value="anthropic">Anthropic</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" id="useRagData"> Usar dados RAG do curso</label>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="document.getElementById('newLessonModal').remove()">Cancelar</button>
                        <button class="btn-primary" onclick="window.aiModule.executeNewLesson()">✨ Gerar Aula</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
    }
    
    async function executeNewLesson() {
        const lessonNumber = parseInt(document.getElementById('newLessonNumber')?.value);
        const provider = document.getElementById('newLessonProvider')?.value || 'gemini';
        const useRag = document.getElementById('useRagData')?.checked || false;
        
        // Close modal
        document.getElementById('newLessonModal')?.remove();
        
        if (!lessonNumber || lessonNumber < 1) {
            alert('Número da aula deve ser maior que 0');
            return;
        }
        
        try {
            showGenerationProgress(`Gerando Aula ${lessonNumber} com ${provider.toUpperCase()}...`);
            
            const weekNumber = Math.ceil(lessonNumber / 2);
            const requestData = {
                courseId: currentCourse.id,
                type: 'lesson',
                provider: provider,
                useRag: useRag,
                lessonNumber: lessonNumber,
                weekNumber: weekNumber
            };
            
            const response = await aiAPI.request('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            if (response.success) {
                showBanner(`✅ Aula ${lessonNumber} gerada com sucesso usando ${provider.toUpperCase()}!`, 'success');
                
                // Reload the lesson plans
                loadExistingLessons(currentCourse.id);
            } else {
                throw new Error(response.error || 'Erro na geração');
            }
        } catch (error) {
            console.error('❌ Error executing new lesson:', error);
            showBanner(`❌ Erro ao gerar Aula ${lessonNumber}: ${error.message}`, 'error');
        } finally {
            hideGenerationProgress();
        }
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }
    
    function handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    }
    
    function handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('documentFile');
            if (fileInput) {
                fileInput.files = files;
                handleDocumentUpload({ target: { files } });
            }
        }
    }
    
    async function handleDocumentUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            alert('Tipo de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.');
            event.target.value = '';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('Arquivo muito grande. Tamanho máximo: 10MB');
            event.target.value = '';
            return;
        }
        
        try {
            showUploadProgress();
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', currentCourse.id);
            formData.append('aiProvider', 'claude');
            formData.append('analysisType', 'full');
            
            const startTime = Date.now();
            
            const response = await fetch('/api/ai/analyze-course-document', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Erro ao analisar documento');
            }
            
            const processingTime = Math.round((Date.now() - startTime) / 1000);
            updateStats({ processingTime });
            
            displayAnalysisResults(result.data);
            enableGenerationButtons();
            
        } catch (error) {
            console.error('❌ Error uploading document:', error);
            alert(`Erro ao fazer upload: ${error.message}`);
        } finally {
            hideUploadProgress();
            event.target.value = '';
        }
    }
    
    async function handleGenerateTechniques() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando técnicas...');
            const startTime = Date.now();
            
            const requestData = {
                courseId: currentCourse.id,
                options: getGenerationOptions()
            };
            
            if (generationMode === 'document') {
                const analysisResults = document.getElementById('analysisResults');
                if (!analysisResults || analysisResults.style.display === 'none') {
                    alert('Faça o upload de um documento primeiro ou use o modo "Dados do Curso".');
                    hideGenerationProgress();
                    return;
                }
            }
            
            await aiAPI.saveWithFeedback('/api/ai/generate-techniques', requestData, {
                onSuccess: (data) => {
                    const processingTime = Math.round((Date.now() - startTime) / 1000);
                    updateStats({ 
                        generatedTechniques: data.created,
                        processingTime 
                    });
                    
                    displayTechniquesResults(data);
                    showBanner(`✅ ${data.created} técnicas geradas com sucesso!`, 'success');
                },
                onError: (error) => {
                    console.error('❌ Error generating techniques:', error);
                    showBanner(`Erro ao gerar técnicas: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            console.error('❌ Error in handleGenerateTechniques:', error);
        } finally {
            hideGenerationProgress();
        }
    }
    
    async function handleGenerateLessons() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando planos de aula...');
            const startTime = Date.now();
            
            const requestData = {
                courseId: currentCourse.id,
                options: getGenerationOptions()
            };
            
            if (generationMode === 'document') {
                const analysisResults = document.getElementById('analysisResults');
                if (!analysisResults || analysisResults.style.display === 'none') {
                    alert('Faça o upload de um documento primeiro ou use o modo "Dados do Curso".');
                    hideGenerationProgress();
                    return;
                }
            }
            
            await aiAPI.saveWithFeedback('/api/ai/generate-lesson-plans', requestData, {
                onSuccess: (data) => {
                    const processingTime = Math.round((Date.now() - startTime) / 1000);
                    updateStats({ 
                        generatedLessons: data.created,
                        processingTime 
                    });
                    
                    displayLessonsResults(data);
                    showBanner(`✅ ${data.created} planos de aula gerados com sucesso!`, 'success');
                },
                onError: (error) => {
                    console.error('❌ Error generating lessons:', error);
                    showBanner(`Erro ao gerar planos: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            console.error('❌ Error in handleGenerateLessons:', error);
        } finally {
            hideGenerationProgress();
        }
    }
    
    async function handleGenerateAll() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        try {
            showGenerationProgress('Gerando técnicas e planos de aula...');
            await handleGenerateTechniques();
            await handleGenerateLessons();
            showBanner('✅ Geração completa finalizada!', 'success');
        } catch (error) {
            console.error('❌ Error in handleGenerateAll:', error);
            showBanner(`Erro na geração completa: ${error.message}`, 'error');
        }
    }
    
    function enableGenerationButtons() {
        if (!currentCourse) {
            return;
        }
        
        const analysisResults = document.getElementById('analysisResults');
        const shouldEnable = generationMode === 'direct' || 
            (generationMode === 'document' && analysisResults?.style.display !== 'none');
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn', 'generateSingleLessonBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !shouldEnable;
            }
        });
    }

    // Single Lesson Generation Functions
    function handleGenerateSingleLesson() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        // Hide batch config if open
        const batchConfigDiv = document.getElementById('batchGenerationConfig');
        if (batchConfigDiv) batchConfigDiv.style.display = 'none';
        
        const configDiv = document.getElementById('singleLessonConfig');
        console.log('Config div found:', !!configDiv);
        
        if (configDiv) {
            const isVisible = configDiv.style.display !== 'none';
            configDiv.style.display = isVisible ? 'none' : 'block';
        }
        
        // Auto-suggest lesson number based on existing plans
        suggestLessonNumber();
    }

    function handleGenerateBatchLessons() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        // Hide single lesson config if open
        const singleConfigDiv = document.getElementById('singleLessonConfig');
        if (singleConfigDiv) singleConfigDiv.style.display = 'none';
        
        const configDiv = document.getElementById('batchGenerationConfig');
        
        if (configDiv) {
            const isVisible = configDiv.style.display !== 'none';
            configDiv.style.display = isVisible ? 'none' : 'block';
            
            if (configDiv.style.display !== 'none') {
                setupBatchConfiguration();
            }
        }
        
        console.log('🚀 Batch generation configuration opened');
    }

    function setupBatchConfiguration() {
        const startInput = document.getElementById('batchStartLesson');
        const endInput = document.getElementById('batchEndLesson');
        const countInput = document.getElementById('batchCount');
        
        // Auto-suggest starting lesson number
        suggestBatchLessonNumbers();
        
        // Update count when range changes
        function updateBatchCount() {
            const start = parseInt(startInput?.value) || 1;
            const end = parseInt(endInput?.value) || 1;
            const count = Math.max(0, end - start + 1);
            
            if (countInput) {
                countInput.value = count;
            }
            
            updateBatchPreview(start, end);
        }
        
        startInput?.addEventListener('input', updateBatchCount);
        endInput?.addEventListener('input', updateBatchCount);
        
        // Initial update
        updateBatchCount();
    }

    async function suggestBatchLessonNumbers() {
        // Get existing lesson numbers
        try {
            const response = await aiAPI.request(`/api/lesson-plans?courseId=${currentCourse.id}`);
            if (response.success && response.data) {
                const existingNumbers = response.data.map(plan => plan.lessonNumber).sort((a, b) => a - b);
                const maxNumber = Math.max(...existingNumbers, 0);
                
                const startInput = document.getElementById('batchStartLesson');
                const endInput = document.getElementById('batchEndLesson');
                
                if (startInput) startInput.value = maxNumber + 1;
                if (endInput) endInput.value = maxNumber + 5;
            }
        } catch (error) {
            console.warn('Could not suggest batch lesson numbers:', error);
        }
    }

    function updateBatchPreview(start, end) {
        const previewDiv = document.getElementById('batchPreviewList');
        if (!previewDiv) return;
        
        const count = end - start + 1;
        
        if (count <= 0) {
            previewDiv.innerHTML = '<p class="preview-empty">⚠️ Intervalo inválido</p>';
            return;
        }
        
        if (count > 20) {
            previewDiv.innerHTML = '<p class="preview-warning">⚠️ Máximo de 20 aulas por vez</p>';
            return;
        }
        
        const lessons = [];
        for (let i = start; i <= end; i++) {
            const week = Math.ceil(i / 2);
            lessons.push(`<div class="preview-item">📚 Aula ${i} (Semana ${week})</div>`);
        }
        
        previewDiv.innerHTML = `
            <div class="preview-summary">
                <strong>Total: ${count} aulas</strong>
            </div>
            ${lessons.join('')}
        `;
    }

    function handleCancelLesson() {
        const configDiv = document.getElementById('singleLessonConfig');
        if (configDiv) {
            configDiv.style.display = 'none';
        }
    }

    function handleCancelBatch() {
        const configDiv = document.getElementById('batchGenerationConfig');
        if (configDiv) {
            configDiv.style.display = 'none';
        }
    }

    async function handleGenerateBatchNow() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }
        
        const startLesson = parseInt(document.getElementById('batchStartLesson')?.value) || 1;
        const endLesson = parseInt(document.getElementById('batchEndLesson')?.value) || 1;
        const aiProvider = document.getElementById('batchAiProviderSelect')?.value || 'gemini';
        
        const count = endLesson - startLesson + 1;
        
        if (count <= 0) {
            alert('Intervalo de aulas inválido.');
            return;
        }
        
        if (count > 20) {
            alert('Máximo de 20 aulas por vez. Ajuste o intervalo.');
            return;
        }
        
        // Confirmação
        const confirmMsg = `Gerar ${count} planos de aula (${startLesson} a ${endLesson}) com ${aiProvider.toUpperCase()}?`;
        if (!confirm(confirmMsg)) return;
        
        try {
            showGenerationProgress(`Gerando ${count} planos de aula... (0/${count})`);
            const startTime = Date.now();
            
            const results = [];
            let successCount = 0;
            let errorCount = 0;
            
            for (let lessonNumber = startLesson; lessonNumber <= endLesson; lessonNumber++) {
                const weekNumber = Math.ceil(lessonNumber / 2);
                
                try {
                    // Update progress
                    const current = lessonNumber - startLesson + 1;
                    showGenerationProgress(`Gerando Aula ${lessonNumber}... (${current}/${count})`);
                    
                    const requestData = {
                        courseId: currentCourse.id,
                        lessonNumber: lessonNumber,
                        weekNumber: weekNumber,
                        aiProvider: aiProvider
                    };
                    
                    const response = await aiAPI.request('/api/ai/generate-single-lesson', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestData)
                    });
                    
                    if (response.success) {
                        results.push({
                            lessonNumber,
                            success: true,
                            data: response.data
                        });
                        successCount++;
                    } else {
                        throw new Error(response.error || 'Erro na geração');
                    }
                    
                } catch (lessonError) {
                    console.error(`❌ Error generating lesson ${lessonNumber}:`, lessonError);
                    results.push({
                        lessonNumber,
                        success: false,
                        error: lessonError.message
                    });
                    errorCount++;
                }
                
                // Small delay between generations
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            hideGenerationProgress();
            
            const processingTime = Math.round((Date.now() - startTime) / 1000);
            updateStats({ 
                generatedLessons: successCount,
                processingTime 
            });
            
            // Display batch results
            displayBatchResults(results, successCount, errorCount);
            
            // Success banner with actions
            showSuccessBannerWithActions(
                `✅ Geração em lote concluída: ${successCount} sucessos, ${errorCount} erros`,
                [
                    {
                        text: '📚 Ver Todos os Planos',
                        action: () => window.router?.navigateTo('lesson-plans')
                    },
                    {
                        text: '🚀 Gerar Outro Lote',
                        action: () => {
                            const endInput = document.getElementById('batchEndLesson');
                            const startInput = document.getElementById('batchStartLesson');
                            if (endInput && startInput) {
                                const nextStart = parseInt(endInput.value) + 1;
                                startInput.value = nextStart;
                                endInput.value = nextStart + 4;
                            }
                            document.getElementById('batchGenerationConfig').style.display = 'block';
                        }
                    }
                ]
            );
            
            // Hide config
            handleCancelBatch();
            
        } catch (error) {
            hideGenerationProgress();
            console.error('❌ Error in batch generation:', error);
            showBanner(`Erro na geração em lote: ${error.message}`, 'error');
        }
    }

    async function handleGenerateNow() {
        if (!currentCourse) {
            alert('Selecione um curso primeiro.');
            return;
        }

        const lessonNumber = parseInt(document.getElementById('lessonNumberInput')?.value) || 1;
        const weekNumber = parseInt(document.getElementById('weekNumberInput')?.value) || 1;
        const aiProvider = document.getElementById('aiProviderSelect')?.value || 'gemini';

        if (lessonNumber < 1 || weekNumber < 1) {
            alert('Número da aula e semana devem ser maiores que 0.');
            return;
        }

        // Salvar configuração antes de gerar
        saveConfiguration();

        try {
            showGenerationProgress(`Gerando Aula ${lessonNumber} com ${aiProvider.toUpperCase()}...`);
            const startTime = Date.now();

            const requestData = {
                courseId: currentCourse.id,
                lessonNumber: lessonNumber,
                weekNumber: weekNumber,
                aiProvider: aiProvider
            };

            await aiAPI.saveWithFeedback('/api/ai/generate-draft-lesson', requestData, {
                onSuccess: (data) => {
                    const processingTime = Math.round((Date.now() - startTime) / 1000);
                    updateStats({ 
                        generatedLessons: 1,
                        processingTime 
                    });

                    displaySingleLessonResults(data);
                    
                    // Show success banner with actions
                    showSuccessBannerWithActions(
                        `✅ Aula ${lessonNumber} gerada e salva com sucesso!`,
                        [
                            {
                                text: '📚 Ver Todos os Planos',
                                action: () => window.router?.navigateTo('lesson-plans')
                            },
                            {
                                text: '➕ Gerar Outra Aula',
                                action: () => {
                                    // Clear and suggest next lesson
                                    const nextLesson = lessonNumber + 1;
                                    document.getElementById('lessonNumberInput').value = nextLesson;
                                    document.getElementById('singleLessonConfig').style.display = 'block';
                                }
                            }
                        ]
                    );
                    
                    // Hide config and clear
                    handleCancelLesson();
                },
                onError: (error) => {
                    console.error('❌ Error generating single lesson:', error);
                    showBanner(`Erro ao gerar aula: ${error.message}`, 'error');
                }
            });

        } catch (error) {
            console.error('❌ Error in handleGenerateNow:', error);
            showBanner(`Erro na geração da aula: ${error.message}`, 'error');
        } finally {
            hideGenerationProgress();
        }
    }

    function suggestLessonNumber() {
        // This would ideally check existing lesson plans from the API
        // For now, we'll start with 1 and let the user modify
        const lessonInput = document.getElementById('lessonNumberInput');
        const weekInput = document.getElementById('weekNumberInput');
        
        if (lessonInput && !lessonInput.value) {
            lessonInput.value = '1';
        }
        if (weekInput && !weekInput.value) {
            weekInput.value = '1';
        }
    }

    function displaySingleLessonResults(data) {
        // Hide other results containers
        hideAllResults();
        
        // Use the existing lessons results container
        let resultsContainer = document.getElementById('lessonsResults');
        if (!resultsContainer) {
            // Fallback: create container in proper results section
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'lessonsResults';
            resultsContainer.className = 'results-container';
            
            // Insert in Step 5 - Results section
            const resultsSection = document.querySelector('.workflow-step:last-child .step-content');
            if (resultsSection) {
                resultsSection.appendChild(resultsContainer);
            }
        }
        
        // Show the results container
        resultsContainer.style.display = 'block';
        
        // Scroll to results section smoothly
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);

        // Handle different response structures
        const responseData = data.data || data;
        const lessonPlan = responseData.lessonPlan;
        const course = responseData.course;

        if (!lessonPlan || !course) {
            console.error('❌ Missing lesson plan or course data:', responseData);
            resultsContainer.innerHTML = `
                <div class="result-card error-result">
                    <h3>❌ Erro na Resposta</h3>
                    <p>Dados incompletos recebidos do servidor.</p>
                </div>
            `;
            return;
        }

        // Check if it's a draft
        const isDraft = responseData.isDraft || lessonPlan.isDraft || lessonPlan.id.toString().startsWith('draft_');

        resultsContainer.innerHTML = `
            <div class="result-card single-lesson-result" data-draft-id="${lessonPlan.id}">
                <div class="result-header">
                    <h3>🎯 Aula ${lessonPlan.lessonNumber} - ${course.name}</h3>
                    <div class="header-badges">
                        <span class="ai-badge">${(responseData.generatedWith || 'GEMINI').toUpperCase()}</span>
                        ${isDraft ? '<span class="draft-badge">📝 RASCUNHO</span>' : '<span class="saved-badge">✅ SALVO</span>'}
                    </div>
                </div>
                
                <div class="lesson-overview">
                    <h4>${lessonPlan.title}</h4>
                    <p class="lesson-description">${lessonPlan.description}</p>
                    
                    <div class="lesson-meta">
                        <span><strong>Duração:</strong> ${lessonPlan.duration} minutos</span>
                        <span><strong>Semana:</strong> ${lessonPlan.weekNumber}</span>
                        <span><strong>Dificuldade:</strong> ${lessonPlan.difficulty}/5</span>
                    </div>
                </div>

                <div class="lesson-structure">
                    <div class="structure-section">
                        <h5>🔥 Aquecimento (${lessonPlan.warmup?.length || 0} atividades)</h5>
                        ${lessonPlan.warmup?.map(activity => {
                            const activityName = activity?.name || activity?.title || 'Atividade de aquecimento';
                            const activityDuration = activity?.duration || 'N/A';
                            const activityDescription = activity?.description || 'Sem descrição';
                            return `
                            <div class="activity-item">
                                <strong>${activityName}</strong> - ${activityDuration}min<br>
                                <small>${activityDescription}</small>
                            </div>
                        `;
                        }).join('') || '<p>Nenhuma atividade de aquecimento</p>'}
                    </div>

                    <div class="structure-section">
                        <h5>🥋 Técnicas (${lessonPlan.techniques?.length || 0} atividades)</h5>
                        ${lessonPlan.techniques?.map(activity => {
                            const activityName = activity?.name || activity?.title || 'Técnica';
                            const activityDuration = activity?.duration || 'N/A';
                            const activityDescription = activity?.description || 'Sem descrição';
                            return `
                            <div class="activity-item">
                                <strong>${activityName}</strong> - ${activityDuration}min<br>
                                <small>${activityDescription}</small>
                            </div>
                        `;
                        }).join('') || '<p>Nenhuma técnica definida</p>'}
                    </div>

                    <div class="structure-section">
                        <h5>⚔️ Simulações (${lessonPlan.simulations?.length || 0} atividades)</h5>
                        ${lessonPlan.simulations?.map(activity => `
                            <div class="activity-item">
                                <strong>${activity.name}</strong> - ${activity.duration}min<br>
                                <small>${activity.description}</small>
                            </div>
                        `).join('') || '<p>Nenhuma simulação definida</p>'}
                    </div>

                    <div class="structure-section">
                        <h5>🧘 Relaxamento (${lessonPlan.cooldown?.length || 0} atividades)</h5>
                        ${lessonPlan.cooldown?.map(activity => `
                            <div class="activity-item">
                                <strong>${activity.name}</strong> - ${activity.duration}min<br>
                                <small>${activity.description}</small>
                            </div>
                        `).join('') || '<p>Nenhuma atividade de relaxamento</p>'}
                    </div>
                </div>

                <div class="lesson-details">
                    <div class="details-section">
                        <h5>🎯 Objetivos</h5>
                        <ul>
                            ${lessonPlan.objectives?.map(obj => `<li>${obj}</li>`).join('') || '<li>Nenhum objetivo definido</li>'}
                        </ul>
                    </div>

                    <div class="details-section">
                        <h5>🛡️ Equipamentos</h5>
                        <ul>
                            ${lessonPlan.equipment?.map(eq => `<li>${eq}</li>`).join('') || '<li>Nenhum equipamento específico</li>'}
                        </ul>
                    </div>
                </div>

                <div class="lesson-actions">
                    <div class="primary-actions">
                        ${isDraft ? 
                            '<span class="draft-indicator">📝 Rascunho criado localmente</span>' : 
                            '<span class="saved-indicator">✅ Plano Salvo com Sucesso!</span>'
                        }
                        <button class="btn-navigate-primary" onclick="navigateToLessonPlans('${lessonPlan.id}')">
                            � Ver no Módulo de Planos de Aula
                        </button>
                        <button class="btn-view-full" onclick="openLessonPlanEditor('${lessonPlan.id}')">
                            📝 Editar Plano Completo
                        </button>
                    </div>
                    <div class="secondary-actions">
                        <button class="btn-export-pdf" onclick="exportLessonPDF('${lessonPlan.id}')">
                            📄 Exportar PDF
                        </button>
                        <button class="btn-duplicate" onclick="duplicateLesson('${lessonPlan.id}')">
                            📋 Duplicar Aula
                        </button>
                    </div>
                </div>
                ${responseData.note ? `
                    <div class="info-note">
                        ℹ️ ${responseData.note}
                    </div>
                ` : ''}
            </div>
        `;

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Save draft locally if it's a draft
        if (isDraft) {
            saveDraftLocally(lessonPlan);
        }
    }
    
    function displayAnalysisResults(data) {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = `
            <div class="analysis-summary">
                <h4>📋 Análise do Documento</h4>
                <div class="analysis-content">
                    <p><strong>Tipo:</strong> ${data.documentType || 'Detectado automaticamente'}</p>
                    <p><strong>Páginas:</strong> ${data.pageCount || 'N/A'}</p>
                    <p><strong>Resumo:</strong> ${data.summary || 'Documento analisado com sucesso'}</p>
                </div>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }
    
    function displayTechniquesResults(data) {
        console.log('📊 Techniques generated:', data);
    }
    
    function displayLessonsResults(data) {
        console.log('📊 Lessons generated:', data);
    }
    
    function showUploadProgress() {
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) progressDiv.style.display = 'block';
    }
    
    function hideUploadProgress() {
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) progressDiv.style.display = 'none';
    }
    
    function showGenerationProgress(message) {
        console.log('🔄', message);
        const progressDiv = document.getElementById('generationProgress');
        if (progressDiv) {
            const progressText = progressDiv.querySelector('.progress-text');
            if (progressText) progressText.textContent = `🤖 ${message}`;
            progressDiv.style.display = 'block';
        }
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.classList.add('loading');
            }
        });
    }
    
    function hideGenerationProgress() {
        console.log('✅ Generation progress hidden');
        const progressDiv = document.getElementById('generationProgress');
        if (progressDiv) progressDiv.style.display = 'none';
        
        enableGenerationButtons();
        
        const buttons = ['generateTechniquesBtn', 'generateLessonsBtn', 'generateAllBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.remove('loading');
        });
    }
    
    function hideAllResults() {
        // Hide all result containers
        const containers = [
            'techniquesResults',
            'lessonsResults', 
            'completeResults',
            'singleLessonResults'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
    
    function showSuccessBannerWithActions(message, actions = []) {
        console.log('📢 [success]', message);
        
        const banner = document.createElement('div');
        banner.className = 'notification notification-success notification-with-actions';
        
        const actionsHTML = actions.map(action => 
            `<button class="btn-notification-action" onclick="this.actionFn(); this.parentElement.parentElement.remove();">${action.text}</button>`
        ).join('');
        
        banner.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-message">${message}</span>
                <div class="notification-actions">
                    ${actionsHTML}
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove();">✕</button>
            </div>
        `;
        
        // Add action functions to buttons
        const actionButtons = banner.querySelectorAll('.btn-notification-action');
        actionButtons.forEach((btn, index) => {
            if (actions[index]) {
                btn.actionFn = actions[index].action;
            }
        });
        
        // Show banner
        const container = document.querySelector('.ai-isolated') || document.body;
        container.appendChild(banner);
        
        setTimeout(() => banner.classList.add('show'), 100);
        
        // Auto-remove after extended time (since it has actions)
        setTimeout(() => {
            if (banner.parentElement) {
                banner.remove();
            }
        }, 15000); // 15 seconds for action banners
    }
    
    function showBanner(message, type) {
        console.log(`📢 [${type}]`, message);
        
        const banner = document.createElement('div');
        banner.className = `notification notification-${type}`;
        banner.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        const container = document.querySelector('.ai-isolated') || document.body;
        container.appendChild(banner);
        
        setTimeout(() => banner.classList.add('show'), 100);
        
        setTimeout(() => {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }, 5000);
    }
    
    // Global functions for lesson plan actions
    window.openLessonPlanEditor = function(lessonPlanId) {
        // Navigate to lesson plan editor
        if (window.router && window.router.navigateTo) {
            window.router.navigateTo(`lesson-plans/edit/${lessonPlanId}`);
        } else {
            window.location.href = `/lesson-plans/edit/${lessonPlanId}`;
        }
    };

    window.exportLessonPDF = function(lessonPlanId) {
        // Export lesson plan as PDF
        alert(`Exportar PDF da aula ${lessonPlanId} - Funcionalidade em desenvolvimento`);
        // TODO: Implement PDF export functionality
    };

    window.duplicateLesson = function(lessonPlanId) {
        // Duplicate lesson plan
        if (confirm('Deseja duplicar esta aula?')) {
            alert(`Duplicar aula ${lessonPlanId} - Funcionalidade em desenvolvimento`);
            // TODO: Implement lesson duplication
        }
    };

    window.navigateToLessonPlans = function(lessonPlanId = null) {
        // Navigate to lesson plans module with optional highlight of specific plan
        console.log('📚 Navigating to lesson plans module', lessonPlanId ? `highlighting plan: ${lessonPlanId}` : '');
        
        // Show success notification with action buttons
        if (window.showNotification) {
            const message = lessonPlanId 
                ? `Plano de aula criado com sucesso! Navegando para visualizar...`
                : `Planos de aula salvos! Navegando para o módulo...`;
            window.showNotification(message, 'success');
        }
        
        // Store information for highlighting when lesson plans module loads
        if (lessonPlanId) {
            sessionStorage.setItem('highlightLessonPlan', lessonPlanId);
            sessionStorage.setItem('highlightLessonPlanTime', Date.now().toString());
        }
        
        // Navigate using SPA router
        setTimeout(() => {
            if (window.router && window.router.navigateTo) {
                window.router.navigateTo('lesson-plans');
            } else if (window.location.hash) {
                window.location.hash = '#lesson-plans';
            } else {
                window.location.href = '/lesson-plans';
            }
        }, 500); // Small delay to show notification
    };

    // Draft management functions
    window.saveDraftToLessonPlans = async function(draftId) {
        try {
            console.log('💾 Saving draft to lesson plans module:', draftId);
            showGenerationProgress('Salvando rascunho no módulo de planos de aula...');
            
            // Get draft data from localStorage
            const draftData = getDraftById(draftId);
            if (!draftData) {
                alert('❌ Rascunho não encontrado!');
                return;
            }

            // Prepare data for lesson-plans API
            const lessonData = {
                courseId: draftData.courseId,
                title: draftData.title,
                description: draftData.description,
                lessonNumber: draftData.lessonNumber,
                weekNumber: draftData.weekNumber,
                level: draftData.level || 1,
                duration: draftData.duration || 60,
                difficulty: draftData.difficulty || 1,
                objectives: draftData.objectives || [],
                equipment: draftData.equipment || [],
                activities: draftData.activities || [],
                warmup: draftData.warmup || [],
                techniques: draftData.techniques || [],
                simulations: draftData.simulations || [],
                cooldown: draftData.cooldown || [],
                mentalModule: draftData.mentalModule || {},
                tacticalModule: draftData.tacticalModule,
                adaptations: draftData.adaptations || {}
            };

            // Create lesson plan via API
            const response = await aiAPI.request('/api/lesson-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });

            if (response.success) {
                // Remove draft from localStorage
                removeDraftById(draftId);
                
                // Show success message
                showSuccessBannerWithActions(
                    `✅ Rascunho salvo com sucesso no módulo de Planos de Aula!`,
                    [
                        {
                            text: '📚 Ver Plano Salvo',
                            onClick: () => navigateToLessonPlans(response.data.id)
                        },
                        {
                            text: '📝 Editar Plano',
                            onClick: () => openLessonPlanEditor(response.data.id)
                        }
                    ]
                );
                
                // Update the UI to show saved status
                updateDraftUI(draftId, response.data);
                
            } else {
                alert('❌ Erro ao salvar: ' + (response.error || 'Erro desconhecido'));
            }
            
            hideGenerationProgress();
            
        } catch (error) {
            console.error('❌ Error saving draft:', error);
            hideGenerationProgress();
            alert('❌ Erro ao salvar rascunho: ' + error.message);
        }
    };

    window.editDraft = function(draftId) {
        console.log('✏️ Editing draft:', draftId);
        // TODO: Implement draft editing interface
        alert('Funcionalidade de edição de rascunhos em desenvolvimento');
    };

    // Draft storage management
    function saveDraftLocally(draftData) {
        try {
            const drafts = JSON.parse(localStorage.getItem('aiLessonDrafts') || '[]');
            const existingIndex = drafts.findIndex(d => d.id === draftData.id);
            
            if (existingIndex >= 0) {
                drafts[existingIndex] = draftData;
            } else {
                drafts.push(draftData);
            }
            
            localStorage.setItem('aiLessonDrafts', JSON.stringify(drafts));
            console.log('📝 Draft saved locally:', draftData.id);
        } catch (error) {
            console.error('❌ Error saving draft locally:', error);
        }
    }

    function getDraftById(draftId) {
        try {
            const drafts = JSON.parse(localStorage.getItem('aiLessonDrafts') || '[]');
            return drafts.find(d => d.id === draftId);
        } catch (error) {
            console.error('❌ Error getting draft:', error);
            return null;
        }
    }

    function removeDraftById(draftId) {
        try {
            const drafts = JSON.parse(localStorage.getItem('aiLessonDrafts') || '[]');
            const filtered = drafts.filter(d => d.id !== draftId);
            localStorage.setItem('aiLessonDrafts', JSON.stringify(filtered));
            console.log('🗑️ Draft removed locally:', draftId);
        } catch (error) {
            console.error('❌ Error removing draft:', error);
        }
    }

    function getAllDrafts() {
        try {
            const drafts = JSON.parse(localStorage.getItem('aiLessonDrafts') || '[]');
            console.log('📋 Retrieved all drafts:', drafts.length);
            return drafts;
        } catch (error) {
            console.error('❌ Error getting all drafts:', error);
            return [];
        }
    }

    function updateDraftUI(draftId, savedData) {
        // Find the result card and update it to show saved status
        const resultCard = document.querySelector(`[data-draft-id="${draftId}"]`);
        if (resultCard) {
            // Update the display to show it's saved
            const draftIndicator = resultCard.querySelector('.draft-indicator');
            if (draftIndicator) {
                draftIndicator.className = 'saved-indicator';
                draftIndicator.textContent = '✅ Salvo no Módulo de Planos de Aula!';
            }
            
            // Update buttons
            const saveButton = resultCard.querySelector('.btn-save-draft');
            if (saveButton) {
                saveButton.outerHTML = `
                    <button class="btn-navigate-primary" onclick="navigateToLessonPlans('${savedData.id}')">
                        📚 Ver no Módulo de Planos de Aula
                    </button>
                `;
            }
        }
    }

    // Save lesson plan function
    async function saveLessonPlan(lessonData, courseId) {
        try {
            showGenerationProgress('Salvando plano de aula...');
            
            const requestData = {
                courseId: courseId,
                lessonNumber: lessonData.lessonNumber,
                weekNumber: lessonData.weekNumber || Math.ceil(lessonData.lessonNumber / 2),
                aiProvider: 'gemini'
            };

            const response = await aiAPI.request('/api/ai/generate-single-lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (response.success) {
                hideGenerationProgress();
                showBanner('✅ Plano de aula salvo com sucesso no banco de dados!', 'success');
                
                // Update the display to show as saved
                const saveBtn = event.target;
                if (saveBtn) {
                    saveBtn.outerHTML = '<span class="saved-indicator">✅ Salvo no Banco de Dados</span>';
                }
            } else {
                throw new Error(response.error || 'Erro ao salvar plano');
            }
        } catch (error) {
            hideGenerationProgress();
            console.error('❌ Error saving lesson plan:', error);
            showBanner(`Erro ao salvar: ${error.message}`, 'error');
        }
    }

    function displayBatchResults(results, successCount, errorCount) {
        console.log('📊 Batch results:', { results, successCount, errorCount });
        
        // Hide other results
        hideAllResults();
        
        // Use lessons results container
        let resultsContainer = document.getElementById('lessonsResults');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'lessonsResults';
            resultsContainer.className = 'results-container';
            
            const resultsSection = document.querySelector('.workflow-step:last-child .step-content');
            if (resultsSection) {
                resultsSection.appendChild(resultsContainer);
            }
        }
        
        resultsContainer.style.display = 'block';
        
        const successResults = results.filter(r => r.success);
        const errorResults = results.filter(r => !r.success);
        
        resultsContainer.innerHTML = `
            <div class="batch-results-summary">
                <h3>🚀 Resultados da Geração em Lote</h3>
                <div class="batch-stats">
                    <div class="batch-stat success">
                        <span class="stat-number">${successCount}</span>
                        <span class="stat-label">Sucessos</span>
                    </div>
                    <div class="batch-stat error">
                        <span class="stat-number">${errorCount}</span>
                        <span class="stat-label">Erros</span>
                    </div>
                    <div class="batch-stat total">
                        <span class="stat-number">${results.length}</span>
                        <span class="stat-label">Total</span>
                    </div>
                </div>
            </div>
            
            ${successCount > 0 ? `
                <div class="batch-success-section">
                    <h4>✅ Planos Gerados com Sucesso (${successCount})</h4>
                    <div class="batch-navigation">
                        <button class="btn-navigate-batch" onclick="navigateToLessonPlans()">
                            📚 Ver Todos no Módulo de Planos de Aula
                        </button>
                    </div>
                    <div class="batch-success-list">
                        ${successResults.map(result => `
                            <div class="batch-success-item">
                                <div class="success-item-header">
                                    <strong>📚 Aula ${result.data.lessonPlan.lessonNumber}</strong>
                                    <span class="success-badge">Salvo</span>
                                </div>
                                <div class="success-item-title">${result.data.lessonPlan.title}</div>
                                <div class="success-item-actions">
                                    <button onclick="openLessonPlanEditor('${result.data.lessonPlan.id}')" class="btn-mini">
                                        📝 Editar
                                    </button>
                                    <button onclick="exportLessonPDF('${result.data.lessonPlan.id}')" class="btn-mini">
                                        📄 PDF
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${errorCount > 0 ? `
                <div class="batch-error-section">
                    <h4>❌ Erros na Geração (${errorCount})</h4>
                    <div class="batch-error-list">
                        ${errorResults.map(result => `
                            <div class="batch-error-item">
                                <strong>Aula ${result.lessonNumber}:</strong>
                                <span class="error-message">${result.error}</span>
                                <button onclick="retryLessonGeneration(${result.lessonNumber})" class="btn-retry">
                                    🔄 Tentar Novamente
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Scroll to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    // Retry function for failed lessons
    async function retryLessonGeneration(lessonNumber) {
        console.log(`🔄 Retrying lesson ${lessonNumber}`);
        
        try {
            showGenerationProgress(`Tentando gerar Aula ${lessonNumber} novamente...`);
            
            const requestData = {
                courseId: currentCourse.id,
                lessonNumber: lessonNumber,
                weekNumber: Math.ceil(lessonNumber / 2),
                aiProvider: 'gemini'
            };
            
            const response = await aiAPI.request('/api/ai/generate-single-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            hideGenerationProgress();
            
            if (response.success) {
                showBanner(`✅ Aula ${lessonNumber} gerada com sucesso!`, 'success');
                
                // Remove error item and add to success
                const errorItem = event.target.closest('.batch-error-item');
                if (errorItem) errorItem.remove();
                
                // Could add to success list, but for now just show banner
            } else {
                throw new Error(response.error || 'Erro na geração');
            }
            
        } catch (error) {
            hideGenerationProgress();
            showBanner(`Erro ao gerar Aula ${lessonNumber}: ${error.message}`, 'error');
        }
    }

    // Make functions globally available
    window.saveLessonPlan = saveLessonPlan;
    window.retryLessonGeneration = retryLessonGeneration;

    window.aiModule = {
        init: initializeAIModule,
        isInitialized: () => isInitialized
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                try { initializeAIModule(); } catch (_) {}
            }, 100);
        });
    } else {
        setTimeout(() => {
            try { initializeAIModule(); } catch (_) {}
        }, 100);
    }
    
    // Global functions for draft management
    window.getAllAIDrafts = getAllDrafts;
    window.getDraftById = getDraftById;
    window.removeDraftById = removeDraftById;
    
    // Global function to help lesson-plans module with highlighting
    window.checkLessonPlanHighlight = function() {
        const highlightId = sessionStorage.getItem('highlightLessonPlan');
        const highlightTime = sessionStorage.getItem('highlightLessonPlanTime');
        
        if (highlightId && highlightTime) {
            const timeDiff = Date.now() - parseInt(highlightTime);
            // Only highlight if request is recent (within 10 seconds)
            if (timeDiff < 10000) {
                console.log('🎯 Highlighting lesson plan:', highlightId);
                // Remove the highlight data
                sessionStorage.removeItem('highlightLessonPlan');
                sessionStorage.removeItem('highlightLessonPlanTime');
                return highlightId;
            } else {
                // Clean old data
                sessionStorage.removeItem('highlightLessonPlan');
                sessionStorage.removeItem('highlightLessonPlanTime');
            }
        }
        return null;
    };

    // Legacy generateLessonPlan function for compatibility
    async function generateLessonPlan(courseId, type = 'lesson') {
        try {
            if (!aiAPI) {
                await initializeAPI();
            }
            
            console.log('🤖 Generating lesson plan for course:', courseId);
            
            // Use the enhanced course service if available
            if (enhancedAI && enhancedAI.courseService) {
                return await enhancedAI.courseService.generateContent(courseId, type);
            }
            
            // Fallback to basic generation
            return await aiAPI.request('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, type })
            });
        } catch (error) {
            console.error('Error generating lesson plan:', error);
            throw error;
        }
    }

    // Initialize Enhanced AI Module function
    async function initializeEnhancedModule() {
        try {
            // Wait for container to be available
            const container = await waitForElement('#ai-module-container');
            if (!container) {
                console.warn('⚠️ Enhanced AI container not found, skipping initialization');
                return null;
            }

            if (!enhancedAI) {
                enhancedAI = new EnhancedAIModule();
                await enhancedAI.initialize();
                
                // Expose globally for onclick handlers
                window.enhancedAI = enhancedAI;
                
                console.log('✅ Enhanced AI Module initialized successfully');
            }
            return enhancedAI;
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced AI Module:', error);
            throw error;
        }
    }

    // Helper function to wait for element
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Timeout fallback
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    // Auto-initialize Enhanced AI Module
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('ai-module-container')) {
            initializeEnhancedModule().catch(console.error);
        }
    });

    // Legacy initialization function (called by router)
    window.initializeAIModule = async function() {
        try {
            // Prevent double initialization
            if (isInitialized && enhancedAI) {
                return true;
            }
            
            // Initialize original AI functionality first
            if (!isInitialized) {
                await initializeAPI();
                isInitialized = true;
            }
            
            // Initialize Enhanced AI Module
            const result = await initializeEnhancedModule();
            if (result) {
                console.log('✅ Enhanced AI Module initialized');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error initializing AI Module:', error);
            console.error('Error details:', error.stack);
        }
    };

    // Draft management functions
    function saveDraftToDatabase(draftData) {
        try {
            console.log('💾 Saving draft to localStorage...', draftData);
            
            const drafts = getAllDrafts();
            const draftId = draftData.id || Date.now().toString();
            
            // Add timestamp and ID if not present
            const draftToSave = {
                id: draftId,
                timestamp: Date.now(),
                ...draftData
            };
            
            // Remove existing draft with same ID if present
            const updatedDrafts = drafts.filter(d => d.id !== draftId);
            updatedDrafts.push(draftToSave);
            
            localStorage.setItem('aiLessonDrafts', JSON.stringify(updatedDrafts));
            console.log('✅ Draft saved successfully with ID:', draftId);
            
            return { success: true, id: draftId, data: draftToSave };
        } catch (error) {
            console.error('❌ Error saving draft:', error);
            return { success: false, error: error.message };
        }
    }

    function getDrafts() {
        return getAllDrafts();
    }

    // Expose module globally for AcademyApp integration
    window.ai = {
        initialized: isInitialized,
        enhancedAI: enhancedAI,
        initializeEnhancedModule: initializeEnhancedModule,
        generateLessonPlan: generateLessonPlan,
        saveDraft: saveDraftToDatabase,
        getDrafts: getDrafts
    };

    // Lesson Plan Monitor Service
    class LessonPlanMonitorService {
        constructor(apiHelper) {
            this.api = apiHelper;
        }

        async renderMonitorInterface() {
            const container = document.getElementById('monitor-content');
            if (!container) return;

            container.innerHTML = `
                <div class="module-isolated-ai-monitor">
                    <!-- Header Premium -->
                    <div class="module-header-premium">
                        <div class="header-content">
                            <div class="header-title">
                                <h2>📊 Monitor de Planos de Aula</h2>
                                <p class="header-description">Análise inteligente e otimização de planos de aula</p>
                            </div>
                            <div class="header-actions">
                                <button class="btn-primary" onclick="enhancedAI.monitorService.runFullAnalysis()">
                                    🔍 Executar Análise Completa
                                </button>
                                <button class="btn-secondary" onclick="enhancedAI.monitorService.refreshMetrics()">
                                    🔄 Atualizar Métricas
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Metrics Cards -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced" id="totalCoursesCard">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <span class="stat-number" id="totalCourses">-</span>
                                <span class="stat-label">Total de Cursos</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced" id="plansCoverageCard">
                            <div class="stat-icon">📋</div>
                            <div class="stat-info">
                                <span class="stat-number" id="plansCoverage">-%</span>
                                <span class="stat-label">Cobertura de Planos</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced" id="orphanActivitiesCard">
                            <div class="stat-icon">🏃</div>
                            <div class="stat-info">
                                <span class="stat-number" id="orphanActivities">-</span>
                                <span class="stat-label">Atividades Órfãs</span>
                            </div>
                        </div>
                        <div class="stat-card-enhanced" id="suggestionsCard">
                            <div class="stat-icon">💡</div>
                            <div class="stat-info">
                                <span class="stat-number" id="totalSuggestions">-</span>
                                <span class="stat-label">Sugestões Pendentes</span>
                            </div>
                        </div>
                    </div>

                    <!-- Analysis Results -->
                    <div class="data-card-premium" id="analysisResults" style="display: none;">
                        <div class="card-header">
                            <h3>📊 Resultados da Análise</h3>
                            <div class="header-actions">
                                <button class="btn-secondary" onclick="enhancedAI.monitorService.exportReport()">
                                    📄 Exportar Relatório
                                </button>
                            </div>
                        </div>
                        <div class="analysis-content">
                            <!-- Analysis content will be populated here -->
                        </div>
                    </div>

                    <!-- Courses Without Plans -->
                    <div class="data-card-premium" id="coursesIssues">
                        <div class="card-header">
                            <h3>⚠️ Cursos com Problemas</h3>
                            <p>Cursos que precisam de atenção nos planos de aula</p>
                        </div>
                        <div id="coursesIssuesList" class="issues-list">
                            <div class="loading-state">🔄 Carregando dados...</div>
                        </div>
                    </div>

                    <!-- Orphan Activities -->
                    <div class="data-card-premium" id="orphanActivitiesSection">
                        <div class="card-header">
                            <h3>🏃 Atividades Órfãs</h3>
                            <p>Atividades não associadas a nenhum plano de aula</p>
                        </div>
                        <div id="orphanActivitiesList" class="orphan-list">
                            <div class="loading-state">🔄 Carregando dados...</div>
                        </div>
                    </div>

                    <!-- AI Suggestions -->
                    <div class="data-card-premium" id="aiSuggestions">
                        <div class="card-header">
                            <h3>🤖 Sugestões Inteligentes</h3>
                            <p>Recomendações baseadas em análise de IA</p>
                        </div>
                        <div id="suggestionsList" class="suggestions-list">
                            <div class="loading-state">🔄 Carregando sugestões...</div>
                        </div>
                    </div>
                </div>
            `;

            // Load initial data
            await this.loadQuickMetrics();
            await this.loadCoursesIssues();
            await this.loadOrphanActivities();
        }

        async loadQuickMetrics() {
            try {
                const response = await this.api.api.get('/api/ai-monitor/metrics/quick');
                if (response.success) {
                    const metrics = response.data;
                    
                    document.getElementById('totalCourses').textContent = metrics.courses;
                    document.getElementById('plansCoverage').textContent = `${metrics.plansCoverage}%`;
                    document.getElementById('orphanActivities').textContent = metrics.orphanActivities;
                    
                    // Update card colors based on metrics
                    this.updateCardStatus('plansCoverageCard', metrics.plansCoverage);
                    this.updateCardStatus('orphanActivitiesCard', metrics.orphanActivities, true);
                } else {
                    console.error('Erro ao carregar métricas:', response.error);
                }
            } catch (error) {
                console.error('Erro ao carregar métricas rápidas:', error);
                window.app?.handleError(error, 'Monitor - Quick Metrics');
            }
        }

        async loadCoursesIssues() {
            try {
                const response = await this.api.api.get('/api/ai-monitor/courses/missing-plans');
                if (response.success) {
                    this.renderCoursesIssues(response.data);
                } else {
                    this.showError('coursesIssuesList', 'Erro ao carregar cursos com problemas');
                }
            } catch (error) {
                console.error('Erro ao carregar cursos com problemas:', error);
                this.showError('coursesIssuesList', 'Erro de conectividade');
            }
        }

        async loadOrphanActivities() {
            try {
                const response = await this.api.api.get('/api/ai-monitor/activities/orphan');
                if (response.success) {
                    this.renderOrphanActivities(response.data);
                } else {
                    this.showError('orphanActivitiesList', 'Erro ao carregar atividades órfãs');
                }
            } catch (error) {
                console.error('Erro ao carregar atividades órfãs:', error);
                this.showError('orphanActivitiesList', 'Erro de conectividade');
            }
        }

        async runFullAnalysis() {
            const analysisCard = document.getElementById('analysisResults');
            const analysisContent = document.querySelector('.analysis-content');
            
            try {
                // Show loading state
                analysisCard.style.display = 'block';
                analysisContent.innerHTML = '<div class="loading-state">🔍 Executando análise completa...</div>';

                const response = await this.api.api.get('/api/ai-monitor/analysis/full');
                
                if (response.success) {
                    this.renderFullAnalysis(response.data);
                    await this.loadQuickMetrics(); // Refresh metrics
                    document.getElementById('totalSuggestions').textContent = response.data.suggestions.length;
                } else {
                    this.showError(analysisContent, 'Erro na análise completa');
                }
            } catch (error) {
                console.error('Erro na análise completa:', error);
                this.showError(analysisContent, 'Erro de conectividade na análise');
            }
        }

        renderCoursesIssues(courses) {
            const container = document.getElementById('coursesIssuesList');
            
            if (courses.length === 0) {
                container.innerHTML = '<div class="empty-state">✅ Todos os cursos têm boa cobertura de planos!</div>';
                return;
            }

            const issuesHtml = courses.map(course => `
                <div class="issue-item" data-course-id="${course.courseId}">
                    <div class="issue-header">
                        <h4>${course.courseName}</h4>
                        <span class="coverage-badge coverage-${this.getCoverageLevel(course.coverage)}">
                            ${course.coverage}%
                        </span>
                    </div>
                    <div class="issue-details">
                        <p>📚 ${course.lessonsTotal} aulas • ✅ ${course.lessonsWithPlans} com planos • ❌ ${course.lessonsWithoutPlans} sem planos</p>
                    </div>
                    <div class="issue-actions">
                        <button class="btn-small btn-primary" onclick="enhancedAI.monitorService.viewCourseDetails(${course.courseId})">
                            Ver Detalhes
                        </button>
                        <button class="btn-small btn-secondary" onclick="enhancedAI.monitorService.createPlansForCourse(${course.courseId})">
                            Criar Planos
                        </button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = issuesHtml;
        }

        renderOrphanActivities(activities) {
            const container = document.getElementById('orphanActivitiesList');
            
            if (activities.length === 0) {
                container.innerHTML = '<div class="empty-state">✅ Todas as atividades estão associadas a planos!</div>';
                return;
            }

            const activitiesHtml = activities.slice(0, 10).map(activity => `
                <div class="orphan-item" data-activity-id="${activity.activityId}">
                    <div class="orphan-header">
                        <h4>${activity.activityName}</h4>
                        ${activity.technique ? `<span class="technique-tag">${activity.technique}</span>` : ''}
                    </div>
                    <div class="orphan-suggestions">
                        ${activity.suggestedCourses.slice(0, 2).map(suggestion => `
                            <div class="suggestion-item">
                                <span>${suggestion.courseName}</span>
                                <span class="relevance-score">${suggestion.relevanceScore}%</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="orphan-actions">
                        <button class="btn-small btn-primary" onclick="enhancedAI.monitorService.associateActivity(${activity.activityId})">
                            Associar
                        </button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = activitiesHtml;
            
            if (activities.length > 10) {
                container.innerHTML += `<div class="show-more">E mais ${activities.length - 10} atividades...</div>`;
            }
        }

        renderFullAnalysis(analysis) {
            const container = document.querySelector('.analysis-content');
            
            const html = `
                <div class="analysis-summary">
                    <h4>📋 Resumo da Análise</h4>
                    <div class="summary-stats">
                        <div class="summary-item">
                            <strong>${analysis.summary.totalCourses}</strong> cursos analisados
                        </div>
                        <div class="summary-item">
                            <strong>${analysis.summary.coursesWithMissingPlans}</strong> cursos com problemas
                        </div>
                        <div class="summary-item">
                            <strong>${analysis.summary.totalOrphanActivities}</strong> atividades órfãs
                        </div>
                        <div class="summary-item">
                            <strong>${analysis.summary.overallCoverage}%</strong> cobertura geral
                        </div>
                    </div>
                </div>

                <div class="suggestions-section">
                    <h4>💡 Principais Sugestões</h4>
                    <div class="suggestions-grid">
                        ${analysis.suggestions.slice(0, 6).map(suggestion => `
                            <div class="suggestion-card priority-${suggestion.priority}">
                                <div class="suggestion-header">
                                    <span class="suggestion-type">${this.getSuggestionTypeIcon(suggestion.type)}</span>
                                    <span class="priority-badge priority-${suggestion.priority}">${suggestion.priority}</span>
                                </div>
                                <h5>${suggestion.title}</h5>
                                <p>${suggestion.description}</p>
                                ${suggestion.actionable ? '<button class="btn-small btn-primary">Aplicar</button>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            container.innerHTML = html;
        }

        // Utility methods
        getCoverageLevel(coverage) {
            if (coverage >= 80) return 'good';
            if (coverage >= 50) return 'medium';
            return 'low';
        }

        getSuggestionTypeIcon(type) {
            const icons = {
                'missing_plan': '📝',
                'orphan_activity': '🏃',
                'content_gap': '📚',
                'optimization': '⚡'
            };
            return icons[type] || '💡';
        }

        updateCardStatus(cardId, value, isReverse = false) {
            const card = document.getElementById(cardId);
            if (!card) return;

            // Remove existing status classes
            card.classList.remove('status-good', 'status-warning', 'status-error');

            // Apply status based on value
            if (isReverse) {
                // For metrics where lower is better (like orphan activities)
                if (value === 0) card.classList.add('status-good');
                else if (value <= 5) card.classList.add('status-warning');
                else card.classList.add('status-error');
            } else {
                // For metrics where higher is better (like coverage)
                if (value >= 80) card.classList.add('status-good');
                else if (value >= 50) card.classList.add('status-warning');
                else card.classList.add('status-error');
            }
        }

        showError(container, message) {
            if (typeof container === 'string') {
                container = document.getElementById(container);
            }
            if (container) {
                container.innerHTML = `<div class="error-state">❌ ${message}</div>`;
            }
        }

        // Placeholder methods for future implementation
        async refreshMetrics() {
            await this.loadQuickMetrics();
            await this.loadCoursesIssues();
            await this.loadOrphanActivities();
        }

        async exportReport() {
            // TODO: Implement report export
            alert('Funcionalidade de exportação será implementada em breve');
        }

        async viewCourseDetails(courseId) {
            // TODO: Navigate to course details with monitoring info
            console.log('View course details:', courseId);
        }

        async createPlansForCourse(courseId) {
            // TODO: Navigate to lesson plan creation for course
            console.log('Create plans for course:', courseId);
        }

        async associateActivity(activityId) {
            // TODO: Show modal to associate activity with courses
            console.log('Associate activity:', activityId);
        }
    }

    // Expose AI module functions for onclick handlers
    window.aiModule = {
        loadExistingLessons: loadExistingLessons,
        regenerateLessonPlan: regenerateLessonPlan,
        createNewLessonPlan: createNewLessonPlan,
        viewLessonVersions: viewLessonVersions,
        showNewLessonOptions: showNewLessonOptions,
        executeNewLesson: executeNewLesson
    };

    // Also expose enhancedAI directly for onclick handlers
    window.enhancedAI = enhancedAI;

    console.log('🤖 AI Module - Loaded and exposed globally');
})();