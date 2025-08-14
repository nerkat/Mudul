import type { Plugin } from "vite";
import { z } from "zod";
import { validateSalesCall } from "@mudul/protocol";
import { MockProvider } from "@mudul/core";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  transcript: z.string().min(1)
});

export default function analyzePlugin(): Plugin {
  return {
    name: "dev-analyze-api",
    apply: "serve", // dev only
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url?.startsWith("/api/analyze")) return next();

        try {
          const chunks: Buffer[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", async () => {
            res.setHeader("content-type", "application/json");
            const raw = Buffer.concat(chunks).toString("utf-8");
            let json: unknown;
            try {
              json = JSON.parse(raw);
            } catch {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: "invalid_request", details: "invalid_json" }));
            }

            const parsed = bodySchema.safeParse(json);
            if (!parsed.success) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: "invalid_request", details: parsed.error.issues }));
            }

            const provider = new MockProvider();
            try {
              const output = await provider.analyzeCall({ transcript: parsed.data.transcript });
              const valid = validateSalesCall(output);
              if (!valid.success) {
                res.statusCode = 422;
                return res.end(JSON.stringify({
                  error: "invalid_schema",
                  issues: valid.errors?.map((i: any) => ({
                    path: Array.isArray(i.path) ? i.path.join(".") : String(i.path),
                    message: i.message
                  })) ?? []
                }));
              }
              res.statusCode = 200;
              return res.end(JSON.stringify({ data: valid.data }));
            } catch (e) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: "provider_error" }));
            }
          });
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "server_error" }));
        }
      });
    }
  };
}