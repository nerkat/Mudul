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


  return {
    plugins: [
      react(),
      useLive ? liveAiPlugin() : mockAiPlugin()
    ],
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
