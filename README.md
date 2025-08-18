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
