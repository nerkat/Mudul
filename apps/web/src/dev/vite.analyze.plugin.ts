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

            const provider = new MockAiProvider();
            try {
              const output = await provider.analyzeCall({ transcript: parsed.data.transcript });
              const valid = validateSalesCall(output);
              if (!valid.success) {
                res.statusCode = 422;
                return res.end(JSON.stringify({
                  error: "invalid_schema",
                  details: valid.errors?.map((i: any) => ({
                    path: Array.isArray(i.path) ? i.path.join(".") : String(i.path),
                    message: i.message
                  })) ?? []
                }));
              }
              res.statusCode = 200;
              return res.end(JSON.stringify({ data: valid.data }));
            } catch (e) {
              // Log the actual error in dev mode
              console.error('Provider error:', e);
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: "provider_error", details: ["Internal AI provider error"] }));
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