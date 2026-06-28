import React, { useState } from 'react';

interface CinemaSearchItem {
  title: string;
  year?: number;
  overview?: string;
  poster_url?: string;
  media_type: 'movie' | 'tv';
  tvdb_or_tmdb_id: number;
  added: boolean;
}

export default function SovereignCinemaRequest() {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CinemaSearchItem[]>([]);
  const [mst3kMode, setMst3kMode] = useState(false);
  
  // Feedback status
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const response = await fetch(`/api/cinema/search?term=${encodeURIComponent(query)}&media_type=${mediaType}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      setResults(data);
      if (data.length === 0) {
        setStatusMsg({ text: `No results found for "${query}"`, type: 'info' });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ text: `Failed to search: ${errMsg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCast = async (item: CinemaSearchItem) => {
    setStatusMsg({ text: `Sending request for "${item.title}"...`, type: 'info' });
    try {
      const response = await fetch('/api/cinema/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          media_type: item.media_type,
          target_node: 'clio',
          mst3k_mode: item.media_type === 'movie' ? mst3kMode : false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === 'playing') {
        setStatusMsg({
          text: `🎬 Casting "${item.title}" to Clio now! (Incident logged: ${data.incident_logged || 'N/A'})`,
          type: 'success',
        });
      } else if (data.status === 'triggered_download') {
        setStatusMsg({
          text: `📥 "${item.title}" not found locally. Triggered download & search in ${item.media_type === 'movie' ? 'Radarr' : 'Sonarr'}.`,
          type: 'success',
        });
      } else {
        setStatusMsg({
          text: `Success: ${data.message || 'Request submitted'}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ text: `Failed to request: ${errMsg}`, type: 'error' });
    }
  };

  return (
    <div className="cardboard-panel cardboard-texture-dark p-6 text-stone-100 flex flex-col gap-6" style={{ borderColor: '#00c878', boxShadow: '6px 6px 0px #006038' }}>
      
      {/* HEADER */}
      <div className="border-b-2 border-stone-700 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#00c878] tracking-wider uppercase flex items-center gap-2">
            🎬 SOVEREIGN CINEMA COMMAND
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            REQUEST MOVIE OR TV SHOW • CENTRALIZED INGRESS CONTROL
          </p>
        </div>
        
        {/* MST3K MODE OVERLAY TOGGLE */}
        {mediaType === 'movie' && (
          <label className="flex items-center space-x-2 bg-stone-900 border border-stone-800 p-2 rounded-lg cursor-pointer hover:border-[#00c878] transition-colors">
            <input 
              type="checkbox" 
              checked={mst3kMode} 
              onChange={(e) => setMst3kMode(e.target.checked)}
              className="accent-[#00c878] cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-stone-300">📺 MST3K OVERLAY MODE</span>
          </label>
        )}
      </div>

      {/* SEARCH INPUT & TYPE FILTER */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 bg-stone-900 p-4 rounded-xl border border-stone-800">
        
        {/* MEDIA TYPE SWITCHER */}
        <div className="flex bg-stone-850 p-1 rounded-lg border border-stone-750 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setMediaType('movie')}
            className={`px-4 py-2 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'movie' 
                ? 'bg-[#00c878] text-stone-900 shadow-md' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            MOVIES
          </button>
          <button
            type="button"
            onClick={() => setMediaType('tv')}
            className={`px-4 py-2 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
              mediaType === 'tv' 
                ? 'bg-[#00c878] text-stone-900 shadow-md' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            TV SHOWS
          </button>
        </div>

        {/* INPUT FIELDF */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder={`Search for a ${mediaType === 'movie' ? 'movie' : 'TV show'} by title...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-stone-800 border-2 border-stone-700 focus:border-[#00c878] focus:outline-none rounded-lg px-4 py-2 font-sans text-sm text-stone-100 placeholder-stone-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#00c878] hover:bg-[#00a868] text-stone-900 font-mono font-bold text-sm px-6 py-2 rounded-lg cursor-pointer transition-colors shadow-md hover:scale-102 flex items-center justify-center gap-1 min-w-[100px]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'SEARCH'
            )}
          </button>
        </div>
      </form>

      {/* FEEDBACK BANNER */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between ${
          statusMsg.type === 'success' 
            ? 'bg-[#00c878]/10 border-[#00c878]/30 text-[#00c878]' 
            : statusMsg.type === 'error'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-stone-400 hover:text-stone-200 ml-4 font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* RESULTS GRID */}
      <div className="flex-1 overflow-y-auto max-h-[500px] pr-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 flex gap-4 animate-pulse">
                <div className="w-[80px] h-[120px] bg-stone-800 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-stone-800 rounded w-3/4"></div>
                  <div className="h-3 bg-stone-800 rounded w-1/4"></div>
                  <div className="h-10 bg-stone-800 rounded w-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item) => (
              <div 
                key={item.tvdb_or_tmdb_id} 
                className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex gap-4 hover:border-stone-700 transition-all shadow-lg hover:scale-101"
              >
                {/* Poster Art */}
                {item.poster_url ? (
                  <img 
                    src={item.poster_url} 
                    alt={item.title}
                    className="w-[90px] h-[135px] object-cover rounded-lg border border-stone-800 flex-shrink-0 bg-stone-950"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="135" viewBox="0 0 90 135"><rect width="100%" height="100%" fill="%231c1917"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2344403c" font-size="12">🎬</text></svg>';
                    }}
                  />
                ) : (
                  <div className="w-[90px] h-[135px] bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">🎬</span>
                  </div>
                )}

                {/* Metadata & Actions */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-white leading-tight flex items-center gap-2">
                      {item.title}
                      {item.year && <span className="text-xs font-mono font-medium text-stone-500">({item.year})</span>}
                    </h3>
                    
                    <p className="text-[11px] text-stone-400 font-sans mt-2 line-clamp-3 leading-relaxed">
                      {item.overview || 'No description available.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.added 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
                    }`}>
                      {item.added ? 'IN LIBRARY' : 'NOT IN LIBRARY'}
                    </span>

                    <button
                      onClick={() => handleRequestCast(item)}
                      className={`font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase tracking-wider transition-all cursor-pointer ${
                        item.added
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : 'bg-[#00c878] hover:bg-[#00a868] text-stone-900 shadow-md'
                      }`}
                    >
                      {item.added ? '📺 CAST NOW' : '📥 REQUEST DOWNLOAD'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[250px] border-2 border-dashed border-stone-800 rounded-2xl flex flex-col items-center justify-center text-stone-500 gap-2">
            <span className="text-4xl">🍿</span>
            <p className="text-xs font-mono uppercase tracking-widest mt-2">Search for content above to begin casting</p>
          </div>
        )}
      </div>
    </div>
  );
}
