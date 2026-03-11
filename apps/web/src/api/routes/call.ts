import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { PrismaDataService } from '../services/prisma-data';

const router = express.Router();

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.substring(7);
  const userInfo = PrismaAuthService.getUserFromToken(token);
  if (!userInfo) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired access token',
    });
  }

  (req as any).user = userInfo;
  next();
}

function parseCreateCallBody(body: unknown) {
  const value = body as {
    clientId?: unknown;
    title?: unknown;
    transcript?: unknown;
    analysis?: unknown;
    meta?: unknown;
  };

  const clientId = typeof value?.clientId === 'string' ? value.clientId : '';
  const title = typeof value?.title === 'string' ? value.title.trim() : '';
  const transcript = typeof value?.transcript === 'string' ? value.transcript.trim() : '';
  const analysis = typeof value?.analysis === 'object' && value.analysis !== null ? value.analysis as Record<string, unknown> : null;
  const meta = typeof value?.meta === 'object' && value.meta !== null ? value.meta as Record<string, unknown> : undefined;

  if (!clientId) {
    throw new Error('INVALID_CLIENT_ID');
  }

  if (title.length < 2) {
    throw new Error('INVALID_TITLE');
  }

  if (transcript.length < 20) {
    throw new Error('INVALID_TRANSCRIPT');
  }

  if (!analysis) {
    throw new Error('INVALID_ANALYSIS');
  }

  return { clientId, title, transcript, analysis, meta };
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const payload = parseCreateCallBody(req.body);
    const created = await PrismaDataService.createCall(orgId, payload);
    res.status(201).json(created);
  } catch (error: any) {
    if (error.message === 'INVALID_CLIENT_ID' || error.message === 'INVALID_TITLE' || error.message === 'INVALID_TRANSCRIPT' || error.message === 'INVALID_ANALYSIS') {
      return res.status(400).json({
        error: error.message,
        message: 'Call payload is invalid',
      });
    }

    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        error: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
      });
    }

    console.error('Create call error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create call',
    });
  }
});

export { router as callRoutes };
