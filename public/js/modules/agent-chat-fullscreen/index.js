// ===== AGENT CHAT FULLSCREEN MODULE =====
// Módulo completo de chat com agentes seguindo padrão ChatGPT/Claude

// Prevenir re-declaração
if (typeof window.AgentChatFullscreen !== 'undefined') {
    console.log('AgentChatFullscreen module already loaded');
} else {

const AgentChatFullscreen = {
    // Estado do módulo
    state: {
        agents: [],
        conversations: [],
        currentAgent: null,
        currentConversation: null,
        sidebarCollapsed: false,
        isLoading: false
    },

    // API Client
    api: null,

    // Elementos DOM
    elements: {},

    // Inicializar módulo
    async init() {
        console.log('🚀 Initializing AgentChatFullscreen module...');
        
        // Aguardar API Client
        await this.initializeAPI();
        
        // Cache elementos DOM
        this.cacheElements();
        
        // Carregar dados
        await this.loadAgents();
        await this.loadConversations();
        
        // Setup eventos
        this.setupEvents();
        
        // Registrar módulo globalmente
        window.agentChatFullscreen = this;
        window.app?.dispatchEvent('module:loaded', { name: 'agentChatFullscreen' });
        
        console.log('✅ AgentChatFullscreen initialized');
    },

    // Inicializar API Client
    async initializeAPI() {
        // Aguardar até que createModuleAPI esteja disponível (máximo 10 segundos)
        let attempts = 0;
        while (!window.createModuleAPI && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.createModuleAPI) {
            console.error('❌ createModuleAPI not available after 10 seconds');
            throw new Error('API Client not available');
        }
        
        this.api = window.createModuleAPI('AgentChatFullscreen');
        console.log('✅ Agent Chat Fullscreen API initialized');
    },

    // Cache elementos DOM
    cacheElements() {
        this.elements = {
            // Sidebar
            sidebar: document.getElementById('chatSidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            btnNewChat: document.getElementById('btnNewChat'),
            agentsList: document.getElementById('agentsList'),
            conversationsList: document.getElementById('conversationsList'),
            
            // Main
            agentInfo: document.getElementById('agentInfo'),
            btnClearChat: document.getElementById('btnClearChat'),
            btnSettings: document.getElementById('btnSettings'),
            chatMessages: document.getElementById('chatMessages'),
            // welcomeScreen removido - não mais necessário
            
            // Input
            chatInput: document.getElementById('chatInput'),
            btnSend: document.getElementById('btnSend'),
            charCount: document.getElementById('charCount')
        };
        
        // Verificar se todos os elementos foram encontrados
        const missingElements = Object.entries(this.elements)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
            
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing DOM elements:', missingElements);
        }
    },

    // Setup eventos
    setupEvents() {
        // Verificar se elementos existem antes de adicionar eventos
        if (!this.elements.sidebarToggle || !this.elements.btnNewChat || !this.elements.chatInput) {
            console.error('❌ Cannot setup events - required elements not found');
            return;
        }
        
        // Sidebar toggle
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Nova conversa
        this.elements.btnNewChat.addEventListener('click', () => this.startNewConversation());
        
        // Clear chat
        if (this.elements.btnClearChat) {
            this.elements.btnClearChat.addEventListener('click', () => this.clearCurrentChat());
        }
        
        // Input
        this.elements.chatInput.addEventListener('input', (e) => this.handleInputChange(e));
        this.elements.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Send button
        if (this.elements.btnSend) {
            this.elements.btnSend.addEventListener('click', () => this.sendMessage());
        }
        
        // Quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        console.log('✅ Agent Chat events setup complete');
    },

    // Carregar agentes
    async loadAgents() {
        try {
            this.showLoadingState('agentsList', 'Carregando agentes...');
            
            // Corrigido: endpoint correto é /api/agents (não orchestrator/agents)
            const response = await this.api.request('/api/agents');
            
            if (response.success && response.data) {
                this.state.agents = response.data;
                this.renderAgents();
            } else {
                this.showEmptyState('agentsList', 'Nenhum agente disponível');
            }
        } catch (error) {
            console.error('Error loading agents:', error);
            this.showErrorState('agentsList', 'Erro ao carregar agentes');
        }
    },

    // Renderizar agentes
    renderAgents() {
        const html = this.state.agents.map(agent => {
            const icon = this.getAgentIcon(agent.specialization);
            const isActive = this.state.currentAgent?.id === agent.id;
            
            return `
                <div class="agent-item ${isActive ? 'active' : ''}" data-agent-id="${agent.id}">
                    <div class="agent-item-header">
                        <span class="agent-item-icon">${icon}</span>
                        <span class="agent-item-name">${agent.name}</span>
                    </div>
                    <div class="agent-item-specialization">${this.formatSpecialization(agent.specialization)}</div>
                </div>
            `;
        }).join('');
        
        this.elements.agentsList.innerHTML = html;
        
        // Adicionar eventos de clique
        document.querySelectorAll('.agent-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const agentId = e.currentTarget.dataset.agentId;
                this.selectAgent(agentId);
            });
        });
    },

    // Carregar conversas
    async loadConversations() {
        try {
            // Usar novo endpoint com limite configurável
            const response = await this.api.request('/api/agents/conversations?limit=10');
            
            if (response.success && response.data) {
                this.state.conversations = Array.isArray(response.data) 
                    ? response.data 
                    : []; // Backend já retorna últimas 10 ordenadas por updatedAt DESC
                this.renderConversations();
            }
        } catch (error) {
            console.warn('Warning loading conversations (using empty state):', error);
            this.state.conversations = [];
            this.renderConversations();
        }
    },

    // Renderizar conversas
    renderConversations() {
        if (this.state.conversations.length === 0) {
            this.elements.conversationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div>Nenhuma conversa ainda</div>
                </div>
            `;
            return;
        }
        
        const html = this.state.conversations.map(conv => {
            const isActive = this.state.currentConversation?.id === conv.id;
            const date = new Date(conv.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short'
            });
            
            const lastMessage = conv.messages?.[conv.messages.length - 1];
            const preview = lastMessage?.text?.substring(0, 60) || 'Nova conversa';
            
            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" data-conversation-id="${conv.id}">
                    <div class="conversation-item-title">${conv.title || 'Conversa sem título'}</div>
                    <div class="conversation-item-preview">${preview}...</div>
                    <div class="conversation-item-date">${date}</div>
                </div>
            `;
        }).join('');
        
        this.elements.conversationsList.innerHTML = html;
        
        // Adicionar eventos de clique
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const conversationId = e.currentTarget.dataset.conversationId;
                this.loadConversation(conversationId);
            });
        });
    },

    // Selecionar agente
    async selectAgent(agentId) {
        const agent = this.state.agents.find(a => a.id === agentId);
        if (!agent) return;
        
        this.state.currentAgent = agent;
        this.state.currentConversation = null;
        
        // Atualizar UI
        this.updateAgentInfo(agent);
        this.clearMessages();
        this.renderAgents(); // Re-render para atualizar active state
        
        // Adicionar mensagem de boas-vindas
        this.addAgentWelcomeMessage(agent);
        
        // Habilitar input
        this.elements.chatInput.disabled = false;
        this.elements.chatInput.focus();
    },

    // Atualizar info do agente
    updateAgentInfo(agent) {
        const icon = this.getAgentIcon(agent.specialization);
        const specialization = this.formatSpecialization(agent.specialization);
        
        this.elements.agentInfo.innerHTML = `
            <div class="agent-avatar">${icon}</div>
            <div class="agent-details">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-specialization">${specialization}</div>
            </div>
        `;
    },

    // Adicionar mensagem de boas-vindas
    addAgentWelcomeMessage(agent) {
        const welcomeText = this.getAgentWelcomeMessage(agent.specialization);
        
        this.addMessage({
            role: 'agent',
            text: welcomeText,
            agentName: agent.name,
            timestamp: new Date()
        });
    },

    // Enviar mensagem
    async sendMessage() {
        const message = this.elements.chatInput.value.trim();
        
        if (!message || !this.state.currentAgent) return;
        
        // Adicionar mensagem do usuário
        this.addMessage({
            role: 'user',
            text: message,
            timestamp: new Date()
        });
        
        // Limpar input
        this.elements.chatInput.value = '';
        this.updateCharCount();
        
        // Desabilitar input durante processamento
        this.elements.chatInput.disabled = true;
        this.elements.btnSend.disabled = true;
        
        // Adicionar indicador de loading
        this.addLoadingMessage();
        
        try {
            // Enviar para API (timeout 60s - Gemini pode demorar)
            const response = await this.api.request('/api/agents/chat', {
                method: 'POST',
                body: JSON.stringify({
                    agentId: this.state.currentAgent.id,
                    message: message,
                    conversationId: this.state.currentConversation?.id
                }),
                timeout: 60000 // 60 segundos
            });
            
            // Remover loading
            this.removeLoadingMessage();
            
            if (response.success && response.data) {
                // Atualizar conversação
                this.state.currentConversation = response.data;
                
                // Adicionar resposta do agente
                const lastMessage = response.data.messages[response.data.messages.length - 1];
                this.addMessage({
                    role: 'agent',
                    text: lastMessage.content || lastMessage.text || 'Sem resposta', // content (API) ou text (fallback)
                    agentName: this.state.currentAgent.name,
                    timestamp: new Date(lastMessage.timestamp)
                });
                
                // Recarregar lista de conversas
                await this.loadConversations();
            } else {
                throw new Error(response.message || 'Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remover loading
            this.removeLoadingMessage();
            
            // Adicionar mensagem de erro
            this.addMessage({
                role: 'agent',
                text: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
                agentName: this.state.currentAgent.name,
                timestamp: new Date(),
                isError: true
            });
        } finally {
            // Re-habilitar input
            this.elements.chatInput.disabled = false;
            this.elements.btnSend.disabled = false;
            this.elements.chatInput.focus();
        }
    },

    // Adicionar mensagem ao chat
    addMessage(messageData) {
        const { role, text, agentName, timestamp, isError } = messageData;
        
        // Welcome screen removido - não mais necessário
        
        const time = new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const avatar = role === 'user' ? '👤' : this.getAgentIcon(this.state.currentAgent?.specialization);
        const author = role === 'user' ? 'Você' : (agentName || 'Agente');
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${role} ${isError ? 'error' : ''}`;
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${author}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.formatMessageText(text)}</div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    },

    // Adicionar loading message
    addLoadingMessage() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'message agent loading';
        loadingEl.id = 'loading-message';
        loadingEl.innerHTML = `
            <div class="message-avatar">${this.getAgentIcon(this.state.currentAgent?.specialization)}</div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.chatMessages.appendChild(loadingEl);
        this.scrollToBottom();
    },

    // Remover loading message
    removeLoadingMessage() {
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) {
            loadingEl.remove();
        }
    },

    // Formatar texto da mensagem
    formatMessageText(text) {
        // Validar entrada
        if (!text || typeof text !== 'string') {
            console.warn('⚠️ formatMessageText recebeu texto inválido:', text);
            return '';
        }
        
        // Quebras de linha
        text = text.replace(/\n/g, '<br>');
        
        // Markdown bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Markdown italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Listas
        text = text.replace(/^- (.+)$/gm, '• $1');
        
        return text;
    },

    // Limpar mensagens
    clearMessages() {
        const messages = this.elements.chatMessages.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
        
        // Welcome screen removido - não mais necessário
    },

    // Scroll to bottom
    scrollToBottom() {
        setTimeout(() => {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }, 100);
    },

    // Handle input change
    handleInputChange(e) {
        const value = e.target.value;
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        
        // Update char count
        this.updateCharCount();
        
        // Enable/disable send button
        this.elements.btnSend.disabled = value.trim().length === 0 || !this.state.currentAgent;
    },

    // Update char count
    updateCharCount() {
        const length = this.elements.chatInput.value.length;
        this.elements.charCount.textContent = `${length} / 4000`;
        
        if (length > 3800) {
            this.elements.charCount.style.color = '#e53e3e';
        } else {
            this.elements.charCount.style.color = '#a0aec0';
        }
    },

    // Handle key down
    handleKeyDown(e) {
        // Enter sem Shift = enviar
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.elements.btnSend.disabled) {
                this.sendMessage();
            }
        }
    },

    // Toggle sidebar
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        this.elements.sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
    },

    // Start new conversation
    startNewConversation() {
        this.state.currentConversation = null;
        this.clearMessages();
        
        if (this.state.currentAgent) {
            this.addAgentWelcomeMessage(this.state.currentAgent);
        }
        
        this.renderConversations(); // Re-render para limpar active state
    },

    // Clear current chat
    clearCurrentChat() {
        if (confirm('Deseja limpar toda a conversa atual?')) {
            this.startNewConversation();
        }
    },

    // Handle quick action
    handleQuickAction(action) {
        // Encontrar agente por especialização
        const specializationMap = {
            'enrollment': 'pedagogical',
            'financial': 'financial',
            'marketing': 'marketing',
            'support': 'support'
        };
        
        const specialization = specializationMap[action];
        const agent = this.state.agents.find(a => a.specialization === specialization);
        
        if (agent) {
            this.selectAgent(agent.id);
        } else {
            alert('Agente não encontrado para esta especialização');
        }
    },

    // Load conversation
    async loadConversation(conversationId) {
        try {
            const response = await this.api.request(`/api/agents/conversations/${conversationId}`);
            
            if (response.success && response.data) {
                this.state.currentConversation = response.data;
                
                // Selecionar agente
                if (response.data.agentId) {
                    const agent = this.state.agents.find(a => a.id === response.data.agentId);
                    if (agent) {
                        this.state.currentAgent = agent;
                        this.updateAgentInfo(agent);
                    }
                }
                
                // Renderizar mensagens
                this.clearMessages();
                response.data.messages.forEach(msg => {
                    this.addMessage({
                        role: msg.role,
                        text: msg.text,
                        agentName: this.state.currentAgent?.name,
                        timestamp: new Date(msg.timestamp)
                    });
                });
                
                // Atualizar UI
                this.renderConversations();
                this.elements.chatInput.disabled = false;
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    },

    // Helpers
    getAgentIcon(specialization) {
        const icons = {
            'pedagogical': '📚',
            'financial': '💰',
            'marketing': '📢',
            'support': '💬',
            'administrative': '⚙️'
        };
        return icons[specialization] || '🤖';
    },

    formatSpecialization(specialization) {
        const names = {
            'pedagogical': 'Pedagógico',
            'financial': 'Financeiro',
            'marketing': 'Marketing',
            'support': 'Atendimento',
            'administrative': 'Administrativo'
        };
        return names[specialization] || specialization;
    },

    getAgentWelcomeMessage(specialization) {
        const messages = {
            'pedagogical': '👋 Olá! Sou o agente pedagógico. Posso ajudá-lo com matrículas, planos de aula, e validação de cadastros. Como posso ajudar?',
            'financial': '👋 Olá! Sou o agente financeiro. Posso auxiliar com análise de inadimplência, relatórios e cobranças. No que posso ajudar?',
            'marketing': '👋 Olá! Sou o agente de marketing. Posso ajudar com campanhas, engajamento e análise de conversão. Como posso ajudar?',
            'support': '👋 Olá! Sou o agente de atendimento. Estou aqui para responder suas dúvidas e fornecer suporte. Como posso ajudar?',
            'administrative': '👋 Olá! Sou o agente administrativo. Posso ajudar com tarefas administrativas e relatórios. Como posso ajudar?'
        };
        return messages[specialization] || '👋 Olá! Como posso ajudá-lo hoje?';
    },

    showLoadingState(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <span>${message}</span>
                </div>
            `;
        }
    },

    showEmptyState(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div>${message}</div>
                </div>
            `;
        }
    },

    showErrorState(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div>${message}</div>
                </div>
            `;
        }
    }
};

// NÃO inicializar automaticamente - será chamado pelo router após injeção do HTML
// O router fará: window.AgentChatFullscreen.init() após DOM estar pronto

// Exportar globalmente
window.AgentChatFullscreen = AgentChatFullscreen;
console.log('✅ Agent Chat Fullscreen module loaded (awaiting init)');

} // end if
