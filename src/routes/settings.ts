import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'path';
import fs from 'fs/promises';

type AppSettings = {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    gradientPrimary?: string;
    darkMode: boolean;
  };
  branding: {
    appName: string;
    logoUrl?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
};

function getDataFilePath(currentDir: string) {
  // Resolve to project/data/app-settings.json regardless of build layout
  const projectRoot = path.join(currentDir, '..');
  const dataDir = path.join(projectRoot, 'data');
  const filePath = path.join(dataDir, 'app-settings.json');
  return { dataDir, filePath };
}

async function ensureDefaults(filePath: string, dataDir: string): Promise<AppSettings> {
  const defaults: AppSettings = {
    theme: {
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      darkMode: false,
    },
    branding: {
      appName: 'Krav Maga Academy',
      logoUrl: null,
      contactEmail: null,
      contactPhone: null,
    },
  };

  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(filePath).catch(async () => {
      await fs.writeFile(filePath, JSON.stringify(defaults, null, 2), 'utf-8');
    });
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content || '{}') || defaults;
  } catch {
    return defaults;
  }
}

export default async function settingsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  const { dataDir, filePath } = getDataFilePath(__dirname);

  // GET /api/settings
  fastify.get('/', async (_req, reply) => {
    try {
      const settings = await ensureDefaults(filePath, dataDir);
      return { success: true, data: settings };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to load settings' };
    }
  });

  // PUT /api/settings
  fastify.put('/', async (request, reply) => {
    try {
      const body = request.body as Partial<AppSettings> | undefined;
      if (!body || typeof body !== 'object') {
        reply.code(400);
        return { success: false, error: 'Invalid settings payload' };
      }

      const current = await ensureDefaults(filePath, dataDir);
      const next: AppSettings = {
        theme: {
          primaryColor: body.theme?.primaryColor || current.theme.primaryColor,
          secondaryColor: body.theme?.secondaryColor || current.theme.secondaryColor,
          gradientPrimary:
            body.theme?.gradientPrimary ||
            current.theme.gradientPrimary ||
            `linear-gradient(135deg, ${body.theme?.primaryColor || current.theme.primaryColor} 0%, ${body.theme?.secondaryColor || current.theme.secondaryColor} 100%)`,
          darkMode: typeof body.theme?.darkMode === 'boolean' ? body.theme.darkMode : current.theme.darkMode,
        },
        branding: {
          appName: body.branding?.appName || current.branding.appName,
          logoUrl: body.branding?.logoUrl ?? current.branding.logoUrl ?? null,
          contactEmail: body.branding?.contactEmail ?? current.branding.contactEmail ?? null,
          contactPhone: body.branding?.contactPhone ?? current.branding.contactPhone ?? null,
        },
      };

      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(next, null, 2), 'utf-8');
      return { success: true, data: next };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to save settings' };
    }
  });
}
