import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import VocalMatrix from './VocalMatrix';

export default function SportsLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeTheme, setActiveTheme } = useTheme();
  const location = useLocation();
  const isFanPortal = location.pathname.includes('fan-portal');

  return (
    <div className={`app-container sovereign-shell-container ${activeTheme}`}>
      {/* Mobile Header Bar */}
      <div className="mobile-header" style={{
        display: 'none',
        height: '56px',
        background: 'rgba(11, 14, 20, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        padding: '0 1rem',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 1001
      }}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '10px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>SOVEREIGN SPORTS</span>
        
        {/* Compact Mobile Theme Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
          <select 
            value={activeTheme} 
            onChange={(e) => setActiveTheme(e.target.value)}
            style={{
              background: '#090e1a',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <option value="sovereign-cyan">Cyan</option>
            <option value="retro-16bit">Retro</option>
            <option value="the-show-sim">Show Sim</option>
            <option value="sny-cinematic">SNY</option>
            <option value="muppet-hell">Muppets</option>
          </select>
        </div>
      </div>

      {menuOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      <Sidebar 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        style={isFanPortal ? { width: '15%', minWidth: '15%' } : {}}
      />
      
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%', width: '100%' }}>
        {/* Main Portal Navigation Header */}
        {!isFanPortal && (
          <div className="portal-nav-header" style={{
            height: '70px',
            background: 'rgba(11, 14, 20, 0.4)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0 2rem 14px 2rem',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}>
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff', letterSpacing: '1.5px', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase' }}>
                Sovereign Fan Portal
              </span>
            </div>
            
            {/* Sleek Desktop Theme Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.6)' }}>THEME:</span>
              <select 
                value={activeTheme} 
                onChange={(e) => setActiveTheme(e.target.value)}
                style={{
                  background: '#090e1a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  outline: 'none',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <option value="sovereign-cyan">Sovereign Cyan</option>
                <option value="retro-16bit">16-Bit Retro</option>
                <option value="the-show-sim">The Show Sim</option>
                <option value="sny-cinematic">SNY Cinematic</option>
                <option value="muppet-hell">Muppet Hell</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Sub-viewport wrapper that maintains old main-content scrolling and padding */}
        <div style={isFanPortal ? { flex: 1, overflow: 'hidden', padding: 0, height: '100%', width: '100%', minHeight: 0 } : { flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <Outlet />
        </div>
      </div>

      {/* Floating VocalMatrix (Jake Taylor Umpire Node) */}
      <VocalMatrix />
    </div>
  );
}
