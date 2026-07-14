import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  base: '/cinema-portal/',
  plugins: [
    tailwindcss(),
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    host: true,
    port: 3008,
    allowedHosts: true,
    https: {
      key: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.key'),
      cert: fs.readFileSync('/home/james/SovereignOS/01_Sovereign_Portal/clio.taila01894.ts.net.crt'),
    },
    proxy: {
      '/api/media/asset': {
        target: 'http://127.0.0.1:8095',
        changeOrigin: true,
      },
      '/avatars': {
        target: 'http://127.0.0.1:3016',
        changeOrigin: true,
      },
      '/api/media': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
      '/TV_Shows': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
      '/Movies': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
      '/01_Assets': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
      '/ws/theater': {
        target: 'ws://127.0.0.1:8090',
        ws: true,
        changeOrigin: true,
      },
      '/api/theater': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/api/cinema': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/api/public': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/api/now': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/api/vengeance': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
      '/ws-relay': {
        target: 'ws://127.0.0.1:8012',
        ws: true,
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws-relay/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReqWs', (proxyReq, _req, _socket, _options, _head) => {
            proxyReq.setHeader('Connection', 'Upgrade');
          });
        }
      },
      '/sonarr': {
        target: 'http://127.0.0.1:8989',
        changeOrigin: true,
      },
      '/radarr': {
        target: 'http://127.0.0.1:7878',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/radarr/, '')
      },
      '/MediaCover': {
        target: 'http://127.0.0.1:8989',
        changeOrigin: true,
      },
      '/stream': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stream/, '')
      }
    }
  }
})
