import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaRibbonProps {
  title: string;
  fetchUrl?: string;
  onSelectVideo?: (videoUrl: string) => void;
  isActiveRow?: boolean;
  activeColIndex?: number;
  selectTriggerCount?: number;
  onFocusItem?: (item: any) => void;
}

const MOCK_ITEMS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  title: `Originals ${i + 1}`,
  image: `/01_Assets/Images/poster_${(i % 3) + 1}.png`,
  video_url: `/01_Assets/Video/Inbox/SOVEREIGN_FLOWMERCIAL_FINAL.mp4`
}));

export default function MediaRibbon({ title, fetchUrl, onSelectVideo, isActiveRow, activeColIndex, selectTriggerCount, onFocusItem }: MediaRibbonProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<any[]>(MOCK_ITEMS);

  useEffect(() => {
    const url = fetchUrl || '/sonarr/api/v3/series?apikey=3a86bddfeefa4c93b104f33a534ffb72';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
            // Check if the returned data is from Sonarr or from our theater_media_server /api/media endpoints
            if (data[0].images || data[0].tvdbId) {
                // Map Sonarr series to our format
                const mapped = data.map((series: any) => {
                  const poster = series.images?.find((img: any) => img.coverType === 'poster');
                  const banner = series.images?.find((img: any) => img.coverType === 'banner' || img.coverType === 'fanart');
                  const addKey = (url: string) => {
                    const apiStr = url.includes('?') ? `&apikey=3a86bddfeefa4c93b104f33a534ffb72` : `?apikey=3a86bddfeefa4c93b104f33a534ffb72`;
                    return url.replace('/sonarr/MediaCover', '/sonarr/api/v3/MediaCover') + apiStr;
                  };
                  return {
                    id: series.id,
                    title: series.title,
                    overview: series.overview,
                    image: poster ? addKey(poster.url) : `/01_Assets/Images/poster_1.png`,
                    bgImage: banner ? addKey(banner.url) : (poster ? addKey(poster.url) : `/01_Assets/Images/poster_1.png`),
                    video_url: `/01_Assets/Video/Inbox/SOVEREIGN_FLOWMERCIAL_FINAL.mp4`
                  };
                });
                setItems(mapped);
            } else {
                // Standard media server endpoint (has id, title, video_url, image)
                setItems(data);
            }
        } else {
            setItems([]);
        }
      })
      .catch(err => console.error("Failed to fetch media", err));
  }, [fetchUrl]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (selectTriggerCount && selectTriggerCount > 0 && isActiveRow) {
      const item = items[activeColIndex || 0];
      if (item && onSelectVideo) {
        onSelectVideo(item);
      }
    }
  }, [selectTriggerCount, isActiveRow, activeColIndex, items, onSelectVideo]);

  useEffect(() => {
    if (isActiveRow && onFocusItem) {
      const item = items[activeColIndex || 0];
      if (item) {
        onFocusItem(item);
      }
    }
    
    if (isActiveRow && rowRef.current) {
      const container = rowRef.current;
      const childArray = Array.from(container.children) as HTMLElement[];
      const activeElement = childArray[activeColIndex || 0];
      if (activeElement) {
        const scrollLeft = activeElement.offsetLeft - container.clientWidth / 2 + activeElement.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [isActiveRow, activeColIndex, items]);

  return (
    <div className="flex flex-col gap-2 group">
      <h3 className="text-5xl md:text-6xl font-semibold text-white/90 px-4 transition-colors group-hover:text-white">
        {title}
      </h3>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 bg-black/50 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:text-white text-white/50"
        >
          <ChevronLeft size={32} />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-4 pt-2 snap-x snap-mandatory"
        >
          {items.map((item, index) => {
            const isFocused = isActiveRow && activeColIndex === index;
            return (
              <motion.div
              key={item.id || index}
              onClick={() => {
                if (onSelectVideo) {
                  onSelectVideo(item);
                }
              }}
              onMouseEnter={() => {
                if (onFocusItem) onFocusItem(item);
              }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
              className={`relative flex-none w-[350px] aspect-[2/3] rounded-xl overflow-hidden bg-vm-panel cursor-pointer snap-start transition-all duration-500 ease-out ${isFocused ? 'ring-[4px] ring-white/80 scale-[1.2] z-30 shadow-[0_0_50px_rgba(255,255,255,0.3)] opacity-100 saturate-100' : 'ring-1 ring-white/5 opacity-50 saturate-50 hover:opacity-80'}`}
            >
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-6 transition-all duration-500 ${isFocused ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hover:opacity-100'}`}>
                <span className="text-white font-bold text-3xl md:text-4xl drop-shadow-md tracking-wide leading-tight">{item.title}</span>
              </div>
              {isFocused && (
                <div className="absolute inset-0 border border-white/20 rounded-xl mix-blend-overlay"></div>
              )}
            </motion.div>
            );
          })}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 bg-black/50 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 hover:text-white text-white/50"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}
