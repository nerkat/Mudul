# Agent Workbench (Monorepo)

Modular, protocol-first workbench for AI-assisted call & interview analysis.

## Packages (high level)
- `@core` — domain types, repos, events (no React)
- `@protocol` — AI contracts (JSON schema), validators, and provider clients
- `@storage` — persistence adapters (memory/postgres/firestore)
- `@ui-headless` — widget contracts & logic (no DOM/Native)
- `@ui-web` — React web renderers (thin adapters over headless)
- `apps/web` — React app shell

## Roadmap (issues)
1. **0001** — Project structure (this PR)
2. 0002 — Core types + in-memory repos
3. 0003 — Minimal web app shell + router + placeholder dashboard
4. 0004 — Data models + API skeleton (mock)
5. 0005 — AI protocol (JSON schemas) + mock provider
6. 0006 — Real provider + validation + WS updates
