import { defineConfig } from 'vite'

export default defineConfig({
  base: '/circuit/',
  build: { outDir: 'dist', target: 'es2020' },
  server: { port: 8811 },
})
