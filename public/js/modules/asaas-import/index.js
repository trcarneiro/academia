/**
 * Asaas Import Module
 * Importação e sincronização de clientes do Asaas
 * 
 * @version 1.0.0
 * @follows AGENTS.md v2.2.0
 */

// Prevenir re-declaração
if (typeof window.AsaasImportModule !== 'undefined') {
    console.log('AsaasImportModule já carregado');
} else {

const AsaasImportModule = {
    container: null,
    moduleAPI: null,
    customers: [],
    importResults: null,
    isImporting: false,

    /**
     * Inicializar módulo
     */
    async init(container) {
        try {
            console.log('🚀 Inicializando AsaasImportModule...');
            
            this.container = container || document.getElementById('main-content');
            
            if (!this.container) {
                throw new Error('Container não fornecido');
            }

            await this.initializeAPI();
            this.render();
            this.setupEvents();

            // Registrar globalmente
            window.asaasImport = this;
            
            // Emitir evento para app
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'asaas-import' });
            }

            console.log('✅ AsaasImportModule inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar AsaasImportModule:', error);
            this.showError(error);
        }
    },

    /**
     * Configurar API client
     */
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('AsaasImport');
    },

    /**
     * Renderizar interface
     */
    render() {
        this.container.innerHTML = `
            <div class="module-isolated-asaas-import">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="breadcrumb">
                            <span>Academia</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-current">Importação Asaas</span>
                        </div>
                        <h1>💳 Sincronização Asaas</h1>
                        <p class="header-subtitle">Importe clientes do Asaas para o sistema</p>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid-asaas">
                    <div class="stat-card-enhanced stat-gradient-primary">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-value" id="asaas-total-customers">-</div>
                            <div class="stat-label">Clientes no Asaas</div>
                        </div>
                    </div>
                    
                    <div class="stat-card-enhanced stat-gradient-success">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <div class="stat-value" id="asaas-imported">-</div>
                            <div class="stat-label">Já Importados</div>
                        </div>
                    </div>
                    
                    <div class="stat-card-enhanced stat-gradient-warning">
                        <div class="stat-icon">📥</div>
                        <div class="stat-info">
                            <div class="stat-value" id="asaas-pending">-</div>
                            <div class="stat-label">Pendentes</div>
                        </div>
                    </div>
                </div>

                <!-- Ações Principais -->
                <div class="data-card-premium">
                    <div class="asaas-actions-section">
                        <div class="action-buttons">
                            <button 
                                id="btn-fetch-customers" 
                                class="btn-asaas-primary"
                                onclick="window.asaasImport.fetchCustomers()">
                                🔄 Buscar Clientes do Asaas
                            </button>
                            
                            <button 
                                id="btn-import-all" 
                                class="btn-asaas-success"
                                style="display: none;"
                                onclick="window.asaasImport.importAll()">
                                📥 Importar Todos
                            </button>

                            <button 
                                id="btn-test-connection" 
                                class="btn-asaas-secondary"
                                onclick="window.asaasImport.testConnection()">
                                🔌 Testar Conexão
                            </button>
                        </div>

                        <div class="connection-status" id="connection-status">
                            <span class="status-badge status-unknown">⚪ Status desconhecido</span>
                        </div>
                    </div>
                </div>

                <!-- Lista de Clientes -->
                <div class="data-card-premium" id="customers-container" style="display: none;">
                    <div class="card-header">
                        <h2>📋 Clientes do Asaas</h2>
                        <div class="filters-asaas">
                            <input 
                                type="text" 
                                id="search-customers" 
                                placeholder="🔍 Buscar por nome ou email..."
                                class="input-search-asaas">
                            
                            <select id="filter-status" class="select-filter-asaas">
                                <option value="all">Todos</option>
                                <option value="pending">Pendentes</option>
                                <option value="imported">Já Importados</option>
                            </select>
                        </div>
                    </div>

                    <div id="customers-list" class="customers-list-asaas">
                        <!-- Lista será renderizada aqui -->
                    </div>
                </div>

                <!-- Resultados da Importação -->
                <div class="data-card-premium" id="import-results" style="display: none;">
                    <div class="card-header">
                        <h2>📊 Resultados da Importação</h2>
                    </div>
                    <div id="results-content" class="results-content-asaas">
                        <!-- Resultados serão renderizados aqui -->
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Configurar eventos
     */
    setupEvents() {
        // Busca em tempo real
        const searchInput = document.getElementById('search-customers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCustomers(e.target.value);
            });
        }

        // Filtro de status
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
    },

    /**
     * Testar conexão com Asaas
     */
    async testConnection() {
        try {
            const statusEl = document.getElementById('connection-status');
            statusEl.innerHTML = '<span class="status-badge status-loading">⏳ Testando conexão...</span>';

            const response = await this.moduleAPI.request('/api/asaas/test', {
                method: 'GET'
            });

            if (response.success) {
                statusEl.innerHTML = '<span class="status-badge status-success">✅ Conexão OK</span>';
                this.showNotification('Conexão com Asaas estabelecida com sucesso!', 'success');
            } else {
                throw new Error(response.message || 'Falha na conexão');
            }

        } catch (error) {
            const statusEl = document.getElementById('connection-status');
            statusEl.innerHTML = '<span class="status-badge status-error">❌ Conexão falhou</span>';
            this.showNotification(`Erro: ${error.message}`, 'error');
        }
    },

    /**
     * Buscar clientes do Asaas
     */
    async fetchCustomers() {
        try {
            const btn = document.getElementById('btn-fetch-customers');
            btn.disabled = true;
            btn.innerHTML = '⏳ Buscando...';

            const response = await this.moduleAPI.request('/api/asaas/customers', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.customers = response.data.data || [];
                
                // Atualizar stats
                document.getElementById('asaas-total-customers').textContent = this.customers.length;
                
                // Verificar quais já foram importados
                await this.checkImportedCustomers();
                
                // Renderizar lista
                this.renderCustomersList();
                
                // Mostrar botão de importar todos
                document.getElementById('btn-import-all').style.display = 'inline-block';
                document.getElementById('customers-container').style.display = 'block';
                
                this.showNotification(`${this.customers.length} clientes encontrados no Asaas`, 'success');
            } else {
                throw new Error(response.message || 'Falha ao buscar clientes');
            }

        } catch (error) {
            this.showNotification(`Erro ao buscar clientes: ${error.message}`, 'error');
        } finally {
            const btn = document.getElementById('btn-fetch-customers');
            btn.disabled = false;
            btn.innerHTML = '🔄 Buscar Clientes do Asaas';
        }
    },

    /**
     * Verificar quais clientes já foram importados
     */
    async checkImportedCustomers() {
        try {
            // Buscar todos os emails dos alunos existentes
            const response = await this.moduleAPI.request('/api/students', {
                method: 'GET'
            });

            if (response.success && response.data) {
                const existingEmails = new Set(
                    response.data.map(s => s.user?.email?.toLowerCase()).filter(Boolean)
                );

                // Marcar clientes que já existem
                this.customers.forEach(customer => {
                    customer.isImported = existingEmails.has(customer.email?.toLowerCase());
                });

                // Atualizar stats
                const imported = this.customers.filter(c => c.isImported).length;
                const pending = this.customers.length - imported;

                document.getElementById('asaas-imported').textContent = imported;
                document.getElementById('asaas-pending').textContent = pending;
            }

        } catch (error) {
            console.error('Erro ao verificar clientes importados:', error);
        }
    },

    /**
     * Renderizar lista de clientes
     */
    renderCustomersList() {
        const container = document.getElementById('customers-list');
        
        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state-asaas">
                    <div class="empty-icon">📭</div>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Não há clientes no Asaas para importar</p>
                </div>
            `;
            return;
        }

        const html = this.customers.map(customer => `
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
                            onclick="window.asaasImport.importSingle('${customer.id}')">
                            📥 Importar
                        </button>
                        ${!customer.email ? '<div class="text-warning" style="font-size: 11px; margin-top: 4px;">⚠️ Email temporário será criado</div>' : ''}
                    ` : `
                        <span class="text-success">✓ Já está no sistema</span>
                    `}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    /**
     * Filtrar clientes por busca
     */
    filterCustomers(searchTerm) {
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
    },

    /**
     * Filtrar por status
     */
    filterByStatus(status) {
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
    },

    /**
     * Importar cliente individual
     */
    async importSingle(customerId) {
        try {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) {
                throw new Error('Cliente não encontrado');
            }

            this.showNotification(`Importando ${customer.name}...`, 'info');

            const response = await this.moduleAPI.request('/api/asaas/import-customer', {
                method: 'POST',
                body: JSON.stringify({ customerId })
            });

            if (response.success) {
                customer.isImported = true;
                this.renderCustomersList();
                await this.checkImportedCustomers();
                this.showNotification(`${customer.name} importado com sucesso!`, 'success');
            } else {
                throw new Error(response.message || 'Falha na importação');
            }

        } catch (error) {
            this.showNotification(`Erro: ${error.message}`, 'error');
        }
    },

    /**
     * Importar todos os clientes pendentes
     */
    async importAll() {
        try {
            const pending = this.customers.filter(c => !c.isImported && c.email);
            
            if (pending.length === 0) {
                this.showNotification('Não há clientes pendentes para importar', 'warning');
                return;
            }

            const confirmed = confirm(`Importar ${pending.length} clientes do Asaas?`);
            if (!confirmed) return;

            this.isImporting = true;
            const btn = document.getElementById('btn-import-all');
            btn.disabled = true;
            btn.innerHTML = '⏳ Importando...';

            const results = {
                success: 0,
                failed: 0,
                errors: []
            };

            // Importar em lote
            for (let i = 0; i < pending.length; i++) {
                const customer = pending[i];
                
                try {
                    const response = await this.moduleAPI.request('/api/asaas/import-customer', {
                        method: 'POST',
                        body: JSON.stringify({ customerId: customer.id })
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

            // Mostrar resultados
            this.showImportResults(results);
            this.renderCustomersList();
            await this.checkImportedCustomers();

        } catch (error) {
            this.showNotification(`Erro na importação em lote: ${error.message}`, 'error');
        } finally {
            this.isImporting = false;
            const btn = document.getElementById('btn-import-all');
            btn.disabled = false;
            btn.innerHTML = '📥 Importar Todos';
        }
    },

    /**
     * Mostrar resultados da importação
     */
    showImportResults(results) {
        const container = document.getElementById('import-results');
        const content = document.getElementById('results-content');

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
    },

    /**
     * Mostrar notificação
     */
    showNotification(message, type = 'info') {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            alert(message);
        }
    },

    /**
     * Mostrar erro
     */
    showError(error) {
        this.container.innerHTML = `
            <div class="module-isolated-asaas-import">
                <div class="module-header-premium">
                    <h1>⚠️ Erro ao Carregar Módulo</h1>
                </div>
                <div class="data-card-premium">
                    <div class="error-state-asaas">
                        <div class="error-icon">❌</div>
                        <h3>Falha na Inicialização</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn-asaas-primary">
                            Recarregar Página
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Exportar para window
window.AsaasImportModule = AsaasImportModule;
window.asaasImport = AsaasImportModule;

} // end if

// Função global de inicialização
window.initAsaasImport = async (container) => {
    await window.AsaasImportModule.init(container);
};
