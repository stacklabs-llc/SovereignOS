import React from 'react';
import BaseballDiamond from './BaseballDiamond';

interface GamedayScoreboardProps {
  liveBoxScore: any;
  onClose?: () => void;
}

export default function GamedayScoreboard({ liveBoxScore, onClose }: GamedayScoreboardProps) {
  if (!liveBoxScore) {
    return (
      <div className="w-full bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-center text-white/50 font-mono text-xs">
        Connecting to Gameday Telemetry...
      </div>
    );
  }

  const linescore = liveBoxScore?.liveData?.linescore;
  const gameData = liveBoxScore?.gameData;
  
  const awayTeam = gameData?.teams?.away;
  const homeTeam = gameData?.teams?.home;

  const awayAbbr = awayTeam?.abbreviation || 'AWY';
  const homeAbbr = homeTeam?.abbreviation || 'HME';

  const awayRuns = linescore?.teams?.away?.runs ?? 0;
  const awayHits = linescore?.teams?.away?.hits ?? 0;
  const awayErrors = linescore?.teams?.away?.errors ?? 0;

  const homeRuns = linescore?.teams?.home?.runs ?? 0;
  const homeHits = linescore?.teams?.home?.hits ?? 0;
  const homeErrors = linescore?.teams?.home?.errors ?? 0;

  const balls = linescore?.balls ?? 0;
  const strikes = linescore?.strikes ?? 0;
  const outs = linescore?.outs ?? 0;

  const inningHalf = linescore?.inningHalf || 'Top';
  const currentInning = linescore?.currentInning || '-';
  const isLive = gameData?.status?.abstractGameState === 'Live';
  const isFinal = gameData?.status?.abstractGameState === 'Final';

  const batterName = linescore?.offense?.batter?.fullName || 'Awaiting Batter';
  const pitcherName = linescore?.defense?.pitcher?.fullName || 'Awaiting Pitcher';

  // Base runners state
  const offenseState = {
    first: !!linescore?.offense?.first,
    second: !!linescore?.offense?.second,
    third: !!linescore?.offense?.third
  };

  // Team logos
  const awayLogo = awayTeam?.id ? `https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg` : null;
  const homeLogo = homeTeam?.id ? `https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg` : null;

  return (
    <div className="gameday-scoreboard-card w-full bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 md:p-6 mb-6 shadow-[0_0_30px_rgba(0,180,216,0.15)] relative overflow-hidden group">
      {/* Glow Effects */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-700 pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {isLive ? 'LIVE TELEMETRY' : isFinal ? 'FINAL SCORE' : 'PRE-GAME'}
          </span>
          {gameData?.venue?.name && (
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider hidden sm:inline">
              | {gameData.venue.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-white/40 text-[9px] font-mono uppercase tracking-widest block">INNING</span>
            <span className="text-white font-display font-bold text-sm tracking-wide">
              {isFinal ? 'FINAL' : `${inningHalf === 'Top' ? '▲' : '▼'} ${currentInning}`}
            </span>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-white/50 hover:text-white transition-colors p-1 hover:bg-white/5 rounded border border-white/10"
              title="Close Scoreboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Teams and Scores (LGs 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Away Team Row */}
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              {awayLogo && (
                <img 
                  src={awayLogo} 
                  alt={awayAbbr} 
                  className="w-8 h-8 drop-shadow-md"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              )}
              <div>
                <span className="text-white font-display font-black text-lg sm:text-xl tracking-wider block sm:inline mr-2">
                  {awayTeam?.name?.toUpperCase() || 'AWAY'}
                </span>
                <span className="text-white/40 font-mono text-xs uppercase tracking-wider">
                  [{awayAbbr}]
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 font-mono">
              <div className="text-center w-10">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">R</span>
                <span className="text-cyan-400 font-bold text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(0,180,216,0.3)]">
                  {awayRuns}
                </span>
              </div>
              <div className="text-center w-8">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">H</span>
                <span className="text-white font-medium text-lg">
                  {awayHits}
                </span>
              </div>
              <div className="text-center w-8">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">E</span>
                <span className="text-white/50 text-lg">
                  {awayErrors}
                </span>
              </div>
            </div>
          </div>

          {/* Home Team Row */}
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              {homeLogo && (
                <img 
                  src={homeLogo} 
                  alt={homeAbbr} 
                  className="w-8 h-8 drop-shadow-md"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              )}
              <div>
                <span className="text-white font-display font-black text-lg sm:text-xl tracking-wider block sm:inline mr-2">
                  {homeTeam?.name?.toUpperCase() || 'HOME'}
                </span>
                <span className="text-white/40 font-mono text-xs uppercase tracking-wider">
                  [{homeAbbr}]
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 font-mono">
              <div className="text-center w-10">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">R</span>
                <span className="text-cyan-400 font-bold text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(0,180,216,0.3)]">
                  {homeRuns}
                </span>
              </div>
              <div className="text-center w-8">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">H</span>
                <span className="text-white font-medium text-lg">
                  {homeHits}
                </span>
              </div>
              <div className="text-center w-8">
                <span className="text-white/30 text-[9px] uppercase tracking-wider block">E</span>
                <span className="text-white/50 text-lg">
                  {homeErrors}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Count, Outs and Diamond (LGs 5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 items-center bg-black/40 border border-white/5 p-4 rounded-lg">
          {/* Diamond visualizer */}
          <div className="flex items-center justify-center border-r border-white/10 pr-2">
            <BaseballDiamond offense={offenseState} />
          </div>

          {/* Counts & Outs panel */}
          <div className="space-y-3 font-mono">
            {/* Balls and strikes */}
            <div>
              <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">COUNT</div>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50">BALLS</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map((b) => (
                      <div 
                        key={b} 
                        className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                          balls >= b 
                            ? 'bg-[#00b4d8] border-[#00b4d8] shadow-[0_0_6px_#00b4d8]' 
                            : 'border-white/20 bg-transparent'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50">STRIKES</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2].map((s) => (
                      <div 
                        key={s} 
                        className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                          strikes >= s 
                            ? 'bg-[#FF5910] border-[#FF5910] shadow-[0_0_6px_#FF5910]' 
                            : 'border-white/20 bg-transparent'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Outs */}
            <div>
              <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">OUTS</div>
              <div className="flex gap-1.5 mt-1">
                {[1, 2].map((o) => (
                  <div 
                    key={o} 
                    className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                      outs >= o 
                        ? 'bg-red-500 border-red-500 shadow-[0_0_6px_#ef4444]' 
                        : 'border-white/20 bg-transparent'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matchup and At-Bat Details */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-2 justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#00b4d8] font-bold">BATTER:</span>
          <span className="text-white/80">{batterName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF5910] font-bold">PITCHER:</span>
          <span className="text-white/80">{pitcherName}</span>
        </div>
        {liveBoxScore?.liveData?.plays?.currentPlay?.result?.description && (
          <div className="w-full mt-2 bg-white/5 p-2 rounded text-white/70 border border-white/5 leading-relaxed text-[10px]">
            <span className="text-cyan-400 font-bold mr-1">LAST PLAY:</span>
            {liveBoxScore.liveData.plays.currentPlay.result.description}
          </div>
        )}
      </div>
    </div>
  );
}
