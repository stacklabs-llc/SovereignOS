import React, { useState, useEffect } from 'react';
import { Camera, Utensils, Calendar, BookOpen, Ghost, Zap, Settings, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [samMode, setSamMode] = useState<'cozy' | 'wacko'>('cozy');
  const [sightings, setSightings] = useState<any[]>([]);
  const [newSighting, setNewSighting] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
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

  return (
    <div className={`w-screen min-h-screen p-4 md:p-8 transition-all duration-1000 overflow-hidden relative flex justify-center items-center ${
      samMode === 'cozy' 
        ? 'bg-[#fef9e7] text-slate-800' 
        : 'bg-[#ff6b00] text-black border-8 border-green-500'
    }`}>
      
      {/* Background Texture/Images */}
      <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply" 
           style={{ 
             backgroundImage: `url('/sam/${samMode === 'cozy' ? 'UI_grid_watercolor_field_journal_202605081352.jpeg' : 'Radioactive_sludge_mobile_app_sc…_202605081352.jpeg'}')`,
             backgroundSize: '100% auto',
             backgroundRepeat: 'repeat-y',
             backgroundPosition: 'top center'
           }} 
      />

      <div className="w-full max-w-6xl relative z-10 flex flex-col">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center mb-8 relative">
          {/* Dynamic Environment Pill (KI_031) */}
          <div className={`mb-4 px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full border shadow-sm ${env.color}`}>
            {env.name} ENVIRONMENT
          </div>

          <h1 className={`font-bold tracking-widest ${
            samMode === 'cozy' 
              ? 'font-serif text-5xl md:text-7xl text-[#d97706]' 
              : 'font-display text-6xl md:text-8xl text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase tracking-tighter transform -skew-x-6'
          }`}>
            {samMode === 'cozy' ? 'SamTracker' : 'TRACK \'EM! CAT \'EM!'}
          </h1>
          <p className={`mt-2 font-bold ${samMode === 'cozy' ? 'font-mono text-lg text-amber-700/60 uppercase' : 'font-display text-2xl bg-black text-green-400 px-4 py-1 rotate-2'}`}>
            {samMode === 'cozy' ? 'Est. 2023 · The Biological Oracle' : 'REPORT CAT WACKO!!!'}
          </p>
          
          {samMode === 'cozy' && config.note_text && (
            <div className="mt-4 bg-amber-100/80 backdrop-blur-sm border-2 border-amber-300 text-amber-800 px-6 py-3 rounded-xl shadow-sm max-w-2xl transform -rotate-1">
              <p className="font-serif text-lg font-medium">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-md ${
                  samMode === 'cozy'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-black text-green-400 border-2 border-green-500 hover:bg-green-900'
                }`}
              >
                <Settings size={16} /> Admin Portal
              </a>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Actions */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Status Box */}
            <div className={`p-6 rounded-2xl border-4 shadow-xl flex flex-col items-center text-center ${
              samMode === 'cozy' 
                ? 'bg-white/90 border-amber-300 backdrop-blur-sm' 
                : 'bg-purple-600 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]'
            }`}>
              <div className={`w-40 h-40 rounded-full mb-6 flex items-center justify-center overflow-hidden border-4 ${samMode === 'cozy' ? 'bg-amber-100 border-white shadow-inner' : 'bg-green-400 border-black animate-pulse shadow-[4px_4px_0px_rgba(0,0,0,1)]'}`}>
                 <img 
                   src={`/sam/${samMode === 'cozy' ? config.picture_url : 'sovereign_sam_tracker_stacklift_1774835849312.png_202605081352.jpeg'}`} 
                   className="w-full h-full object-cover opacity-90"
                   alt="Sam Portrait"
                 />
              </div>
              <h2 className={`text-2xl font-bold uppercase ${samMode === 'cozy' ? 'text-amber-800 font-serif' : 'text-white font-display text-3xl tracking-widest'}`}>
                Current Status
              </h2>
              <p className={`text-4xl font-bold mt-2 ${samMode === 'cozy' ? 'text-slate-600 font-serif' : 'text-yellow-300 font-display animate-bounce'}`}>
                {samMode === 'cozy' ? config.status_text : 'FELONY MODE!!!'}
              </p>
              
              <div className={`w-full mt-8 flex flex-col gap-3 text-lg font-bold uppercase tracking-wider ${samMode === 'cozy' ? 'font-mono text-amber-700/80' : 'font-display text-white text-xl'}`}>
                <div className="flex justify-between border-b-2 border-black/10 pb-2"><span>Daily Naps</span><span>{samMode === 'cozy' ? config.daily_naps : '0'}</span></div>
                <div className="flex justify-between border-b-2 border-black/10 pb-2"><span>Adventures</span><span>{samMode === 'cozy' ? config.adventures : '42'}</span></div>
                <div className="flex justify-between pb-2"><span>Tuna Snacks</span><span>{samMode === 'cozy' ? config.tuna_snacks : 'STOLEN'}</span></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-2">
              <button 
                onClick={feedSam}
                className={`py-5 px-6 rounded-2xl font-bold text-xl uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 ${
                  samMode === 'cozy' 
                    ? 'bg-emerald-500 text-white shadow-[0_6px_0_rgba(4,120,87,1)] font-serif' 
                    : 'bg-green-500 text-black border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] font-display'
                }`}
              >
                <Utensils size={28} /> I Just Fed Sam
              </button>
              <button 
                onClick={handleAddSighting}
                className={`py-5 px-6 rounded-2xl font-bold text-xl uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4 ${
                  samMode === 'cozy' 
                    ? 'bg-blue-500 text-white shadow-[0_6px_0_rgba(29,78,216,1)] font-serif' 
                    : 'bg-red-500 text-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] animate-pulse font-display text-2xl'
                }`}
              >
                <Camera size={28} /> {samMode === 'cozy' ? 'Log Sighting' : 'REPORT CRIME'}
              </button>
            </div>

          </div>

          {/* Right Column: The Ledger */}
          <div className={`md:col-span-8 p-8 rounded-2xl border-4 shadow-xl flex flex-col min-h-[600px] ${
            samMode === 'cozy' 
              ? 'bg-white/90 border-amber-300 backdrop-blur-sm' 
              : 'bg-yellow-300 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]'
          }`}>
            <div className="flex items-center justify-between mb-8 border-b-4 border-black/10 pb-4">
              <h2 className={`text-3xl font-bold uppercase flex items-center gap-3 ${samMode === 'cozy' ? 'text-amber-800 font-serif' : 'text-black font-display text-4xl'}`}>
                <BookOpen size={32} /> {samMode === 'cozy' ? 'Recent Activity Ledger' : 'SUSPECT INCIDENT REPORT'}
              </h2>
              <button onClick={() => setSamMode(prev => prev === 'cozy' ? 'wacko' : 'cozy')} className="p-3 rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                {samMode === 'cozy' ? <Ghost size={24} className="text-amber-600" /> : <Zap size={24} className="text-black" />}
              </button>
            </div>

            {/* Sighting Input */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={newSighting}
                  onChange={(e) => setNewSighting(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSighting()}
                  placeholder={samMode === 'cozy' ? "What did Sam do today?" : "DESCRIBE THE CRIME..."}
                  className={`flex-1 px-5 py-4 rounded-xl outline-none font-bold text-lg md:text-xl ${
                    samMode === 'cozy'
                      ? 'bg-amber-50 border-2 border-amber-200 text-slate-700 placeholder:text-amber-400/70'
                      : 'bg-white border-4 border-black text-black uppercase tracking-widest placeholder:text-black/30'
                  }`}
                />
                <button 
                  onClick={handleAddSighting}
                  className={`px-8 py-4 font-bold text-xl uppercase tracking-widest rounded-xl flex items-center justify-center ${
                    samMode === 'cozy'
                      ? 'bg-amber-500 text-white hover:bg-amber-600 font-serif shadow-[0_4px_0_rgba(217,119,6,1)]'
                      : 'bg-black text-white border-4 border-black hover:bg-zinc-800 font-display shadow-[4px_4px_0_rgba(0,0,0,1)]'
                  }`}
                >
                  Log
                </button>
              </div>
              <div className="flex items-center gap-4">
                <label className={`cursor-pointer px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${samMode === 'cozy' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-2 border-amber-300' : 'bg-black text-white border-2 border-black hover:bg-gray-800'}`}>
                  <Camera size={18} /> {samMode === 'cozy' ? 'Attach Photo/Video' : 'Attach Evidence'}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
                </label>
                {selectedImage && (
                  <div className="relative">
                    <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border-2 border-black" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-black">x</button>
                  </div>
                )}
              </div>
            </div>

            {/* Sightings Feed */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
              <AnimatePresence>
                {sightings.map((s) => (
                  <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-6 rounded-2xl border-2 ${
                      samMode === 'cozy'
                        ? 'bg-white border-amber-100 shadow-md'
                        : 'bg-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:rotate-1 transition-transform'
                    }`}
                  >
                    <div className={`font-mono text-sm mb-3 uppercase tracking-widest flex items-center justify-between ${samMode === 'cozy' ? 'text-amber-500' : 'text-purple-600 font-bold bg-black/5 p-1'}`}>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} /> {s.date}
                      </div>
                      {isCreator && s.db_id && (
                        <button 
                          onClick={() => handleDeleteSighting(s.db_id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className={`font-medium leading-relaxed ${samMode === 'cozy' ? 'text-slate-800 text-base md:text-lg' : 'text-black font-bold text-lg md:text-xl uppercase tracking-wide'}`}>
                      <span className={`font-bold mr-2 ${samMode === 'cozy' ? 'text-amber-700' : 'text-red-600'}`}>Sighting:</span> 
                      {s.text.split(' |||')[0]}
                    </div>
                    {s.text.includes(' ||| IMG:') && (() => {
                      const imgUrl = s.text.split(' ||| IMG:')[1];
                      const src = imgUrl.startsWith('http') ? imgUrl : `/sam${imgUrl}`;
                      return (
                        <div className="mt-4">
                          <img src={src} alt="Sighting Evidence" className="rounded-xl border-4 border-black max-h-64 object-cover" />
                        </div>
                      );
                    })()}
                    {s.text.includes(' ||| VID_PROCESSING:') && (() => {
                      const vidProcUrl = s.text.split(' ||| VID_PROCESSING:')[1];
                      const src = vidProcUrl.startsWith('http') ? vidProcUrl : `/sam${vidProcUrl}`;
                      return (
                        <div className="mt-4 relative inline-block">
                          <img src={src} alt="Evidence" className="rounded-xl border-4 border-black max-h-64 object-cover opacity-50" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="bg-black/70 text-white font-bold text-sm px-4 py-2 rounded-lg animate-pulse uppercase tracking-widest border border-white/20">Processing Video...</div>
                          </div>
                        </div>
                      );
                    })()}
                    {s.text.includes(' ||| VID:') && (() => {
                      const vidUrl = s.text.split(' ||| VID:')[1];
                      const src = vidUrl.startsWith('http') ? vidUrl : `/sam${vidUrl}`;
                      return (
                        <div className="mt-4 bg-black rounded-xl border-4 border-black overflow-hidden relative">
                          <video src={src} controls preload="metadata" className="w-full max-h-64 object-contain bg-black" />
                        </div>
                      );
                    })()}
                    
                    {s.id === 1 && samMode === 'wacko' && !s.text.includes(' |||') && (
                      <div className="mt-6 flex gap-4">
                        <div className="w-24 h-24 bg-green-400 border-4 border-black flex items-center justify-center font-display font-bold text-lg text-center p-2 uppercase shadow-[4px_4px_0_rgba(0,0,0,1)] rotate-3">EVIDENCE A</div>
                        <div className="w-24 h-24 bg-pink-400 border-4 border-black flex items-center justify-center font-display font-bold text-lg text-center p-2 uppercase shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-2">EVIDENCE B</div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
