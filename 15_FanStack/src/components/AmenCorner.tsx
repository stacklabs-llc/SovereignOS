import React, { useState, useEffect } from 'react';
import { Shield, Send, Plus, Trash2, Edit2, Check, X, RefreshCw, Cpu, Activity, Wifi } from 'lucide-react';
import FanStackChat from './FanStackChat';

interface Player {
  player_id: number;
  player_name: string;
  current_position: number;
  score_to_par: number;
  current_hole: number;
  status: string;
}

interface ClioMetrics {
  cpu_temp: string;
  tailscale_status: string;
  cpu_load: string;
  memory_usage: string;
  hostname: string;
}

const DEFAULT_FORM: Player = {
  player_id: 1,
  player_name: '',
  current_position: 1,
  score_to_par: 0,
  current_hole: 1,
  status: 'ACTIVE'
};

const QUICK_PULSES = [
  "Scottie Scheffler sticks it to 2 feet on 12 for an easy birdie!",
  "Bryson DeChambeau bombs a 375-yard drive over the corner trees on 13.",
  "Rory McIlroy drains a 45-foot double-breaker to save par on 11.",
  "Ludvig Åberg finds the water on 11, carding a costly double bogey."
];

export default function AmenCorner() {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [metrics, setMetrics] = useState<ClioMetrics | null>(null);
  const [pulseText, setPulseText] = useState('');
  const [formPlayer, setFormPlayer] = useState<Player>({ ...DEFAULT_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/pga/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/pga/clio-metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Failed to fetch Clio metrics:", e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchMetrics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pga/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPlayer)
      });
      if (res.ok) {
        setMessage(isEditing ? 'Player updated successfully!' : 'Player added successfully!');
        setFormPlayer({ ...DEFAULT_FORM, player_id: Math.max(...leaderboard.map(p => p.player_id), 0) + 1 });
        setIsEditing(false);
        fetchLeaderboard();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error("Failed to save player:", e);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setFormPlayer({ ...player });
    setIsEditing(true);
  };

  const handleDeletePlayer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this player from the leaderboard?')) return;
    try {
      const res = await fetch(`/api/pga/leaderboard/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessage('Player deleted.');
        fetchLeaderboard();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error("Failed to delete player:", e);
    }
  };

  const handleSendPulse = async (textToSend?: string) => {
    const text = textToSend || pulseText;
    if (!text.trim()) return;
    try {
      const res = await fetch('/api/pga/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        if (!textToSend) setPulseText('');
        setMessage('Commentary pulse sent!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error("Failed to send pulse:", e);
    }
  };

  return (
    <div className="w-full min-h-[80vh] bg-[#051C12] text-[#f5f2eb] font-sans p-6 rounded-2xl border border-[#C5A880]/30 shadow-2xl flex flex-col gap-6 relative">
      {/* Background elegant branding stripes */}
      <div className="absolute top-0 right-0 w-32 h-full bg-[#C5A880]/5 skew-x-12 transform-gpu pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#C5A880]/20 pb-4 z-10">
        <div>
          <h2 className="text-3xl font-serif font-semibold text-[#C5A880] tracking-wide">
            Amen Corner Operations
          </h2>
          <p className="text-sm font-serif text-[#C5A880]/70 italic mt-1">
            Augusta National Golf Club — 11th, 12th & 13th Holes
          </p>
        </div>
        
        {/* State Banner */}
        <div className="mt-3 md:mt-0 flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs tracking-wider uppercase text-emerald-400">
            Telemetry Ingest Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 z-10 flex-1 min-h-0">
        {/* Left pane: Controls & Leaderboard */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
          
          {/* Metrics HUD & Commentary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Telemetry HUD Card */}
            <div className="bg-[#0b2b1d] border border-[#C5A880]/20 rounded-xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <h3 className="text-[#C5A880] font-serif font-bold text-lg border-b border-[#C5A880]/10 pb-2 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Node Clio Telemetry
                </h3>
                {metrics ? (
                  <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                    <div className="bg-black/30 p-2.5 rounded border border-emerald-950/20">
                      <div className="text-[#C5A880]/60 text-xs mb-1 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" /> CPU TEMP
                      </div>
                      <span className="text-[#f5f2eb] font-bold text-lg">{metrics.cpu_temp}</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded border border-emerald-950/20">
                      <div className="text-[#C5A880]/60 text-xs mb-1 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> TAILSCALE
                      </div>
                      <span className="text-emerald-400 font-bold">{metrics.tailscale_status}</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded border border-emerald-950/20">
                      <div className="text-[#C5A880]/60 text-xs mb-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> CPU LOAD
                      </div>
                      <span className="text-[#f5f2eb] font-bold">{metrics.cpu_load}</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded border border-emerald-950/20">
                      <div className="text-[#C5A880]/60 text-xs mb-1">MEM USAGE</div>
                      <span className="text-[#f5f2eb] font-bold">{metrics.memory_usage}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-[#C5A880]/40">
                    Acquiring system link...
                  </div>
                )}
              </div>
              <div className="text-[10px] font-mono text-[#C5A880]/50 mt-4 pt-2 border-t border-[#C5A880]/10 flex justify-between">
                <span>HOST: {metrics?.hostname || 'clio'}</span>
                <span>MESH PORT: 8008</span>
              </div>
            </div>

            {/* Manual Pulse & Commentary Sweep */}
            <div className="bg-[#0b2b1d] border border-[#C5A880]/20 rounded-xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <h3 className="text-[#C5A880] font-serif font-bold text-lg border-b border-[#C5A880]/10 pb-2 mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5" /> Manual Commentary Pulse
                </h3>
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={pulseText}
                    onChange={(e) => setPulseText(e.target.value)}
                    placeholder="Enter golf shot event or status update to trigger multi-agent sweep..."
                    className="w-full bg-[#051C12] border border-[#C5A880]/30 rounded-lg p-2.5 text-sm text-[#f5f2eb] placeholder-[#C5A880]/40 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/50 resize-none font-serif"
                  />
                  <button
                    onClick={() => handleSendPulse()}
                    className="w-full bg-[#C5A880] hover:bg-[#b0936b] active:bg-[#9a7e58] text-[#051C12] font-semibold text-xs py-2 rounded-lg transition-all tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Transmit Pulse <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[11px] font-serif font-semibold text-[#C5A880]/80 mb-1.5 block">Commentary Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PULSES.map((pulse, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendPulse(pulse)}
                      className="text-[10px] bg-black/20 hover:bg-[#C5A880]/10 border border-[#C5A880]/20 text-[#f5f2eb]/80 px-2 py-1 rounded transition-all truncate max-w-full text-left cursor-pointer"
                      title={pulse}
                    >
                      {pulse}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback/Success Message Overlay */}
          {message && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg p-3 text-sm font-medium flex items-center justify-between shadow-lg">
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Leaderboard Management & Overrides */}
          <div className="bg-[#0b2b1d] border border-[#C5A880]/20 rounded-xl p-5 shadow-lg">
            <h3 className="text-[#C5A880] font-serif font-bold text-lg border-b border-[#C5A880]/10 pb-2 mb-4">
              Leaderboard Override & CRUD
            </h3>

            {/* Form */}
            <form onSubmit={handleSavePlayer} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-black/20 p-4 rounded-lg border border-[#C5A880]/10">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">ID</label>
                <input
                  type="number"
                  required
                  disabled={isEditing}
                  value={formPlayer.player_id}
                  onChange={(e) => setFormPlayer({ ...formPlayer, player_id: parseInt(e.target.value) || 0 })}
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm font-mono outline-none text-[#f5f2eb] focus:border-[#C5A880]"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">Player Name</label>
                <input
                  type="text"
                  required
                  value={formPlayer.player_name}
                  onChange={(e) => setFormPlayer({ ...formPlayer, player_name: e.target.value })}
                  placeholder="e.g. Scottie Scheffler"
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm outline-none text-[#f5f2eb] focus:border-[#C5A880] font-serif"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">Pos</label>
                <input
                  type="number"
                  required
                  value={formPlayer.current_position}
                  onChange={(e) => setFormPlayer({ ...formPlayer, current_position: parseInt(e.target.value) || 1 })}
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm font-mono outline-none text-[#f5f2eb] focus:border-[#C5A880]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">Score</label>
                <input
                  type="number"
                  required
                  value={formPlayer.score_to_par}
                  onChange={(e) => setFormPlayer({ ...formPlayer, score_to_par: parseInt(e.target.value) || 0 })}
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm font-mono outline-none text-[#f5f2eb] focus:border-[#C5A880]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">Hole</label>
                <input
                  type="number"
                  required
                  value={formPlayer.current_hole}
                  onChange={(e) => setFormPlayer({ ...formPlayer, current_hole: parseInt(e.target.value) || 1 })}
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm font-mono outline-none text-[#f5f2eb] focus:border-[#C5A880]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#C5A880]/70 font-semibold uppercase">Status</label>
                <select
                  value={formPlayer.status}
                  onChange={(e) => setFormPlayer({ ...formPlayer, status: e.target.value })}
                  className="bg-[#051C12] border border-[#C5A880]/30 rounded px-2.5 py-1.5 text-sm outline-none text-[#f5f2eb] focus:border-[#C5A880]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CUT">CUT</option>
                  <option value="WD">WD</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-3 lg:col-span-6 flex justify-end gap-2 mt-3 pt-3 border-t border-[#C5A880]/10">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormPlayer({ ...DEFAULT_FORM });
                    }}
                    className="border border-[#C5A880]/40 text-[#C5A880] hover:bg-[#C5A880]/10 px-4 py-1.5 rounded text-xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    Cancel <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-[#C5A880] hover:bg-[#b0936b] text-[#051C12] font-semibold px-4 py-1.5 rounded text-xs uppercase flex items-center gap-1 cursor-pointer"
                >
                  {isEditing ? (
                    <>Update Player <Check className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Add Player <Plus className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#C5A880]/20 text-[#C5A880] font-serif uppercase tracking-wider text-xs">
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Player</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Hole</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5A880]/10 font-serif">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-sm text-[#C5A880]/40">
                        No players registered. Seed telemetry or add one above.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((p) => (
                      <tr key={p.player_id} className="hover:bg-[#C5A880]/5 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-[#C5A880]">P{p.current_position}</td>
                        <td className="py-2 px-3 text-[#f5f2eb] font-semibold">{p.player_name}</td>
                        <td className="py-2 px-3 font-mono">
                          {p.score_to_par > 0 ? `+${p.score_to_par}` : (p.score_to_par === 0 ? 'E' : p.score_to_par)}
                        </td>
                        <td className="py-2 px-3 font-mono">Hole {p.current_hole}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                            p.status === 'ACTIVE' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                            p.status === 'WD' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20' :
                            'bg-red-950/60 text-red-400 border border-red-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditPlayer(p)}
                              className="p-1.5 hover:bg-emerald-950 hover:text-emerald-400 rounded transition-all text-[#C5A880] cursor-pointer"
                              title="Edit Player"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(p.player_id)}
                              className="p-1.5 hover:bg-red-950 hover:text-red-400 rounded transition-all text-red-400/80 cursor-pointer"
                              title="Delete Player"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right pane: Chat Area */}
        <div className="lg:col-span-4 flex flex-col min-h-[450px] lg:h-full border border-[#C5A880]/20 rounded-xl overflow-hidden shadow-lg bg-[#0b2b1d]/40">
          <div className="bg-[#0b2b1d] border-b border-[#C5A880]/20 p-3.5 font-serif font-semibold text-[#C5A880] text-sm tracking-wider uppercase flex justify-between items-center">
            <span>Advocate Live Chat Matrix</span>
            <span className="text-[10px] font-mono tracking-normal bg-[#C5A880]/15 px-2 py-0.5 rounded text-[#C5A880]">
              AMEN_CORNER
            </span>
          </div>
          <div className="flex-1 min-h-0 bg-black/10">
            <FanStackChat activeGamedayPk="amen_corner" roomId="amen_corner" />
          </div>
        </div>
      </div>
    </div>
  );
}
