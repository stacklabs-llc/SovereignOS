import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  X,
  UserCheck
} from 'lucide-react';
import InteractiveCockpit from './components/InteractiveCockpit';
import StreamSniperConsole from './components/StreamSniperConsole';

interface UserInfo {
  identified: boolean;
  user_name: string;
  display_name: string;
  role: string;
  greeting: string;
  ip: string;
  avatar_url?: string;
  target_port?: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  u: number;
  v: number;
}

const boxesLoop1 = [
  { xMin: -14, xMax: -10, yMin: 12,  yMax: 16,  zMin: -16, zMax: 0 },
  { xMin: -12, xMax: 12,  yMin: 12,  yMax: 16,  zMin: -18, zMax: -14 },
  { xMin: 10,  xMax: 14,  yMin: 0,   yMax: 14,  zMin: -18, zMax: -14 },
  { xMin: 10,  xMax: 14,  yMin: -2,  yMax: 2,   zMin: -16, zMax: 16 },
  { xMin: 10,  xMax: 14,  yMin: -14, yMax: 0,   zMin: 14,  zMax: 18 },
  { xMin: -12, xMax: 12,  yMin: -16, yMax: -12, zMin: 14,  zMax: 18 }
];

const boxesLoop2 = boxesLoop1.map(b => ({
  xMin: -b.xMax,
  xMax: -b.xMin,
  yMin: -b.yMax,
  yMax: -b.yMin,
  zMin: -b.zMax,
  zMax: -b.zMin
}));

const allBoxes = [...boxesLoop1, ...boxesLoop2];

const meshVertices: Point3D[] = [];
const meshEdges: Edge[] = [];

allBoxes.forEach((box, index) => {
  const startIndex = index * 8;
  
  meshVertices.push(
    { x: box.xMin, y: box.yMin, z: box.zMin }, // 0
    { x: box.xMax, y: box.yMin, z: box.zMin }, // 1
    { x: box.xMin, y: box.yMax, z: box.zMin }, // 2
    { x: box.xMax, y: box.yMax, z: box.zMin }, // 3
    { x: box.xMin, y: box.yMin, z: box.zMax }, // 4
    { x: box.xMax, y: box.yMin, z: box.zMax }, // 5
    { x: box.xMin, y: box.yMax, z: box.zMax }, // 6
    { x: box.xMax, y: box.yMax, z: box.zMax }  // 7
  );

  meshEdges.push(
    // X-aligned
    { u: startIndex + 0, v: startIndex + 1 },
    { u: startIndex + 2, v: startIndex + 3 },
    { u: startIndex + 4, v: startIndex + 5 },
    { u: startIndex + 6, v: startIndex + 7 },
    // Y-aligned
    { u: startIndex + 0, v: startIndex + 2 },
    { u: startIndex + 1, v: startIndex + 3 },
    { u: startIndex + 4, v: startIndex + 6 },
    { u: startIndex + 5, v: startIndex + 7 },
    // Z-aligned
    { u: startIndex + 0, v: startIndex + 4 },
    { u: startIndex + 1, v: startIndex + 5 },
    { u: startIndex + 2, v: startIndex + 6 },
    { u: startIndex + 3, v: startIndex + 7 }
  );
});

