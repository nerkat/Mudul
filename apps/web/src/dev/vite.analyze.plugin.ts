import type { Plugin } from "vite";
import { z } from "zod";
import { validateSalesCall } from "@mudul/protocol";
import { MockAiProvider } from "@mudul/core";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  transcript: z.string().min(1)
});

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB limit

export default function analyzePlugin(): Plugin {
  return {
    name: "dev-analyze-api",
    apply: "serve", // dev only
    enforce: "pre", // ensures plugin runs before others
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url?.startsWith("/api/analyze")) return next();

        try {
          // Check content-length for payload size limit
          const contentLength = parseInt(req.headers['content-length'] || '0', 10);
          if (contentLength > MAX_PAYLOAD_SIZE) {
            res.statusCode = 413;
            return res.end(JSON.stringify({ error: "payload_too_large", details: ["Request body exceeds 10MB limit"] }));
          }

          const chunks: Buffer[] = [];
          let totalSize = 0;
          
          req.on("data", (chunk) => {
            totalSize += chunk.length;
            if (totalSize > MAX_PAYLOAD_SIZE) {
              res.statusCode = 413;
              return res.end(JSON.stringify({ error: "payload_too_large", details: ["Request body exceeds 10MB limit"] }));
            }
            chunks.push(chunk);
          });
          
          req.on("end", async () => {
            res.setHeader("content-type", "application/json");
            const raw = Buffer.concat(chunks).toString("utf-8");
            let json: unknown;
            try {
              json = JSON.parse(raw);
            } catch {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: "invalid_request", details: ["invalid_json"] }));
            }

            const parsed = bodySchema.safeParse(json);
            if (!parsed.success) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ 
                error: "invalid_request", 
                details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
              }));
            }

            // Provider selection based on USE_LIVE_AI environment variable
            const useLive = process.env.USE_LIVE_AI === "true";
            let provider: any;
            
            if (useLive) {
              const { OpenAIProvider } = await import("@mudul/core");
              provider = new OpenAIProvider({
                apiKey: process.env.OPENAI_API_KEY || "",
                model: process.env.OPENAI_MODEL || "gpt-4o-mini", // configurable default
                baseUrl: process.env.OPENAI_BASE_URL || undefined,
                timeoutMs: 30000
              });
            } else {
              provider = new MockAiProvider();
            }

            let resultSource: "live" | "mock" | "fallback_mock" = useLive ? "live" : "mock";
            let output: any;

            try {
              if (useLive && !process.env.OPENAI_API_KEY) throw new Error("missing_api_key");
              output = await provider.analyzeCall({ transcript: parsed.data.transcript });
              const valid = validateSalesCall(output);
              if (!valid.success) throw new Error("schema_invalid");
              res.statusCode = 200;
              return res.end(JSON.stringify({ data: valid.data, source: resultSource }));
            } catch (e) {
              // Fallback to mock if live failed
              if (useLive) {
                try {
                  const mock = new MockAiProvider();
                  const out = await mock.analyzeCall({ transcript: parsed.data.transcript });
                  const valid = validateSalesCall(out);
                  if (!valid.success) throw new Error("mock_schema_invalid");
                  resultSource = "fallback_mock";
                  res.statusCode = 200;
                  return res.end(JSON.stringify({ data: valid.data, source: resultSource, note: "live_failed_fallback_mock" }));
                } catch {}
              }
              // Log the actual error in dev mode
              console.error('Provider error:', e);
              res.statusCode = 502;
              return res.end(JSON.stringify({ error: "provider_error" }));
            }
          });
        } catch (e) {
          console.error('Server error:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "server_error", details: ["Internal server error"] }));
        }
      });
    }
  };
}