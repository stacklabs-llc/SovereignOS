// SpideyMetOverlay.tsx
import React from 'react';
import './SpideyMet.css';

interface SpideyMetProps {
  triggerEvent: boolean;
  onAnimationComplete: () => void;
}

export const SpideyMetOverlay: React.FC<SpideyMetProps> = ({ triggerEvent, onAnimationComplete }) => {
  if (!triggerEvent) return null;

  return (
    <div className="spidey-canvas-overlay">
      <div className="swinging-met-container" onAnimationEnd={onAnimationComplete}>
        {/* The SVG code or file reference goes right here */}
        <svg viewBox="0 0 100 100" className="mr-met-spidey-svg">
          {/* Web Line */}
          <line x1="50" y1="0" x2="50" y2="50" stroke="#fff" strokeWidth="1" strokeDasharray="2,2" />
          {/* Big Baseball Head */}
          <circle cx="50" cy="55" r="15" fill="#fff" stroke="#002D72" strokeWidth="2" />
          <path d="M 38 50 Q 50 62 62 50" stroke="#FF5910" strokeWidth="1.5" fill="none" /> {/* Seam 1 */}
          <path d="M 38 60 Q 50 48 62 60" stroke="#FF5910" strokeWidth="1.5" fill="none" /> {/* Seam 2 */}
          {/* Spidey Mask Eyes on the Baseball */}
          <path d="M 42 52 Q 45 47 48 52 Z" fill="#000" />
          <path d="M 58 52 Q 55 47 52 52 Z" fill="#000" />
          {/* Blue & Orange Spidey Suit Body */}
          <path d="M 45 70 L 40 85 L 50 80 L 60 85 L 55 70 Z" fill="#002D72" />
          <path d="M 47 70 L 50 78 L 53 70 Z" fill="#FF5910" />
        </svg>
      </div>
    </div>
  );
};