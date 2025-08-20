import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { PrismaDataService } from '../services/prisma-data';
import { 
  validateResponse, 
  validateRequest,
  OrgSummarySchema, 
  ClientsOverviewSchema,
  NewClientForm,
  CreatedClientOutSchema
} from '../middleware/validation';
import { writeRateLimit, idempotencyMiddleware, requestIdMiddleware } from '../middleware/security';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Apply security middleware to all routes
router.use(requestIdMiddleware);
router.use(writeRateLimit);

// Middleware to authenticate and get org context
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid authorization header',
      traceId: uuidv4()
    });
  }

  const token = authHeader.substring(7);
  const userInfo = PrismaAuthService.getUserFromToken(token);
  
  if (!userInfo) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token',
      traceId: uuidv4()
    });
  }

  // Attach user info to request - orgId is server-derived, not client-supplied
  (req as any).user = userInfo;
  (req as any).traceId = uuidv4();
  next();
}

// GET /api/org/summary
router.get('/summary', requireAuth, validateResponse(OrgSummarySchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const traceId = (req as any).traceId;
    const summary = await PrismaDataService.getOrgSummary(orgId);
    res.json(summary);
  } catch (error: any) {
    console.error('Org summary error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        code: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get organization summary',
      traceId
    });
  }
});

// GET /api/org/clients-overview
router.get('/clients-overview', requireAuth, validateResponse(ClientsOverviewSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const traceId = (req as any).traceId;
    const overview = await PrismaDataService.getClientsOverview(orgId);
    res.json(overview);
  } catch (error: any) {
    console.error('Clients overview error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        code: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get clients overview',
      traceId
    });
  }
});

// POST /api/org/clients
router.post('/clients', requireAuth, idempotencyMiddleware, validateRequest(NewClientForm), validateResponse(CreatedClientOutSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user; // Server-derived orgId, not client-supplied
    const traceId = (req as any).traceId;
    
    // Strip any client-supplied orgId from body for IDOR prevention
    const { orgId: clientOrgId, ...clientData } = req.body;
    
    const client = await PrismaDataService.createClient(orgId, clientData);
    
    // Set Location header as per REST standards
    res.setHeader('Location', `/api/clients/${client.id}`);
    res.status(201).json(client);
  } catch (error: any) {
    console.error('Create client error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'ORG_NOT_FOUND') {
      return res.status(404).json({
        code: 'ORG_NOT_FOUND',
        message: 'Organization not found or access denied',
        traceId
      });
    }
    
    if (error.message === 'CLIENT_NAME_EXISTS') {
      return res.status(409).json({
        code: 'CLIENT_NAME_EXISTS',
        message: 'A client with this name already exists',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create client',
      traceId
    });
  }
});

export { router as orgRoutes };