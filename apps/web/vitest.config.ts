/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Changed from jsdom to node for API tests
    setupFiles: ['./src/test/setup.ts'],
  },
  define: {
    global: 'globalThis',
  },
});