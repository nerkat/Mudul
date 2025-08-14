# MUI MCP Server Setup

The MUI MCP (Model Context Protocol) server enables AI assistants to fetch real MUI/MUI X documentation and examples on demand, ensuring grounded answers without hallucinated APIs.

## Installation by Editor

### VS Code / Cursor / Windsurf

1. Add MCP server entry to your editor's MCP config (user-level settings):

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

2. For VS Code specifically, ensure MCP is enabled in `settings.json`:

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

3. (Optional) Install the "MUI MCP" extension if available and configure preferences.

### Claude Code (CLI)

Add the MUI MCP server using one of these commands:

```bash
# Project scope
claude mcp add mui-mcp -- npx -y @mui/mcp@latest

# User scope  
claude mcp add mui-mcp -s user -- npx -y @mui/mcp@latest
```

## Verification

### MCP Inspector (Local Testing)

Run the MCP Inspector to verify the server tools are available:

```bash
npx @modelcontextprotocol/inspector
```

Use these settings:
- **Transport:** Stdio
- **Command:** npx
- **Args:** -y @mui/mcp@latest

### Editor AI Chat Test

In your editor's AI chat, type:
> **"List available tools from mui-mcp"**

You should see documentation search and retrieval capabilities.

## Usage Rules

To ensure your AI actually uses the MCP server, create these project rules in your editor:

### Project Rules Snippet

```
## Use the mui-mcp server for any MUI question
1) Query mui-mcp to fetch official MUI/MUI X docs or examples.
2) Ground answers in returned docs; include links and API names.
3) Prefer code compatible with MUI v7 + our current dependencies.
```

## Saved Prompts

Copy these into your editor for repeatable, grounded help:

### TreeView Navigation Wiring
```
Using MUI X SimpleTreeView, build our sidebar menu with React Router v6 routes (/, /calls, /settings). 
Cite the docs for expandedItems/onItemClick and show a minimal AppShell integration.
```

### DataGrid Page Development
```
Create a CallsPage using @mui/x-data-grid with columns id/title/duration/sentiment, including pagination and a toolbar.
Cite the DataGrid API pages used.
```

### Theme Customization
```
Show createTheme with shape.borderRadius=12, mode toggle (light/dark), and a MuiButton variant/style override. 
Cite the theming and component override docs.
```

## Tips

- Always ask the AI to **cite specific MUI documentation pages** it references
- Request **links to official examples** when asking for implementation patterns
- Specify **MUI v7 compatibility** when asking for code suggestions
- Use the MCP server even for simple questions to maintain documentation accuracy