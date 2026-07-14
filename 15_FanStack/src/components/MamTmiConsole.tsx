import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Image as ImageIcon, Trash2, Plus, Play, Pause, 
  Target, Sliders, Activity, RefreshCw, Layers, Check, AlertCircle, Pin
} from 'lucide-react';
import { getApiHost } from '../api-host';

interface MediaAsset {
  asset_id: string;
  file_path: string;
  mime_type: string;
  created_at: string;
  metadata: {
    size_bytes?: number;
    md5?: string;
    sha256?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface TmiRule {
  rule_id: string;
  condition: string;
  conditions_json?: string;
  action: string;
  target_asset_type: string;
  active_status: number;
}

interface MediaPin {
  pin_id: string;
  asset_id: string;
  pos_x: number;
  pos_y: number;
  timestamp: number;
  label?: string;
}

export default function MamTmiConsole() {
  // Core states
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [rules, setRules] = useState<TmiRule[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [pins, setPins] = useState<MediaPin[]>([]);
  
  const [activeTab, setActiveTab] = useState<'assets' | 'rules' | 'pins'>('assets');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Rule Form States
  const [ruleId, setRuleId] = useState('');
  const [ruleCondition, setRuleCondition] = useState('');
  const [ruleConditionsJson, setRuleConditionsJson] = useState('');
  const [ruleAction, setRuleAction] = useState('trigger_highlight');
  const [ruleTargetAssetType, setRuleTargetAssetType] = useState('video/mp4');

  // Pin Form States
  const [pinLabel, setPinLabel] = useState('');
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);
  const [videoTime, setVideoTime] = useState<number>(0);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  // Fetch functions
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (e) {
      console.error("Failed to fetch assets", e);
    }
    setLoading(false);
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/rules`);
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error("Failed to fetch rules", e);
    }
  };

  const fetchPins = async (assetId?: string) => {
    try {
      const url = assetId 
        ? `${getApiHost(8090)}/api/mam/pins?asset_id=${assetId}`
        : `${getApiHost(8090)}/api/mam/pins`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPins(data);
      }
    } catch (e) {
      console.error("Failed to fetch pins", e);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchRules();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      fetchPins(selectedAsset.asset_id);
      setTempCoords(null);
    } else {
      setPins([]);
    }
  }, [selectedAsset]);

  // Asset handlers
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset from catalog?")) return;
    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/assets/${assetId}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Asset deleted successfully");
        if (selectedAsset?.asset_id === assetId) {
          setSelectedAsset(null);
        }
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Rule templates
  const applyRuleTemplate = (type: string) => {
    if (type === 'high_velocity') {
      setRuleCondition('telemetry.velocity_kph > 120');
      setRuleConditionsJson(JSON.stringify({
        "and": [
          { ">": [{ "var": "telemetry.velocity_kph" }, 120] }
        ]
      }, null, 2));
      setRuleAction('trigger_highlight');
      setRuleTargetAssetType('high_speed_camera');
    } else if (type === 'homerun') {
      setRuleCondition('event_type == home_run');
      setRuleConditionsJson(JSON.stringify({
        "and": [
          { "==": [{ "var": "event_type" }, "home_run"] }
        ]
      }, null, 2));
      setRuleAction('broadcast_overlay');
      setRuleTargetAssetType('celebration_media');
    } else if (type === 'strikeout') {
      setRuleCondition('strikes == 3');
      setRuleConditionsJson(JSON.stringify({
        "and": [
          { "==": [{ "var": "strikes" }, 3] }
        ]
      }, null, 2));
      setRuleAction('sound_effect');
      setRuleTargetAssetType('gong_audio');
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCondition || !ruleAction || !ruleTargetAssetType) return;
    
    let jsonString = ruleConditionsJson;
    if (!jsonString) {
      // Auto-compile simple condition to JSON logic if possible
      jsonString = JSON.stringify({ "and": [] });
    }

    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: ruleId || undefined,
          condition: ruleCondition,
          conditions_json: jsonString,
          action: ruleAction,
          target_asset_type: ruleTargetAssetType,
          active_status: 1
        })
      });

      if (res.ok) {
        showSuccess("Rule saved successfully");
        setRuleId('');
        setRuleCondition('');
        setRuleConditionsJson('');
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/rules/${ruleId}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Rule deleted successfully");
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Pin handlers
  const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !selectedAsset) return;
    const rect = mediaRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Store localized coords
    setTempCoords({ x, y });
    
    if (selectedAsset.mime_type.startsWith('video/') && videoElementRef.current) {
      setVideoTime(Math.floor(videoElementRef.current.currentTime));
    } else {
      setVideoTime(0);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !tempCoords) return;

    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAsset.asset_id,
          pos_x: parseFloat(tempCoords.x.toFixed(4)),
          pos_y: parseFloat(tempCoords.y.toFixed(4)),
          timestamp: videoTime,
          label: pinLabel || "Annotation Point"
        })
      });

      if (res.ok) {
        showSuccess("Pin annotation created");
        setPinLabel('');
        setTempCoords(null);
        fetchPins(selectedAsset.asset_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      const res = await fetch(`${getApiHost(8090)}/api/mam/pins/${pinId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPins(selectedAsset?.asset_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Helper to extract file name from path
  const getFileName = (path: string) => {
    return path.substring(path.lastIndexOf('/') + 1);
  };

  return (
    <div className="flex w-full h-[85vh] bg-[#0b0d13] text-white rounded-xl overflow-hidden border border-[#00b4d8]/20 font-sans shadow-2xl relative">
      
      {/* Sidebar navigation */}
      <div className="w-64 border-r border-[#00b4d8]/10 flex flex-col bg-[#0f121d]">
        <div className="p-5 border-b border-[#00b4d8]/10 flex justify-between items-center bg-[#00b4d8]/5">
          <div className="flex items-center gap-3">
            <Sliders className="text-[#00b4d8] w-6 h-6 animate-pulse" />
            <h2 className="font-bold text-sm tracking-widest text-[#00b4d8] uppercase">MAM & TMI</h2>
          </div>
          <button onClick={fetchAssets} className="text-[#00b4d8] hover:text-[#00b4d8]/70 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('assets')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              activeTab === 'assets'
                ? 'bg-[#00b4d8]/20 border border-[#00b4d8]/40 text-[#00b4d8]'
                : 'text-slate-400 hover:bg-[#00b4d8]/5 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Media Assets
          </button>
          
          <button
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              activeTab === 'rules'
                ? 'bg-[#00b4d8]/20 border border-[#00b4d8]/40 text-[#00b4d8]'
                : 'text-slate-400 hover:bg-[#00b4d8]/5 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Telemetry Rules
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              activeTab === 'pins'
                ? 'bg-[#00b4d8]/20 border border-[#00b4d8]/40 text-[#00b4d8]'
                : 'text-slate-400 hover:bg-[#00b4d8]/5 hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
            Pin Annotation
          </button>
        </nav>

        {selectedAsset && (
          <div className="p-4 border-t border-[#00b4d8]/10 bg-[#00b4d8]/5 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#00b4d8]">Active Asset</div>
            <div className="text-xs truncate font-medium text-slate-300">{getFileName(selectedAsset.file_path)}</div>
            <button 
              onClick={() => setSelectedAsset(null)}
              className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="flex-1 flex flex-col bg-[#07080c]/50 overflow-y-auto p-8 relative">
        {successMsg && (
          <div className="absolute top-4 right-4 bg-teal-500/90 text-white font-semibold text-xs px-4 py-2 rounded-lg border border-teal-400 shadow-lg flex items-center gap-2 z-50 animate-bounce">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00b4d8]/10 pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Media Assets Catalog</h1>
                <p className="text-slate-400 text-xs mt-1">Files automatically indexed by Ingress Watchdog</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => {
                const isImage = asset.mime_type.startsWith('image/');
                const isVideo = asset.mime_type.startsWith('video/');
                
                return (
                  <div 
                    key={asset.asset_id}
                    className={`bg-[#0f121d]/80 rounded-xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                      selectedAsset?.asset_id === asset.asset_id 
                        ? 'border-[#00b4d8] shadow-[0_0_15px_rgba(0,180,216,0.3)] bg-[#00b4d8]/5' 
                        : 'border-[#00b4d8]/10 hover:border-[#00b4d8]/30 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isImage ? 'bg-[#00b4d8]/15 text-[#00b4d8]' : 'bg-[#00b4d8]/15 text-[#00b4d8]'}`}>
                            {isImage ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-wide truncate max-w-[150px]" title={getFileName(asset.file_path)}>
                              {getFileName(asset.file_path)}
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block mt-0.5">{asset.mime_type}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteAsset(asset.asset_id)}
                          className="text-red-400/70 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Display meta details */}
                      <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-black/30 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Size:</span>
                          <span>{asset.metadata.size_bytes ? `${(asset.metadata.size_bytes / 1024).toFixed(1)} KB` : 'N/A'}</span>
                        </div>
                        {(asset.metadata.width && asset.metadata.height) ? (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dim:</span>
                            <span>{asset.metadata.width}x{asset.metadata.height}</span>
                          </div>
                        ) : null}
                        {asset.metadata.duration ? (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dur:</span>
                            <span>{asset.metadata.duration.toFixed(2)}s</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                          <span className="text-slate-500">MD5:</span>
                          <span className="text-[9px] text-[#00b4d8]/70 truncate max-w-[120px]" title={asset.metadata.md5}>{asset.metadata.md5}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-1 border-t border-[#00b4d8]/5 bg-black/10 flex gap-2">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border border-[#00b4d8]/40 hover:border-[#00b4d8] hover:bg-[#00b4d8]/10 text-[#00b4d8] rounded-lg transition-all"
                      >
                        Select for Pins
                      </button>
                    </div>
                  </div>
                );
              })}

              {assets.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-500 border border-dashed border-[#00b4d8]/20 rounded-xl bg-[#0f121d]/30">
                  <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="font-semibold text-sm">No Assets Found</p>
                  <p className="text-xs text-slate-600 mt-1">Place media files into sovereign_inbox/media_drop/ folder</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-[#00b4d8]/10 pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">TMI Rule Condition Builder</h1>
                <p className="text-slate-400 text-xs mt-1">Configure logic node expressions to trigger overlays</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rules List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#00b4d8]">Stored Rules</h3>
                
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div 
                      key={rule.rule_id} 
                      className="bg-[#0f121d]/80 border border-[#00b4d8]/10 hover:border-[#00b4d8]/30 rounded-xl p-5 flex justify-between items-start transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#00b4d8]/15 border border-[#00b4d8]/30 text-[#00b4d8] text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                            {rule.rule_id}
                          </span>
                          <span className="text-xs text-slate-500">MAM Target: <strong className="text-[#00b4d8] font-mono">{rule.target_asset_type}</strong></span>
                        </div>
                        
                        <div className="text-xs font-semibold text-slate-300">
                          Condition: <code className="bg-black/40 border border-white/5 px-2 py-1 rounded text-red-400 font-mono text-[11px] ml-1">{rule.condition}</code>
                        </div>

                        <div className="text-xs font-semibold text-slate-300">
                          Action: <span className="text-teal-400 font-mono text-[11px] ml-1">{rule.action}</span>
                        </div>

                        {rule.conditions_json && (
                          <details className="text-[10px] text-slate-500 font-mono mt-1">
                            <summary className="cursor-pointer hover:text-slate-400">View Logical Structure</summary>
                            <pre className="mt-2 bg-black/50 p-3 rounded-lg max-h-40 overflow-y-auto border border-white/5">{rule.conditions_json}</pre>
                          </details>
                        )}
                      </div>

                      <button 
                        onClick={() => handleDeleteRule(rule.rule_id)}
                        className="text-red-400/70 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {rules.length === 0 && (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-[#00b4d8]/10 rounded-xl bg-[#0f121d]/10">
                      <Sliders className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="font-semibold text-xs">No Telemetry Rules Configured</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules Form */}
              <div className="bg-[#0f121d]/90 border border-[#00b4d8]/20 rounded-xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00b4d8] to-transparent"></div>
                <h3 className="text-sm font-bold text-[#00b4d8] uppercase tracking-wider">New Telemetry Rule</h3>

                {/* Templates Quick-select */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Templates</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => applyRuleTemplate('high_velocity')}
                      className="py-1 px-2 border border-[#00b4d8]/30 hover:border-[#00b4d8] text-[9px] font-semibold text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded transition-colors text-center"
                    >
                      Velocity &gt; 120
                    </button>
                    <button 
                      onClick={() => applyRuleTemplate('homerun')}
                      className="py-1 px-2 border border-[#00b4d8]/30 hover:border-[#00b4d8] text-[9px] font-semibold text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded transition-colors text-center"
                    >
                      Home Run Event
                    </button>
                    <button 
                      onClick={() => applyRuleTemplate('strikeout')}
                      className="py-1 px-2 border border-[#00b4d8]/30 hover:border-[#00b4d8] text-[9px] font-semibold text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded transition-colors text-center"
                    >
                      Strikeout
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rule ID (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. RULE-VEL-001" 
                      value={ruleId}
                      onChange={(e) => setRuleId(e.target.value)}
                      className="w-full bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Simple Condition</label>
                    <input 
                      type="text" 
                      placeholder="e.g. telemetry.velocity_kph > 120" 
                      value={ruleCondition}
                      onChange={(e) => setRuleCondition(e.target.value)}
                      className="w-full bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Conditions JSON (JSON Logic)</label>
                    <textarea 
                      placeholder="Nested recursive logical structure..." 
                      value={ruleConditionsJson}
                      onChange={(e) => setRuleConditionsJson(e.target.value)}
                      className="w-full h-36 bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-white font-mono text-[10px] no-scrollbar"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Asset Type / Substring</label>
                    <input 
                      type="text" 
                      placeholder="e.g. high_speed_camera, video/mp4" 
                      value={ruleTargetAssetType}
                      onChange={(e) => setRuleTargetAssetType(e.target.value)}
                      className="w-full bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Action Trigger</label>
                    <select 
                      value={ruleAction} 
                      onChange={(e) => setRuleAction(e.target.value)}
                      className="w-full bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-white"
                    >
                      <option value="trigger_highlight">Trigger Highlight overlay</option>
                      <option value="broadcast_overlay">Broadcast full-screen overlay</option>
                      <option value="sound_effect">Play Sound Effect</option>
                      <option value="custom_action">Custom Media Event</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-[#07080c] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Save Telemetry Rule
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#00b4d8]/10 pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Interactive Pin Annotation Engine</h1>
                <p className="text-slate-400 text-xs mt-1">Select an asset from the catalog first, then click on the media canvas to drop spatial annotations.</p>
              </div>
            </div>

            {selectedAsset ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Media Canvas & Overlay */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center bg-[#0f121d] p-3 rounded-lg border border-[#00b4d8]/10">
                    <span className="text-xs text-[#00b4d8] font-bold uppercase tracking-wider">Media Viewport</span>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedAsset.mime_type}</span>
                  </div>

                  <div 
                    ref={mediaRef}
                    onClick={handleMediaClick}
                    className="relative bg-black border border-[#00b4d8]/20 rounded-xl overflow-hidden cursor-crosshair flex items-center justify-center min-h-[300px] max-h-[500px]"
                  >
                    {selectedAsset.mime_type.startsWith('image/') ? (
                      <img 
                        src={`${getApiHost(8090)}/inbox/media_drop/${getFileName(selectedAsset.file_path)}`}
                        alt="Asset preview"
                        className="max-w-full max-h-full object-contain pointer-events-none"
                      />
                    ) : selectedAsset.mime_type.startsWith('video/') ? (
                      <video 
                        ref={videoElementRef}
                        src={`${getApiHost(8090)}/inbox/media_drop/${getFileName(selectedAsset.file_path)}`}
                        controls
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <div className="text-center text-slate-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-700" />
                        No preview support for this file type
                      </div>
                    )}

                    {/* Render saved pins */}
                    {pins.map((pin) => (
                      <div
                        key={pin.pin_id}
                        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg group pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform"
                        style={{ left: `${pin.pos_x * 100}%`, top: `${pin.pos_y * 100}%` }}
                        title={pin.label}
                      >
                        <div className="hidden group-hover:block absolute bottom-6 bg-slate-900 border border-[#00b4d8]/50 text-white font-mono text-[9px] px-2 py-1 rounded whitespace-nowrap shadow-2xl z-50">
                          {pin.label} {pin.timestamp > 0 ? `(${pin.timestamp}s)` : ''}
                        </div>
                      </div>
                    ))}

                    {/* Temporary pin coords selector */}
                    {tempCoords && (
                      <div 
                        className="absolute w-5 h-5 bg-[#00b4d8] border-2 border-white rounded-full animate-ping pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${tempCoords.x * 100}%`, top: `${tempCoords.y * 100}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Pin Annotations Panel */}
                <div className="space-y-6">
                  {tempCoords ? (
                    <div className="bg-[#0f121d]/90 border border-[#00b4d8]/30 rounded-xl p-5 space-y-4 shadow-xl">
                      <h3 className="text-xs uppercase font-bold tracking-widest text-[#00b4d8]">Place Pin</h3>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Coordinates: X: {tempCoords.x.toFixed(3)}, Y: {tempCoords.y.toFixed(3)}
                        {selectedAsset.mime_type.startsWith('video/') && ` | Time: ${videoTime}s`}
                      </div>

                      <form onSubmit={handleSavePin} className="space-y-3">
                        <input 
                          type="text"
                          placeholder="Label (e.g. Batter contact, Ball release)"
                          value={pinLabel}
                          onChange={(e) => setPinLabel(e.target.value)}
                          className="w-full bg-[#07080c] border border-[#00b4d8]/20 focus:border-[#00b4d8] focus:outline-none p-2.5 rounded text-xs text-white"
                          required
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTempCoords(null)}
                            className="flex-1 py-2 border border-slate-600 hover:border-slate-500 text-xs font-bold text-slate-300 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-[#07080c] text-xs font-bold rounded-lg transition-colors"
                          >
                            Confirm Pin
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-[#0f121d]/40 border border-dashed border-[#00b4d8]/10 rounded-xl p-5 text-center text-slate-500 text-xs py-8">
                      <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      Click on the media window to create a spatial pin annotation point.
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-[#00b4d8]">Annotations Index ({pins.length})</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                      {pins.map((pin) => (
                        <div 
                          key={pin.pin_id}
                          className="bg-[#0f121d]/80 border border-[#00b4d8]/10 rounded-lg p-3 flex justify-between items-center text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{pin.label}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              X: {pin.pos_x.toFixed(3)}, Y: {pin.pos_y.toFixed(3)}
                              {pin.timestamp > 0 ? ` | Time: ${pin.timestamp}s` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePin(pin.pin_id)}
                            className="text-red-400/80 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {pins.length === 0 && (
                        <div className="text-center py-6 text-slate-600 font-medium text-[11px]">
                          No annotations registered for this asset.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 border border-dashed border-[#00b4d8]/20 rounded-xl bg-[#0f121d]/30">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="font-semibold text-sm">Select an Asset First</p>
                <p className="text-xs text-slate-600 mt-1">Navigate to the Media Assets tab and select a file to open in the annotation console.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
