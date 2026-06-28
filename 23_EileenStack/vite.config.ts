import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Configuration for Eileen's Stack (Port 3017)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3017,
    strictPort: true,
    host: '127.0.0.1', // Only listen on localhost to avoid binding conflict with Tailscale
    allowedHosts: true,
    fs: {
      allow: ['..']
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    proxy: {
      '/ws-comet': {
        target: 'ws://127.0.0.1:8015',
        ws: true,
        changeOrigin: true
      },
      '/ws-relay': {
        target: 'ws://127.0.0.1:8012',
        ws: true,
        changeOrigin: true
      },
      '/api/medical_vault': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true
      },
      '/api/cast_tv': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true
      },
      '/api/media/vault_inbox': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true
      },
      '/media_vault': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
});
