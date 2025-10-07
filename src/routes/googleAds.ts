// ============================================================================
// Google Ads Integration Routes - CRM Module
// ============================================================================
// OAuth2 authentication, campaign sync, and conversion upload endpoints
// ============================================================================

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { GoogleAdsService } from '@/services/googleAdsService';
import { CsvImportService } from '@/services/csvImportService';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { getDefaultOrganizationId } from '@/config/dev';

// ============================================================================
// ROUTES
// ============================================================================

export default async function googleAdsRoutes(fastify: FastifyInstance) {
    // Register multipart support for CSV file uploads
    await fastify.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max file size
            files: 10 // Max 10 files per request
        }
    });
    
    // ========================================================================
    // AUTHENTICATION ROUTES
    // ========================================================================
    
    /**
     * GET /api/google-ads/auth/url
     * Generate OAuth2 authorization URL
     * Retrieves credentials from database (saved via /auth/save-credentials)
     */
    fastify.get('/auth/url', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            
            // Get stored OAuth2 config from CrmSettings (same pattern as callback)
            const settings = await prisma.crmSettings.findUnique({
                where: { organizationId }
            });
            
            if (!settings?.googleAdsClientId || !settings?.googleAdsClientSecret) {
                return reply.code(400).send({
                    success: false,
                    message: 'Google Ads credentials not configured. Please save credentials first in Settings.'
                });
            }
            
            const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || 'http://localhost:3000/api/google-ads/auth/callback';
            const service = new GoogleAdsService(organizationId);
            
            await service.initializeOAuth2(
                settings.googleAdsClientId,
                settings.googleAdsClientSecret,
                redirectUri
            );
            const authUrl = service.getAuthorizationUrl(redirectUri);
            
            return reply.send({
                success: true,
                data: { authUrl }
            });
            
        } catch (error: any) {
            logger.error('Error generating auth URL:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to generate authorization URL',
                error: error.message
            });
        }
    });
    
    /**
     * GET /api/google-ads/auth/callback
     * OAuth2 callback handler
     */
    fastify.get('/auth/callback', async (request: FastifyRequest<{
        Querystring: {
            code: string;
            state?: string;
        };
    }>, reply: FastifyReply) => {
        try {
            const { code } = request.query;
            
            if (!code) {
                return reply.code(400).send({
                    success: false,
                    message: 'Authorization code not provided'
                });
            }
            
            const organizationId = getDefaultOrganizationId();
            
            // Get stored OAuth2 config from CrmSettings
            const settings = await prisma.crmSettings.findUnique({
                where: { organizationId }
            });
            
            if (!settings?.googleAdsClientId || !settings?.googleAdsClientSecret) {
                return reply.code(400).send({
                    success: false,
                    message: 'OAuth2 credentials not configured'
                });
            }
            
            const service = new GoogleAdsService(organizationId);
            await service.initializeOAuth2(
                settings.googleAdsClientId,
                settings.googleAdsClientSecret,
                process.env.GOOGLE_ADS_REDIRECT_URI || 'http://localhost:3000/api/google-ads/auth/callback'
            );
            
            const { refreshToken } = await service.getTokensFromCode(code);
            
            // Save tokens
            await service.saveTokens(
                refreshToken,
                settings.googleAdsClientId,
                settings.googleAdsClientSecret,
                settings.googleAdsDeveloperToken || '',
                settings.googleAdsCustomerId || ''
            );
            
            // Redirect to CRM settings page
            return reply.redirect('/crm?tab=settings&success=google-ads-connected');
            
        } catch (error: any) {
            logger.error('Error in OAuth callback:', error);
            return reply.redirect('/crm?tab=settings&error=google-ads-connection-failed');
        }
    });
    
    /**
     * POST /api/google-ads/auth/save-credentials
     * Save Google Ads API credentials
     */
    fastify.post('/auth/save-credentials', async (request: FastifyRequest<{
        Body: {
            clientId: string;
            clientSecret: string;
            developerToken: string;
            customerId: string;
        };
    }>, reply: FastifyReply) => {
        try {
            const { clientId, clientSecret, developerToken, customerId } = request.body;
            
            if (!clientId || !clientSecret || !developerToken || !customerId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Missing required credentials'
                });
            }
            
            const organizationId = getDefaultOrganizationId();
            
            await prisma.crmSettings.upsert({
                where: { organizationId },
                update: {
                    googleAdsClientId: clientId,
                    googleAdsClientSecret: clientSecret,
                    googleAdsDeveloperToken: developerToken,
                    googleAdsCustomerId: customerId,
                },
                create: {
                    organizationId,
                    googleAdsClientId: clientId,
                    googleAdsClientSecret: clientSecret,
                    googleAdsDeveloperToken: developerToken,
                    googleAdsCustomerId: customerId,
                }
            });
            
            return reply.send({
                success: true,
                message: 'Credentials saved successfully'
            });
            
        } catch (error: any) {
            logger.error('Error saving credentials:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to save credentials',
                error: error.message
            });
        }
    });
    
    /**
     * GET /api/google-ads/auth/credentials
     * Get saved Google Ads credentials (for OAuth connection)
     */
    fastify.get('/auth/credentials', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            
            const settings = await prisma.crmSettings.findUnique({
                where: { organizationId },
                select: {
                    googleAdsClientId: true,
                    googleAdsClientSecret: true,
                    googleAdsCustomerId: true,
                    googleAdsDeveloperToken: true,
                }
            });
            
            if (!settings) {
                return reply.send({
                    success: false,
                    message: 'No credentials found'
                });
            }
            
            return reply.send({
                success: true,
                data: {
                    clientId: settings.googleAdsClientId,
                    clientSecret: settings.googleAdsClientSecret,
                    customerId: settings.googleAdsCustomerId,
                    developerToken: settings.googleAdsDeveloperToken
                }
            });
            
        } catch (error: any) {
            logger.error('Error getting credentials:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to get credentials',
                error: error.message
            });
        }
    });
    
    /**
     * GET /api/google-ads/auth/status
     * Check Google Ads connection status and retrieve saved credentials
     */
    fastify.get('/auth/status', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            
            const settings = await prisma.crmSettings.findUnique({
                where: { organizationId },
                select: {
                    googleAdsConnected: true,
                    googleAdsEnabled: true,
                    googleAdsCustomerId: true,
                    googleAdsClientId: true,
                    googleAdsClientSecret: true,
                    googleAdsDeveloperToken: true,
                }
            });
            
            return reply.send({
                success: true,
                data: {
                    connected: settings?.googleAdsConnected || false,
                    enabled: settings?.googleAdsEnabled || false,
                    customerId: settings?.googleAdsCustomerId || null,
                    clientId: settings?.googleAdsClientId || null,
                    clientSecret: settings?.googleAdsClientSecret || null,
                    developerToken: settings?.googleAdsDeveloperToken || null,
                }
            });
            
        } catch (error: any) {
            logger.error('Error checking status:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to check connection status',
                error: error.message
            });
        }
    });
    
    /**
     * POST /api/google-ads/auth/test
     * Test Google Ads API connection
     */
    fastify.post('/auth/test', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            const result = await service.testConnection();
            
            return reply.send({
                success: result.success,
                data: result,
                message: result.success ? 'Connection successful' : 'Connection failed'
            });
            
        } catch (error: any) {
            logger.error('Error testing connection:', error);
            return reply.code(500).send({
                success: false,
                message: 'Connection test failed',
                error: error.message
            });
        }
    });
    
    /**
     * POST /api/google-ads/auth/disconnect
     * Disconnect Google Ads account
     */
    fastify.post('/auth/disconnect', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            await service.disconnect();
            
            return reply.send({
                success: true,
                message: 'Google Ads disconnected successfully'
            });
            
        } catch (error: any) {
            logger.error('Error disconnecting:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to disconnect Google Ads',
                error: error.message
            });
        }
    });
    
    // ========================================================================
    // CAMPAIGN SYNC ROUTES
    // ========================================================================
    
    /**
     * POST /api/google-ads/sync/campaigns
     * Sync all campaigns from Google Ads
     */
    fastify.post('/sync/campaigns', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            const count = await service.syncCampaigns();
            
            return reply.send({
                success: true,
                message: `Successfully synced ${count} campaigns`,
                data: { count }
            });
            
        } catch (error: any) {
            logger.error('Error syncing campaigns:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to sync campaigns',
                error: error.message
            });
        }
    });
    
    /**
     * POST /api/google-ads/sync/ad-groups/:campaignId
     * Sync ad groups for a specific campaign
     */
    fastify.post('/sync/ad-groups/:campaignId', async (request: FastifyRequest<{
        Params: { campaignId: string };
    }>, reply: FastifyReply) => {
        try {
            const { campaignId } = request.params;
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            const count = await service.syncAdGroups(campaignId);
            
            return reply.send({
                success: true,
                message: `Successfully synced ${count} ad groups`,
                data: { count }
            });
            
        } catch (error: any) {
            logger.error('Error syncing ad groups:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to sync ad groups',
                error: error.message
            });
        }
    });
    
    /**
     * GET /api/google-ads/campaigns
     * List synced campaigns from database
     */
    fastify.get('/campaigns', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            
            const campaigns = await prisma.googleAdsCampaign.findMany({
                where: { organizationId },
                orderBy: { cost: 'desc' }
            });
            
            return reply.send({
                success: true,
                data: campaigns,
                total: campaigns.length
            });
            
        } catch (error: any) {
            logger.error('Error fetching campaigns:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch campaigns',
                error: error.message
            });
        }
    });
    
    // ========================================================================
    // CONVERSION UPLOAD ROUTES
    // ========================================================================
    
    /**
     * POST /api/google-ads/conversions/upload/:leadId
     * Upload single offline conversion
     */
    fastify.post('/conversions/upload/:leadId', async (request: FastifyRequest<{
        Params: { leadId: string };
    }>, reply: FastifyReply) => {
        try {
            const { leadId } = request.params;
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            const success = await service.uploadConversion(leadId);
            
            return reply.send({
                success,
                message: success ? 'Conversion uploaded successfully' : 'Failed to upload conversion'
            });
            
        } catch (error: any) {
            logger.error('Error uploading conversion:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to upload conversion',
                error: error.message
            });
        }
    });
    
    /**
     * POST /api/google-ads/conversions/upload-batch
     * Upload multiple offline conversions
     */
    fastify.post('/conversions/upload-batch', async (request: FastifyRequest<{
        Body: { leadIds: string[] };
    }>, reply: FastifyReply) => {
        try {
            const { leadIds } = request.body;
            
            if (!leadIds || leadIds.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: 'No lead IDs provided'
                });
            }
            
            const organizationId = getDefaultOrganizationId();
            const service = new GoogleAdsService(organizationId);
            
            const result = await service.uploadConversionsBatch(leadIds);
            
            return reply.send({
                success: true,
                message: `Uploaded ${result.success} conversions, ${result.failed} failed`,
                data: result
            });
            
        } catch (error: any) {
            logger.error('Error uploading conversions batch:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to upload conversions',
                error: error.message
            });
        }
    });
    
    /**
     * GET /api/google-ads/conversions/pending
     * List leads with conversions not yet uploaded
     */
    fastify.get('/conversions/pending', async (request, reply: FastifyReply) => {
        try {
            const organizationId = getDefaultOrganizationId();
            
            const leads = await prisma.lead.findMany({
                where: {
                    organizationId,
                    stage: 'CONVERTED',
                    gclid: { not: null },
                    convertedStudentId: { not: null },
                    conversionUploaded: false,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    gclid: true,
                    enrolledAt: true,
                    actualRevenue: true,
                },
                orderBy: { enrolledAt: 'desc' }
            });
            
            return reply.send({
                success: true,
                data: leads,
                total: leads.length
            });
            
        } catch (error: any) {
            logger.error('Error fetching pending conversions:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to fetch pending conversions',
                error: error.message
            });
        }
    });

    /**
     * POST /api/google-ads/import-csv
     * Import Google Ads data from CSV files
     */
    fastify.post('/import-csv', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get all uploaded files
            const files = await request.saveRequestFiles();
            
            if (!files || files.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            logger.info(`📤 Received ${files.length} CSV files for import`);

            // Process files using CSV Import Service
            const csvService = new CsvImportService();
            const result = await csvService.processFiles(files);

            // Clean up temporary files
            for (const file of files) {
                try {
                    await file.file.destroy();
                } catch (err) {
                    logger.warn('Error cleaning temp file:', err);
                }
            }

            // Determinar se importação foi bem-sucedida
            const hasImportedSomething = result.campaignsImported > 0 || 
                                        result.daysOfHistory > 0 || 
                                        result.keywordsImported > 0;
            
            const hasErrors = result.errors.length > 0;
            
            if (hasErrors) {
                logger.warn('Import completed with warnings/errors:', result.errors);
            }

            // Retornar sucesso se pelo menos algo foi importado, ou se apenas avisos (sem erros fatais)
            const successMessage = hasImportedSomething 
                ? `Importação concluída! ${result.campaignsImported} campanhas importadas com sucesso.`
                : 'Nenhum dado foi importado. Verifique o formato dos arquivos.';
            
            const warningMessage = hasErrors 
                ? ` (${result.errors.length} avisos - veja detalhes abaixo)`
                : '';

            return reply.send({
                success: true,
                message: successMessage + warningMessage,
                data: {
                    campaignsImported: result.campaignsImported,
                    daysOfHistory: result.daysOfHistory,
                    keywordsImported: result.keywordsImported,
                    totalCost: result.totalCost,
                    totalClicks: result.totalClicks,
                    totalImpressions: result.totalImpressions,
                    totalConversions: result.totalConversions,
                    filesProcessed: result.filesProcessed,
                    errors: result.errors,
                    warnings: result.errors // Renomear para deixar claro que são avisos, não erros fatais
                }
            });
            
        } catch (error: any) {
            logger.error('Error importing CSV:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to import CSV files: ' + error.message,
                error: error.message
            });
        }
    });
}
