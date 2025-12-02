# Database Error Handling & Recovery Guide

**Versão**: 1.0.0  
**Última Atualização**: 30/11/2025  
**Prioridade**: 🔴 Alta (Documentação Crítica)

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Erros Comuns e Soluções](#erros-comuns-e-soluções)
3. [Configuração de Conexão](#configuração-de-conexão)
4. [Estratégias de Recovery](#estratégias-de-recovery)
5. [Monitoramento e Alertas](#monitoramento-e-alertas)

---

## 🏗️ Visão Geral da Arquitetura

### Stack de Banco de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO (Fastify)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Prisma Client                      │   │
│  │  connection_limit=5 (local pool)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE POOLER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    PgBouncer                         │   │
│  │  Host: aws-0-us-east-2.pooler.supabase.com          │   │
│  │  Port: 6543 (Transaction mode)                       │   │
│  │  Max connections: ~50 (shared across all clients)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Supabase)                    │
│  Host: db.yawfuymgwukericlhgxh.supabase.co                 │
│  Port: 5432                                                 │
│  Database: postgres                                         │
└─────────────────────────────────────────────────────────────┘
```

### Parâmetros de Conexão Atuais

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `connection_limit` | 5 | Conexões máximas no pool Prisma |
| `pool_timeout` | 10s | Timeout para obter conexão do pool |
| `connect_timeout` | 5s | Timeout para estabelecer conexão |
| `pgbouncer` | true | Modo de compatibilidade PgBouncer |

---

## 🚨 Erros Comuns e Soluções

### 1. P2024 - Connection Pool Timeout

**Mensagem de Erro:**
```
PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool.
Error Code: P2024
```

**Causas:**
1. Todas as 5 conexões do pool estão ocupadas
2. Queries muito lentas bloqueando conexões
3. Conexões não sendo liberadas corretamente
4. Pico de requisições concorrentes

**Soluções:**

```typescript
// 1. IMEDIATO: Reiniciar servidor para limpar pool
// Terminal:
// Get-Process node | Stop-Process -Force; npm run dev

// 2. Aumentar pool temporariamente (não recomendado para PgBouncer)
// .env - use com cuidado, PgBouncer tem limite global
DATABASE_URL="...?connection_limit=10&pool_timeout=15..."

// 3. Implementar retry com backoff exponencial
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      if (error.code === 'P2024' && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Pool timeout, retry ${attempt}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Prevenção:**
```typescript
// Em src/utils/database.ts - adicionar healthcheck
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Usar em routes para verificar antes de operações pesadas
fastify.get('/api/health', async (request, reply) => {
  const dbHealthy = await checkDatabaseHealth();
  return reply.send({
    status: dbHealthy ? 'healthy' : 'degraded',
    database: dbHealthy ? 'connected' : 'connection_issues',
    timestamp: new Date().toISOString()
  });
});
```

---

### 2. Can't Reach Database Server

**Mensagem de Erro:**
```
Can't reach database server at `aws-0-us-east-2.pooler.supabase.com:6543`
```

**Causas:**
1. Supabase em manutenção
2. Problema de rede/DNS
3. Firewall bloqueando conexão
4. Quota de conexões excedida

**Diagnóstico:**
```powershell
# 1. Testar conectividade
Test-NetConnection -ComputerName aws-0-us-east-2.pooler.supabase.com -Port 6543

# 2. Verificar DNS
Resolve-DnsName aws-0-us-east-2.pooler.supabase.com

# 3. Testar com psql (se instalado)
psql "postgresql://postgres.yawfuymgwukericlhgxh:***@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
```

**Soluções:**
```typescript
// 1. Fallback para conexão direta (apenas para emergências)
const FALLBACK_URL = process.env.DIRECT_URL;

async function getWorkingConnection(): Promise<PrismaClient> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (error) {
    console.warn('Pooler unavailable, trying direct connection...');
    
    const fallbackPrisma = new PrismaClient({
      datasources: { db: { url: FALLBACK_URL } }
    });
    
    await fallbackPrisma.$queryRaw`SELECT 1`;
    return fallbackPrisma;
  }
}

// 2. Verificar status do Supabase
// https://status.supabase.com/
```

---

### 3. Organization Not Found (Development Fallback)

**Mensagem de Log:**
```
WARN: ⚠️ Organization not found, using development fallback:
```

**Causa:**
O sistema não consegue encontrar uma organização válida para o contexto atual.

**Soluções:**

```typescript
// 1. Verificar organizações existentes
// Execute: npx ts-node scripts/list-organizations.ts

// 2. Configurar organização padrão no .env
DEFAULT_ORGANIZATION_ID="ff5ee00e-d8a3-4291-9428-d28b852fb472"

// 3. No código, tratar ausência de organização
async function getOrganizationContext(request: FastifyRequest): Promise<string> {
  // Tentar do header
  const orgId = request.headers['x-organization-id'] as string;
  if (orgId && await validateOrganization(orgId)) {
    return orgId;
  }
  
  // Tentar do usuário autenticado
  const user = request.user;
  if (user?.organizationId) {
    return user.organizationId;
  }
  
  // Fallback para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const defaultOrg = process.env.DEFAULT_ORGANIZATION_ID;
    if (defaultOrg) {
      console.warn(`Using development fallback organization: ${defaultOrg}`);
      return defaultOrg;
    }
  }
  
  throw new Error('Organization context required');
}
```

---

## ⚙️ Configuração de Conexão

### Configuração Recomendada (.env)

```bash
# CONEXÃO POOLER (uso normal - via PgBouncer)
# - Use para operações CRUD normais
# - Limite baixo porque PgBouncer gerencia pool globalmente
DATABASE_URL="postgresql://postgres.USER:PASS@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10&connect_timeout=5"

# CONEXÃO DIRETA (migrações e emergências)
# - Use para: npx prisma migrate, npx prisma db push
# - Não use em produção normal (consome conexões diretas)
DIRECT_URL="postgresql://postgres:PASS@db.USER.supabase.co:5432/postgres"

# SHADOW DATABASE (opcional, para migrações)
SHADOW_DATABASE_URL="postgresql://postgres:PASS@db.USER.supabase.co:5432/postgres"
```

### Configuração Prisma (schema.prisma)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Limites Recomendados por Ambiente

| Ambiente | connection_limit | pool_timeout | connect_timeout |
|----------|------------------|--------------|-----------------|
| Development | 5 | 10s | 5s |
| Staging | 5 | 15s | 10s |
| Production | 3-5 | 20s | 10s |

> ⚠️ **Importante**: Com PgBouncer, mantenha `connection_limit` baixo (3-5). O PgBouncer gerencia o pool global e valores altos podem causar "too many clients" no Supabase.

---

## 🔄 Estratégias de Recovery

### 1. Auto-Recovery no Backend

```typescript
// src/utils/database.ts - versão robusta

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseManager {
  private prisma: PrismaClient;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY_BASE = 2000; // 2s

  constructor() {
    this.prisma = this.createClient();
  }

  private createClient(): PrismaClient {
    return new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
      ],
      datasources: {
        db: { url: process.env.DATABASE_URL }
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      await this.handleConnectionError();
    }
  }

  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('🚨 Max reconnection attempts reached. Manual intervention required.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.warn(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Recriar cliente para limpar estado
    await this.prisma.$disconnect();
    this.prisma = this.createClient();
    
    await this.connect();
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { healthy: true, latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: -1 };
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}

export const dbManager = new DatabaseManager();
export const prisma = dbManager.getClient();
```

### 2. Middleware de Resiliência

```typescript
// src/middlewares/databaseResilience.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from '../utils/database';
import { logger } from '../utils/logger';

export async function databaseResilienceMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const health = await dbManager.healthCheck();
  
  if (!health.healthy) {
    logger.error('Database unhealthy, returning 503');
    
    return reply.code(503).send({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Database temporarily unavailable. Please retry in a few moments.',
      retryAfter: 30 // segundos
    });
  }
  
  // Log slow database responses
  if (health.latency > 1000) {
    logger.warn(`Slow database response: ${health.latency}ms`);
  }
}
```

### 3. Frontend Error Handling

```javascript
// public/js/shared/api-client.js - adicionar ao módulo

const DATABASE_ERRORS = {
  'P2024': {
    userMessage: 'Sistema sobrecarregado. Tente novamente em alguns segundos.',
    retryable: true,
    retryDelay: 5000
  },
  'SERVICE_UNAVAILABLE': {
    userMessage: 'Banco de dados temporariamente indisponível.',
    retryable: true,
    retryDelay: 30000
  },
  'CONNECTION_REFUSED': {
    userMessage: 'Não foi possível conectar ao servidor.',
    retryable: true,
    retryDelay: 10000
  }
};

function handleDatabaseError(error, context) {
  const errorInfo = DATABASE_ERRORS[error.code] || {
    userMessage: 'Erro ao acessar banco de dados.',
    retryable: false
  };
  
  // Mostrar notificação ao usuário
  showNotification({
    type: 'error',
    message: errorInfo.userMessage,
    duration: errorInfo.retryable ? errorInfo.retryDelay : 5000
  });
  
  // Auto-retry se possível
  if (errorInfo.retryable && context.retryCount < 3) {
    setTimeout(() => {
      context.retryFn({ ...context, retryCount: context.retryCount + 1 });
    }, errorInfo.retryDelay);
  }
  
  // Log para debugging
  console.error(`[DB Error] ${error.code}:`, error.message, context);
}
```

---

## 📊 Monitoramento e Alertas

### Health Check Endpoint

```typescript
// src/routes/health.ts

import { FastifyInstance } from 'fastify';
import { dbManager } from '../utils/database';
import { logger } from '../utils/logger';

export default async function healthRoutes(fastify: FastifyInstance) {
  
  // Health check básico
  fastify.get('/health', async (request, reply) => {
    const dbHealth = await dbManager.healthCheck();
    
    const status = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealth.healthy ? 'up' : 'down',
          latency: dbHealth.latency
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal
        }
      }
    };
    
    return reply
      .code(dbHealth.healthy ? 200 : 503)
      .send(status);
  });
  
  // Health check detalhado (para monitoramento)
  fastify.get('/health/detailed', async (request, reply) => {
    const dbHealth = await dbManager.healthCheck();
    
    // Verificar conexões ativas (se possível)
    let poolInfo = null;
    try {
      const result = await prisma.$queryRaw`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      poolInfo = result[0];
    } catch (e) {
      // Ignore - pode não ter permissão
    }
    
    return reply.send({
      status: dbHealth.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        latency: `${dbHealth.latency}ms`,
        poolInfo,
        config: {
          connectionLimit: 5,
          poolTimeout: '10s',
          connectTimeout: '5s'
        }
      },
      server: {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        },
        nodeVersion: process.version
      }
    });
  });
}
```

### Script de Monitoramento

```typescript
// scripts/monitor-database.ts

