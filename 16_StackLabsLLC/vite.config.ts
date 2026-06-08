import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Enforce relative base paths layout standard (KI-029)
  server: {
    port: 3000, // Assign explicit decoupled port boundary away from root hub
    host: '0.0.0.0',
    strictPort: true,
    https: {
      key: fs.readFileSync('../01_Sovereign_Portal/clio.taila01894.ts.net.key'),
      cert: fs.readFileSync('../01_Sovereign_Portal/clio.taila01894.ts.net.crt'),
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
