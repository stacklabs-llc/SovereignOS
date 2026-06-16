import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  Database, 
  Activity, 
  Edit, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';

interface UserInfo {
  identified: boolean;
  user_name: string;
  display_name: string;
  role: string;
  greeting: string;
  ip: string;
  avatar_url?: string;
}

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    identified: false,
    user_name: 'guest',
    display_name: 'Tailnet Peer',
    role: 'guest',
    greeting: 'Authenticated Tailnet peer connection verified. Welcome to StackLabs.',
    ip: 'unknown'
  });
  
  const [quote, setQuote] = useState('The cloud is just someone else\'s expensive computer you can\'t touch. We mix our software like premium whiskey: local, pure, and barrel-aged on bare metal.');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [quoteInput, setQuoteInput] = useState('');
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  
  const [telemetry, setTelemetry] = useState({
    cpu: '12%',
    ram: '54%',
    dbLoad: '97%',
    uptime: '99.98%'
  });

  const [scratchpadInput, setScratchpadInput] = useState('');
  const [isDumping, setIsDumping] = useState(false);
  const [dumpStatus, setDumpStatus] = useState<'idle' | 'success' | 'fallback_success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const scratchpadRef = React.useRef<HTMLTextAreaElement>(null);

  const handleLocalFallback = (text: string, reason: string) => {
    try {
      const existing = localStorage.getItem('stacklabs_scratchpad_fallback');
      const list = existing ? JSON.parse(existing) : [];
      list.push({
        raw_text: text,
        source_context: 'StackLabs Homepage Local Fallback',
        created_at: new Date().toISOString(),
        error_reason: reason
      });
      localStorage.setItem('stacklabs_scratchpad_fallback', JSON.stringify(list));
      
      setScratchpadInput('');
      setDumpStatus('fallback_success');
      setStatusMessage('Stored in Local Cache (Offline Fallback)');
      
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (localErr) {
      console.error("Local storage fallback also failed:", localErr);
      setDumpStatus('error');
      setStatusMessage('Fatal Ingress Failure');
    }
  };

  const handleDumpToStack = async () => {
    if (!scratchpadInput.trim()) return;
    setIsDumping(true);
    setDumpStatus('idle');
    setStatusMessage('');

    const ideaText = scratchpadInput;
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      const res = await fetch('/v1/ingress/scratchpad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: ideaText,
          source_context: 'StackLabs Homepage Quick-Capture'
        })
      });
      
      const data = await res.json();
      
      if (res.status === 201 && data.status === 'success') {
        setScratchpadInput('');
        setDumpStatus('success');
        setStatusMessage(`Ingested successfully (ID: ${data.idea_id})`);
        
        if (navigator.vibrate) {
          navigator.vibrate([40, 40, 40]);
        }
      } else if (data.status === 'fallback' || data.local_fallback) {
        handleLocalFallback(ideaText, data.message || 'Database write failed');
      } else {
        handleLocalFallback(ideaText, 'Unexpected backend response');
      }
    } catch (err: any) {
      console.warn("[SCRATCHPAD FALLBACK] API call exception caught, falling back to localStorage:", err);
      handleLocalFallback(ideaText, err.message || 'API connection offline');
    } finally {
      setIsDumping(false);
      setTimeout(() => {
        scratchpadRef.current?.focus();
      }, 100);
      
      setTimeout(() => {
        setDumpStatus('idle');
        setStatusMessage('');
      }, 4000);
    }
  };

  useEffect(() => {
    // 1. Fetch user identity based on Tailscale IP
    fetch('/api/public/identify')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setUserInfo(data);
        }
      })
      .catch(err => console.error("Error identifying client:", err));

    // 2. Fetch the current StackLabs gateway quote
    fetch('/api/public/stacklabs/quote')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setQuote(data.quote);
          setQuoteInput(data.quote);
        }
      })
      .catch(err => console.error("Error fetching quote:", err));
      
    // 3. Simulate minor telemetry fluctuations
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpu: `${Math.floor(8 + Math.random() * 8)}%`,
        ram: `${Math.floor(52 + Math.random() * 4)}%`
      }));
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAccess = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname.includes('taila01894.ts.net')) {
      window.location.href = `https://${hostname}:3016/`;
    } else {
      window.location.href = `${protocol}//${hostname}:3016/`;
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteInput.trim()) return;
    setIsSavingQuote(true);
    try {
      const res = await fetch('/api/public/stacklabs/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: quoteInput })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQuote(data.quote);
        setIsEditingQuote(false);
      }
    } catch (err) {
      console.error("Failed to save quote:", err);
    } finally {
      setIsSavingQuote(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-[#e2e8f0] font-mono flex flex-col justify-between p-4 md:p-8 relative select-none overflow-x-hidden">
      
      {/* Dynamic Keyframes injected globally */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(0, 212, 255, 0.3)) drop-shadow(0 0 10px rgba(0, 212, 255, 0.15));
            opacity: 0.85;
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.7)) drop-shadow(0 0 35px rgba(0, 212, 255, 0.35));
            opacity: 1;
          }
        }
        @keyframes bgHexPulse {
          0%, 100% {
            opacity: 0.015;
            transform: scale(0.98) rotate(0deg);
          }
          50% {
            opacity: 0.035;
            transform: scale(1.02) rotate(1deg);
          }
        }
        .animate-glow-pulse {
          animation: glowPulse 5s ease-in-out infinite;
        }
        .animate-bg-hex-pulse {
          animation: bgHexPulse 15s ease-in-out infinite;
        }
      `}</style>

      {/* Pulsing Impossible Hexagon Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="animate-bg-hex-pulse w-full max-w-[700px] h-auto flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full text-white fill-none stroke-current" strokeWidth="1">
            <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" />
            <path d="M50 3 L50 35 L90 55 M10 25 L50 45 L50 97 M90 25 L50 45 L10 25 M10 75 L50 55 L90 75 M50 35 L10 55 L50 75 L90 55" />
          </svg>
        </div>
      </div>

      {/* TOP HEADER */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center z-10 border-b border-white/5 pb-4 mb-4">
        <div className="flex gap-4 text-xs font-bold text-slate-500">
          <span className="hover:text-white transition-colors duration-200 cursor-pointer">[FEATURES]</span>
          <span className="hover:text-white transition-colors duration-200 cursor-pointer">[NETWORK]</span>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-500 items-center">
          <span className="hover:text-white transition-colors duration-200 cursor-pointer">[API]</span>
          <span className="hover:text-white transition-colors duration-200 cursor-pointer">[SUPPORT]</span>
          <span className="text-[#00d4ff] bg-[#00d4ff]/5 border border-[#00d4ff]/20 px-2 py-0.5 rounded text-[10px] tracking-widest font-bold">
            GATEWAY_UP
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow z-10 py-8 relative">
        
        {/* Core Glowing Emblem */}
        <div className="w-[180px] md:w-[220px] h-auto text-white fill-none stroke-current animate-glow-pulse mb-8 z-10">
          <svg viewBox="0 0 100 100" className="w-full text-white fill-none stroke-current" strokeWidth="1.8">
            <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" stroke="#00d4ff" />
            <path d="M50 3 L50 35 L90 55 M10 25 L50 45 L50 97 M90 25 L50 45 L10 25 M10 75 L50 55 L90 75 M50 35 L10 55 L50 75 L90 55" stroke="#00d4ff" />
          </svg>
        </div>

        {/* Branding Headers */}
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-[0.4em] text-white text-center select-text">
          STACKLABS // BARE METAL
        </h1>
        <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-slate-400 mt-3 text-center max-w-lg leading-relaxed select-text">
          DEEP COMPUTE. TOTAL CONTROL. UNCOMPROMISED PERFORMANCE.
        </p>

        {/* Redirection Trigger Button */}
        <div className="mt-8 mb-10 w-full max-w-xs px-4">
          <button 
            onClick={handleAccess}
            className="w-full bg-[#00d4ff]/10 hover:bg-[#00d4ff]/25 border-2 border-[#00d4ff]/40 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-xs font-bold uppercase tracking-[0.25em] py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(0,212,255,0.1)] hover:shadow-[0_0_35px_rgba(0,212,255,0.3)] cursor-pointer text-center"
          >
            [ ACCESS SOVEREIGN OS ]
          </button>
        </div>

        {/* Quick-Capture Scratchpad Card */}
        <div className="w-full max-w-2xl bg-[#0b0e14]/75 border border-[#00d4ff]/20 rounded-2xl p-5 mb-8 backdrop-blur-md relative overflow-hidden text-left flex flex-col gap-3">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent"></div>
          
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#00d4ff]">
            <span className="flex items-center gap-1.5"><Terminal size={12} /> Quick-Capture Scratchpad</span>
            <span className="text-slate-500 font-mono text-[9px]">status: {dumpStatus === 'idle' ? 'Armed' : dumpStatus.toUpperCase()}</span>
          </div>
          
          <textarea
            ref={scratchpadRef}
            value={scratchpadInput}
            onChange={(e) => setScratchpadInput(e.target.value)}
            placeholder="Capture feature request, system design idea, or operational thought..."
            className="w-full bg-[#05070a]/90 border border-[#00d4ff]/10 focus:border-[#00d4ff]/40 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none resize-none h-[120px] leading-relaxed transition-all duration-300 placeholder-slate-600"
            disabled={isDumping}
          />
          
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-mono leading-none ${
              dumpStatus === 'success' ? 'text-green-400' :
              dumpStatus === 'fallback_success' ? 'text-yellow-400 font-semibold' :
              dumpStatus === 'error' ? 'text-red-400 font-bold' : 'text-slate-500'
            }`}>
              {statusMessage || 'Awaiting input...'}
            </span>
            <button
              onClick={handleDumpToStack}
              disabled={isDumping || !scratchpadInput.trim()}
              className="bg-[#00d4ff]/15 hover:bg-[#00d4ff]/30 disabled:opacity-40 disabled:hover:bg-[#00d4ff]/15 border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 disabled:hover:border-[#00d4ff]/30 text-[#00d4ff] hover:text-white text-[10px] font-bold uppercase tracking-widest py-2.5 px-5 rounded-lg transition-all duration-200 cursor-pointer"
            >
              {isDumping ? 'INGESTING...' : 'Dump to Stack'}
            </button>
          </div>
        </div>

        {/* Dynamic Personalization Display Panel */}
        {userInfo.identified && (
          <div className="w-full max-w-2xl bg-[#0b0e14]/80 border border-[#00d4ff]/30 rounded-2xl p-5 mb-8 backdrop-blur-md relative overflow-hidden text-left flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent"></div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#00d4ff]">
                <UserCheck size={12} />
                <span>Secure Peer Authenticated: {userInfo.display_name}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1 italic">
                "{userInfo.greeting}"
              </p>
              <div className="text-[9px] text-slate-500 font-mono mt-1">
                NODE_IP: <span className="text-white">{userInfo.ip}</span> | ROLE: <span className="text-white uppercase">{userInfo.role}</span>
              </div>
            </div>

            {userInfo.avatar_url && (
              <img 
                src={userInfo.avatar_url} 
                alt={userInfo.display_name} 
                className="w-12 h-12 rounded-xl border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.2)] shrink-0 self-end md:self-auto"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {/* Global Mandate / System Quote Widget */}
        <div className="w-full max-w-2xl bg-black/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm text-center relative">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex justify-between items-center">
            <span>System Mandate Ledger</span>
            {userInfo.user_name === 'james' && !isEditingQuote && (
              <button 
                onClick={() => setIsEditingQuote(true)}
                className="text-slate-500 hover:text-[#00d4ff] flex items-center gap-1 cursor-pointer transition-colors duration-200"
              >
                <Edit size={10} />
                <span>EDIT</span>
              </button>
            )}
          </div>

          {isEditingQuote ? (
            <div className="flex flex-col gap-3 mt-2">
              <textarea
                value={quoteInput}
                onChange={(e) => setQuoteInput(e.target.value)}
                className="w-full bg-[#0d0f17] border border-white/10 rounded-xl p-3 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-[#00d4ff]/40 resize-none h-[80px] leading-relaxed"
              />
              <div className="flex justify-end gap-2 text-[10px]">
                <button 
                  onClick={() => setIsEditingQuote(false)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-slate-400 cursor-pointer"
                >
                  <X size={10} className="inline mr-1" /> CANCEL
                </button>
                <button 
                  onClick={handleSaveQuote}
                  disabled={isSavingQuote}
                  className="px-3 py-1.5 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/20 rounded cursor-pointer disabled:opacity-40"
                >
                  <Check size={10} className="inline mr-1" /> {isSavingQuote ? 'SAVING...' : 'SAVE LEDGER'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic leading-relaxed select-text font-serif">
              "{quote}"
            </p>
          )}
        </div>

        {/* Dynamic Micro SCADA Telemetry Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl text-[9px] uppercase tracking-widest text-slate-500 font-mono">
          <div className="border border-white/5 bg-slate-950/20 p-3 rounded-xl flex flex-col gap-1">
            <span>CPU CORE</span>
            <span className="text-white font-bold">{telemetry.cpu}</span>
          </div>
          <div className="border border-white/5 bg-slate-950/20 p-3 rounded-xl flex flex-col gap-1">
            <span>RAM LOAD</span>
            <span className="text-white font-bold">{telemetry.ram}</span>
          </div>
          <div className="border border-white/5 bg-slate-950/20 p-3 rounded-xl flex flex-col gap-1">
            <span>SQL LEDGER</span>
            <span className="text-white font-bold">{telemetry.dbLoad} OK</span>
          </div>
          <div className="border border-white/5 bg-slate-950/20 p-3 rounded-xl flex flex-col gap-1">
            <span>UPTIME</span>
            <span className="text-white font-bold">{telemetry.uptime}</span>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 border-t border-white/5 pt-4 z-10">
        <span className="text-[9px] text-slate-600">
          ©2024 STACKLABS INC. | [TERMS OF SERVICE] | [PRIVACY POLICY]
        </span>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-ping"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] absolute"></span>
          <ShieldAlert size={10} className="text-[#00d4ff] ml-1" />
          <span>Tailscale mesh encrypted connection operational</span>
        </div>
      </footer>
    </div>
  );
}
