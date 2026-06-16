import { useState, useEffect, useRef } from 'react';
import { SkipForward, SkipBack, Play, Pause, Mic, Square } from 'lucide-react';

interface BarbStackProps {
  user: {
    user_name: string;
    display_name?: string;
    introduction?: string;
    avatar_url?: string;
    favorite_team?: string;
    u_nap_mist_balance?: number;
    os_theme?: string;
  };
}

interface Advocate {
  key: string;
  name: string;
  role: string;
  handle: string;
  companion: string;
  emoji: string;
  color: string;
  bio: string;
  protocol: string;
}

const ADVOCATE_EXPRESSIONS: Record<string, string[]> = {
  decision_derby: [
    'front_neutral', 'front_talking', 'front_surprised',
    'left_neutral', 'left_talking', 'left_surprised',
    'right_neutral', 'right_talking', 'right_surprised'
  ],
  barb: [
    'avatar', 'barb_avatar', 'barb_pointing', 'barb_shrug', 'pointing', 'shrug'
  ],
  barb_founder: [
    'barb_founder_avatar', 'barb_founder_pointing', 'barb_founder_shrug'
  ],
  doc_wheeler: [
    'doc_wheeler_avatar', 'doc_wheeler_pointing', 'doc_wheeler_shrug'
  ],
  jack_carpenter: [
    'jack_carpenter_avatar', 'jack_carpenter_pointing', 'jack_carpenter_shrug'
  ],
  jukebox_jesse: [
    'jukebox_jesse_avatar', 'jukebox_jesse_pointing', 'jukebox_jesse_shrug'
  ],
  señora_caos: [
    'señora_caos_avatar', 'señora_caos_pointing', 'señora_caos_shrug'
  ],
  buster_brawler: [
    'buster_brawler_avatar', 'buster_brawler_pointing', 'buster_brawler_shrug'
  ]
};

