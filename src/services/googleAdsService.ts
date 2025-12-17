// @ts-nocheck
// ============================================================================
// Google Ads Service - CRM Integration
// ============================================================================
// Handles OAuth2 authentication, campaign sync, and offline conversion upload
// ============================================================================

import { GoogleAdsApi, Customer } from 'google-ads-api';
import { google } from 'googleapis';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

// Types
interface GoogleAdsConfig {
    clientId: string;
    clientSecret: string;
    developerToken: string;
    refreshToken?: string;
    customerId?: string;
}

interface CampaignData {
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
}

interface ConversionUpload {
    gclid: string;
    conversionAction: string;
    conversionDateTime: string;
    conversionValue?: number;
    currencyCode?: string;
}

// ============================================================================
// GoogleAdsService Class
// ============================================================================

export class GoogleAdsService {
    private client: GoogleAdsApi | null = null;
    private oauth2Client: any = null;
    private config: GoogleAdsConfig | null = null;
    private organizationId: string;

    constructor(organizationId: string) {
        this.organizationId = organizationId;
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    /**
     * Initialize OAuth2 client for Google Ads
     */
    async initializeOAuth2(clientId: string, clientSecret: string, redirectUri: string) {
        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        return this.oauth2Client;
    }

    /**
     * Generate OAuth2 authorization URL
     */
    getAuthorizationUrl(redirectUri: string): string {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized');
        }

        const scopes = ['https://www.googleapis.com/auth/adwords'];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent', // Force to get refresh token
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
        if (!this.oauth2Client) {
            throw new Error('OAuth2 client not initialized');
        }

        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);

