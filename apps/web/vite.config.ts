import { defineConfig, loadEnv, type Plugin, type ConfigEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Lazy plugin loader to avoid requiring server-only deps at config parse
function aiPluginSelector(useLive: boolean): Plugin {
  return {
    name: 'ai-plugin-selector',
  apply: 'serve',
  async configResolved(cfg: any) { // vite's internal resolved config type not exported
      const mod = useLive
        ? await import('./src/plugins/liveAi')
        : await import('./src/plugins/mockAi');
      // @ts-expect-error push dynamic AI plugin
      cfg.plugins.push(mod[useLive ? 'liveAiPlugin' : 'mockAiPlugin']());
      console.log(`[ai] Mounted ${useLive ? 'live' : 'mock'} AI plugin at /api/ai/analyze`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '');
  // Merge non-VITE vars into process.env so server middleware can read them
  for (const [k,v] of Object.entries(env)) {
    if (!(k in process.env)) process.env[k] = v;
  }
  const useLive = (env.USE_LIVE_AI || env.VITE_USE_LIVE_AI) === 'true';
  return {
  plugins: [react(), aiPluginSelector(useLive)],
    root: __dirname,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: { 
      port: 5173, 
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    optimizeDeps: { exclude: ['sqlite3', 'better-sqlite3'] },
    ssr: { external: ['sqlite3', 'better-sqlite3'] },
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
