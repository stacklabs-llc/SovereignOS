import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, Navigation, Sliders, Globe, Home } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, style }: { isOpen?: boolean, onClose?: () => void, style?: React.CSSProperties }) {
  return (
    <div className={`sidebar sovereign-sidebar ${isOpen ? 'menu-open' : ''}`} style={style}>
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <img 
          src="/logo.png" 
          alt="Sovereign Sports" 
          style={{ 
            width: '130px', 
            height: '130px', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.45))',
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
          background: 'linear-gradient(90deg, #A78BFA, #38BDF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
        }}>Sovereign Sports</h1>
      </div>
      <div className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          end
        >
          <Home size={20} />
          <span>Home Hub</span>
        </NavLink>
        <NavLink 
          to="/mlb" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Gamepad2 size={20} />
          <span>MLB Streams</span>
        </NavLink>
        <NavLink 
          to="/pga" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Trophy size={20} />
          <span>PGA Tour</span>
        </NavLink>
        <NavLink 
          to="/footy" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Globe size={20} />
          <span>FootyStack</span>
        </NavLink>
        <NavLink 
          to="/fan-portal" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Trophy size={20} />
          <span>Crosstalk Lounge</span>
        </NavLink>
        <NavLink 
          to="/playcall-desk" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Sliders size={20} />
          <span>Playcall Desk</span>
        </NavLink>
        <div className="nav-item disabled" title="Coming Soon">
          <Navigation size={20} />
          <span>NBA Streams</span>
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
