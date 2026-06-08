import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, FastForward, Rewind, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleDot, MousePointer2, Gamepad2, Subtitles, RefreshCw } from 'lucide-react';

export default function SovereignCinemaRemote() {
    const [mode, setMode] = useState<'dpad' | 'trackpad'>('dpad');
    const [activeTargetTV, setActiveTargetTV] = useState<'living_room' | 'bedroom'>('living_room');
    const [cinemaStatus, setCinemaStatus] = useState<'online' | 'offline' | 'restarting' | 'unknown'>('unknown');
    const [launching, setLaunching] = useState(false);

    // For throttling mouse moves
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const lastSendTime = useRef<number>(0);

    // Poll cinema status every 5 seconds
    useEffect(() => {
        const checkStatus = async () => {
            if (cinemaStatus === 'restarting') return; // don't interrupt restart polling
            try {
                const res = await fetch('/api/cinema/status');
                const data = await res.json();
                setCinemaStatus(data.status === 'online' ? 'online' : 'offline');
            } catch {
                setCinemaStatus('offline');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [cinemaStatus]);

    const restartCinema = async () => {
        setCinemaStatus('restarting');
        await sendCommand('restart_cinema');
        // Poll every 3s until it comes back up (max 60s)
        let attempts = 0;
        const poll = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch('/api/cinema/status');
                const data = await res.json();
                if (data.status === 'online') {
                    setCinemaStatus('online');
                    clearInterval(poll);
                }
            } catch { /* keep polling */ }
            if (attempts > 20) { setCinemaStatus('offline'); clearInterval(poll); }
        }, 3000);
    };

    const sendCommand = async (command: string, extra?: any) => {
        try {
            await fetch('/api/theater/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, target: activeTargetTV, ...extra })
            });
        } catch (e) {
            console.error("Failed to send command", e);
        }
    };

    const castToTV = async (ip: string, room: 'living_room' | 'bedroom') => {
        setActiveTargetTV(room);
        try {
            const targetUrl = `https://clio.taila01894.ts.net/cinema-portal/?room=${room}`;
            await fetch(`/api/cast_tv/${ip}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
        } catch (e) {
            console.error("Failed to cast to TV", e);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        lastPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!lastPos.current) return;
        
        const now = Date.now();
        if (now - lastSendTime.current < 50) return; // throttle to ~20Hz
        
        const touch = e.touches[0];
        const dx = touch.clientX - lastPos.current.x;
        const dy = touch.clientY - lastPos.current.y;
        
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            sendCommand('mousemove', { x: Math.round(dx * 1.5), y: Math.round(dy * 1.5) });
            lastPos.current = { x: touch.clientX, y: touch.clientY };
            lastSendTime.current = now;
        }
    };

    const handleTouchEnd = () => {
        lastPos.current = null;
    };

    const handleTrackpadClick = () => {
        sendCommand('mouseclick');
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white p-4 flex flex-col items-center justify-start gap-4 font-sans overflow-y-auto pb-10">
            <div className="flex flex-col items-center mt-2">
                <h1 className="text-2xl font-bold tracking-widest text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                    SOVEREIGN REMOTE
                </h1>
                <p className="text-[#38bdf8] text-[10px] tracking-[0.2em] mt-1 font-mono uppercase">
                    Universal TV Control
                </p>
                {/* Cinema Status Indicator */}
                <div className="flex items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    <span className={`w-2 h-2 rounded-full ${
                        cinemaStatus === 'online' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' :
                        cinemaStatus === 'restarting' ? 'bg-yellow-400 animate-pulse shadow-[0_0_6px_rgba(250,204,21,0.8)]' :
                        cinemaStatus === 'offline' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' :
                        'bg-white/20'
                    }`} />
                    <span className="text-[9px] uppercase tracking-widest font-mono text-white/60">
                        Cinema {cinemaStatus === 'restarting' ? 'Restarting…' : cinemaStatus}
                    </span>
                </div>
            </div>

            {/* TV Selector */}
            <div className="flex flex-col gap-2 w-full max-w-sm mb-2">
                <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold text-center">Active Target: {activeTargetTV.replace('_', ' ')}</div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => castToTV('192.168.1.68', 'living_room')} 
                        className={`flex-1 p-3 rounded-xl flex items-center justify-center transition-all border ${activeTargetTV === 'living_room' ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">📺 65" TV</span>
                    </button>
                    <button 
                        onClick={() => castToTV('192.168.1.111', 'bedroom')} 
                        className={`flex-1 p-3 rounded-xl flex items-center justify-center transition-all border ${activeTargetTV === 'bedroom' ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                        <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-2">📺 55" TV</span>
                    </button>
                </div>
            </div>

            {/* ── PRIMARY ACTION: Open Cinema on TV ── */}
            <div className="w-full max-w-sm">
                <button
                    onClick={async () => {
                        setLaunching(true);
                        await sendCommand('launch_cinema');
                        setTimeout(() => setLaunching(false), 4000);
                    }}
                    disabled={launching}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold tracking-widest text-sm uppercase transition-all active:scale-95 border-2 ${
                        launching
                            ? 'bg-[#E50914]/20 border-[#E50914]/40 text-[#E50914] cursor-not-allowed'
                            : 'bg-[#E50914] border-[#E50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] hover:scale-[1.02]'
                    }`}
                >
                    {launching
                        ? <><RefreshCw size={18} className="animate-spin" /> Loading Cinema…</>
                        : <>🎬 Open Cinema on TV</>
                    }
                </button>
                <p className="text-[9px] text-white/30 text-center mt-1 font-mono">Navigates the TV browser directly to the movie player</p>
            </div>

            {/* Mode Switcher */}

            <div className="flex bg-white/10 rounded-xl p-1 w-full max-w-sm shrink-0">
                <button 
                    onClick={() => setMode('dpad')}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg font-bold tracking-widest text-xs uppercase transition-colors ${mode === 'dpad' ? 'bg-[#E50914] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <Gamepad2 size={16} /> D-PAD
                </button>
                <button 
                    onClick={() => setMode('trackpad')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-bold tracking-widest text-xs uppercase transition-colors ${mode === 'trackpad' ? 'bg-[#38bdf8] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <MousePointer2 size={16} /> TRACKPAD
                </button>
            </div>

            {mode === 'trackpad' ? (
                <div className="flex flex-col w-full max-w-sm gap-4 flex-1 mb-8">
                    <div className="flex gap-4">
                        <button onClick={() => sendCommand('home')} className="bg-white/10 p-4 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                            <span className="font-bold tracking-widest text-xs uppercase text-[#38bdf8]">HOME</span>
                        </button>
                        <button onClick={() => sendCommand('back')} className="bg-white/10 p-4 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                            <span className="font-bold tracking-widest text-xs uppercase">ESC</span>
                        </button>
                    </div>
                    
                    <div 
                        className="bg-white/5 border border-white/20 rounded-3xl w-full flex-1 flex flex-col items-center justify-center relative touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={handleTrackpadClick}
                    >
                        <MousePointer2 size={48} className="text-white/10" />
                        <span className="text-white/20 font-bold tracking-widest mt-4 uppercase text-xs">Drag to move, Tap to click</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* D-PAD */}
                    <div className="flex flex-col items-center gap-1 w-full max-w-sm">
                        <div className="flex gap-2 mb-2 w-full justify-between">
                            <button onClick={() => sendCommand('home')} className="bg-white/10 p-3 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                                <span className="font-bold tracking-widest text-[10px] uppercase text-[#E50914]">HOME</span>
                            </button>
                            <button onClick={() => sendCommand('back')} className="bg-white/10 p-3 flex-1 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10">
                                <span className="font-bold tracking-widest text-[10px] uppercase">BACK</span>
                            </button>
                        </div>
                        
                        <button onClick={() => sendCommand('up')} className="bg-white/10 p-2 rounded-t-3xl rounded-b flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-full max-w-[100px] h-12">
                            <ChevronUp size={28} />
                        </button>
                        <div className="flex items-center justify-center gap-1 w-full">
                            <button onClick={() => sendCommand('left')} className="bg-white/10 p-2 rounded-l-3xl rounded-r flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-16 h-16">
                                <ChevronLeft size={28} />
                            </button>
                            <button onClick={() => sendCommand('select')} className="bg-white/20 p-2 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all w-20 h-20 shadow-[0_0_15px_rgba(255,255,255,0.1)] border-2 border-white/10">
                                <span className="font-bold tracking-widest text-xs uppercase">OK</span>
                            </button>
                            <button onClick={() => sendCommand('right')} className="bg-white/10 p-2 rounded-r-3xl rounded-l flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-16 h-16">
                                <ChevronRight size={28} />
                            </button>
                        </div>
                        <button onClick={() => sendCommand('down')} className="bg-white/10 p-2 rounded-b-3xl rounded-t flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all w-full max-w-[100px] h-12">
                            <ChevronDown size={28} />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 w-full max-w-sm pb-2 shrink-0">
                        <button onClick={() => sendCommand('rewind')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <Rewind size={24} />
                        </button>
                        <button onClick={() => sendCommand('play')} className="bg-white text-black p-4 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all col-span-2">
                            <Play fill="currentColor" size={24} />
                        </button>
                        <button onClick={() => sendCommand('forward')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <FastForward size={24} />
                        </button>
                        
                        <button onClick={() => sendCommand('mute')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <VolumeX size={24} />
                        </button>
                        <button onClick={() => sendCommand('pause')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <Pause fill="currentColor" size={24} />
                        </button>
                        <button onClick={() => sendCommand('back')} className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center justify-center hover:bg-red-500/30 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                            <Square fill="currentColor" size={24} />
                        </button>
                        <button onClick={() => sendCommand('volume_up')} className="bg-white/10 p-4 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
                            <Volume2 size={24} />
                        </button>
                        
                        <button onClick={() => sendCommand('toggle_subtitles')} className="bg-white/10 text-white p-3 rounded-xl flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all col-span-2 border border-white/20 mt-1 gap-2">
                            <Subtitles size={16} />
                            <span className="font-bold tracking-widest text-[10px] uppercase">Subtitles</span>
                        </button>
                        <button onClick={() => sendCommand('refresh')} className="bg-[#38bdf8]/10 text-[#38bdf8] p-3 rounded-xl flex items-center justify-center hover:bg-[#38bdf8]/20 active:scale-95 transition-all col-span-2 border border-[#38bdf8]/20 mt-1 gap-2">
                            <span className="font-bold tracking-widest text-[10px] uppercase">Refresh Screen</span>
                        </button>
                        <button
                            onClick={restartCinema}
                            disabled={cinemaStatus === 'restarting'}
                            className={`col-span-4 mt-1 p-3 rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                                cinemaStatus === 'restarting'
                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 cursor-not-allowed'
                                    : cinemaStatus === 'offline'
                                    ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <RefreshCw size={14} className={cinemaStatus === 'restarting' ? 'animate-spin' : ''} />
                            <span className="font-bold tracking-widest text-[10px] uppercase">
                                {cinemaStatus === 'restarting' ? 'Restarting Cinema…' : cinemaStatus === 'offline' ? '⚠ Restart Cinema' : 'Restart Cinema'}
                            </span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
