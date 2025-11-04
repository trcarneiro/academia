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
                    <h3>📋 Formatos Suportados</h3>
                    <div class="format-tabs">
                        <div class="format-tab active" data-format="sistema">
                            <h4>🎓 Formato Padrão</h4>
                            <p>Campos: nome, email, telefone, documento, endereco, valor_mensalidade</p>
                        </div>
                        <div class="format-tab" data-format="asaas">
                            <h4>💳 Formato Asaas</h4>
                            <p>Importação direta de exportações do Asaas (mapeamento automático)</p>
                        </div>
                    </div>
                    
                    <div class="format-details active" data-format="sistema">
                        <p><strong>📋 Formato Padrão do Sistema:</strong></p>
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
                    
                    <div class="format-details" data-format="asaas">
                        <p><strong>💳 Formato Asaas (Detecção Automática):</strong></p>
                        <ul>
                            <li><strong>Nome</strong> → mapeado para <code>nome</code></li>
                            <li><strong>Email</strong> → mapeado para <code>email</code></li>
                            <li><strong>Celular</strong> → mapeado para <code>telefone</code></li>
                            <li><strong>CPF ou CNPJ</strong> → mapeado para <code>documento</code></li>
                            <li><strong>Rua + Número + Bairro + Cidade</strong> → concatenado em <code>endereco</code></li>
                            <li><strong>Valor a vencer</strong> → processado para <code>valor_mensalidade</code></li>
                        </ul>
                        <p class="format-note">✨ O sistema detecta automaticamente o formato e faz a conversão!</p>
                    </div>
                </div>
            </div>
        `;

        // Setup upload functionality
        this.setupUploadArea();
        
        // Setup format tabs
        this.setupFormatTabs();
        
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

        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        const data = [];

        // Detectar formato (Asaas vs Padrão)
        const formatType = this.detectCSVFormat(headers);
        console.log('🔍 Formato detectado:', formatType);

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim().replace(/['"]/g, '') : '';
            });
            
            // Aplicar mapeamento se necessário
            const mappedRow = this.mapRowToStandardFormat(row, formatType);
            data.push(mappedRow);
        }

        return data;
    }

    /**
     * Parse mais robusto de linha CSV (lida com vírgulas dentro de aspas)
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current); // Último valor
        return values;
    }

    /**
     * Detectar formato do CSV
     */
    detectCSVFormat(headers) {
        const asaasFields = ['Nome', 'Email', 'Celular', 'CPF ou CNPJ', 'Rua', 'Número', 'Bairro', 'Cidade', 'Valor a vencer'];
        const standardFields = ['nome', 'email', 'telefone', 'documento', 'endereco', 'valor_mensalidade'];
        
        const asaasMatches = asaasFields.filter(field => headers.includes(field)).length;
        const standardMatches = standardFields.filter(field => headers.includes(field)).length;
        
        if (asaasMatches >= 5) {
            return 'asaas';
        } else if (standardMatches >= 3) {
            return 'standard';
        } else {
            return 'unknown';
        }
    }

    /**
     * Mapear linha para formato padrão
     */
    mapRowToStandardFormat(row, formatType) {
        if (formatType === 'asaas') {
            return this.mapAsaasToStandard(row);
        } else if (formatType === 'standard') {
            return row; // Já está no formato correto
        } else {
            // Tentar mapeamento inteligente
            return this.smartMapping(row);
        }
    }

    /**
     * Mapear formato Asaas para padrão
     */
    mapAsaasToStandard(asaasRow) {
        // Construir endereço completo
        const enderecoPartes = [
            asaasRow['Rua'],
            asaasRow['Número'],
            asaasRow['Complemento'],
            asaasRow['Bairro'],
            asaasRow['Cidade'],
            asaasRow['CEP'],
            asaasRow['Estado']
        ].filter(parte => parte && parte.trim() && parte.trim() !== '');
        
        const endereco = enderecoPartes.join(', ');

        // Limpar valor monetário
        let valorMensalidade = '0';
        if (asaasRow['Valor a vencer']) {
            valorMensalidade = asaasRow['Valor a vencer']
                .replace(/[R$\s]/g, '')
                .replace(',', '.')
                .trim();
        }

        // Telefone: priorizar celular, depois fone
        const telefone = asaasRow['Celular'] || asaasRow['Fone'] || '';

        return {
            nome: asaasRow['Nome'] || '',
            email: asaasRow['Email'] || '',
            telefone: telefone,
            documento: asaasRow['CPF ou CNPJ'] || '',
            endereco: endereco,
            valor_mensalidade: valorMensalidade,
            empresa: asaasRow['Empresa'] || '',
            // Campos extras do Asaas para referência
            _original_identificador: asaasRow['Identificador externo'] || '',
            _original_valor_vencido: asaasRow['Valor vencido'] || '',
            _original_valor_pago: asaasRow['Valor pago'] || ''
        };
    }

    /**
     * Mapeamento inteligente para formatos desconhecidos
     */
    smartMapping(row) {
        const mapped = {};
        
        // Mapear campos comuns
        Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            
            if (lowerKey.includes('nome') || lowerKey.includes('name')) {
                mapped.nome = row[key];
            } else if (lowerKey.includes('email') || lowerKey.includes('e-mail')) {
                mapped.email = row[key];
            } else if (lowerKey.includes('telefone') || lowerKey.includes('celular') || lowerKey.includes('phone')) {
                mapped.telefone = row[key];
            } else if (lowerKey.includes('cpf') || lowerKey.includes('cnpj') || lowerKey.includes('documento')) {
                mapped.documento = row[key];
            } else if (lowerKey.includes('endereco') || lowerKey.includes('address') || lowerKey.includes('rua')) {
                mapped.endereco = row[key];
            } else if (lowerKey.includes('valor') || lowerKey.includes('mensalidade') || lowerKey.includes('price')) {
                mapped.valor_mensalidade = row[key];
            }
        });
        
        return { ...row, ...mapped }; // Manter campos originais + mapeados
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
            
            // Validações básicas para campos obrigatórios
            if (!row.nome || row.nome.length < 2) {
                rowErrors.push('Nome inválido ou muito curto');
            }
            
            // Email é opcional, mas se fornecido deve ser válido
            if (row.email && !this.isValidEmail(row.email)) {
                rowErrors.push('Email em formato inválido');
            }
            
            // Validação de telefone (opcional mas se existir deve ser válido)
            if (row.telefone && !this.isValidPhone(row.telefone)) {
                rowErrors.push('Telefone em formato inválido');
            }
            
            // Validação de CPF/CNPJ (opcional mas se existir deve ser válido)
            if (row.documento && !this.isValidDocument(row.documento)) {
                rowErrors.push('CPF/CNPJ em formato inválido');
            }
            
            // Validação de valor monetário
            if (row.valor_mensalidade && !this.isValidMonetary(row.valor_mensalidade)) {
                rowErrors.push('Valor da mensalidade inválido');
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
     * Validar email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar telefone brasileiro
     */
    isValidPhone(phone) {
        // Remove caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        // Aceita formatos: 11987654321, 1187654321, 87654321
        return cleanPhone.length >= 8 && cleanPhone.length <= 11;
    }

    /**
     * Validar CPF/CNPJ
     */
    isValidDocument(doc) {
        const cleanDoc = doc.replace(/\D/g, '');
        return cleanDoc.length === 11 || cleanDoc.length === 14; // CPF ou CNPJ
    }

    /**
     * Validar valor monetário
     */
    isValidMonetary(value) {
        const cleanValue = value.toString().replace(/[R$\s]/g, '').replace(',', '.');
        return !isNaN(parseFloat(cleanValue)) && isFinite(cleanValue);
    }

    /**
     * Setup format tabs
     */
    setupFormatTabs() {
        const formatTabs = this.container.querySelectorAll('.format-tab');
        const formatDetails = this.container.querySelectorAll('.format-details');

        formatTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const format = tab.dataset.format;
                
                // Update active tab
                formatTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active details
                formatDetails.forEach(detail => {
                    detail.classList.remove('active');
                    if (detail.dataset.format === format) {
                        detail.classList.add('active');
                    }
                });
            });
        });
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
            console.log('📊 Dados válidos para importação:', this.validationResults.valid);
            
            // Fazer chamada real para API
            const response = await fetch('/api/students/bulk-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    students: this.validationResults.valid
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiResult = await response.json();
            console.log('✅ Resposta da API:', apiResult);

            if (!apiResult.success) {
                throw new Error(apiResult.message || 'Erro na importação');
            }

            // Usar resultados reais da API
            const results = {
                imported: apiResult.data.imported,
                skipped: apiResult.data.skipped,
                total: apiResult.data.total,
                errors: apiResult.data.errors || []
            };

            this.showImportResults(results);
            
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            this.showError('Erro durante a importação: ' + error.message);
            
            // Voltar para a view de preview
            this.loadPreviewView();
        }
    }

    /**
     * Exibir resultados da importação
     */
    showImportResults(results) {
        const content = this.container.querySelector('#import-content');
        
        // Determinar tipo de mensagem
        const hasErrors = results.skipped > 0;
        const messageClass = hasErrors ? 'warning' : 'success';
        const messageIcon = hasErrors ? '⚠️' : '🎉';
        const messageText = hasErrors ? 
            `Importação concluída com ${results.skipped} registro(s) ignorado(s)` :
            'Importação concluída com sucesso!';

        // Construir HTML dos erros
        let errorsHTML = '';
        if (results.errors && results.errors.length > 0) {
            errorsHTML = `
                <div class="import-errors">
                    <h4>⚠️ Detalhes dos Erros:</h4>
                    <ul class="error-list">
                        ${results.errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                        ${results.errors.length > 10 ? `<li><em>... e mais ${results.errors.length - 10} erro(s)</em></li>` : ''}
                    </ul>
                </div>
            `;
        }

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
                
                <div class="validation-message ${messageClass}">
                    <span>${messageIcon}</span>
                    ${messageText}
                </div>
                
                ${errorsHTML}
                
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
