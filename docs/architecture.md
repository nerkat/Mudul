# Architecture & Layering Rules

## Layers
- **@core**: domain types, repositories, events. **No React / UI imports**.
- **@protocol**: JSON Schemas, validators, AI clients (mock/real). **No React**.
- **@storage**: DB adapters. **No React**.
- **@ui-headless**: widget contracts & logic (headless). **No DOM/Native imports**.
- **@ui-web**: React DOM adapters that render headless widgets.
- **apps/web**: application shell (routing, pages), consumes `@core` + `@ui-web`.

## Import Direction
- `@core` has no deps on other UI/infra packages.
- `@protocol` can depend on `@core` (for types), but not on UI packages.
- `@storage` can depend on `@core` (for types), but not on UI packages.
- `@ui-headless` depends on none of the above (stays pure).
- `@ui-web` imports `@ui-headless` + `@core` (and later `@protocol`).
- `apps/web` imports `@ui-web` + `@core` (+ routing libs).

## Enforcement
- Add ESLint rules in a later issue to block React imports in non-UI packages.
- All UI must be swappable by keeping logic in `@core` and `@ui-headless`.