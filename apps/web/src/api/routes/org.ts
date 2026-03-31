import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { PrismaDataService } from '../services/prisma-data';
import { validateResponse, OrgSummarySchema, ClientsOverviewSchema } from '../middleware/validation';

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

// GET /api/org/summary
router.get('/summary', requireAuth, validateResponse(OrgSummarySchema), async (req, res) => {
  try {
    const { orgId, userId } = (req as any).user;
    await PrismaAuthService.ensureOrgHasSeedData(userId, orgId);
    const summary = await PrismaDataService.getOrgSummary(orgId);
    res.json(summary);
  } catch (error: any) {
    console.error('Org summary error:', error);
    
    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        error: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get organization summary',
    });
  }
});

router.get('/tree', requireAuth, async (req, res) => {
  try {
    const { orgId, userId } = (req as any).user;
    await PrismaAuthService.ensureOrgHasSeedData(userId, orgId);
    const tree = await PrismaDataService.getOrgTree(orgId);
    res.json(tree);
  } catch (error: any) {
    console.error('Org tree error:', error);

    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        error: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get organization tree',
    });
  }
});

// GET /api/org/clients-overview
router.get('/clients-overview', requireAuth, validateResponse(ClientsOverviewSchema), async (req, res) => {
  try {
    const { orgId, userId } = (req as any).user;
    await PrismaAuthService.ensureOrgHasSeedData(userId, orgId);
    const overview = await PrismaDataService.getClientsOverview(orgId);
    res.json(overview);
  } catch (error: any) {
    console.error('Clients overview error:', error);
    
    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        error: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get clients overview',
    });
  }
});

export { router as orgRoutes };