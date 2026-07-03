import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, Radio, ShieldAlert } from 'lucide-react';
import CitiFieldVector from './CitiFieldVector';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  color?: string;
  image?: string;
}

interface SovereignSportsDashboardProps {
  gameState: any;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  wsConnected: boolean;
  activeGamePk: string;
  availableGames: any[];
  setActiveGamePk: (pk: string) => void;
  isSwappingStream: boolean;
  activeOverlays?: {
    spideyWipe?: boolean;
    crimsonBleed?: boolean;
    fundiesGrid?: boolean;
    appleMask?: boolean;
    weedstackProtocol?: boolean;
    stacklabsProtocol?: boolean;
  };
  triggerOverlayChange?: (overlayName: string, active: boolean) => void;
  roster?: any[];
  selectedAdvocate: string | null;
  setSelectedAdvocate: (user: string | null) => void;
  soundboardPhrases: any[];
  triggerSoundboardPhrase: (phrase: any) => void;
  volumeLevel: number;
  keithTakeover: any;
  personalityMode?: string;
  pinEngineActive?: boolean;
  setPinEngineActive?: (active: boolean) => void;
}

const TEAM_NAMES: Record<string, string> = {
  "NYM": "METS",
  "PHI": "PHILLIES",
  "ATL": "BRAVES",
  "SF": "GIANTS",
  "OAK": "ATHLETICS",
  "LAD": "DODGERS",
  "NYY": "YANKEES",
  "CHC": "CUBS",
  "MIN": "TWINS",
  "DET": "TIGERS",
  "PIT": "PIRATES",
  "TEX": "RANGERS",
  "TOR": "BLUE JAYS",
  "MIA": "MARLINS",
  "COL": "ROCKIES",
  "SD": "PADRES",
  "MIL": "BREWERS",
  "CWS": "WHITE SOX",
  "BAL": "ORIOLES",
  "CIN": "REDS",
  "HOU": "ASTROS",
  "STL": "CARDINALS",
  "WSH": "NATIONALS",
  "ARI": "DIAMONDBACKS",
  "CLE": "GUARDIANS",
  "LAA": "ANGELS",
  "TB": "RAYS",
  "KC": "ROYALS",
  "SEA": "MARINERS",
  "BOS": "RED SOX"
};

const TEAM_COLORS: Record<string, { primary: string, secondary: string }> = {
  "NYM": { primary: "#002D62", secondary: "#FF5910" },
  "PHI": { primary: "#E81828", secondary: "#FFFFFF" },
  "ATL": { primary: "#13274F", secondary: "#E31837" },
  "SF": { primary: "#27251F", secondary: "#FD5A1E" },
  "OAK": { primary: "#003831", secondary: "#EFB21E" },
  "LAD": { primary: "#005A9C", secondary: "#A5ACAF" },
  "NYY": { primary: "#132448", secondary: "#C4CED4" },
  "CHC": { primary: "#0E3386", secondary: "#CC3433" },
  "MIN": { primary: "#002B5C", secondary: "#D31145" },
  "DET": { primary: "#0C2340", secondary: "#FA4616" },
  "PIT": { primary: "#FDB827", secondary: "#000000" },
  "TEX": { primary: "#003278", secondary: "#C0111F" },
  "TOR": { primary: "#132B5C", secondary: "#1D2D5C" },
  "MIA": { primary: "#00A3E0", secondary: "#EF3E42" },
  "COL": { primary: "#33006F", secondary: "#C4CED4" },
  "SD": { primary: "#2F241D", secondary: "#FFC72C" },
  "MIL": { primary: "#122853", secondary: "#FFC52F" },
  "CWS": { primary: "#000000", secondary: "#C4CED4" },
  "BAL": { primary: "#DF4601", secondary: "#000000" },
  "CIN": { primary: "#C6011F", secondary: "#000000" },
  "HOU": { primary: "#EB6E1F", secondary: "#002D62" },
  "STL": { primary: "#C41E3A", secondary: "#FEDB00" },
  "WSH": { primary: "#AB0003", secondary: "#142246" },
  "ARI": { primary: "#A71930", secondary: "#E3D4AD" },
  "CLE": { primary: "#0C2340", secondary: "#E31937" },
  "LAA": { primary: "#BA0021", secondary: "#003263" },
  "TB": { primary: "#092C5C", secondary: "#8FBCE6" },
  "KC": { primary: "#004687", secondary: "#C5B076" },
  "SEA": { primary: "#0C2C56", secondary: "#005C5C" },
  "BOS": { primary: "#BD3039", secondary: "#0C2340" }
};

