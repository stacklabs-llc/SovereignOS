import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Store, 
  Wrench, 
  Stethoscope, 
  Leaf, 
  Sword, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  ArrowRight, 
  Users, 
  Sparkles,
  CheckCircle2,
  Tv
} from 'lucide-react';

interface Post {
  id: string;
  stack: 'convenience' | 'hardware' | 'vet' | 'vape' | 'catnip' | 'pilot';
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  replies?: number;
}

const SMYRNA_CRAWL_ITEMS = [
  "📡 YARDBARKER NEWS: Spencer Strider's structural rehab program achieves 100% precision velocity at AetherVet diagnostics bay",
  "☀️ SMYRNA WEATHER: 78°F · Humidity 62% · Winds calm · Perfect greenhouse & Living Soil resonance",
  "🚨 LOCAL TRAFFIC: Cobb Parkway cardboard barricades reported as 'peaceful nap piles' by Smyrna PD",
  "⚾ BRAVES NEWS: Austin Riley purchases vector-grade twine from Anvil Hardware for bat-grip reinforcement",
  "🏪 CONVENIENCE WATCH: Gonzo's Extreme Surge sales spike; locals reporting minor dental vibration anomalies",
  "🌿 WEEDSTACK GREENHOUSE: Living-soil thermal levels achieved perfect compliance matrix at 10:15 AM",
  "🌲 CARD-BOARD TIMES: Hobbes announces cardboard treehouse syndicate expansions near Smyrna community park"
];

const STACK_INFO = {
  convenience: {
    name: "Gonzo's Convenience",
    icon: <Store className="w-4 h-4" />,
    color: "#f43f5e", // Rose
    bgColor: "rgba(244, 63, 94, 0.15)",
    borderColor: "rgba(244, 63, 94, 0.3)",
    badge: "🏪 Convenience Store"
  },
  hardware: {
    name: "Anvil Twine Hardware",
    icon: <Wrench className="w-4 h-4" />,
    color: "#fbbf24", // Amber
    bgColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "rgba(251, 191, 36, 0.3)",
    badge: "🛠️ Hardware Store"
  },
  vet: {
    name: "AetherVet Diagnostics",
    icon: <Stethoscope className="w-4 h-4" />,
    color: "#a78bfa", // Purple
    bgColor: "rgba(167, 139, 250, 0.15)",
    borderColor: "rgba(167, 139, 250, 0.3)",
    badge: "🩺 Veterinary Clinic"
  },
  vape: {
    name: "WeedStack Vape Shop",
    icon: <Leaf className="w-4 h-4" />,
    color: "#10b981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    badge: "🌿 Vape Apothecary"
  },
  catnip: {
    name: "Catnip Wars Treehouse",
    icon: <Sword className="w-4 h-4" />,
    color: "#06b6d4", // Cyan
    bgColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.3)",
    badge: "🌲 Cardboard Syndicate"
  },
  pilot: {
    name: "Sovereign Pilot Cockpit",
    icon: <Sparkles className="w-4 h-4" />,
    color: "#38bdf8", // Sky
    bgColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    badge: "🚀 Pilot Console"
  }
};

const INITIAL_PUBLIC_POSTS: Post[] = [
  {
    id: 'p1',
    stack: 'convenience',
    author: 'Gonzo (Manager)',
    avatar: '🏪',
    text: "🚨 EMERGENCY COCKPIT SALE: Peggy just found a dusty crate of 1999 Extreme Energy Surge behind the ice machine. $0.99 a can! Drink at your own risk.",
    timestamp: "10:00 AM",
    likes: 12,
    replies: 2
  },
  {
    id: 'p2',
    stack: 'convenience',
    author: 'Stevie (Regular)',
    avatar: '😎',
    text: "Peggy that Surge drink is literally solid green sludge. I drank one half hour ago and now my back teeth are vibrating. I think I need professional medical help.",
    timestamp: "10:01 AM",
    likes: 8,
    replies: 1
  },
  {
    id: 'p3',
    stack: 'vet',
    author: 'Dr. Rox (Chief Vet)',
    avatar: '🩺',
    text: "Stevie, please report to the AetherVet diagnostic bay immediately. Sludge-induced dental frequency fluctuations are highly abnormal. Mapped advocate 'Precision Advocate James' is preparing a stabilization vial.",
    timestamp: "10:03 AM",
    likes: 15,
    replies: 3
  },
  {
    id: 'p4',
    stack: 'hardware',
    author: 'TwineMaster',
    avatar: '🛠️',
    text: "We just bought 15 cans of Gonzo's 1999 Surge sludge. It works as an incredible heavy-duty lubricant for the high-strength twine spooling vectors! Twine sales are up 400% today!",
    timestamp: "10:05 AM",
    likes: 24,
    replies: 0
  },
  {
    id: 'p5',
    stack: 'vape',
    author: 'Larry (Vape Apothecary)',
    avatar: '🌿',
    text: "If your teeth are vibrating, Stevie, drop the convenience store sludge and hit the WeedStack counter. We just compiled a batch of organic living soil linalool terpenes. Lavender-scented zen.",
    timestamp: "10:07 AM",
    likes: 19,
    replies: 1
  },
  {
    id: 'p6',
    stack: 'catnip',
    author: 'Hobbes (Syndicate Leader)',
    avatar: '🐱',
    text: "THE TREEHOUSE CATS HAVE SEIZED THE HARDWARE STORE TWINE! We are wrapping the Vape Shop in cardboard layers to establish a catnip trade embargo! Blockade is fully active!",
    timestamp: "10:10 AM",
    likes: 31,
    replies: 4
  }
];

