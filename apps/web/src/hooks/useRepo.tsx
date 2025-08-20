import React, { createContext, useContext, useMemo, useState } from "react";
import * as memRepo from "../core/repo";      // existing in-memory repo
import * as apiRepo from "../core/repo.api";  // new API-backed repo
import { useOrg } from "../auth/OrgContext";

// Check environment flag to determine which repo to use
const useDb = import.meta.env.VITE_USE_DB === "true";

// Mixed interface that handles both sync and async repo implementations
interface RepoContextValue {
  getRoot: () => ReturnType<typeof memRepo.getRoot> | ReturnType<typeof apiRepo.getRoot>;
  getNode: (id: string) => ReturnType<typeof memRepo.getNode> | ReturnType<typeof apiRepo.getNode>;
  getChildren: (parentId: string) => ReturnType<typeof memRepo.getChildren> | ReturnType<typeof apiRepo.getChildren>;
  getCallByNode: (nodeId: string) => ReturnType<typeof memRepo.getCallByNode> | ReturnType<typeof apiRepo.getCallByNode>;
  listCallsByClient: (clientId: string) => ReturnType<typeof memRepo.listCallsByClient> | ReturnType<typeof apiRepo.listCallsByClient>;
  getDashboardId: (nodeId: string) => ReturnType<typeof memRepo.getDashboardId> | ReturnType<typeof apiRepo.getDashboardId>;
  getAllClients: () => ReturnType<typeof memRepo.getAllClients> | ReturnType<typeof apiRepo.getAllClients>;
  getAllCalls: () => ReturnType<typeof memRepo.getAllCalls> | ReturnType<typeof apiRepo.getAllCalls>;
  refreshTree: () => void; // New method for manual refresh
  isAsync: boolean; // Flag to indicate if repo functions are async
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrg();
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Create org-scoped repo functions
  const value: RepoContextValue = useMemo(() => {
    const orgId = currentOrg?.id;
    
    // Select the appropriate repo implementation
    const repoImpl = useDb ? apiRepo : memRepo;
    
    // For memory repo, we need org filtering (existing behavior)
    // For API repo, org filtering is handled by the API endpoints themselves
    if (useDb) {
      // API repo - no org filtering needed as API handles it
      return {
        getRoot: () => repoImpl.getRoot(),
        getNode: (id: string) => repoImpl.getNode(id),
        getChildren: (parentId: string) => repoImpl.getChildren(parentId),
        getCallByNode: (nodeId: string) => repoImpl.getCallByNode(nodeId),
        listCallsByClient: (clientId: string) => repoImpl.listCallsByClient(clientId),
        getDashboardId: (nodeId: string) => repoImpl.getDashboardId(nodeId),
        getAllClients: () => repoImpl.getAllClients(),
        getAllCalls: () => repoImpl.getAllCalls(),
        isAsync: true,
        refreshTree: () => {
          // Clear API cache and trigger re-render
          if ('clearCache' in repoImpl) {
            (repoImpl as any).clearCache();
          }
          setRefreshCounter(c => c + 1);
        }
      };
    } else {
      // Memory repo - keep existing org filtering logic
      return {
        getRoot: () => {
          const root = (repoImpl as typeof memRepo).getRoot();
          return root && root.orgId === orgId ? root : null;
        },
        getNode: (id: string) => {
          const node = (repoImpl as typeof memRepo).getNode(id);
          return node && node.orgId === orgId ? node : null;
        },
        getChildren: (parentId: string) => {
          return (repoImpl as typeof memRepo).getChildren(parentId).filter(node => node.orgId === orgId);
        },
        getCallByNode: (nodeId: string) => {
          const node = (repoImpl as typeof memRepo).getNode(nodeId);
          if (!node || node.orgId !== orgId) return null;
          return (repoImpl as typeof memRepo).getCallByNode(nodeId);
        },
        listCallsByClient: (clientId: string) => {
          const client = (repoImpl as typeof memRepo).getNode(clientId);
          if (!client || client.orgId !== orgId) return [];
          return (repoImpl as typeof memRepo).listCallsByClient(clientId).filter(node => node.orgId === orgId);
        },
        getDashboardId: (nodeId: string) => {
          const node = (repoImpl as typeof memRepo).getNode(nodeId);
          if (!node || node.orgId !== orgId) return null;
          return (repoImpl as typeof memRepo).getDashboardId(nodeId);
        },
        getAllClients: () => {
          return (repoImpl as typeof memRepo).getAllClients().filter(node => node.orgId === orgId);
        },
        getAllCalls: () => {
          return (repoImpl as typeof memRepo).getAllCalls().filter(node => node.orgId === orgId);
        },
        isAsync: false,
        refreshTree: () => {
          // For memory repo, just trigger a re-render
          setRefreshCounter(c => c + 1);
        }
      };
    }
  }, [currentOrg?.id, refreshCounter]); // Include refreshCounter to trigger updates

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo(): RepoContextValue {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}