export default function BarbStack({ user }: BarbStackProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'holodex'>('dashboard');
  const [selectedAdvKey, setSelectedAdvKey] = useState<string>('barb');
  const [chatInput, setChatInput] = useState<string>('');
  const [utilities, setUtilities] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [napMistBalance, setNapMistBalance] = useState<number>(user.u_nap_mist_balance ?? 10);
  const [currentTheme, setCurrentTheme] = useState<string>(user.os_theme || 'sovereign-home');
  const [blastAdvocate, setBlastAdvocate] = useState<string>('decision_derby');
  const [blastExpression, setBlastExpression] = useState<string>('front_neutral');

  // Input fields for art auction listing
  const [newArtTitle, setNewArtTitle] = useState<string>('');
  const [newArtPrice, setNewArtPrice] = useState<number>(100);

  // Audio state
  const [jukeboxPlaying, setJukeboxPlaying] = useState<boolean>(true);
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number>(0);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([15, 40, 65, 20, 55, 70, 35]);

  // Excursion & Resources state
  const [routeProgress, setRouteProgress] = useState<number>(0);
  const [oakwoodCount, setOakwoodCount] = useState<number>(14);
  const [catnipCount, setCatnipCount] = useState<number>(32);
  const [coinsCount, setCoinsCount] = useState<number>(8);

  // Crafting state
  const [craftOakwood, setCraftOakwood] = useState<number>(0);
  const [craftSeeds, setCraftSeeds] = useState<number>(0);
  const [craftingStatus, setCraftingStatus] = useState<{ emoji: string; title: string; subtitle: string } | null>(null);

  // Spite & Overdrive state
  const [boggsLevel, setBoggsLevel] = useState<number>(0);
  const [spiteFlareActive, setSpiteFlareActive] = useState<boolean>(false);
  const [spiteFlareText, setSpiteFlareText] = useState<string>('');

  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Vengeance voice recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recorderStatus, setRecorderStatus] = useState<'idle' | 'recording' | 'sending' | 'success' | 'error'>('idle');
  const [dbMutationResult, setDbMutationResult] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10, 10]);

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setWaveHeights(Array.from({ length: 9 }, () => Math.floor(Math.random() * 85) + 15));
      }, 120);
    } else {
      setWaveHeights([10, 10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecorderStatus('sending');
        
        // Stop all tracks on the stream to release the mic
        stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append('audio', audioBlob, 'vengeance_log.wav');
        
        try {
          const res = await fetch('/api/vengeance/process', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.status === 'success') {
            setRecorderStatus('success');
            setDbMutationResult(`Mutation Applied! ${data.rows_updated} Spite Slice menu items updated.`);
            // Refresh chatter/chatter room
            fetchChatMessages();
            setTimeout(() => {
              setRecorderStatus('idle');
              setDbMutationResult(null);
            }, 6000);
          } else {
            setRecorderStatus('error');
          }
        } catch (err) {
          setRecorderStatus('error');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecorderStatus('recording');
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecorderStatus('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };


  const playlist = [
    "SMYRNA MIDNIGHT RAIN",
    "FORTUNATE PAWS (CCR REMIX)",
    "BAD MOON RISING (JUKEBOX VER)",
    "RUSTY CANVAS OVERDRIVE"
  ];

  // Helper cookie reader
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = getCookie('sovereign_session_token') || localStorage.getItem('sovereign_session_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  // Smyrna AI Advocates registry addition
  const advocates: Advocate[] = [
    {
      key: 'barb',
      name: user.display_name || 'Barb Baker',
      role: 'FOUNDER',
      handle: `@${user.user_name || 'barb'}`,
      companion: 'Rusty 🐶',
      emoji: '👩‍🎨',
      color: 'orange',
      bio: user.introduction || 'The badass founder who runs Wild Paws & Rusty Canvas Art Rescue.',
      protocol: 'Moscato Protocol: YES • Overdrive Override: YES'
    },
    {
      key: 'barb_the_founder',
      name: 'Barb the Founder',
      role: 'FOUNDER AI',
      handle: '@barb_the_founder',
      companion: 'Sweet Moscato 🐶',
      emoji: '🍷',
      color: 'teal',
      bio: 'Smyrna Heights AI advocate. Splits time between painting rustic canvases and kicking out troublemakers.',
      protocol: 'Moscato Protocol: HIGH • Active Alliance'
    },

    {
      key: 'jack',
      name: 'Jack the Carpenter',
      role: 'BUILDER',
      handle: '@jack_carpenter',
      companion: 'Barnaby 🐶',
      emoji: '🔨',
      color: 'amber',
      bio: 'Lead Builder & Frame Designer. Barnaby curls up under the workbench, unbothered by saw noises.',
      protocol: 'Moscato Protocol: NO • Frame Craft Bonus: +2'
    },
    {
      key: 'doc',
      name: 'Doc Wheeler',
      role: 'VET TRIAGE',
      handle: '@doc_wheeler',
      companion: 'Patch 🐶',
      emoji: '🩺',
      color: 'teal',
      bio: 'Sanctuary triage vet. Companion Patch is a three-legged beagle who shows stray rescues that healing comes with endless snacks.',
      protocol: 'Moscato Protocol: YES • Pheromone Sourcing: ACTIVE'
    },
    {
      key: 'jesse',
      name: 'Jukebox Jesse',
      role: 'ENGINEER',
      handle: '@jukebox_jesse',
      companion: 'Chopper 🐶',
      emoji: '📻',
      color: 'purple',
      bio: 'Jukebox Custodian & Systems Mechanical. Directs CCR sound propagation. Chopper rides on shoulders.',
      protocol: 'Audio Invariant Link: YES • Jukebox Repair: +5'
    }
  ];

  const selectedAdv = advocates.find(a => a.key === selectedAdvKey) || advocates[0];

  // Fetch utilities, room chatter, and auctions
  const fetchUtilities = () => {
    fetch('/api/public/stack_utilities/wild_paws')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUtilities(data.utilities);
        }
      })
      .catch(err => console.error("Error fetching stack utilities:", err));
  };

  const fetchChatMessages = () => {
    fetch('/api/public/room_chatter/smyrna_heights')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // If no messages in db yet, show hardcoded defaults to keep room feeling alive
          if (data.messages.length === 0) {
            setChatMessages([
              { sender: '@doc_wheeler', emoji: '🩺', message: 'Just secured three boxes of calming pheromones from Science Officer Gwen via AetherVet! Bypassed the corporate database check cleanly. Standard barter ratio applied: 1 custom framed canvas delivered.', created_on: '17:10' },
              { sender: '@jukebox_jesse', emoji: '📻', message: "Just loaded Smyrna Midnight Rain into the local playlist slots on the outpost. Chopper is howling along already. Let's make sure James hears this when he hits his workstation!", created_on: '17:15' },
              { sender: `@${user.user_name || 'barb'}`, emoji: '👩‍🎨', message: 'Thanks, crew. @jack_carpenter is framing the custom canvases now with Georgia Oakwood shavings we gathered on the route today. This keeps us 100% independent. James, you watching?', created_on: '17:22' }
            ]);
          } else {
            // Map db messages to display format
            setChatMessages(data.messages.map((m: any) => ({
              sender: m.sender,
              emoji: m.sender === 'system' ? '⚙️' : (advocates.find(a => a.handle === m.sender)?.emoji || '💬'),
              message: m.message,
              created_on: m.created_on ? m.created_on.substring(11, 16) : ''
            })));
          }
        }
      })
      .catch(err => console.error("Error fetching room chatter:", err));
  };

  const fetchAuctions = () => {
    fetch('/api/public/art_auction')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setAuctions(data.auctions);
        }
      })
      .catch(err => console.error("Error fetching art auctions:", err));
  };

  // Initial mount & Polling loops
  useEffect(() => {
    fetchUtilities();
    fetchChatMessages();
    fetchAuctions();

    const interval = setInterval(() => {
      fetchChatMessages();
      fetchAuctions();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Jukebox visualizer animation loop
  useEffect(() => {
    if (!jukeboxPlaying) return;
    const interval = setInterval(() => {
      setVisualizerHeights(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
    }, 150);
    return () => clearInterval(interval);
  }, [jukeboxPlaying]);

  // Handle chat submission
  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const body = {
      room_id: 'smyrna_heights',
      sender: `@${user.user_name}`,
      message: chatInput
    };

    fetch('/api/public/room_chatter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setChatInput('');
          fetchChatMessages();
        }
      })
      .catch(err => console.error("Error sending message:", err));
  };

  // Handle art auction creation
  const handleCreateAuction = () => {
    if (!newArtTitle.trim()) {
      alert("Please enter a title for the art piece!");
      return;
    }

    const body = {
      room_id: 'smyrna_heights',
      title: newArtTitle,
      price: newArtPrice,
      has_frame: 0
    };

    fetch('/api/public/art_auction/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setNewArtTitle('');
          fetchAuctions();
          fetchChatMessages(); // Fetch to show Greta's intercept immediately
          setActiveTab('dashboard'); // Switch to see chat feed update
        }
      })
      .catch(err => console.error("Error creating art auction:", err));
  };

  // Handle programmatical wood-framing
  const handleApplyFrame = (sysId: string) => {
    fetch(`/api/public/art_auction/frame/${sysId}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          fetchAuctions();
          alert("🎨 Success: Applied weathered wood frame to canvas programmatically using jack_frames.py! has_frame is now set to 1.");
        }
      })
      .catch(err => console.error("Error applying frame:", err));
  };

  // Handle Use Nap Mist
  const handleUseNapMist = () => {
    if (napMistBalance <= 0) {
      alert("No Nap Mists remaining in your shelter inventory!");
      return;
    }

    fetch('/api/public/use_nap_mist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.user_name })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setNapMistBalance(data.balance);
          fetchChatMessages();
          alert("🌿 Activated calming Nap Mist! Muted Greta's audit warnings successfully.");
        } else {
          alert(data.message || "Failed to activate Nap Mist.");
        }
      })
      .catch(err => console.error("Error using nap mist:", err));
  };

  // Handle Theme Change
  const handleThemeChange = (newTheme: string) => {
    fetch('/api/user_preferences', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: 'os_theme', value: newTheme })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCurrentTheme(newTheme);
          // Broadcast theme change event so portal matches
          const evt = new CustomEvent('theme_changed', { detail: newTheme });
          window.dispatchEvent(evt);
        }
      })
      .catch(err => console.error("Error updating theme:", err));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Sentinel Map Progress Calculations
  const updateRouteProgress = (val: number) => {
    setRouteProgress(val);
    setOakwoodCount(14 + Math.floor(val / 10));
    setCatnipCount(32 + Math.floor(val / 6));
    setCoinsCount(8 + Math.floor(val / 20));
  };

  const getVanCoords = (pct: number) => {
    const startX = 120, startY = 280;
    const midX1 = 280, midY1 = 90;
    const midX2 = 380, midY2 = 220;
    const endX = 560, endY = 150;

    let x = startX, y = startY;

    if (pct <= 33) {
      const t = pct / 33;
      x = startX + (midX1 - startX) * t;
      y = startY + (midY1 - startY) * t;
    } else if (pct <= 66) {
      const t = (pct - 33) / 33;
      x = midX1 + (midX2 - midX1) * t;
      y = midY1 + (midY2 - midY1) * t;
    } else {
      const t = (pct - 66) / 34;
      x = midX2 + (endX - midX2) * t;
      y = midY2 + (endY - midY2) * t;
    }
    return { x, y };
  };

  const vanCoords = getVanCoords(routeProgress);

  const handleCraftInput = (type: 'wood' | 'seeds', delta: number) => {
    if (type === 'wood') {
      const next = craftOakwood + delta;
      if (next >= 0 && next <= oakwoodCount) setCraftOakwood(next);
    } else {
      const next = craftSeeds + delta;
      if (next >= 0 && next <= catnipCount) setCraftSeeds(next);
    }
  };

  const triggerForge = () => {
    if (craftOakwood === 0 && craftSeeds === 0) {
      alert("STAGING FAILS: Please select Oakwood Shavings or Catnip Seeds first!");
      return;
    }
    
    setOakwoodCount(prev => prev - craftOakwood);
    setCatnipCount(prev => prev - craftSeeds);
    
    let textTitle = "FORGING COMPLETE! SUCCESS 100%";
    let textDesc = `Deducted ${craftOakwood} Wood and ${craftSeeds} Seeds from Local Ledger CIs.`;
    
    if (craftOakwood >= 5 && craftSeeds === 0) {
      textTitle = "🎉 FORGED RAW CARDBOARD PICTURE FRAME!";
    } else if (craftOakwood >= 4 && craftSeeds >= 10) {
      textTitle = "🎉 FORGED SOOTHING ANIMAL CANVAS!";
    }

    setCraftingStatus({
      emoji: "🎉",
      title: textTitle,
      subtitle: textDesc
    });

    setCraftOakwood(0);
    setCraftSeeds(0);

    setTimeout(() => {
      setCraftingStatus(null);
    }, 5000);
  };

  const handleBoggsSlider = (val: number) => {
    setBoggsLevel(val);
    if (val === 4) {
      setSpiteFlareActive(true);
      setSpiteFlareText("🚨 DETECTED SPITE OVERDRIVE! ACTUATING SPITE FLARE ON CLIO RED-LIGHT NET...");
    } else {
      setSpiteFlareActive(false);
    }
  };

  const triggerSpiteFlare = () => {
    setSpiteFlareActive(true);
    setSpiteFlareText("🚨 DETECTED SPITE OVERDRIVE! ACTUATING SPITE FLARE ON CLIO RED-LIGHT NET...");
    setJukeboxPlaying(true);
    setCurrentTrackIdx(3); // RUSTY CANVAS OVERDRIVE
    setBoggsLevel(4);
    
    alert("🚨 ALARM: Deployed Spite Flare across WeedStack & SpiteSlice Delivery channels! CCR Override at 100dB decibels initiated on TV Clio display node.");

    setTimeout(() => {
      setSpiteFlareActive(false);
    }, 8000);
  };

  const getThemeStyles = () => {
    if (currentTheme === 'espn') {
      return {
        '--cardboard-brown': '#b91c1c',
        '--cardboard-light': '#1e293b',
        '--cardboard-dark': '#7f1d1d',
        '--peach-matte': '#ef4444',
        '--peach-light': '#0f172a',
        '--charcoal-twilight': '#f8fafc',
        '--slate-matte': '#020617',
      } as React.CSSProperties;
    } else if (currentTheme === 'stacklabs') {
      return {
        '--cardboard-brown': '#f97316',
        '--cardboard-light': '#1f2937',
        '--cardboard-dark': '#7c2d12',
        '--peach-matte': '#fdba74',
        '--peach-light': '#111827',
        '--charcoal-twilight': '#f9fafb',
        '--slate-matte': '#030712',
      } as React.CSSProperties;
    }
    // Default sovereign-home
    return {} as React.CSSProperties;
  };

  const getAdvCardClasses = (advKey: string, color: string) => {
    let classes = "frosted-glass p-3 cursor-pointer hover:bg-stone-50/20 transition rounded-lg border-2 ";
    if (selectedAdvKey === advKey) {
      classes += `border-${color}-400 glowing-shadow-${color === 'red' ? 'red' : 'orange'}`;
    } else {
      classes += "border-transparent";
    }
    return classes;
  };

  const getTabBtnClasses = (tab: 'dashboard' | 'map' | 'holodex') => {
    let classes = "px-4 py-2 rounded-t-lg border-b-0 text-sm md:text-base cursor-pointer transition-all duration-200 ";
    if (activeTab === tab) {
      classes += "bg-peach-light border-cardboard-brown border-b-transparent translate-y-[2px] z-20 text-cardboard-dark font-bold";
    } else {
      classes += "bg-[#dfc8b3] border-cardboard-brown text-slate-matte hover:bg-peach-light/80";
    }
    return classes;
  };

  const renderMessageContent = (message: string) => {
    const match = message.match(/\[ASSET_BLAST:\s*([a-zA-Z0-9\-_]+)\/([a-zA-Z0-9\-_]+)\]/);
    if (match) {
      const advocate = match[1];
      const expression = match[2];
      return (
        <div className="flex flex-col items-center gap-1.5 p-1 bg-stone-100/50 rounded border border-stone-300">
          <img 
            src={`/avatars/${advocate}/${expression}.png`} 
            alt={advocate} 
            className="w-16 h-16 rounded border-2 border-stone-400 object-cover bg-stone-200" 
          />
          <span className="text-[8px] font-mono text-stone-500 uppercase tracking-widest">{advocate} - {expression}</span>
        </div>
      );
    }
    return message;
  };

  return (
    <div id="main-wrapper" style={getThemeStyles()} className={`w-full flex-grow flex flex-col justify-between select-none ${spiteFlareActive ? 'shake-active' : ''}`}>
      
      {/* HEADER SECTION */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center bg-[#292930] p-4 rounded-xl border border-stone-700 shadow-lg relative z-20">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🐾</span>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wide uppercase text-orange-200">
              Sovereign OS <span className="text-orange-400 font-light">|</span> {user.display_name || 'Barb'}'s Outpost
            </h1>
            <p className="text-xs text-stone-400 font-mono">NODE STATUS: ACTIVE (PORT 3008) • ENCRYPTED TUNNEL (TAILSCALE)</p>
          </div>
        </div>

        {/* Dynamic theme selector */}
        <div className="flex items-center space-x-2 my-2 md:my-0">
          <span className="text-xs font-mono text-stone-400 uppercase">OS Theme:</span>
          <select 
            value={currentTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="bg-stone-800 border border-stone-600 rounded text-xs font-mono text-orange-200 p-1 focus:outline-none"
          >
            <option value="sovereign-home">Cozy Cardboard</option>
            <option value="espn">Red Cockpit (ESPN)</option>
            <option value="stacklabs">Bare Metal (StackLabs)</option>
          </select>
        </div>
        
        {/* SYSTEM ALERTS TAPE BANNER */}
        {spiteFlareActive && (
          <div className="animate-pulse bg-red-600 text-white font-mono text-sm px-4 py-2 rounded-md shadow-lg border-2 border-red-400 flex items-center space-x-2">
            <span className="animate-bounce">⚠️</span>
            <span>{spiteFlareText}</span>
          </div>
        )}

        {/* TABS CONTROLLER */}
        <div className="flex space-x-1 mt-4 md:mt-0 relative overflow-visible h-12">
          <button onClick={() => setActiveTab('dashboard')} className={getTabBtnClasses('dashboard')}>
            📱 Outpost Dashboard
          </button>
          <button onClick={() => setActiveTab('map')} className={getTabBtnClasses('map')}>
            🗺️ Sentinel Map
          </button>
          <button onClick={() => setActiveTab('holodex')} className={getTabBtnClasses('holodex')}>
            🛠️ HoloDex & Spite
          </button>
        </div>
      </header>

      {/* MAIN INTERACTIVE SCREENS */}
      <main className="flex-grow relative min-h-[600px]">

        {/* ================= PAGE 1: OUTPOST DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="relative md:absolute md:inset-0 w-full h-auto md:h-full flex flex-col md:grid md:grid-cols-12 gap-4">
            
            {/* LEFT PANEL: ROSTER CARDS */}
            <div className="md:col-span-4 flex flex-col cardboard-panel cardboard-texture p-4 h-full overflow-y-auto">
              <div className="tape-corner"></div>
              <div className="tape-corner-right"></div>
              <h2 className="text-lg font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 mt-2 flex justify-between items-center font-sans">
                <span>👥 LOCAL ADVOCATES</span>
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">ROSTER ({advocates.length})</span>
              </h2>
              
              <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                {advocates.map(adv => (
                  <div 
                    key={adv.key}
                    onClick={() => setSelectedAdvKey(adv.key)} 
                    className={getAdvCardClasses(adv.key, adv.color)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-orange-100/50 border-2 border-orange-400/80 flex items-center justify-center text-2xl shadow-inner">
                        {adv.emoji}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-stone-900">{adv.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            adv.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            adv.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            adv.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                            adv.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                            adv.color === 'pink' ? 'bg-pink-100 text-pink-700' :
                            'bg-red-100 text-red-700'
                          }`}>{adv.role}</span>
                        </div>
                        <p className="text-xs text-stone-600 font-mono">{adv.handle} • companion: {adv.companion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADVOCATE LORE DRAWER */}
              <div className="mt-4 p-3 bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-800">
                <h4 className="font-bold text-stone-900 mb-1">{selectedAdv.emoji} {selectedAdv.name} Profile:</h4>
                <p className="italic mb-2 text-stone-700">"{selectedAdv.bio}"</p>
                <div className="flex justify-between font-mono text-[9px] uppercase text-stone-500 font-bold">
                  <span>{selectedAdv.protocol}</span>
                </div>
              </div>
            </div>

            {/* CENTER PANEL: SMYRNA CHAT */}
            <div className="md:col-span-5 flex flex-col cardboard-panel cardboard-texture p-4 h-full justify-between">
              
              {/* PROVISIONED STACK UTILITIES QUICK-ACCESS */}
              <div className="mb-4 bg-amber-50/50 border border-cardboard-brown rounded-lg p-2.5 shadow-sm">
                <h3 className="text-[10px] font-bold text-stone-800 uppercase mb-1.5 font-mono tracking-wider">
                  🔌 ACTIVE STACK UTILITIES
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {utilities.filter(u => u.active === 1).map(util => (
                    <div 
                      key={util.module_name} 
                      onClick={() => {
                        if (util.module_name === 'holodex_matrix') setActiveTab('holodex');
                        else alert(`Launching ${util.display_name}...`);
                      }}
                      className="flex items-center space-x-2 bg-white/80 p-1.5 rounded border border-stone-300 hover:bg-white cursor-pointer transition shadow-sm"
                    >
                      <span className="text-lg">{util.icon}</span>
                      <div className="truncate">
                        <div className="font-bold text-[10px] text-stone-900 truncate">{util.display_name}</div>
                        <div className="text-[8px] text-stone-500 font-mono truncate">{util.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="text-lg font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 flex justify-between items-center">
                <span>💬 SMYRNA HEIGHTS ROOM CHAT</span>
                <span className="text-xs text-emerald-800 font-mono flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>LIVE
                </span>
              </h2>

              {/* Chat Stream */}
              <div 
                ref={chatStreamRef} 
                className="flex-1 overflow-y-auto space-y-4 p-2 bg-stone-50/50 rounded-lg border border-stone-300/60 max-h-[300px] min-h-[200px]"
              >
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === `@${user.user_name}` ? 'items-end' : 'items-start'} space-y-1`}>
                    <div className="flex items-center space-x-2">
                      {msg.sender !== `@${user.user_name}` && <span className="text-[10px] font-bold text-stone-700">{msg.emoji} {msg.sender}</span>}
                      <span className="text-[8px] text-stone-400 font-mono">{msg.created_on}</span>
                      {msg.sender === `@${user.user_name}` && <span className="text-[10px] font-bold text-sky-800">{msg.sender} 👩‍🎨</span>}
                    </div>
                    <div className={`text-xs px-3 py-2 rounded-lg max-w-[85%] shadow-sm ${
                      msg.sender === `@${user.user_name}`
                        ? 'bg-sky-100 border border-sky-300 text-stone-800 font-mono rounded-tr-none' 
                        : (msg.sender === 'greta_vet_heel' 
                            ? 'bg-red-50 border border-red-300 text-red-950 font-bold rounded-tl-none animate-pulse' 
                            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none')
                    }`}>
                      {renderMessageContent(msg.message)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Send Chat input */}
              <div className="mt-3 flex space-x-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={`YAP AS ${user.display_name?.toUpperCase() || 'BARB'}...`} 
                  className="flex-grow text-xs font-mono uppercase bg-white border-2 border-stone-400 rounded px-3 py-2 text-stone-800 focus:outline-none focus:border-stone-600"
                />
                <button 
                  onClick={handleSendChat}
                  className="bg-stone-700 text-stone-100 text-xs font-mono font-bold px-4 py-2 rounded border-2 border-stone-800 hover:bg-stone-800 shadow cursor-pointer uppercase"
                >
                  SEND
                </button>
              </div>

              {/* HoloLink Asset Blast Dropdowns */}
              <div className="mt-2.5 p-2 bg-stone-150 border-2 border-dashed border-stone-400 rounded flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-stone-700 uppercase font-mono">📡 HoloLink:</span>
                <div className="flex gap-2">
                  <select 
                    value={blastAdvocate}
                    onChange={(e) => {
                      const nextAdv = e.target.value;
                      setBlastAdvocate(nextAdv);
                      const expressions = ADVOCATE_EXPRESSIONS[nextAdv] || [];
                      if (expressions.length > 0) {
                        setBlastExpression(expressions[0]);
                      }
                    }}
                    className="text-[10px] font-mono bg-white border border-stone-400 rounded px-1.5 py-0.5 text-stone-800 outline-none"
                  >
                    {Object.keys(ADVOCATE_EXPRESSIONS).map(adv => (
                      <option key={adv} value={adv}>@{adv}</option>
                    ))}
                  </select>
                  <select
                    value={blastExpression}
                    onChange={(e) => setBlastExpression(e.target.value)}
                    className="text-[10px] font-mono bg-white border border-stone-400 rounded px-1.5 py-0.5 text-stone-800 outline-none"
                  >
                    {(ADVOCATE_EXPRESSIONS[blastAdvocate] || []).map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    const blastMsg = `[ASSET_BLAST: ${blastAdvocate}/${blastExpression}]`;
                    const body = {
                      room_id: 'smyrna_heights',
                      sender: `@${user.user_name}`,
                      message: blastMsg
                    };
                    fetch('/api/public/room_chatter', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body)
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (data.status === 'success') {
                          fetchChatMessages();
                        }
                      })
                      .catch(err => console.error("Error blasting asset:", err));
                  }}
                  className="bg-purple-700 text-purple-100 text-[10px] font-mono font-bold px-3 py-1 rounded border-2 border-purple-800 hover:bg-purple-800 cursor-pointer uppercase shadow-sm"
                >
                  BLAST
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: COCKPIT PIP & RETRO JUKEBOX */}
            <div className="md:col-span-3 flex flex-col gap-4 h-full justify-between">
              
              {/* TOP: NAP MIST & AUDIT STATUS */}
              <div className="cardboard-panel cardboard-texture p-3 flex flex-col items-center flex-1 min-h-[220px]">
                <h3 className="text-xs font-bold text-stone-800 border-b-2 border-stone-400 pb-1 mb-2 w-full text-center tracking-wider uppercase font-mono">
                  🌿 ANIMAL AUDIT CONTROL
                </h3>
                
                <div className="w-full flex-grow rounded border-2 border-emerald-400 glowing-shadow-blue bg-[#0b2b13] relative overflow-hidden flex flex-col items-center justify-center text-center p-3 crt-scanlines">
                  <div className="absolute top-2 left-2 flex space-x-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[8px] text-emerald-300 font-mono">SHIELD ACTIVE</span>
                  </div>

                  <div className="text-emerald-300 flex flex-col items-center space-y-2">
                    <span className="text-4xl animate-bounce">🌿</span>
                    <span className="text-xs font-bold tracking-widest text-emerald-200">NAP MIST CANISTERS</span>
                    <span className="text-2xl font-mono font-black text-amber-300">{napMistBalance} Left</span>
                    <div className="bg-emerald-950/60 border border-emerald-800 rounded px-2 py-1 text-[8px] text-emerald-300 font-mono mt-1 max-w-[90%]">
                      Settle rescue tension instantly. Temporarily mutes Greta's uncertified warnings.
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                    <button 
                      onClick={handleUseNapMist}
                      className="bg-emerald-700 border border-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-mono px-3 py-1 rounded shadow cursor-pointer uppercase font-bold"
                    >
                      🌿 USE NAP MIST
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM: retro JUKEBOX */}
              <div className="cardboard-panel cardboard-texture p-3 flex flex-col justify-between min-h-[220px]">
                <h3 className="text-xs font-bold text-stone-800 border-b-2 border-stone-400 pb-1 mb-2 w-full text-center tracking-wider uppercase font-mono">
                  📻 COZY JUKEBOX WIDGET
                </h3>

                <div className="bg-[#5c3e35] p-3 rounded-lg border-2 border-[#3d2721] text-stone-100 shadow-inner flex flex-col space-y-2 relative">
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${jukeboxPlaying ? 'bg-amber-500 glowing-shadow-orange animate-pulse' : 'bg-stone-700'}`}></div>
                  
                  <div className="text-[10px] font-mono text-amber-300/80 tracking-widest text-center uppercase">
                    Creedence Clearwater Revival
                  </div>
                  
                  <div className="bg-amber-950/75 rounded border border-amber-800 p-2 text-center text-xs font-mono text-amber-400">
                    {playlist[currentTrackIdx]}
                  </div>

                  <div className="flex items-end justify-center space-x-1 h-8 pt-1">
                    {visualizerHeights.map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-amber-500 transition-all duration-150" 
                        style={{ height: jukeboxPlaying ? `${h}%` : '4px' }}
                      ></div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center px-2 pt-1">
                    <button 
                      onClick={() => setCurrentTrackIdx(prev => (prev - 1 + playlist.length) % playlist.length)} 
                      className="text-amber-400 hover:text-amber-200 text-xs cursor-pointer"
                    >
                      <SkipBack size={14} />
                    </button>
                    <button 
                      onClick={() => setJukeboxPlaying(!jukeboxPlaying)}
                      className="bg-amber-50 text-amber-950 rounded-full font-bold px-3 py-1 text-xs hover:bg-amber-400 shadow cursor-pointer"
                    >
                      {jukeboxPlaying ? <Pause size={12} className="inline mr-1" /> : <Play size={12} className="inline mr-1" />}
                      {jukeboxPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                    <button 
                      onClick={() => setCurrentTrackIdx(prev => (prev + 1) % playlist.length)} 
                      className="text-amber-400 hover:text-amber-200 text-xs cursor-pointer"
                    >
                      <SkipForward size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* VENGEANCE AUDIO WIDGET */}
              <div className="cardboard-panel cardboard-texture p-3 flex flex-col justify-between min-h-[220px]">
                <h3 className="text-xs font-bold text-stone-800 border-b-2 border-stone-400 pb-1 mb-2 w-full text-center tracking-wider uppercase font-mono">
                  🎙️ VENGEANCE AUDIO MODULE
                </h3>

                <div className="bg-[#4d3630] p-3 rounded-lg border-2 border-[#30201d] text-stone-100 shadow-inner flex flex-col space-y-2 relative">
                  <div className="text-[9px] font-mono text-amber-300/80 tracking-widest text-center uppercase">
                    DaVinci's Countermeasure Active
                  </div>

                  {/* Recorder Status Banner */}
                  <div className="bg-[#241310] rounded border border-amber-950/80 p-2 text-center text-xs font-mono min-h-[64px] flex flex-col items-center justify-center">
                    {recorderStatus === 'idle' && (
                      <span className="text-amber-400">Ready to record Vengeance voice telemetry...</span>
                    )}
                    {recorderStatus === 'recording' && (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-red-400 font-bold animate-pulse">● RECORDING SPOKEN FRICTION</span>
                        <span className="text-white text-sm font-bold">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                    {recorderStatus === 'sending' && (
                      <span className="text-sky-400 animate-pulse">Streaming audio telemetry to Sorting Hat...</span>
                    )}
                    {recorderStatus === 'success' && (
                      <div className="flex flex-col items-center text-emerald-400">
                        <span className="font-bold">✓ AUDIO STREAM PROCESSED!</span>
                        <span className="text-[10px] text-emerald-300/95 mt-1 text-center">{dbMutationResult}</span>
                      </div>
                    )}
                    {recorderStatus === 'error' && (
                      <span className="text-red-500 font-bold">⚠ TELEMETRY TRANSMISSION FAILED</span>
                    )}
                  </div>

                  {/* Waveform Visualizer */}
                  <div className="flex items-end justify-center space-x-1 h-8 pt-1 bg-[#241310]/50 rounded">
                    {waveHeights.map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 transition-all duration-100 ${isRecording ? 'bg-red-500' : 'bg-stone-600'}`}
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>

                  {/* Recording control button */}
                  <div className="flex justify-center pt-1">
                    {!isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        disabled={recorderStatus === 'sending'}
                        className="bg-red-700 text-white border-2 border-red-900 rounded-full font-bold px-4 py-1.5 text-xs hover:bg-red-600 active:scale-95 shadow cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
                      >
                        <Mic size={12} /> RECORD LOG
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="bg-stone-100 text-stone-900 border-2 border-stone-300 rounded-full font-bold px-4 py-1.5 text-xs hover:bg-white active:scale-95 shadow cursor-pointer flex items-center gap-1.5 uppercase tracking-wide animate-pulse"
                      >
                        <Square size={10} className="fill-stone-900" /> STOP & STREAM
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= PAGE 2: SENTINEL MAP ================= */}
        {activeTab === 'map' && (
          <div className="relative md:absolute md:inset-0 w-full h-auto md:h-full flex flex-col md:grid md:grid-cols-12 gap-4">
            
            <div className="md:col-span-8 flex flex-col cardboard-panel cardboard-texture p-4 h-full">
              <h2 className="text-lg font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 flex justify-between items-center font-sans">
                <span>🗺️ SMYRNA HEIGHTS SENTINEL MAP</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded font-mono font-bold">DELIVERY SYSTEM (GPX)</span>
              </h2>

              {/* Map grid canvas */}
              <div className="flex-1 rounded-xl border-4 border-dashed border-amber-800/40 bg-[#dfcaaf] relative overflow-hidden min-h-[300px] shadow-inner">
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#6e473b 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                ></div>
                
                {/* Bezier Path connector */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <path 
                    d="M 120 280 C 200 150, 300 120, 350 220 S 500 350, 620 180" 
                    fill="none" 
                    stroke="var(--glowing-neon-orange)" 
                    strokeWidth="6" 
                    strokeDasharray="10 5" 
                    strokeLinecap="round" 
                    className="animate-pulse shadow"
                  />
                </svg>

                {/* Map Pins */}
                <div className="absolute" style={{ left: '100px', top: '260px', zIndex: 10 }}>
                  <div className="bg-amber-50 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-[10px] font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform">
                    <span>🏠</span>
                    <span>BARB'S BASE</span>
                  </div>
                </div>

                <div className="absolute" style={{ left: '280px', top: '90px', zIndex: 10 }}>
                  <div className="bg-amber-50 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-[10px] font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform">
                    <span>🏪</span>
                    <span>GONZAS STORE</span>
                  </div>
                </div>

                <div className="absolute" style={{ left: '380px', top: '220px', zIndex: 10 }}>
                  <div className="bg-amber-50 border-2 border-[#6e473b] px-2 py-1 rounded shadow-lg text-[10px] font-mono font-bold text-stone-800 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform">
                    <span>🍕</span>
                    <span>SPITESLICE</span>
                  </div>
                </div>

                <div className="absolute" style={{ left: '560px', top: '150px', zIndex: 10 }}>
                  <div className="bg-emerald-50 border-2 border-emerald-800 px-2 py-1 rounded shadow-lg text-[10px] font-mono font-bold text-emerald-900 flex items-center space-x-1 cursor-help hover:scale-105 transition-transform">
                    <span>🐶</span>
                    <span>WILD PAWS RESCUE</span>
                  </div>
                </div>

                {/* Van Dot */}
                <div 
                  className="absolute w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-sm shadow-lg glowing-shadow-orange z-20 transition-all duration-100 ease-out" 
                  style={{ left: `${vanCoords.x}px`, top: `${vanCoords.y}px`, transform: 'translate(-50%, -50%)' }}
                >
                  🚚
                </div>

                <div className="absolute bottom-4 left-4 bg-stone-900/80 border border-orange-400 p-2 rounded text-[9px] text-orange-300 font-mono z-10">
                  🔍 GPS SATELLITES: OK (LOCK 144.3)<br />
                  🎯 RANGE BOUNDARY: Excursions &gt;25m Active
                </div>
              </div>

              {/* Progress Slider */}
              <div className="mt-4 p-3 bg-stone-100 border border-stone-300 rounded-lg">
                <label className="block text-xs font-mono font-bold text-stone-800 uppercase mb-2 flex justify-between">
                  <span>🚚 ROUTE PROGRESS CONTROLLER (DRAG TO WALK SENTINEL ROUTE)</span>
                  <span className="text-orange-600 font-bold">{routeProgress}% COMPLETED</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={routeProgress} 
                  onChange={(e) => updateRouteProgress(parseInt(e.target.value))} 
                  className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer focus:outline-none accent-orange-500"
                />
              </div>
            </div>

            {/* RIGHT PANEL: RESOURCE LEDGER */}
            <div className="md:col-span-4 flex flex-col cardboard-panel cardboard-texture p-4 h-full justify-between">
              <div className="tape-corner"></div>
              <div className="tape-corner-right"></div>
              <h2 className="text-lg font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 mt-2 flex justify-between items-center font-sans">
                <span>🏝️ DRAGON ISLAND HARVEST</span>
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">LEDGER</span>
              </h2>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-stone-700 leading-relaxed mb-4">
                <p className="font-bold text-stone-900 mb-1">📋 Bio-Telemetry Gamification Law:</p>
                Every pizza delivery shift Barb completes translates GPS tracking points into physical crafting resources mapped directly to coordinate grids.
              </div>

              {/* Resource blocks */}
              <div className="space-y-4 flex-grow">
                <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-4 shadow flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🪵</span>
                    <div>
                      <h4 className="font-extrabold text-stone-800 uppercase text-xs">Oakwood Shavings</h4>
                      <p className="text-[9px] text-stone-500 font-mono">FOR CANVAS FRAME BUILDING</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#6e473b] font-mono">{oakwoodCount}</span>
                    <span className="text-[10px] text-[#a07855] font-mono block">UNITS</span>
                  </div>
                </div>

                <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-4 shadow flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🌱</span>
                    <div>
                      <h4 className="font-extrabold text-stone-800 uppercase text-xs">Catnip Seeds</h4>
                      <p className="text-[9px] text-stone-500 font-mono">FOR CANNABIS ECO-SEDATIVE</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-800 font-mono">{catnipCount}</span>
                    <span className="text-[10px] text-emerald-600 font-mono block">SEEDS</span>
                  </div>
                </div>

                <div className="bg-stone-50 border-2 border-[#a07855] rounded-xl p-4 shadow flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🪙</span>
                    <div>
                      <h4 className="font-extrabold text-stone-800 uppercase text-xs">Moscato Coins</h4>
                      <p className="text-[9px] text-stone-500 font-mono">FOR CLIO SECURE PORT TRADING</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-700 font-mono">{coinsCount}</span>
                    <span className="text-[10px] text-amber-600 font-mono block">COINS</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= PAGE 3: HOLODEX & SPITE ================= */}
        {activeTab === 'holodex' && (
          <div className="relative md:absolute md:inset-0 w-full h-auto md:h-full flex flex-col md:grid md:grid-cols-12 gap-4">
            
            {/* COLUMN 1: CRAFTING BENCH */}
            <div className="md:col-span-4 flex flex-col cardboard-panel cardboard-texture p-4 h-full justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 flex justify-between items-center font-sans">
                  <span>🛠️ HOLODEX CRAFTING BENCH</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-mono">RECIPE</span>
                </h2>

                <h3 className="text-xs font-bold text-stone-700 uppercase mb-2">1. STAGE RECIPE INPUTS</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-stone-100 border border-stone-300 rounded p-2 text-center flex flex-col items-center">
                    <span className="text-xl mb-1">🪵</span>
                    <span className="text-[10px] font-bold text-stone-800 uppercase">Georgia Oakwood</span>
                    <div className="flex items-center space-x-2 mt-2">
                      <button onClick={() => handleCraftInput('wood', -1)} className="w-5 h-5 rounded-full bg-stone-300 border border-stone-400 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-stone-400">-</button>
                      <span className="font-mono font-bold text-stone-900 text-sm">{craftOakwood}</span>
                      <button onClick={() => handleCraftInput('wood', 1)} className="w-5 h-5 rounded-full bg-stone-300 border border-stone-400 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-stone-400">+</button>
                    </div>
                    <span className="text-[8px] text-stone-500 mt-1 uppercase">Available: {oakwoodCount}</span>
                  </div>

                  <div className="bg-stone-100 border border-stone-300 rounded p-2 text-center flex flex-col items-center">
                    <span className="text-xl mb-1">🌱</span>
                    <span className="text-[10px] font-bold text-stone-800 uppercase">Catnip Seeds</span>
                    <div className="flex items-center space-x-2 mt-2">
                      <button onClick={() => handleCraftInput('seeds', -1)} className="w-5 h-5 rounded-full bg-stone-300 border border-stone-400 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-stone-400">-</button>
                      <span className="font-mono font-bold text-stone-900 text-sm">{craftSeeds}</span>
                      <button onClick={() => handleCraftInput('seeds', 1)} className="w-5 h-5 rounded-full bg-stone-300 border border-stone-400 font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-stone-400">+</button>
                    </div>
                    <span className="text-[8px] text-stone-500 mt-1 uppercase">Available: {catnipCount}</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-stone-700 uppercase mb-2">2. CRAFTING SYNTHESIS GRAPH</h3>
                <div className="border-2 border-dashed border-[#a07855]/60 bg-stone-50/50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[100px] text-center relative">
                  {craftingStatus ? (
                    <div className="z-10 flex flex-col items-center">
                      <span className="text-3xl animate-pulse">{craftingStatus.emoji}</span>
                      <span className="font-bold text-[10px] text-emerald-800 uppercase mt-2">{craftingStatus.title}</span>
                      <p className="text-[8px] text-stone-600 uppercase mt-1">{craftingStatus.subtitle}</p>
                    </div>
                  ) : (
                    <div className="z-10 flex flex-col items-center font-sans">
                      <span className="text-2xl animate-bounce">🎨</span>
                      <span className="font-bold text-[10px] text-stone-700 uppercase mt-1">
                        {craftOakwood > 0 || craftSeeds > 0 
                          ? (craftOakwood >= 5 && craftSeeds === 0 ? "⭐ PERFECT FRAME RECIPE!" :
                             craftOakwood >= 4 && craftSeeds >= 10 ? "⭐ SPECIAL SOOTHING CANVAS!" :
                             "STAGING MATERIALS...")
                          : "STAGING ART CANVASES"
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={triggerForge}
                  className="w-full bg-[#826042] text-stone-100 font-bold uppercase py-2 px-3 rounded border border-[#5c3e35] hover:bg-[#a07855] glowing-shadow-orange shadow transition-all cursor-pointer text-xs"
                >
                  🔨 FORGE CANVAS FRAME
                </button>
              </div>
            </div>

            {/* COLUMN 2: ART RESCUE STOREFRONT */}
            <div className="md:col-span-4 flex flex-col cardboard-panel cardboard-texture p-4 h-full justify-between overflow-y-auto">
              <div>
                <h2 className="text-sm font-extrabold text-stone-800 border-b-2 border-stone-400 pb-2 mb-3 flex justify-between items-center font-sans">
                  <span>🖼️ ART RESCUE AUCTION</span>
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded font-mono">STORE</span>
                </h2>

                {/* Form */}
                <div className="space-y-2 mb-3 bg-white/40 p-2.5 rounded border border-stone-300">
                  <div>
                    <label className="block text-[9px] font-mono text-stone-600 uppercase">Canvas Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Calico Cat Render"
                      value={newArtTitle}
                      onChange={(e) => setNewArtTitle(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-stone-400 rounded p-1.5 text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-stone-600 uppercase">Price (Coins)</label>
                    <input 
                      type="number"
                      value={newArtPrice}
                      onChange={(e) => setNewArtPrice(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-mono bg-white border border-stone-400 rounded p-1.5 text-stone-800"
                    />
                  </div>
                  <button 
                    onClick={handleCreateAuction}
                    className="w-full bg-orange-600 text-white font-mono font-bold text-xs uppercase py-1.5 rounded border border-orange-700 hover:bg-orange-700 cursor-pointer shadow"
                  >
                    🚀 LIST CANVAS
                  </button>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {auctions.map(auc => (
                    <div key={auc.sys_id} className="flex justify-between items-center bg-white/70 border border-stone-300 p-2 rounded shadow-sm">
                      <div className="truncate">
                        <div className="font-bold text-[10px] text-stone-900 truncate">{auc.title}</div>
                        <div className="text-[8px] text-stone-500 font-mono">
                          {auc.has_frame === 1 ? 'Framed' : 'Uncertified'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-orange-800 text-[10px]">{auc.price}c</span>
                        {auc.has_frame === 0 ? (
                          <button 
                            onClick={() => handleApplyFrame(auc.sys_id)}
                            className="bg-amber-700 hover:bg-amber-800 text-white text-[8px] font-mono px-1.5 py-0.5 rounded shadow cursor-pointer font-bold"
                          >
                            Frame
                          </button>
                        ) : (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono uppercase font-bold">Ok</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: SPITE ACTUATOR EMERGENCY DECK */}
            <div className="md:col-span-4 flex flex-col cardboard-panel-dark cardboard-texture-dark p-4 h-full justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-stone-100 border-b-2 border-stone-600 pb-2 mb-3 flex justify-between items-center font-sans">
                  <span>🚨 SPITE ACTUATOR Emergency</span>
                  <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded font-mono border border-red-900 uppercase">SYS_ADMIN</span>
                </h2>

                <div className="bg-red-950/40 border border-red-900 rounded p-2.5 text-[10px] text-stone-300 leading-normal mb-3 font-sans">
                  <p className="font-extrabold text-red-400 uppercase mb-1">🔥 THE ANTI-CORPORATE CONTRACT MANDATE:</p>
                  Unleash complete system gravity, forcing emergency pricing drops and town solidarity.
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-stone-900/80 border border-stone-700 p-1.5 rounded">
                    <span className="text-[8px] text-stone-400 block font-mono">BOGGS THREAT LEVEL</span>
                    <span className={`text-xs font-extrabold font-mono ${
                      boggsLevel === 0 ? 'text-emerald-400' :
                      boggsLevel === 1 ? 'text-amber-400' :
                      boggsLevel === 2 ? 'text-orange-400' :
                      'text-red-500 animate-pulse'
                    }`}>
                      {boggsLevel === 0 ? '0 (CHILL)' :
                       boggsLevel === 1 ? '1 (ENGAGED)' :
                       boggsLevel === 2 ? '2 (TENSE)' :
                       boggsLevel === 3 ? '3 (FEVER)' :
                       '4 (OVERDRIVE!)'}
                    </span>
                  </div>
                  <div className="bg-stone-900/80 border border-stone-700 p-1.5 rounded">
                    <span className="text-[8px] text-stone-400 block font-mono">SPITE COUPLING</span>
                    <span className="text-xs font-extrabold text-stone-300 font-mono">{boggsLevel * 25}%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-stone-900/50 border border-stone-800 rounded mb-3 text-xs space-y-2">
                  <label className="block font-mono text-[9px] font-bold text-stone-300 uppercase flex justify-between">
                    <span>MANUAL PRESSURE INJECTOR</span>
                    <span className="text-emerald-400">LEVEL {boggsLevel}</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="4" 
                    value={boggsLevel} 
                    onChange={(e) => handleBoggsSlider(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-stone-800 rounded appearance-none cursor-pointer focus:outline-none accent-red-600"
                  />
                </div>
              </div>

              <div className="bg-[#241313] p-3 rounded-xl border border-red-900 flex flex-col items-center shadow-inner relative overflow-hidden">
                <span className="text-[8px] text-red-500 font-mono uppercase mb-1.5 tracking-widest animate-pulse">⚠️ FLIGHT CONTROLLER ARM SYSTEM ⚠️</span>
                <button 
                  onClick={triggerSpiteFlare}
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-600 border-2 border-red-500 text-white font-black text-sm rounded shadow-lg uppercase transition-all transform hover:scale-[1.02] cursor-pointer tracking-wider font-mono"
                >
                  🚨 DEPLOY SPITE FLARE 🚨
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER DIAGNOSTICS BAR */}
      <footer className="mt-6 p-3 bg-stone-900 rounded-lg border border-stone-800 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-stone-400 relative z-20">
        <div className="flex items-center space-x-3 mb-2 md:mb-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>TAILSCALE MagicDNS LINK: <a href="https://clio.taila01894.ts.net:3008/cinema-portal/" className="text-orange-400 underline hover:text-orange-300">clio.taila01894.ts.net:3008</a></span>
        </div>
        <div className="flex items-center space-x-4">
          <span>VITE DEV SERVER: UP</span>
          <span>M.A.R.D. TELEMETRY: 100% OK</span>
          <span>SYSTEM DATE: 2026-06-05</span>
        </div>
      </footer>

    </div>
  );
}
