import React, { useState, useEffect } from 'react';
import { Camera, Scan, WifiOff, Maximize2, ShieldAlert, ArrowLeft, Video } from 'lucide-react';

interface ArgusCamera {
  id: string;
  name: string;
  ip: string;
  port: number;
  stream_url: string;
}

interface ArgusNexusConsoleProps {
  osTheme?: string;
  onBack?: () => void;
}

const CameraCard = ({ cam, isHomeTheme, onCaptureRom }: { key?: any, cam: ArgusCamera, isHomeTheme: boolean, onCaptureRom: (cam: ArgusCamera) => void }) => {
  const [hasError, setHasError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    setIsCapturing(true);
    await onCaptureRom(cam);
    setIsCapturing(false);
  };

  return (
    <div className={`group relative flex flex-col overflow-hidden transition-all ${isHomeTheme ? 'os-card p-0 border border-white/10' : 'bg-black border-2 border-[#1f2833] hover:border-[#66fcf1] rounded-lg '}`}>
      
      <div className={`flex justify-between items-center ${isHomeTheme ? 'os-card-header px-4 py-3' : 'bg-[#1f2833] py-2 px-4 border-b border-[#66fcf1]/30'}`}>
        <span className={`font-bold text-sm ${isHomeTheme ? 'text-white' : 'text-[#66fcf1] uppercase tracking-wider'}`}>{cam.name}</span>
        <span className={`text-[10px] tracking-widest font-mono ${isHomeTheme ? 'text-white/40' : 'text-[#45a29e]'}`}>{cam.ip}:{cam.port}</span>
      </div>
      
      <div className={`relative flex-1 flex items-center justify-center min-h-[250px] overflow-hidden ${isHomeTheme ? 'bg-black/50' : 'bg-[#0b0c10]'}`}>
        {!isHomeTheme && (
          <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] z-10 opacity-30 mix-blend-overlay"></div>
        )}
        
        {!hasError && (
          <>
            <img 
              src={cam.stream_url} 
              alt={cam.name}
              className="w-full h-full object-contain absolute inset-0 z-0 cursor-pointer hover:scale-105 transition-transform duration-500"
              onError={() => setHasError(true)}
              onClick={() => window.open(cam.stream_url, '_blank')}
            />
            {/* Enlarge Button */}
            <div className="absolute top-3 left-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => window.open(cam.stream_url, '_blank')}
                title="Enlarge feed in new tab"
                className={`flex items-center justify-center p-2 rounded shadow-lg backdrop-blur transition-colors ${
                  isHomeTheme 
                    ? 'bg-black/60 text-white border border-white/20 hover:bg-[#38bdf8] hover:border-[#38bdf8]' 
                    : 'bg-[#1f2833]/80 text-[#66fcf1] border border-[#66fcf1] hover:bg-[#66fcf1] hover:text-black'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
        
        {hasError && (
          <div className="z-20 flex flex-col items-center text-red-500 gap-2">
            <WifiOff className="w-10 h-10 animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-bold">Signal Lost</span>
          </div>
        )}

        {/* Capture ROM Overlay Button */}
        {!hasError && (
          <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleCapture}
              disabled={isCapturing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold shadow-lg backdrop-blur transition-colors ${
                isHomeTheme 
                  ? 'bg-black/60 text-white border border-white/20 hover:bg-[#38bdf8] hover:border-[#38bdf8]' 
                  : 'bg-[#1f2833]/80 text-[#66fcf1] border border-[#66fcf1] hover:bg-[#66fcf1] hover:text-black'
              } ${isCapturing ? 'animate-pulse cursor-not-allowed opacity-50' : ''}`}
            >
              <Video className="w-4 h-4" />
              {isCapturing ? 'SNIPPING...' : 'DVR SNIP'}
            </button>
          </div>
        )}
      </div>

      {!isHomeTheme && (
        <>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#66fcf1] pointer-events-none"></div>
          <div className="absolute top-10 left-0 w-8 h-8 border-t-2 border-l-2 border-[#66fcf1]/30 pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

export default function ArgusNexusConsole({ osTheme = 'mac', onBack }: ArgusNexusConsoleProps) {
  const [cameras, setCameras] = useState<ArgusCamera[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureRom = async (cam: ArgusCamera) => {
    try {
      const res = await fetch(`/api/argus/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: cam.ip, port: cam.port, name: cam.name })
      });
      if (!res.ok) throw new Error('Capture failed');
      // Toast notification would go here in a full app
      console.log('Capture successful, ROM initialized');
    } catch (err) {
      console.error('Error capturing ROM:', err);
      alert('Failed to capture ROM: ' + err);
    }
  };

  const scanMesh = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/argus/scan`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to scan mesh');
      const data = await res.json();
      
      const proxiedCameras = (data.cameras || []).map((cam: any) => {
        let proxyUrl = cam.stream_url;
        if (cam.port === 5051) {
          proxyUrl = '/dvr-proxy/video_feed';
        } else if (cam.port === 8081) {
          proxyUrl = `/cam-proxy/${cam.hostname}/cam/0?t=${Date.now()}`;
        }
        return { ...cam, stream_url: proxyUrl };
      });

      setCameras(proxiedCameras);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanMesh();
  }, []);

  const isHomeTheme = osTheme === 'sovereign-home';

  return (
    <div className={`min-h-screen w-full p-8 pt-24 ${isHomeTheme ? 'font-sans text-slate-200' : 'bg-[#0b0c10] text-[#c5c6c7] font-mono'}`}>
      
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-8 ${isHomeTheme ? 'border-b border-white/10' : 'border-b-2 border-[#66fcf1]/30'}`}>
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          {onBack && (
            <button onClick={onBack} className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isHomeTheme ? 'bg-white/5 hover:bg-white/10 text-white' : 'border border-[#66fcf1]/50 text-[#66fcf1] hover:bg-[#66fcf1]/10'}`}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className={`text-3xl font-bold flex items-center gap-4 ${isHomeTheme ? 'text-white' : 'text-[#66fcf1] tracking-[0.2em] uppercase drop-'}`}>
              {isHomeTheme ? <Video className="w-8 h-8 text-[#22c55e]" /> : <Camera className="w-8 h-8" />}
              {isHomeTheme ? 'Live Camera Grid' : 'ARGUS Nexus'}
            </h1>
            <p className={`text-[12px] mt-1 ${isHomeTheme ? 'text-[#22c55e] tracking-widest font-mono' : 'text-[#45a29e] tracking-widest uppercase'}`}>
              {isHomeTheme ? 'Active Video Feeds' : 'SOVEREIGN MESH // GLOBAL SURVEILLANCE GRID'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={scanMesh}
          disabled={isScanning}
          className={`flex items-center gap-2 px-6 py-3 rounded text-sm tracking-widest transition-all disabled:opacity-50 ${isHomeTheme ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold' : 'bg-[#1f2833] hover:bg-[#66fcf1]/20 border border-[#66fcf1] text-[#66fcf1] uppercase'}`}
        >
          <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? (isHomeTheme ? 'Scanning...' : 'SCANNING...') : (isHomeTheme ? 'Refresh Cameras' : 'RESCAN MESH')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-8 rounded flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span className="uppercase text-sm tracking-widest">Error: {error}</span>
        </div>
      )}

      {isScanning && cameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
          <Scan className={`w-16 h-16 animate-ping ${isHomeTheme ? 'text-[#22c55e]' : 'text-[#66fcf1]'}`} />
          <p className={`text-xl tracking-[0.3em] uppercase ${isHomeTheme ? 'text-[#22c55e] font-bold' : 'text-[#66fcf1]'}`}>
            Finding Cameras...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 auto-rows-fr">
          {cameras.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
              <WifiOff className="w-12 h-12" />
              <p className="uppercase tracking-widest">No active webcams detected.</p>
            </div>
          ) : (
            cameras.map((cam) => (
              <CameraCard key={cam.id} cam={cam} isHomeTheme={isHomeTheme} onCaptureRom={handleCaptureRom} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
