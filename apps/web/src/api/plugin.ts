import type { Plugin } from 'vite';
import express from 'express';
import { authRoutes } from './routes/auth';
import { orgRoutes } from './routes/org';
import { clientRoutes } from './routes/client';
import { healthRoutes } from './routes/health';
import { corsMiddleware, generalRateLimit } from './middleware/security';

export function apiPlugin(): Plugin {
  let app: express.Application;

  return {
    name: 'api-plugin',
    configureServer(server) {
      app = express();
      
      // Middleware
      app.use(express.json());
      
      // Security middleware
      app.use(corsMiddleware);
      app.use(generalRateLimit);

      // Test route
      app.get('/test', (_req, res) => {
        res.json({ message: 'API is working!' });
      });

      // Routes
      app.use('/health', healthRoutes);
      app.use('/auth', authRoutes);
      app.use('/org', orgRoutes);
      app.use('/clients', clientRoutes);

      // Error handling
      app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('API Error:', err);
        
        // Use existing trace ID or generate new one
        const traceId = (req as any).traceId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Handle CORS errors
        if (err.message && err.message.includes('CORS policy')) {
          return res.status(403).json({
            code: 'CORS_ERROR',
            message: 'Origin not allowed by CORS policy',
            traceId,
          });
        }
        
        // Handle rate limiting errors
        if (err.status === 429) {
          return res.status(429).json({
            code: 'RATE_LIMIT_EXCEEDED',
            message: err.message || 'Too many requests',
            traceId,
          });
        }
        
        // Handle specific error types
        if (err.name === 'ValidationError') {
          return res.status(422).json({
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            traceId,
            details: err.details,
          });
        }
        
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({
            code: 'CONSTRAINT_VIOLATION',
            message: 'Unique constraint violation',
            traceId,
          });
        }
        
        // Default server error
        res.status(500).json({ 
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          traceId,
        });
      });

      // Mount API under Vite server
      server.middlewares.use('/api', app);
    },
  };
}