import React, { createContext, useContext } from "react";
import * as repo from "../core/repo";

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
  const value: RepoContextValue = {
    getRoot: repo.getRoot,
    getNode: repo.getNode,
    getChildren: repo.getChildren,
    getCallByNode: repo.getCallByNode,
    listCallsByClient: repo.listCallsByClient,
    getDashboardId: repo.getDashboardId,
    getAllClients: repo.getAllClients,
    getAllCalls: repo.getAllCalls,
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo(): RepoContextValue {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error("useRepo must be used within a RepoProvider");
  }
  return context;
}