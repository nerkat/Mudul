import { nodes, calls } from "./seed";
import { DashboardTemplates } from "./registry-json";
import type { NodeBase, SalesCallMinimal } from "./types";
import type { DashboardTemplate } from "./widgets/protocol";
import { isAnalysisDuplicate } from "../services/versioning";
import type { OptimisticCall, OptimisticActionItem } from "../services/crudApi";

export function getRoot(): NodeBase | null {
  return nodes["root"] || null;
}

export function getNode(id: string): NodeBase | null {
  return nodes[id] || null;
}

export function getChildren(parentId: string): NodeBase[] {
  return Object.values(nodes).filter(node => node.parentId === parentId);
}

export function getCallByNode(nodeId: string): SalesCallMinimal | null {
  return calls[nodeId] || null;
}

export function listCallsByClient(clientId: string): NodeBase[] {
  return Object.values(nodes).filter(node => 
    node.parentId === clientId && node.kind === "call_session"
  );
}

export function getDashboardId(nodeId: string): string | null {
  const node = getNode(nodeId);
  return node?.dashboardId || null;
}

export function getAllClients(): NodeBase[] {
  return Object.values(nodes).filter(node => 
    node.parentId === "root" && node.kind === "lead"
  );
}

export function getAllCalls(): NodeBase[] {
  return Object.values(nodes).filter(node => node.kind === "call_session");
}

// ----- Optimistic Updates -----

// Storage for optimistic data that hasn't been persisted yet
const optimisticCalls = new Map<string, { nodeData: NodeBase; callData: SalesCallMinimal }>();
const optimisticActionItems = new Map<string, { clientId: string; actionItem: OptimisticActionItem }>();

// Function to add optimistic call
export function addOptimisticCall(clientId: string, optimisticCall: OptimisticCall): void {
  const nodeData: NodeBase = {
    id: optimisticCall.id,
    name: optimisticCall.name,
    kind: "call_session",
    parentId: clientId,
    dashboardId: "sales-call-default",
    createdAt: optimisticCall.date,
    updatedAt: optimisticCall.date
  };

  const callData: SalesCallMinimal = {
    id: optimisticCall.id,
    sentiment: {
      overall: optimisticCall.sentiment,
      score: optimisticCall.score
    },
    bookingLikelihood: optimisticCall.bookingLikelihood,
    actionItems: [],
    keyMoments: [],
    objections: []
  };

  optimisticCalls.set(optimisticCall.id, { nodeData, callData });
}

// Function to replace optimistic call with real data
export function replaceOptimisticCall(tempId: string, realCall: { id: string; [key: string]: any }): void {
  const optimistic = optimisticCalls.get(tempId);
  if (optimistic) {
    // Remove optimistic version
    optimisticCalls.delete(tempId);
    
    // Add real call to permanent storage
    const realNodeData: NodeBase = {
      ...optimistic.nodeData,
      id: realCall.id,
      createdAt: realCall.createdAt || optimistic.nodeData.createdAt,
      updatedAt: realCall.updatedAt || optimistic.nodeData.updatedAt
    };
    
    const realCallData: SalesCallMinimal = {
      ...optimistic.callData,
      id: realCall.id,
      sentiment: realCall.sentiment ? {
        overall: realCall.sentiment,
        score: realCall.score || optimistic.callData.sentiment?.score || 0
      } : optimistic.callData.sentiment,
      bookingLikelihood: realCall.bookingLikelihood ?? optimistic.callData.bookingLikelihood
    };
    
    nodes[realCall.id] = realNodeData;
    calls[realCall.id] = realCallData;
  }
}

// Function to remove optimistic call (on error)
export function removeOptimisticCall(tempId: string): void {
  optimisticCalls.delete(tempId);
}

// Function to add optimistic action item
export function addOptimisticActionItem(clientId: string, actionItem: OptimisticActionItem): void {
  optimisticActionItems.set(actionItem.id, { clientId, actionItem });
}

// Function to replace optimistic action item with real data
export function replaceOptimisticActionItem(tempId: string, realActionItem: { id: string; [key: string]: any }): void {
  const optimistic = optimisticActionItems.get(tempId);
  if (optimistic) {
    optimisticActionItems.delete(tempId);
    
    // Find the most recent call for this client to attach the action item
    const clientCalls = listCallsByClient(optimistic.clientId);
    const latestCall = clientCalls.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    
    if (latestCall) {
      const callData = calls[latestCall.id];
      if (callData) {
        callData.actionItems = callData.actionItems || [];
        callData.actionItems.push({
          text: realActionItem.text || optimistic.actionItem.text,
          owner: realActionItem.ownerName || optimistic.actionItem.ownerName || '',
          due: realActionItem.due || optimistic.actionItem.due
        });
      }
    }
  }
}

// Function to remove optimistic action item (on error)
export function removeOptimisticActionItem(tempId: string): void {
  optimisticActionItems.delete(tempId);
}

// Modified functions to include optimistic data
export function getAllCallsWithOptimistic(): NodeBase[] {
  const realCalls = getAllCalls();
  const optimisticCallNodes = Array.from(optimisticCalls.values()).map(({ nodeData }) => nodeData);
  return [...realCalls, ...optimisticCallNodes];
}

export function listCallsByClientWithOptimistic(clientId: string): NodeBase[] {
  const realCalls = listCallsByClient(clientId);
  const optimisticCallNodes = Array.from(optimisticCalls.values())
    .filter(({ nodeData }) => nodeData.parentId === clientId)
    .map(({ nodeData }) => nodeData);
  return [...realCalls, ...optimisticCallNodes];
}

