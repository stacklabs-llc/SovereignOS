import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Navigation, Settings, Play, Pause, 
  ChevronRight, Calendar, Compass, RefreshCw 
} from 'lucide-react';

interface GpxPoint {
  lat: number;
  lon: number;
  time: string;
}

interface Candidate {
  lat: number;
  lon: number;
  start_time: string;
  duration: number;
  avg_speed: number;
  score: number;
  description: string;
}

export default function VetTelemetryDashboard() {
  const [gpxPoints, setGpxPoints] = useState<GpxPoint[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCandidateIdx, setActiveCandidateIdx] = useState<number | null>(null);
  
  // Toggle states
  const [showPayload, setShowPayload] = useState<boolean>(true);
  const [showTrace, setShowTrace] = useState<boolean>(true);
  const [showHeat, setShowHeat] = useState<boolean>(true);

  // Computed metrics
  const [distance, setDistance] = useState<number>(0);
  const [currentDateStr, setCurrentDateStr] = useState<string>('Initializing Timeline...');
  const [excursionLogs, setExcursionLogs] = useState<string[]>([]);
  
  const mapRef = useRef<any>(null);
  const mapContainerId = "vet-telemetry-react-map";
  
  // Track layers for dynamic updates
  const traceLayerRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const payloadGroupRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);

  // Load Leaflet and assets dynamically
  useEffect(() => {
    let leafletScript: HTMLScriptElement | null = null;
    let leafletCss: HTMLLinkElement | null = null;
    let heatScript: HTMLScriptElement | null = null;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || mapRef.current) return;

      // Map Setup
      const map = L.map(mapContainerId, { zoomControl: false }).setView([33.884866, -84.530719], 18);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Carto Voyager Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 22
      }).addTo(map);

      mapRef.current = map;

      // Base location: James' House
      const homeIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
          background: #fff9c4; 
          border: 3px solid #8d6e63; 
          box-shadow: 2px 2px 0px #5d4037; 
          color: #2d1b4e; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-weight: 800; 
          font-size: 10px; 
          white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        ">🏡 START: JAMES' HOUSE</div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });
      L.marker([33.884866, -84.530719], { icon: homeIcon }).addTo(map);

      // Safehouses
      const safehouses = [
        { lat: 33.885868, lon: -84.530339, name: "🎯 SAM: CRESTWOOD" },
        { lat: 33.88285, lon: -84.530877, name: "🎯 SAM: HILLSIDE" }
      ];

      safehouses.forEach(sh => {
        const shIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="
            background: #fffdf9; 
            border: 2px solid #8d6e63; 
            box-shadow: 2px 2px 0px #5d4037; 
            color: #2d1b4e; 
            padding: 3px 6px; 
            border-radius: 2px; 
            font-weight: bold; 
            font-size: 9px; 
            white-space: nowrap;
            font-family: 'Outfit', sans-serif;
          ">${sh.name}</div>`
        });
        L.marker([sh.lat, sh.lon], { icon: shIcon }).addTo(map);
      });

      // Layer groups for dynamic controls
      payloadGroupRef.current = L.layerGroup().addTo(map);
    };

    // Dynamically insert Leaflet CDNs
    if (!(window as any).L) {
      leafletCss = document.createElement("link");
      leafletCss.rel = "stylesheet";
      leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCss);

      leafletScript = document.createElement("script");
      leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      leafletScript.onload = () => {
        // Now load the heat plugin
        heatScript = document.createElement("script");
        heatScript.src = "https://leaflet.github.io/Leaflet.heat/dist/leaflet-heat.js";
        heatScript.onload = initMap;
        document.body.appendChild(heatScript);
      };
      document.body.appendChild(leafletScript);
    } else {
      initMap();
    }

    // Load data from static files
    fetch('/data/metsy_gpx_points.json')
      .then(res => res.json())
      .then(data => {
        setGpxPoints(data);
        setSliderVal(data.length);
      })
      .catch(err => console.error("Error loading GPX points:", err));

    fetch('/data/metsy_payload_candidates.json')
      .then(res => res.json())
      .then(data => {
        setCandidates(data.candidates || []);
      })
      .catch(err => console.error("Error loading candidates:", err));

    return () => {
      if (leafletScript) document.body.removeChild(leafletScript);
      if (leafletCss) document.head.removeChild(leafletCss);
      if (heatScript) document.body.removeChild(heatScript);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Distance calculation helper (Haversine formula)
  const calculateDistance = (points: GpxPoint[]): number => {
    if (points.length < 2) return 0;
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const R = 3958.8; // Miles
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLon = (p2.lon - p1.lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      dist += R * c;
    }
    return dist;
  };

  // Re-render / update map overlays whenever visible points or toggle states change
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map || gpxPoints.length === 0) return;

    const visiblePoints = gpxPoints.slice(0, sliderVal);
    
    // 1. Update metric displays
    const dist = calculateDistance(visiblePoints);
    setDistance(dist);

    if (visiblePoints.length > 0) {
      const d = new Date(visiblePoints[visiblePoints.length - 1].time);
      setCurrentDateStr(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    }

    // 2. Movement Trace Polyline
    if (traceLayerRef.current) map.removeLayer(traceLayerRef.current);
    if (showTrace && visiblePoints.length > 0) {
      const recentPoints = visiblePoints.slice(-150); // limit to tail of last 150 points for clarity
      const latlngs = recentPoints.map(p => [p.lat, p.lon]);
      traceLayerRef.current = L.polyline(latlngs, {
        color: '#8d6e63', // Cozy cardboard brown
        weight: 3.5,
        opacity: 0.6,
        dashArray: '5, 8',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 3. Density Heatmap Layer
    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
    if (showHeat && visiblePoints.length > 0 && L.heatLayer) {
      const heatData = visiblePoints.map(p => [p.lat, p.lon, 1]);
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: '#8d6e63', 0.7: '#81c784', 1.0: '#2d1b4e' } // cardboard to twilight
      }).addTo(map);
    }

    // 4. Excursion Boundaries Analysis (beyond 250ft of home)
    const logs: string[] = [];
    const recentSet = visiblePoints.slice(-100);
    const homeLat = 33.884866, homeLon = -84.530719;
    let sustains = 0;

    recentSet.forEach(p => {
      const dLat = (p.lat - homeLat) * Math.PI / 180;
      const dLon = (p.lon - homeLon) * Math.PI / 180;
      const distFromHome = 3958.8 * 2 * Math.atan2(
        Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(homeLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2),
        Math.sqrt(1 - (Math.sin(dLat / 2) ** 2 + Math.cos(homeLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2))
      );

      if (distFromHome > 0.045) { // breached perimeter
        sustains++;
        const timeStr = new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (logs.length < 6) {
          const destination = p.lon > homeLon ? "CRESTWOOD APPROACH" : "HILLSIDE APPROACH";
          logs.push(`[${timeStr}] EXCURSION: ${destination}`);
        }
      }
    });

    if (sustains > 6) {
      logs.push(`...[+${sustains - 6} sustained boundary breaches]`);
    } else if (sustains === 0 && visiblePoints.length > 0) {
      logs.push("PERIMETER SECURE. ALL SYSTEMS NORMAL.");
    }
    setExcursionLogs(logs);

  }, [sliderVal, gpxPoints, showTrace, showHeat]);

  // Handle Payload target markers (glowing poops)
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    const pg = payloadGroupRef.current;
    if (!L || !map || !pg || candidates.length === 0) return;

    pg.clearLayers();
    markerRefs.current = [];

    if (!showPayload) return;

    candidates.forEach((cand, idx) => {
      const isPrimary = idx === 0;

      // Popups matching our yellow sticky note theme
      const depDate = new Date(cand.start_time);
      const estTimeStr = depDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const now = new Date();
      const diffMs = now.getTime() - depDate.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      let freshness = '';
      if (diffHrs < 1) {
        const mins = Math.max(1, Math.round(diffHrs * 60));
        freshness = `${mins} mins ago (CRITICAL FRESH)`;
      } else if (diffHrs < 24) {
        freshness = `~${Math.round(diffHrs)} hrs ago (FRESH)`;
      } else {
        freshness = `~${Math.round(diffHrs / 24)} days ago (${Math.round(diffHrs)} hrs fresh)`;
      }

      const poopHtml = `
        <div class="poop-pulse-icon" style="
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: ${isPrimary ? '40px' : '28px'};
          cursor: pointer;
          filter: drop-shadow(0 0 10px ${isPrimary ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.4)'});
          animation: poopBreathe 1.8s infinite ease-in-out;
        ">💩</div>
      `;

      const poopIcon = L.divIcon({
        className: 'custom-poop-icon',
        html: poopHtml,
        iconSize: isPrimary ? [50, 50] : [36, 36],
        iconAnchor: isPrimary ? [25, 25] : [18, 18]
      });

      const marker = L.marker([cand.lat, cand.lon], { icon: poopIcon });
      
      const popupContent = `
        <div style="
          padding: 8px; 
          color: #3e2723; 
          min-width: 230px; 
          font-family: 'Outfit', sans-serif;
          background: #fff9c4;
          border-radius: 4px;
        ">
          <h3 style="
            margin: 0 0 6px 0; 
            color: #2d1b4e; 
            font-size: 15px; 
            border-bottom: 2px dashed #fbc02d; 
            padding-bottom: 4px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            font-weight: 800;
          ">
            <span>${isPrimary ? '💩 PRIMARY LOCK' : '💩 DROP ZONE'}</span>
            <span style="font-size: 11px; background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 2px;">#${idx + 1}</span>
          </h3>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Lat/Lon:</strong> ${cand.lat.toFixed(6)}, ${cand.lon.toFixed(6)}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Time:</strong> ${estTimeStr}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Freshness:</strong> ${freshness}</div>
          <div style="font-size: 11px; margin-bottom: 2px;"><strong>Duration:</strong> ${Math.round(cand.duration)}s | Speed: ${cand.avg_speed.toFixed(2)}m/s</div>
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Score:</strong> <span style="color: #ef4444; font-weight: bold;">${cand.score}</span></div>
          <p style="margin: 0; font-size: 10px; color: #5d4037; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px; font-style: italic; line-height: 1.2;">
            ${cand.description}
          </p>
        </div>
      `;

      // Custom Leaflet styling logic injected directly via popup options
      marker.bindPopup(popupContent, { 
        maxWidth: 300,
        className: 'poop-sticky-popup'
      });
      pg.addLayer(marker);
      markerRefs.current.push(marker);
    });
  }, [candidates, showPayload]);

  // Autoplay Scrubber loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSliderVal(prev => {
          if (prev >= gpxPoints.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 5; // scrub forward at 5x speed
        });
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, gpxPoints]);

  const selectCandidate = (cand: Candidate, idx: number) => {
    setActiveCandidateIdx(idx);
    const map = mapRef.current;
    if (map) {
      map.setView([cand.lat, cand.lon], 21);
      const targetMarker = markerRefs.current[idx];
      if (targetMarker) {
        setTimeout(() => targetMarker.openPopup(), 100);
      }
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full h-[calc(100vh-140px)] text-[#2d1b4e] selection:bg-[#81c784] selection:text-white relative z-10 animate-in fade-in duration-300">
      
      {/* Dynamic Map Window */}
      <div className="flex-1 rounded-3xl border-4 border-[#8d6e63] bg-[#f5f1ed] relative overflow-hidden shadow-[8px_8px_0px_#5d4037] flex flex-col min-h-[300px]">
        {/* Cardboard title tab */}
        <div className="absolute top-4 left-4 z-[1000] bg-[#fffdf9] border-3 border-[#8d6e63] px-4 py-2 rounded-xl shadow-[4px_4px_0px_#5d4037] flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#8d6e63] animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <div className="text-[9px] font-mono tracking-widest text-[#8d6e63] uppercase font-bold">microservice</div>
            <div className="text-sm font-black tracking-wider uppercase">VET TELEMETRY PATHWAY</div>
          </div>
        </div>

        {/* Map Mount Target */}
        <div id={mapContainerId} className="flex-1 w-full h-full z-0" />
        
        {/* Style block for popups & breathing animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes poopBreathe {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .poop-sticky-popup .leaflet-popup-content-wrapper {
            background: #fff9c4 !important;
            border: 3px solid #fbc02d !important;
            box-shadow: 4px 4px 0px #8d6e63 !important;
            border-radius: 4px !important;
          }
          .poop-sticky-popup .leaflet-popup-tip {
            background: #fff9c4 !important;
            border: 2px solid #fbc02d !important;
          }
        `}} />
      </div>

      {/* Retro Cozy 90s Cardboard Sidebar Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pr-1">
        
        {/* Cardboard Card 1: Scrubber and Metrics */}
        <div className="bg-[#fffdf9] border-4 border-[#8d6e63] rounded-3xl p-5 shadow-[6px_6px_0px_#5d4037] relative before:absolute before:top-[-4px] before:right-[15px] before:w-[35px] before:h-[12px] before:bg-slate-300/60 before:rotate-[15deg] before:border-x-2 before:border-dashed before:border-slate-400">
          <h2 className="text-xs font-mono tracking-widest text-[#8d6e63] uppercase border-b-2 border-dashed border-[#8d6e63] pb-1.5 mb-4 flex items-center justify-between font-black">
            <span>Temporal Scrubber</span>
            <Activity className="w-4 h-4 text-[#8d6e63] animate-pulse" />
          </h2>
          
          <div className="space-y-4">
            <div className="bg-[#f5f1ed] border-2 border-[#8d6e63] p-3 rounded-2xl text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)]">
              <span className="text-xs font-bold text-[#2d1b4e]/80 tracking-wide font-mono block">Current Excursion Time</span>
              <span className="text-xs font-mono font-black text-[#2d1b4e] mt-1 block">{currentDateStr}</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-[#81c784] hover:bg-[#66bb6a] text-white border-2 border-[#5d4037] flex items-center justify-center shadow-[3px_3px_0px_#5d4037] active:translate-y-0.5 active:shadow-[1px_1px_0px_#5d4037] transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <input 
                type="range" 
                min="0" 
                max={gpxPoints.length || 100} 
                value={sliderVal} 
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="flex-1 accent-[#8d6e63] cursor-pointer h-2 bg-[#e0d8d0] rounded-lg border border-[#8d6e63]"
              />
            </div>

            {/* Micro Metrics hub */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#f5f1ed] border-2 border-[#8d6e63] p-3 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <div className="text-[9px] uppercase tracking-wider text-[#8d6e63] font-bold">Total Excursion</div>
                <div className="text-base font-black text-[#2d1b4e] mt-0.5 font-mono">{distance.toFixed(2)} mi</div>
              </div>
              <div className="bg-[#f5f1ed] border-2 border-[#8d6e63] p-3 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <div className="text-[9px] uppercase tracking-wider text-[#8d6e63] font-bold">Data Points</div>
                <div className="text-base font-black text-[#2d1b4e] mt-0.5 font-mono">{sliderVal} / {gpxPoints.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cardboard Card 2: Controls & Layer Toggles */}
        <div className="bg-[#fffdf9] border-4 border-[#8d6e63] rounded-3xl p-5 shadow-[6px_6px_0px_#5d4037]">
          <h2 className="text-xs font-mono tracking-widest text-[#8d6e63] uppercase border-b-2 border-dashed border-[#8d6e63] pb-1.5 mb-4 font-black">
            Payload Recovery Layers (💩)
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-[#2d1b4e]/80 group-hover:text-[#2d1b4e] transition-colors">Target Lock Overlays</span>
              <input 
                type="checkbox" 
                checked={showPayload} 
                onChange={(e) => setShowPayload(e.target.checked)}
                className="w-4 h-4 accent-[#81c784] border-2 border-[#8d6e63] rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-[#2d1b4e]/80 group-hover:text-[#2d1b4e] transition-colors">Movement Trace Path</span>
              <input 
                type="checkbox" 
                checked={showTrace} 
                onChange={(e) => setShowTrace(e.target.checked)}
                className="w-4 h-4 accent-[#81c784] border-2 border-[#8d6e63] rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-bold text-[#2d1b4e]/80 group-hover:text-[#2d1b4e] transition-colors">Excursion Heat Map</span>
              <input 
                type="checkbox" 
                checked={showHeat} 
                onChange={(e) => setShowHeat(e.target.checked)}
                className="w-4 h-4 accent-[#81c784] border-2 border-[#8d6e63] rounded"
              />
            </label>
          </div>

          {/* List of candidates */}
          <div className="mt-4 pt-4 border-t border-dashed border-[#8d6e63] max-h-40 overflow-y-auto space-y-2">
            {candidates.map((cand, idx) => {
              const isPrimary = idx === 0;
              const isActive = activeCandidateIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => selectCandidate(cand, idx)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-red-50 border-red-500 shadow-[3px_3px_0px_#ef4444]' 
                      : 'bg-[#f5f1ed] border-[#8d6e63] hover:shadow-[3px_3px_0px_#5d4037] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className={isPrimary ? 'text-red-500 font-extrabold' : 'text-[#2d1b4e]'}>
                      {isPrimary ? '💩 PRIMARY LOCK' : `💩 CANDIDATE #${idx + 1}`}
                    </span>
                    <span className="font-mono bg-white/60 border border-[#8d6e63]/30 px-1.5 py-0.5 rounded text-[10px]">
                      Score: {cand.score}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#2d1b4e]/60 font-mono mt-1 leading-snug">
                    {cand.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cardboard Card 3: Anomaly Log Loop */}
        <div className="bg-[#fffdf9] border-4 border-[#8d6e63] rounded-3xl p-5 shadow-[6px_6px_0px_#5d4037]">
          <h2 className="text-xs font-mono tracking-widest text-red-500 uppercase border-b-2 border-dashed border-red-300 pb-1.5 mb-3 flex items-center gap-1.5 font-black">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Predictive Anomaly Loop</span>
          </h2>
          <p className="text-[10px] text-[#2d1b4e]/70 leading-normal mb-3 font-semibold">
            Analyzing historical GNSS excursions against known Sam safehouses (Crestwood & Hillside).
          </p>

          <div className="bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl p-3 text-[10px] font-mono tracking-wider font-extrabold mb-3 shadow-[inset_0_2px_4px_rgba(239,68,68,0.05)] text-center uppercase animate-pulse">
            ⚠️ EXCURSION BOUNDARY THRESHOLD EXCEEDED
          </div>

          <div className="bg-[#0b0e14] border-2 border-[#8d6e63] rounded-2xl p-3 max-h-36 overflow-y-auto text-emerald-400 font-mono text-[9px] leading-relaxed space-y-1.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
            {excursionLogs.map((log, index) => (
              <div key={index} className="border-b border-dashed border-[#8d6e63]/30 pb-1.5 last:border-b-0 last:pb-0">
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
