# Mudul

Mudul is a protocol-first AI workflow workbench for turning unstructured real-world conversations and interactions into structured operational intelligence.

This repository is a product prototype and workflow exploration, not a finished SaaS product. The focus is on how messy human input gets constrained, validated, stored, and turned into usable product state instead of staying as a one-off AI summary.

## Core idea

Mudul is not just "AI summarizes a call."

It is an AI-to-UI workflow architecture:

`unstructured human interaction -> structured JSON -> validated data -> persistent state -> usable product UI`

In practice that means:

- raw transcripts or notes come in
- AI analyzes them through schema-validated JSON contracts
- the output maps directly into UI components and workflows
- summaries become dashboards
- action items become todo lists with priority, owner, and due dates
- objections become risk signals
- entities become structured records
- follow-ups become operational state

## Example use cases

The current sales-call flow is the first demo vertical and proof of concept, but the same architecture can apply to:

- sales calls
- job interviews
- support calls
- consulting sessions
- research interviews
- internal meetings
- client discovery
- coaching and advisory sessions

## What it does today

- accepts a new transcript or notes input
- sends the interaction through a server-side AI analysis step
- validates the response against structured JSON contracts
- persists usable outputs such as summaries, objections, action items, entities, and sentiment
- surfaces the results in client-level and org-level dashboard views

## Main workflow

1. A user adds a transcript or messy conversation notes.
2. The server routes the input into a mock or live AI provider flow.
3. The response is normalized into a strict schema.
4. Structured analysis is stored with call or interaction metadata.
5. The validated output becomes product UI and workflow state.

## Sales-call demo context

The current demo focuses on sales-call analysis. It takes a transcript, runs structured AI analysis, and turns the output into client intelligence, account context, and org-level visibility. That sales workflow is the first concrete implementation, not the limit of the architecture.

## Product screens

<table>
  <tr>
    <td><img src="docs/showcase-screens/raw/screen1.png" alt="Organization dashboard" width="100%" /></td>
    <td><img src="docs/showcase-screens/raw/screen2.png" alt="Client dashboard" width="100%" /></td>
  </tr>
  <tr>
    <td><img src="docs/showcase-screens/raw/screen3.png" alt="New call transcript input" width="100%" /></td>
    <td><img src="docs/showcase-screens/raw/screen4.png" alt="Analyzed call result" width="100%" /></td>
  </tr>
</table>

## Monorepo architecture

- `@mudul/core`: domain types, repositories, seed/demo data, and shared analysis logic
- `@mudul/protocol`: AI contracts, prompt assets, JSON schemas, and validators
- `@mudul/storage`: persistence adapters and database setup
- `@mudul/ui-headless`: UI contracts intended to stay renderer-agnostic
- `@mudul/ui-web`: thin web renderers and UI composition helpers
- `apps/web`: the prototype web app, API routes, auth flow, and dashboard screens

See [docs/architecture.md](docs/architecture.md) for layer boundaries and import direction.

## AI analysis model

Mudul treats AI as a structured subsystem rather than a chat surface:

- AI runs server-side only
- provider output is expected to match a schema
- malformed responses can be rejected or downgraded safely
- mock and fallback modes make the workflow testable without live credentials

This makes it easier to turn model output into persistent state and usable UI instead of manually reviewing free text after every interaction.

## Current state

- The web app, transcript submission flow, and dashboard UI are implemented
- The repository supports both mock and live-provider analysis paths
- Seed/demo data is included for local exploration and demos
- The sales-call workflow is the current end-to-end proof of concept
- Some infrastructure paths still mix prototype shortcuts with production-oriented patterns
- Persistent multi-call memory is a direction, not a completed feature

## Development

```bash
pnpm install
pnpm --filter web dev
pnpm --filter web build
```

## Environment

Use the root [`.env.example`](.env.example) or the package-specific examples as templates for local setup. Keep real credentials in local `.env` files only.
