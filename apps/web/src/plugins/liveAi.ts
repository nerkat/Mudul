import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { SalesCallAnalysis } from "@mudul/protocol";

/**
 * Live AI plugin for server-side AI provider integration.
 * Handles OpenAI and Anthropic API calls with proper validation and security.
 */
export function liveAiPlugin(): Plugin {
  return {
    name: 'live-ai-plugin',
    configureServer(server) {
      // Ensure non VITE_ env vars are loaded (OPENAI_API_KEY etc.)
      const envAll = loadEnv(server.config.mode, process.cwd(), '');
      for (const [k,v] of Object.entries(envAll)) {
        if (!(k in process.env)) process.env[k] = v;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('[LIVE AI INIT]', {
          mode: server.config.mode,
            hasOPENAI: !!process.env.OPENAI_API_KEY,
            hasAI: !!process.env.AI_API_KEY,
            provider: process.env.AI_PROVIDER || 'openai'
        });
      }
      server.middlewares.use('/api/ai/analyze', async (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[LIVE AI PLUGIN] request start', {
              USE_LIVE_AI: process.env.USE_LIVE_AI,
              AI_PROVIDER: process.env.AI_PROVIDER,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'present' : 'missing',
              AI_API_KEY: process.env.AI_API_KEY ? 'present' : 'missing'
            });
          }
          // Parse request body
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });

          await new Promise<void>((resolve) => {
            req.on('end', resolve);
          });

          const { transcript, mode, schemaVersion } = JSON.parse(body);

          // Validate required fields
          if (!transcript || !mode || !schemaVersion) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Missing required fields: transcript, mode, schemaVersion'
              }
            }));
            return;
          }

          // Generate content hash server-side for idempotency
          const contentHash = await generateContentHash(schemaVersion + transcript);

          // Get AI configuration from environment
          const aiConfig = getAIConfig();
          
          // Debug logging for server environment (as suggested in issue)
          if (process.env.NODE_ENV !== 'production') {
            console.log('[SERVER ENV]', {
              cwd: process.cwd(),
              AI_API_KEY: process.env.AI_API_KEY,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY,
              hasKey: !!(process.env.AI_API_KEY || process.env.OPENAI_API_KEY),
              AI_MODEL: process.env.AI_MODEL,
              OPENAI_MODEL: process.env.OPENAI_MODEL,
              AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS
            });
          }
          
          if (!aiConfig) {
            const details = {
              AI_PROVIDER: process.env.AI_PROVIDER,
              hasAI_API_KEY: !!process.env.AI_API_KEY,
              hasOPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
              keys: Object.keys(process.env).filter(k => /AI_|OPENAI_/.test(k)).sort()
            };
            const stub = buildStubAnalysis('Stub analysis (no API key configured)');
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[LIVE AI CONFIG_ERROR] missing api key → stub', details);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              analysis: stub,
              meta: {
                provider: 'openai',
                model: process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
                duration_ms: 1,
                request_id: `stub_${Date.now()}`,
                schemaVersion,
                contentHash,
                stub: true,
                configError: details
              }
            }));
            return;
          }

          // Call AI provider with timeout
          const startTime = Date.now();
          const result = await callAIProvider({
            transcript,
            mode,
            schemaVersion,
            config: aiConfig
          });

          const durationMs = Date.now() - startTime;

          // Log observability data (redacting transcript)
          console.log({
            provider: aiConfig.provider,
            model: aiConfig.model,
            durationMs,
            result: result.ok ? "ok" : result.error?.code,
            contentHashPrefix: contentHash.substring(0, 8)
          });

          if (!result.ok) {
            res.statusCode = result.error?.code === 'TIMEOUT' ? 408 : 
                           result.error?.code === 'SCHEMA_INVALID' ? 422 : 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
            return;
          }

          // Server-side validation before returning
          const validatedData = SalesCallAnalysis.safeParse(result.data);
          if (!validatedData.success) {
            res.statusCode = 422;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: false,
              error: {
                code: 'SCHEMA_INVALID',
                message: 'AI response failed validation',
                details: validatedData.error.format()
              }
            }));
            return;
          }

          // Return successful response with structure matching mock plugin
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            analysis: validatedData.data,
            meta: {
              provider: aiConfig.provider,
              model: aiConfig.model,
              duration_ms: durationMs,
              request_id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              schemaVersion,
              contentHash,
              updatedAt: new Date().toISOString()
            }
          }));

        } catch (error) {
          console.error('[LIVE AI UNHANDLED]', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            ok: false,
            error: {
              code: 'SERVER_ERROR',
              message: 'Internal server error',
              details: error instanceof Error ? error.message : String(error)
            }
          }));
        }
      });
    },
  };
}

