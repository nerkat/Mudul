# Mudul MUI Dashboard

A modern sales call analytics dashboard built with **MUI v7**, featuring a responsive design with AppBar, TreeView navigation, and data management capabilities.

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
