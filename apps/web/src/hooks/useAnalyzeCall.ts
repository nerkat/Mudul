import { useState, useCallback, useRef, useEffect } from "react";
import { aiClient, type AnalyzeCallRequest, type AnalyzeCallResponse } from "../services/aiClient";
import { upsertCall, setDashboard, hasExistingAnalysis, type UpsertCallResult } from "../core/repo";
import type { SalesCallMinimal } from "../core/types";
import type { AnalysisResult, AnalysisError } from "../services/errors";
import { createAnalysisContentHash, type AnalysisMode, ANALYSIS_SCHEMA_VERSION } from "../services/versioning";
import { analyze as liveAnalyze } from "../core/ai/client";

export interface UseAnalyzeCallState {
  loading: boolean;
  error: AnalysisError | null;
  lastResponse: AnalyzeCallResponse | null;
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
        // Use direct AI client integration
        const liveResult = await liveAnalyze({
          transcript,
          mode,
          schemaVersion: ANALYSIS_SCHEMA_VERSION
        });

        // Check if request was cancelled or nodeId changed
        if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
          return;
        }

        if (!liveResult.ok) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: {
              code: liveResult.error.code as any,
              message: liveResult.error.code === "TIMEOUT" ? "Request timed out" : 
                      liveResult.error.code === "SCHEMA_INVALID" ? "Invalid analysis schema" :
                      "Provider error occurred",
              details: liveResult.error.details
            },
          }));
          return;
        }

        // Map live AI response to SalesCallMinimal format
        const patch: Partial<SalesCallMinimal> = {
          summary: liveResult.data.summary,
          sentiment: liveResult.data.sentiment,
          bookingLikelihood: liveResult.data.bookingLikelihood,
          objections: liveResult.data.objections,
          actionItems: liveResult.data.actionItems,
          keyMoments: liveResult.data.keyMoments,
          entities: liveResult.data.entities,
          complianceFlags: liveResult.data.complianceFlags,
          meta: liveResult.meta,
        };

        // Remove undefined values to avoid overwriting existing data
        const cleanPatch = Object.fromEntries(
          Object.entries(patch).filter(([_, value]) => value !== undefined)
        );

        // Persist analysis data with idempotency check
        const upsertResult = upsertCall(nodeId, cleanPatch);

        // Log observability data
        console.log({
          callId: nodeId,
          provider: liveResult.meta?.provider,
          model: liveResult.meta?.model,
          durationMs: Date.now() - Date.now(), // TODO: track actual duration
          result: liveResult.ok ? "ok" : "error"
        });

        setState(prev => ({
          ...prev,
          loading: false,
          lastResponse: {
            analysis: liveResult.data as any,
            meta: {
              provider: liveResult.meta?.provider || 'unknown',
              model: liveResult.meta?.model || 'unknown', 
              duration_ms: 0, // TODO: track actual duration
              request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content_hash: liveResult.meta?.contentHash || '',
              schema_version: liveResult.meta?.schemaVersion || ANALYSIS_SCHEMA_VERSION
            }
          },
          lastResult: upsertResult,
        }));
        return;
      }

      const request: AnalyzeCallRequest = {
        nodeId,
        transcript,
        mode,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const result: AnalysisResult<AnalyzeCallResponse> = await aiClient.analyze(
        request, 
        abortController.signal
      );

      // Check if request was cancelled or nodeId changed
      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId) {
        return;
      }

      if (!result.ok) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
        }));
        return;
      }

      const response = result.data;

      // Map analysis to SalesCallMinimal format with versioning
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
        meta: response.analysis.meta,
      };

      // Remove undefined values to avoid overwriting existing data
      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, value]) => value !== undefined)
      );

      // Persist analysis data with idempotency check
      const upsertResult = upsertCall(nodeId, cleanPatch);

      // If dashboard template is provided, apply it
      if (response.dashboard && upsertResult.updated) {
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