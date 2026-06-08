import React from 'react';

interface BaseballDiamondProps {
  offense?: {
    first?: boolean;
    second?: boolean;
    third?: boolean;
  }
}

export default function BaseballDiamond({ offense }: BaseballDiamondProps) {
  const isFirst = !!offense?.first;
  const isSecond = !!offense?.second;
  const isThird = !!offense?.third;

  const activeColor = '#FF5910'; // Mets Glow-Orange
  const inactiveFill = 'rgba(10, 15, 30, 0.8)';
  const inactiveStroke = 'rgba(255, 255, 255, 0.3)';

  return (
    <div className="flex items-center justify-center w-full h-full max-w-[120px] max-h-[120px] mx-auto">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_10px_rgba(255,89,16,0.15)]"
        id="vesper-diamond-svg"
      >
        {/* Diamond Outline */}
        <path
          d="M50 15 L85 50 L50 85 L15 50 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
        />
        {/* Baseline paths */}
        <line x1="50" y1="85" x2="15" y2="50" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <line x1="50" y1="85" x2="85" y2="50" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <line x1="15" y1="50" x2="50" y2="15" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <line x1="85" y1="50" x2="50" y2="15" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />

        {/* Mound */}
        <circle cx="50" cy="50" r="3.5" fill="rgba(255, 255, 255, 0.4)" />

        {/* Second Base */}
        <rect
          id="base-2"
          x="42"
          y="7"
          width="16"
          height="16"
          transform="rotate(45 50 15)"
          fill={isSecond ? activeColor : inactiveFill}
          stroke={isSecond ? activeColor : inactiveStroke}
          strokeWidth="2"
          className="transition-all duration-300 ease-in-out"
          style={{
            filter: isSecond ? 'drop-shadow(0 0 4px #FF5910)' : 'none'
          }}
        />

        {/* Third Base */}
        <rect
          id="base-3"
          x="7"
          y="42"
          width="16"
          height="16"
          transform="rotate(45 15 50)"
          fill={isThird ? activeColor : inactiveFill}
          stroke={isThird ? activeColor : inactiveStroke}
          strokeWidth="2"
          className="transition-all duration-300 ease-in-out"
          style={{
            filter: isThird ? 'drop-shadow(0 0 4px #FF5910)' : 'none'
          }}
        />

        {/* First Base */}
        <rect
          id="base-1"
          x="77"
          y="42"
          width="16"
          height="16"
          transform="rotate(45 85 50)"
          fill={isFirst ? activeColor : inactiveFill}
          stroke={isFirst ? activeColor : inactiveStroke}
          strokeWidth="2"
          className="transition-all duration-300 ease-in-out"
          style={{
            filter: isFirst ? 'drop-shadow(0 0 4px #FF5910)' : 'none'
          }}
        />

        {/* Home Plate */}
        <path
          d="M44 85 L56 85 L50 92 Z"
          fill="rgba(255, 255, 255, 0.7)"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

