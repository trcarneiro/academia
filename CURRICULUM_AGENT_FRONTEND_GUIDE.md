# 🎨 Frontend Integration Guide - Curriculum Agent

## 📋 Como Integrar o Agente Educador no Frontend

Este guia mostra como criar uma interface web para interagir com o Curriculum Agent.

---

## 🏗️ Estrutura Proposta

```
/public/js/modules/curriculum-agent/
├── index.js                    # Entry point do módulo
├── views/
│   ├── course-analysis.js      # View de análise de cursos
│   ├── lesson-creator.js       # View de criação de aulas
│   └── lesson-evaluator.js     # View de avaliação de aulas
└── components/
    ├── ai-chat.js              # Componente de chat com IA
    └── metrics-dashboard.js    # Dashboard de métricas

/public/css/modules/
└── curriculum-agent.css        # Estilos isolados

/public/views/
└── curriculum-agent.html       # Página HTML
```

---

## 📄 1. HTML Base

**Arquivo**: `/public/views/curriculum-agent.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professor Virtual - Curriculum Agent</title>
    <link rel="stylesheet" href="/css/modules/curriculum-agent.css">
</head>
<body>
    <div id="curriculum-agent-container" class="module-container">
        <!-- Header -->
        <div class="module-header-premium">
            <nav class="breadcrumb">
                <a href="#home">Home</a> > 
                <a href="#ai-agents">AI Agents</a> > 
                <span>Professor Virtual</span>
            </nav>
            <h1>🥋 Professor Virtual de Artes Marciais</h1>
            <p class="subtitle">Especialista em Krav Maga e Jiu Jitsu</p>
        </div>

        <!-- Tabs -->
        <div class="tabs-premium">
            <button class="tab-btn active" data-tab="analyze">📊 Analisar Curso</button>
            <button class="tab-btn" data-tab="create">✍️ Criar Aula</button>
            <button class="tab-btn" data-tab="evaluate">🎯 Avaliar Aula</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content active" id="tab-analyze">
            <!-- Análise de Curso -->
        </div>

        <div class="tab-content" id="tab-create">
            <!-- Criação de Aula -->
        </div>

        <div class="tab-content" id="tab-evaluate">
            <!-- Avaliação de Aula -->
        </div>
    </div>

    <script type="module" src="/js/modules/curriculum-agent/index.js"></script>
</body>
</html>
```

---

## 🎨 2. CSS Premium

**Arquivo**: `/public/css/modules/curriculum-agent.css`

```css
/* Curriculum Agent Module Styles */

.module-isolated-curriculum-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.module-isolated-curriculum-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.module-isolated-curriculum-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e0e0e0;
}

.module-isolated-curriculum-tab-btn {
    padding: 1rem 2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    color: #666;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
}

.module-isolated-curriculum-tab-btn:hover {
    color: #667eea;
    border-bottom-color: #667eea;
}

.module-isolated-curriculum-tab-btn.active {
    color: #667eea;
    border-bottom-color: #667eea;
}

/* AI Chat Component */
.module-isolated-curriculum-chat-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 1.5rem;
    max-height: 600px;
    display: flex;
    flex-direction: column;
}

.module-isolated-curriculum-chat-messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
}

.module-isolated-curriculum-message {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    max-width: 80%;
}

.module-isolated-curriculum-message.user {
    background: #667eea;
    color: white;
    margin-left: auto;
}

.module-isolated-curriculum-message.assistant {
    background: white;
    border: 1px solid #e0e0e0;
}

.module-isolated-curriculum-message.assistant pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
}

.module-isolated-curriculum-chat-input {
    display: flex;
    gap: 1rem;
}

.module-isolated-curriculum-chat-input textarea {
    flex: 1;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
}

.module-isolated-curriculum-chat-input button {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s;
}

.module-isolated-curriculum-chat-input button:hover {
    transform: translateY(-2px);
}

.module-isolated-curriculum-chat-input button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Metrics Dashboard */
.module-isolated-curriculum-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.module-isolated-curriculum-metric-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-left: 4px solid #667eea;
}

.module-isolated-curriculum-metric-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
    text-transform: uppercase;
}

.module-isolated-curriculum-metric-card .value {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
}

.module-isolated-curriculum-metric-card .trend {
    font-size: 0.9rem;
    color: #28a745;
}

.module-isolated-curriculum-metric-card .trend.down {
    color: #dc3545;
}

/* Loading State */
.module-isolated-curriculum-loading {
    text-align: center;
    padding: 3rem;
}

.module-isolated-curriculum-loading .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
    .module-isolated-curriculum-tabs {
        flex-direction: column;
    }

    .module-isolated-curriculum-message {
        max-width: 95%;
    }

    .module-isolated-curriculum-metrics {
        grid-template-columns: 1fr;
    }
}
```