import { prisma } from '../src/utils/database';

async function monitorDatabase() {
  console.log('🔍 Database Monitor Started\n');
  
  setInterval(async () => {
    const start = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      const status = latency < 100 ? '✅' : latency < 500 ? '⚠️' : '🔴';
      console.log(`${status} [${new Date().toISOString()}] Latency: ${latency}ms`);
      
    } catch (error: any) {
      console.error(`❌ [${new Date().toISOString()}] Error: ${error.code || error.message}`);
    }
  }, 5000); // Check every 5 seconds
}

monitorDatabase();
```

---

## 🛠️ Comandos de Emergência

### Restart Rápido (Windows PowerShell)

```powershell
# Parar todos os processos Node e reiniciar
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
npm run dev
```

### Verificar Conexões Ativas

```sql
-- Execute no Supabase SQL Editor
SELECT 
  count(*) as total_connections,
  state,
  application_name
FROM pg_stat_activity 
WHERE datname = 'postgres'
GROUP BY state, application_name;
```

### Limpar Conexões Órfãs

```sql
-- ⚠️ CUIDADO: Execute apenas em emergência
-- Isso encerra todas as conexões exceto a atual
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'postgres' 
  AND pid <> pg_backend_pid()
  AND state = 'idle';
```

---

## 🚦 Rate Limiting

### Configuração Atual

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `RATE_LIMIT_MAX` | 100 | Requisições máximas por janela |
| `RATE_LIMIT_WINDOW` | 15m | Janela de tempo para contagem |
| Login attempts | 5/min | Limite por IP para tentativas de login |
| Biometric attempts | 3/min | Limite para check-ins biométricos |

### Comportamento do Usuário

Quando o rate limit é excedido:

```typescript
// Resposta HTTP 429 (Too Many Requests)
{
  success: false,
  error: 'RATE_LIMIT_EXCEEDED',
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
  retryAfter: 900 // segundos até liberação
}
```

### Headers de Resposta

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
Retry-After: 900
```

