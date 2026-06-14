import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: { port: 3001, host: true },
  base: command === 'build' ? '/admin/' : '/',
  build: { outDir: 'dist' },
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom'] },
}))
