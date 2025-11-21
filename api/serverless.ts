import { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../dist/app';

let app: any = null;

async function getApp() {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastify = await getApp();
    
    // Convert Vercel request to Node.js request format
    await fastify.inject({
      method: req.method || 'GET',
      url: req.url || '/',
      headers: req.headers as any,
      payload: req.body,
      query: req.query as any
    }).then((response: any) => {
      // Set response headers
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      // Set status code
      res.status(response.statusCode);
      
      // Send response body
      res.send(response.payload);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
