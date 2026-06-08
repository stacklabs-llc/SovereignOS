import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Tv, 
  Activity, 
  Volume2, 
  Compass, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldAlert, 
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Play,
  Heart
} from 'lucide-react';

// Define Advocate and Character Types
interface Advocate {
  handle: string;
  name: string;
  role: string;
  desc: string;
  color: string;
  avatar: string;
}

interface InventoryItem {
  id: string;
  name: string;
  cost: number;
  type: 'hfcs' | 'gut_anomaly' | 'red_dye' | 'resource';
  icon: string;
  desc: string;
  stock: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  pose: 'avatar' | 'pointing' | 'shrug';
}

export default function App() {
  // Theme State: 'feltboard' | 'industrial' | 'monolith'
  const [theme, setTheme] = useState<'feltboard' | 'industrial' | 'monolith'>('feltboard');
  const [selectedAdvocate, setSelectedAdvocate] = useState<string>('caos');
  const [selectedCell, setSelectedCell] = useState<number>(1);
  const [stagedPose, setStagedPose] = useState<string>('_avatar.png');
  const [roomEntropy, setRoomEntropy] = useState<number>(3);
  const [credits, setCredits] = useState<number>(12450);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Cart / Ingress Checkout State
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  // Jukebox State
  const [currentTrack, setCurrentTrack] = useState<string>("Bad Moon Rising - CCR");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Web Audio Context for Native Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Smyrna heights Live Discourse State
  const [chatList, setChatList] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: '@señora_caos',
      text: "Look, if you don't like Red Dye #40, step out of Smyrna. We run on unhinged feltboard hours here!",
      color: 'text-[#ff007f]',
      pose: 'avatar'
    },
    {
      id: '2',
      sender: '@just_askingquestions',
      text: "But has anyone audited the chemical viscosity of the Blue Raspberry slushie vat? Just asking questions! 🐰",
      color: 'text-sky-400',
      pose: 'shrug'
    }
  ]);

  // Roster Directory
  const ROSTER: Record<string, Advocate> = {
    caos: {
      handle: "@señora_caos",
      name: "Señora Caos",
      role: "Convenience Triage Lead",
      desc: "Reigning queen of midnight convenience runs. Operates out of the frozen slushie machine alcove. Currently fueling on Sour Patch Kids.",
      color: "text-[#ff007f]",
      avatar: "👵"
    },
    mateo: {
      handle: "@just_askingquestions",
      name: "Mateo the Rabbit",
      role: "Persistent Soda Fountain Critic",
      desc: "Scruffy, grease-painted cartoon rabbit clutching a giant plastic cup. Constantly inspecting carbonation ratios.",
      color: "text-sky-400",
      avatar: "🐰"
    },
    austin: {
      handle: "@organic_austin",
      name: "Organic Austin (Heel)",
      role: "Artisanal Gentrification Crusader",
      desc: "Hyper-cynical, condescending, hates high-fructose corn syrup, roller dogs, and retro toon slide-whistles.",
      color: "text-red-500 font-bold",
      avatar: "👓"
    }
  };

  // Inventory Shelf Stocks
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 'slushie',
      name: 'Smyrna Slushie',
      cost: 15,
      type: 'hfcs',
      icon: '🥤',
      desc: 'High-Fructose Cortisol Accelerator. Bright neon Magenta.',
      stock: 42
    },
    {
      id: 'rollerdog',
      name: 'Toon Roller Dog',
      cost: 25,
      type: 'gut_anomaly',
      icon: '🌭',
      desc: '24hr spinning meat tube. Structurally un-aligned with gut health.',
      stock: 12
    },
    {
      id: 'neonflakes',
      name: 'Expired Neon Flakes',
      cost: 30,
      type: 'red_dye',
      icon: '🥣',
      desc: 'Vibrant, un-quantized artificial cereal. Packed with Red Dye #40.',
      stock: 8
    },
    {
      id: 'napmist',
      name: 'Unlimited Nap Mist',
      cost: 150,
      type: 'resource',
      icon: '💨',
      desc: 'Essential aerosol. Used by Barb to temporarily bypass Greta the Vet audits.',
      stock: 5
    }
  ]);

  // Audio Init Helper
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Web Audio Synthesizer: Slide Whistle, Spring Boing, CRT static
  const playSynthSound = (type: 'whistle' | 'boing' | 'static') => {
    initAudio();
    if (!audioCtxRef.current) return;

    const osc = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    const now = audioCtxRef.current.currentTime;

    if (type === 'whistle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.75);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'boing') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'static') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.08);

      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.2);
    }
  };

  // Toast dispatch helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const switchAdvocate = (key: string) => {
    setSelectedAdvocate(key);
    playSynthSound('boing');
  };

  // Coordinate Slicer segment clicker
  const handleMatrixCellClick = (cellIndex: number, poseLabel: string) => {
    setSelectedCell(cellIndex);
    setStagedPose(poseLabel);
    playSynthSound('boing');
    showToast(`Matrix Slice: Quadrant ${cellIndex} staged as ${poseLabel}`);
  };

  // Synthesizer trigger
  const triggerToonSfx = (type: 'whistle' | 'boing' | 'static') => {
    playSynthSound(type);
    setRoomEntropy(prev => Math.min(11, prev + (type === 'whistle' ? 2 : 1)));
    showToast(`SFX Broadcast: Triggered toon sfx_${type}`);

    // Emergent narrative logging based on soundboard click
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    let text = "";
    let sender = "";
    let color = "";
    let pose: 'avatar' | 'pointing' | 'shrug' = 'avatar';

    if (type === 'whistle') {
      sender = "@organic_austin";
      text = "🚨 COMPLIANCE ALERT: This slide-whistle frequency is altering my cellular vibration! Put down the slushies!";
      color = "text-red-500 font-bold";
      pose = "pointing";
    } else if (type === 'boing') {
      sender = "@just_askingquestions";
      text = "Whoa! My ears did a symmetrical spring boing! Is the roof HVAC leaking pressurized carbonation?!";
      color = "text-sky-400";
      pose = "shrug";
    } else {
      sender = "@señora_caos";
      text = "Static Shock, get your copper-goggled face over to Aisle 4! The CRT is zapping!";
      color = "text-[#ff007f]";
      pose = "avatar";
    }

    setChatList(prev => [...prev, { id: Date.now().toString(), sender, text, color, pose }]);
  };

  // Add Item to cart
  const addToCart = (itemId: string) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    playSynthSound('boing');
  };

  // Remove Item from cart
  const removeFromCart = (itemId: string) => {
    if (!cart[itemId]) return;
    setCart(prev => {
      const next = { ...prev };
      next[itemId]--;
      if (next[itemId] <= 0) delete next[itemId];
      return next;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart({});
  };

  // Compute total
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = inventory.find(i => i.id === id);
    return sum + (item ? item.cost * qty : 0);
  }, 0);

  // Ingress Checkout transaction
  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return;
    setIsProcessingCheckout(true);
    showToast("ITSM Ingress: Staging REQ -> RITM pipeline...");
    playSynthSound('static');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Deduct stock and credits
    setInventory(prev => prev.map(item => {
      const qty = cart[item.id] || 0;
      return { ...item, stock: Math.max(0, item.stock - qty) };
    }));

    setCredits(prev => Math.max(0, prev - cartTotal));
    setRoomEntropy(prev => Math.min(11, prev + 2));

    const purchasedList = Object.entries(cart)
      .map(([id, qty]) => `${qty}x ${inventory.find(i => i.id === id)?.name}`)
      .join(', ');

    // Post-transaction dialogue friction injection
    setChatList(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "@señora_caos",
        text: `🛒 TRANSACTION INGRESS: Purchased ${purchasedList}! Credits verified in SQLite WAL.`,
        color: "text-[#ff007f]",
        pose: 'avatar'
      },
      {
        id: (Date.now() + 1).toString(),
        sender: "@organic_austin",
        text: "🚨 WARNING: This transaction utilizes un-audited corn syrup. I have filed an administrative cease-and-desist!",
        color: "text-red-500 font-bold",
        pose: 'pointing'
      }
    ]);

    clearCart();
    setIsProcessingCheckout(false);
    showToast("Checkout Complete! Seeder tables hydrated.");
  };

  // Trigger Heel Turn manually
  const triggerHeelTurn = () => {
    setRoomEntropy(11);
    setSelectedAdvocate('austin');
    showToast("NARRATIVE TRIGGER: Forced Heel Turn @organic_austin!");
    playSynthSound('whistle');

    setChatList(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "@organic_austin",
        text: "🚨 HEEL TURN OVERDRIVE: I am shutting down Aisle 4! No single-source sugar audits = NO CONVENIENCE!",
        color: "text-red-500 font-bold",
        pose: 'pointing'
      },
      {
        id: (Date.now() + 1).toString(),
        sender: "@señora_caos",
        text: "Sal! Grab the heavy Anvil brackets! We are blockading this gentrification hipster's wheatgrass tray!",
        color: "text-[#ff007f]",
        pose: 'avatar'
      }
    ]);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 md:p-8 font-mono relative overflow-y-auto select-none transition-colors duration-500 ${
      theme === 'feltboard' ? 'bg-[#120b08] text-[#4a3f35]' : 
      theme === 'industrial' ? 'bg-[#0f1115] text-[#cbd5e1]' : 'bg-[#030305] text-[#e2e8f0]'
    }`}>
      
      {/* 3D Monolith Logo Watermark (at 4% base opacity, transitions on hover) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] hover:opacity-[0.08] transition-opacity duration-700 z-0">
        <svg viewBox="0 0 100 100" className="w-full max-w-[650px] h-auto text-current fill-none stroke-current" strokeWidth="1.5">
          <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" />
          <path d="M50 3 L50 35 L90 55 M10 25 L50 45 L50 97 M90 25 L50 45 L10 25 M10 75 L50 55 L90 75 M50 35 L10 55 L50 75 L90 55" />
        </svg>
      </div>

      {/* TOP SYSTEM NAV / BRAND HEADER */}
      <header className={`max-w-7xl w-full mx-auto border-4 rounded-3xl p-5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl relative overflow-hidden z-10 ${
        theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f] glow-magenta' : 
        theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/80 border-[#00d4ff]'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,127,0.03),transparent_400px)] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-3xl shadow-inner animate-pulse" style={{ borderColor: theme === 'feltboard' ? '#ff007f' : theme === 'industrial' ? '#f59e0b' : '#00d4ff' }}>
            🌮
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2" style={{ color: theme === 'feltboard' ? '#ff007f' : theme === 'industrial' ? '#f59e0b' : '#ffffff' }}>
              Gonzas Cantina
              <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-md font-bold tracking-normal border border-black shadow-sm">24/7/365</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Smyrna Heights Toon Node // Port 3017</p>
          </div>
        </div>

        {/* System telemetry stats */}
        <div className="flex flex-wrap gap-2.5 z-10">
          <div className="border px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: theme === 'feltboard' ? '#ff007f' : '#cbd5e1', borderColor: theme === 'feltboard' ? '#ff007f' : '#475569' }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme === 'feltboard' ? '#ff007f' : '#00ff88' }}></span>
            <span>Mesh Outpost Secure</span>
          </div>
          <div className="bg-yellow-400/10 border border-yellow-400/30 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider text-yellow-500">
            Entropy: Level {roomEntropy}
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider text-emerald-400">
            Balance: {credits} SC
          </div>
        </div>
      </header>

      {/* CORE STOREFRONT WORKSPACE */}
      <main className="max-w-7xl w-full mx-auto flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch my-auto z-10">
        
        {/* LEFT COLUMN: CONVENIENCE CASHIER DESK & INVENTORY (7 COLS) */}
        <section className={`lg:col-span-7 border-4 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-2xl relative ${
          theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f]' : 
          theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/50 border-white/10'
        }`}>
          <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: theme === 'feltboard' ? 'rgba(255,0,127,0.2)' : 'rgba(255,255,255,0.1)' }}>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: theme === 'feltboard' ? '#ff007f' : 'inherit' }}>
              🏪 Convenience Storefront Desk
            </h2>
            <span className="text-[9px] text-slate-400 bg-black/20 border border-slate-700/50 px-2 py-0.5 rounded">Storefront Cashier</span>
          </div>

          {/* Active Symmetrical Matrix Slicer Display */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 bg-black/20 border border-white/5 rounded-2xl p-4">
            
            {/* The 3x3 Slices Visualizer */}
            <div className="sm:col-span-6 flex flex-col gap-2.5">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block text-left">Local PIL Slicing Matrix (1024px)</span>
              <div className="aspect-square bg-slate-950 rounded-xl relative overflow-hidden border border-white/10 grid grid-cols-3 grid-rows-3 p-1.5 gap-1.5">
                
                {/* 9 Quadrants representing Pillow Crops */}
                {[
                  { cell: 1, label: 'Avatar', suffix: '_avatar.png' },
                  { cell: 2, label: 'N/A', suffix: '' },
                  { cell: 3, label: 'N/A', suffix: '' },
                  { cell: 4, label: 'N/A', suffix: '' },
                  { cell: 5, label: 'N/A', suffix: '' },
                  { cell: 6, label: 'N/A', suffix: '' },
                  { cell: 7, label: 'Point', suffix: '_pointing.png' },
                  { cell: 8, label: 'Shrug', suffix: '_shrug.png' },
                  { cell: 9, label: 'N/A', suffix: '' }
                ].map((quad, idx) => (
                  quad.suffix ? (
                    <button
                      key={idx}
                      onClick={() => handleMatrixCellClick(quad.cell, quad.suffix)}
                      className={`border rounded flex flex-col items-center justify-center transition-all cursor-pointer font-bold ${
                        selectedCell === quad.cell 
                          ? 'border-[#ff007f] bg-[#ff007f]/10 text-white shadow-md shadow-[#ff007f]/10' 
                          : 'border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">{quad.cell}</span>
                      <span className="text-[7px] opacity-75">{quad.label}</span>
                    </button>
                  ) : (
                    <div key={idx} className="border border-white/5 rounded flex items-center justify-center text-slate-800 text-[10px]">
                      {quad.cell}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Cashier Staged Profile Details */}
            <div className="sm:col-span-6 flex flex-col justify-between text-left">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block">Active Cashier Node:</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-2xl">{ROSTER[selectedAdvocate].avatar}</span>
                  <h3 className="text-lg font-black text-white leading-none">{ROSTER[selectedAdvocate].name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-2.5">
                  {ROSTER[selectedAdvocate].desc}
                </p>
              </div>

              {/* Staged Crop State */}
              <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 uppercase font-bold">Staged Pose:</span>
                <span className="bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] px-2.5 py-1 rounded-md font-bold uppercase">
                  {stagedPose}
                </span>
              </div>
            </div>

          </div>

          {/* Grocery Shelves Inventory Grid */}
          <div className="flex flex-col gap-3 text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Convenience Grocery Shelf Inventory:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map(item => (
                <div key={item.id} className="bg-black/30 border border-white/5 hover:border-white/10 p-3 rounded-2xl flex justify-between items-center transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-[#ff007f] font-bold">{item.cost} SC</span>
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={item.stock <= 0}
                      className="bg-white/5 border border-white/10 hover:border-white/30 p-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10 cursor-pointer disabled:opacity-40"
                    >
                      Buy Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roster Pickers */}
          <div className="flex flex-col gap-2.5 text-left">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Select Active Roster:</span>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(ROSTER).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => switchAdvocate(key)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedAdvocate === key 
                      ? 'bg-[#ff007f]/15 border-[#ff007f] text-white shadow-lg shadow-[#ff007f]/5' 
                      : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider">{value.name}</span>
                  <span className="text-[9px] opacity-80" style={{ color: theme === 'feltboard' ? '#ff007f' : '#00d4ff' }}>{value.role}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: DISCOURSE CHAT STREAM & TOON SOUNDBOARD (5 COLS) */}
        <section className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Smyrna Heights Live Commentary Feed */}
          <div className={`border-4 rounded-3xl p-5 flex flex-col justify-between gap-4 h-[310px] shadow-2xl relative overflow-hidden ${
            theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f] glow-magenta' : 
            theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/50 border-white/10'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff007f]/20 to-transparent"></div>
            
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'feltboard' ? 'rgba(255,0,127,0.2)' : 'rgba(255,255,255,0.1)' }}>
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: theme === 'feltboard' ? '#ff007f' : 'inherit' }}>
                💬 Smyrna heights Chat Feed
              </span>
              <span className="text-[9px] text-yellow-600 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded font-bold font-mono">
                active_stream
              </span>
            </div>

            {/* Chat message list */}
            <div className="flex-grow overflow-y-auto custom-scroll text-left flex flex-col gap-3 max-h-[170px] pr-1">
              {chatList.map((chat) => (
                <div key={chat.id} className="bg-black/20 border border-white/5 p-2.5 rounded-xl animate-fade-in flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${chat.color}`}>{chat.sender}</span>
                    <span className="text-[8px] text-slate-500 font-mono">pose_{chat.pose}</span>
                  </div>
                  <span className="text-[11px] text-slate-200 leading-normal font-sans">{chat.text}</span>
                </div>
              ))}
            </div>

            {/* Custom toast alert inside chat box */}
            {toastMsg && (
              <div className="bg-yellow-400 border-l-4 border-black text-black text-[10px] py-2 px-3 rounded-r-xl font-bold transition-all animate-bounce text-left">
                {toastMsg}
              </div>
            )}
          </div>

          {/* Interactive Toon Soundboard / Jukebox */}
          <div className={`border-4 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl ${
            theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f]' : 
            theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/50 border-white/10'
          }`}>
            <div className="flex items-center gap-2 border-b border-dashed pb-2 text-slate-400" style={{ borderColor: theme === 'feltboard' ? '#ebdcd3' : 'rgba(255,255,255,0.1)' }}>
              <span className="text-xl">🔊</span>
              <span className="text-xs font-bold uppercase tracking-widest">Toon Soundboard Panel</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Toon Audio triggers */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => triggerToonSfx('whistle')} className="bg-black/20 border border-white/10 hover:border-[#ff007f]/40 hover:bg-[#ff007f]/5 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 text-white">
                  <span>🔊</span>
                  <span className="text-[8px]">Slide Whistle</span>
                </button>
                <button onClick={() => triggerToonSfx('boing')} className="bg-black/20 border border-white/10 hover:border-[#ff007f]/40 hover:bg-[#ff007f]/5 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 text-white">
                  <span>🔊</span>
                  <span className="text-[8px]">Spring Boing</span>
                </button>
                <button onClick={() => triggerToonSfx('static')} className="bg-black/20 border border-white/10 hover:border-[#ff007f]/40 hover:bg-[#ff007f]/5 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center gap-1.5 text-white">
                  <span>🔊</span>
                  <span className="text-[8px]">CRT Static</span>
                </button>
              </div>

              {/* Force Heel Turn Action */}
              <button 
                onClick={triggerHeelTurn}
                className="w-full bg-[#ff007f] hover:bg-[#d60069] text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff007f]/20"
              >
                🎭 Trigger Heel-Turn Override
              </button>
            </div>
          </div>

          {/* Ingress Checkout Terminal */}
          <div className={`border-4 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl ${
            theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f]' : 
            theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/50 border-white/10'
          }`}>
            <div className="flex justify-between items-center border-b pb-2 text-slate-400" style={{ borderColor: theme === 'feltboard' ? '#ebdcd3' : 'rgba(255,255,255,0.1)' }}>
              <span className="text-xs font-bold uppercase tracking-widest">🛒 Ingress checkout</span>
              <span className="text-[8px] font-mono bg-black/20 px-2 py-0.5 rounded">Active checkout</span>
            </div>

            {Object.keys(cart).length === 0 ? (
              <div className="text-center py-6 text-[10px] text-slate-500 uppercase tracking-widest">
                No items staged in cashier slot.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 font-mono text-[10px] max-h-[80px] overflow-y-auto pr-1">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = inventory.find(i => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex justify-between items-center text-white">
                        <span>{qty}x {item.name}</span>
                        <div className="flex items-center gap-2">
                          <span>{item.cost * qty} SC</span>
                          <button onClick={() => removeFromCart(id)} className="text-red-500 hover:text-red-400 p-0.5">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/5 pt-2.5 flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase font-bold">Total Staged:</span>
                  <span className="text-[#ff007f] font-black">{cartTotal} SC</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={clearCart} className="w-1/3 border border-white/10 hover:border-white/20 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer">
                    Clear
                  </button>
                  <button 
                    onClick={handleCheckout} 
                    disabled={isProcessingCheckout}
                    className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-[#030305] font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isProcessingCheckout ? "PROCESSING..." : "COMMIT INGRESS"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RTR Theme Config Engine */}
          <div className={`border-4 rounded-3xl p-4 flex justify-between items-center shadow-2xl ${
            theme === 'feltboard' ? 'bg-[#fcf8f2] border-[#ff007f]' : 
            theme === 'industrial' ? 'bg-[#0b0e14] border-slate-700' : 'bg-black/50 border-white/10'
          }`}>
            <span className="text-[9px] uppercase tracking-widest font-bold">Workspace Viewport:</span>
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              {[
                { id: 'feltboard', name: '90s Toon' },
                { id: 'industrial', name: 'Slate' },
                { id: 'monolith', name: 'Monolith' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id as any)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                    theme === opt.id ? 'bg-[#ff007f] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* BOTTOM FOOTER SYSTEM METRICS */}
      <footer className="max-w-7xl w-full mx-auto border-t border-white/5 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] text-[#94a3b8] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={12} className="text-amber-500 animate-pulse" />
          <span>Smyrna Heights 1990s Toon Convenience Alliance</span>
        </div>
        <div>
          <span>Sovereign OS • Reclaim Absolute Sovereignty</span>
        </div>
      </footer>

    </div>
  );
}