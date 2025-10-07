// Frontend - Controlador de Importação Unificada de Atividades
// Integração inteligente com detecção automática de formato

class ActivityImportController {
    constructor() {
        this.apiClient = window.apiClient;
        this.supportedFormats = ['json', 'csv'];
        this.importProgress = null;
    }

    /**
     * Importar atividades com detecção automática de formato
     */
    async importActivities(file, options = {}) {
        const {
            mode = 'complete', // 'basic', 'complete', 'merge'
            updateExisting = true,
            enrichWithAI = false,
            onProgress = null
        } = options;

        try {
            // Mostrar progresso
            this.showImportProgress();
            
            if (onProgress) onProgress('Analisando arquivo...', 10);

            // Parse do arquivo com detecção automática
            const activities = await this.parseFile(file);
            
            if (onProgress) onProgress(`${activities.length} atividades detectadas`, 30);

            // Validar dados
            const validationResult = this.validateActivities(activities);
            if (validationResult.errors.length > 0) {
                this.showValidationErrors(validationResult.errors);
                return;
            }

            if (onProgress) onProgress('Enviando para servidor...', 50);

            // Importação flexível via API unificada
            const response = await this.apiClient.post('/api/activities/import', {
                mode,
                activities,
                updateExisting,
                enrichWithAI
            });

            if (onProgress) onProgress('Processando resultados...', 90);

            // Feedback inteligente
            this.showImportResults(response.data);
            
            if (onProgress) onProgress('Concluído!', 100);

            // Refresh da lista de atividades
            setTimeout(() => {
                this.refreshActivitiesList();
                this.hideImportProgress();
            }, 2000);
            
            return response.data;

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            this.handleImportError(error);
            this.hideImportProgress();
        }
    }

    /**
     * Parse inteligente de arquivo com detecção automática
     */
    async parseFile(file) {
        const fileName = file.name.toLowerCase();
        const text = await file.text();

        try {
            // Detecção por nome do arquivo
            if (fileName.includes('tecnicas') || fileName.includes('techniques')) {
                return this.parseTechniquesFile(text);
            } else if (fileName.includes('curso') || fileName.includes('course')) {
                return this.parseCourseFile(text);
            } else if (fileName.endsWith('.csv')) {
                return this.parseCSVFile(text);
            }
            
            // Fallback para JSON genérico
            const parsed = JSON.parse(text);
            
            // Se for um objeto com array de técnicas
            if (parsed.techniques && Array.isArray(parsed.techniques)) {
                return parsed.techniques;
            }
            
            // Se for array direto
            if (Array.isArray(parsed)) {
                return parsed;
            }
            
            // Se for objeto único, transformar em array
            return [parsed];

        } catch (error) {
            throw new Error(`Erro ao analisar arquivo: ${error.message}`);
        }
    }

    /**
     * Parse específico para arquivo de técnicas
     */
    parseTechniquesFile(text) {
        const data = JSON.parse(text);
        
        if (data.techniques && Array.isArray(data.techniques)) {
            return data.techniques.map(tech => this.normalizeTechniqueFormat(tech));
        }
        
        throw new Error('Formato de arquivo de técnicas inválido');
    }

    /**
     * Parse específico para arquivo de curso
     */
    parseCourseFile(text) {
        const data = JSON.parse(text);
        
        // Extrair atividades do curso
        const activities = [];
        
        if (data.modules && Array.isArray(data.modules)) {
            data.modules.forEach(module => {
                if (module.activities) {
                    activities.push(...module.activities.map(act => this.normalizeActivityFormat(act)));
                }
            });
        }
        
        return activities;
    }

    /**
     * Parse para CSV
     */
    parseCSVFile(text) {
        const lines = text.split('\\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const activities = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const activity = {};
                
                headers.forEach((header, index) => {
                    activity[header.toLowerCase()] = values[index];
                });
                
                activities.push(this.normalizeActivityFormat(activity));
            }
        }

