/**
 * Import Controller - Main UI Controller
 * Gerencia o workflow de importação de alunos do Asaas
 * 
 * @version 1.0.0
 * @author AI Assistant
 * @follows Guidelines2.md
 */

class ImportController {
    constructor(container) {
        this.container = container;
        this.currentStep = 1;
        this.uploadedData = null;
        this.validationResults = null;
        this.previewData = null;
        
        // Estados do workflow
        this.steps = {
            1: 'upload',
            2: 'validate', 
            3: 'preview',
            4: 'import'
        };
        
        this.onError = null; // Callback para erros
    }

    /**
     * Inicializar o controller
     */
    async init() {
        try {
            console.log('🎮 Inicializando ImportController...');
            
            this.setupMainStructure();
            this.setupEventListeners();
            this.loadUploadView();
            
            console.log('✅ ImportController inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar ImportController:', error);
            if (this.onError) {
                this.onError(error, 'init');
            }
            throw error;
        }
    }

    /**
     * Configurar estrutura principal do módulo
     */
    setupMainStructure() {
        this.container.innerHTML = `
            <div class="module-isolated-import">
                <!-- Header Premium -->
                <div class="import-header-premium">
                    <h1>📥 Importação de Alunos</h1>
                    <div class="breadcrumb">Módulo / Importação / Asaas</div>
                </div>

                <!-- Progress Steps -->
                <div class="progress-steps">
                    <div class="progress-step active" data-step="1">1</div>
                    <div class="progress-step" data-step="2">2</div>
                    <div class="progress-step" data-step="3">3</div>
                    <div class="progress-step" data-step="4">4</div>
                </div>

                <!-- Main Content Area -->
                <div id="import-content" class="import-content">
                    <!-- Conteúdo dinâmico será inserido aqui -->
                </div>

                <!-- Action Buttons -->
                <div class="import-actions">
                    <button id="btn-back" class="btn-import-secondary" style="display: none;">
                        ← Voltar
                    </button>
                    <button id="btn-next" class="btn-import-primary" style="display: none;">
                        Próximo →
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botão Voltar
        const btnBack = this.container.querySelector('#btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.previousStep());
        }

        // Botão Próximo
        const btnNext = this.container.querySelector('#btn-next');
        if (btnNext) {
            btnNext.addEventListener('click', () => this.nextStep());
        }
    }

    /**
     * Carregar view de upload (Passo 1)
     */
    loadUploadView() {
        this.updateProgressSteps(1);
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="upload-view fade-in">
                <!-- Upload Area Premium -->
                <div class="upload-area-premium" id="upload-area">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">Arraste seu arquivo CSV aqui</div>
                    <div class="upload-subtext">ou clique para selecionar</div>
                    <input type="file" id="file-input" class="file-input-hidden" accept=".csv" />
                </div>

                <!-- Info sobre formato -->
                <div class="data-preview-premium">
                    <h3>📋 Formato Esperado</h3>
                    <p>O arquivo CSV deve conter as seguintes colunas:</p>
                    <ul>
                        <li><strong>nome</strong> - Nome completo do aluno</li>
                        <li><strong>email</strong> - Email válido</li>
                        <li><strong>telefone</strong> - Telefone no formato brasileiro</li>
                        <li><strong>documento</strong> - CPF ou CNPJ</li>
                        <li><strong>endereco</strong> - Endereço completo</li>
                        <li><strong>valor_mensalidade</strong> - Valor da mensalidade</li>
                        <li><strong>empresa</strong> - Código da empresa (opcional)</li>
                    </ul>
                </div>
            </div>
        `;

        // Setup upload functionality
        this.setupUploadArea();
        
        // Hide action buttons for upload step
        this.container.querySelector('#btn-back').style.display = 'none';
        this.container.querySelector('#btn-next').style.display = 'none';
    }

