import { nodes, calls } from "./seed";
import { DashboardTemplates } from "./registry-json";
import type { NodeBase, SalesCallMinimal } from "./types";
import type { DashboardTemplate } from "./widgets/protocol";

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

/**
 * Update a call record with analysis data from AI
 */
export function upsertCall(nodeId: string, patch: Partial<SalesCallMinimal>): void {
  const existing = calls[nodeId] || {};
  calls[nodeId] = { ...existing, ...patch };
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