import { nodes, calls } from "./seed";
import type { NodeBase, SalesCallMinimal } from "./types";

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