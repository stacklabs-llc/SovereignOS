import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, Navigation } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <img 
          src="/logo.png" 
          alt="Sovereign Sports" 
          style={{ 
            width: '130px', 
            height: '130px', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 0 20px rgba(10, 132, 255, 0.45))',
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '5px'
          }} 
        />
        <h1 style={{ 
          margin: '0.5rem 0 0 0', 
          fontSize: '1.4rem', 
          fontWeight: 700, 
          letterSpacing: '1px',
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #0A84FF, #00FFCC)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(10, 132, 255, 0.3)'
        }}>Sovereign Sports</h1>
      </div>
      <div className="sidebar-nav">
        <NavLink 
          to="/mlb" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Gamepad2 size={20} />
          <span>MLB Streams</span>
        </NavLink>
        <div className="nav-item disabled" title="Coming Soon">
          <Trophy size={20} />
          <span>NFL Streams</span>
        </div>
        <div className="nav-item disabled" title="Coming Soon">
          <Navigation size={20} />
          <span>NBA Streams</span>
        </div>
        <div className="nav-item disabled" title="Coming Soon">
          <Trophy size={20} />
          <span>PGA Tour</span>
        </div>
      </div>
      
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FFCC', boxShadow: '0 0 8px #00FFCC' }} />
          <span>Secure Tailscale Mesh</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>v1.0.0-PROD</span>
      </div>
    </div>
  );
}
