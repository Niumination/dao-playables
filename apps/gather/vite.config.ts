import { defineConfig } from 'vite'

export default defineConfig({
  base: '/gather/',
  build: { outDir: 'dist', target: 'es2020' },
  server: { port: 8813 },
})
