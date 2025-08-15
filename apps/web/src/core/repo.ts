import { nodes, calls } from "./seed";
import { DashboardTemplates } from "./registry-json";
import type { NodeBase, SalesCallMinimal } from "./types";
import type { DashboardTemplate } from "./widgets/protocol";
import { isAnalysisDuplicate } from "../services/versioning";

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
  
  // Merge top-level fields
  Object.entries(patch).forEach(([key, value]) => {
    if (key === 'meta') {
      // Special handling for meta field - merge metadata
      merged.meta = {
        ...existing.meta,
        ...patch.meta,
        updatedAt: new Date().toISOString()
      };
    } else if (value !== undefined) {
      // Only override if the new value is explicitly provided
      (merged as any)[key] = value;
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