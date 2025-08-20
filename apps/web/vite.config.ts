import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), ''); // don't import app/server code here
  return {
  plugins: [react()],
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
