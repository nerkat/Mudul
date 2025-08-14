import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiPlugin from './vite.api.plugin'
import navPlugin from './src/dev/vite.nav.plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin(), navPlugin()],
})
