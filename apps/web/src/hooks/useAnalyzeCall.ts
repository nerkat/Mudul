import { useState, useCallback, useRef, useEffect } from "react";
import { upsertCall, setDashboard, hasExistingAnalysis, type UpsertCallResult } from "../core/repo";
import type { SalesCallMinimal } from "../core/types";
import type { AnalysisError } from "../services/errors";
import { createAnalysisContentHash, type AnalysisMode, ANALYSIS_SCHEMA_VERSION } from "../services/versioning";

export interface UseAnalyzeCallState {
  loading: boolean;
  error: AnalysisError | null;
  lastResponse: any | null; // Simplified since we're using HTTP response directly
  lastResult: UpsertCallResult | null;
}

export interface UseAnalyzeCallActions {
  analyze: (nodeId: string, transcript: string, mode?: AnalysisMode) => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export type UseAnalyzeCallReturn = UseAnalyzeCallState & UseAnalyzeCallActions;

/**
 * Hook for analyzing sales calls with AI.
 * Handles loading states, error handling, automatic data persistence, 
 * timeouts, cancellation, and idempotency.
 */
export function useAnalyzeCall(): UseAnalyzeCallReturn {
  const [state, setState] = useState<UseAnalyzeCallState>({
    loading: false,
    error: null,
    lastResponse: null,
    lastResult: null,
  });

  // Track abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentNodeIdRef = useRef<string | null>(null);

  const analyze = useCallback(async (
    nodeId: string,
    transcript: string,
    mode: AnalysisMode = "sales_v1"
  ) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    currentNodeIdRef.current = nodeId;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastResult: null
    }));

    try {
      // Check for duplicate analysis before making request
      const contentHash = createAnalysisContentHash(transcript, mode);
      const isDuplicate = hasExistingAnalysis(nodeId, contentHash);

      if (isDuplicate) {
        setState(prev => ({
          ...prev,
          loading: false,
          lastResult: {
            updated: false,
            isDuplicate: true,
            reason: 'Analysis already exists for this transcript and schema version'
          }
        }));
        return;
      }

      // All requests now go through the unified API endpoint
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId,
          transcript,
          mode,
          schemaVersion: ANALYSIS_SCHEMA_VERSION,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
        signal: abortController.signal
      });

      // Check if request was cancelled or nodeId changed
      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
        return;
      }

      const result = await response.json();

      // Treat success as: HTTP ok AND no error object AND we actually have analysis data
      const hasHttpError = !response.ok;
      const hasBodyError = typeof result?.error?.code === 'string' && result.error.code.length > 0;
      const hasAnalysis = !!result?.analysis;

      if (hasHttpError || hasBodyError || !hasAnalysis) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: {
            code: (result?.error?.code || "UNKNOWN_ERROR") as any,
            message: result?.error?.message ||
              (result?.error?.code === "TIMEOUT" ? "Request timed out" :
                result?.error?.code === "SCHEMA_INVALID" ? "Invalid analysis schema" :
                  result?.error?.code === "RATE_LIMITED" ? "Rate limited" :
                    result?.error?.code === "CANCELLED" ? "Request cancelled" :
                      "Provider error occurred"),
            details: result?.error?.details
          },
        }));
        return;
      }


      // Map analysis response to SalesCallMinimal format
      const patch: Partial<SalesCallMinimal> = {
        summary: result.analysis?.summary,
        sentiment: result.analysis?.sentiment,
        bookingLikelihood: result.analysis?.bookingLikelihood,
        objections: result.analysis?.objections,
        actionItems: result.analysis?.actionItems,
        keyMoments: result.analysis?.keyMoments,
        entities: result.analysis?.entities,
        complianceFlags: result.analysis?.complianceFlags,
        meta: {
          ...result.meta,
          updatedAt: new Date().toISOString()
        },
      };

      // Remove undefined values to avoid overwriting existing data
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, value]) => value !== undefined)
      );

      // Persist analysis data with idempotency check
      const upsertResult = upsertCall(nodeId, cleanPatch);

      // If dashboard template is provided, apply it
      if (result.dashboard && upsertResult.updated) {
        try {
          setDashboard(nodeId, {
            version: result.dashboard.version,
            ...result.dashboard.dashboard,
          });
        } catch (error) {
          console.warn("Failed to apply AI dashboard template:", error);
          // Don't fail the analysis for dashboard errors
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        lastResponse: {
          analysis: result.analysis as any,
          meta: {
            provider: result.meta?.provider || 'unknown',
            model: result.meta?.model || 'unknown',
            duration_ms: result.meta?.duration_ms || 0,
            request_id: result.meta?.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content_hash: result.meta?.contentHash || '',
            schema_version: result.meta?.schema_version || ANALYSIS_SCHEMA_VERSION
          }
        },
        lastResult: upsertResult,
      }));

    } catch (error) {
      // This should not happen with the new error handling, but keeping as fallback
      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 'SERVER_ERROR',
          message: error instanceof Error ? error.message : "Unknown error occurred",
          details: error
        },
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      loading: false,
      error: null,
      lastResponse: null,
      lastResult: null,
    });
  }, [cancel]);

  // Auto-cancel on unmount or nodeId change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    analyze,
    reset,
    cancel,
  };
}