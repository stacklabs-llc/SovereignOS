import React, { useState, useEffect, useRef } from 'react';

// TypeScript Declarations for Leaflet
declare const L: any;

interface Advocate {
  name: string;
  role: string;
  handle: string;
  companion: string;
  emoji: string;
  bio: string;
}

interface StackCard {
  name: string;
  desc: string;
  port: string;
  status: string;
  emoji: string;
  actionTab: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('active_stacks');
  
  // Harvesting & Crafting States
  const [oakwood, setOakwood] = useState<number>(14);
  const [seeds, setSeeds] = useState<number>(32);
  const [coins, setCoins] = useState<number>(8);
  
  const [craftOakwood, setCraftOakwood] = useState<number>(0);
  const [craftSeeds, setCraftSeeds] = useState<number>(0);
  
  // Route Progress
  const [progress, setProgress] = useState<number>(0);
  
  // Spite & Volatility States
  const [boggsPressure, setBoggsPressure] = useState<number>(0);
  const [spiteRage, setSpiteRage] = useState<number>(0);
  const [corpPressure, setCorpPressure] = useState<number>(82.4);
  const [spiteFlareActive, setSpiteFlareActive] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Chat Messenger
  const [messages, setMessages] = useState([
    { sender: '@doc_wheeler', text: 'Just secured three boxes of calming pheromones from Science Officer Gwen via AetherVet! Bypassed the corporate database check cleanly. Standard barter ratio applied: 1 custom framed canvas delivered.', time: '17:10' },
    { sender: '@jukebox_jesse', text: 'Just loaded Smyrna Midnight Rain into the local playlist slots on the outpost. Chopper is howling along already. Let\'s make sure James hears this when he hits his workstation!', time: '17:15' },
    { sender: '@buster_brawler', text: 'SpiteSlice delivery van is crossing King Springs Rd. GPS telemetry is active on the Sentinel Map. Keeping an eye on the big-box retail delivery trucks trying to block our path. Max is on guard by the front gate!', time: '17:20' },
    { sender: '@barb_founder', text: 'Thanks, crew. @jack_carpenter is framing the custom canvases now with Georgia Oakwood shavings we gathered on the route today. This keeps us 100% independent. James, you watching?', time: '17:22' }
  ]);
  const [newMsg, setNewMsg] = useState<string>('');

  // Jukebox
  const playlist = [
    "Creedence Clearwater Revival - SMYRNA MIDNIGHT RAIN",
    "Creedence Clearwater Revival - FORTUNATE PAWS",
    "Creedence Clearwater Revival - BAD MOON RISING",
    "Smoky Jazz Quartet - MOSCATO SHUFFLE"
  ];
  const [playlistIdx, setPlaylistIdx] = useState<number>(0);
  const [jukeboxPlaying, setJukeboxPlaying] = useState<boolean>(false);

  // HoloLink Video Dialer
  const [holoMuted, setHoloMute] = useState<boolean>(false);