async function generateContentHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAIConfig() {
  const provider = process.env.AI_PROVIDER || "openai";
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  // Support both AI_API_KEY and OPENAI_API_KEY for consistency with core provider factory
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || "30000", 10);
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || "1500", 10);

  if (!apiKey) {
    return null;
  }

  return {
    provider: provider as "openai" | "anthropic",
    model,
    apiKey,
    timeoutMs,
    maxTokens
  };
}

async function callAIProvider({
  transcript,
  mode,
  schemaVersion,
  config
}: {
  transcript: string;
  mode: string;
  schemaVersion: string;
  config: ReturnType<typeof getAIConfig>;
}) {
  if (!config) {
    return { ok: false, error: { code: 'CONFIG_ERROR' } };
  }

  const messages = buildAnalysisPrompt({ transcript, mode, schemaVersion });

  // Import AI SDKs only on server-side
  let rawJSON: any;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), config.timeoutMs);

  try {
    // Fast stub path for local fake keys to avoid external network + long timeout
    if (config.apiKey.startsWith('sk-test-fake-key')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AI LIVE] stub openai response (fake key detected)');
      }
      rawJSON = buildStubAnalysis('Stub analysis (fake key) for local testing');
    } else if (config.provider === "openai") {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AI LIVE] openai branch running');
      }
      
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: config.apiKey });
      
      const res = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: 0,
        top_p: 1,
        max_tokens: config.maxTokens,
        response_format: { type: "json_object" },
      }, {
        signal: abort.signal
      });
      
      rawJSON = JSON.parse(res.choices[0]?.message?.content || "{}");
    } else if (config.provider === "anthropic") {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AI LIVE] anthropic branch running');
      }
      
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: config.apiKey });
      
      const res = await client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: 0,
        top_p: 1,
        messages: messages.filter(m => m.role !== "system") as any[],
        system: messages.find(m => m.role === "system")?.content || "Output JSON only.",
      }, {
        signal: abort.signal
      });
      
      rawJSON = JSON.parse((res.content[0] as any)?.text || "{}");
    } else {
      return { ok: false, error: { code: 'PROVIDER_ERROR', message: 'Unsupported provider' } };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { ok: false, error: { code: "TIMEOUT" } };
    }
    return { ok: false, error: { code: "PROVIDER_ERROR", details: err.message } };
  } finally {
    clearTimeout(timer);
  }

  return { ok: true, data: rawJSON };
}

function buildStubAnalysis(summary: string) {
  return {
    summary,
    sentiment: { overall: 'neutral', score: 0.5 },
    bookingLikelihood: 0.4,
    objections: [],
    actionItems: [],
    keyMoments: [],
    entities: { prospect: [], people: [], products: [] },
    complianceFlags: []
  };
}

function buildAnalysisPrompt({ transcript, mode, schemaVersion }: {
  transcript: string;
  mode: string;
  schemaVersion: string;
}) {
  const systemPrompt = `You are an expert sales call analyzer. Analyze the following transcript and return a JSON response matching the exact schema below.

SCHEMA VERSION: ${schemaVersion}
ANALYSIS MODE: ${mode}

Required JSON Schema:
{
  "summary": "string (max 2000 chars)",
  "sentiment": {
    "overall": "positive" | "negative" | "neutral",
    "score": number (0.0 to 1.0)
  },
  "bookingLikelihood": number (0.0 to 1.0),
  "objections": [
    {
      "type": "pricing" | "technical" | "timing" | "authority" | "need",
      "quote": "string (exact quote from transcript)",
      "ts": "string (MM:SS format)"
    }
  ],
  "actionItems": [
    {
      "owner": "string (who is responsible)",
      "text": "string (what needs to be done)",
      "due": "string (YYYY-MM-DD format, optional)"
    }
  ],
  "keyMoments": [
    {
      "label": "string (brief description)",
      "ts": "string (MM:SS format)"
    }
  ],
  "entities": {
    "prospect": ["string (company names)"],
    "people": ["string (person names)"],
    "products": ["string (product/service names)"]
  },
  "complianceFlags": [
    {
      "type": "string (violation type)",
      "description": "string (what happened)",
      "severity": "low" | "medium" | "high"
    }
  ]
VALIDATION RULES:
- sentiment.score must be between 0.0 and 1.0
- bookingLikelihood must be between 0.0 and 1.0  
- objection.type must be one of: pricing, technical, timing, authority, need
- timestamps must be in MM:SS format
- All enum values must be lowercase
- No additional fields beyond the schema
- All arrays can be empty if no relevant data found

Return ONLY valid JSON matching this exact schema. No explanations or prose.`;

  return [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: `Analyze this sales call transcript:\n\n${transcript}` }
  ];
}