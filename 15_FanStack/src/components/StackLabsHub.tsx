import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Send, 
  X, 
  Terminal as TerminalIcon, 
  Bug, 
  Zap, 
  BookOpen, 
  Paperclip, 
  Loader2, 
  Cpu, 
  Database, 
  Image as ImageIcon, 
  LogOut, 
  CheckCircle, 
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

// Simple audio synthesizer to generate authentic baseball noises (bat cracks, glove pops, crowd cheers)
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'crack') {
      // Crack of the bat (Sharp burst + high-freq transient + rapid decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'pop') {
      // Catch pop (Dull thump)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'cheer') {
      // Synthesized crowd roar
      const bufferSize = ctx.sampleRate * 2.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 1.0;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  } catch (e) {
    console.warn("Audio Context not allowed or supported yet.", e);
  }
};

const SERVICES = [
  {
    id: 'ai',
    title: 'Cognitive LLM Pipelines',
    desc: 'Empowering enterprise stacks with robust RAG nodes, fine-tuned custom embeddings, and private model gateways.',
    metric: '99.4% Precision Rate',
    costFactor: 2400
  },
  {
    id: 'cloud',
    title: 'Multi-Cloud Infrastructure',
    desc: 'Automated, redundant serverless architectures spanning AWS, GCP, and custom Bare Metal clusters.',
    metric: '99.999% Target Uptime',
    costFactor: 1900
  },
  {
    id: 'edge',
    title: 'Edge Stream Analytics',
    desc: 'Sub-millisecond real-time intelligence for live events, spatial pitch tracking, and IoT arrays.',
    metric: '<4ms Global Latency',
    costFactor: 3100
  },
  {
    id: 'consulting',
    title: 'Elite Technical Advisory',
    desc: 'On-demand technical audits, scalable codebase refactoring, and fractional CTO/Architect operations.',
    metric: '100% On-Time Delivery',
    costFactor: 1500
  }
];

const METS_PLAYERS = [
  { name: 'Francisco Lindor', role: 'Shortstop', avg: '.273', hr: '31', status: 'At Bat' },
  { name: 'Pete Alonso', role: 'First Base', avg: '.262', hr: '42', status: 'On Deck' },
  { name: 'Brandon Nimmo', role: 'Outfield', avg: '.255', hr: '24', status: 'In Hole' },
  { name: 'Kodai Senga', role: 'Pitcher', avg: '—', era: '2.98', status: 'Dugout' },
];

const INITIAL_FLOW_ASSETS = [
  {
    id: 'asset-1',
    title: 'Chief Architect Working Late',
    category: 'Illustration',
    prompt: 'Bespoke handcraft workshop, engineer designing microchips, moody vintage cyber-lighting, highly detailed corporate profile',
    status: 'Synced',
    timestamp: 'Just Now',
    likes: 12
  },
  {
    id: 'asset-2',
    title: 'Modular Impossible S Logo',
    category: 'Branding Vector',
    prompt: 'Isometric geometric impossible structure shape, architectural lines, white ribbon outline on dark steel background',
    status: 'Active Brand',
    timestamp: '10m ago',
    likes: 45
  },
  {
    id: 'asset-3',
    title: 'Retro Fan Sci-Fi Space',
    category: 'Character / Scene',
    prompt: 'Mets colors space gear outfit, neon orange visor, tech blueprints background, retro futurism concept illustration',
    status: 'Draft',
    timestamp: '1h ago',
    likes: 8
  },
  {
    id: 'asset-4',
    title: 'Tactical Edge Terminal Console',
    category: 'UI Concept',
    prompt: 'Command line terminal dashboard with complex analytics graphs, glowing amber text, terminal matrix style',
    status: 'Synced',
    timestamp: '2h ago',
    likes: 21
  }
];

interface StackLabsHubProps {
  onBackToPortal?: () => void;
}

