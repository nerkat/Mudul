import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mockAiPlugin } from './src/plugins/mockAi'
import { liveAiPlugin } from './src/plugins/liveAi'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // load all env vars (no prefix filter)
  const useLive = [env.USE_LIVE_AI]
    .map(v => String(v).toLowerCase())
    .includes('true');

  const plugins = [
    react(),
    useLive ? liveAiPlugin() : mockAiPlugin()
  ];

  // TODO: Re-enable API plugin when SQLite import issue is resolved
  // For now, we'll implement API-only mode without the embedded server
  // const useDb = [env.VITE_USE_DB]
  //   .map(v => String(v).toLowerCase())
  //   .includes('true');
  // if (useDb) {
  //   const { apiPlugin } = await import('./src/api/plugin');
  //   plugins.push(apiPlugin());
  // }

  return {
    plugins,
    ssr: { noExternal: [] },
    build: {
      rollupOptions: {
        external: [
          'node:fs',
          'node:path',
          'node:url'
        ]
      }
    }
  };
});
