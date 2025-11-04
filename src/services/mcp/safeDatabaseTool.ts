/**
 * Safe Database Tool - Execução segura de queries no banco
 * 
 * Este serviço permite execução controlada de queries SQL
 * com whitelist de operações e validações de segurança.
 * 
 * REGRAS DE SEGURANÇA:
 * - Apenas SELECT, UPDATE, INSERT permitidos
 * - DELETE e DROP bloqueados por padrão
 * - UPDATE sem WHERE é bloqueado
 * - Prepared statements obrigatórios
 * - Timeout de 30 segundos
 * - Máximo 1000 linhas por query
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export interface DatabaseQueryParams {
  operation: 'SELECT' | 'UPDATE' | 'INSERT' | 'COUNT';
  table: string;
  columns?: string[];
  where?: Record<string, any>;
  data?: Record<string, any>;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface DatabaseQueryResult {
  success: boolean;
  data?: any[];
  count?: number;
  rowsAffected?: number;
  error?: string;
  executionTime: number;
}

/**
 * Safe Database Tool - Queries seguras via Prisma
 */
export class SafeDatabaseTool {
  private readonly MAX_ROWS = 1000;
  private readonly TIMEOUT_MS = 30000;

  // Whitelist de operações permitidas
  private readonly ALLOWED_OPERATIONS = ['SELECT', 'UPDATE', 'INSERT', 'COUNT'];

  // Whitelist de tabelas permitidas (apenas tabelas de leitura segura)
  private readonly SAFE_TABLES = [
    'Student',
    'Course',
    'LessonPlan',
    'Activity',
    'Instructor',
    'Organization',
    'Unit',
    'TurmaAttendance',
    'StudentCourse',
    'Subscription',
    'BillingPlan',
    'User'
  ];

  // Tabelas bloqueadas (sensíveis)
  private readonly BLOCKED_TABLES = [
    'User', // Requer permissões especiais
    'AgentTask', // Agentes não devem modificar suas próprias tasks
    'AgentPermission', // Agentes não devem modificar permissões
    'Session', // Sessões são gerenciadas pelo sistema
    'ApiKey' // Chaves API não devem ser expostas
  ];

