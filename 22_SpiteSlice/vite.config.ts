import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: '0.0.0.0',
    port: 3019, // Local HTTP port
    allowedHosts: ['clio.taila01894.ts.net'],
    https: {
      key: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.key'),
      cert: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.crt'),
    },
    proxy: {
      '/api/wildseed': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api/personas': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      }
    }
  }
})
