import { type AiProvider, type AnalyzeInput, type AnalyzeOutput } from "@mudul/protocol";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePrompt, truncateTranscript, redactForLogging, metrics } from "./utils.js";

const SYSTEM_RAW = readFileSync(resolve(import.meta.dirname, "../../../protocol/src/prompts/salesCall.system.txt"), "utf-8");
const USER_RAW = readFileSync(resolve(import.meta.dirname, "../../../protocol/src/prompts/salesCall.user.txt"), "utf-8");

const SYSTEM_PROMPT = parsePrompt(SYSTEM_RAW);
const USER_PROMPT = parsePrompt(USER_RAW);

export type OpenAIOpts = {
  apiKey: string;
  model: string;
  baseUrl?: string; // default https://api.openai.com/v1
  timeoutMs?: number;
  maxRetries?: number;
};

export interface AnalyzeResponse extends AnalyzeOutput {
  meta: {
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
}

async function withTimeout<T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  // If external signal is provided, forward its abort
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('timeout'));
        });
      })
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function getHeaders(apiKey: string, baseUrl?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Support different authentication methods for Azure/OpenRouter
  if (baseUrl?.includes('azure')) {
    headers["api-key"] = apiKey;
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  return headers;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class OpenAIProvider implements AiProvider {
  constructor(private opts: OpenAIOpts) {
    // Validate configuration
    if (!opts.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    if (!opts.model) {
      throw new Error("OpenAI model is required");
    }
  }
  
  async analyzeCall(input: AnalyzeInput): Promise<AnalyzeOutput> {
    const startTime = Date.now();
    const requestId = generateRequestId();
    let retryCount = 0;
    const maxRetries = this.opts.maxRetries || 1;
    
    // Truncate transcript with byte-based limit
    const { content: transcript, truncated } = truncateTranscript(input.transcript, 16 * 1024); // 16KB limit
    
    const messages = [
      { role: "system", content: SYSTEM_PROMPT.content },
      { role: "user", content: USER_PROMPT.content + "\n\n" + transcript }
    ];
    
    const body = {
      model: this.opts.model,
      messages,
      temperature: 0, // Explicitly set to 0 for deterministic output
      max_tokens: 1500,
      response_format: { type: "json_object" as const }, // Ensure JSON output
      metadata: {
        prompt_versions: {
          system: `${SYSTEM_PROMPT.id}@${SYSTEM_PROMPT.version}`,
          user: `${USER_PROMPT.id}@${USER_PROMPT.version}`
        },
        truncated,
        request_id: requestId
      }
    };

    const url = (this.opts.baseUrl ?? "https://api.openai.com/v1") + "/chat/completions";
    
    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        
        const fetchPromise = fetch(url, {
          method: "POST",
          headers: getHeaders(this.opts.apiKey, this.opts.baseUrl),
          body: JSON.stringify(body),
          signal: controller.signal
        });

        const res = await withTimeout(fetchPromise, this.opts.timeoutMs ?? 30000, controller.signal);
        
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const errorCode = `openai_http_${res.status}`;
          
          // Log error details in development only
          if (process.env.NODE_ENV !== 'production') {
            console.error(`OpenAI API error [${requestId}]:`, {
              status: res.status,
              error: redactForLogging(text.slice(0, 200))
            });
          }
          
          metrics.increment('ai_error_total', { provider: 'openai', error_type: errorCode });
          
          // Only retry on 5xx server errors, not 4xx client errors
          if (res.status >= 500 && res.status < 600) {
            throw new Error(errorCode);
          } else {
            // Don't retry 4xx errors - they won't succeed on retry
            throw new Error(errorCode);
          }
        }
        
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        
        if (!content || typeof content !== "string") {
          metrics.increment('ai_error_total', { provider: 'openai', error_type: 'no_content' });
          throw new Error("openai_no_content");
        }
        
        // Validate JSON structure before parsing
        let parsedContent: any;
        try {
          parsedContent = JSON.parse(content);
          if (typeof parsedContent !== 'object' || parsedContent === null || Array.isArray(parsedContent)) {
            throw new Error("Response is not a JSON object");
          }
        } catch (parseError) {
          metrics.increment('ai_error_total', { provider: 'openai', error_type: 'invalid_json' });
          if (process.env.NODE_ENV !== 'production') {
            console.error(`OpenAI JSON parse error [${requestId}]:`, redactForLogging(content.slice(0, 200)));
          }
          throw new Error("openai_invalid_json");
        }
        
        const duration = Date.now() - startTime;
        metrics.increment('ai_success_total', { provider: 'openai' });
        
        // Return with metadata - the caller will handle schema validation
        return {
          ...parsedContent,
          meta: {
            provider: 'openai',
            model: this.opts.model,
            duration_ms: duration,
            request_id: requestId,
            fallback: false,
            failed_provider: null,
            failed_error_code: null,
            prompt_versions: {
              system: `${SYSTEM_PROMPT.id}@${SYSTEM_PROMPT.version}`,
              user: `${USER_PROMPT.id}@${USER_PROMPT.version}`
            },
            truncated: truncated,
            retries: retryCount,
            schema_version: "SalesCallV1"
          }
        } as AnalyzeOutput;
        
      } catch (error) {
        retryCount++;
        const errorMsg = error instanceof Error ? error.message : 'unknown_error';
        const isLastRetry = retryCount > maxRetries;
        
        // Only retry on network errors or 5xx server errors, not 4xx client errors
        const shouldRetry = !isLastRetry && 
          (errorMsg.includes('timeout') || 
           errorMsg.includes('network') ||
           errorMsg.includes('fetch') ||
           (errorMsg.includes('openai_http_5'))) && // Only 5xx errors
          retryCount <= maxRetries;
        
        // Cap total wall-clock time: timeout * (retries+1) <= TIMEOUT * 2
        const totalTime = Date.now() - startTime;
        const maxTotalTime = (this.opts.timeoutMs ?? 30000) * 2;
        
        if (shouldRetry && totalTime < maxTotalTime) {
          // Small backoff for retries
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        // Final retry failed, throw the error
        metrics.increment('ai_error_total', { provider: 'openai', error_type: 'final_failure' });
        throw new Error(errorMsg);
      }
    }
    
    throw new Error('openai_max_retries_exceeded');
  }
}