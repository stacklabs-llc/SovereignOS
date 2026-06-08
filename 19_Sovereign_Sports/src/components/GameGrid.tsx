import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Play } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  status: string;
  time: string;
  stream_available: boolean;
  scraper: string;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
}

export default function GameGrid() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get('/api/sports/mlb');
        setGames(response.data);
      } catch (err) {
        console.error('Failed to fetch MLB games', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '1rem', color: '#0A84FF' }}>
        <div className="loader" style={{ border: '3px solid rgba(10, 132, 255, 0.1)', borderTop: '3px solid #0A84FF', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
        <span>Loading live telemetry...</span>
      </div>
    );
  }

  return (
    <div className="games-grid">
      {games.map(game => (
        <div 
          key={game.id} 
          className="vm-panel-glass clickable game-card"
          onClick={() => navigate(`/stream/${game.id}`)}
          style={{ 
            position: 'relative',
            overflow: 'hidden',
            border: game.status === 'LIVE' ? '1px solid rgba(0, 255, 204, 0.25)' : '1px solid rgba(255,255,255,0.05)',
            boxShadow: game.status === 'LIVE' ? '0 8px 32px rgba(0, 255, 204, 0.08)' : 'none',
            background: game.status === 'LIVE' ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0, 255, 204, 0.01) 100%)' : 'rgba(255,255,255,0.02)'
          }}
        >
          {game.status === 'LIVE' && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '4px', 
              height: '100%', 
              backgroundColor: '#00FFCC', 
              boxShadow: '0 0 10px #00FFCC' 
            }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255, 255, 255, 0.4)', 
              fontWeight: 600, 
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>MLB Regular Season</span>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255, 255, 255, 0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}>
              via {game.scraper}
            </span>
          </div>

          <h3 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{game.title}</h3>

          {game.home_score !== undefined && game.home_score !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0', fontSize: '1.15rem', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{game.away_team}</span>
                <span style={{ color: '#fff' }}>{game.away_score}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#fff' }}>{game.home_score}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{game.home_team}</span>
              </div>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'rgba(255, 255, 255, 0.65)', 
            fontSize: '0.95rem',
            margin: '0.5rem 0 1.5rem 0'
          }}>
            <Calendar size={15} style={{ color: '#0A84FF' }} />
            {game.status === 'Final' ? (
              <span>Finished</span>
            ) : (
              <span>Today at <strong style={{ color: '#fff' }}>{game.time}</strong></span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
            {game.status === 'LIVE' ? (
              <span className="badge-live" style={{ backgroundColor: 'rgba(0, 255, 204, 0.1)', color: '#00FFCC', border: '1px solid #00FFCC', textShadow: '0 0 10px rgba(0, 255, 204, 0.3)', animation: 'pulse-live 2s infinite' }}>LIVE NOW</span>
            ) : game.status === 'Final' ? (
              <span className="badge-final" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>FINAL</span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>SCHEDULED</span>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0A84FF', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Tune In</span>
              <Play size={14} fill="#0A84FF" />
            </div>
          </div>
        </div>
      ))}
      {games.length === 0 && (
        <p>No active MLB games found.</p>
      )}
    </div>
  );
}
