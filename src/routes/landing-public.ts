/**
 * Landing Page Public Routes
 * 
 * Publicly accessible routes for viewing published landing pages
 * and submitting forms (lead capture).
 * 
 * Routes:
 * - GET /lp/:slug - View published landing page (HTML render)
 * - GET /lp/preview/:id - Preview landing page (auth required)
 * - POST /lp/:pageId/submit - Submit form (lead capture)
 * - POST /lp/:pageId/view - Track page view
 * 
 * Note: These routes are NOT prefixed with /api/ and serve HTML content.
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

interface SlugParams {
  slug: string;
}

interface IdParams {
  id: string;
  pageId?: string;
}

interface FormSubmissionBody {
  formId: string;
  data: Record<string, unknown>;
  sessionId?: string;
}

interface TrackViewBody {
  sessionId: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate complete HTML page from landing page data
 */
function generateFullHtml(page: {
  title: string;
  description?: string | null;
  keywords?: string[];
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  htmlContent?: string | null;
  cssContent?: string | null;
  jsContent?: string | null;
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  whatsappNumber?: string | null;
  forms?: Array<{
    id: string;
    name: string;
    position: string;
    fields: unknown;
    submitButtonText: string;
    successMessage: string;
  }>;
}, pageId: string, orgSlug: string): string {
  const trackingScripts = `
    <script>
      // Track page view
      (function() {
        const sessionId = sessionStorage.getItem('lp_session') || crypto.randomUUID();
        sessionStorage.setItem('lp_session', sessionId);
        
        fetch('/lp/${pageId}/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            utmSource: new URLSearchParams(location.search).get('utm_source'),
            utmMedium: new URLSearchParams(location.search).get('utm_medium'),
            utmCampaign: new URLSearchParams(location.search).get('utm_campaign'),
            utmContent: new URLSearchParams(location.search).get('utm_content'),
            utmTerm: new URLSearchParams(location.search).get('utm_term')
          })
        });
        
        // Track time on page and scroll depth
        let maxScroll = 0;
        const startTime = Date.now();
        
        window.addEventListener('scroll', function() {
          const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
          maxScroll = Math.max(maxScroll, scrolled);
        });
        
        window.addEventListener('beforeunload', function() {
          const timeOnPage = Math.round((Date.now() - startTime) / 1000);
          navigator.sendBeacon('/api/marketing/public/track-engagement', JSON.stringify({
            sessionId,
            timeOnPage,
            scrollDepth: Math.round(maxScroll)
          }));
        });
      })();
    </script>
  `;

  const gaScript = page.googleAnalyticsId ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${page.googleAnalyticsId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${page.googleAnalyticsId}');
    </script>
  ` : '';

  const fbPixelScript = page.facebookPixelId ? `
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${page.facebookPixelId}');
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${page.facebookPixelId}&ev=PageView&noscript=1"
    /></noscript>
  ` : '';

  const whatsappWidget = page.whatsappNumber ? `
    <a href="https://wa.me/${page.whatsappNumber.replace(/\D/g, '')}" 
       target="_blank" 
       class="whatsapp-float"
       title="Fale conosco no WhatsApp">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
    <style>
      .whatsapp-float {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: #25D366;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transition: transform 0.3s ease;
      }
      .whatsapp-float:hover {
        transform: scale(1.1);
      }
    </style>
  ` : '';

  const formScript = page.forms && page.forms.length > 0 ? `
    <script>
      document.querySelectorAll('form[data-lp-form]').forEach(form => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formId = form.dataset.lpForm;
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          const sessionId = sessionStorage.getItem('lp_session') || crypto.randomUUID();
          
          try {
            const res = await fetch('/lp/${pageId}/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ formId, data, sessionId })
            });
            
            const result = await res.json();
            if (result.success) {
              const successMsg = form.dataset.successMessage || 'Obrigado! Entraremos em contato em breve.';
              form.innerHTML = '<div class="form-success">' + successMsg + '</div>';
              
              // Track conversion
              if (typeof fbq !== 'undefined') fbq('track', 'Lead');
              if (typeof gtag !== 'undefined') gtag('event', 'generate_lead');
            } else {
              alert(result.message || 'Erro ao enviar. Tente novamente.');
            }
          } catch (err) {
            alert('Erro ao enviar. Tente novamente.');
          }
        });
      });
    </script>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  ${page.description ? `<meta name="description" content="${page.description}">` : ''}
  ${page.keywords?.length ? `<meta name="keywords" content="${page.keywords.join(', ')}">` : ''}
  ${page.ogImageUrl ? `<meta property="og:image" content="${page.ogImageUrl}">` : ''}
  <meta property="og:title" content="${page.title}">
  ${page.description ? `<meta property="og:description" content="${page.description}">` : ''}
  ${page.faviconUrl ? `<link rel="icon" href="${page.faviconUrl}">` : ''}
  ${gaScript}
  ${fbPixelScript}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    ${page.cssContent || ''}
  </style>
