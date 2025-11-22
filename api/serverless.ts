import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simplified serverless handler without full app initialization
// This prevents cold start issues and static file plugin conflicts

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '/';
    
    // Handle root route and static HTML files
    if (url === '/' || url === '/index.html' || url.endsWith('.html')) {
      const fileName = url === '/' ? 'index.html' : url.replace(/^\//, '');
      
      // Try multiple paths for the HTML file
      const possiblePaths = [
        join(process.cwd(), 'dist', 'public', fileName),
        join(process.cwd(), 'public', fileName),
        join(__dirname, '..', 'dist', 'public', fileName),
        join(__dirname, '..', 'public', fileName),
        join(__dirname, 'public', fileName)
      ];
      
      for (const htmlPath of possiblePaths) {
        if (existsSync(htmlPath)) {
          const html = readFileSync(htmlPath, 'utf-8');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          res.status(200).send(html);
          return;
        }
      }
      
      // If no HTML file found, return 404
      res.status(404).json({ 
        error: 'Not Found',
        message: 'HTML file not found',
        paths: possiblePaths 
      });
      return;
    }
    
    // For API routes, try to use the built app
    try {
      const { buildApp } = await import('../dist/app');
      
      // Lazy load and cache the app instance
      if (!(global as any).fastifyApp) {
        (global as any).fastifyApp = await buildApp();
        await (global as any).fastifyApp.ready();
        console.log('Fastify app initialized');
      }
      
      const fastify = (global as any).fastifyApp;
      
      // Use Fastify's inject to handle the request
      const response = await fastify.inject({
        method: req.method || 'GET',
        url: url,
        headers: req.headers as any,
        payload: req.body,
        query: req.query as any
      });
      
      // Set response headers
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      // Set status code and send response
      res.status(response.statusCode).send(response.payload);
      
    } catch (appError) {
      console.error('Error loading/using Fastify app:', appError);
      
      // Fallback: return basic error
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to initialize application',
        details: appError instanceof Error ? appError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}
