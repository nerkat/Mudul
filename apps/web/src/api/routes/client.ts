import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { PrismaDataService } from '../services/prisma-data';
import { 
  validateResponse, 
  validateRequest,
  ClientSummarySchema, 
  ClientCallsSchema, 
  ActionItemsSchema,
  LogCallForm,
  NewActionItemForm,
  CreatedCallOutSchema,
  CreatedActionItemOutSchema
} from '../middleware/validation';
import { v4 as uuidv4 } from 'uuid';
import { clampQueryLimit, clampDuration, clampScore, clampBookingLikelihood } from '../schemas/constants';

const router = express.Router();

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

// GET /api/clients/:id/summary
router.get('/:id/summary', requireAuth, validateResponse(ClientSummarySchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const traceId = (req as any).traceId;
    
    const summary = await PrismaDataService.getClientSummary(clientId, orgId);
    res.json(summary);
  } catch (error: any) {
    console.error('Client summary error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get client summary',
      traceId
    });
  }
});

// GET /api/clients/:id/calls
router.get('/:id/calls', requireAuth, validateResponse(ClientCallsSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const traceId = (req as any).traceId;
    
    // Validate and enforce limit bounds (server-side clamping)
    const limitParam = parseInt(req.query.limit as string) || 10;
    const clampedLimit = clampQueryLimit(limitParam);
    
    if (limitParam !== clampedLimit) {
      return res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be between 1 and 50',
        details: { field: 'limit', provided: limitParam, clamped: clampedLimit },
        traceId
      });
    }
    
    const calls = await PrismaDataService.getClientCalls(clientId, orgId, clampedLimit);
    res.json(calls);
  } catch (error: any) {
    console.error('Client calls error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get client calls',
      traceId
    });
  }
});

// GET /api/clients/:id/action-items
router.get('/:id/action-items', requireAuth, validateResponse(ActionItemsSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { id: clientId } = req.params;
    const status = req.query.status as 'open' | 'done' | undefined;
    const traceId = (req as any).traceId;
    
    const actionItems = await PrismaDataService.getClientActionItems(clientId, orgId, status);
    res.json(actionItems);
  } catch (error: any) {
    console.error('Client action items error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get client action items',
      traceId
    });
  }
});

// POST /api/clients/:id/calls
router.post('/:id/calls', requireAuth, validateRequest(LogCallForm), validateResponse(CreatedCallOutSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user; // Server-derived orgId
    const { id: clientId } = req.params;
    const traceId = (req as any).traceId;
    
    // Strip any client-supplied orgId from body for IDOR prevention
    const { orgId: clientOrgId, clientId: clientClientId, ...callData } = req.body;
    
    // Server-side clamping of values to ensure safety
    const clampedData = {
      ...callData,
      durationSec: clampDuration(callData.durationSec),
      score: clampScore(callData.score),
      bookingLikelihood: clampBookingLikelihood(callData.bookingLikelihood)
    };
    
    const call = await PrismaDataService.createCall(clientId, orgId, clampedData);
    
    // Set Location header as per REST standards
    res.setHeader('Location', `/api/clients/${clientId}/calls/${call.id}`);
    res.status(201).json(call);
  } catch (error: any) {
    console.error('Create call error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create call',
      traceId
    });
  }
});

// POST /api/clients/:id/action-items
router.post('/:id/action-items', requireAuth, validateRequest(NewActionItemForm), validateResponse(CreatedActionItemOutSchema), async (req, res) => {
  try {
    const { orgId } = (req as any).user; // Server-derived orgId
    const { id: clientId } = req.params;
    const traceId = (req as any).traceId;
    
    // Strip any client-supplied orgId from body for IDOR prevention
    const { orgId: clientOrgId, clientId: clientClientId, ...actionItemData } = req.body;
    
    const actionItem = await PrismaDataService.createActionItem(clientId, orgId, actionItemData);
    
    // Set Location header as per REST standards
    res.setHeader('Location', `/api/clients/${clientId}/action-items/${actionItem.id}`);
    res.status(201).json(actionItem);
  } catch (error: any) {
    console.error('Create action item error:', error);
    const traceId = (req as any).traceId;
    
    if (error.message === 'CLIENT_NOT_FOUND') {
      return res.status(404).json({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
        traceId
      });
    }
    
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create action item',
      traceId
    });
  }
});

export { router as clientRoutes };