    /**
     * Configurar área de upload
     */
    setupUploadArea() {
        const uploadArea = this.container.querySelector('#upload-area');
        const fileInput = this.container.querySelector('#file-input');

        // Click to select file
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // Drag and drop
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
            if (file && file.type === 'text/csv') {
                this.handleFileUpload(file);
            } else {
                this.showError('Por favor, selecione um arquivo CSV válido.');
            }
        });
    }

    /**
     * Processar upload de arquivo
     */
    async handleFileUpload(file) {
        try {
            console.log('📁 Processando upload do arquivo:', file.name);
            
            // Show loading
            const uploadArea = this.container.querySelector('#upload-area');
            uploadArea.innerHTML = `
                <div class="import-loading">
                    <div class="spinner"></div>
                    <p>Processando arquivo CSV...</p>
                </div>
            `;

            // Read file content
            const content = await this.readFileContent(file);
            
            // Parse CSV (simplified)
            const data = this.parseCSVContent(content);
            
            this.uploadedData = {
                filename: file.name,
                size: file.size,
                data: data,
                uploadedAt: new Date().toISOString()
            };

            console.log('✅ Arquivo processado com sucesso:', this.uploadedData);
            
            // Move to validation step
            this.nextStep();
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            this.showError('Erro ao processar arquivo: ' + error.message);
            this.loadUploadView(); // Reset upload view
        }
    }

    /**
     * Ler conteúdo do arquivo
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
     * Parse simplificado do CSV
     */
    parseCSVContent(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('Arquivo CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            
            data.push(row);
        }

        return data;
    }

    /**
     * Carregar view de validação (Passo 2)
     */
    loadValidationView() {
        this.updateProgressSteps(2);
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="validation-view fade-in">
                <div class="import-stats">
                    <div class="stat-card-import">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${this.uploadedData.data.length}</div>
                        <div class="stat-label">Registros Encontrados</div>
                    </div>
                    <div class="stat-card-import">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value" id="valid-count">0</div>
                        <div class="stat-label">Registros Válidos</div>
                    </div>
                    <div class="stat-card-import">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-value" id="error-count">0</div>
                        <div class="stat-label">Erros Encontrados</div>
                    </div>
                </div>

                <div class="data-preview-premium">
                    <h3>🔍 Resultado da Validação</h3>
                    <div id="validation-results">
                        <div class="import-loading">
                            <div class="spinner"></div>
                            <p>Validando dados...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Run validation
        setTimeout(() => this.runValidation(), 1000);
        
        // Show back button
        this.container.querySelector('#btn-back').style.display = 'inline-block';
    }

    /**
     * Executar validação dos dados
     */
    runValidation() {
        const validData = [];
        const errors = [];

        this.uploadedData.data.forEach((row, index) => {
            const rowErrors = [];
            
            // Validações básicas
            if (!row.nome || row.nome.length < 2) {
                rowErrors.push('Nome inválido ou muito curto');
            }
            
            if (!row.email || !row.email.includes('@')) {
                rowErrors.push('Email inválido');
            }
            
            if (rowErrors.length === 0) {
                validData.push(row);
            } else {
                errors.push({
                    line: index + 2, // +2 porque linha 1 é header e index começa em 0
                    data: row,
                    errors: rowErrors
                });
            }
        });

        this.validationResults = {
            valid: validData,
            errors: errors,
            total: this.uploadedData.data.length
        };

        this.displayValidationResults();
    }

    /**
     * Exibir resultados da validação
     */
    displayValidationResults() {
        const validCount = this.container.querySelector('#valid-count');
        const errorCount = this.container.querySelector('#error-count');
        const resultsDiv = this.container.querySelector('#validation-results');

        validCount.textContent = this.validationResults.valid.length;
        errorCount.textContent = this.validationResults.errors.length;

        let resultsHTML = '';

        // Success message
        if (this.validationResults.valid.length > 0) {
            resultsHTML += `
                <div class="validation-message success">
                    <span>✅</span>
                    ${this.validationResults.valid.length} registros válidos encontrados
                </div>
            `;
        }

        // Error messages
        if (this.validationResults.errors.length > 0) {
            resultsHTML += `
                <div class="validation-message error">
                    <span>❌</span>
                    ${this.validationResults.errors.length} registros com problemas encontrados
                </div>
            `;
            
            // Show first few errors
            const maxErrors = Math.min(5, this.validationResults.errors.length);
            for (let i = 0; i < maxErrors; i++) {
                const error = this.validationResults.errors[i];
                resultsHTML += `
                    <div class="validation-message warning">
                        <span>⚠️</span>
                        Linha ${error.line}: ${error.errors.join(', ')}
                    </div>
                `;
            }
            
            if (this.validationResults.errors.length > 5) {
                resultsHTML += `
                    <div class="validation-message warning">
                        <span>📝</span>
                        E mais ${this.validationResults.errors.length - 5} erros...
                    </div>
                `;
            }
        }

        resultsDiv.innerHTML = resultsHTML;
        
        // Show next button if we have valid data
        const btnNext = this.container.querySelector('#btn-next');
        if (this.validationResults.valid.length > 0) {
            btnNext.style.display = 'inline-block';
            btnNext.textContent = 'Visualizar Dados →';
        } else {
            btnNext.style.display = 'none';
        }
    }

    /**
     * Atualizar steps do progresso
     */
    updateProgressSteps(currentStep) {
        this.currentStep = currentStep;
        
        const steps = this.container.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === currentStep) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Próximo passo
     */
    nextStep() {
        switch (this.currentStep) {
            case 1:
                if (this.uploadedData) {
                    this.loadValidationView();
                }
                break;
            case 2:
                if (this.validationResults && this.validationResults.valid.length > 0) {
                    this.loadPreviewView();
                }
                break;
            case 3:
                this.loadImportView();
                break;
        }
    }

    /**
     * Passo anterior
     */
    previousStep() {
        switch (this.currentStep) {
            case 2:
                this.loadUploadView();
                break;
            case 3:
                this.loadValidationView();
                break;
            case 4:
                this.loadPreviewView();
                break;
        }
    }

    /**
     * Carregar view de preview (Passo 3)
     */
    loadPreviewView() {
        this.updateProgressSteps(3);
        
        const content = this.container.querySelector('#import-content');
        const validData = this.validationResults.valid.slice(0, 10); // Primeiros 10 registros
        
        let tableHTML = `
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        validData.forEach(row => {
            tableHTML += `
                <tr>
                    <td>${row.nome || 'N/A'}</td>
                    <td>${row.email || 'N/A'}</td>
                    <td>${row.telefone || 'N/A'}</td>
                    <td><span style="color: green;">✅ Válido</span></td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        
        content.innerHTML = `
            <div class="preview-view fade-in">
                <div class="data-preview-premium">
                    <h3>👁️ Preview dos Dados (${validData.length} de ${this.validationResults.valid.length})</h3>
                    ${tableHTML}
                </div>
            </div>
        `;
        
        // Update buttons
        this.container.querySelector('#btn-back').style.display = 'inline-block';
        const btnNext = this.container.querySelector('#btn-next');
        btnNext.style.display = 'inline-block';
        btnNext.textContent = 'Importar Dados →';
    }

    /**
     * Carregar view de importação (Passo 4)
     */
    loadImportView() {
        this.updateProgressSteps(4);
        
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="import-view fade-in">
                <div class="import-loading">
                    <div class="spinner"></div>
                    <p>Importando ${this.validationResults.valid.length} alunos...</p>
                </div>
            </div>
        `;
        
        // Hide buttons during import
        this.container.querySelector('#btn-back').style.display = 'none';
        this.container.querySelector('#btn-next').style.display = 'none';
        
        // Simulate import process
        setTimeout(() => this.processStudentImport(), 2000);
    }

    /**
     * Processar importação dos alunos
     */
    async processStudentImport() {
        try {
            console.log('🔄 Processando importação de alunos...');
            
            // Simular chamada API
            const results = {
                imported: this.validationResults.valid.length,
                skipped: this.validationResults.errors.length,
                total: this.uploadedData.data.length
            };

            this.showImportResults(results);
            
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            this.showError('Erro durante a importação: ' + error.message);
        }
    }

    /**
     * Exibir resultados da importação
     */
    showImportResults(results) {
        const content = this.container.querySelector('#import-content');
        content.innerHTML = `
            <div class="import-success fade-in">
                <div class="import-stats">
                    <div class="stat-card-import">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${results.imported}</div>
                        <div class="stat-label">Alunos Importados</div>
                    </div>
                    <div class="stat-card-import">
                        <div class="stat-icon">⏭️</div>
                        <div class="stat-value">${results.skipped}</div>
                        <div class="stat-label">Registros Ignorados</div>
                    </div>
                    <div class="stat-card-import">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${results.total}</div>
                        <div class="stat-label">Total Processado</div>
                    </div>
                </div>
                
                <div class="validation-message success">
                    <span>🎉</span>
                    Importação concluída com sucesso!
                </div>
                
                <div class="import-actions">
                    <button onclick="window.navigateTo ? window.navigateTo('students') : (window.location.hash = '#students')" class="btn-import-primary">
                        👥 Ver Alunos Importados
                    </button>
                    <button onclick="location.reload()" class="btn-import-secondary">
                        🔄 Nova Importação
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Exibir erro
     */
    showError(message) {
        const content = this.container.querySelector('#import-content');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message error';
        errorDiv.innerHTML = `<span>❌</span> ${message}`;
        content.appendChild(errorDiv);
    }

    /**
     * Limpar recursos
     */
    cleanup() {
        console.log('🧹 Limpando recursos do ImportController...');
        this.uploadedData = null;
        this.validationResults = null;
        this.previewData = null;
    }
}

export default ImportController;
