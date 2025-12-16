import { z } from 'zod';
import { LandingPageStatus } from '@prisma/client';

export const createLandingPageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  theme: z.record(z.unknown()).optional().nullable(),
  faviconUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  htmlContent: z.string().optional(),
  cssContent: z.string().optional(),
  jsContent: z.string().optional(),
  sections: z.array(z.unknown()).optional().nullable(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  googleAdsConversionId: z.string().optional(),
  whatsappNumber: z.string().optional(),
  status: z.nativeEnum(LandingPageStatus).optional()
});

export const updateLandingPageSchema = createLandingPageSchema.partial();

export const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  fields: z.array(z.unknown()),
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional(),
  autoCreateLead: z.boolean().optional(),
  leadSource: z.string().optional(),
  leadTemperature: z.string().optional(),
  assignToUserId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional()
});

export const updateFormSchema = createFormSchema.partial();

export const trackViewSchema = z.object({
  slug: z.string(),
  sessionId: z.string(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional()
});

export const trackEngagementSchema = z.object({
  sessionId: z.string(),
  timeOnPage: z.number().optional(),
  scrollDepth: z.number().optional()
});
