/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_LIVE_AI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
