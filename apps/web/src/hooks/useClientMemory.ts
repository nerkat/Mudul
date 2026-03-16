import { useState, useCallback } from "react";
import { saveClientMemory } from "../core/repo";
import type { ClientMemory } from "../core/types";
import { useAuth } from "../auth/AuthContext";

export interface UseClientMemoryState {
  loading: boolean;
  error: string | null;
  memory: ClientMemory | null;
}

export interface UseClientMemoryActions {
  refreshMemory: (clientId: string, callAnalysisId?: string) => Promise<ClientMemory | null>;
}

export type UseClientMemoryReturn = UseClientMemoryState & UseClientMemoryActions;

export function useClientMemory(): UseClientMemoryReturn {
  const { session } = useAuth();
  const [state, setState] = useState<UseClientMemoryState>({
    loading: false,
    error: null,
    memory: null,
  });

  const refreshMemory = useCallback(async (
    clientId: string,
    callAnalysisId?: string
  ): Promise<ClientMemory | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call the update-client-memory API endpoint
      const response = await fetch("/api/client-memory/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ clientId, callAnalysisId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.message || `Request failed with status ${response.status}`;
        setState(prev => ({ ...prev, loading: false, error: message }));
        return null;
      }

      const updated: ClientMemory = await response.json();
      // Sync the server-merged result into the in-memory client store so that
      // widget adapters can read the latest data immediately without a full
      // page refresh (the store lives in seed.ts and is local to this session).
      saveClientMemory(updated);

      setState({ loading: false, error: null, memory: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setState(prev => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, [session?.accessToken]);

  return {
    ...state,
    refreshMemory,
  };
}
