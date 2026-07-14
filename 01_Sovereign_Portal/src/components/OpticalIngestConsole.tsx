import React, { useState, useEffect, useRef } from 'react';
import { Camera, Cpu, Terminal, Play, Square, Settings, RefreshCw, BarChart2, ShieldAlert, Layers } from 'lucide-react';

interface BBox {
  label: string;
  confidence: number;
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage
  h: number; // percentage
}

interface Scene {
  id: string;
  name: string;
  bgUrl: string;
  objects: BBox[];
}

export default function OpticalIngestConsole() {
  const [activeTab, setActiveTab] = useState<'dvr' | 'hailo'>('hailo');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [activeCamName, setActiveCamName] = useState('Awaiting Optics...');
  const [streamUrl, setStreamUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState([
    '> Ingest pipeline initialized.',
    '> Tailscale MagicDNS handshake verified: clio -> mando [Pi 5 Node].',
    '> Hailo AI Coprocessor found on PCI Express lane 0.'
  ]);
  const [sysTime, setSysTime] = useState('00:00:00:00');

  // Hailo States
  const [selectedModel, setSelectedModel] = useState('yolov8s');
  const [confThreshold, setConfThreshold] = useState(0.5);
  const [nmsThreshold, setNmsThreshold] = useState(0.45);
  const [fpsCap, setFpsCap] = useState(30);
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedScene, setSelectedScene] = useState('workstation');
  const [detectedObjects, setDetectedObjects] = useState<BBox[]>([]);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [coreTemp, setCoreTemp] = useState(44.2);
  const [powerConsumption, setPowerConsumption] = useState(2.8);
  const [hailoUtil, setHailoUtil] = useState(12);

  // Define Mock Scenes
  const SCENES: Record<string, Scene> = {
    workstation: {
      id: 'workstation',
      name: 'Operator Workstation (Clio)',
      bgUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80',
      objects: [
        { label: 'Laptop (Clio)', confidence: 0.98, x: 25, y: 22, w: 50, h: 58 },
        { label: 'Espresso Cup', confidence: 0.89, x: 12, y: 65, w: 10, h: 18 },
        { label: 'Mechanical Keyboard', confidence: 0.94, x: 35, y: 70, w: 30, h: 16 },
        { label: 'Operator (James)', confidence: 0.97, x: 5, y: 5, w: 90, h: 90 }
      ]
    },
    racks: {
      id: 'racks',
      name: 'Argo Pi 5 Stack Labs',
      bgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      objects: [
        { label: 'Raspberry Pi 5 Node', confidence: 0.95, x: 20, y: 25, w: 32, h: 42 },
        { label: 'Hailo-10H AI Hat', confidence: 0.99, x: 22, y: 30, w: 28, h: 28 },
        { label: 'PCIe Active Cooler', confidence: 0.92, x: 34, y: 38, w: 12, h: 14 }
      ]
    },
    watchparty: {
      id: 'watchparty',
      name: 'Mets Watch Party Room',
      bgUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      objects: [
        { label: 'TV Telemetry Monitor', confidence: 0.97, x: 15, y: 15, w: 70, h: 48 },
        { label: 'Baseball Glove relic', confidence: 0.91, x: 42, y: 68, w: 15, h: 20 },
        { label: 'Soda Can', confidence: 0.86, x: 62, y: 72, w: 8, h: 14 }
      ]
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setSysTime(d.toISOString().split('T')[1].replace('Z', ''));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Simulate slight fluctuation in stats
  useEffect(() => {
    const statInterval = setInterval(() => {
      setCoreTemp(prev => Math.min(65, Math.max(38, +(prev + (Math.random() - 0.5) * 0.4).toFixed(1))));
      setPowerConsumption(prev => Math.min(8.5, Math.max(1.8, +(prev + (Math.random() - 0.5) * 0.1).toFixed(2))));
      setHailoUtil(prev => Math.min(100, Math.max(0, Math.round(prev + (Math.random() - 0.5) * 4))));
    }, 3000);
    return () => clearInterval(statInterval);
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (isRecording) {
      timerInterval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= 15) {
            finishRecording();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isRecording]);

  const log = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`]);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ip = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedCamera(ip);
    setActiveCamName(name);
    setStreamUrl(`/cam-proxy/${ip}/cam/0?t=${Date.now()}`);
    log(`Optical feed established: ${name}`);
  };

  const startRecording = async () => {
    if (!selectedCamera) {
      log("No active optical stream selected.");
      return;
    }

    log(`Initiating remote ingest on ${activeCamName}...`);
    setIsRecording(true);
    setElapsedSeconds(0);

    try {
      await fetch(`http://${window.location.hostname}:8090/api/argus/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: selectedCamera, port: 8081, name: activeCamName.split(' ')[0] })
      });
    } catch (err: any) {
      log(`API Error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    finishRecording();
    log("Ingest manually halted early.");
  };

  const finishRecording = () => {
    setIsRecording(false);
    setElapsedSeconds(0);
    log("Stack captured and saved to Media Vault.");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Run Hailo Inference Simulation
  const triggerInference = () => {
    setIsInferenceRunning(true);
    setDetectedObjects([]);
    setInferenceTime(null);
    log(`[HAILO-10H] Allocating PCIe buffers for ${selectedModel}.hef...`);
    log(`[HAILO-10H] Running model compiler optimization pipeline (Conf: ${confThreshold}, NMS: ${nmsThreshold})`);

    setTimeout(() => {
      // Simulate inference calculation
      const baseLatency = selectedModel === 'yolov8s' ? 4.2 : selectedModel === 'resnet50' ? 2.8 : selectedModel === 'fastsam' ? 12.5 : 6.4;
      const actualLatency = +(baseLatency + Math.random() * 0.4).toFixed(2);
      setInferenceTime(actualLatency);
      setIsInferenceRunning(false);

      // Filter based on confidence threshold
      const sceneData = SCENES[selectedScene];
      const filtered = sceneData.objects.filter(obj => obj.confidence >= confThreshold);
      setDetectedObjects(filtered);

      log(`[HAILO-10H] Inference complete in ${actualLatency}ms. Detected ${filtered.length} targets.`);
      filtered.forEach(o => {
        log(`  [+] Object: ${o.label} | Confidence: ${(o.confidence * 100).toFixed(1)}%`);
      });
    }, 1200);
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl bg-[#070b14] border border-white/5 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{ 
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.08), transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.08), transparent 40%)' 
      }}></div>

      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center shrink-0 z-10 bg-[#090f1e]/40 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-purple-500 font-mono tracking-wider">OPTICAL INGEST CONSOLE</span>
            <span className="text-[10px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] px-2 py-0.5 rounded border border-[#38bdf8]/20 uppercase tracking-widest">
              HAILO COPROCESSOR ACTIVE
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Sovereign Direct-to-Disk DVR & Edge-AI Pipeline</p>
        </div>
        <div className="flex gap-1.5 bg-[#03060b] border border-white/10 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('hailo')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'hailo' 
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20 shadow-md shadow-black/40' 
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            HAILO AI ACCELERATOR
          </button>
          <button 
            onClick={() => setActiveTab('dvr')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'dvr' 
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/20 shadow-md shadow-black/40' 
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            DIRECT WEBCAM DVR
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 p-6 z-10 overflow-y-auto">
        
        {/* Left Side Viewport */}
        <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
          {activeTab === 'dvr' ? (
            // DIRECT WEBCAM DVR STREAM
            <div className="flex-1 relative bg-black/60 border border-white/5 shadow-2xl rounded-xl overflow-hidden aspect-video flex flex-col justify-center items-center">
              {streamUrl ? (
                <img src={streamUrl} className="w-full h-full object-cover z-0" alt="Webcam Ingest Feed" />
              ) : (
                <div className="text-center font-mono text-xs text-slate-500 flex flex-col items-center gap-3">
                  <Camera className="w-8 h-8 text-[#38bdf8]/40 animate-pulse" />
                  <span>AWAITING DIRECT OPTICAL DEPLOYMENT STACK</span>
                </div>
              )}
              {/* Scanlines overlay */}
              <div className="absolute inset-0 pointer-events-none z-10" style={{ 
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%)', 
                backgroundSize: '100% 4px' 
              }}></div>
              
              {/* Overlay Corners */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20 pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20 pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20 pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20 pointer-events-none"></div>

              {isRecording && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded border border-red-500/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse"></div>
                  <span className="font-mono font-bold text-[#ef4444] text-[10px] tracking-widest">REC {formatTimer(elapsedSeconds)}</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 z-20 font-mono text-[9px] text-[#38bdf8]/60 uppercase tracking-widest">
                DIRECT_PORT // {activeCamName || 'DISCONNECTED'}
              </div>
            </div>
          ) : (
            // HAILO COPROCESSOR VIEW
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative flex-1 bg-black/60 border border-[#38bdf8]/10 shadow-2xl rounded-xl overflow-hidden flex flex-col justify-center items-center group">
                {/* Background image container */}
                <div className="w-full h-full relative aspect-video bg-cover bg-center transition-all duration-300" style={{ 
                  backgroundImage: `url(${SCENES[selectedScene].bgUrl})` 
                }}>
                  {/* Scanning line animation */}
                  {isInferenceRunning && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_12px_#38bdf8] z-20 animate-scan"></div>
                  )}

                  {/* Glassmorphic filter while scanning */}
                  {isInferenceRunning && (
                    <div className="absolute inset-0 bg-[#070b14]/30 backdrop-blur-[1px] z-10 transition-all"></div>
                  )}

                  {/* Render bounding boxes */}
                  {showOverlays && detectedObjects.map((obj, i) => (
                    <div
                      key={i}
                      className="absolute border-2 border-[#00b4d8] bg-[#00b4d8]/5 shadow-[0_0_8px_rgba(0,180,216,0.4)] group/box rounded transition-all duration-300 flex flex-col"
                      style={{
                        left: `${obj.x}%`,
                        top: `${obj.y}%`,
                        width: `${obj.w}%`,
                        height: `${obj.h}%`
                      }}
                    >
                      {/* Label badge */}
                      <div className="absolute top-0 left-0 -translate-y-full bg-[#00b4d8] text-[#070b14] text-[9px] font-mono font-bold px-1.5 py-0.5 flex items-center gap-1 shadow-md select-none rounded-t">
                        <span>{obj.label}</span>
                        <span className="opacity-80">{(obj.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {/* Interactive metadata details */}
                      <div className="hidden group-hover/box:flex absolute inset-0 bg-[#070b14]/80 backdrop-blur-sm p-2 flex-col justify-between overflow-hidden text-[9px] font-mono text-slate-300 pointer-events-none">
                        <div>
                          <div className="text-white font-bold">{obj.label}</div>
                          <div className="text-slate-400 mt-0.5">X: {obj.x}%, Y: {obj.y}%</div>
                          <div className="text-slate-400">W: {obj.w}%, H: {obj.h}%</div>
                        </div>
                        <div className="text-[#38bdf8] font-bold">Conf: {(obj.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inference time badge overlay */}
                {inferenceTime !== null && !isInferenceRunning && (
                  <div className="absolute bottom-4 right-4 bg-[#090f1f]/90 border border-[#38bdf8]/30 px-3 py-1.5 rounded-lg z-20 font-mono text-[10px] text-[#38bdf8] shadow-lg flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
                    <span>Inference Speed: <strong>{inferenceTime} ms</strong></span>
                  </div>
                )}
              </div>

              {/* Scene picker select items */}
              <div className="flex gap-3 justify-center">
                {Object.values(SCENES).map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setSelectedScene(scene.id);
                      setDetectedObjects([]);
                      setInferenceTime(null);
                      log(`Swapped target input scene to: ${scene.name}`);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                      selectedScene === scene.id
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8]'
                        : 'bg-[#090f1f]/50 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Control Sidecar */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          {activeTab === 'dvr' ? (
            // DVR CONTROLS
            <div className="bg-[#090f1e]/40 border border-white/5 rounded-xl p-5 flex flex-col gap-5 flex-1 shadow-lg">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Select DVR Target Node</h3>
                <div className="relative">
                  <select 
                    value={selectedCamera} 
                    onChange={handleCameraChange} 
                    className="w-full bg-[#03060c] border border-white/10 text-xs text-white rounded-lg p-2.5 font-mono outline-none focus:border-[#38bdf8]/60 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Network Node...</option>
                    <option value="argo">Argo (Pi 5 Sandbox)</option>
                    <option value="clio">Clio (Local Laptop)</option>
                    <option value="hobbes">Hobbes (Office Desktop)</option>
                    <option value="calvin">Calvin (Pi 4 Node)</option>
                    <option value="mando">Mando (Relay Node)</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Ingest Control Deck</h3>
                {!isRecording ? (
                  <button 
                    onClick={startRecording} 
                    className="w-full bg-[#38bdf8]/15 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] font-bold font-mono py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current text-[#38bdf8]" />
                    START STREAM DVR
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording} 
                    className="w-full bg-red-500/15 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold font-mono py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    HALT STREAM DVR
                  </button>
                )}
              </div>
            </div>
          ) : (
            // HAILO ACCELERATOR CONTROLS & STATS
            <div className="bg-[#090f1e]/40 border border-white/5 rounded-xl p-5 flex flex-col gap-5 flex-1 shadow-lg justify-between">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Accelerator Model</h3>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      log(`Swapped loaded model file to: ${e.target.value}.hef`);
                    }}
                    className="w-full bg-[#03060c] border border-white/10 text-xs text-white rounded-lg p-2.5 font-mono outline-none focus:border-[#38bdf8]/60 transition-all cursor-pointer"
                  >
                    <option value="yolov8s">Yolov8s (Object Detection)</option>
                    <option value="resnet50">ResNet50 (Classification)</option>
                    <option value="fastsam">FastSAM (Instance Segment)</option>
                    <option value="yolov8-pose">Yolov8-Pose (Pose Tracking)</option>
                  </select>
                </div>

                {/* Confidence threshold slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conf Threshold</span>
                    <span className="text-xs font-mono font-bold text-[#38bdf8]">{Math.round(confThreshold * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={confThreshold}
                    onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#38bdf8] bg-[#03060b] h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* NMS Threshold slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NMS Threshold</span>
                    <span className="text-xs font-mono font-bold text-[#38bdf8]">{nmsThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={nmsThreshold}
                    onChange={(e) => setNmsThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#38bdf8] bg-[#03060b] h-1 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Toggle Show Overlays */}
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Draw Bounding Boxes</span>
                  <input 
                    type="checkbox" 
                    checked={showOverlays} 
                    onChange={(e) => setShowOverlays(e.target.checked)} 
                    className="w-4 h-4 rounded border-white/10 bg-[#03060c] text-[#38bdf8] focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Trigger Inference button */}
                <button
                  onClick={triggerInference}
                  disabled={isInferenceRunning}
                  className="w-full mt-2 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 disabled:border-slate-800 disabled:bg-slate-900/40 disabled:text-slate-600 text-[#38bdf8] font-bold font-mono py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isInferenceRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8]" />
                      RUNNING INFERENCE...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-[#38bdf8]" />
                      EXECUTE HAILO PIPELINE
                    </>
                  )}
                </button>
              </div>

              {/* Accelerator metrics cards */}
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                  HAILO HARDWARE TELEMETRY
                </h4>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="bg-[#03060b]/80 border border-white/5 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-500 uppercase">Core Temp</div>
                    <div className="text-xs text-white font-bold mt-0.5">{coreTemp} °C</div>
                  </div>
                  <div className="bg-[#03060b]/80 border border-white/5 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-500 uppercase">Hat Power</div>
                    <div className="text-xs text-[#38bdf8] font-bold mt-0.5">{powerConsumption} W</div>
                  </div>
                  <div className="bg-[#03060b]/80 border border-white/5 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-500 uppercase">Pi PCIe Link</div>
                    <div className="text-xs text-[#22c55e] font-bold mt-0.5">Gen 2 x1</div>
                  </div>
                  <div className="bg-[#03060b]/80 border border-white/5 p-2 rounded-lg">
                    <div className="text-[8px] text-slate-500 uppercase">Hat Load</div>
                    <div className="text-xs text-purple-400 font-bold mt-0.5">{hailoUtil} %</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terminal log panel */}
      <footer className="h-32 border-t border-white/5 bg-[#03060b]/60 backdrop-blur-md p-4 flex flex-col gap-1.5 shrink-0 z-10">
        <h3 className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Terminal className="w-3 h-3 text-slate-500 animate-pulse" />
          Ingress Logs // sovereign-tmi-stdout.log
        </h3>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-400 flex flex-col gap-1 select-text scrollbar-thin scrollbar-thumb-white/5">
          {logs.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">{l}</div>
          ))}
        </div>
      </footer>
    </div>
  );
}
