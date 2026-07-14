import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Subtitles, Square } from 'lucide-react';

interface VideoPlayerProps {
  onBack: () => void;
  videoUrl: string;
}

export default function VideoPlayer({ onBack, videoUrl }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const getApiUrl = () => {
    return '/api/theater/command';
  };

  useEffect(() => {
    // 1. Immediately launch MPV natively on clio (:0 TV)
    fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'play_mpv',
        extra: { video_url: videoUrl }
      })
    }).catch(err => console.error("Error triggering MPV play:", err));

    // 2. Listen to websocket for command sync
    let ws: WebSocket | null = null;
    try {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${wsProto}//${window.location.host}/ws/theater`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'THEATER_COMMAND') {
            if (data.command === 'play') setIsPlaying(true);
            if (data.command === 'pause') setIsPlaying(false);
            if (data.command === 'back') handleBack();
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      if (ws) ws.close();
    };
  }, [videoUrl]);

  const sendCommand = (cmd: string, extra?: any) => {
    fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd, extra })
    }).catch(err => console.error(err));
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      sendCommand('pause');
      setIsPlaying(false);
    } else {
      sendCommand('play');
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    sendCommand('back');
    onBack();
  };

  // Human-readable title
  const cleanTitle = videoUrl
    .split('/')
    .pop()
    ?.replace(/\.[^/.]+$/, "") // remove extension
    ?.replace(/[._]/g, " ") || "Sovereign Show";

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0c] flex flex-col items-center justify-center font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-black to-black z-0" />

      {/* Back Button */}
      <button 
        onClick={handleBack}
        className="absolute top-8 left-8 z-10 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-5 rounded-full border border-white/10 backdrop-blur-md"
      >
        <ArrowLeft size={36} />
      </button>

      {/* Main Remote Dashboard Panel */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">
        
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 font-mono text-lg tracking-widest mb-4 shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse">
            📺 PLAYING NATIVELY ON TV (MPV ENGINE)
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] leading-tight mb-4">
            {cleanTitle}
          </h2>
          <p className="text-2xl text-gray-400 font-mono">
            Full Hardware-Accelerated 4K Decode Active
          </p>
        </div>

        {/* Remote Grid Controls */}
        <div className="bg-[#111115]/80 border border-white/5 p-8 rounded-3xl backdrop-blur-xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-8">
          
          {/* Main Playback Row */}
          <div className="flex justify-center items-center gap-8">
            <button 
              onClick={() => sendCommand('rewind')}
              title="Rewind 10s"
              className="p-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
            >
              <RotateCcw size={40} />
            </button>

            <button 
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
              className="p-8 rounded-full bg-white text-black hover:bg-gray-200 transition-all transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause size={48} /> : <Play size={48} />}
            </button>

            <button 
              onClick={() => sendCommand('forward')}
              title="Fast Forward 10s"
              className="p-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
            >
              <RotateCw size={40} />
            </button>
          </div>

          {/* Volume and Subtitle Control Row */}
          <div className="flex justify-center items-center gap-6 mt-4">
            <button 
              onClick={() => sendCommand('volume_down')}
              title="Volume Down"
              className="p-5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
            >
              <VolumeX size={28} />
            </button>

            <button 
              onClick={() => sendCommand('volume_up')}
              title="Volume Up"
              className="p-5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
            >
              <Volume2 size={28} />
            </button>

            <button 
              onClick={() => sendCommand('toggle_subtitles')}
              title="Cycle Subtitle Tracks"
              className="p-5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
            >
              <Subtitles size={28} />
            </button>
          </div>

          {/* STOP Button */}
          <div className="border-t border-white/5 pt-6 mt-4">
            <button 
              onClick={handleBack}
              className="w-full py-5 rounded-2xl bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-red-400 font-bold text-2xl tracking-wider hover:text-red-300 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]"
            >
              <Square size={24} fill="currentColor" /> STOP STREAM
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
