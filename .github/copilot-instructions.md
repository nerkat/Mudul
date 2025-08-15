
````md
# Mudul • Copilot Agent Guide

**Primary objective:** Build and modify the UI **without breaking the seed-driven data model**.  
Always read data from `apps/web/src/core/seed.ts` via `apps/web/src/core/repo.ts`. Never inline mock data.

---

## 0) Tech context
- React + MUI v7 (current working implementation)
- Routing: React Router (`/node/:nodeId` for dashboards)
- Data model: **seed → repo → hooks → pages → widgets**
- **Adapters layer**: repo data → widget props (no repo imports in widgets)
- **Design tokens**: theme comes from tokens JSON → MUI theme (swappable)
- Sidebar: renders tree from **seed**, not from ad-hoc arrays
- Dashboards: selected by `node.dashboardId` and rendered via **WidgetRegistry**
- Paper mode: `?mode=paper` + keyboard `p` → **PaperWidgetRenderer** (text‑only), else rich

---

## 1) Canonical data flow (✅ IMPLEMENTED)

```txt
apps/web/src/core/seed.ts       // nodes{} and calls{}, multiple clients & calls
        ↓
apps/web/src/core/repo.ts       // getRoot/getNode/getChildren/getDashboardId/getCallByNode
        ↓
apps/web/src/hooks/useRepo.tsx  // RepoProvider + useRepo()
apps/web/src/hooks/useNode.ts   // useNode(id)
apps/web/src/hooks/useSalesCall.ts  // useSalesCall(nodeId)
        ↓
apps/web/src/core/registry.tsx  // DashboardTemplates + WidgetRegistry (Paper/Rich)
        ↓
apps/web/src/pages/DashboardPage.tsx  // reads nodeId, picks template, renders widgets
        ↓
apps/web/src/shell/AppShell.tsx  // TreeView populated from repo.getRoot() & getChildren()
````

**Rules**

* ✅ Always use **repo** to read data.
* ✅ Sidebar/tree **must** mirror `nodes` hierarchy.
* ✅ Dashboards **must** use `dashboardId` → `DashboardTemplates` → `WidgetRegistry`.
* ❌ Do not create new mock arrays, “demo rows,” or inline sample data anywhere.

---

## 2) Widget/product registry contract

**Widget code location:** `src/components/widgets.tsx`
Widgets are **pure presentational**: accept `{ data, params }` only (no repo imports).

Prop types should use `Pick<SalesCallMinimal, ...>` or custom minimal shapes.

**Registry location:** `src/core/registry.tsx`

* `DashboardTemplates: Record<string, WidgetConfig[]>` where each `WidgetConfig = { slug, params? }`
* `WidgetRegistry: Record<WidgetSlug, React.FC<{ data:any; params?:any }>>`

**Copilot:**

* When adding a widget, **only pass minimal props**; never pass the full call object if not needed.
* Update both `WidgetRegistry` and `DashboardTemplates` when introducing a new widget or layout.

---

## 3) Adapters (the **diff layer** — required pattern)

**Location:** `src/adapters/*`

* Convert **repo shapes → widget data**.
* Widgets must **not** import repo or seed.
* Example: `adapters/salesCall/sentiment.adapter.ts` exposes `toSentimentData(call) → { overall, score }`.

**Copilot must:**

* Add/modify adapters instead of touching widgets when backend fields change.
* Keep dashboards as **config + adapters**, not view logic.

---

## 4) Side navigation (TreeView)

* Build the nav entirely from `repo.getRoot()` → `repo.getChildren(...)`.
* Clicking any node navigates to `/node/:nodeId`.
* Default expanded: root + all clients (fine for now).
* Do not hardcode call lists; derive from `seed`.

---

## 5) File boundaries Copilot must respect

* **types**: `src/core/types.ts`
* **seed**: `src/core/seed.ts` (single source of truth)
* **repo**: `src/core/repo.ts` (only place to query seed)
* **adapters**: `src/adapters/**/*` (map repo data → widget props)
* **hooks**: `src/hooks/*` (no data shape changes here)
* **widgets**: `src/components/widgets.tsx` (presentational only)
* **registry**: `src/core/registry.tsx` (mapping only; no IO)
* **pages/shell**: UI composition only
* **theme**: `src/core/theme/*` (create theme from tokens)
* **tokens**: `src/core/tokens/*.json` (brand/theme JSON)

---

## 6) Paper mode contract

* Toggle by `?mode=paper` and keyboard **`p`**.
* `usePaperMode()` reads/writes the URL param and exposes `{ isPaper, toggle }`.
* `WidgetRenderer` must branch: `isPaper ? PaperWidgetRenderer : RichWidgetRenderer`.
* `PaperWidgetRenderer` uses simple title + plaintext/JSON (or `paperTemplates[slug]`).

---

## 7) JSON‑Driven Widgets Protocol

* Slugs + param schemas live in `src/core/widgets/protocol.ts` & `params.ts` (Zod).
* Dashboard templates are arrays of `{ slug, params? }`.
* Validate templates with `DashboardTemplate.parse()` **before** render.
* **AI contract** returns optional `AIDashboardPayload` using the same template shape/version.

---

## 8) Live AI integration (guardrails)

* Server-side Zod validation is the **primary boundary** (no UI writes on invalid JSON).
* Determinism: `temperature:0`, `top_p:1`, pinned model string.
* Idempotency: `contentHash` + `schemaVersion` check **before** `upsertCall`.
* Timeouts/Abort → `TIMEOUT` / `CANCELLED`, **no** persistence on either path.
* Observability logs redact transcript; include `{ callId, provider, model, durationMs, result }`.

---

## 9) Pull request checklist (must pass)

* [ ] No mock/demo arrays introduced (`rg -n "mock|demoRows|sampleCalls"` returns nothing).
* [ ] Sidebar tree comes from `repo` and reflects multi-client/multi-call seed.
* [ ] `dashboardId` is respected and renders correct template via `WidgetRegistry`.
* [ ] Widgets receive minimal `{ data, params }`, no repo imports.
* [ ] Adapters used for all data shaping; no widget reaches into repo/seed directly.
* [ ] Types remain in `src/core/types.ts`; no duplicate type defs elsewhere.
* [ ] `RepoProvider` wraps router; pages use hooks, not repo directly.
* [ ] Paper mode works via URL + keyboard; renders `PaperWidgetRenderer`.

---

## 10) Testing expectations (lightweight)

* Each call node in `nodes` has matching entry in `calls` (one assertion).
* Dashboard renders all widgets defined by its `dashboardId` template.
* Sidebar contains every call from seed (count check).
* Paper mode: same dashboard renders using `PaperWidgetRenderer` with plaintext JSON.

---

## 11) Scripts Copilot may create/maintain (optional)

* `seed:add-client`: Node script that appends a new client + N calls into `seed.ts` with valid IDs & `dashboardId`.
* `lint:repo-contract`: CI script to assert no file imports `seed` outside `repo.ts`.

---

## 12) MCP usage (MUI/MUI X docs awareness)

Use the MUI MCP server when generating or modifying MUI code to avoid hallucinated APIs.

**Rules:**

1. Query MCP for the exact component API (TreeView, DataGrid, theming).
2. Use property names from docs (version‑accurate).
3. Prefer Router v6‑friendly examples.
4. When we adopt Minimals, still consult MCP for component props.

Prompts Copilot should use:

* “Using MUI X `SimpleTreeView`, show router-aware nav with `expandedItems` and `onItemClick`.”
* “Create a MUI theme from tokens (palette/shape/typography) and provide a dark/light toggle.”

---

## 13) Roadmap hints for the agent

* Later: move `DashboardTemplates` to JSON for runtime layouts.
* Later: add client/org aggregate dashboards (rollups).
* Later: DB adapter replaces in-memory seed; keep `repo` API stable to prevent UI churn.

```

---

# 2) Issue: “Immediate Do‑This‑Now” tasks (tokens/theme + adapters + paper branch)
Create a new GitHub issue with this content:

**Title:** Implement tokens/theme pipeline, adapters layer, and paper‑mode renderer branch

**Goal**  
Make the UI fully modular and swappable with minimal diffs:
- Theme comes from **tokens JSON → MUI theme**.
- Widgets are **pure presentational**; all data shaping via **adapters**.
- **Paper mode** uses a simple renderer branch (title + plaintext/JSON).

**Scope**
- Add **design tokens** JSON (`src/core/tokens/default.json`) and a **theme factory** (`src/core/theme/createThemeFromTokens.ts`) to produce the MUI theme from tokens.
- Wrap the app with `ThemeProvider(createThemeFromTokens(activeTokens))`.
- Add a lightweight **ThemeSwitcher** to hot‑swap token files at runtime (for now, load `default.json` only; stub API for others).
- Introduce **adapters**: `src/adapters/salesCall/*` to map repo shapes → widget props (e.g., `toSummaryData`, `toSentimentData`, etc).
- Refactor **WidgetRenderer** to receive `{ data, params }` only. Widgets must **not** import repo/seed.
- Add `usePaperMode()` hook and **branch** in `WidgetRenderer` to `PaperWidgetRenderer` when `?mode=paper` or `p` pressed.
- Provide `paperTemplates.ts` for simple text renderers; fallback to JSON stringify.

**Deliverables**
1) `src/core/tokens/default.json` (palette, spacing, radius, typography).  
2) `src/core/theme/createThemeFromTokens.ts` + `src/core/theme/index.ts` (ThemeProvider wrapper).  
3) `src/adapters/salesCall/*.adapter.ts` (summary, sentiment, booking, objections, action items, key moments, entities).  
4) `src/widgets/PaperWidgetRenderer.tsx` + `src/widgets/paperTemplates.ts`.  
5) `src/hooks/usePaperMode.ts` + keyboard toggle in `AppShell` or `DashboardPage`.  
6) Update `WidgetRenderer` to branch on paper mode and to pass `{ data, params }` to widgets.

**Acceptance Criteria**
- Changing values in `default.json` updates the app theme without code changes.
- All widgets render using **adapter‑provided data** (no repo imports in widgets).
- Paper mode toggles via URL (`?mode=paper`) and keyboard `p`, with no full reload.
- Paper renderer shows a title and plaintext (or JSON) for **every** widget.
- No inline demo arrays; all data comes from repo → adapters.

**Checklist**
- [ ] Add tokens JSON + theme factory; wrap ThemeProvider.  
- [ ] Build `usePaperMode()` + keyboard toggle.  
- [ ] Implement `PaperWidgetRenderer` + `paperTemplates`.  
- [ ] Create adapters for all current widgets.  
- [ ] Refactor widgets to accept `{ data, params }` only.  
- [ ] Update `WidgetRegistry` to render widgets with adapter outputs.  
- [ ] Verify Sidebar still uses repo and reflects seed hierarchy.  
- [ ] Light tests: dashboard renders all template widgets; paper mode renders text; no widget imports repo/seed.

**Notes for Copilot**
- Do **not** bypass repo; never read `seed` outside `repo.ts`.
- Keep widgets dumb; put all data shape logic in adapters.
- Use MUI MCP server for component API references.
- Maintain existing dashboard templates; only adjust the renderer and adapters.

---


```
