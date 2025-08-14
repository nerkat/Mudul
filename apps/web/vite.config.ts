import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiPlugin from './vite.api.plugin'
import analyzePlugin from './src/dev/vite.analyze.plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin(), analyzePlugin()],
  ssr: {
    noExternal: [], // Let Node modules work naturally in SSR
  },
  build: {
    rollupOptions: {
      external: [
        'node:fs',
        'node:path', 
        'node:url'
      ]
    }
  }
})