        return activities;
    }

    /**
     * Normalizar formato de técnica para atividade
     */
    normalizeTechniqueFormat(technique) {
        return {
            id: technique.id,
            name: technique.name,
            description: technique.description,
            category: technique.category || 'TECHNIQUE',
            difficulty: technique.difficulty || 1,
            type: 'TECHNIQUE',
            instructions: technique.instructions || [],
            objectives: technique.objectives || [],
            resources: technique.equipment || technique.resources || [],
            duration: technique.duration || technique.durationMin || 5,
            repetitions: technique.repetitions || 1,
            complexity: technique.complexity || 'Iniciante',
            tags: technique.tags || [],
            assessmentCriteria: technique.assessmentCriteria || [],
            risksMitigation: technique.safety || technique.risksMitigation || [],
            prerequisites: technique.prerequisites || []
        };
    }

    /**
     * Normalizar formato genérico de atividade
     */
    normalizeActivityFormat(activity) {
        return {
            id: activity.id,
            name: activity.name || activity.title,
            description: activity.description,
            category: activity.category || 'ACTIVITY',
            difficulty: activity.difficulty || 1,
            type: activity.type || 'ACTIVITY',
            instructions: Array.isArray(activity.instructions) ? activity.instructions : [],
            objectives: Array.isArray(activity.objectives) ? activity.objectives : [],
            resources: Array.isArray(activity.resources) ? activity.resources : [],
            duration: activity.duration || 5,
            repetitions: activity.repetitions || 1,
            tags: Array.isArray(activity.tags) ? activity.tags : []
        };
    }

    /**
     * Validar atividades antes da importação
     */
    validateActivities(activities) {
        const errors = [];
        const warnings = [];

        activities.forEach((activity, index) => {
            if (!activity.name) {
                errors.push(`Atividade ${index + 1}: Nome é obrigatório`);
            }
            
            if (!activity.description) {
                warnings.push(`Atividade ${index + 1}: Descrição vazia`);
            }
            
            if (!activity.category) {
                warnings.push(`Atividade ${index + 1}: Categoria não definida`);
            }
        });

        return { errors, warnings };
    }

    /**
     * Mostrar progresso da importação
     */
    showImportProgress() {
        const progressHtml = `
            <div id="importProgress" class="import-progress-overlay">
                <div class="import-progress-modal">
                    <div class="import-progress-header">
                        <h3>🔄 Importando Atividades</h3>
                    </div>
                    <div class="import-progress-body">
                        <div class="progress-bar">
                            <div id="progressFill" class="progress-fill" style="width: 0%"></div>
                        </div>
                        <p id="progressText">Iniciando importação...</p>
                        <div id="progressDetails" class="progress-details"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', progressHtml);
    }

    /**
     * Atualizar progresso
     */
    updateProgress(text, percentage) {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        if (progressText) progressText.textContent = text;
        if (progressFill) progressFill.style.width = `${percentage}%`;
    }

    /**
     * Esconder progresso
     */
    hideImportProgress() {
        const progressOverlay = document.getElementById('importProgress');
        if (progressOverlay) {
            progressOverlay.remove();
        }
    }

    /**
     * Mostrar resultados da importação
     */
    showImportResults(results) {
        const { created, updated, skipped, errors, summary } = results;
        
        let message = `
            <div class="import-results">
                <h4>📊 Resultados da Importação</h4>
                <div class="results-summary">
                    <div class="result-item success">
                        <span class="icon">✅</span>
                        <span class="count">${created}</span>
                        <span class="label">Criadas</span>
                    </div>
                    <div class="result-item info">
                        <span class="icon">🔄</span>
                        <span class="count">${updated}</span>
                        <span class="label">Atualizadas</span>
                    </div>
                    <div class="result-item warning">
                        <span class="icon">⏭️</span>
                        <span class="count">${skipped}</span>
                        <span class="label">Ignoradas</span>
                    </div>
                    ${errors.length > 0 ? `
                        <div class="result-item error">
                            <span class="icon">❌</span>
                            <span class="count">${errors.length}</span>
                            <span class="label">Erros</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Mostrar erros se houver
        if (errors.length > 0) {
            message += `
                <div class="import-errors">
                    <h5>⚠️ Erros Encontrados:</h5>
                    <ul>
                        ${errors.map(error => `<li>${error.activity}: ${error.error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        window.app.showToast(message, 'success', 5000);
    }

    /**
     * Mostrar erros de validação
     */
    showValidationErrors(errors) {
        const message = `
            <div class="validation-errors">
                <h4>❌ Erros de Validação</h4>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
                <p>Corrija os erros e tente novamente.</p>
            </div>
        `;
        
        window.app.showToast(message, 'error', 8000);
    }

    /**
     * Tratar erro na importação
     */
    handleImportError(error) {
        console.error('❌ Erro na importação:', error);
        
        const message = `
            <div class="import-error">
                <h4>❌ Erro na Importação</h4>
                <p>${error.message || 'Erro desconhecido'}</p>
                <p>Tente novamente ou verifique o formato do arquivo.</p>
            </div>
        `;
        
        window.app.showToast(message, 'error', 5000);
    }

    /**
     * Refresh da lista de atividades
     */
    refreshActivitiesList() {
        // Disparar evento para atualizar lista de atividades
        window.dispatchEvent(new CustomEvent('activitiesUpdated'));
        
        // Se existir controlador de atividades, atualizar
        if (window.activitiesController) {
            window.activitiesController.loadActivities();
        }
    }
}

// Exportar para uso global
window.ActivityImportController = ActivityImportController;

// Instância global
window.activityImportController = new ActivityImportController();
