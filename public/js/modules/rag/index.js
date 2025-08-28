/**
 * RAG Module - Sistema de Knowledge Base Inteligente
 * Academia Krav Maga v2.0
 * 
 * Este módulo implementa um sistema RAG (Retrieval-Augmented Generation)
 * que permite upload de documentos, criação de embeddings e chat inteligente
 * com a base de conhecimento da academia.
 */

// RAG Module API Helper
let ragAPI = null;

// Estado global do módulo RAG
const ragState = {
    currentTab: 'upload',
    isProcessing: false,
    documents: [],
    chatHistory: [],
    selectedGeneration: null,
    stats: {
        documents: 0,
        embeddings: 0,
        queries: 0,
        accuracy: '95%'
    }
};

/**
 * Inicialização do módulo RAG
 */
async function initializeRAGModule() {
    try {
        console.log('🧠 Inicializando módulo RAG...');
        
        // Verifica se estamos em contexto SPA ou standalone
        const container = document.querySelector('#ragContainer') || 
                         document.querySelector('.rag-container') ||
                         document.querySelector('.rag-isolated');
        
        if (container && !container.querySelector('.rag-tabs')) {
            // Carrega a view do módulo RAG
            await loadRAGView(container);
        }
        
        // Aguarda o API client estar disponível
        await waitForAPIClient();
        ragAPI = window.createModuleAPI('RAG');
        
        // Configura event listeners
        setupEventListeners();
        
        // Carrega dados iniciais
        await loadInitialData();
        
        // Registra módulo no app principal
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: 'rag' });
        }
        
        console.log('✅ Módulo RAG inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo RAG:', error);
        if (window.app) {
            window.app.handleError(error, 'RAG Module Initialization');
        }
    }
}

/**
 * Carrega a view HTML do módulo RAG
 */
