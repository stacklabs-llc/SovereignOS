import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: './',
  server: {
    port: 3024,
    host: '127.0.0.1',
    allowedHosts: ['clio.taila01894.ts.net'],
    proxy: {
      '/sam/ws': {
        target: 'ws://127.0.0.1:8083',
        ws: true,
        changeOrigin: true
      },
      '/sam/inbox': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true
      },
      '/sam/media': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true
      },
      '/sam/api/upload_video': {
        target: 'http://127.0.0.1:8083',
        changeOrigin: true
      }
    }
  }
})
