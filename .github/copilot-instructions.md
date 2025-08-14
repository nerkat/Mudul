# Copilot Instructions for Mudul

## Project Overview
Mudul is a data visualization and dashboard application with a theme system and multiple view modes (Paper/Rich).

## Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + CSS Custom Properties  
- **Build Tool**: Vite
- **Package Manager**: pnpm (workspace setup)
- **PostCSS**: Required for Tailwind CSS processing

## Key Architecture

### Theme System
- **CSS Design Tokens**: Located in `apps/web/src/theme/tokens.css`
- **Theme Implementation**: Light/Dark themes via `dark` class on `<html>` (Tailwind's class-based dark mode)
- **Theme Context**: React context in `apps/web/src/theme/theme.tsx`
- **Theme Persistence**: localStorage with System/Light/Dark options

### Styling Configuration
- **Tailwind Config**: `apps/web/tailwind.config.ts` with CSS custom properties integration and `darkMode: 'class'`
- **PostCSS Config**: `apps/web/postcss.config.js` - MUST use `@tailwindcss/postcss` plugin for Tailwind v4
- **Global Styles**: `apps/web/src/app.css` imports theme files and Tailwind directives
- **No Additional Build Step**: Vite handles Tailwind CSS compilation automatically via PostCSS

### Component Structure
- **AppShell**: Main layout wrapper with header and responsive content area
- **Card**: Surface primitive component for consistent styling
- **ThemeSwitch**: Theme selector dropdown component
- **ModeSwitch**: Toggle between Paper/Rich view modes

### AI Provider Architecture
- **Provider Interface**: `AiProvider` interface in `packages/protocol/src/ai.types.ts` defines contracts
- **Mock Implementation**: `MockAiProvider` in `packages/core/src/ai/mock.provider.ts` for development
- **Dev API Endpoint**: `POST /api/analyze` via Vite plugin for development testing (dev-only, not in production)
- **Schema Validation**: All AI output must pass through `validateSalesCall` validation

## Route Structure
- **Root**: `/` - Redirects to `/acme`
- **Organization**: `/acme` - Main organization landing page
- **Node Pages**: `/acme/...` - Dynamic nested routes for organizational structure
- **Testing**: Always navigate to `/acme` as the primary node for testing

## Important Development Notes

### Tailwind CSS v4 Setup
- **Critical**: Use `@tailwindcss/postcss` plugin in PostCSS config, NOT `tailwindcss`
- **Custom Properties**: Theme colors are defined as CSS variables (e.g., `--bg`, `--fg`, `--surface`)
- **Semantic Classes**: Use theme-aware classes like `bg-surface`, `text-fg`, `border-border`
- **Dark Mode**: Uses Tailwind's class-based approach with `dark` class on `<html>`
- **No Manual CSS Build**: Vite automatically processes CSS through PostCSS

### Package Management
- **Package Manager**: MUST use pnpm (not npm or yarn)
- **Workspace Setup**: This is a pnpm workspace with multiple packages
- **Dependencies**: Install using `pnpm install` from root
- **Building**: Build workspace packages (`@mudul/protocol`, `@mudul/core`) before web app
- **Error Prevention**: If you discover mid-run that you're using wrong commands (e.g., `npm` instead of `pnpm`), add the correct approach to these instructions immediately to prevent future mistakes

### Development Workflow
1. Install dependencies: `pnpm install` (from root)
2. Build workspace packages: `pnpm build` (from root) 
3. Start web dev server: `cd apps/web && pnpm dev`
4. Navigate to `/acme` for testing

## Code Conventions
- **Theme-Aware Styling**: Always use semantic color classes that respect light/dark themes
- **Component Organization**: Keep components in `apps/web/src/components/`
- **CSS Structure**: Use CSS custom properties for design tokens, avoid hard-coded colors
- **No Custom CSS Classes**: Use only Tailwind classes, avoid custom CSS classes like `ui-*`
- **TypeScript**: Strict typing throughout, especially for theme and context types

## When Making Changes
- **Test Both Themes**: Always verify changes work in both light and dark modes
- **Preserve Functionality**: Maintain existing Paper/Rich mode switching
- **Update Instructions**: Update these instructions when making significant architecture changes
- **Error Prevention Rule**: Whenever you try something during a run and realize it's wrong (e.g., using `npm` instead of `pnpm`), add it to these instructions so you don't repeat the same mistake. This will prevent repeating the same dead ends and improve Copilot's future PRs.