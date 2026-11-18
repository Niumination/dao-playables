import { defineConfig } from 'vite'

export default defineConfig({
  base: '/wake/',
  build: { outDir: 'dist', target: 'es2020' },
  server: { port: 8815 },
})
