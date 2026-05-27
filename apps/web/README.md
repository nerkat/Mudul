# Mudul Web App

This app is the prototype interface for Mudul, an AI Client Intelligence Workbench. It combines transcript intake, server-side AI analysis, seeded demo data, and dashboard views for organizations, clients, and individual calls.

## What is in this app

- transcript input for new call analysis
- org-level dashboard for cross-client activity and health signals
- client-level dashboard for account history, KPIs, and follow-up context
- call-level view for structured AI output
- Google sign-in support for local/demo workspace provisioning

## AI behavior

The app supports two modes:

- mock mode for deterministic local demos
- live provider mode for server-side OpenAI or Anthropic analysis

AI responses are expected to map into structured fields such as summary, sentiment, booking likelihood, objections, action items, entities, key moments, and compliance flags.

## Local setup

Use the root `.env.example` or [`apps/web/.env.example`](./.env.example) as a template.

Key variables:

```bash
DATABASE_URL="file:../../packages/storage/dev.db"
JWT_SECRET="replace-with-a-long-random-local-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
VITE_GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"

USE_LIVE_AI=false
AI_PROVIDER=openai
AI_API_KEY="your-provider-api-key"
OPENAI_API_KEY="your-openai-api-key"
AI_MODEL="gpt-4o-mini"
AI_TIMEOUT_MS=30000
AI_MAX_TOKENS=1500
```

For local Google sign-in, your OAuth client should allow `http://localhost:5173` as an authorized JavaScript origin.

## Run it

```bash
pnpm install
pnpm --filter web dev
```

The app runs at `http://localhost:5173`.

## Notes

- Live AI execution stays server-side.
- Development can fall back to mock data when credentials are absent.
- Some infrastructure still reflects prototype tradeoffs and local-demo ergonomics rather than production hardening.
