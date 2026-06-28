import { useState, useEffect } from 'react';

interface CitiFieldVectorProps {
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  isStrikeout?: boolean;
  isError?: boolean;
  lastPlayEvent?: string;
  triggerStrikeout?: () => void;
  triggerError?: () => void;
  homeTeam?: string;
}

export default function CitiFieldVector({
  onFirst = false,
  onSecond = false,
  onThird = false,
  isStrikeout = false,
  isError = false,
  lastPlayEvent = '',
  homeTeam = 'NYM'
}: CitiFieldVectorProps) {
  const [zoomMode, setZoomMode] = useState<'field' | 'infield'>('field');
  const [showK, setShowK] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const isOraclePark = homeTeam?.toUpperCase() === 'SF' || homeTeam?.toUpperCase() === 'SFG';
  
  const stadiumName = isOraclePark ? "ORACLE PARK" : "CITI FIELD";
  const stadiumLoc = isOraclePark ? "SAN FRANCISCO, CA" : "FLUSHING, NY";
  const stadiumColor = isOraclePark ? "#F59E0B" : "#FD5A1E";

  const wallPath = isOraclePark 
    ? "M 50,250 C 70,210 115,165 175,115 C 215,95 240,90 280,85 C 330,90 365,70 385,130 C 400,170 410,210 420,275"
    : "M 50,250 L 75,210 L 115,160 L 175,100 L 250,75 L 325,100 L 385,160 L 425,210 L 450,250";

  const rightFoulX = isOraclePark ? 420 : 450;
  const rightFoulY = isOraclePark ? 275 : 250;

  // Trigger overlays based on prop changes
  useEffect(() => {
    if (isStrikeout || lastPlayEvent?.toLowerCase().includes('strikeout') || lastPlayEvent?.toLowerCase().includes('struck out')) {
      setShowK(true);
      const timer = setTimeout(() => setShowK(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isStrikeout, lastPlayEvent]);

  useEffect(() => {
    if (isError || lastPlayEvent?.toLowerCase().includes('error')) {
      setShowErrorAlert(true);
      const timer = setTimeout(() => setShowErrorAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isError, lastPlayEvent]);

  // ViewBox settings for zoom
  // 'field': 0 0 500 500 (full stadium view)
  // 'infield': 120 220 260 260 (zoomed infield view)
  const viewBox = zoomMode === 'field' ? '0 0 500 500' : '120 220 260 260';

  return (
    <div 
      className={`citi-field-vector-container ${showErrorAlert ? 'error-active' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, #0F172A 0%, #020617 100%)',
        border: showErrorAlert ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'border 0.3s ease',
        boxShadow: showErrorAlert ? '0 0 20px rgba(239, 68, 68, 0.25)' : 'none'
      }}
    >
      {/* Zoom / Viewport Controls */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10,
        display: 'flex',
        gap: '6px'
      }}>
        <button
          onClick={() => setZoomMode('field')}
          style={{
            padding: '4px 10px',
            background: zoomMode === 'field' ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid',
            borderColor: zoomMode === 'field' ? '#00FFCC' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: zoomMode === 'field' ? '#00FFCC' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}
        >
          Full Field
        </button>
        <button
          onClick={() => setZoomMode('infield')}
          style={{
            padding: '4px 10px',
            background: zoomMode === 'infield' ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid',
            borderColor: zoomMode === 'infield' ? '#00FFCC' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: zoomMode === 'infield' ? '#00FFCC' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}
        >
          Infield Cam
        </button>
      </div>

      {/* Stadium Label */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10,
        textAlign: 'right',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: stadiumColor, fontFamily: 'monospace' }}>{stadiumName}</div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>{stadiumLoc}</div>
      </div>

      {/* SVG Ballpark Representation */}
      <svg 
        viewBox={viewBox} 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        <defs>
          <radialGradient id="grassGrad" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#0B2B1B" />
            <stop offset="60%" stopColor="#06180F" />
            <stop offset="100%" stopColor="#020805" stopOpacity="0.8" />
          </radialGradient>
          <filter id="neonGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neonGlowOrange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Outfield Grass Surface */}
        <path 
          d="M 250,450 L 50,250 C 70,120 160,50 250,50 C 340,50 430,120 450,250 Z" 
          fill="url(#grassGrad)"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* 2. Infield Dirt Arc */}
        <path 
          d="M 130,330 C 150,230 350,230 370,330 L 250,450 Z" 
          fill="#1E1610" 
          stroke="#2E1C12" 
          strokeWidth="1.5" 
        />
        
        {/* Infield Grass Island */}
        <path 
          d="M 250,430 L 160,340 C 180,310 320,310 340,340 Z" 
          fill="#0B2B1B" 
          stroke="#0F3D26" 
          strokeWidth="1" 
        />

        {/* 3. Warning Track (concentric outfield border) */}
        <path 
          d="M 50,250 C 70,120 160,50 250,50 C 340,50 430,120 450,250 C 455,255 435,115 250,45 C 65,115 45,255 50,250 Z"
          fill="#2D1E18"
          opacity="0.8"
        />

        {/* 4. Asymmetric Outfield Walls (Citi Field Specific / Oracle Park) */}
        {/* Left Field Line (335 ft) -> Left-Center (Great Wall of Flushing, 385 ft) -> Center Field (408 ft) -> Right-Center (370 ft) -> Right Field (330 ft) */}
        <path 
          d={wallPath} 
          fill="none" 
          stroke={isOraclePark ? "#F59E0B" : "#0A84FF"} 
          strokeWidth="3.5" 
          filter="url(#neonGlowCyan)"
          strokeLinecap="round"
        />

        {/* 5. Foul Lines */}
        <line x1="250" y1="450" x2="50" y2="250" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1="250" y1="450" x2={rightFoulX} y2={rightFoulY} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" />

        {/* 6. Pitcher's Mound & Rubber */}
        <circle cx="250" cy="335" r="12" fill="#2E1C12" />
        <ellipse cx="250" cy="335" rx="8" ry="6" fill="#1A110B" />
        <line x1="246" y1="335" x2="254" y2="335" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* 7. Home Plate & Batter's Boxes */}
        <path d="M 250,450 L 245,443 L 245,438 L 255,438 L 255,443 Z" fill="#FFFFFF" stroke="#000" strokeWidth="0.5" />
        {/* Left Batter Box */}
        <rect x="236" y="435" width="6" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
        {/* Right Batter Box */}
        <rect x="258" y="435" width="6" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />

        {/* 8. Bases Path Lines */}
        <line x1="250" y1="440" x2="340" y2="350" stroke="#475569" strokeWidth="1" /> {/* Home to 1st */}
        <line x1="340" y1="350" x2="250" y2="260" stroke="#475569" strokeWidth="1" /> {/* 1st to 2nd */}
        <line x1="250" y1="260" x2="160" y2="350" stroke="#475569" strokeWidth="1" /> {/* 2nd to 3rd */}
        <line x1="160" y1="350" x2="250" y2="440" stroke="#475569" strokeWidth="1" /> {/* 3rd to Home */}

        {/* 9. Bases (Interactive & Dynamic Seating) */}
        {/* First Base */}
        <g transform="translate(340, 350) rotate(45)">
          <rect 
            x="-6" 
            y="-6" 
            width="12" 
            height="12" 
            fill={onFirst ? '#FD5A1E' : '#FFFFFF'} 
            stroke={onFirst ? '#FD5A1E' : '#94A3B8'} 
            strokeWidth={onFirst ? '2.5' : '1'}
            filter={onFirst ? 'url(#neonGlowOrange)' : ''}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* Second Base */}
        <g transform="translate(250, 260) rotate(45)">
          <rect 
            x="-6" 
            y="-6" 
            width="12" 
            height="12" 
            fill={onSecond ? '#FD5A1E' : '#FFFFFF'} 
            stroke={onSecond ? '#FD5A1E' : '#94A3B8'} 
            strokeWidth={onSecond ? '2.5' : '1'}
            filter={onSecond ? 'url(#neonGlowOrange)' : ''}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* Third Base */}
        <g transform="translate(160, 350) rotate(45)">
          <rect 
            x="-6" 
            y="-6" 
            width="12" 
            height="12" 
            fill={onThird ? '#FD5A1E' : '#FFFFFF'} 
            stroke={onThird ? '#FD5A1E' : '#94A3B8'} 
            strokeWidth={onThird ? '2.5' : '1'}
            filter={onThird ? 'url(#neonGlowOrange)' : ''}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* 10. High-Fidelity Stadium Specific Details */}
        {isOraclePark ? (
          /* Oracle Park Glove & Bottle in Left-Center Field */
          <g transform="translate(125, 140)" style={{ cursor: 'pointer' }}>
            {/* Giant Glove */}
            <path d="M -12,0 C -18,-8 -8,-16 -4,-12 C -2,-16 4,-16 4,-10 C 8,-16 12,-8 8,0 Z" fill="#8B4513" stroke="#5C2E0B" strokeWidth="1" />
            <circle cx="-1" cy="-6" r="2.5" fill="#D2691E" />
            {/* Coca-Cola Bottle */}
            <path d="M 6,4 L 6,-8 C 6,-10 8,-12 8,-14 L 8,-18 L 10,-18 L 10,-14 C 10,-12 12,-10 12,-8 L 12,4 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
            <rect x="7" y="-20" width="2" height="2" fill="#FFFFFF" />
            <text x="3" y="10" fill="#F59E0B" fontSize="4.5" fontWeight="bold" fontFamily="monospace">SPLASH HIT</text>
          </g>
        ) : (
          /* Shea Home Run Apple in Center-Right Field */
          <g transform="translate(330, 85)" style={{ cursor: 'pointer' }}>
            {/* Stem & Leaf */}
            <path d="M 0,-8 Q 3,-12 8,-9" stroke="#10B981" strokeWidth="2.5" fill="none" />
            {/* Apple Body */}
            <circle cx="0" cy="0" r="10" fill="#EF4444" />
            <path d="M -6,-3 Q 0,-1 6,-3" stroke="#DC2626" strokeWidth="1.5" fill="none" />
            <rect x="-8" y="-14" width="16" height="5" rx="2" fill="#F59E0B" />
            <text x="0" y="-10" fill="#000" fontSize="3" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HOME RUN</text>
          </g>
        )}

        {isOraclePark && (
          <g>
            {/* McCovey Cove Water */}
            <path 
              d="M 420,275 C 440,285 460,265 480,275 L 500,275 L 500,320 L 400,320 Z" 
              fill="rgba(14, 116, 144, 0.4)" 
              stroke="rgba(6, 182, 212, 0.6)" 
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
            <text x="470" y="300" fill="rgba(6, 182, 212, 0.8)" fontSize="4.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">COVE</text>
          </g>
        )}

        {/* Neon "K" Strikeout Overlay */}
        {showK && (
          <g transform="translate(250, 290)" className="strikeout-k-glow" style={{ animation: 'bounceK 0.6s infinite alternate' }}>
            <circle cx="0" cy="0" r="28" fill="rgba(15, 23, 42, 0.95)" stroke="#00FFCC" strokeWidth="3" filter="url(#neonGlowCyan)" />
            <text 
              x="0" 
              y="11" 
              fill="#00FFCC" 
              fontSize="38" 
              fontWeight="900" 
              textAnchor="middle" 
              fontFamily="'Outfit', 'Impact', 'Arial Black', sans-serif"
              filter="url(#neonGlowCyan)"
            >
              K
            </text>
          </g>
        )}
      </svg>

      {/* Shaking Mustache Error Overlay (Bottom Left Margin) */}
      {showErrorAlert && (
        <div 
          className="shaking-mustache-overlay"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#EF4444',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            animation: 'shakeMustache 0.2s infinite',
            zIndex: 100
          }}
        >
          <span style={{ fontSize: '1.25rem', transform: 'rotate(90deg)', display: 'inline-block' }}>👨🏻‍🦰</span>
          <div>
            <div>🚨 ERROR DETECTED!</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)' }}>Fundies Breakdown</div>
          </div>
        </div>
      )}

      {/* Inline styles for custom vector animations */}
      <style>{`
        @keyframes bounceK {
          from { transform: translate(250px, 290px) scale(0.9); }
          to { transform: translate(250px, 290px) scale(1.1); }
        }
        @keyframes shakeMustache {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .error-active {
          animation: redSirenFlash 0.5s infinite alternate;
        }
        @keyframes redSirenFlash {
          from { box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.2); }
          to { box-shadow: inset 0 0 45px rgba(239, 68, 68, 0.5); }
        }
      `}</style>
    </div>
  );
}