---

## 🔧 3. JavaScript Module (Single-file Pattern)

**Arquivo**: `/public/js/modules/curriculum-agent/index.js`

```javascript
// Prevent re-declaration
if (typeof window.CurriculumAgentModule !== 'undefined') {
    console.log('Curriculum Agent Module already loaded');
} else {

const CurriculumAgentModule = {
    container: null,
    moduleAPI: null,
    currentTab: 'analyze',
    
    // Initialize module
    async init() {
        console.log('🥋 Initializing Curriculum Agent Module...');
        
        this.container = document.getElementById('curriculum-agent-container');
        if (!this.container) {
            console.error('Container not found for Curriculum Agent');
            return;
        }

        await this.initializeAPI();
        this.setupTabs();
        this.loadAnalyzeTab();
        
        // Register globally
        window.curriculumAgentModule = this;
        window.app?.dispatchEvent('module:loaded', { name: 'curriculumAgent' });
    },
    
    // Setup API client
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('CurriculumAgent');
    },
    
    // Setup tab navigation
    setupTabs() {
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    },
    
    // Switch between tabs
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update buttons
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        // Load tab content
        if (tabName === 'analyze') this.loadAnalyzeTab();
        if (tabName === 'create') this.loadCreateTab();
        if (tabName === 'evaluate') this.loadEvaluateTab();
    },
    
    // TAB 1: Analyze Course
    async loadAnalyzeTab() {
        const tabContent = document.getElementById('tab-analyze');
        tabContent.innerHTML = `
            <div class="data-card-premium">
                <h2>📊 Análise de Curso</h2>
                <p>Selecione um curso para análise pedagógica completa</p>
                
                <div class="form-group">
                    <label>Curso</label>
                    <select id="course-select" class="form-control">
                        <option value="">Carregando cursos...</option>
                    </select>
                </div>
                
                <button id="analyze-btn" class="btn btn-primary" disabled>
                    Analisar Curso
                </button>
                
                <div id="analysis-result" style="margin-top: 2rem;"></div>
            </div>
        `;
        
        await this.loadCourses();
        this.setupAnalyzeEvents();
    },
    
    // Load courses from API
    async loadCourses() {
        const select = document.getElementById('course-select');
        
        await this.moduleAPI.fetchWithStates('/api/courses', {
            loadingElement: select,
            onSuccess: (data) => {
                const courses = data.data || [];
                select.innerHTML = `
                    <option value="">Selecione um curso...</option>
                    ${courses.map(c => `
                        <option value="${c.id}">${c.name} (${c.level})</option>
                    `).join('')}
                `;
                document.getElementById('analyze-btn').disabled = false;
            },
            onEmpty: () => {
                select.innerHTML = '<option value="">Nenhum curso encontrado</option>';
            },
            onError: (error) => {
                select.innerHTML = '<option value="">Erro ao carregar cursos</option>';
                console.error('Error loading courses:', error);
            }
        });
    },
    
    // Setup analyze events
    setupAnalyzeEvents() {
        const analyzeBtn = document.getElementById('analyze-btn');
        const courseSelect = document.getElementById('course-select');
        
        analyzeBtn.addEventListener('click', async () => {
            const courseId = courseSelect.value;
            if (!courseId) {
                alert('Selecione um curso');
                return;
            }
            
            await this.analyzeCourse(courseId);
        });
    },
    
    // Analyze course via API
    async analyzeCourse(courseId) {
        const resultDiv = document.getElementById('analysis-result');
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analisando curso...</p></div>';
        
        try {
            const organizationId = localStorage.getItem('organizationId') || '452c0b35-1822-4890-851e-922356c812fb';
            
            const response = await this.moduleAPI.request('/api/agents/curriculum/analyze-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, organizationId })
            });
            
            if (response.success) {
                this.renderAnalysisResult(response);
            } else {
                throw new Error(response.message || 'Análise falhou');
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="error-state">
                    <h3>❌ Erro na Análise</h3>
                    <p>${error.message}</p>
                </div>
            `;
            console.error('Analysis error:', error);
        }
    },
    
    // Render analysis result
    renderAnalysisResult(data) {
        const resultDiv = document.getElementById('analysis-result');
        const { course, metrics, analysis, recommendations } = data;
        
        resultDiv.innerHTML = `
            <div class="analysis-result">
                <h3>✅ Análise Completa: ${course.name}</h3>
                
                <!-- Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Total de Aulas</h4>
                        <p class="value">${metrics.totalLessons}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Total de Atividades</h4>
                        <p class="value">${metrics.totalActivities}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Média por Aula</h4>
                        <p class="value">${metrics.averageActivitiesPerLesson.toFixed(1)}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Repetições Totais</h4>
                        <p class="value">${metrics.totalRepetitions}</p>
                    </div>
                </div>
                
                <!-- AI Analysis -->
                <div class="ai-analysis">
                    <h4>🤖 Análise do Professor Virtual</h4>
                    <div class="analysis-content">
                        ${this.formatMarkdown(analysis)}
                    </div>
                </div>
                
                <!-- Recommendations -->
                ${recommendations.length > 0 ? `
                    <div class="recommendations">
                        <h4>💡 Recomendações</h4>
                        <ul>
                            ${recommendations.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // TAB 2: Create Lesson
    async loadCreateTab() {
        const tabContent = document.getElementById('tab-create');
        tabContent.innerHTML = `
            <div class="data-card-premium">
                <h2>✍️ Criar Plano de Aula</h2>
                <p>O Professor Virtual irá sugerir um plano de aula otimizado</p>
                
                <div class="form-group">
                    <label>Curso</label>
                    <select id="create-course-select" class="form-control">
                        <option value="">Carregando...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Número da Aula</label>
                    <input type="number" id="lesson-number" class="form-control" min="1" placeholder="Ex: 15">
                </div>
                
                <div class="form-group">
                    <label>Requisitos Específicos (opcional)</label>
                    <textarea id="user-requirements" class="form-control" rows="3" 
                        placeholder="Ex: Foco em defesas contra armas brancas"></textarea>
                </div>
                
                <button id="create-btn" class="btn btn-primary">
                    Gerar Sugestão
                </button>
                
                <div id="creation-result" style="margin-top: 2rem;"></div>
            </div>
        `;
        
        await this.loadCoursesForCreate();
        this.setupCreateEvents();
    },
    
    async loadCoursesForCreate() {
        const select = document.getElementById('create-course-select');
        await this.moduleAPI.fetchWithStates('/api/courses', {
            loadingElement: select,
            onSuccess: (data) => {
                const courses = data.data || [];
                select.innerHTML = `
                    <option value="">Selecione um curso...</option>
                    ${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                `;
            }
        });
    },
    
    setupCreateEvents() {
        const createBtn = document.getElementById('create-btn');
        createBtn.addEventListener('click', () => this.createLesson());
    },
    
    async createLesson() {
        const courseId = document.getElementById('create-course-select').value;
        const lessonNumber = parseInt(document.getElementById('lesson-number').value);
        const userRequirements = document.getElementById('user-requirements').value;
        
        if (!courseId || !lessonNumber) {
            alert('Preencha curso e número da aula');
            return;
        }
        
        const resultDiv = document.getElementById('creation-result');
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Gerando sugestão...</p></div>';
        
        try {
            const organizationId = localStorage.getItem('organizationId') || '452c0b35-1822-4890-851e-922356c812fb';
            
            const response = await this.moduleAPI.request('/api/agents/curriculum/create-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    courseId, 
                    lessonNumber, 
                    organizationId,
                    userRequirements: userRequirements || undefined
                })
            });
            
            if (response.success) {
                this.renderLessonSuggestion(response.suggestion);
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="error-state"><p>${error.message}</p></div>`;
        }
    },
    
    renderLessonSuggestion(suggestion) {
        const resultDiv = document.getElementById('creation-result');
        
        if (suggestion.raw) {
            // Fallback se não conseguiu parsear JSON
            resultDiv.innerHTML = `
                <div class="suggestion-result">
                    <h3>🤖 Sugestão do Professor Virtual</h3>
                    <div class="raw-suggestion">
                        ${this.formatMarkdown(suggestion.raw)}
                    </div>
                </div>
            `;
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="suggestion-result">
                <h3>✅ ${suggestion.title}</h3>
                
                <h4>🎯 Objetivos</h4>
                <ul>
                    ${suggestion.objectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
                
                <h4>🏋️ Atividades Sugeridas</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Técnica</th>
                            <th>Categoria</th>
                            <th>Repetições</th>
                            <th>Séries</th>
                            <th>Duração</th>
                            <th>Intensidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suggestion.activities.map(act => `
                            <tr>
                                <td>${act.techniqueName}</td>
                                <td>${act.category}</td>
                                <td>${act.repetitions}</td>
                                <td>${act.sets}</td>
                                <td>${act.duration}min</td>
                                <td>${act.intensity}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${suggestion.pedagogicalNotes ? `
                    <h4>📝 Notas Pedagógicas</h4>
                    <p>${suggestion.pedagogicalNotes}</p>
                ` : ''}
                
                <p><strong>⏱️ Duração Estimada:</strong> ${suggestion.estimatedDuration} minutos</p>
                
                <button class="btn btn-success" onclick="curriculumAgentModule.saveLessonPlan()">
                    Salvar Plano de Aula
                </button>
            </div>
        `;
    },
    
    // TAB 3: Evaluate Lesson
    async loadEvaluateTab() {
        const tabContent = document.getElementById('tab-evaluate');
        tabContent.innerHTML = `
            <div class="data-card-premium">
                <h2>🎯 Avaliar Plano de Aula</h2>
                <p>Selecione uma aula para avaliação pedagógica</p>
                
                <div class="form-group">
                    <label>Curso</label>
                    <select id="eval-course-select" class="form-control">
                        <option value="">Selecione...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Aula</label>
                    <select id="eval-lesson-select" class="form-control">
                        <option value="">Selecione um curso primeiro...</option>
                    </select>
                </div>
                
                <button id="evaluate-btn" class="btn btn-primary" disabled>
                    Avaliar Aula
                </button>
                
                <div id="evaluation-result" style="margin-top: 2rem;"></div>
            </div>
        `;
        
        await this.loadCoursesForEvaluate();
        this.setupEvaluateEvents();
    },
    
    async loadCoursesForEvaluate() {
        const select = document.getElementById('eval-course-select');
        await this.moduleAPI.fetchWithStates('/api/courses', {
            loadingElement: select,
            onSuccess: (data) => {
                select.innerHTML = `
                    <option value="">Selecione um curso...</option>
                    ${data.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                `;
            }
        });
    },
    
    setupEvaluateEvents() {
        const courseSelect = document.getElementById('eval-course-select');
        const lessonSelect = document.getElementById('eval-lesson-select');
        const evaluateBtn = document.getElementById('evaluate-btn');
        
        courseSelect.addEventListener('change', async (e) => {
            const courseId = e.target.value;
            if (courseId) {
                await this.loadLessonsForEvaluate(courseId);
            }
        });
        
        evaluateBtn.addEventListener('click', () => {
            const lessonPlanId = lessonSelect.value;
            if (lessonPlanId) {
                this.evaluateLesson(lessonPlanId);
            }
        });
    },
    
    async loadLessonsForEvaluate(courseId) {
        const select = document.getElementById('eval-lesson-select');
        await this.moduleAPI.fetchWithStates(`/api/lesson-plans?courseId=${courseId}`, {
            loadingElement: select,
            onSuccess: (data) => {
                select.innerHTML = `
                    <option value="">Selecione uma aula...</option>
                    ${data.data.map(l => `
                        <option value="${l.id}">Aula ${l.lessonNumber}: ${l.title}</option>
                    `).join('')}
                `;
                document.getElementById('evaluate-btn').disabled = false;
            }
        });
    },
    
    async evaluateLesson(lessonPlanId) {
        const resultDiv = document.getElementById('evaluation-result');
        resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Avaliando aula...</p></div>';
        
        try {
            const organizationId = localStorage.getItem('organizationId') || '452c0b35-1822-4890-851e-922356c812fb';
            
            const response = await this.moduleAPI.request('/api/agents/curriculum/evaluate-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonPlanId, organizationId })
            });
            
            if (response.success) {
                this.renderEvaluationResult(response);
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="error-state"><p>${error.message}</p></div>`;
        }
    },
    
    renderEvaluationResult(data) {
        const resultDiv = document.getElementById('evaluation-result');
        const { lessonPlan, metrics, evaluation, score } = data;
        
        const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red';
        
        resultDiv.innerHTML = `
            <div class="evaluation-result">
                <h3>${lessonPlan.title}</h3>
                
                <!-- Score Circle -->
                <div class="score-circle" style="text-align: center; margin: 2rem 0;">
                    <div style="width: 150px; height: 150px; border-radius: 50%; 
                         background: conic-gradient(${scoreColor} ${score * 3.6}deg, #eee ${score * 3.6}deg);
                         display: inline-flex; align-items: center; justify-content: center;">
                        <div style="width: 120px; height: 120px; border-radius: 50%; background: white;
                             display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold;">
                            ${score}
                        </div>
                    </div>
                    <p><strong>Score Pedagógico</strong></p>
                </div>
                
                <!-- Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Atividades</h4>
                        <p class="value">${metrics.totalActivities}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Repetições</h4>
                        <p class="value">${metrics.totalRepetitions}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Duração</h4>
                        <p class="value">${metrics.totalDuration}min</p>
                    </div>
                    <div class="metric-card">
                        <h4>Categorias</h4>
                        <p class="value">${metrics.categoryVariety}</p>
                    </div>
                </div>
                
                <!-- AI Evaluation -->
                <div class="ai-evaluation">
                    <h4>🤖 Avaliação do Professor Virtual</h4>
                    <div class="evaluation-content">
                        ${this.formatMarkdown(evaluation)}
                    </div>
                </div>
            </div>
        `;
    },
    
    // Utility: Format markdown-like text to HTML
    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
    }
};

