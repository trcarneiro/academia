import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Simplified serverless handler without full app initialization
// This prevents cold start issues and static file plugin conflicts

// MIME type mapping for static files
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = req.url || '/';
    
    // Handle static files (HTML, CSS, JS, images, fonts)
    const isStaticFile = url === '/' || 
                        url === '/index.html' || 
                        url.endsWith('.html') ||
                        url.endsWith('.css') ||
                        url.endsWith('.js') ||
                        url.endsWith('.png') ||
                        url.endsWith('.jpg') ||
                        url.endsWith('.jpeg') ||
                        url.endsWith('.gif') ||
                        url.endsWith('.svg') ||
                        url.endsWith('.ico') ||
                        url.endsWith('.woff') ||
                        url.endsWith('.woff2') ||
                        url.endsWith('.ttf') ||
                        url.endsWith('.eot');
    
    if (isStaticFile) {
      const fileName = url === '/' ? 'index.html' : url.replace(/^\//, '');
      
      // Try multiple paths for static files
      const possiblePaths = [
        join(process.cwd(), 'dist', 'public', fileName),
        join(process.cwd(), 'public', fileName),
        join(__dirname, '..', 'dist', 'public', fileName),
        join(__dirname, '..', 'public', fileName),
        join(__dirname, 'public', fileName)
      ];
      
      for (const filePath of possiblePaths) {
        if (existsSync(filePath)) {
          const fileContent = readFileSync(filePath);
          const mimeType = getMimeType(filePath);
          
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.status(200).send(fileContent);
          return;
        }
      }
      
      // If no file found, return 404
      res.status(404).json({ 
        error: 'Not Found',
        message: 'Static file not found',
        requestedFile: fileName
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
      
      // Clear cached app on error so next request can retry
      delete (global as any).fastifyApp;
      
      // Return detailed error for debugging
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to initialize application',
        details: appError instanceof Error ? appError.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && appError instanceof Error ? appError.stack : undefined
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