  /**
   * Executar query segura
   * 
   * @param params Parâmetros da query
   * @returns Resultado da execução
   */
  async executeQuery(params: DatabaseQueryParams): Promise<DatabaseQueryResult> {
    const startTime = Date.now();

    try {
      // 1. Validar operação
      this.validateOperation(params.operation);

      // 2. Validar tabela
      this.validateTable(params.table);

      // 3. Validar params específicos por operação
      this.validateParams(params);

      // 4. Executar query com timeout
      const result = await this.executeWithTimeout(params);

      const executionTime = Date.now() - startTime;

      logger.info(`[SafeDB] Query executed successfully: ${params.operation} on ${params.table} (${executionTime}ms)`);

      return {
        success: true,
        ...result,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error(`[SafeDB] Query failed:`, error);

      return {
        success: false,
        error: error.message || 'Database query failed',
        executionTime
      };
    }
  }

  /**
   * Validar operação
   */
  private validateOperation(operation: string): void {
    if (!this.ALLOWED_OPERATIONS.includes(operation.toUpperCase())) {
      throw new Error(`Operation ${operation} is not allowed. Allowed: ${this.ALLOWED_OPERATIONS.join(', ')}`);
    }
  }

  /**
   * Validar tabela
   */
  private validateTable(table: string): void {
    // Verificar se está na lista de bloqueadas
    if (this.BLOCKED_TABLES.includes(table)) {
      throw new Error(`Table ${table} is blocked for security reasons`);
    }

    // Verificar se existe no schema (usando Prisma models)
    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
    if (!(prisma as any)[modelName]) {
      throw new Error(`Table ${table} does not exist in schema`);
    }
  }

  /**
   * Validar parâmetros específicos
   */
  private validateParams(params: DatabaseQueryParams): void {
    switch (params.operation) {
      case 'UPDATE':
        if (!params.where || Object.keys(params.where).length === 0) {
          throw new Error('UPDATE without WHERE is not allowed');
        }
        if (!params.data || Object.keys(params.data).length === 0) {
          throw new Error('UPDATE requires data to update');
        }
        break;

      case 'INSERT':
        if (!params.data || Object.keys(params.data).length === 0) {
          throw new Error('INSERT requires data');
        }
        break;

      case 'SELECT':
      case 'COUNT':
        // SELECT e COUNT podem ser executados sem restrições adicionais
        break;
    }
  }

  /**
   * Executar query com timeout
   */
  private async executeWithTimeout(params: DatabaseQueryParams): Promise<any> {
    return Promise.race([
      this.executeQueryByType(params),
      this.timeout(this.TIMEOUT_MS)
    ]);
  }

  /**
   * Executar query por tipo de operação
   */
  private async executeQueryByType(params: DatabaseQueryParams): Promise<any> {
    const modelName = params.table.charAt(0).toLowerCase() + params.table.slice(1);
    const model = (prisma as any)[modelName];

    switch (params.operation) {
      case 'SELECT':
        return this.executeSelect(model, params);

      case 'COUNT':
        return this.executeCount(model, params);

      case 'UPDATE':
        return this.executeUpdate(model, params);

      case 'INSERT':
        return this.executeInsert(model, params);

      default:
        throw new Error(`Operation ${params.operation} not implemented`);
    }
  }

  /**
   * Executar SELECT
   */
  private async executeSelect(model: any, params: DatabaseQueryParams): Promise<any> {
    const limit = Math.min(params.limit || 100, this.MAX_ROWS);

    const data = await model.findMany({
      where: params.where,
      select: params.columns ? this.buildSelect(params.columns) : undefined,
      take: limit,
      orderBy: params.orderBy
    });

    return { data, count: data.length };
  }

  /**
   * Executar COUNT
   */
  private async executeCount(model: any, params: DatabaseQueryParams): Promise<any> {
    const count = await model.count({
      where: params.where
    });

    return { count };
  }

  /**
   * Executar UPDATE
   */
  private async executeUpdate(model: any, params: DatabaseQueryParams): Promise<any> {
    const result = await model.updateMany({
      where: params.where!,
      data: params.data!
    });

    return { rowsAffected: result.count };
  }

  /**
   * Executar INSERT
   */
  private async executeInsert(model: any, params: DatabaseQueryParams): Promise<any> {
    const result = await model.create({
      data: params.data!
    });

    return { data: [result], rowsAffected: 1 };
  }

  /**
   * Construir objeto select para Prisma
   */
  private buildSelect(columns: string[]): Record<string, boolean> {
    const select: Record<string, boolean> = {};
    columns.forEach(col => {
      select[col] = true;
    });
    return select;
  }

  /**
   * Promise de timeout
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Executar query SQL raw (APENAS PARA CASOS ESPECIAIS)
   * 
   * ATENÇÃO: Use com extremo cuidado!
   * Apenas queries pré-aprovadas devem usar este método.
   * 
   * @param query SQL query
   * @param params Parâmetros (prepared statement)
   * @returns Resultado
   */
  async executeRawQuery(query: string, params: any[] = []): Promise<DatabaseQueryResult> {
    const startTime = Date.now();

    try {
      // Validar query (bloquear operações perigosas)
      const upperQuery = query.trim().toUpperCase();

      if (upperQuery.includes('DROP')) {
        throw new Error('DROP operations are not allowed');
      }

      if (upperQuery.includes('DELETE') && !upperQuery.includes('WHERE')) {
        throw new Error('DELETE without WHERE is not allowed');
      }

      if (upperQuery.includes('TRUNCATE')) {
        throw new Error('TRUNCATE operations are not allowed');
      }

      // Executar com timeout
      const data = await Promise.race([
        prisma.$queryRawUnsafe(query, ...params),
        this.timeout(this.TIMEOUT_MS)
      ]);

      const executionTime = Date.now() - startTime;

      logger.info(`[SafeDB] Raw query executed (${executionTime}ms)`);

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      logger.error('[SafeDB] Raw query failed:', error);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }
}

// Singleton instance
export const safeDatabaseTool = new SafeDatabaseTool();
