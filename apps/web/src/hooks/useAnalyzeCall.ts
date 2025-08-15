import { useState, useCallback } from "react";
import { aiClient, type AnalyzeCallRequest, type AnalyzeCallResponse } from "../services/aiClient";
import { upsertCall, setDashboard } from "../core/repo";
import type { SalesCallMinimal } from "../core/types";

export interface UseAnalyzeCallState {
  loading: boolean;
  error: string | null;
  lastResponse: AnalyzeCallResponse | null;
}

export interface UseAnalyzeCallActions {
  analyze: (nodeId: string, transcript: string) => Promise<void>;
  reset: () => void;
}

export type UseAnalyzeCallReturn = UseAnalyzeCallState & UseAnalyzeCallActions;

/**
 * Hook for analyzing sales calls with AI.
 * Handles loading states, error handling, and automatic data persistence.
 */
export function useAnalyzeCall(): UseAnalyzeCallReturn {
  const [state, setState] = useState<UseAnalyzeCallState>({
    loading: false,
    error: null,
    lastResponse: null,
  });

  const analyze = useCallback(async (nodeId: string, transcript: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const request: AnalyzeCallRequest = {
        nodeId,
        transcript,
        mode: "sales_v1",
      };

      const response = await aiClient.analyze(request);

      // Map analysis to SalesCallMinimal format
      const patch: Partial<SalesCallMinimal> = {
        summary: response.analysis.summary,
        sentiment: response.analysis.sentiment ? {
          overall: response.analysis.sentiment.overall,
          score: response.analysis.sentiment.score,
        } : undefined,
        bookingLikelihood: response.analysis.bookingLikelihood,
        objections: response.analysis.objections,
        actionItems: response.analysis.actionItems,
        keyMoments: response.analysis.keyMoments,
        entities: response.analysis.entities,
        complianceFlags: response.analysis.complianceFlags,
      };

      // Remove undefined values to avoid overwriting existing data
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, value]) => value !== undefined)
      );

      // Persist analysis data
      upsertCall(nodeId, cleanPatch);

      // If dashboard template is provided, apply it
      if (response.dashboard) {
        try {
          setDashboard(nodeId, {
            version: response.dashboard.version,
            ...response.dashboard.dashboard,
          });
        } catch (error) {
          console.warn("Failed to apply AI dashboard template:", error);
          // Don't fail the analysis for dashboard errors
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        lastResponse: response,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      lastResponse: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}