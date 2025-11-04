// ============================================================================
// CSV Import Service for Google Ads Data
// ============================================================================
// Processes uploaded CSV files and imports campaign data into the database
// ============================================================================

import type { MultipartFile } from '@fastify/multipart';
import { parse } from 'csv-parse/sync';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { getDefaultOrganizationId } from '@/config/dev';

interface CampaignRow {
    'Campanha': string;
    'Impressões': string;
    'Cliques': string;
    'Custo': string;
    'Conversões': string;
    'Status'?: string;
}

interface SerieTemporalRow {
    'Data': string;
    'Impressões': string;
    'Cliques': string;
    'Custo': string;
    'Conversões': string;
}

interface ImportResult {
    campaignsImported: number;
    daysOfHistory: number;
    keywordsImported: number;
    totalCost: number;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    filesProcessed: string[];
    errors: string[];
}

export class CsvImportService {
    
    /**
     * Parse number from Brazilian format (1.000,00 → 1000.00)
     */
    private parseNumber(value: string): number {
        if (!value || value === '--') return 0;
        // Remove dots (thousand separator) and replace comma with period
        const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    }

    /**
     * Parse percentage (3,6% → 3.6)
     */
    private parsePercentage(value: string): number {
        if (!value || value === '--') return 0;
        return this.parseNumber(value.replace('%', ''));
    }

    /**
     * Classify CSV file by name pattern
     */
    private classifyFile(filename: string): string | null {
        const lower = filename.toLowerCase();
        
        if (lower.includes('campanhas')) return 'campaigns';
        if (lower.includes('série_temporal') || lower.includes('serie_temporal')) return 'timeseries';
        if (lower.includes('dispositivos')) return 'devices';
        if (lower.includes('idade')) return 'demographics_age';
        if (lower.includes('sexo')) return 'demographics_gender';
        if (lower.includes('palavras-chave') || lower.includes('palavras_chave')) return 'keywords';
        if (lower.includes('dia_e_hora')) return 'dayofweek';
        if (lower.includes('redes')) return 'networks';
        
        return null;
    }

    /**
     * Process uploaded files and import data
     */
    async processFiles(files: MultipartFile[]): Promise<ImportResult> {
        const result: ImportResult = {
            campaignsImported: 0,
            daysOfHistory: 0,
            keywordsImported: 0,
            totalCost: 0,
            totalClicks: 0,
            totalImpressions: 0,
            totalConversions: 0,
            filesProcessed: [],
            errors: []
        };

        try {
            logger.info(`📊 Starting CSV import with ${files.length} files`);

            // 1. Clean old REAL_ campaigns
            await this.cleanOldData();

            // 2. Process each file
            for (const file of files) {
                try {
                    const fileType = this.classifyFile(file.filename);
                    
                    if (!fileType) {
                        const msg = `Unknown file type: ${file.filename}`;
                        logger.warn(msg);
                        result.errors.push(msg);
                        result.filesProcessed.push(file.filename);
                        continue;
                    }

                    const buffer = await file.toBuffer();
                    const content = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM

                    logger.info(`📁 Processing ${fileType}: ${file.filename}`);

                    switch (fileType) {
                        case 'campaigns':
                            await this.importCampaigns(content, result);
                            break;
                        case 'timeseries':
                            await this.importTimeSeries(content, result);
                            break;
                        case 'keywords':
                            await this.importKeywords(content, result);
                            break;
                        case 'dayofweek':
                        case 'devices':
                        case 'demographics_age':
                        case 'demographics_gender':
                        case 'networks':
                            // Tipos reconhecidos mas não implementados - não deve causar erro
                            logger.info(`⏭️ Skipping ${fileType} (not yet implemented)`);
                            break;
                        default:
                            // Tipo não reconhecido
                            logger.warn(`❓ Unknown file type: ${fileType}`);
                    }

                    result.filesProcessed.push(file.filename);
                } catch (error: any) {
                    const errorMsg = `Error processing ${file.filename}: ${error.message}`;
                    logger.error(errorMsg);
                    result.errors.push(errorMsg);
                    // Não adiciona ao filesProcessed se deu erro
                }
            }

            // 3. Create/update GoogleAdsConfig (não bloquear se falhar)
            try {
                await this.createConfig();
            } catch (configError: any) {
                logger.warn('⚠️ Failed to update GoogleAdsConfig:', configError.message);
                result.errors.push(`Config update failed: ${configError.message}`);
            }

            logger.info('✅ CSV import completed');
            logger.info(`📊 Summary: ${result.campaignsImported} campaigns, ${result.daysOfHistory} days, ${result.keywordsImported} keywords`);

            return result;

        } catch (error: any) {
            logger.error('❌ CSV import failed:', error);
            // Retorna resultado parcial em vez de lançar erro
            result.errors.push(`Fatal error: ${error.message}`);
            return result;
        }
    }

