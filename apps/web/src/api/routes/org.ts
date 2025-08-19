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

// GET /api/org/summary
router.get('/summary', requireAuth, (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const summary = MockDataService.getOrgSummary(orgId);
    res.json(summary);
  } catch (error: any) {
    console.error('Org summary error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get organization summary',
    });
  }
});

// GET /api/org/clients-overview
router.get('/clients-overview', requireAuth, (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const overview = MockDataService.getClientsOverview(orgId);
    res.json(overview);
  } catch (error: any) {
    console.error('Clients overview error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get clients overview',
    });
  }
});

export { router as orgRoutes };