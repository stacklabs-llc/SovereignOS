import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, RefreshCw, MessageSquare, Activity, ChevronDown, Copy, Check } from 'lucide-react';
import { getApiBase } from '../api-host';

interface GameOption {
  game_pk: string;
  game_date: string;
  away_team: string;
  home_team: string;
  message_count: number;
  persona_count: number;
  log_start: string;
  log_end: string;
}

interface ChatMessage {
  id: number;
  persona: string;
  text: string;
  model: string;
  msg_type: string;
  created_at: string;
}

type ExportFormat = 'md' | 'json' | 'csv';

function formatTime(ts: string) {
  if (!ts) return '—';
  return ts.replace('T', ' ').substring(0, 16);
}

export default function GameLogExport() {
  const apiBase = getApiBase();
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedPk, setSelectedPk] = useState('');
  const [preview, setPreview] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/game-log/games`)
      .then(r => r.json())
      .then(d => {
        setGames(d.games || []);
        if (d.games?.length) setSelectedPk(d.games[0].game_pk);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiBase]);

  useEffect(() => {
    if (!selectedPk) return;
    setPreviewLoading(true);
    fetch(`${apiBase}/api/game-log/chat/${selectedPk}?limit=20`)
      .then(r => r.json())
      .then(d => setPreview(d.messages || []))
      .catch(console.error)
      .finally(() => setPreviewLoading(false));
  }, [selectedPk, apiBase]);

  const selectedGame = games.find(g => g.game_pk === selectedPk);

  const handleExport = (format: ExportFormat) => {
    if (!selectedPk) return;
    const url = `${apiBase}/api/game-log/export/${selectedPk}?format=${format}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async (format: ExportFormat) => {
    const url = `${apiBase}/api/game-log/export/${selectedPk}?format=${format}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#08090f] text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#22c55e]" />
          </div>
          <div>
            <h2 className="text-white font-bold font-mono uppercase tracking-widest text-sm">Game Log Export</h2>
            <p className="text-white/30 text-[9px] font-mono uppercase tracking-wider">STRY1779341054 · Live & Post-Game</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-wider">
          <Activity className="w-3 h-3 text-[#22c55e] animate-pulse" />
          {games.length} games on record
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT — Game Selector + Export Controls */}
        <div className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-white/30 block mb-2">Select Game</label>
            <div className="relative">
              <select
                value={selectedPk}
                onChange={e => setSelectedPk(e.target.value)}
                className="w-full appearance-none bg-[#111827] border border-white/10 text-white text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#22c55e]/50 cursor-pointer"
              >
                {loading ? (
                  <option>Loading...</option>
                ) : (
                  games.map(g => (
                    <option key={g.game_pk} value={g.game_pk}>
                      {g.game_date} — {g.away_team} @ {g.home_team} ({g.message_count} msgs)
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Game Stats */}
          {selectedGame && (
            <div className="p-4 border-b border-white/5 space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/30">Messages</span>
                <span className="text-white font-bold">{selectedGame.message_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/30">Personas Active</span>
                <span className="text-white font-bold">{selectedGame.persona_count}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/30">Log Start</span>
                <span className="text-white/60">{formatTime(selectedGame.log_start)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/30">Log End</span>
                <span className="text-white/60">{formatTime(selectedGame.log_end)}</span>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="p-4 flex flex-col gap-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Export Format</p>

            {(['md', 'json', 'csv'] as ExportFormat[]).map(fmt => {
              const labels: Record<ExportFormat, { label: string; desc: string; color: string }> = {
                md:   { label: '📄 Markdown', desc: 'Full narrative log with formatting', color: '#38bdf8' },
                json: { label: '⚙️ JSON', desc: 'Structured data for processing', color: '#7c3aed' },
                csv:  { label: '📊 CSV', desc: 'Spreadsheet-compatible flat export', color: '#22c55e' },
              };
              const { label, desc, color } = labels[fmt];
              return (
                <div key={fmt} className="rounded-lg border border-white/5 overflow-hidden">
                  <button
                    onClick={() => handleExport(fmt)}
                    disabled={!selectedPk}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left disabled:opacity-40"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <Download className="w-4 h-4 shrink-0" style={{ color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-xs text-white">{label}</div>
                      <div className="text-[9px] text-white/30 font-mono mt-0.5">{desc}</div>
                    </div>
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => handleCopyLink('md')}
              disabled={!selectedPk}
              className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
            >
              {copied ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy MD Link'}
            </button>
          </div>
        </div>

        {/* RIGHT — Chat Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                Preview — Last 20 Messages
              </span>
            </div>
            {previewLoading && <RefreshCw className="w-3 h-3 text-white/20 animate-spin" />}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {preview.length === 0 && !previewLoading && (
              <div className="flex items-center justify-center h-full text-white/20 font-mono text-sm">
                No messages for this game
              </div>
            )}
            {preview.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[11px] font-mono text-[#38bdf8]">{msg.persona}</span>
                  {msg.model && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">{msg.model}</span>
                  )}
                  <span className="ml-auto text-[9px] text-white/20 font-mono">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed line-clamp-3">{msg.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick export bar at bottom */}
          {selectedGame && (
            <div className="px-4 py-3 border-t border-white/5 bg-[#0d1117] flex items-center gap-3">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
                {selectedGame.away_team} @ {selectedGame.home_team} · {selectedGame.game_date}
              </span>
              <div className="ml-auto flex gap-2">
                {(['md', 'json', 'csv'] as ExportFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider border transition-all hover:scale-105"
                    style={{
                      borderColor: fmt === 'md' ? '#38bdf820' : fmt === 'json' ? '#7c3aed20' : '#22c55e20',
                      color: fmt === 'md' ? '#38bdf8' : fmt === 'json' ? '#7c3aed' : '#22c55e',
                      background: fmt === 'md' ? '#38bdf808' : fmt === 'json' ? '#7c3aed08' : '#22c55e08',
                    }}
                  >
                    ↓ {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