interface TeamLogoProps {
  teamCode: string;
  size?: number;
  border?: string;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ teamCode, size = 28, border }) => {
  const code = (teamCode || 'AWY').toUpperCase();
  const colors = TEAM_COLORS[code] || { primary: "#1E293B", secondary: "#94A3B8" };
  const [hasError, setHasError] = useState(false);
  const logoUrl = `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${code.toLowerCase()}.png`;

  useEffect(() => {
    setHasError(false);
  }, [teamCode]);

  return (
    <div 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 70%)',
        border: border || `1.5px solid ${colors.secondary || 'rgba(255,255,255,0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}
    >
      {!hasError ? (
        <img 
          src={logoUrl} 
          alt={code} 
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '2px',
            boxSizing: 'border-box',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 3px rgba(255,255,255,0.5))'
          }}
        />
      ) : (
        <span 
          style={{ 
            fontSize: `${size * 0.4}px`, 
            fontWeight: '900', 
            color: '#FFF', 
            fontFamily: 'monospace' 
          }}
        >
          {code.slice(0, 2)}
        </span>
      )}
    </div>
  );
};

export default function SovereignSportsDashboard({
  gameState,
  messages,
  sendMessage,
  wsConnected,
  activeGamePk,
  activeOverlays = {},
  roster = [],
  selectedAdvocate,
  setSelectedAdvocate,
  soundboardPhrases,
  triggerSoundboardPhrase,
  volumeLevel,
  keithTakeover,
  personalityMode = 'Matchup Focus',
  pinEngineActive = false,
  setPinEngineActive,
}: SovereignSportsDashboardProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [feedMode, setFeedMode] = useState<'stream' | 'card'>('card');

  interface Pin {
    id: number;
    game_pk: string;
    x_pct: number;
    y_pct: number;
    author: string;
    comment: string;
    timestamp: string;
    status: string;
  }

  const [pins, setPins] = useState<Pin[]>([]);
  const [activePlacement, setActivePlacement] = useState<{ x_pct: number, y_pct: number } | null>(null);
  const [pinComment, setPinComment] = useState('');

  const fetchPins = async () => {
    try {
      const res = await fetch(`/api/pins?game_pk=${activeGamePk}`);
      const data = await res.json();
      if (data.status === 'success') {
        setPins(data.pins);
      }
    } catch (err) {
      console.error('[PinEngine] Failed to fetch pins:', err);
    }
  };

  useEffect(() => {
    fetchPins();
  }, [activeGamePk]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.pin-interactive-element')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setActivePlacement({ x_pct: x, y_pct: y });
    setPinComment('');
  };

  const handleSavePin = async () => {
    if (!activePlacement || !pinComment.trim()) return;
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_pk: activeGamePk,
          x_pct: activePlacement.x_pct,
          y_pct: activePlacement.y_pct,
          author: 'james',
          comment: pinComment.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActivePlacement(null);
        setPinComment('');
        fetchPins();
      }
    } catch (err) {
      console.error('[PinEngine] Failed to save pin:', err);
    }
  };

  const handleDeletePin = async (pinId: number) => {
    try {
      const res = await fetch(`/api/pins/${pinId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchPins();
      }
    } catch (err) {
      console.error('[PinEngine] Failed to delete pin:', err);
    }
  };

  useEffect(() => {
    if (personalityMode === 'Matchup Focus') {
      setFeedMode('card');
    } else if (personalityMode === 'Lounge') {
      setFeedMode('stream');
    }
  }, [personalityMode]);

  // Unused props references for linter compliance
  if (false && selectedAdvocate && setSelectedAdvocate && soundboardPhrases && triggerSoundboardPhrase && volumeLevel && setPinEngineActive) {
    console.log(selectedAdvocate, setSelectedAdvocate, soundboardPhrases, triggerSoundboardPhrase, volumeLevel, setPinEngineActive);
  }
  
  // WeedStack countdown state (420 seconds)
  const [weedSeconds, setWeedSeconds] = useState(420);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WeedStack Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (activeOverlays.weedstackProtocol) {
      interval = setInterval(() => {
        setWeedSeconds((prev) => (prev > 0 ? prev - 1 : 420));
      }, 1000);
    } else {
      setWeedSeconds(420);
    }
    return () => clearInterval(interval);
  }, [activeOverlays.weedstackProtocol]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to format inning details
  const getInningString = () => {
    if (!gameState) return 'Pre-Game';
    const num = gameState.inning || '1';
    const isTop = gameState.status_msg?.toLowerCase().includes('top') || true;
    return `${isTop ? '▲' : '▼'} Inning ${num}`;
  };

  const renderDiamond = () => {
    const isFirst = !!gameState.onFirst;
    const isSecond = !!gameState.onSecond;
    const isThird = !!gameState.onThird;
    const activeColor = '#FF5910'; // Mets Glow-Orange
    const inactiveFill = 'rgba(10, 15, 30, 0.6)';
    const inactiveStroke = 'rgba(255, 255, 255, 0.2)';
    return (
      <div style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 6px rgba(255,89,16,0.15))' }}>
          <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
          {/* Second Base */}
          <rect x="42" y="7" width="16" height="16" transform="rotate(45 50 15)" fill={isSecond ? activeColor : inactiveFill} stroke={isSecond ? activeColor : inactiveStroke} strokeWidth="2.5" />
          {/* Third Base */}
          <rect x="7" y="42" width="16" height="16" transform="rotate(45 15 50)" fill={isThird ? activeColor : inactiveFill} stroke={isThird ? activeColor : inactiveStroke} strokeWidth="2.5" />
          {/* First Base */}
          <rect x="77" y="42" width="16" height="16" transform="rotate(45 85 50)" fill={isFirst ? activeColor : inactiveFill} stroke={isFirst ? activeColor : inactiveStroke} strokeWidth="2.5" />
        </svg>
      </div>
    );
  };

  const renderIndicatorDots = (current: number, max: number, activeColor: string) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: max }).map((_, i) => (
          <span 
            key={i} 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: i < current ? activeColor : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${i < current ? activeColor : 'rgba(255, 255, 255, 0.25)'}`,
              boxShadow: i < current ? `0 0 6px ${activeColor}` : 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    );
  };

  const awayTeam = (gameState.away_team || 'AWY').toUpperCase();
  const homeTeam = (gameState.home_team || 'HME').toUpperCase();

  const leftColWidth = 
    personalityMode === 'Matchup Focus' ? '60%' :
    personalityMode === 'Lounge' ? '50%' :
    personalityMode === 'Analytics' ? '65%' :
    personalityMode === 'Gameday Sim' ? '50%' :
    personalityMode === 'Pennant Race' ? '60%' : '60%';

  const rightColWidth = 
    personalityMode === 'Matchup Focus' ? '40%' :
    personalityMode === 'Lounge' ? '50%' :
    personalityMode === 'Analytics' ? '35%' :
    personalityMode === 'Gameday Sim' ? '50%' :
    personalityMode === 'Pennant Race' ? '40%' : '40%';

  const panelAHeight = 
    personalityMode === 'Matchup Focus' ? '60%' :
    personalityMode === 'Lounge' ? '100%' :
    personalityMode === 'Analytics' ? '50%' :
    personalityMode === 'Gameday Sim' ? '40%' :
    personalityMode === 'Pennant Race' ? '50%' : '60%';

  const panelBHeight = 
    personalityMode === 'Matchup Focus' ? '40%' :
    personalityMode === 'Lounge' ? '0%' :
    personalityMode === 'Analytics' ? '50%' :
    personalityMode === 'Gameday Sim' ? '60%' :
    personalityMode === 'Pennant Race' ? '50%' : '40%';

  return (
    <div 
      className="sovereign-sports-dashboard" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#020617',
        color: '#F8FAFC',
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative'
      }}
    >
      {/* ────────────────────────────────────────────────────────────────────────
          1. ALL OVERLAYS LAYER CONTAINER
          ──────────────────────────────────────────────────────────────────────── */}
      
      {/* A. Crimson Bleed (3000ms transition to solid red) */}
      {activeOverlays.crimsonBleed && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: '#DC2626',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'crimsonPulse 3s forwards ease-in-out',
            pointerEvents: 'none'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 20px #000' }}>CRIMSON BLEED</h1>
            <p style={{ fontSize: '1.25rem', opacity: 0.8, fontWeight: 'bold' }}>CREATOR OVERRIDE SYSTEM ENGAGED</p>
          </div>
        </div>
      )}

      {/* B. Spidey Wipe (Bootleg swinging animation) */}
      {activeOverlays.spideyWipe && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9998,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Swinging Bootleg Spider */}
          <div 
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '300px',
              animation: 'spideySwing 2.5s ease-in-out infinite alternate'
            }}
          >
            {/* Thread */}
            <div style={{ width: '2px', height: '220px', background: 'rgba(255,255,255,0.7)', margin: '0 auto' }} />
            {/* Felt Spider Body */}
            <div style={{
              width: '80px',
              height: '80px',
              background: '#EF4444',
              borderRadius: '50%',
              border: '4px solid #1E3A8A',
              position: 'relative',
              boxShadow: '0 10px 15px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Giant googly eyes */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', background: '#FFF', borderRadius: '50%', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: '#000', borderRadius: '50%' }} />
                </div>
                <div style={{ width: '20px', height: '20px', background: '#FFF', borderRadius: '50%', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: '#000', borderRadius: '50%' }} />
                </div>
              </div>
              {/* Spider Legs */}
              <div className="spider-legs" />
            </div>
          </div>
        </div>
      )}

      {/* C. WeedStack Protocol (Lavender Fog + 420 Countdown) */}
      {activeOverlays.weedstackProtocol && (
        <>
          {/* Lavender Fog Layers */}
          <div className="lavender-fog" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 990 }} />
          {/* Top Countdown */}
          <div 
            style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(168, 85, 247, 0.9)',
              border: '2px solid #C084FC',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)',
              borderRadius: '30px',
              padding: '8px 24px',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#FFF',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              animation: 'pulseGlow 2s infinite'
            }}
          >
            <span>🍀 WEEDSTACK DECOMPRESSION COUNTDOWN:</span>
            <span style={{ color: '#00FFCC', textShadow: '0 0 8px #00FFCC' }}>{formatTime(weedSeconds)}</span>
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          2. HEADER PANEL (Baseball Scoreboard Widget)
          ──────────────────────────────────────────────────────────────────────── */}
      <div 
        style={{
          height: '110px',
          background: 'radial-gradient(circle at top, rgba(16, 24, 48, 0.85) 0%, rgba(9, 13, 26, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0, 180, 216, 0.25)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 20px rgba(0, 180, 216, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          flexShrink: 0,
          zIndex: 50,
          boxSizing: 'border-box'
        }}
      >
        {/* Left Section: Title & Connection Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 
              style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: '#FFF',
                margin: 0,
                textShadow: '0 0 15px rgba(0, 180, 216, 0.5)',
                background: 'linear-gradient(90deg, #FFF 0%, #00F0FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '1px'
              }}
            >
              Sovereign Sports
            </h1>
            {wsConnected ? (
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(0, 255, 204, 0.1)',
                  border: '1px solid rgba(0, 255, 204, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  color: '#00FFCC',
                  fontWeight: 'bold',
                  boxShadow: '0 0 8px rgba(0, 255, 204, 0.2)',
                  animation: 'pulseLive 2s infinite'
                }}
              >
                <Radio size={10} style={{ animation: 'pulseLive 1s infinite' }} /> LIVE
              </span>
            ) : (
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  color: '#EF4444',
                  fontWeight: 'bold'
                }}
              >
                <ShieldAlert size={10} /> OFFLINE
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'bold', letterSpacing: '2px' }}>
            COMMAND CONSOLE v1.0.8
          </span>
        </div>

        {/* Center Section: High-Fidelity Glassmorphic Scoreboard */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(0, 180, 216, 0.2)',
            borderRadius: '12px',
            padding: '0.5rem 1.5rem',
            height: '76px',
            gap: '1.5rem',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.3)',
            boxSizing: 'border-box'
          }}
        >
          {/* Matchup & Scores */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Away Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TeamLogo teamCode={awayTeam} size={28} />
              <span style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.5px', color: '#FFF' }}>
                {awayTeam}
              </span>
            </div>

            {/* Scores indicator */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '4px 12px',
                fontFamily: 'monospace',
                fontSize: '1.35rem',
                fontWeight: 'bold',
                gap: '8px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <span style={{ color: '#00F0FF', textShadow: '0 0 8px rgba(0, 240, 255, 0.6)' }}>
                {gameState.away_score}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>-</span>
              <span style={{ color: '#FF9E0B', textShadow: '0 0 8px rgba(255, 158, 11, 0.6)' }}>
                {gameState.home_score}
              </span>
            </div>

            {/* Home Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.5px', color: '#FFF' }}>
                {homeTeam}
              </span>
              <TeamLogo teamCode={homeTeam} size={28} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Base Paths Diagram */}
          {renderDiamond()}

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Count & Outs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', width: '12px' }}>B</span>
              {renderIndicatorDots(gameState.balls || 0, 3, '#10B981')}
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {gameState.balls}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', width: '12px' }}>S</span>
              {renderIndicatorDots(gameState.strikes || 0, 2, '#EF4444')}
              <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {gameState.strikes}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', width: '12px' }}>O</span>
              {renderIndicatorDots(gameState.outs || 0, 2, '#FBBF24')}
              <span style={{ fontSize: '0.65rem', color: '#FBBF24', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {gameState.outs}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Inning details */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00F0FF', textShadow: '0 0 6px rgba(0, 240, 255, 0.3)' }}>
              {getInningString()}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              PITCH COUNT: {gameState.pitchCount || '-'}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Radar Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#FF9E0B', fontFamily: 'monospace', textShadow: '0 0 6px rgba(255, 158, 11, 0.3)' }}>
                {gameState.pitch_speed && gameState.pitch_speed !== '---' ? gameState.pitch_speed : '0'}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'bold' }}>MPH</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#FFF', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
              {gameState.pitch_name || 'NO PITCH'}
            </span>
          </div>
        </div>

        {/* Right Section: Roster info & Export shortcut */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>ROSTER: </span>
              <span style={{ color: '#FFF', fontWeight: 'bold' }}>{roster.length} Advocates</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>GAME PK: </span>
              <span style={{ color: '#FFF', fontWeight: 'bold' }}>{activeGamePk}</span>
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            STADIUM: {gameState.home_team === 'NYM' ? 'CITI FIELD' : (gameState.home_team === 'SF' ? 'ORACLE PARK' : 'BALLPARK')}
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          3. MAIN ASYMMETRIC 3-PANEL GRID
          ──────────────────────────────────────────────────────────────────────── */}
      <div 
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          height: 'calc(100% - 110px)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Left Column (60% width): Panel A (Video) + Panel B (Field Vector) */}
        <div 
          id="sports-dashboard-left-col"
          style={{
            width: leftColWidth,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* Panel A (Top Left: 60% height): Live Video Player */}
          <div 
            style={{
              height: panelAHeight,
              width: '100%',
              background: '#000',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              boxSizing: 'border-box'
            }}
          >
            {/* Custom Video Player or Livestream Mock */}
            <div 
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '100%',
                aspectRatio: '16/9',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {/* Virtual Video Feed Canvas */}
              <div 
                style={{
                  width: '90%',
                  height: '90%',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  background: '#090D1A',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* Simulated baseball broadcast graphic */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                  <div style={{ background: '#002D62', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: `1px solid ${feedMode === 'card' ? '#00FFCC' : '#FD5A1E'}` }}>
                    {gameState?.away_team?.toUpperCase() || 'AWY'}
                  </div>
                  <div style={{ background: '#1F2937', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #9CA3AF' }}>
                    {gameState?.home_team?.toUpperCase() || 'HME'}
                  </div>
                </div>

                {/* Mode Selector Toggle (Goal 3) */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                  <button 
                    onClick={() => setFeedMode(prev => prev === 'stream' ? 'card' : 'stream')}
                    style={{
                      background: 'rgba(0, 255, 204, 0.1)',
                      border: '1px solid rgba(0, 255, 204, 0.3)',
                      borderRadius: '4px',
                      color: '#00FFCC',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 255, 204, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 255, 204, 0.1)'; }}
                  >
                    {feedMode === 'stream' ? '⚾ Show At-Bat Card' : '📺 Show Broadcast Feed'}
                  </button>
                </div>

                {feedMode === 'stream' ? (
                  /* Stream mode rendering */
                  <div style={{ textAlign: 'center', zIndex: 5 }}>
                    <Activity size={36} color="#FD5A1E" style={{ margin: '0 auto 12px auto', animation: 'pulse-live 1.5s infinite' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>
                      LIVE {gameState?.home_team ? (
                        TEAM_NAMES[gameState.home_team.toUpperCase()] || gameState.home_team.toUpperCase()
                      ) : 'METS'} BROADCAST STREAM
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                      Sovereign TV Feed • HD Live Stream PK:{activeGamePk}
                    </div>
                  </div>
                ) : (
                  /* High-Fidelity Baseball Card mode (Goal 1 & 2) */
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    zIndex: 5,
                    background: 'rgba(11, 15, 25, 0.75)',
                    backdropFilter: 'blur(8px)',
                    overflowY: 'auto'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingBottom: '0.75rem',
                      marginBottom: '1rem',
                      width: '100%',
                      marginTop: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'rgba(0, 255, 204, 0.1)',
                          color: '#00FFCC',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          border: '1px solid rgba(0, 255, 204, 0.3)',
                          boxShadow: '0 0 10px rgba(0, 255, 204, 0.15)'
                        }}>
                          AT-BAT MATCHUP CARD
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#FF9E0B', fontWeight: 'bold' }}>
                        {gameState?.pitch_name || '---'} {gameState?.pitch_speed && gameState?.pitch_speed !== '---' ? `(${gameState.pitch_speed} mph)` : ''}
                      </div>
                    </div>

                    {/* Side-by-Side Cards */}
                    <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0, width: '100%' }}>
                      
                      {/* Batter Card (Offense) */}
                      <div style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#002D62',
                          color: '#FFF',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          BATTER
                        </div>
                        <img 
                          src={`/api/persona_image/${gameState?.batter_id || gameState?.batter || '605141'}`}
                          alt={gameState?.batter || 'Batter'}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '3px solid #FD5A1E',
                            boxShadow: '0 0 15px rgba(253, 90, 30, 0.3)',
                            marginBottom: '0.5rem',
                            objectFit: 'cover',
                            background: '#0B0F19'
                          }}
                        />
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF', textAlign: 'center', marginBottom: '8px' }}>
                          {gameState?.batter || 'Awaiting Batter'}
                        </div>
                        
                        {/* Stats Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '6px',
                          width: '100%',
                          marginTop: '4px'
                        }}>
                          {[
                            { label: 'AVG', val: gameState?.batter_avg || '.265' },
                            { label: 'OBP', val: gameState?.batter_obp || '.340' },
                            { label: 'SLG', val: gameState?.batter_slg || '.450' },
                            { label: 'OPS', val: gameState?.batter_ops || '.790' },
                            { label: 'HR', val: gameState?.batter_hr || '12' },
                            { label: 'RBI', val: gameState?.batter_rbi || '45' }
                          ].map((stat, idx) => (
                            <div key={idx} style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '4px',
                              padding: '4px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{stat.label}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00FFCC', fontFamily: 'monospace' }}>{stat.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pitcher Card (Defense) */}
                      <div style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#002D62',
                          color: '#FFF',
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          PITCHER
                        </div>
                        <img 
                          src={`/api/persona_image/${gameState?.pitcher_id || gameState?.pitcher || '547888'}`}
                          alt={gameState?.pitcher || 'Pitcher'}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '3px solid #00FFCC',
                            boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)',
                            marginBottom: '0.5rem',
                            objectFit: 'cover',
                            background: '#0B0F19'
                          }}
                        />
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF', textAlign: 'center', marginBottom: '8px' }}>
                          {gameState?.pitcher || 'Awaiting Pitcher'}
                        </div>

                        {/* Stats Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '6px',
                          width: '100%',
                          marginTop: '4px'
                        }}>
                          {[
                            { label: 'ERA', val: gameState?.pitcher_era || '3.75' },
                            { label: 'WHIP', val: gameState?.pitcher_whip || '1.18' },
                            { label: 'W-L', val: (gameState?.pitcher_wins || gameState?.pitcher_losses) ? `${gameState.pitcher_wins}-${gameState.pitcher_losses}` : '6-4' },
                            { label: 'SO', val: gameState?.pitcher_so || '85' },
                            { label: 'IP', val: gameState?.pitcher_ip || '72.0' },
                            { label: 'PITCH', val: `${gameState?.balls || 0}-${gameState?.strikes || 0}` }
                          ].map((stat, idx) => (
                            <div key={idx} style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '4px',
                              padding: '4px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{stat.label}</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#FD5A1E', fontFamily: 'monospace' }}>{stat.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Video watermarks */}
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                  REC [●] // DECORUM: {roster.length}
                </div>

                {/* StackLabs Protocol (Blueprint Overlay) */}
                {activeOverlays.stacklabsProtocol && (
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: '4px double #00FFCC',
                      background: 'rgba(0, 50, 80, 0.15)',
                      backgroundImage: 'linear-gradient(rgba(0,255,204,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.08) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                      zIndex: 100,
                      padding: '16px',
                      boxSizing: 'border-box',
                      color: '#00FFCC',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #00FFCC', paddingBottom: '4px', marginBottom: '8px' }}>
                        📊 STACKLABS STRUCTURAL ANALYTICS (SYS_ID: {activeGamePk})
                      </div>
                      <div>CORE RUNTIME: OK</div>
                      <div>M.A.R.D. TELEMETRY LATENCY: 4.2ms</div>
                      <div>BOGGS TOXICITY INDEX: COLD STATUS</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px', borderRadius: '4px', border: '1px solid #00FFCC' }}>
                      <div className="terminal-line-1">≫ ANALYZING METS FUNDAMENTALS... NOMINAL STATE</div>
                      <div className="terminal-line-2">≫ UMP_DECISION_MATRIX: JAKE TAYLOR UMP ACTIVE</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel B (Bottom Left: 40% height): CitiFieldVector */}
          <div 
            style={{
              height: panelBHeight,
              width: '100%',
              padding: panelBHeight === '0%' ? '0' : '0.5rem',
              boxSizing: 'border-box',
              position: 'relative',
              display: panelBHeight === '0%' ? 'none' : 'block'
            }}
          >
            {/* Fundies Grid (Neon Green Arcade Grid over Vector Field) */}
            {activeOverlays.fundiesGrid && (
              <div 
                style={{
                  position: 'absolute',
                  inset: '8px',
                  border: '2px solid #10B981',
                  background: 'rgba(16, 185, 129, 0.04)',
                  backgroundImage: 'linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)',
                  backgroundSize: '15px 15px',
                  zIndex: 200,
                  pointerEvents: 'none',
                  borderRadius: '12px',
                  animation: 'matrixPulse 1.5s infinite alternate'
                }}
              />
            )}

            <CitiFieldVector 
              onFirst={gameState.onFirst}
              onSecond={gameState.onSecond}
              onThird={gameState.onThird}
              lastPlayEvent={gameState.status_msg}
              homeTeam={gameState?.home_team || ''}
            />

            {/* Pin Engine Overlay Layer */}
            {pinEngineActive && (
              <div 
                className="pin-engine-overlay-container"
                onClick={handleOverlayClick}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 210,
                  cursor: 'crosshair',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Visual indicator glow for active placement mode */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid rgba(253, 90, 30, 0.4)',
                  boxShadow: 'inset 0 0 15px rgba(253, 90, 30, 0.08)',
                  pointerEvents: 'none',
                  animation: 'pinOverlayPulse 2s infinite alternate'
                }} />

                {/* Render Saved Pins */}
                {pins.map((pin) => (
                  <div 
                    key={pin.id}
                    className="pin-interactive-element"
                    style={{
                      position: 'absolute',
                      left: `${pin.x_pct}%`,
                      top: `${pin.y_pct}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 220
                    }}
                  >
                    {/* Glowing Pin Dot */}
                    <div 
                      className="pin-marker-dot"
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#FD5A1E',
                        border: '2px solid #FFF',
                        boxShadow: '0 0 8px #FD5A1E',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                    
                    {/* Pin Tooltip */}
                    <div 
                      className="pin-tooltip"
                      style={{
                        position: 'absolute',
                        bottom: '18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(253, 90, 30, 0.4)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        color: '#FFF',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        minWidth: '120px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#FD5A1E' }}>@{pin.author}</span>
                        <button
                          onClick={() => handleDeletePin(pin.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            padding: 0
                          }}
                        >
                          delete
                        </button>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.85)' }}>{pin.comment}</div>
                    </div>
                  </div>
                ))}

                {/* Render active placement form */}
                {activePlacement && (
                  <div 
                    className="pin-interactive-element"
                    style={{
                      position: 'absolute',
                      left: `${activePlacement.x_pct}%`,
                      top: `${activePlacement.y_pct}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 230
                    }}
                  >
                    {/* Temporary Marker Dot */}
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#00FFCC',
                      border: '2px solid #FFF',
                      boxShadow: '0 0 8px #00FFCC'
                    }} />

                    {/* Form Popup */}
                    <div style={{
                      position: 'absolute',
                      bottom: '18px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '1px solid #00FFCC',
                      padding: '8px',
                      borderRadius: '8px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      minWidth: '160px'
                    }}>
                      <input 
                        type="text"
                        placeholder="Add annotation..."
                        value={pinComment}
                        onChange={(e) => setPinComment(e.target.value)}
                        style={{
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: '#FFF',
                          fontSize: '0.7rem',
                          padding: '4px 6px',
                          outline: 'none'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePin();
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          onClick={() => setActivePlacement(null)}
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#AAA',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSavePin}
                          style={{
                            background: 'linear-gradient(90deg, #FD5A1E, #FF7A00)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#FFF',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {keithTakeover && keithTakeover.active && (
              <div 
                className="keith-takeover-layer"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 250,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  borderRadius: '12px'
                }}
              >
                <video 
                  src={keithTakeover.mediaUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 5,
                    opacity: 0.85
                  }}
                />
                <img 
                  src={keithTakeover.spriteUrl} 
                  alt="Go Sit Down!" 
                  style={{
                    height: '80%',
                    objectFit: 'contain',
                    zIndex: 10,
                    animation: 'slideUpAndDown 4.5s cubic-bezier(0.25, 1, 0.5, 1) forwards'
                  }}
                />
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes slideUpAndDown {
                    0% { transform: translateY(100%); }
                    15% { transform: translateY(0); }
                    85% { transform: translateY(0); }
                    100% { transform: translateY(100%); }
                  }
                `}} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column (40% width, 100% height): Panel C (Chat Reactor) */}
        <div 
          style={{
            width: rightColWidth,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0B0F19',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Apple Mask Fade (faded 15% opacity Home Run Apple behind chat) */}
          {activeOverlays.appleMask && (
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.12,
                fontSize: '15rem',
                color: '#EF4444',
                pointerEvents: 'none',
                zIndex: 1,
                textAlign: 'center',
                animation: 'pulseApple 4s infinite alternate'
              }}
            >
              🍎
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>LGM</div>
            </div>
          )}

          {/* Chat Header */}
          <div 
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>FanStack Chat Reactor</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{roster.length} Active Advocates Synchronized</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => window.open(`/api/game-log/export/${activeGamePk}?format=md`, '_blank')}
                  title="Export chat as Markdown"
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '4px',
                    color: '#38bdf8',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                >
                  MD
                </button>
                <button
                  onClick={() => window.open(`/api/game-log/export/${activeGamePk}?format=json`, '_blank')}
                  title="Export chat as JSON"
                  style={{
                    background: 'rgba(124, 58, 237, 0.1)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '4px',
                    color: '#c084fc',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'; }}
                >
                  JSON
                </button>
                <button
                  onClick={() => window.open(`/api/game-log/export/${activeGamePk}?format=csv`, '_blank')}
                  title="Export chat as CSV"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '4px',
                    color: '#22c55e',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; }}
                >
                  CSV
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span className="bullet-active" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFCC', display: 'inline-block' }} />
                <span style={{ fontSize: '0.7rem', color: '#00FFCC', fontWeight: 'bold', fontFamily: 'monospace' }}>STABLE</span>
              </div>
            </div>
          </div>

          {/* Chat Logs Reactor */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              zIndex: 5
            }}
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className="chat-message-bubble"
                style={{
                  background: msg.user === 'SYSTEM' ? 'rgba(10, 132, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: msg.user === 'SYSTEM' ? '1px solid rgba(10, 132, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span 
                    style={{ 
                      fontWeight: 'bold', 
                      color: msg.color || '#0A84FF',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem'
                    }}
                  >
                    @{msg.user}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{msg.time}</span>
                </div>
                <div style={{ color: '#E2E8F0' }}>{msg.text}</div>
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="attachment" 
                    style={{ 
                      maxWidth: '100%', 
                      borderRadius: '4px', 
                      marginTop: '8px', 
                      border: '1px solid rgba(255,255,255,0.1)' 
                    }} 
                  />
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Field */}
          <form 
            onSubmit={handleSendChat}
            style={{
              padding: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              gap: '0.5rem',
              zIndex: 10
            }}
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Inject advocate commentary..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFF',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00FFCC'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button 
              type="submit"
              style={{
                padding: '10px 16px',
                background: '#00FFCC',
                color: '#020617',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#00E6B8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#00FFCC'}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Custom Global Style Keyframe injections */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crimsonPulse {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; display: none; }
        }
        @keyframes spideySwing {
          0% { transform: translateX(-50%) rotate(-20deg); transform-origin: top center; }
          100% { transform: translateX(-50%) rotate(20deg); transform-origin: top center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.6); }
          50% { box-shadow: 0 0 35px rgba(168, 85, 247, 0.9); }
        }
        @keyframes pulseApple {
          from { transform: translate(-50%, -50%) scale(0.95); }
          to { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes matrixPulse {
          from { opacity: 0.7; }
          to { opacity: 1.0; }
        }
        @keyframes pulseLive {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
        .lavender-fog {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.15) 100%);
          animation: driftFog 10s infinite alternate linear;
        }
        @keyframes driftFog {
          from { transform: scale(1.0) translate(0, 0); }
          to { transform: scale(1.1) translate(10px, 5px); }
        }
      `}} />
    </div>
  );
}