const BRAND_ANNOUNCEMENTS = {
  convenience: [
    { id: 'c1', author: 'Peggy (Shift Leader)', text: "Washed the hot dog rollers with vintage detergent. The skin on the dogs is now perfectly crispy! Come get a classic roller dog.", likes: 4 },
    { id: 'c2', author: 'Gonzo', text: "Lost keys to the back dumpster. If you see a raccoon wearing a lanyard, please notify shift command.", likes: 9 }
  ],
  hardware: [
    { id: 'h1', author: 'Anvil Tech', text: "Now stocking high-load cyberpunk vector boards. Tested up to 110V of raw narrative current.", likes: 14 },
    { id: 'h2', author: 'TwineMaster', text: "Seeding active: Anvil Twine batch #2026 fully verified by SDLC compliance matrix.", likes: 11 }
  ],
  vet: [
    { id: 'v1', author: 'VetTech Brenda', text: "Successfully extracted 4 yards of copper wiring from Hobbes' structural blockade cat. Cat is fully functional and purring.", likes: 20 },
    { id: 'v2', author: 'Dr. Rox', text: "Standardized animal diagnostic procedures have been updated. All systems nominal.", likes: 8 }
  ],
  vape: [
    { id: 'vp1', author: 'Terpene Bob', text: "Vape stack batch #AETHER-420 contains high concentrations of alpha-pinene. Great for coding and sandbox testing.", likes: 16 },
    { id: 'vp2', author: 'Sam (Budtender)', text: "Our greenhouse humidity is locked at exactly 62%. Living soil compost levels have achieved perfect thermal resonance.", likes: 22 }
  ],
  catnip: [
    { id: 'ct1', author: 'Cardboard Kid', text: "Reinforced treehouse base using 15 structural pizza boxes and heavy Anvil twine. Defense rating +45%!", likes: 28 },
    { id: 'ct2', author: 'Hobbes', text: "Catnip Wars roll call: All cardboard syndicate cats report to the main branch for kibble rations.", likes: 35 }
  ]
};