### Tratamento no Frontend

```javascript
// public/js/shared/api-client.js
const RATE_LIMIT_ERROR = {
  code: 'RATE_LIMIT_EXCEEDED',
  userMessage: 'Você fez muitas requisições. Aguarde alguns minutos.',
  retryable: true
};

async function handleRateLimitError(response) {
  const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
  
  showNotification({
    type: 'warning',
    title: 'Limite de Requisições',
    message: `Por favor, aguarde ${Math.ceil(retryAfter / 60)} minutos.`,
    duration: 10000
  });
  
  // Opcional: desabilitar botões temporariamente
  disableFormSubmits(retryAfter * 1000);
}
```

### Endpoints Protegidos

| Endpoint | Limite | Janela | Motivo |
|----------|--------|--------|--------|
| `/api/auth/login` | 5 | 1min | Prevenção de brute force |
| `/api/biometric/*` | 3 | 1min | Prevenção de spam de check-in |
| `/api/*` (geral) | 100 | 15min | Proteção geral |
| `/api/asaas/webhook` | sem limite | - | Webhooks externos |

---

## 📚 Referências

- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Documentation](https://www.pgbouncer.org/config.html)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Fastify Rate Limit](https://github.com/fastify/fastify-rate-limit)

---

**Próxima Revisão**: Após implementação de métricas detalhadas  
**Responsável**: DevOps / Backend Team
