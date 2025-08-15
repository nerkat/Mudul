import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockAiPlugin } from './src/plugins/mockAi'
import { liveAiPlugin } from './src/plugins/liveAi'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    // Use live AI plugin if enabled, otherwise use mock
    process.env.VITE_USE_LIVE_AI === "true" ? liveAiPlugin() : mockAiPlugin()
  ],
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