const SIMULATION_TICKS = [
  {
    stack: 'convenience',
    author: 'Peggy (Shift Leader)',
    avatar: '🏪',
    text: "Hobbes, get your cardboard cats out of our parking lot. They're blockading the delivery truck. I'm going to start spraying them with the soda fountain carbonated water.",
    brandPost: { tab: 'convenience', text: "delivery truck delayed due to Cardboard blockade. Extreme Surge sales currently suspended." }
  },
  {
    stack: 'catnip',
    author: 'Hobbes (Syndicate Leader)',
    avatar: '🐱',
    text: "CARBONATED EMBARGO DETECTED! We have constructed a pizza-box shield wall! TwineMaster, we need a cargo drop of heavy metal brackets to secure our perimeter!",
    brandPost: { tab: 'catnip', text: "Embargo shield wall completed. Pizza boxes are holding up surprisingly well against Diet Cola spray." }
  },
  {
    stack: 'hardware',
    author: 'Anvil Tech',
    avatar: '🛠️',
    text: "Perimeter brackets shipped! Traded for 3 boxes of Gonzo's roller dogs (Peggy's detergent wash formula). Our metal forging gears have never smelled more like soap and pork.",
    brandPost: { tab: 'hardware', text: "Forging systems operating at 98% efficiency utilizing soap-pork grease lubrication." }
  },
  {
    stack: 'vape',
    author: 'Sam (Budtender)',
    avatar: '🌿',
    text: "The blockading cats are getting incredibly relaxed because our outdoor exhaust fan is leaking terpene mist. The blockade has turned into a giant, peaceful cardboard nap pile.",
    brandPost: { tab: 'vape', text: "Aerosolized calm terpenes deployed to front porch area. Blockade combatants currently asleep in pizza box forts." }
  },
  {
    stack: 'vet',
    author: 'Chief Advocate',
    avatar: '🩺',
    text: "Nap pile confirmed via telepresence thermal scanner. Dr. Rox advises that a group cat nap is the highest form of veterinary compliance. Mapped advocate advocates for peaceful co-existence.",
    brandPost: { tab: 'vet', text: "Thermal diagnostic scan indicates zero heart rate anomalies in the blockade nap zone. Perfect health." }
  },
  {
    stack: 'convenience',
    author: 'Stevie (Regular)',
    avatar: '😎',
    text: "Woke up in the cardboard nap zone. My teeth stopped vibrating and now I feel incredibly zen. Did someone put WeedStack terpenes in Gonzo's convenience slushies?",
    brandPost: { tab: 'convenience', text: "Customer satisfaction has spiked unexpectedly. Sludge complaints are down to zero." }
  },
  {
    stack: 'catnip',
    author: 'Hobbes (Syndicate Leader)',
    avatar: '🐱',
    text: "The blockade is hereby declared a grand success. We have successfully traded cardboard sovereignty for unlimited nap mist and soap-scented hot dogs. Long live the cardboard town!",
    brandPost: { tab: 'catnip', text: "Peace treaty signed. Cardboard treehouse remains blockaded but open for business." }
  }
];

