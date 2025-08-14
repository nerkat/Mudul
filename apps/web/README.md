# Mudul Web App

A modern dashboard application built with React, MUI, and TypeScript.

## Features

- **MUI Dashboard Shell**: AppBar with responsive drawer navigation
- **TreeView Navigation**: Clean sidebar menu with route integration  
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Light/Dark Theme**: Toggle between themes with system preference support
- **DataGrid**: Advanced table with sorting, pagination, and filtering
- **File Upload**: Multi-format file selection with validation
- **Confirmation Dialogs**: User-friendly destructive action confirmations

## Pages

- **Dashboard** (`/`): Metrics overview with placeholder cards
- **Calls** (`/calls`): Sales call data with DataGrid
- **Settings** (`/settings`): File upload and system actions

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Installation

```bash
# Install dependencies (from repository root)
pnpm install

# Build workspace packages
pnpm build

# Start development server
cd apps/web
pnpm dev
```

The app will be available at `http://localhost:5173/`

### Development Scripts

```bash
# Type checking
pnpm typecheck

# Linting  
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Architecture

### Routing

Uses React Router v6 with nested routes:

```
/ (AppShell)
├── / (DashboardPage)  
├── /calls (CallsPage)
└── /settings (SettingsPage)
```

### Theme System

Integrates MUI theming with the existing Tailwind-based theme system:

- Custom theme configuration in `src/theme/mui-theme.ts`
- Light/dark mode toggle preserves existing theme context
- Material Design components with custom styling

### Components Structure

```
src/
├── shell/
│   └── AppShell.tsx          # Main layout with AppBar + Drawer
├── pages/
│   ├── DashboardPage.tsx     # Metrics dashboard
│   ├── CallsPage.tsx         # DataGrid with call data
│   └── SettingsPage.tsx      # Upload + system actions
├── shared/
│   ├── FileUploadButton.tsx  # Multi-format file upload
│   └── ConfirmDialogButton.tsx # Confirmation dialogs
└── theme/
    ├── mui-theme.ts          # MUI theme configuration
    └── ...                   # Existing theme system
```

## MUI MCP Integration

This project supports the MUI MCP (Model Context Protocol) server for AI-assisted development with accurate MUI documentation.

See [MUI MCP Setup Guide](../../docs/MUI_MCP_SETUP.md) for configuration instructions.

### Quick MCP Test

After setup, try this in your AI chat:
> "Using the mui-mcp server, show me how to add a new column to the DataGrid with custom cell rendering"

## Contributing

1. Follow existing code patterns and TypeScript strict mode
2. Use MUI components for UI consistency
3. Test responsive design on multiple screen sizes
4. Use the MUI MCP server for accurate documentation when developing new features

## Dependencies

### Core
- React 19 + TypeScript
- React Router v6
- MUI v7 (Material + Icons + X components)
- Emotion (MUI styling)

### Development  
- Vite (build tool)
- ESLint + TypeScript ESLint
- Tailwind CSS v4 (existing theme system)
