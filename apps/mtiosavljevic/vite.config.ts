import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Local-only: proxy /supabase to production so the browser treats it as
    // same-origin (sidesteps CORS during local verification). A real deploy
    // serves /supabase same-origin via nginx, exactly like the production site.
    proxy: {
      '/supabase': { target: 'https://mtiosavljevic.com', changeOrigin: true, secure: true },
    },
  },
  build: { outDir: 'dist' },
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom'] },
})
