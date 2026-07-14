import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWsUrl } from '../api-host';
import { Activity, ShieldAlert, Award, Zap } from 'lucide-react';

interface EventMediaCanvasProps {
  activeGamedayPk?: string;
}

interface PlayData {
  pitcher: string;
  batter: string;
  status_msg: string;
  away_score: number;
  home_score: number;
  away_team: string;
  home_team: string;
  inning: string;
  outs: number;
  balls: number;
  strikes: number;
  pitch_name: string;
  pitch_speed: string;
  swing_status?: string;
  bat_speed_mph?: number;
  whiff_distance_inches?: number;
  is_sword?: boolean;
  batter_avg?: string;
  batter_obp?: string;
  batter_slg?: string;
  batter_ops?: string;
  batter_hr?: string;
  batter_rbi?: string;
  pitcher_era?: string;
  pitcher_whip?: string;
  pitcher_wins?: string;
  pitcher_losses?: string;
  pitcher_so?: string;
  pitcher_ip?: string;
}

export default function EventMediaCanvas({ activeGamedayPk }: EventMediaCanvasProps) {
  const [playData, setPlayData] = useState<PlayData | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Establish connection to ws-relay
    ws.current = new WebSocket(getWsUrl('/ws-relay'));

    ws.current.onopen = () => {
      if (activeGamedayPk) {
        ws.current?.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: activeGamedayPk }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "CMD_SYNC_STATE" && payload.data) {
          // If this is for our active game
          if (payload.target_game_pk === String(activeGamedayPk) || !activeGamedayPk) {
            setPlayData(payload.data);
            
            // Slide in the stats card
            setShowStatsCard(true);

            // Reset automatic timeout to slide out after 6 seconds
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setShowStatsCard(false);
            }, 6000);
          }
        }
      } catch (err) {
        console.error("EventMediaCanvas WebSocket parse error:", err);
      }
    };

    return () => {
      ws.current?.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeGamedayPk]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-end p-6">
      <AnimatePresence>
        {showStatsCard && playData && (
          <SnyStatsCard data={playData} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SnyStatsCard({ data }: { data: PlayData }) {
  const isMetsGame = data.away_team === 'NYM' || data.home_team === 'NYM';

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="w-80 bg-[#090e1a] border-2 border-[#ff5910] text-white flex flex-col p-4 shadow-[0_0_20px_rgba(255,89,16,0.3)] pointer-events-auto"
    >
      {/* Header / Network Graphic */}
      <div className="flex items-center justify-between border-b border-[#ff5910]/40 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="bg-[#ff5910] text-[#090e1a] text-[10px] font-black px-1.5 py-0.5 rounded-sm">SNY</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#00b4d8]">Matchup splits</span>
        </div>
        <div className="text-[9px] font-mono text-[#00b4d8] uppercase tracking-wider animate-pulse flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-[#ff5910]" /> LIVE ANALYTICS
        </div>
      </div>

      {/* Pitcher Statistics Panel */}
      <div className="mb-3.5 bg-[#0f172a] border border-[#00b4d8]/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#00b4d8] uppercase tracking-wider">Pitcher</span>
          <span className="text-[9px] font-mono text-white/50">{data.pitcher_wins}W - {data.pitcher_losses}L</span>
        </div>
        <div className="text-sm font-bold truncate mb-1">{data.pitcher}</div>
        <div className="grid grid-cols-3 gap-1 mt-1.5 border-t border-white/5 pt-1.5">
          <div className="flex flex-col text-center">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">ERA</span>
            <span className="text-[11px] font-bold font-mono text-[#ff5910]">{data.pitcher_era}</span>
          </div>
          <div className="flex flex-col text-center border-x border-white/5">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">WHIP</span>
            <span className="text-[11px] font-bold font-mono">{data.pitcher_whip}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">SO</span>
            <span className="text-[11px] font-bold font-mono text-[#00b4d8]">{data.pitcher_so}</span>
          </div>
        </div>
      </div>

      {/* Batter Statistics Panel */}
      <div className="mb-3.5 bg-[#0f172a] border border-[#ff5910]/30 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#ff5910] uppercase tracking-wider">Batter</span>
          <span className="text-[9px] font-mono text-white/50">{data.batter_hr} HR | {data.batter_rbi} RBI</span>
        </div>
        <div className="text-sm font-bold truncate mb-1">{data.batter}</div>
        <div className="grid grid-cols-4 gap-0.5 mt-1.5 border-t border-white/5 pt-1.5">
          <div className="flex flex-col text-center">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">AVG</span>
            <span className="text-[11px] font-bold font-mono text-[#ff5910]">{data.batter_avg}</span>
          </div>
          <div className="flex flex-col text-center border-l border-white/5">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">OBP</span>
            <span className="text-[11px] font-bold font-mono">{data.batter_obp}</span>
          </div>
          <div className="flex flex-col text-center border-l border-white/5">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">SLG</span>
            <span className="text-[11px] font-bold font-mono">{data.batter_slg}</span>
          </div>
          <div className="flex flex-col text-center border-l border-white/5">
            <span className="text-[8px] uppercase text-white/40 tracking-wider">OPS</span>
            <span className="text-[11px] font-bold font-mono text-[#00b4d8]">{data.batter_ops}</span>
          </div>
        </div>
      </div>

      {/* Statcast Play Metrics Overlay */}
      {data.pitch_speed !== '---' && (
        <div className="mt-1 pt-2 border-t border-[#ff5910]/40 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#00b4d8] font-bold uppercase tracking-wider">Statcast speed</span>
            <span className="text-xs font-black font-mono text-[#ff5910]">{data.pitch_speed} MPH</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/60">Pitch: {data.pitch_name}</span>
            {data.swing_status && (
              <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                data.swing_status === 'WHIFF' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                data.swing_status === 'HIT' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-white/10 text-white/80'
              }`}>
                {data.swing_status}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
