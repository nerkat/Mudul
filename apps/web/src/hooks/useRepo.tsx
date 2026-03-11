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
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrg();
  
  // Create org-scoped repo functions
  const value: RepoContextValue = useMemo(() => {
    const orgId = currentOrg?.id;

    if (currentOrg) {
      repo.ensureOrgRoot(currentOrg.id, currentOrg.name, currentOrg.createdAt);
    }
    
    return {
      getRoot: () => orgId ? repo.getRoot(orgId) : null,
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
        return orgId ? repo.getAllClients(orgId) : [];
      },
      getAllCalls: () => {
        return repo.getAllCalls().filter(node => node.orgId === orgId);
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