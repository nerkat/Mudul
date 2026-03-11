import express from 'express';
import { DatabaseHealthService } from '../services/database-health';

const router = express.Router();

// GET /api/health/healthz - Basic process health check
router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /api/health/readyz - Readiness check with database ping and migrations
router.get('/readyz', async (_req, res) => {
  try {
    const health = await DatabaseHealthService.checkReadiness();
    
    if (health.healthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: health.database,
        migrations: health.migrations,
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: health.database,
        migrations: health.migrations,
        errors: health.errors,
      });
    }
  } catch (error: any) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'HEALTH_CHECK_FAILED',
      message: 'Readiness check failed',
    });
  }
});

export { router as healthRoutes };