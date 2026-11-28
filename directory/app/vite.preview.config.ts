import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Builds the clickable static preview (scripts/build-preview.mjs). Not part of the live site.
export default defineConfig({
  base: './',
  resolve: {
    tsconfigPaths: true,
    // Server functions need the TanStack Start server; the static prototype gets a stub instead.
    alias: { '@tanstack/react-start': fileURLToPath(new URL('./src/preview/start-stub.ts', import.meta.url)) },
  },
  plugins: [tailwindcss(), viteReact()],
  build: { outDir: 'dist-preview', emptyOutDir: true, rollupOptions: { input: 'preview/index.html' } },
})
