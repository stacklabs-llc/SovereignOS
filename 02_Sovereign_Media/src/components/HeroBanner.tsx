import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
  onPlay?: () => void;
  title?: string;
  overview?: string;
  imageUrl?: string;
}

export default function HeroBanner({ onPlay, title = "THE BOYS", overview = "Superheroes are often as popular as celebrities...", imageUrl = "/01_Assets/Images/poster_1.png" }: HeroBannerProps) {
  return (
    <div className="relative h-[55vh] w-full shrink-0 rounded-2xl overflow-hidden">
      {/* Background Image / Video Mock */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradient overlays for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-vm-bg via-vm-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-vm-bg via-vm-bg/60 to-transparent w-2/3" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pt-24 px-6 md:px-12 pb-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 mix-blend-screen">
          <span className="text-[#38bdf8] font-extrabold tracking-widest md:tracking-[0.4em] text-lg md:text-2xl drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">S O V E R E I G N</span>
          <span className="text-lg md:text-2xl font-semibold tracking-widest md:tracking-[0.4em] text-white/80">O R I G I N A L</span>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black mb-2 md:mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] tracking-tight line-clamp-3 md:line-clamp-2" style={{ filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.2))' }}>
          {title}
        </h2>
        
        <p className="text-lg md:text-2xl text-white/90 mb-6 md:mb-10 max-w-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-3 leading-relaxed font-medium">
          {overview}
        </p>

        <div className="flex flex-wrap gap-4 md:gap-6">
          <button 
            onClick={onPlay}
            className="flex items-center justify-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-xl text-lg md:text-xl font-extrabold hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            <Play fill="currentColor" className="w-5 h-5 md:w-6 md:h-6" />
            Play
          </button>
          <button className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 md:px-6 py-2 rounded-xl text-base md:text-lg font-bold hover:bg-white/20 hover:scale-105 active:scale-95 transition-all backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Info className="w-5 h-5 md:w-6 md:h-6" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}
