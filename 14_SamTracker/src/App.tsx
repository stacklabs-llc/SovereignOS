import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Calendar, BookOpen, Settings, Trash2, X, Download, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

export default function App() {
  const [samMode, setSamMode] = useState<'cozy' | 'wacko'>('cozy');
  const [sightings, setSightings] = useState<any[]>([]);
  const [newSighting, setNewSighting] = useState('');
  const [newDispatch, setNewDispatch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Dynamic Environment check (KI_031)
  const getEnvDetails = () => {
    const host = window.location.hostname || '';
    if (host.includes('dev')) return { name: 'DEV', color: 'bg-sky-500 border-sky-400 text-white' };
    if (host.includes('uat')) return { name: 'UAT', color: 'bg-amber-500 border-amber-400 text-white' };
    return { name: 'PROD', color: 'bg-red-600 border-red-500 text-white' };
  };
  const env = getEnvDetails();

  // Check if Pilot is accessing via ?role=pilot in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const isCreator = urlParams.get('role') === 'pilot' || urlParams.get('role') === 'creator';
  
  const [config, setConfig] = useState({
    note_title: 'Note for Jeannine',
    note_text: '',
    status_text: 'On the mend ❤️',
    daily_naps: '8',
    adventures: '2',
    tuna_snacks: '1',
    picture_url: 'sam.jpg'
  });

  // Gamified Hot-Swap & WebSocket Logic
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${window.location.host}/sam/ws`);
        
        socket.onopen = () => {
          setWs(socket);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'STATE_UPDATE' && payload.data) {
              if (payload.data.last_events) {
                const formatted = payload.data.last_events.map((ev: any, i: number) => ({
                  id: i,
                  db_id: ev.db_id,
                  date: ev.time,
                  type: ev.type || 'sighting',
                  text: ev.message
                }));
                setSightings(formatted);
              }
              
              setConfig(prev => ({
                note_title: payload.data.note_title ?? prev.note_title,
                note_text: payload.data.note_text ?? prev.note_text,
                status_text: payload.data.status_text ?? prev.status_text,
                daily_naps: payload.data.daily_naps ?? prev.daily_naps,
                adventures: payload.data.adventures ?? prev.adventures,
                tuna_snacks: payload.data.tuna_snacks ?? prev.tuna_snacks,
                picture_url: payload.data.picture_url ?? prev.picture_url
              }));
              
            } else if (payload.type === 'ORANGE_ALERT') {
              setSamMode('wacko');
            }
          } catch (err) {}
        };

        socket.onclose = () => {
          setWs(null);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.error("WebSocket init failed:", e);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  const handleAddSighting = async () => {
    if (!newSighting.trim() && !selectedImage && !selectedVideo) return;
    
    // Check for trigger words to activate wacko mode
    const text = newSighting.toLowerCase();
    if (text.includes('break') || text.includes('steal') || text.includes('b&e') || text.includes('attack') || text.includes('felony')) {
      setSamMode('wacko');
    }

    if (selectedVideo) {
      const eventId = "vid_" + Date.now().toString() + "_" + Math.floor(Math.random() * 1000);
      
      // Instantly broadcast the processing state to all connected clients
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'CMD_LOG_VIDEO_START', 
          message: newSighting || "Saw Sam",
          image_base64: selectedImage,
          event_id: eventId
        }));
      }

      // Upload the heavy raw video in the background
      const formData = new FormData();
      formData.append('video', selectedVideo);
      formData.append('event_id', eventId);
      
      fetch('/sam/api/upload_video', {
        method: 'POST',
        body: formData
      }).catch(err => console.error("Upload failed", err));
      
    } else {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'CMD_LOG', 
          message: newSighting || "Saw Sam",
          image_base64: selectedImage 
        }));
      }
    }
    
    setNewSighting('');
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  const handleSendDispatch = () => {
    if (!newDispatch.trim()) return;
    let msg = newDispatch.trim();
    if (!msg.startsWith('@')) {
      msg = `@operator: ${msg}`;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'CMD_LOG', 
        message: msg
      }));
    }
    setNewDispatch('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.currentTime = 0.1;
        video.muted = true;
        video.playsInline = true;
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          setSelectedImage(canvas.toDataURL('image/jpeg', 0.8));
          setSelectedVideo(file);
        };
        video.onerror = () => {
          alert("Could not process video frame.");
        };
        return;
      }
      
      // Validate file type and size (limit to 8MB)
      if (!file.type.startsWith('image/')) {
        alert("Please select an image or video file.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 8MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setSelectedVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const feedSam = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'CMD_FED', message: 'Sam has been fed. Diplomacy restored.' }));
    }
    setSamMode('cozy');
  };

  const handleDeleteSighting = (db_id: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'CMD_DELETE_LOG', 
          db_id: db_id 
        }));
      }
    }
  };

  // Split sightings into regular incidents and chat coordinates
  const chatMessages = sightings.filter(s => s.text && s.text.trim().startsWith('@'));
  const incidentMessages = sightings.filter(s => !s.text || !s.text.trim().startsWith('@'));

  // Default fallback messages to ensure UI is hydrated and immersive immediately
  const initialChats = [
    { sender: '@doc_wheeler', text: 'Just secured three boxes of calming pheromones from Science Officer Gwen via AetherVet! Bypassed the corporate database check cleanly. Standard barter ratio applied: 1 custom framed canvas delivered.', time: '17:10' },
    { sender: '@jukebox_jesse', text: 'Just loaded Smyrna Midnight Rain into the local playlist slots on the outpost. Chopper is howling along already. Let\'s make sure James hears this when he hits his workstation!', time: '17:15' },
    { sender: '@buster_brawler', text: 'SpiteSlice delivery van is crossing King Springs Rd. GPS telemetry is active on the Sentinel Map. Keeping an eye on the big-box retail delivery trucks trying to block our path. Max is on guard by the front gate!', time: '17:20' },
    { sender: '@barb_founder', text: 'Thanks, crew. @jack_carpenter is framing the custom canvases now with Georgia Oakwood shavings we gathered on the route today. This keeps us 100% independent. James, you watching?', time: '17:22' }
  ];

  // Parse chat messages from database
  const parsedDbChats = chatMessages.map(s => {
    const match = s.text.match(/^(@\w+):\s*(.*)/);
    if (match) {
      return {
        sender: match[1],
        text: match[2].split(' |||')[0],
        time: s.date ? s.date.split(' ')[1] || s.date : '12:00'
      };
    }
    return {
      sender: '@operator',
      text: s.text.split(' |||')[0],
      time: s.date ? s.date.split(' ')[1] || s.date : '12:00'
    };
  });

  const allChats = [...initialChats, ...parsedDbChats];

  return (
    <div id="catnip-wars-console" className="w-screen min-h-screen p-4 md:p-8 overflow-y-auto relative flex justify-center items-center bg-[#2b1f1d] text-[#e8dcd0] font-mono">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#8b5a2b_2px,transparent_2px)] [background-size:24px_24px]" />

      <div className="w-full max-w-7xl relative z-10 flex flex-col my-4">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center mb-8 relative">
          <div className={`mb-4 px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full border shadow-sm ${env.color}`}>
            {env.name} ENVIRONMENT
          </div>

          {samMode === 'wacko' && (
            <div className="mb-4 bg-red-950 border-2 border-red-700 text-red-400 px-4 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider animate-pulse max-w-md">
              ⚠️ TACTICAL ALARM: CAT WACKO / CRIME DETECTED IN BACKYARD
            </div>
          )}

          {/* Silver Duct Tape styled banner */}
          <div className="duct-tape duct-tape-header text-xl md:text-3xl font-black uppercase text-center transform -rotate-1 relative select-none">
            <div className="duct-tape-corner-tl" />
            <div className="duct-tape-corner-tr" />
            🌳 CATNIP WARS SYNDICATE 🌳
          </div>
          
          <p className="font-serif text-base font-bold text-[#b5a642] uppercase tracking-wide">
            Cardboard Tactical Terminal v1.0
          </p>
          
          {config.note_text && (
            <div className="mt-4 bg-[#3c2a21] border-2 border-[#8b5a2b] text-[#e8dcd0] px-6 py-3 rounded-xl shadow-md max-w-2xl transform -rotate-1">
              <p className="font-serif text-sm font-medium">
                🐾 <strong>{config.note_title}:</strong> {config.note_text}
              </p>
            </div>
          )}
          
          {isCreator && (
            <div className="mt-4">
              <a 
                href="#admin" 
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'admin';
                  window.location.reload();
                }}
                className="wooden-btn px-6 py-2 text-sm uppercase tracking-widest"
              >
                <Settings size={16} className="mr-2" /> Admin Portal
              </a>
            </div>
          )}
        </header>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1 (3/12): Stats & Controls */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Stats Card */}
            <div className="cardboard-panel p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="duct-tape absolute top-2 right-2 text-[8px] uppercase tracking-wider scale-75 rotate-3">
                Active Operative
              </div>

              <div className="w-32 h-32 rounded-2xl mb-6 flex items-center justify-center overflow-hidden border-4 border-[#5c4033] bg-[#f7ebd3] shadow-md">
                 <img 
                   src={`/sam/${config.picture_url}`} 
                   className="w-full h-full object-cover opacity-95"
                   alt="Sam Portrait"
                 />
              </div>
              
              <h2 className="text-lg font-bold uppercase text-[#5c4033] font-serif border-b-2 border-[#8b5a2b] w-full pb-1">
                Syndicate Intelligence
              </h2>
              
              <p className="text-md font-bold mt-2 text-[#8b5a2b] font-serif">
                {config.status_text}
              </p>

              {/* Firefly Mason Jar */}
              <div className="flex items-center gap-3 my-4 w-full justify-center">
                <div className="mason-jar shrink-0 scale-75">
                  <div className="mason-jar-lid" />
                  <div className="firefly" style={{ top: '30px', left: '20px', animationDelay: '0.1s' }} />
                  <div className="firefly" style={{ top: '50px', left: '40px', animationDelay: '0.5s' }} />
                  <div className="firefly" style={{ top: '70px', left: '15px', animationDelay: '0.9s' }} />
                </div>
                <div className="text-left font-serif text-[#5c4033] text-xs leading-tight">
                  <span className="font-bold text-[#8b5a2b]">TERRITORY STATUS:</span><br />
                  Backyard Core Plats online.<br />
                  Smyrna air space clear.<br />
                  Pi 5 watch room locked.
                </div>
              </div>
              
              {/* Dynamic Stats list mapped to Catnip Wars labels */}
              <div className="w-full mt-2 flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-[#5c4033] font-mono">
                <div className="flex justify-between border-b border-[#8b5a2b]/20 pb-1.5">
                  <span>Fortification Integrity</span>
                  <span className="text-[#8b5a2b]">{config.daily_naps || '0'}%</span>
                </div>
                <div className="flex justify-between border-b border-[#8b5a2b]/20 pb-1.5">
                  <span>Active Feline Agents</span>
                  <span className="text-[#8b5a2b]">{config.adventures || '0'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Kibble Ammo Inventory</span>
                  <span className="text-[#8b5a2b]">{config.tuna_snacks || '0'} buds</span>
                </div>
              </div>
            </div>

            {/* Wooden Action Buttons */}
            <div className="flex flex-col gap-4">
              <button 
                onClick={feedSam}
                className="wooden-btn py-4 px-4 text-sm uppercase tracking-wider w-full flex items-center justify-center gap-2"
              >
                <Utensils size={18} /> Restore Diplomacy (Feed)
              </button>
              <button 
                onClick={handleAddSighting}
                className="wooden-btn py-4 px-4 text-sm uppercase tracking-wider w-full flex items-center justify-center gap-2"
              >
                <Camera size={18} /> Log Sighting / Incident
              </button>
            </div>

          </div>

          {/* Column 2 (5/12): Tactical Incident Ledger */}
          <div className="cardboard-panel lg:col-span-5 p-6 flex flex-col min-h-[600px] h-[750px]">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#5c4033]/20 pb-3">
              <h2 className="text-lg font-bold uppercase flex items-center gap-2 text-[#5c4033] font-serif">
                <BookOpen size={22} /> SYNDICATE INCIDENT LEDGER
              </h2>
              <div className="flex items-center gap-2 bg-[#f7ebd3] border border-[#8b5a2b] px-3 py-1 rounded-full text-[10px] font-bold text-[#8b5a2b] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SECURE WIRE
              </div>
            </div>

            {/* Incident Entry Input */}
            <div className="flex flex-col gap-3 mb-6 bg-[#f7ebd3] p-4 border border-[#8b5a2b] rounded-lg">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSighting}
                  onChange={(e) => setNewSighting(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSighting()}
                  placeholder="Report incident or coordinate status..."
                  className="flex-1 px-4 py-2 text-sm rounded-lg outline-none font-bold bg-[#fcf8ef] border border-[#8b5a2b] text-[#5c4033] placeholder:text-[#8b5a2b]/40 font-mono focus:border-amber-500"
                />
                <button 
                  onClick={handleAddSighting}
                  className="wooden-btn px-4 py-2 text-xs uppercase tracking-wider"
                >
                  Log
                </button>
              </div>
              <div className="flex items-center gap-4 justify-between">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 bg-[#fcf8ef] text-[#8b5a2b] hover:bg-[#e5c290] border border-[#8b5a2b] font-mono">
                  <Camera size={12} /> Attach Photo/Video
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {selectedImage && (
                  <div className="relative">
                    <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded border border-[#5c4033]" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold border border-black text-[9px]">×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Incidents Feed scroll container */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {incidentMessages.map((s) => (
                  <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border-2 bg-white border-[#e5c290] shadow-sm relative overflow-hidden"
                  >
                    <div className="font-mono text-[10px] mb-2 uppercase tracking-widest flex items-center justify-between text-[#8b5a2b]">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} /> {s.date}
                      </div>
                      {isCreator && s.db_id && (
                        <button 
                          onClick={() => handleDeleteSighting(s.db_id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    
                    <div className="font-medium text-xs text-[#5c4033] leading-relaxed">
                      <span className="font-bold mr-1 text-[#8b5a2b] font-serif">Sighting:</span> 
                      {s.text.split(' |||')[0]}
                    </div>

                    {s.text.includes(' ||| IMG:') && (() => {
                      const parts = s.text.split(' ||| IMG:');
                      const imgUrls = parts.slice(1);
                      if (imgUrls.length === 1) {
                        const src = imgUrls[0].startsWith('http') ? imgUrls[0] : `/sam${imgUrls[0]}`;
                        return (
                          <div className="mt-3">
                            <img 
                              src={src} 
                              alt="Sighting Evidence" 
                              onClick={() => setLightboxImage(src)}
                              className="rounded-lg border-2 border-black max-h-48 w-full object-cover hover:scale-[1.01] cursor-pointer transition-transform duration-200" 
                            />
                          </div>
                        );
                      } else {
                        // Multi-panel comic strip
                        const panelNames = ["THE FLIP", "GPS HORIZON", "WEATHER MATRIX", "METS TEMPO", "CLIMAX ESCAPE"];
                        return (
                          <div className="mt-3 p-3 bg-amber-50/70 rounded-lg border border-black shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                            <div className="font-display font-bold text-center text-xs uppercase tracking-wider mb-2 text-black border-b border-black pb-1 bg-yellow-200 rounded">
                              📖 METSY'S DAILY ADVENTURES
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {imgUrls.map((imgUrl: string, idx: number) => {
                                const src = imgUrl.startsWith('http') ? imgUrl : `/sam${imgUrl}`;
                                return (
                                  <div key={idx} className="bg-white p-1 rounded border border-black flex flex-col justify-between shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
                                    <img 
                                      src={src} 
                                      alt={`Panel ${idx + 1}`} 
                                      onClick={() => setLightboxImage(src)}
                                      className="w-full aspect-square object-cover rounded border border-slate-300 hover:scale-[1.03] cursor-pointer transition-all duration-200" 
                                    />
                                    <div className="mt-1 text-[8px] text-center font-black uppercase text-slate-800 scale-90">
                                      {panelNames[idx] || `P${idx + 1}`}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {s.text.includes(' ||| VID_PROCESSING:') && (() => {
                      const vidProcUrl = s.text.split(' ||| VID_PROCESSING:')[1];
                      const src = vidProcUrl.startsWith('http') ? vidProcUrl : `/sam${vidProcUrl}`;
                      return (
                        <div className="mt-3 relative inline-block">
                          <img src={src} alt="Evidence" className="rounded-lg border-2 border-black max-h-48 object-cover opacity-50" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="bg-black/70 text-white font-bold text-[9px] px-2 py-1 rounded animate-pulse uppercase tracking-wider border border-white/20">Processing...</div>
                          </div>
                        </div>
                      );
                    })()}

                    {s.text.includes(' ||| VID:') && (() => {
                      const vidUrl = s.text.split(' ||| VID:')[1];
                      const src = vidUrl.startsWith('http') ? vidUrl : `/sam${vidUrl}`;
                      return (
                        <div className="mt-3 bg-black rounded-lg border-2 border-black overflow-hidden relative">
                          <video src={src} controls preload="metadata" className="w-full max-h-48 object-contain bg-black" />
                        </div>
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3 (4/12): Strategic Coordination Feed (Chat) */}
          <div className="cardboard-panel lg:col-span-4 p-6 flex flex-col min-h-[600px] h-[750px]">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#5c4033]/20 pb-3">
              <h2 className="text-lg font-bold uppercase flex items-center gap-2 text-[#5c4033] font-serif">
                <MessageSquare size={22} /> STRATEGIC COORDINATION FEED
              </h2>
              <div className="flex items-center gap-1.5 bg-[#f7ebd3] border border-[#8b5a2b] px-3 py-1 rounded-full text-[10px] font-bold text-[#8b5a2b] font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                OUTPOST FEED
              </div>
            </div>

            {/* Chat List Scroll container */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {allChats.map((chat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl border border-[#e5c290] bg-[#fdfaf2] shadow-sm relative"
                  >
                    <div className="flex justify-between items-center mb-1.5 border-b border-[#8b5a2b]/10 pb-1">
                      <span className="font-bold text-xs text-[#8b5a2b] font-sans">
                        {chat.sender}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#5c4033] leading-relaxed font-serif">
                      {chat.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Chat input dispatch board */}
            <div className="mt-4 pt-3 border-t border-[#8b5a2b]/20 flex gap-2">
              <input 
                type="text" 
                value={newDispatch}
                onChange={(e) => setNewDispatch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendDispatch()}
                placeholder="Broadcast dispatch (e.g. @operator: all clear)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg outline-none font-bold bg-[#f7ebd3] border border-[#8b5a2b] text-[#5c4033] placeholder:text-[#8b5a2b]/40 font-mono focus:border-amber-500"
              />
              <button 
                onClick={handleSendDispatch}
                className="wooden-btn px-4 py-2 text-xs uppercase tracking-wider shrink-0"
              >
                Send
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full flex flex-col items-center border-4 border-[#5c4033] shadow-2xl p-6 bg-[#f7ebd3] rounded-2xl"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-full"
                aria-label="Close Lightbox"
              >
                <X size={24} />
              </button>

              <h3 className="text-lg font-bold mb-4 uppercase tracking-widest text-[#5c4033] font-serif">
                🔍 Sighting Evidence
              </h3>

              <div className="overflow-hidden border-4 border-[#5c4033] mb-6 max-h-[70vh] flex items-center justify-center rounded-xl bg-white">
                <img
                  src={lightboxImage}
                  alt="Enlarged Sighting"
                  className="max-h-[60vh] max-w-full object-contain"
                />
              </div>

              <div className="flex gap-4">
                <a
                  href={lightboxImage}
                  download={`sam_sighting_${Date.now()}.jpg`}
                  className="wooden-btn py-3 px-6 text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <Download size={18} /> Save Image
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="wooden-btn py-3 px-6 text-sm uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
