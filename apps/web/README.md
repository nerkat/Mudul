# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
