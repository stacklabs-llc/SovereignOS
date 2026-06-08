import React, { useState, useRef } from 'react';
import { User, Users, LogOut, ChevronDown } from 'lucide-react';
import { getApiHost } from '../api-host';
import { useAuth } from '../contexts/AuthContext';
import { TOKEN_KEY_EXPORT } from './AuthGate';
import FanProfileModal from './FanProfileModal';

interface GlobalSystemBarProps {
  osTheme: string;
  setOsTheme: (theme: string) => void;
  accessLocale: "CIVILIAN" | "COMMAND";
  setAccessLocale: (locale: "CIVILIAN" | "COMMAND") => void;
  isVocalMatrixOpen: boolean;
  setIsVocalMatrixOpen: (open: boolean) => void;
  activeDomain: string;
  activeRoom: string;
  globalRoomBoggsOverride: string;
  setGlobalRoomBoggsOverride: (rating: string) => void;
  onNavigateRoom?: (room: string) => void;
}

export default function GlobalSystemBar({ 
  osTheme, 
  setOsTheme, 
  accessLocale,
  setAccessLocale,
  isVocalMatrixOpen, 
  setIsVocalMatrixOpen, 
  activeDomain, 
  activeRoom,
  globalRoomBoggsOverride,
  setGlobalRoomBoggsOverride,
  onNavigateRoom,
}: GlobalSystemBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showFanProfile, setShowFanProfile] = useState(false);
  const auth = useAuth() as any; // includes logout from AuthGate provider

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
    } else {
      localStorage.removeItem(TOKEN_KEY_EXPORT);
      document.cookie = `${TOKEN_KEY_EXPORT}=; path=/; domain=clio.taila01894.ts.net; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
    window.location.reload();
  };

  const isDev = window.location.port === '3001' || (window.location.hostname || '').includes('dev');

  const activeDisplayName = auth?.display_name || auth?.user_name || 'Pilot';
  const isPatronVisual = auth?.role === 'patron';
  const isPilotVisual = auth?.role === 'pilot' || auth?.role === 'creator' || auth?.role === 'admin' || 
    activeDisplayName.toLowerCase() === 'pawel' ||
    activeDisplayName.toLowerCase() === 'paul' ||
    activeDisplayName.toLowerCase() === 'james' ||
    activeDisplayName.toLowerCase() === 'pilot';

  const containerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px',
    fontFamily: 'monospace'
  };

  return (
    <div 
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      






      {/* Sovereign Oracle Toggle */}
      {auth?.role === 'pilot' || auth?.role === 'creator' ? (
      <button
        onClick={() => setIsVocalMatrixOpen(!isVocalMatrixOpen)}
        className={`px-3 py-1.5 border rounded transition-colors font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${isVocalMatrixOpen
            ? 'bg-[#38bdf8] text-white border-[#38bdf8]'
            : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/50 hover:bg-[#38bdf8] hover:text-white'
          }`}
      >
        🎙️ Sovereign Oracle
      </button>
      ) : null}

      {/* Cast Controls */}
      {!isDev && (auth?.role === 'pilot' || auth?.role === 'creator') && (
        <>
          <span className="font-sans text-[9px] uppercase tracking-widest text-white/60 px-2 border-l border-white/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">ADB Cast</span>
          <button
            onClick={() => {
              const targetUrl = window.location.origin + window.location.pathname + "?domain=" + activeDomain + (activeRoom ? "&room=" + activeRoom : "");
              fetch(`/api/cast_tv/192.168.1.68`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl })
              });
            }}
            className="px-3 py-1.5 bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/50 rounded hover:bg-[#4285F4] hover:text-white transition-colors font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
          >
            📺 65" TV
          </button>
          <button
            onClick={() => {
              const targetUrl = window.location.origin + window.location.pathname + "?domain=" + activeDomain + (activeRoom ? "&room=" + activeRoom : "");
              fetch(`/api/cast_tv/192.168.1.111`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl })
              });
            }}
            className="px-3 py-1.5 bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/50 rounded hover:bg-[#4285F4] hover:text-white transition-colors font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
          >
            📺 55" TV
          </button>
        </>
      )}

          {/* Account Chip */}
          <div className="pl-4 border-l border-white/20 ml-2 relative">
            <button
              id="account-chip-btn"
              onClick={() => setIsAccountOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 border border-white/10"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#38bdf8]/40 to-[#a855f7]/40 border border-white/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold tracking-wide">{auth?.display_name || auth?.user_name || 'Pilot'}</span>
                <span className={`text-[8px] uppercase tracking-widest font-mono ${isPilotVisual ? 'text-[#38bdf8]' : isPatronVisual ? 'text-[#f59e0b]' : 'text-[#22c55e]'}`}>
                  {isPilotVisual ? '⬡ PILOT' : isPatronVisual ? '◆ PATRON' : '◈ GUEST'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-xs font-bold">{auth?.display_name || auth?.user_name}</p>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mt-0.5">{isPilotVisual ? 'pilot' : isPatronVisual ? 'patron' : auth?.role}</p>
                </div>
                
                {/* Workspace OS Switcher in Dropdown */}
                {!isDev && (
                  <div className="px-4 py-2 border-b border-white/5">
                    <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Workspace OS</label>
                    <select 
                      value={osTheme}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOsTheme(val);
                        localStorage.setItem('sovereign_theme', val);
                        document.documentElement.setAttribute('data-theme', val);
                        window.dispatchEvent(new Event('theme_changed'));
                        window.dispatchEvent(new CustomEvent('sovereign_theme_change', { detail: { theme: val } }));
                      }}
                      className="w-full bg-[#111827] text-white/90 border border-white/20 rounded px-2 py-1.5 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-[#38bdf8] cursor-pointer transition-all"
                    >
                      <option value="sovereign-home">Sovereign Home (Premium)</option>
                      <option value="stacklabs">StackLabs Monolith</option>
                      <option value="aether-vet">Aether Vet (Clinical)</option>
                      <option value="gardenstack">GardenStack (Botanical)</option>
                      <option value="espn">ESPN Workspace</option>
                      <option value="pixel">8-Bit Arcade</option>
                      <option value="linux">Hacker Terminal</option>
                      <option value="steamboat">Steamboat</option>
                      <option value="storybook-sapphire">Storybook Sapphire (High-Contrast, Oversized)</option>
                    </select>
                  </div>
                )}
                
                {/* My Profile */}
                <button
                  id="my-profile-btn"
                  onClick={() => { setIsAccountOpen(false); setShowFanProfile(true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <User className="w-3.5 h-3.5" /> My Profile
                </button>
                {/* Manage Users (Pilot only) */}
                {auth?.role === 'pilot' && (
                  <button
                    id="manage-users-btn"
                    onClick={() => { setIsAccountOpen(false); onNavigateRoom?.('user_mgmt'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[#38bdf8]/80 hover:text-[#38bdf8] hover:bg-[#38bdf8]/5 transition-colors text-xs font-bold uppercase tracking-widest border-t border-white/5"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Users
                  </button>
                )}
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
      {showFanProfile && <FanProfileModal onClose={() => setShowFanProfile(false)} />}
    </div>
  );
}
