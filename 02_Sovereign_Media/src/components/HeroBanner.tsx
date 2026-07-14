import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
  onPlay?: () => void;
  title?: string;
  overview?: string;
  imageUrl?: string;
}

export function parseMediaTitle(rawTitle: string): string {
  if (!rawTitle) return rawTitle;
  
  // Match SxxExx or sxxexx patterns (case-insensitive)
  const seMatch = rawTitle.match(/^(.*?)[. ]+s?(\d+)e(\d+)(.*)$/i);
  if (seMatch) {
    let showName = seMatch[1].replace(/[._]/g, ' ').trim();
    const season = parseInt(seMatch[2], 10);
    const episode = parseInt(seMatch[3], 10);
    return `${showName} - Season ${season}, Episode ${episode}`;
  }
  
  // If no SxxExx pattern, strip common tags
  let cleaned = rawTitle;
  // Strip resolution flags: 1080p, 2160p, 720p, 4K
  cleaned = cleaned.replace(/\b(1080p|2160p|720p|4[kK])\b/gi, '');
  // Strip codec and source flags: WEB-DL, H264, x265, HEVC, MULTI, WEB
  cleaned = cleaned.replace(/\b(WEB-DL|H\.?264|x\.?265|HEVC|MULTI|WEB)\b/gi, '');
  // Strip release group suffixes
  cleaned = cleaned.replace(/-[a-zA-Z0-9]+$/g, '');
  // Clean up dots, underscores, double spaces, and leading/trailing dashes/spaces
  cleaned = cleaned.replace(/[._]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[- ]+|[- ]+$/g, '');
  
  return cleaned || rawTitle;
}

export default function HeroBanner({ onPlay, title = "THE BOYS", overview = "Superheroes are often as popular as celebrities...", imageUrl = "/01_Assets/Images/poster_1.png" }: HeroBannerProps) {
  const parsedTitle = parseMediaTitle(title);
  
  return (
    <div className="relative h-[38vh] min-h-[280px] w-full shrink-0 rounded-2xl overflow-hidden">
      {/* Background Image / Video Mock */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={imageUrl} 
          alt={parsedTitle}
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradient overlays for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-vm-bg via-vm-bg/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-vm-bg via-vm-bg/60 to-transparent w-2/3" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pt-20 px-6 md:px-12 pb-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 mb-2 mix-blend-screen">
          <span className="text-[#38bdf8] font-extrabold tracking-widest md:tracking-[0.4em] text-xs md:text-sm drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">S O V E R E I G N</span>
          <span className="text-xs md:text-sm font-semibold tracking-widest md:tracking-[0.4em] text-white/80">O R I G I N A L</span>
        </div>
        
        <h2 className="text-2xl md:text-4xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] tracking-tight line-clamp-2" style={{ filter: 'drop-shadow(0px 0px 20px rgba(255,255,255,0.2))' }}>
          {parsedTitle}
        </h2>
        
        <p className="text-xs md:text-sm text-white/90 mb-4 max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-2 leading-relaxed font-medium">
          {overview}
        </p>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={onPlay}
            className="flex items-center justify-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-lg text-xs md:text-sm font-extrabold hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            <Play fill="currentColor" className="w-4 h-4" />
            Play
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-white/20 hover:scale-105 active:scale-95 transition-all backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Info className="w-4 h-4" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}
