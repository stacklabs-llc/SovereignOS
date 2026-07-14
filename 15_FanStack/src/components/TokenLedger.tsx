import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, TrendingUp, Trophy, Download, RefreshCw, Zap, DollarSign, Activity, ChevronDown } from 'lucide-react';
import { getApiBase } from '../api-host';

// ── Types ────────────────────────────────────────────────────────────────────

interface GameSummary {
  game_pk: string;
  game_date: string;
  away_team: string;
  home_team: string;
  total_tokens: number;
  gemini_tokens: number;
  sys_tokens: number;
  total_M: number;
  est_cost_usd: number;
  active_personas: number;
}

interface PersonaRow {
  user_name: string;
  display_name: string;
  team: string;
  hex: string;
  avatar_url: string;
  total_tokens: number;
  gemini_tokens: number;
  input_tokens: number;
  output_tokens: number;
  total_M: number;
  est_cost_usd: number;
  pct_of_game: number;
}

interface GameReport {
  game: GameSummary & {
    gemini_M: number; sys_M: number;
    gemini_cost_usd: number; sys_cost_usd: number;
    total_cost_usd: number; gemini_pct: number; sys_pct: number;
  };
  personas: PersonaRow[];
}

interface FleetSummary {
  totals: {
    total_games: number;
    all_time_tokens: number;
    all_time_gemini: number;
    all_time_M: number;
    all_time_cost_usd: number;
    avg_tokens_per_game: number;
    peak_game_tokens: number;
  };
  peak_game: { game_pk: string; game_date: string; matchup: string; total_tokens: number } | null;
  top_persona: { user_name: string; display_name: string; hex: string; t: number } | null;
  credit_runway: { remaining_usd: number; avg_cost_per_game: number; est_games_remaining: number };
}

interface TrendDay {
  game_date: string;
  games: number;
  total_tokens: number;
  total_M: number;
  est_cost_usd: number;
}

interface LeaderboardRow {
  user_name: string;
  display_name: string;
  team: string;
  hex: string;
  avatar_url: string;
  lifetime_tokens: number;
  games_played: number;
  lifetime_M: number;
  est_cost_usd: number;
  avg_M_per_game: number;
  peak_game_tokens: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function hexToRgba(hex: string, alpha = 0.15): string {
  const h = hex?.replace('#', '') || '38bdf8';
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#38bdf8', icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: any;
}) {
  return (
    <div
      className="relative rounded-xl border p-4 flex flex-col gap-1 overflow-hidden"
      style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${hexToRgba(color, 0.08)}, #0B0E14)` }}
    >
      <div className="absolute top-3 right-3 opacity-20">
        <Icon className="w-8 h-8" style={{ color }} />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold" style={{ color: `${color}99` }}>{label}</span>
      <span className="text-2xl font-bold font-mono text-white">{value}</span>
      {sub && <span className="text-[10px] text-white/40 font-mono">{sub}</span>}
    </div>
  );
}