export function getCallByNodeWithOptimistic(nodeId: string): SalesCallMinimal | null {
  // Check optimistic data first
  const optimistic = optimisticCalls.get(nodeId);
  if (optimistic) {
    return optimistic.callData;
  }
  
  // Merge optimistic action items into existing calls
  const realCall = getCallByNode(nodeId);
  if (realCall) {
    const optimisticActions = Array.from(optimisticActionItems.values())
      .filter(({ clientId }) => {
        // Find if this call belongs to the client with optimistic action items
        const callNode = getNode(nodeId);
        return callNode?.parentId === clientId;
      })
      .map(({ actionItem }) => ({
        text: actionItem.text,
        owner: actionItem.ownerName || '',
        due: actionItem.due
      }));
    
    if (optimisticActions.length > 0) {
      return {
        ...realCall,
        actionItems: [...(realCall.actionItems || []), ...optimisticActions]
      };
    }
  }
  
  return realCall;
}

// ----- Mutation methods for AI analysis -----

export interface UpsertCallResult {
  updated: boolean;
  isDuplicate: boolean;
  reason?: string;
}

/**
 * Update a call record with analysis data from AI.
 * Safely merges only provided fields, preserving existing data.
 * Returns information about whether update was performed and why.
 */
export function upsertCall(nodeId: string, patch: Partial<SalesCallMinimal>): UpsertCallResult {
  const existing = calls[nodeId] || {};
  
  // Check for duplicate analysis using content hash
  if (patch.meta?.contentHash) {
    const isDuplicate = isAnalysisDuplicate(
      existing as any, // Type assertion since we added meta to SalesCallMinimal
      patch.meta.contentHash,
      patch.meta.schemaVersion
    );
    
    if (isDuplicate) {
      return {
        updated: false,
        isDuplicate: true,
        reason: 'Analysis already exists for this content and schema version'
      };
    }
  }

  // Perform safe merge - only overwrite fields that are explicitly provided
  // and not undefined/null, preserving existing optional fields
  const merged: SalesCallMinimal = { ...existing };
  
  // Merge top-level fields - only overwrite if value is not undefined AND not null
  Object.entries(patch).forEach(([key, value]) => {
    if (key === 'meta') {
      // Special handling for meta field - merge metadata
      merged.meta = {
        ...existing.meta,
        ...patch.meta,
        updatedAt: new Date().toISOString()
      };
    } else if (value !== undefined && value !== null) {
      // Only override if the new value is explicitly provided and not null
      if (key === 'sentiment' && typeof value === 'object') {
        // Deep merge for sentiment object
        merged.sentiment = { ...existing.sentiment, ...(value as any) };
      } else if (key === 'entities' && typeof value === 'object') {
        // Deep merge for entities object
        merged.entities = { ...existing.entities, ...(value as any) };
      } else {
        (merged as any)[key] = value;
      }
    }
  });
  
  calls[nodeId] = merged;
  
  return {
    updated: true,
    isDuplicate: false,
    reason: 'Call data merged successfully'
  };
}

/**
 * Set/override dashboard template for a node (optional AI dashboard layout)
 */
export function setDashboard(nodeId: string, template: DashboardTemplate): void {
  // For now, store in the global templates registry with a node-specific key
  // In a real implementation, this would likely go to a database
  const templateKey = `ai-generated-${nodeId}`;
  DashboardTemplates[templateKey] = template;
  
  // Update the node to reference the new dashboard
  const node = nodes[nodeId];
  if (node) {
    node.dashboardId = templateKey;
    node.updatedAt = new Date().toISOString();
  }
}

/**
 * Check if analysis exists for given content hash (for idempotency)
 */
export function hasExistingAnalysis(
  nodeId: string, 
  contentHash: string, 
  schemaVersion?: string
): boolean {
  const existing = calls[nodeId];
  if (!existing) return false;
  
  return isAnalysisDuplicate(existing as any, contentHash, schemaVersion);
}

// ----- Call creation and lifecycle management -----

/**
 * Create a new call node under the specified client.
 * Returns the new node ID.
 */
export function createCallNode({ clientId, title }: { clientId: string; title: string }): string {
  const now = new Date().toISOString();
  const nodeId = `call-${clientId}-${Date.now()}`;
  
  // Create the node
  nodes[nodeId] = {
    id: nodeId,
    orgId: "acme",
    parentId: clientId,
    kind: "call_session",
    name: title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    dashboardId: "sales-call-default",
    dataRef: { type: "session", id: `session-${nodeId}` },
    createdAt: now,
    updatedAt: now
  };
  
  // Create an empty call record
  calls[nodeId] = {
    id: nodeId,
    transcript: "",
    summary: "",
    sentiment: { overall: "neutral", score: 0 },
    bookingLikelihood: 0,
    objections: [],
    actionItems: [],
    keyMoments: [],
    entities: { prospect: [], people: [], products: [] },
    complianceFlags: []
  };
  
  return nodeId;
}

/**
 * Delete a node and its associated call data.
 * Used for rollback when call creation fails.
 */
export function deleteNode(nodeId: string): void {
  delete nodes[nodeId];
  delete calls[nodeId];
}

/**
 * Mark a node as active (no-op for now, but could be used for draft state).
 * In a full implementation, this might update a status field.
 */
export function markNodeActive(nodeId: string): void {
  const node = nodes[nodeId];
  if (node) {
    node.updatedAt = new Date().toISOString();
  }
}