/**
 * Google Ads Automatic Synchronization Script
 * 
 * This script runs automated synchronization tasks:
 * 1. Sync campaigns and metrics from Google Ads
 * 2. Upload pending offline conversions
 * 
 * Usage:
 * - Manual: npm run sync:google-ads
 * - Cron: Schedule to run every 6 hours
 * 
 * @version 1.0.0
 * @follows GOOGLE_ADS_SETUP.md automation section
 */

import { PrismaClient } from '@prisma/client';
import { GoogleAdsService } from '../src/services/googleAdsService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface SyncResult {
  success: boolean;
  campaignsSynced?: number;
  conversionsUploaded?: number;
  errors?: string[];
}

/**
 * Main sync function
 */
async function syncGoogleAds(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    campaignsSynced: 0,
    conversionsUploaded: 0,
    errors: []
  };

  try {
    logger.info('🚀 Starting Google Ads automatic synchronization...');

    // Get default organization (adjust if multi-tenant)
    const organization = await prisma.organization.findFirst({
      where: { id: process.env.DEFAULT_ORG_ID || 'a55ad715-2eb0-493c-996c-bb0f60bacec9' }
    });

    if (!organization) {
      throw new Error('Default organization not found');
    }

    // Get CRM settings
    const crmSettings = await prisma.crmSettings.findUnique({
      where: { organizationId: organization.id }
    });

    if (!crmSettings) {
      logger.warn('⚠️ CRM settings not found for organization');
      result.success = false;
      result.errors = ['CRM settings not configured'];
      return result;
    }

    // Check if Google Ads is connected
    if (!crmSettings.googleAdsConnected || !crmSettings.googleAdsRefreshToken) {
      logger.warn('⚠️ Google Ads not connected');
      result.success = false;
      result.errors = ['Google Ads not connected - run OAuth flow first'];
      return result;
    }

    // Initialize Google Ads service
    const googleAdsService = GoogleAdsService.getInstance(organization.id);
    
    // Test connection first
    logger.info('🔌 Testing Google Ads connection...');
    try {
      await googleAdsService.testConnection();
      logger.info('✅ Connection OK');
    } catch (error) {
      logger.error('❌ Connection test failed:', error);
      result.success = false;
      result.errors = [`Connection failed: ${error.message}`];
      return result;
    }

    // ========================================================================
    // STEP 1: SYNC CAMPAIGNS
    // ========================================================================
    
    logger.info('📊 Syncing campaigns from Google Ads...');
    try {
      const campaignCount = await googleAdsService.syncCampaigns();
      result.campaignsSynced = campaignCount;
      logger.info(`✅ ${campaignCount} campaigns synced successfully`);
    } catch (error) {
      logger.error('❌ Error syncing campaigns:', error);
      result.errors.push(`Campaign sync failed: ${error.message}`);
    }

    // ========================================================================
    // STEP 2: UPLOAD PENDING CONVERSIONS
    // ========================================================================
    
    logger.info('📤 Uploading pending conversions...');
    try {
      // Get leads with conversions that haven't been uploaded
      const pendingLeads = await prisma.lead.findMany({
        where: {
          organizationId: organization.id,
          stage: 'CONVERTED',
          gclid: { not: null },
          conversionUploaded: false,
          convertedAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          gclid: true,
          convertedAt: true
        }
      });

      if (pendingLeads.length === 0) {
        logger.info('✅ No pending conversions to upload');
        result.conversionsUploaded = 0;
      } else {
        logger.info(`📋 Found ${pendingLeads.length} pending conversion(s)`);

        let successCount = 0;
        let failCount = 0;

        for (const lead of pendingLeads) {
          try {
            const uploaded = await googleAdsService.uploadConversion(lead.id);
            if (uploaded) {
              successCount++;
              logger.info(`✅ Conversion uploaded for lead: ${lead.name} (${lead.id})`);
            } else {
              failCount++;
              logger.warn(`⚠️ Failed to upload conversion for lead: ${lead.name} (${lead.id})`);
            }
          } catch (error) {
            failCount++;
            logger.error(`❌ Error uploading conversion for lead ${lead.id}:`, error);
          }
        }

        result.conversionsUploaded = successCount;
        logger.info(`✅ Conversions uploaded: ${successCount} success, ${failCount} failed`);

        if (failCount > 0) {
          result.errors.push(`${failCount} conversion upload(s) failed`);
        }
      }
    } catch (error) {
      logger.error('❌ Error uploading conversions:', error);
      result.errors.push(`Conversion upload failed: ${error.message}`);
    }

    // ========================================================================
    // STEP 3: CLEANUP & SUMMARY
    // ========================================================================
    
    logger.info('🧹 Cleaning up...');
    await googleAdsService.disconnect();

    // Final summary
    logger.info('========================================');
    logger.info('✅ GOOGLE ADS SYNC COMPLETE');
    logger.info(`   Campaigns synced: ${result.campaignsSynced}`);
    logger.info(`   Conversions uploaded: ${result.conversionsUploaded}`);
    if (result.errors.length > 0) {
      logger.warn(`   Errors: ${result.errors.length}`);
      result.errors.forEach(err => logger.warn(`     - ${err}`));
    }
    logger.info('========================================');

  } catch (error) {
    logger.error('❌ Fatal error in Google Ads sync:', error);
    result.success = false;
    result.errors = result.errors || [];
    result.errors.push(`Fatal error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  return result;
}

/**
 * Run sync and exit with proper code
 */
async function main() {
  try {
    const result = await syncGoogleAds();
    
    if (result.success) {
      logger.info('🎉 Sync completed successfully');
      process.exit(0);
    } else {
      logger.error('⚠️ Sync completed with errors');
      process.exit(1);
    }
  } catch (error) {
    logger.error('💥 Critical error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { syncGoogleAds };