function TrendBar({ days, max }: { days: TrendDay[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {days.map((d) => {
        const h = max > 0 ? (d.total_tokens / max) * 100 : 0;
        const color = d.total_tokens > 5_000_000 ? '#ef4444' : d.total_tokens > 2_000_000 ? '#f59e0b' : '#22c55e';
        return (
          <div key={d.game_date} className="flex-1 flex flex-col items-center gap-0.5 group relative cursor-pointer">
            <div
              className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${Math.max(4, h)}%`, backgroundColor: color, minHeight: '4px' }}
            />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#111827] border border-white/20 rounded px-2 py-1 text-[9px] font-mono text-white whitespace-nowrap z-10 pointer-events-none">
              <span>{d.game_date}</span>
              <span className="text-[#22c55e]">{d.total_M}M toks</span>
              <span className="text-white/40">${d.est_cost_usd}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TokenLedger() {
  const apiBase = getApiBase();
  const [tab, setTab] = useState<'report' | 'leaderboard' | 'trends'>('report');
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedPk, setSelectedPk] = useState<string>('');
  const [report, setReport] = useState<GameReport | null>(null);
  const [fleet, setFleet] = useState<FleetSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortCol, setSortCol] = useState<'total_tokens' | 'pct_of_game' | 'est_cost_usd'>('total_tokens');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, fRes, lRes, tRes] = await Promise.all([
        fetch(`${apiBase}/api/token-analytics/games`),
        fetch(`${apiBase}/api/token-analytics/summary`),
        fetch(`${apiBase}/api/token-analytics/leaderboard`),
        fetch(`${apiBase}/api/token-analytics/trends?days=30`),
      ]);
      const gData = await gRes.json();
      const fData = await fRes.json();
      const lData = await lRes.json();
      const tData = await tRes.json();
      setGames(gData.games || []);
      setFleet(fData);
      setLeaderboard(lData.leaderboard || []);
      setTrend(tData.trend || []);
      if (gData.games?.length && !selectedPk) {
        setSelectedPk(gData.games[0].game_pk);
      }
    } catch (e) { console.error('[TokenLedger]', e); }
    setLoading(false);
  }, [apiBase, selectedPk]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedPk) return;
    fetch(`${apiBase}/api/token-analytics/game/${selectedPk}`)
      .then(r => r.json())
      .then(setReport)
      .catch(console.error);
  }, [selectedPk, apiBase]);

  const sortedPersonas = [...(report?.personas || [])].sort((a, b) => b[sortCol] - a[sortCol]);
  const trendMax = Math.max(...trend.map(d => d.total_tokens), 1);

  return (
    <div className="flex flex-col h-full w-full bg-[#08090f] text-white overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-[#7c3aed]" />
          </div>
          <div>
            <h2 className="text-white font-bold font-mono uppercase tracking-widest text-sm">Token Ledger</h2>
            <p className="text-white/30 text-[9px] font-mono uppercase tracking-wider">Intelligence & Core Infrastructure</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/20 text-[10px] font-mono uppercase tracking-wider transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Fleet Summary Cards ── */}
      {fleet && fleet.totals && fleet.credit_runway && (
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="All-Time Tokens"
            value={`${fleet.totals.all_time_M}M`}
            sub={`${fleet.totals.total_games} game nights`}
            color="#7c3aed"
            icon={Zap}
          />
          <StatCard
            label="Est. Total Cost"
            value={`$${fleet.totals.all_time_cost_usd}`}
            sub="Free credits — no real burn"
            color="#22c55e"
            icon={DollarSign}
          />
          <StatCard
            label="Credit Runway"
            value={`${fleet.credit_runway.est_games_remaining} games`}
            sub={`$${fleet.credit_runway.remaining_usd} remaining`}
            color="#38bdf8"
            icon={Activity}
          />
          <StatCard
            label="Top Burner"
            value={fleet.top_persona?.user_name || '—'}
            sub={`${fleet.top_persona ? fmt(fleet.top_persona.t) : '—'} tokens all-time`}
            color={fleet.top_persona?.hex || '#f59e0b'}
            icon={Trophy}
          />
        </div>
      )}

      {/* ── Tab Nav ── */}
      <div className="px-6 flex gap-1 border-b border-white/5">
        {(['report', 'leaderboard', 'trends'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest font-bold border-b-2 transition-all ${
              tab === t ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-transparent text-white/30 hover:text-white/60'
            }`}
          >
            {t === 'report' ? '📋 Game Report' : t === 'leaderboard' ? '🏆 Leaderboard' : '📈 Trends'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ══════════ GAME REPORT TAB ══════════ */}
        {tab === 'report' && (
          <div className="p-6 flex flex-col gap-5">
            {/* Game Picker */}
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40">Game</label>
              <div className="relative">
                <select
                  value={selectedPk}
                  onChange={e => setSelectedPk(e.target.value)}
                  className="appearance-none bg-[#111827] border border-white/10 text-white text-xs font-mono rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-[#7c3aed]/50 cursor-pointer"
                >
                  {games.map(g => (
                    <option key={g.game_pk} value={g.game_pk}>
                      {g.game_date} — {g.away_team} @ {g.home_team} ({g.total_M}M toks · ${g.est_cost_usd})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
              </div>
              {selectedPk && (
                <a
                  href={`${apiBase}/api/token-analytics/export/${selectedPk}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg text-[#22c55e] text-[10px] font-mono uppercase tracking-wider hover:bg-[#22c55e]/20 transition-all"
                >
                  <Download className="w-3 h-3" /> CSV
                </a>
              )}
            </div>

            {report && (
              <>
                {/* Game Summary Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Total Tokens</div>
                    <div className="text-xl font-bold text-white font-mono">{report.game.total_M}M</div>
                    <div className="text-[9px] text-white/20 font-mono">{report.game.total_tokens.toLocaleString()} raw</div>
                  </div>
                  <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#7c3aed]/60 mb-1">Gemini</div>
                    <div className="text-xl font-bold text-[#7c3aed] font-mono">{report.game.gemini_M}M</div>
                    <div className="text-[9px] text-white/20 font-mono">{report.game.gemini_pct}% of total</div>
                  </div>
                  <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#f59e0b]/60 mb-1">Sys (Bouncer)</div>
                    <div className="text-xl font-bold text-[#f59e0b] font-mono">{report.game.sys_M}M</div>
                    <div className="text-[9px] text-white/20 font-mono">{report.game.sys_pct}% of total</div>
                  </div>
                  <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#22c55e]/60 mb-1">Est. Cost</div>
                    <div className="text-xl font-bold text-[#22c55e] font-mono">${report.game.total_cost_usd}</div>
                    <div className="text-[9px] text-white/20 font-mono">blended $0.30/M</div>
                  </div>
                </div>

                {/* Persona Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold">Persona Breakdown</h3>
                    <div className="flex gap-1">
                      {(['total_tokens', 'pct_of_game', 'est_cost_usd'] as const).map(col => (
                        <button
                          key={col}
                          onClick={() => setSortCol(col)}
                          className={`px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all ${
                            sortCol === col ? 'bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30' : 'text-white/20 hover:text-white/50'
                          }`}
                        >
                          {col === 'total_tokens' ? 'Tokens' : col === 'pct_of_game' ? '% Share' : 'Cost'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sortedPersonas.map((p, i) => (
                      <motion.div
                        key={p.user_name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="relative rounded-xl border overflow-hidden"
                        style={{ borderColor: `${p.hex || '#38bdf8'}20`, background: hexToRgba(p.hex || '#38bdf8', 0.04) }}
                      >
                        {/* Progress bar background */}
                        <div
                          className="absolute left-0 top-0 bottom-0 rounded-l-xl opacity-10"
                          style={{ width: `${p.pct_of_game}%`, backgroundColor: p.hex || '#38bdf8' }}
                        />
                        <div className="relative flex items-center gap-3 px-4 py-3">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border" style={{ borderColor: `${p.hex}40` }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border" style={{ borderColor: `${p.hex}40`, backgroundColor: hexToRgba(p.hex, 0.3), color: p.hex }}>
                              {p.user_name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white font-mono">{p.user_name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase" style={{ color: p.hex, backgroundColor: hexToRgba(p.hex, 0.2) }}>{p.team}</span>
                            </div>
                            {(p.input_tokens > 0 || p.output_tokens > 0) && (
                              <div className="text-[9px] text-white/30 font-mono mt-0.5">
                                ↑ {fmt(p.input_tokens)} in · ↓ {fmt(p.output_tokens)} out
                              </div>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-0.5">
                            <span className="font-bold font-mono text-white">{fmt(p.total_tokens)}</span>
                            <span className="text-[9px] font-mono text-white/30">{p.pct_of_game}% · ${p.est_cost_usd}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ LEADERBOARD TAB ══════════ */}
        {tab === 'leaderboard' && (
          <div className="p-6">
            <div className="space-y-2">
              {leaderboard.map((p, i) => (
                <motion.div
                  key={p.user_name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative rounded-xl border overflow-hidden"
                  style={{ borderColor: `${p.hex || '#38bdf8'}25`, background: `linear-gradient(90deg, ${hexToRgba(p.hex || '#38bdf8', 0.08)}, #111827)` }}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="text-2xl font-black font-mono w-8 text-right shrink-0" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#ffffff30' }}>
                      {i + 1}
                    </div>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border-2 shrink-0" style={{ borderColor: p.hex }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold border-2 shrink-0 text-sm" style={{ borderColor: p.hex, backgroundColor: hexToRgba(p.hex, 0.3), color: p.hex }}>
                        {p.user_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white font-mono">{p.user_name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ color: p.hex, backgroundColor: hexToRgba(p.hex, 0.2) }}>{p.team}</span>
                      </div>
                      <div className="text-[10px] text-white/30 font-mono">{p.games_played} games · avg {p.avg_M_per_game}M/game · peak {fmt(p.peak_game_tokens)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-lg" style={{ color: p.hex }}>{p.lifetime_M}M</div>
                      <div className="text-[10px] font-mono text-white/30">${p.est_cost_usd} est.</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ TRENDS TAB ══════════ */}
        {tab === 'trends' && (
          <div className="p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold mb-4">Token Burn — Last 30 Days</h3>
              <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
                <TrendBar days={trend} max={trendMax} />
                <div className="flex justify-between mt-2 text-[9px] text-white/20 font-mono">
                  <span>{trend[0]?.game_date || '—'}</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm bg-[#22c55e] inline-block" /> {'<'}2M
                    <span className="w-2 h-2 rounded-sm bg-[#f59e0b] inline-block" /> 2-5M
                    <span className="w-2 h-2 rounded-sm bg-[#ef4444] inline-block" /> {'>'}5M
                  </span>
                  <span>{trend[trend.length - 1]?.game_date || '—'}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-white/30 border-b border-white/5">
                    <th className="text-left py-2 font-normal">Date</th>
                    <th className="text-right py-2 font-normal">Games</th>
                    <th className="text-right py-2 font-normal">Tokens</th>
                    <th className="text-right py-2 font-normal">Gemini</th>
                    <th className="text-right py-2 font-normal">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[...trend].reverse().map(d => (
                    <tr key={d.game_date} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-2 text-white/70">{d.game_date}</td>
                      <td className="py-2 text-right text-white/40">{d.games}</td>
                      <td className="py-2 text-right text-white font-bold">{d.total_M}M</td>
                      <td className="py-2 text-right text-[#7c3aed]">{((d as any).gemini_M || d.total_M)}M</td>
                      <td className="py-2 text-right text-[#22c55e]">${d.est_cost_usd}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-white/10">
                  <tr>
                    <td className="py-2 text-white/40 text-[10px] uppercase tracking-wider" colSpan={2}>30-Day Total</td>
                    <td className="py-2 text-right font-bold text-white">
                      {(trend.reduce((s, d) => s + d.total_tokens, 0) / 1_000_000).toFixed(2)}M
                    </td>
                    <td />
                    <td className="py-2 text-right font-bold text-[#22c55e]">
                      ${trend.reduce((s, d) => s + d.est_cost_usd, 0).toFixed(4)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
