import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true' && env.DISABLE_HMR !== 'true',
      port: 3009,
      allowedHosts: true,
      https: {
        key: fs.readFileSync('./clio.taila01894.ts.net.key'),
        cert: fs.readFileSync('./clio.taila01894.ts.net.crt'),
      },
      proxy: {
        '/api/system': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/now': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/persona_image': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/sys_rules': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/teams': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/user_preferences': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/argus': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/auth': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
          xfwd: true,
        },
        '/api/public': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
          xfwd: true,
        },
        '/api/cast_tv': {
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
        '/api/models': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/scruffys': {
          target: 'https://127.0.0.1:3002',
          changeOrigin: true,
          secure: false,
        },
        '/api/feedback': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/scoreboard': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/room_personas': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/chat': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/all_personas': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/save_room_personas': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/room': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/roll_call': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/game_play': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://127.0.0.1:8008',
          ws: true,
          secure: false,
          changeOrigin: true,
        },
        '/api/telemetry': {
          target: 'http://127.0.0.1:8085',
          changeOrigin: true,
        },
        '/api/snipe': {
          target: 'http://127.0.0.1:5056',
          changeOrigin: true,
        },
        '/api/transcribe': {
          target: 'http://127.0.0.1:5056',
          changeOrigin: true,
        },
        '/api/summarize': {
          target: 'http://127.0.0.1:5056',
          changeOrigin: true,
        },
        '/api/analyze_video': {
          target: 'http://127.0.0.1:5056',
          changeOrigin: true,
        },
        '/api/mlb-rss': {
          target: 'https://www.mlb.com/feeds/news/rss.xml',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => ''
        },
        '/api/admin': {
          target: 'http://127.0.0.1:5055',
          changeOrigin: true,
        },

        // ── Hot Takes API — served by fanstack_relay on port 8000 ─────────
        '/api/hot_take': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/api/skew': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
          ws: true,
        },
        '/api/skew-cmdb': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/skew-cmdb/, '/api'),
        },
        '/ws-skew': {
          target: 'ws://127.0.0.1:8009',
          ws: true,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ws-skew/, ''),
        },
        '/api/cmdb_ci': {
          target: 'http://127.0.0.1:8095',
          changeOrigin: true,
        },
        '/api/media/soundboard': {
          target: 'http://127.0.0.1:8090',
          changeOrigin: true,
          secure: false,
        },
        '/api/tickets': {
          target: 'http://127.0.0.1:8095',
          changeOrigin: true,
        },
        '/api/tmi_anomalies': {
          target: 'http://127.0.0.1:8095',
          changeOrigin: true,
        },
        '/attachments': {
          target: 'http://127.0.0.1:8095',
          changeOrigin: true,
        },
        // ── Catch-all (Scruffy's Tavern relay, port 8000) ────────────────────
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/media_vault': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/ws-relay': {
          target: 'ws://127.0.0.1:8012',
          ws: true,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ws-relay/, ''),
        },
        '/tts-proxy': {
          target: 'http://127.0.0.1:8000',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tts-proxy/, '/04_Sovereign_Core'),
        },
        '/dvr-proxy': {
          target: 'http://127.0.0.1:5051',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dvr-proxy/, ''),
        },
        '/cam-proxy/argo': { target: 'http://argo.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/argo/, '') },
        '/cam-proxy/clio': { target: 'http://clio.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/clio/, '') },
        '/cam-proxy/calvin': { target: 'http://calvin.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/calvin/, '') },
        '/cam-proxy/hobbes': { target: 'http://hobbes.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/hobbes/, '') },
        '/cam-proxy/mando': { target: 'http://mando.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/mando/, '') },
        '/cam-proxy/grogu': { target: 'http://grogu.taila01894.ts.net:8081', secure: false, changeOrigin: true, rewrite: (path) => path.replace(/^\/cam-proxy\/grogu/, '') },
        '/cmdb-proxy': {
          target: 'http://100.123.68.9:8082',
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cmdb-proxy/, '')
        },
        '/nuke-proxy': {
          target: 'http://127.0.0.1:8099',
          ws: true,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nuke-proxy/, ''),
        },
        '/api/savant_query': {
          target: 'http://127.0.0.1:8006',
          changeOrigin: true,
        },
        '/ws-shatcast': {
          target: 'ws://127.0.0.1:3004',
          ws: true,
          secure: false,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ws-shatcast/, '')
        },
        '/sonarr': {
          target: 'http://127.0.0.1:8989',
          changeOrigin: true,
        }
      }
    },
  };
});
