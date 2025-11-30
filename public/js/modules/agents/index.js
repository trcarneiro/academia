// Prevent multiple declarations
if (typeof window.AgentsModule !== 'undefined') {
    console.log('✅ Agents Module already loaded, skipping re-declaration');
} else {
    console.log('🔧 [Agents Module] First load - defining module...');

    const AgentsModule = {
        container: null,
        moduleAPI: null,
        agents: [],
        suggestions: [], // Persistir sugestões da IA
        _currentSuggestions: null, // Referência temporária
        agentTypes: {
            // UI canonical keys (legacy uppercase)
            'ADMINISTRATIVE': { icon: '🔧', label: 'Administrativo', color: '#667eea' },
            'MARKETING': { icon: '📧', label: 'Marketing', color: '#f093fb' },
            'PEDAGOGICAL': { icon: '📚', label: 'Pedagógico', color: '#4facfe' },
            'FINANCIAL': { icon: '💳', label: 'Financeiro', color: '#43e97b' },
            'SUPPORT': { icon: '🎧', label: 'Atendimento', color: '#fa709a' },
            // Backend enum values (lowercase, pt-BR)
            'marketing': { icon: '📧', label: 'Marketing', color: '#f093fb' },
            'comercial': { icon: '📈', label: 'Comercial', color: '#f6d365' },
            'pedagogico': { icon: '📚', label: 'Pedagógico', color: '#4facfe' },
            'financeiro': { icon: '💳', label: 'Financeiro', color: '#43e97b' },
            'atendimento': { icon: '🎧', label: 'Atendimento', color: '#fa709a' },
            'orchestrator': { icon: '🧠', label: 'Orquestrador', color: '#667eea' }
        },

        normalizeAgentType(type, specialization) {
            const allowedTypes = ['orchestrator', 'marketing', 'comercial', 'pedagogico', 'financeiro', 'atendimento'];
            const normalizedType = typeof type === 'string' ? type.toLowerCase() : '';

            if (allowedTypes.includes(normalizedType)) {
                return normalizedType;
            }

            const specializationToType = {
                commercial: 'comercial',
                marketing: 'marketing',
                financial: 'financeiro',
                administrative: 'financeiro',
                pedagogical: 'pedagogico',
                curriculum: 'pedagogico',
                progression: 'pedagogico',
                support: 'atendimento',
                analytical: 'orchestrator'
            };

            const specializationKey = typeof specialization === 'string' ? specialization.toLowerCase() : '';
            if (specializationKey && specializationToType[specializationKey]) {
                return specializationToType[specializationKey];
            }

            return 'atendimento';
        },
        
        async init(container) {
            console.log('🤖 [Agents Module] Initializing...');
            
            // Container é opcional quando chamado via app.js (sem render)
            if (!container) {
                console.log('ℹ️ [Agents Module] Initialized without container (app.js mode)');
                await this.initializeAPI();
                window.agentsModule = this;
                window.AgentsModule = this;
                window.agents = this;
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
                // 🛡️ GUARD: Ensure organization context is available
                let orgId = localStorage.getItem('activeOrganizationId') || localStorage.getItem('organizationId');
                let attempts = 0;
                
                // Retry for up to 2 seconds if context is missing (race condition fix)
                while (!orgId && attempts < 10) {
                    console.log(`⏳ [Agents] Waiting for organization context... (${attempts + 1}/10)`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    orgId = localStorage.getItem('activeOrganizationId') || localStorage.getItem('organizationId');
                    attempts++;
                }

                if (!orgId) {
                    console.warn('⚠️ [Agents] No organization ID found after waiting. Skipping load.');
                    this.agents = [];
                    // Don't throw error, just show empty state to avoid 400 Bad Request
                    return;
                }

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
            // Carregar sugestões salvas do localStorage
            this.loadSuggestionsFromStorage();
            
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
                            <div class="header-actions">
                                <button class="btn-form btn-info-form" onclick="window.agentsModule.refreshDashboard()">
                                    <i class="fas fa-chart-line"></i> 📊 Ver Insights
                                </button>
                                <button class="btn-form btn-success-form" data-action="suggest-agents">
                                    <i class="fas fa-magic"></i> Sugerir Agentes com IA
                                </button>
                                <button class="btn-form btn-primary-form" data-action="create-administrative-agent">
                                    <i class="fas fa-plus"></i> Criar Agente
                                </button>
                            </div>
                        </div>
                    </div>

                    ${this.renderSuggestions()}

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
                        <button class="btn-form btn-success-form btn-sm" onclick="window.agentsModule.viewExecutionLogs('${agent.id}')">
                            <i class="fas fa-history"></i> Logs
                        </button>
                        <button class="btn-form btn-info-form btn-sm" onclick="window.agentsModule.refreshDashboard('${agent.id}')">
                            📊 Dashboard
                        </button>
                    </div>
                </div>
            `;
        },
        
        // Gerenciamento de Sugestões
        loadSuggestionsFromStorage() {
            try {
                const saved = localStorage.getItem('agent_suggestions');
                this.suggestions = saved ? JSON.parse(saved) : [];
                console.log(`💾 Loaded ${this.suggestions.length} suggestions from storage:`, this.suggestions);
            } catch (error) {
                console.warn('⚠️ Could not load suggestions from storage:', error);
                this.suggestions = [];
            }
        },
        
        saveSuggestionsToStorage() {
            try {
                localStorage.setItem('agent_suggestions', JSON.stringify(this.suggestions));
                console.log(`💾 Saved ${this.suggestions.length} suggestions to storage`);
            } catch (error) {
                console.error('❌ Could not save suggestions to storage:', error);
            }
        },
        
        renderSuggestions() {
            if (!this.suggestions || this.suggestions.length === 0) {
                console.log('📭 No suggestions to render');
                return '';
            }
            
            console.log(`📊 Rendering ${this.suggestions.length} suggestions:`, this.suggestions);
            
            // 🆕 Separar agentes criados vs sugestões
            const createdAgents = this.suggestions.filter(s => s.status === 'created');
            const suggestedAgents = this.suggestions.filter(s => s.status === 'suggested');
            
            return `
                ${createdAgents.length > 0 ? `
                <div class="created-agents-section data-card-premium" style="margin-bottom: 24px; border-left: 4px solid #667eea;">
                    <div class="suggestions-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 class="section-title" style="margin: 0;">
                            <i class="fas fa-check-circle" style="color: #667eea;"></i>
                            Agentes Criados (${createdAgents.length})
                        </h3>
                    </div>
                    <div class="suggestions-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        ${createdAgents.map((agent, index) => this.renderCreatedAgentCard(agent, index)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${suggestedAgents.length > 0 ? `
                <div class="suggestions-section data-card-premium" style="margin-bottom: 24px; border-left: 4px solid #43e97b;">
                    <div class="suggestions-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 class="section-title" style="margin: 0;">
                            <i class="fas fa-lightbulb" style="color: #43e97b;"></i>
                            Novas Sugestões (${suggestedAgents.length})
                        </h3>
                        <button class="btn-form btn-sm btn-secondary-form" data-action="clear-suggestions" style="font-size: 12px;">
                            <i class="fas fa-trash"></i> Limpar Sugestões
                        </button>
                    </div>
                    <div class="suggestions-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        ${suggestedAgents.map((suggestion) => {
                            // 🔧 FIX: Encontrar o índice CORRETO no array original
                            const originalIndex = this.suggestions.findIndex(s => 
                                s.name === suggestion.name && s.status === 'suggested'
                            );
                            console.log('🔍 [DEBUG] Suggestion:', suggestion.name, '| Original Index:', originalIndex, '| Data:', this.suggestions[originalIndex]?.name);
                            return this.renderSuggestionCard(suggestion, originalIndex);
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            `;
        },
        
        renderCreatedAgentCard(agent, index) {
            const type = this.agentTypes[agent.type] || { icon: '🤖', label: agent.type, color: '#999' };
            const createdDate = agent.createdAt ? new Date(agent.createdAt).toLocaleDateString('pt-BR') : 'N/A';
            
            return `
                <div class="suggestion-card" style="background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%); border-radius: 8px; padding: 16px; border: 2px solid ${type.color}40; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15); transition: all 0.3s ease;">
                    <div class="suggestion-header" style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div class="suggestion-icon" style="background: ${type.color}; color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 12px; box-shadow: 0 2px 8px ${type.color}40;">
                            ${type.icon}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748;">${agent.name}</h4>
                            <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background: #667eea; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                <i class="fas fa-check"></i> ATIVO
                            </span>
                        </div>
                    </div>
                    <p class="suggestion-description" style="font-size: 13px; color: #4a5568; line-height: 1.5; margin-bottom: 12px;">
                        ${agent.description}
                    </p>
                    <div class="suggestion-tools" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                        ${(agent.tools || []).map(tool => `
                            <span style="font-size: 11px; padding: 4px 8px; background: #667eea20; color: #667eea; border-radius: 4px; font-weight: 500;">
                                <i class="fas fa-wrench" style="font-size: 9px;"></i> ${tool}
                            </span>
                        `).join('')}
                    </div>
                    <div style="font-size: 11px; color: #718096; margin-bottom: 8px;">
                        <i class="fas fa-calendar-alt"></i> Criado em ${createdDate}
                    </div>
                    <div class="suggestion-actions" style="display: flex; gap: 8px;">
                        <button class="btn-form btn-primary-form btn-sm" data-action="execute-agent" data-agent-id="${agent.id}" style="flex: 1; font-size: 12px;">
                            <i class="fas fa-play-circle"></i> Executar
                        </button>
                        <button class="btn-form btn-secondary-form btn-sm" data-action="view-agent" data-agent-id="${agent.id}" style="font-size: 12px;">
                            <i class="fas fa-eye"></i> Ver Detalhes
                        </button>
                    </div>
                </div>
            `;
        },
        
        renderSuggestionCard(suggestion, index) {
            const type = this.agentTypes[suggestion.type] || { icon: '🤖', label: suggestion.type, color: '#999' };
            
            return `
                <div class="suggestion-card" style="background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%); border-radius: 8px; padding: 16px; border: 2px dashed ${type.color}40; transition: all 0.3s ease;">
                    <div class="suggestion-header" style="display: flex; align-items: center; margin-bottom: 12px;">
                        <div class="suggestion-icon" style="background: ${type.color}20; color: ${type.color}; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 12px;">
                            ${type.icon}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748;">${suggestion.name}</h4>
                            <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background: ${type.color}20; color: ${type.color}; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${type.label}</span>
                        </div>
                    </div>
                    <p class="suggestion-description" style="font-size: 13px; color: #4a5568; line-height: 1.5; margin-bottom: 12px;">
                        ${suggestion.description}
                    </p>
                    ${suggestion.justification ? `
                    <div style="font-size: 12px; color: #718096; margin-bottom: 12px; padding: 8px; background: #f7fafc; border-radius: 4px; border-left: 3px solid #43e97b;">
                        <strong style="color: #43e97b;">Por quê?</strong> ${suggestion.justification}
                    </div>
                    ` : ''}
                    <div class="suggestion-tools" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                        ${(suggestion.tools || []).map(tool => `
                            <span style="font-size: 11px; padding: 4px 8px; background: #e2e8f0; color: #4a5568; border-radius: 4px;">
                                <i class="fas fa-wrench" style="font-size: 9px;"></i> ${tool}
                            </span>
                        `).join('')}
                    </div>
                    <div class="suggestion-actions" style="display: flex; gap: 8px;">
                        <button class="btn-form btn-success-form btn-sm" data-action="create-from-suggestion" data-suggestion-index="${index}" data-suggestion-name="${suggestion.name}" style="flex: 1; font-size: 12px;">
                            <i class="fas fa-plus-circle"></i> Criar Agente
                        </button>
                        <button class="btn-form btn-secondary-form btn-sm" data-action="remove-suggestion" data-suggestion-index="${index}" style="font-size: 12px;">
                            <i class="fas fa-times"></i>
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
                    const agentId = btn.dataset.agentId;
                    const suggestionIndex = btn.dataset.suggestionIndex;
                    console.log(`🎯 [Agents Module] Action: ${action}, AgentId: ${agentId}, Index: ${suggestionIndex}`);
                    this.handleAction(action, agentId, suggestionIndex);
                });
            });
            
            console.log(`✅ [Agents Module] Event listeners attached (${actionButtons.length} buttons)`);
        },
        
        handleAction(action, agentId, suggestionIndex) {
            console.log('🎬 [handleAction] Action:', action, '| AgentId:', agentId, '| SuggestionIndex:', suggestionIndex);
            switch(action) {
                case 'create-administrative-agent':
                    // 🆕 Abre modal ao invés de criar agente fixo
                    this.showAgentCreationModal();
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
                case 'create-from-suggestion':
                    console.log('🔵 [handleAction] Creating from suggestion index:', suggestionIndex);
                    this.createAgentFromSuggestion(parseInt(suggestionIndex));
                    break;
                case 'remove-suggestion':
                    this.removeSuggestion(parseInt(suggestionIndex));
                    break;
                case 'clear-suggestions':
                    this.clearAllSuggestions();
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
                    // Backend expects enum AgentType (lowercase). 'Administrativo' maps closest to 'financeiro'.
                    type: 'financeiro',
                    description: 'Monitora pagamentos, cadastros de usuários e fornece relatórios administrativos',
                    systemPrompt: `Você é um assistente administrativo especializado em:
1. Monitorar status de pagamentos e assinaturas
2. Analisar cadastros de novos alunos
3. Identificar problemas administrativos
4. Sugerir ações para melhorar gestão

Sempre forneça respostas claras e acionáveis. Quando identificar problemas, sugira soluções específicas e peça permissão antes de executar ações.`,
                    isActive: true,
                    tools: ['database', 'notifications', 'reports'],
                    // Provide orgId in body as a fallback if header is not yet available
                    organizationId: (localStorage.getItem('activeOrganizationId') || localStorage.getItem('organizationId'))
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
                    }),
                    timeout: 60000, // 60s timeout para agentes (Gemini pode demorar)
                    retries: 1 // Apenas 1 retry (não adianta tentar 3x se vai timeout)
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
        
        async viewExecutionLogs(agentId) {
            const agent = this.agents.find(a => a.id === agentId);
            if (!agent) {
                window.app?.showToast?.('❌ Agente não encontrado', 'error');
                return;
            }
            
            try {
                window.app?.showToast?.('📜 Carregando logs de execução...', 'info');
                
                // Buscar execuções do agente
                const response = await this.moduleAPI.request(`/api/agents/orchestrator/executions/${agentId}`);
                
                if (!response.success) {
                    throw new Error(response.message || 'Falha ao carregar logs');
                }
                
                const executions = response.data || [];
                const type = this.agentTypes[agent.type] || { icon: '🤖', label: 'Desconhecido' };
                
                // Renderizar modal de logs
                const modalHTML = `
                    <div class="modal-overlay" id="execution-logs-modal">
                        <div class="modal-dialog modal-xl">
                            <div class="modal-content">
                                <div class="modal-header bg-gradient-primary">
                                    <h3><i class="fas fa-history"></i> Logs de Execução - ${type.icon} ${agent.name}</h3>
                                    <button class="modal-close" onclick="document.getElementById('execution-logs-modal').remove()">&times;</button>
                                </div>
                                <div class="modal-body">
                                    ${executions.length === 0 ? `
                                        <div class="alert alert-info">
                                            <strong>ℹ️ Nenhuma execução registrada</strong>
                                            <p>Este agente ainda não foi executado.</p>
                                        </div>
                                    ` : `
                                        <div class="execution-logs-container">
                                            <div class="logs-stats mb-4">
                                                <div class="stat-card">
                                                    <span class="stat-value">${executions.length}</span>
                                                    <span class="stat-label">Total de Execuções</span>
                                                </div>
                                                <div class="stat-card stat-success">
                                                    <span class="stat-value">${executions.filter(e => e.status === 'COMPLETED').length}</span>
                                                    <span class="stat-label">✅ Sucesso</span>
                                                </div>
                                                <div class="stat-card stat-danger">
                                                    <span class="stat-value">${executions.filter(e => e.status === 'FAILED').length}</span>
                                                    <span class="stat-label">❌ Falhas</span>
                                                </div>
                                                <div class="stat-card stat-warning">
                                                    <span class="stat-value">${executions.filter(e => e.status === 'PENDING' || e.status === 'RUNNING').length}</span>
                                                    <span class="stat-label">⏳ Em Progresso</span>
                                                </div>
                                            </div>
                                            
                                            <h4 class="section-title mb-3">📋 Histórico de Execuções</h4>
                                            
                                            <div class="execution-logs-list">
                                                ${executions.map(execution => this.renderExecutionLogItem(execution)).join('')}
                                            </div>
                                        </div>
                                    `}
                                </div>
                                <div class="modal-footer">
                                    <button class="btn-form btn-secondary-form" onclick="document.getElementById('execution-logs-modal').remove()">Fechar</button>
                                    <button class="btn-form btn-primary-form" onclick="window.agentsModule.executeAgent('${agentId}'); document.getElementById('execution-logs-modal').remove()">
                                        <i class="fas fa-play"></i> Executar Novamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <style>
                        .execution-logs-container {
                            max-height: 70vh;
                            overflow-y: auto;
                        }
                        
                        .logs-stats {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                            gap: 1rem;
                            margin-bottom: 1.5rem;
                        }
                        
                        .stat-card {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 1.5rem;
                            border-radius: 8px;
                            text-align: center;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        
                        .stat-card.stat-success {
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        }
                        
                        .stat-card.stat-danger {
                            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                        }
                        
                        .stat-card.stat-warning {
                            background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
                        }
                        
                        .stat-value {
                            display: block;
                            font-size: 2.5rem;
                            font-weight: 700;
                            line-height: 1;
                        }
                        
                        .stat-label {
                            display: block;
                            font-size: 0.85rem;
                            margin-top: 0.5rem;
                            opacity: 0.9;
                        }
                        
                        .execution-logs-list {
                            display: flex;
                            flex-direction: column;
                            gap: 1rem;
                        }
                        
                        .execution-log-item {
                            background: #f8f9fa;
                            border-left: 4px solid #667eea;
                            border-radius: 8px;
                            padding: 1.5rem;
                            transition: all 0.3s ease;
                        }
                        
                        .execution-log-item:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        
                        .execution-log-item.status-completed {
                            border-left-color: #28a745;
                        }
                        
                        .execution-log-item.status-failed {
                            border-left-color: #dc3545;
                        }
                        
                        .execution-log-item.status-running {
                            border-left-color: #ffc107;
                        }
                        
                        .execution-log-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 1rem;
                        }
                        
                        .execution-log-task {
                            font-weight: 600;
                            font-size: 1.05rem;
                            color: #333;
                        }
                        
                        .execution-log-status {
                            padding: 0.4rem 0.8rem;
                            border-radius: 20px;
                            font-size: 0.85rem;
                            font-weight: 600;
                        }
                        
                        .execution-log-status.completed {
                            background: #d4edda;
                            color: #155724;
                        }
                        
                        .execution-log-status.failed {
                            background: #f8d7da;
                            color: #721c24;
                        }
                        
                        .execution-log-status.running {
                            background: #fff3cd;
                            color: #856404;
                        }
                        
                        .execution-log-status.pending {
                            background: #e7f3ff;
                            color: #004085;
                        }
                        
                        .execution-log-meta {
                            display: flex;
                            gap: 1.5rem;
                            color: #6c757d;
                            font-size: 0.9rem;
                            margin-bottom: 0.75rem;
                        }
                        
                        .execution-log-meta span {
                            display: flex;
                            align-items: center;
                            gap: 0.3rem;
                        }
                        
                        .execution-log-result {
                            background: white;
                            border: 1px solid #dee2e6;
                            border-radius: 6px;
                            padding: 1rem;
                            margin-top: 0.75rem;
                        }
                        
                        .execution-log-result pre {
                            margin: 0;
                            font-size: 0.85rem;
                            color: #495057;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                        
                        .execution-error {
                            background: #f8d7da;
                            border: 1px solid #f5c6cb;
                            border-radius: 6px;
                            padding: 1rem;
                            margin-top: 0.75rem;
                        }
                        
                        .execution-error-message {
                            color: #721c24;
                            font-weight: 600;
                            margin-bottom: 0.5rem;
                        }
                        
                        .execution-error pre {
                            margin: 0;
                            font-size: 0.8rem;
                            color: #721c24;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                    </style>
                `;
                
                const modalContainer = this.container.querySelector('#agents-modal-container');
                if (modalContainer) {
                    modalContainer.innerHTML = modalHTML;
                }
                
            } catch (error) {
                console.error('❌ Error loading execution logs:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'viewLogs' });
            }
        },
        
        renderExecutionLogItem(execution) {
            const statusClass = execution.status?.toLowerCase() || 'pending';
            const statusLabels = {
                'COMPLETED': '✅ Concluído',
                'FAILED': '❌ Falhou',
                'RUNNING': '⏳ Em Execução',
                'PENDING': '⏸️ Pendente',
                'TIMEOUT': '⏱️ Timeout'
            };
            
            const statusLabel = statusLabels[execution.status] || execution.status;
            
            // Formatar datas
            const startDate = new Date(execution.startedAt || execution.createdAt);
            const endDate = execution.completedAt ? new Date(execution.completedAt) : null;
            const duration = endDate ? ((endDate - startDate) / 1000).toFixed(2) : 'N/A';
            
            const formatDate = (date) => {
                return date.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            };
            
            return `
                <div class="execution-log-item status-${statusClass}">
                    <div class="execution-log-header">
                        <span class="execution-log-task">
                            ${execution.task || execution.description || 'Execução sem descrição'}
                        </span>
                        <span class="execution-log-status ${statusClass}">
                            ${statusLabel}
                        </span>
                    </div>
                    
                    <div class="execution-log-meta">
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${formatDate(startDate)}
                        </span>
                        ${duration !== 'N/A' ? `
                            <span>
                                <i class="fas fa-stopwatch"></i>
                                ${duration}s
                            </span>
                        ` : ''}
                        ${execution.executionTime ? `
                            <span>
                                <i class="fas fa-clock"></i>
                                ${execution.executionTime}ms
                            </span>
                        ` : ''}
                    </div>
                    
                    ${execution.status === 'COMPLETED' && execution.result ? `
                        <details class="execution-log-result">
                            <summary style="cursor: pointer; font-weight: 600; color: #28a745;">
                                <i class="fas fa-check-circle"></i> Ver Resultado
                            </summary>
                            <pre>${JSON.stringify(execution.result, null, 2)}</pre>
                        </details>
                    ` : ''}
                    
                    ${execution.status === 'FAILED' && execution.error ? `
                        <div class="execution-error">
                            <div class="execution-error-message">
                                <i class="fas fa-exclamation-triangle"></i> Erro:
                            </div>
                            <pre>${typeof execution.error === 'string' ? execution.error : JSON.stringify(execution.error, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
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
        
        async showExecutionResult(result) {
            // Parse execution data
            const data = result.data || result;
            const summary = data.summary || 'Análise concluída';
            const insights = data.insights || [];
            const actions = data.actions || [];
            const priority = data.priority || 'MEDIUM';
            const executionTime = result.executionTime || 0;
            
        // 🆕 BUSCAR TAREFAS CRIADAS PELO AGENTE
        let createdTasks = [];
        try {
            const agentId = result.agentId || data.agentId;
            if (agentId) {
                const tasksResponse = await this.moduleAPI.request(
                    `/api/agent-tasks?agentId=${agentId}&approvalStatus=PENDING&limit=10`
                );
                createdTasks = tasksResponse.data || [];
                console.log(`📋 [Agents] Found ${createdTasks.length} pending tasks from this agent`);
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch tasks:', error);
        }
        
        // 🆕 TRANSFORMAR INSIGHTS E AÇÕES EM DASHBOARD ITEMS
        const dashboardItems = this.buildDashboardItems(insights, actions, createdTasks);            // Priority badge
            const priorityBadges = {
                'LOW': '<span class="badge badge-success">Baixa Prioridade</span>',
                'MEDIUM': '<span class="badge badge-warning">Média Prioridade</span>',
                'HIGH': '<span class="badge badge-danger">Alta Prioridade</span>',
                'URGENT': '<span class="badge badge-danger badge-pulse">🚨 Urgente</span>'
            };
            
            const modalHTML = `
                <div class="modal-overlay" id="execution-result-modal">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header bg-gradient-primary">
                                <h3>✅ Execução Concluída</h3>
                                <button class="modal-close" onclick="document.getElementById('execution-result-modal').remove()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <!-- Summary -->
                                <div class="result-section mb-4">
                                    <h4 class="section-title">📊 Resumo Executivo</h4>
                                    <div class="alert alert-info">
                                        ${summary}
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        ${priorityBadges[priority] || priorityBadges['MEDIUM']}
                                        <small class="text-muted">⏱️ Executado em ${(executionTime / 1000).toFixed(1)}s</small>
                                    </div>
                                </div>
                                
                                <!-- Insights -->
                                ${insights.length > 0 ? `
                                <div class="result-section mb-4">
                                    <h4 class="section-title">💡 Insights Identificados</h4>
                                    <ul class="insights-list">
                                        ${insights.map(insight => `<li class="insight-item">${insight}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                                
                                <!-- Actions -->
                                ${actions.length > 0 ? `
                                <div class="result-section mb-4">
                                    <h4 class="section-title">🎯 Ações Recomendadas</h4>
                                    <ul class="actions-list">
                                        ${actions.map(action => `<li class="action-item">${action}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                                
                                <!-- 🆕 DASHBOARD DE ITENS (INSIGHTS + NOTIFICAÇÕES + TASKS) -->
                                ${dashboardItems.length > 0 ? `
                                <div class="result-section mb-4">
                                    <h4 class="section-title">� Dashboard de Itens</h4>
                                    
                                    <!-- Filtros e Contadores -->
                                    <div class="dashboard-filters mb-3">
                                        <button class="filter-btn active" data-filter="all" onclick="window.agentsModule.filterDashboardItems('all')">
                                            🔍 Todos (${dashboardItems.length})
                                        </button>
                                        <button class="filter-btn" data-filter="insight" onclick="window.agentsModule.filterDashboardItems('insight')">
                                            💡 Insights (${dashboardItems.filter(i => i.type === 'insight').length})
                                        </button>
                                        <button class="filter-btn" data-filter="notification" onclick="window.agentsModule.filterDashboardItems('notification')">
                                            🔔 Notificações (${dashboardItems.filter(i => i.type === 'notification').length})
                                        </button>
                                        <button class="filter-btn" data-filter="task" onclick="window.agentsModule.filterDashboardItems('task')">
                                            ✅ Tasks (${dashboardItems.filter(i => i.type === 'task').length})
                                        </button>
                                    </div>
                                    
                                    <!-- Grid de Items -->
                                    <div class="dashboard-items-grid" id="dashboard-items-grid">
                                        ${dashboardItems.map(item => this.renderDashboardItem(item)).join('')}
                                    </div>
                                </div>
                                ` : `
                                <div class="result-section mb-4">
                                    <div class="alert alert-info">
                                        <strong>ℹ️ Dashboard:</strong> Nenhum item gerado nesta execução.
                                    </div>
                                </div>
                                `}
                                
                                <!-- Debug Info (collapsible) -->
                                <details class="debug-section">
                                    <summary class="text-muted cursor-pointer">🔧 Detalhes Técnicos (Debug)</summary>
                                    <pre class="code-block mt-2">${JSON.stringify(result, null, 2)}</pre>
                                </details>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-form btn-secondary-form" onclick="document.getElementById('execution-result-modal').remove()">Fechar</button>
                                <button class="btn-form btn-primary-form" onclick="window.location.hash='dashboard'; document.getElementById('execution-result-modal').remove()">
                                    <i class="fas fa-tachometer-alt"></i> Ir para Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .modal-xl {
                        max-width: 900px !important;
                    }
                    
                    .bg-gradient-primary {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    
                    .section-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 1rem;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 0.5rem;
                    }
                    
                    .insights-list, .actions-list {
                        list-style: none;
                        padding: 0;
                    }
                    
                    .insight-item, .action-item {
                        background: #f8f9fa;
                        padding: 1rem;
                        margin-bottom: 0.75rem;
                        border-left: 4px solid #667eea;
                        border-radius: 4px;
                        font-size: 0.95rem;
                        line-height: 1.5;
                    }
                    
                    .action-item {
                        border-left-color: #28a745;
                    }
                    
                    .badge {
                        padding: 0.5rem 1rem;
                        font-size: 0.85rem;
                        border-radius: 20px;
                        font-weight: 600;
                    }
                    
                    .badge-success {
                        background: #28a745;
                        color: white;
                    }
                    
                    .badge-warning {
                        background: #ffc107;
                        color: #333;
                    }
                    
                    .badge-danger {
                        background: #dc3545;
                        color: white;
                    }
                    
                    .badge-pulse {
                        animation: pulse 1.5s ease-in-out infinite;
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }
                    
                    .alert {
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                    }
                    
                    .alert-info {
                        background: #d1ecf1;
                        border: 1px solid #bee5eb;
                        color: #0c5460;
                    }
                    
                    .alert-warning {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                    }
                    
                    .debug-section {
                        margin-top: 1rem;
                        padding: 1rem;
                        background: #f8f9fa;
                        border-radius: 8px;
                    }
                    
                    .debug-section summary {
                        font-weight: 500;
                        cursor: pointer;
                        user-select: none;
                    }
                    
                    .debug-section summary:hover {
                        color: #667eea;
                    }
                    
                    .code-block {
                        background: #2d2d2d;
                        color: #f8f8f2;
                        padding: 1rem;
                        border-radius: 4px;
                        overflow-x: auto;
                        font-size: 0.85rem;
                        max-height: 300px;
                    }
                    
                    /* 🆕 TASK CARDS STYLES */
                    .tasks-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    /* 🆕 DASHBOARD ITEMS STYLES */
                    .dashboard-filters {
                        display: flex;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                        margin-bottom: 1rem;
                    }
                    
                    .filter-btn {
                        padding: 0.5rem 1rem;
                        background: white;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.85rem;
                        font-weight: 500;
                        transition: all 0.2s;
                        color: #4a5568;
                    }
                    
                    .filter-btn:hover {
                        border-color: #667eea;
                        background: #f7fafc;
                    }
                    
                    .filter-btn.active {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-color: transparent;
                    }
                    
                    .dashboard-items-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                        gap: 1rem;
                    }
                    
                    .dashboard-item {
                        background: white;
                        border-left: 4px solid;
                        border-radius: 8px;
                        padding: 1rem;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        transition: all 0.3s ease;
                    }
                    
                    .dashboard-item:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        transform: translateY(-2px);
                    }
                    
                    .dashboard-item.type-insight {
                        border-left-color: #667eea;
                        background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
                    }
                    
                    .dashboard-item.type-notification {
                        border-left-color: #ff9800;
                        background: linear-gradient(135deg, #ffffff 0%, #fff8f0 100%);
                    }
                    
                    .dashboard-item.type-task {
                        border-left-color: #28a745;
                        background: linear-gradient(135deg, #ffffff 0%, #f0fff4 100%);
                    }
                    
                    .dashboard-item.hidden {
                        display: none;
                    }
                    
                    .item-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 0.75rem;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    .item-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.1rem;
                        margin-right: 0.75rem;
                    }
                    
                    .type-insight .item-icon {
                        background: #667eea20;
                        color: #667eea;
                    }
                    
                    .type-notification .item-icon {
                        background: #ff980020;
                        color: #ff9800;
                    }
                    
                    .type-task .item-icon {
                        background: #28a74520;
                        color: #28a745;
                    }
                    
                    .item-type-badge {
                        padding: 0.25rem 0.5rem;
                        font-size: 0.7rem;
                        border-radius: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        margin-left: auto;
                    }
                    
                    .type-insight .item-type-badge {
                        background: #667eea20;
                        color: #667eea;
                    }
                    
                    .type-notification .item-type-badge {
                        background: #ff980020;
                        color: #ff9800;
                    }
                    
                    .type-task .item-type-badge {
                        background: #28a74520;
                        color: #28a745;
                    }
                    
                    .item-content {
                        font-size: 0.9rem;
                        color: #4a5568;
                        line-height: 1.5;
                        margin-bottom: 0.75rem;
                    }
                    
                    .item-actions {
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 0.75rem;
                    }
                    
                    .item-btn {
                        flex: 1;
                        padding: 0.4rem 0.75rem;
                        font-size: 0.8rem;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    
                    .item-btn:hover {
                        transform: translateY(-1px);
                    }
                    
                    .btn-pin { background: #667eea; color: white; }
                    .btn-pin:hover { background: #5568d3; }
                    
                    .btn-archive { background: #e2e8f0; color: #4a5568; }
                    .btn-archive:hover { background: #cbd5e0; }
                    
                    .btn-mark-read { background: #28a745; color: white; }
                    .btn-mark-read:hover { background: #218838; }
                    
                    .btn-silence { background: #ffc107; color: #333; }
                    .btn-silence:hover { background: #e0a800; }
                    
                    .btn-approve { background: #28a745; color: white; }
                    .btn-approve:hover { background: #218838; }
                    
                    .btn-reject { background: #dc3545; color: white; }
                    .btn-reject:hover { background: #c82333; }
                    
                    .btn-delete { background: #dc3545; color: white; }
                    .btn-delete:hover { background: #bd2130; box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3); }
                    
                    .task-card {
                        background: white;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 1rem;
                        transition: all 0.3s ease;
                    }
                    
                    .task-card:hover {
                        border-color: #667eea;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
                    }
                    
                    .task-card-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 0.75rem;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    .task-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.25rem;
                        margin-right: 0.75rem;
                    }
                    
                    .task-category-WHATSAPP_MESSAGE .task-icon { background: #25d36620; color: #25d366; }
                    .task-category-EMAIL .task-icon { background: #667eea20; color: #667eea; }
                    .task-category-SMS .task-icon { background: #ffc10720; color: #ffc107; }
                    .task-category-DATABASE_CHANGE .task-icon { background: #dc354520; color: #dc3545; }
                    .task-category-MARKETING .task-icon { background: #ff6b6b20; color: #ff6b6b; }
                    .task-category-ENROLLMENT .task-icon { background: #4ecdc420; color: #4ecdc4; }
                    
                    .task-title {
                        flex: 1;
                        font-weight: 600;
                        font-size: 0.95rem;
                        color: #2d3748;
                        line-height: 1.3;
                    }
                    
                    .task-priority-badge {
                        padding: 0.25rem 0.5rem;
                        font-size: 0.75rem;
                        border-radius: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    
                    .task-priority-LOW { background: #28a74520; color: #28a745; }
                    .task-priority-MEDIUM { background: #ffc10720; color: #ffc107; }
                    .task-priority-HIGH { background: #dc354520; color: #dc3545; }
                    .task-priority-URGENT { background: #dc3545; color: white; animation: pulse 1.5s infinite; }
                    
                    .task-description {
                        font-size: 0.85rem;
                        color: #718096;
                        line-height: 1.5;
                        margin-bottom: 0.75rem;
                    }
                    
                    .task-actions {
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 0.75rem;
                    }
                    
                    .task-btn {
                        flex: 1;
                        padding: 0.5rem;
                        font-size: 0.85rem;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                    }
                    
                    .task-btn-approve {
                        background: #28a745;
                        color: white;
                    }
                    
                    .task-btn-approve:hover {
                        background: #218838;
                        transform: translateY(-1px);
                    }
                    
                    .task-btn-reject {
                        background: #dc3545;
                        color: white;
                    }
                    
                    .task-btn-reject:hover {
                        background: #c82333;
                        transform: translateY(-1px);
                    }
                </style>
            `;
            
            const modalContainer = this.container.querySelector('#agents-modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = modalHTML;
            }
        },
        
        // 🆕 BUILD DASHBOARD ITEMS (INSIGHTS + NOTIFICATIONS + TASKS)
        buildDashboardItems(insights, actions, tasks) {
            const items = [];
            
            // Adicionar insights
            insights.forEach((insight, index) => {
                items.push({
                    id: `insight-${index}`,
                    type: 'insight',
                    icon: '💡',
                    title: 'Insight Identificado',
                    content: insight,
                    status: 'NEW',
                    timestamp: new Date().toISOString()
                });
            });
            
            // Adicionar ações como notificações
            actions.forEach((action, index) => {
                items.push({
                    id: `notification-${index}`,
                    type: 'notification',
                    icon: '🔔',
                    title: 'Ação Recomendada',
                    content: action,
                    status: 'UNREAD',
                    timestamp: new Date().toISOString()
                });
            });
            
            // Adicionar tasks reais
            tasks.forEach(task => {
                items.push({
                    id: task.id,
                    type: 'task',
                    icon: this.getTaskIcon(task.category),
                    title: task.title,
                    content: task.description,
                    status: task.approvalStatus,
                    priority: task.priority,
                    category: task.category,
                    timestamp: task.createdAt,
                    reasoning: task.reasoning,
                    actionPayload: task.actionPayload
                });
            });
            
            return items;
        },

        // 🆕 CARREGAR INSIGHTS SALVOS DO BANCO DE DADOS
        async loadSavedInsights(filters = {}) {
            try {
                const queryParams = new URLSearchParams();
                
                // Aplicar filtros
                if (filters.agentId) queryParams.append('agentId', filters.agentId);
                if (filters.category) queryParams.append('category', filters.category);
                if (filters.priority) queryParams.append('priority', filters.priority);
                if (filters.status) queryParams.append('status', filters.status);
                
                // Por padrão, buscar insights ativos (NEW, PINNED)
                if (!filters.includeAll) {
                    queryParams.append('status', 'NEW,PINNED');
                }
                
                const response = await this.moduleAPI.request(
                    `/api/agent-insights?${queryParams.toString()}`
                );
                
                console.log(`💾 [Agents] Loaded ${response.data?.length || 0} saved insights from database`);
                return response.data || [];
                
            } catch (error) {
                console.error('❌ [Agents] Error loading saved insights:', error);
                window.app?.showToast?.('Erro ao carregar insights salvos', 'error');
                return [];
            }
        },

        // 🆕 ATUALIZAR DASHBOARD COM INSIGHTS SALVOS
        async refreshDashboard(agentId = null) {
            try {
                window.app?.showToast?.('⏳ Carregando insights...', 'info');
                
                // Buscar insights salvos
                const filters = agentId ? { agentId } : {};
                const savedInsights = await this.loadSavedInsights(filters);
                
                if (savedInsights.length === 0) {
                    window.app?.showToast?.('Nenhum insight salvo encontrado. Execute um agente com auto-save ativado.', 'info');
                    // Renderizar view vazia
                    this.renderDashboardView([]);
                    return;
                }
                
                // Transformar insights do banco para formato dashboard
                const dashboardItems = savedInsights.map(insight => ({
                    id: insight.id,
                    type: insight.type.toLowerCase(), // 'INSIGHT' ou 'NOTIFICATION' → 'insight' ou 'notification'
                    icon: insight.type === 'INSIGHT' ? '💡' : '🔔',
                    title: insight.title,
                    content: insight.description || insight.content, // Compatibilidade com schemas diferentes
                    category: insight.category,
                    priority: insight.priority,
                    status: insight.status,
                    timestamp: insight.createdAt,
                    isPinned: insight.isPinned,
                    isRead: insight.isRead,
                    isSilenced: insight.isSilenced || false,
                    agentName: insight.agent?.name || 'Agente Desconhecido'
                }));
                
                // Renderizar dashboard
                this.renderDashboardView(dashboardItems);
                
                window.app?.showToast?.(`✅ ${savedInsights.length} insights carregados`, 'success');
                
            } catch (error) {
                console.error('❌ [Agents] Error refreshing dashboard:', error);
                window.app?.showToast?.('Erro ao atualizar dashboard', 'error');
            }
        },

        // 🆕 RENDERIZAR VIEW DE DASHBOARD COM INSIGHTS
        renderDashboardView(items) {
            const html = `
                <div class="agents-dashboard-view">
                    <div class="module-header-premium">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h1>📊 Dashboard de Insights</h1>
                                <nav class="breadcrumb">Home > Agentes > Dashboard</nav>
                            </div>
                            <button class="btn-form btn-primary-form" onclick="window.agentsModule.refreshDashboard()">
                                <i class="fas fa-sync-alt"></i> 🔄 Atualizar
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-card-premium mt-3">
                        ${items.length > 0 ? `
                        <!-- Filtros -->
                        <div class="dashboard-filters mb-3">
                            <button class="filter-btn active" data-filter="all" onclick="window.agentsModule.filterDashboardItems('all')">
                                🔍 Todos (${items.length})
                            </button>
                            <button class="filter-btn" data-filter="insight" onclick="window.agentsModule.filterDashboardItems('insight')">
                                💡 Insights (${items.filter(i => i.type === 'insight').length})
                            </button>
                            <button class="filter-btn" data-filter="notification" onclick="window.agentsModule.filterDashboardItems('notification')">
                                🔔 Notificações (${items.filter(i => i.type === 'notification').length})
                            </button>
                        </div>
                        
                        <!-- Grid de Items -->
                        <div class="dashboard-items-grid" id="dashboard-items-grid">
                            ${items.map(item => this.renderDashboardItem(item)).join('')}
                        </div>
                        ` : `
                        <div class="alert alert-info">
                            <h4>ℹ️ Nenhum insight salvo encontrado</h4>
                            <p>Execute um agente com <strong>auto-save ativado</strong> para começar a ver insights aqui.</p>
                            <button class="btn-form btn-primary-form mt-2" onclick="window.location.hash='agents'">
                                ➕ Criar Agente
                            </button>
                        </div>
                        `}
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
        },
        
        getTaskIcon(category) {
            const icons = {
                'WHATSAPP_MESSAGE': '📱',
                'EMAIL': '📧',
                'SMS': '💬',
                'DATABASE_CHANGE': '🗄️',
                'MARKETING': '📢',
                'BILLING': '💰',
                'ENROLLMENT': '🎓'
            };
            return icons[category] || '📋';
        },
        
        // 🆕 RENDER DASHBOARD ITEM (UNIVERSAL CARD)
        renderDashboardItem(item) {
            const typeLabels = {
                'insight': 'Insight',
                'notification': 'Notificação',
                'task': 'Task'
            };
            
            return `
                <div class="dashboard-item type-${item.type}" data-type="${item.type}" data-id="${item.id}">
                    <div class="item-header">
                        <div class="item-icon">${item.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem; color: #2d3748;">
                                ${item.title}
                            </div>
                            ${item.priority ? `
                            <span class="task-priority-badge task-priority-${item.priority}" style="font-size: 0.65rem; margin-top: 0.25rem; display: inline-block;">
                                ${item.priority}
                            </span>
                            ` : ''}
                        </div>
                        <span class="item-type-badge">${typeLabels[item.type]}</span>
                    </div>
                    
                    <div class="item-content">
                        ${item.content}
                    </div>
                    
                    ${item.reasoning?.expectedImpact ? `
                    <div style="font-size: 0.75rem; color: #4a5568; padding: 0.5rem; background: #f7fafc; border-radius: 4px; margin-bottom: 0.5rem;">
                        <strong>💡 Impacto:</strong> ${item.reasoning.expectedImpact}
                    </div>
                    ` : ''}
                    
                    <div class="item-actions">
                        ${this.renderItemActions(item)}
                    </div>
                </div>
            `;
        },
        
        // 🆕 RENDER ACTIONS BASED ON ITEM TYPE
        renderItemActions(item) {
            switch(item.type) {
                case 'insight':
                    return `
                        <button class="item-btn btn-pin" onclick="window.agentsModule.pinItem('${item.id}')">
                            📌 Fixar
                        </button>
                        <button class="item-btn btn-archive" onclick="window.agentsModule.archiveItem('${item.id}')">
                            🗑️ Arquivar
                        </button>
                        <button class="item-btn btn-delete" onclick="window.agentsModule.deleteItem('${item.id}')" style="background: #dc3545; color: white;">
                            🗑️ Deletar
                        </button>
                    `;
                
                case 'notification':
                    // 🆕 Se a notificação tem executionMethod, mostrar botão de execução
                    const hasExecutionMethod = item.executionMethod || (item.content && (
                        item.content.includes('executionMethod') || 
                        item.content.includes('MCP_IMMEDIATE') ||
                        item.content.includes('TASK_SCHEDULED')
                    ));
                    
                    let executionButton = '';
                    if (hasExecutionMethod) {
                        const method = item.executionMethod || 'MCP_IMMEDIATE';
                        const buttonConfig = {
                            'MCP_IMMEDIATE': { icon: '⚡', label: 'Executar Agora', class: 'btn-execute-mcp' },
                            'TASK_SCHEDULED': { icon: '📅', label: 'Agendar Task', class: 'btn-schedule' },
                            'USER_INTERVENTION': { icon: '👤', label: 'Requer Ação', class: 'btn-user-action' }
                        };
                        
                        const config = buttonConfig[method] || buttonConfig['MCP_IMMEDIATE'];
                        executionButton = `
                            <button class="item-btn ${config.class}" 
                                    onclick="window.agentsModule.executeAction('${item.id}', '${method}')"
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600;">
                                ${config.icon} ${config.label}
                            </button>
                        `;
                    }
                    
                    return `
                        ${executionButton}
                        <button class="item-btn btn-mark-read" onclick="window.agentsModule.markAsRead('${item.id}')">
                            ✓ Marcar Lida
                        </button>
                        <button class="item-btn btn-silence" onclick="window.agentsModule.silenceNotification('${item.id}')">
                            🔕 Silenciar
                        </button>
                        <button class="item-btn btn-delete" onclick="window.agentsModule.deleteItem('${item.id}')" style="background: #dc3545; color: white;">
                            🗑️ Deletar
                        </button>
                    `;
                
                case 'task':
                    // 🆕 Botão de execução para tasks aprovadas
                    const isApproved = item.status === 'APPROVED';
                    const executeTaskButton = isApproved ? `
                        <button class="item-btn btn-execute-task" 
                                onclick="window.agentsModule.executeTask('${item.id}')"
                                style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 600;">
                            ⚡ Executar Task
                        </button>
                    ` : '';
                    
                    return `
                        ${executeTaskButton}
                        ${item.status === 'PENDING' ? `
                            <button class="item-btn btn-approve" onclick="window.agentsModule.approveTask('${item.id}')">
                                ✅ Aprovar
                            </button>
                            <button class="item-btn btn-reject" onclick="window.agentsModule.rejectTask('${item.id}')">
                                ❌ Recusar
                            </button>
                        ` : ''}
                        <button class="item-btn btn-delete" onclick="window.agentsModule.deleteItem('${item.id}')" style="background: #dc3545; color: white;">
                            🗑️ Deletar
                        </button>
                    `;
                
                default:
                    return '';
            }
        },
        
        // 🆕 FILTER DASHBOARD ITEMS
        filterDashboardItems(type) {
            const grid = document.getElementById('dashboard-items-grid');
            if (!grid) return;
            
            const items = grid.querySelectorAll('.dashboard-item');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update active button
            buttons.forEach(btn => {
                if (btn.dataset.filter === type) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Filter items
            items.forEach(item => {
                if (type === 'all' || item.dataset.type === type) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        },
        
        // 🆕 ITEM ACTIONS
        async pinItem(itemId) {
            console.log('📌 Pinning item:', itemId);
            
            try {
                await this.moduleAPI.request(`/api/agent-insights/${itemId}/pin`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isPinned: true })
                });
                
                window.app?.showToast?.('📌 Item fixado!', 'success');
                
                // Atualizar visualmente
                const item = document.querySelector(`[data-id="${itemId}"]`);
                if (item) {
                    item.style.borderLeft = '4px solid #667eea';
                }
            } catch (error) {
                console.error('Error pinning item:', error);
                window.app?.showToast?.('❌ Erro ao fixar item', 'error');
            }
        },
        
        async archiveItem(itemId) {
            console.log('🗑️ Archiving item:', itemId);
            
            try {
                await this.moduleAPI.request(`/api/agent-insights/${itemId}/archive`, {
                    method: 'PATCH'
                });
                
                const item = document.querySelector(`[data-id="${itemId}"]`);
                if (item) {
                    item.style.opacity = '0.5';
                    item.style.pointerEvents = 'none';
                    setTimeout(() => item.remove(), 500);
                }
                window.app?.showToast?.('🗑️ Item arquivado', 'info');
            } catch (error) {
                console.error('Error archiving item:', error);
                window.app?.showToast?.('❌ Erro ao arquivar item', 'error');
            }
        },
        
        async markAsRead(itemId) {
            console.log('✓ Marking as read:', itemId);
            
            try {
                await this.moduleAPI.request(`/api/agent-insights/${itemId}/read`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isRead: true })
                });
                
                const item = document.querySelector(`[data-id="${itemId}"]`);
                if (item) {
                    item.style.opacity = '0.6';
                    item.querySelector('.item-actions').innerHTML = '<span style="color: #28a745; font-size: 0.85rem;">✓ Lida</span>';
                }
                window.app?.showToast?.('✓ Marcada como lida', 'success');
            } catch (error) {
                console.error('Error marking as read:', error);
                window.app?.showToast?.('❌ Erro ao marcar como lida', 'error');
            }
        },
        
        async silenceNotification(itemId) {
            console.log('🔕 Silencing notification:', itemId);
            
            try {
                await this.moduleAPI.request(`/api/agent-insights/${itemId}/archive`, {
                    method: 'PATCH'
                });
                
                const item = document.querySelector(`[data-id="${itemId}"]`);
                if (item) {
                    item.style.opacity = '0.4';
                    setTimeout(() => item.remove(), 500);
                }
                window.app?.showToast?.('🔕 Notificação silenciada', 'info');
            } catch (error) {
                console.error('Error silencing notification:', error);
                window.app?.showToast?.('❌ Erro ao silenciar', 'error');
            }
        },
        
        async deleteItem(itemId) {
            console.log('🗑️ Deleting item:', itemId);
            
            // Confirmar antes de deletar
            if (!confirm('⚠️ Tem certeza que deseja deletar permanentemente este item?')) {
                return;
            }
            
            try {
                window.app?.showToast?.('⏳ Deletando...', 'info');
                
                // DELETE no backend
                await this.moduleAPI.request(`/api/agent-insights/${itemId}`, {
                    method: 'DELETE'
                });
                
                const item = document.querySelector(`[data-id="${itemId}"]`);
                if (item) {
                    // Animação de fade out
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        item.remove();
                        window.app?.showToast?.('🗑️ Item deletado permanentemente', 'success');
                    }, 300);
                } else {
                    window.app?.showToast?.('🗑️ Item deletado', 'success');
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                window.app?.showToast?.('❌ Erro ao deletar item', 'error');
            }
        },
        
        // 🆕 RENDER TASK CARD (LEGACY - mantido para compatibilidade)
        renderTaskCard(task) {
            const categoryIcons = {
                'WHATSAPP_MESSAGE': '📱',
                'EMAIL': '📧',
                'SMS': '💬',
                'DATABASE_CHANGE': '🗄️',
                'MARKETING': '📢',
                'BILLING': '💰',
                'ENROLLMENT': '🎓'
            };
            
            const icon = categoryIcons[task.category] || '📋';
            
            return `
                <div class="task-card task-category-${task.category}">
                    <div class="task-card-header">
                        <div class="task-icon">${icon}</div>
                        <div style="flex: 1;">
                            <div class="task-title">${task.title}</div>
                            <span class="task-priority-badge task-priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                    <p class="task-description">${task.description}</p>
                    ${task.reasoning?.expectedImpact ? `
                    <div style="font-size: 0.8rem; color: #4a5568; padding: 0.5rem; background: #f7fafc; border-radius: 4px; margin-bottom: 0.5rem;">
                        <strong>💡 Impacto:</strong> ${task.reasoning.expectedImpact}
                    </div>
                    ` : ''}
                    <div class="task-actions">
                        <button class="task-btn task-btn-approve" onclick="window.agentsModule.approveTask('${task.id}')">
                            ✅ Aprovar
                        </button>
                        <button class="task-btn task-btn-reject" onclick="window.agentsModule.rejectTask('${task.id}')">
                            ❌ Recusar
                        </button>
                    </div>
                </div>
            `;
        },
        
        async approveTask(taskId) {
            try {
                window.app?.showToast?.('⏳ Aprovando tarefa...', 'info');
                
                const response = await this.moduleAPI.request(`/api/agent-tasks/${taskId}/approve`, {
                    method: 'PATCH'
                });
                
                if (response.success) {
                    window.app?.showToast?.('✅ Tarefa aprovada com sucesso!', 'success');
                    
                    // Fechar modal e recarregar
                    document.getElementById('execution-result-modal')?.remove();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(response.message || 'Falha ao aprovar tarefa');
                }
            } catch (error) {
                console.error('❌ Error approving task:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'approve-task' });
            }
        },
        
        async rejectTask(taskId) {
            try {
                const reason = prompt('Motivo da recusa (opcional):') || 'Recusado pelo usuário';
                
                window.app?.showToast?.('⏳ Recusando tarefa...', 'info');
                
                const response = await this.moduleAPI.request(`/api/agent-tasks/${taskId}/reject`, {
                    method: 'PATCH',
                    body: JSON.stringify({ reason })
                });
                
                if (response.success) {
                    window.app?.showToast?.('✅ Tarefa recusada', 'success');
                    
                    // Fechar modal e recarregar
                    document.getElementById('execution-result-modal')?.remove();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    throw new Error(response.message || 'Falha ao recusar tarefa');
                }
            } catch (error) {
                console.error('❌ Error rejecting task:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'reject-task' });
            }
        },
        
        // 🆕 EXECUTAR AÇÃO (MCP ou Task Scheduled)
        async executeAction(itemId, executionMethod) {
            try {
                window.app?.showToast?.('⏳ Preparando execução...', 'info');
                
                // Buscar detalhes da ação
                const item = document.querySelector(`[data-id="${itemId}"]`);
                const actionContent = item?.querySelector('.item-content')?.textContent || '';
                
                if (executionMethod === 'MCP_IMMEDIATE') {
                    // Executar via MCP agora mesmo
                    window.app?.showToast?.('🤖 Executando via MCP...', 'info');
                    
                    // TODO: Implementar execução direta via MCP
                    // Por enquanto, criar task que será executada via MCP
                    const response = await this.moduleAPI.request('/api/agent-tasks', {
                        method: 'POST',
                        body: JSON.stringify({
                            title: `Execução MCP: ${actionContent.substring(0, 50)}...`,
                            description: actionContent,
                            category: 'WHATSAPP_MESSAGE', // Inferir da ação
                            priority: 'MEDIUM',
                            actionPayload: { action: actionContent },
                            reasoning: {
                                insights: ['Ação sugerida pelo agente'],
                                expectedImpact: 'Execução via MCP',
                                risks: []
                            }
                        })
                    });
                    
                    if (response.success) {
                        // Aprovar e executar via MCP automaticamente
                        const taskId = response.data.id;
                        await this.approveTask(taskId);
                        
                        const execResponse = await this.moduleAPI.request(`/api/agent-tasks/${taskId}/execute-mcp`, {
                            method: 'POST'
                        });
                        
                        if (execResponse.success) {
                            window.app?.showToast?.('✅ Ação executada via MCP!', 'success');
                            this.showExecutionResultModal(execResponse.data);
                        }
                    }
                    
                } else if (executionMethod === 'TASK_SCHEDULED') {
                    // Criar task agendada
                    window.app?.showToast?.('📅 Criando task agendada...', 'info');
                    
                    const schedule = prompt('Agendamento (ex: daily 08:00, weekly monday 10:00):') || 'daily 08:00';
                    
                    const response = await this.moduleAPI.request('/api/agent-tasks', {
                        method: 'POST',
                        body: JSON.stringify({
                            title: `Task Agendada: ${actionContent.substring(0, 50)}...`,
                            description: actionContent,
                            category: 'DATABASE_CHANGE',
                            priority: 'LOW',
                            actionPayload: { 
                                action: actionContent,
                                schedule: schedule
                            },
                            reasoning: {
                                insights: ['Ação agendada pelo agente'],
                                expectedImpact: `Executará ${schedule}`,
                                risks: []
                            }
                        })
                    });
                    
                    if (response.success) {
                        window.app?.showToast?.('✅ Task agendada criada!', 'success');
                        window.location.hash = 'dashboard';
                    }
                    
                } else if (executionMethod === 'USER_INTERVENTION') {
                    // Apenas mostrar aviso
                    window.app?.showToast?.('👤 Esta ação requer intervenção manual', 'warning');
                    alert(`⚠️ AÇÃO REQUER INTERVENÇÃO HUMANA\n\n${actionContent}\n\nPor favor, execute manualmente no sistema.`);
                }
                
            } catch (error) {
                console.error('❌ Error executing action:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'execute-action' });
            }
        },
        
        // 🆕 EXECUTAR TASK APROVADA
        async executeTask(taskId) {
            try {
                if (!confirm('⚡ Executar esta task agora via MCP?')) {
                    return;
                }
                
                window.app?.showToast?.('🤖 Executando task via MCP...', 'info');
                
                const response = await this.moduleAPI.request(`/api/agent-tasks/${taskId}/execute-mcp`, {
                    method: 'POST'
                });
                
                if (response.success) {
                    window.app?.showToast?.('✅ Task executada com sucesso!', 'success');
                    this.showExecutionResultModal(response.data);
                } else {
                    throw new Error(response.message || 'Falha ao executar task');
                }
                
            } catch (error) {
                console.error('❌ Error executing task:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'execute-task' });
            }
        },
        
        // 🆕 MOSTRAR MODAL COM RESULTADO DE EXECUÇÃO MCP
        showExecutionResultModal(result) {
            const modalHTML = `
                <div class="modal-overlay" id="mcp-execution-modal">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-gradient-primary">
                                <h3>⚡ Execução via MCP Concluída</h3>
                                <button class="modal-close" onclick="document.getElementById('mcp-execution-modal').remove()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-success mb-3">
                                    <strong>✅ Sucesso!</strong> Task executada via MCP
                                </div>
                                
                                ${result.agentResponse ? `
                                <div class="mb-3">
                                    <h5>🤖 Resposta do Agente</h5>
                                    <pre class="code-block">${result.agentResponse}</pre>
                                </div>
                                ` : ''}
                                
                                ${result.toolsUsed?.length > 0 ? `
                                <div class="mb-3">
                                    <h5>🛠️ Ferramentas Utilizadas</h5>
                                    <div class="d-flex gap-2">
                                        ${result.toolsUsed.map(tool => `
                                            <span class="badge badge-primary">${tool}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                                
                                ${result.reasoning ? `
                                <div class="mb-3">
                                    <h5>💡 Raciocínio</h5>
                                    <p>${result.reasoning}</p>
                                </div>
                                ` : ''}
                                
                                ${result.result ? `
                                <div class="mb-3">
                                    <h5>📊 Resultado</h5>
                                    <pre class="code-block">${JSON.stringify(result.result, null, 2)}</pre>
                                </div>
                                ` : ''}
                                
                                <div class="text-muted">
                                    <small>⏱️ Executado em ${result.duration}ms</small>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-form btn-secondary-form" onclick="document.getElementById('mcp-execution-modal').remove()">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },
        
        async suggestAgents() {
            try {
                window.app?.showToast?.('🔮 Analisando seu negócio...', 'info');
                
                const response = await this.moduleAPI.request('/api/agents/orchestrator/suggest', {
                    method: 'POST',
                    timeout: 20000,
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
                    
                    // 🆕 NOVO FORMATO: allAgents = existingAgents + suggestedAgents
                    const allAgents = response.data?.allAgents || [];
                    const existingAgents = response.data?.existingAgents || [];
                    const suggestedAgents = response.data?.suggestedAgents || [];
                    
                    console.log(`📊 Found ${existingAgents.length} existing agents + ${suggestedAgents.length} new suggestions`);
                    
                    if (allAgents.length === 0) {
                        window.app?.showToast?.('⚠️ Nenhum agente disponível no momento', 'warning');
                        return;
                    }
                    
                    // ✅ Salvar TODOS os agentes (criados + sugestões)
                    this.suggestions = allAgents;
                    console.log(`💾 Setting suggestions array (length: ${this.suggestions.length})`);
                    this.saveSuggestionsToStorage();
                    
                    // ✅ Re-renderizar para mostrar TODOS
                    this.render();
                    this.setupEvents();
                    
                    const message = existingAgents.length > 0 
                        ? `✅ ${existingAgents.length} agentes criados + ${suggestedAgents.length} novas sugestões!`
                        : `✅ ${suggestedAgents.length} agentes sugeridos com sucesso!`;
                    
                    window.app?.showToast?.(message, 'success');
                } else {
                    throw new Error(response.message || 'Falha ao sugerir agentes');
                }
            } catch (error) {
                console.error('❌ Error suggesting agents:', error);
                window.app?.handleError?.(error, { module: 'agents', context: 'suggest' });
            }
        },
        
        showSuggestionsModal(suggestions, stats) {
            const modal = document.getElementById('agents-modal-container');
            if (!modal) return;
            
            const statsHTML = stats ? `
                <div class="suggestion-stats">
                    <h4>📊 Análise da sua Academia</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${stats.students || 0}</span>
                            <span class="stat-label">Alunos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.courses || 0}</span>
                            <span class="stat-label">Cursos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.leads || 0}</span>
                            <span class="stat-label">Leads</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${stats.subscriptions || 0}</span>
                            <span class="stat-label">Assinaturas</span>
                        </div>
                    </div>
                </div>
            ` : '';
            
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.innerHTML = ''">
                    <div class="modal-content suggestion-modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>🤖 Agentes Sugeridos pela IA</h2>
                            <button class="modal-close" onclick="document.getElementById('agents-modal-container').innerHTML = ''">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${statsHTML}
                            <div class="suggestions-list">
                                <h4>💡 Recomendações</h4>
                                ${suggestions.map((suggestion, index) => `
                                    <div class="suggestion-card">
                                        <div class="suggestion-header">
                                            <h3>
                                                ${this.agentTypes[suggestion.type]?.icon || '🤖'}
                                                ${suggestion.name}
                                            </h3>
                                            <span class="suggestion-type">${this.agentTypes[suggestion.type]?.label || suggestion.type}</span>
                                        </div>
                                        <p class="suggestion-description">${suggestion.description}</p>
                                        <p class="suggestion-justification">
                                            <strong>Por que criar:</strong> ${suggestion.justification}
                                        </p>
                                        <div class="suggestion-actions">
                                            <button class="btn-form btn-primary-form" 
                                                    onclick="agentsModule.createAgentFromSuggestion(${index})">
                                                <i class="fas fa-plus"></i> Criar Este Agente
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-form btn-secondary-form" 
                                    onclick="document.getElementById('agents-modal-container').innerHTML = ''">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Armazenar sugestões para uso posterior
            this._currentSuggestions = suggestions;
        },
        
        async createAgentFromSuggestion(index) {
            console.log('🔍 [createAgentFromSuggestion] Called with index:', index);
            console.log('🔍 [createAgentFromSuggestion] Total suggestions:', this.suggestions?.length);
            const suggestion = this.suggestions?.[index];
            console.log('🔍 [createAgentFromSuggestion] Retrieved suggestion:', suggestion?.name);
            if (!suggestion) {
                console.error('❌ Suggestion not found at index:', index);
                console.error('❌ Available suggestions:', this.suggestions?.map((s, i) => `[${i}] ${s.name} (${s.status})`));
                return;
            }
            
            // 🆕 ABRE MODAL ao invés de criar automático
            this.showAgentCreationModal(suggestion, index);
        },
        
        /**
         * 🆕 Mostra modal para customizar agente antes de criar
         */
        showAgentCreationModal(suggestion = null, suggestionIndex = null) {
            const typeMapping = {
                'marketing': 'commercial',
                'comercial': 'commercial',
                'pedagogico': 'pedagogical',
                'financeiro': 'commercial',
                'atendimento': 'support'
            };
            
            const systemPrompts = {
                'marketing': 'Você é um especialista em marketing digital para academias de Krav Maga. Atraia novos alunos com estratégias criativas e análise de leads.',
                'comercial': 'Você é um especialista em vendas e relacionamento com clientes. Analise oportunidades e sugira ações comerciais.',
                'pedagogico': 'Você é um educador especialista em artes marciais. Desenvolva cursos e garanta qualidade pedagógica.',
                'financeiro': 'Você é um especialista em gestão financeira. Monitore pagamentos, inadimplências e otimize receitas.',
                'atendimento': 'Você é um especialista em atendimento ao cliente. Responda dúvidas e resolva problemas rapidamente via WhatsApp ou outros canais.'
            };
            
            const type = suggestion?.type?.toLowerCase() || 'atendimento';
            const specialization = typeMapping[type] || 'support';
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px);';
            
            modal.innerHTML = `
                <div style="background:white;border-radius:12px;width:90%;max-width:700px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
                    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:24px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;">
                        <h2 style="margin:0;font-size:24px;font-weight:600;">🤖 ${suggestion ? 'Customizar Agente' : 'Criar Novo Agente'}</h2>
                        <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;width:36px;height:36px;border-radius:50%;cursor:pointer;">×</button>
                    </div>
                    
                    <div style="padding:24px;">
                        <form id="agent-creation-form">
                            <div style="margin-bottom:20px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">Nome do Agente *</label>
                                <input type="text" name="name" required value="${suggestion?.name || ''}" placeholder="Ex: Agente de Marketing" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;">
                            </div>
                            
                            <div style="margin-bottom:20px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">Descrição *</label>
                                <textarea name="description" required rows="3" placeholder="Descreva o que este agente fará..." style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;box-sizing:border-box;">${suggestion?.description || ''}</textarea>
                            </div>
                            
                            <div style="margin-bottom:20px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">Especialização *</label>
                                <select name="specialization" required style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;">
                                    <option value="commercial" ${specialization === 'commercial' ? 'selected' : ''}>💰 Comercial/Marketing</option>
                                    <option value="pedagogical" ${specialization === 'pedagogical' ? 'selected' : ''}>📚 Pedagógico</option>
                                    <option value="support" ${specialization === 'support' ? 'selected' : ''}>💬 Atendimento/Suporte</option>
                                    <option value="curriculum" ${specialization === 'curriculum' ? 'selected' : ''}>🎓 Currículo/Planos de Aula</option>
                                    <option value="analytical" ${specialization === 'analytical' ? 'selected' : ''}>📊 Analítico/Relatórios</option>
                                    <option value="progression" ${specialization === 'progression' ? 'selected' : ''}>📈 Progressão de Alunos</option>
                                </select>
                            </div>
                            
                            <div style="margin-bottom:20px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">System Prompt (Personalidade do Agente) *</label>
                                <textarea name="systemPrompt" required rows="5" placeholder="Defina como o agente deve se comportar..." style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:13px;font-family:'Courier New',monospace;resize:vertical;box-sizing:border-box;">${systemPrompts[type] || systemPrompts['atendimento']}</textarea>
                            </div>
                            
                            <div style="margin-bottom:20px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">🔧 MCP Tools (Ferramentas de Integração)</label>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="database" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">💾 Database (Consultas)</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="notifications" style="margin-right:8px;">
                                        <span style="font-size:13px;">📧 Notificações (Email/SMS)</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="whatsapp" style="margin-right:8px;">
                                        <span style="font-size:13px;">📱 WhatsApp</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="asaas" style="margin-right:8px;">
                                        <span style="font-size:13px;">💳 Asaas (Pagamentos)</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="reports" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">📊 Relatórios</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="tools" value="calendar" style="margin-right:8px;">
                                        <span style="font-size:13px;">📅 Calendário</span>
                                    </label>
                                </div>
                                <p style="font-size:12px;color:#6b7280;margin-top:8px;">⚠️ Ações que modificam dados exigirão sua aprovação</p>
                            </div>
                            
                            <div style="margin-bottom:24px;">
                                <label style="display:block;font-weight:600;margin-bottom:8px;color:#333;">📚 RAG Sources (Fontes de Dados)</label>
                                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="ragSources" value="courses" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">Cursos</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="ragSources" value="students" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">Alunos</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="ragSources" value="subscriptions" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">Assinaturas</span>
                                    </label>
                                    <label style="display:flex;align-items:center;padding:8px;background:#f9fafb;border-radius:6px;cursor:pointer;">
                                        <input type="checkbox" name="ragSources" value="lesson_plans" checked style="margin-right:8px;">
                                        <span style="font-size:13px;">Planos de Aula</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div style="margin-bottom:20px;padding:16px;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border-radius:8px;border:2px solid #0ea5e9;">
                                <label style="display:flex;align-items:center;cursor:pointer;">
                                    <input type="checkbox" name="autoSaveInsights" checked style="width:18px;height:18px;margin-right:12px;cursor:pointer;">
                                    <div>
                                        <div style="font-weight:600;color:#0c4a6e;font-size:14px;">💾 Auto-salvar Insights e Notificações</div>
                                        <div style="font-size:12px;color:#075985;margin-top:4px;">Salva automaticamente insights e notificações no banco de dados após cada execução. Você pode visualizá-los no dashboard sem precisar aprovar manualmente.</div>
                                    </div>
                                </label>
                            </div>
                            
                            <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:20px;border-top:2px solid #e5e7eb;">
                                <button type="button" onclick="this.closest('.modal-overlay').remove()" style="padding:12px 24px;border:2px solid #e5e7eb;background:white;color:#374151;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Cancelar</button>
                                <button type="submit" style="padding:12px 24px;border:none;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">🤖 Criar Agente</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Handler do formulário
            const form = modal.querySelector('#agent-creation-form');
            const self = this;
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const rawTools = formData.getAll('tools') || [];
                const rawRagSources = formData.getAll('ragSources') || [];
                const specializationValue = formData.get('specialization') || 'support';
                const normalizedType = self.normalizeAgentType(suggestion?.type, specializationValue);
                const sanitizedTools = rawTools.length > 0 ? rawTools.map(value => value.toString()) : ['database'];
                const ragSources = rawRagSources.map(value => value.toString());
                
                const config = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    type: normalizedType,
                    systemPrompt: formData.get('systemPrompt'),
                    autoSaveInsights: formData.get('autoSaveInsights') === 'on',
                    tools: sanitizedTools,
                    ragSources,
                    isActive: true
                };
                
                try {
                    console.log('🔧 Creating agent with config:', config);
                    
                    const response = await self.moduleAPI.request('/api/agents/orchestrator/create', {
                        method: 'POST',
                        body: JSON.stringify(config)
                    });
                    
                    if (response.success) {
                        window.app?.showToast?.('✅ Agente criado com sucesso!', 'success');
                        
                        if (suggestionIndex !== null) {
                            self.removeSuggestion(suggestionIndex);
                        }
                        
                        await self.loadAgents();
                        self.render();
                        self.setupEvents();
                        modal.remove();
                    } else {
                        throw new Error(response.message || 'Falha ao criar agente');
                    }
                } catch (error) {
                    console.error('❌ Error creating agent:', error);
                    window.app?.handleError?.(error, { module: 'agents', context: 'create-agent' });
                }
            });
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) modal.remove();
            });
        },
        
        removeSuggestion(index) {
            if (index >= 0 && index < this.suggestions.length) {
                this.suggestions.splice(index, 1);
                this.saveSuggestionsToStorage();
                this.render();
                this.setupEvents();
                window.app?.showToast?.('🗑️ Sugestão removida', 'info');
            }
        },
        
        clearAllSuggestions() {
            if (this.suggestions.length === 0) {
                window.app?.showToast?.('⚠️ Nenhuma sugestão para limpar', 'warning');
                return;
            }
            
            const count = this.suggestions.length;
            this.suggestions = [];
            this.saveSuggestionsToStorage();
            this.render();
            this.setupEvents();
            window.app?.showToast?.(`🗑️ ${count} sugestões removidas`, 'success');
        },
        
        // Debug helper - para chamar no console
        debugSuggestions() {
            console.log('🔍 DEBUG Suggestions State:');
            console.log('  - Module suggestions array:', this.suggestions);
            console.log('  - localStorage value:', localStorage.getItem('agent_suggestions'));
            console.log('  - Parsed from storage:', JSON.parse(localStorage.getItem('agent_suggestions') || '[]'));
            return {
                moduleSuggestions: this.suggestions,
                storageRaw: localStorage.getItem('agent_suggestions'),
                storageParsed: JSON.parse(localStorage.getItem('agent_suggestions') || '[]')
            };
        }
    };

    // Global export IMMEDIATELY
    window.AgentsModule = AgentsModule;
    window.agentsModule = AgentsModule;
    window.agents = AgentsModule; // For app.js compatibility

    console.log('🌐 [Agents Module] Exported to global scope');

} // end if