    /**
     * Clean old imported data
     */
    private async cleanOldData(): Promise<void> {
        logger.info('🧹 Cleaning old imported data...');
        
        const deleted = await prisma.googleAdsCampaign.deleteMany({
            where: {
                campaignId: { startsWith: 'REAL_CAMPAIGN_' }
            }
        });

        logger.info(`✅ Removed ${deleted.count} old campaigns`);
    }

    /**
     * Import campaigns from CSV
     */
    private async importCampaigns(content: string, result: ImportResult): Promise<void> {
        const rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',',
            relax_column_count: true
        }) as CampaignRow[];

        logger.info(`📊 Found ${rows.length} campaigns`);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            if (!row['Campanha']) continue;

            const impressions = this.parseNumber(row['Impressões']);
            const clicks = this.parseNumber(row['Cliques']);
            const cost = this.parseNumber(row['Custo']);
            const conversions = this.parseNumber(row['Conversões']);

            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const cpc = clicks > 0 ? cost / clicks : 0;

            try {
                await prisma.googleAdsCampaign.create({
                    data: {
                        campaignId: `REAL_CAMPAIGN_${i + 1}`,
                        name: row['Campanha'],
                        status: 'ENABLED',
                        impressions,
                        clicks,
                        cost,
                        conversions,
                        ctr,
                        cpc,
                        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
                        lastSyncAt: new Date()
                    }
                });

                result.campaignsImported++;
                result.totalImpressions += impressions;
                result.totalClicks += clicks;
                result.totalCost += cost;
                result.totalConversions += conversions;

                logger.info(`✅ ${row['Campanha']} - ${clicks} cliques, R$ ${cost.toFixed(2)}`);
            } catch (error: any) {
                logger.error(`❌ Error importing campaign ${row['Campanha']}:`, error);
            }
        }
    }

    /**
     * Import time series data
     */
    private async importTimeSeries(content: string, result: ImportResult): Promise<void> {
        const rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',',
            relax_column_count: true
        }) as SerieTemporalRow[];

        logger.info(`📈 Found ${rows.length} days of historical data`);
        result.daysOfHistory = rows.length;

        // Aggregate metrics from time series
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalCost = 0;
        let totalConversions = 0;

        for (const row of rows) {
            totalImpressions += this.parseNumber(row['Impressões']);
            totalClicks += this.parseNumber(row['Cliques']);
            totalCost += this.parseNumber(row['Custo']);
            totalConversions += this.parseNumber(row['Conversões']);
        }

        logger.info(`📊 Time series totals:`);
        logger.info(`   Impressões: ${totalImpressions.toLocaleString('pt-BR')}`);
        logger.info(`   Cliques: ${totalClicks.toLocaleString('pt-BR')}`);
        logger.info(`   Custo: R$ ${totalCost.toFixed(2)}`);
        logger.info(`   Conversões: ${totalConversions}`);
    }

    /**
     * Import keywords data
     */
    private async importKeywords(content: string, result: ImportResult): Promise<void> {
        const rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',',
            relax_column_count: true
        });

        logger.info(`🔍 Found ${rows.length} keywords`);
        result.keywordsImported = rows.length;

        // Show top 10 keywords by clicks
        const sorted = rows
            .map((row: any) => ({
                term: row['Termo de pesquisa'] || row['Palavra-chave'],
                clicks: this.parseNumber(row['Cliques'])
            }))
            .filter(k => k.term)
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10);

        logger.info('🔝 Top 10 keywords by clicks:');
        sorted.forEach((k, i) => {
            logger.info(`   ${i + 1}. "${k.term}" - ${k.clicks} cliques`);
        });
    }

    /**
     * Create GoogleAdsConfig entry
     */
    private async createConfig(): Promise<void> {
        const organizationId = getDefaultOrganizationId();

        const existing = await prisma.googleAdsConfig.findFirst({
            where: { organizationId }
        });

        if (!existing) {
            await prisma.googleAdsConfig.create({
                data: {
                    organizationId,
                    developerToken: 'AWAITING_APPROVAL',
                    customerId: 'CSV_IMPORT',
                    isActive: true,
                    lastSyncAt: new Date()
                }
            });
            logger.info('✅ Created GoogleAdsConfig entry');
        } else {
            await prisma.googleAdsConfig.update({
                where: { id: existing.id },
                data: { lastSyncAt: new Date() }
            });
            logger.info('✅ Updated GoogleAdsConfig lastSyncAt');
        }
    }
}
