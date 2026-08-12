import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolveManualChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/scheduler/') ||
    id.includes('/react-router/') ||
    id.includes('/react-router-dom/')
  ) {
    return 'react-vendor'
  }

  if (id.includes('/@supabase/')) {
    return 'supabase-vendor'
  }

  if (
    id.includes('/@tiptap/') ||
    id.includes('/prosemirror-') ||
    id.includes('/orderedmap/')
  ) {
    return 'editor-vendor'
  }

  if (id.includes('/lucide-react/')) {
    return 'icons-vendor'
  }

  if (id.includes('/zod/')) {
    return 'validation-vendor'
  }

  return undefined
}

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: { port: 3001, host: true },
  base: command === 'build' ? '/admin/' : '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
      },
    },
  },
  resolve: { dedupe: ['react', 'react-dom', 'react-router-dom'] },
}))
