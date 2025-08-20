import { useState, useEffect } from "react";
import { useRepo } from "./useRepo";
import type { NodeBase } from "../core/types";

export function useNode(id: string): { data: NodeBase | null; loading: boolean; error: string | null } {
  const repo = useRepo();
  const [data, setData] = useState<NodeBase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadNode = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const nodeResult = repo.getNode(id);
        
        if (repo.isAsync) {
          // API repo - handle async
          const resolvedNode = await nodeResult;
          if (isMounted) {
            setData(resolvedNode);
          }
        } else {
          // Memory repo - handle sync
          if (isMounted) {
            setData(nodeResult as NodeBase | null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load node');
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNode();

    return () => {
      isMounted = false;
    };
  }, [id, repo]);

  return { data, loading, error };
}