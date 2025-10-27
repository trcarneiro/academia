/**
 * Report Tool - MCP Tool for Agents
 * Permite que agentes gerem relatórios em PDF, CSV ou JSON
 */

import { logger } from '@/utils/logger';
import { DatabaseTool } from './databaseTool';

export type ReportFormat = 'PDF' | 'CSV' | 'JSON';

export interface GenerateReportParams {
  organizationId: string;
  agentId: string;
  reportType: string;
  format: ReportFormat;
  params?: any;
}

export class ReportTool {
  /**
   * Tipos de relatórios disponíveis
   */
  private static readonly REPORT_TYPES = {
    overdue_payments: {
      name: 'Relatório de Pagamentos Atrasados',
      description: 'Lista alunos com pagamentos atrasados',
      dataSource: 'overdue_payments',
    },
    inactive_students: {
      name: 'Relatório de Alunos Inativos',
      description: 'Lista alunos sem check-in recente',
      dataSource: 'inactive_students',
    },
    new_students: {
      name: 'Relatório de Novos Alunos',
      description: 'Lista novos alunos cadastrados',
      dataSource: 'new_students',
    },
    attendance_summary: {
      name: 'Resumo de Frequência',
      description: 'Estatísticas de frequência do período',
      dataSource: 'attendance_rate',
    },
    popular_plans: {
      name: 'Planos Mais Vendidos',
      description: 'Ranking de planos por número de assinaturas',
      dataSource: 'popular_plans',
    },
    unconverted_leads: {
      name: 'Leads Não Convertidos',
      description: 'Leads pendentes de conversão',
      dataSource: 'unconverted_leads',
    },
  };

  /**
   * Gerar relatório
   */
  static async generate(params: GenerateReportParams) {
    try {
      const { organizationId, agentId, reportType, format, params: reportParams } = params;

      // Validar tipo de relatório
      const report = this.REPORT_TYPES[reportType as keyof typeof this.REPORT_TYPES];
      if (!report) {
        return {
          success: false,
          error: `Report type '${reportType}' not found. Available: ${Object.keys(this.REPORT_TYPES).join(', ')}`,
        };
      }

      logger.info('Generating report:', {
        reportType,
        format,
        organizationId,
        agentId,
      });

      // Buscar dados usando DatabaseTool
      const dataResult = await DatabaseTool.executeQuery(
        report.dataSource,
        organizationId,
        reportParams
      );

      if (!dataResult.success) {
        return {
          success: false,
          error: 'Failed to fetch report data',
        };
      }

      // Gerar relatório no formato solicitado
      let reportData;

      switch (format) {
        case 'JSON':
          reportData = this.generateJSON(report, dataResult.data);
          break;

        case 'CSV':
          reportData = this.generateCSV(report, dataResult.data);
          break;

        case 'PDF':
          reportData = await this.generatePDF(report, dataResult.data);
          break;

        default:
          return { success: false, error: `Unknown format: ${format}` };
      }

      return {
        success: true,
        data: {
          reportType,
          format,
          name: report.name,
          description: report.description,
          generatedAt: new Date().toISOString(),
          content: reportData,
        },
      };
    } catch (error) {
      logger.error('Error generating report:', error);
      return { success: false, error: 'Failed to generate report' };
    }
  }

  /**
   * Gerar relatório em JSON
   */
  private static generateJSON(report: any, data: any) {
    return {
      metadata: {
        name: report.name,
        description: report.description,
        generatedAt: new Date().toISOString(),
      },
      data,
    };
  }

  /**
   * Gerar relatório em CSV
   */
  private static generateCSV(report: any, data: any): string {
    if (!Array.isArray(data) || data.length === 0) {
      return 'No data available';
    }

    // Extrair headers do primeiro item
    const headers = Object.keys(this.flattenObject(data[0]));

    // Criar linhas CSV
    const rows = data.map((item) => {
      const flat = this.flattenObject(item);
      return headers.map((header) => {
        const value = flat[header];
        // Escapar valores com vírgula ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
    });

    // Montar CSV
    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Gerar relatório em PDF
   */
  private static async generatePDF(report: any, data: any): Promise<string> {
    // TODO: Implementar geração de PDF usando biblioteca como puppeteer ou pdfkit
    
    // Por enquanto, retornar HTML que pode ser convertido em PDF
    const html = this.generateHTML(report, data);
    
    return html;
  }

  /**
   * Gerar HTML para PDF
   */
  private static generateHTML(report: any, data: any): string {
    const dataArray = Array.isArray(data) ? data : [data];

    let tableRows = '';

    if (dataArray.length > 0) {
      const headers = Object.keys(this.flattenObject(dataArray[0]));

      tableRows = `
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataArray
            .map((item) => {
              const flat = this.flattenObject(item);
              return `
              <tr>
                ${headers.map((h) => `<td>${flat[h] ?? ''}</td>`).join('')}
              </tr>
            `;
            })
            .join('')}
        </tbody>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${report.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .metadata { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>${report.name}</h1>
          <p class="metadata">${report.description}</p>
          <p class="metadata">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          
          <table>
            ${tableRows}
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Achatar objeto (flatten nested objects)
   */
  private static flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          Object.assign(flattened, this.flattenObject(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
    }

    return flattened;
  }

  /**
   * Listar tipos de relatórios disponíveis
   */
  static listAvailableReports() {
    return Object.entries(this.REPORT_TYPES).map(([key, report]) => ({
      type: key,
      name: report.name,
      description: report.description,
    }));
  }
}