export default function TownSimulation() {
  const [activeStacks, setActiveStacks] = useState({
    convenience: true,
    hardware: true,
    vet: true,
    vape: true,
    catnip: true
  });

  const [isRunning, setIsRunning] = useState(false);
  const [publicPosts, setPublicPosts] = useState<Post[]>(INITIAL_PUBLIC_POSTS);
  const [brandPosts, setBrandPosts] = useState(BRAND_ANNOUNCEMENTS);
  const [selectedTab, setSelectedTab] = useState<'convenience' | 'hardware' | 'vet' | 'vape' | 'catnip'>('convenience');
  const [pilotInput, setPilotInput] = useState('');
  const [tickPointer, setTickPointer] = useState(0);
  const [simulationTime, setSimulationTime] = useState("10:12 AM");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicPosts]);

  // Handle auto-tick loop
  useEffect(() => {
    let intervalId: any;
    if (isRunning) {
      intervalId = setInterval(() => {
        triggerNextTick();
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, tickPointer, activeStacks]);

  const toggleStack = (key: keyof typeof activeStacks) => {
    setActiveStacks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const triggerNextTick = () => {
    if (tickPointer >= SIMULATION_TICKS.length) {
      // Loop or pause
      setIsRunning(false);
      return;
    }

    const currentTick = SIMULATION_TICKS[tickPointer];
    
    // Check if stack is active in simulator
    if (!activeStacks[currentTick.stack as keyof typeof activeStacks]) {
      // Skip inactive stack
      setTickPointer(prev => prev + 1);
      return;
    }

    // Progress time
    const [hours, minutesAndAmpm] = simulationTime.split(':');
    const [minutes, ampm] = minutesAndAmpm.split(' ');
    let nextMinutes = parseInt(minutes, 10) + 2;
    let nextHours = parseInt(hours, 10);
    if (nextMinutes >= 60) {
      nextMinutes -= 60;
      nextHours = (nextHours % 12) + 1;
    }
    const nextTime = `${nextHours}:${nextMinutes.toString().padStart(2, '0')} ${ampm}`;
    setSimulationTime(nextTime);

    // Append to public chat feed
    const newPost: Post = {
      id: `tick_${tickPointer}`,
      stack: currentTick.stack as any,
      author: currentTick.author,
      avatar: currentTick.avatar,
      text: currentTick.text,
      timestamp: nextTime,
      likes: Math.floor(Math.random() * 20) + 5,
      replies: Math.floor(Math.random() * 3)
    };

    setPublicPosts(prev => [...prev, newPost]);

    // Append to brand channel if available
    if (currentTick.brandPost) {
      const tab = currentTick.brandPost.tab as keyof typeof brandPosts;
      const newBrandPost = {
        id: `brand_${Date.now()}`,
        author: currentTick.author,
        text: currentTick.brandPost.text,
        likes: Math.floor(Math.random() * 10) + 2
      };
      setBrandPosts(prev => ({
        ...prev,
        [tab]: [newBrandPost, ...prev[tab]]
      }));
    }

    setTickPointer(prev => prev + 1);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPublicPosts(INITIAL_PUBLIC_POSTS);
    setBrandPosts(BRAND_ANNOUNCEMENTS);
    setTickPointer(0);
    setSimulationTime("10:12 AM");
  };

  const handleSendPilotPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotInput.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add Pilot's post to the public town hall feed
    const pilotPost: Post = {
      id: `pilot_${Date.now()}`,
      stack: 'pilot',
      author: 'Sovereign Pilot (Owner)',
      avatar: '🚀',
      text: pilotInput,
      timestamp: timeString,
      likes: 1
    };

    setPublicPosts(prev => [...prev, pilotPost]);
    const input = pilotInput;
    setPilotInput('');

    // Trigger reactive heuristic reply after 1.5 seconds
    setTimeout(() => {
      triggerReactiveReply(input);
    }, 1500);
  };

  const triggerReactiveReply = (input: string) => {
    const text = input.toLowerCase();
    let replyText = "";
    let replyAuthor = "";
    let replyAvatar = "";
    let replyStack: 'convenience' | 'hardware' | 'vet' | 'vape' | 'catnip' = 'convenience';

    if (text.includes('convenience') || text.includes('surge') || text.includes('gonzo') || text.includes('peggy') || text.includes('sludge')) {
      replyAuthor = "Gonzo (Manager)";
      replyAvatar = "🏪";
      replyStack = "convenience";
      replyText = "Pilot, my convenience scanner confirms that the 1999 Surge sludge is currently operating within FDA hazard guidelines (barely). Peggy has sanitizing detergent on standby!";
    } else if (text.includes('hardware') || text.includes('twine') || text.includes('anvil') || text.includes('wire')) {
      replyAuthor = "TwineMaster";
      replyAvatar = "🛠️";
      replyStack = "hardware";
      replyText = "Anvil vector boards verified! High-strength steel-core twine shipments are currently on route to secure the Pilot's visual console.";
    } else if (text.includes('vet') || text.includes('doctor') || text.includes('rox') || text.includes('cat') || text.includes('animal')) {
      replyAuthor = "Dr. Rox (Chief Vet)";
      replyAvatar = "🩺";
      replyStack = "vet";
      replyText = "AetherVet advocate diagnostic grids are green! All local cats, blockaders, and hardware squirrels are currently certified 100% compliant.";
    } else if (text.includes('vape') || text.includes('weed') || text.includes('terpene') || text.includes('soil')) {
      replyAuthor = "Larry (Vape Apothecary)";
      replyAvatar = "🌿";
      replyStack = "vape";
      replyText = "Living soil compost matrices are humming, Pilot. We have successfully channeled standard greenhouse humidity vectors directly into the simulation!";
    } else if (text.includes('catnip') || text.includes('wars') || text.includes('cardboard') || text.includes('hobbes') || text.includes('treehouse')) {
      replyAuthor = "Hobbes (Syndicate Leader)";
      replyAvatar = "🐱";
      replyStack = "catnip";
      replyText = "The Treehouse Syndicate salutes you, Pilot! We have designated a portion of our cardboard barricade to display your hologram projections.";
    } else {
      // General fallbacks based on active tabs
      const candidates: Array<{author: string, avatar: string, stack: any, text: string}> = [
        {
          author: "Stevie (Regular)",
          avatar: "😎",
          stack: "convenience",
          text: "Honestly, Pilot, as long as the WeedStack nap mist continues to blow across the hardware store twine, this town is absolutely perfect."
        },
        {
          author: "Hobbes (Syndicate Leader)",
          avatar: "🐱",
          stack: "catnip",
          text: "Can someone ask Peggy to drop off three more detergent-washed roller dogs at the treehouse? Combat makes us extremely hungry."
        },
        {
          author: "Dr. Rox (Chief Vet)",
          avatar: "🩺",
          stack: "vet",
          text: "Monitoring active cockpit feedback. Sludge levels remain elevated but our AetherVet precision scanners indicate stable structural parameters."
        }
      ];

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      replyAuthor = chosen.author;
      replyAvatar = chosen.avatar;
      replyStack = chosen.stack;
      replyText = chosen.text;
    }

    const reactivePost: Post = {
      id: `reply_${Date.now()}`,
      stack: replyStack,
      author: replyAuthor,
      avatar: replyAvatar,
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 4
    };

    setPublicPosts(prev => [...prev, reactivePost]);
  };

  return (
    <div className="bg-[#0b0f19] text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-[#38bdf8]/20 flex flex-col h-[85vh] font-['Inter']">
      
      {/* Top Banner Dashboard Controls */}
      <div className="bg-black/60 border-b border-[#38bdf8]/20 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Building2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm tracking-wider uppercase text-white">Multi-Stack Town Simulation</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[10px] font-mono text-[#f59e0b] uppercase tracking-widest mt-0.5">
              Cross-Stack Emergence Matrix Online · Tick: {tickPointer}/{SIMULATION_TICKS.length} · Time: {simulationTime}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerNextTick}
            disabled={tickPointer >= SIMULATION_TICKS.length}
            className="flex items-center gap-1 bg-[#f59e0b] hover:bg-[#d97706] disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg transition-colors"
            title="Progress simulation by one step"
          >
            <Play className="w-3 h-3 fill-black" /> Run Next Tick
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1 border font-bold font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg transition-colors ${
              isRunning 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3 fill-current" /> Auto-Cycle Active
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" /> Auto-Cycle Loop
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2 border border-white/10 hover:border-white/30 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Stack Selection Filters */}
      <div className="bg-black/30 border-b border-white/5 px-4 py-2 flex flex-wrap gap-2 items-center justify-center md:justify-start">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mr-2">Active Stacks:</span>
        {Object.entries(STACK_INFO).map(([key, info]) => {
          if (key === 'pilot') return null;
          const isActive = activeStacks[key as keyof typeof activeStacks];
          return (
            <button
              key={key}
              onClick={() => toggleStack(key as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-500 bg-slate-900/40 border-slate-800/40'
              }`}
              style={{
                backgroundColor: isActive ? info.bgColor : undefined,
                borderColor: isActive ? info.borderColor : undefined,
                color: isActive ? info.color : undefined
              }}
            >
              {info.icon}
              {info.name.split(' ')[0]}
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current animate-pulse' : 'bg-slate-600'}`}></span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: The Public Sphere - Town Hall */}
        <div className="flex-1 border-r border-white/10 flex flex-col bg-black/10 overflow-hidden">
          
          <div className="bg-black/40 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>🏛️</span> Town Hall (Public Forum)
            </h3>
            <span className="bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">
              Live Emergence Feed
            </span>
          </div>

          {/* Scrolling Chat Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {publicPosts.map((post) => {
              const info = STACK_INFO[post.stack];
              const isPilot = post.stack === 'pilot';
              
              return (
                <div 
                  key={post.id} 
                  className={`flex gap-3 max-w-[90%] animate-in slide-in-from-bottom duration-300 ${
                    isPilot ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar Bubble */}
                  <div 
                    className="w-10 h-10 rounded-full border bg-black/50 flex items-center justify-center shrink-0 text-lg shadow-md"
                    style={{ borderColor: info.borderColor }}
                  >
                    {post.avatar}
                  </div>

                  {/* Message Bubble Card */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${isPilot ? 'justify-end' : ''}`}>
                      <span className="font-bold text-white">{post.author}</span>
                      <span 
                        className="px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-bold"
                        style={{ backgroundColor: info.bgColor, color: info.color }}
                      >
                        {info.name.split(' ')[0]}
                      </span>
                      <span className="text-slate-500">{post.timestamp}</span>
                    </div>

                    <div 
                      className="p-3 rounded-2xl text-[13px] leading-relaxed shadow-lg border relative overflow-hidden backdrop-blur-md"
                      style={{
                        backgroundColor: isPilot ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isPilot ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        borderTopLeftRadius: isPilot ? '16px' : '0px',
                        borderTopRightRadius: isPilot ? '0px' : '16px'
                      }}
                    >
                      {/* Subdued stack accent bar */}
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: info.color }}></div>
                      
                      <p className="text-slate-200 pl-2">{post.text}</p>
                    </div>

                    <div className={`flex items-center gap-3 text-[10px] text-slate-500 font-mono ${isPilot ? 'justify-end' : ''}`}>
                      <button className="hover:text-rose-400 transition-colors flex items-center gap-0.5">
                        ❤️ {post.likes}
                      </button>
                      {post.replies !== undefined && (
                        <span className="flex items-center gap-0.5">
                          💬 {post.replies} replies
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Chat Input Area */}
          <form onSubmit={handleSendPilotPost} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={pilotInput}
              onChange={e => setPilotInput(e.target.value)}
              placeholder="Inject a prompt or speak as the Pilot (e.g. 'How is AetherVet doing today?')..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20"
            />
            <button
              type="submit"
              className="bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold rounded-xl px-4 flex items-center justify-center transition-colors shadow-md"
            >
              <Send className="w-4 h-4 fill-black" />
            </button>
          </form>

        </div>

        {/* RIGHT COLUMN: Brand Channels / Private Pages */}
        <div className="w-full md:w-96 flex flex-col bg-black/20 overflow-hidden">
          
          <div className="bg-black/40 border-b border-white/5 px-4 py-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>📡</span> Brand Specific Pages
            </h3>
          </div>

          {/* Tab Selection Row */}
          <div className="flex border-b border-white/5 overflow-x-auto shrink-0 bg-black/10">
            {Object.entries(STACK_INFO).map(([key, info]) => {
              if (key === 'pilot') return null;
              const isActive = selectedTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTab(key as any)}
                  className={`flex-1 min-w-[70px] text-center py-2.5 text-[10px] font-mono uppercase tracking-wider transition-all border-b-2 shrink-0 ${
                    isActive 
                      ? 'border-[#f59e0b] text-[#f59e0b] bg-white/5 font-bold' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/2'
                  }`}
                >
                  <span className="block text-sm mb-0.5">{key === 'convenience' ? '🏪' : key === 'hardware' ? '🛠️' : key === 'vet' ? '🩺' : key === 'vape' ? '🌿' : '🌲'}</span>
                  {key.substring(0, 5)}
                </button>
              );
            })}
          </div>

          {/* Channel Annoucements Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Header info for selected brand */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ backgroundColor: STACK_INFO[selectedTab].color }}
              ></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{STACK_INFO[selectedTab].name}</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-full uppercase">
                  Online
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {STACK_INFO[selectedTab].badge} · Static Channel Feed
              </p>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {brandPosts[selectedTab].map((post: any) => (
                <div 
                  key={post.id}
                  className="bg-black/30 border border-white/5 rounded-xl p-3 hover:border-white/15 transition-all animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between mb-1.5 text-[9px] font-mono">
                    <span className="font-bold text-[#f59e0b]">{post.author}</span>
                    <span className="text-slate-600">Announcement</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-slate-300">
                    {post.text}
                  </p>
                  <div className="mt-2 text-[9px] text-slate-500 font-mono flex items-center gap-2">
                    <span>❤️ {post.likes}</span>
                    <span>•</span>
                    <span className="text-emerald-500/80">✔ Verified</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Smyrna Chronicle / Yardbarker live crawl news ticker */}
      <div className="bg-black border-t border-[#38bdf8]/20 py-2 overflow-hidden relative w-full flex items-center shrink-0">
        {/* Ticker label */}
        <div className="bg-[#f59e0b] text-black font-mono font-bold text-[9px] uppercase tracking-widest px-3 py-1 ml-4 rounded shrink-0 z-10 shadow-md">
          📡 Smyrna Crawl
        </div>
        
        {/* Scrolling text marquee */}
        <div className="flex whitespace-nowrap overflow-hidden relative w-full items-center">
          <div className="animate-marquee flex items-center gap-12 text-[10px] font-mono text-slate-300 uppercase tracking-wider">
            {SMYRNA_CRAWL_ITEMS.map((item, idx) => (
              <span key={`crawl-1-${idx}`} className="flex items-center gap-2">
                <span className="text-[#f59e0b]">✦</span> {item}
              </span>
            ))}
            {/* Duplicated for infinite loop */}
            {SMYRNA_CRAWL_ITEMS.map((item, idx) => (
              <span key={`crawl-2-${idx}`} className="flex items-center gap-2">
                <span className="text-[#f59e0b]">✦</span> {item}
              </span>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 35s linear infinite;
          }
        `}</style>
      </div>

    </div>
  );
}
