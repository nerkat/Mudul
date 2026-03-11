import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { NodeBase, SalesCallMinimal } from "../core/types";
import { useOrg } from "../auth/OrgContext";
import { useAuth } from "../auth/AuthContext";

interface RepoContextValue {
  getRoot: () => NodeBase | null;
  getNode: (id: string) => NodeBase | null;
  getChildren: (parentId: string) => NodeBase[];
  getCallByNode: (nodeId: string) => SalesCallMinimal | null;
  listCallsByClient: (clientId: string) => NodeBase[];
  getDashboardId: (nodeId: string) => string | null;
  getAllClients: () => NodeBase[];
  getAllCalls: () => NodeBase[];
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrg();
  const { session } = useAuth();
  const [nodesById, setNodesById] = useState<Record<string, NodeBase>>({});
  const [callDataById, setCallDataById] = useState<Record<string, SalesCallMinimal>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentOrg?.id || !session?.accessToken) {
      setNodesById({});
      setCallDataById({});
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/org/tree', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ORG_TREE_LOAD_FAILED');
      }

      const nextNodes = [result.root, ...(result.clients || []), ...(result.calls || [])]
        .filter(Boolean)
        .reduce((acc: Record<string, NodeBase>, node: NodeBase) => {
          acc[node.id] = node;
          return acc;
        }, {});

      setNodesById(nextNodes);
      setCallDataById(result.callData || {});
    } catch (error) {
      console.error('Failed to load repo tree:', error);
      setNodesById({});
      setCallDataById({});
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, session?.accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: RepoContextValue = useMemo(() => {
    const getNode = (id: string) => nodesById[id] || null;
    const getChildren = (parentId: string) => Object.values(nodesById).filter(node => node.parentId === parentId);
    const getRoot = () => Object.values(nodesById).find(node => node.parentId === null && node.kind === 'group') || null;

    return {
      getRoot,
      getNode,
      getChildren,
      getCallByNode: (nodeId: string) => callDataById[nodeId] || null,
      listCallsByClient: (clientId: string) => Object.values(nodesById).filter(node => node.parentId === clientId && node.kind === 'call_session'),
      getDashboardId: (nodeId: string) => getNode(nodeId)?.dashboardId || null,
      getAllClients: () => Object.values(nodesById).filter(node => node.kind === 'lead'),
      getAllCalls: () => Object.values(nodesById).filter(node => node.kind === 'call_session'),
      refresh,
      isLoading,
    };
  }, [callDataById, isLoading, nodesById, refresh]);

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo(): RepoContextValue {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}