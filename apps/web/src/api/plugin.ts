import type { Plugin } from 'vite';
import express from 'express';
import { authRoutes } from './routes/auth';
import { orgRoutes } from './routes/org';
import { clientRoutes } from './routes/client';
import { callRoutes } from './routes/call';
import { healthRoutes } from './routes/health';

export function apiPlugin(): Plugin {
  let app: express.Application;

  return {
    name: 'api-plugin',
    configureServer(server) {
      app = express();
      
      // Middleware
      app.use(express.json());
      
      // CORS for development
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        next();
      });

      // Test route
      app.get('/test', (_req, res) => {
        res.json({ message: 'API is working!' });
      });

      // Routes
      app.use('/health', healthRoutes);
      app.use('/auth', authRoutes);
      app.use('/org', orgRoutes);
      app.use('/clients', clientRoutes);
      app.use('/calls', callRoutes);

      // Error handling
      app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        // Avoid logging raw error objects directly (Node v24 has an inspect edge-case
        // that can crash the process for some error shapes). Log a safe string shape.
        const safeErr = err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : { message: typeof err === 'string' ? err : 'Unknown error', details: String(err) };
        console.error('API Error:', safeErr);
        
        // Generate trace ID for debugging
        const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Handle specific error types
        if (err.name === 'ValidationError') {
          return res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            traceId,
            details: err.details,
          });
        }
        
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({
            error: 'CONSTRAINT_VIOLATION',
            message: 'Unique constraint violation',
            traceId,
          });
        }
        
        // Default server error
        res.status(500).json({ 
          error: 'INTERNAL_ERROR',
          message: 'Internal server error',
          traceId,
        });
      });

      // Mount API under Vite server
      server.middlewares.use('/api', app);
    },
  };
}