window.CurriculumAgentModule = CurriculumAgentModule;

} // end if

// Auto-initialize if container exists
if (document.getElementById('curriculum-agent-container')) {
    window.CurriculumAgentModule.init();
}
```

---

## 📌 4. Registrar no Menu Lateral

Adicionar ao `/public/index.html`:

```html
<li class="nav-item">
    <a href="#curriculum-agent" class="nav-link" onclick="app.navigate('curriculum-agent')">
        <i class="icon">🥋</i>
        <span>Professor Virtual</span>
    </a>
</li>
```

---

## 🎯 5. Registrar no AcademyApp

Em `/public/js/core/app.js`:

```javascript
loadModules() {
    const moduleList = [
        // ... existing modules
        'curriculum-agent'
    ];
    // ...
}
```

---

## ✅ Resultado Final

Interface completa com:

1. **Tab 1: Análise de Curso**
   - Seleção de curso
   - Análise via IA
   - Métricas visuais
   - Recomendações listadas

2. **Tab 2: Criação de Aula**
   - Formulário com curso + número da aula
   - Campo para requisitos específicos
   - Sugestão estruturada em tabela
   - Botão para salvar

3. **Tab 3: Avaliação de Aula**
   - Seleção de curso → aula
   - Score visual (círculo 0-100)
   - Métricas agregadas
   - Feedback detalhado da IA

---

## 🚀 Próximos Passos

- [ ] Implementar salvamento de planos sugeridos
- [ ] Adicionar histórico de conversas
- [ ] Chat interativo com agente
- [ ] Exportação de relatórios em PDF
- [ ] Comparação entre múltiplos cursos

---

**Status**: 📝 Guia completo de integração frontend  
**Tempo estimado de implementação**: 4-6 horas  
**Complexidade**: Média (seguir padrão single-file do projeto)
