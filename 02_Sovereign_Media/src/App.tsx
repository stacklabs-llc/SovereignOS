import { useState, useEffect } from 'react'
import HeroBanner from './components/HeroBanner'
import MediaRibbon from './components/MediaRibbon'
import VideoPlayer from './components/VideoPlayer'
import SeriesDetailView from './components/SeriesDetailView'
import BarbStack from './components/BarbStack'
import { HoloLinkProvider } from './contexts/HoloLinkContext'
import HololinkHub from './components/HololinkHub'

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'shows' | 'search' | 'player' | 'series_view'>('home')
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
  const [activeMedia, setActiveMedia] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isBarb, setIsBarb] = useState<boolean>(false)

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie('sovereign_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch('/api/auth/me', { headers })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authenticated');
        })
        .then(data => {
          setUser(data);
          if (data.user_name === 'barb' || data.user_name === 'dbarb') {
            setIsBarb(true);
          }
        })
        .catch(err => {
          console.warn("Auth check failed, attempting Tailscale auto-login identification...", err);
          fetch('/api/public/identify')
            .then(res => {
              if (res.ok) return res.json();
              throw new Error('Tailscale identify check failed');
            })
            .then(idData => {
              if (idData.status === 'success' && idData.identified && idData.token) {
                document.cookie = `sovereign_session_token=${idData.token}; path=/; max-age=86400`;
                setUser({
                  user_name: idData.user_name,
                  display_name: idData.display_name,
                  role: idData.role,
                  modules: idData.modules
                });
                if (idData.user_name === 'barb' || idData.user_name === 'dbarb') {
                  setIsBarb(true);
                }
              }
            })
            .catch(identifyErr => {
              console.warn("Tailscale identification bypass not available:", identifyErr);
            });
        });
    };

    checkAuth();
  }, []);

  const handleSelectVideo = (videoUrl: string) => {
    setSelectedVideoUrl(videoUrl)
    setActiveTab('player')
  }

  const handleSelectSeries = (series: any) => {
    setActiveMedia(series)
    setActiveTab('series_view')
  }

  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [activeColIndex, setActiveColIndex] = useState(0);
  const [selectTriggerCount, setSelectTriggerCount] = useState(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${wsProto}//${window.location.host}/ws/theater`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'THEATER_COMMAND') {
            const params = new URLSearchParams(window.location.search);
            const room = params.get('room') || 'living_room';
            if (data.target && data.target !== room) return;
            
            if (data.command === 'home') {
              setActiveTab('home');
              setSelectedVideoUrl(null);
              return;
            }

            if (data.command === 'refresh') {
              window.location.reload();
              return;
            }
          }
        } catch (err) {}
      };
    } catch (e) {
      console.error("WebSocket connection failed or blocked:", e);
    }
    
    // Fallback: Physical keyboard listener (also enables xdotool support)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'home' || activeTab === 'movies' || activeTab === 'shows') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
          e.preventDefault();
        }
        if (e.key === 'ArrowUp') setActiveRowIndex(r => Math.max(0, r - 1));
        if (e.key === 'ArrowDown') setActiveRowIndex(r => Math.min(1, r + 1));
        if (e.key === 'ArrowLeft') setActiveColIndex(c => Math.max(0, c - 1));
        if (e.key === 'ArrowRight') setActiveColIndex(c => Math.min(20, c + 1));
        if (e.key === 'Enter') setSelectTriggerCount(t => t + 1);
      }
      if (e.key === 'Escape') {
        setActiveTab(prev => {
          if (prev === 'player' && activeMedia) return 'series_view';
          return 'home';
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (ws) ws.close();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

  useEffect(() => {
    setActiveColIndex(0);
  }, [activeRowIndex]);

  if (isBarb && user) {
    return (
      <HoloLinkProvider user={user}>
        <div className="w-screen md:h-screen bg-vm-bg text-vm-text font-sans overflow-y-auto md:overflow-hidden box-border p-[2vh_3vw] flex flex-col">
          <BarbStack user={user} />
          <HololinkHub user={user} />
        </div>
      </HoloLinkProvider>
    );
  }

  return (
    <HoloLinkProvider user={user}>
      <div className="w-screen h-screen bg-vm-bg text-vm-text font-sans overflow-hidden box-border p-[2vh_3vw]">
        <div className="relative w-full h-full flex flex-col">
        {/* Top Navigation */}
        <nav className="absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent px-4 md:px-8 py-4 md:py-6 flex flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex flex-row items-center gap-4 md:gap-8 w-auto">
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-vm-accent drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                SOVEREIGN MEDIA
              </h1>
              <span className="text-xs md:text-sm font-mono text-[#f2a900] tracking-widest mt-1 opacity-80 uppercase">▶ Now Playing on Clio</span>
            </div>
            <div className="flex gap-4 md:gap-8 text-xl md:text-2xl font-medium text-vm-text-muted overflow-x-auto w-full hide-scrollbar pb-1 md:pb-0">
              <button 
                onClick={() => setActiveTab('home')}
                className={`hover:text-white transition-colors ${activeTab === 'home' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveTab('movies')}
                className={`hover:text-white transition-colors ${activeTab === 'movies' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`}
              >
                Movies
              </button>
              <button 
                onClick={() => setActiveTab('shows')}
                className={`hover:text-white transition-colors ${activeTab === 'shows' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`}
              >
                TV Shows
              </button>
            </div>
          </div>
          <div className="absolute right-4 md:right-8 top-4 md:top-6">
            <button className="text-vm-text-muted hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </div>
        </nav>

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'player' ? (
            <VideoPlayer videoUrl={selectedVideoUrl || '/01_Assets/Video/Inbox/SOVEREIGN_FLOWMERCIAL_FINAL.mp4'} onBack={() => setActiveTab('series_view')} />
          ) : activeTab === 'series_view' && activeMedia ? (
            <SeriesDetailView series={activeMedia} onPlayVideo={handleSelectVideo} />
          ) : (
            <>
              <HeroBanner 
                onPlay={() => handleSelectVideo('/01_Assets/Video/Inbox/SOVEREIGN_FLOWMERCIAL_FINAL.mp4')} 
                title={activeMedia?.title}
                overview={activeMedia?.overview}
                imageUrl={activeMedia?.bgImage}
              />
              
              <div className="mt-4 relative z-10 px-4 md:px-8 flex flex-col gap-4 overflow-hidden flex-1">
                {activeTab === 'home' && (
                  <>
                    <MediaRibbon title="Recently Added Movies" fetchUrl="/api/media/movies" onSelectVideo={handleSelectSeries} isActiveRow={activeRowIndex === 0} activeColIndex={activeColIndex} selectTriggerCount={activeRowIndex === 0 ? selectTriggerCount : 0} onFocusItem={setActiveMedia} />
                    <MediaRibbon title="Binge-Worthy Shows" fetchUrl="/api/media/tv_shows" onSelectVideo={handleSelectSeries} isActiveRow={activeRowIndex === 1} activeColIndex={activeColIndex} selectTriggerCount={activeRowIndex === 1 ? selectTriggerCount : 0} onFocusItem={setActiveMedia} />
                  </>
                )}
                {activeTab === 'movies' && (
                  <MediaRibbon title="Recently Added Movies" fetchUrl="/api/media/movies" onSelectVideo={handleSelectSeries} isActiveRow={activeRowIndex === 0} activeColIndex={activeColIndex} selectTriggerCount={activeRowIndex === 0 ? selectTriggerCount : 0} onFocusItem={setActiveMedia} />
                )}
                {activeTab === 'shows' && (
                  <MediaRibbon title="Binge-Worthy Shows" fetchUrl="/api/media/tv_shows" onSelectVideo={handleSelectSeries} isActiveRow={activeRowIndex === 0} activeColIndex={activeColIndex} selectTriggerCount={activeRowIndex === 0 ? selectTriggerCount : 0} onFocusItem={setActiveMedia} />
                )}
              </div>
            </>
          )}
        </main>
        </div>
        <HololinkHub user={user} />
      </div>
    </HoloLinkProvider>
  )
}

export default App
