const env = import.meta.env.VITE_APP_ENV || 'prod';

const configs = {
  prod: {
    portal: 'https://clio.taila01894.ts.net:3000',
    fanstack: 'https://clio.taila01894.ts.net:3009',
    api: 'http://192.168.1.183:8000',
    adminApi: 'http://192.168.1.183:5055',
    telemetryApi: 'http://192.168.1.183:8090',
    ws: 'wss://clio.taila01894.ts.net/mesh-ws',
    samtracker: 'https://clio.taila01894.ts.net/sam/',
    netdata: 'https://clio.taila01894.ts.net:8444/',
    proxmox: 'https://clio.taila01894.ts.net:8445/',
    portainer: 'https://clio.taila01894.ts.net:8446/',
    savant: 'http://192.168.1.183:8000/savant_query.html',
    mlbStats: 'https://statsapi.mlb.com/api'
  },
  dev: {
    portal: 'https://clio.taila01894.ts.net:3002',
    fanstack: 'https://clio.taila01894.ts.net:3011',
    api: 'http://192.168.1.183:8002',
    adminApi: 'http://192.168.1.183:5057', 
    telemetryApi: 'http://192.168.1.183:8092',
    ws: 'wss://clio.taila01894.ts.net/mesh-ws-dev',
    samtracker: 'https://clio.taila01894.ts.net/sam-dev/',
    netdata: 'https://clio.taila01894.ts.net:8444/',
    proxmox: 'https://clio.taila01894.ts.net:8445/',
    portainer: 'https://clio.taila01894.ts.net:8446/',
    savant: 'http://192.168.1.183:8002/savant_query.html',
    mlbStats: 'https://statsapi.mlb.com/api'
  },
  uat: {
    portal: 'https://clio.taila01894.ts.net:3001',
    fanstack: 'https://clio.taila01894.ts.net:3010',
    api: 'http://192.168.1.183:8001',
    adminApi: 'http://192.168.1.183:5056', 
    telemetryApi: 'http://192.168.1.183:8091',
    ws: 'wss://clio.taila01894.ts.net/mesh-ws-uat',
    samtracker: 'https://clio.taila01894.ts.net/sam-uat/',
    netdata: 'https://clio.taila01894.ts.net:8444/',
    proxmox: 'https://clio.taila01894.ts.net:8445/',
    portainer: 'https://clio.taila01894.ts.net:8446/',
    savant: 'http://192.168.1.183:8001/savant_query.html',
    mlbStats: 'https://statsapi.mlb.com/api'
  },
  sandbox: {
    portal: 'https://clio.taila01894.ts.net:3003',
    fanstack: 'https://clio.taila01894.ts.net:3012',
    api: 'http://192.168.1.183:8003',
    adminApi: 'http://192.168.1.183:5058', 
    telemetryApi: 'http://192.168.1.183:8093',
    ws: 'wss://clio.taila01894.ts.net/mesh-ws-sandbox',
    samtracker: 'https://clio.taila01894.ts.net/sam-sandbox/',
    netdata: 'https://clio.taila01894.ts.net:8444/',
    proxmox: 'https://clio.taila01894.ts.net:8445/',
    portainer: 'https://clio.taila01894.ts.net:8446/',
    savant: 'http://192.168.1.183:8003/savant_query.html',
    mlbStats: 'https://statsapi.mlb.com/api'
  }
};

export const SovereignConfig = configs[env as keyof typeof configs] || configs.prod;
