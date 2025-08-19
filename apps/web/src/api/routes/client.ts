import express from 'express';
import { MockAuthService } from '../services/auth';
import { MockDataService } from '../services/data';

const router = express.Router();

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
  const userInfo = MockAuthService.getUserFromToken(token);
  
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

// GET /api/clients/:id/summary
router.get('/:id/summary', requireAuth, (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    
    const summary = MockDataService.getClientSummary(clientId, orgId);
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
router.get('/:id/calls', requireAuth, (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const calls = MockDataService.getClientCalls(clientId, orgId, limit);
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
router.get('/:id/action-items', requireAuth, (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const status = req.query.status as 'open' | 'done' | undefined;
    
    const actionItems = MockDataService.getClientActionItems(clientId, orgId, status);
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