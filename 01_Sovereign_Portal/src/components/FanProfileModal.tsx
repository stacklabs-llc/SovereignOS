import React, { useState, useEffect } from 'react';
import { X, Save, UserCircle, Sliders, BookOpen, Award, CheckCircle, Cpu, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FanProfileModalProps {
  onClose: () => void;
}

export default function FanProfileModal({ onClose }: FanProfileModalProps) {
  const auth = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [password, setPassword] = useState('');
  const [osTheme, setOsTheme] = useState('sovereign-home');
  const [entropyLevel, setEntropyLevel] = useState(5);
  const [proceduralAvatars, setProceduralAvatars] = useState(false);
  const [kioskProjection, setKioskProjection] = useState(false);
  const [introduction, setIntroduction] = useState('');
  const [deskRelic, setDeskRelic] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'cockpit' | 'guide' | 'achievements'>('profile');

  useEffect(() => {
    if (auth) {
      setDisplayName(auth.display_name || '');
      setAvatarUrl(auth.avatar_url || '');
      setFavoriteTeam(auth.favorite_team || '');
      setOsTheme(auth.os_theme || 'sovereign-home');
      setEntropyLevel(auth.entropy_level || 5);
      setProceduralAvatars(auth.procedural_avatars || false);
      setKioskProjection(auth.kiosk_projection || false);
      setIntroduction(auth.introduction || '');
      setDeskRelic(auth.desk_relic || '');
    }
  }, [auth]);

  useEffect(() => {
    document.documentElement.setAttribute('data-entropy', entropyLevel.toString());
    return () => {
      document.documentElement.removeAttribute('data-entropy');
    };
  }, [entropyLevel]);

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const payload: any = {
        username: auth?.user_name,
        display_name: displayName,
        avatar_url: avatarUrl,
        favorite_team: favoriteTeam,
        os_theme: osTheme,
        entropy_level: entropyLevel,
        procedural_avatars: proceduralAvatars,
        kiosk_projection: kioskProjection,
        introduction: introduction,
        desk_relic: deskRelic,
      };
      if (password) payload.new_password = password;

      const token = localStorage.getItem('sovereign_session_token');
      const res = await fetch('/api/auth/update_my_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatus({ type: 'success', text: 'Profile updated! Syncing with system theme...' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const data = await res.json();
        setStatus({ type: 'error', text: data.detail || 'Failed to update' });
      }
    } catch (e) {
      setStatus({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const isDecoupledFanStack = window.location.search.includes('domain=PORTAL');
  const isRootAdmin = window.location.pathname === '/' && !isDecoupledFanStack;
  const modalTitle = isRootAdmin ? 'Pilot Profile' : 'User Profile';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans select-none">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
          <h2 className="text-[16px] font-bold text-white uppercase tracking-widest flex items-center gap-2 font-mono">
            <UserCircle className="w-5 h-5 text-[#38bdf8]" />
            {modalTitle}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="px-5 py-2 border-b border-white/5 bg-black/40 flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 shadow-md shadow-black/20'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            👤 Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cockpit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'cockpit'
                ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 shadow-md shadow-black/20'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            🎛️ Cockpit Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'guide'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md shadow-black/20'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            📖 Cockpit Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'achievements'
                ? 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 shadow-md shadow-black/20'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            🏆 Achievements
          </button>
        </div>

        {/* Scrollable Content Pane */}
        <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
          {status.text && (
            <div className={`text-[12px] px-4 py-3 rounded-xl border flex items-center gap-2 shadow-sm mb-4 ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400 font-mono' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono'}`}>
              {status.text}
            </div>
          )}

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20 font-mono"
                  placeholder="Your display handle..."
                />
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Personal Bio & Intro</label>
                <textarea 
                  value={introduction} 
                  onChange={e => setIntroduction(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20 resize-none font-mono"
                  placeholder="Tell the system prompt matrix about your operational specialization..."
                />
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Avatar URL</label>
                <input 
                  type="text" 
                  value={avatarUrl} 
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20 font-mono"
                  placeholder="https://example.com/avatar.png"
                />
                {avatarUrl && (
                  <div className="mt-3 flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                     <img src={avatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover bg-black/40 border border-white/10" onError={(e) => (e.currentTarget.style.display = 'none')} />
                     <span className="text-[11px] text-white/40 italic">Live portrait avatar synced</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Favorite Sports Team (CMDB Context)</label>
                <select 
                  value={favoriteTeam} 
                  onChange={e => setFavoriteTeam(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors font-mono"
                >
                  <option value="">Select a franchise...</option>
                  <option value="NYM">New York Mets (NYM)</option>
                  <option value="ATL">Atlanta Braves (ATL)</option>
                  <option value="DET">Detroit Tigers (DET)</option>
                  <option value="PHI">Philadelphia Phillies (PHI)</option>
                  <option value="LAD">Los Angeles Dodgers (LAD)</option>
                  <option value="NYY">New York Yankees (NYY)</option>
                </select>
              </div>

              <div className="border-t border-white/5 pt-3">
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Reset Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20 font-mono"
                  placeholder="Leave blank to preserve current credentials"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Cockpit Engine */}
          {activeTab === 'cockpit' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Ambient Aesthetic Substrate (KI-051)</label>
                <select 
                  value={osTheme} 
                  onChange={e => setOsTheme(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors font-mono"
                >
                  <option value="sovereign-home">Default Sovereign Grid (Deep Void & Frosted Glass)</option>
                  <option value="windows">Windows (Fluent Metro)</option>
                  <option value="linux">Linux (Hacker Terminal)</option>
                  <option value="steamboat">Steamboat (1930s Rubberhose)</option>
                  <option value="pixel">Pixel (8-Bit Arcade)</option>
                  <option value="nes">NES (Baseball Stars 1989)</option>
                  <option value="snes">SNES (16-Bit Super)</option>
                  <option value="n64">N64 (Atomic Polygon)</option>
                  <option value="psx">PSX (90s Cyberdeck)</option>
                  <option value="mac">Mac (System 7 Classic)</option>
                  <option value="storybook-sapphire">Storybook Sapphire (High-Contrast, Oversized)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest block font-mono">Entropy Dial Level</label>
                  <span className="text-[#38bdf8] font-bold text-[10px] bg-[#38bdf8]/10 px-2 py-0.5 rounded-full font-mono">Level {entropyLevel}/11</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntropyLevel(1)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      entropyLevel <= 2
                        ? 'bg-sky-500/10 border-sky-500/40 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.15)] font-bold'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className="text-[11px] font-bold tracking-wide font-mono">Corporate</span>
                    <span className="text-[8px] opacity-60 font-mono mt-0.5">Lv. 1-2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntropyLevel(5)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      entropyLevel >= 3 && entropyLevel <= 7
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className="text-[11px] font-bold tracking-wide font-mono">Cozy</span>
                    <span className="text-[8px] opacity-60 font-mono mt-0.5">Lv. 3-7</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntropyLevel(9)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      entropyLevel >= 8 && entropyLevel <= 10
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.15)] font-bold'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className="text-[11px] font-bold tracking-wide font-mono">Muppet Chaos</span>
                    <span className="text-[8px] opacity-60 font-mono mt-0.5">Lv. 8-10</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntropyLevel(11)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      entropyLevel >= 11
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)] font-bold'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className="text-[11px] font-bold tracking-wide font-mono">Feral Chaos</span>
                    <span className="text-[8px] opacity-60 font-mono mt-0.5">Lv. 11</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2">
                <div>
                  <label className="text-[12px] text-[#f1f5f9] font-semibold block font-mono">Procedural 4K Imagen Avatars</label>
                  <span className="text-[10px] text-[#94a3b8] block">Forge character sprites automatically</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setProceduralAvatars(!proceduralAvatars)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${proceduralAvatars ? 'bg-[#38bdf8]' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-900 transition-transform ${proceduralAvatars ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <label className="text-[12px] text-[#f1f5f9] font-semibold block font-mono">HDMI TV Kiosk Cast Projection</label>
                  <span className="text-[10px] text-[#94a3b8] block">Force direct layout casting on DISPLAY=:0</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setKioskProjection(!kioskProjection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${kioskProjection ? 'bg-[#38bdf8]' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-900 transition-transform ${kioskProjection ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="border-t border-white/5 pt-3">
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1.5 block font-mono">Fan-Cave Physical Desk Relic</label>
                <input 
                  type="text" 
                  value={deskRelic} 
                  onChange={e => setDeskRelic(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#38bdf8] transition-colors placeholder-white/20 mb-2 font-mono"
                  placeholder="e.g. wood-fired pizza paddle..."
                />
                <span className="text-[9px] text-[#94a3b8]/60 block leading-relaxed italic">
                  Procedural theme formula: Aesthetic Substrate + Bio Prompt + Desk Relic = Dynamic Fan-Cave Relic Forge!
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Cockpit Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 font-mono text-[11px] text-slate-300">
              
              <div className="bg-[#1e293b]/40 border border-white/5 rounded-xl p-3.5 space-y-2">
                <h3 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> What is the Command Cockpit?
                </h3>
                <p className="leading-relaxed">
                  The **Command Cockpit Console** is your mission control center. It generates a bespoke collection of **Interactive Relics** (navigation cards) configured specifically for your role, active stacks, and swarms.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-white/5 pb-1">
                  🔮 The Interactive Relics Schema
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      📟
                    </div>
                    <div>
                      <strong className="text-white block">16-Bit Cozy Kiosk</strong>
                      <span className="text-[10px] text-slate-400">Ledger & Sandbox Engine. Direct control gateway to the metsy-prime Wildseed ledger and StackLabs execution nodes.</span>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold shrink-0">
                      🧬
                    </div>
                    <div>
                      <strong className="text-white block">Queens Tears Potion</strong>
                      <span className="text-[10px] text-slate-400">AetherVet Medical Telemetry. Unlocks medical telemetry, health indicators, and remote feline/canine status feeds.</span>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      🔑
                    </div>
                    <div>
                      <strong className="text-white block">Golden Telepresence Key</strong>
                      <span className="text-[10px] text-slate-400">CSV & Auth matrix. Used to ingest server log streams, inspect credentials, and manage raw credentials.</span>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] font-bold shrink-0">
                      🛠️
                    </div>
                    <div>
                      <strong className="text-white block">Pilot Operator Desk Console</strong>
                      <span className="text-[10px] text-slate-400">User & Access Management. Access control console for provisioning humans and configuring system RBAC policies.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl p-3.5 space-y-2">
                <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  🌪️ Visual Entropy Dynamics
                </h4>
                <p className="leading-relaxed">
                  Your **Entropy Level** (1–11) controls the opacity, blur, and rendering weight of your workspace layout:
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-slate-400">
                  <li><strong>Lv. 1-2 (Corporate):</strong> Solid opaque backgrounds, high-speed flat panels.</li>
                  <li><strong>Lv. 3-7 (Cozy):</strong> Soft frosted glass layers with standard dynamic gradients.</li>
                  <li><strong>Lv. 8-10 (Muppet Chaos):</strong> Premium heavy neon shadows, floating tabs.</li>
                  <li><strong>Lv. 11 (Feral Chaos):</strong> High-contrast green-on-black wireframe cyberdeck terminal!</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 4: Achievements & Badges */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 font-sans text-white">
              <div className="bg-[#03060c] border border-white/5 rounded-2xl p-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div>
                    <span className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wider font-mono">Dynamic Swarm Ingestion Streak</span>
                    <h4 className="text-xs font-black mt-0.5">Telemetry Synchronization Timeline</h4>
                  </div>
                  <div className="flex items-center gap-2 bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-2.5 py-1 rounded-xl text-[9px] text-[#38bdf8] font-mono font-bold self-start sm:self-center">
                    <span>Active Streak: 4 / 5 Days</span>
                  </div>
                </div>
                
                {/* Timeline Bar */}
                <div className="relative py-4 px-2 select-none">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#1e293b] -translate-y-1/2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] w-3/4 shadow-lg shadow-[#38bdf8]/35" />
                  </div>
                  
                  <div className="relative flex justify-between items-center z-10">
                    {[
                      { day: 1, label: 'Node 1', active: true, icon: '✓' },
                      { day: 2, label: 'Node 2', active: true, icon: '✓' },
                      { day: 3, label: 'Node 3', active: true, icon: '✓' },
                      { day: 4, label: 'Node 4', active: true, icon: '✓' },
                      { day: 5, label: 'Node 5', active: false, icon: '★' }
                    ].map((node) => (
                      <div key={node.day} className="flex flex-col items-center gap-1 group">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 transform ${
                          node.active
                            ? 'bg-[#38bdf8] border-2 border-[#38bdf8] text-[#03060c] shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                            : 'bg-[#0f172a] border border-[#334155] text-slate-500'
                        }`}>
                          {node.icon}
                        </div>
                        <span className={`text-[8px] font-mono font-bold ${node.active ? 'text-[#38bdf8]' : 'text-slate-400'}`}>
                          {node.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Achievements Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-[#f59e0b]" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">🧬 Swarm Operator Deployment Badges</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {(() => {
                    const username = auth?.user_name || 'james';
                    let userAchievements = [];
                    if (username === 'pawel') {
                      userAchievements = [
                        { id: 'weedstack_pioneer', title: 'WildSeed Swarm Completed', description: 'Successfully seeded and deployed the first WeedStack IoT matrix to WildSeed.', unlocked: true, dateEarned: '22 05 26', icon: '🌱' },
                        { id: 'relay_runner', title: 'Tailscale Mesh Swarm', description: 'Configured 15 concurrent Tailscale tunnel telemetry hops securely on clio.', unlocked: true, dateEarned: '24 05 26', icon: '⚡' },
                        { id: 'industrial_dial', title: 'Clio Relic Tethered', description: 'Integrated the custom tactile physical copper relic dial to clio command deck.', unlocked: true, dateEarned: '28 05 26', icon: '⚙️' },
                        { id: 'chaos_proof', title: 'Advocate Engagement Champion', description: 'Survive a heated Skew room debate with Barf without dropping telemetry frames.', unlocked: false, icon: '🛡%' }
                      ];
                    } else if (username === 'james') {
                      userAchievements = [
                        { id: 'command_pilot', title: 'Bare-Metal Core Swarm', description: 'Executed 1,000 CLI command loops on clio with zero system diagnostic faults.', unlocked: true, dateEarned: '12 05 26', icon: '🚀' },
                        { id: 'room_shaper', title: 'Aesthetic Alignment Seeder', description: 'Triggered 50 instant multi-workspace CSS themes dynamically.', unlocked: true, dateEarned: '18 05 26', icon: '🎨' },
                        { id: 'blue_tear', title: 'Bullpen Meltdown Survivor', description: 'Expressed undying hope for the Mets bullpen during a Skew session.', unlocked: true, dateEarned: '29 05 26', icon: '💧' },
                        { id: 'mard_transcendence', title: 'Relational Cognitive Link', description: 'Achieved full emotional relational alignment on the M.A.R.D core engine.', unlocked: false, icon: '🧠' }
                      ];
                    } else if (username === 'barf') {
                      userAchievements = [
                        { id: 'underpants_bandito', title: 'Portal Key Hijack Swarm', description: 'Successfully locked down the entire portal using retro terminal keys.', unlocked: true, dateEarned: '08 05 26', icon: '🦹' },
                        { id: 'mets_fanatic', title: 'Mets Bullpen Telemetrist', description: 'Screamed at Stearns for 45 minutes on the active telemetry line.', unlocked: true, dateEarned: '15 05 26', icon: '⚾' },
                        { id: 'hot_take_fire', title: 'Vocal Synthesizer Swarm', description: 'Triggered 15 concurrent vocal relay synthesizer overrides on argo.', unlocked: true, dateEarned: '27 05 26', icon: '🔥' },
                        { id: 'casino_king', title: 'Credit Injection Whale', description: 'Wagered 10,000 portal credits in a single session without sweating.', unlocked: false, icon: '🎰' }
                      ];
                    } else {
                      userAchievements = [
                        { id: 'so_weve_met', title: 'Mesh Swarm Auth', description: 'Successfully authenticated to the Sovereign Portal over secure tailscale.', unlocked: true, dateEarned: '29 05 26', icon: '🤝' },
                        { id: 'mom_on_tv', title: 'Genesis Seeder Recruit', description: 'Reached top 1000 operational rank in the Genesis seeder matrix.', unlocked: false, icon: '📺' },
                        { id: 'secret_trophy', title: 'Classified Swarm Goal', description: 'Keep completing assigned stories and tasks to unlock this relic.', unlocked: false, icon: '🔒' }
                      ];
                    }

                    return userAchievements.map((ach) => (
                      <div 
                        key={ach.id} 
                        className={`relative rounded-xl p-3 border transition-all duration-300 overflow-hidden flex items-center gap-3 ${
                          ach.unlocked 
                            ? 'bg-[#080d19] border-white/10 hover:border-[#38bdf8]/40 shadow-lg' 
                            : 'bg-[#050811]/60 border-white/5 opacity-55 saturate-[0.1]'
                        }`}
                      >
                        {!ach.unlocked && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <div className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-full border border-white/10">
                              <Award className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[7.5px] font-mono uppercase font-bold text-slate-400 tracking-wider">Locked Badge</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="relative shrink-0 w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 rounded-lg text-lg">
                          {ach.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-[11px] font-bold text-white truncate">{ach.title}</h5>
                            {ach.unlocked && ach.dateEarned && (
                              <span className="text-[7px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] px-1.5 py-0.5 rounded border border-[#38bdf8]/20 shrink-0">
                                {ach.dateEarned}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight font-sans">
                            {ach.description}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/20 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-colors font-mono">
            Cancel
          </button>
          {activeTab !== 'guide' && (
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#38bdf8] text-slate-900 hover:bg-[#7dd3fc] transition-colors shadow-[0_0_20px_rgba(56,189,248,0.2)] disabled:opacity-50 font-mono flex items-center gap-1">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
