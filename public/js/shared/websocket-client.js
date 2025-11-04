/**
 * 🔌 WebSocket Client
 * 
 * RESPONSABILIDADE:
 * - Conectar ao WebSocket server
 * - Gerenciar reconexão automática
 * - Dispatch de eventos para handlers registrados
 * 
 * EVENTOS SUPORTADOS:
 * - agent:execution:start
 * - agent:execution:complete
 * - agent:execution:error
 * - task:created
 * - task:approved
 * - task:executed
 * - permission:pending
 * 
 * USO:
 * const wsClient = new WebSocketClient();
 * wsClient.connect(organizationId, userId);
 * wsClient.on('agent:execution:complete', (data) => {
 *   console.log('Agent completed:', data);
 * });
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.handlers = {}; // eventType -> Set<handler>
    this.organizationId = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000; // 3 segundos
    this.isConnecting = false;
    this.isManualClose = false;
    this.pingInterval = null;
  }

  /**
   * Conectar ao WebSocket server
   * @param {string} organizationId - ID da organização
   * @param {string} userId - ID do usuário (opcional)
   */
  connect(organizationId, userId = null) {
    if (this.isConnecting) {
      console.log('[WebSocket] Already connecting...');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.organizationId = organizationId;
    this.userId = userId;
    this.isConnecting = true;
    this.isManualClose = false;

    // Construir URL com query params
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let url = `${protocol}//${host}/ws/agents?organizationId=${organizationId}`;
    
    if (userId) {
      url += `&userId=${userId}`;
    }

    console.log(`[WebSocket] Connecting to ${url}`);

    try {
      this.ws = new WebSocket(url);

      // Connection opened
      this.ws.addEventListener('open', () => {
        console.log('[WebSocket] ✅ Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Iniciar keep-alive (ping a cada 25s)
        this.startPing();
        
        // Emitir evento de conexão
        this._emit('connected', { organizationId, userId });
      });

      // Message received
      this.ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type, message.data);
          
          // Emitir evento para handlers registrados
          this._emit(message.type, message.data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      });

      // Connection closed
      this.ws.addEventListener('close', (event) => {
        console.log(`[WebSocket] ❌ Connection closed - code: ${event.code}, reason: ${event.reason || 'Unknown'}`);
        this.isConnecting = false;
        this.stopPing();
        
        // Emitir evento de desconexão
        this._emit('disconnected', { code: event.code, reason: event.reason });
        
        // Reconectar automaticamente (se não foi fechamento manual)
        if (!this.isManualClose) {
          this._scheduleReconnect();
        }
      });

      // Error handler
      this.ws.addEventListener('error', (error) => {
        console.error('[WebSocket] ⚠️ Error:', error);
        this.isConnecting = false;
        this._emit('error', { error: error.message || 'WebSocket error' });
      });

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.isConnecting = false;
      this._scheduleReconnect();
    }
  }

  /**
   * Reconectar com backoff exponencial
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached. Giving up.');
      this._emit('reconnect:failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`[WebSocket] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect(this.organizationId, this.userId);
      }
    }, delay);
  }

  /**
   * Keep-alive: Envia ping a cada 25s
   */
  startPing() {
    this.stopPing(); // Limpar anterior
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 25000); // 25 segundos (servidor faz ping/pong a cada 30s)
  }

  /**
   * Parar keep-alive
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Enviar mensagem para o servidor
   * @param {string} type - Tipo da mensagem
   * @param {any} data - Dados da mensagem
   */
  send(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message - not connected');
      return false;
    }

    const message = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(message));
    return true;
  }

  /**
   * Registrar handler para evento
   * @param {string} eventType - Tipo do evento (ex: 'agent:execution:complete')
   * @param {Function} handler - Callback (data) => void
   */
  on(eventType, handler) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = new Set();
    }
    this.handlers[eventType].add(handler);
    
    console.log(`[WebSocket] Handler registered for '${eventType}'`);
  }

  /**
   * Remover handler de evento
   * @param {string} eventType - Tipo do evento
   * @param {Function} handler - Handler a ser removido
   */
  off(eventType, handler) {
    if (this.handlers[eventType]) {
      this.handlers[eventType].delete(handler);
    }
  }

  /**
   * Emitir evento para handlers registrados
   * @param {string} eventType - Tipo do evento
   * @param {any} data - Dados do evento
   */
  _emit(eventType, data) {
    const handlers = this.handlers[eventType];
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for '${eventType}':`, error);
        }
      });
    }
  }

  /**
   * Desconectar manualmente
   */
  disconnect() {
    console.log('[WebSocket] Disconnecting manually');
    this.isManualClose = true;
    this.stopPing();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.handlers = {};
  }

  /**
   * Verificar se está conectado
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obter estado da conexão
   * @returns {string} - 'CONNECTING', 'OPEN', 'CLOSING', 'CLOSED', 'DISCONNECTED'
   */
  getState() {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Exportar singleton global
if (typeof window !== 'undefined') {
  window.WebSocketClient = WebSocketClient;
  
  // Criar instância global (opcional - pode ser criado por módulo)
  if (!window.wsClient) {
    window.wsClient = null; // Será criado quando necessário
  }
}
