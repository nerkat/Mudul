

````md
# .github/copilot-instructions.md
# Mudul • Copilot Agent Guide

**Primary objective:** Build and modify the UI **without breaking the seed-driven data model**.  
Always read data from `src/core/seed.ts` via `src/core/repo.ts`. Never inline mock data.

---

## 0) Tech context
- React + MUI (with possible migration to Minimal/Next later)
- Routing: React Router (`/node/:nodeId` for dashboards)
- Data model: **seed → repo → hooks → pages → widgets**
- Sidebar: renders tree from **seed**, not from ad-hoc arrays
- Dashboards: selected by `node.dashboardId` and rendered via **WidgetRegistry**

---

## 1) Canonical data flow (do not diverge)

```txt
src/core/seed.ts           // nodes{} and calls{}, multiple clients & calls
        ↓
src/core/repo.ts           // getRoot/getNode/getChildren/getDashboardId/getCallByNode
        ↓
src/hooks/useRepo.tsx      // RepoProvider + useRepo()
src/hooks/useNode.ts       // useNode(id)
src/hooks/useSalesCall.ts  // useSalesCall(nodeId)
        ↓
src/core/registry.tsx      // DashboardTemplates + WidgetRegistry (Paper/Rich)
        ↓
src/pages/DashboardPage.tsx  // reads nodeId, picks template, renders widgets
        ↓
src/shell/Sidebar[...].tsx   // TreeView populated from repo.getRoot() & getChildren()
````

**Rules**

* ✅ Always use **repo** to read data.
* ✅ Sidebar/tree **must** mirror `nodes` hierarchy.
* ✅ Dashboards **must** use `dashboardId` → `DashboardTemplates` → `WidgetRegistry`.
* ❌ Do not create new mock arrays, “demo rows,” or inline sample data anywhere.

---

## 2) Widget/product registry contract

**Widget code location:** `src/components/widgets.tsx`
Exports: `Paper`, `Rich` and prop types using `Pick<SalesCallMinimal, ...>`:

* `SummaryWidgetProps`, `SentimentWidgetProps`, `BookingWidgetProps`, `ObjectionsWidgetProps`, `ActionItemsWidgetProps`, `KeyMomentsWidgetProps`, `EntitiesWidgetProps`, `ComplianceWidgetProps`

**Registry location:** `src/core/registry.tsx`

* `DashboardTemplates: Record<string, WidgetKey[]>`
* `WidgetRegistry: Record<WidgetKey, (c: SalesCallMinimal) => React.ReactNode>`

**Copilot:**

* When adding a widget, **only pass minimal props** via `Pick<...>`; never pass the full object if not needed.
* Update both `WidgetRegistry` and `DashboardTemplates` when introducing a new widget or layout.

---

## 3) Side navigation (TreeView)

* Build the nav entirely from `repo.getRoot()` → `repo.getChildren(...)`.
* Clicking any node navigates to `/node/:nodeId`.
* Default expanded: root + all clients (fine for now).
* Do not hardcode call lists; derive from `seed`.

---

## 4) File boundaries Copilot must respect

* **types**: `src/core/types.ts`
* **seed**: `src/core/seed.ts` (single source of truth)
* **repo**: `src/core/repo.ts` (only place to query seed)
* **hooks**: `src/hooks/*` (no data shape changes here)
* **widgets**: `src/components/widgets.tsx` (styling/props only)
* **registry**: `src/core/registry.tsx` (mapping only; no IO)
* **pages/shell**: UI composition only

---

## 5) Pull request checklist (must pass)

* [ ] No mock/demo arrays introduced (`rg -n "mock|demoRows|sampleCalls"` returns nothing).
* [ ] Sidebar tree comes from `repo` and reflects multi-client/multi-call seed.
* [ ] `dashboardId` is respected and renders correct template via `WidgetRegistry`.
* [ ] New widgets use **minimal** props (`Pick<...>`), not full objects.
* [ ] Types remain in `src/core/types.ts`; no duplicate type defs elsewhere.
* [ ] `RepoProvider` wraps router at app root; pages use hooks, not repo directly.

---

## 6) Testing expectations (lightweight)

* Add Jest/RTL tests (or Playwright later) for:

  * Each `nodes` call-node has a matching `calls[nodeId]` (one assertion).
  * Dashboard renders all widgets defined by its `dashboardId` template.
  * Sidebar contains every call from seed (count check).

---

## 7) Scripts Copilot can create/maintain (optional)

* `seed:add-client` (Node script): append a new client + N calls into `seed.ts` with valid IDs, names, and `dashboardId`.
* `lint:repo-contract`: quick script to assert no file imports `seed` directly except `repo.ts`.

---

## 8) MCP usage (docs-aware coding for MUI/MUI X)

> When generating or modifying MUI code, **ground it via the MUI MCP server** (Model Context Protocol) to avoid hallucinated APIs.

**Assume the editor is configured with:**

```json
{
  "mcp": {
    "servers": {
      "mui-mcp": { "type": "stdio", "command": "npx", "args": ["-y", "@mui/mcp@latest"] }
    }
  }
}
```

**Rules for Copilot/agent:**

1. For any MUI / MUI X changes, first query `mui-mcp` for the relevant docs (DataGrid, TreeView, theming, etc.).
2. Include the property names used (e.g., `expandedItems`, `onItemClick`) and ensure they match the current version.
3. Prefer examples that work with React Router v6 for navigation.
4. When migrating to Minimal/Next (future), still use MUI MCP for component APIs.

**Prompts you (Copilot) should use:**

* “Using MUI X `SimpleTreeView`, show router-aware nav with `expandedItems` and `onItemClick`.”
* “DataGrid minimal table with pagination + sorting; cite the MUI X API properties used.”
* “`createTheme` example to set `shape.borderRadius=12` and dark/light toggle.”

---

## 9) When extending features

* Add new node types only if needed; update `NodeType` union and seed accordingly.
* For non-call dashboards (client/org), introduce dedicated renderers but keep the same **dashboardId → template → registry** pipeline.
* Keep **business data** in seed; keep **presentation** in widgets.

---

## 10) Anti-patterns (reject in review)

* Inline JSON mocks or demo arrays in pages/components.
* Fetching from `seed` outside of `repo.ts`.
* Passing entire `SalesCallMinimal` to widgets that need only 1–2 fields.
* Duplicating types or creating “view models” that drift from core types.

---

## 11) Snippets Copilot may insert (allowed)

* **Sidebar TreeView:**

  ```tsx
  <SimpleTreeView
    expandedItems={[root.id, ...clients.map(c => c.id)]}
    onItemClick={(_, id) => id && nav(`/node/${id}`)}
  >
    {/* build items from repo.getChildren(...) */}
  </SimpleTreeView>
  ```
* **Dashboard renderer loop:**

  ```tsx
  <Grid container spacing={2}>
    {widgets.map((k) => (
      <Grid key={k} item xs={12} md={6}>
        {WidgetRegistry[k](call)}
      </Grid>
    ))}
  </Grid>
  ```

---

## 12) Roadmap hints for the agent

* Later: move `DashboardTemplates` to JSON to enable runtime re-layout.
* Later: add `client` and `org` aggregations (roll up from `calls` by relation).
* Later: replace in-memory seed with DB adapter; keep `repo` API stable to avoid UI churn.

```

::contentReference[oaicite:0]{index=0}
```
