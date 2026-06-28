import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3022,
    host: '0.0.0.0',
    allowedHosts: ['clio.taila01894.ts.net', '127.0.0.1', 'localhost'],
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../../01_Sovereign_Portal/clio.taila01894.ts.net.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../01_Sovereign_Portal/clio.taila01894.ts.net.crt')),
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8008',
        ws: true,
        secure: false,
        changeOrigin: true,
      }
    }
  }
})
