import { nodes, calls, clientMemories } from "./seed";
import { DashboardTemplates } from "./registry-json";
import type { NodeBase, SalesCallMinimal, ClientMemory, MemoryPatch } from "./types";
import type { DashboardTemplate } from "./widgets/protocol";
import { isAnalysisDuplicate } from "../services/versioning";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

function buildRootId(orgId: string): string {
  return orgId === nodes["root"]?.orgId ? "root" : `root-${orgId}`;
}

export function getRoot(orgId?: string): NodeBase | null {
  if (!orgId) {
    return nodes["root"] || null;
  }

  return Object.values(nodes).find(node =>
    node.orgId === orgId && node.parentId === null && node.kind === "group"
  ) || null;
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

export function getAllClients(orgId?: string): NodeBase[] {
  if (!orgId) {
    return Object.values(nodes).filter(node => node.kind === "lead");
  }

  const root = getRoot(orgId);
  if (!root) {
    return [];
  }

  return Object.values(nodes).filter(node =>
    node.parentId === root.id && node.kind === "lead"
  );
}

export function getAllCalls(): NodeBase[] {
  return Object.values(nodes).filter(node => node.kind === "call_session");
}

export function ensureOrgRoot(orgId: string, orgName: string, createdAt?: string): NodeBase {
  const existingRoot = getRoot(orgId);
  if (existingRoot) {
    return existingRoot;
  }

  const timestamp = createdAt || new Date().toISOString();
  const rootId = buildRootId(orgId);
  const rootNode: NodeBase = {
    id: rootId,
    orgId,
    parentId: null,
    kind: "group",
    name: orgName,
    slug: slugify(orgName),
    dashboardId: "org-dashboard",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  nodes[rootId] = rootNode;
  return rootNode;
}

export function createClientNode({
  orgId,
  orgName,
  clientName,
}: {
  orgId: string;
  orgName: string;
  clientName: string;
}): string {
  const root = ensureOrgRoot(orgId, orgName);
  const timestamp = new Date().toISOString();
  const clientId = `client-${orgId}-${Date.now()}`;

  nodes[clientId] = {
    id: clientId,
    orgId,
    parentId: root.id,
    kind: "lead",
    name: clientName,
    slug: slugify(clientName),
    dashboardId: "client-dashboard",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return clientId;
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
  const parentNode = getNode(clientId);
  const orgId = parentNode?.orgId ?? getRoot()?.orgId ?? 'acme-sales-org';
  
  // Create the node
  nodes[nodeId] = {
    id: nodeId,
    orgId,
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

// ----- Client Memory operations -----

/**
 * Retrieve the current memory snapshot for a client.
 */
export function getClientMemory(clientId: string): ClientMemory | null {
  return clientMemories[clientId] || null;
}

/**
 * Persist (or replace) a client memory document.
 */
export function saveClientMemory(memory: ClientMemory): void {
  clientMemories[memory.clientId] = {
    ...memory,
    lastUpdatedAt: new Date().toISOString(),
  };
}

const MAX_BRIEFING_BULLETS = 8;

/**
 * Merge a MemoryPatch into the existing ClientMemory for a client.
 * Creates a new memory document if none exists yet.
 * Returns the updated memory.
 */
export function applyMemoryPatch(clientId: string, patch: MemoryPatch): ClientMemory {
  const existing: ClientMemory = clientMemories[clientId] ?? {
    clientId,
    memoryTags: [],
    decisionStyle: "",
    budgetSignals: "",
    timelineSignals: "",
    recurringRisks: [],
    keyPeople: [],
    briefingBullets: [],
    lastUpdatedAt: new Date().toISOString(),
  };

  // Merge tags — deduplicate
  const tagSet = new Set(existing.memoryTags);
  for (const tag of patch.newTags ?? []) {
    tagSet.add(tag);
  }

  // Merge risks — deduplicate
  const riskSet = new Set(existing.recurringRisks);
  for (const risk of patch.riskSignals ?? []) {
    riskSet.add(risk);
  }

  // Merge people — update by name, avoid duplicates
  const peopleMap = new Map(existing.keyPeople.map((p) => [p.name, { ...p }]));
  for (const update of patch.peopleUpdates ?? []) {
    const existing = peopleMap.get(update.name);
    if (existing) {
      if (update.role !== null) existing.role = update.role;
      if (update.notes !== null) existing.notes = update.notes;
    } else {
      peopleMap.set(update.name, { ...update });
    }
  }

  // Budget / timeline signals — replace if patch provides a value
  const budgetSignals = patch.budgetSignal !== null && patch.budgetSignal !== undefined
    ? patch.budgetSignal
    : existing.budgetSignals;
  const timelineSignals = patch.timelineSignal !== null && patch.timelineSignal !== undefined
    ? patch.timelineSignal
    : existing.timelineSignals;

  // Briefing bullets — prepend new bullets, keep max 8
  const combinedBullets = [
    ...(patch.briefingUpdates ?? []),
    ...existing.briefingBullets,
  ];
  const uniqueBullets = Array.from(new Set(combinedBullets));
  const briefingBullets = uniqueBullets.slice(0, MAX_BRIEFING_BULLETS);

  const updated: ClientMemory = {
    clientId,
    memoryTags: Array.from(tagSet),
    decisionStyle: existing.decisionStyle,
    budgetSignals,
    timelineSignals,
    recurringRisks: Array.from(riskSet),
    keyPeople: Array.from(peopleMap.values()),
    briefingBullets,
    lastUpdatedAt: new Date().toISOString(),
  };

  clientMemories[clientId] = updated;
  return updated;
}