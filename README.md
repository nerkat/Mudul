# Agent Workbench (Monorepo)

A **protocol-first, modular workbench** for AI-assisted call and interview analysis.  
Designed for extensibility, strict validation, and production-grade reliability.

---

## 📦 Packages

- **`@core`** — Domain types, repositories, and event system (no React)  
- **`@protocol`** — AI contracts (JSON schema), validators, and provider clients  
- **`@storage`** — Persistence adapters (memory / Postgres / Firestore)  
- **`@ui-headless`** — Widget contracts & logic (DOM-agnostic)  
- **`@ui-web`** — React renderers (thin adapters over headless widgets)  
- **`apps/web`** — Web application shell (React + Tailwind)

---

## ⚡ Live AI Integration

The workbench supports **live AI analysis** through OpenAI and Anthropic, with strict security and validation.

### Configuration

```bash
# Enable live AI (default: false — safest for dev)
export USE_LIVE_AI=true

# Server-side AI configuration (never exposed to client)
export AI_PROVIDER=openai              # or "anthropic"
export AI_API_KEY=sk-proj-...          # Your provider key
export AI_MODEL=gpt-4o-mini            # Model to use
export AI_TIMEOUT_MS=30000             # Request timeout (ms)
export AI_MAX_TOKENS=1500              # Max response tokens

🔒 Security Features

✅ Server-only SDK usage — AI SDKs run inside Vite middleware, never bundled to client

✅ No key leakage — API keys remain server-side, never shipped in dist/JS

✅ Schema validation — All AI responses validated via Zod before persistence

✅ Idempotency via hashing — SHA-256 content hashing prevents duplicate analysis

✅ Deterministic output — temperature=0, top_p=1 ensures consistent responses



---

🏗️ Architecture

Client HTTP Request 
   → Vite Middleware Plugin 
   → AI Provider 
   → Schema Validation 
   → Response (stored & streamed to UI)

The Live AI Plugin (src/plugins/liveAi.ts) implements:

Dynamic server-side SDK imports

Schema-first prompt generation

Timeout, validation, and provider error handling

Observability logs for monitoring & debugging


When USE_LIVE_AI=false, the system falls back to a mock provider for safe local development.


---

🚀 Roadmap

1. 0001 — Project structure (this PR)


2. 0002 — Core types + in-memory repos


3. 0003 — Minimal web app shell + router + placeholder dashboard


4. 0004 — Data models + API skeleton (mock)


5. 0005 — AI protocol (JSON schemas) + mock provider


6. 0006 — Real provider integration + validation + WS updates




---

🧪 Development

# Install dependencies
pnpm install

# Run web app in dev mode
pnpm dev

# Build all packages
pnpm build


---
