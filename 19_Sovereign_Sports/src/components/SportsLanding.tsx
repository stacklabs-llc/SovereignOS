import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Globe, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface SystemProperty {
  name: string;
  value: string;
  description: string;
}

export default function SportsLanding() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Record<string, string>>({
    'sports.landing.background': '/images/sports_landing_bg.png',
    'sports.landing.mlb.image': '/images/mlb_card.png',
    'sports.landing.pga.image': '/images/pga_card.png',
    'sports.landing.global.image': '/images/global_card.png',
    'sports.landing.mlb.title': 'FanStack MLB',
    'sports.landing.pga.title': 'FanStack PGA',
    'sports.landing.global.title': 'FootyStack',
    'sports.landing.mlb.description': 'Experience every pitch, every home run. Premium MLB content, stats, highlights, and live games.',
    'sports.landing.pga.description': 'Unlock the ultimate golf experience. Exclusive coverage, rankings, player stats, and major tournaments.',
    'sports.landing.global.description': 'Your pass to worldwide football. Live matches, insights, news, and the biggest leagues.'
  });

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await axios.get<SystemProperty[]>('/api/properties');
        const map: Record<string, string> = {};
        res.data.forEach(p => {
          if (p.name.startsWith('sports.landing.')) {
            map[p.name] = p.value;
          }
        });
        setProperties(prev => ({ ...prev, ...map }));
      } catch (err) {
        console.error('Failed to load landing page configs', err);
      }
    };
    fetchProps();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      color: '#fff',
      padding: '2.5rem',
      position: 'relative',
      backgroundImage: `radial-gradient(circle at center, rgba(10, 15, 30, 0.4) 0%, rgba(0, 0, 0, 0.95) 100%), url(${properties['sports.landing.background']})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      borderRadius: '24px',
      margin: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      transition: 'all 0.5s ease-in-out'
    }}>
      {/* Title & Subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', zIndex: 2 }}>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          margin: '0 0 1rem 0',
          background: 'linear-gradient(90deg, #A78BFA, #38BDF8, #F472B6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 40px rgba(139, 92, 246, 0.2)'
        }}>
          Unleash Your Fanaticism. Choose Your Stack!
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          Welcome to the ultimate decibel-breaking Sovereign Sports Hub. Step inside your arena and access real-time streams and live telemetry.
        </p>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        width: '100%',
        maxWidth: '1200px',
        zIndex: 2
      }}>
        {/* Card 1: MLB */}
        <div 
          className="vm-panel-glass clickable game-card"
          onClick={() => navigate('/mlb')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(56, 189, 248, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(${properties['sports.landing.mlb.image']}) no-repeat center/cover`
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)'
          }}>
            <Gamepad2 size={40} style={{ color: '#38BDF8' }} />
          </div>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#fff' }}>
            {properties['sports.landing.mlb.title']}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem', flexGrow: 1 }}>
            {properties['sports.landing.mlb.description']}
          </p>

          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, #38BDF8, #0A84FF)',
            border: 'none',
            color: '#fff',
            padding: '0.75rem 1.75rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <span>SELECT MLB</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Card 2: PGA */}
        <div 
          className="vm-panel-glass clickable game-card"
          onClick={() => navigate('/pga')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(${properties['sports.landing.pga.image']}) no-repeat center/cover`
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'
          }}>
            <Trophy size={40} style={{ color: '#10B981' }} />
          </div>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#fff' }}>
            {properties['sports.landing.pga.title']}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem', flexGrow: 1 }}>
            {properties['sports.landing.pga.description']}
          </p>

          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, #10B981, #059669)',
            border: 'none',
            color: '#fff',
            padding: '0.75rem 1.75rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <span>SELECT PGA</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Card 3: Footy / Global */}
        <div 
          className="vm-panel-glass clickable game-card"
          onClick={() => navigate('/footy')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid rgba(244, 114, 182, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(${properties['sports.landing.global.image']}) no-repeat center/cover`
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(244, 114, 182, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            border: '1px solid rgba(244, 114, 182, 0.3)',
            boxShadow: '0 0 30px rgba(244, 114, 182, 0.2)'
          }}>
            <Globe size={40} style={{ color: '#F472B6' }} />
          </div>
          
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#fff' }}>
            {properties['sports.landing.global.title']}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem', flexGrow: 1 }}>
            {properties['sports.landing.global.description']}
          </p>

          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, #F472B6, #D946EF)',
            border: 'none',
            color: '#fff',
            padding: '0.75rem 1.75rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            <span>SELECT FOOTY</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
