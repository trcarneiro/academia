/**
 * AI MODULE - MODERN SINGLE-FILE VERSION
 * Replaces legacy multi-file structure (controllers/services/views)
 * COMPLIANCE: AGENTS.md v2.1 - Single-file pattern
 * 
 * Features:
 * - Chat with AI assistants (Claude, GPT, Gemini)
 * - Document Q&A with RAG
 * - Course analysis and generation
 * - Lesson plan generation
 * - Technique suggestions
 */

// Prevent re-declaration
if (typeof window.AIModule !== 'undefined') {
    console.log('âœ… AI Module already loaded, skipping re-declaration');
} else {
    console.log('ðŸ”§ [AI Module] First load - defining module...');

const AIModule = {
    container: null,
    moduleAPI: null,
    currentChatThread: [],
    availableModels: ['gemini-2.5', 'gemini-2.0', 'gemini-1.5', 'claude', 'gpt'],
    currentModel: 'gemini',
    ragDocuments: [],
    context: null,
    
    // =========================================================================
    // 1. INITIALIZATION
    // =========================================================================
    
    async init(container) {
        console.log('ðŸ¤– [AI Module] Initializing...');
        
        // Container é opcional quando chamado via app.js (sem render)
        if (!container) {
            console.log('ℹ️ [AI Module] Initialized without container (app.js mode)');
            await this.initializeAPI();
            window.aiModule = this;
            window.AIModule = this;
            window.ai = this;
            return;
        }
        
        this.container = container;
        
        try {
            await this.initializeAPI();
            await this.loadInitialData();
            this.render();
            this.setupEvents();
            
            // Register globally for onclick handlers (lowercase for consistency)
            window.aiModule = this;
            window.AIModule = this; // Also export uppercase for compatibility
            
            console.log('ðŸŒ [AI Module] Registered globally:', {
                aiModule: typeof window.aiModule,
                AIModule: typeof window.AIModule
            });
            
            // Dispatch module loaded event
            window.app?.dispatchEvent('module:loaded', { name: 'ai' });
            
            console.log('âœ… [AI Module] Initialized successfully');
        } catch (error) {
            console.error('âŒ [AI Module] Initialization failed:', error);
            window.app?.handleError?.(error, { module: 'ai', context: 'init' });
        }
    },
    
    // =========================================================================
    // 2. API CLIENT SETUP
    // =========================================================================
    
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('AI');
        console.log('âœ… [AI Module] API client initialized');
    },
    
    // =========================================================================
    // 3. DATA LOADING
    // =========================================================================
    
    async loadInitialData() {
        // Load RAG documents
        try {
            const ragRes = await this.moduleAPI.request('/api/rag/documents');
            if (ragRes.success) {
                this.ragDocuments = ragRes.data || [];
                console.log(`ðŸ“š Loaded ${this.ragDocuments.length} RAG documents`);
            }
        } catch (error) {
            console.warn('âš ï¸ Could not load RAG documents:', error);
            this.ragDocuments = [];
        }
    },
    
    // =========================================================================
    // 4. MAIN RENDER
    // =========================================================================
    
    render() {
        this.container.innerHTML = `
            <div class="module-isolated-ai-wrapper">
                <!-- Header -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title-section">
                            <h1><i class="fas fa-brain"></i> IA & Agentes Inteligentes</h1>
                            <nav class="breadcrumb">
                                <span>ðŸ  Home</span>
                                <span>â€º</span>
                                <span>ðŸ¤– InteligÃªncia Artificial</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <select id="ai-model-selector" class="form-control model-selector">
                                <option value="gemini" ${this.currentModel === 'gemini' ? 'selected' : ''}>ðŸ”· Gemini (Google)</option>
                                <option value="claude" ${this.currentModel === 'claude' ? 'selected' : ''}>ðŸ§  Claude (Anthropic)</option>
                                <option value="gpt" ${this.currentModel === 'gpt' ? 'selected' : ''}>ðŸ’¬ GPT-4 (OpenAI)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="module-isolated-ai-stats data-card-premium">
                    <div class="stat-card-enhanced stat-gradient-primary">
                        <div class="stat-icon">ðŸ¤–</div>
                        <div class="stat-content">
                            <div class="stat-value">3</div>
                            <div class="stat-label">Modelos AI</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced stat-gradient-success">
                        <div class="stat-icon">ðŸ“š</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.ragDocuments.length}</div>
                            <div class="stat-label">Documentos RAG</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced stat-gradient-info">
                        <div class="stat-icon">ðŸ’¬</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.currentChatThread.length}</div>
                            <div class="stat-label">Mensagens</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="module-isolated-ai-grid">
                    <!-- Left Panel: AI Features -->
                    <div class="module-isolated-ai-features">
                        ${this.renderFeaturesPanel()}
                    </div>

                    <!-- Right Panel: Chat -->
                    <div class="module-isolated-ai-chat">
                        ${this.renderChatPanel()}
                    </div>
                </div>

                <!-- RAG Documents Section -->
                <div class="module-isolated-ai-rag data-card-premium">
                    ${this.renderRAGSection()}
                </div>
            </div>
        `;
    },
    
    // =========================================================================
    // 5. FEATURES PANEL
    // =========================================================================
    
    renderFeaturesPanel() {
        return `
            <div class="data-card-premium">
                <h3 class="section-title">
                    <i class="fas fa-magic"></i>
                    Recursos Inteligentes
                </h3>
                
                <div class="features-list">
                    <!-- Course Analysis -->
                    <div class="feature-card" data-feature="course-analysis">
                        <div class="feature-icon">ðŸ“š</div>
                        <div class="feature-content">
                            <h4>AnÃ¡lise de Cursos</h4>
                            <p>Analise documentos de cursos e gere insights pedagÃ³gicos</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- Lesson Plan Generation -->
                    <div class="feature-card" data-feature="lesson-generation">
                        <div class="feature-icon">ðŸ“</div>
                        <div class="feature-content">
                            <h4>Gerar Planos de Aula</h4>
                            <p>Crie planos de aula completos com IA</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- Technique Suggestions -->
                    <div class="feature-card" data-feature="technique-suggestions">
                        <div class="feature-icon">ðŸ¥‹</div>
                        <div class="feature-content">
                            <h4>SugestÃµes de TÃ©cnicas</h4>
                            <p>Gere tÃ©cnicas de Krav Maga com descriÃ§Ãµes detalhadas</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- RAG Q&A -->
                    <div class="feature-card" data-feature="rag-qa">
                        <div class="feature-icon">â“</div>
                        <div class="feature-content">
                            <h4>Perguntas sobre Documentos</h4>
                            <p>FaÃ§a perguntas sobre os documentos indexados</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- Custom Chat -->
                    <div class="feature-card" data-feature="custom-chat">
                        <div class="feature-icon">ðŸ’¬</div>
                        <div class="feature-content">
                            <h4>Chat Livre</h4>
                            <p>Converse livremente com a IA</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>

                    <!-- Analytics -->
                    <div class="feature-card" data-feature="analytics">
                        <div class="feature-icon">ðŸ“Š</div>
                        <div class="feature-content">
                            <h4>AnÃ¡lises e Insights</h4>
                            <p>Veja anÃ¡lises de desempenho e tendÃªncias</p>
                        </div>
                        <button class="btn-form btn-primary-form btn-sm">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // =========================================================================
    // 6. CHAT PANEL
    // =========================================================================
    
    renderChatPanel() {
        return `
            <div class="data-card-premium chat-card">
                <div class="chat-header">
                    <h3><i class="fas fa-comments"></i> Chat com IA</h3>
                    <button class="btn-form btn-link btn-sm" onclick="window.aiModule.clearChat()">
                        <i class="fas fa-trash"></i> Limpar
                    </button>
                </div>
                
                <div class="chat-messages" id="ai-chat-messages">
                    ${this.currentChatThread.length === 0 ? `
                        <div class="empty-chat">
                            <i class="fas fa-comment-dots"></i>
                            <p>Nenhuma mensagem ainda</p>
                            <small>Escolha um recurso ou digite uma mensagem</small>
                        </div>
                    ` : this.currentChatThread.map(msg => this.renderChatMessage(msg)).join('')}
                </div>
                
                <div class="chat-input-container">
                    <textarea 
                        id="ai-chat-input" 
                        class="form-control chat-input" 
                        placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                        rows="3"
                    ></textarea>
                    <button class="btn-form btn-primary-form" id="ai-send-button">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                </div>
            </div>
        `;
    },
    
    renderChatMessage(message) {
        const isUser = message.role === 'user';
        return `
            <div class="chat-message ${isUser ? 'user-message' : 'ai-message'}">
                <div class="message-avatar">
                    ${isUser ? 'ðŸ‘¤' : 'ðŸ¤–'}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <strong>${isUser ? 'VocÃª' : this.getModelName(this.currentModel)}</strong>
                        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <div class="message-text">${this.formatMessageText(message.content)}</div>
                </div>
            </div>
        `;
    },
    
    formatMessageText(text) {
        // Convert markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    },
    
    getModelName(model) {
        const names = {
            gemini: 'Gemini (Google)',
            claude: 'Claude (Anthropic)',
            gpt: 'GPT-4 (OpenAI)'
        };
        return names[model] || model;
    },
    
    // =========================================================================
    // 7. RAG SECTION
    // =========================================================================
    
    renderRAGSection() {
        return `
            <details class="rag-section" open>
                <summary class="section-header">
                    <i class="fas fa-database"></i>
                    Documentos Indexados (RAG)
                    <span class="badge-count">${this.ragDocuments.length}</span>
                </summary>
                
                <div class="section-actions">
                    <button class="btn-form btn-primary-form" onclick="window.aiModule.openUploadDialog()">
                        <i class="fas fa-upload"></i> Adicionar Documento
                    </button>
                    <button class="btn-form btn-secondary-form" onclick="window.aiModule.refreshRAGDocuments()">
                        <i class="fas fa-sync"></i> Atualizar
                    </button>
                </div>
                
                ${this.ragDocuments.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>Nenhum documento indexado</p>
                        <small>Adicione documentos para fazer perguntas sobre eles</small>
                    </div>
                ` : `
                    <div class="documents-grid">
                        ${this.ragDocuments.map(doc => `
                            <div class="document-card">
                                <div class="document-icon">ðŸ“„</div>
                                <div class="document-info">
                                    <h4>${doc.name || 'Sem tÃ­tulo'}</h4>
                                    <small>${doc.type || 'Documento'} â€¢ ${this.formatFileSize(doc.size || 0)}</small>
                                </div>
                                <div class="document-actions">
                                    <button class="btn-icon" onclick="window.aiModule.queryDocument('${doc.id}')" title="Fazer pergunta">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                    <button class="btn-icon btn-danger" onclick="window.aiModule.deleteDocument('${doc.id}')" title="Deletar">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </details>
        `;
    },
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },
    
    // =========================================================================
    // 8. EVENT HANDLERS
    // =========================================================================
    
    setupEvents() {
        const sendButton = this.container.querySelector('#ai-send-button');
        const chatInput = this.container.querySelector('#ai-chat-input');
        const modelSelector = this.container.querySelector('#ai-model-selector');
        
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
                window.app?.showToast?.(`âœ… Modelo alterado para ${this.getModelName(this.currentModel)}`, 'info');
            });
        }
        
        // âœ¨ FEATURE BUTTONS - addEventListener pattern (robust for ES6 modules)
        const featureButtons = this.container.querySelectorAll('.feature-card button');
        featureButtons.forEach(btn => {
            const featureCard = btn.closest('.feature-card');
            if (!featureCard) return;
            
            const feature = featureCard.dataset.feature;
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`ðŸŽ¯ [AI Module] Feature button clicked: ${feature}`);
                
                switch(feature) {
                    case 'course-analysis':
                        this.openCourseAnalysis();
                        break;
                    case 'lesson-generation':
                        this.openLessonGenerator();
                        break;
                    case 'technique-suggestions':
                        this.openTechniqueGenerator();
                        break;
                    case 'rag-qa':
                        this.openRAGChat();
                        break;
                    case 'custom-chat':
                        this.openCustomChat();
                        break;
                    case 'analytics':
                        this.openAnalytics();
                        break;
                    default:
                        console.warn(`âš ï¸ Unknown feature: ${feature}`);
                }
            });
        });
        
        console.log(`âœ… [AI Module] Event listeners attached (${featureButtons.length} feature buttons)`);
    },
    
    // =========================================================================
    // 9. CHAT FUNCTIONALITY
    // =========================================================================
    
    setContext(type, data) {
        console.log(`🤖 [AI Module] Setting context: ${type}`, data);
        this.context = { type, data };
        
        // Visual feedback
        window.app?.showToast?.(`Contexto definido: ${type}`, 'info');
    },

    addSystemMessage(text) {
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = text;
            chatInput.focus();
        }
    },

    async sendMessage() {
        const chatInput = this.container.querySelector('#ai-chat-input');
        const messagesContainer = this.container.querySelector('#ai-chat-messages');
        
        if (!chatInput || !messagesContainer) return;
        
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        // Add user message to thread
        this.currentChatThread.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });
        
        // Clear input
        chatInput.value = '';
        
        // Update UI
        this.updateChatDisplay();
        
        // Show loading
        const loadingMsg = {
            role: 'assistant',
            content: 'ðŸ’­ Pensando...',
            timestamp: new Date().toISOString(),
            isLoading: true
        };
        this.currentChatThread.push(loadingMsg);
        this.updateChatDisplay();
        
        try {
            // Send to API
            const response = await this.moduleAPI.request('/api/rag/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: userMessage,
                    model: this.currentModel,
                    chatHistory: this.currentChatThread.filter(m => !m.isLoading),
                    context: this.context
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Remove loading message
            this.currentChatThread = this.currentChatThread.filter(m => !m.isLoading);
            
            if (response.success && response.data) {
                // Add AI response
                this.currentChatThread.push({
                    role: 'assistant',
                    content: response.data.response || response.data.message || 'Sem resposta',
                    timestamp: new Date().toISOString()
                });
                
                this.updateChatDisplay();
            } else {
                throw new Error(response.message || 'Erro ao enviar mensagem');
            }
            
        } catch (error) {
            console.error('âŒ Error sending message:', error);
            
            // Remove loading and add error
            this.currentChatThread = this.currentChatThread.filter(m => !m.isLoading);
            this.currentChatThread.push({
                role: 'assistant',
                content: `âŒ Erro: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            this.updateChatDisplay();
            window.app?.handleError?.(error, { module: 'ai', context: 'sendMessage' });
        }
    },
    
    updateChatDisplay() {
        const messagesContainer = this.container.querySelector('#ai-chat-messages');
        if (!messagesContainer) return;
        
        if (this.currentChatThread.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-comment-dots"></i>
                    <p>Nenhuma mensagem ainda</p>
                    <small>Escolha um recurso ou digite uma mensagem</small>
                </div>
            `;
        } else {
            messagesContainer.innerHTML = this.currentChatThread.map(msg => this.renderChatMessage(msg)).join('');
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Update stats
        const statsValue = this.container.querySelector('.module-isolated-ai-stats .stat-gradient-info .stat-value');
        if (statsValue) {
            statsValue.textContent = this.currentChatThread.length;
        }
    },
    
    clearChat() {
        this.currentChatThread = [];
        this.updateChatDisplay();
        window.app?.showToast?.('ðŸ—‘ï¸ Chat limpo', 'info');
    },
    
    // =========================================================================
    // 10. FEATURE ACTIONS
    // =========================================================================
    
    async openCourseAnalysis() {
        const prompt = `ðŸ“š **ANÃLISE DE CURSOS**

Analise os cursos disponÃ­veis de Krav Maga e forneÃ§a:

1. **Estrutura Curricular**: Resumo da progressÃ£o tÃ©cnica
2. **Carga HorÃ¡ria**: DistribuiÃ§Ã£o de aulas por nÃ­vel
3. **TÃ©cnicas Fundamentais**: Principais tÃ©cnicas de cada nÃ­vel
4. **Lacunas ou Melhorias**: SugestÃµes de conteÃºdo adicional
5. **ComparaÃ§Ã£o com PadrÃµes**: Como se compara ao currÃ­culo IKMF

Use os documentos RAG disponÃ­veis para embasar a anÃ¡lise.`;
        
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = prompt;
            chatInput.focus();
            window.app?.showToast?.('ðŸ“š Prompt carregado - Clique em ENVIAR', 'info');
        }
    },
    
    async openLessonGenerator() {
        const prompt = `ðŸ“ **GERADOR DE PLANOS DE AULA**

Crie um plano de aula completo para Krav Maga com:

**Dados BÃ¡sicos:**
- Nome: [exemplo: "Defesa contra Socos Altos"]
- NÃ­vel: [Iniciante/IntermediÃ¡rio/AvanÃ§ado]
- DuraÃ§Ã£o: 60 minutos
- Foco Principal: [tÃ©cnica especÃ­fica]

**Estrutura ObrigatÃ³ria:**
1. **Aquecimento (10 min)**: ExercÃ­cios dinÃ¢micos
2. **TÃ©cnica Principal (25 min)**: Passo a passo detalhado
3. **Treinamento de AplicaÃ§Ã£o (20 min)**: Drills e sparring
4. **Volta Ã  Calma (5 min)**: Alongamento e feedback

**Requisitos:**
- NÃºmero de repetiÃ§Ãµes por exercÃ­cio
- Materiais necessÃ¡rios
- VariaÃ§Ãµes para diferentes nÃ­veis
- Pontos de atenÃ§Ã£o de seguranÃ§a

Gere o plano completo agora.`;
        
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = prompt;
            chatInput.focus();
            window.app?.showToast?.('ðŸ“ Prompt carregado - Clique em ENVIAR', 'info');
        }
    },
    
    async openTechniqueGenerator() {
        const prompt = `ðŸ¥‹ **GERADOR DE TÃ‰CNICAS DE KRAV MAGA**

Gere uma tÃ©cnica detalhada de Krav Maga com:

**InformaÃ§Ãµes BÃ¡sicas:**
- Nome da TÃ©cnica: [exemplo: "360Â° Defense"]
- Categoria: [Defesa/Ataque/Contra-ataque]
- NÃ­vel: [Iniciante/IntermediÃ¡rio/AvanÃ§ado]
- Tipo de AmeaÃ§a: [soco/chute/agarramento/arma]

**DescriÃ§Ã£o Completa:**
1. **Contexto**: Quando usar esta tÃ©cnica
2. **PosiÃ§Ã£o Inicial**: Guarda e postura
3. **ExecuÃ§Ã£o Passo a Passo**: 
   - Passo 1: [descriÃ§Ã£o]
   - Passo 2: [descriÃ§Ã£o]
   - Passo 3: [descriÃ§Ã£o]
4. **Pontos CrÃ­ticos**: O que observar
5. **Erros Comuns**: O que evitar
6. **VariaÃ§Ãµes**: AdaptaÃ§Ãµes para diferentes situaÃ§Ãµes
7. **Contramedidas**: O que fazer se falhar

Gere a tÃ©cnica completa com base no currÃ­culo IKMF.`;
        
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = prompt;
            chatInput.focus();
            window.app?.showToast?.('ðŸ¥‹ Prompt carregado - Clique em ENVIAR', 'info');
        }
    },
    
    async openRAGChat() {
        if (this.ragDocuments.length === 0) {
            window.app?.showToast?.('âš ï¸ Adicione documentos RAG primeiro', 'warning');
            return;
        }
        
        const prompt = `â“ **PERGUNTAS SOBRE DOCUMENTOS**

VocÃª tem acesso a ${this.ragDocuments.length} documentos indexados:

${this.ragDocuments.slice(0, 5).map(doc => `- ${doc.name} (${doc.category || 'Geral'})`).join('\n')}

**Exemplos de perguntas:**
- "Quais sÃ£o os objetivos da aula 1 de Krav Maga?"
- "Liste todas as tÃ©cnicas de defesa contra socos"
- "Qual Ã© a progressÃ£o de graduaÃ§Ã£o na faixa branca?"
- "Quais materiais sÃ£o necessÃ¡rios para a aula X?"
- "Compare as tÃ©cnicas do nÃ­vel iniciante e intermediÃ¡rio"

FaÃ§a sua pergunta abaixo:`;
        
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = prompt;
            chatInput.focus();
            chatInput.setSelectionRange(prompt.length, prompt.length); // Cursor no final
            window.app?.showToast?.('â“ Digite sua pergunta no final do prompt', 'info');
        }
    },
    
    async openCustomChat() {
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = '';
            chatInput.placeholder = 'Digite sua mensagem livremente... (ex: "Me ajude a criar um programa de 3 meses para iniciantes")';
            chatInput.focus();
            window.app?.showToast?.('ðŸ’¬ Chat livre ativado', 'info');
        }
    },
    
    async openAnalytics() {
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = 'Analise o desempenho dos alunos e mostre insights sobre frequÃªncia, progresso nas graduaÃ§Ãµes e Ã¡reas que precisam de atenÃ§Ã£o.';
            chatInput.focus();
        }
    },
    
    async openUploadDialog() {
        window.app?.showToast?.('ðŸ“¤ Upload de documentos: Use o endpoint POST /api/rag/documents com multipart/form-data', 'info');
        // TODO: Create a proper upload modal with file picker
        const chatInput = this.container.querySelector('#ai-chat-input');
        if (chatInput) {
            chatInput.value = 'Como posso fazer upload de novos documentos para a base de conhecimento RAG?';
            chatInput.focus();
        }
    },
    
    async refreshRAGDocuments() {
        await this.loadInitialData();
        this.render();
        this.setupEvents();
        window.app?.showToast?.('âœ… Documentos atualizados', 'success');
    },
    
    async queryDocument(docId) {
        window.app?.showToast?.(`ðŸ“„ Fazer pergunta sobre documento ${docId}`, 'info');
        // TODO: Implement document query
    },
    
    async deleteDocument(docId) {
        const confirmed = await window.app?.confirm?.('Tem certeza que deseja deletar este documento?');
        if (!confirmed) return;
        
        try {
            const response = await this.moduleAPI.request(`/api/ai/rag/documents/${docId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                window.app?.showToast?.('âœ… Documento deletado', 'success');
                await this.refreshRAGDocuments();
            } else {
                throw new Error(response.message || 'Erro ao deletar');
            }
        } catch (error) {
            console.error('âŒ Error deleting document:', error);
            window.app?.handleError?.(error, { module: 'ai', context: 'deleteDocument' });
        }
    }
};

// Global export IMMEDIATELY (before any async operations)
window.AIModule = AIModule;
window.aiModule = AIModule; // Lowercase alias for onclick compatibility
window.ai = AIModule; // For app.js compatibility

console.log('ðŸŒ [AI Module] Exported to global scope:', {
    AIModule: typeof window.AIModule,
    aiModule: typeof window.aiModule,
    ai: typeof window.ai,
    methods: Object.keys(AIModule)
});

} // end if

// Auto-initialize if container exists
if (typeof window !== 'undefined' && document.getElementById('module-container')) {
    window.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('module-container');
        if (container && window.location.hash === '#ai') {
            window.AIModule.init(container);
        }
    });
}

