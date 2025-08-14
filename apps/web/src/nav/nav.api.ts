import type { NavNode } from "./nav.types";

export async function getTree(org: string, path: string): Promise<{ chain: NavNode[], children: Record<string, NavNode[]> }> {
  const url = `/api/nav/${org}/tree?path=${encodeURIComponent(path)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tree: ${response.statusText}`);
  }
  return response.json();
}

export async function getChildren(org: string, parentId: string): Promise<NavNode[]> {
  const url = `/api/nav/${org}/children?parentId=${encodeURIComponent(parentId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch children: ${response.statusText}`);
  }
  return response.json();
}