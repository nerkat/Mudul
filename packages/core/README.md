# @core
Domain layer: types, repositories, and domain events.
- No React or UI imports.
- Exposes in-memory repos initially (DB added later via @storage).

## Quickstart (dev)

```ts
import { seedRepos } from "@core";

const repos = seedRepos();
// resolve a node by path: /acme/sales/acme-co/2025-08-10
const node = await repos.nodes.byPath("acme", ["sales","acme-co","2025-08-10"]);
const dash = node?.dashboardId ? await repos.dashboards.get(node.dashboardId) : null;
const sessionId = node?.dataRef?.type === "session" ? node.dataRef.id : null;
const analysis = sessionId ? await repos.analyses.latestForSession(sessionId) : null;
```