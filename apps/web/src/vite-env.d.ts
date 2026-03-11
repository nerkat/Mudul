/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly USE_LIVE_AI?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
