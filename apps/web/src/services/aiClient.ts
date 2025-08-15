import { validateSalesCallAnalysis } from "@mudul/protocol";
import { AIDashboardPayload } from "../core/widgets/protocol";
import type { AnalysisResult } from "./errors";
import { success, failure, createAnalysisError, mapNetworkError, mapHttpError } from "./errors";
import type { AnalysisMode, VersionedAnalysis } from "./versioning";
import { createAnalysisContentHash, createAnalysisMeta, ANALYSIS_MODES } from "./versioning";

export interface AnalyzeCallRequest {
  nodeId: string;
  transcript: string;
  mode: AnalysisMode;
  schema?: string;
  requestId?: string;
}

export interface AnalyzeCallResponse {
  analysis: VersionedAnalysis;
  dashboard?: AIDashboardPayload;
  meta?: {
    provider: string;
    model: string;
    duration_ms: number;
    request_id: string;
    content_hash: string;
    schema_version: string;
  };
}

export interface AIClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class AIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: AIClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api";
    this.timeout = config.timeout || 30000; // 30 second default timeout
  }

  async analyze(
    request: AnalyzeCallRequest, 
    abortSignal?: AbortSignal
  ): Promise<AnalysisResult<AnalyzeCallResponse>> {
    const startTime = Date.now();
    const requestId = request.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const contentHash = createAnalysisContentHash(request.transcript, request.mode);
    
    // Create timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, this.timeout);

    // Combine external abort signal with timeout
    const combinedSignal = abortSignal 
      ? this.combineAbortSignals([abortSignal, timeoutController.signal])
      : timeoutController.signal;

    try {
      // Prepare enhanced request with versioning
      const enhancedRequest = {
        ...request,
        requestId,
        mode: request.mode,
        schemaVersion: ANALYSIS_MODES[request.mode].schemaVersion,
        contentHash
      };

      const response = await fetch(`${this.baseUrl}/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(enhancedRequest),
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        const httpError = mapHttpError(response.status, response.statusText, errorBody);
        return failure(httpError);
      }

      const json = await response.json();
      
      // Validate the analysis portion with enhanced error info
      const analysisValidation = validateSalesCallAnalysis(json.analysis || json);
      if (!analysisValidation.success) {
        const schemaError = createAnalysisError(
          'SCHEMA_INVALID',
          `Server returned invalid analysis schema: ${analysisValidation.errors.map((e: any) => e.message).join(", ")}`,
          { validationErrors: analysisValidation.errors }
        );
        return failure(schemaError);
      }

      // Create versioned analysis with metadata
      const durationMs = Date.now() - startTime;
      const analysisMeta = createAnalysisMeta(
        request.mode,
        contentHash,
        requestId,
        json.meta?.provider,
        json.meta?.model,
        durationMs
      );

      const versionedAnalysis: VersionedAnalysis = {
        ...analysisValidation.data,
        meta: analysisMeta
      };

      // Validate dashboard if present (non-blocking)
      let dashboard: AIDashboardPayload | undefined;
      if (json.dashboard) {
        try {
          dashboard = AIDashboardPayload.parse(json.dashboard);
        } catch (error) {
          // Log warning but don't fail the request
          if (process.env.NODE_ENV !== 'production') {
            console.warn("Invalid dashboard payload from AI, ignoring:", error);
          }
        }
      }

      const responseData: AnalyzeCallResponse = {
        analysis: versionedAnalysis,
        dashboard,
        meta: {
          provider: json.meta?.provider || 'unknown',
          model: json.meta?.model || 'unknown',
          duration_ms: durationMs,
          request_id: requestId,
          content_hash: contentHash,
          schema_version: ANALYSIS_MODES[request.mode].schemaVersion
        }
      };

      return success(responseData);

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Map network/abort errors
      const mappedError = mapNetworkError(error);
      return failure(mappedError);
    }
  }

  /**
   * Combine multiple AbortSignals into one
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      
      signal.addEventListener('abort', () => {
        controller.abort();
      }, { once: true });
    }
    
    return controller.signal;
  }
}

// Default client instance
export const aiClient = new AIClient({
  timeout: 30000 // 30 second timeout as requested
});