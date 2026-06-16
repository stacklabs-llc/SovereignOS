import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Calendar, Activity, Zap, Play, Square, CheckCircle, RefreshCw } from 'lucide-react';

interface Room {
    game_pk: string;
    away_team: string;
    home_team: string;
    game_date: string;
    game_time?: string;
    status: string;
    room_state: string;
    personas: string[];
}

interface RollCallData {
    games: Room[];
}

const formatGameTime = (utcString?: string) => {
    if (!utcString) return 'TBD';
    try {
        const date = new Date(utcString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    } catch (e) {
        return utcString;
    }
};

export default function RollCallDashboard() {
    const [data, setData] = useState<RollCallData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [prepStatus, setPrepStatus] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<Date>(new Date());

    const fetchRollCall = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/roll_call`);
            if (!response.ok) {
                throw new Error('Failed to fetch live roll call data.');
            }
            const jsonData = await response.json();
            setData(jsonData);
            setLastSync(new Date());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRollCall();
    }, []);

    const handleDailyPrep = async () => {
        setPrepStatus("INITIATING");
        try {
            await fetch('/api/admin/daily_prep', { method: 'POST' });
            setPrepStatus("STACK IS COLD-BOOTING. RECONNECTING IN 30S...");
            setTimeout(() => {
                setPrepStatus(null);
                window.location.reload();
            }, 30000);
        } catch (err: any) {
            setPrepStatus("ERROR: " + err.message);
            setTimeout(() => setPrepStatus(null), 5000);
        }
    };

    const toggleRoom = async (gamePk: string, currentState: string) => {
        const endpoint = currentState === 'active' ? '/api/room/deactivate' : '/api/room/activate';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_pk: gamePk })
            });
            if (response.ok) {
                // Optimistically update
                setData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        games: prev.games.map(g => g.game_pk === gamePk ? { ...g, room_state: currentState === 'active' ? 'staged' : 'active' } : g)
                    };
                });
            }
        } catch (err) {
            console.error("Failed to toggle room:", err);
            alert("Failed to update room state.");
        }
    };

    if (prepStatus) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[75vh] text-[#38bdf8] font-mono bg-black/80 backdrop-blur-sm z-50 rounded-2xl border border-[#38bdf8]/50 shadow-[0_0_50px_rgba(56,189,248,0.2)]">
                <Zap className="animate-pulse mb-6 text-[#EAB308]" size={64} />
                <h2 className="text-3xl tracking-widest uppercase font-bold">{prepStatus}</h2>
                <p className="mt-4 text-[#8E9CAA] max-w-md text-center">
                    The entire Sovereign OS FanStack is running the daily initialization sequence. 
                    Please stand by while the daemons are killed and restarted.
                </p>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[75vh] text-[#00FF88] font-mono">
                <Activity className="animate-spin mb-4" size={48} />
                <h2 className="text-2xl tracking-widest uppercase">CONNECTING TO RELAY...</h2>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[75vh] text-red-500 font-mono">
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-2xl tracking-widest uppercase">Relay Offline</h2>
                <p className="mt-2 text-sm text-[#c8d6e0] font-mono">{error || 'Unknown Error'}</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#0a1118]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-[#c8d6e0] font-sans">
            <header className="mb-6 border-b border-[#38bdf8]/30 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-display text-[#38bdf8] tracking-wider uppercase flex items-center gap-3">
                        <Users size={32} />
                        Sovereign Command Center
                    </h1>
                    <p className="text-[#8E9CAA] mt-2 font-mono text-xs uppercase tracking-widest">
                        DEPLOYMENT MATRIX AND ROLL CALL
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchRollCall}
                        className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        title="Refresh Roster"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={handleDailyPrep}
                        className="bg-[#EAB308] hover:bg-[#FDE047] text-black font-bold font-mono text-xs px-4 py-2 rounded uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] flex items-center gap-2"
                    >
                        <Zap size={14} />
                        Execute Daily Prep
                    </button>
                    <div className="text-right font-mono text-xs border-l border-white/20 pl-4">
                        <div className="text-[#00FF88] flex items-center justify-end gap-2 mb-1">
                            <Calendar size={14} />
                            LAST SYNC
                        </div>
                        <div className="text-white/80">{lastSync.toLocaleString()}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                {data?.games.map((room) => {
                    const isActive = room.room_state === 'active';
                    return (
                        <div key={room.game_pk} className={`bg-black/40 border rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${isActive ? 'border-[#00FF88]/50 shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'border-white/5 hover:border-[#38bdf8]/50'}`}>
                            <div className={`p-3 border-b flex justify-between items-center ${isActive ? 'bg-[#00FF88]/10 border-[#00FF88]/20' : 'bg-white/5 border-white/5'}`}>
                                <h3 className={`font-display font-bold text-sm truncate pr-2 ${isActive ? 'text-[#00FF88]' : 'text-[#E0BC68]'}`} title={`${room.away_team} @ ${room.home_team}`}>
                                    {room.away_team} @ {room.home_team}
                                </h3>
                                <span className="bg-black/60 text-[#38bdf8] px-2 py-0.5 rounded font-mono text-[10px] whitespace-nowrap border border-[#38bdf8]/20">
                                    {room.game_pk}
                                </span>
                            </div>
                            
                            <div className="p-4">
                                {room.game_time && (
                                    <div className="flex items-center gap-1.5 mb-3 text-xs font-mono text-white/60 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                        <Calendar size={13} className="text-[#38bdf8]" />
                                        <span>Start: <span className="text-[#38bdf8] font-bold">{formatGameTime(room.game_time)}</span></span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                                    <div className="text-[#8E9CAA] font-mono text-[10px] uppercase">
                                        Deployed Personas ({room.personas.length})
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest ${isActive ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/50' : 'bg-[#FF5910]/20 text-[#FF5910] border border-[#FF5910]/50'}`}>
                                        {room.room_state || 'staged'}
                                    </span>
                                </div>
                                
                                <div className="h-24 overflow-y-auto custom-scrollbar mb-4">
                                    {room.personas.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {room.personas.map((p, idx) => (
                                                <li key={idx} className="flex items-center gap-2 font-mono text-xs text-white/80 hover:text-[#38bdf8] transition-colors">
                                                    <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-[#00FF88]' : 'bg-[#FF5910]'}`}></span>
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-red-400 font-mono text-xs italic">
                                            [EMPTY BENCH]
                                        </div>
                                    )}
                                </div>
                                                                <div className="flex gap-2.5">
                                    <button 
                                        onClick={() => toggleRoom(room.game_pk, room.room_state || 'staged')}
                                        className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${
                                            isActive 
                                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30' 
                                            : 'bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/30'
                                        }`}
                                    >
                                        {isActive ? (
                                            <><Square size={12} className="fill-current" /> Bench</>
                                        ) : (
                                            <><Play size={12} className="fill-current" /> Deploy</>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('domain', 'GLOBAL');
                                            params.set('room', 'room_builder');
                                            params.set('_game_room', room.game_pk);
                                            window.history.pushState({}, '', '?' + params.toString());
                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                        }}
                                        className="px-3.5 py-2 rounded-lg bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                                        title="Configure Room Seating Roster"
                                    >
                                        👑 Build Room
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
