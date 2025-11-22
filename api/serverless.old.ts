// Vercel Serverless Function wrapper for Fastify
import { fastify as createFastify } from 'fastify';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Import your Fastify app configuration
// Note: This is a simplified version. You may need to adjust based on your server.ts setup
let app: any = null;

async function getApp() {
  if (app) return app;
  
  app = createFastify({
    logger: true,
    trustProxy: true
  });

  // Register your routes and plugins here
  // Import and register routes from your server.ts
  // For now, this is a minimal setup
  
  await app.ready();
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    await app.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers as any,
      payload: req.body
    }).then((response) => {
      res.status(response.statusCode);
      Object.keys(response.headers).forEach((key) => {
        res.setHeader(key, response.headers[key]);
      });
      res.send(response.payload);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
