/**
 * PHASE 1: Adicionar endpoints de Sync Status ao arquivo src/routes/crm.ts
 * 
 * Local: Adicionar após o endpoint de analytics/funnel (linha ~750)
 * Antes da última linha de log
 * 
 * ⚠️ IMPORTANTE: Estes endpoints retornam dados para o Dashboard de Sync Status
 */

// ========================================================================
// GOOGLE ADS SYNC STATUS & MANAGEMENT
// ========================================================================

/**
 * GET /api/crm/google-ads/sync-status
 * Get current sync status and metrics
 */
fastify.get('/google-ads/sync-status', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const organizationId = (request.headers as any)['x-organization-id'] ||
                          (request.query as any).organizationId ||
                          getDefaultOrganizationId();

    const settings = await prisma.crmSettings.findUnique({
      where: { organizationId },
      select: {
        googleAdsConnected: true,
        lastSyncTime: true,
        autoSyncEnabled: true
      }
    });

    if (!settings?.googleAdsConnected) {
      return reply.send({
        success: true,
        data: {
          connected: false,
          campaignsSynced: 0,
          keywordsSynced: 0,
          conversionsSynced: 0,
          lastSyncTime: null,
          autoSyncEnabled: false
        }
      });
    }

    // Get counts from database
    const [campaigns, keywords, conversions] = await Promise.all([
      prisma.googleAdsCampaign.count({ where: { organizationId } }),
      prisma.googleAdsKeyword.count({ where: { organizationId } }),
      prisma.leadActivity.count({
        where: {
          lead: { organizationId },
          type: 'CONVERSION_UPLOADED'
        }
      })
    ]);

    // Get top campaigns by ROI
    const topCampaigns = await prisma.googleAdsCampaign.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        impressions: true,
        clicks: true,
        cost: true,
        conversions: true,
        conversionValue: true,
        lastSyncAt: true
      },
      orderBy: [
        // Calculate ROI: (conversionValue - cost) / cost * 100
        // Using raw orderBy for calculation would be better, but here's a simplified version
        { conversionValue: 'desc' }
      ],
      take: 5
    });

    // Calculate ROI for each campaign
    const topCampaignsWithROI = topCampaigns.map(c => ({
      ...c,
      roi: c.cost > 0 ? ((Number(c.conversionValue || 0) - Number(c.cost)) / Number(c.cost)) * 100 : 0,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : 0,
      cpc: c.clicks > 0 ? Number(c.cost) / c.clicks : 0
    }));

    return reply.send({
      success: true,
      data: {
        connected: true,
        campaignsSynced: campaigns,
        keywordsSynced: keywords,
        conversionsSynced: conversions,
        campaignsLastSync: (await prisma.googleAdsCampaign.findFirst({
          where: { organizationId },
          select: { lastSyncAt: true },
          orderBy: { lastSyncAt: 'desc' }
        }))?.lastSyncAt,
        keywordsLastSync: (await prisma.googleAdsKeyword.findFirst({
          where: { organizationId },
          select: { lastSyncAt: true },
          orderBy: { lastSyncAt: 'desc' }
        }))?.lastSyncAt,
        conversionsLastSync: settings.lastSyncTime,
        lastSyncTime: settings.lastSyncTime,
        autoSyncEnabled: settings.autoSyncEnabled || false,
        topCampaigns: topCampaignsWithROI
      }
    });

  } catch (error: any) {
    logger.error('Error getting sync status:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/google-ads/sync
 * Trigger full sync (campaigns, keywords, conversions)
 */
fastify.post('/google-ads/sync', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const organizationId = (request.headers as any)['x-organization-id'] ||
                          getDefaultOrganizationId();

    // Check if connected
    const settings = await prisma.crmSettings.findUnique({
      where: { organizationId },
      select: { googleAdsConnected: true }
    });

    if (!settings?.googleAdsConnected) {
      return reply.code(400).send({
        success: false,
        message: 'Google Ads not connected for this organization'
      });
    }

    // Initialize Google Ads Service
    const googleAdsService = new GoogleAdsService(organizationId);

    try {
      // Step 1: Sync campaigns
      logger.info('📊 Syncing campaigns...');
      const campaignCount = await googleAdsService.syncCampaigns();
      logger.info(`✅ Synced ${campaignCount} campaigns`);

      // Step 2: Sync ad groups for each campaign
      logger.info('📊 Syncing ad groups...');
      const campaigns = await prisma.googleAdsCampaign.findMany({
        where: { organizationId },
        select: { campaignId: true }
      });
      let totalAdGroups = 0;
      for (const campaign of campaigns) {
        const adGroupCount = await googleAdsService.syncAdGroups(campaign.campaignId);
        totalAdGroups += adGroupCount;
      }
      logger.info(`✅ Synced ${totalAdGroups} ad groups`);

      // Step 3: Update last sync time
      await prisma.crmSettings.update({
        where: { organizationId },
        data: { lastSyncTime: new Date() }
      });

      return reply.send({
        success: true,
        data: {
          campaignsSynced: campaignCount,
          adGroupsSynced: totalAdGroups,
          message: `Successfully synced ${campaignCount} campaigns and ${totalAdGroups} ad groups`
        }
      });

    } catch (syncError: any) {
      logger.error('Sync error:', syncError);
      return reply.code(500).send({
        success: false,
        message: 'Failed to sync campaigns',
        error: syncError.message
      });
    }

  } catch (error: any) {
    logger.error('Error in sync endpoint:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to start sync',
      error: error.message
    });
  }
});

/**
 * POST /api/crm/google-ads/auto-sync
 * Enable/disable auto-sync
 */
fastify.post('/google-ads/auto-sync', async (request: FastifyRequest<{
  Body: { enabled: boolean };
}>, reply: FastifyReply) => {
  try {
    const organizationId = (request.headers as any)['x-organization-id'] ||
                          getDefaultOrganizationId();
    const { enabled } = request.body;

    await prisma.crmSettings.update({
      where: { organizationId },
      data: { autoSyncEnabled: enabled }
    });

    logger.info(`Auto-sync ${enabled ? 'enabled' : 'disabled'} for organization ${organizationId}`);

    return reply.send({
      success: true,
      data: {
        autoSyncEnabled: enabled,
        message: `Auto-sync ${enabled ? 'enabled' : 'disabled'}`
      }
    });

  } catch (error: any) {
    logger.error('Error updating auto-sync:', error);
    return reply.code(500).send({
      success: false,
      message: 'Failed to update auto-sync setting',
      error: error.message
    });
  }
});

// ========================================================================
// END GOOGLE ADS SYNC ENDPOINTS
// ========================================================================
