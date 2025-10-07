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

        this.client = new GoogleAdsApi({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            developer_token: this.config.developerToken,
        });

        logger.info('Google Ads API client initialized', { organizationId: this.organizationId });
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
            throw new Error('Google Ads client not properly initialized');
        }

        try {
            const customer = this.client.Customer({
                customer_id: this.config.customerId,
                refresh_token: this.config.refreshToken,
            });

            // Query campaigns with metrics
            const campaigns = await customer.query(`
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

            let syncedCount = 0;

            for (const campaign of campaigns) {
                const campaignData = {
                    googleCampaignId: campaign.campaign.id.toString(),
                    name: campaign.campaign.name || 'Unnamed Campaign',
                    status: campaign.campaign.status || 'UNKNOWN',
                    impressions: Number(campaign.metrics?.impressions) || 0,
                    clicks: Number(campaign.metrics?.clicks) || 0,
                    cost: (Number(campaign.metrics?.cost_micros) || 0) / 1000000, // Convert from micros
                    conversions: Number(campaign.metrics?.conversions) || 0,
                    organizationId: this.organizationId,
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
                        organizationId_googleCampaignId: {
                            organizationId: this.organizationId,
                            googleCampaignId: campaignData.googleCampaignId,
                        },
                    },
                    update: campaignData,
                    create: campaignData,
                });

                syncedCount++;
            }

            logger.info(`Synced ${syncedCount} campaigns from Google Ads`, { organizationId: this.organizationId });
            return syncedCount;
        } catch (error) {
            logger.error('Error syncing campaigns from Google Ads', { error, organizationId: this.organizationId });
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

            let syncedCount = 0;

            for (const adGroup of adGroups) {
                await prisma.googleAdsAdGroup.upsert({
                    where: {
                        organizationId_googleAdGroupId: {
                            organizationId: this.organizationId,
                            googleAdGroupId: adGroup.ad_group.id.toString(),
                        },
                    },
                    update: {
                        name: adGroup.ad_group.name || 'Unnamed Ad Group',
                        status: adGroup.ad_group.status || 'UNKNOWN',
                        impressions: Number(adGroup.metrics?.impressions) || 0,
                        clicks: Number(adGroup.metrics?.clicks) || 0,
                        cost: (Number(adGroup.metrics?.cost_micros) || 0) / 1000000,
                        conversions: Number(adGroup.metrics?.conversions) || 0,
                    },
                    create: {
                        googleAdGroupId: adGroup.ad_group.id.toString(),
                        googleCampaignId: campaignId,
                        name: adGroup.ad_group.name || 'Unnamed Ad Group',
                        status: adGroup.ad_group.status || 'UNKNOWN',
                        impressions: Number(adGroup.metrics?.impressions) || 0,
                        clicks: Number(adGroup.metrics?.clicks) || 0,
                        cost: (Number(adGroup.metrics?.cost_micros) || 0) / 1000000,
                        conversions: Number(adGroup.metrics?.conversions) || 0,
                        organizationId: this.organizationId,
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
                include: { convertedToStudent: true },
            });

            if (!lead || !lead.gclid) {
                throw new Error('Lead not found or missing GCLID');
            }

            if (!lead.convertedAt) {
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
                conversion_date_time: lead.convertedAt.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
                conversion_value: lead.actualValue || lead.estimatedValue || 0,
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
            convertedAt: { not: null },
        };

        if (campaignName) {
            whereClause.campaign = { contains: campaignName };
        }

        const leads = await prisma.lead.findMany({
            where: whereClause,
            select: { actualValue: true, estimatedValue: true },
        });

        if (leads.length === 0) {
            return 500; // Default average value (R$ 500)
        }

        const totalValue = leads.reduce((sum, lead) => {
            return sum + (lead.actualValue || lead.estimatedValue || 0);
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

            const customer = this.client.Customer({
                customer_id: this.config.customerId,
                refresh_token: this.config.refreshToken,
            });

            // Simple query to test connection
            const result = await customer.query(`
                SELECT customer.id, customer.descriptive_name
                FROM customer
                LIMIT 1
            `);

            return {
                success: true,
                customerId: result[0]?.customer?.id?.toString(),
            };
        } catch (error: any) {
            logger.error('Google Ads connection test failed', { error, organizationId: this.organizationId });
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
