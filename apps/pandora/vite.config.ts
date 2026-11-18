import { defineConfig } from 'vite'

export default defineConfig({
  base: '/pandora/',
  build: { outDir: 'dist', target: 'es2020' },
  server: { port: 8814 },
})
