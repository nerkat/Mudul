import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
