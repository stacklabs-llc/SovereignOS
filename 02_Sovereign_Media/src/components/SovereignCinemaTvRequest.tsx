import React, { useState, useEffect, useCallback } from 'react'

interface SearchResult {
  title: string
  year: number
  overview: string
  poster_url: string | null
  media_type: string
  tvdb_or_tmdb_id: number
  added: boolean
}

interface QueueSlot {
  filename: string
  percentage: string
  size: string
  status: string
}

interface QueueResponse {
  queue?: {
    speed: string
    sizeleft: string
    mbleft: string
    slots: QueueSlot[]
  }
}

export const SovereignCinemaTvRequest: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [grabStatus, setGrabStatus] = useState<{ [key: string]: 'idle' | 'grabbing' | 'success' | 'error' }>({})
  const [queue, setQueue] = useState<QueueResponse | null>(null)
  const [queueError, setQueueError] = useState<string | null>(null)

  // ── SABnzbd Queue Polling (Every 5 seconds) ──────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/cinema/queue')
      if (res.ok) {
        const data = await res.json()
        setQueue(data)
        setQueueError(null)
      } else {
        setQueueError('Failed to fetch download queue')
      }
    } catch (err) {
      setQueueError('Queue server unreachable')
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 5000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  // ── Debounced Search Trigger ──────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/cinema/search?term=${encodeURIComponent(searchTerm)}&media_type=tv`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  // ── Grab All Seasons Action ───────────────────────────────────────────────
  const handleGrabAllSeasons = async (show: SearchResult) => {
    const showId = show.tvdb_or_tmdb_id.toString()
    setGrabStatus(prev => ({ ...prev, [showId]: 'grabbing' }))

    try {
      const res = await fetch('/api/cinema/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: show.title,
          media_type: 'tv',
          target_node: 'clio',
          mst3k_mode: false
        })
      })

      if (res.ok) {
        setGrabStatus(prev => ({ ...prev, [showId]: 'success' }))
        // Refresh search results to show as added after a short delay
        setTimeout(() => {
          setSearchResults(prev =>
            prev.map(item =>
              item.tvdb_or_tmdb_id === show.tvdb_or_tmdb_id ? { ...item, added: true } : item
            )
          )
        }, 1500)
      } else {
        setGrabStatus(prev => ({ ...prev, [showId]: 'error' }))
      }
    } catch (err) {
      setGrabStatus(prev => ({ ...prev, [showId]: 'error' }))
    }
  }

  // Helper: compute active download progress percentage
  const getQueueProgress = () => {
    if (!queue || !queue.queue || !queue.queue.slots || queue.queue.slots.length === 0) return 0
    // Try to get percentage of first slot (active)
    const activeSlot = queue.queue.slots[0]
    const pct = parseFloat(activeSlot.percentage)
    return isNaN(pct) ? 0 : pct
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 overflow-y-auto hide-scrollbar select-none cardboard-texture-dark crt-scanlines" style={{ backgroundColor: '#0B0E14' }}>
      {/* Tape decoration for 90s cardboard aesthetic */}
      <div className="tape-corner"></div>
      <div className="tape-corner-right"></div>

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 border-b border-sky-900/30 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mono flex items-center gap-2">
          📺 SOVEREIGN <span className="text-sky-400 glowing-shadow-blue px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-400/30">CINEMA</span> TV INGRESS
        </h1>
        <p className="text-xs text-slate-400 mono">
          Smyrna Heights Outpost // Automated Usenet Ingress & Sonarr Pipeline
        </p>
      </div>

      {/* ── Main Layout Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Search & Action Controller (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="cardboard-panel-dark p-5 flex flex-col gap-4 frosted-glass-dark border-sky-500/30">
            <h2 className="text-lg font-bold text-sky-400 mono flex items-center gap-2 border-b border-slate-700/50 pb-2">
              🔍 Show Search & Ingress
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter TV series title (e.g. Seinfeld)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/90 text-white border-2 border-slate-700 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:border-sky-500 transition-colors duration-200 mono placeholder-slate-500"
              />
              <span className="absolute left-3.5 top-3.5 text-slate-500">🔎</span>
              {isSearching && (
                <div className="absolute right-4 top-3.5 animate-spin rounded-full h-5 w-5 border-2 border-sky-500 border-t-transparent"></div>
              )}
            </div>

            {/* Results Grid */}
            <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto hide-scrollbar pr-1 mt-2">
              {searchResults.length > 0 ? (
                searchResults.map((show) => {
                  const showId = show.tvdb_or_tmdb_id.toString()
                  const status = grabStatus[showId] || 'idle'

                  return (
                    <div key={showId} className="flex gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-sky-900/40 transition-all duration-200">
                      {show.poster_url ? (
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          className="w-24 h-36 object-cover rounded-md border border-slate-700/50 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-36 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700/50 flex-shrink-0 mono text-[10px] text-slate-500 text-center p-2">
                          No Poster
                        </div>
                      )}

                      <div className="flex flex-col justify-between flex-grow min-w-0">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-bold text-white leading-tight truncate">
                            {show.title} <span className="text-xs text-slate-400 font-normal mono">({show.year})</span>
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-1">
                            {show.overview || 'No overview available for this series.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          {show.added ? (
                            <button
                              disabled
                              className="px-4 py-2 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold mono cursor-default"
                            >
                              ✓ IN LIBRARY
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGrabAllSeasons(show)}
                              disabled={status !== 'idle'}
                              className={`px-4 py-2 rounded text-xs font-bold mono transition-all duration-200 ${
                                status === 'idle'
                                  ? 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 cursor-pointer'
                                  : status === 'grabbing'
                                  ? 'bg-sky-950/60 text-sky-400 border border-sky-500/30 cursor-not-allowed flex items-center gap-2'
                                  : status === 'success'
                                  ? 'bg-emerald-900 text-emerald-300 border border-emerald-500/40 cursor-default'
                                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30 cursor-pointer'
                              }`}
                            >
                              {status === 'idle' && '[ GRAB ALL SEASONS ]'}
                              {status === 'grabbing' && (
                                <>
                                  <span className="animate-spin inline-block h-3 w-3 border-2 border-sky-400 border-t-transparent rounded-full"></span>
                                  GRABBING...
                                </>
                              )}
                              {status === 'success' && '✓ GRABBED'}
                              {status === 'error' && '⚡ TRY AGAIN'}
                            </button>
                          )}
                          <span className="text-[10px] text-slate-500 mono">
                            TVDB: {show.tvdb_or_tmdb_id}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : searchTerm ? (
                <div className="text-center py-10 text-slate-500 mono text-xs">
                  No matching TV shows found.
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 mono text-xs">
                  Type a TV show title above to begin ingress lookup.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Queue Monitoring Feed (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="cardboard-panel-dark p-5 flex flex-col gap-4 frosted-glass-dark border-cyan-500/30">
            <h2 className="text-lg font-bold text-cyan-400 mono flex items-center justify-between border-b border-slate-700/50 pb-2">
              <span>📡 Ingress Pipe Monitor</span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE POLLING
              </span>
            </h2>

            {queueError && (
              <div className="p-3 rounded bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs mono">
                ⚠️ {queueError}
              </div>
            )}

            {queue?.queue ? (
              <div className="flex flex-col gap-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950/50 border border-slate-800 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 mono">DL SPEED</span>
                    <span className="text-lg font-bold text-white mono">
                      {queue.queue.speed ? queue.queue.speed : '0 KB/s'}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/50 border border-slate-800 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 mono">QUEUE SIZE REMAINING</span>
                    <span className="text-lg font-bold text-white mono">
                      {queue.queue.sizeleft ? queue.queue.sizeleft : '0 GB'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {queue.queue.slots && queue.queue.slots.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mono">
                      <span>ACTIVE DOWNLOAD PROGRESS</span>
                      <span className="text-cyan-400 font-bold">{getQueueProgress()}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500 glowing-shadow-blue"
                        style={{ width: `${getQueueProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Active Slots list */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] text-slate-500 mono">ACTIVE USENET PIPELINE SLOTS</span>
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto hide-scrollbar pr-1">
                    {queue.queue.slots && queue.queue.slots.length > 0 ? (
                      queue.queue.slots.map((slot, idx) => (
                        <div key={idx} className="p-3 rounded bg-slate-950/40 border border-slate-900 flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-white truncate leading-normal mono" title={slot.filename}>
                            {slot.filename}
                          </span>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 mono">
                            <span className="flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-cyan-400"></span>
                              {slot.size}
                            </span>
                            <span className="text-cyan-400 font-bold">{slot.percentage}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded text-slate-600 mono text-[10px]">
                        Pipeline empty. No active downloads in progress.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !queueError ? (
              <div className="text-center py-16 text-slate-500 mono text-xs">
                Connecting to SABnzbd service...
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  )
}