</head>
<body>
  ${page.htmlContent || '<div style="padding: 40px; text-align: center;"><h1>Página em construção</h1></div>'}
  ${whatsappWidget}
  ${trackingScripts}
  ${formScript}
  ${page.jsContent ? `<script>${page.jsContent}</script>` : ''}
</body>
</html>
  `.trim();
}

// ============================================================================
// Routes
// ============================================================================

export default async function landingPublicRoutes(fastify: FastifyInstance) {
  // ------------------------------------------
  // GET /lp/:slug - View published landing page
  // ------------------------------------------
  fastify.get<{ Params: SlugParams }>(
    '/:slug',
    async (request, reply) => {
      try {
        const { slug } = request.params;

        const landingPage = await prisma.landingPage.findFirst({
          where: { slug, status: 'PUBLISHED' },
          include: {
            organization: { select: { slug: true } },
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
          return reply.code(404).type('text/html').send(`
            <!DOCTYPE html>
            <html>
            <head><title>Página não encontrada</title></head>
            <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
              <div style="text-align:center;">
                <h1>404</h1>
                <p>Página não encontrada</p>
              </div>
            </body>
            </html>
          `);
        }

        const html = generateFullHtml(
          landingPage,
          landingPage.id,
          landingPage.organization.slug || 'default'
        );

        return reply.type('text/html').send(html);
      } catch (error) {
        logger.error('Error rendering landing page:', error);
        return reply.code(500).type('text/html').send(`
          <!DOCTYPE html>
          <html>
          <head><title>Erro</title></head>
          <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
            <div style="text-align:center;">
              <h1>Erro</h1>
              <p>Não foi possível carregar a página</p>
            </div>
          </body>
          </html>
        `);
      }
    }
  );

  // ------------------------------------------
  // GET /lp/preview/:id - Preview landing page (requires auth)
  // ------------------------------------------
  fastify.get<{ Params: IdParams }>(
    '/preview/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Note: For preview, we allow viewing even draft pages
        // In production, you'd want to verify the user has access
        const landingPage = await prisma.landingPage.findUnique({
          where: { id },
          include: {
            organization: { select: { slug: true } },
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
          return reply.code(404).type('text/html').send(`
            <!DOCTYPE html>
            <html>
            <head><title>Página não encontrada</title></head>
            <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
              <div style="text-align:center;">
                <h1>404</h1>
                <p>Landing page não encontrada</p>
              </div>
            </body>
            </html>
          `);
        }

        // Add preview banner
        const previewBanner = `
          <div style="position:fixed;top:0;left:0;right:0;background:#ffc107;color:#000;padding:8px;text-align:center;z-index:99999;font-family:sans-serif;font-size:14px;">
            ⚠️ PREVIEW - Esta página ${landingPage.status === 'DRAFT' ? 'ainda não foi publicada' : 'está publicada'}
            ${landingPage.status === 'DRAFT' ? ' | <a href="#" onclick="alert(\'Publique a página no painel de marketing\')">Publicar</a>' : ''}
          </div>
          <div style="height:40px;"></div>
        `;

        const html = generateFullHtml(
          landingPage,
          landingPage.id,
          landingPage.organization.slug || 'default'
        ).replace('<body>', `<body>${previewBanner}`);

        return reply.type('text/html').send(html);
      } catch (error) {
        logger.error('Error previewing landing page:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to preview landing page'
        });
      }
    }
  );

  // ------------------------------------------
  // POST /lp/:pageId/view - Track page view
  // ------------------------------------------
  fastify.post<{ Params: IdParams; Body: TrackViewBody }>(
    '/:pageId/view',
    async (request, reply) => {
      try {
        const { pageId } = request.params;
        const {
          sessionId,
          userAgent,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm
        } = request.body;

        // Verify landing page exists
        const landingPage = await prisma.landingPage.findUnique({
          where: { id: pageId }
        });

        if (!landingPage) {
          return reply.code(404).send({
            success: false,
            message: 'Landing page not found'
          });
        }

        // Get IP from request
        const ipAddress = request.ip;

        // Create page view record
        await prisma.landingPageView.create({
          data: {
            landingPageId: pageId,
            sessionId: sessionId || crypto.randomUUID(),
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
        // Don't fail the page load for tracking errors
        return reply.send({
          success: false,
          message: 'Failed to track view'
        });
      }
    }
  );

  // ------------------------------------------
  // POST /lp/:pageId/submit - Submit form (create lead)
  // ------------------------------------------
  fastify.post<{ Params: IdParams; Body: FormSubmissionBody }>(
    '/:pageId/submit',
    async (request, reply) => {
      try {
        const { pageId } = request.params;
        const { formId, data, sessionId } = request.body;

        // Get form with landing page details
        const form = await prisma.landingForm.findFirst({
          where: { id: formId, landingPageId: pageId },
          include: {
            landingPage: {
              select: { organizationId: true }
            }
          }
        });

        if (!form) {
          return reply.code(404).send({
            success: false,
            message: 'Form not found'
          });
        }

        // Update form submission count
        await prisma.landingForm.update({
          where: { id: formId },
          data: {
            submissions: { increment: 1 }
          }
        });

        // Create lead if auto-create is enabled
        if (form.autoCreateLead) {
          try {
            // Extract common fields
            const name = (data.name || data.nome || data.fullName || '') as string;
            const email = (data.email || data.e_mail || '') as string;
            const phone = (data.phone || data.telefone || data.whatsapp || '') as string;

            // Create lead in CRM
            // Using stage for lead progress (NEW, QUALIFIED, etc.)
            // and status for active/inactive tracking
            await prisma.lead.create({
              data: {
                organizationId: form.landingPage.organizationId,
                name: name || 'Lead sem nome',
                email: email || 'sem-email@landing.page',
                phone: phone || null,
                landingPage: form.name,
                temperature: (form.leadTemperature as 'HOT' | 'WARM' | 'COLD') || 'HOT',
                stage: 'NEW',
                status: 'ACTIVE',
                message: `Formulário: ${form.name}\nDados: ${JSON.stringify(data, null, 2)}`,
                tags: form.tags || [],
                assignedToId: form.assignToUserId || null
              }
            });

            // Update form conversion count
            await prisma.landingForm.update({
              where: { id: formId },
              data: {
                conversions: { increment: 1 }
              }
            });

            logger.info(`Lead created from landing page form: ${form.name}`);
          } catch (leadError) {
            logger.error('Error creating lead:', leadError);
            // Continue even if lead creation fails
          }
        }

        return reply.send({
          success: true,
          message: form.successMessage || 'Obrigado! Entraremos em contato em breve.'
        });
      } catch (error) {
        logger.error('Error submitting form:', error);
        return reply.code(500).send({
          success: false,
          message: 'Erro ao enviar formulário'
        });
      }
    }
  );
}
