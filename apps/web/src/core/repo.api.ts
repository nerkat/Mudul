// API-backed repo adapter for loading sidebar tree data from database
import { authService } from "../auth/AuthService";
import type { NodeBase, SalesCallMinimal, NodeKind } from "./types";

// HTTP client for API calls with authentication
class ApiClient {
  private baseUrl = ''; // Same origin

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = authService.getCurrentSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  async get(endpoint: string): Promise<any> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API ${endpoint} failed: ${response.status}`);
    }

    return response.json();
  }
}

const api = new ApiClient();

// Cache for reducing API calls during tree expansion
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getRoot(): Promise<NodeBase | null> {
  try {
    const cached = getCached<NodeBase>('root');
    if (cached) return cached;

    const { org } = await api.get('/api/org/summary');
    
    const rootNode: NodeBase = {
      id: `org:${org.id}`,
      orgId: org.id,
      parentId: null,
      kind: "group" as NodeKind,
      name: org.name,
      slug: org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      dashboardId: "org-dashboard",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCache('root', rootNode);
    return rootNode;
  } catch (error) {
    console.error('Failed to load org summary:', error);
    return null;
  }
}

export async function getNode(id: string): Promise<NodeBase | null> {
  try {
    const cached = getCached<NodeBase>(`node:${id}`);
    if (cached) return cached;

    if (id.startsWith("org:")) {
      return getRoot();
    }

    if (id.startsWith("client:")) {
      const clientId = id.split(":")[1];
      const { clients } = await api.get('/api/org/clients-overview');
      const client = clients.find((c: any) => c.id === clientId);
      
      if (!client) return null;

      const node: NodeBase = {
        id: `client:${client.id}`,
        orgId: client.orgId || "unknown", // Assuming org context from auth
        parentId: "root", // All clients are under root for now
        kind: "lead" as NodeKind,
        name: client.name,
        slug: client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        dashboardId: "client-dashboard",
        createdAt: client.createdAt,
        updatedAt: new Date().toISOString()
      };

      setCache(`node:${id}`, node);
      return node;
    }

    if (id.startsWith("call:")) {
      const callId = id.split(":")[1];
      // Find which client this call belongs to by checking all clients
      const { clients } = await api.get('/api/org/clients-overview');
      
      for (const client of clients) {
        const { calls } = await api.get(`/api/clients/${client.id}/calls`);
        const call = calls.find((c: any) => c.id === callId);
        
        if (call) {
          const node: NodeBase = {
            id: `call:${call.id}`,
            orgId: client.orgId || "unknown",
            parentId: `client:${client.id}`,
            kind: "call_session" as NodeKind,
            name: call.title || "Call",
            slug: (call.title || "call").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            dashboardId: "sales-call-default",
            dataRef: { type: "session", id: call.id },
            createdAt: call.createdAt,
            updatedAt: new Date().toISOString()
          };

          setCache(`node:${id}`, node);
          return node;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to load node:', error);
    return null;
  }
}

export async function getChildren(parentId: string): Promise<NodeBase[]> {
  try {
    const cached = getCached<NodeBase[]>(`children:${parentId}`);
    if (cached) return cached;

    if (parentId === "root" || parentId.startsWith("org:")) {
      // Load clients for org
      const { clients } = await api.get('/api/org/clients-overview');
      const children = clients.map((client: any) => ({
        id: `client:${client.id}`,
        orgId: client.orgId || "unknown",
        parentId: parentId,
        kind: "lead" as NodeKind,
        name: client.name,
        slug: client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        dashboardId: "client-dashboard",
        createdAt: client.createdAt,
        updatedAt: new Date().toISOString()
      }));

      setCache(`children:${parentId}`, children);
      return children;
    }

    if (parentId.startsWith("client:")) {
      // Load calls for client
      const clientId = parentId.split(":")[1];
      const { calls } = await api.get(`/api/clients/${clientId}/calls`);
      const children = calls.map((call: any) => ({
        id: `call:${call.id}`,
        orgId: "unknown", // Will be set by parent client context
        parentId: parentId,
        kind: "call_session" as NodeKind,
        name: call.title || "Call",
        slug: (call.title || "call").toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        dashboardId: "sales-call-default",
        dataRef: { type: "session", id: call.id },
        createdAt: call.createdAt,
        updatedAt: new Date().toISOString()
      }));

      setCache(`children:${parentId}`, children);
      return children;
    }

    return [];
  } catch (error) {
    console.error('Failed to load children:', error);
    return [];
  }
}

export async function getCallByNode(nodeId: string): Promise<SalesCallMinimal | null> {
  try {
    if (!nodeId.startsWith("call:")) return null;

    const cached = getCached<SalesCallMinimal>(`call:${nodeId}`);
    if (cached) return cached;

    const callId = nodeId.split(":")[1];
    // Find which client this call belongs to
    const { clients } = await api.get('/api/org/clients-overview');
    
    for (const client of clients) {
      const { calls } = await api.get(`/api/clients/${client.id}/calls`);
      const call = calls.find((c: any) => c.id === callId);
      
      if (call) {
        // Transform API call data to SalesCallMinimal format
        const callData: SalesCallMinimal = {
          id: call.id,
          transcript: call.transcript || "",
          summary: call.summary || "",
          sentiment: call.sentiment || { overall: "neutral", score: 0 },
          bookingLikelihood: call.bookingLikelihood || 0,
          objections: call.objections || [],
          actionItems: call.actionItems || [],
          keyMoments: call.keyMoments || [],
          entities: call.entities || { prospect: [], people: [], products: [] },
          complianceFlags: call.complianceFlags || [],
          meta: {
            createdAt: call.createdAt,
            updatedAt: call.updatedAt || call.createdAt
          }
        };

        setCache(`call:${nodeId}`, callData);
        return callData;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to load call data:', error);
    return null;
  }
}

export async function listCallsByClient(clientId: string): Promise<NodeBase[]> {
  try {
    const actualClientId = clientId.startsWith("client:") ? clientId.split(":")[1] : clientId;
    return getChildren(`client:${actualClientId}`);
  } catch (error) {
    console.error('Failed to list calls by client:', error);
    return [];
  }
}

export function getDashboardId(nodeId: string): string | null {
  // For now, return static dashboard IDs based on node type
  if (nodeId === "root" || nodeId.startsWith("org:")) {
    return "org-dashboard";
  }
  if (nodeId.startsWith("client:")) {
    return "client-dashboard";
  }
  if (nodeId.startsWith("call:")) {
    return "sales-call-default";
  }
  return null;
}

export function getAllClients(): Promise<NodeBase[]> {
  return getChildren("root");
}

export async function getAllCalls(): Promise<NodeBase[]> {
  try {
    const clients = await getAllClients();
    const allCalls: NodeBase[] = [];
    
    for (const client of clients) {
      const calls = await getChildren(client.id);
      allCalls.push(...calls);
    }
    
    return allCalls;
  } catch (error) {
    console.error('Failed to get all calls:', error);
    return [];
  }
}

// Clear cache function for manual refresh
export function clearCache(): void {
  cache.clear();
}

// The mutation methods from the original repo.ts are not implemented in the API version
// as they would require different API endpoints for CREATE/UPDATE operations.
// These will be implemented in future phases.

export function upsertCall(_nodeId: string, _patch: any): any {
  console.warn('upsertCall not implemented in API repo - requires API endpoints for mutation');
  return { updated: false, isDuplicate: false, reason: 'API mutations not implemented' };
}

export function setDashboard(_nodeId: string, _template: any): void {
  console.warn('setDashboard not implemented in API repo - requires API endpoints for mutation');
}

export function hasExistingAnalysis(_nodeId: string, _contentHash: string, _schemaVersion?: string): boolean {
  console.warn('hasExistingAnalysis not implemented in API repo');
  return false;
}

export function createCallNode(_params: { clientId: string; title: string }): string {
  console.warn('createCallNode not implemented in API repo - requires API endpoints for mutation');
  return '';
}

export function deleteNode(_nodeId: string): void {
  console.warn('deleteNode not implemented in API repo - requires API endpoints for mutation');
}

export function markNodeActive(_nodeId: string): void {
  console.warn('markNodeActive not implemented in API repo - requires API endpoints for mutation');
}