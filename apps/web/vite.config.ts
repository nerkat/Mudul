import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mockAiPlugin } from './src/plugins/mockAi'
import { liveAiPlugin } from './src/plugins/liveAi'
// import { apiPlugin } from './src/api/plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // load all env vars (no prefix filter)
  const useLive = [env.USE_LIVE_AI]
    .map(v => String(v).toLowerCase())
    .includes('true');

  return {
    plugins: [
      react(),
      // apiPlugin(), // Temporarily disabled due to SQLite issues
      useLive ? liveAiPlugin() : mockAiPlugin()
    ],
    ssr: { 
      noExternal: [],
      external: ['sqlite3']
    },
    optimizeDeps: {
      exclude: ['sqlite3']
    },
    build: {
      rollupOptions: {
        external: [
          'node:fs',
          'node:path',
          'node:url',
          'sqlite3'
        ]
      }
    }
  };
});
