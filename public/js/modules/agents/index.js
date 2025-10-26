// Prevent multiple declarations
if (typeof window.AgentsModule !== 'undefined') {
    console.log('✅ Agents Module already loaded, skipping re-declaration');
} else {
    console.log('🔧 [Agents Module] First load - defining module...');

    const AgentsModule = {
        container: null,
        moduleAPI: null,
        agents: [],
        agentTypes: {
            'ADMINISTRATIVE': { icon: '🔧', label: 'Administrativo', color: '#667eea' },
            'MARKETING': { icon: '📧', label: 'Marketing', color: '#f093fb' },
            'PEDAGOGICAL': { icon: '📚', label: 'Pedagógico', color: '#4facfe' },
            'FINANCIAL': { icon: '💳', label: 'Financeiro', color: '#43e97b' },
            'SUPPORT': { icon: '🎧', label: 'Atendimento', color: '#fa709a' }
        },
        
        async init(container) {
            console.log('🤖 [Agents Module] Initializing...');
            
            if (!container) {
                console.error('❌ [Agents Module] Container not provided');
                return;
            }
            
            this.container = container;
            
            try {
                await this.initializeAPI();
                await this.loadAgents();
                this.render();
                this.setupEvents();
                
                // Register globally for onclick handlers
                window.agentsModule = this;
                window.AgentsModule = this;
                
                console.log('🌐 [Agents Module] Registered globally');
                
                // Dispatch module loaded event
                window.app?.dispatchEvent('module:loaded', { name: 'agents' });
                
                console.log('✅ [Agents Module] Initialized successfully');
            } catch (error) {
                console.error('❌ [Agents Module] Initialization failed:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'init' });
            }
        },
        
        async initializeAPI() {
            await waitForAPIClient();
            this.moduleAPI = window.createModuleAPI('Agents');
            console.log('✅ [Agents Module] API client initialized');
        },
        
        async loadAgents() {
            try {
                const response = await this.moduleAPI.request('/api/agents/orchestrator/list');
                if (response.success) {
                    this.agents = response.data || [];
                    console.log(`📋 Loaded ${this.agents.length} agents`);
                } else {
                    throw new Error(response.message || 'Failed to load agents');
                }
            } catch (error) {
                console.warn('⚠️ Could not load agents:', error);
                this.agents = [];
            }
        },
        
        render() {
            this.container.innerHTML = `
                <div class="module-isolated-agents-wrapper">
                    <div class="module-header-premium">
                        <div class="header-content">
                            <div class="header-title-section">
                                <h1><i class="fas fa-robot"></i> Agentes Inteligentes</h1>
                                <nav class="breadcrumb">
                                    <span>🏠 Home</span>
                                    <span>›</span>
                                    <span>🤖 Agentes</span>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div class="module-isolated-agents-list data-card-premium">
                        ${this.renderAgentsList()}
                    </div>

                    <div id="agents-modal-container"></div>
                </div>
            `;
        },
        
        renderAgentsList() {
            if (this.agents.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="empty-state-icon">🤖</div>
                        <h3>Nenhum Agente Criado</h3>
                        <p>Você ainda não tem agentes inteligentes configurados.</p>
                        <div class="empty-state-actions">
                            <button class="btn-form btn-primary-form" data-action="create-administrative-agent">
                                <i class="fas fa-plus"></i> Criar Agente Administrativo
                            </button>
                            <button class="btn-form btn-success-form" data-action="suggest-agents">
                                <i class="fas fa-magic"></i> Sugerir Agentes com IA
                            </button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <h3 class="section-title">
                    <i class="fas fa-list"></i>
                    Seus Agentes (${this.agents.length})
                </h3>
                <div class="agents-grid">
                    ${this.agents.map(agent => this.renderAgentCard(agent)).join('')}
                </div>
            `;
        },
        
        renderAgentCard(agent) {
            const type = this.agentTypes[agent.type] || { icon: '🤖', label: 'Desconhecido', color: '#999' };
            const statusBadge = agent.isActive 
                ? '<span class="badge badge-success">✅ Ativo</span>' 
                : '<span class="badge badge-secondary">⏸️ Inativo</span>';
            
            return `
                <div class="agent-card" data-agent-id="${agent.id}" style="border-left: 4px solid ${type.color}">
                    <div class="agent-card-header">
                        <div class="agent-type-icon" style="background: ${type.color}20">${type.icon}</div>
                        <div class="agent-info">
                            <h4>${agent.name}</h4>
                            <p class="agent-type">${type.label}</p>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="agent-card-body">
                        <p class="agent-description">${agent.description || 'Sem descrição'}</p>
                        <div class="agent-stats">
                            <span><i class="fas fa-bolt"></i> ${agent._count?.executions || 0} execuções</span>
                            <span><i class="fas fa-tools"></i> ${agent.tools?.length || 0} ferramentas</span>
                        </div>
                    </div>
                    <div class="agent-card-actions">
                        <button class="btn-form btn-primary-form btn-sm" data-action="execute-agent" data-agent-id="${agent.id}">
                            <i class="fas fa-play"></i> Executar
                        </button>
                        <button class="btn-form btn-secondary-form btn-sm" data-action="view-agent" data-agent-id="${agent.id}">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                    </div>
                </div>
            `;
        },
        
        setupEvents() {
            const actionButtons = this.container.querySelectorAll('[data-action]');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = btn.dataset.action;
                    console.log(`🎯 [Agents Module] Action: ${action}`);
                    this.handleAction(action);
                });
            });
            
            console.log(`✅ [Agents Module] Event listeners attached (${actionButtons.length} buttons)`);
        },
        
        handleAction(action, agentId) {
            switch(action) {
                case 'create-administrative-agent':
                    this.createAdministrativeAgent();
                    break;
                case 'suggest-agents':
                    this.suggestAgents();
                    break;
                case 'execute-agent':
                    this.executeAgent(agentId);
                    break;
                case 'view-agent':
                    this.viewAgentDetails(agentId);
                    break;
                default:
                    console.warn(`⚠️ Unknown action: ${action}`);
            }
        },
        
        async createAdministrativeAgent() {
            try {
                window.app?.showToast?.('🔧 Criando agente administrativo...', 'info');
                
                const agentData = {
                    name: 'Assistente Administrativo',
                    type: 'ADMINISTRATIVE',
                    description: 'Monitora pagamentos, cadastros de usuários e fornece relatórios administrativos',
                    systemPrompt: `Você é um assistente administrativo especializado em:
1. Monitorar status de pagamentos e assinaturas
2. Analisar cadastros de novos alunos
3. Identificar problemas administrativos
4. Sugerir ações para melhorar gestão

Sempre forneça respostas claras e acionáveis. Quando identificar problemas, sugira soluções específicas e peça permissão antes de executar ações.`,
                    isActive: true,
                    tools: ['database', 'notifications', 'reports']
                };
                
                const response = await this.moduleAPI.request('/api/agents/orchestrator/create', {
                    method: 'POST',
                    body: JSON.stringify(agentData)
                });
                
                if (response.success) {
                    window.app?.showToast?.('✅ Agente administrativo criado!', 'success');
                    await this.loadAgents();
                    this.render();
                    this.setupEvents();
                } else {
                    throw new Error(response.message || 'Falha ao criar agente');
                }
            } catch (error) {
                console.error('❌ Error creating administrative agent:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'create-admin' });
            }
        },
        
        async executeAgent(agentId) {
            const agent = this.agents.find(a => a.id === agentId);
            if (!agent) {
                window.app?.showToast?.('❌ Agente não encontrado', 'error');
                return;
            }
            
            try {
                window.app?.showToast?.(`⚡ Executando ${agent.name}...`, 'info');
                
                const response = await this.moduleAPI.request(`/api/agents/orchestrator/execute/${agentId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        task: 'Analisar situação atual e fornecer relatório',
                        context: {
                            organizationId: localStorage.getItem('organizationId')
                        }
                    })
                });
                
                if (response.success) {
                    window.app?.showToast?.('✅ Agente executado com sucesso!', 'success');
                    this.showExecutionResult(response.data);
                } else {
                    throw new Error(response.message || 'Falha ao executar agente');
                }
            } catch (error) {
                console.error('❌ Error executing agent:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'execute' });
            }
        },
        
        viewAgentDetails(agentId) {
            const agent = this.agents.find(a => a.id === agentId);
            if (!agent) {
                window.app?.showToast?.('❌ Agente não encontrado', 'error');
                return;
            }
            
            const type = this.agentTypes[agent.type] || { icon: '🤖', label: 'Desconhecido' };
            
            const modalHTML = `
                <div class="modal-overlay" id="agent-details-modal">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>${type.icon} ${agent.name}</h3>
                                <button class="modal-close" onclick="document.getElementById('agent-details-modal').remove()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="detail-section">
                                    <h4>Tipo</h4>
                                    <p>${type.label}</p>
                                </div>
                                <div class="detail-section">
                                    <h4>Descrição</h4>
                                    <p>${agent.description || 'Sem descrição'}</p>
                                </div>
                                <div class="detail-section">
                                    <h4>System Prompt</h4>
                                    <pre class="code-block">${agent.systemPrompt || 'Não configurado'}</pre>
                                </div>
                                <div class="detail-section">
                                    <h4>Estatísticas</h4>
                                    <p>Execuções: ${agent._count?.executions || 0}</p>
                                    <p>Status: ${agent.isActive ? '✅ Ativo' : '⏸️ Inativo'}</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-form btn-secondary-form" onclick="document.getElementById('agent-details-modal').remove()">Fechar</button>
                                <button class="btn-form btn-primary-form" onclick="window.agentsModule.executeAgent('${agent.id}'); document.getElementById('agent-details-modal').remove()">
                                    <i class="fas fa-play"></i> Executar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const modalContainer = this.container.querySelector('#agents-modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = modalHTML;
            }
        },
        
        showExecutionResult(result) {
            const modalHTML = `
                <div class="modal-overlay" id="execution-result-modal">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>${result.success ? '✅ Execução Bem-Sucedida' : '❌ Execução Falhou'}</h3>
                                <button class="modal-close" onclick="document.getElementById('execution-result-modal').remove()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="result-section">
                                    <h4>Resultado</h4>
                                    <pre class="code-block">${JSON.stringify(result, null, 2)}</pre>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-form btn-primary-form" onclick="document.getElementById('execution-result-modal').remove()">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const modalContainer = this.container.querySelector('#agents-modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = modalHTML;
            }
        },
        
        async suggestAgents() {
            try {
                window.app?.showToast?.('🔮 Analisando seu negócio...', 'info');
                
                const response = await this.moduleAPI.request('/api/agents/orchestrator/suggest', {
                    method: 'POST',
                    body: JSON.stringify({
                        businessContext: {
                            organizationId: localStorage.getItem('organizationId'),
                            industryType: 'martial-arts-academy',
                            goals: ['automation', 'customer-engagement', 'analytics', 'financial-control']
                        }
                    })
                });
                
                if (response.success) {
                    console.log('✅ Suggestions received:', response.data);
                    window.app?.showToast?.('✅ Agentes sugeridos com sucesso!', 'success');
                } else {
                    throw new Error(response.message || 'Falha ao sugerir agentes');
                }
            } catch (error) {
                console.error('❌ Error suggesting agents:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'suggest' });
            }
        }
    };

    // Global export IMMEDIATELY
    window.AgentsModule = AgentsModule;
    window.agentsModule = AgentsModule;

    console.log('🌐 [Agents Module] Exported to global scope');

} // end if
