/**
 * 💬 Agent Chat Module
 * 
 * RESPONSABILIDADE:
 * - Interface de chat com agentes via GPT
 * - Seleção de agente especializado
 * - Conversação contextual (dentro do escopo do agente)
 * - Execução de ações via comandos
 * 
 * FEATURES:
 * - Chat em tempo real com streaming
 * - Histórico de conversas
 * - Sugestões contextuais
 * - Integração com AgentOrchestrator
 * 
 * USO:
 * const chat = new AgentChatModule(containerElement);
 * await chat.init();
 */

class AgentChatModule {
  constructor(container = null) {
    this.container = container;
    this.moduleAPI = null;
    this.agents = [];
    this.selectedAgent = null;
    this.messages = [];
    this.isTyping = false;
    this.conversationId = null;
    
    // Configurações de tamanho do chat
    this.chatSize = 'medium'; // small, medium, large, fullscreen
    this.sizes = {
      small: { width: '400px', height: '500px' },
      medium: { width: '600px', height: '700px' },
      large: { width: '800px', height: '850px' },
      fullscreen: { width: '100vw', height: '100vh' }
    };
  }

  /**
   * Inicializar módulo
   */
  async init() {
    console.log('💬 [Agent Chat] Initializing...');

    // Verificar container
    if (!this.container) {
      console.warn('⚠️ [Agent Chat] Container not set - using default');
      this.container = document.getElementById('agent-chat-container');
    }

    if (!this.container) {
      throw new Error('Agent Chat container not found');
    }

    // Inicializar API
    await this.initializeAPI();

    // Carregar agentes disponíveis
    await this.loadAgents();

    // Renderizar interface
    this.render();

    // Setup eventos
    this.setupEvents();

    // Aplicar tamanho salvo
    const savedSize = localStorage.getItem('agentChatSize') || 'medium';
    this.setChatSize(savedSize);

    console.log('✅ [Agent Chat] Initialized successfully');
  }

  /**
   * Inicializar API client
   */
  async initializeAPI() {
    await waitForAPIClient();
    this.moduleAPI = window.createModuleAPI('AgentChat');
    console.log('✅ [Agent Chat] API initialized');
  }

  /**
   * Carregar lista de agentes
   */
  async loadAgents() {
    try {
      const response = await this.moduleAPI.request('/api/agents', {
        method: 'GET'
      });

      if (response.success) {
        this.agents = response.data.filter(agent => agent.isActive);
        console.log(`✅ [Agent Chat] Loaded ${this.agents.length} agents`);
      }
    } catch (error) {
      console.error('❌ [Agent Chat] Failed to load agents:', error);
      this.showError('Não foi possível carregar os agentes');
    }
  }