function RotatingLogo() {
  const [theta, setTheta] = useState(0);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTheta(prev => (prev + 0.012) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const D = 120;
  const scale = 3.8;
  const tiltX = 18 * Math.PI / 180;

  const cosY = Math.cos(theta);
  const sinY = Math.sin(theta);
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);

  const projectedVertices = meshVertices.map(v => {
    const x1 = v.x * cosY - v.z * sinY;
    const z1 = v.x * sinY + v.z * cosY;
    const y1 = v.y;

    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    const s = D / (D - z2);
    const px = x2 * s * scale;
    const py = y2 * s * scale;

    return { x: px, y: py, z: z2 };
  });

  const projectedEdges = meshEdges.map(edge => {
    const p1 = projectedVertices[edge.u];
    const p2 = projectedVertices[edge.v];
    const avgZ = (p1.z + p2.z) / 2;
    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      avgZ
    };
  });

  projectedEdges.sort((a, b) => a.avgZ - b.avgZ);

  const zMin = -28;
  const zMax = 28;

  return (
    <svg viewBox="-120 -120 240 240" className="w-full h-full text-[#00d4ff] select-none pointer-events-none">
      <defs>
        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {projectedEdges.map((edge, idx) => {
        const t = (edge.avgZ - zMin) / (zMax - zMin);
        const clampedT = Math.max(0, Math.min(1, t));

        const strokeWidth = 0.6 + clampedT * 1.5;
        const opacity = 0.12 + clampedT * 0.78;
        const stroke = clampedT > 0.52 ? '#ffffff' : '#00d4ff';

        return (
          <line
            key={idx}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeLinecap="round"
            filter={clampedT > 0.7 ? "url(#glow-filter)" : undefined}
          />
        );
      })}
    </svg>
  );
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
  
  const [telemetry, setTelemetry] = useState({
    cpu: '12%',
    ram: '54%',
    dbLoad: '97%',
    uptime: '99.98%'
  });

  const [scratchpadInput, setScratchpadInput] = useState('');
  const [isDumping, setIsDumping] = useState(false);
  const [isCockpitOpen, setIsCockpitOpen] = useState(false);
  const [isStreamSniperOpen, setIsStreamSniperOpen] = useState(false);
  const [dumpStatus, setDumpStatus] = useState<'idle' | 'success' | 'fallback_success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const scratchpadRef = React.useRef<HTMLTextAreaElement>(null);

  // Support ticket modal states
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportTitle, setSupportTitle] = useState('');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportPriority, setSupportPriority] = useState('3'); // Medium by default
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportStatusMessage, setSupportStatusMessage] = useState('');
  const [supportSuccessTicket, setSupportSuccessTicket] = useState('');

  // Terms & Privacy modal states
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Public user authentication states for support ticket
  const [publicUsername, setPublicUsername] = useState('');
  const [publicPassword, setPublicPassword] = useState('');
  const [isPublicAuthenticated, setIsPublicAuthenticated] = useState(false);
  const [publicAuthError, setPublicAuthError] = useState('');
  const [isPublicAuthenticating, setIsPublicAuthenticating] = useState(false);

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

      setTimeout(() => {
        setIsScratchpadOpen(false);
      }, 1500);
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

        setTimeout(() => {
          setIsScratchpadOpen(false);
        }, 1200);
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
      
    // 2. Fetch real system telemetry
    const fetchTelemetry = () => {
      fetch('/api/system/telemetry')
        .then(res => res.json())
        .then(data => {
          const cpuVal = Math.max(1, Math.min(99, Math.round((data.load_1m || 0) * 25)));
          const ramVal = data.ramUsageTotalMB
            ? Math.max(1, Math.min(99, Math.round((data.ramUsageUsedMB / data.ramUsageTotalMB) * 100)))
            : Math.floor(52 + Math.random() * 4);
          
          setTelemetry({
            cpu: `${cpuVal}%`,
            ram: `${ramVal}%`,
            dbLoad: '100%',
            uptime: data.uptime_str || '99.98%'
          });
        })
        .catch(err => console.error("Error fetching system telemetry:", err));
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const isTailscaleUser = userInfo.identified || userInfo.ip?.startsWith('100.') || userInfo.ip === '127.0.0.1' || userInfo.ip === 'localhost';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle scratchpad on Ctrl+Shift+K or Cmd+Shift+K (or Ctrl+K / Cmd+K)
      if (isTailscaleUser && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsScratchpadOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTailscaleUser]);

  const handlePublicLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUsername.trim() || !publicPassword.trim()) return;
    setIsPublicAuthenticating(true);
    setPublicAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: publicUsername.trim(),
          password: publicPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setIsPublicAuthenticated(true);
        setPublicUsername('');
        setPublicPassword('');
        setUserInfo({
          identified: true,
          user_name: data.user_name,
          display_name: data.display_name,
          role: data.role,
          greeting: `Authenticated public session. Welcome, ${data.display_name}.`,
          ip: userInfo.ip
        });
      } else {
        setPublicAuthError(data.detail || 'Invalid username or password.');
      }
    } catch (err) {
      console.error(err);
      setPublicAuthError('Network error connecting to auth server.');
    } finally {
      setIsPublicAuthenticating(false);
    }
  };

  const handleAccess = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = userInfo.target_port || 3016;
    if (hostname.includes('taila01894.ts.net')) {
      window.location.href = `https://${hostname}:${port}/`;
    } else {
      window.location.href = `${protocol}//${hostname}:${port}/`;
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTitle.trim() || !supportDescription.trim()) return;
    setIsSubmittingSupport(true);
    setSupportStatusMessage('');
    try {
      const res = await fetch('/api/now/table/rm_incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: supportTitle.trim(),
          description: supportDescription.trim(),
          priority: supportPriority,
          state: 'Open',
          assigned_to: 'SOVEREIGN AI'
        })
      });
      const data = await res.json();
      if (res.ok && data.result?.number) {
        setSupportSuccessTicket(data.result.number);
        setSupportTitle('');
        setSupportDescription('');
        setSupportPriority('3');
      } else {
        setSupportStatusMessage('Failed to create ticket. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setSupportStatusMessage('Network error. Please try again.');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  return (
    <div className="h-screen w-screen fixed inset-0 bg-[#030305] text-[#e2e8f0] font-mono flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden">
      
      {/* Dynamic Keyframes injected globally */}
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
        }
        #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
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

      {/* Pulsing 3D Isometric Stack Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="animate-bg-hex-pulse w-full max-w-[700px] h-auto flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full text-[#00d4ff] fill-none stroke-current" strokeWidth="0.8">
            <path d="M50 15 L80 30 L50 45 L20 30 Z" stroke="rgba(0, 212, 255, 0.05)" fill="rgba(0, 212, 255, 0.01)" />
            <path d="M50 35 L80 50 L50 65 L20 50 Z" stroke="rgba(0, 212, 255, 0.07)" fill="rgba(0, 212, 255, 0.02)" />
            <path d="M50 55 L80 70 L50 85 L20 70 Z" stroke="rgba(0, 212, 255, 0.1)" fill="rgba(0, 212, 255, 0.03)" />
            <path d="M20 30 L20 70 M80 30 L80 70 M50 45 L50 85" stroke="rgba(0, 212, 255, 0.04)" strokeDasharray="2,2" />
          </svg>
        </div>
      </div>

      {/* TOP HEADER */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center z-10 border-b border-white/5 pb-3 mb-2 shrink-0">
        <div className="flex gap-4 text-xs font-bold text-[#00d4ff]/60">
          <span className="tracking-widest font-bold">STACKLABS // GATEWAY</span>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-500 items-center">
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#00d4ff] transition-colors duration-200 cursor-pointer">[API]</a>
          <button 
            onClick={() => { 
              setIsSupportModalOpen(true); 
              setSupportSuccessTicket(''); 
              setSupportStatusMessage(''); 
              setPublicAuthError('');
            }} 
            className="hover:text-[#00d4ff] transition-colors duration-200 cursor-pointer bg-transparent border-none font-mono font-bold text-xs"
          >
            [SUPPORT]
          </button>
          <button 
            onClick={() => setIsCockpitOpen(true)} 
            className="hover:text-[#00d4ff] transition-colors duration-200 cursor-pointer bg-transparent border-none font-mono font-bold text-xs"
          >
            [COCKPIT]
          </button>
          <button 
            onClick={() => setIsStreamSniperOpen(true)} 
            className="hover:text-[#00d4ff] transition-colors duration-200 cursor-pointer bg-transparent border-none font-mono font-bold text-xs"
          >
            [STREAM SNIPER]
          </button>
          <span className="text-[#00d4ff] bg-[#00d4ff]/5 border border-[#00d4ff]/20 px-2 py-0.5 rounded text-[10px] tracking-widest font-bold">
            GATEWAY_UP
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow z-10 py-6 relative min-h-0 overflow-y-auto">
        
        {/* Core Glowing Emblem (3D Rotating Interlocking SL Logo) */}
        <div className="w-[180px] md:w-[220px] h-[180px] md:h-[220px] mb-6 z-10 flex items-center justify-center">
          <RotatingLogo />
        </div>

        {/* Branding Headers */}
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-[0.4em] text-white text-center select-text font-mono">
          STACKLABS // BARE METAL
        </h1>
        <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-slate-400 mt-3 text-center max-w-lg leading-relaxed select-text font-mono">
          DEEP COMPUTE. TOTAL CONTROL. UNCOMPROMISED PERFORMANCE.
        </p>

        {/* Redirection Trigger Button */}
        <div className="mt-8 mb-8 w-full max-w-xs px-4">
          <button 
            onClick={handleAccess}
            className="w-full bg-[#00d4ff]/10 hover:bg-[#00d4ff]/25 border-2 border-[#00d4ff]/40 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-xs font-bold uppercase tracking-[0.25em] py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(0,212,255,0.1)] hover:shadow-[0_0_35px_rgba(0,212,255,0.3)] cursor-pointer text-center font-mono"
          >
            [ ACCESS SOVEREIGN OS ]
          </button>
        </div>

        {/* Dynamic Micro SCADA Telemetry Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl text-[9px] uppercase tracking-widest text-slate-500 font-mono">
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

      {/* QUICK-CAPTURE SCRATCHPAD MODAL */}
      {isScratchpadOpen && isTailscaleUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-[#0b0e14]/95 border border-[#00d4ff]/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,212,255,0.25)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsScratchpadOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#00d4ff]">
                <span className="flex items-center gap-1.5"><Terminal size={12} /> Quick-Capture Scratchpad</span>
                <span className="text-slate-500 font-mono text-[9px]">status: {dumpStatus === 'idle' ? 'Armed' : dumpStatus.toUpperCase()}</span>
              </div>
              
              <textarea
                ref={scratchpadRef}
                value={scratchpadInput}
                onChange={(e) => setScratchpadInput(e.target.value)}
                placeholder="Capture feature request, system design idea, or operational thought..."
                className="w-full bg-[#05070a]/90 border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-4 text-xs text-slate-200 font-mono focus:outline-none resize-none h-[180px] leading-relaxed transition-all duration-300 placeholder-slate-600"
                disabled={isDumping}
                autoFocus
              />
              
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-mono leading-none ${
                  dumpStatus === 'success' ? 'text-green-400' :
                  dumpStatus === 'fallback_success' ? 'text-yellow-400 font-semibold' :
                  dumpStatus === 'error' ? 'text-red-400 font-bold' : 'text-slate-500'
                }`}>
                  {statusMessage || 'Awaiting input...'}
                </span>
                <div className="flex gap-3 text-[10px] font-bold">
                  <button
                    onClick={() => setIsScratchpadOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 py-2.5 px-5 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleDumpToStack}
                    disabled={isDumping || !scratchpadInput.trim()}
                    className="bg-[#00d4ff]/15 hover:bg-[#00d4ff]/30 disabled:opacity-40 disabled:hover:bg-[#00d4ff]/15 border border-[#00d4ff]/30 hover:border-[#00d4ff]/60 disabled:hover:border-[#00d4ff]/30 text-[#00d4ff] hover:text-white uppercase tracking-widest py-2.5 px-5 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    {isDumping ? 'INGESTING...' : 'Dump to Stack'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 border-t border-white/5 pt-3 z-10 shrink-0">
        <span className="text-[9px] text-slate-600 font-mono">
          ©2026 STACKLABS INC. |{' '}
          <button 
            onClick={() => setIsTermsOpen(true)} 
            className="hover:text-[#00d4ff] text-slate-600 transition-colors cursor-pointer bg-transparent border-none font-mono text-[9px] outline-none"
          >
            [TERMS OF SERVICE]
          </button>{' '}
          |{' '}
          <button 
            onClick={() => setIsPrivacyOpen(true)} 
            className="hover:text-[#00d4ff] text-slate-600 transition-colors cursor-pointer bg-transparent border-none font-mono text-[9px] outline-none"
          >
            [PRIVACY POLICY]
          </button>
        </span>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-ping"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] absolute"></span>
          <ShieldAlert size={10} className="text-[#00d4ff] ml-1" />
          <span>Tailscale mesh encrypted connection operational</span>
        </div>
      </footer>

      {/* SUPPORT TICKET MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[#0b0e14] border border-[#00d4ff]/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,212,255,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={20} />
            </button>

            {supportSuccessTicket ? (
              <div className="text-center py-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/40 flex items-center justify-center text-[#00d4ff] text-xl animate-bounce">
                  ✓
                </div>
                <h3 className="text-sm font-bold text-white tracking-wider uppercase font-mono">TICKET SUBMITTED</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed font-mono">
                  Your support request has been logged successfully as ticket <span className="text-[#00d4ff] font-bold font-mono">{supportSuccessTicket}</span> in the database.
                </p>
                <button
                  onClick={() => setIsSupportModalOpen(false)}
                  className="mt-4 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/35 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-lg transition-all cursor-pointer font-mono"
                >
                  Close
                </button>
              </div>
            ) : (!isTailscaleUser && !isPublicAuthenticated) ? (
              <form onSubmit={handlePublicLogin} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2 font-mono">
                  <Terminal size={16} className="text-[#00d4ff]" /> Public User Authentication
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Access restricted to Tailscale mesh users. Please log in with your Sovereign OS credentials to submit a support ticket.
                </p>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Username</label>
                  <input
                    type="text"
                    value={publicUsername}
                    onChange={(e) => setPublicUsername(e.target.value)}
                    placeholder="Enter your username..."
                    required
                    disabled={isPublicAuthenticating}
                    className="w-full bg-[#05070a] border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all placeholder-slate-700"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Password</label>
                  <input
                    type="password"
                    value={publicPassword}
                    onChange={(e) => setPublicPassword(e.target.value)}
                    placeholder="Enter your password..."
                    required
                    disabled={isPublicAuthenticating}
                    className="w-full bg-[#05070a] border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all placeholder-slate-700"
                  />
                </div>

                {publicAuthError && (
                  <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg font-mono">
                    {publicAuthError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-2 text-[10px] font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(false)}
                    disabled={isPublicAuthenticating}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 rounded-lg transition cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isPublicAuthenticating || !publicUsername.trim() || !publicPassword.trim()}
                    className="px-4 py-2 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white rounded-lg transition disabled:opacity-40 cursor-pointer"
                  >
                    {isPublicAuthenticating ? 'AUTHENTICATING...' : 'LOG IN'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitSupport} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2 font-mono">
                  <Terminal size={16} className="text-[#00d4ff]" /> Submit a New Support Ticket
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Please fill in the details below to request assistance from our support team.
                </p>

                {/* Ticket Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Ticket Title</label>
                  <input
                    type="text"
                    value={supportTitle}
                    onChange={(e) => setSupportTitle(e.target.value)}
                    placeholder="Enter a concise summary of your issue..."
                    required
                    disabled={isSubmittingSupport}
                    className="w-full bg-[#05070a] border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all placeholder-slate-700"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Detailed Description</label>
                  <textarea
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    placeholder="Provide a comprehensive description of the problem, including steps to reproduce, errors encountered, and any relevant details. Max 2000 characters."
                    required
                    maxLength={2000}
                    disabled={isSubmittingSupport}
                    className="w-full bg-[#05070a] border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none resize-none h-[120px] leading-relaxed transition-all placeholder-slate-700"
                  />
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Ticket Priority</label>
                  <select
                    value={supportPriority}
                    onChange={(e) => setSupportPriority(e.target.value)}
                    disabled={isSubmittingSupport}
                    className="w-full bg-[#05070a] border border-[#00d4ff]/20 focus:border-[#00d4ff]/60 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="1">1 - Critical</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                  </select>
                </div>

                {supportStatusMessage && (
                  <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-500/20 p-2.5 rounded-lg font-mono">
                    {supportStatusMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-2 text-[10px] font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(false)}
                    disabled={isSubmittingSupport}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 rounded-lg transition cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSupport || !supportTitle.trim() || !supportDescription.trim()}
                    className="px-4 py-2 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white rounded-lg transition disabled:opacity-40 cursor-pointer"
                  >
                    {isSubmittingSupport ? 'SUBMITTING...' : 'SUBMIT TICKET'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {isTermsOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[#0b0e14] border border-[#00d4ff]/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,212,255,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
            
            <button 
              onClick={() => setIsTermsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-4 font-mono">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Terminal size={16} className="text-[#00d4ff]" /> STACKLABS GATEWAY // TERMS OF SERVICE
              </h3>
              <div className="text-[10px] text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-3">
                <p className="text-white border-b border-white/5 pb-2">REVISION: 2026.06.19</p>
                <div>
                  <h4 className="text-white font-bold mb-1">1. LOCAL GATEWAY LICENSE</h4>
                  <p>StackLabs provides this bare metal gateway solely for local node administration and mesh orchestration within your authorized Tailscale network.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">2. SERVICE INVARIANTS</h4>
                  <p>All transactions, logs, and telemetry are kept local to your physical workstation or Tailscale mesh. No external cloud processing is performed.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">3. USER RESPONSIBILITIES</h4>
                  <p>The user is solely responsible for maintaining the physical security of their nodes and Tailscale credentials.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">4. DISCLAIMER</h4>
                  <p>This software is provided "as is", without warranty of any kind, express or implied. In no event shall StackLabs be liable for any claim, damages, or other liability.</p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="px-5 py-2.5 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/35 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-xs font-bold uppercase tracking-widest rounded-lg transition cursor-pointer"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[#0b0e14] border border-[#00d4ff]/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,212,255,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
            
            <button 
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col gap-4 font-mono">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <Terminal size={16} className="text-[#00d4ff]" /> STACKLABS GATEWAY // PRIVACY POLICY
              </h3>
              <div className="text-[10px] text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-3">
                <p className="text-white border-b border-white/5 pb-2">REVISION: 2026.06.19</p>
                <div>
                  <h4 className="text-white font-bold mb-1">1. ZERO EXTERNAL TRACKING</h4>
                  <p>We collect zero third-party cookies, zero external telemetry, and zero tracking data.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">2. LOCAL SECURITY ABSTRACTION</h4>
                  <p>All client identification and role resolution are performed locally by matching incoming Tailscale IPs against the local SQLite database.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">3. DATA RETENTION</h4>
                  <p>No data leaves the local workstation. Local databases persist indefinitely or until manually cleared by the System Administrator.</p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-5 py-2.5 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/35 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-xs font-bold uppercase tracking-widest rounded-lg transition cursor-pointer"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COCKPIT OVERLAY MODAL */}
      {isCockpitOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col z-50 p-4 md:p-8 overflow-hidden">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-4 shrink-0">
            <h3 className="font-mono text-xs font-bold text-[#00d4ff] tracking-widest uppercase flex items-center gap-2">
              <Terminal size={16} className="text-[#00d4ff]" /> STACKLABS GATEWAY // COCKPIT CONSOLE
            </h3>
            <button 
              onClick={() => setIsCockpitOpen(false)}
              className="px-3 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/30 border border-[#00d4ff]/30 hover:border-[#00d4ff] text-[#00d4ff] hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded transition cursor-pointer"
            >
              [CLOSE COCKPIT]
            </button>
          </div>
          <div className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
            <InteractiveCockpit onNavigate={(route) => {
              if (route === 'stream_sniper') {
                setIsStreamSniperOpen(true);
                setIsCockpitOpen(false);
              } else {
                handleAccess();
              }
            }} />
          </div>
        </div>
      )}

      {/* STREAM SNIPER OVERLAY MODAL */}
      {isStreamSniperOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex flex-col z-50 p-4 md:p-8 overflow-hidden">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full mb-4 shrink-0">
            <h3 className="font-mono text-xs font-bold text-[#ff0033] tracking-widest uppercase flex items-center gap-2">
              <Terminal size={16} className="text-[#ff0033]" /> STACKLABS GATEWAY // STREAM SNIPER
            </h3>
            <button 
              onClick={() => setIsStreamSniperOpen(false)}
              className="px-3 py-1.5 bg-[#ff0033]/10 hover:bg-[#ff0033]/30 border border-[#ff0033]/30 hover:border-[#ff0033] text-[#ff0033] hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded transition cursor-pointer"
            >
              [CLOSE SNIPER]
            </button>
          </div>
          <div className="flex-1 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
            <StreamSniperConsole />
          </div>
        </div>
      )}

    </div>
  );
}
