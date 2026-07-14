import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, Navigation, Sliders, Globe, Home, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ isOpen, onClose, style }: { isOpen?: boolean, onClose?: () => void, style?: React.CSSProperties }) {
  const { isSidebarCollapsed, setIsSidebarCollapsed, setUmpireOpen } = useTheme();

  const isExpanded = !isSidebarCollapsed;

  const combinedStyle: React.CSSProperties = {
    width: isExpanded ? '250px' : '68px',
    transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    ...style
  };

  return (
    <div 
      data-section="1" 
      className={`sidebar sovereign-sidebar ${isOpen ? 'menu-open' : ''}`} 
      style={combinedStyle}
    >
      {/* Target Zone Badge */}
      <div className="zone-badge" style={{ top: '12px', left: '12px' }}>
        [ZONE-1] SIDEBAR
      </div>
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: isExpanded ? '2rem 1rem' : '1.5rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
        <img 
          src="/logo.png" 
          alt="FanStack" 
          style={{ 
            width: isExpanded ? '130px' : '40px', 
            height: isExpanded ? '130px' : '40px', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.45))',
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '5px',
            transition: 'all 200ms'
          }} 
        />
        {isExpanded && (
          <h1 style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            letterSpacing: '1px',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #F97316, #FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(249, 115, 22, 0.3)'
          }}>FanStack</h1>
        )}
      </div>
      <div className="sidebar-nav" style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          end
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "Home Hub" : undefined}
        >
          <Home size={20} />
          {isExpanded && <span>Home Hub</span>}
        </NavLink>
        <NavLink 
          to="/mlb" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "MLB Streams" : undefined}
        >
          <Gamepad2 size={20} />
          {isExpanded && <span>MLB Streams</span>}
        </NavLink>
        <NavLink 
          to="/pga" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "PGA Tour" : undefined}
        >
          <Trophy size={20} />
          {isExpanded && <span>PGA Tour</span>}
        </NavLink>
        <NavLink 
          to="/footy" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "FootyStack" : undefined}
        >
          <Globe size={20} />
          {isExpanded && <span>FootyStack</span>}
        </NavLink>
        <NavLink 
          to="/fan-portal" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "Crosstalk Lounge" : undefined}
        >
          <Trophy size={20} />
          {isExpanded && <span>Crosstalk Lounge</span>}
        </NavLink>
        <div 
          className="nav-item disabled" 
          title="Coming Soon"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0',
            cursor: 'not-allowed',
            opacity: 0.5
          }}
        >
          <Navigation size={20} />
          {isExpanded && <span>NBA Streams</span>}
        </div>
        <NavLink 
          to="/playcall-desk" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0'
          }}
          title={!isExpanded ? "Playcall Desk" : undefined}
        >
          <Sliders size={20} />
          {isExpanded && <span>Playcall Desk</span>}
        </NavLink>

        {/* Umpire Node Trigger */}
        <button
          onClick={() => {
            setUmpireOpen(true);
            if (onClose) onClose();
          }}
          className="nav-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0.75rem 1.5rem' : '0.75rem 0',
            gap: isExpanded ? '1rem' : '0',
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'rgba(255, 255, 255, 0.65)',
            boxSizing: 'border-box'
          }}
          title={!isExpanded ? "Jake Taylor Umpire Node" : undefined}
        >
          <Shield size={20} color="#3B82F6" />
          {isExpanded && <span>Umpire Node</span>}
        </button>
      </div>
      
      <div className="sidebar-footer" style={{ 
        marginTop: 'auto', 
        padding: isExpanded ? '1.5rem' : '1rem 0.5rem', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isExpanded ? 'flex-start' : 'center',
        gap: '0.5rem',
        overflow: 'hidden'
      }}>
        {isExpanded ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FFCC', boxShadow: '0 0 8px #00FFCC' }} />
              <span>Secure Tailscale Mesh</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>v1.0.0-PROD</span>
          </>
        ) : (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FFCC', boxShadow: '0 0 8px #00FFCC' }} title="Secure Tailscale Mesh" />
        )}

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            boxSizing: 'border-box'
          }}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
