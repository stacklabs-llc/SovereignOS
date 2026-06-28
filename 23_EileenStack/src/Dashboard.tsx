import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Radio, 
  ArrowRight,
  BookOpen,
  Coffee,
  Send,
  Play
} from 'lucide-react';

import CaregiverAlert from './CaregiverAlert';
import HoloLinkPortal from './HoloLinkPortal';
import CareHubTimeline from './CareHubTimeline';
import ProcurementTracker from './ProcurementTracker';

interface StackCard {
  name: string;
  desc: string;
  status: string;
  emoji: string;
  port?: string;
  url: string;
  isPlaceholder?: boolean;
}

interface VideoFile {
  name: string;
  size_mb: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>('care_hub');
  
  // Comet (Alerts, Groceries, Chat) State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState<string>('');
  const [groceries, setGroceries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cometConnected, setCometConnected] = useState<boolean>(false);
  const cometWsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // WebRTC / Hololink Intercom State
  const [intercomStatus, setIntercomStatus] = useState<'idle' | 'calling' | 'ringing_in' | 'connected'>('idle');
  const [callingTarget, setCallingTarget] = useState<string>('');
  const [remoteUserId, setRemoteUserId] = useState<string>('');
  const [remoteUserDisplay, setRemoteUserDisplay] = useState<string>('');
  const [intercomMuted, setIntercomMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [relayConnected, setRelayConnected] = useState<boolean>(false);
  
  const wsRelayRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingOfferRef = useRef<any>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Dynamic Video Vault State
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [castingStatus, setCastingStatus] = useState<string>('');

  // Jukebox State
  const cozyTracks = [
    "Cozy Fireplace Logs Crackling 🔥",
    "Lavender Garden Winds 🍃",
    "Sweet Tea Sunday Jazz ☕",
    "Crossword Concentration Melody 🎹"
  ];
  const [trackIdx, setTrackIdx] = useState<number>(0);
  const [jukeboxPlaying, setJukeboxPlaying] = useState<boolean>(false);

  // Crossword Grid State
  const crosswordAnswers: Record<string, string> = {
    '0,3': 'I',
    '1,1': 'L', '1,2': 'E', '1,3': 'N', '1,4': 'O', '1,5': 'R', '1,6': 'A',
    '2,3': 'B', '2,5': 'E',
    '3,2': 'C', '3,3': 'O', '3,4': 'L', '3,5': 'I',
    '4,3': 'X', '4,5': 'G',
    '5,5': 'N'
  };

  const cellNumbers: Record<string, number> = {
    '0,3': 1, // 1-Down (INBOX)
    '1,1': 2, // 2-Across (LENORA)
    '1,5': 3, // 3-Down (REIGN)
    '3,2': 4  // 4-Across (CLIO)
  };

  const [userGrid, setUserGrid] = useState<Record<string, string>>({
    '0,3': '', '1,1': '', '1,2': '', '1,3': '', '1,4': '', '1,5': '', '1,6': '',
    '2,3': '', '2,5': '', '3,2': '', '3,3': '', '3,4': '', '3,5': '', '4,3': '',
    '4,5': '', '5,5': ''
  });

  const [validationResult, setValidationResult] = useState<'unchecked' | 'correct' | 'incorrect'>('unchecked');

  // Audio synthesis helper
  const playTone = (freq: number, type: OscillatorType, duration: number) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error(e);
    }
  };

  const playTriumphChord = () => {
    const tones = [261.63, 329.63, 392.00, 523.25]; // C major chord
    tones.forEach((t, i) => {
      setTimeout(() => playTone(t, 'sine', 1.0), i * 150);
    });
  };

  const playBuzzer = () => {
    playTone(130, 'sawtooth', 0.5);
  };

  const playChirp = () => {
    playTone(880, 'triangle', 0.08);
  };

  const handleCellChange = (row: number, col: number, val: string) => {
    const key = `${row},${col}`;
    const cleanVal = val.toUpperCase().slice(-1);
    
    setUserGrid(prev => ({
      ...prev,
      [key]: cleanVal
    }));
    
    if (cleanVal) {
      playChirp();
    }
  };

  const checkCrossword = () => {
    let allCorrect = true;
    Object.keys(crosswordAnswers).forEach(key => {
      if (userGrid[key]?.toUpperCase() !== crosswordAnswers[key]) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      setValidationResult('correct');
      playTriumphChord();
    } else {
      setValidationResult('incorrect');
      playBuzzer();
    }
  };

  const autoSolve = () => {
    setUserGrid({ ...crosswordAnswers });
    setValidationResult('correct');
    playTriumphChord();
  };

  // Jukebox Ambience Loop
  useEffect(() => {
    let interval: any;
    if (jukeboxPlaying) {
      const playCozySequence = () => {
        const progression = trackIdx === 0
          ? [261.63, 329.63, 392.00, 493.88] // Cmaj7
          : trackIdx === 1
          ? [174.61, 220.00, 261.63, 311.13] // Fmaj7
          : trackIdx === 2
          ? [293.66, 349.23, 440.00, 523.25] // Dm7
          : [329.63, 392.00, 493.88, 587.33]; // Em7

        progression.forEach((t, i) => {
          setTimeout(() => {
            if (jukeboxPlaying) playTone(t, 'sine', 1.5);
          }, i * 300);
        });
      };

      playCozySequence();
      interval = setInterval(playCozySequence, 4000);
    }
    return () => clearInterval(interval);
  }, [jukeboxPlaying, trackIdx]);

  // Dynamic Video Vault Loading
  const loadVideos = async () => {
    try {
      const res = await fetch('/api/media/vault_inbox');
      if (res.ok) {
        const data = await res.json();
        setVideoFiles(data);
      }
    } catch (e) {
      console.error("Failed to load video vault directory:", e);
    }
  };

  const castVideo = async (filename: string) => {
    setCastingStatus(`Casting ${filename}...`);
    try {
      const targetUrl = `http://clio.taila01894.ts.net:8085/01_Assets/Video/Eileens_Videos/${filename}`;
      const res = await fetch('/api/cast_tv/hobbes.taila01894.ts.net', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      if (res.ok) {
        setCastingStatus(`Successfully cast: ${filename}`);
        setTimeout(() => setCastingStatus(''), 5000);
      } else {
        setCastingStatus(`Error casting: ${res.statusText}`);
      }
    } catch (e: any) {
      setCastingStatus(`Failed: ${e.message}`);
    }
  };

  // ── COMET MESSENGER SOCKET ────────────────────────────────────────────────
  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${window.location.host}/ws-comet`;
    
    let active = true;
    let cometWs: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectComet = () => {
      if (!active) return;
      cometWs = new WebSocket(wsUrl);
      cometWsRef.current = cometWs;

      cometWs.onopen = () => {
        if (!active) return;
        setCometConnected(true);
      };

      cometWs.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state') {
            setMessages(data.messages || []);
            setGroceries(data.groceries || []);
            setAlerts(data.alerts || []);
          } else if (data.type === 'chat') {
            setMessages(prev => [...prev, data]);
          } else if (data.type === 'grocery_add') {
            setGroceries(prev => {
              if (prev.some(item => item.id === data.id)) return prev;
              return [...prev, data];
            });
          } else if (data.type === 'grocery_toggle') {
            setGroceries(prev => prev.map(item => item.id === data.id ? { ...item, status: data.status } : item));
          } else if (data.type === 'priority_alert') {
            setAlerts(prev => {
              if (prev.some(a => a.id === data.id)) return prev;
              return [...prev, data];
            });
          } else if (data.type === 'priority_resolve') {
            setAlerts(prev => prev.map(a => a.id === data.id ? { ...a, status: 'RESOLVED' } : a));
          }
        } catch (e) {
          console.error("Comet parser error:", e);
        }
      };

      cometWs.onclose = () => {
        setCometConnected(false);
        if (active) {
          reconnectTimer = setTimeout(connectComet, 3000);
        }
      };
    };

    connectComet();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      cometWs?.close();
    };
  }, []);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !cometWsRef.current || !cometConnected) return;

    cometWsRef.current.send(JSON.stringify({
      type: 'chat',
      sender_id: 'eileen',
      message_text: newMsg,
      channel_name: 'general'
    }));
    setNewMsg('');
  };

  // Comet Event Helpers (Trigger, Resolve, Grocery list)
  const triggerAlert = () => {
    if (!cometWsRef.current || !cometConnected) return;
    cometWsRef.current.send(JSON.stringify({
      type: 'TRIGGER_ALERT',
      alert_type: 'PRIORITY_ASSISTANCE',
      avatar_url: '/avatars/mando/mando_warning.png'
    }));
  };

  const resolveAlert = (id: number) => {
    if (!cometWsRef.current || !cometConnected) return;
    cometWsRef.current.send(JSON.stringify({
      type: 'RESOLVE_ALERT',
      id: id
    }));
  };

  const addGroceryItem = (name: string, qty: string) => {
    if (!cometWsRef.current || !cometConnected) return;
    cometWsRef.current.send(JSON.stringify({
      type: 'grocery_add',
      item_name: name,
      quantity: qty
    }));
  };

  const toggleGroceryItem = (id: number, currentStatus: string) => {
    if (!cometWsRef.current || !cometConnected) return;
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    cometWsRef.current.send(JSON.stringify({
      type: 'grocery_toggle',
      id: id,
      status: newStatus
    }));
  };

  // ── HOLOLINK WebRTC SIGNALING SOCKET ──────────────────────────────────────
  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIntercomStatus('idle');
    setCallingTarget('');
    setRemoteUserId('');
    setRemoteUserDisplay('');
  };

  const buildPC = (targetId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRelayRef.current) {
        wsRelayRef.current.send(JSON.stringify({
          type: 'WEBRTC_ICE_CANDIDATE',
          candidate: event.candidate,
          from: 'eileen',
          to: targetId,
          target: targetId
        }));
      }
    };

    return pc;
  };

  // Outbound call to a dynamic user (with fallback hooks)
  const makeCall = async (targetId: string, display: string) => {
    cleanupCall();
    setIntercomStatus('calling');
    setCallingTarget(display);
    setRemoteUserId(targetId);

    try {
      let stream: MediaStream;
      try {
        // Primary: audio + video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn("Dual camera/audio capture failed. Trying audio-only fallback...", err);
        try {
          // Fallback 1: audio only
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (err2) {
          console.warn("Audio-only capture failed. Trying video-only fallback...", err2);
          // Fallback 2: video only
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
      }
      setLocalStream(stream);

      const pc = buildPC(targetId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRelayRef.current) {
        wsRelayRef.current.send(JSON.stringify({
          type: 'WEBRTC_OFFER',
          offer: offer,
          from: 'eileen',
          fromDisplay: 'Eileen Carroll',
          to: targetId,
          target: targetId
        }));
      }
    } catch (err) {
      console.error("All media capture failbacks exhausted:", err);
      cleanupCall();
    }
  };

  const callBarbTV = () => {
    cleanupCall();
    setIntercomStatus('calling');
    setCallingTarget("Barb Carroll's TV");
    setRemoteUserId('barb_tv');

    if (wsRelayRef.current) {
      wsRelayRef.current.send(JSON.stringify({
        type: 'HOLOLINK_REQUEST',
        from: 'eileen',
        target: 'barb_tv'
      }));
    }
  };

  const answerCall = async (offer: any, fromId: string, display: string) => {
    setRemoteUserId(fromId);
    setRemoteUserDisplay(display);
    setCallingTarget(display);
    setIntercomStatus('connected');

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn("Dual capture failed on incoming answer. Trying audio-only...", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (err2) {
          console.warn("Audio-only failed on incoming answer. Trying video-only...", err2);
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
      }
      setLocalStream(stream);

      const pc = buildPC(fromId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRelayRef.current) {
        wsRelayRef.current.send(JSON.stringify({
          type: 'WEBRTC_ANSWER',
          answer: answer,
          from: 'eileen',
          to: fromId,
          target: fromId
        }));
      }
    } catch (err) {
      console.error("Failed to answer WebRTC session:", err);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (pendingOfferRef.current) {
      const offer = pendingOfferRef.current;
      pendingOfferRef.current = null;
      await answerCall(offer, remoteUserId, remoteUserDisplay);
    }
  };

  const declineCall = () => {
    if (wsRelayRef.current) {
      wsRelayRef.current.send(JSON.stringify({
        type: 'CALL_DECLINED',
        from: 'eileen',
        to: remoteUserId,
        target: remoteUserId
      }));
    }
    cleanupCall();
  };

  const hangUp = () => {
    if (wsRelayRef.current) {
      wsRelayRef.current.send(JSON.stringify({
        type: 'HOLOLINK_END',
        from: 'eileen',
        to: remoteUserId,
        target: remoteUserId
      }));
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIntercomMuted(!intercomMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoOff(!videoOff);
    }
  };

  // Video tags sync
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, intercomStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, intercomStatus]);

  // Mesh relay signaling loop
  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${window.location.host}/ws-relay`;

    let active = true;
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectRelay = () => {
      if (!active) return;
      ws = new WebSocket(wsUrl);
      wsRelayRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setRelayConnected(true);
        ws?.send(JSON.stringify({
          type: 'REGISTER',
          userId: 'eileen',
          displayName: 'Eileen Carroll',
          role: 'patron'
        }));
      };

      ws.onmessage = async (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'REGISTERED':
              ws?.send(JSON.stringify({ type: 'GET_PRESENCE' }));
              break;

            case 'PRESENCE_UPDATE': {
              const users = (data.users ?? []).filter(
                (u: any) => u.user_name.toLowerCase() !== 'eileen'
              );
              setOnlineUsers(users);
              break;
            }

            case 'WEBRTC_OFFER': {
              if (data.from === 'eileen') break;
              if (data.to && data.to !== 'eileen') break;

              if (data.from === 'barb_tv') {
                await answerCall(data.offer, 'barb_tv', "Barb Carroll's TV");
              } else {
                pendingOfferRef.current = data.offer;
                setRemoteUserId(data.from);
                setRemoteUserDisplay(data.fromDisplay || data.from);
                setIntercomStatus('ringing_in');
              }
              break;
            }

            case 'WEBRTC_ANSWER':
              if (pcRef.current && data.answer) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setIntercomStatus('connected');
              }
              break;

            case 'WEBRTC_ICE_CANDIDATE':
              if (pcRef.current && data.candidate) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
              break;

            case 'HOLOLINK_END':
              if (data.to === 'eileen' || !data.to) {
                cleanupCall();
              }
              break;

            case 'CALL_DECLINED':
            case 'CALL_BUSY':
              cleanupCall();
              break;
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setRelayConnected(false);
        if (active) {
          reconnectTimer = setTimeout(connectRelay, 3000);
        }
      };
    };

    connectRelay();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      cleanupCall();
    };
  }, []);

  // Sync video directories on mount and when tab shifts
  useEffect(() => {
    loadVideos();
  }, [activeTab]);

  const familyStacks: StackCard[] = [
    { name: "Lenora's Daily Adventures", desc: "Active children's educational portal. Math, puzzle games, and storytelling modules.", status: "ONLINE", emoji: "👧", url: "/lenora" },
    { name: "Arthur's Academic Outpost", desc: "Academic study tracker & sandboxed math environment.", status: "STAGED", emoji: "👦", url: "#", isPlaceholder: true },
    { name: "Josephine's Early Learning", desc: "Hearth early learning & memory matching board console.", status: "STAGED", emoji: "👶", url: "#", isPlaceholder: true }
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f6] text-gray-800 p-4 md:p-6 font-sans">
      
      {/* COZY HEADER */}
      <header className="relative bg-white border border-gray-150 p-6 rounded-3xl mb-6 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-center z-10 relative">
          <div className="flex items-center space-x-4.5 mb-4 lg:mb-0">
            <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              👵
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-gray-850 uppercase flex items-center gap-2 font-serif">
                Eileen's Cozy Hearth Console
              </h1>
              <p className="text-[10px] text-gray-500 font-sans tracking-widest uppercase mt-1 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#436850] animate-pulse"></span>
                Console Active • Node 3017 • Smyrna Outpost
              </p>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setActiveTab('care_hub')} 
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'care_hub' ? 'bg-[#c25134] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              🏥 Smyrna Care Hub
            </button>
            <button 
              onClick={() => setActiveTab('intercom')} 
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'intercom' ? 'bg-[#c25134] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              💬 Secure Chat
            </button>
            <button 
              onClick={() => setActiveTab('crossword')} 
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'crossword' ? 'bg-[#c25134] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              🧩 Crossword HQ
            </button>
            <button 
              onClick={() => setActiveTab('family')} 
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'family' ? 'bg-[#c25134] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              🏠 Family Stacks
            </button>
            <button 
              onClick={() => setActiveTab('power_tools')} 
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'power_tools' ? 'bg-[#c25134] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              📺 Video Casting
            </button>
          </div>
        </div>
      </header>

      {/* RINGER OVERLAY */}
      {intercomStatus === 'ringing_in' && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-6">
          <div className="cardboard-panel max-w-sm w-full p-8 text-center flex flex-col items-center gap-6 bg-white shadow-xl rounded-3xl border border-gray-150">
            <div className="w-20 h-20 rounded-full bg-[#c25134]/10 border-2 border-[#c25134] flex items-center justify-center animate-bounce">
              <span className="text-4xl">📞</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#c25134] tracking-widest uppercase block mb-1">Incoming HoloLink Call</span>
              <h3 className="text-2xl font-bold text-gray-800 uppercase tracking-wide font-serif">{remoteUserDisplay}</h3>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                onClick={declineCall}
                className="flex-1 py-3 px-4 bg-[#9c3120] hover:bg-[#862517] text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-widest text-[10px]"
              >
                Decline
              </button>
              <button 
                onClick={acceptCall}
                className="flex-1 py-3 px-4 bg-[#436850] hover:bg-[#385542] text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-widest text-[10px]"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (SIDEBAR - 3 COLS) */}
        <aside className="xl:col-span-3 flex flex-col gap-6">
          
          {/* PROFILE CARD */}
          <div className="cardboard-panel p-6 bg-white">
            <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
              <span>👤 Operator Profile</span>
              <span className="text-[9px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded font-sans font-bold">HEARTH</span>
            </h2>
            <div className="flex items-center space-x-3.5 mb-4">
              <div className="w-14 h-14 bg-gray-50 border border-gray-150 rounded-full flex items-center justify-center text-3xl shadow-inner">
                👵
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base font-serif">Eileen Carroll</h4>
                <p className="text-[10px] text-gray-400 font-sans tracking-wide">@eileen_hearth</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-600 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 font-sans">
              Oversight and verification console for the Carroll family sub-stacks. Maintains Smyrna's secure presence.
            </p>
          </div>

          {/* JUKEBOX */}
          <div className="cardboard-panel p-6 bg-white">
            <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
              <span>📻 Cozy Ambience</span>
              <Radio className="w-4 h-4 text-[#c25134]" />
            </h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-sans text-xs text-gray-750 space-y-3 shadow-inner">
              <div className="text-center font-bold tracking-wider text-gray-400 uppercase text-[9px]">Ambient Generator</div>
              <div className="text-center text-xs text-gray-800 font-serif font-bold truncate py-2 border-y border-gray-150">
                {cozyTracks[trackIdx]}
              </div>
              <div className="flex justify-center items-center space-x-4 pt-1">
                <button 
                  onClick={() => setTrackIdx(prev => (prev - 1 + cozyTracks.length) % cozyTracks.length)} 
                  className="text-gray-450 hover:text-[#c25134] transition-colors cursor-pointer text-sm font-bold"
                >
                  ◀
                </button>
                <button 
                  onClick={() => setJukeboxPlaying(!jukeboxPlaying)} 
                  className="cozy-button px-4 py-1.5 text-[9px] tracking-widest uppercase font-sans font-bold"
                >
                  {jukeboxPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button 
                  onClick={() => setTrackIdx(prev => (prev + 1) % cozyTracks.length)} 
                  className="text-gray-450 hover:text-[#c25134] transition-colors cursor-pointer text-sm font-bold"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA (9 COLS) */}
        <main className="xl:col-span-9 flex flex-col gap-6">

          {/* TAB 1: SMYRNA CARE HUB */}
          {activeTab === 'care_hub' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CaregiverAlert
                alerts={alerts}
                cometConnected={cometConnected}
                onTriggerAlert={triggerAlert}
                onResolveAlert={resolveAlert}
              />
              <HoloLinkPortal
                intercomStatus={intercomStatus}
                onlineUsers={onlineUsers}
                relayConnected={relayConnected}
                callingTarget={callingTarget}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                onMakeCall={makeCall}
                onCallBarbTV={callBarbTV}
                onHangUp={hangUp}
                toggleMute={toggleMute}
                toggleVideo={toggleVideo}
                intercomMuted={intercomMuted}
                videoOff={videoOff}
              />
              <CareHubTimeline />
              <ProcurementTracker
                groceries={groceries}
                cometConnected={cometConnected}
                onAddItem={addGroceryItem}
                onToggleItem={toggleGroceryItem}
              />
            </div>
          )}

          {/* TAB 2: SECURE CHAT */}
          {activeTab === 'intercom' && (
            <div className="flex flex-col cardboard-panel p-6 bg-white min-h-[480px]">
              <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3.5 mb-4 flex justify-between items-center">
                <span>💬 Secure Comet Chat Feed</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-sans font-bold border ${cometConnected ? 'bg-[#436850]/8 text-[#436850] border-[#436850]/20' : 'bg-[#9c3120]/8 text-[#9c3120] border-[#9c3120]/20'}`}>
                    {cometConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                  
                  {/* EXPORT BUTTONS */}
                  <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3.5">
                    {(['md', 'json', 'csv'] as const).map(fmt => {
                      const colors: Record<string, string> = { 
                        md: 'text-[#c25134] bg-[#c25134]/5 border-[#c25134]/15 hover:bg-[#c25134]/10', 
                        json: 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/50', 
                        csv: 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50' 
                      };
                      const c = colors[fmt];
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            let content = '';
                            let mediaType = 'text/plain';
                            let extension = 'txt';

                            if (fmt === 'json') {
                              content = JSON.stringify(messages, null, 2);
                              mediaType = 'application/json';
                              extension = 'json';
                            } else if (fmt === 'csv') {
                              const escapeCsv = (str: string) => {
                                const escaped = (str || '').replace(/"/g, '""');
                                return `"${escaped}"`;
                              };
                              content = "Timestamp,Author,Message\n" + messages.map(m => {
                                const ts = m.created_at ? new Date(m.created_at).toISOString() : '';
                                return `${escapeCsv(ts)},${escapeCsv(m.sender_id)},${escapeCsv(m.message_text)}`;
                              }).join('\n');
                              mediaType = 'text/csv';
                              extension = 'csv';
                            } else {
                              // markdown
                              content = `# 📋 Secure Comet Chat Session Export\n\nExported: ${new Date().toISOString()}\n\n---\n\n## Chronological Log\n\n`;
                              content += messages.map(m => {
                                const ts = m.created_at ? new Date(m.created_at).toLocaleString() : '';
                                return `**[${ts}]** 🗣️ **${m.sender_id.toUpperCase()}**\n> ${m.message_text}\n`;
                              }).join('\n');
                              mediaType = 'text/markdown';
                              extension = 'md';
                            }

                            const dataStr = `data:${mediaType};charset=utf-8,` + encodeURIComponent(content);
                            const a = document.createElement('a');
                            a.href = dataStr;
                            a.download = `comet_chat_${Date.now()}.${extension}`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}
                          className={`px-2 py-0.5 border rounded text-[9px] font-bold font-mono cursor-pointer transition-all ${c}`}
                          title={`Export chat as ${fmt.toUpperCase()}`}
                        >
                          ↓{fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </h2>

              <div className="flex-grow overflow-y-auto space-y-3.5 pr-2 mb-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-150 max-h-[320px] shadow-inner">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <Radio className="w-8 h-8 mx-auto mb-2 animate-pulse text-[#c25134]" />
                    <p className="text-xs uppercase font-bold tracking-wider font-sans">Awaiting transmissions...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl max-w-[85%] border shadow-sm ${msg.sender_id === 'eileen' ? 'ml-auto bg-[#c25134]/8 border-[#c25134]/15 text-gray-805 font-medium' : 'bg-white border-gray-200 text-gray-805'}`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-sans font-bold text-[#c25134] border-b border-gray-100 pb-1.5 mb-1.5 uppercase tracking-wider">
                        <span>{msg.sender_id === 'eileen' ? '👵 Eileen (You)' : `@${msg.sender_id}`}</span>
                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                      </div>
                      <p className="text-xs leading-relaxed font-sans">{msg.message_text}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChatMessage} className="flex gap-2.5 pt-3.5 border-t border-gray-100">
                <input 
                  type="text" 
                  value={newMsg} 
                  onChange={(e) => setNewMsg(e.target.value)} 
                  placeholder="Type secure Smyrna transmission..." 
                  className="flex-grow cozy-input text-xs"
                />
                <button 
                  type="submit" 
                  className="cozy-button px-5 py-2 text-xs uppercase"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CROSSWORD HQ */}
          {activeTab === 'crossword' && (
            <div className="cardboard-panel p-6 bg-white">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-gray-100 pb-3.5 mb-6">
                <div>
                  <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest flex items-center gap-2">
                    🧩 Crossword Verification Deck
                  </h2>
                  <p className="text-[10px] text-gray-400 font-sans tracking-wide uppercase mt-1">Solve the puzzle to verify Smyrna's local security protocols.</p>
                </div>
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <button 
                    onClick={checkCrossword} 
                    className="cozy-button px-4 py-2 text-xs uppercase"
                  >
                    Check Answers
                  </button>
                  <button 
                    onClick={autoSolve} 
                    className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-widest"
                  >
                    Solve Puzzle
                  </button>
                </div>
              </div>

              {/* SUCCESS STATE */}
              {validationResult === 'correct' && (
                <div className="bg-[#436850]/5 border border-[#436850]/20 text-gray-800 p-4 rounded-2xl mb-6 flex items-center space-x-4">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-gray-800 font-sans tracking-wide">Crossword Completed Successfully!</h4>
                    <p className="text-xs text-gray-550 font-sans mt-0.5">Verification passed. Network nodes securely handshake.</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {validationResult === 'incorrect' && (
                <div className="bg-[#9c3120]/5 border border-[#9c3120]/20 text-gray-800 p-4 rounded-2xl mb-6 flex items-center space-x-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-sm uppercase text-gray-800 font-sans tracking-wide">Incorrect Letters Found</h4>
                    <p className="text-xs text-gray-550 font-sans mt-0.5">Check the clues below and try again!</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* CROSSWORD GRID RENDERING */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="bg-[#faf8f5] p-6 rounded-3xl border border-gray-150 grid grid-cols-7 gap-2 max-w-[340px] shadow-inner">
                    {Array.from({ length: 6 }).map((_, r) => (
                      <React.Fragment key={r}>
                        {Array.from({ length: 7 }).map((_, c) => {
                          const key = `${r},${c}`;
                          const isPlayable = crosswordAnswers[key] !== undefined;
                          const cellNum = cellNumbers[key];
                          
                          return (
                            <div 
                              key={c} 
                              className={`aspect-square w-10 md:w-11 rounded-lg relative flex items-center justify-center transition-all ${isPlayable ? 'bg-white border border-gray-300 focus-within:border-[#c25134] focus-within:bg-orange-50/20 shadow-sm' : 'bg-gray-100'}`}
                            >
                              {cellNum && (
                                <span className="absolute top-0.5 left-1 text-[8px] font-sans text-gray-400 font-bold leading-none">
                                  {cellNum}
                                </span>
                              )}
                              
                              {isPlayable ? (
                                <input 
                                  type="text" 
                                  value={userGrid[key] || ''} 
                                  onChange={(e) => handleCellChange(r, c, e.target.value)} 
                                  className="w-full h-full bg-transparent text-center font-bold text-lg md:text-xl uppercase text-gray-850 focus:outline-none font-sans"
                                  maxLength={1}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* CLUES PANEL */}
                <div className="lg:col-span-6 bg-gray-50/50 p-5 rounded-2xl border border-gray-150">
                  <h3 className="text-xs font-sans font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#c25134]" /> PUZZLE CLUES
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#c25134] uppercase tracking-wider mb-2 font-sans">Horizontal (Across)</h4>
                      <ul className="space-y-2.5 text-xs text-gray-650">
                        <li className="flex items-start gap-2">
                          <span className="font-mono bg-gray-100 text-gray-650 font-bold px-1.5 py-0.5 rounded leading-none border border-gray-200 shadow-sm">2</span>
                          <p>Granddaughter's active educational sub-stack (6 letters)</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-mono bg-gray-100 text-gray-650 font-bold px-1.5 py-0.5 rounded leading-none border border-gray-200 shadow-sm">4</span>
                          <p>Secure Tailscale outpost node hostname (4 letters)</p>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-[10px] font-bold text-[#c25134] uppercase tracking-wider mb-2 font-sans">Vertical (Down)</h4>
                      <ul className="space-y-2.5 text-xs text-gray-655">
                        <li className="flex items-start gap-2">
                          <span className="font-mono bg-gray-100 text-gray-655 font-bold px-1.5 py-0.5 rounded leading-none border border-gray-200 shadow-sm">1</span>
                          <p>Sacred, clutter-free workspace dropzone folder (5 letters)</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-mono bg-gray-100 text-gray-655 font-bold px-1.5 py-0.5 rounded leading-none border border-gray-200 shadow-sm">3</span>
                          <p>Sovereign power or rule; the state of being supreme (5 letters)</p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: FAMILY SUB-STACKS */}
          {activeTab === 'family' && (
            <div className="cardboard-panel p-6 bg-white">
              <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3.5 mb-6">
                🏠 Smyrna Family Academy Registry
              </h2>
              <p className="text-[10px] text-gray-400 mb-6 font-sans tracking-wide uppercase">Querying live sub-stack configuration from client directory.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {familyStacks.map((stack) => (
                  <div 
                    key={stack.name} 
                    className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all ${stack.isPlaceholder ? 'bg-gray-50/50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-[#c25134]/35 hover:shadow-md'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{stack.emoji}</span>
                        <div className="text-right">
                          <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border ${stack.status === 'ONLINE' ? 'bg-[#436850]/8 text-[#436850] border-[#436850]/20' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                            {stack.status}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm uppercase text-gray-800 mb-2 font-serif">{stack.name}</h3>
                      <p className="text-xs text-gray-650 leading-relaxed font-sans">{stack.desc}</p>
                    </div>

                    {!stack.isPlaceholder ? (
                      <button 
                        onClick={() => alert("Connecting to Lenora's Educational Portal over secure Tailscale tunnel...")}
                        className="w-full mt-5 cozy-button py-2 flex items-center justify-center gap-1.5"
                      >
                        <span>Access Stack</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-full mt-5 bg-gray-100 text-gray-400 text-[10px] font-sans font-bold py-2.5 rounded-xl text-center uppercase border border-gray-200 select-none tracking-widest">
                        Locked (Pending Ingress)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: POWER TOOLS / VIDEO CASTING */}
          {activeTab === 'power_tools' && (
            <div className="cardboard-panel p-6 bg-white">
              <h2 className="text-xs font-bold text-gray-850 uppercase tracking-widest border-b border-gray-100 pb-3.5 mb-4">
                🎬 Cozy Video Casting Terminal
              </h2>
              <p className="text-[10px] text-gray-400 font-sans tracking-wide uppercase mb-6">Cast files from the local Smyrna inbox vault directly to Hobbes television.</p>
              
              {castingStatus && (
                <div className="mb-4 bg-[#9c3120]/5 border border-[#9c3120]/20 text-[#9c3120] font-sans text-xs font-bold p-3.5 rounded-xl">
                  📢 {castingStatus}
                </div>
              )}

              <div className="bg-gray-50/50 border border-gray-150 p-5.5 rounded-3xl shadow-inner">
                <h3 className="text-xs font-sans font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-[#c25134]" /> Eileen's Video Inbox Vault
                </h3>
                
                {videoFiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-sans">
                    <Coffee className="w-8 h-8 mx-auto mb-2 opacity-45" />
                    <p className="text-xs uppercase font-bold tracking-wider font-mono">No video files registered in directory.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoFiles.map((v) => (
                      <div 
                        key={v.name}
                        className="p-4 bg-white border border-gray-200 hover:border-[#c25134]/40 rounded-2xl flex items-center justify-between transition-all shadow-sm"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-gray-800 truncate max-w-[220px] font-serif">{v.name}</h4>
                          <p className="text-xs text-gray-400 font-sans mt-0.5 font-bold">SIZE: {v.size_mb} MB</p>
                        </div>
                        <button 
                          onClick={() => castVideo(v.name)}
                          className="px-3.5 py-2 bg-[#c25134] hover:bg-[#a94025] text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer uppercase tracking-widest flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3" />
                          <span>Cast</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
