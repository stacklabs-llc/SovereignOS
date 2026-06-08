import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import axios from 'axios';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Radio, Activity, 
  Phone, PhoneOff, Send, MessageSquare, Users 
} from 'lucide-react';

interface InningDetail {
  num: number;
  ordinalNum: string;
  home: { runs: number; hits: number; errors: number; leftOnBase: number };
  away: { runs: number; hits: number; errors: number; leftOnBase: number };
}

interface RecentPlay {
  inning: string;
  event: string;
  description: string;
}

interface GameState {
  game_pk: number;
  away_team: string;
  home_team: string;
  away_score: number;
  home_score: number;
  inning: string;
  outs: number;
  balls: number;
  strikes: number;
  pitcher: string;
  batter: string;
  pitch_name: string;
  pitch_speed: number;
  hit_speed: number;
  hit_distance: number;
  status_msg: string;
  innings_detail: InningDetail[];
  recent_plays: RecentPlay[];
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isPersona: boolean;
  color?: string;
}

export default function VideoPlayer() {
  const { gameId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Split-Screen & Tavern Chat states
  const [activeTab, setActiveTab] = useState<'feed' | 'chat'>('feed');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      user: 'Scruffy (Bartender)', 
      text: "Welcome to Scruffy's Tavern. Tag a fan with @ (like @barf, @dot, or @uncle_stevie) to start the chat. Now buy a drink or get out.", 
      time: 'Now', 
      isPersona: true, 
      color: '#8B4513' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [roomPersonas, setRoomPersonas] = useState<string[]>(['@barf', '@dot', '@uncle_stevie', '@coach_shrubbs', '@scruffy', '@wardy']);
  const [showMentions, setShowMentions] = useState(false);
  const [filteredPersonas, setFilteredPersonas] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // HoloLink WebRTC Calling states
  const [activeCall, setActiveCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // 1. Initial REST loads
  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await axios.get(`/api/stream/${gameId}`);
        setStreamUrl(response.data.m3u8_url);
      } catch (err) {
        console.error('Failed to get stream url', err);
      }
    };

    const fetchInitialGameState = async () => {
      try {
        const response = await axios.get(`/api/sports/game_state/${gameId}`);
        setGameState(response.data);
      } catch (err) {
        console.warn('Failed to load initial cache game state:', err);
      }
    };

    const fetchRoomPersonas = async () => {
      try {
        const response = await axios.get(`/api/room_personas?gamePk=${gameId}`);
        if (response.data && response.data.personas && response.data.personas.length > 0) {
          setRoomPersonas(response.data.personas);
        }
      } catch (err) {
        console.warn('Failed to load room personas, using defaults');
      }
    };

    if (gameId) {
      fetchStream();
      fetchInitialGameState();
      fetchRoomPersonas();
    }
  }, [gameId]);

  // 2. Video Player Native Setup (HLS.js / Safari native HLS)
  useEffect(() => {
    if (streamUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.warn('Autoplay blocked', e));
          setIsPlaying(true);
        });

        return () => {
          hls.destroy();
        };
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play().catch(e => console.warn('Autoplay blocked', e));
          setIsPlaying(true);
        });
      }
    }
  }, [streamUrl]);

  // 3. M.A.R.D Telemetry WebSocket (Port 8008 Proxy)
  useEffect(() => {
    if (!gameId) return;

    let ws: WebSocket | null = null;
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`Connecting to M.A.R.D Telemetry WS: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to M.A.R.D Telemetry WS Relay');
        setWsConnected(true);
        ws?.send(JSON.stringify({ type: 'JOIN_ROOM', room: gameId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'STATE_UPDATE' && msg.target_game_pk === gameId && msg.data) {
            console.log('Telemetry state update received:', msg.data);
            setGameState(msg.data);
          }
        } catch (e) {
          console.error('Error parsing M.A.R.D state message', e);
        }
      };

      ws.onclose = () => {
        console.log('M.A.R.D Telemetry WS disconnected. Reconnecting...');
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = (err) => {
        console.error('M.A.R.D WS error:', err);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [gameId]);

  // 4. Remote Control Command WebSocket (Port 8090 Proxy)
  useEffect(() => {
    let theaterWs: WebSocket | null = null;
    const connectTheater = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/theater`;
      console.log(`Connecting to Theater Remote WS: ${wsUrl}`);
      theaterWs = new WebSocket(wsUrl);

      theaterWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'THEATER_COMMAND') {
            const cmd = data.command;
            console.log(`Remote command received: ${cmd}`);
            
            if (videoRef.current) {
              if (cmd === 'pause') {
                if (videoRef.current.paused) {
                  videoRef.current.play().catch(console.warn);
                  setIsPlaying(true);
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              } else if (cmd === 'seek_fwd') {
                videoRef.current.currentTime += 10;
              } else if (cmd === 'seek_back') {
                videoRef.current.currentTime -= 10;
              } else if (cmd === 'quit') {
                navigate('/mlb');
              } else if (cmd === 'volume_up') {
                videoRef.current.volume = Math.min(videoRef.current.volume + 0.1, 1.0);
                setIsMuted(false);
              } else if (cmd === 'volume_down') {
                videoRef.current.volume = Math.max(videoRef.current.volume - 0.1, 0.0);
              } else if (cmd === 'mute') {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse remote command', e);
        }
      };

      theaterWs.onclose = () => {
        setTimeout(connectTheater, 3000);
      };
    };

    connectTheater();

    return () => {
      if (theaterWs) theaterWs.close();
    };
  }, [navigate]);

  // Call Duration Timer
  useEffect(() => {
    let interval: any;
    if (activeCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  // UI Control Handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Base Runner Parsing Logic
  const parseRunners = (description: string) => {
    const state = { first: false, second: false, third: false };
    if (!description) return state;

    const desc = description.toLowerCase();
    if (desc.includes('homers') || desc.includes('home run')) {
      return state;
    }
    if (desc.includes('singles') || desc.includes('walks') || desc.includes('hit by pitch')) {
      state.first = true;
    }
    if (desc.includes('doubles')) {
      state.second = true;
    }
    if (desc.includes('triples')) {
      state.third = true;
    }
    if (desc.includes('to 2nd') || desc.includes('to second')) {
      state.second = true;
    }
    if (desc.includes('to 3rd') || desc.includes('to third')) {
      state.third = true;
    }
    return state;
  };

  const runners = gameState ? parseRunners(gameState.status_msg || '') : { first: false, second: false, third: false };

  const getTotals = () => {
    let awayRuns = 0, awayHits = 0, awayErrors = 0;
    let homeRuns = 0, homeHits = 0, homeErrors = 0;

    if (gameState?.innings_detail) {
      gameState.innings_detail.forEach(inn => {
        awayRuns += inn.away.runs || 0;
        awayHits += inn.away.hits || 0;
        awayErrors += inn.away.errors || 0;
        homeRuns += inn.home.runs || 0;
        homeHits += inn.home.hits || 0;
        homeErrors += inn.home.errors || 0;
      });
    } else if (gameState) {
      awayRuns = gameState.away_score || 0;
      homeRuns = gameState.home_score || 0;
    }

    return {
      away: { runs: awayRuns, hits: awayHits, errors: awayErrors },
      home: { runs: homeRuns, hits: homeHits, errors: homeErrors }
    };
  };

  const totals = getTotals();

  // Chat message submit handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText('');
    setShowMentions(false);

    // 1. Add user message locally
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user: 'james (Pilot)',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPersona: false
    };
    setMessages(prev => [...prev, userMsg]);

    setIsSending(true);

    try {
      // 2. Call backend chat API
      const response = await axios.post('/api/chat', { message: text });
      if (response.data && response.data.text) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user: response.data.persona || 'Scruffy',
          text: response.data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPersona: true,
          color: response.data.color
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Tavern chat API failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Mention Autocomplete logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const match = val.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const filtered = roomPersonas.filter(p => p.toLowerCase().includes(query));
      setFilteredPersonas(filtered);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (persona: string) => {
    const updated = inputText.replace(/@\w*$/, `${persona} `);
    setInputText(updated);
    setShowMentions(false);
  };

  // HoloLink WebRTC Dial Call handlers
  const handleDialCall = async () => {
    if (activeCall) {
      // Hang up
      try {
        if (sessionId) {
          await axios.post('/api/persona-call/hangup', { session_id: sessionId });
        }
      } catch (err) {
        console.warn('Hangup request failed:', err);
      }
      cleanupCall();
      return;
    }

    try {
      // Request mic permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      const pc = new RTCPeerConnection();
      peerConnRef.current = pc;

      // Add local audio tracks
      micStream.getTracks().forEach(track => pc.addTrack(track, micStream));

      // Handle incoming voice track from the persona
      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.play().catch(e => console.error('Failed to play persona audio track:', e));
        }
      };

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Post offer to HoloLink server on port 8090 proxy
      const response = await axios.post('/api/persona-call/offer', {
        sdp: pc.localDescription?.sdp,
        type: pc.localDescription?.type,
        room_id: 'scruffys_tavern',
        fan_id: 'james'
      });

      if (response.data && response.data.sdp) {
        // Apply local SDP answer returned by HoloLink
        await pc.setRemoteDescription(new RTCSessionDescription({
          type: response.data.type,
          sdp: response.data.sdp
        }));
        
        setSessionId(response.data.session_id);
        setActiveCall(true);
      }
    } catch (err) {
      console.error('Failed to negotiate WebRTC dial call:', err);
      alert('Could not establish WebRTC voice link. Verify mic permissions.');
      cleanupCall();
    }
  };

  const cleanupCall = () => {
    setActiveCall(false);
    setSessionId(null);
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="sports-live-hub" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Upper Navigation / Environment Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div 
            style={{ 
              cursor: 'pointer', 
              padding: '0.6rem', 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate('/mlb')}
          >
            <ArrowLeft size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.5px' }}>
                {gameState ? `${gameState.away_team} @ ${gameState.home_team}` : 'Live Game Room'}
              </h2>
              <span style={{ fontSize: '0.65rem', background: '#FF3366', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>PROD</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              Sovereign Sports Decryption Relay
            </span>
          </div>
        </div>

        {/* Global Roster Token usage / Telemetry badges */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span 
            className="badge-live" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255, 51, 102, 0.1)',
              color: '#FF3366',
              border: '1px solid rgba(255, 51, 102, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              animation: 'pulse-live 2s infinite'
            }}
          >
            <Activity size={14} /> LIVE SLATE
          </span>
          <span 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: wsConnected ? 'rgba(0,255,204,0.1)' : 'rgba(255,102,102,0.1)',
              color: wsConnected ? '#00FFCC' : '#FF6666',
              border: wsConnected ? '1px solid rgba(0,255,204,0.2)' : '1px solid rgba(255,102,102,0.2)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem' 
            }}
          >
            <Radio size={14} />
            {wsConnected ? 'M.A.R.D ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Mobile view responsive tabs */}
      <div className="mobile-only-tabs" style={{ display: 'none', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('feed')}
          style={{ flex: 1, padding: '0.75rem', background: activeTab === 'feed' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Game Feed
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{ flex: 1, padding: '0.75rem', background: activeTab === 'chat' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Tavern Chat
        </button>
      </div>

      {/* Responsive Grid Layout */}
      <div 
        className="live-grid-responsive" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.6fr 1fr', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        
        {/* Left Column: Video & Telemetry Game stats */}
        <div className={`grid-feed-pane ${activeTab !== 'feed' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Glassmorphic Video Box */}
          <div className="video-container" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '16/9' }}>
            {streamUrl ? (
              <>
                <video ref={videoRef} autoPlay muted={isMuted} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                
                {/* Embedded controls HUD inside the player */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', 
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button 
                      onClick={handlePlayPause}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button 
                      onClick={handleMuteToggle}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    DECRYPTION: ACTIVE
                  </span>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '300px' }}>
                <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid #00FFCC', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Resolving Authenticated Stream url...</p>
              </div>
            )}
          </div>

          {/* Glass Scoreboard */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Sovereign Scoreboard
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ textAlign: 'left' }}>TEAM</div>
                <div>R</div>
                <div>H</div>
                <div>E</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>
                  {gameState?.away_team || 'AWAY'}
                </div>
                <div style={{ color: '#00FFCC', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>
                  {totals.away.runs}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.away.hits}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.away.errors}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', textAlign: 'center', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.9)' }}>
                  {gameState?.home_team || 'HOME'}
                </div>
                <div style={{ color: '#00FFCC', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>
                  {totals.home.runs}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.home.hits}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{totals.home.errors}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  Current Inning
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 300, color: '#fff' }}>
                  {gameState?.inning || 'Warmups'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>BALLS</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(3)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.balls ? '#00FFCC' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.balls ? '0 0 8px #00FFCC' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>STRIKES</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(2)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.strikes ? '#FFCC00' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.strikes ? '0 0 8px #FFCC00' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '45px', color: 'rgba(255,255,255,0.4)' }}>OUTS</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(3)].map((_, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: gameState && i < gameState.outs ? '#FF4136' : 'rgba(255,255,255,0.15)',
                          boxShadow: gameState && i < gameState.outs ? '0 0 8px #FF4136' : 'none' 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Neon SVG Baseball Diamond */}
          <div className="vm-panel-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <h3 style={{ alignSelf: 'flex-start', margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Base runners
            </h3>

            <svg width="180" height="180" viewBox="0 0 100 100" style={{ margin: '0.5rem 0' }}>
              <path 
                d="M 50 90 L 90 50 L 50 10 L 10 50 Z" 
                fill="none" 
                stroke="rgba(255, 255, 255, 0.08)" 
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              <polygon 
                points="50,14 54,18 50,22 46,18" 
                fill={runners.second ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.second ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.second ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="86,50 90,54 86,58 82,54" 
                fill={runners.first ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.first ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.first ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="14,50 18,54 14,58 10,54" 
                fill={runners.third ? '#00FFCC' : 'rgba(0,0,0,0.5)'} 
                stroke={runners.third ? '#00FFCC' : 'rgba(255,255,255,0.2)'} 
                strokeWidth="1.5" 
                style={{ 
                  transition: 'all 0.3s ease',
                  filter: runners.third ? 'drop-shadow(0px 0px 4px #00FFCC)' : 'none'
                }}
              />

              <polygon 
                points="50,86 53,89 53,92 47,92 47,89" 
                fill="rgba(255,255,255,0.2)" 
                stroke="rgba(255,255,255,0.4)" 
                strokeWidth="1" 
              />
            </svg>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.15rem' }}>PITCHER</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{gameState?.pitcher || '---'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.15rem' }}>BATTER</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{gameState?.batter || '---'}</span>
              </div>
            </div>

            {gameState && gameState.pitch_speed > 0 && (
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '0.75rem', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>PITCH</span>
                  <span style={{ fontWeight: 'bold', color: '#00FFCC' }}>{gameState.pitch_speed} mph</span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{gameState.pitch_name || 'Fastball'}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>EXIT VELO</span>
                  <span style={{ fontWeight: 'bold', color: '#FFCC00' }}>{gameState.hit_speed > 0 ? `${gameState.hit_speed} mph` : '---'}</span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '2px' }}>DISTANCE</span>
                  <span style={{ fontWeight: 'bold', color: '#FF4136' }}>{gameState.hit_distance > 0 ? `${gameState.hit_distance} ft` : '---'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scruffy's Chat Panel & HoloLink Dial (Split Screen) */}
        <div className={`grid-chat-pane ${activeTab !== 'chat' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* HoloLink WebRTC dial card */}
          <div className="vm-panel-glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} style={{ color: '#FF3366' }} />
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>HoloLink Telepresence</h3>
              </div>
              {activeCall && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,51,102,0.15)', color: '#FF3366', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse-live 1.5s infinite' }}>
                  CALL ACTIVE ({formatTime(callDuration)})
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
              Establish a secure 1-on-1 WebRTC audio link with the room's primary persona (Barf). Dial directly from your microphone.
            </p>

            <button 
              onClick={handleDialCall}
              style={{
                width: '100%',
                padding: '0.8rem',
                border: 'none',
                background: activeCall ? '#FF3366' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: activeCall ? '0 0 12px rgba(255,51,102,0.4)' : 'none'
              }}
            >
              {activeCall ? (
                <>
                  <PhoneOff size={16} /> Hang Up (Barf)
                </>
              ) : (
                <>
                  <Phone size={16} /> Dial Barf (Underpants Bandito)
                </>
              )}
            </button>
          </div>

          {/* Scruffy's Chat Roster bubble */}
          <div className="vm-panel-glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              <Users size={14} />
              <span>ACTIVE FANS IN TAVERN ({roomPersonas.length})</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {roomPersonas.map((p, idx) => (
                <span 
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    color: p === '@barf' ? '#FF5910' : p === '@dot' ? '#00FFCC' : 'rgba(255,255,255,0.7)',
                    fontWeight: p === '@barf' || p === '@dot' ? 'bold' : 'normal'
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Embedded chat list panel */}
          <div className="vm-panel-glass" style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={16} style={{ color: '#00FFCC' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Scruffy's Tavern Chat</h3>
            </div>

            {/* Message Area */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px' }}>
              {messages.map((m) => (
                <div 
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.isPersona ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    alignSelf: m.isPersona ? 'flex-start' : 'flex-end'
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: m.color || 'rgba(255,255,255,0.4)', marginBottom: '2px', fontWeight: 'bold' }}>
                    {m.user} &bull; {m.time}
                  </span>
                  <div 
                    style={{
                      background: m.isPersona ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #FF3366, #FF5910)',
                      border: m.isPersona ? `1px solid ${m.color || 'rgba(255,255,255,0.08)'}` : 'none',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      color: m.isPersona ? 'rgba(255,255,255,0.85)' : '#fff',
                      lineHeight: 1.4
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input field area */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              
              {/* Autocomplete mention list overlay */}
              {showMentions && filteredPersonas.length > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0.75rem',
                  right: '0.75rem',
                  background: '#121212',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {filteredPersonas.map((p, idx) => (
                    <div 
                      key={idx}
                      onClick={() => selectMention(p)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#fff',
                        borderBottom: idx < filteredPersonas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type @ to mention a fan..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                />
                <button 
                  type="submit"
                  disabled={isSending}
                  style={{
                    background: 'linear-gradient(135deg, #00FFCC, #00E676)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#000',
                    boxShadow: '0 0 8px rgba(0,255,204,0.3)'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
