import React, { useState, useEffect, useRef } from 'react';
import { getWsUrl } from '../api-host';
import { useAuth } from '../contexts/AuthContext';
import avatarMapData from '../avatarMap';
import { Plus, Trash2, Volume2, X, AlertCircle } from 'lucide-react';

interface SoundboardProps {
  activeGamedayPk?: string | null;
}

interface Phrase {
  sys_id: string;
  persona_id: string;
  button_label: string;
  text_payload: string;
  is_custom: number;
  created_at: string;
}

const ADVOCATE_CONFIG: Record<string, { label: string; username: string; color: string; hoverColor: string }> = {
  barf: {
    label: '@barf',
    username: '@barf',
    color: '#FF5733',
    hoverColor: 'rgba(255, 87, 51, 0.2)',
  },
  compliance_karen: {
    label: '@compliance_karen',
    username: '@compliance_karen',
    color: '#22C55E',
    hoverColor: 'rgba(34, 197, 94, 0.2)',
  },
  keith_fanboy: {
    label: '@keith_fanboy',
    username: '@keith_fanboy',
    color: '#1D4ED8',
    hoverColor: 'rgba(29, 78, 216, 0.2)',
  },
};

export default function Soundboard({ activeGamedayPk }: SoundboardProps) {
  const auth = useAuth();
  const [activeAdvocate, setActiveAdvocate] = useState<'barf' | 'compliance_karen' | 'keith_fanboy'>('barf');
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newButtonLabel, setNewButtonLabel] = useState('');
  const [newTextPayload, setNewTextPayload] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const selectedGamePkRef = useRef(activeGamedayPk);

  useEffect(() => {
    selectedGamePkRef.current = activeGamedayPk;
  }, [activeGamedayPk]);

  // Fetch Phrases
  const fetchPhrases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/soundboard?advocate=${activeAdvocate}`);
      if (!res.ok) throw new Error('Failed to load soundboard phrases');
      const data = await res.json();
      if (data.status === 'success') {
        setPhrases(data.phrases);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching soundboard phrases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhrases();
  }, [activeAdvocate]);

  // WebSocket Connection
  useEffect(() => {
    let reconnectTimeout: any;
    const connectWs = () => {
      const socket = new WebSocket(getWsUrl('/ws-relay'));

      socket.onopen = () => {
        console.log("Soundboard connected to M.A.R.D. Relay");
        socket.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: selectedGamePkRef.current || "GLOBAL" }));
      };

      socket.onclose = () => {
        console.log("Soundboard disconnected from relay, retrying in 3s...");
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      wsRef.current = socket;
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Update room when gamePk changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "JOIN_ROOM", target_game_pk: activeGamedayPk || "GLOBAL" }));
    }
  }, [activeGamedayPk]);

  // Handle Play/Send phrase
  const handlePlayPhrase = (phrase: Phrase) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("Relay disconnected. Unable to broadcast phrase.");
      return;
    }

    const config = ADVOCATE_CONFIG[activeAdvocate];
    wsRef.current.send(JSON.stringify({
      type: "CHAT_MESSAGE",
      user: config.username,
      color: config.color,
      text: phrase.text_payload,
      target_game_pk: activeGamedayPk || "GLOBAL"
    }));
  };

  // Handle Create Phrase
  const handleCreatePhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newButtonLabel.trim() || !newTextPayload.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/media/soundboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advocate: activeAdvocate,
          button_label: newButtonLabel.toUpperCase(),
          text_payload: newTextPayload,
        }),
      });

      if (!res.ok) throw new Error('Failed to create phrase');
      const data = await res.json();
      if (data.status === 'success') {
        setNewButtonLabel('');
        setNewTextPayload('');
        setIsDrawerOpen(false);
        fetchPhrases();
      }
    } catch (err: any) {
      alert(err.message || 'Error saving phrase');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Phrase
  const handleDeletePhrase = async (sys_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this burn?')) return;

    try {
      const res = await fetch(`/api/media/soundboard/${sys_id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete phrase');
      const data = await res.json();
      if (data.status === 'success') {
        fetchPhrases();
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting phrase');
    }
  };

  const currentAdvocate = ADVOCATE_CONFIG[activeAdvocate];
  const avatarMap: Record<string, string> = avatarMapData || {};
  const avatarSrc = avatarMap[activeAdvocate] || avatarMap[activeAdvocate.replace(/_/g, '')];

  return (
    <div className="relative flex flex-col w-full bg-[#0a0c10]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-4">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          {avatarSrc ? (
            <img src={avatarSrc} className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-lg" alt={activeAdvocate} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center font-bold text-white uppercase">
              {activeAdvocate.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-display font-bold text-white tracking-widest text-sm uppercase">
              {currentAdvocate.label}
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
              Sovereign Advocate Soundboard
            </span>
          </div>
        </div>

        {/* ADVOCATE SELECTOR */}
        <div className="flex gap-1 bg-black/40 border border-white/5 rounded-lg p-0.5">
          {(['barf', 'compliance_karen', 'keith_fanboy'] as const).map((adv) => {
            const isActive = activeAdvocate === adv;
            const config = ADVOCATE_CONFIG[adv];
            return (
              <button
                key={adv}
                onClick={() => {
                  setActiveAdvocate(adv);
                  setIsDrawerOpen(false);
                }}
                className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={isActive ? { borderBottom: `2px solid ${config.color}` } : {}}
              >
                {adv === 'compliance_karen' ? 'KAREN' : adv === 'keith_fanboy' ? 'KEITH' : 'BARF'}
              </button>
            );
          })}
        </div>
      </div>

      {/* INNER CONTENT GRID */}
      <div className="flex gap-4 relative min-h-[180px]">
        {/* BUTTONS GRID */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center font-mono text-[10px] text-gray-500 uppercase tracking-widest animate-pulse">
              [ ACCESSING AUDIO MATRIX ]
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center gap-2 font-mono text-[10px] text-red-400 uppercase tracking-widest">
              <AlertCircle size={14} /> {error}
            </div>
          ) : phrases.length === 0 ? (
            <div className="flex-1 flex items-center justify-center font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              No Phrases Loaded
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {phrases.map((phrase) => {
                const isCustom = phrase.is_custom === 1;
                return (
                  <button
                    key={phrase.sys_id}
                    onClick={() => handlePlayPhrase(phrase)}
                    className="group relative px-3 py-3 rounded-lg border text-left flex flex-col justify-between items-start transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer overflow-hidden min-h-[60px]"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderColor: `${currentAdvocate.color}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentAdvocate.color;
                      e.currentTarget.style.backgroundColor = currentAdvocate.hoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${currentAdvocate.color}40`;
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                    title={phrase.text_payload}
                  >
                    {/* Retro Button Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-white to-transparent pointer-events-none" />

                    <div className="w-full flex items-center justify-between gap-1">
                      <span
                        className="font-display font-bold text-[10px] tracking-wider uppercase truncate"
                        style={{ color: currentAdvocate.color }}
                      >
                        {phrase.button_label}
                      </span>
                      <Volume2 size={10} className="text-gray-600 group-hover:text-white transition-colors" />
                    </div>

                    <span className="text-[8px] text-gray-500 group-hover:text-gray-300 font-mono tracking-wider line-clamp-1 mt-1">
                      {phrase.text_payload}
                    </span>

                    {/* Delete Custom Burn Button */}
                    {isCustom && (
                      <button
                        onClick={(e) => handleDeletePhrase(phrase.sys_id, e)}
                        className="absolute bottom-1 right-1 p-1 rounded hover:bg-black/40 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete custom phrase"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ADD CUSTOM BURN TRIGGER */}
          {!isDrawerOpen && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-white/10 hover:border-white/30 rounded-lg text-gray-500 hover:text-white transition-all text-[10px] font-bold tracking-widest uppercase cursor-pointer"
            >
              <Plus size={12} /> Add Custom Burn
            </button>
          )}
        </div>

        {/* DRAWER POPUP FOR ADDING CUSTOM BURNS */}
        {isDrawerOpen && (
          <div className="w-full sm:w-[260px] border-l border-white/10 pl-4 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
              <h4 className="font-display font-bold text-white tracking-wider text-[10px] uppercase">
                Add Custom Burn
              </h4>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            <form onSubmit={handleCreatePhrase} className="flex flex-col gap-3 flex-1 justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                    Button Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GIG ECONOMY"
                    value={newButtonLabel}
                    onChange={(e) => setNewButtonLabel(e.target.value)}
                    className="bg-black/60 border border-white/10 text-white px-2 py-1.5 text-[10px] rounded focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono placeholder:text-gray-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                    Burn Payload (Text)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter the phrase text payload..."
                    value={newTextPayload}
                    onChange={(e) => setNewTextPayload(e.target.value)}
                    className="bg-black/60 border border-white/10 text-white px-2 py-1.5 text-[10px] rounded focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono placeholder:text-gray-700 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-widest uppercase py-2 text-[10px] rounded transition-all disabled:opacity-50 shadow-md cursor-pointer mt-2"
              >
                {isSubmitting ? 'SAVING...' : 'SAVE BURN'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
