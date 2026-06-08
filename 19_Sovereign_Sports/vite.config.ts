import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.key'),
      cert: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.crt'),
    },
    proxy: {
      '/api/sports': 'http://127.0.0.1:8097',
      '/api/stream': 'http://127.0.0.1:8097',
      '/api/proxy': 'http://127.0.0.1:8097',
      '/api/room_personas': 'http://127.0.0.1:8000',
      '/api/hot_take': 'http://127.0.0.1:8000',
      '/api/all_personas': 'http://127.0.0.1:8000',
      '/api/save_room_personas': 'http://127.0.0.1:8000',
      '/api/chat': 'http://127.0.0.1:8000',
      '/api/persona-call': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/api/theater': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/api/cinema': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/ws/theater': {
        target: 'ws://127.0.0.1:8090',
        ws: true,
        secure: false,
        changeOrigin: true,
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

