import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function SportsLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-container sovereign-shell-container">
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
        <div style={{ width: '44px' }} /> {/* spacer */}
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

      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

