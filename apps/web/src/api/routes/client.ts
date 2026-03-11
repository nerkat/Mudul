import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { PrismaDataService } from '../services/prisma-data';
import { validateResponse, ClientSummarySchema, ClientCallsSchema, ActionItemsSchema } from '../middleware/validation';

const router = express.Router();

const CreateClientRequestSchema = {
  parse(body: unknown) {
    const value = body as { name?: unknown };
    const name = typeof value?.name === 'string' ? value.name.trim() : '';

    if (name.length < 2) {
      throw new Error('INVALID_CLIENT_NAME');
    }

    return { name };
  },
};

// Middleware to authenticate and get org context
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

  // Attach user info to request
  (req as any).user = userInfo;
  next();
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { name } = CreateClientRequestSchema.parse(req.body);
    const client = await PrismaDataService.createClient(orgId, name);
    res.status(201).json(client);
  } catch (error: any) {
    if (error.message === 'INVALID_CLIENT_NAME') {
      return res.status(400).json({
        error: 'INVALID_CLIENT_NAME',
        message: 'Client name must be at least 2 characters',
      });
    }

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'CLIENT_ALREADY_EXISTS',
        message: 'A client with that name already exists in this org',
      });
    }

    console.error('Create client error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create client',
    });
  }
});

// GET /api/clients/:id/summary
router.get('/:id/summary', requireAuth, validateResponse(ClientSummarySchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    
    const summary = await PrismaDataService.getClientSummary(clientId, orgId);
    res.json(summary);
  } catch (error: any) {
    console.error('Client summary error:', error);
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        error: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get client summary',
    });
  }
});

// GET /api/clients/:id/calls
router.get('/:id/calls', requireAuth, validateResponse(ClientCallsSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    
    // Validate and enforce limit bounds
    const rawLimit = req.query.limit as string | undefined;
    const limitParam = rawLimit === undefined ? 10 : Number.parseInt(rawLimit, 10);
    if (!Number.isFinite(limitParam) || limitParam < 1 || limitParam > 50) {
      return res.status(400).json({
        error: 'INVALID_LIMIT',
        message: 'Limit must be between 1 and 50',
      });
    }
    
    const calls = await PrismaDataService.getClientCalls(clientId, orgId, limitParam);
    res.json(calls);
  } catch (error: any) {
    console.error('Client calls error:', error);
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        error: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get client calls',
    });
  }
});

// GET /api/clients/:id/action-items
router.get('/:id/action-items', requireAuth, validateResponse(ActionItemsSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const status = req.query.status as 'open' | 'done' | undefined;
    
    const actionItems = await PrismaDataService.getClientActionItems(clientId, orgId, status);
    res.json(actionItems);
  } catch (error: any) {
    console.error('Client action items error:', error);
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        error: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get client action items',
    });
  }
});

export { router as clientRoutes };