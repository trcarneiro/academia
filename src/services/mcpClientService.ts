/**
 * MCP Client Service - Cliente oficial do Model Context Protocol
 * 
 * Este serviço conecta a servidores MCP externos via stdio/SSE
 * e permite executar ferramentas (tools) em sistemas externos.
 * 
 * Compatível com: @modelcontextprotocol/sdk v1.0.0+
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '@/utils/logger';

/**
 * Configuração de um servidor MCP
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

/**
 * Ferramenta MCP disponível
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: any;
}

/**
 * Resultado da execução de uma ferramenta
 */
export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

/**
 * Cliente MCP - gerencia conexões com servidores externos
 */
export class MCPClientService {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private connectedServers: Set<string> = new Set();

  /**
   * Conectar a um servidor MCP
   * 
   * @param config Configuração do servidor
   * @returns Cliente conectado
   */
  async connectToServer(config: MCPServerConfig): Promise<Client> {
    try {
      // Verificar se já está conectado
      if (this.clients.has(config.id)) {
        logger.info(`[MCP] Server ${config.id} already connected`);
        return this.clients.get(config.id)!;
      }

      logger.info(`[MCP] Connecting to server: ${config.name} (${config.id})`);

      // Criar transporte stdio
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env
      });

      this.transports.set(config.id, transport);

      // Criar cliente
      const client = new Client({
        name: `academia-agent-${config.id}`,
        version: '1.0.0'
      }, {
        capabilities: config.capabilities || {
          tools: {},
          resources: {},
          prompts: {}
        }
      });

      // Conectar
      await client.connect(transport);
      
      this.clients.set(config.id, client);
      this.connectedServers.add(config.id);

      logger.info(`[MCP] ✅ Connected to server: ${config.name}`);
      
      // Listar ferramentas disponíveis
      const tools = await this.listTools(config.id);
      logger.info(`[MCP] Server ${config.name} has ${tools.length} tools available`);

      return client;
    } catch (error) {
      logger.error(`[MCP] Failed to connect to server ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * Desconectar de um servidor MCP
   * 
   * @param serverId ID do servidor
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    try {
      const client = this.clients.get(serverId);
      if (!client) {
        logger.warn(`[MCP] Server ${serverId} not connected`);
        return;
      }

      await client.close();
      
      this.clients.delete(serverId);
      this.transports.delete(serverId);
      this.connectedServers.delete(serverId);

      logger.info(`[MCP] Disconnected from server: ${serverId}`);
    } catch (error) {
      logger.error(`[MCP] Failed to disconnect from server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Listar ferramentas disponíveis em um servidor
   * 
   * @param serverId ID do servidor
   * @returns Lista de ferramentas
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    try {
      const response = await client.listTools();
      return response.tools as MCPTool[];
    } catch (error) {
      logger.error(`[MCP] Failed to list tools for server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Executar uma ferramenta em um servidor MCP
   * 
   * @param serverId ID do servidor
   * @param toolName Nome da ferramenta
   * @param args Argumentos da ferramenta
   * @returns Resultado da execução
   */
  async executeTool(
    serverId: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} not connected. Available servers: ${Array.from(this.connectedServers).join(', ')}`);
    }

    try {
      logger.info(`[MCP] Executing tool "${toolName}" on server "${serverId}"`);
      logger.debug(`[MCP] Tool arguments:`, args);

      const result = await client.callTool({
        name: toolName,
        arguments: args
      });

      logger.info(`[MCP] ✅ Tool "${toolName}" executed successfully`);
      
      return result as MCPToolResult;
    } catch (error) {
      logger.error(`[MCP] Failed to execute tool ${toolName} on server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Verificar se um servidor está conectado
   * 
   * @param serverId ID do servidor
   * @returns true se conectado
   */
  isConnected(serverId: string): boolean {
    return this.connectedServers.has(serverId);
  }

  /**
   * Obter lista de servidores conectados
   * 
   * @returns IDs dos servidores conectados
   */
  getConnectedServers(): string[] {
    return Array.from(this.connectedServers);
  }

  /**
   * Obter todas as ferramentas disponíveis em todos os servidores
   * 
   * @returns Mapa de serverId → ferramentas
   */
  async getAllAvailableTools(): Promise<Map<string, MCPTool[]>> {
    const toolsMap = new Map<string, MCPTool[]>();

    for (const serverId of this.connectedServers) {
      try {
        const tools = await this.listTools(serverId);
        toolsMap.set(serverId, tools);
      } catch (error) {
        logger.error(`[MCP] Failed to list tools for server ${serverId}:`, error);
        toolsMap.set(serverId, []);
      }
    }

    return toolsMap;
  }

  /**
   * Desconectar de todos os servidores
   */
  async disconnectAll(): Promise<void> {
    logger.info('[MCP] Disconnecting from all servers...');
    
    const serverIds = Array.from(this.connectedServers);
    
    for (const serverId of serverIds) {
      await this.disconnectFromServer(serverId);
    }

    logger.info('[MCP] All servers disconnected');
  }
}

// Singleton instance
export const mcpClientService = new MCPClientService();
