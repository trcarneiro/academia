/**
 * 💬 Agent Chat Dashboard Widget
 * 
 * Widget minimalista para dashboard com toggle expand/collapse
 * Versão compacta do módulo completo de chat
 */

class AgentChatWidget {
  constructor() {
    this.isExpanded = false;
    this.chatModule = null;
    this.widgetContainer = null;
  }

  /**
   * Inicializar widget
   */
  async init() {
    console.log('💬 [Chat Widget] Initializing...');
    
    // Criar container do widget
    this.createWidgetContainer();
    
    // Setup eventos
    this.setupEvents();
    
    console.log('✅ [Chat Widget] Initialized');
  }

  /**
   * Criar container do widget
   */
  createWidgetContainer() {
    // Criar wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'agent-chat-widget-wrapper';
    wrapper.className = 'agent-chat-widget-wrapper';
    
    wrapper.innerHTML = `
      <!-- Botão flutuante -->
      <button id="chat-widget-toggle" class="chat-widget-toggle" title="Conversar com Agentes">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="widget-badge" style="display: none;">1</span>
      </button>

      <!-- Container do chat (expandido) -->
      <div id="chat-widget-container" class="chat-widget-container" style="display: none;">
        <div class="chat-widget-header">
          <div class="header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3>Chat com Agentes</h3>
          </div>
          <div class="header-actions">
            <button id="chat-widget-fullscreen" class="icon-btn" title="Abrir em tela cheia">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            </button>
            <button id="chat-widget-minimize" class="icon-btn" title="Minimizar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div id="chat-widget-content" class="chat-widget-content">
          <!-- Conteúdo do chat será injetado aqui -->
        </div>
      </div>
    `;

    // Adicionar ao body
    document.body.appendChild(wrapper);
    this.widgetContainer = wrapper;
  }

  /**
   * Setup event listeners
   */
  setupEvents() {
    // Toggle expand/collapse
    const toggleBtn = document.getElementById('chat-widget-toggle');
    toggleBtn?.addEventListener('click', () => this.toggle());

    // Minimizar
    const minimizeBtn = document.getElementById('chat-widget-minimize');
    minimizeBtn?.addEventListener('click', () => this.collapse());

    // Fullscreen (navegar para página completa)
    const fullscreenBtn = document.getElementById('chat-widget-fullscreen');
    fullscreenBtn?.addEventListener('click', () => this.openFullscreen());
  }

  /**
   * Toggle expand/collapse
   */
  async toggle() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      await this.expand();
    }
  }

  /**
   * Expandir widget
   */
  async expand() {
    console.log('💬 [Chat Widget] Expanding...');
    
    const container = document.getElementById('chat-widget-container');
    const toggle = document.getElementById('chat-widget-toggle');
    
    if (!container || !toggle) return;

    // Mostrar container
    container.style.display = 'flex';
    
    // Animar entrada
    setTimeout(() => {
      container.classList.add('expanded');
    }, 10);

    // Esconder botão toggle
    toggle.classList.add('hidden');

    // Inicializar módulo de chat se não existir
    if (!this.chatModule) {
      await this.initializeChatModule();
    }

    this.isExpanded = true;
  }

  /**
   * Colapsar widget
   */
  collapse() {
    console.log('💬 [Chat Widget] Collapsing...');
    
    const container = document.getElementById('chat-widget-container');
    const toggle = document.getElementById('chat-widget-toggle');
    
    if (!container || !toggle) return;

    // Animar saída
    container.classList.remove('expanded');
    
    setTimeout(() => {
      container.style.display = 'none';
      toggle.classList.remove('hidden');
    }, 300);

    this.isExpanded = false;
  }

  /**
   * Inicializar módulo de chat
   */
  async initializeChatModule() {
    console.log('💬 [Chat Widget] Initializing chat module...');
    
    const contentContainer = document.getElementById('chat-widget-content');
    
    if (!contentContainer) {
      console.error('❌ [Chat Widget] Content container not found');
      return;
    }

    // Verificar se AgentChatModule está disponível
    if (typeof window.AgentChatModule === 'undefined') {
      console.error('❌ [Chat Widget] AgentChatModule not loaded');
      contentContainer.innerHTML = `
        <div class="widget-error">
          <p>⚠️ Módulo de chat não carregado</p>
          <button onclick="location.reload()">Recarregar página</button>
        </div>
      `;
      return;
    }

    try {
      // Criar instância do módulo
      this.chatModule = new window.AgentChatModule(contentContainer);
      
      // Inicializar
      await this.chatModule.init();
      
      console.log('✅ [Chat Widget] Chat module initialized');
      
    } catch (error) {
      console.error('❌ [Chat Widget] Error initializing chat module:', error);
      contentContainer.innerHTML = `
        <div class="widget-error">
          <p>❌ Erro ao carregar chat</p>
          <p>${error.message}</p>
          <button onclick="location.reload()">Recarregar página</button>
        </div>
      `;
    }
  }

  /**
   * Abrir em tela cheia (página completa)
   */
  openFullscreen() {
    console.log('💬 [Chat Widget] Opening fullscreen...');
    
    // Navegar para página de chat completa
    if (window.app && window.app.navigate) {
      window.app.navigate('#agent-chat');
    } else {
      window.location.hash = '#agent-chat';
    }
    
    // Colapsar widget
    this.collapse();
  }

  /**
   * Mostrar badge com número de notificações
   */
  showBadge(count) {
    const badge = document.querySelector('.widget-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }
}

// Auto-inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const widget = new AgentChatWidget();
    await widget.init();
    
    // Exportar globalmente
    window.agentChatWidget = widget;
  });
} else {
  // DOM já carregou
  (async () => {
    const widget = new AgentChatWidget();
    await widget.init();
    
    // Exportar globalmente
    window.agentChatWidget = widget;
  })();
}
