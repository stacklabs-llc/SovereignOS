import React, { useState, useRef } from 'react';
import { User, Users, LogOut, ChevronDown } from 'lucide-react';
import { getApiHost } from '../api-host';
import { useAuth } from '../contexts/AuthContext';
import { TOKEN_KEY_EXPORT } from './AuthGate';
import FanProfileModal from './FanProfileModal';
import { GLOBAL_SETTINGS } from '../config/SovereignConfig';
import SyncStatusMonitor from './SyncStatusMonitor';


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
      document.cookie = `${TOKEN_KEY_EXPORT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
    window.location.reload();
  };

  const isDev = window.location.port === '3001' || (window.location.hostname || '').includes('dev');

  const activeDisplayName = auth?.display_name || auth?.user_name || 'Pilot';
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
      {(auth?.role === 'pilot' || auth?.role === 'creator') && (
        <div className="flex items-center gap-3">
          <SyncStatusMonitor />
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsVocalMatrixOpen(!isVocalMatrixOpen);
            }}
            className={`font-mono text-[10px] font-bold tracking-widest uppercase hover:underline flex items-center gap-1.5 transition-all duration-200 ${
              isVocalMatrixOpen ? 'text-[#38bdf8]' : 'text-gray-400 hover:text-[#38bdf8]'
            }`}
          >
            🎙️ Sovereign Oracle
          </a>
        </div>
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
                <span className={`text-[8px] uppercase tracking-widest font-mono ${isPilotVisual ? 'text-[#38bdf8]' : 'text-[#22c55e]'}`}>
                  {isPilotVisual ? '⬡ PILOT' : auth?.role === 'admin' ? '❖ ADMIN' : auth?.role === 'creator' ? '✧ CREATOR' : '◈ GUEST'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-[1000] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-xs font-bold">{auth?.display_name || auth?.user_name}</p>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mt-0.5">{auth?.role}</p>
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
                      className="w-full bg-[#111827] text-white/90 border border-white/20 rounded px-2 py-1.5 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-[#38bdf8] appearance-none cursor-pointer transition-all"
                    >
                      <optgroup label="Modern Systems">
                        <option value="sovereign-home">Sovereign Home (Premium)</option>
                        <option value="sny-classic">SNY Classic</option>
                        <option value="aether-vet">Aether Vet (Clinical)</option>
                        <option value="gardenstack">GardenStack (Botanical)</option>
                        <option value="espn">ESPN Workspace</option>
                        <option value="sovereign-rounded">Sovereign Rounded</option>
                        <option value="mac">Mac OS</option>
                        <option value="windows">Windows</option>
                        <option value="linux">Linux</option>
                      </optgroup>
                      <optgroup label="Retro Consoles">
                        <option value="nes">NES (8-bit)</option>
                        <option value="snes">SNES (16-bit)</option>
                        <option value="n64">Nintendo 64</option>
                        <option value="psx">PlayStation</option>
                      </optgroup>
                      <optgroup label="Experimental">
                        <option value="cereal">'90s Cereal Box</option>
                      </optgroup>
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
