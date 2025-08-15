import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockAiPlugin } from './src/plugins/mockAi'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockAiPlugin()],
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
