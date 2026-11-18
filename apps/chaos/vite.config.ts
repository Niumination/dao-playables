import { defineConfig } from 'vite'

export default defineConfig({
  base: '/chaos/',
  build: { outDir: 'dist', target: 'es2020' },
  server: { port: 8812 },
})
