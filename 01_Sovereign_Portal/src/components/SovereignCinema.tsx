import React from 'react';

export default function SovereignCinema() {
  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden relative rounded-xl border border-white/10 shadow-2xl">
      <iframe 
        src="/cinema-portal/" 
        className="absolute inset-0 w-full h-full border-0 bg-black"
        title="Sovereign Cinema"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
