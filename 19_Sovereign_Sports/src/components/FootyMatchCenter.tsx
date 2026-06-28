import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Send, Tv 
} from 'lucide-react';

interface SoccerIncident {
  incident_id: string;
  match_minute: string;
  incident_type: string;
  leverage_delta: number;
  data_payload: string;
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  color: string;
}

interface Advocate {
  user_name: string;
  display_name: string;
  avatar_url: string;
  role: string;
  flavor_text: string;
  color: string;
}

export default function FootyMatchCenter() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      user: 'SYSTEM',
      text: '🏟️ Welcome to FootyStack Soccer Match Center. Roster synchronized with advocate_matrix.',
      time: '00:00',
      color: '#A78BFA'
    }
  ]);
  const [advocates] = useState<Advocate[]>([
    {
      user_name: 'proper_pinter',
      display_name: 'Proper Pinter',
      avatar_url: '/avatars/pinter.png',
      role: 'Traditionalist',
      flavor_text: 'Tackles should draw blood. Opposes VAR.',
      color: '#FB923C'
    },
    {
      user_name: 'expected_tears',
      display_name: 'Expected Tears',
      avatar_url: '/avatars/tears.png',
      role: 'Analyst',
      flavor_text: 'Crying over low-xG goals.',
      color: '#38BDF8'
    },
    {
      user_name: 'ultra_nip',
      display_name: 'Ultra Nip',
      avatar_url: '/avatars/nip.png',
      role: 'Hooligan Pyro',
      flavor_text: 'Smoke flares and conspiracy theories.',
      color: '#F43F5E'
    },
    {
      user_name: 'kit_collector_99',
      display_name: 'Kit Collector 99',
      avatar_url: '/avatars/kit.png',
      role: 'Fashionista',
      flavor_text: 'Vintage shirts & designer collabs.',
      color: '#10B981'
    }
  ]);
  const [activeAdvocate, setActiveAdvocate] = useState<string>('ultra_nip');
  const [incidents, setIncidents] = useState<SoccerIncident[]>([]);
  const [injectorPrompt, setInjectorPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('muppet');
  const [selectedMacroMode, setSelectedMacroMode] = useState('cinematic');
  const [injectorResult, setInjectorResult] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gameState] = useState({
    match_minute: 74,
    home_score: 2,
    away_score: 1,
    home_team: 'USA',
    away_team: 'ENG',
    possession_home: 54,
    xG_home: 1.82,
    xG_away: 1.15
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pitchCanvasRef = useRef<HTMLCanvasElement>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement>(null);
  const smokeParticles = useRef<any[]>([]);
  const smokeAnimationId = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load incidents from server
  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`/api/sports/footy/incidents?match_id=${gameId || 991002}`);
      if (Array.isArray(res.data)) {
        setIncidents(res.data);
      }
    } catch (err) {
      console.warn('Failed to load incident history', err);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!injectorPrompt.trim()) return;
    setIsOptimizing(true);
    try {
      const activeAdv = advocates.find(a => a.user_name === activeAdvocate);
      const res = await axios.post('/api/system/seeder/optimize', {
        raw_text: injectorPrompt,
        macro_mode: selectedMacroMode,
        style_sheet: selectedStyle,
        city_name: activeAdv?.user_name === 'proper_pinter' ? 'London' : 'Boston',
        character_description: activeAdv ? `${activeAdv.display_name} (${activeAdv.role})` : 'an anxious sports advocate'
      });
      if (res.data && res.data.status === 'SUCCESS') {
        setInjectorResult(res.data.optimized_prompt);
      } else {
        setInjectorResult(res.data?.optimized_prompt || 'Error: Optimization returned empty or failed status.');
      }
    } catch (err) {
      console.error('Failed to optimize prompt', err);
      setInjectorResult('Error: Failed to communicate with optimization engine.');
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Connect to local WebSocket
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const socketUrl = `${wsProtocol}//${wsHost}/mesh-ws?gamePk=${gameId || 'world_cup_usa_eng'}`;
    
    console.log(`[FootyMatchCenter] Connecting to WS: ${socketUrl}`);
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JOIN_ROOM', target_game_pk: gameId || 'world_cup_usa_eng', room: gameId || 'world_cup_usa_eng' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CHAT_MESSAGE' || msg.type === 'bot_message') {
          const newMsg: ChatMessage = {
            id: msg.id || String(Date.now() + Math.random()),
            user: msg.user || msg.persona || 'Advocate',
            text: msg.text || msg.message || '',
            time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            color: msg.color || '#38BDF8'
          };
          setMessages(prev => [...prev, newMsg]);

          // Trigger smoke flare if ultra_nip speaks
          if (newMsg.user.toLowerCase().includes('ultra_nip') || newMsg.text.includes('flare') || newMsg.text.includes('smoke')) {
            triggerSmokeFlare();
          }
        }
      } catch (err) {
        console.warn('WS message error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [gameId]);

  // Scroll Chat to Bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      user: 'james (Pilot)',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#A78BFA'
    };

    setMessages(prev => [...prev, newMsg]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        user: 'james (Pilot)',
        text: inputText,
        target_game_pk: gameId || 'world_cup_usa_eng'
      }));
    }

    // Quick mock chatbot trigger if no server backend response
    setTimeout(() => {
      triggerMockResponse(inputText);
    }, 1500);

    setInputText('');
  };

  const triggerMockResponse = (userInput: string) => {
    const text = userInput.toLowerCase();
    let reply = '';
    let author = 'proper_pinter';
    let color = '#FB923C';

    if (text.includes('tackle') || text.includes('ref') || text.includes('var')) {
      reply = "VAR is killing the soul of the terrace! Back in my day that slide tackle gets a pat on the back, not a red card!";
      author = 'proper_pinter';
      color = '#FB923C';
    } else if (text.includes('stats') || text.includes('xg') || text.includes('expected')) {
      reply = "Our transition matrix shows a 78% probability of conceding. The xG delta is absolutely indefensible.";
      author = 'expected_tears';
      color = '#38BDF8';
    } else if (text.includes('smoke') || text.includes('flare') || text.includes('pyro') || text.includes('win')) {
      reply = "LIGHT UP THE FLARES! NO PYRO NO PARTY! USA! USA!";
      author = 'ultra_nip';
      color = '#F43F5E';
      triggerSmokeFlare();
    } else if (text.includes('shirt') || text.includes('kit') || text.includes('jersey')) {
      reply = "That retro 94 knit collar is pure art. The typography on England's away kit is a masterclass in minimalist design.";
      author = 'kit_collector_99';
      color = '#10B981';
    } else {
      reply = "We dominate possession but lack clinical verticality in the final third.";
      author = 'expected_tears';
      color = '#38BDF8';
    }

    setMessages(prev => [...prev, {
      id: String(Date.now() + 1),
      user: author,
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color
    }]);
  };

  // Smoke Flare Particle System
  const triggerSmokeFlare = () => {
    if (!smokeCanvasRef.current) return;
    const canvas = smokeCanvasRef.current;
    
    // Seed new red/orange smoke particles
    for (let i = 0; i < 60; i++) {
      smokeParticles.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2.5 - 1.0,
        radius: Math.random() * 15 + 10,
        color: Math.random() > 0.4 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(251, 146, 60, 0.4)',
        life: 1.0,
        decay: Math.random() * 0.015 + 0.005
      });
    }
  };

  useEffect(() => {
    const canvas = smokeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    const animateSmoke = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const particles = smokeParticles.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.2;
        p.life -= p.decay;

        if (p.life <= 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      smokeAnimationId.current = requestAnimationFrame(animateSmoke);
    };

    animateSmoke();

    return () => {
      if (smokeAnimationId.current) {
        cancelAnimationFrame(smokeAnimationId.current);
      }
    };
  }, []);

  // Tactical Pitch Draw System
  useEffect(() => {
    const canvas = pitchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 320;

    let frame = 0;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballTargetX = canvas.width / 2;
    let ballTargetY = canvas.height / 2;

    const players = [
      { id: 1, team: 'home', x: 80, y: 160, baseAngle: 0 },
      { id: 2, team: 'home', x: 220, y: 80, baseAngle: Math.PI / 4 },
      { id: 3, team: 'home', x: 220, y: 240, baseAngle: -Math.PI / 4 },
      { id: 4, team: 'home', x: 380, y: 160, baseAngle: Math.PI },
      { id: 5, team: 'away', x: 520, y: 160, baseAngle: 0 },
      { id: 6, team: 'away', x: 380, y: 80, baseAngle: Math.PI / 3 },
      { id: 7, team: 'away', x: 380, y: 240, baseAngle: -Math.PI / 3 },
      { id: 8, team: 'away', x: 260, y: 160, baseAngle: Math.PI * 1.5 }
    ];

    const drawPitch = () => {
      // Clear Pitch
      ctx.fillStyle = '#06170d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pitch Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Center Line
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 10);
      ctx.lineTo(canvas.width / 2, canvas.height - 10);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Penalty Boxes
      ctx.strokeRect(10, canvas.height / 2 - 60, 50, 120);
      ctx.strokeRect(canvas.width - 60, canvas.height / 2 - 60, 50, 120);

      // Match state ball oscillation
      frame++;
      if (frame % 120 === 0) {
        // Randomly pass ball to a player
        const randPlayer = players[Math.floor(Math.random() * players.length)];
        ballTargetX = randPlayer.x + Math.sin(frame * 0.05) * 10;
        ballTargetY = randPlayer.y + Math.cos(frame * 0.05) * 10;
      }

      ballX += (ballTargetX - ballX) * 0.08;
      ballY += (ballTargetY - ballY) * 0.08;

      // Draw vectors / passes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.lineTo(ballX, ballY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Players
      players.forEach(p => {
        const offset = Math.sin(frame * 0.02 + p.baseAngle) * 12;
        const px = p.x + offset;
        const py = p.y + Math.cos(frame * 0.02 + p.baseAngle) * 8;

        ctx.fillStyle = p.team === 'home' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;

      requestAnimationFrame(drawPitch);
    };

    drawPitch();
  }, []);

  return (
    <div id="main-dashboard-viewport" className="sports-live-hub" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Banner */}
      <div className="vm-panel-glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/footy')} 
            className="btn-sovereign-tertiary"
            style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>LIVE WORLD CUP STREAM</span>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {gameState.home_team} {gameState.home_score} - {gameState.away_score} {gameState.away_team}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>MATCH MINUTE</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00ffcc', fontFamily: 'monospace' }}>{gameState.match_minute}'</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              xG {gameState.xG_home}
            </span>
            <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              xG {gameState.xG_away}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid 65/35 */}
      <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '1.5rem', flexGrow: 1 }}>
        
        {/* Left Side: 65% Main Pitch & Video Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Mock Video Container */}
          <div className="vm-panel-glass" style={{ height: '360px', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#090d16' }}>
            {/* Stream Canvas Mock */}
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #090d16 0%, #0c1527 100%)' }}>
              <Tv size={64} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '1rem' }} />
              <div style={{ position: 'absolute', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                USA vs ENGLAND - LIVE TERRACE BROADCAST
              </div>
            </div>

            {/* Video Controls overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Live Stream Telemetry Enabled</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', boxShadow: '0 0 8px #ff3b30' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>LATENCY: 1.2s</span>
              </div>
            </div>
          </div>

          {/* 2D Tactical Pitch Component */}
          <div className="vm-panel-glass" style={{ borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>2D TACTICAL PITCH MAP</span>
              <span style={{ fontSize: '0.8rem', color: '#00ffcc', fontWeight: 600 }}>Active Opta Event Stream</span>
            </div>
            <div style={{ width: '100%', height: '320px', borderRadius: '8px', overflow: 'hidden' }}>
              <canvas ref={pitchCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>

          {/* Momentum Sparkline Component */}
          <div className="vm-panel-glass" style={{ borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>MATCH MOMENTUM SPARKLINE (LEVERAGE DELTA)</span>
            <div style={{ height: '70px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-home" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0"/>
                  </linearGradient>
                  <linearGradient id="gradient-away" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal Baseline */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                
                {/* Momentum curves */}
                <path d="M 0 30 Q 80 10, 150 25 T 300 45 T 450 15 T 600 30" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 0 30 Q 80 45, 150 35 T 300 15 T 450 50 T 600 30" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              <span>Home Team Dominance (Cyan)</span>
              <span>Away Team Dominance (Pink)</span>
            </div>
          </div>

          {/* Incident Timeline */}
          <div className="vm-panel-glass" style={{ borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>LIVE MATCH INCIDENT LOG</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
              {incidents.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', padding: '0.5rem' }}>No recent match incidents recorded.</div>
              ) : (
                incidents.map(inc => {
                  let desc = '';
                  try {
                    const parsed = JSON.parse(inc.data_payload);
                    desc = parsed.description || '';
                  } catch (e) {
                    desc = inc.data_payload;
                  }
                  return (
                    <div 
                      key={inc.incident_id} 
                      onClick={() => {
                        setInjectorPrompt(`Soccer match event at minute ${inc.match_minute}: ${inc.incident_type} (${desc})`);
                      }}
                      className="clickable"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        fontSize: '0.8rem', 
                        padding: '0.5rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#00ffcc', fontWeight: 700 }}>{inc.match_minute}'</span>
                      <span style={{ marginLeft: '1rem', flexGrow: 1 }}>{inc.incident_type} {desc ? `- ${desc}` : ''}</span>
                      <span style={{ color: inc.leverage_delta > 0 ? '#38bdf8' : '#f43f5e' }}>LD: {inc.leverage_delta}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Side: 35% Terrace Chat & Advocate Swarm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Advocate Roster Matrix */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>ADVOCATE MATRIX SWARM</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {advocates.map(adv => (
                <div 
                  key={adv.user_name}
                  onClick={() => setActiveAdvocate(adv.user_name)}
                  className={`vm-panel-glass clickable`}
                  style={{ 
                    padding: '0.5rem', 
                    borderRadius: '8px', 
                    border: activeAdvocate === adv.user_name ? `1.5px solid ${adv.color}` : '1.5px solid rgba(255,255,255,0.06)',
                    background: activeAdvocate === adv.user_name ? 'rgba(255,255,255,0.04)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: adv.color }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>@{adv.user_name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{adv.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brooks Exception Prompt Injector */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
                🎭 BROOKS EXCEPTION PROMPT INJECTOR
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700 }}>PORT 8090 ACTIVE</span>
            </div>

            {/* Style Sheet Cartridge Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>VISUAL STYLE CARTRIDGE</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { id: 'muppet', label: 'Muppet Hell', color: '#10B981', border: '#059669' },
                  { id: 'cartoon', label: '90s Cartoon', color: '#38BDF8', border: '#0284C7' },
                  { id: 'cardboard', label: 'Cardboard Cutout', color: '#FB923C', border: '#EA580C' },
                  { id: 'pixel', label: '16-Bit Retro', color: '#F43F5E', border: '#E11D48' },
                  { id: 'print', label: 'Print Caricature', color: '#A78BFA', border: '#7C3AED' }
                ].map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: selectedStyle === style.id ? style.color : 'rgba(255,255,255,0.03)',
                      color: selectedStyle === style.id ? '#000' : 'rgba(255,255,255,0.7)',
                      border: `1.5px solid ${selectedStyle === style.id ? style.color : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedStyle === style.id ? `0 0 10px ${style.color}55` : 'none'
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Macro Mode Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>MACRO MODE</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'cinematic', label: 'Cinematic' },
                  { id: 'mixed_media', label: 'Mixed Media' },
                  { id: 'raw_entropy', label: 'Raw Entropy' },
                  { id: 'retro_16bit', label: 'Retro 16-Bit' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMacroMode(mode.id)}
                    style={{
                      padding: '0.4rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: selectedMacroMode === mode.id ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: selectedMacroMode === mode.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                      border: selectedMacroMode === mode.id ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>RAW PROMPT</span>
              <textarea
                value={injectorPrompt}
                onChange={e => setInjectorPrompt(e.target.value)}
                placeholder="Enter prompt (or click an incident to load)..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleOptimizePrompt}
              disabled={isOptimizing || !injectorPrompt.trim()}
              className="btn-sovereign-primary"
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: !injectorPrompt.trim() ? 0.5 : 1
              }}
            >
              {isOptimizing ? 'Optimizing Prompt...' : 'Optimize Prompt & Render'}
            </button>

            {/* Optimized Output Result */}
            {injectorResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#00ffcc', fontWeight: 600 }}>OPTIMIZED PROMPT:</span>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0, 255, 204, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    lineHeight: '1.4',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    borderLeft: '3px solid #00ffcc'
                  }}
                >
                  {injectorResult}
                </div>
              </div>
            )}
          </div>

          {/* Terrace Chat Balcony */}
          <div className="vm-panel-glass" style={{ flexGrow: 1, borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '480px', position: 'relative' }}>
            
            {/* Particle smoke overlay */}
            <canvas 
              ref={smokeCanvasRef} 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none', 
                zIndex: 5 
              }} 
            />

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              style={{ 
                flexGrow: 1, 
                padding: '1.25rem', 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.85rem',
                zIndex: 10
              }}
            >
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: msg.color }}>
                      {msg.user}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                      {msg.time}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '8px', 
                    borderLeft: `2.5px solid ${msg.color}`,
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input form */}
            <form 
              onSubmit={handleSendMessage}
              style={{ 
                padding: '0.75rem 1rem', 
                borderTop: '1px solid rgba(255,255,255,0.06)', 
                display: 'flex', 
                gap: '0.5rem',
                background: 'rgba(0,0,0,0.15)',
                zIndex: 10
              }}
            >
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Talk to the swarm matrix..."
                style={{ 
                  flexGrow: 1, 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  padding: '0.5rem 0.75rem', 
                  color: '#fff', 
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                className="btn-sovereign-primary"
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={16} />
              </button>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
