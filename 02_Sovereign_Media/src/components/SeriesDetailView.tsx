import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface SeriesDetailViewProps {
  series: any;
  onPlayVideo: (videoUrl: string) => void;
}

export default function SeriesDetailView({ series, onPlayVideo }: SeriesDetailViewProps) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  
  const epsRowRef = useRef<HTMLDivElement>(null);
  const seasonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/sonarr/api/v3/episode?seriesId=${series.id}&apikey=3a86bddfeefa4c93b104f33a534ffb72`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setEpisodes(data);
          const uniqueSeasons = Array.from(new Set(data.map((ep: any) => ep.seasonNumber))).sort((a: any, b: any) => a - b);
          setSeasons(uniqueSeasons as number[]);
          // Default to first season that has files, or latest
          const firstSeasonWithFile = uniqueSeasons.find(s => data.some((ep: any) => ep.seasonNumber === s && ep.hasFile));
          const targetIndex = firstSeasonWithFile !== undefined ? uniqueSeasons.findIndex(s => s === firstSeasonWithFile) : Math.max(0, uniqueSeasons.length - 1);
          setActiveSeasonIndex(targetIndex);
        }
      });
  }, [series.id]);

  // Native keyboard navigation — physical arrows + remote xdotool keys both work
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveSeasonIndex(s => Math.max(0, s - 1)); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveSeasonIndex(s => Math.min(seasons.length - 1, s + 1)); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setActiveEpisodeIndex(e => Math.max(0, e - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault();
        const maxEps = episodes.filter(ep => ep.seasonNumber === seasons[activeSeasonIndex]).length;
        setActiveEpisodeIndex(e => Math.min(maxEps - 1, e + 1));
      }
      if (e.key === 'Enter') setSelectTrigger(t => t + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [seasons, activeSeasonIndex, episodes]);



  const [selectTrigger, setSelectTrigger] = useState(0);
  useEffect(() => {
    if (selectTrigger > 0) {
      const activeSeason = seasons[activeSeasonIndex];
      const epsInSeason = episodes.filter(e => e.seasonNumber === activeSeason);
      const activeEp = epsInSeason[activeEpisodeIndex];
      if (activeEp && activeEp.hasFile) {
        const playPath = (epFile: any) => {
          // Rewrite path from /media_vault to /stream, handling potential absolute paths
          const rawPath = epFile.path || '';
          let path = rawPath;
          if (rawPath.includes('/media_vault/')) {
            path = '/stream/' + rawPath.split('/media_vault/')[1];
          } else if (rawPath.startsWith('/media_vault/')) {
            path = rawPath.replace(/^\/media_vault/, '/stream');
          }
          onPlayVideo(path);
        };

        if (activeEp.episodeFile) {
          playPath(activeEp.episodeFile);
        } else if (activeEp.episodeFileId) {
          fetch(`/sonarr/api/v3/episodefile/${activeEp.episodeFileId}?apikey=3a86bddfeefa4c93b104f33a534ffb72`)
            .then(res => res.json())
            .then(data => {
              if (data && data.path) playPath(data);
            });
        }
      }
    }
  }, [selectTrigger, activeSeasonIndex, activeEpisodeIndex, seasons, episodes]);

  useEffect(() => {
    setActiveEpisodeIndex(0);
  }, [activeSeasonIndex]);

  // Scroll active episode into view
  useEffect(() => {
    if (epsRowRef.current) {
      const container = epsRowRef.current;
      const childArray = Array.from(container.children) as HTMLElement[];
      const activeElement = childArray[activeEpisodeIndex];
      if (activeElement) {
        const scrollLeft = activeElement.offsetLeft - container.clientWidth / 2 + activeElement.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeEpisodeIndex]);

  const activeSeason = seasons[activeSeasonIndex];
  const epsInSeason = episodes.filter(e => e.seasonNumber === activeSeason);

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col pt-32 pb-16">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" 
        style={{ backgroundImage: `url(${series.bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-12">
        
        {/* Header */}
        <div className="mb-6 md:mb-12 max-w-4xl pt-4 md:pt-0">
          <h1 className="text-6xl md:text-8xl font-bold tracking-wider text-white drop-shadow-xl mb-2 md:mb-4">{series.title}</h1>
          <p className="text-2xl md:text-3xl text-gray-300 line-clamp-3 md:line-clamp-3 leading-relaxed drop-shadow">{series.overview}</p>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-6 md:gap-12">
          
          {/* Seasons (Horizontal on Mobile, Vertical on Desktop) */}
          <div ref={seasonsRef} className="w-full md:w-1/4 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto hide-scrollbar pb-2 md:pb-32 shrink-0">
            {seasons.map((seasonNum, index) => {
              const isActive = index === activeSeasonIndex;
              return (
                <div 
                  key={seasonNum}
                  onClick={() => setActiveSeasonIndex(index)}
                  className={`px-4 md:px-6 py-2 md:py-4 rounded-xl cursor-pointer transition-all duration-300 font-bold text-3xl md:text-5xl shrink-0 ${isActive ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10'}`}
                >
                  Season {seasonNum}
                </div>
              );
            })}
          </div>

          {/* Episodes (Horizontal) */}
          <div className="flex-1 overflow-hidden">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-2 md:mb-6">Season {activeSeason} Episodes</h2>
            
            <div ref={epsRowRef} className="flex gap-6 overflow-x-auto hide-scrollbar pb-16 pt-4 px-4 -mx-4 snap-x">
              {epsInSeason.map((ep, index) => {
                const isActive = index === activeEpisodeIndex;
                return (
                  <motion.div
                    key={ep.id}
                    onClick={() => {
                      setActiveEpisodeIndex(index);
                      setSelectTrigger(t => t + 1);
                    }}
                    className={`relative flex-none w-[400px] md:w-[500px] cursor-pointer rounded-2xl overflow-hidden snap-start transition-all duration-500 bg-[#111] border ${isActive ? 'border-white ring-2 md:ring-4 ring-white/50 scale-[1.02] md:scale-[1.05] shadow-[0_0_20px_rgba(255,255,255,0.3)] z-20' : 'border-white/10 opacity-60 scale-95 hover:opacity-80'}`}
                  >
                    <div className="aspect-video bg-[#0a0a0a] relative">
                      {series.bgImage && (
                        <img src={series.bgImage} className="w-full h-full object-cover opacity-50" />
                      )}
                      {!ep.hasFile && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                           <span className="text-red-400 font-bold tracking-widest text-sm uppercase">File Missing</span>
                         </div>
                      )}
                      {ep.hasFile && isActive && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                            <div className="w-0 h-0 border-t-8 border-b-8 border-l-[14px] border-transparent border-l-white ml-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-5 flex flex-col gap-1 md:gap-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-4xl md:text-5xl font-bold text-white/50">{ep.episodeNumber}</span>
                        <h3 className="text-3xl md:text-4xl font-bold text-white line-clamp-1">{ep.title}</h3>
                      </div>
                      <p className="text-xl md:text-3xl text-gray-400 line-clamp-3 leading-snug">{ep.overview || "No description available."}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
