/**
 * Configuração de Servidores MCP
 * 
 * Define servidores MCP externos que o sistema pode conectar
 * para executar ações em outros sistemas.
 */

import { MCPServerConfig } from '@/services/mcpClientService';

/**
 * Servidores MCP disponíveis para conexão
 * 
 * Adicione novos servidores aqui conforme necessário.
 * Cada servidor deve ter um executável MCP compatível.
 */
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  /**
   * Servidor de Database - Executa queries seguras no PostgreSQL
   * 
   * Tools disponíveis:
   * - query: Executar SELECT
   * - update: Executar UPDATE com WHERE obrigatório
   * - insert: Executar INSERT
   * - count: Contar registros
   */
  database: {
    id: 'database',
    name: 'Database Server',
    description: 'Executa queries seguras no banco de dados PostgreSQL',
    command: 'node',
    args: ['./mcp-servers/database-server.js'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  },

  /**
   * Servidor de WhatsApp - Envia mensagens via Twilio
   * 
   * Tools disponíveis:
   * - send_message: Enviar mensagem de texto
   * - send_media: Enviar imagem/vídeo/documento
   * - get_status: Verificar status de mensagem
   */
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Server',
    description: 'Envia mensagens WhatsApp via Twilio API',
    command: 'node',
    args: ['./mcp-servers/whatsapp-server.js'],
    env: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || ''
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  },

  /**
   * Servidor de SMS - Envia SMS via Twilio
   * 
   * Tools disponíveis:
   * - send_sms: Enviar SMS
   * - get_status: Verificar status de SMS
   * - get_balance: Verificar saldo Twilio
   */
  sms: {
    id: 'sms',
    name: 'SMS Server',
    description: 'Envia SMS via Twilio API',
    command: 'node',
    args: ['./mcp-servers/sms-server.js'],
    env: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || ''
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  },

  /**
   * Servidor de Email - Envia emails via SendGrid
   * 
   * Tools disponíveis:
   * - send_email: Enviar email
   * - send_bulk_email: Enviar email em massa
   * - track_email: Rastrear abertura/cliques
   */
  email: {
    id: 'email',
    name: 'Email Server',
    description: 'Envia emails via SendGrid API',
    command: 'node',
    args: ['./mcp-servers/email-server.js'],
    env: {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || '',
      SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'Academia Krav Maga'
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  },

  /**
   * Servidor de CRM - Integração com sistema de CRM
   * 
   * Tools disponíveis:
   * - create_lead: Criar lead
   * - update_lead: Atualizar lead
   * - get_pipeline: Obter pipeline de vendas
   * - create_task: Criar tarefa para vendedor
   */
  crm: {
    id: 'crm',
    name: 'CRM Server',
    description: 'Integra com sistema de CRM (Pipedrive/HubSpot)',
    command: 'node',
    args: ['./mcp-servers/crm-server.js'],
    env: {
      CRM_API_KEY: process.env.CRM_API_KEY || '',
      CRM_DOMAIN: process.env.CRM_DOMAIN || '',
      CRM_TYPE: process.env.CRM_TYPE || 'pipedrive' // pipedrive, hubspot, etc
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  },

  /**
   * Servidor de Asaas - Integração com gateway de pagamento
   * 
   * Tools disponíveis:
   * - create_payment: Criar cobrança
   * - get_payment_status: Verificar status de pagamento
   * - create_subscription: Criar assinatura recorrente
   * - cancel_subscription: Cancelar assinatura
   */
  asaas: {
    id: 'asaas',
    name: 'Asaas Server',
    description: 'Integra com Asaas (gateway de pagamento)',
    command: 'node',
    args: ['./mcp-servers/asaas-server.js'],
    env: {
      ASAAS_API_KEY: process.env.ASAAS_API_KEY || '',
      ASAAS_ENVIRONMENT: process.env.ASAAS_ENVIRONMENT || 'sandbox'
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  }
};

/**
 * Obter configuração de um servidor por ID
 * 
 * @param serverId ID do servidor
 * @returns Configuração do servidor ou undefined
 */
export function getMCPServerConfig(serverId: string): MCPServerConfig | undefined {
  return MCP_SERVERS[serverId];
}

/**
 * Listar IDs de todos os servidores configurados
 * 
 * @returns Array de IDs
 */
export function listMCPServerIds(): string[] {
  return Object.keys(MCP_SERVERS);
}

/**
 * Obter servidores por categoria
 * 
 * @param category Categoria (communication, database, payment, crm)
 * @returns Configurações dos servidores
 */
export function getMCPServersByCategory(category: 'communication' | 'database' | 'payment' | 'crm'): MCPServerConfig[] {
  const categoryMap: Record<string, string[]> = {
    communication: ['whatsapp', 'sms', 'email'],
    database: ['database'],
    payment: ['asaas'],
    crm: ['crm']
  };

  const serverIds = categoryMap[category] || [];
  return serverIds.map(id => MCP_SERVERS[id]).filter(Boolean);
}