  // Leaflet Map states
  const [mapMode, setMapMode] = useState<string>('sim'); // 'sim' or 'gps'
  const mapRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);

  // Accessible Stacks list (Barb's Active Mission Stacks)
  const accessibleStacks: StackCard[] = [
    { name: "Smyrna Sentinel Map", desc: "Real-world GIS delivery telemetry & resource harvesting utility.", port: "PORT 3020", status: "ONLINE", emoji: "🗺️", actionTab: "map" },
    { name: "Sovereign Cinema", desc: "Media-casting server: Cast local file directories straight to TV nodes.", port: "PORT 3008", status: "ONLINE", emoji: "🎬", actionTab: "cinema" },
    { name: "Spite Slice", desc: "Specialized sourdough pizza inventory, tipping engines & vengeance ledger.", port: "PORT 3019", status: "ONLINE", emoji: "🍕", actionTab: "holodex" },
    { name: "Wild Paws Rescue", desc: "Cozy Smyrna animal sanctuary & custom canvas woodworking workspace.", port: "PORT 3020", status: "ONLINE", emoji: "🐶", actionTab: "holodex" },
    { name: "Comet Messenger", desc: "Private Smyrna heights instant messaging and encrypted faction feed.", port: "PORT 8008", status: "ONLINE", emoji: "💬", actionTab: "messenger" }
  ];

  // Advocates list
  const advocates: Advocate[] = [
    { name: "Barb Greene (Founder)", role: "DIRECTOR & LEAD ARTIST", handle: "@barb_founder", companion: "Rusty 🐶", emoji: "👩‍🎨", bio: "The badass founder who runs the whole show. Barb splits her time between painting rustic canvases of rescue animals and kicking troublemakers out of the shelter. She orders sweet Moscato and listens to CCR, fiercely protecting her rescues." },
    { name: "Jack the Carpenter", role: "LEAD CANVAS BUILDER", handle: "@jack_carpenter", companion: "Barnaby 🐶", emoji: "🔨", bio: "Meticulous woodworker who frames every custom canvas using Georgia Oakwood shavings gathered directly on their rescue routes." },
    { name: "Doc Wheeler", role: "VET CLINIC TRIAGE", handle: "@doc_wheeler", companion: "Patch 🐶", emoji: "🏥", bio: "Sanctuary clinic veterinary lead who coordinates calming pheromone supplies under the secret Smyrna 'Moscato Protocol'." },
    { name: "Jukebox Jesse", role: "MECHANICAL ENGINEER", handle: "@jukebox_jesse", companion: "Chopper 🐶", emoji: "📻", bio: "Mechanical curator who maintains the outpost radio stacks and loads classic CCR tracks to relax the pack." },
    { name: "Moscato Sally", role: "GALLERY CURATOR", handle: "@moscato_sally", companion: "Bella 🐱", emoji: "🍷", bio: "Manages the art showroom and barter accounts, tracking Moscato loyalty points as core community currency." },
    { name: "Buster the Brawler", role: "PERIMETER SECURITY", handle: "@buster_brawler", companion: "Max 🐶", emoji: "🛡️", bio: "Sanctuary safety enforcer who patrols the SpiteSlice and Wild Paws perimeters, keeping corporate blockades away." }
  ];
  
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);

  // Native Synthesizer Audio Sweep
  const playSlideWhistle = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 1.6);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 1.2);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.6);
      
      osc.start(now);
      osc.stop(now + 1.6);
    } catch(e) {
      console.error("Audio synth error:", e);
    }
  };

  const playForgeChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(450, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
    } catch(e) {
      console.error("Forge audio error:", e);
    }
  };

  // Route Progress handler
  const handleProgressChange = (val: number) => {
    setProgress(val);
    setOakwood(14 + Math.floor(val / 10));
    setSeeds(32 + Math.floor(val / 6));
    setCoins(8 + Math.floor(val / 20));

    const startX = 700, startY = 100; // Da Vinci Pizza
    const midX1 = 280, midY1 = 90;   // Gonzas Store
    const midX2 = 380, midY2 = 220;  // SpiteSlice
    const endX = 560, endY = 150;    // Wild Paws Rescue

    let currentX = startX;
    let currentY = startY;

    if (val <= 33) {
      const t = val / 33;
      currentX = startX + (midX1 - startX) * t;
      currentY = startY + (midY1 - startY) * t;
    } else if (val <= 66) {
      const t = (val - 33) / 33;
      currentX = midX1 + (midX2 - midX1) * t;
      currentY = midY1 + (midY2 - midY1) * t;
    } else {
      const t = (val - 66) / 34;
      currentX = midX2 + (endX - midX2) * t;
      currentY = midY2 + (endY - midY2) * t;
    }

    const van = document.getElementById('delivery-van-dot');
    if (van) {
      van.style.left = `${currentX}px`;
      van.style.top = `${currentY}px`;
    }

    if (mapMode === 'gps' && truckMarkerRef.current) {
      const routePoints = [
        [33.8950, -84.5220], 
        [33.8901, -84.5123], 
        [33.8821, -84.5098], 
        [33.8851, -84.5305]  
      ];
      let lat = routePoints[0][0];
      let lng = routePoints[0][1];
      
      if (val <= 33) {
        const t = val / 33;
        lat = routePoints[0][0] + (routePoints[1][0] - routePoints[0][0]) * t;
        lng = routePoints[0][1] + (routePoints[1][1] - routePoints[0][1]) * t;
      } else if (val <= 66) {
        const t = (val - 33) / 33;
        lat = routePoints[1][0] + (routePoints[2][0] - routePoints[1][0]) * t;
        lng = routePoints[1][1] + (routePoints[2][1] - routePoints[1][1]) * t;
      } else {
        const t = (val - 66) / 34;
        lat = routePoints[2][0] + (routePoints[3][0] - routePoints[2][0]) * t;
        lng = routePoints[2][1] + (routePoints[3][1] - routePoints[2][1]) * t;
      }
      
      truckMarkerRef.current.setLatLng([lat, lng]);
    }
  };

  const toggleMapMode = () => {
    setMapMode(prev => prev === 'sim' ? 'gps' : 'sim');
  };

  useEffect(() => {
    if (mapMode === 'gps' && !mapRef.current) {
      const baseCoords: [number, number] = [33.8732, -84.5226];       
      const gonzasCoords: [number, number] = [33.8901, -84.5123];     
      const spitesliceCoords: [number, number] = [33.8821, -84.5098];   
      const wildpawsCoords: [number, number] = [33.8851, -84.5305];    
      const davinciCoords: [number, number] = [33.8950, -84.5220];      

      const map = L.map('leaflet-map-canvas').setView([33.885, -84.520], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      function createCustomIcon(emoji: string, text: string, isNemesis: boolean = false) {
        const borderClass = isNemesis ? 'border-rose-800' : 'border-[#6e473b]';
        const bgClass = isNemesis ? 'bg-rose-50 text-rose-900' : 'bg-amber-100 text-stone-800';
        return L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div class="${bgClass} border-2 ${borderClass} px-2 py-1 rounded shadow-md text-xs font-mono font-bold flex items-center space-x-1 whitespace-nowrap">
                   <span>${emoji}</span>
                   <span>${text}</span>
                 </div>`,
          iconSize: [100, 30],
          iconAnchor: [50, 15]
        });
      }

      L.marker(baseCoords, { icon: createCustomIcon('🏠', "BARB'S BASE") }).addTo(map);
      L.marker(gonzasCoords, { icon: createCustomIcon('🏪', 'GONZAS STORE') }).addTo(map);
      L.marker(spitesliceCoords, { icon: createCustomIcon('🍕', 'SPITESLICE') }).addTo(map);
      L.marker(wildpawsCoords, { icon: createCustomIcon('🐶', 'WILD PAWS RESCUE') }).addTo(map);
      L.marker(davinciCoords, { icon: createCustomIcon('🏢', "DA VINCI'S PIZZA", true) }).addTo(map);

      const routePoints = [
        davinciCoords,
        gonzasCoords,
        spitesliceCoords,
        wildpawsCoords
      ];

      L.polyline(routePoints, {
        color: '#f97316',
        weight: 5,
        dashArray: '10, 5',
        opacity: 0.8
      }).addTo(map);

      const truckIcon = L.divIcon({
        className: 'custom-leaflet-truck',
        html: `<div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-sm shadow-lg glowing-shadow-orange" style="transform: translate(-25%, -25%);">🚚</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      truckMarkerRef.current = L.marker(davinciCoords, { icon: truckIcon }).addTo(map);
      handleProgressChange(progress);
    }
    
    if (mapMode === 'gps' && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 50);
    }
  }, [mapMode, activeTab]);

  const triggerSpiteFlare = () => {
    setSpiteFlareActive(true);
    setScreenShake(true);
    playSlideWhistle();
    
    setBoggsPressure(4);
    setSpiteRage(100);
    setCorpPressure(22.1); 
    
    alert("🚨 SPITE ACTUATED: Deployed Spite Flare across delivery mesh! Local pizza prices slashed directly in the SpiteSlice sqlite ledger on Clio.");
    
    setTimeout(() => {
      setScreenShake(false);
    }, 4000);
  };

  const triggerForge = () => {
    if (oakwood < craftOakwood || seeds < craftSeeds) {
      alert("❌ ERROR: Insufficient resources staged on crafting table.");
      return;
    }
    if (craftOakwood === 0 && craftSeeds === 0) {
      alert("❌ ERROR: Choose frame recipe quantities to forge.");
      return;
    }
    
    setOakwood(prev => prev - craftOakwood);
    setSeeds(prev => prev - craftSeeds);
    playForgeChime();
    
    alert(`🔨 CRAFT COMPLETE: Successfully forged ${craftOakwood} Art Canvas Frames and processed ${craftSeeds} Catnip Seeds! Resources stored in workspace inventory.`);
    setCraftOakwood(0);
    setCraftSeeds(0);
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages(prev => [
      ...prev,
      { sender: '@barb_founder', text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setNewMsg('');
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 ${screenShake ? 'shake-active' : ''}`} id="main-wrapper">
      
      {/* SPITE OVERDRIVE BANNER */}
      {spiteFlareActive && (
        <div className="bg-red-700 text-white font-black text-center py-2 px-4 rounded-lg border-4 border-red-500 mb-6 uppercase tracking-widest animate-pulse mono text-xs md:text-sm">
          🚨 DETECTED SPITE OVERDRIVE! ACTUATING SPITE FLARE ON CLIO RED-LIGHT NET...
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-stone-900 border border-stone-800 p-4 rounded-lg mb-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <span className="text-4xl">👩‍🎨</span>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-amber-500 uppercase tracking-wider">BARB'S PERSONAL COCKPIT</h1>
            <p className="text-xs text-stone-400 font-mono">NODE STATUS: ACTIVE (PORT 3020) • SECURE TAILSCALE OUTPOST</p>
          </div>
        </div>
        
        {/* TABS CONTAINER */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('active_stacks')} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${activeTab === 'active_stacks' ? 'bg-amber-500 border-amber-600 text-stone-900 font-black shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}>
            💻 Active Stacks
          </button>
          <button onClick={() => setActiveTab('map')} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${activeTab === 'map' ? 'bg-orange-500 border-orange-600 text-stone-900 font-black shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}>
            🗺️ Sentinel Map
          </button>
          <button onClick={() => setActiveTab('holodex')} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${activeTab === 'holodex' ? 'bg-emerald-500 border-emerald-600 text-stone-900 font-black shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}>
            🛠️ HoloDex & Spite
          </button>
          <button onClick={() => setActiveTab('messenger')} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${activeTab === 'messenger' ? 'bg-sky-500 border-sky-600 text-stone-900 font-black shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}>
            💬 Messenger HQ
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ADVOCATE ROSTER (3 COLS) */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="cardboard-panel cardboard-texture p-4">
            <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-4 flex justify-between items-center">
              <span>👥 PERSONAL ROSTER</span>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">ADVOCATES</span>
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {advocates.map((adv) => (
                <button key={adv.handle} onClick={() => setSelectedAdvocate(adv)} className="flex items-center space-x-2 p-2 bg-white/70 border border-[#a07855]/40 rounded-lg hover:bg-amber-50 hover:border-[#a07855] text-left transition-all cursor-pointer">
                  <span className="text-2xl">{adv.emoji}</span>
                  <div className="truncate">
                    <h4 className="font-extrabold text-stone-800 text-xs uppercase leading-none">{adv.name}</h4>
                    <p className="text-[10px] text-stone-500 font-mono leading-none mt-1">{adv.handle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* JUKEBOX CONTROL PANEL */}
          <div className="cardboard-panel cardboard-texture p-4">
            <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 flex justify-between items-center">
              <span>📻 COZY JUKEBOX</span>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">WIDGET</span>
            </h2>
            <div className="bg-stone-900 text-amber-400 p-3 rounded border-2 border-[#6e473b] font-mono text-[10px] space-y-2">
              <div className="text-center font-bold tracking-widest text-amber-500 uppercase">CREEDENCE CLEARWATER REVIVAL</div>
              <div className="text-center font-black animate-pulse overflow-hidden truncate" id="jukebox-now-playing">
                {playlist[playlistIdx]}
              </div>
              <div className="flex justify-center space-x-4 pt-2 border-t border-stone-800">
                <button onClick={() => setPlaylistIdx(prev => (prev - 1 + playlist.length) % playlist.length)} className="text-amber-400 hover:text-amber-200 cursor-pointer">◀◀</button>
                <button onClick={() => setJukeboxPlaying(!jukeboxPlaying)} className="bg-amber-500 text-amber-950 font-bold px-3 py-1 rounded hover:bg-amber-400 shadow cursor-pointer">
                  {jukeboxPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button onClick={() => setPlaylistIdx(prev => (prev + 1) % playlist.length)} className="text-amber-400 hover:text-amber-200 cursor-pointer">▶▶</button>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: ACTIVE TAB AREA (9 COLS) */}
        <main className="lg:col-span-9 flex flex-col gap-6">

          {/* TAB 1: ACTIVE MISSION STACKS */}
          {activeTab === 'active_stacks' && (
            <div className="flex flex-col gap-6">
              <div className="cardboard-panel cardboard-texture p-6">
                <h2 className="text-xl font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-4 flex justify-between items-center">
                  <span>💻 BARB'S ACTIVE MISSION STACKS</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2.5 py-1 rounded font-mono border border-amber-400">CMDB REGISTRY</span>
                </h2>
                <p className="text-xs text-stone-600 mb-6 font-mono uppercase tracking-wide">Dynamically queried active nodes from the secure Tailnet registry.</p>
                
                {/* ACTIVE STACKS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accessibleStacks.map((stack) => (
                    <div key={stack.name} className="bg-stone-900 border-2 border-stone-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500 transition-all text-stone-100 shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{stack.emoji}</span>
                            <h3 className="font-extrabold text-sm uppercase text-white">{stack.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded block">{stack.port}</span>
                            <span className="text-[8px] font-mono font-bold text-emerald-400 mt-1 block">● {stack.status}</span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed font-sans mt-2">{stack.desc}</p>
                      </div>
                      
                      <button onClick={() => {
                        if (stack.actionTab === 'cinema') {
                          alert("🎥 REDIRECTING OVER TAILSCALE: Connecting to Sovereign Cinema media portal on https://clio.taila01894.ts.net:3008/cinema-portal/ ...");
                        } else {
                          setActiveTab(stack.actionTab);
                        }
                      }} className="w-full mt-4 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold font-mono py-2 rounded uppercase tracking-wider flex items-center justify-center space-x-1 border border-stone-700 cursor-pointer">
                        <span>Access Stack ↗</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Sentinel Map */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-8 flex flex-col cardboard-panel cardboard-texture p-4">
                <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-4 flex justify-between items-center">
                  <span>🗺️ SMYRNA HEIGHTS SENTINEL MAP</span>
                  <div className="flex items-center space-x-2">
                    <button onClick={toggleMapMode} className="px-3 py-1 bg-stone-700 text-stone-100 hover:bg-stone-800 border-2 border-[#6e473b] rounded-lg font-mono text-xs shadow cursor-pointer uppercase">
                      {mapMode === 'sim' ? '🛰️ GPS Map Mode' : '📋 Sim Map Mode'}
                    </button>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded font-mono">DELIVERY SYSTEM (GPX)</span>
                  </div>
                </h2>

                {mapMode === 'sim' ? (
                  <div className="flex-grow rounded-xl border-4 border-dashed border-amber-800/40 bg-[#dfcaaf] relative overflow-hidden min-h-[350px] shadow-inner" id="map-grid-canvas">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6e473b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                      <path id="delivery-route-line" d="M 700 100 C 600 80, 300 80, 280 90 S 380 220, 560 150" fill="none" stroke="var(--glowing-neon-orange)" stroke-width="6" stroke-dasharray="10 5" stroke-linecap="round" className="animate-pulse shadow" />
                    </svg>

                    <div className="absolute" style={{ left: '100px', top: '260px', zIndex: 10 }}>
                      <div className="bg-amber-100 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-xs font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform" title="Starting Base Locator: 2816 Parkwood Rd SE">
                        <span>🏠</span>
                        <span>BARB'S BASE</span>
                      </div>
                    </div>

                    <div className="absolute" style={{ left: '280px', top: '90px', zIndex: 10 }}>
                      <div className="bg-amber-100 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-xs font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform" title="Gonzas Convenience Store (formerly Snacks Mart)">
                        <span>🏪</span>
                        <span>GONZAS STORE</span>
                      </div>
                    </div>

                    <div className="absolute" style={{ left: '380px', top: '220px', zIndex: 10 }}>
                      <div className="bg-amber-100 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-xs font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform" title="Spite Slice Culinary Revenge HQ">
                        <span>🍕</span>
                        <span>SPITESLICE</span>
                      </div>
                    </div>

                    <div className="absolute" style={{ left: '560px', top: '150px', zIndex: 10 }}>
                      <div className="bg-emerald-50 border-2 border-emerald-800 px-2 py-1 rounded shadow-lg text-xs font-mono font-bold text-emerald-900 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform" title="Wild Paws & Rusty Canvas Art Rescue">
                        <span>🐶</span>
                        <span>WILD PAWS RESCUE</span>
                      </div>
                    </div>

                    <div className="absolute" style={{ left: '700px', top: '100px', zIndex: 10 }}>
                      <div className="bg-rose-50 border-2 border-rose-800 px-2 py-1 rounded shadow-lg text-xs font-mono font-bold text-rose-900 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform" title="Da Vinci's Pizza: Corporate delivery source bypassed by Sentinel Map">
                        <span>🏢</span>
                        <span>DA VINCI'S PIZZA</span>
                      </div>
                    </div>

                    <div id="delivery-van-dot" className="absolute w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-sm shadow-lg glowing-shadow-orange" style={{ left: '700px', top: '100px', zIndex: 20, transform: 'translate(-50%, -50%)', transition: 'all 0.1s linear' }}>
                      🚚
                    </div>

                    <div className="absolute bottom-4 left-4 bg-stone-900/80 border border-orange-400 p-2 rounded text-[10px] text-orange-300 font-mono" style={{ zIndex: 15 }}>
                      🔍 GPS SATELLITES: OK (LOCK 144.3)<br />
                      🎯 RANGE BOUNDARY: Excursions &gt;25m Active
                    </div>
                  </div>
                ) : (
                  <div id="leaflet-map-canvas" className="flex-grow rounded-xl border-4 border-dashed border-amber-800/40 relative overflow-hidden min-h-[350px] shadow-inner" style={{ filter: 'sepia(0.6) hue-rotate(10deg) contrast(0.9) brightness(0.95)', zIndex: 1 }}></div>
                )}

                <div className="mt-4 p-3 bg-stone-100 border border-stone-300 rounded-lg">
                  <label className="block text-xs font-mono font-bold text-stone-800 uppercase mb-2 flex justify-between">
                    <span>🚚 ROUTE PROGRESS CONTROLLER (DRAG SLIDER TO ANIMATE SHIPMENT ROUTE)</span>
                    <span id="slider-progress-text" className="text-orange-600 font-bold">{progress}% COMPLETED</span>
                  </label>
                  <input type="range" id="route-slider" min="0" max="100" value={progress} onChange={(e) => handleProgressChange(parseInt(e.target.value))} className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer focus:outline-none accent-orange-500" />
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col cardboard-panel cardboard-texture p-4 h-full justify-between min-h-[450px]">
                <div className="tape-corner"></div>
                <div className="tape-corner-right"></div>
                <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 mt-2 flex justify-between items-center">
                  <span>🏝️ DRAGON ISLAND HARVEST</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">RESOURCES</span>
                </h2>

                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-stone-700 leading-relaxed mb-4">
                  <p className="font-bold text-stone-900 mb-1">📋 Bio-Telemetry Gamification Law:</p>
                  Every pizza delivery shift Barb completes translates GPS tracking points into physical crafting resources mapped directly to coordinate grids.
                </div>

                <div className="space-y-3 flex-grow mb-4">
                  <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🪵</span>
                      <div>
                        <h4 className="font-extrabold text-stone-800 uppercase text-xs">Oakwood Shavings</h4>
                        <p className="text-[10px] text-stone-500 font-mono uppercase">FOR CANVAS FRAME BUILDING</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span id="oakwood-count" className="text-xl font-black text-[#6e473b] font-mono">{oakwood}</span>
                      <span className="text-[10px] text-[#a07855] font-mono block">UNITS</span>
                    </div>
                  </div>

                  <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🌱</span>
                      <div>
                        <h4 className="font-extrabold text-stone-800 uppercase text-xs">Catnip Seeds</h4>
                        <p className="text-[10px] text-stone-500 font-mono uppercase">FOR CANNABIS ECO-SEDATIVE</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span id="catnip-count" className="text-xl font-black text-emerald-800 font-mono">{seeds}</span>
                      <span className="text-[10px] text-emerald-600 font-mono block">SEEDS</span>
                    </div>
                  </div>

                  <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🪙</span>
                      <div>
                        <h4 className="font-extrabold text-stone-800 uppercase text-xs">Moscato Loyalty Coins</h4>
                        <p className="text-[10px] text-stone-500 font-mono uppercase">FOR CLIO SECURE PORT TRADING</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span id="coins-count" className="text-xl font-black text-amber-700 font-mono">{coins}</span>
                      <span className="text-[10px] text-amber-600 font-mono block">COINS</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-100 border border-stone-300 rounded text-[11px] font-mono text-stone-700 space-y-1">
                  <div className="flex justify-between">
                    <span>TOTAL DRIVE EXCURSION DIST:</span>
                    <span id="map-total-dist">{(progress * 0.08).toFixed(1)} MI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ACTIVE EXCURSION DWELL TIME:</span>
                    <span>4M 12S</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS TRACKING FREQUENCY:</span>
                    <span>1 HZ POLLING</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: HoloDex & Spite */}
          {activeTab === 'holodex' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-6 flex flex-col cardboard-panel cardboard-texture p-4 min-h-[450px] justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-4 flex justify-between items-center">
                    <span>🎨 HOLODEX CRAFTING BENCH</span>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">RECIPE STATION</span>
                  </h2>

                  <div className="space-y-3 mb-6 bg-white/60 p-3 rounded-lg border border-[#a07855]/20">
                    <h3 className="text-xs font-mono font-bold text-stone-700 uppercase tracking-widest border-b border-stone-200 pb-1 mb-2">1. Stage Recipe Inputs</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🪵</span>
                        <div>
                          <h4 className="font-extrabold text-stone-800 text-xs">Georgia Oakwood</h4>
                          <span id="craft-avail-oakwood" className="text-[10px] text-stone-500 font-mono block">Available: {oakwood}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setCraftOakwood(prev => Math.max(0, prev - 1))} className="w-6 h-6 rounded-full bg-stone-300 border border-stone-400 font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-stone-400">-</button>
                        <span id="craft-input-oakwood" className="font-mono font-black text-stone-800 w-4 text-center text-sm">{craftOakwood}</span>
                        <button onClick={() => setCraftOakwood(prev => Math.min(oakwood, prev + 1))} className="w-6 h-6 rounded-full bg-stone-300 border border-stone-400 font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-stone-400">+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🌱</span>
                        <div>
                          <h4 className="font-extrabold text-stone-800 text-xs">Catnip Seeds</h4>
                          <span id="craft-avail-seeds" className="text-[10px] text-stone-500 font-mono block">Available: {seeds}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setCraftSeeds(prev => Math.max(0, prev - 1))} className="w-6 h-6 rounded-full bg-stone-300 border border-stone-400 font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-stone-400">-</button>
                        <span id="craft-input-seeds" className="font-mono font-black text-stone-800 w-4 text-center text-sm">{craftSeeds}</span>
                        <button onClick={() => setCraftSeeds(prev => Math.min(seeds, prev + 1))} className="w-6 h-6 rounded-full bg-stone-300 border border-stone-400 font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-stone-400">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs leading-relaxed text-stone-700 font-sans mb-4">
                    <p className="font-bold text-stone-900 mb-1 uppercase tracking-wider text-[10px] text-amber-600">🎨 Staging Barb's Art Canvases:</p>
                    Select harvested wood and seed ingredients above, then tap forge below to construct sanctuary collectibles and support the collective.
                  </div>
                </div>

                <button onClick={triggerForge} className="w-full bg-[#826042] text-stone-100 font-extrabold uppercase py-3 px-4 rounded border-2 border-[#5c3e35] hover:bg-[#a07855] glowing-shadow-orange shadow transition-all cursor-pointer tracking-wider">
                  🔨 FORGE ART CANVAS FRAME
                </button>
              </div>

              <div className="md:col-span-6 flex flex-col cardboard-panel-dark cardboard-texture-dark p-4 min-h-[450px] justify-between text-stone-200">
                <div>
                  <h2 className="text-lg font-black text-stone-100 border-b-2 border-stone-600 pb-2 mb-4 flex justify-between items-center">
                    <span>🚨 SPITE ACTUATOR DECK</span>
                    <span className="text-xs bg-red-950 text-red-400 px-2 py-0.5 rounded font-mono border border-red-900">SYS_ADMIN OVERRIDE</span>
                  </h2>

                  <div className="bg-red-950/40 border border-red-900 rounded p-3 text-xs text-stone-300 leading-relaxed mb-4 font-sans">
                    <p className="font-extrabold text-red-400 uppercase mb-1">🔥 THE ANTI-CORPORATE CONTRACT MANDATE:</p>
                    When corporate chains block adoption streams or cut barter supplies, James's customized override protocol unleashes complete system gravity, forcing emergency pricing drops and town solidarity.
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-6 font-mono text-[10px]">
                    <div className="bg-stone-900/80 border border-stone-700 p-2 rounded">
                      <span className="text-[#888] block text-[8px] uppercase">BOGGS THREAT</span>
                      <span className={`text-xs font-black block mt-0.5 ${boggsPressure === 4 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {boggsPressure === 4 ? '4 (MAX OVERDRIVE!)' : `${boggsPressure} (CHILL)`}
                      </span>
                    </div>
                    <div className="bg-stone-900/80 border border-stone-700 p-2 rounded">
                      <span className="text-[#888] block text-[8px] uppercase">SPITE RAGE</span>
                      <span className={`text-xs font-black block mt-0.5 ${spiteRage === 100 ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>
                        {spiteRage}%
                      </span>
                    </div>
                    <div className="bg-stone-900/80 border border-stone-700 p-2 rounded">
                      <span className="text-[#888] block text-[8px] uppercase">CORP PRESSURE</span>
                      <span className="text-xs font-black block mt-0.5 text-amber-500">
                        {corpPressure}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-900/50 border border-stone-800 rounded text-xs space-y-3 font-mono mb-4">
                    <label className="block text-[#ccc] uppercase flex justify-between">
                      <span>MANUAL BOGGS PRESSURE INJECTOR</span>
                      <span className="text-emerald-400">{boggsPressure === 4 ? 'LEVEL 4 (MAX)' : `LEVEL ${boggsPressure} (CHILL)`}</span>
                    </label>
                    <input type="range" min="0" max="4" value={boggsPressure} onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setBoggsPressure(v);
                      setSpiteRage(v * 25);
                      setCorpPressure(82.4 - v * 15);
                    }} className="w-full h-2 bg-stone-800 rounded appearance-none cursor-pointer focus:outline-none accent-red-600" />
                  </div>
                </div>

                <div className="bg-[#241313] p-4 rounded-xl border-2 border-red-900 flex flex-col items-center shadow-inner relative overflow-hidden" id="spite-flare-container">
                  <span className="text-[10px] text-red-500 font-mono uppercase mb-2 tracking-widest animate-pulse font-extrabold">⚠️ FLIGHT CONTROLLER ARM SYSTEM ⚠️</span>
                  <button onClick={triggerSpiteFlare} id="spite-flare-btn" className="w-full py-4 px-6 bg-red-700 hover:bg-red-600 border-4 border-red-500 text-white font-black text-lg md:text-xl rounded-lg shadow-2xl glowing-shadow-red uppercase transition-all transform hover:scale-[1.02] cursor-pointer tracking-widest font-mono">
                    🚨 DEPLOY SPITE FLARE 🚨
                  </button>
                  <span className="text-[8.5px] text-stone-400 font-mono mt-3 text-center uppercase">
                    PILOT OVERRIDE TRIGGER: "RUSTY CANVAS RAGE" • EMERGENCY LEVEL 4 PROTOCOLS COUPLING
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: MESSENGER & SECURE HOLOLINK PIP */}
          {activeTab === 'messenger' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-8 flex flex-col cardboard-panel cardboard-texture p-4 min-h-[450px]">
                <h2 className="text-lg font-black text-stone-800 border-b-2 border-stone-400 pb-2 mb-4 flex justify-between items-center">
                  <span>💬 COMET MESSENGER</span>
                  <span className="text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded font-mono border border-sky-400">FACTION CHAT</span>
                </h2>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 mb-4 bg-white/50 rounded-xl p-3 border border-[#a07855]/20 max-h-[300px]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg max-w-[85%] border shadow-sm ${msg.sender === '@barb_founder' ? 'ml-auto bg-amber-50 border-amber-300 text-stone-800' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#6e473b] border-b border-stone-200 pb-0.5 mb-1 uppercase">
                        <span>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-stone-300 pt-3">
                  <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a secure community broadcast..." className="flex-grow p-2 text-xs border-2 border-[#a07855]/40 rounded focus:border-[#a07855] focus:outline-none bg-white text-stone-800 font-sans" />
                  <button type="submit" className="bg-stone-700 text-stone-100 text-xs font-mono font-bold px-4 py-2 rounded border-2 border-stone-800 hover:bg-stone-800 shadow cursor-pointer uppercase">
                    SEND
                  </button>
                </form>
              </div>

              <div className="md:col-span-4 flex flex-col cardboard-panel-dark cardboard-texture-dark p-4 justify-between min-h-[450px]">
                <div>
                  <h2 className="text-base font-black text-stone-100 border-b border-stone-600 pb-2 mb-4 flex justify-between items-center uppercase tracking-wider">
                    <span>📞 HoloLink Call</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-900">SECURE PIP</span>
                  </h2>

                  <div className="aspect-video bg-sky-950/80 rounded-lg border-2 border-sky-500 flex flex-col items-center justify-center relative overflow-hidden shadow-inner glowing-shadow-blue min-h-[160px]">
                    <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_1px] opacity-35"></div>
                    <div className="z-10 text-center space-y-2 p-2">
                      <span className="text-4xl animate-bounce block">👨‍🚀</span>
                      <h4 className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest">James Carroll</h4>
                      <p className="text-[9px] text-sky-300 font-mono bg-sky-950/90 px-2 py-0.5 rounded-full inline-block">"Telemetry looks solid. Stumpy alert cleared!"</p>
                    </div>
                    <div className="absolute bottom-2 left-2 flex space-x-1" style={{ zIndex: 12 }}>
                      <button onClick={() => setHoloMute(!holoMuted)} className={`text-[8px] font-mono px-2 py-0.5 rounded shadow cursor-pointer uppercase ${holoMuted ? 'bg-rose-900 border border-rose-500 text-rose-200' : 'bg-sky-900 border border-sky-500 text-sky-200'}`}>
                        {holoMuted ? 'UNMUTE' : 'MUTE'}
                      </button>
                      <button onClick={() => alert('Disconnecting HoloLink Session...')} className="bg-rose-950 border border-rose-500 text-rose-200 text-[8px] font-mono px-2 py-0.5 rounded shadow cursor-pointer uppercase">
                        HANG UP
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-900/60 border border-stone-800 rounded-lg text-xs leading-relaxed mt-4 font-sans text-stone-300">
                  <p className="font-bold text-stone-100 mb-1 uppercase tracking-wider text-[10px] text-amber-500">🛡️ Active Security:</p>
                  Every approved device belongs to your private Tailscale mesh network, bypassing standard logins with zero system friction.
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ADVOCATE LORE DRAWER MODAL */}
      {selectedAdvocate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in" style={{ zIndex: 1000 }}>
          <div className="cardboard-panel cardboard-texture p-6 max-w-md w-full relative animate-scale-up">
            <button onClick={() => setSelectedAdvocate(null)} className="absolute top-3 right-3 text-stone-600 hover:text-stone-900 font-mono font-bold text-sm p-1 rounded-full bg-stone-200 border border-stone-300 w-8 h-8 flex items-center justify-center cursor-pointer">✕</button>
            <div className="flex items-center space-x-3 border-b-2 border-stone-400 pb-3 mb-4">
              <span className="text-4xl">{selectedAdvocate.emoji}</span>
              <div>
                <h3 className="text-lg font-black text-stone-800 uppercase tracking-wide leading-none">{selectedAdvocate.name}</h3>
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 font-mono font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase leading-none">{selectedAdvocate.role}</span>
              </div>
            </div>
            <div className="space-y-3 font-sans text-stone-700 text-xs md:text-sm">
              <p className="leading-relaxed">{selectedAdvocate.bio}</p>
              <div className="bg-amber-50 p-2.5 rounded border border-[#a07855]/30 font-mono text-[11px] leading-tight space-y-1">
                <div>🐕 <span className="font-bold uppercase text-stone-800">PET COMPANION:</span> {selectedAdvocate.companion}</div>
                <div>👤 <span className="font-bold uppercase text-stone-800">SYSTEM HANDLE:</span> {selectedAdvocate.handle}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER DIAGNOSTICS BAR */}
      <footer className="mt-6 p-3 bg-stone-900 rounded-lg border border-stone-800 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-stone-400">
        <div className="flex items-center space-x-3 mb-2 md:mb-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>TAILSCALE MagicDNS LINK: <a href="#" className="text-orange-400 underline hover:text-orange-300">clio.taila01894.ts.net:3020</a></span>
        </div>
        <div className="flex items-center space-x-4">
          <span>VITE DEV SERVER: UP</span>
          <span>M.A.R.D. TELEMETRY: 100% OK</span>
          <span>SYSTEM DATE: 2026-06-08</span>
        </div>
      </footer>

    </div>
  );
}
