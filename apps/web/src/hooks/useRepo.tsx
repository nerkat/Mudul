import React, { createContext, useContext, useMemo } from "react";
import * as repo from "../core/repo";
import { useOrg } from "../auth/OrgContext";

interface RepoContextValue {
  getRoot: typeof repo.getRoot;
  getNode: typeof repo.getNode;
  getChildren: typeof repo.getChildren;
  getCallByNode: typeof repo.getCallByNode;
  listCallsByClient: typeof repo.listCallsByClient;
  getDashboardId: typeof repo.getDashboardId;
  getAllClients: typeof repo.getAllClients;
  getAllCalls: typeof repo.getAllCalls;
  getStandaloneActionItems: typeof repo.getStandaloneActionItems;
  createClient: (data: { name: string; notes?: string }) => Promise<{ id: string; name: string }>;
  createActionItem: (data: { clientId: string; owner: string; text: string; dueDate: string | null; status?: 'open' | 'done' }) => Promise<{ id: string }>;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrg();
  
  // Create org-scoped repo functions
  const value: RepoContextValue = useMemo(() => {
    const orgId = currentOrg?.id;
    
    return {
      getRoot: () => {
        const root = repo.getRoot();
        return root && root.orgId === orgId ? root : null;
      },
      getNode: (id: string) => {
        const node = repo.getNode(id);
        return node && node.orgId === orgId ? node : null;
      },
      getChildren: (parentId: string) => {
        return repo.getChildren(parentId).filter(node => node.orgId === orgId);
      },
      getCallByNode: (nodeId: string) => {
        const node = repo.getNode(nodeId);
        if (!node || node.orgId !== orgId) return null;
        return repo.getCallByNode(nodeId);
      },
      listCallsByClient: (clientId: string) => {
        const client = repo.getNode(clientId);
        if (!client || client.orgId !== orgId) return [];
        return repo.listCallsByClient(clientId).filter(node => node.orgId === orgId);
      },
      getDashboardId: (nodeId: string) => {
        const node = repo.getNode(nodeId);
        if (!node || node.orgId !== orgId) return null;
        return repo.getDashboardId(nodeId);
      },
      getAllClients: () => {
        return repo.getAllClients().filter(node => node.orgId === orgId);
      },
      getAllCalls: () => {
        return repo.getAllCalls().filter(node => node.orgId === orgId);
      },
      getStandaloneActionItems: (clientId: string) => {
        const client = repo.getNode(clientId);
        if (!client || client.orgId !== orgId) return [];
        return repo.getStandaloneActionItems(clientId);
      },
      createClient: async (data: { name: string; notes?: string }) => {
        // Simulate async operation (in real app this would call API)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const nodeId = repo.createClient({
          name: data.name,
          notes: data.notes
        });
        
        const newNode = repo.getNode(nodeId);
        if (!newNode) {
          throw new Error('Failed to create client');
        }
        
        return { id: nodeId, name: newNode.name };
      },
      createActionItem: async (data: { clientId: string; owner: string; text: string; dueDate: string | null; status?: 'open' | 'done' }) => {
        // Simulate async operation (in real app this would call API)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const actionItemId = repo.createActionItem({
          clientId: data.clientId,
          owner: data.owner,
          text: data.text,
          dueDate: data.dueDate,
          status: data.status || 'open'
        });
        
        return { id: actionItemId };
      }
    };
  }, [currentOrg?.id]);

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo(): RepoContextValue {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}