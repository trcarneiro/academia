/**
 * Enhanced Import Controller - Com Progress Bar e Logging
 * Versão 2.0 - Com feedback visual detalhado
 */

class ImportControllerEnhanced {
    constructor(container) {
        this.container = container;
        this.currentStep = 1;
        this.currentTab = 'courses'; // 'courses', 'techniques', 'students'
        this.uploadedData = null;
        this.importResults = {
            total: 0,
            processed: 0,
            success: 0,
            errors: 0,
            warnings: 0,
            logs: [],
            startTime: null,
            endTime: null
        };
        
        this.onError = null;
        this.moduleAPI = null;
    }

    /**
     * Inicializar
     */
    async init() {
        try {
            console.log('🎮 Inicializando Enhanced Import Controller...');
            
            // Aguardar API client
            await this.initializeAPI();
            
            this.setupMainStructure();
            this.setupEventListeners();
            this.loadUploadView();
            console.log('✅ Enhanced Import Controller inicializado');
        } catch (error) {
            console.error('❌ Erro:', error);
            throw error;
        }
    }

    /**
     * Inicializar API
     */
    async initializeAPI() {
        // Aguardar API client estar disponível
        if (typeof window.waitForAPIClient === 'function') {
            await window.waitForAPIClient();
        } else {
            // Fallback: aguardar até 10 segundos
            let attempts = 0;
            while (!window.createModuleAPI && attempts < 100) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        if (window.createModuleAPI) {
            this.moduleAPI = window.createModuleAPI('Import');
            console.log('✅ API Client inicializado para Import');
        } else {
            console.warn('⚠️ API Client não disponível, usando fetch direto');
        }
    }

    /**
     * Estrutura principal com progress bar
     */
    setupMainStructure() {
        this.container.innerHTML = `
            <div class="module-isolated-import-enhanced">
                <!-- Header Premium -->
                <div class="import-header-premium">
                    <div class="header-content">
                        <h1>📥 Central de Importação</h1>
                        <div class="breadcrumb">Módulo / Importação</div>
                    </div>
                    <div class="header-actions">
                        <button id="btn-help" class="btn-icon" title="Ajuda">❓</button>
                        <button id="btn-history" class="btn-icon" title="Histórico">📋</button>
                    </div>
                </div>

                <!-- Tabs de Tipo de Importação -->
                <div class="import-tabs-container">
                    <div class="import-tabs">
                        <button class="tab-btn active" data-tab="courses">
                            📚 Cursos Completos
                        </button>
                        <button class="tab-btn" data-tab="techniques">
                            🥋 Técnicas
                        </button>
                        <button class="tab-btn" data-tab="students">
                            👥 Alunos
                        </button>
                    </div>
                    <div class="tab-info" id="tab-info">
                        <p class="info-text">
                            <strong>📚 Cursos Completos:</strong> Importa curso com técnicas, cronograma e atividades
                        </p>
                    </div>
                </div>

                <!-- Progress Bar Global -->
                <div class="progress-container-enhanced">
                    <div class="progress-info">
                        <span class="progress-label">Progresso Geral</span>
                        <span class="progress-percentage">0%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-stats">
                        <span class="stat-item">
                            <span class="stat-label">Total:</span>
                            <span class="stat-value" id="stat-total">0</span>
                        </span>
                        <span class="stat-item success">
                            <span class="stat-label">✅ Sucesso:</span>
                            <span class="stat-value" id="stat-success">0</span>
                        </span>
                        <span class="stat-item warning">
                            <span class="stat-label">⚠️ Avisos:</span>
                            <span class="stat-value" id="stat-warnings">0</span>
                        </span>
                        <span class="stat-item error">
                            <span class="stat-label">❌ Erros:</span>
                            <span class="stat-value" id="stat-errors">0</span>
                        </span>
                    </div>
                </div>

                <!-- Stepper Visual -->
                <div class="stepper-enhanced">
                    <div class="step-item active" data-step="1">
                        <div class="step-icon">📁</div>
                        <div class="step-label">Upload</div>
                        <div class="step-status"></div>
                    </div>
                    <div class="step-divider"></div>
                    <div class="step-item" data-step="2">
                        <div class="step-icon">🔍</div>
                        <div class="step-label">Validação</div>
                        <div class="step-status"></div>
                    </div>
                    <div class="step-divider"></div>
                    <div class="step-item" data-step="3">
                        <div class="step-icon">👁️</div>
                        <div class="step-label">Preview</div>
                        <div class="step-status"></div>
                    </div>
                    <div class="step-divider"></div>
                    <div class="step-item" data-step="4">
                        <div class="step-icon">⚡</div>
                        <div class="step-label">Importação</div>
                        <div class="step-status"></div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="import-content-enhanced" id="import-content">
                    <!-- Conteúdo dinâmico -->
                </div>

                <!-- Live Log Console -->
                <div class="log-console-enhanced" id="log-console">
                    <div class="log-header">
                        <h3>📊 Log de Operações</h3>
                        <button id="btn-clear-log" class="btn-clear">🗑️ Limpar</button>
                    </div>
                    <div class="log-content" id="log-content">
                        <div class="log-empty">
                            Nenhuma operação executada ainda...
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="import-actions-enhanced">
                    <button id="btn-back" class="btn-secondary" style="display: none;">
                        ← Voltar
                    </button>
                    <button id="btn-cancel" class="btn-danger">
                        ❌ Cancelar
                    </button>
                    <button id="btn-next" class="btn-primary" style="display: none;">
                        Próximo →
                    </button>
                    <button id="btn-import" class="btn-success" style="display: none;">
                        ⚡ Iniciar Importação
                    </button>
                    <button id="btn-download-report" class="btn-info" style="display: none;">
                        📥 Baixar Relatório
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Event listeners
     */
    setupEventListeners() {
        const btnBack = this.container.querySelector('#btn-back');
        const btnNext = this.container.querySelector('#btn-next');
        const btnImport = this.container.querySelector('#btn-import');
        const btnCancel = this.container.querySelector('#btn-cancel');
        const btnClearLog = this.container.querySelector('#btn-clear-log');
        const btnDownloadReport = this.container.querySelector('#btn-download-report');
        const btnHelp = this.container.querySelector('#btn-help');
        const btnHistory = this.container.querySelector('#btn-history');

        if (btnBack) btnBack.addEventListener('click', () => this.previousStep());
        if (btnNext) btnNext.addEventListener('click', () => this.nextStep());
        if (btnImport) btnImport.addEventListener('click', () => this.startImport());
        if (btnCancel) btnCancel.addEventListener('click', () => this.cancelImport());
        if (btnClearLog) btnClearLog.addEventListener('click', () => this.clearLog());
        if (btnDownloadReport) btnDownloadReport.addEventListener('click', () => this.downloadReport());
        if (btnHelp) btnHelp.addEventListener('click', () => this.showHelp());
        if (btnHistory) btnHistory.addEventListener('click', () => this.showHistory());
        
        // Tabs
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.dataset.tab;
                this.switchTab(tabType);
            });
        });
    }

    /**
     * Trocar tab
     */
    switchTab(tabType) {
        // Atualizar botões
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabType);
        });
        
        // Atualizar info
        const tabInfo = this.container.querySelector('#tab-info');
        const infoTexts = {
            courses: '<strong>📚 Cursos Completos:</strong> Importa curso com técnicas, cronograma e atividades em JSON completo',
            techniques: '<strong>🥋 Técnicas:</strong> Importa apenas técnicas em CSV ou JSON (nome, categoria, descrição)',
            students: '<strong>👥 Alunos:</strong> Importa alunos do Asaas ou CSV personalizado com dados básicos'
        };
        
        tabInfo.querySelector('.info-text').innerHTML = infoTexts[tabType] || '';
        
        // Atualizar estado atual
        this.currentTab = tabType;
        
        // Resetar importação e recarregar view de upload
        this.resetImport();
        this.loadUploadView();
        
        this.addLog('info', `Tab alterada para: ${tabType}`);
    }

    /**
     * Adicionar log
     */
    addLog(type, message, details = null) {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const log = { type, message, details, timestamp };
        
        this.importResults.logs.push(log);
        
        const logContent = this.container.querySelector('#log-content');
        const emptyState = logContent.querySelector('.log-empty');
        if (emptyState) emptyState.remove();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        let icon = '📝';
        if (type === 'success') icon = '✅';
        else if (type === 'error') icon = '❌';
        else if (type === 'warning') icon = '⚠️';
        else if (type === 'info') icon = 'ℹ️';
        else if (type === 'processing') icon = '⏳';
        
        logEntry.innerHTML = `
            <span class="log-icon">${icon}</span>
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-message">${message}</span>
            ${details ? `<span class="log-details">${JSON.stringify(details)}</span>` : ''}
        `;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    /**
     * Atualizar progress bar
     */
    updateProgress(current, total) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        const progressFill = this.container.querySelector('.progress-bar-fill');
        const progressPercentage = this.container.querySelector('.progress-percentage');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
        
        this.importResults.processed = current;
        this.importResults.total = total;
    }

    /**
     * Atualizar stats
     */
    updateStats() {
        const totalEl = document.getElementById('stat-total');
        const successEl = document.getElementById('stat-success');
        const warningsEl = document.getElementById('stat-warnings');
        const errorsEl = document.getElementById('stat-errors');
        
        if (totalEl) totalEl.textContent = this.importResults.total;
        if (successEl) successEl.textContent = this.importResults.success;
        if (warningsEl) warningsEl.textContent = this.importResults.warnings;
        if (errorsEl) errorsEl.textContent = this.importResults.errors;
    }

    /**
     * View de Upload (Step 1)
     */
    loadUploadView() {
        this.updateStepperState(1);
        this.addLog('info', `Aguardando upload de arquivo (${this.currentTab})...`);
        
        // Configurações por tipo de importação
        const configs = {
            courses: {
                title: '📚 Upload de Curso Completo',
                formats: 'JSON',
                accept: '.json',
                fields: [
                    { name: 'courseId', desc: 'ID único do curso' },
                    { name: 'name', desc: 'Nome do curso' },
                    { name: 'description', desc: 'Descrição completa' },
                    { name: 'techniques', desc: 'Array de técnicas com ID e nome' },
                    { name: 'schedule', desc: 'Cronograma semanal com aulas' }
                ],
                template: {
                    courseId: "krav-maga-faixa-branca-2025",
                    name: "Krav Maga Faixa Branca",
                    description: "Curso introdutório de Krav Maga",
                    durationTotalWeeks: 18,
                    totalLessons: 35,
                    techniques: [
                        { id: "uuid-aqui", name: "postura-guarda-de-boxe" }
                    ],
                    schedule: {
                        weeks: 18,
                        lessonsPerWeek: [
                            { week: 1, lessons: 2, focus: ["technique-name", "STRETCH"] }
                        ]
                    }
                }
            },
            techniques: {
                title: '🥋 Upload de Técnicas',
                formats: 'CSV ou JSON',
                accept: '.csv,.json',
                fields: [
                    { name: 'name', desc: 'Nome da técnica (slug)' },
                    { name: 'category', desc: 'Categoria (PUNCH, KICK, DEFENSE, etc)' },
                    { name: 'description', desc: 'Descrição detalhada' },
                    { name: 'difficulty', desc: 'Nível (BEGINNER, INTERMEDIATE, ADVANCED)' }
                ],
                template: [
                    { name: 'soco-jab', category: 'PUNCH', description: 'Soco rápido frontal', difficulty: 'BEGINNER' }
                ]
            },
            students: {
                title: '👥 Upload de Alunos',
                formats: 'CSV ou JSON',
                accept: '.csv,.json',
                fields: [
                    { name: 'name', desc: 'Nome completo' },
                    { name: 'email', desc: 'Email (opcional)' },
                    { name: 'phone', desc: 'Telefone' },
                    { name: 'birthDate', desc: 'Data de nascimento (YYYY-MM-DD)' }
                ],
                template: [
                    { name: 'João Silva', email: 'joao@email.com', phone: '11999999999', birthDate: '1990-01-01' }
                ]
            }
        };
        
        const config = configs[this.currentTab];
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="upload-zone-enhanced">
                <div class="upload-area" id="upload-area">
                    <div class="upload-icon-large">📁</div>
                    <h3>${config.title}</h3>
                    <p>Arraste seu arquivo aqui ou clique para selecionar</p>
                    <p class="upload-hint">Formatos suportados: ${config.formats}</p>
                    <input type="file" id="file-input" class="file-input-hidden" accept="${config.accept}" />
                </div>
                
                <div class="file-requirements">
                    <h4>📋 Formato Esperado</h4>
                    <div class="requirements-grid">
                        ${config.fields.map(field => `
                            <div class="requirement-item">
                                <strong>${field.name}</strong>
                                <span>${field.desc}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button id="btn-download-template" class="btn-link">
                        📥 Baixar template exemplo
                    </button>
                </div>
            </div>
        `;
        
        this.setupUploadArea();
        this.setupDownloadTemplate(config.template);
        
        // Hide/show buttons
        this.container.querySelector('#btn-back').style.display = 'none';
        this.container.querySelector('#btn-next').style.display = 'none';
        this.container.querySelector('#btn-import').style.display = 'none';
    }

    /**
     * Setup upload area
     */
    setupUploadArea() {
        const uploadArea = this.container.querySelector('#upload-area');
        const fileInput = this.container.querySelector('#file-input');

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileUpload(file);
        });
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(file) {
        try {
            this.addLog('info', `Arquivo selecionado: ${file.name}`, { size: `${(file.size / 1024).toFixed(2)} KB` });
            
            const uploadArea = this.container.querySelector('#upload-area');
            uploadArea.innerHTML = `
                <div class="processing-state">
                    <div class="spinner-large"></div>
                    <p>Processando arquivo...</p>
                </div>
            `;

            const content = await this.readFileContent(file);
            const data = this.parseFileContent(file.name, content);
            
            this.uploadedData = {
                filename: file.name,
                size: file.size,
                data: data,
                uploadedAt: new Date().toISOString()
            };

            this.addLog('success', `Arquivo processado com sucesso: ${data.length} registros encontrados`);
            this.updateProgress(0, data.length);
            this.updateStats();
            
            setTimeout(() => this.nextStep(), 500);
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            this.addLog('error', `Erro ao processar arquivo: ${error.message}`);
            this.showErrorModal(error.message);
            setTimeout(() => this.loadUploadView(), 2000);
        }
    }

    /**
     * Read file content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse file content (CSV ou JSON)
     */
    parseFileContent(filename, content) {
        if (filename.endsWith('.json')) {
            return JSON.parse(content);
        } else if (filename.endsWith('.csv')) {
            return this.parseCSV(content);
        }
        throw new Error('Formato de arquivo não suportado');
    }

    /**
     * Parse CSV
     */
    parseCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV deve ter pelo menos 2 linhas');

        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim().replace(/['"]/g, '') : '';
            });
            data.push(row);
        }

        return data;
    }

    /**
     * Validation View (Step 2)
     */
    loadValidationView() {
        this.updateStepperState(2);
        this.addLog('processing', 'Iniciando validação dos dados...');
        
        const dataLength = this.currentTab === 'courses' ? 1 : 
                          (Array.isArray(this.uploadedData.data) ? this.uploadedData.data.length : 1);
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="validation-view-enhanced">
                <h3>🔍 Validação de Dados</h3>
                <p>Validando ${dataLength} registro(s)...</p>
                
                <div class="validation-progress">
                    <div class="validation-spinner"></div>
                    <p>Processando validações...</p>
                </div>
            </div>
        `;
        
        // Simulate validation
        setTimeout(() => {
            this.runValidation();
        }, 1000);
    }

    /**
     * Run validation
     */
    async runValidation() {
        const data = this.uploadedData.data;
        const validations = { valid: 0, invalid: 0, warnings: 0, errors: [] };
        
        // Validação baseada no tipo de importação
        if (this.currentTab === 'courses') {
            // Validar curso completo (JSON único)
            if (!data.courseId || !data.name || !data.techniques || !data.schedule) {
                validations.invalid = 1;
                validations.errors.push({ row: 1, field: 'structure', message: 'JSON deve conter courseId, name, techniques e schedule' });
                this.addLog('error', 'Estrutura do JSON inválida');
            } else {
                validations.valid = 1;
                this.addLog('success', 'Estrutura do curso válida');
                
                // Validar técnicas
                if (!Array.isArray(data.techniques) || data.techniques.length === 0) {
                    validations.warnings++;
                    this.addLog('warning', 'Nenhuma técnica encontrada no curso');
                } else {
                    this.addLog('info', `${data.techniques.length} técnicas encontradas`);
                }
                
                // Validar cronograma
                if (!data.schedule.weeks || !data.schedule.lessonsPerWeek) {
                    validations.warnings++;
                    this.addLog('warning', 'Cronograma incompleto');
                } else {
                    this.addLog('info', `Cronograma: ${data.schedule.weeks} semanas`);
                }
                
                // Validar se técnicas existem (marcar como aviso, não erro)
                if (data.techniques && data.techniques.length > 0) {
                    validations.warnings++;
                    validations.missingTechniques = data.techniques.map(t => t.name || t.id);
                    this.addLog('warning', `${data.techniques.length} técnicas serão verificadas/criadas durante importação`);
                }
            }
            
        } else if (this.currentTab === 'techniques') {
            // Validar lista de técnicas
            const techniquesList = Array.isArray(data) ? data : [data];
            for (let i = 0; i < techniquesList.length; i++) {
                const technique = techniquesList[i];
                this.updateProgress(i + 1, techniquesList.length);
                
                if (!technique.name || technique.name.trim() === '') {
                    validations.invalid++;
                    validations.errors.push({ row: i + 1, field: 'name', message: 'Nome da técnica é obrigatório' });
                    this.addLog('error', `Linha ${i + 1}: Nome da técnica é obrigatório`);
                } else {
                    validations.valid++;
                }
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
        } else if (this.currentTab === 'students') {
            // Validar lista de alunos
            for (let i = 0; i < data.length; i++) {
                const student = data[i];
                this.updateProgress(i + 1, data.length);
                
                if (!student.name || student.name.trim() === '') {
                    validations.invalid++;
                    validations.errors.push({ row: i + 1, field: 'name', message: 'Nome do aluno é obrigatório' });
                    this.addLog('error', `Linha ${i + 1}: Nome do aluno é obrigatório`);
                } else {
                    validations.valid++;
                }
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        this.addLog('success', `Validação concluída: ${validations.valid} válidos, ${validations.invalid} inválidos, ${validations.warnings} avisos`);
        
        this.uploadedData.validations = validations;
        
        // Show results
        this.showValidationResults(validations);
    }

    /**
     * Show validation results
     */
    showValidationResults(validations) {
        const content = this.container.querySelector('#import-content');
        
        // Para cursos, adicionar opção de criar técnicas
        const showCreateTechniquesOption = this.currentTab === 'courses' && validations.warnings > 0;
        
        content.innerHTML = `
            <div class="validation-results-enhanced">
                <h3>✅ Resultados da Validação</h3>
                
                <div class="result-cards">
                    <div class="result-card success">
                        <div class="result-icon">✅</div>
                        <div class="result-number">${validations.valid}</div>
                        <div class="result-label">Válidos</div>
                    </div>
                    <div class="result-card error">
                        <div class="result-icon">❌</div>
                        <div class="result-number">${validations.invalid}</div>
                        <div class="result-label">Inválidos</div>
                    </div>
                    ${validations.warnings > 0 ? `
                        <div class="result-card warning">
                            <div class="result-icon">⚠️</div>
                            <div class="result-number">${validations.warnings}</div>
                            <div class="result-label">Avisos</div>
                        </div>
                    ` : ''}
                </div>
                
                ${validations.errors.length > 0 ? `
                    <div class="error-list">
                        <h4>⚠️ Erros Encontrados:</h4>
                        <ul>
                            ${validations.errors.map(err => `
                                <li>Linha ${err.row}, Campo "${err.field}": ${err.message}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${showCreateTechniquesOption ? `
                    <div class="import-options-card">
                        <h4>⚙️ Opções de Importação</h4>
                        <div class="option-item">
                            <label class="checkbox-label">
                                <input type="checkbox" id="create-missing-techniques" checked />
                                <span class="checkbox-text">
                                    <strong>Criar técnicas automaticamente</strong>
                                    <small>Técnicas não encontradas no sistema serão criadas automaticamente durante a importação</small>
                                </span>
                            </label>
                        </div>
                        ${validations.missingTechniques && validations.missingTechniques.length > 0 ? `
                            <div class="missing-techniques-preview">
                                <p><strong>Técnicas que serão criadas:</strong></p>
                                <ul class="techniques-to-create">
                                    ${validations.missingTechniques.slice(0, 5).map(t => `
                                        <li>🥋 ${t}</li>
                                    `).join('')}
                                    ${validations.missingTechniques.length > 5 ? 
                                        `<li>... e mais ${validations.missingTechniques.length - 5} técnicas</li>` 
                                        : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <p class="result-message">
                    ${validations.invalid > 0 ? 
                        '⚠️ Alguns registros possuem erros. Corrija o arquivo e faça upload novamente, ou continue apenas com os registros válidos.' :
                        validations.warnings > 0 ?
                        '⚠️ Validação concluída com avisos. Revise as opções acima antes de continuar.' :
                        '✅ Todos os registros estão válidos! Você pode prosseguir para a importação.'
                    }
                </p>
            </div>
        `;
        
        this.container.querySelector('#btn-back').style.display = 'inline-flex';
        this.container.querySelector('#btn-next').style.display = validations.invalid === 0 ? 'inline-flex' : 'none';
    }

    /**
     * Preview View (Step 3)
     */
    loadPreviewView() {
        this.updateStepperState(3);
        this.addLog('info', 'Gerando preview dos dados...');
        
        const content = this.container.querySelector('#import-content');
        
        if (this.currentTab === 'courses') {
            // Preview de curso completo
            const course = this.uploadedData.data;
            content.innerHTML = `
                <div class="preview-view-enhanced">
                    <h3>👁️ Preview do Curso</h3>
                    
                    <div class="course-preview-card">
                        <h4>${course.name}</h4>
                        <p><strong>ID:</strong> ${course.courseId}</p>
                        <p><strong>Descrição:</strong> ${course.description || 'N/A'}</p>
                        <p><strong>Duração:</strong> ${course.durationTotalWeeks || 'N/A'} semanas</p>
                        <p><strong>Total de Aulas:</strong> ${course.totalLessons || 'N/A'}</p>
                        <p><strong>Técnicas:</strong> ${course.techniques ? course.techniques.length : 0}</p>
                        <p><strong>Semanas de Cronograma:</strong> ${course.schedule?.weeks || 0}</p>
                    </div>
                    
                    ${course.techniques && course.techniques.length > 0 ? `
                        <div class="techniques-preview">
                            <h4>🥋 Técnicas (primeiras 10)</h4>
                            <ul class="techniques-list">
                                ${course.techniques.slice(0, 10).map(t => `
                                    <li>${t.name || t.id}</li>
                                `).join('')}
                                ${course.techniques.length > 10 ? `<li>... e mais ${course.techniques.length - 10} técnicas</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <p class="preview-info">
                        📊 Curso será importado com todas as informações acima
                    </p>
                </div>
            `;
        } else {
            // Preview de lista (técnicas ou alunos)
            const data = Array.isArray(this.uploadedData.data) ? this.uploadedData.data : [this.uploadedData.data];
            const preview = data.slice(0, 10);
            
            content.innerHTML = `
                <div class="preview-view-enhanced">
                    <h3>👁️ Preview dos Dados (primeiros 10 registros)</h3>
                    
                    <div class="preview-table-container">
                        <table class="preview-table">
                            <thead>
                                <tr>
                                    ${Object.keys(preview[0]).map(key => `<th>${key}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${preview.map(row => `
                                    <tr>
                                        ${Object.values(row).map(value => `<td>${value || '-'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <p class="preview-info">
                        📊 Total de ${data.length} registros serão importados
                    </p>
                </div>
            `;
        }
        
        this.container.querySelector('#btn-back').style.display = 'inline-flex';
        this.container.querySelector('#btn-next').style.display = 'none';
        this.container.querySelector('#btn-import').style.display = 'inline-flex';
    }

    /**
     * Start Import (Step 4)
     */
    async startImport() {
        this.updateStepperState(4);
        this.importResults.startTime = new Date();
        this.addLog('processing', '⚡ Iniciando importação...');
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="import-view-enhanced">
                <h3>⚡ Importação em Andamento...</h3>
                <p>Por favor, não feche esta janela</p>
                
                <div class="import-animation">
                    <div class="pulse-loader"></div>
                </div>
            </div>
        `;
        
        this.container.querySelector('#btn-back').style.display = 'none';
        this.container.querySelector('#btn-import').style.display = 'none';
        this.container.querySelector('#btn-cancel').disabled = true;
        
        await this.processImport();
    }

    /**
     * Process Import
     */
    async processImport() {
        try {
            if (this.currentTab === 'courses') {
                // Importar curso completo
                await this.importFullCourse();
            } else if (this.currentTab === 'techniques') {
                // Importar técnicas
                await this.importTechniques();
            } else if (this.currentTab === 'students') {
                // Importar alunos
                await this.importStudents();
            }
        } catch (error) {
            this.addLog('error', `Erro na importação: ${error.message}`);
            this.importResults.errors++;
        }
        
        this.importResults.endTime = new Date();
        this.showFinalReport();
    }

    /**
     * Importar curso completo
     */
    async importFullCourse() {
        const courseData = this.uploadedData.data;
        this.importResults.total = 1;
        this.updateProgress(0, 1);
        
        // Verificar opção de criar técnicas
        const createMissingTechniques = document.getElementById('create-missing-techniques')?.checked ?? true;
        
        try {
            this.addLog('processing', `Importando curso: ${courseData.name}...`);
            
            if (createMissingTechniques) {
                this.addLog('info', '✨ Modo: Criar técnicas automaticamente se não existirem');
            } else {
                this.addLog('info', '⚠️ Modo: Apenas usar técnicas existentes');
            }
            
            // Adicionar flag ao payload
            const payload = {
                ...courseData,
                createMissingTechniques: createMissingTechniques
            };
            
            console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
            console.log('📊 Payload size:', JSON.stringify(payload).length, 'bytes');
            
            // Usar API client com timeout maior (criar técnicas pode demorar)
            let response;
            if (this.moduleAPI) {
                this.addLog('info', '🔄 Enviando requisição (timeout: 60s)...');
                response = await this.moduleAPI.api.request('POST', '/api/courses/import-full-course', payload, {
                    timeout: 60000 // 60 segundos para permitir criação de técnicas
                });
            } else {
                const resp = await fetch('/api/courses/import-full-course', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                response = await resp.json();
            }
            
            if (response.success) {
                this.importResults.success++;
                this.addLog('success', `✅ Curso "${courseData.name}" importado com sucesso!`);
                
                if (response.data?.techniqueCount) {
                    this.addLog('info', `📚 ${response.data.techniqueCount} técnicas processadas`);
                }
                if (response.data?.techniquesCreated) {
                    this.addLog('success', `✨ ${response.data.techniquesCreated} técnicas criadas automaticamente`);
                }
                if (response.data?.lessonCount) {
                    this.addLog('info', `📅 ${response.data.lessonCount} aulas criadas`);
                }
            } else {
                throw new Error(response.message || 'Erro desconhecido');
            }
            
            this.updateProgress(1, 1);
            
        } catch (error) {
            this.importResults.errors++;
            this.addLog('error', `❌ Erro: ${error.message}`);
            throw error;
        }
        
        this.updateStats();
    }

    /**
     * Importar técnicas
     */
    async importTechniques() {
        const techniques = Array.isArray(this.uploadedData.data) ? this.uploadedData.data : [this.uploadedData.data];
        this.importResults.total = techniques.length;
        
        for (let i = 0; i < techniques.length; i++) {
            const technique = techniques[i];
            this.updateProgress(i + 1, techniques.length);
            
            try {
                this.addLog('processing', `Importando técnica: ${technique.name}...`);
                
                // Usar API client se disponível
                let response;
                if (this.moduleAPI) {
                    response = await this.moduleAPI.api.request('POST', '/api/techniques', technique);
                } else {
                    const resp = await fetch('/api/techniques', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(technique)
                    });
                    response = await resp.json();
                }
                
                if (response.success) {
                    this.importResults.success++;
                    this.addLog('success', `✅ Técnica "${technique.name}" importada`);
                } else {
                    throw new Error(response.message || 'Erro desconhecido');
                }
                
            } catch (error) {
                this.importResults.errors++;
                this.addLog('error', `❌ Erro ao importar "${technique.name}": ${error.message}`);
            }
            
            this.updateStats();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Importar alunos
     */
    async importStudents() {
        const students = this.uploadedData.data;
        this.importResults.total = students.length;
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            this.updateProgress(i + 1, students.length);
            
            try {
                this.addLog('processing', `Importando aluno: ${student.name}...`);
                
                // Usar API client se disponível
                let response;
                if (this.moduleAPI) {
                    response = await this.moduleAPI.api.request('POST', '/api/students', student);
                } else {
                    const resp = await fetch('/api/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(student)
                    });
                    response = await resp.json();
                }
                
                if (response.success) {
                    this.importResults.success++;
                    this.addLog('success', `✅ Aluno "${student.name}" importado`);
                } else {
                    throw new Error(response.message || 'Erro desconhecido');
                }
                
            } catch (error) {
                this.importResults.errors++;
                this.addLog('error', `❌ Erro ao importar "${student.name}": ${error.message}`);
            }
            
            this.updateStats();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Show Final Report
     */
    showFinalReport() {
        const duration = (this.importResults.endTime - this.importResults.startTime) / 1000;
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="final-report-enhanced">
                <h2>🎉 Importação Concluída!</h2>
                
                <div class="report-summary">
                    <div class="summary-card">
                        <div class="summary-icon">📊</div>
                        <div class="summary-stat">${this.importResults.total}</div>
                        <div class="summary-label">Total Processados</div>
                    </div>
                    <div class="summary-card success">
                        <div class="summary-icon">✅</div>
                        <div class="summary-stat">${this.importResults.success}</div>
                        <div class="summary-label">Importados com Sucesso</div>
                    </div>
                    <div class="summary-card error">
                        <div class="summary-icon">❌</div>
                        <div class="summary-stat">${this.importResults.errors}</div>
                        <div class="summary-label">Erros</div>
                    </div>
                </div>
                
                <div class="report-details">
                    <p><strong>⏱️ Tempo total:</strong> ${duration.toFixed(2)} segundos</p>
                    <p><strong>⚡ Velocidade:</strong> ${(this.importResults.total / duration).toFixed(2)} registros/seg</p>
                    <p><strong>📅 Concluído em:</strong> ${this.importResults.endTime.toLocaleString('pt-BR')}</p>
                </div>
                
                <div class="report-actions">
                    <button id="btn-view-log" class="btn-info">📋 Ver Log Completo</button>
                    <button id="btn-restart" class="btn-primary">🔄 Nova Importação</button>
                </div>
            </div>
        `;
        
        this.addLog('success', `✅ Importação finalizada: ${this.importResults.success}/${this.importResults.total} com sucesso em ${duration.toFixed(2)}s`);
        
        this.container.querySelector('#btn-cancel').style.display = 'none';
        this.container.querySelector('#btn-download-report').style.display = 'inline-flex';
        
        const btnRestart = this.container.querySelector('#btn-restart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                this.resetImport();
                this.loadUploadView();
            });
        }
    }

    /**
     * Update stepper state
     */
    updateStepperState(currentStep) {
        const steps = this.container.querySelectorAll('.step-item');
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed', 'current');
            
            if (stepNum < currentStep) {
                step.classList.add('completed');
                step.querySelector('.step-status').textContent = '✅';
            } else if (stepNum === currentStep) {
                step.classList.add('current');
                step.querySelector('.step-status').textContent = '⏳';
            }
        });
        
        this.currentStep = currentStep;
    }

    /**
     * Next step
     */
    nextStep() {
        if (this.currentStep === 1) {
            this.loadValidationView();
        } else if (this.currentStep === 2) {
            this.loadPreviewView();
        }
    }

    /**
     * Previous step
     */
    previousStep() {
        if (this.currentStep === 2) {
            this.loadUploadView();
        } else if (this.currentStep === 3) {
            this.loadValidationView();
        }
    }

    /**
     * Cancel import
     */
    cancelImport() {
        if (confirm('Deseja realmente cancelar a importação?')) {
            this.resetImport();
            this.loadUploadView();
        }
    }

    /**
     * Clear log
     */
    clearLog() {
        this.importResults.logs = [];
        const logContent = this.container.querySelector('#log-content');
        logContent.innerHTML = '<div class="log-empty">Log limpo</div>';
    }

    /**
     * Download report
     */
    downloadReport() {
        const report = {
            summary: {
                total: this.importResults.total,
                success: this.importResults.success,
                errors: this.importResults.errors,
                warnings: this.importResults.warnings,
                startTime: this.importResults.startTime,
                endTime: this.importResults.endTime,
                duration: (this.importResults.endTime - this.importResults.startTime) / 1000
            },
            logs: this.importResults.logs
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-report-${Date.now()}.json`;
        a.click();
        
        this.addLog('success', 'Relatório baixado com sucesso');
    }

    /**
     * Setup download template
     */
    setupDownloadTemplate(templateData) {
        const btn = this.container.querySelector('#btn-download-template');
        if (btn) {
            btn.addEventListener('click', () => {
                let content, filename, type;
                
                if (this.currentTab === 'courses') {
                    // Template JSON para curso
                    content = JSON.stringify(templateData, null, 2);
                    filename = 'template-curso-completo.json';
                    type = 'application/json';
                } else if (this.currentTab === 'techniques') {
                    // Template CSV para técnicas
                    const csvContent = [
                        ['name', 'category', 'description', 'difficulty'],
                        ['soco-jab', 'PUNCH', 'Soco rápido frontal com mão da frente', 'BEGINNER'],
                        ['chute-reto', 'KICK', 'Chute frontal reto com perna traseira', 'BEGINNER']
                    ].map(row => row.join(',')).join('\n');
                    
                    content = csvContent;
                    filename = 'template-tecnicas.csv';
                    type = 'text/csv';
                } else if (this.currentTab === 'students') {
                    // Template CSV para alunos
                    const csvContent = [
                        ['name', 'email', 'phone', 'birthDate'],
                        ['João Silva', 'joao@email.com', '11999999999', '1990-01-01'],
                        ['Maria Santos', 'maria@email.com', '11888888888', '1985-05-15']
                    ].map(row => row.join(',')).join('\n');
                    
                    content = csvContent;
                    filename = 'template-alunos.csv';
                    type = 'text/csv';
                }
                
                const blob = new Blob([content], { type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                
                this.addLog('info', `Template baixado: ${filename}`);
            });
        }
    }

    /**
     * Show help
     */
    showHelp() {
        alert('Ajuda: Como importar cursos\n\n1. Faça upload do arquivo CSV ou JSON\n2. Aguarde a validação\n3. Revise o preview\n4. Inicie a importação');
    }

    /**
     * Show history
     */
    showHistory() {
        alert('Histórico de importações será implementado em breve');
    }

    /**
     * Show error modal
     */
    showErrorModal(message) {
        // TODO: Implementar modal de erro premium
        alert(`❌ Erro: ${message}`);
    }

    /**
     * Reset import
     */
    resetImport() {
        this.uploadedData = null;
        this.importResults = {
            total: 0,
            processed: 0,
            success: 0,
            errors: 0,
            warnings: 0,
            logs: [],
            startTime: null,
            endTime: null
        };
        this.updateProgress(0, 0);
        this.updateStats();
        this.currentStep = 1;
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.resetImport();
        this.container.innerHTML = '';
    }
}

// Export
window.ImportControllerEnhanced = ImportControllerEnhanced;
console.log('📦 ImportControllerEnhanced loaded');
