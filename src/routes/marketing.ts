/**
 * Marketing Module Routes
 * 
 * CRUD API for Landing Pages, Forms, and Analytics
 * 
 * Prisma Models Used:
 * - LandingPage: Main landing page entity with sections (Json), forms relation, pageViews relation
 * - LandingForm: Form configuration for lead capture
 * - LandingPageView: Page view analytics with sessionId, visitedAt
 * 
 * Note: sections is a Json field, NOT a relation.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { Prisma, LandingPageStatus } from '@prisma/client';

// ============================================================================
// Type Definitions
// ============================================================================

interface LandingPageParams {
  id: string;
}

interface SlugParams {
  slug: string;
}

interface FormParams {
  id: string;
  formId: string;
}

interface LandingPageBody {
  name: string;
  slug: string;
  title: string;
  description?: string;
  keywords?: string[];
  theme?: Record<string, unknown> | null;
  faviconUrl?: string;
  ogImageUrl?: string;
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
  sections?: unknown[] | null;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  googleAdsConversionId?: string;
  whatsappNumber?: string;
  status?: LandingPageStatus;
}

interface FormBody {
  name: string;
  position?: string;
  fields: unknown[];
  submitButtonText?: string;
  successMessage?: string;
  autoCreateLead?: boolean;
  leadSource?: string;
  leadTemperature?: string;
  assignToUserId?: string;
  tags?: string[];
}

interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
}

interface TrackViewBody {
  slug: string;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

interface TrackEngagementBody {
  sessionId: string;
  timeOnPage?: number;
  scrollDepth?: number;
}

// ============================================================================
// Landing Page Routes
// ============================================================================

export default async function marketingRoutes(fastify: FastifyInstance) {
  // Add request logging for debugging
  fastify.addHook('onRequest', async (request, _reply) => {
    logger.debug(`Marketing route - ${request.method} ${request.url}`);
  });

  // ------------------------------------------
  // GET /landing-pages - List all landing pages
  // ------------------------------------------
  fastify.get('/landing-pages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requireOrganizationId } = await import('@/utils/tenantHelpers');
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const landingPages = await prisma.landingPage.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              pageViews: true,
              forms: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transform to include view and form counts at top level
      const pagesWithStats = landingPages.map(page => ({
        ...page,
        viewCount: page._count.pageViews,
        formCount: page._count.forms
      }));

      return reply.send({
        success: true,
        data: pagesWithStats,
        total: pagesWithStats.length
      });
    } catch (error) {
      logger.error('Error fetching landing pages:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to fetch landing pages'
      });
    }
  });

  // ------------------------------------------
  // GET /landing-pages/:id - Get single landing page
  // ------------------------------------------
  fastify.get<{ Params: LandingPageParams }>(
    '/landing-pages/:id',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;

        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId },
          include: {
            forms: true,
            _count: {
              select: {
                pageViews: true
              }
            }
          }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        return reply.send({
          success: true,
          data: {
            ...landingPage,
            viewCount: landingPage._count.pageViews
          }
        });
      } catch (error) {
        logger.error('Error fetching landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch landing page'
        });
      }
    }
  );

  // ------------------------------------------
  // POST /landing-pages - Create landing page
  // ------------------------------------------
  fastify.post<{ Body: LandingPageBody }>(
    '/landing-pages',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const {
          name,
          slug,
          title,
          description,
          keywords,
          theme,
          faviconUrl,
          ogImageUrl,
          htmlContent,
          cssContent,
          jsContent,
          sections,
          googleAnalyticsId,
          facebookPixelId,
          googleAdsConversionId,
          whatsappNumber,
          status
        } = request.body;

        // Check for slug uniqueness within organization
        const existingSlug = await prisma.landingPage.findFirst({
          where: { organizationId, slug }
        });

        if (existingSlug) {
          return reply.code(400).send({
            success: false,
            message: 'A landing page with this slug already exists'
          });
        }

        const landingPage = await prisma.landingPage.create({
          data: {
            organizationId,
            name,
            slug,
            title,
            description,
            keywords: keywords || [],
            theme: (theme as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            faviconUrl,
            ogImageUrl,
            htmlContent,
            cssContent,
            jsContent,
            sections: (sections as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            googleAnalyticsId,
            facebookPixelId,
            googleAdsConversionId,
            whatsappNumber,
            status: status || 'DRAFT'
          },
          include: {
            forms: true
          }
        });

        logger.info(`Landing page created: ${landingPage.id}`);

        return reply.code(201).send({
          success: true,
          data: landingPage,
          message: 'Landing page created successfully'
        });
      } catch (error) {
        logger.error('Error creating landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to create landing page'
        });
      }
    }
  );

  // ------------------------------------------
  // PUT /landing-pages/:id - Update landing page
  // ------------------------------------------
  fastify.put<{ Params: LandingPageParams; Body: Partial<LandingPageBody> }>(
    '/landing-pages/:id',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;
        const body = request.body;

        // Verify ownership
        const existing = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        // Check slug uniqueness if changing
        if (body.slug && body.slug !== existing.slug) {
          const slugExists = await prisma.landingPage.findFirst({
            where: {
              organizationId,
              slug: body.slug,
              id: { not: id }
            }
          });

          if (slugExists) {
            return reply.code(400).send({
              success: false,
              message: 'A landing page with this slug already exists'
            });
          }
        }

        // Build update data with proper types
        const updateData: Prisma.LandingPageUpdateInput = {};
        
        if (body.name !== undefined) updateData.name = body.name;
        if (body.slug !== undefined) updateData.slug = body.slug;
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.keywords !== undefined) updateData.keywords = body.keywords;
        if (body.theme !== undefined) updateData.theme = (body.theme as Prisma.InputJsonValue) ?? Prisma.JsonNull;
        if (body.faviconUrl !== undefined) updateData.faviconUrl = body.faviconUrl;
        if (body.ogImageUrl !== undefined) updateData.ogImageUrl = body.ogImageUrl;
        if (body.htmlContent !== undefined) updateData.htmlContent = body.htmlContent;
        if (body.cssContent !== undefined) updateData.cssContent = body.cssContent;
        if (body.jsContent !== undefined) updateData.jsContent = body.jsContent;
        if (body.sections !== undefined) updateData.sections = (body.sections as Prisma.InputJsonValue) ?? Prisma.JsonNull;
        if (body.googleAnalyticsId !== undefined) updateData.googleAnalyticsId = body.googleAnalyticsId;
        if (body.facebookPixelId !== undefined) updateData.facebookPixelId = body.facebookPixelId;
        if (body.googleAdsConversionId !== undefined) updateData.googleAdsConversionId = body.googleAdsConversionId;
        if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber;
        if (body.status !== undefined) {
          updateData.status = body.status;
          // Set publishedAt when publishing
          if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
            updateData.publishedAt = new Date();
          }
        }

        const landingPage = await prisma.landingPage.update({
          where: { id },
          data: updateData,
          include: {
            forms: true
          }
        });

        logger.info(`Landing page updated: ${landingPage.id}`);

        return reply.send({
          success: true,
          data: landingPage,
          message: 'Landing page updated successfully'
        });
      } catch (error) {
        logger.error('Error updating landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to update landing page'
        });
      }
    }
  );

  // ------------------------------------------
  // DELETE /landing-pages/:id - Delete landing page
  // ------------------------------------------
  fastify.delete<{ Params: LandingPageParams }>(
    '/landing-pages/:id',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;

        const existing = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        await prisma.landingPage.delete({
          where: { id }
        });

        logger.info(`Landing page deleted: ${id}`);

        return reply.send({
          success: true,
          message: 'Landing page deleted successfully'
        });
      } catch (error) {
        logger.error('Error deleting landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to delete landing page'
        });
      }
    }
  );

  // ============================================================================
  // Form Routes (nested under landing pages)
  // ============================================================================

  // ------------------------------------------
  // GET /landing-pages/:id/forms - List forms for a landing page
  // ------------------------------------------
  fastify.get<{ Params: LandingPageParams }>(
    '/landing-pages/:id/forms',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;

        // Verify landing page ownership
        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        const forms = await prisma.landingForm.findMany({
          where: { landingPageId: id },
          orderBy: { createdAt: 'desc' }
        });

        return reply.send({
          success: true,
          data: forms,
          total: forms.length
        });
      } catch (error) {
        logger.error('Error fetching forms:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch forms'
        });
      }
    }
  );

  // ------------------------------------------
  // POST /landing-pages/:id/forms - Create form
  // ------------------------------------------
  fastify.post<{ Params: LandingPageParams; Body: FormBody }>(
    '/landing-pages/:id/forms',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;
        const {
          name,
          position,
          fields,
          submitButtonText,
          successMessage,
          autoCreateLead,
          leadSource,
          leadTemperature,
          assignToUserId,
          tags
        } = request.body;

        // Verify landing page ownership
        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        const form = await prisma.landingForm.create({
          data: {
            landingPageId: id,
            name,
            position: position || 'hero',
            fields: fields as Prisma.InputJsonValue,
            submitButtonText: submitButtonText || 'Quero Começar!',
            successMessage: successMessage || 'Obrigado! Entraremos em contato em breve.',
            autoCreateLead: autoCreateLead ?? true,
            leadSource: leadSource || 'LANDING_PAGE',
            leadTemperature: leadTemperature || 'HOT',
            assignToUserId,
            tags: tags || []
          }
        });

        logger.info(`Form created: ${form.id} for landing page ${id}`);

        return reply.code(201).send({
          success: true,
          data: form,
          message: 'Form created successfully'
        });
      } catch (error) {
        logger.error('Error creating form:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to create form'
        });
      }
    }
  );

  // ------------------------------------------
  // PUT /landing-pages/:id/forms/:formId - Update form
  // ------------------------------------------
  fastify.put<{ Params: FormParams; Body: Partial<FormBody> }>(
    '/landing-pages/:id/forms/:formId',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id, formId } = request.params;
        const body = request.body;

        // Verify landing page ownership
        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        // Verify form exists
        const existingForm = await prisma.landingForm.findFirst({
          where: { id: formId, landingPageId: id }
        });

        if (!existingForm) {
          return reply.code(404).send({
            success: false,
            message: 'Form not found'
          });
        }

        // Build update data with proper types
        const updateData: Prisma.LandingFormUpdateInput = {};
        
        if (body.name !== undefined) updateData.name = body.name;
        if (body.position !== undefined) updateData.position = body.position;
        if (body.fields !== undefined) updateData.fields = body.fields as Prisma.InputJsonValue;
        if (body.submitButtonText !== undefined) updateData.submitButtonText = body.submitButtonText;
        if (body.successMessage !== undefined) updateData.successMessage = body.successMessage;
        if (body.autoCreateLead !== undefined) updateData.autoCreateLead = body.autoCreateLead;
        if (body.leadSource !== undefined) updateData.leadSource = body.leadSource;
        if (body.leadTemperature !== undefined) updateData.leadTemperature = body.leadTemperature;
        if (body.assignToUserId !== undefined) updateData.assignToUserId = body.assignToUserId;
        if (body.tags !== undefined) updateData.tags = body.tags;

        const form = await prisma.landingForm.update({
          where: { id: formId },
          data: updateData
        });

        logger.info(`Form updated: ${formId}`);

        return reply.send({
          success: true,
          data: form,
          message: 'Form updated successfully'
        });
      } catch (error) {
        logger.error('Error updating form:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to update form'
        });
      }
    }
  );

  // ------------------------------------------
  // DELETE /landing-pages/:id/forms/:formId - Delete form
  // ------------------------------------------
  fastify.delete<{ Params: FormParams }>(
    '/landing-pages/:id/forms/:formId',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id, formId } = request.params;

        // Verify landing page ownership
        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        const existingForm = await prisma.landingForm.findFirst({
          where: { id: formId, landingPageId: id }
        });

        if (!existingForm) {
          return reply.code(404).send({
            success: false,
            message: 'Form not found'
          });
        }

        await prisma.landingForm.delete({
          where: { id: formId }
        });

        logger.info(`Form deleted: ${formId}`);

        return reply.send({
          success: true,
          message: 'Form deleted successfully'
        });
      } catch (error) {
        logger.error('Error deleting form:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to delete form'
        });
      }
    }
  );

  // ============================================================================
  // Analytics Routes
  // ============================================================================

  // ------------------------------------------
  // GET /landing-pages/:id/analytics - Get analytics for a landing page
  // ------------------------------------------
  fastify.get<{ Params: LandingPageParams; Querystring: AnalyticsQuery }>(
    '/landing-pages/:id/analytics',
    async (request, reply) => {
      try {
        const { requireOrganizationId } = await import('@/utils/tenantHelpers');
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;

        const { id } = request.params;
        const { startDate, endDate } = request.query;

        // Verify landing page ownership
        const landingPage = await prisma.landingPage.findFirst({
          where: { id, organizationId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        // Build date filter for page views
        const dateFilter: Prisma.LandingPageViewWhereInput = { landingPageId: id };
        if (startDate || endDate) {
          dateFilter.visitedAt = {};
          if (startDate) (dateFilter.visitedAt as Prisma.DateTimeFilter).gte = new Date(startDate);
          if (endDate) (dateFilter.visitedAt as Prisma.DateTimeFilter).lte = new Date(endDate);
        }

        // Get page views
        const pageViews = await prisma.landingPageView.findMany({
          where: dateFilter,
          orderBy: { visitedAt: 'desc' }
        });

        // Get form stats
        const forms = await prisma.landingForm.findMany({
          where: { landingPageId: id },
          select: {
            id: true,
            name: true,
            submissions: true,
            conversions: true
          }
        });

        // Calculate analytics
        const totalViews = pageViews.length;
        const uniqueSessions = new Set(pageViews.map(v => v.sessionId)).size;
        const totalSubmissions = forms.reduce((sum, f) => sum + f.submissions, 0);
        const totalConversions = forms.reduce((sum, f) => sum + f.conversions, 0);
        const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

        // Average time on page
        const timesOnPage = pageViews.filter(v => v.timeOnPage !== null).map(v => v.timeOnPage!);
        const avgTimeOnPage = timesOnPage.length > 0 
          ? timesOnPage.reduce((a, b) => a + b, 0) / timesOnPage.length 
          : 0;

        // UTM source breakdown
        const utmSources: Record<string, number> = {};
        pageViews.forEach(v => {
          const source = v.utmSource || 'direct';
          utmSources[source] = (utmSources[source] || 0) + 1;
        });

        return reply.send({
          success: true,
          data: {
            overview: {
              totalViews,
              uniqueSessions,
              totalSubmissions,
              totalConversions,
              conversionRate: Math.round(conversionRate * 100) / 100,
              avgTimeOnPage: Math.round(avgTimeOnPage)
            },
            forms,
            utmSources,
            recentViews: pageViews.slice(0, 50)
          }
        });
      } catch (error) {
        logger.error('Error fetching analytics:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch analytics'
        });
      }
    }
  );

  // ============================================================================
  // Public Routes (for tracking - no auth required)
  // ============================================================================

  // ------------------------------------------
  // POST /public/track-view - Track page view (public endpoint)
  // ------------------------------------------
  fastify.post<{ Body: TrackViewBody }>(
    '/public/track-view',
    async (request, reply) => {
      try {
        const {
          slug,
          sessionId,
          userAgent,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm
        } = request.body;

        // Find landing page by slug
        const landingPage = await prisma.landingPage.findFirst({
          where: { slug, status: 'PUBLISHED' }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        // Get IP from request
        const ipAddress = request.ip;

        // Create page view
        await prisma.landingPageView.create({
          data: {
            landingPageId: landingPage.id,
            sessionId,
            userAgent,
            ipAddress,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
            utmContent,
            utmTerm
          }
        });

        return reply.send({
          success: true,
          message: 'View tracked'
        });
      } catch (error) {
        logger.error('Error tracking view:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to track view'
        });
      }
    }
  );

  // ------------------------------------------
  // POST /public/track-engagement - Update engagement metrics
  // ------------------------------------------
  fastify.post<{ Body: TrackEngagementBody }>(
    '/public/track-engagement',
    async (request, reply) => {
      try {
        const { sessionId, timeOnPage, scrollDepth } = request.body;

        // Find most recent view for this session
        const recentView = await prisma.landingPageView.findFirst({
          where: { sessionId },
          orderBy: { visitedAt: 'desc' }
        });

        if (!recentView) {
          return reply.code(404).send({
            success: false,
            message: 'Session not found'
          });
        }

        // Update engagement metrics
        await prisma.landingPageView.update({
          where: { id: recentView.id },
          data: {
            timeOnPage,
            scrollDepth
          }
        });

        return reply.send({
          success: true,
          message: 'Engagement updated'
        });
      } catch (error) {
        logger.error('Error tracking engagement:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to track engagement'
        });
      }
    }
  );

  // ------------------------------------------
  // GET /public/:slug - Get published landing page (public)
  // ------------------------------------------
  fastify.get<{ Params: SlugParams }>(
    '/public/:slug',
    async (request, reply) => {
      try {
        const { slug } = request.params;

        const landingPage = await prisma.landingPage.findFirst({
          where: { slug, status: 'PUBLISHED' },
          include: {
            forms: {
              select: {
                id: true,
                name: true,
                position: true,
                fields: true,
                submitButtonText: true,
                successMessage: true
              }
            }
          }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        return reply.send({
          success: true,
          data: landingPage
        });
      } catch (error) {
        logger.error('Error fetching public landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch landing page'
        });
      }
    }
  );
}
