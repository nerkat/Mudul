import { useRepo } from "./useRepo";
import type { SalesCallMinimal } from "../core/types";

export function useSalesCall(nodeId?: string): { data: SalesCallMinimal | null; error: string | null; loading: boolean } {
  const repo = useRepo();
  
  if (!nodeId) {
    return { data: null, error: null, loading: false };
  }
  
  const data = repo.getCallByNode(nodeId);
  return { 
    data, 
    error: data || repo.isLoading ? null : "No analysis yet for this session.", 
    loading: repo.isLoading 
  };
}