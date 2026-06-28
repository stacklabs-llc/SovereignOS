import { useState } from 'react';
import { HelpCircle, Mic, X, Shield } from 'lucide-react';

export default function VocalMatrix() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [umpireResponse, setUmpireResponse] = useState<string | null>(null);

  const handleTapToAsk = () => {
    setIsAsking(true);
    setUmpireResponse(null);
    
    // Simulate active rulebook query parsing
    setTimeout(() => {
      setIsAsking(false);
      const responses = [
        "DECISION: SAFE! The base-runner beat the tag at second by 0.04 seconds. M.A.R.D. telemetry confirmed.",
        "DECISION: OUT! High heat pitch caught the black corner. Strike three called. Underpants Bandito approved.",
        "DECISION: FOUL BALL! The ball landed 2 inches left of the left-field line. No Home Run.",
        "DECISION: NO PLAY! Time was called by the batter prior to the pitcher releasing the ball."
      ];
      const randomRes = responses[Math.floor(Math.random() * responses.length)];
      setUmpireResponse(randomRes);
    }, 2500);
  };

  return (
    <>
      {/* 1. Floating Umpire Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #1E3A8A 0%, #0D1B2A 100%)',
          border: '2px solid #3B82F6',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 10px rgba(0, 0, 0, 0.5)',
          color: '#3B82F6',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          animation: 'floatButton 3s ease-in-out infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.borderColor = '#00FFCC';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = '#3B82F6';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        }}
      >
        <Shield size={26} style={{ animation: 'spinPulse 4s linear infinite' }} />
      </button>

      {/* 2. Slide-over Glassmorphic Umpire Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 10000
            }}
          />

          {/* Drawer Container */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100%',
              width: '400px',
              background: 'rgba(9, 15, 30, 0.92)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              zIndex: 10001,
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem 1.5rem',
              boxSizing: 'border-box',
              color: '#FFF',
              fontFamily: "'Outfit', sans-serif",
              animation: 'slideIn 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#00FFCC" />
                <span style={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem', color: '#00FFCC' }}>
                  Jake Taylor Node
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              
              {/* Deep Blue Umpire Halo Ring */}
              <div
                style={{
                  position: 'relative',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: '#090E1A',
                  border: '4px solid #1E3B8B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 35px rgba(30, 59, 139, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.8)',
                  marginBottom: '2rem'
                }}
              >
                {/* Outer halo animations */}
                <div style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  border: '2px dashed rgba(59, 130, 246, 0.4)',
                  animation: 'spinClockwise 12s linear infinite'
                }} />

                {isAsking && (
                  <div className="umpire-ping" style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    border: '4px solid #00FFCC',
                    animation: 'pingGlow 1.5s infinite ease-in-out'
                  }} />
                )}

                <HelpCircle size={48} color={isAsking ? '#00FFCC' : '#1E3B8B'} style={{ transition: 'color 0.3s' }} />
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                Jake Taylor Umpire Node
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.5', maxWidth: '280px', margin: '0 auto 2rem auto' }}>
                FanStack Umpire — Awaiting Rulebook Ingestion Request
              </p>

              {/* Ingestion Response Display */}
              {umpireResponse && (
                <div 
                  style={{
                    background: 'rgba(0, 255, 204, 0.05)',
                    border: '1px solid rgba(0, 255, 204, 0.15)',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    color: '#00FFCC',
                    fontFamily: 'monospace',
                    marginBottom: '2rem',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: '0 4px 15px rgba(0, 255, 204, 0.05)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.7 }}>
                    Umpire Ruling:
                  </div>
                  {umpireResponse}
                </div>
              )}

              {/* Primary Action Button: Tap to Ask */}
              <button
                onClick={handleTapToAsk}
                disabled={isAsking}
                style={{
                  padding: '14px 28px',
                  background: isAsking ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
                  color: isAsking ? 'rgba(255,255,255,0.4)' : '#FFF',
                  border: isAsking ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  cursor: isAsking ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: isAsking ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isAsking) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAsking) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  }
                }}
              >
                {isAsking ? (
                  <>
                    <span className="animate-ping text-cyan-400" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00FFCC', marginRight: '6px' }} />
                    PARSING RULEBOOK...
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    Tap to Ask Umpire
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
              M.A.R.D. RULEBOOK MATRIX // DECISION LOG: ACTIVE
            </div>
          </div>
        </>
      )}

      {/* Styles for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatButton {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spinPulse {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pingGlow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}} />
    </>
  );
}
