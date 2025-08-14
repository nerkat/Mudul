# MUI MCP Setup Guide

This document explains how to enable the **MUI MCP** server in your editors to get AI assistance grounded in the actual MUI/MUI X documentation.

## What is MUI MCP?

The MUI MCP (Model Context Protocol) server allows AI assistants in your editor to fetch real-time documentation and examples from the official MUI and MUI X libraries. This ensures accurate, up-to-date responses instead of hallucinated APIs.

## Supported Editors

### VS Code / Cursor / Windsurf

1. Open your editor's user settings JSON file
2. Add the MCP server configuration:

```json
{
  "mcp": {
    "servers": {
      "mui-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@mui/mcp@latest"]
      }
    }
  }
}
```

3. For VS Code only, ensure MCP is enabled:

```json
{
  "chat.mcp.enabled": true,
  "chat.mcp.discovery.enabled": true
}
```

### Zed

1. Open Command Palette → **agent: add context server**
2. Add the following configuration:

```json
{
  "mui-mcp-server": {
    "command": { 
      "path": "npx", 
      "args": ["-y", "@mui/mcp@latest"], 
      "env": {} 
    }
  }
}
```

3. (Optional) Install the "MUI MCP" extension if available

### Claude Code (CLI)

```bash
# Add the MUI MCP server
claude mcp add mui-mcp -- npx -y @mui/mcp@latest

# Or add with user scope
claude mcp add mui-mcp -s user -- npx -y @mui/mcp@latest
```

## Verification

### Test with MCP Inspector

Run the MCP Inspector locally to verify the tools are available:

```bash
npx @modelcontextprotocol/inspector
```

- Transport: **Stdio**
- Command: **npx**
- Args: **-y @mui/mcp@latest**

### Test in Your Editor

In your editor's AI chat, type: **"List available tools from mui-mcp"**

You should see documentation and search capabilities listed.

## Usage Guidelines

To ensure the AI uses the MCP server effectively, use these rules in your AI prompts:

### Project Rules
```
## Use the mui-mcp server for any MUI question
1) Query mui-mcp to fetch official MUI/MUI X docs or examples.
2) Ground answers in returned docs; include links and API names.
3) Prefer code compatible with MUI v7 + our deps.
```

### Saved Prompts

#### TreeView Navigation
```
Using MUI X SimpleTreeView, build our sidebar menu with React Router v6 routes (/, /calls, /settings). 
Cite the docs for expandedItems/onItemClick and show a minimal AppShell integration.
```

#### DataGrid Implementation
```
Create a CallsPage using @mui/x-data-grid with columns id/title/duration/sentiment, including pagination and a toolbar.
Cite the DataGrid API pages used.
```

#### Theme Customization
```
Show createTheme with shape.borderRadius=12, mode toggle (light/dark), and a MuiButton variant/style override. 
Cite the theming and component override docs.
```

## Troubleshooting

- **MCP appears unused**: Ensure your editor has MCP enabled AND your AI rules explicitly instruct using the `mui-mcp` server
- **Tool not found**: Verify the MCP server is properly configured and npx can access @mui/mcp
- **Outdated responses**: The MCP server fetches live docs, so responses should always be current

## Benefits

- ✅ **Accurate API references** - No more hallucinated component props
- ✅ **Latest documentation** - Always up-to-date with current MUI versions  
- ✅ **Real examples** - Working code snippets from official docs
- ✅ **Complete API coverage** - Access to all MUI and MUI X components