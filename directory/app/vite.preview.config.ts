import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Builds the clickable static preview (scripts/build-preview.mjs). Not part of the live site.
export default defineConfig({
  base: './',
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), viteReact()],
  build: { outDir: 'dist-preview', emptyOutDir: true, rollupOptions: { input: 'preview/index.html' } },
})
