import type { Plugin } from "vite";
import { z } from "zod";
import { validateSalesCall } from "@mudul/protocol";
import { 
  MockAiProvider, 
  createProvider, 
  validateProviderConfig, 
  getProviderInfo,
  metrics,
  redactForLogging 
} from "@mudul/core";

const bodySchema = z.object({
  nodeId: z.string().min(1),
  transcript: z.string().min(1),
  mode: z.string().min(1),
  requestId: z.string().optional(),
  schemaVersion: z.string().optional(),
  contentHash: z.string().optional()
});

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB limit
const MAX_TRANSCRIPT_BYTES = 1024 * 1024; // 1MB transcript limit

interface ApiResponse {
  data?: any;
  source: "live" | "mock" | "fallback_mock";
  meta?: {
    provider: string;
    model: string;
    duration_ms: number;
    request_id: string;
    fallback: boolean;
    failed_provider: string | null;
    failed_error_code: string | null;
    prompt_versions: {
      system: string;
      user: string;
    };
    truncated: boolean;
    retries: number;
    schema_version: string;
  };
  error?: string;
  details?: string[];
  note?: string;
  failedProvider?: string;
  errorCode?: string;
  timestamp?: string;
}

export default function analyzePlugin(): Plugin {
  // Validate configuration at startup
  const configValidation = validateProviderConfig();
  const providerInfo = getProviderInfo();
  
  console.log('AI Provider Configuration:', {
    ...providerInfo,
    validation: configValidation
  });
  
  return {
    name: "dev-analyze-api",
    apply: "serve", // dev only
    enforce: "pre", // ensures plugin runs before others
    configureServer(server) {
      // Health endpoint for development metrics
      server.middlewares.use(async (req, res, next) => {
        if (req.method === "GET" && req.url === "/api/_health/ai") {
          res.setHeader("content-type", "application/json");
          
          const allMetrics = metrics.getAll();
          const healthMetrics = {
            live_success: metrics.get('ai_success_total', { provider: 'openai' }),
            live_schema_fail: metrics.get('ai_schema_fail_total', { provider: 'openai' }),
            live_http_fail: metrics.get('ai_error_total', { provider: 'openai' }),
            fallback_used: metrics.get('ai_fallback_total', { provider: 'openai' }),
            mock_success: metrics.get('ai_success_total', { provider: 'mock' }),
            all_metrics: allMetrics
          };
          
          res.statusCode = 200;
          return res.end(JSON.stringify({ 
            ok: true, 
            metrics: healthMetrics,
            provider_info: getProviderInfo(),
            timestamp: new Date().toISOString()
          }));
        }
        
        if (req.method !== "POST" || !req.url?.startsWith("/api/analyze")) return next();

        const startTime = Date.now();
        let requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Support trace_id passthrough from client
        const traceId = req.headers['x-request-id'];
        if (traceId && typeof traceId === 'string') {
          requestId = traceId;
        }

        try {
          // Check content-length for payload size limit
          const contentLength = parseInt(req.headers['content-length'] || '0', 10);
          if (contentLength > MAX_PAYLOAD_SIZE) {
            res.statusCode = 413;
            return res.end(JSON.stringify({ 
              error: "payload_too_large", 
              details: ["Request body exceeds 10MB limit"],
              timestamp: new Date().toISOString()
            }));
          }

          const chunks: Buffer[] = [];
          let totalSize = 0;
          
          req.on("data", (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_PAYLOAD_SIZE) {
              res.statusCode = 413;
              return res.end(JSON.stringify({ 
                error: "payload_too_large", 
                details: ["Request body exceeds 10MB limit"],
                timestamp: new Date().toISOString()
              }));
            }
            chunks.push(chunk);
          });
          
          req.on("end", async () => {
            const duration = Date.now() - startTime;
            res.setHeader("content-type", "application/json");
            
            const raw = Buffer.concat(chunks).toString("utf-8");
            
            // Check transcript size before processing
            if (raw.length > MAX_TRANSCRIPT_BYTES) {
              res.statusCode = 413;
              return res.end(JSON.stringify({
                error: "transcript_too_large",
                details: [`Transcript exceeds ${MAX_TRANSCRIPT_BYTES / 1024}KB limit`],
                timestamp: new Date().toISOString()
              }));
            }
            
            let json: unknown;
            try {
              json = JSON.parse(raw);
            } catch {
              res.statusCode = 400;
              return res.end(JSON.stringify({ 
                error: "invalid_request", 
                details: ["invalid_json"],
                timestamp: new Date().toISOString()
              }));
            }

            const parsed = bodySchema.safeParse(json);
            if (!parsed.success) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ 
                error: "invalid_request", 
                details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
                timestamp: new Date().toISOString()
              }));
            }

            // Provider selection based on configuration - use factory
            const useLive = process.env.USE_LIVE_AI === "true";
            const allowFallback = process.env.ALLOW_FALLBACK !== "false"; // default true
            const provider = createProvider();
            
            let resultSource: "live" | "mock" | "fallback_mock" = useLive ? "live" : "mock";
            let output: any;
            let failureDetails: { provider?: string; errorCode?: string } = {};

            try {
              
              output = await provider.analyzeCall({ 
                transcript: parsed.data.transcript 
              });
              
              // Validate schema BEFORE fallback decision
              const schemaValidation = validateSalesCall(output);
              if (!schemaValidation.success) {
                metrics.increment('ai_schema_fail_total', { provider: useLive ? 'openai' : 'mock' });
                
                if (process.env.NODE_ENV !== 'production') {
                  console.error(`Schema validation failed [${requestId}]:`, {
                    errors: schemaValidation.errors.map(i => `${i.path.join('.')}: ${i.message}`)
                  });
                }
                throw new Error("schema_invalid");
              }
              
              // Success path - log observability metrics
              metrics.increment('ai_success_total', { provider: output.meta?.provider || 'unknown' });
              
              // Add minimal server logs with redacted transcripts (only in development)
              if (process.env.NODE_ENV !== 'production') {
                console.log(`Analysis completed [${requestId}]:`, {
                  nodeId: parsed.data.nodeId,
                  provider: output.meta?.provider || 'unknown',
                  model: output.meta?.model || 'unknown',
                  durationMs: duration,
                  tokensIn: output.meta?.tokens_in || 'unknown',
                  tokensOut: output.meta?.tokens_out || 'unknown',
                  result: 'success',
                  transcriptLength: redactForLogging(`${parsed.data.transcript.length} chars`)
                });
              }
              
              const response: ApiResponse = {
                data: schemaValidation.data,
                source: resultSource,
                meta: output.meta || {
                  provider: useLive ? 'openai' : 'mock',
                  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                  duration_ms: duration,
                  request_id: requestId,
                  fallback: false,
                  failed_provider: null,
                  failed_error_code: null,
                  prompt_versions: {
                    system: 'salesCall.system@v1.0.0',
                    user: 'salesCall.user@v1.0.0'
                  },
                  truncated: false,
                  retries: 0,
                  schema_version: "SalesCallV1"
                }
              };
              
              res.statusCode = 200;
              return res.end(JSON.stringify(response));
              
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'unknown_error';
              const providerType = useLive ? 'openai' : 'mock';
              failureDetails.provider = providerType;
              failureDetails.errorCode = errorMsg;
              
              metrics.increment('ai_fallback_total', { provider: providerType });
              
              // Log error in development only with enhanced observability
              if (process.env.NODE_ENV !== 'production') {
                console.error(`Provider error [${requestId}]:`, {
                  nodeId: parsed.data.nodeId,
                  provider: providerType,
                  durationMs: Date.now() - startTime,
                  result: 'error',
                  error: redactForLogging(errorMsg),
                  transcriptLength: redactForLogging(`${parsed.data.transcript.length} chars`)
                });
              }
              
              // Fallback logic for live mode
              if (useLive && allowFallback) {
                try {
                  const mockProvider = new MockAiProvider();
                  const fallbackOutput = await mockProvider.analyzeCall({ 
                    transcript: parsed.data.transcript 
                  });
                  
                  const fallbackValidation = validateSalesCall(fallbackOutput);
                  if (!fallbackValidation.success) {
                    throw new Error("fallback_schema_invalid");
                  }
                  
                  resultSource = "fallback_mock";
                  
                  const response: ApiResponse = {
                    data: fallbackValidation.data,
                    source: resultSource,
                    note: "live_failed_fallback_mock",
                    failedProvider: "openai",
                    errorCode: errorMsg,
                    meta: {
                      provider: 'mock',
                      model: 'mock',
                      duration_ms: duration,
                      request_id: requestId,
                      fallback: true,
                      failed_provider: 'openai',
                      failed_error_code: errorMsg,
                      prompt_versions: {
                        system: 'salesCall.system@v1.0.0',
                        user: 'salesCall.user@v1.0.0'
                      },
                      truncated: false,
                      retries: 0,
                      schema_version: "SalesCallV1"
                    }
                  };
                  
                  // Add fallback header as requested (lowercase)
                  res.setHeader("x-ai-fallback", "1");
                  res.statusCode = 200;
                  return res.end(JSON.stringify(response));
                  
                } catch (fallbackError) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.error(`Fallback failed [${requestId}]:`, fallbackError);
                  }
                }
              }
              
              // No fallback allowed or fallback failed
              if (useLive && !allowFallback) {
                res.statusCode = 502;
                return res.end(JSON.stringify({
                  error: "provider_error",
                  details: [`Provider ${failureDetails.provider} failed: ${failureDetails.errorCode}`],
                  provider: failureDetails.provider,
                  timestamp: new Date().toISOString()
                }));
              }
              
              // Final error response
              res.statusCode = 502;
              return res.end(JSON.stringify({ 
                error: "provider_error",
                details: ["All providers failed"],
                timestamp: new Date().toISOString()
              }));
            }
          });
          
        } catch (e) {
          console.error(`Server error [${requestId}]:`, e);
          res.statusCode = 500;
          res.end(JSON.stringify({ 
            error: "server_error", 
            details: ["Internal server error"],
            timestamp: new Date().toISOString()
          }));
        }
      });
    }
  };
}