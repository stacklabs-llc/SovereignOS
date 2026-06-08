import { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, Volume2, Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, AlertTriangle, Info, ShieldAlert, Clock } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'critical' | 'info' | 'maintenance';
  title: string;
  time: string;
  message: string;
}

export default function TvProjectionDashboard() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(58);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');

  // Periodically check if a UAT run screenshot exists to display
  useEffect(() => {
    const checkScreenshot = () => {
      const url = `/inbox/today/UAT_Verification_Headed_Result.png?cb=${Date.now()}`;
      const img = new Image();
      img.onload = () => setScreenshotUrl(url);
      img.onerror = () => {}; // Fail silently if not found/no run yet
      img.src = url;
    };
    checkScreenshot();
    const interval = setInterval(checkScreenshot, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' | ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate progress bar movement slowly
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 0.1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'critical',
      title: 'CRITICAL WARNING',
      time: 'Time: 2:48 PM',
      message: 'Kiosk 4 Network Latency Spike detected.'
    },
    {
      id: '2',
      type: 'info',
      title: 'INFO',
      time: 'Time: 2:45 PM',
      message: 'System Update scheduled for 11:00 PM.'
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'MAINTENANCE',
      time: 'Time: 1:12 PM',
      message: 'Projector Calibration required.'
    }
  ];

  return (
    <div 
      className="min-h-screen w-full bg-[#04060A] text-white p-8 flex flex-col justify-between font-sans select-none overflow-hidden"
      style={{ cursor: 'none' }} // Hide cursor on kiosk display
    >
      {/* Top Header Bar */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#2DD4BF] rounded-full animate-pulse shadow-[0_0_10px_#2DD4BF]" />
          <h1 className="text-xl font-bold tracking-[0.25em] text-[#2DD4BF] uppercase font-mono">
            Sovereign TV
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
          <span className="bg-slate-800/60 px-3 py-1 rounded-md border border-slate-700/50">
            Node: Hobbes (100.88.5.122)
          </span>
          <span className="font-semibold text-slate-300">
            {currentTime}
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-12 gap-8 flex-1 items-stretch mb-4">
        {/* Section 1: Sovereign Cinema (Left Column) */}
        <div className="col-span-5 flex flex-col bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] justify-between hover:border-[#2DD4BF]/30 transition-all duration-300">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-4 flex items-center gap-2">
              🎬 Now Playing
            </h2>
            
            <div className="flex gap-5">
              {/* Poster Art */}
              <div className="w-1/3 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-lg relative group">
                <img 
                  src="/media/dune_poster.png" 
                  alt="Dune: Part Two Poster" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback if poster fails to load
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=300';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Movie Details */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight tracking-wide">
                    DUNE: PART TWO
                  </h3>
                  <div className="flex gap-2 items-center text-[10px] text-slate-400 font-semibold mt-1">
                    <span className="border border-slate-600 px-1.5 py-0.25 rounded text-white bg-slate-800">PG-13</span>
                    <span>•</span>
                    <span>2h 46min</span>
                    <span>•</span>
                    <span className="text-[#FBBF24]">Sci-Fi / Action</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed line-clamp-4">
                    Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.
                  </p>
                </div>

                {/* Duration Label */}
                <div className="flex justify-between items-end text-xs font-mono text-slate-400 mt-2">
                  <span>1:34:58</span>
                  <span className="text-[#2DD4BF] font-semibold">{Math.round(progress)}%</span>
                  <span>2:46:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar & Buttons */}
          <div className="mt-4">
            {/* Progress Slider */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
              <div 
                className="bg-gradient-to-r from-[#2DD4BF] to-[#0EA5E9] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-2xl">
              <div className="flex gap-2">
                <button 
                  onClick={() => setProgress(prev => Math.max(0, prev - 5))}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  <Rewind size={16} className="text-slate-300" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-[#2DD4BF] rounded-xl hover:bg-[#26b4a2] active:scale-95 transition-all text-black flex items-center justify-center shadow-[0_0_10px_rgba(45,212,191,0.3)]"
                >
                  {isPlaying ? <Pause fill="black" size={16} /> : <Play fill="black" size={16} />}
                </button>
                <button 
                  onClick={() => setProgress(prev => Math.min(100, prev + 5))}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  <FastForward size={16} className="text-slate-300" />
                </button>
              </div>

              {/* Volume status */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-mono font-bold ${
                  isMuted 
                    ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                    : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Volume2 size={16} />
                <span>{isMuted ? 'MUTED' : 'HDMI AUDIO'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: HoloLink Video (Middle Column) */}
        <div className="col-span-4 flex flex-col bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] justify-between hover:border-[#F59E0B]/30 transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center gap-2">
                🎥 HoloLink Video
              </h2>
              <span className="bg-[#10B981]/15 text-[#10B981] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#10B981]/35 flex items-center gap-1 shadow-[0_0_5px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-ping" />
                CONNECTED
              </span>
            </div>

            {/* Video Feed Placeholder */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 relative bg-black/60 shadow-inner group">
              {/* Telepresence scanner graphics */}
              <div className="absolute inset-0 border border-[#F59E0B]/20 pointer-events-none rounded-2xl" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2.5 py-0.75 rounded-md text-[9px] font-mono text-slate-300 border border-white/10 flex items-center gap-1.5">
                <Clock size={10} className="text-[#F59E0B]" />
                <span>Active Feed | Studio 7</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur px-2.5 py-0.75 rounded-md text-[9px] font-mono text-[#F59E0B] border border-[#F59E0B]/20 font-bold uppercase tracking-wider">
                98 Mbps ⬆
              </div>

              {/* Sci-Fi Target grid */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <div className="w-20 h-20 border border-dashed border-white/40 rounded-full animate-spin [animation-duration:15s]" />
                <div className="w-32 h-32 border border-dashed border-white/20 rounded-full absolute animate-spin [animation-duration:30s] [animation-direction:reverse]" />
                <div className="w-full border-t border-white/10 absolute" />
                <div className="h-full border-l border-white/10 absolute" />
              </div>

              {/* Eileen telepresence representation */}
              {screenshotUrl ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black/80">
                  <img 
                    src={screenshotUrl} 
                    alt="Active UAT Run Viewport" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2.5 py-0.75 rounded-md text-[9px] font-mono text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-bold">
                    Live UAT Feed
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center gap-2 p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#EF4444] p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-lg text-white">
                      👵
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">Eileen's Telepresence</div>
                  <div className="text-[10px] text-slate-400 font-mono">iPad Remote Stack Linked</div>
                </div>
              )}
            </div>

            {/* Participants list */}
            <div className="mt-4">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 font-mono">
                Participants
              </div>
              <div className="flex gap-2 overflow-x-hidden">
                {['Alex R.', 'Sarah M.', 'Marcus L.', 'Emily C.'].map((name, i) => (
                  <div key={name} className="bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                      {name[0]}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Video / Call Action controls */}
          <div className="flex gap-2 w-full mt-4 justify-between">
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`flex-1 py-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                isMicOn 
                  ? 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10' 
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">Mic</span>
            </button>

            <button 
              onClick={() => setIsCamOn(!isCamOn)}
              className={`flex-1 py-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                isCamOn 
                  ? 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10' 
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {isCamOn ? <Video size={16} /> : <VideoOff size={16} />}
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">Camera</span>
            </button>

            <button className="flex-1 py-3.5 bg-white/5 border border-white/5 text-slate-300 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-1">
              <ScreenShare size={16} className="text-sky-400" />
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">Share</span>
            </button>

            <button className="flex-1 py-3.5 bg-red-600 border border-red-600 text-white rounded-2xl hover:bg-red-700 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
              <PhoneOff size={16} />
              <span className="text-[9px] font-mono tracking-widest uppercase font-bold">End Call</span>
            </button>
          </div>
        </div>

        {/* Section 3: Active Alerts (Right Column) */}
        <div className="col-span-3 flex flex-col bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] justify-between hover:border-red-500/30 transition-all duration-300">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-4 flex items-center gap-2">
              🚨 Active Alerts
            </h2>

            {/* List of alerts */}
            <div className="flex flex-col gap-4">
              {alerts.map((alert) => {
                const getAlertStyle = () => {
                  if (alert.type === 'critical') return {
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/10',
                    badgeBg: 'bg-red-500/20 text-red-400',
                    icon: <ShieldAlert size={14} className="text-red-400" />
                  };
                  if (alert.type === 'info') return {
                    border: 'border-sky-500/20',
                    bg: 'bg-sky-500/10',
                    badgeBg: 'bg-sky-500/20 text-sky-400',
                    icon: <Info size={14} className="text-sky-400" />
                  };
                  return {
                    border: 'border-amber-500/20',
                    bg: 'bg-amber-500/10',
                    badgeBg: 'bg-amber-500/20 text-amber-400',
                    icon: <AlertTriangle size={14} className="text-amber-400" />
                  };
                };

                const style = getAlertStyle();

                return (
                  <div 
                    key={alert.id} 
                    className={`border ${style.border} ${style.bg} p-4 rounded-2xl flex flex-col gap-2 transition-all duration-300 hover:scale-[1.01]`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 ${style.badgeBg}`}>
                        {style.icon}
                        {alert.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold font-mono">
                      {alert.time}
                    </div>
                    <p className="text-xs text-slate-200 leading-normal">
                      {alert.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer warning stamp */}
          <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono text-center leading-normal">
            Sovereign OS Command Center • Telepresence Layer 4
          </div>
        </div>
      </div>
    </div>
  );
}
