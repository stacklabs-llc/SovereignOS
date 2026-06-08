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
  
  return (
    <div className="relative w-24 h-24 transform rotate-45 scale-75 origin-center">
      {/* Second Base */}
      <div className={`absolute top-0 left-0 w-8 h-8 border-2 border-white/20 flex items-center justify-center transition-colors ${isSecond ? 'bg-[#38bdf8] border-[#38bdf8] ' : 'bg-black/50'}`}></div>
      {/* Third Base */}
      <div className={`absolute bottom-0 left-0 w-8 h-8 border-2 border-white/20 flex items-center justify-center transition-colors ${isThird ? 'bg-[#38bdf8] border-[#38bdf8] ' : 'bg-black/50'}`}></div>
      {/* First Base */}
      <div className={`absolute top-0 right-0 w-8 h-8 border-2 border-white/20 flex items-center justify-center transition-colors ${isFirst ? 'bg-[#38bdf8] border-[#38bdf8] ' : 'bg-black/50'}`}></div>
      {/* Home Plate */}
      <div className="absolute bottom-0 right-0 w-8 h-8 border-2 border-[#38bdf8]/50 bg-[#38bdf8]/20 flex items-center justify-center"></div>
      
      {/* Dirt path lines */}
      <div className="absolute top-4 left-8 right-8 h-0 border-t-2 border-dashed border-white/10"></div>
      <div className="absolute bottom-4 left-8 right-8 h-0 border-t-2 border-dashed border-white/10"></div>
      <div className="absolute left-4 top-8 bottom-8 w-0 border-l-2 border-dashed border-white/10"></div>
      <div className="absolute right-4 top-8 bottom-8 w-0 border-l-2 border-dashed border-white/10"></div>
    </div>
  );
}
