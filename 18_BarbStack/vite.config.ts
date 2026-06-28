import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Configuration for Barb's Stack (Port 3020)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3020,
    strictPort: true,
    host: '127.0.0.1', // Only listen on localhost to avoid binding conflict with Tailscale
    allowedHosts: true,
    proxy: {
      '/api/cinema': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false,
      },
      '/api/all_personas': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/advocate': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/persona_image': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    fs: {
      allow: ['..']
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  }
});