        return {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
        };
    }

    /**
     * Save OAuth tokens to database (CrmSettings)
     */
    async saveTokens(refreshToken: string, clientId: string, clientSecret: string, developerToken: string, customerId: string) {
        try {
            const settings = await prisma.crmSettings.upsert({
                where: { organizationId: this.organizationId },
                update: {
                    googleAdsRefreshToken: refreshToken,
                    googleAdsClientId: clientId,
                    googleAdsClientSecret: clientSecret,
                    googleAdsDeveloperToken: developerToken,
                    googleAdsCustomerId: customerId,
                    googleAdsConnected: true,
                    updatedAt: new Date(),
                },
                create: {
                    organizationId: this.organizationId,
                    googleAdsRefreshToken: refreshToken,
                    googleAdsClientId: clientId,
                    googleAdsClientSecret: clientSecret,
                    googleAdsDeveloperToken: developerToken,
                    googleAdsCustomerId: customerId,
                    googleAdsConnected: true,
                },
            });

            logger.info('Google Ads tokens saved successfully', { organizationId: this.organizationId });
            return settings;
        } catch (error) {
            logger.error('Error saving Google Ads tokens', { error, organizationId: this.organizationId });
            throw error;
        }
    }

    /**
     * Load configuration from database
     */
    async loadConfig(): Promise<GoogleAdsConfig> {
        const settings = await prisma.crmSettings.findUnique({
            where: { organizationId: this.organizationId },
        });

        if (!settings || !settings.googleAdsConnected) {
            throw new Error('Google Ads not connected for this organization');
        }

        this.config = {
            clientId: settings.googleAdsClientId!,
            clientSecret: settings.googleAdsClientSecret!,
            developerToken: settings.googleAdsDeveloperToken!,
            refreshToken: settings.googleAdsRefreshToken!,
            customerId: settings.googleAdsCustomerId!,
        };

        return this.config;
    }

    /**
     * Initialize Google Ads API client
     */
    async initializeClient() {
        if (!this.config) {
            await this.loadConfig();
        }

        if (!this.config) {
            throw new Error('Google Ads configuration not loaded');
        }

        // Suppress google-ads-api schema warnings globally (they appear during queries, not just init)
        this.suppressGoogleAdsWarnings();

        this.client = new GoogleAdsApi({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            developer_token: this.config.developerToken,
        });

        logger.info('Google Ads API client initialized', { organizationId: this.organizationId });
    }

    /**
     * Suppress non-critical google-ads-api library warnings globally
     * These warnings don't affect functionality and pollute logs
     */
    private suppressGoogleAdsWarnings() {
        const originalWarn = console.warn;
        
        console.warn = (...args: any[]) => {
            const msg = args[0]?.toString?.() || '';
            // Only suppress data type warnings from google-ads-api library
            if (msg.includes('No data type found for')) {
                return; // Silently ignore
            }
            // Pass through all other warnings
            originalWarn(...args);
        };
    }

    // ========================================================================
    // CAMPAIGN SYNC
    // ========================================================================

    /**
     * Sync all campaigns from Google Ads
     */
    async syncCampaigns(): Promise<number> {
        if (!this.client || !this.config) {
            await this.initializeClient();
        }

        if (!this.client || !this.config?.customerId || !this.config?.refreshToken) {
            const missing = [];
            if (!this.client) missing.push('client');
            if (!this.config?.customerId) missing.push('customerId');
            if (!this.config?.refreshToken) missing.push('refreshToken');
            throw new Error(`Google Ads client not properly initialized. Missing: ${missing.join(', ')}`);
        }

        try {
            // Remove hyphens from customer ID (API expects format: 1234567890)
            const cleanCustomerId = this.config.customerId.replace(/-/g, '');
            
            // Validate refresh token format
            if (!this.config.refreshToken || this.config.refreshToken.trim().length < 20) {
                throw new Error('Invalid or missing refresh token. Please complete OAuth authorization.');
            }
            
            logger.info('🔄 Creating Google Ads customer instance', {
                customerId: cleanCustomerId,
                hasRefreshToken: !!this.config.refreshToken,
                refreshTokenLength: this.config.refreshToken.length
            });

            let customer;
            try {
                customer = this.client.Customer({
                    customer_id: cleanCustomerId,
                    refresh_token: this.config.refreshToken,
                });
            } catch (customerError) {
                logger.error('❌ Failed to create Google Ads customer instance', {
                    error: customerError instanceof Error ? customerError.message : String(customerError),
                    customerId: cleanCustomerId
                });
                throw new Error(
                    'Failed to initialize Google Ads customer. The refresh token may be expired or invalid. ' +
                    'Please re-authorize the integration.'
                );
            }

            // Query campaigns with metrics
            logger.info('🔍 Querying Google Ads campaigns...', {
                customerId: cleanCustomerId,
                refreshTokenFirst10: this.config.refreshToken.substring(0, 10) + '...',
                refreshTokenLast10: '...' + this.config.refreshToken.substring(this.config.refreshToken.length - 10)
            });
            
            let campaigns;
            try {
                // Wrap query with detailed error capture
                logger.info('📤 Sending query to Google Ads API...');
                
                campaigns = await customer.query(`
                    SELECT
                        campaign.id,
                        campaign.name,
                        campaign.status,
                        metrics.impressions,
                        metrics.clicks,
                        metrics.cost_micros,
                        metrics.conversions
                    FROM campaign
                    WHERE campaign.status != 'REMOVED'
                    AND segments.date DURING LAST_30_DAYS
                `);
                
                logger.info('✅ Query completed successfully', {
                    campaignsCount: campaigns?.length || 0
                });
            } catch (queryError: any) {
                // Log RAW error before library processes it
                logger.error('❌ Google Ads query FAILED - RAW ERROR:', {
                    errorType: typeof queryError,
                    errorConstructor: queryError?.constructor?.name,
                    errorKeys: queryError ? Object.keys(queryError) : [],
                    errorStringified: JSON.stringify(queryError, Object.getOwnPropertyNames(queryError), 2),
                    hasMessage: !!queryError?.message,
                    hasCode: !!queryError?.code,
                    hasDetails: !!queryError?.details,
                    hasMetadata: !!queryError?.metadata,
                    hasStack: !!queryError?.stack
                });
                
                logger.error('❌ Google Ads query failed', {
                    errorType: queryError?.constructor?.name,
                    errorMessage: queryError?.message,
                    errorCode: queryError?.code,
                    errorDetails: queryError?.details,
                    fullError: JSON.stringify(queryError, null, 2)
                });
                
                // Check if it's an authentication error
                if (queryError?.message?.includes('UNAUTHENTICATED') || 
                    queryError?.code === 16 ||
                    queryError?.message?.includes('invalid_grant')) {
                    throw new Error(
                        '🔐 Google Ads authentication failed: Invalid or expired credentials.\n\n' +
                        '📋 Possible causes:\n' +
                        '1. Refresh token expired (re-authorize needed)\n' +
                        '2. Google account used doesn\'t have access to Customer ID ' + cleanCustomerId + '\n' +
                        '3. Developer token not approved or invalid\n\n' +
                        '🔧 How to fix:\n' +
                        '1. Click "Desconectar" to clear old credentials\n' +
                        '2. Click "Conectar Google Ads" again\n' +
                        '3. Make sure to login with the account that owns Customer ID ' + cleanCustomerId
                    );
                }
                
                throw queryError;
            }

            let syncedCount = 0;

            for (const campaign of campaigns) {
                const campaignData = {
                    campaignId: campaign.campaign.id.toString(),
                    campaignName: campaign.campaign.name || 'Unnamed Campaign',
                    campaignStatus: campaign.campaign.status || 'UNKNOWN',
                    impressions: Number(campaign.metrics?.impressions) || 0,
                    clicks: Number(campaign.metrics?.clicks) || 0,
                    cost: (Number(campaign.metrics?.cost_micros) || 0) / 1000000, // Convert from micros
                    conversions: Number(campaign.metrics?.conversions) || 0,
                    organizationId: this.organizationId,
                    roi: 0
                };

                // Calculate ROI if we have cost and conversions
                if (campaignData.cost > 0 && campaignData.conversions > 0) {
                    // Get average conversion value from CRM
                    const avgConversionValue = await this.getAverageConversionValue(campaign.campaign.name);
                    const revenue = campaignData.conversions * avgConversionValue;
                    campaignData.roi = revenue > 0 ? ((revenue - campaignData.cost) / campaignData.cost) * 100 : 0;
                }

                await prisma.googleAdsCampaign.upsert({
                    where: {
                        campaignId: campaignData.campaignId,
                    },
                    update: campaignData,
                    create: campaignData,
                });

                syncedCount++;
            }

            logger.info(`✅ Synced ${syncedCount} campaigns from Google Ads`, { organizationId: this.organizationId });
            return syncedCount;
        } catch (error) {
            // Enhanced error logging with full details
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = {
                message: errorMessage,
                name: error instanceof Error ? error.name : 'Unknown',
                stack: error instanceof Error ? error.stack : undefined,
                organizationId: this.organizationId,
                config: {
                    hasClient: !!this.client,
                    hasCustomerId: !!this.config?.customerId,
                    hasRefreshToken: !!this.config?.refreshToken,
                    refreshTokenLength: this.config?.refreshToken?.length || 0,
                    customerId: this.config?.customerId || 'NOT_SET',
                }
            };
            
            logger.error('❌ Error syncing campaigns from Google Ads', errorDetails);
            console.error('[GOOGLE ADS SYNC ERROR]', JSON.stringify(errorDetails, null, 2));
            
            // Detect specific error types and provide actionable messages
            
            // Generic library error - usually means refresh token is invalid/expired
            if (errorMessage.includes('Cannot read properties of undefined')) {
                throw new Error(
                    '🔐 Google Ads authentication error: The refresh token is invalid or expired.\n\n' +
                    '📋 How to fix:\n' +
                    '1. Click "Conectar Google Ads" button\n' +
                    '2. Complete the OAuth authorization flow\n' +
                    '3. Make sure to grant all requested permissions\n' +
                    '4. Try syncing again after authorization completes'
                );
            }
            
            // Invalid or missing refresh token
            if (errorMessage.includes('Invalid or missing refresh token')) {
                throw new Error(
                    '🔐 Missing Google Ads authorization.\n\n' +
                    '📋 Action required:\n' +
                    '1. Click "Conectar Google Ads" button above\n' +
                    '2. Log in to Google Ads account\n' +
                    '3. Grant permissions when asked\n' +
                    '4. Wait for "Conectado" status before syncing'
                );
            }
            
            // Explicit token expiration
            if (errorMessage.includes('invalid_grant') || errorMessage.includes('Token expired')) {
                throw new Error(
                    '⏰ Google Ads refresh token expired.\n\n' +
                    '📋 Action required:\n' +
                    'Click "Conectar Google Ads" to re-authorize the integration.'
                );
            }
            
            // Customer ID issues
            if (errorMessage.includes('Customer not found') || errorMessage.includes('Invalid customer')) {
                throw new Error(
                    `❌ Google Ads Customer ID "${this.config?.customerId}" not found.\n\n` +
                    '📋 Action required:\n' +
                    '1. Log in to Google Ads: https://ads.google.com\n' +
                    '2. Find your Customer ID (top-right, format: XXX-XXX-XXXX)\n' +
                    '3. Update the Customer ID field above\n' +
                    '4. Save and try syncing again'
                );
            }
            
            // Developer token issues
            if (errorMessage.includes('Developer token') || errorMessage.includes('DEVELOPER_TOKEN')) {
                throw new Error(
                    '🔑 Google Ads Developer Token issue.\n\n' +
                    '📋 Action required:\n' +
                    'Verify that your Developer Token is valid and approved in Google Ads API Center.'
                );
            }
            
            throw error;
        }
    }

    /**
     * Sync ad groups for a specific campaign
     */
    async syncAdGroups(campaignId: string): Promise<number> {
        if (!this.client || !this.config) {
            await this.initializeClient();
        }

        if (!this.client || !this.config?.customerId || !this.config?.refreshToken) {
            throw new Error('Google Ads client not properly initialized');
        }

        try {
            const customer = this.client.Customer({
                customer_id: this.config.customerId,
                refresh_token: this.config.refreshToken,
            });

            const adGroups = await customer.query(`
                SELECT
                    ad_group.id,
                    ad_group.name,
                    ad_group.status,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.cost_micros,
                    metrics.conversions
                FROM ad_group
                WHERE campaign.id = ${campaignId}
                AND ad_group.status != 'REMOVED'
                AND segments.date DURING LAST_30_DAYS
            `);

            const campaignRecord = await prisma.googleAdsCampaign.findUnique({
                where: { campaignId: campaignId }
            });
            
            if (!campaignRecord) {
                logger.warn(`Campaign ${campaignId} not found in database, skipping ad groups sync`);
                return 0;
            }

            let syncedCount = 0;

            for (const adGroup of adGroups) {
                await prisma.googleAdsAdGroup.upsert({
                    where: {
                        adGroupId: adGroup.ad_group.id.toString(),
                    },
                    update: {
                        adGroupName: adGroup.ad_group.name || 'Unnamed Ad Group',
                        adGroupStatus: adGroup.ad_group.status || 'UNKNOWN',
                        impressions: Number(adGroup.metrics?.impressions) || 0,
                        clicks: Number(adGroup.metrics?.clicks) || 0,
                        cost: (Number(adGroup.metrics?.cost_micros) || 0) / 1000000,
                        conversions: Number(adGroup.metrics?.conversions) || 0,
                    },
                    create: {
                        adGroupId: adGroup.ad_group.id.toString(),
                        campaignId: campaignRecord.id,
                        adGroupName: adGroup.ad_group.name || 'Unnamed Ad Group',
                        adGroupStatus: adGroup.ad_group.status || 'UNKNOWN',
                        impressions: Number(adGroup.metrics?.impressions) || 0,
                        clicks: Number(adGroup.metrics?.clicks) || 0,
                        cost: (Number(adGroup.metrics?.cost_micros) || 0) / 1000000,
                        conversions: Number(adGroup.metrics?.conversions) || 0,
                    },
                });

                syncedCount++;
            }

            logger.info(`Synced ${syncedCount} ad groups for campaign ${campaignId}`, { organizationId: this.organizationId });
            return syncedCount;
        } catch (error) {
            logger.error('Error syncing ad groups', { error, campaignId, organizationId: this.organizationId });
            throw error;
        }
    }

    // ========================================================================
    // OFFLINE CONVERSION UPLOAD
    // ========================================================================

    /**
     * Upload offline conversion (lead converted to student)
     */
    async uploadConversion(leadId: string): Promise<boolean> {
        if (!this.client || !this.config) {
            await this.initializeClient();
        }

        if (!this.client || !this.config?.customerId || !this.config?.refreshToken) {
            throw new Error('Google Ads client not properly initialized');
        }

        try {
            // Get lead data
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                include: { convertedStudent: true },
            });

            if (!lead || !lead.gclid) {
                throw new Error('Lead not found or missing GCLID');
            }

            if (!lead.enrolledAt) {
                throw new Error('Lead not converted yet');
            }

            // Get conversion action ID from settings
            const settings = await prisma.crmSettings.findUnique({
                where: { organizationId: this.organizationId },
            });

            if (!settings?.googleAdsConversionAction) {
                throw new Error('Conversion action not configured');
            }

            const customer = this.client.Customer({
                customer_id: this.config.customerId,
                refresh_token: this.config.refreshToken,
            });

            // Upload conversion
            const conversionData = {
                gclid: lead.gclid,
                conversion_action: settings.googleAdsConversionAction,
                conversion_date_time: lead.enrolledAt.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
                conversion_value: lead.actualRevenue || lead.estimatedValue || 0,
                currency_code: 'BRL',
            };

            await customer.clickConversions.upload([conversionData]);

            // Update lead with upload status
            await prisma.lead.update({
                where: { id: leadId },
                data: { conversionUploaded: true },
            });

            logger.info('Offline conversion uploaded successfully', { leadId, gclid: lead.gclid });
            return true;
        } catch (error) {
            logger.error('Error uploading offline conversion', { error, leadId });
            throw error;
        }
    }

    /**
     * Batch upload multiple conversions
     */
    async uploadConversionsBatch(leadIds: string[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const leadId of leadIds) {
            try {
                await this.uploadConversion(leadId);
                success++;
            } catch (error) {
                logger.error('Failed to upload conversion for lead', { leadId, error });
                failed++;
            }
        }

        return { success, failed };
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Get average conversion value from CRM data
     */
    private async getAverageConversionValue(campaignName?: string): Promise<number> {
        const whereClause: any = {
            organizationId: this.organizationId,
            status: 'WON',
            enrolledAt: { not: null },
        };

        if (campaignName) {
            whereClause.campaign = { contains: campaignName };
        }

        const leads = await prisma.lead.findMany({
            where: whereClause,
            select: { actualRevenue: true, estimatedValue: true },
        });

        if (leads.length === 0) {
            return 500; // Default average value (R$ 500)
        }

        const totalValue = leads.reduce((sum, lead) => {
            return sum + (lead.actualRevenue || lead.estimatedValue || 0);
        }, 0);

        return totalValue / leads.length;
    }

    /**
     * Test connection to Google Ads API
     */
    async testConnection(): Promise<{ success: boolean; customerId?: string; error?: string }> {
        try {
            if (!this.client || !this.config) {
                await this.initializeClient();
            }

            if (!this.client || !this.config?.customerId || !this.config?.refreshToken) {
                throw new Error('Google Ads client not properly initialized');
            }

            const cleanCustomerId = this.config.customerId.replace(/-/g, '');
            
            logger.info('📤 Creating customer instance for test', {
                customerId: cleanCustomerId,
                hasRefreshToken: !!this.config.refreshToken
            });

            const customer = this.client.Customer({
                customer_id: cleanCustomerId,
                refresh_token: this.config.refreshToken,
            });

            logger.info('📤 Executing test query...');

            // Simple query to test connection
            let result;
            try {
                result = await customer.query(`
                    SELECT customer.id, customer.descriptive_name
                    FROM customer
                    LIMIT 1
                `);
                
                logger.info('✅ Query executed successfully', { resultLength: result?.length });
            } catch (queryErr: any) {
                logger.error('❌ Query execution failed', {
                    errorType: typeof queryErr,
                    errorConstructor: queryErr?.constructor?.name,
                    errorMessage: queryErr?.message,
                    errorKeys: Object.keys(queryErr || {}),
                    fullError: JSON.stringify(queryErr, null, 2)
                });
                throw queryErr;
            }

            return {
                success: true,
                customerId: result?.[0]?.customer?.id?.toString(),
            };
        } catch (error: any) {
            logger.error('Google Ads connection test failed', { 
                error: error.message,
                errorType: error?.constructor?.name,
                organizationId: this.organizationId 
            });
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Disconnect Google Ads account
     */
    async disconnect(): Promise<void> {
        await prisma.crmSettings.update({
            where: { organizationId: this.organizationId },
            data: {
                googleAdsConnected: false,
                googleAdsRefreshToken: null,
            },
        });

        this.client = null;
        this.config = null;

        logger.info('Google Ads disconnected', { organizationId: this.organizationId });
    }
}

// ============================================================================
// EXPORT
// ============================================================================

export default GoogleAdsService;