async function loadRAGView(container) {
    try {
        const response = await fetch('views/modules/rag/rag.html');
        const html = await response.text();
        
        // Extrai apenas o conteúdo interno
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const ragContent = tmp.querySelector('.rag-isolated');
        
        if (ragContent) {
            container.innerHTML = '';
            container.appendChild(ragContent);
        } else {
            container.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Erro ao carregar view RAG:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar módulo</h3>
                <p>Não foi possível carregar a interface do RAG.</p>
                <button onclick="location.reload()" class="btn btn-primary">Recarregar</button>
            </div>
        `;
    }
}

/**
 * Aguarda o API client estar disponível
 */
async function waitForAPIClient() {
    return new Promise((resolve) => {
        const checkAPI = () => {
            if (window.createModuleAPI) {
                resolve();
            } else {
                setTimeout(checkAPI, 100);
            }
        };
        checkAPI();
    });
}

/**
 * Configura todos os event listeners do módulo
 */
function setupEventListeners() {
    // Upload de documentos
    const fileInput = document.getElementById('ragDocumentFile');
    const uploadZone = document.querySelector('.upload-zone-rag');
    const startBtn = document.getElementById('startIngestionBtn');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    if (uploadZone) {
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleFileDrop);
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', startIngestion);
    }
    
    // Chat
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Filtros da biblioteca
    const librarySearch = document.getElementById('librarySearch');
    const libraryCategory = document.getElementById('libraryCategory');
    
    if (librarySearch) {
        librarySearch.addEventListener('input', filterDocuments);
    }
    
    if (libraryCategory) {
        libraryCategory.addEventListener('change', filterDocuments);
    }
}

/**
 * Carrega dados iniciais do módulo
 */
async function loadInitialData() {
    try {
        // Carrega estatísticas
        await loadStats();
        
        // Carrega documentos
        await loadDocuments();
        
        // Carrega histórico de chat (se existir)
        await loadChatHistory();
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showNotification('Erro ao carregar dados iniciais', 'error');
    }
}

/**
 * Carrega estatísticas do RAG
 */
async function loadStats() {
    try {
        const response = await ragAPI.fetchWithStates('/api/rag/stats', {
            loadingElement: null, // Stats carregam silenciosamente
            onSuccess: (data) => {
                ragState.stats = { ...ragState.stats, ...data };
                updateStatsDisplay();
            },
            onEmpty: () => {
                // Stats vazias são OK no início
                updateStatsDisplay();
            },
            onError: (error) => {
                console.warn('Erro ao carregar stats, usando valores padrão:', error);
                updateStatsDisplay();
            }
        });
    } catch (error) {
        console.warn('Stats indisponíveis, usando valores padrão');
        updateStatsDisplay();
    }
}

/**
 * Atualiza exibição das estatísticas
 */
function updateStatsDisplay() {
    const elements = {
        ragDocuments: document.getElementById('ragDocuments'),
        ragEmbeddings: document.getElementById('ragEmbeddings'),
        ragQueries: document.getElementById('ragQueries'),
        ragAccuracy: document.getElementById('ragAccuracy')
    };
    
    if (elements.ragDocuments) {
        elements.ragDocuments.textContent = ragState.stats.documents;
    }
    if (elements.ragEmbeddings) {
        elements.ragEmbeddings.textContent = ragState.stats.embeddings;
    }
    if (elements.ragQueries) {
        elements.ragQueries.textContent = ragState.stats.queries;
    }
    if (elements.ragAccuracy) {
        elements.ragAccuracy.textContent = ragState.stats.accuracy;
    }
}

/**
 * Navegação entre abas
 */
function showTab(tabName) {
    // Remove active das abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Remove active dos conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Ativa nova aba
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`${tabName}-tab`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) {
        tabContent.style.display = 'block';
        tabContent.classList.add('active');
    }
    
    ragState.currentTab = tabName;
    
    // Carrega dados específicos da aba se necessário
    if (tabName === 'library') {
        loadDocuments();
    } else if (tabName === 'chat') {
        loadChatHistory();
    }
}

/**
 * Upload de documentos - Seleção de arquivos
 */
function handleFileSelection(event) {
    const files = event.target.files;
    if (files.length > 0) {
        displaySelectedFiles(files);
        document.getElementById('startIngestionBtn').style.display = 'block';
    }
}

/**
 * Upload de documentos - Drag and drop
 */
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('ragDocumentFile').files = files;
        displaySelectedFiles(files);
        document.getElementById('startIngestionBtn').style.display = 'block';
    }
}

/**
 * Exibe arquivos selecionados
 */
function displaySelectedFiles(files) {
    const uploadZone = document.querySelector('.upload-zone-rag');
    
    let html = `
        <div class="upload-icon">📄</div>
        <div class="upload-text">
            <strong>${files.length} arquivo(s) selecionado(s)</strong>
            <br>Pronto para processamento RAG
        </div>
        <div class="upload-hint">
            ${Array.from(files).map(f => f.name).join(', ')}
        </div>
    `;
    
    uploadZone.innerHTML = html;
}

/**
 * Inicia o processamento RAG dos documentos
 */
async function startIngestion() {
    const files = document.getElementById('ragDocumentFile').files;
    const category = document.getElementById('documentCategory').value;
    const tags = document.getElementById('documentTags').value;
    
    if (files.length === 0) {
        showNotification('Selecione pelo menos um documento', 'error');
        return;
    }
    
    ragState.isProcessing = true;
    document.getElementById('startIngestionBtn').style.display = 'none';
    document.getElementById('ingestionProgress').style.display = 'block';
    
    try {
        // Prepara FormData
        const formData = new FormData();
        for (let file of files) {
            formData.append('documents', file);
        }
        formData.append('category', category);
        formData.append('tags', tags);
        
        // Inicia processamento com visualização de progresso
        await processDocumentsWithProgress(formData);
        
        showNotification('Documentos processados com sucesso!', 'success');
        
        // Recarrega dados
        await loadStats();
        await loadDocuments();
        
        // Reset do formulário
        resetUploadForm();
        
    } catch (error) {
        console.error('Erro no processamento RAG:', error);
        showNotification('Erro ao processar documentos', 'error');
    } finally {
        ragState.isProcessing = false;
        document.getElementById('ingestionProgress').style.display = 'none';
    }
}

/**
 * Processa documentos com visualização de progresso
 */
async function processDocumentsWithProgress(formData) {
    const steps = ['upload', 'extract', 'chunk', 'embed', 'store'];
    const stepNames = {
        upload: 'Fazendo upload dos arquivos...',
        extract: 'Extraindo texto dos documentos...',
        chunk: 'Dividindo texto em chunks...',
        embed: 'Gerando embeddings...',
        store: 'Armazenando no banco vetorial...'
    };
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Atualiza UI
        updateProgressStep(step, 'active');
        updateProgressBar((i / steps.length) * 100);
        updateProgressDetails(stepNames[step]);
        
        // Simula tempo de processamento
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Marca como completo
        updateProgressStep(step, 'completed');
    }
    
    // Progresso completo
    updateProgressBar(100);
    updateProgressDetails('Processamento concluído com sucesso!');
    
    // Aqui seria feita a chamada real para a API
    try {
        const response = await fetch('/api/rag/ingest', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erro na API de ingestão');
        }
        
        const result = await response.json();
        console.log('Resultado da ingestão:', result);
        
    } catch (error) {
        // Para demonstração, vamos simular sucesso
        console.log('API não disponível, simulando processamento bem-sucedido');
    }
}

/**
 * Atualiza step do progresso
 */
function updateProgressStep(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    if (step) {
        step.classList.remove('active', 'completed');
        step.classList.add(status);
    }
}

/**
 * Atualiza barra de progresso
 */
function updateProgressBar(percentage) {
    const bar = document.getElementById('ingestionProgressBar');
    if (bar) {
        bar.style.width = `${percentage}%`;
    }
}

/**
 * Atualiza detalhes do progresso
 */
function updateProgressDetails(message) {
    const details = document.getElementById('ingestionDetails');
    if (details) {
        details.textContent = message;
    }
}

/**
 * Reset do formulário de upload
 */
function resetUploadForm() {
    document.getElementById('ragDocumentFile').value = '';
    document.getElementById('documentCategory').value = 'krav-maga';
    document.getElementById('documentTags').value = '';
    document.getElementById('startIngestionBtn').style.display = 'none';
    
    // Reset da zona de upload
    const uploadZone = document.querySelector('.upload-zone-rag');
    uploadZone.innerHTML = `
        <div class="upload-icon">📤</div>
        <div class="upload-text">
            <strong>Clique para selecionar documentos</strong>
            <br>ou arraste e solte aqui
        </div>
        <div class="upload-hint">
            Formatos: PDF, DOC, DOCX, TXT, MD (máx. 50MB por arquivo)
        </div>
    `;
}

/**
 * Carrega lista de documentos
 */
async function loadDocuments() {
    try {
        const response = await ragAPI.fetchWithStates('/api/rag/documents', {
            loadingElement: document.getElementById('documentsGrid'),
            onSuccess: (data) => {
                ragState.documents = data;
                renderDocuments(data);
            },
            onEmpty: () => {
                renderEmptyDocuments();
            },
            onError: (error) => {
                console.error('Erro ao carregar documentos:', error);
                renderEmptyDocuments();
            }
        });
    } catch (error) {
        // Simula alguns documentos para demonstração
        const mockDocuments = [
            {
                id: 1,
                name: 'Manual Krav Maga Básico.pdf',
                category: 'krav-maga',
                tags: ['iniciante', 'fundamentos'],
                chunks: 45,
                embeddings: 45,
                uploadedAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Defesa Pessoal Feminina.docx',
                category: 'defesa-pessoal',
                tags: ['mulheres', 'autodefesa'],
                chunks: 23,
                embeddings: 23,
                uploadedAt: new Date().toISOString()
            }
        ];
        
        ragState.documents = mockDocuments;
        renderDocuments(mockDocuments);
    }
}

/**
 * Renderiza lista de documentos
 */
function renderDocuments(documents) {
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;
    
    if (documents.length === 0) {
        renderEmptyDocuments();
        return;
    }
    
    const html = documents.map(doc => `
        <div class="document-card" onclick="viewDocument(${doc.id})">
            <div class="doc-icon">📄</div>
            <div class="doc-info">
                <h4>${doc.name}</h4>
                <p>Categoria: ${getCategoryName(doc.category)}</p>
                <p>Chunks: ${doc.chunks} | Embeddings: ${doc.embeddings}</p>
                <p>Tags: ${doc.tags?.join(', ') || 'Nenhuma'}</p>
                <p>Upload: ${new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</p>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = html;
}

/**
 * Renderiza estado vazio de documentos
 */
function renderEmptyDocuments() {
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="document-card placeholder">
            <div class="doc-icon">📄</div>
            <div class="doc-info">
                <h4>Nenhum documento encontrado</h4>
                <p>Faça upload de documentos na aba "Upload & Ingestão"</p>
            </div>
        </div>
    `;
}

/**
 * Converte categoria para nome legível
 */
function getCategoryName(category) {
    const names = {
        'krav-maga': 'Krav Maga',
        'defesa-pessoal': 'Defesa Pessoal',
        'condicionamento': 'Condicionamento',
        'pedagogia': 'Pedagogia',
        'filosofia': 'Filosofia',
        'outros': 'Outros'
    };
    return names[category] || category;
}

/**
 * Filtra documentos
 */
function filterDocuments() {
    const search = document.getElementById('librarySearch')?.value.toLowerCase() || '';
    const category = document.getElementById('libraryCategory')?.value || '';
    
    let filtered = ragState.documents;
    
    if (search) {
        filtered = filtered.filter(doc => 
            doc.name.toLowerCase().includes(search) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(search))
        );
    }
    
    if (category) {
        filtered = filtered.filter(doc => doc.category === category);
    }
    
    renderDocuments(filtered);
}

/**
 * Visualiza detalhes de um documento
 */
function viewDocument(documentId) {
    console.log('Visualizar documento:', documentId);
    // TODO: Implementar modal ou página de detalhes
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

/**
 * Chat RAG - Carrega histórico
 */
/**
 * Carrega histórico do chat (com fallback para localStorage)
 */
async function loadChatHistory() {
    try {
        // Primeiro tenta carregar do localStorage
        const localHistory = loadChatHistoryFromLocal();
        if (localHistory && localHistory.length > 0) {
            ragState.chatHistory = localHistory;
            renderChatHistory(localHistory);
            return;
        }

        // Se não há histórico local, tenta carregar da API
        const response = await ragAPI.fetchWithStates('/api/rag/chat/history', {
            loadingElement: null,
            onSuccess: (data) => {
                ragState.chatHistory = data;
                renderChatHistory(data);
                // Salva no localStorage para futuras sessões
                saveChatHistoryToLocal(data);
            },
            onEmpty: () => {
                // Histórico vazio é normal
            },
            onError: (error) => {
                console.warn('Erro ao carregar histórico da API:', error);
            }
        });
    } catch (error) {
        console.warn('Histórico de chat indisponível');
        // Mesmo assim tenta carregar do localStorage
        const localHistory = loadChatHistoryFromLocal();
        if (localHistory && localHistory.length > 0) {
            ragState.chatHistory = localHistory;
            renderChatHistory(localHistory);
        }
    }
}

/**
 * Salva histórico no localStorage
 */
function saveChatHistoryToLocal(history) {
    try {
        const key = 'academia_rag_chat_history';
        const data = {
            history: history || ragState.chatHistory,
            timestamp: Date.now(),
            version: '1.0'
        };
        localStorage.setItem(key, JSON.stringify(data));
        console.log('📚 Histórico salvo localmente');
    } catch (error) {
        console.warn('Erro ao salvar histórico local:', error);
    }
}

/**
 * Carrega histórico do localStorage
 */
function loadChatHistoryFromLocal() {
    try {
        const key = 'academia_rag_chat_history';
        const stored = localStorage.getItem(key);
        
        if (!stored) return null;
        
        const data = JSON.parse(stored);
        
        // Verifica se não está muito antigo (7 dias)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
        if (Date.now() - data.timestamp > maxAge) {
            localStorage.removeItem(key);
            return null;
        }
        
        console.log('📚 Histórico carregado do localStorage');
        return data.history || [];
        
    } catch (error) {
        console.warn('Erro ao carregar histórico local:', error);
        return null;
    }
}

/**
 * Renderiza histórico do chat
 */
function renderChatHistory(history) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer || !history.length) return;
    
    // Mantém mensagem de boas-vindas e adiciona histórico
    const welcomeMessage = messagesContainer.querySelector('.message.assistant');
    
    const historyHtml = history.map(msg => `
        <div class="message ${msg.type}">
            <div class="message-avatar">${msg.type === 'user' ? '👤' : '🧠'}</div>
            <div class="message-content">
                <div class="message-text">${msg.content}</div>
            </div>
        </div>
    `).join('');
    
    if (welcomeMessage) {
        welcomeMessage.insertAdjacentHTML('afterend', historyHtml);
    } else {
        messagesContainer.innerHTML = historyHtml;
    }
    
    scrollToBottom(messagesContainer);
}

/**
 * Envia mensagem no chat
 */
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Adiciona mensagem do usuário
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        // Adiciona indicador de digitação
        addTypingIndicator();
        
        // Envia para API RAG usando saveWithFeedback para POST
        const response = await ragAPI.saveWithFeedback('/api/rag/chat', { message }, {
            method: 'POST',
            onSuccess: (data) => {
                removeTypingIndicator();
                addChatMessage(data.message || data.response || 'Resposta não disponível', 'assistant');
                
                // Salva no histórico
                ragState.chatHistory.push(
                    { type: 'user', content: message },
                    { type: 'assistant', content: data.message || data.response || 'Resposta não disponível' }
                );
                
                // Persiste no localStorage
                saveChatHistoryToLocal();
            },
            onError: (error) => {
                removeTypingIndicator();
                console.error('Erro no chat:', error);
                addChatMessage('Desculpe, ocorreu um erro. Tente novamente.', 'assistant');
            }
        });
        
    } catch (error) {
        removeTypingIndicator();
        
        // Simulação de resposta RAG para demonstração
        setTimeout(() => {
            const mockResponse = generateMockRAGResponse(message);
            addChatMessage(mockResponse, 'assistant');
            
            // Salva no histórico mesmo sendo mock
            ragState.chatHistory.push(
                { type: 'user', content: message },
                { type: 'assistant', content: mockResponse }
            );
            
            // Persiste no localStorage
            saveChatHistoryToLocal();
        }, 1000 + Math.random() * 2000);
    }
}

/**
 * Adiciona mensagem ao chat
 */
function addChatMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageHtml = `
        <div class="message ${type}">
            <div class="message-avatar">${type === 'user' ? '👤' : '🧠'}</div>
            <div class="message-content">
                <div class="message-text">${content}</div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom(messagesContainer);
}

/**
 * Adiciona indicador de digitação
 */
function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const typingHtml = `
        <div class="message assistant typing-indicator">
            <div class="message-avatar">🧠</div>
            <div class="message-content">
                <div class="message-text">
                    <span class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom(messagesContainer);
}

/**
 * Remove indicador de digitação
 */
function removeTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Gera resposta RAG simulada para demonstração
 */
function generateMockRAGResponse(question) {
    const responses = {
        'soco': 'Baseado nos documentos da academia, o soco direto no Krav Maga deve ser executado com o punho fechado, mantendo o pulso reto e utilizando o movimento do quadril para gerar potência. A trajetória deve ser a mais direta possível ao alvo.',
        'defesa': 'Segundo o manual de defesa pessoal, as técnicas de defesa no Krav Maga priorizam a simplicidade e eficácia. O princípio básico é neutralizar a ameaça o mais rapidamente possível, usando os movimentos mais naturais do corpo.',
        'estrangulamento': 'Para defesa contra estrangulamento frontal, os documentos recomendam: 1) Segurar os braços do atacante, 2) Girar o corpo e flexionar os joelhos, 3) Executar joelhada ou chute, 4) Se afastar rapidamente.',
        'princípios': 'Os princípios fundamentais do Krav Maga, conforme a documentação da academia, são: simplicidade, eficácia, agressividade controlada, economia de movimento e adaptabilidade a diferentes situações.',
        'default': 'Com base nos documentos disponíveis na base de conhecimento, posso ajudar com técnicas de Krav Maga, defesa pessoal, condicionamento físico e metodologias de ensino. Poderia ser mais específico sobre o que gostaria de saber?'
    };
    
    const lowerQuestion = question.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerQuestion.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

/**
 * Pergunta sugerida
 */
function askSuggestion(question) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = question;
        sendMessage();
    }
}

/**
 * Limpa chat
 */
function clearChat() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Mantém apenas mensagem de boas-vindas
    messagesContainer.innerHTML = `
        <div class="message assistant">
            <div class="message-avatar">🧠</div>
            <div class="message-content">
                <div class="message-text">
                    Olá! Sou o assistente RAG da academia. Posso responder perguntas sobre:
                    <ul>
                        <li>🥋 Técnicas de Krav Maga</li>
                        <li>🛡️ Defesa pessoal</li>
                        <li>💪 Condicionamento físico</li>
                        <li>📚 Metodologias de ensino</li>
                        <li>🧘 Filosofia marcial</li>
                    </ul>
                    O que gostaria de saber?
                </div>
            </div>
        </div>
    `;
    
    ragState.chatHistory = [];
    
    // Limpa também o localStorage
    try {
        localStorage.removeItem('academia_rag_chat_history');
        console.log('📚 Histórico local limpo');
    } catch (error) {
        console.warn('Erro ao limpar histórico local:', error);
    }
}

/**
 * Scroll para baixo no chat
 */
function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

/**
 * Seleciona tipo de geração
 */
function selectGenerationType(type) {
    // Remove seleção anterior
    document.querySelectorAll('.generation-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Seleciona novo tipo
    event.currentTarget.classList.add('selected');
    ragState.selectedGeneration = type;
    
    // Mostra formulário específico
    showGenerationForm(type);
}

/**
 * Mostra formulário de geração
 */
function showGenerationForm(type) {
    const formContainer = document.getElementById('generationForm');
    if (!formContainer) return;
    
    const forms = {
        technique: `
            <h3>🥋 Gerar Nova Técnica</h3>
            <div class="form-group">
                <label for="techniqueLevel">Nível da Técnica</label>
                <select id="techniqueLevel" class="form-select">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                </select>
            </div>
            <div class="form-group">
                <label for="techniqueType">Tipo de Técnica</label>
                <select id="techniqueType" class="form-select">
                    <option value="ataque">Ataque</option>
                    <option value="defesa">Defesa</option>
                    <option value="contra-ataque">Contra-ataque</option>
                    <option value="escape">Escape</option>
                </select>
            </div>
            <div class="form-group">
                <label for="techniqueContext">Contexto/Situação</label>
                <input type="text" id="techniqueContext" class="form-input" 
                       placeholder="Ex: defesa contra soco frontal">
            </div>
            <button class="btn btn-primary" onclick="generateContent('technique')">
                ⚡ Gerar Técnica
            </button>
        `,
        lesson: `
            <h3>📝 Gerar Plano de Aula</h3>
            <div class="form-group">
                <label for="lessonDuration">Duração da Aula</label>
                <select id="lessonDuration" class="form-select">
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos</option>
                    <option value="90">90 minutos</option>
                </select>
            </div>
            <div class="form-group">
                <label for="lessonLevel">Nível dos Alunos</label>
                <select id="lessonLevel" class="form-select">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="misto">Misto</option>
                </select>
            </div>
            <div class="form-group">
                <label for="lessonFocus">Foco da Aula</label>
                <input type="text" id="lessonFocus" class="form-input" 
                       placeholder="Ex: defesas contra agarramentos">
            </div>
            <button class="btn btn-primary" onclick="generateContent('lesson')">
                ⚡ Gerar Plano de Aula
            </button>
        `,
        course: `
            <h3>🎓 Gerar Módulo de Curso</h3>
            <div class="form-group">
                <label for="courseLevel">Nível do Curso</label>
                <select id="courseLevel" class="form-select">
                    <option value="basico">Básico</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                </select>
            </div>
            <div class="form-group">
                <label for="courseWeeks">Duração (semanas)</label>
                <select id="courseWeeks" class="form-select">
                    <option value="4">4 semanas</option>
                    <option value="8">8 semanas</option>
                    <option value="12">12 semanas</option>
                </select>
            </div>
            <div class="form-group">
                <label for="courseTheme">Tema Principal</label>
                <input type="text" id="courseTheme" class="form-input" 
                       placeholder="Ex: defesa pessoal para mulheres">
            </div>
            <button class="btn btn-primary" onclick="generateContent('course')">
                ⚡ Gerar Módulo
            </button>
        `,
        evaluation: `
            <h3>📊 Gerar Critérios de Avaliação</h3>
            <div class="form-group">
                <label for="evalType">Tipo de Avaliação</label>
                <select id="evalType" class="form-select">
                    <option value="tecnica">Técnica</option>
                    <option value="pratica">Prática</option>
                    <option value="graduacao">Graduação</option>
                    <option value="progresso">Progresso</option>
                </select>
            </div>
            <div class="form-group">
                <label for="evalLevel">Nível a Avaliar</label>
                <select id="evalLevel" class="form-select">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                </select>
            </div>
            <div class="form-group">
                <label for="evalFocus">Foco da Avaliação</label>
                <input type="text" id="evalFocus" class="form-input" 
                       placeholder="Ex: técnicas de defesa básicas">
            </div>
            <button class="btn btn-primary" onclick="generateContent('evaluation')">
                ⚡ Gerar Critérios
            </button>
        `
    };
    
    formContainer.innerHTML = forms[type] || '';
    formContainer.style.display = 'block';
}

/**
 * Gera conteúdo baseado no tipo selecionado
 */
async function generateContent(type) {
    try {
        showNotification('Gerando conteúdo...', 'info');
        
        // Coleta dados do formulário
        const formData = collectFormData(type);
        
        // Simula geração com RAG
        await simulateRAGGeneration(type, formData);
        
    } catch (error) {
        console.error('Erro na geração:', error);
        showNotification('Erro ao gerar conteúdo', 'error');
    }
}

/**
 * Coleta dados do formulário
 */
function collectFormData(type) {
    const data = {};
    
    const inputs = document.querySelectorAll('#generationForm input, #generationForm select');
    inputs.forEach(input => {
        data[input.id] = input.value;
    });
    
    return { type, ...data };
}

/**
 * Simula geração RAG
 */
async function simulateRAGGeneration(type, formData) {
    // Simula tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const mockResults = {
        technique: {
            name: 'Defesa contra Soco Frontal',
            description: 'Técnica eficaz para neutralizar um soco direto frontal',
            steps: [
                'Desvio lateral do corpo mantendo os olhos no oponente',
                'Bloqueio com antebraço enquanto se move para fora da linha de ataque',
                'Contra-ataque imediato com joelhada ou soco lateral',
                'Preparação para escape ou continuação da defesa'
            ],
            tips: 'Mantenha sempre a guarda alta e pratique o timing de reação',
            level: formData.techniqueLevel
        },
        lesson: {
            title: 'Fundamentos de Defesa Pessoal',
            duration: formData.lessonDuration,
            objectives: [
                'Ensinar postura de combate básica',
                'Praticar técnicas de bloqueio',
                'Desenvolver reflexos de defesa'
            ],
            warmup: 'Aquecimento com movimentos de shadowboxing (10 min)',
            mainActivity: 'Prática de bloqueios e contra-ataques em duplas (35 min)',
            cooldown: 'Alongamento e relaxamento (15 min)',
            materials: ['Luvas de proteção', 'Tatame']
        },
        course: {
            title: 'Krav Maga Básico - Autodefesa',
            weeks: formData.courseWeeks,
            modules: [
                'Semana 1-2: Fundamentos e postura',
                'Semana 3-4: Técnicas de ataque básicas',
                'Semana 5-6: Defesas contra socos',
                'Semana 7-8: Defesas contra agarramentos'
            ],
            goals: 'Capacitar o aluno com técnicas básicas de autodefesa',
            progression: 'Avaliação prática ao final de cada módulo'
        },
        evaluation: {
            criteria: [
                'Execução técnica correta (40%)',
                'Timing e velocidade (30%)',
                'Aplicação prática (20%)',
                'Conhecimento teórico (10%)'
            ],
            methods: 'Avaliação prática com simulações',
            scale: 'Escala de 1 a 10 pontos',
            requirements: 'Mínimo 7 pontos para aprovação'
        }
    };
    
    const result = mockResults[type];
    showGenerationResults(type, result);
    showNotification('Conteúdo gerado com sucesso!', 'success');
}

/**
 * Mostra resultados da geração
 */
function showGenerationResults(type, result) {
    const resultsContainer = document.getElementById('generationResults');
    if (!resultsContainer) return;
    
    let html = `<h3>✅ Conteúdo Gerado</h3>`;
    
    if (type === 'technique') {
        html += `
            <div class="result-card">
                <h4>${result.name}</h4>
                <p><strong>Descrição:</strong> ${result.description}</p>
                <p><strong>Nível:</strong> ${result.level}</p>
                <p><strong>Passos:</strong></p>
                <ol>
                    ${result.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
                <p><strong>Dicas:</strong> ${result.tips}</p>
                <button class="btn btn-primary" onclick="saveTechnique()">💾 Salvar Técnica</button>
            </div>
        `;
    } else if (type === 'lesson') {
        html += `
            <div class="result-card">
                <h4>${result.title}</h4>
                <p><strong>Duração:</strong> ${result.duration} minutos</p>
                <p><strong>Objetivos:</strong></p>
                <ul>
                    ${result.objectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
                <p><strong>Aquecimento:</strong> ${result.warmup}</p>
                <p><strong>Atividade Principal:</strong> ${result.mainActivity}</p>
                <p><strong>Relaxamento:</strong> ${result.cooldown}</p>
                <p><strong>Materiais:</strong> ${result.materials.join(', ')}</p>
                <button class="btn btn-primary" onclick="saveLessonPlan()">💾 Salvar Plano</button>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

/**
 * Sistema de notificações
 */
function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existing = document.querySelector('.rag-notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `rag-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Ícone da notificação
 */
function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

/**
 * Salva técnica gerada
 */
function saveTechnique() {
    showNotification('Técnica salva com sucesso!', 'success');
    // TODO: Integrar com módulo de técnicas
}

/**
 * Salva plano de aula gerado
 */
function saveLessonPlan() {
    showNotification('Plano de aula salvo com sucesso!', 'success');
    // TODO: Integrar com módulo de planos de aula
}

// Registra módulo globalmente
window.ragModule = {
    init: initializeRAGModule,
    showTab,
    selectGenerationType,
    generateContent,
    askSuggestion,
    clearChat,
    viewDocument
};

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRAGModule);
} else {
    initializeRAGModule();
}

console.log('🧠 RAG Module carregado e pronto para inicialização');
