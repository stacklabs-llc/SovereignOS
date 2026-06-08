import React, { useState, useEffect, useRef } from 'react';
import { getApiHost, getWsUrl } from '../api-host';

interface MlbScoreBarProps {
    activeGamedayPk?: string | null;
    onSelectGame?: (pk: string) => void;
}

export default function MlbScoreBar({ activeGamedayPk, onSelectGame }: MlbScoreBarProps) {
    const [rawGames, setRawGames] = useState<any[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollAmount = clientWidth * 0.5;
            scrollContainerRef.current.scrollTo({ left: scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount), behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const initGames = async () => {
            try {
                const rawToday = new Date();
                const today = new Date(rawToday);
                if (rawToday.getHours() < 11) {
                    today.setDate(today.getDate() - 1);
                }
                
                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                const startDate = todayStr;
                const endDate = todayStr;
                const res = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore,team&startDate=${startDate}&endDate=${endDate}`);
                const data = await res.json();
                const loaded: any[] = [];
                if (data.dates) {
                    data.dates.forEach((d: any) => {
                        if(d.games) {
                            d.games.forEach((g: any) => {
                                let time = new Date(g.gameDate).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
                                const awayTeamName = g.teams.away?.team?.teamName || g.teams.away?.team?.name?.split(' ')?.pop() || 'AWAY';
                                const homeTeamName = g.teams.home?.team?.teamName || g.teams.home?.team?.name?.split(' ')?.pop() || 'HOME';
                                loaded.push({ id: g.gamePk, text: `${awayTeamName} @ ${homeTeamName} - ${time} (${g.status.abstractGameState})`, status: g.status, teams: g.teams, gameDate: g.gameDate, linescore: g.linescore, gamePk: g.gamePk });
                            });
                        }
                    });
                    // Sort to put live games first
                    loaded.sort((a,b) => {
                        if (a.status.abstractGameState === 'Live' && b.status.abstractGameState !== 'Live') return -1;
                        if (a.status.abstractGameState !== 'Live' && b.status.abstractGameState === 'Live') return 1;
                        return 0;
                    });
                    setRawGames(loaded);
                }
            } catch(e: any) { setRawGames([{gamePk: 'error', status: {abstractGameState: 'Final'}, teams: {away: {team: {abbreviation: 'ERR'}, isWinner: false, score: e.message}, home: {team: {abbreviation: 'ERR'}, isWinner: false, score: 'API'}} }]); }
        };

        initGames();
        const poll = setInterval(initGames, 30000); // refresh slate every 30s
        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        const connectWS = () => {
            try {
                const ws = new WebSocket(getWsUrl('/ws'));
                wsRef.current = ws;
                
                ws.onopen = () => {
                    setWsConnected(true);
                };
                ws.onclose = () => {
                    setWsConnected(false);
                    setTimeout(connectWS, 2000);
                };
            } catch (e) {
                setTimeout(connectWS, 2000);
            }
        };
        connectWS();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const switchGame = (pk: string) => {
        if (onSelectGame) onSelectGame(pk);
        if(wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify({ type: 'CMD_SWITCH_GAME', game_pk: pk, force_global: true }));
    };

    return (
        <div className="flex items-center px-3 py-2 border-b border-white/10 shrink-0 gap-4 relative z-10 bg-[#0a0c10]/90 backdrop-blur-xl overflow-hidden w-full max-w-[1920px] mx-auto rounded-b-xl mb-4 shadow-xl">
            <div className="flex flex-col items-center justify-center pr-3 border-r border-white/10 shrink-0 cursor-pointer hover:bg-white/5 transition-colors rounded p-1" onClick={() => onSelectGame && onSelectGame('')}>
                <h1 className="font-['Outfit'] text-[16px] font-bold tracking-[0.1em] text-[#38bdf8] drop-shadow-lg uppercase leading-none">MLB</h1>
                <span className="font-['Outfit'] text-[10px] text-white/50 uppercase tracking-widest mt-1">SLATE</span>
            </div>
            
            <div ref={scrollContainerRef} className="flex-1 flex overflow-x-auto gap-2 items-center hide-scrollbar scroll-smooth">
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                {rawGames.map(game => (
                    <div key={game.gamePk} onClick={() => switchGame(game.gamePk)} className={`min-w-[130px] flex-shrink-0 cursor-pointer transition-all border ${activeGamedayPk == game.gamePk ? 'bg-[#FF5910]/10 border-[#FF5910]/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} rounded-md p-2 flex flex-col font-['Inter'] shadow-md`}>
                        <div className={`text-[10px] flex justify-between font-bold mb-1 ${game.status.abstractGameState === 'Live' ? 'text-[#FF5910]' : 'text-[#94a3b8]'}`}>
                            <span>{game.status.abstractGameState === 'Final' ? 'FINAL' : game.status.abstractGameState === 'Live' ? `${game.linescore?.inningHalf === 'Top' ? '▲' : '▼'}${game.linescore?.currentInning || ''}` : new Date(game.gameDate).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                            <span>{game.status.abstractGameState === 'Live' ? `${game.linescore?.outs || 0} Outs` : ''}</span>
                        </div>
                        <div className="flex justify-between items-center text-[16px] text-white">
                            <div className="flex items-center gap-1 font-bold">
                                <span className="text-[#e2e8f0] w-7 text-left">{game.teams.away.team.abbreviation || game.teams.away.team.name?.split(' ')?.pop()?.substring(0,3).toUpperCase() || 'AWY'}</span>
                            </div>
                            <span className={game.teams.away.isWinner ? "font-bold text-white text-[15px]" : "text-[#94a3b8] font-medium"}>{game.teams.away.score ?? '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[16px] text-white mt-0.5">
                            <div className="flex items-center gap-1 font-bold">
                                <span className="text-[#e2e8f0] w-7 text-left">{game.teams.home.team.abbreviation || game.teams.home.team.name?.split(' ')?.pop()?.substring(0,3).toUpperCase() || 'HME'}</span>
                            </div>
                            <span className={game.teams.home.isWinner ? "font-bold text-white text-[15px]" : "text-[#94a3b8] font-medium"}>{game.teams.home.score ?? '-'}</span>
                        </div>
                    </div>
                ))}
                {rawGames.length === 0 && <div className="text-[#64748b] text-[16px] font-['Inter'] px-2">Loading live slate...</div>}
            </div>

            {/* Scroll Arrows */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10 shrink-0">
                <button onClick={() => scroll('left')} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-colors border border-white/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button onClick={() => scroll('right')} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-colors border border-white/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>

            <div className={`shrink-0 font-['Outfit'] text-[10px] font-bold tracking-[0.05em] px-3 py-1.5 rounded-md flex items-center gap-2 border ${wsConnected ? 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/10' : 'border-[#ef4444]/50 text-[#ef4444] bg-[#ef4444]/10 '}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${wsConnected ? 'animate-pulse' : ''}`}></span>
                <span>{wsConnected ? `MESH` : 'OFF'}</span>
            </div>
        </div>
    );
}
