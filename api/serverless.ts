import { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../dist/app';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
    const url = req.url || '/';
    
    // Handle root route - serve index.html
    if (url === '/' || url === '/index.html') {
      const indexPath = join(__dirname, '..', 'dist', 'public', 'index.html');
      const indexPathAlt = join(__dirname, '..', 'public', 'index.html');
      
      const htmlPath = existsSync(indexPath) ? indexPath : indexPathAlt;
      
      if (existsSync(htmlPath)) {
        const html = readFileSync(htmlPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
        return;
      }
    }
    
    const fastify = await getApp();
    
    // Convert Vercel request to Node.js request format
    await fastify.inject({
      method: req.method || 'GET',
      url: url,
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