  /**
   * Renderizar interface completa
   */
  render() {
    this.container.innerHTML = `
      <div class="agent-chat-module">
        <!-- Header com seletor de agente -->
        <div class="chat-header">
          <div class="agent-selector-wrapper">
            <label for="agent-select">💬 Conversar com:</label>
            <select id="agent-select" class="agent-select">
              <option value="">Selecione um agente...</option>
              ${this.agents.map(agent => `
                <option value="${agent.id}" data-specialization="${agent.specialization}">
                  ${this.getAgentIcon(agent.specialization)} ${agent.name}
                </option>
              `).join('')}
            </select>
          </div>
          ${this.selectedAgent ? `
            <div class="agent-info">
              <span class="agent-role">${this.getSpecializationLabel(this.selectedAgent.specialization)}</span>
              <span class="agent-status">🟢 Online</span>
            </div>
          ` : ''}
          <div class="chat-size-controls">
            <button class="size-btn ${this.chatSize === 'small' ? 'active' : ''}" data-size="small" title="Pequeno">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <button class="size-btn ${this.chatSize === 'medium' ? 'active' : ''}" data-size="medium" title="Médio">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <button class="size-btn ${this.chatSize === 'large' ? 'active' : ''}" data-size="large" title="Grande">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            <button class="size-btn ${this.chatSize === 'fullscreen' ? 'active' : ''}" data-size="fullscreen" title="Tela cheia">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Área de mensagens -->
        <div id="chat-messages" class="chat-messages">
          ${this.renderMessages()}
        </div>

        <!-- Input de mensagem -->
        <div class="chat-input-wrapper">
          <textarea 
            id="chat-input" 
            class="chat-input" 
            placeholder="${this.selectedAgent ? 'Digite sua mensagem...' : 'Selecione um agente para começar'}"
            rows="3"
            ${!this.selectedAgent ? 'disabled' : ''}
          ></textarea>
          <button 
            id="send-btn" 
            class="btn-send"
            ${!this.selectedAgent ? 'disabled' : ''}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Enviar
          </button>
        </div>

        <!-- Sugestões rápidas -->
        ${this.selectedAgent ? `
          <div class="quick-suggestions">
            <button class="suggestion-btn" data-message="O que você pode fazer?">
              💡 O que você pode fazer?
            </button>
            <button class="suggestion-btn" data-message="Qual é sua especialização?">
              🎯 Qual é sua especialização?
            </button>
            <button class="suggestion-btn" data-message="Mostre informações importantes">
              📊 Mostre informações importantes
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Renderizar mensagens do chat
   */
  renderMessages() {
    if (this.messages.length === 0) {
      return `
        <div class="chat-empty">
          <div class="empty-icon">💬</div>
          <h3>Nenhuma conversa ainda</h3>
          <p>Selecione um agente acima e comece a conversar!</p>
        </div>
      `;
    }

    return this.messages.map(msg => `
      <div class="chat-message ${msg.role}">
        <div class="message-avatar">
          ${msg.role === 'user' ? '👤' : this.getAgentIcon(this.selectedAgent?.specialization)}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${msg.role === 'user' ? 'Você' : this.selectedAgent?.name}</span>
            <span class="message-time">${this.formatTime(msg.timestamp)}</span>
          </div>
          <div class="message-text">${this.formatMessageText(msg.content)}</div>
          ${msg.actions ? this.renderActions(msg.actions) : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderizar ações sugeridas pelo agente
   */
  renderActions(actions) {
    if (!actions || actions.length === 0) return '';

    return `
      <div class="message-actions">
        <p class="actions-label">Ações sugeridas:</p>
        ${actions.map(action => `
          <button 
            class="action-btn" 
            data-action="${action.type}"
            data-payload='${JSON.stringify(action.payload)}'
          >
            ${action.icon || '⚡'} ${action.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Alterar tamanho do chat
   */
  setChatSize(size) {
    if (!this.sizes[size]) {
      console.error('❌ [Agent Chat] Invalid size:', size);
      return;
    }

    this.chatSize = size;
    
    // Aplicar dimensões ao container
    const chatModule = this.container.querySelector('.agent-chat-module');
    if (chatModule) {
      if (size === 'fullscreen') {
        chatModule.style.width = '100vw';
        chatModule.style.height = '100vh';
        chatModule.style.position = 'fixed';
        chatModule.style.top = '0';
        chatModule.style.left = '0';
        chatModule.style.zIndex = '9999';
      } else {
        chatModule.style.width = this.sizes[size].width;
        chatModule.style.height = this.sizes[size].height;
        chatModule.style.position = 'relative';
        chatModule.style.top = 'auto';
        chatModule.style.left = 'auto';
        chatModule.style.zIndex = 'auto';
      }
    }

    // Salvar preferência
    localStorage.setItem('agentChatSize', size);

    // Atualizar botões ativos
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });

    console.log(`✅ [Agent Chat] Size changed to: ${size}`);
  }

  /**
   * Setup event listeners
   */
  setupEvents() {
    // Botões de tamanho
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const size = e.currentTarget.dataset.size;
        this.setChatSize(size);
      });
    });

    // Seleção de agente
    const agentSelect = document.getElementById('agent-select');
    agentSelect?.addEventListener('change', (e) => {
      const agentId = e.target.value;
      if (agentId) {
        this.selectAgent(agentId);
      }
    });

    // Enviar mensagem
    const sendBtn = document.getElementById('send-btn');
    sendBtn?.addEventListener('click', () => this.sendMessage());

    // Enter para enviar (Ctrl+Enter para nova linha)
    const chatInput = document.getElementById('chat-input');
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Sugestões rápidas
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const message = e.target.dataset.message;
        this.sendMessage(message);
      });
    });

    // Ações de mensagens
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const actionType = e.target.dataset.action;
        const payload = JSON.parse(e.target.dataset.payload || '{}');
        this.executeAction(actionType, payload);
      });
    });
  }

  /**
   * Selecionar agente para conversa
   */
  async selectAgent(agentId) {
    this.selectedAgent = this.agents.find(a => a.id === agentId);
    
    if (!this.selectedAgent) {
      console.error('❌ [Agent Chat] Agent not found:', agentId);
      return;
    }

    console.log('✅ [Agent Chat] Agent selected:', this.selectedAgent.name);

    // Limpar conversa anterior
    this.messages = [];
    this.conversationId = this.generateConversationId();

    // Mensagem de boas-vindas do agente
    await this.addAgentMessage(this.getWelcomeMessage(this.selectedAgent));

    // Re-renderizar
    this.render();
    this.setupEvents();
  }

  /**
   * Enviar mensagem
   */
  async sendMessage(customMessage = null) {
    const input = document.getElementById('chat-input');
    const message = customMessage || input?.value.trim();

    if (!message || !this.selectedAgent) return;

    // Adicionar mensagem do usuário
    this.addUserMessage(message);

    // Limpar input
    if (!customMessage) {
      input.value = '';
    }

    // Mostrar typing indicator
    this.showTyping();

    try {
      // Enviar para o backend (schema: agentId, message, conversationId?, studentId?)
      const payload = {
        agentId: this.selectedAgent.id,
        message: message
      };

      // Só adicionar conversationId se for UUID válido (não null, não undefined, não string vazia)
      if (this.conversationId && typeof this.conversationId === 'string' && this.conversationId.length > 0) {
        payload.conversationId = this.conversationId;
      }

      // Log temporário para debug
      console.log('🔍 [Agent Chat] Payload to send:', JSON.stringify(payload, null, 2));
      console.log('🔍 [Agent Chat] conversationId value:', this.conversationId, 'type:', typeof this.conversationId);

      const response = await this.moduleAPI.request('/api/agents/chat', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      this.hideTyping();

      if (response.success) {
        // Resposta vem com array de messages da conversa
        const conversationData = response.data;
        
        // Pegar última mensagem (resposta do agente)
        const lastMessage = conversationData.messages[conversationData.messages.length - 1];
        const agentResponse = lastMessage?.content || 'Resposta recebida';
        
        // TODO: Parse suggestedActions do metadata se disponível
        const actions = conversationData.metadata?.suggestedActions || [];

        this.addAgentMessage(agentResponse, actions);
        
        // Atualizar conversationId
        this.conversationId = conversationData.conversationId;
      } else {
        throw new Error(response.message || 'Erro ao processar mensagem');
      }

    } catch (error) {
      console.error('❌ [Agent Chat] Error sending message:', error);
      this.hideTyping();
      this.addAgentMessage(
        '😕 Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        []
      );
    }
  }

  /**
   * Executar ação sugerida
   */
  async executeAction(actionType, payload) {
    console.log('⚡ [Agent Chat] Executing action:', actionType, payload);

    try {
      const response = await this.moduleAPI.request('/api/agents/execute-action', {
        method: 'POST',
        body: JSON.stringify({
          agentId: this.selectedAgent.id,
          actionType: actionType,
          payload: payload,
          conversationId: this.conversationId
        })
      });

      if (response.success) {
        this.addAgentMessage(
          `✅ Ação executada com sucesso: ${response.data.message || actionType}`
        );
      } else {
        throw new Error(response.message);
      }

    } catch (error) {
      console.error('❌ [Agent Chat] Error executing action:', error);
      this.addAgentMessage(
        `❌ Erro ao executar ação: ${error.message}`
      );
    }
  }

  /**
   * Adicionar mensagem do usuário
   */
  addUserMessage(content) {
    this.messages.push({
      role: 'user',
      content: content,
      timestamp: new Date()
    });

    this.updateMessagesDisplay();
  }

  /**
   * Adicionar mensagem do agente
   */
  addAgentMessage(content, actions = []) {
    this.messages.push({
      role: 'assistant',
      content: content,
      actions: actions,
      timestamp: new Date()
    });

    this.updateMessagesDisplay();
  }

  /**
   * Atualizar display de mensagens
   */
  updateMessagesDisplay() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = this.renderMessages();
      
      // Scroll para última mensagem
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Re-attach event listeners para actions
      document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const actionType = e.target.dataset.action;
          const payload = JSON.parse(e.target.dataset.payload || '{}');
          this.executeAction(actionType, payload);
        });
      });
    }
  }

  /**
   * Mostrar indicador de digitação
   */
  showTyping() {
    this.isTyping = true;
    const messagesContainer = document.getElementById('chat-messages');
    
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'chat-message assistant typing';
    typingIndicator.innerHTML = `
      <div class="message-avatar">
        ${this.getAgentIcon(this.selectedAgent?.specialization)}
      </div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Esconder indicador de digitação
   */
  hideTyping() {
    this.isTyping = false;
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator?.remove();
  }

  /**
   * Gerar ID único de conversa
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mensagem de boas-vindas do agente
   */
  getWelcomeMessage(agent) {
    const messages = {
      'administrative': `Olá! Sou o ${agent.name}, especializado em gestão administrativa. Posso ajudar com matrículas, planos, pagamentos e relatórios. Como posso ajudar hoje?`,
      'pedagogical': `Olá! Sou o ${agent.name}, especializado em gestão pedagógica. Posso ajudar com cursos, planos de aula, progressão de alunos e avaliações. O que você precisa?`,
      'marketing': `Olá! Sou o ${agent.name}, especializado em marketing. Posso ajudar com campanhas, leads, conversões e análises de mercado. Como posso ajudar?`,
      'financial': `Olá! Sou o ${agent.name}, especializado em gestão financeira. Posso ajudar com inadimplência, pagamentos, planos e relatórios financeiros. O que você precisa?`,
      'support': `Olá! Sou o ${agent.name}, especializado em atendimento. Posso ajudar com dúvidas de alunos, suporte e comunicação. Como posso ajudar?`
    };

    return messages[agent.specialization] || `Olá! Sou o ${agent.name}. Como posso ajudar hoje?`;
  }

  /**
   * Ícone do agente por especialização
   */
  getAgentIcon(specialization) {
    const icons = {
      'administrative': '📋',
      'pedagogical': '🎓',
      'marketing': '📢',
      'financial': '💰',
      'support': '🤝'
    };
    return icons[specialization] || '🤖';
  }

  /**
   * Label da especialização
   */
  getSpecializationLabel(specialization) {
    const labels = {
      'administrative': 'Administrativo',
      'pedagogical': 'Pedagógico',
      'marketing': 'Marketing',
      'financial': 'Financeiro',
      'support': 'Atendimento'
    };
    return labels[specialization] || specialization;
  }

  /**
   * Formatar texto da mensagem (markdown básico)
   */
  formatMessageText(text) {
    // Converter markdown básico
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>') // `code`
      .replace(/\n/g, '<br>'); // line breaks

    return formatted;
  }

  /**
   * Formatar timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Mostrar erro
   */
  showError(message) {
    // Usar sistema de feedback global se disponível
    if (window.showFeedback) {
      window.showFeedback(message, 'error');
    } else {
      alert(message);
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.AgentChatModule = AgentChatModule;
  console.log('✅ [Agent Chat] Module class exported globally');
}
