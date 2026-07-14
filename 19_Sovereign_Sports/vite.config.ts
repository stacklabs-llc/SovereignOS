import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const makeProxy = (target: string, ws = false) => ({
  target,
  changeOrigin: true,
  secure: false,
  ws,
  configure: (proxy: any) => {
    proxy.on('error', (err: any, _req: any, _res: any) => {
      // Gracefully capture connection errors to prevent server crash/resource leak
      console.warn(`[Proxy Warning] Target offline: ${target} (${err.code || err.message})`);
    });
  }
});

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
    hmr: {
      host: 'clio.taila01894.ts.net',
      protocol: 'wss',
      port: 3010,
    },
    proxy: {
      '/api/sports': makeProxy('http://127.0.0.1:8097'),
      '/api/stream': makeProxy('http://127.0.0.1:8097'),
      '/api/proxy': makeProxy('http://127.0.0.1:8097'),
      '/api/studio': makeProxy('http://127.0.0.1:8097'),
      '/api/properties': makeProxy('http://127.0.0.1:8097'),
      '/api/session': makeProxy('http://127.0.0.1:8000'),
      '/api/room_personas': makeProxy('http://127.0.0.1:8000'),
      '/api/hot_take': makeProxy('http://127.0.0.1:8000'),
      '/api/all_personas': makeProxy('http://127.0.0.1:8000'),
      '/api/save_room_personas': makeProxy('http://127.0.0.1:8000'),
      '/api/persona_image': makeProxy('http://127.0.0.1:8090'),
      '/api/chat/upload': makeProxy('http://127.0.0.1:8000'),
      '/api/chat': makeProxy('http://127.0.0.1:8000'),
      '/api/media/inject': makeProxy('http://127.0.0.1:8000'),
      '/api/media': makeProxy('http://127.0.0.1:8090'),
      '/api/system': makeProxy('http://127.0.0.1:8090'),
      '/api/game-log': makeProxy('http://127.0.0.1:8000'),
      '/images': makeProxy('http://127.0.0.1:8000'),
      '/api/pins': makeProxy('http://127.0.0.1:8090'),
      '/api/persona-call': makeProxy('http://127.0.0.1:8090'),
      '/api/theater': makeProxy('http://127.0.0.1:8090'),
      '/api/cinema': makeProxy('http://127.0.0.1:8090'),
      '/ws/theater': makeProxy('ws://127.0.0.1:8090', true),
      '/ws': makeProxy('ws://127.0.0.1:8008', true),
      '/mesh-ws': makeProxy('ws://127.0.0.1:8008', true),
    }
  }
})


