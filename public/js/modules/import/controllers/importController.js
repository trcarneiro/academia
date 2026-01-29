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
        this.activeTab = 'asaas'; // Aba ativa padrão
        this.moduleAPI = null;
        this.asaasCustomers = [];

        // Estados do workflow
        this.steps = {
            1: 'upload',
            2: 'validate',
            3: 'preview',
            4: 'import'
        };

        // Controle da aba Asaas
        this.asaasTabLoaded = false;
        this.asaasCustomers = [];

        this.onError = null; // Callback para erros
    }

    /**
     * Inicializar o controller
     */
    async init() {
        try {
            console.log('🎮 Inicializando ImportController...');

            await this.initializeAPI();
            this.setupMainStructure();
            this.setupEventListeners();
            this.setupTabSwitching(); // Configurar troca de abas
            await this.loadImportStats();

            // Renderizar aba ativa (CSV por padrão)
            this.loadCSVTab();

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
     * Inicializar API client
     */
    async initializeAPI() {
        if (typeof waitForAPIClient !== 'undefined') {
            await waitForAPIClient();
            this.moduleAPI = window.createModuleAPI('Import');
        }
    }

    /**
     * Carregar estatísticas de importações
     */
    async loadImportStats() {
        try {
            // Buscar histórico de importações (simulado por enquanto)
            // TODO: Implementar endpoint /api/imports/stats no backend
            const stats = {
                total: parseInt(localStorage.getItem('import_total') || '0'),
                successful: parseInt(localStorage.getItem('import_successful') || '0'),
                failed: parseInt(localStorage.getItem('import_failed') || '0')
            };

            this.updateStatsCards(stats);
        } catch (error) {
            console.warn('⚠️ Erro ao carregar stats de importação:', error);
            // Não bloquear a inicialização se stats falharem
        }
    }

    /**
     * Configurar troca de abas
     */
    setupTabSwitching() {
        const tabs = this.container.querySelectorAll('.import-tab');
        const csvContent = this.container.querySelector('#csv-tab-content');
        const asaasContent = this.container.querySelector('#asaas-tab-content');

        if (!tabs.length || !csvContent || !asaasContent) {
            console.warn('⚠️ Elementos de abas não encontrados');
            return;
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tab.addEventListener('click', async (e) => {
                    const targetTab = e.currentTarget.dataset.tab;

                    // Remover active de todas as abas
                    tabs.forEach(t => t.classList.remove('active'));
                    e.currentTarget.classList.add('active');

                    if (targetTab === 'asaas') {
                        this.activeTab = 'asaas';
                        csvContent.style.display = 'none';
                        asaasContent.style.display = 'block';

                        if (!this.asaasTabLoaded) {
                            await this.loadAsaasTab();
                            this.asaasTabLoaded = true;
                        }

                        console.log('💳 Aba Asaas ativa');
                    }
                });
            });
        }

    /**
     * Carregar conteúdo da aba Asaas
     */
    loadAsaasTab() {
            const asaasContent = this.container.querySelector('#asaas-tab-content');

            if(!asaasContent) {
                console.error('❌ Container da aba Asaas não encontrado');
                return;
            }

        asaasContent.innerHTML = `
            <div class="asaas-import-wrapper">
                <!-- Header da aba -->
                <div class="asaas-tab-header">
                    <h2>💳 Sincronização com Asaas</h2>
                    <p>Importe seus clientes do Asaas para o sistema</p>
                    <div id="connection-status" class="connection-status">
                        <span class="status-badge status-idle">⚪ Aguardando teste de conexão</span>
                    </div>
                </div>

                <!-- Default Course/Plan Selection -->
                <div class="asaas-settings-panel">
                    <h3>📚 Matrícula Automática (Opcional)</h3>
                    <p>Selecione um curso e plano para matricular automaticamente os novos alunos importados.</p>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="import-default-course">Curso Padrão</label>
                            <select id="import-default-course" class="form-select">
                                <option value="">Selecione um curso...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="import-default-plan">Plano Padrão</label>
                            <select id="import-default-plan" class="form-select" disabled>
                                <option value="">Selecione um curso primeiro...</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="asaas-stats-grid">
                    <div class="stat-card-asaas">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value" id="asaas-total-customers">-</div>
                        <div class="stat-label">Total no Asaas</div>
                    </div>
                    <div class="stat-card-asaas">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value" id="asaas-imported">-</div>
                        <div class="stat-label">Já Importados</div>
                    </div>
                    <div class="stat-card-asaas">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-value" id="asaas-pending">-</div>
                        <div class="stat-label">Pendentes</div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="asaas-actions">
                    <button id="btn-test-connection" class="btn-import-secondary">
                        🔌 Testar Conexão
                    </button>
                    <button id="btn-fetch-asaas" class="btn-import-primary">
                        🔄 Buscar Clientes do Asaas
                    </button>
                    <button id="btn-import-all-asaas" class="btn-import-success" style="display: none;">
                        📥 Importar Todos Pendentes
                    </button>
                    <button id="btn-clean-duplicates" class="btn-import-warning" style="display: none;">
                        🧹 Limpar Duplicatas
                    </button>
                </div>

                <!-- Customers Container -->
                <div id="asaas-customers-container" style="display: none;">
                    <!-- Filters -->
                    <div class="asaas-filters">
                        <input 
                            type="text" 
                            id="search-asaas-customers" 
                            placeholder="🔍 Buscar por nome ou email..."
                            class="filter-input"
                        />
                        <select id="filter-asaas-status" class="filter-select">
                            <option value="all">Todos</option>
                            <option value="pending">Pendentes</option>
                            <option value="imported">Importados</option>
                        </select>
                    </div>

                    <!-- Customer List -->
                    <div id="asaas-customers-list" class="asaas-customers-list">
                        <!-- Será preenchido dinamicamente -->
                    </div>
                </div>

                <!-- Import Results -->
                <div id="asaas-import-results" class="import-results" style="display: none;">
                    <h3>📊 Resultados da Importação</h3>
                    <div id="asaas-results-content"></div>
                </div>
            </div>
        `;

            // Configurar eventos da aba Asaas
            this.setupAsaasEvents();

            // Configurar event listeners dos botões
            const btnTest = this.container.querySelector('#btn-test-connection');
            const btnFetch = this.container.querySelector('#btn-fetch-asaas');
            const btnImportAll = this.container.querySelector('#btn-import-all-asaas');
            const btnClean = this.container.querySelector('#btn-clean-duplicates');

            if(btnTest) {
                btnTest.addEventListener('click', () => this.testAsaasConnection());
            }

        if(btnFetch) {
                btnFetch.addEventListener('click', () => this.fetchAsaasCustomers());
            }

        if(btnImportAll) {
                btnImportAll.addEventListener('click', () => this.importAllAsaas());
            }

        if(btnClean) {
                btnClean.addEventListener('click', () => this.cleanDuplicates());
            }

        console.log('✅ Aba Asaas carregada');
        }

    /**
     * Atualizar cards de estatísticas
     */
    updateStatsCards(stats) {
            const totalEl = this.container.querySelector('#stat-total-imports');
            const successEl = this.container.querySelector('#stat-successful');
            const failedEl = this.container.querySelector('#stat-failed');

            if(totalEl) totalEl.textContent = stats.total || 0;
            if(successEl) successEl.textContent = stats.successful || 0;
            if(failedEl) failedEl.textContent = stats.failed || 0;
        }

    /**
     * Configurar estrutura principal do módulo
     */
    setupMainStructure() {
            this.container.innerHTML = `
            <div class="module-isolated-import">
                <!-- Header Premium -->
                <div class="import-header-premium">
                    <h1>📥 Central de Importação</h1>
                    <nav class="breadcrumb">
                        <span>Home</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-current">Importação</span>
                    </nav>
                </div>

                <!-- Navegação de Abas -->
                <div class="import-tabs">
                    <button class="import-tab active" data-tab="csv">
                        � Importar CSV
                    </button>
                    <button class="import-tab" data-tab="asaas">
                        💳 Sincronizar Asaas
                    </button>
                </div>

                <!-- Conteúdo Aba CSV -->
                <div id="csv-tab-content" class="tab-content active">
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced stat-gradient-primary">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-total">0</div>
                                <div class="stat-label">Total Importações</div>
                            </div>
                        </div>
                        
                        <div class="stat-card-enhanced stat-gradient-success">
                            <div class="stat-icon">✅</div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-successful">0</div>
                                <div class="stat-label">Sucesso</div>
                            </div>
                        </div>
                        
                        <div class="stat-card-enhanced stat-gradient-danger">
                            <div class="stat-icon">❌</div>
                            <div class="stat-content">
                                <div class="stat-value" id="stat-failed">0</div>
                                <div class="stat-label">Erros</div>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Steps -->
                    <div class="progress-steps">
                        <div class="progress-step active" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Upload</div>
                        </div>
                        <div class="progress-step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Validação</div>
                        </div>
                        <div class="progress-step" data-step="3">
                            <div class="step-number">3</div>
                            <div class="step-label">Preview</div>
                        </div>
                        <div class="progress-step" data-step="4">
                            <div class="step-number">4</div>
                            <div class="step-label">Importação</div>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div id="import-content" class="import-content">
                        <!-- Conteúdo dinâmico será renderizado aqui -->
                    </div>

                    <!-- Action Buttons -->
                    <div class="import-actions">
                        <button id="btn-cancel" class="btn-import-secondary" style="display: none;">
                            ❌ Cancelar
                        </button>
                        <button id="btn-back" class="btn-import-secondary" style="display: none;">
                            ⬅️ Voltar
                        </button>
                        <button id="btn-next" class="btn-import-primary" style="display: none;">
                            Próximo ➡️
                        </button>
                        <button id="btn-import" class="btn-import-success" style="display: none;">
                            ✅ Confirmar Importação
                        </button>
                    </div>
                </div>

                <!-- Conteúdo Aba Asaas -->
                <div id="asaas-tab-content" class="tab-content" style="display: none;">
                    <!-- Será carregado dinamicamente pelo loadAsaasTab() -->
                </div>
            </div>
        `;
        }
    /**
     * Carregar aba CSV (upload de arquivo)
     */
    loadCSVTab() {
            const content = this.container.querySelector('#import-content');

            if(!content) {
                console.warn('⚠️ Container #import-content não encontrado');
                return;
            }

        // Renderizar view de upload
        this.renderUploadView();
        }

    /**
     * Renderizar view de upload de arquivo CSV
     */
    renderUploadView() {
            const content = this.container.querySelector('#import-content');
            // Content already rendered by lines 519-570
            // Removing duplicate/corrupted HTML block

            // Content cleaned up

            // Content already handled


            // Configurar eventos da aba Asaas
            this.setupAsaasEvents();
            console.log('✅ Aba Asaas carregada');
        }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
            // Botão Voltar
            const btnBack = this.container.querySelector('#btn-back');
            if(btnBack) {
                btnBack.addEventListener('click', () => this.previousStep());
            }

        // Botão Próximo
        const btnNext = this.container.querySelector('#btn-next');
            if(btnNext) {
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
                    <input type="file" id="file-input" class="file-input-hidden" accept=".json,.csv" />
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
                    <p>Processando arquivo...</p>
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

            } catch(error) {
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
            if(lines.length < 2) {
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
            < div class="validation-view fade-in" >
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
            </div >
            `;

        // Run validation
        setTimeout(() => this.runValidation(), 1000);

        // Show back button
        this.container.querySelector('#btn-back').style.display = 'inline-block';
    }

    /**
     * Carregar cursos disponíveis para o dropdown
     */
    async loadAvailableCourses() {
        try {
            const courseSelect = this.container.querySelector('#import-default-course');
            const planSelect = this.container.querySelector('#import-default-plan');

            if (!courseSelect) return;

            // Fetch courses
            const response = await fetch('/api/courses');
            const result = await response.json();

            if (result.success && result.data) {
                // Clear and populate
                courseSelect.innerHTML = '<option value="">Selecione um curso...</option>';

                result.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    courseSelect.appendChild(option);
                });

                // Add change listener
                courseSelect.addEventListener('change', (e) => {
                    const courseId = e.target.value;
                    if (courseId) {
                        this.loadPlansForCourse(courseId);
                        planSelect.disabled = false;
                    } else {
                        planSelect.innerHTML = '<option value="">Selecione um curso primeiro...</option>';
                        planSelect.disabled = true;
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
        }
    }

    /**
     * Carregar planos para um curso específico
     */
    async loadPlansForCourse(courseId) {
        try {
            const planSelect = this.container.querySelector('#import-default-plan');
            if (!planSelect) return;

            planSelect.innerHTML = '<option value="">Carregando planos...</option>';
            planSelect.disabled = true;

            // Fetch plans for course
            const response = await fetch(`/api/courses/${courseId}/plans`);
            const result = await response.json();

            if (result.success && result.data) {
                planSelect.innerHTML = '<option value="">Selecione um plano...</option>';

                if (result.data.length === 0) {
                    planSelect.innerHTML = '<option value="">Nenhum plano disponível</option>';
                } else {
                    result.data.forEach(plan => {
                        const option = document.createElement('option');
                        option.value = plan.id;
                        option.textContent = `${plan.name} - ${plan.price ? 'R$ ' + plan.price : 'Grátis'}`;
                        planSelect.appendChild(option);
                    });
                }

                planSelect.disabled = false;
            } else {
                planSelect.innerHTML = '<option value="">Erro ao carregar planos</option>';
            }
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
            const planSelect = this.container.querySelector('#import-default-plan');
            if (planSelect) planSelect.innerHTML = '<option value="">Erro ao carregar planos</option>';
        }
    }

    // Existing methods...
    /**
     * Parse validação dos dados
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
            < div class="validation-message success" >
                <span>✅</span>
                    ${this.validationResults.valid.length} registros válidos encontrados
                </div >
            `;
        }

        // Error messages
        if (this.validationResults.errors.length > 0) {
            resultsHTML += `
            < div class="validation-message error" >
                <span>❌</span>
                    ${this.validationResults.errors.length} registros com problemas encontrados
                </div >
            `;

            // Show first few errors
            const maxErrors = Math.min(5, this.validationResults.errors.length);
            for (let i = 0; i < maxErrors; i++) {
                const error = this.validationResults.errors[i];
                resultsHTML += `
            < div class="validation-message warning" >
                <span>⚠️</span>
                        Linha ${error.line}: ${error.errors.join(', ')}
                    </div >
            `;
            }

            if (this.validationResults.errors.length > 5) {
                resultsHTML += `
            < div class="validation-message warning" >
                <span>📝</span>
                        E mais ${this.validationResults.errors.length - 5} erros...
                    </div >
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
            < table class="preview-table" >
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

        tableHTML += '</tbody></table > ';

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
        // Atualizar estatísticas persistentes
        const totalImports = parseInt(localStorage.getItem('import_total') || '0') + 1;
        const successful = parseInt(localStorage.getItem('import_successful') || '0') + (results.imported > 0 ? 1 : 0);
        const failed = parseInt(localStorage.getItem('import_failed') || '0') + (results.skipped > 0 ? 1 : 0);

        localStorage.setItem('import_total', totalImports.toString());
        localStorage.setItem('import_successful', successful.toString());
        localStorage.setItem('import_failed', failed.toString());

        // Atualizar cards imediatamente
        this.updateStatsCards({ total: totalImports, successful, failed });

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

    // ==========================================
    // MÉTODOS PARA ABA ASAAS
    // ==========================================

    /**
     * Setup eventos da aba Asaas
     */
    setupAsaasEvents() {
        // Event listeners dos botões principais
        const btnTest = this.container.querySelector('#btn-test-connection');
        const btnFetch = this.container.querySelector('#btn-fetch-asaas');
        const btnImportAll = this.container.querySelector('#btn-import-all-asaas');
        const btnClean = this.container.querySelector('#btn-clean-duplicates');

        if (btnTest) {
            btnTest.addEventListener('click', () => this.testAsaasConnection());
        }

        if (btnFetch) {
            btnFetch.addEventListener('click', () => this.fetchAsaasCustomers());
        }

        if (btnImportAll) {
            btnImportAll.addEventListener('click', () => this.importAllAsaas());
        }

        if (btnClean) {
            btnClean.addEventListener('click', () => this.cleanDuplicates());
        }

        // Busca em tempo real
        const searchInput = this.container.querySelector('#search-asaas-customers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAsaasCustomers(e.target.value);
            });
        }

        // Filtro de status
        const filterStatus = this.container.querySelector('#filter-asaas-status');
        filterStatus.addEventListener('change', (e) => {
            this.filterAsaasByStatus(e.target.value);
        });
    }

        // Carregar cursos disponíveis
        this.loadAvailableCourses();
    }

    /**
     * Testar conexão com Asaas
     */
    async testAsaasConnection() {
    try {
        const statusEl = document.getElementById('connection-status');
        statusEl.innerHTML = '<span class="status-badge status-loading">⏳ Testando conexão...</span>';

        const response = await this.moduleAPI.request('/api/asaas/test', {
            method: 'GET'
        });

        if (response.success) {
            statusEl.innerHTML = '<span class="status-badge status-success">✅ Conexão OK</span>';
            this.showNotification('Conexão com Asaas estabelecida!', 'success');
        } else {
            throw new Error(response.message || 'Falha na conexão');
        }

    } catch (error) {
        const statusEl = document.getElementById('connection-status');
        statusEl.innerHTML = '<span class="status-badge status-error">❌ Conexão falhou</span>';
        this.showNotification(`Erro: ${error.message}`, 'error');
    }
}

    /**
     * Buscar clientes do Asaas
     */
    async fetchAsaasCustomers() {
    try {
        const btn = document.getElementById('btn-fetch-asaas');
        btn.disabled = true;
        btn.innerHTML = '⏳ Buscando...';

        const response = await this.moduleAPI.request('/api/asaas/customers', {
            method: 'GET'
        });

        if (response.success && response.data) {
            this.asaasCustomers = response.data.data || [];

            // Atualizar stats
            document.getElementById('asaas-total-customers').textContent = this.asaasCustomers.length;

            // Verificar quais já foram importados
            await this.checkImportedAsaasCustomers();

            // Renderizar lista
            this.renderAsaasCustomersList();

            // Mostrar botões
            document.getElementById('btn-import-all-asaas').style.display = 'inline-block';
            document.getElementById('btn-clean-duplicates').style.display = 'inline-block';
            document.getElementById('asaas-customers-container').style.display = 'block';

            this.showNotification(`${this.asaasCustomers.length} clientes encontrados!`, 'success');
        } else {
            throw new Error(response.message || 'Falha ao buscar clientes');
        }

    } catch (error) {
        this.showNotification(`Erro: ${error.message}`, 'error');
    } finally {
        const btn = document.getElementById('btn-fetch-asaas');
        btn.disabled = false;
        btn.innerHTML = '🔄 Buscar Clientes do Asaas';
    }
}

    /**
     * Verificar clientes já importados
     */
    async checkImportedAsaasCustomers() {
    try {
        const response = await this.moduleAPI.request('/api/students', {
            method: 'GET'
        });

        if (response.success && response.data) {
            const existingEmails = new Set(
                response.data.map(s => s.user?.email?.toLowerCase()).filter(Boolean)
            );

            // Marcar clientes que já existem
            this.asaasCustomers.forEach(customer => {
                customer.isImported = existingEmails.has(customer.email?.toLowerCase());
            });

            // Atualizar stats
            const imported = this.asaasCustomers.filter(c => c.isImported).length;
            const pending = this.asaasCustomers.length - imported;

            document.getElementById('asaas-imported').textContent = imported;
            document.getElementById('asaas-pending').textContent = pending;
        }

    } catch (error) {
        console.error('Erro ao verificar clientes importados:', error);
    }
}

/**
 * Renderizar lista de clientes Asaas
 */
renderAsaasCustomersList() {
    const container = document.getElementById('asaas-customers-list');

    if (this.asaasCustomers.length === 0) {
        container.innerHTML = `
                <div class="empty-state-asaas">
                    <div class="empty-icon">📭</div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Não há clientes no Asaas para importar</p>
                </div>
            `;
        return;
    }

    const html = this.asaasCustomers.map(customer => `
            <div class="customer-card-asaas ${customer.isImported ? 'imported' : ''}" data-email="${customer.email || ''}">
                <div class="customer-info">
                    <div class="customer-name">
                        ${customer.name || 'Nome não informado'}
                        ${customer.isImported ? '<span class="badge-imported">✅ Importado</span>' : ''}
                    </div>
                    <div class="customer-email">
                        📧 ${customer.email || 'Email não informado'}
                    </div>
                    <div class="customer-details">
                        <span>📱 ${customer.phone || 'N/A'}</span>
                        <span>📄 ${customer.cpfCnpj || 'N/A'}</span>
                        <span>🆔 ${customer.id}</span>
                    </div>
                </div>
                <div class="customer-actions">
                    ${!customer.isImported ? `
                        <button 
                            class="btn-import-single" 
                            onclick="window.import.controller.importSingleAsaas('${customer.id}')"
                            ${!customer.email ? 'disabled title="Email não informado"' : ''}>
                            📥 Importar
                        </button>
                    ` : `
                        <span class="text-success">✓ Já está no sistema</span>
                    `}
                </div>
            </div>
        `).join('');

    container.innerHTML = html;
}

/**
 * Filtrar clientes por busca
 */
filterAsaasCustomers(searchTerm) {
    const cards = document.querySelectorAll('.customer-card-asaas');
    const term = searchTerm.toLowerCase();

    cards.forEach(card => {
        const name = card.querySelector('.customer-name').textContent.toLowerCase();
        const email = card.querySelector('.customer-email').textContent.toLowerCase();

        if (name.includes(term) || email.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Filtrar por status
 */
filterAsaasByStatus(status) {
    const cards = document.querySelectorAll('.customer-card-asaas');

    cards.forEach(card => {
        const isImported = card.classList.contains('imported');

        if (status === 'all') {
            card.style.display = 'flex';
        } else if (status === 'imported' && isImported) {
            card.style.display = 'flex';
        } else if (status === 'pending' && !isImported) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

    /**
     * Importar cliente individual
     */
    async importSingleAsaas(customerId) {
    try {
        const customer = this.asaasCustomers.find(c => c.id === customerId);
        if (!customer) {
            throw new Error('Cliente não encontrado');
        }

        this.showNotification(`Importando ${customer.name}...`, 'info');

        // Get default course/plan
        const defaultCourseId = this.container.querySelector('#import-default-course')?.value;
        const defaultPlanId = this.container.querySelector('#import-default-plan')?.value;

        const response = await this.moduleAPI.request('/api/asaas/import-customer', {
            method: 'POST',
            body: JSON.stringify({
                customerId,
                defaultCourseId: defaultCourseId || undefined,
                defaultPlanId: defaultPlanId || undefined
            })
        });

        if (response.success) {
            customer.isImported = true;
            this.renderAsaasCustomersList();
            await this.checkImportedAsaasCustomers();
            this.showNotification(`${customer.name} importado com sucesso!`, 'success');
        } else {
            throw new Error(response.message || 'Falha na importação');
        }

    } catch (error) {
        this.showNotification(`Erro: ${error.message}`, 'error');
    }
}

    /**
     * Importar todos os clientes pendentes
     */
    async importAllAsaas() {
    try {
        const pending = this.asaasCustomers.filter(c => !c.isImported && c.email);

        if (pending.length === 0) {
            this.showNotification('Não há clientes pendentes para importar', 'warning');
            return;
        }

        const confirmed = confirm(`Importar ${pending.length} clientes do Asaas?\n\nApós a importação, duplicatas serão automaticamente removidas.`);
        if (!confirmed) return;

        const btn = document.getElementById('btn-import-all-asaas');
        btn.disabled = true;
        btn.innerHTML = '⏳ Importando...';

        // Get default course/plan
        const defaultCourseId = this.container.querySelector('#import-default-course')?.value;
        const defaultPlanId = this.container.querySelector('#import-default-plan')?.value;

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Importar em lote
        // Se tiver API de batch real, usar ela. Se não, loop.
        // Para batch, enviamos o array de IDs E os defaults
        try {
            const response = await this.moduleAPI.request('/api/asaas/import-batch', {
                method: 'POST',
                body: JSON.stringify({
                    customerIds: pending.map(c => c.id),
                    defaultCourseId: defaultCourseId || undefined,
                    defaultPlanId: defaultPlanId || undefined
                })
            });

            if (response.success && response.data) {
                results.success = response.data.success;
                results.failed = response.data.failed;
                results.errors = response.data.errors;

                // Mark as imported locally
                if (results.success > 0) {
                    // We don't know exactly which ones failed without more detail, 
                    // but we can assume success for now or re-fetch.
                    // Re-fetching is safer.
                }
            } else {
                throw new Error(response.message || 'Falha na importação em lote');
            }
        } catch (batchError) {
            // Fallback to individual import if batch fails or not implemented
            console.warn('Batch import failed or not available, falling back to individual:', batchError);

            for (let i = 0; i < pending.length; i++) {
                const customer = pending[i];

                try {
                    const response = await this.moduleAPI.request('/api/asaas/import-customer', {
                        method: 'POST',
                        body: JSON.stringify({
                            customerId: customer.id,
                            defaultCourseId: defaultCourseId || undefined,
                            defaultPlanId: defaultPlanId || undefined
                        })
                    });

                    if (response.success) {
                        results.success++;
                        customer.isImported = true;
                    } else {
                        results.failed++;
                        results.errors.push(`${customer.name}: ${response.message}`);
                    }

                } catch (error) {
                    results.failed++;
                    results.errors.push(`${customer.name}: ${error.message}`);
                }

                // Atualizar progresso
                btn.innerHTML = `⏳ Importando... ${i + 1}/${pending.length}`;
            }
        }

        // Limpar duplicatas automaticamente
        if (results.success > 0) {
            btn.innerHTML = '🧹 Limpando duplicatas...';
            await this.cleanDuplicates();
        }

        // Mostrar resultados
        this.showAsaasImportResults(results);
        this.renderAsaasCustomersList();
        await this.checkImportedAsaasCustomers();

    } catch (error) {
        this.showNotification(`Erro na importação: ${error.message}`, 'error');
    } finally {
        const btn = document.getElementById('btn-import-all-asaas');
        btn.disabled = false;
        btn.innerHTML = '📥 Importar Todos Pendentes';
    }
}

    /**
     * Limpar duplicatas
     */
    async cleanDuplicates() {
    try {
        this.showNotification('Verificando duplicatas...', 'info');

        // Buscar duplicatas
        const response = await this.moduleAPI.request('/api/students/check-duplicates', {
            method: 'GET'
        });

        if (response.success && response.data) {
            const { duplicates, total } = response.data;

            if (duplicates === 0) {
                this.showNotification('Nenhuma duplicata encontrada!', 'success');
                return;
            }

            const confirmed = confirm(`Encontradas ${duplicates} duplicatas de ${total} alunos.\n\nDeseja removê-las? (Será mantido o registro mais recente)`);
            if (!confirmed) return;

            // Remover duplicatas
            const removeResponse = await this.moduleAPI.request('/api/students/remove-duplicates', {
                method: 'DELETE'
            });

            if (removeResponse.success) {
                this.showNotification(`${removeResponse.data.removed} duplicatas removidas com sucesso!`, 'success');

                // Atualizar lista
                await this.checkImportedAsaasCustomers();
            } else {
                throw new Error(removeResponse.message || 'Falha ao remover duplicatas');
            }
        }

    } catch (error) {
        this.showNotification(`Erro ao limpar duplicatas: ${error.message}`, 'error');
    }
}

/**
 * Mostrar resultados da importação Asaas
 */
showAsaasImportResults(results) {
    const container = document.getElementById('asaas-import-results');
    const content = document.getElementById('asaas-results-content');

    const html = `
            <div class="results-summary">
                <div class="result-stat result-success">
                    <div class="result-icon">✅</div>
                    <div class="result-info">
                        <div class="result-value">${results.success}</div>
                        <div class="result-label">Importados com sucesso</div>
                    </div>
                </div>

                <div class="result-stat result-failed">
                    <div class="result-icon">❌</div>
                    <div class="result-info">
                        <div class="result-value">${results.failed}</div>
                        <div class="result-label">Falharam</div>
                    </div>
                </div>
            </div>

            ${results.errors.length > 0 ? `
                <div class="errors-list">
                    <h3>⚠️ Erros Encontrados:</h3>
                    <ul>
                        ${results.errors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

    content.innerHTML = html;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Mostrar notificação
 */
showNotification(message, type = 'info') {
    if (window.app && window.app.showNotification) {
        window.app.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Fallback: alert para mensagens importantes
        if (type === 'error' || type === 'warning') {
            alert(message);
        }
    }
}
}

export default ImportController;

