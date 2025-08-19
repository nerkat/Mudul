import type { Plugin } from 'vite';
import express from 'express';
import { authRoutes } from './routes/auth';
import { orgRoutes } from './routes/org';
import { clientRoutes } from './routes/client';

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
      app.get('/test', (req, res) => {
        res.json({ message: 'API is working!' });
      });

      // Routes
      app.use('/auth', authRoutes);
      app.use('/org', orgRoutes);
      app.use('/clients', clientRoutes);

      // Error handling
      app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('API Error:', err);
        res.status(500).json({ 
          error: 'Internal server error',
          message: err.message 
        });
      });

      // Mount API under Vite server
      server.middlewares.use('/api', app);
    },
  };
}