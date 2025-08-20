import { useState, useEffect } from "react";
import { useRepo } from "./useRepo";
import type { SalesCallMinimal } from "../core/types";

export function useSalesCall(nodeId?: string): { data: SalesCallMinimal | null; error: string | null; loading: boolean } {
  const repo = useRepo();
  const [data, setData] = useState<SalesCallMinimal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadCall = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const callResult = repo.getCallByNode(nodeId);
        
        if (repo.isAsync) {
          // API repo - handle async
          const resolvedCall = await callResult;
          if (isMounted) {
            setData(resolvedCall);
            setError(resolvedCall ? null : "No analysis yet for this session.");
          }
        } else {
          // Memory repo - handle sync
          const callData = callResult as SalesCallMinimal | null;
          if (isMounted) {
            setData(callData);
            setError(callData ? null : "No analysis yet for this session.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load call data');
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCall();

    return () => {
      isMounted = false;
    };
  }, [nodeId, repo]);

  return { data, error, loading };
}