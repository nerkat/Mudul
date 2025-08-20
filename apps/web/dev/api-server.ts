/**
 * Development API server (runs separately from Vite) so that
 * backend routes with native deps (sqlite3) don't interfere with Vite config loading.
 */
import express from 'express';
import { authRoutes } from '../src/api/routes/auth';
import { orgRoutes } from '../src/api/routes/org';
import { clientRoutes } from '../src/api/routes/client';
import { healthRoutes } from '../src/api/routes/health';

const PORT = Number(process.env.API_PORT || 3001);

async function main() {
  const app = express();
  app.use(express.json());

  // Mount routes under /api (mirror production expectation)
  app.use('/api/health', healthRoutes); // health routes already router
  app.use('/api/auth', authRoutes);
  app.use('/api/org', orgRoutes);
  app.use('/api/clients', clientRoutes);

  app.get('/api/_dev/ping', (_req, res) => res.json({ ok: true }));

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[dev-api] Error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Dev API error' });
  });

  app.listen(PORT, () => {
    console.log(`[dev-api] listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('[dev-api] Fatal startup error', e);
  process.exit(1);
});