export default function StackLabsHub({ onBackToPortal }: StackLabsHubProps) {
  // --- AUTHENTICATION & LOCK STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [passcodeFeedback, setPasscodeFeedback] = useState('VAULT OF THE MONOLITH SECURED. ENTER CLEARANCE.');
  const [gatewayQuote, setGatewayQuote] = useState("The cloud is just someone else's expensive computer you can't touch. We mix our software like premium whiskey: local, pure, and barrel-aged on bare metal.");
  const [broadcastQuoteInput, setBroadcastQuoteInput] = useState('');

  // --- DOCKPIT NAVIGATION & WORKSPACE TABS ---
  const [activeTab, setActiveTab] = useState('itsm'); // 'itsm' | 'mets' | 'capabilities' | 'terminal'
  const [metsTheme, setMetsTheme] = useState(true);

  // --- ITSM & TELEMETRY LIVE STATE ---
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [ticketSortPriority, setTicketSortPriority] = useState('ALL');
  
  // Real-time Argus Stats
  const [cpuUsage, setCpuUsage] = useState(32);
  const [ramUsage, setRamUsage] = useState(58);
  const [sysLogs, setSysLogs] = useState<string[]>([
    "[SYSTEM] Node-7 sync initiated successfully.",
    "[DB] Concurrency mode configured to WAL.",
    "[FLOW] Ingestion tunnel linked on port 8008.",
  ]);

  // --- STACK SEEDER ONBOARDING ---
  const [seederRole, setSeederRole] = useState('Lead Engineer');
  const [seederStack, setSeederStack] = useState('FastAPI + React');
  const [seederEnvironment, setSeederEnvironment] = useState('Bare Metal Core');
  const [seederChecklist, setSeederChecklist] = useState({
    dnaSynced: true,
    keysGenerated: false,
    securityCleared: false
  });

  // --- FLOW PORTFOLIO LIGHTBOX GALLERY ---
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [lightboxPrompt, setLightboxPrompt] = useState('');

  // --- STANDARD BASEBALL ESTIMATOR AND METS SIMULATOR STATE ---
  const [selectedServices, setSelectedServices] = useState(['ai', 'cloud']);
  const [scaleFactor, setScaleFactor] = useState(50); // 1 to 100 User/Volume Factor
  const [terminalLogs, setTerminalLogs] = useState([
    'Welcome to StackLabs Core OS v4.2.0',
    'Flow Integration Active: Listening to asset updates on pipeline port 8080...',
    'Run `help` to see available actions, `sync` to pull Flow assets, or `cheer` to support the Mets!',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [customToast, setCustomToast] = useState<string | null>(null);

  // --- FLOW INTEGRATION STATE ---
  const [flowAssets, setFlowAssets] = useState(INITIAL_FLOW_ASSETS);
  const [isSyncingFlow, setIsSyncingFlow] = useState(false);
  const [newAssetPrompt, setNewAssetPrompt] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Illustration');

  // --- METS GAME LIVE SIMULATOR STATE ---
  const [selectedPitch, setSelectedPitch] = useState('Ghost Forkball');
  const [showHomeRunApple, setShowHomeRunApple] = useState(false);
  const [gameState, setGameState] = useState({
    inning: 7,
    half: 'Bottom', // Top / Bottom
    score: { mets: 4, opponent: 3 },
    opponentName: 'Braves',
    balls: 1,
    strikes: 2,
    outs: 1,
    bases: [true, false, true], // 1st, 2nd, 3rd Base status
    lastPlay: 'Francisco Lindor is stepping into the box with runners on the corners.',
    history: ['Nimmo walks.', 'Alonso fly out to center.', 'Lindor advances to third, Nimmo to first.'],
    isSimulating: false
  });

  const showToast = (message: string, duration = 3000) => {
    setCustomToast(message);
    setTimeout(() => setCustomToast(null), duration);
  };

  // --- 1. FETCH DYNAMIC GATEWAY QUOTE ---
  const fetchGatewayQuote = async () => {
    try {
      // Point directly to FastAPI core API port 8090, or fallback path
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8090/api/public/stacklabs/quote`);
      const json = await res.json();
      if (json.status === 'success' && json.quote) {
        setGatewayQuote(json.quote);
        setBroadcastQuoteInput(json.quote);
      }
    } catch (e) {
      console.warn("Failed to fetch dynamic gateway quote, using default fallback.", e);
    }
  };

  useEffect(() => {
    fetchGatewayQuote();
  }, []);

  // --- 2. UPDATE DYNAMIC GATEWAY QUOTE ---
  const updateGatewayQuote = async (newQuote: string) => {
    if (!newQuote.trim()) return;
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8090/api/public/stacklabs/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: newQuote })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setGatewayQuote(json.quote);
        showToast("🚀 Gateway Monolith Quote Broadcasted Successfully!");
        setSysLogs(prev => [`[BROADCAST] Monolith Brand quote updated to: "${newQuote.slice(0, 40)}..."`, ...prev]);
        return true;
      }
    } catch (e) {
      console.error("Failed to set gateway quote on API server:", e);
      // Fallback update local state anyway so it reflects immediately
      setGatewayQuote(newQuote);
      showToast("🚀 Quote updated locally (Handshake Offline)");
      return true;
    }
    return false;
  };

  // --- 3. PASSCODE SCAN CLEARANCE UNLOCK ---
  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAccessCode(val);
    setPasscodeError(false);

    if (!val) {
      setPasscodeFeedback('VAULT OF THE MONOLITH SECURED. ENTER CLEARANCE.');
      return;
    }

    // Scanning feedback based on length
    if (val.length === 1) {
      setPasscodeFeedback('DIGIT 1/7 CONNECTING VAULT RELAYS...');
      playSound('pop');
    } else if (val.length === 3) {
      setPasscodeFeedback('SCANNING SYNCED PREFERENCE REGISTERS...');
      playSound('pop');
    } else if (val.length === 5) {
      setPasscodeFeedback('COMPILING SECURE CRYPTO KEYS...');
      playSound('pop');
    }
  };

  const submitPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingPasscode) return;

    const cleaned = accessCode.trim().toUpperCase();
    if (cleaned === 'SOV2026' || cleaned === 'FLOW' || cleaned === 'METS2026') {
      setIsVerifyingPasscode(true);
      setPasscodeFeedback('VAULT GRANTED! DECRYPTING CORE VAULT...');
      playSound('cheer');
      
      setTimeout(() => {
        setIsVerifyingPasscode(false);
        setIsAuthenticated(true);
        setTerminalLogs(prev => [...prev, `[ACCESS COMPLETED] Pilot validated via passcode: ${cleaned}. Welcome to the cockpit.`]);
      }, 1200);
    } else {
      setPasscodeError(true);
      playSound('pop');
      setPasscodeFeedback('ACCESS DENIED. SECURE SYSTEM THREAT SHIELD ACTIVE.');
      setTimeout(() => {
        setAccessCode('');
        setPasscodeError(false);
      }, 1500);
    }
  };

  // --- 4. ITSM TICKETS INTEGRATION (PORT 8095) ---
  const fetchItsmTickets = async () => {
    setIsLoadingTickets(true);
    try {
      // Fetch via Vite proxy /api/tickets, which targets http://127.0.0.1:8095
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTicketsList(data);
      } else {
        // Fallback placeholder if structure is incorrect
        setTicketsList(generateFallbackTickets());
      }
    } catch (e) {
      console.warn("Ticketing server offline, using offline database cache.", e);
      setTicketsList(generateFallbackTickets());
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const generateFallbackTickets = () => [
    { sys_id: 'STRY0000548', title: 'Decoupled SQLite preference storage audit', priority: '1', state: 'Work In Progress', description: 'Review sys_user_preference WAL integrity rules and secure unauthenticated quote endpoint hooks.', created_at: '2026-05-30T14:20:00Z', work_notes: 'Wired up endpoints under /api/public/stacklabs/quote in fastapi server.' },
    { sys_id: 'STRY0000549', title: 'Integrate Command Cockpit corporate portal layout', priority: '2', state: 'Work In Progress', description: 'Transform StackLabsHub component to render frosted glassmorphism dual-state terminal matrices.', created_at: '2026-05-31T09:15:00Z', work_notes: 'Designing atmospheric unauthenticated monolith lock gate & dashboard grid.' },
    { sys_id: 'DFCT0000104', title: 'Vite catch-all proxy route clash on /api prefix', priority: '1', state: 'Open', description: 'Ensure /api/tickets and /api/public routes bypass Scruffy Tavern catch-all and correctly resolve to local port relays.', created_at: '2026-06-01T01:10:00Z', work_notes: 'Added specific proxy matches at top of vite config block.' },
    { sys_id: 'ENHC0000088', title: 'Citi Field Home Run Apple 3D oscillator upgrade', priority: '3', state: 'Open', description: 'Integrate physical frequency sweep envelope trigger on Lindor deep drive hit detections.', created_at: '2026-05-28T18:00:00Z', work_notes: 'Created dynamic AudioContext sine buffer models.' }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchItsmTickets();
    }
  }, [isAuthenticated]);

  // Telemetry real-time ticking
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      // Random walk for CPU/RAM dials
      setCpuUsage(prev => Math.min(95, Math.max(10, prev + Math.floor(Math.random() * 9) - 4)));
      setRamUsage(prev => Math.min(90, Math.max(40, prev + Math.floor(Math.random() * 5) - 2)));
      
      // Node Telemetry Logs generator
      const events = [
        "[OK] Node-7 telemetry dispatch complete.",
        "[INFO] Argus stats successfully written to SQLite in WAL mode.",
        "[WARN] Flow studio asset cache sync delayed 12ms.",
        "[OK] Mets Simulation game event synchronizer heartbeat active.",
        "[SYSTEM] Storage cluster check: 64% used. 540 GB of 1 TB occupied."
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setSysLogs(prev => [randomEvent, ...prev.slice(0, 15)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // --- FLOW INTEGRATION STATE & SYNC ---
  const handleSyncFlowAssets = async () => {
    setIsSyncingFlow(true);
    playSound('pop');
    try {
      const apiHost = window.location.protocol + '//' + window.location.hostname + ':8000';
      const res = await fetch(`${apiHost}/api/flow/assets`);
      const json = await res.json();
      if (json.status === 'success' && json.assets && json.assets.length > 0) {
        const mapped = json.assets.map((asset: any) => ({
          id: asset.sys_id,
          title: asset.name,
          category: asset.category,
          prompt: asset.status && asset.status.startsWith('Synced:') ? asset.status.replace('Synced:', '').trim() : asset.name,
          status: 'Synced',
          timestamp: new Date(asset.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          likes: 0
        }));
        setFlowAssets(mapped);
      }
      setIsSyncingFlow(false);
      playSound('cheer');
      showToast('⚡ CMDB Database Assets Synchronized successfully!');
    } catch (e) {
      setTimeout(() => {
        setIsSyncingFlow(false);
        playSound('cheer');
        showToast('⚡ Local Mock Assets synchronized (Handshake Offline)');
      }, 1000);
    }
  };

  const handleCreateFlowAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetPrompt.trim()) return;

    const payload = {
      title: newAssetPrompt.split(',')[0].trim() || 'Custom Asset Design',
      category: newAssetCategory,
      prompt: newAssetPrompt
    };

    try {
      const apiHost = window.location.protocol + '//' + window.location.hostname + ':8000';
      const res = await fetch(`${apiHost}/api/flow/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        const newAsset = {
          id: data.asset.sys_id,
          title: data.asset.name,
          category: data.asset.category,
          prompt: payload.prompt,
          status: 'Synced',
          timestamp: 'Just Now',
          likes: 0
        };
        setFlowAssets(prev => [newAsset, ...prev]);
        setNewAssetPrompt('');
        playSound('crack');
        showToast('🚀 New Asset Rendered & Registered in SQLite CMDB!');
      } else {
        showToast('❌ Failed to save asset to CMDB.');
      }
    } catch (e) {
      console.warn("Failed to create CMDB flow asset:", e);
      // Fallback
      const fallbackAsset = {
        id: `asset-${Date.now()}`,
        title: payload.title,
        category: payload.category,
        prompt: payload.prompt,
        status: 'Synced',
        timestamp: 'Just Now',
        likes: 1
      };
      setFlowAssets([fallbackAsset, ...flowAssets]);
      setNewAssetPrompt('');
      playSound('crack');
      showToast('🚀 Synced locally (Handshake Offline)');
    }
  };

  // --- TERMINAL INTERFACE INTERACTIVE HANDLER ---
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    let response = '';
    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();

    if (mainCmd === 'help') {
      response = 'Available commands:\n  `about`                  StackLabs mission brief\n  `stack`                  Query active system configurations\n  `mets`                   Live Mets Scoreboard diagnostics\n  `cheer`                  Trigger Citi Field crowd oscillator sweep\n  `clear`                  Flush screen register logs\n  `pitch`                  Execute Kodak Senga live pitch logic\n  `sync`                   Trigger SQLite CMDB Flow asset pull\n  `quote "<text>"`         Instantaneously broadcast dynamic gateway Monolith quote';
    } else if (mainCmd === 'about') {
      response = 'StackLabs develops bulletproof distributed systems and enterprise AI pipelines. Powered by extreme baseball nerds.';
    } else if (mainCmd === 'stack') {
      response = `Active Stack: [${selectedServices.join(', ')}] running at ${scaleFactor * 10}k requests/min.`;
    } else if (mainCmd === 'mets') {
      response = `CURRENT GAME STATUS: Mets ${gameState.score.mets} vs ${gameState.opponentName} ${gameState.score.opponent}. Inning: ${gameState.half} ${gameState.inning}.`;
    } else if (mainCmd === 'cheer') {
      playSound('cheer');
      response = '📣 LET\'S GO METS! 📣 Play-by-play synth active! Citi Field home run apple is ready!';
      showToast('🍎 Let\'s Go Mets! Apple Rising!');
    } else if (mainCmd === 'sync') {
      handleSyncFlowAssets();
      response = '📡 Initializing handshake with Flow server... Ingesting generated blueprints.';
    } else if (mainCmd === 'pitch') {
      triggerPitchSimulation();
      response = `⚡ Pitch released! Dynamic simulation under way for Senga's ${selectedPitch}...`;
    } else if (mainCmd === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    } else if (mainCmd === 'quote') {
      // Extract quote text inside quotes
      const match = cmd.match(/quote\s+["'](.+?)["']/i);
      if (match && match[1]) {
        const text = match[1];
        response = `📡 Broadcasting dynamic brand quote over REST gateways: "${text}"`;
        const ok = await updateGatewayQuote(text);
        if (ok) {
          response += '\n[OK] Database Upsert complete. Monolith gateway is locked to new quote.';
        } else {
          response += '\n[WARN] Failed to write quote to SQLite preference store.';
        }
      } else {
        response = 'Usage: `quote "Your dynamic quote text here"`';
      }
    } else {
      response = `Command not recognized: '${mainCmd}'. Type 'help' for options.`;
    }

    setTerminalLogs((prev) => [...prev, `guest@stacklabs:~$ ${terminalInput}`, response]);
    setTerminalInput('');
  };

  const triggerPitchSimulation = () => {
    if (gameState.isSimulating) return;

    setGameState(prev => ({ ...prev, isSimulating: true }));
    playSound('pop');

    setTimeout(() => {
      const randomValue = Math.random();
      let updatedState = { ...gameState };
      let outcomeText = '';
      let soundToPlay = 'pop';

      const pitches = {
        'Ghost Forkball': { strikeRate: 0.45, hitRate: 0.20 },
        'Fastball': { strikeRate: 0.35, hitRate: 0.40 },
        'Slider': { strikeRate: 0.40, hitRate: 0.30 },
        'Sweeper': { strikeRate: 0.38, hitRate: 0.32 }
      };
      
      const pitchStats = (pitches as any)[selectedPitch] || { strikeRate: 0.4, hitRate: 0.3 };

      if (randomValue < pitchStats.strikeRate) {
        if (updatedState.strikes < 2) {
          updatedState.strikes += 1;
          outcomeText = `Nasty ${selectedPitch} caught the corner! Strike ${updatedState.strikes}.`;
        } else {
          updatedState.strikes = 0;
          updatedState.balls = 0;
          updatedState.outs += 1;
          outcomeText = `STRIKE THREE! Senga drops in a devastating ${selectedPitch}. Batter is frozen.`;
          
          if (updatedState.outs >= 3) {
            updatedState.outs = 0;
            updatedState.bases = [false, false, false];
            if (updatedState.half === 'Top') {
              updatedState.half = 'Bottom';
              outcomeText += ' Inning over! Mets come up to bat in the bottom half!';
            } else {
              updatedState.half = 'Top';
              updatedState.inning += 1;
              outcomeText += ` Inning over! Moving into the Top of the ${updatedState.inning}th.`;
            }
          }
        }
      } else if (randomValue < pitchStats.strikeRate + pitchStats.hitRate) {
        const hitRoll = Math.random();
        soundToPlay = 'crack';
        updatedState.balls = 0;
        updatedState.strikes = 0;

        if (hitRoll < 0.65) {
          let newBases = [false, false, false];
          let runsScored = 0;
          if (updatedState.bases[2]) runsScored++;
          if (updatedState.bases[1]) newBases[2] = true;
          if (updatedState.bases[0]) newBases[1] = true;
          newBases[0] = true;
          outcomeText = `CRACK! A screaming line drive! Single to right field off the ${selectedPitch}!`;
          
          if (runsScored > 0) {
            if (updatedState.half === 'Bottom') {
              updatedState.score.mets += runsScored;
              soundToPlay = 'cheer';
              outcomeText += ` ${runsScored} runner(s) cross home plate! GO METS! 🍎`;
            } else {
              updatedState.score.opponent += runsScored;
              outcomeText += ` ${runsScored} runner(s) cross home plate for the ${updatedState.opponentName}.`;
            }
          }
          updatedState.bases = newBases;
        } else if (hitRoll < 0.90) {
          let newBases = [false, false, false];
          let runsScored = 0;
          if (updatedState.bases[2]) runsScored++;
          if (updatedState.bases[1]) runsScored++;
          if (updatedState.bases[0]) newBases[2] = true;
          newBases[1] = true;
          outcomeText = `CRACK! One-hop off the wall! Double down the line on a ${selectedPitch}!`;
          
          if (runsScored > 0) {
            if (updatedState.half === 'Bottom') {
              updatedState.score.mets += runsScored;
              soundToPlay = 'cheer';
              outcomeText += ` ${runsScored} runner(s) cross home plate! GO METS! 🍎`;
            } else {
              updatedState.score.opponent += runsScored;
              outcomeText += ` ${runsScored} runner(s) cross home plate for the ${updatedState.opponentName}.`;
            }
          }
          updatedState.bases = newBases;
        } else {
          soundToPlay = 'cheer';
          playSound('crack');
          
          if (updatedState.half === 'Bottom') {
            setShowHomeRunApple(true);
            setTimeout(() => setShowHomeRunApple(false), 5000);
          }

          let runnersOn = updatedState.bases.filter(b => b).length;
          let runsScored = runnersOn + 1;

          if (updatedState.half === 'Bottom') {
            updatedState.score.mets += runsScored;
            outcomeText = `IT\'S OUTTA HERE! 🍎 Deep home run into the left field seats! ${runsScored} run blast!`;
          } else {
            updatedState.score.opponent += runsScored;
            outcomeText = `Deep drive back... Gone! Home Run ${updatedState.opponentName} off the hanging ${selectedPitch}. ${runsScored} runs score.`;
          }
          updatedState.bases = [false, false, false];
        }
      } else {
        updatedState.balls += 1;
        if (updatedState.balls >= 4) {
          updatedState.balls = 0;
          updatedState.strikes = 0;
          let newBases = [...updatedState.bases];
          if (!newBases[0]) {
            newBases[0] = true;
            outcomeText = 'Ball four! Walk. Runner moves to first base.';
          } else if (!newBases[1]) {
            newBases[1] = true;
            outcomeText = 'Walk. Runners advance to first and second.';
          } else if (!newBases[2]) {
            newBases[2] = true;
            outcomeText = 'Bases loaded on a walk!';
          } else {
            if (updatedState.half === 'Bottom') {
              updatedState.score.mets += 1;
              soundToPlay = 'cheer';
              outcomeText = 'Walk with bases loaded! A run scores for the Mets! 🍎';
            } else {
              updatedState.score.opponent += 1;
              outcomeText = `Walk with bases loaded! A run scores for the ${updatedState.opponentName}.`;
            }
          }
          updatedState.bases = newBases;
        } else {
          outcomeText = `Outside pitch misses the catcher's mitt. Ball ${updatedState.balls}.`;
        }
      }

      playSound(soundToPlay);
      updatedState.lastPlay = outcomeText;
      updatedState.history = [outcomeText, ...updatedState.history.slice(0, 5)];
      updatedState.isSimulating = false;
      setGameState(updatedState);
    }, 1200);
  };

  const toggleService = (id) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const calculateMonthlyCost = () => {
    const base = selectedServices.reduce((sum, sId) => {
      const s = SERVICES.find((item) => item.id === sId);
      return sum + (s ? s.costFactor : 0);
    }, 0);
    return Math.round(base * (1 + scaleFactor / 40));
  };

  // --- RENDERING STATE 1: THE GATEWAY MONOLITH ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 font-mono text-slate-100 flex flex-col justify-between relative selection:bg-orange-500 selection:text-white overflow-hidden">
        {/* Dynamic Atmosphere Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Global OS Bar */}
        <div className="w-full bg-slate-950 border-b border-slate-900/60 px-6 py-2.5 flex justify-between items-center text-[10px] text-slate-500 z-10">
          <div className="flex items-center gap-4">
            <span className="text-orange-500 font-bold">● CLIO WORKSPACE</span>
            <span>NODE-73 GATEWAY SYSTEM</span>
          </div>
          <div>
            <span>SECURE SYSTEM PASS CODE ACCESS GATEWAY</span>
          </div>
        </div>

        {/* Core Lock Monolith Content */}
        <main className="flex-1 flex items-center justify-center p-6 z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            
            {/* LEFT SIDE: Brand quotation and Isometric Impossible Logo */}
            <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-8">
              
              {/* Pulsating Isometric Logo Block */}
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-orange-500/10 animate-pulse" />
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-white transform transition duration-500 hover:rotate-12 animate-float">
                    <path d="M50 15 L80 32 L50 49 L20 32 Z" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M20 32 L20 42 L50 59 L50 49" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M80 32 L80 42 L50 59" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M50 35 L80 52 L50 69 L20 52 Z" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" className="opacity-75" />
                    <path d="M50 51 L80 68 L50 85 L20 68 Z" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M20 68 L20 78 L50 95 L50 85" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M80 68 L80 78 L50 95" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M50 25 L50 75" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white">
                    Stack<span className="text-orange-500">Labs</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Impossible Systems Architecture</p>
                </div>
              </div>

              {/* Monolith brand quote display */}
              <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-orange-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-4">COGNITIVE BLUEPRINT MATRIX SPECIFICATION</span>
                <p className="text-lg leading-relaxed text-slate-100 italic font-mono">
                  "{gatewayQuote}"
                </p>
                <div className="mt-6 flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-4">
                  <span>SYSTEM TARGET: BARE METAL CLUSTER</span>
                  <span className="text-orange-400 font-bold uppercase animate-pulse">● BROADCAST ACTIVE</span>
                </div>
              </div>

              {/* Status and specs panel */}
              <div className="flex gap-8 text-[11px] text-slate-500 font-mono border-t border-slate-900 pt-6">
                <div>
                  <span className="block text-slate-400">DATABASE INTEGRATION</span>
                  <span className="text-white">SQLite WAL Ledger</span>
                </div>
                <div>
                  <span className="block text-slate-400">SECURITY PROTOCOL</span>
                  <span className="text-white">OS Ingress scan v3.2.0</span>
                </div>
                <div>
                  <span className="block text-slate-400">DECISION ENGINE</span>
                  <span className="text-white">M.A.R.D WebSocket Matrix</span>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE: Interactive secure passcode input card */}
            <div className="lg:col-span-5">
              <div className="backdrop-blur-md bg-slate-900/85 border border-slate-800/90 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-red-500/10 text-red-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/20">SECURED GATE</span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-wider block">INGRESS GATEWAYS</span>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Security Clearance Passcode</h3>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      To open the Command Cockpit, verify your credential keycard passcode. Enter valid system clearance code.
                    </p>
                  </div>

                  {/* Terminal scan feedback window */}
                  <div className={`p-4 bg-slate-950 rounded-2xl border font-mono text-[11px] leading-relaxed transition ${
                    passcodeError ? 'border-red-500/40 text-red-400 bg-red-950/20' : 'border-slate-850 text-slate-400'
                  }`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span>SECURE TERMINAL STATUS:</span>
                      <span className={`w-2 h-2 rounded-full ${passcodeError ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                    </div>
                    <p className="uppercase text-slate-200">{passcodeFeedback}</p>
                  </div>

                  <form onSubmit={submitPasscode} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Clearance Passcode Code</label>
                      <input 
                        type="password"
                        placeholder="ENTER ACCESS CODE (e.g. SOV2026)"
                        value={accessCode}
                        onChange={handlePasscodeChange}
                        disabled={isVerifyingPasscode}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 tracking-widest text-center font-bold focus:outline-none focus:border-orange-500 transition text-sm uppercase"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingPasscode || !accessCode}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-500 hover:to-orange-500 text-slate-950 font-black text-xs tracking-widest uppercase rounded-xl transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isVerifyingPasscode ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                          VERIFYING CLEARANCE ENGINE...
                        </>
                      ) : (
                        '⚡ INITIATE INGRESS DECRYPT SCAN'
                      )}
                    </button>
                  </form>

                  <div className="text-[10px] text-slate-500 font-sans leading-normal pt-2 border-t border-slate-850 flex justify-between items-center">
                    <span>PILOT ACCESS VALIDATION</span>
                    <span>KEY CODE REQUIRED</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Global OS Footer */}
        <div className="w-full bg-slate-950 border-t border-slate-900/60 py-4 px-6 text-center text-[10px] text-slate-500 z-10 font-mono">
          <p>© 2026 StackLabs LLC. Multi-tenant bare metal arrays. Citfield companion integrated. Authorized Pilot personnel only.</p>
        </div>
      </div>
    );
  }

  // --- RENDERING STATE 2: THE COMMAND COCKPIT ---
  return (
    <div className={`min-h-screen font-mono text-slate-100 flex flex-col justify-between transition-colors duration-500 selection:bg-orange-500 selection:text-white ${
      metsTheme 
        ? 'bg-slate-950 border-t-8 border-orange-500' 
        : 'bg-zinc-950 border-t-8 border-blue-600'
    }`}>
      {/* Home run apple splash */}
      {showHomeRunApple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="text-center space-y-6 transform scale-105 transition-all duration-500">
            <div className="relative inline-block animate-bounce">
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-xl py-1 px-4 rounded-full border border-red-400 shadow-xl animate-pulse">
                METS HOME RUN!
              </span>
              <svg viewBox="0 0 100 100" className="w-48 h-48 mx-auto drop-shadow-2xl">
                <path d="M50 30 C50 15 65 15 65 20 C65 25 50 30 50 30" fill="#854d0e" />
                <path d="M50 25 C45 10 30 15 30 25 C30 35 50 25 50 25" fill="#166534" />
                <path d="M50 30 C30 30 15 45 15 65 C15 85 35 95 50 95 C65 95 85 85 85 65 C85 45 70 30 50 30 Z" fill="#dc2626" />
                <ellipse cx="35" cy="45" rx="8" ry="15" fill="#fca5a5" transform="rotate(-15 35 45)" />
                <text x="50" y="70" textAnchor="middle" fill="white" className="font-sans font-black text-xs uppercase tracking-widest">CITI FIELD</text>
              </svg>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-orange-500 tracking-wider uppercase animate-pulse">
              🍎 IT'S OUTTA HERE! 🍎
            </h2>
            <p className="text-slate-300 font-mono text-sm">The Citi Field Home Run Apple has risen in your browser window!</p>
            <button 
              onClick={() => setShowHomeRunApple(false)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs uppercase"
            >
              Back To Game
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal overlay for Flow studio illustrations */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-full text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <img 
              src={lightboxImage} 
              alt={lightboxTitle} 
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800 bg-slate-950" 
            />

            <div className="space-y-2">
              <span className="text-[10px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">FLOW ASSET BLUEPRINT</span>
              <h3 className="text-xl font-bold text-white">{lightboxTitle}</h3>
              <p className="text-xs text-slate-400 italic">"Prompt: {lightboxPrompt}"</p>
              <div className="flex gap-4 text-[10px] text-slate-500 border-t border-slate-850 pt-2 font-mono">
                <span>SYNC STATUS: COMPLETE</span>
                <span>DB TABLE: rm_flow_concept</span>
                <span>PATH: public/images/stacklabs/</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TOAST NOTIFICATION */}
      {customToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-orange-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-400">
          <span>🍎</span>
          <span>{customToast}</span>
        </div>
      )}

      {/* COCKPIT HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/90 border-b border-slate-900 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            {/* Impossible S vector */}
            <div className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-lg group">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-white transform transition duration-500 hover:rotate-12">
                <path d="M50 15 L80 32 L50 49 L20 32 Z" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                <path d="M20 32 L20 42 L50 59 L50 49" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M80 32 L80 42 L50 59" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M50 35 L80 52 L50 69 L20 52 Z" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" className="opacity-75" />
                <path d="M50 51 L80 68 L50 85 L20 68 Z" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                <path d="M20 68 L20 78 L50 95 L50 85" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M80 68 L80 78 L50 95" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M50 25 L50 75" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                Stack<span className="text-orange-500">Labs</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-normal font-mono">v3.2.0</span>
              </h1>
              <p className="text-[8px] text-slate-500 tracking-wider uppercase">Impossible Cockpit Command</p>
            </div>
          </div>

          {/* Core Pipeline Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded-full uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span>Flow pipeline connected</span>
          </div>
        </div>

        {/* Workspace Tab Switcher Links */}
        <div className="flex items-center gap-6 w-full lg:w-auto overflow-x-auto py-2 lg:py-0 border-t lg:border-t-0 border-slate-900 justify-between lg:justify-end">
          <nav className="flex items-center gap-2">
            {[
              { id: 'itsm', label: '🛠️ ITSM Operations', tooltip: 'ITSM grid & server metrics' },
              { id: 'mets', label: '⚾ Mets Hub', tooltip: 'Citi field scorecard simulator' },
              { id: 'capabilities', label: '🛰️ Capabilities', tooltip: 'Service footprints & flats calculator' },
              { id: 'terminal', label: '📟 Operational Console', tooltip: 'Operational terminal shell tool' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  playSound('pop');
                }}
                title={tab.tooltip}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMetsTheme(!metsTheme);
                playSound('crack');
              }}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:bg-slate-850"
              title="Toggle theme colors"
            >
              ⚾
            </button>

            {onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white"
              >
                ← Back
              </button>
            )}

            <button
              onClick={() => {
                setIsAuthenticated(false);
                playSound('pop');
                showToast("Logged out from the command cockpit.");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-bold uppercase transition"
            >
              <LogOut className="h-3 w-3" />
              Exit Cockpit
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE PANEL CONTENT */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: ITSM OPERATIONS & METRICS GRAPH QUADRANT GRID */}
        {activeTab === 'itsm' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* QUADRANT 1: ITSM OPERATIONS TICKET LIST FEED (8 columns) */}
              <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <button 
                    onClick={fetchItsmTickets}
                    className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
                    title="Refresh tickets ledger"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-orange-400 tracking-wider uppercase font-semibold">QUADRANT 01 // OPERATIONS FEED</span>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <Bug className="h-4.5 w-4.5 text-orange-500" />
                      ITSM Backlog Operations
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Live system backlog synchronized to your SDLC server ledger on port 8095. Monitor stories, bugs, and infrastructure changes.
                    </p>
                  </div>

                  {/* Sprint indicator status */}
                  <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        {/* Circle SVG Sprint Completion indicator (82%) */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="3" fill="transparent" />
                          <circle cx="20" cy="20" r="16" stroke="#f97316" strokeWidth="3" fill="transparent" strokeDasharray="100.5" strokeDashoffset="18" />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-orange-400">82%</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">Sprint 24: Mets Seeding Pass</p>
                        <p className="text-[10px] text-slate-500 font-mono">11 Active Stories | 2 Bugs Open</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {['ALL', '1', '2', '3'].map(prio => (
                        <button
                          key={prio}
                          onClick={() => setTicketSortPriority(prio)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticketSortPriority === prio
                              ? 'bg-orange-500 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {prio === 'ALL' ? 'ALL PRIO' : `P${prio}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tickets grid */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {isLoadingTickets && ticketsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-500 mb-2" />
                        <span>Querying ticketing system database...</span>
                      </div>
                    ) : (
                      ticketsList
                        .filter(t => ticketSortPriority === 'ALL' || t.priority === ticketSortPriority)
                        .map((ticket, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setTicketDrawerOpen(true);
                              playSound('pop');
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-4 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono text-orange-400 bg-orange-950/20 px-1.5 py-0.5 rounded border border-orange-500/20">
                                  {ticket.sys_id}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  ticket.priority === '1' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                  ticket.priority === '2' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                  'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                }`}>
                                  P{ticket.priority}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {ticket.state}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-200 group-hover:text-white leading-tight">
                                {ticket.title}
                              </h4>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition" />
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-850 flex justify-between items-center mt-4">
                  <span>SYSTEM METRIC ID: rm_story_ledger</span>
                  <span>SYNC HEARTBEAT: OK</span>
                </div>
              </div>

              {/* QUADRANT 2: ARGUS NEXUS TELEMETRY DIALS (4 columns) */}
              <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-400 tracking-wider uppercase font-semibold">QUADRANT 02 // ARGUS TELEMETRY</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <Cpu className="h-4.5 w-4.5 text-blue-500" />
                      Argus Cluster Nexus
                    </h3>
                  </div>

                  {/* Telemetry Dials Gauges */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* CPU Gauge Dial */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col items-center text-center space-y-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">CPU UPTIME</span>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="30" stroke="#1e293b" strokeWidth="5" fill="transparent" />
                          <circle cx="40" cy="40" r="30" stroke="#3b82f6" strokeWidth="5" fill="transparent" strokeDasharray="188.4" strokeDashoffset={188.4 - (188.4 * cpuUsage / 100)} className="transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-xs font-bold text-blue-400 font-mono">{cpuUsage}%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Node-73 Active</span>
                    </div>

                    {/* RAM Allocation Gauge Dial */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col items-center text-center space-y-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">RAM BUFFER</span>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="30" stroke="#1e293b" strokeWidth="5" fill="transparent" />
                          <circle cx="40" cy="40" r="30" stroke="#a855f7" strokeWidth="5" fill="transparent" strokeDasharray="188.4" strokeDashoffset={188.4 - (188.4 * ramUsage / 100)} className="transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-xs font-bold text-purple-400 font-mono">{ramUsage}%</span>
                      </div>
                      <span className="text-[10px] text-slate-400">5.8GB / 10.0GB</span>
                    </div>

                  </div>

                  {/* SQLite storage gauge and load details */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>SQLITE DATABASE METER</span>
                      <span className="text-slate-300 font-bold">64% USED</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-[64%] h-full bg-gradient-to-r from-blue-500 to-orange-500" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>540 GB Allocated</span>
                      <span>1 TB Core Max</span>
                    </div>
                  </div>

                  {/* Live active log feed */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Argus Core Event logs:</span>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 h-24 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1.5 scrollbar-thin">
                      {sysLogs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-slate-600">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                          <span className="whitespace-pre-wrap">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-850 flex justify-between items-center mt-6">
                  <span>NODE: CLIO-METSLABS</span>
                  <span>CPU MODE: IDLE</span>
                </div>
              </div>

            </div>

            {/* SECOND GRID LINE: Quadrant 3 & Quadrant 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* QUADRANT 3: STACK SEEDER ONBOARDING DRAWER & GATEWAY BRAND QUOTE EDITOR (6 columns) */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-orange-400 tracking-wider uppercase font-semibold">QUADRANT 03 // STACK ADVOCATE ENGINE</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-orange-500" />
                      Seeder Onboarding & Quote Controller
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure your local workspace advocate checklist, and instantaneously broadcast system gateway preferences below.
                    </p>
                  </div>

                  {/* Seeder Configurator Grid */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs">
                    <div>
                      <span className="block text-[8px] text-slate-500 font-mono uppercase mb-1">COCKPIT ROLE</span>
                      <select 
                        value={seederRole} 
                        onChange={(e) => setSeederRole(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2 py-1 w-full text-slate-200 focus:outline-none"
                      >
                        <option value="Lead Engineer">Lead Engineer</option>
                        <option value="CTO Advisor">CTO Advisor</option>
                        <option value="Mets Analyst">Mets Analyst</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[8px] text-slate-500 font-mono uppercase mb-1">TECH STACK</span>
                      <select 
                        value={seederStack} 
                        onChange={(e) => setSeederStack(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2 py-1 w-full text-slate-200 focus:outline-none"
                      >
                        <option value="FastAPI + React">FastAPI + React</option>
                        <option value="Python Core">Python Core</option>
                        <option value="SQLite WAL Stack">SQLite WAL Stack</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[8px] text-slate-500 font-mono uppercase mb-1">PLATFORM ENVIRONMENT</span>
                      <select 
                        value={seederEnvironment} 
                        onChange={(e) => setSeederEnvironment(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-[11px] rounded-lg px-2 py-1 w-full text-slate-200 focus:outline-none"
                      >
                        <option value="Bare Metal Core">Bare Metal Core</option>
                        <option value="Local Clio Node">Local Clio Node</option>
                        <option value="Staging Sandbox">Staging Sandbox</option>
                      </select>
                    </div>
                  </div>

                  {/* DYNAMIC BRAND QUOTE EDITOR PANEL */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">MONOLITH GATEWAY CONTROLLER</span>
                      <span className="text-[9px] text-slate-500 font-mono">SQLite Prefs Ledger</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal">
                      Update the brand quote displayed on the unauthenticated Ingress Monolith instantly based on your mood or today's spring progress.
                    </p>

                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={broadcastQuoteInput}
                        onChange={(e) => setBroadcastQuoteInput(e.target.value)}
                        placeholder="Type a daily quote to broadcast..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-orange-500 focus:outline-none font-mono"
                      />

                      <button
                        onClick={() => updateGatewayQuote(broadcastQuoteInput)}
                        disabled={!broadcastQuoteInput.trim()}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-500 hover:to-orange-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl shadow transition disabled:opacity-50"
                      >
                        ⚡ BROADCAST DYNAMIC GATEWAY QUOTE
                      </button>
                    </div>
                  </div>

                </div>

                <div className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-850 flex justify-between items-center mt-6">
                  <span>PREFERENCE: stacklabs.gateway.quote</span>
                  <span>STATUS: SYNCED</span>
                </div>
              </div>

              {/* QUADRANT 4: FLOW CREATIVE PORTFOLIO LIGHTBOX GALLERY (6 columns) */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-400 tracking-wider uppercase font-semibold">QUADRANT 04 // FLOW STUDIO PORTFOLIO</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <ImageIcon className="h-4.5 w-4.5 text-blue-500" />
                      Flow Creative Lightbox Gallery
                    </h3>
                    <p className="text-xs text-slate-400">
                      Hover over generated system blueprints to audit prompts, and click to activate premium full-screen lightbox previews.
                    </p>
                  </div>

                  {/* Flow portfolio JPEGs list */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        title: 'StackLabs Gateway Landing',
                        img: '/images/stacklabs/StackLabs_landing_page_UI_202605311858.jpeg',
                        prompt: 'Bespoke handcraft workshop UI design, orange/blue tech outlines, highly detailed terminal mockup',
                        desc: 'UnauthenticatedMonolith Portal Concept'
                      },
                      {
                        title: 'Dreadnought COMMAND Dashboard',
                        img: '/images/stacklabs/Dreadnought_Command_dashboard_UI_202605311925.jpeg',
                        prompt: 'Tactical cockpit server dashboard UI, monospace telemetry gauges, deep dark void styling',
                        desc: 'Cockpit grid matrix layout illustration'
                      },
                      {
                        title: 'Mobile Edge Remote Relays',
                        img: '/images/stacklabs/Mobile_app_remote_server_management_202605311924.jpeg',
                        prompt: 'Mobile-first edge node relay controls, circular telemetry progress dials, dark HSL themes',
                        desc: 'Mobile viewport modular companion mock'
                      }
                    ].map((asset, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setLightboxImage(asset.img);
                          setLightboxTitle(asset.title);
                          setLightboxPrompt(asset.prompt);
                          playSound('pop');
                        }}
                        className="bg-slate-950 p-2 border border-slate-850 hover:border-blue-500 rounded-2xl cursor-pointer transition group relative flex flex-col justify-between space-y-2"
                      >
                        <div className="w-full aspect-[4/3] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative">
                          <img 
                            src={asset.img} 
                            alt={asset.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onError={(e) => {
                              // If image fails to load, draw custom placeholder inside grid
                              (e.target as any).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent transition duration-300" />
                          <div className="absolute bottom-1 right-1 bg-slate-950/80 px-1 py-0.5 rounded text-[8px] text-slate-400 font-mono">
                            JPG
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-slate-200 line-clamp-1 group-hover:text-white">
                            {asset.title}
                          </h4>
                          <p className="text-[8px] text-slate-500 leading-normal line-clamp-1">
                            {asset.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flow Studio prompt helper */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-mono block">FLOW ASSET REPOSITORY LOCATION</span>
                      <span className="text-[10px] text-slate-300 font-mono">15_FanStack/public/images/stacklabs/</span>
                    </div>
                    <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-mono uppercase">
                      Synced
                    </span>
                  </div>

                </div>

                <div className="text-[9px] text-slate-500 font-mono pt-4 border-t border-slate-850 flex justify-between items-center mt-6">
                  <span>DIRECTORY: public/images/stacklabs/</span>
                  <span>SYNCED ITEMS: 3</span>
                </div>
              </div>

            </div>

            {/* ITSM TICKET FULL-DETAILS DRILLDOWN MODAL INTERACTIVE DRAWER */}
            {ticketDrawerOpen && selectedTicket && (
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between font-mono animate-slide-in">
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-950/20 px-2 py-0.5 rounded border border-orange-500/20">
                        {selectedTicket.sys_id}
                      </span>
                      <h4 className="text-base font-bold text-white uppercase mt-1">Ticket Specification Details</h4>
                    </div>
                    <button 
                      onClick={() => setTicketDrawerOpen(false)}
                      className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">TICKET TITLE</span>
                      <p className="text-sm font-bold text-slate-200">{selectedTicket.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">PRIORITY STATUS</span>
                        <span className="px-2 py-0.5 bg-slate-950 rounded text-slate-300 font-mono border border-slate-800">
                          P{selectedTicket.priority}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">STATE WORKFLOW</span>
                        <span className="px-2 py-0.5 bg-slate-950 rounded text-slate-300 font-mono border border-slate-800">
                          {selectedTicket.state}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">OPERATIONAL SPECIFICATION SUMMARY</span>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-slate-300 font-sans leading-relaxed">
                        {selectedTicket.description}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase font-mono mb-1">TICKET WORK NOTES LOG</span>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-green-400 font-mono text-[11px] leading-relaxed">
                        {selectedTicket.work_notes || 'No work notes logged on ticket. System ledger is clean.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-850 flex gap-3 text-xs">
                  <button
                    onClick={() => {
                      setTicketDrawerOpen(false);
                      playSound('pop');
                      showToast(`Opened ${selectedTicket.sys_id} in the main ticketing portal!`);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase rounded-xl border border-slate-750 text-center"
                  >
                    Manage Ticket
                  </button>
                  <button
                    onClick={() => setTicketDrawerOpen(false)}
                    className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold uppercase rounded-xl border border-slate-850"
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: METS LIVE SCOREBOARD SIMULATOR COMPANION */}
        {activeTab === 'mets' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Live Interactive Scoreboard Simulator */}
            <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
              
              {/* Scoreboard Headers */}
              <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-850 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center font-bold text-white">
                    🪓
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-400 text-sm">ATLANTA</h5>
                    <p className="text-xl font-extrabold text-white leading-tight">{gameState.opponentName}</p>
                  </div>
                  <span className="text-4xl font-black text-slate-400 ml-4">{gameState.score.opponent}</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-500">INNING</span>
                  <span className="text-xl font-extrabold text-orange-500 tracking-wide font-mono">
                    {gameState.half === 'Top' ? '▲' : '▼'} {gameState.inning}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    {gameState.outs} OUTS | {gameState.balls}-{gameState.strikes} COUNT
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                    🍎
                  </div>
                  <div className="text-right">
                    <h5 className="font-bold text-orange-400 text-sm">NEW YORK</h5>
                    <p className="text-xl font-extrabold text-white leading-tight">METS</p>
                  </div>
                  <span className="text-4xl font-black text-orange-500 mr-4">{gameState.score.mets}</span>
                </div>
              </div>

              {/* Dynamic Visual Baseball Field Representation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Simulated Field Visual */}
                <div className="md:col-span-7 flex justify-center items-center">
                  <div className="relative w-72 h-72 bg-emerald-950/80 border border-emerald-800/60 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                    <div className="absolute w-48 h-48 border-2 border-slate-600/40 transform rotate-45 flex items-center justify-center">
                      <div className="w-44 h-44 border border-dashed border-emerald-600/20" />
                    </div>

                    <div className={`absolute top-10 w-4 h-4 transform rotate-45 border border-white ${
                      gameState.bases[1] ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700'
                    }`} title="Second Base" />

                    <div className={`absolute left-10 w-4 h-4 transform rotate-45 border border-white ${
                      gameState.bases[2] ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700'
                    }`} title="Third Base" />

                    <div className={`absolute right-10 w-4 h-4 transform rotate-45 border border-white ${
                      gameState.bases[0] ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-slate-700'
                    }`} title="First Base" />

                    <div className="absolute bottom-10 w-4 h-4 bg-slate-100 border border-white transform rotate-45" title="Home Plate" />

                    <div className="absolute w-6 h-6 bg-amber-800/80 rounded-full flex items-center justify-center border border-amber-700">
                      <div className="w-2 h-0.5 bg-slate-200" />
                    </div>

                    <div className="absolute bottom-12 text-[10px] font-mono bg-slate-950/90 text-slate-300 py-1 px-2.5 rounded-md border border-slate-800">
                      BATTER: FRANCISCO LINDOR
                    </div>
                  </div>
                </div>

                {/* Simulated Pitch Action Area */}
                <div className="md:col-span-5 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Select Pitch Style</span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Ghost Forkball', 'Fastball', 'Slider', 'Sweeper'].map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setSelectedPitch(p);
                            playSound('pop');
                          }}
                          className={`py-2 text-[10px] font-mono font-bold uppercase rounded-xl border transition-all ${
                            selectedPitch === p 
                              ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md' 
                              : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={triggerPitchSimulation}
                      disabled={gameState.isSimulating}
                      className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-slate-950 font-black text-xs tracking-widest uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-orange-950/20"
                    >
                      {gameState.isSimulating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                          RELEASE PITCH...
                        </>
                      ) : (
                        `⚾ PITCH A ${selectedPitch.toUpperCase()}`
                      )}
                    </button>
                  </div>

                  {/* Sound FX monitor board */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2.5">
                    <span className="text-[10px] text-slate-500 font-mono block">AUDIO MONITOR BOARD</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <button onClick={() => playSound('crack')} className="py-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-semibold rounded text-slate-200 border border-slate-800">💥 CRACK</button>
                      <button onClick={() => playSound('pop')} className="py-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-semibold rounded text-slate-200 border border-slate-800">🧤 POP</button>
                      <button onClick={() => playSound('cheer')} className="py-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-semibold rounded text-slate-200 border border-slate-800">📣 ROAR</button>
                    </div>
                  </div>

                  {/* Scoreboard Mini-Count Circles */}
                  <div className="flex gap-4 p-3 bg-slate-950 rounded-xl border border-slate-850 justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono mb-1">BALLS</p>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(bNum => (
                          <div key={bNum} className={`w-3.5 h-3.5 rounded-full ${gameState.balls >= bNum ? 'bg-green-500' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono mb-1">STRIKES</p>
                      <div className="flex gap-1">
                        {[1, 2].map(sNum => (
                          <div key={sNum} className={`w-3.5 h-3.5 rounded-full ${gameState.strikes >= sNum ? 'bg-orange-500 animate-pulse' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono mb-1">OUTS</p>
                      <div className="flex gap-1">
                        {[1, 2].map(oNum => (
                          <div key={oNum} className={`w-3.5 h-3.5 rounded-full ${gameState.outs >= oNum ? 'bg-red-500' : 'bg-slate-800'}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Live Play Ticker Stream */}
              <div className="border-t border-slate-800/80 pt-6">
                <span className="text-xs font-mono text-slate-400 block mb-3 uppercase tracking-wider">Play-by-Play Ticker history</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {gameState.history.map((log, i) => (
                    <div key={i} className={`text-sm p-2.5 rounded-lg font-mono border ${
                      i === 0 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 font-semibold' 
                        : 'bg-slate-950/60 text-slate-400 border-slate-900'
                    }`}>
                      <span className="text-xs text-slate-500 mr-2">{gameState.half === 'Top' ? '▲' : '▼'}{gameState.inning}:</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Dugout list & Fan zone chat */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Dugout Player list */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>📋</span> METS ACTIVE LINEUP
                </h4>
                <div className="space-y-3">
                  {METS_PLAYERS.map((p, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-slate-200 text-sm">{p.name}</h5>
                        <p className="text-xs text-slate-400 font-mono">{p.role}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.status === 'At Bat' 
                            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' 
                            : 'bg-slate-900 text-slate-500'
                        }`}>
                          {p.status}
                        </span>
                        <p className="text-xs text-slate-300 mt-1 font-mono">
                          {p.avg ? `AVG: ${p.avg}` : `ERA: ${p.era}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fan chat stream */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span>💬</span> Fan Zone Stadium Chat
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mb-4 font-semibold">COFFEE BREAK DEBATES AT CITI FIELD</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <span className="font-bold text-orange-400">Jeff_StackLabs:</span>
                    <p className="text-slate-300 mt-1 font-sans">If the Mets win this series, we might deploy the cloud integration engine early.</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <span className="font-bold text-blue-400">Aris_CTO:</span>
                    <p className="text-slate-300 mt-1 font-sans">Senga's forkball movement is crazy! Calculated it on the analytics dashboard.</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <span className="font-bold text-amber-400">Sarah_Dev:</span>
                    <p className="text-slate-300 mt-1 font-sans">I created the S isometric logo concept in Flow! Loving how clean it is on the core layout.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM CAPABILITIES & PRICING ESTIMATOR */}
        {activeTab === 'capabilities' && (
          <div className="space-y-12">
            
            {/* Grid of abilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICES.map((s) => (
                <div 
                  key={s.id} 
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    selectedServices.includes(s.id) 
                      ? 'bg-slate-900 border-blue-500/80 shadow-md ring-2 ring-blue-500/20' 
                      : 'bg-slate-950 border-slate-850 hover:border-slate-750'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">
                        {s.id === 'ai' ? '🧠' : s.id === 'cloud' ? '☁️' : s.id === 'edge' ? '🛰️' : '💼'}
                      </span>
                      <button
                        onClick={() => toggleService(s.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          selectedServices.includes(s.id) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {selectedServices.includes(s.id) ? 'Selected' : 'Add Stack'}
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">{s.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{s.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-850 flex justify-between items-center text-[10px]">
                    <span className="text-blue-400 font-mono font-bold uppercase">{s.metric}</span>
                    <span className="text-slate-500 font-mono">${s.costFactor}/mo base</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Estimator and Monthly flat cost card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-mono text-orange-500 tracking-widest uppercase font-semibold">CUSTOM STACK CONFIGURATION</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight uppercase">
                  Build your technical footprint instantly
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select key technology nodes from our capabilities grid. Estimate monthly infrastructure, edge telemetry services, and support levels immediately using the slider below.
                </p>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-300 font-mono">
                    SCALE REQUIREMENTS: <span className="text-orange-400 font-mono">{(scaleFactor * 10000).toLocaleString()}</span> active monthly active transactions.
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={scaleFactor} 
                    onChange={(e) => setScaleFactor(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10k Tx / Month</span>
                    <span>500k Tx / Month</span>
                    <span>1M+ Tx / Month</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-orange-500/10 text-orange-400 font-mono text-[9px] font-bold px-2 py-1 rounded">ESTIMATE ONLY</span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Your Estimated Deployment Cost</h4>

                  <div className="space-y-4 mb-8 text-xs">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400">Base Services Integration</span>
                      <span className="font-mono text-slate-200">
                        {selectedServices.length} Selected
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-400">Target Scaling multiplier</span>
                      <span className="font-mono text-slate-200">
                        x{(1 + scaleFactor/40).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-850 pt-4 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-white">Monthly Investment</span>
                      <div className="text-right">
                        <span className="text-3xl font-black text-orange-500 font-mono">
                          ${calculateMonthlyCost().toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">USD / Month billed flat</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        playSound('cheer');
                        setContactSubmitted(true);
                        showToast("Consultation request successfully transmitted!");
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center transition shadow-lg text-xs uppercase tracking-wide"
                    >
                      Confirm Engineering Consultation
                    </button>
                    <p className="text-[10px] text-center text-slate-500">
                      Every customized StackLabs configuration includes full architecture blueprints, dedicated Slack telemetry integration, and a free New York Mets jersey for the engineering leadership team.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Audit Form Section */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-2xl text-left max-w-4xl mx-auto">
              {contactSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">✓</div>
                  <h4 className="text-xl font-bold text-white uppercase">Audit Requested successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">Our systems architects have indexed your target configuration. We'll be in touch before the 9th inning is over.</p>
                  <button 
                    onClick={() => setContactSubmitted(false)}
                    className="px-5 py-2.5 bg-slate-850 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    playSound('cheer');
                    setContactSubmitted(true);
                    showToast('🚀 System consultation request transmitted!');
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Buck Showalter" 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:border-orange-500 focus:outline-none text-xs uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Work Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. buck@mets.com" 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:border-orange-500 focus:outline-none text-xs uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Technical Scale Target or Baseball Discussion Topic</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Describe your current tech limitations, traffic spikes, or what you think of Senga's ghost forkball..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:border-orange-500 focus:outline-none text-xs font-mono"
                    ></textarea>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-850 pt-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="news" defaultChecked className="rounded border-slate-850 bg-slate-950 text-orange-500 focus:ring-0" />
                      <label htmlFor="news" className="text-[10px] text-slate-400">Subscribe to monthly StackLabs Tech & Mets Stats digest.</label>
                    </div>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-500 hover:to-orange-500 text-slate-950 font-black text-xs tracking-widest uppercase rounded-xl shadow-lg transition duration-300 w-full md:w-auto"
                    >
                      Submit Audit Request ⚡
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: OPERATIONAL GREEN CONSOLE TERMINAL WINDOW */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-sm max-w-4xl mx-auto">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-850 flex justify-between items-center text-xs text-slate-400">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span>stacklabs-pilot@citi-field-node</span>
                <span>v3.2.0-stable</span>
              </div>

              <div className="p-6 space-y-3 min-h-[400px] max-h-[500px] overflow-y-auto bg-slate-950 text-green-400 leading-relaxed font-mono">
                <div className="whitespace-pre-wrap">
                  {"*****************************************************************\n*  StackLabs Pilot CryptVault Terminal Client Engine v3.2.0    *\n*  DB mode: SQLite WAL journal. Relays connected to 8095.       *\n*  Type 'help' to review clearance actions.                     *\n*****************************************************************\n"}
                </div>
                {terminalLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>

              <form onSubmit={handleTerminalSubmit} className="bg-slate-900 p-4 border-t border-slate-850 flex items-center gap-3">
                <span className="text-green-500 font-bold ml-2">pilot@stacklabs:~$</span>
                <input
                  type="text"
                  placeholder="type help, about, stack, mets, pitch, sync, quote 'new quote'..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="bg-transparent text-slate-100 flex-1 focus:outline-none placeholder-slate-700 focus:ring-0 text-sm border-none py-0 font-mono"
                />
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-green-600/20 text-green-400 border border-green-500/30 text-xs rounded hover:bg-green-600/30 font-bold transition uppercase tracking-wider"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* COCKPIT FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h5 className="font-bold text-white text-sm">StackLabs LLC</h5>
            <p className="text-slate-500 mt-1 leading-normal font-sans">High-Throughput Systems Engineers & Devoted Baseball Fans.</p>
          </div>
          
          <div className="flex gap-6 font-mono text-slate-400">
            <button onClick={() => { setActiveTab('itsm'); playSound('pop'); }} className="hover:text-white transition">ITSM Portal</button>
            <button onClick={() => { setActiveTab('mets'); playSound('pop'); }} className="hover:text-white transition">Mets simulation</button>
            <button onClick={() => { setActiveTab('capabilities'); playSound('pop'); }} className="hover:text-white transition">Capabilities</button>
            <button onClick={() => { setActiveTab('terminal'); playSound('pop'); }} className="hover:text-white transition">Operational Console</button>
          </div>

          <div className="text-center md:text-right text-slate-600 font-mono">
            <p>© 2026 StackLabs. Not affiliated with Major League Baseball or the New York Mets.</p>
            <p className="mt-1 text-[10px]">Let's go Mets! 🍊⚾🔵</p>
          </div>
        </div>
      </footer>
    </div>
  );
}