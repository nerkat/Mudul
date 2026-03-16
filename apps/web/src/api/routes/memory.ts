import express from 'express';
import { PrismaAuthService } from '../services/prisma-auth';
import { getNode, getCallByNode, applyMemoryPatch, getClientMemory } from '../../core/repo';
import type { MemoryPatch } from '../../core/types';

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

/**
 * GET /api/client-memory/:clientId
 * Returns the current memory snapshot for a client.
 */
router.get('/:clientId', requireAuth, (req, res) => {
  const { orgId } = (req as any).user;
  const { clientId } = req.params;

  const clientNode = getNode(clientId);
  if (!clientNode || clientNode.orgId !== orgId || clientNode.kind !== 'lead') {
    return res.status(404).json({
      error: 'CLIENT_NOT_FOUND',
      message: 'Client not found or access denied',
    });
  }

  const memory = getClientMemory(clientId);
  if (!memory) {
    return res.json({
      clientId,
      memoryTags: [],
      decisionStyle: '',
      budgetSignals: '',
      timelineSignals: '',
      recurringRisks: [],
      keyPeople: [],
      briefingBullets: [],
      lastUpdatedAt: '',
    });
  }

  res.json(memory);
});

/**
 * POST /api/client-memory/update
 * Generates a memory patch from AI and merges it into the client's memory document.
 *
 * Body: { clientId: string, callAnalysisId?: string }
 */
router.post('/update', requireAuth, async (req, res) => {
  try {
    const { orgId } = (req as any).user;
    const { clientId, callAnalysisId } = req.body as { clientId?: unknown; callAnalysisId?: unknown };

    if (typeof clientId !== 'string' || !clientId) {
      return res.status(400).json({
        error: 'INVALID_CLIENT_ID',
        message: 'clientId is required',
      });
    }

    // Verify client belongs to the authenticated org
    const clientNode = getNode(clientId);
    if (!clientNode || clientNode.orgId !== orgId || clientNode.kind !== 'lead') {
      return res.status(404).json({
        error: 'CLIENT_NOT_FOUND',
        message: 'Client not found or access denied',
      });
    }

    // Load call analysis if provided
    const callAnalysis = typeof callAnalysisId === 'string' && callAnalysisId
      ? getCallByNode(callAnalysisId)
      : null;

    // Load existing memory
    const existingMemory = getClientMemory(clientId);

    // Generate memory patch via AI.
    // The AI endpoint lives in the Vite plugin layer (liveAi/mockAi), which registers
    // middleware on the same server but outside the Express app. Calling it via HTTP
    // keeps the routing consistent with how analysis works in useAnalyzeCall.
    const patchResponse = await fetch('/api/ai/generate-memory-patch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientName: clientNode.name,
        callAnalysis,
        existingMemory,
      }),
    });

    let patch: MemoryPatch;

    if (!patchResponse.ok) {
      // Fall back to an empty patch if AI is unavailable
      patch = {
        newTags: [],
        riskSignals: [],
        peopleUpdates: [],
        budgetSignal: null,
        timelineSignal: null,
        briefingUpdates: [],
      };
    } else {
      const patchData = await patchResponse.json();
      patch = patchData.patch ?? patchData;
    }

    // Apply patch and persist
    const updatedMemory = applyMemoryPatch(clientId, patch);
    res.json(updatedMemory);
  } catch (error) {
    console.error('Update client memory error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update client memory',
    });
  }
});

export { router as memoryRoutes };
