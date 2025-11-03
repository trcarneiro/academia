/**
 * 🔌 WebSocket Service
 * 
 * RESPONSABILIDADE:
 * - Gerenciar conexões WebSocket para notificações em tempo real
 * - Broadcast de eventos de agentes para clientes conectados
 * - Isolamento por organizationId (multi-tenant)
 * 
 * EVENTOS SUPORTADOS:
 * - agent:execution:start - Agente iniciou execução
 * - agent:execution:complete - Agente completou execução
 * - agent:execution:error - Agente encontrou erro
 * - task:created - Nova task criada
 * - task:approved - Task aprovada
 * - task:executed - Task executada
 * - permission:pending - Permissão pendente de aprovação
 * 
 * INTEGRAÇÃO:
 * - Fastify HTTP server (via server.on('upgrade'))
 * - agentOrchestratorService (emite eventos)
 * - agentTaskService (emite eventos)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { logger } from '@/utils/logger';
import { parse } from 'url';

interface WebSocketClient extends WebSocket {
  organizationId?: string;
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocketClient>> = new Map(); // organizationId -> Set<client>
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializa WebSocket Server
   * @param server - HTTP Server do Fastify
   */
  initialize(server: HTTPServer): void {
    if (this.wss) {
      logger.warn('[WebSocket] Service already initialized');
      return;
    }

    this.wss = new WebSocketServer({ noServer: true });

    // Handle HTTP upgrade to WebSocket
    server.on('upgrade', (request, socket, head) => {
      const { pathname, query } = parse(request.url || '', true);

      // Apenas aceitar conexões em /ws/agents
      if (pathname !== '/ws/agents') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      // Validar organizationId
      const organizationId = query.organizationId as string;
      const userId = query.userId as string;

      if (!organizationId) {
        socket.write('HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nMissing organizationId\r\n');
        socket.destroy();
        return;
      }

      // Upgrade para WebSocket
      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        const client = ws as WebSocketClient;
        client.organizationId = organizationId;
        client.userId = userId;
        client.isAlive = true;

        this.wss!.emit('connection', client, request);
      });
    });

    // Handle WebSocket connections
    this.wss.on('connection', (client: WebSocketClient) => {
      const orgId = client.organizationId!;
      logger.info(`[WebSocket] Client connected - orgId: ${orgId}, userId: ${client.userId || 'anonymous'}`);

      // Adicionar cliente ao Map por organizationId
      if (!this.clients.has(orgId)) {
        this.clients.set(orgId, new Set());
      }
      this.clients.get(orgId)!.add(client);

      // Pong handler (keep-alive)
      client.on('pong', () => {
        client.isAlive = true;
      });

      // Message handler (opcional - cliente pode enviar comandos)
      client.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          logger.debug(`[WebSocket] Message received from ${orgId}:`, data);

          // Aqui você pode processar comandos do cliente (ex: subscribe, unsubscribe)
          if (data.type === 'ping') {
            this.sendToClient(client, 'pong', { timestamp: new Date().toISOString() });
          }
        } catch (error) {
          logger.error('[WebSocket] Invalid message format:', error);
        }
      });

      // Close handler
      client.on('close', () => {
        logger.info(`[WebSocket] Client disconnected - orgId: ${orgId}`);
        this.clients.get(orgId)?.delete(client);
        
        // Remover Set vazio
        if (this.clients.get(orgId)?.size === 0) {
          this.clients.delete(orgId);
        }
      });

      // Error handler
      client.on('error', (error) => {
        logger.error(`[WebSocket] Client error - orgId: ${orgId}:`, error);
      });

      // Enviar mensagem de boas-vindas
      this.sendToClient(client, 'connected', {
        message: 'WebSocket connected successfully',
        organizationId: orgId,
        timestamp: new Date().toISOString()
      });
    });

    // Iniciar keep-alive (ping/pong a cada 30s)
    this.startKeepAlive();

    logger.info('✅ WebSocket Service initialized on /ws/agents');
  }

  /**
   * Keep-alive: Envia ping a cada 30s e fecha conexões mortas
   */
  private startKeepAlive(): void {
    this.pingInterval = setInterval(() => {
      this.wss?.clients.forEach((client: WebSocket) => {
        const ws = client as WebSocketClient;

        if (ws.isAlive === false) {
          logger.warn(`[WebSocket] Terminating dead connection - orgId: ${ws.organizationId}`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos
  }

  /**
   * Broadcast: Envia evento para TODOS os clientes de uma organização
   * @param organizationId - ID da organização
   * @param eventType - Tipo do evento (ex: 'agent:execution:complete')
   * @param data - Dados do evento
   */
  broadcast(organizationId: string, eventType: string, data: any): void {
    const clients = this.clients.get(organizationId);

    if (!clients || clients.size === 0) {
      logger.debug(`[WebSocket] No clients connected for orgId: ${organizationId}`);
      return;
    }

    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        sentCount++;
      }
    });

    logger.info(`[WebSocket] Broadcast '${eventType}' to ${sentCount} clients in orgId: ${organizationId}`);
  }

  /**
   * Send to User: Envia evento para clientes específicos de um usuário
   * @param organizationId - ID da organização
   * @param userId - ID do usuário
   * @param eventType - Tipo do evento
   * @param data - Dados do evento
   */
  sendToUser(organizationId: string, userId: string, eventType: string, data: any): void {
    const clients = this.clients.get(organizationId);

    if (!clients || clients.size === 0) {
      logger.debug(`[WebSocket] No clients for orgId: ${organizationId}`);
      return;
    }

    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    clients.forEach((client) => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        sentCount++;
      }
    });

    logger.info(`[WebSocket] Sent '${eventType}' to ${sentCount} clients of userId: ${userId} in orgId: ${organizationId}`);
  }

  /**
   * Send to Client: Envia mensagem para um cliente específico
   * @param client - WebSocket client
   * @param eventType - Tipo do evento
   * @param data - Dados do evento
   */
  private sendToClient(client: WebSocketClient, eventType: string, data: any): void {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WebSocketMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    client.send(JSON.stringify(message));
  }

  /**
   * Get Stats: Retorna estatísticas de conexões
   */
  getStats(): { totalClients: number; organizationsConnected: number; clientsByOrg: Record<string, number> } {
    const clientsByOrg: Record<string, number> = {};
    let totalClients = 0;

    this.clients.forEach((clients, orgId) => {
      clientsByOrg[orgId] = clients.size;
      totalClients += clients.size;
    });

    return {
      totalClients,
      organizationsConnected: this.clients.size,
      clientsByOrg
    };
  }

  /**
   * Shutdown: Fecha todas as conexões e limpa recursos
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.wss) {
      // Fechar todas as conexões
      this.wss.clients.forEach((client) => {
        client.close(1000, 'Server shutdown');
      });

      this.wss.close(() => {
        logger.info('[WebSocket] Service shut down');
      });

      this.wss = null;
    }

    this.clients.clear();
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
