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

      // Check if we should use live AI provider
      const useLiveAI = import.meta.env.VITE_USE_LIVE_AI === "true";
      
      if (useLiveAI) {
        // Make HTTP request to server-side AI endpoint
        const startTime = Date.now();
        
        try {
          const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transcript,
              mode,
              schemaVersion: ANALYSIS_SCHEMA_VERSION
            }),
            signal: abortController.signal
          });

          // Check if request was cancelled or nodeId changed
          if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
            return;
          }

          const durationMs = Date.now() - startTime;
          const liveResult = await response.json();

          if (!response.ok || !liveResult.ok) {
            // Log observability data for errors
            console.log({
              callId: nodeId,
              provider: "unknown",
              model: "unknown",
              durationMs,
              result: liveResult.error?.code || "unknown_error"
            });

            setState(prev => ({
              ...prev,
              loading: false,
              error: {
                code: (liveResult.error?.code || "UNKNOWN_ERROR") as any,
                message: liveResult.error?.code === "TIMEOUT" ? "Request timed out" : 
                        liveResult.error?.code === "SCHEMA_INVALID" ? "Invalid analysis schema" :
                        "Provider error occurred",
                details: liveResult.error?.details
              },
            }));
            return;
          }

          // Map live AI response to SalesCallMinimal format
          const patch: Partial<SalesCallMinimal> = {
            summary: liveResult.analysis?.summary,
            sentiment: liveResult.analysis?.sentiment,
            bookingLikelihood: liveResult.analysis?.bookingLikelihood,
            objections: liveResult.analysis?.objections,
            actionItems: liveResult.analysis?.actionItems,
            keyMoments: liveResult.analysis?.keyMoments,
            entities: liveResult.analysis?.entities,
            complianceFlags: liveResult.analysis?.complianceFlags,
            meta: {
              ...liveResult.meta,
              updatedAt: new Date().toISOString()
            },
          };

          // Remove undefined values to avoid overwriting existing data
          const cleanPatch = Object.fromEntries(
            Object.entries(patch).filter(([_, value]) => value !== undefined)
          );

          // Persist analysis data with idempotency check
          const upsertResult = upsertCall(nodeId, cleanPatch);

          // Log observability data for success
          console.log({
            callId: nodeId,
            provider: liveResult.meta?.provider,
            model: liveResult.meta?.model,
            durationMs,
            result: liveResult.ok ? "ok" : "error"
          });

          setState(prev => ({
            ...prev,
            loading: false,
            lastResponse: {
              analysis: liveResult.analysis as any,
              meta: {
                provider: liveResult.meta?.provider || 'unknown',
                model: liveResult.meta?.model || 'unknown', 
                duration_ms: durationMs,
                request_id: liveResult.meta?.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content_hash: liveResult.meta?.contentHash || '',
                schema_version: liveResult.meta?.schema_version || ANALYSIS_SCHEMA_VERSION
              }
            },
            lastResult: upsertResult,
          }));
          return;
        } catch (fetchError: any) {
          // Check if request was cancelled or nodeId changed
          if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
            return;
          }

          const durationMs = Date.now() - startTime;
          
          // Handle fetch errors (network, timeout, etc.)
          console.log({
            callId: nodeId,
            provider: "unknown",
            model: "unknown", 
            durationMs,
            result: fetchError.name === "AbortError" ? "timeout" : "fetch_error"
          });

          setState(prev => ({
            ...prev,
            loading: false,
            error: {
              code: fetchError.name === "AbortError" ? "TIMEOUT" : "SERVER_ERROR",
              message: fetchError.name === "AbortError" ? "Request timed out" : "Network error occurred",
              details: fetchError.message
            },
          }));
          return;
        }
      }

      // Use HTTP API endpoint (handles both live AI and mock)
      const request = {
        nodeId,
        transcript,
        mode,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortController.signal
      });

      // Check if request was cancelled or nodeId changed
      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.analysis) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'AI analysis failed',
            details: result
          },
        }));
        return;
      }

      // Map analysis to SalesCallMinimal format
      const patch: Partial<SalesCallMinimal> = {
        summary: result.analysis.summary,
        sentiment: result.analysis.sentiment ? {
          overall: result.analysis.sentiment.overall,
          score: result.analysis.sentiment.score,
        } : undefined,
        bookingLikelihood: result.analysis.bookingLikelihood,
        objections: result.analysis.objections,
        actionItems: result.analysis.actionItems,
        keyMoments: result.analysis.keyMoments,
        entities: result.analysis.entities,
        complianceFlags: result.analysis.complianceFlags,
        meta: result.meta,
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
        lastResponse: result,
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