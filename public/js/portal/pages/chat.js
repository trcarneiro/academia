import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/chat.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'chat-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'chat-content';
    content.innerHTML = `
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages"></div>
            
            <div class="chat-input-area">
                <div class="quick-actions-scroll" id="quick-actions"></div>
                
                <div class="input-wrapper">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Digite sua mensagem...">
                    <button class="send-btn" id="send-btn">➤</button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(content);

    initChat();
}

let messages = [];
let quickActions = [];
let isTyping = false;

function initChat() {
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Add welcome message
    addMessage({
        role: 'assistant',
        content: 'Olá! Sou seu assistente virtual. Como posso ajudar você hoje? Você pode me perguntar sobre horários, técnicas ou sua situação financeira.',
        timestamp: new Date()
    });

    // Setup events
    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Load quick actions
    loadQuickActions();
}

async function loadQuickActions() {
    try {
        const response = await api.request('GET', '/chat/actions');
        if (response.success && response.data) {
            quickActions = response.data;
            renderQuickActions();
        } else {
            // Default quick actions
            quickActions = [
                { id: 'schedule', label: '📅 Meus horários' },
                { id: 'payment', label: '💳 Situação financeira' },
                { id: 'techniques', label: '🥋 Próxima técnica' },
                { id: 'help', label: '❓ Ajuda' }
            ];
            renderQuickActions();
        }
    } catch (error) {
        console.error('Error fetching quick actions:', error);
        // Use defaults
        quickActions = [
            { id: 'schedule', label: '📅 Meus horários' },
            { id: 'payment', label: '💳 Situação financeira' },
            { id: 'techniques', label: '🥋 Próxima técnica' },
            { id: 'help', label: '❓ Ajuda' }
        ];
        renderQuickActions();
    }
}

function renderQuickActions() {
    const container = document.getElementById('quick-actions');
    if (!container) return;

    container.innerHTML = quickActions.map(action => `
        <div class="quick-action-chip" data-action="${action.id}">${action.label}</div>
    `).join('');

    container.querySelectorAll('.quick-action-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const actionId = chip.dataset.action;
            handleQuickAction(actionId);
        });
    });
}

function handleQuickAction(actionId) {
    const actionMessages = {
        'schedule': 'Quais são meus horários de aula?',
        'payment': 'Qual minha situação financeira?',
        'techniques': 'Qual é a próxima técnica que devo aprender?',
        'help': 'O que você pode me ajudar?'
    };

    const message = actionMessages[actionId];
    if (message) {
        addMessage({ role: 'user', content: message, timestamp: new Date() });
        sendToAssistant(message);
    }
}

function addMessage(message) {
    messages.push(message);
    renderMessages();
}

function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.role}">
            <div class="message-bubble">
                ${msg.content}
            </div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
        </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    addMessage({ role: 'user', content: text, timestamp: new Date() });
    await sendToAssistant(text);
}

async function sendToAssistant(text) {
    isTyping = true;
    showTypingIndicator();

    try {
        const response = await api.request('POST', '/chat/message', { message: text });
        
        hideTypingIndicator();
        isTyping = false;

        if (response.success && response.data?.response) {
            addMessage({
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date()
            });
        } else {
            addMessage({
                role: 'assistant',
                content: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        isTyping = false;
        
        addMessage({
            role: 'assistant',
            content: 'Desculpe, ocorreu um erro. Verifique sua conexão e tente novamente.',
            timestamp: new Date()
        });
    }
}

function showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="message-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}
