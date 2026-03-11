# Mudul MUI Dashboard

A modern sales call analytics dashboard built with **MUI v7**, featuring a responsive design with AppBar, TreeView navigation, and data management capabilities.

## AI Provider Configuration

The application includes a production-ready AI provider system with fallback capabilities.

### Environment Variables

Configure AI provider behavior in your `.env` file:

```bash
# AI Provider Control
USE_LIVE_AI=false              # Toggle between live and mock providers (default: false)
ALLOW_FALLBACK=true            # Control fallback behavior on failures (default: true)

# OpenAI Configuration
OPENAI_API_KEY=                # Required for live mode
OPENAI_MODEL=gpt-4o-mini       # Configurable model selection (default: gpt-4o-mini)
OPENAI_TIMEOUT_MS=30000        # Request timeout configuration (default: 30000)
OPENAI_BASE_URL=               # Optional for Azure/OpenRouter (default: https://api.openai.com/v1)
```

### Configuration Details

- **USE_LIVE_AI**: When `true`, uses OpenAI provider; when `false`, uses mock provider
- **ALLOW_FALLBACK**: When `false` and live provider fails, returns 502 errors instead of fallback
- **OPENAI_BASE_URL**: Support for Azure OpenAI (`api-key` header) vs standard OpenAI (`Authorization` header)

### API Response Structure

All AI analyze endpoints return standardized metadata:

```json
{
  "data": { /* analysis results */ },
  "meta": {
    "provider": "openai|mock",
    "model": "gpt-4o-mini",
    "duration_ms": 1234,
    "request_id": "req_123",
    "fallback": false,
    "failed_provider": null,
    "failed_error_code": null,
    "prompt_versions": {
      "system": "salesCall.system@v1.0.0",
      "user": "salesCall.user@v1.0.0"
    },
    "truncated": false,
    "retries": 0,
    "schema_version": "SalesCallV1"
  }
}
```

### Fallback Behavior

When live provider fails:
- Response includes `x-ai-fallback: 1` header
- Meta includes failure details: `failed_provider`, `failed_error_code`
- If `ALLOW_FALLBACK=false`, returns 502 error instead

### Development Endpoints

- **POST /api/analyze** - Main AI analysis endpoint
- **GET /api/_health/ai** - Development metrics and provider status

### Testing

Run the test suites to verify AI provider functionality:

```bash
# Unit tests for prompts and utilities
node test/prompt.test.js

# Integration tests with curl
./test/api-tests.sh
```

## Development Setup

### Using pnpm (Required)

This project uses pnpm workspaces. Do NOT use npm or yarn:

```bash
# Install dependencies
pnpm install

# Build workspace packages
pnpm build

# Start development server
cd apps/web && pnpm dev
```

### Google Authentication

The login screen now uses Google Sign-In. Configure a browser client ID in `apps/web/.env` before starting the app:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

- `VITE_GOOGLE_CLIENT_ID` powers the browser-side Google sign-in button.
- `GOOGLE_CLIENT_ID` is used by the API layer to verify the Google credential token.
- Your Google OAuth client must allow `http://localhost:5173` as an authorized JavaScript origin.
- First-time Google users are provisioned automatically and receive a personal workspace.

Currently, two official plugins are available:
## Features

- 🎨 **MUI v7 Dashboard Shell** - AppBar + responsive Drawer with TreeView sidebar
- 📊 **Dashboard Page** - Statistical cards showing call analytics  
- 📋 **Calls Page** - DataGrid with sorting, filtering, and pagination
- ⚙️ **Settings Page** - File upload and data management with confirm dialogs
- 🌙 **Light/Dark Theme** - Toggle between themes with instant updates
- 📱 **Responsive Design** - Mobile-friendly with collapsible navigation
- 🔍 **MUI MCP Integration** - AI assistance grounded in official MUI docs

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Type check
pnpm typecheck

# Lint code
pnpm lint

# Build for production
pnpm build
```

## Project Structure

```
src/
├── App.tsx                    # Main app component with theme provider
├── main.tsx                   # React entry point with routing
├── theme.ts                   # MUI light/dark theme definitions
├── shell/
│   └── AppShell.tsx          # Main layout: AppBar + Drawer + TreeView
├── pages/
│   ├── DashboardPage.tsx     # Analytics dashboard with stat cards
│   ├── CallsPage.tsx         # DataGrid for call management
│   └── SettingsPage.tsx      # Settings with file upload & dialogs
└── shared/
    ├── FileUploadButton.tsx  # Reusable file upload component
    └── ConfirmDialogButton.tsx # Reusable confirmation dialog
```

## Navigation

The app uses **MUI X SimpleTreeView** for sidebar navigation:

- **Dashboard** (`/`) - Overview with analytics cards
- **Calls** (`/calls`) - Data table with call records  
- **Settings** (`/settings`) - Configuration and data management

## MUI MCP Setup

To enable AI assistance with official MUI documentation, see [MCP_SETUP.md](../../MCP_SETUP.md) for detailed configuration instructions for VS Code, Cursor, Zed, and Claude Code.

### Quick MCP Test

After setup, try this in your editor's AI chat:
```
Using MUI DataGrid, show me how to add custom toolbar with export functionality. 
Include official API references.
```

## Components Used

### Core MUI Components
- `AppBar`, `Drawer`, `Toolbar` - Navigation shell
- `Paper`, `Card`, `CardContent` - Content containers  
- `Typography`, `Box`, `Button` - Basic elements
- `Dialog`, `IconButton` - Interactive elements

### MUI X Components  
- `SimpleTreeView`, `TreeItem` - Navigation tree
- `DataGrid`, `GridToolbar` - Data tables

### Theme Features
- Custom `borderRadius: 12px`
- Light/dark mode toggle
- Button style overrides
- Responsive breakpoints

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route to `main.tsx`
3. Add navigation item to `AppShell.tsx` TreeView

### Customizing Theme

Edit `src/theme.ts` to modify:
- Color palette
- Shape properties (border radius, etc.)
- Component style overrides
- Typography scales

### Using MCP for Development

The MUI MCP server provides real-time access to:
- Component API documentation
- Working code examples  
- Theming guides
- Best practices

Always query the MCP server for the latest MUI information rather than relying on memory.

## Dependencies

### Core
- **React 19** - UI framework
- **MUI v7** - Component library and design system
- **MUI X** - Advanced components (DataGrid, TreeView)
- **React Router v7** - Client-side routing

### Development  
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
