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
    fs: {
      allow: ['..']
    },
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  }
});
