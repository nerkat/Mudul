# Agent Workbench (Monorepo)

Modular, protocol-first workbench for AI-assisted call & interview analysis.

## Packages (high level)
- `@core` — domain types, repos, events (no React)
- `@protocol` — AI contracts (JSON schema), validators, and provider clients
- `@storage` — persistence adapters (memory/postgres/firestore)
- `@ui-headless` — widget contracts & logic (no DOM/Native)
- `@ui-web` — React web renderers (thin adapters over headless)
- `apps/web` — React app shell

## Live AI Integration

The app supports live AI analysis through OpenAI and Anthropic providers with proper security and validation:

### Configuration

```bash
# Enable live AI (default: false for security)
export VITE_USE_LIVE_AI=true

# Server-side AI configuration (never bundled to client)
export AI_PROVIDER=openai              # or "anthropic"
export AI_API_KEY=sk-proj-...          # Your API key
export AI_MODEL=gpt-4o-mini            # Model to use
export AI_TIMEOUT_MS=30000             # Timeout in milliseconds
export AI_MAX_TOKENS=1500              # Max response tokens
```

### Security Features

- ✅ **Server-side only**: AI SDKs run in Vite middleware, never bundled to client
- ✅ **No key leakage**: API keys stay server-side, never in dist/ JavaScript
- ✅ **Schema validation**: All AI responses validated with Zod before persistence
- ✅ **Content hashing**: SHA-256 idempotency prevents duplicate analysis
- ✅ **Deterministic**: temperature=0, top_p=1 for consistent responses

### Architecture

```
Client HTTP Request → Vite Plugin Middleware → AI Provider → Schema Validation → Response
```

The live AI is implemented as a Vite plugin (`src/plugins/liveAi.ts`) that handles:
- Dynamic AI SDK imports (server-side only)
- Schema-first prompt generation
- Comprehensive error handling (timeout, validation, provider errors)
- Observability logging

When `VITE_USE_LIVE_AI=false`, requests fall back to the mock AI plugin.
1. **0001** — Project structure (this PR)
2. 0002 — Core types + in-memory repos
3. 0003 — Minimal web app shell + router + placeholder dashboard
4. 0004 — Data models + API skeleton (mock)
5. 0005 — AI protocol (JSON schemas) + mock provider
6. 0006 — Real provider + validation + WS updates
