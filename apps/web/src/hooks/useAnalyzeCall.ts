import { useState, useCallback, useRef, useEffect } from "react";
import { upsertCall, setDashboard, hasExistingAnalysis, type UpsertCallResult } from "../core/repo";
import type { SalesCallMinimal } from "../core/types";
import type { AnalysisError } from "../services/errors";
import { createAnalysisContentHash, type AnalysisMode, ANALYSIS_SCHEMA_VERSION } from "../services/versioning";

export interface UseAnalyzeCallState {
  loading: boolean;
  error: AnalysisError | null;
  lastResponse: any | null;
  lastResult: UpsertCallResult | null;
}

export interface UseAnalyzeCallActions {
  analyze: (nodeId: string, transcript: string, mode?: AnalysisMode) => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export type UseAnalyzeCallReturn = UseAnalyzeCallState & UseAnalyzeCallActions;

const normalizeTranscript = (t: string) => t.replace(/\s+/g, " ").trim();

export function useAnalyzeCall(): UseAnalyzeCallReturn {
  const [state, setState] = useState<UseAnalyzeCallState>({
    loading: false,
    error: null,
    lastResponse: null,
    lastResult: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentNodeIdRef = useRef<string | null>(null);
  const runIdRef = useRef<string | null>(null);

  const analyze = useCallback(async (
    nodeId: string,
    transcript: string,
    mode: AnalysisMode = "sales_v1"
  ) => {
    // cancel any in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    currentNodeIdRef.current = nodeId;

    const runId = crypto.randomUUID?.() ?? `run_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    runIdRef.current = runId;

    setState(prev => ({ ...prev, loading: true, error: null, lastResult: null }));

    try {
      // === Idempotency pre-check (before network) ===
      const normalized = normalizeTranscript(transcript);
      const contentHash = createAnalysisContentHash(normalized, mode);
      const isDuplicate = hasExistingAnalysis(nodeId, contentHash);
      console.log("[DUPCHECK]", { nodeId, mode, schema: ANALYSIS_SCHEMA_VERSION, contentHash, isDuplicate });

      if (isDuplicate) {
        if (runIdRef.current !== runId) return;
        setState(prev => ({
          ...prev,
          loading: false,
          lastResult: {
            updated: false,
            isDuplicate: true,
            reason: "Analysis already exists for this transcript and schema version",
          },
        }));
        return;
      }

      // === Network request ===
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          transcript,               // send original; hash is based on normalized
          mode,
          schemaVersion: ANALYSIS_SCHEMA_VERSION,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
        signal: abortController.signal
      });

      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId || runIdRef.current !== runId) {
        return; // stale
      }

      const result = await response.json();

      // === Success predicate aligned to your response shape ===
      const hasHttpError = !response.ok;
      const hasBodyError = typeof result?.error?.code === "string" && result.error.code.length > 0;
      const hasAnalysis = !!result?.analysis;

      if (hasHttpError || hasBodyError || !hasAnalysis) {
        if (runIdRef.current !== runId) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: {
            code: (result?.error?.code || "UNKNOWN_ERROR") as any,
            message:
              result?.error?.message ||
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

      // === Map + persist ===
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
          // prefer server meta but enforce our canonical keys for idempotency
          provider: result.meta?.provider ?? "unknown",
          model: result.meta?.model ?? "unknown",
          durationMs: result.meta?.duration_ms ?? 0,
          requestId: result.meta?.request_id ?? `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contentHash,                        // <— camelCase, same value used in pre-check
          schemaVersion: ANALYSIS_SCHEMA_VERSION, // <— camelCase
          updatedAt: new Date().toISOString(),
        },
      };

      const cleanPatch = Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== undefined)
      );

      const upsertResult = upsertCall(nodeId, cleanPatch);

      if (result.dashboard && upsertResult.updated) {
        try {
          setDashboard(nodeId, {
            version: result.dashboard.version,
            ...result.dashboard.dashboard,
          });
        } catch (e) {
          console.warn("Failed to apply AI dashboard template:", e);
        }
      }

      if (runIdRef.current !== runId) return;
      setState(prev => ({
        ...prev,
        loading: false,
        lastResponse: {
          analysis: result.analysis as any,
          meta: {
            provider: result.meta?.provider ?? "unknown",
            model: result.meta?.model ?? "unknown",
            duration_ms: result.meta?.duration_ms ?? 0,
            request_id: result.meta?.request_id ?? `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contentHash,                         // expose canonical fields to UI
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
          }
        },
        lastResult: upsertResult,
      }));

    } catch (error) {
      if (abortController.signal.aborted || currentNodeIdRef.current !== nodeId || runIdRef.current !== runId) {
        return;
      }
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: "SERVER_ERROR",
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    ...state,
    analyze,
    reset,
    cancel,
  };
}
