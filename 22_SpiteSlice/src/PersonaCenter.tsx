import { useState, useEffect, useCallback } from 'react';
import { Bot, Search, Save, X, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import avatarMapData from './avatarMap';

const avatarMap: Record<string, string> = avatarMapData;

interface AiPersona {
  id: string;
  user_name: string;
  display_name: string;
  team: string;
  active: number;
  system_prompt?: string;
  cadence?: string;
  boggs_level: number;
  behavior_notes?: string;
  deep_lore?: string;
  governance?: string;
  avatar_url?: string;
  color?: string;
  email_alias?: string;
}

export default function PersonaCenter() {
  const [bots, setBots] = useState<AiPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AiPersona | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('garden_client');

  const getSessionToken = () => localStorage.getItem('sovereign_session_token') || '';

  // Retrieve user role from session token
  useEffect(() => {
    try {
      const token = getSessionToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.role) {
          setUserRole(payload.role);
        }
      }
    } catch (err) {
      console.error('Error decoding role from token:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getSessionToken();
      const res = await fetch('/api/personas', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load personas: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setBots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRecord = (record: AiPersona) => {
    setSelectedRecord(record);
    setEditForm({ ...record });
  };

  const handleSave = async () => {
    if (!selectedRecord || !editForm) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getSessionToken();
      const res = await fetch(`/api/personas/${selectedRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || 'Save failed');
      }
      await loadData();
      setSelectedRecord(null);
      setEditForm(null);
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBots = bots.filter((b) =>
    (b.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.team || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (bot: AiPersona) => {
    if (bot.avatar_url) return bot.avatar_url;
    const avatarKey = (bot.user_name || '').toLowerCase().replace(/[\s]/g, '_');
    return avatarMap[avatarKey] || `https://api.dicebear.com/7.x/initials/svg?seed=${bot.user_name}&backgroundColor=059669&textColor=ffffff`;
  };

  const isPilot = userRole === 'pilot' || userRole === 'admin';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 text-white">
      <header className="border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-widest uppercase">Persona Center</h2>
          <p className="text-slate-400 font-light tracking-widest text-xs uppercase mt-1">
            WildSeed AI Agent registry & performance metrics
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>SYNC REGISTRY</span>
        </button>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-mono">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main layout splitting List and Editor Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Personas Grid */}
        <div className={`space-y-6 ${selectedRecord ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search active personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBots.map((bot) => {
              const isSelected = selectedRecord?.id === bot.id;
              return (
                <div
                  key={bot.id}
                  onClick={() => handleSelectRecord(bot)}
                  className={`clinical-card bg-black/40 border transition-all rounded-2xl p-5 flex flex-col justify-between h-48 cursor-pointer relative group ${
                    isSelected ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={getAvatarUrl(bot)}
                      alt={bot.display_name}
                      className="w-14 h-14 rounded-2xl border border-white/10 object-cover bg-slate-900 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 uppercase">
                          {bot.team}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500">BOGGS: {bot.boggs_level}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase mt-1.5 group-hover:text-emerald-400 transition-colors">
                        {bot.display_name}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                        @{bot.user_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 italic font-light pl-1 border-l border-white/10 py-1">
                    {bot.behavior_notes || 'No custom agent behavior profile set.'}
                  </p>
                </div>
              );
            })}
          </div>

          {!loading && filteredBots.length === 0 && (
            <div className="text-center py-12 bg-black/20 border border-white/5 rounded-2xl">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-mono">No matching WeedStack personas discovered in registry.</p>
            </div>
          )}
        </div>

        {/* Editor Panel */}
        {selectedRecord && editForm && (
          <div className="lg:col-span-5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl sticky top-28 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-emerald-400" size={18} />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                  Configure Agent Profile
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setEditForm(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  Agent Username slug
                </label>
                <input
                  type="text"
                  value={editForm.user_name}
                  disabled={!isPilot}
                  onChange={(e) => setEditForm({ ...editForm, user_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Boggs Reactivity */}
              <div>
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  Boggs Reactivity Level {!isPilot && '(Max: 3)'}
                </label>
                <select
                  value={editForm.boggs_level}
                  onChange={(e) => setEditForm({ ...editForm, boggs_level: parseInt(e.target.value) })}
                  className="w-full bg-[#121824] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
                >
                  <option value="1">1 - Minimal</option>
                  <option value="2">2 - Standard</option>
                  <option value="3">3 - Active</option>
                  {isPilot && (
                    <>
                      <option value="4">4 - High</option>
                      <option value="5">5 - Critical</option>
                    </>
                  )}
                </select>
              </div>

              {/* Behavior expectations */}
              <div>
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  Behavior & Tone Instructions
                </label>
                <textarea
                  rows={3}
                  value={editForm.behavior_notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, behavior_notes: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
                />
              </div>

              {/* Pilot-only parameters */}
              {isPilot ? (
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mb-2">
                    <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      PILOT ADMIN PRIVILEGES ACTIVE
                    </span>
                    <span className="text-[9px] text-slate-400 leading-normal block">
                      You are authorized to configure advanced agent prompts, deep lore injection matrices, and system governance criteria.
                    </span>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                      System Instructions Prompt
                    </label>
                    <textarea
                      rows={5}
                      value={editForm.system_prompt || ''}
                      onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 transition-all font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    RESTRICTED SETTINGS
                  </span>
                  <span className="text-[9px] text-slate-500 leading-normal block">
                    Advanced settings (System Instructions, Deep Lore, Team Assignments) are managed exclusively by the Pilot. Contact administration to elevate permissions.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 border border-white/10 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-mono rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
