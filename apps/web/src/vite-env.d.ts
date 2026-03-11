/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly USE_LIVE_AI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
