import type { Plugin } from "vite";
import { validateSalesCall } from "@mudul/protocol";
import sample from "./fixtures/sales-call.sample.json";

export default function apiPlugin(): Plugin {
  return {
    name: "dev-mock-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const m = url.match(/^\/api\/sessions\/([^/]+)\/analysis$/);
        if (!m) return next();
        const sessionId = decodeURIComponent(m[1]);

        // routing
        if (sessionId !== "session-001") {
          res.statusCode = 404;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "not_found" }));
          return;
        }

        // validation
        const result = validateSalesCall(sample);
        if (!result.success) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "invalid_schema", details: result.errors }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(result.data));
      });
    }
  };
}