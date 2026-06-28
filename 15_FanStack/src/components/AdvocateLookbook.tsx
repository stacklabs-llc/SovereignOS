import React, { useState, useEffect, useCallback } from "react";
import { 
  User, Bot, Search, Save, X, RefreshCw, AlertTriangle, 
  ChevronDown, Download, FileText, Server, Plus, Upload, 
  Trash2, Edit, Printer, CheckSquare, Square, Eye, Check, Image as ImageIcon
} from "lucide-react";
import avatarMapData from '../avatarMap';

const avatarMap: Record<string, string> = avatarMapData;

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  SD: { primary: "#2F241D", secondary: "#FFC72C" },
  NYM: { primary: "#002D72", secondary: "#FF5910" },
  ATL: { primary: "#13274F", secondary: "#CE1141" },
  PHI: { primary: "#E81828", secondary: "#002D72" },
  STL: { primary: "#C41E3A", secondary: "#0C2340" },
  CHC: { primary: "#0E3386", secondary: "#CC3433" },
  BOS: { primary: "#BD3039", secondary: "#0C2340" },
  MIL: { primary: "#12284C", secondary: "#FFC52F" },
  SF: { primary: "#FD5A1E", secondary: "#27251F" },
  COL: { primary: "#333366", secondary: "#C4C4C4" },
  WSH: { primary: "#AB0003", secondary: "#142243" },
  BAL: { primary: "#DF4601", secondary: "#000000" },
  CLE: { primary: "#0C2340", secondary: "#E31937" },
  KC: { primary: "#004687", secondary: "#C09A5B" },
  AZ: { primary: "#A71930", secondary: "#30CED8" },
  LAA: { primary: "#BA0021", secondary: "#002D62" },
  CWS: { primary: "#000000", secondary: "#C4C4C4" },
  SEA: { primary: "#0C2C56", secondary: "#005C5C" },
  TEX: { primary: "#003278", secondary: "#C0111F" },
  HOU: { primary: "#002D62", secondary: "#EB6E1F" },
  TB: { primary: "#092C5C", secondary: "#8FBCE6" },
  CIN: { primary: "#C6011F", secondary: "#000000" },
  MIA: { primary: "#00A3E0", secondary: "#EF3E42" },
  NYY: { primary: "#0C2340", secondary: "#C4C4C4" },
  MIN: { primary: "#002B5C", secondary: "#D31145" },
  LAD: { primary: "#005A9C", secondary: "#A5ACAF" },
  TOR: { primary: "#134A8E", secondary: "#1D2D5C" },
  DET: { primary: "#0C2340", secondary: "#FA4616" },
  PIT: { primary: "#FDB827", secondary: "#000000" },
  OAK: { primary: "#003831", secondary: "#EFB21E" },
  GLOBAL: { primary: "#0284c7", secondary: "#334155" },
};

const VM = {
  bg:       "#05080e",
  surface:  "#0b111a",
  card:     "#0f1726",
  border:   "#1e293b",
  orange:   "#FF5910",
  emerald:  "#00FF88",
  blue:     "#00d4ff",
  gold:     "#E0BC68",
  text:     "#cbd5e1",
  muted:    "#64748b",
  danger:   "#ef4444",
  fontHead: "'Outfit', sans-serif",
  fontMono: "monospace",
  fontBody: "'Inter', sans-serif",
} as const;

interface AiPersona {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string | null;
  title: string;
  introduction: string;
  city: string;
  department: string;
  active: number;
  sys_created_on: string;
  sys_updated_on: string;
  u_system_prompt?: string;
  u_cadence?: string;
  u_deployment_zone?: string;
  assigned_to?: string;
  u_visual_style?: string;
  u_boggs_reactivity?: number;
}

interface MediaAsset {
  sys_id: string;
  advocate: string;
  expression: string;
  file_path: string;
  sha256: string;
  category: string;
  name: string;
  mime_type: string;
}

export default function AdvocateLookbook() {
  const [advocates, setAdvocates] = useState<AiPersona[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<AiPersona | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Media library state
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaTab, setMediaTab] = useState<"All" | "Adventures" | "Raw Photos" | "Concept Art">("All");
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Form edit states
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadExpr, setUploadExpr] = useState("");
  const [uploadCat, setUploadCat] = useState("Concept Art");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Inline edit state for expressions
  const [editingExprAsset, setEditingExprAsset] = useState<MediaAsset | null>(null);
  const [editExprVal, setEditExprVal] = useState("");
  const [editCatVal, setEditCatVal] = useState("");

  const loadAdvocates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/now/table/cmdb_ci_ai_persona");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: AiPersona[] = data.result ?? [];
      setAdvocates(list);
      
      // Auto-select metsy or the first advocate
      const metsy = list.find(a => a.user_name.toLowerCase() === "metsy" || a.user_name.toLowerCase() === "metsy_smyrna");
      if (metsy) {
        handleSelectAdvocate(metsy);
      } else if (list.length > 0) {
        handleSelectAdvocate(list[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load advocates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdvocates();
  }, [loadAdvocates]);

  const loadMedia = async (username: string) => {
    setLoadingMedia(true);
    setSelectedMediaIds(new Set());
    try {
      const res = await fetch(`/api/media/assets/${username}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMediaAssets(data.assets || []);
    } catch (err) {
      console.error("Failed to load media assets", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSelectAdvocate = (adv: AiPersona) => {
    setSelectedAdvocate(adv);
    setEditForm({ ...adv });
    loadMedia(adv.user_name.toLowerCase().replace(" ", "_"));
  };

  const handleSaveAdvocate = async () => {
    if (!editForm || !selectedAdvocate) return;
    setIsSaving(true);
    try {
      const isNew = selectedAdvocate.sys_id.startsWith("NEW_");
      const url = isNew 
        ? "/api/now/table/cmdb_ci_ai_persona" 
        : `/api/now/table/cmdb_ci_ai_persona/${selectedAdvocate.sys_id}`;
      
      const payload = { ...editForm };
      if (isNew) {
        delete payload.sys_id;
        delete payload.sys_created_on;
        delete payload.sys_updated_on;
      }

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadAdvocates();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedAdvocate) return;
    setIsUploading(true);
    setUploadError(null);

    const advName = selectedAdvocate.user_name.toLowerCase().replace(" ", "_");
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (uploadExpr.trim()) {
      formData.append("expression", uploadExpr.trim());
    }
    formData.append("category", uploadCat);

    try {
      const res = await fetch(`/api/media/assets/${advName}/upload`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.detail || `HTTP ${res.status}`);
      }
      setUploadFile(null);
      setUploadExpr("");
      await loadMedia(advName);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateExpression = async (asset: MediaAsset) => {
    if (!editExprVal.trim()) return;
    try {
      const res = await fetch(`/api/media/assets/expression/${asset.sys_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression: editExprVal.trim(),
          category: editCatVal
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditingExprAsset(null);
      if (selectedAdvocate) {
        await loadMedia(selectedAdvocate.user_name.toLowerCase().replace(" ", "_"));
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteExpression = async (sys_id: string) => {
    if (!confirm("Are you sure you want to delete this lookbook expression asset?")) return;
    try {
      const res = await fetch(`/api/media/assets/expression/${sys_id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (selectedAdvocate) {
        await loadMedia(selectedAdvocate.user_name.toLowerCase().replace(" ", "_"));
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const toggleMediaSelection = (sys_id: string) => {
    const next = new Set(selectedMediaIds);
    if (next.has(sys_id)) {
      next.delete(sys_id);
    } else {
      next.add(sys_id);
    }
    setSelectedMediaIds(next);
  };

  const handlePrintPdf = () => {
    if (!selectedAdvocate) return;
    const adv = selectedAdvocate.user_name.toLowerCase().replace(" ", "_");
    let url = `/api/media/print_lookbook?advocate=${adv}`;
    if (selectedMediaIds.size > 0) {
      url += `&ids=${Array.from(selectedMediaIds).join(",")}`;
    }
    window.open(url, "_blank");
  };

  // Filtering advocates list
  const filteredAdvocates = advocates.filter(a => 
    (a.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.assigned_to || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtering media assets list by active tab
  const filteredMedia = mediaAssets.filter(asset => {
    if (mediaTab === "All") return true;
    return asset.category === mediaTab;
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 120px)",
      background: VM.bg,
      fontFamily: VM.fontBody,
      color: VM.text,
      overflow: "hidden",
      padding: "12px"
    }}>
      
      {/* Top action bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${VM.border}`,
        paddingBottom: "12px",
        marginBottom: "12px"
      }}>
        <div>
          <h2 style={{ fontFamily: VM.fontHead, fontSize: "1.5rem", color: VM.gold, margin: 0, fontWeight: "bold", letterSpacing: "0.05em" }}>
            Advocate Center
          </h2>
          <span style={{ fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted }}>
            /now/cmdb/advocates &amp; lookbook_vault
          </span>
        </div>
        <button 
          onClick={loadAdvocates} 
          style={{
            background: "rgba(0, 212, 255, 0.1)",
            border: `1px solid ${VM.blue}40`,
            borderRadius: "6px",
            color: VM.blue,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Sync System
        </button>
      </div>

      {/* Main split layout */}
      <div style={{
        display: "flex",
        flex: 1,
        gap: "16px",
        minHeight: 0
      }}>
        
        {/* Left Side: Advocates List Panel */}
        <div style={{
          width: "300px",
          background: VM.surface,
          border: `1px solid ${VM.border}`,
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Search bar */}
          <div style={{ padding: "12px", borderBottom: `1px solid ${VM.border}` }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,0,0,0.2)",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 10px"
            }}>
              <Search size={14} style={{ color: VM.muted }} />
              <input 
                type="text"
                placeholder="Search advocates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "0.8rem",
                  width: "100%"
                }}
              />
            </div>
          </div>

          {/* List area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }} className="custom-scrollbar">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px", fontSize: "0.8rem", color: VM.muted }}>
                Loading Advocates...
              </div>
            ) : filteredAdvocates.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", fontSize: "0.8rem", color: VM.muted }}>
                No advocates found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredAdvocates.map(adv => {
                  const isActive = adv.active === 1;
                  const isSelected = selectedAdvocate?.sys_id === adv.sys_id;
                  const avatarKey = adv.user_name.toLowerCase().replace(/[\s]/g, '_');
                  const avatarUrl = adv.u_visual_style === 'style_felt' 
                    ? `/avatars/${avatarKey}/metsy_lockdown_response.png`
                    : avatarMap[avatarKey] || `/api/persona_image/${avatarKey}`;
                  const teamColors = TEAM_COLORS[adv.assigned_to || "GLOBAL"] || { primary: "#0b111a", secondary: "#00d4ff" };

                  return (
                    <div 
                      key={adv.sys_id}
                      onClick={() => handleSelectAdvocate(adv)}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: isSelected ? "rgba(0, 212, 255, 0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? VM.blue : "transparent"}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <img 
                          src={avatarUrl}
                          alt={adv.user_name}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: `1px solid ${VM.border}`
                          }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${adv.user_name}&backgroundColor=0f172a&textColor=ffffff`; }}
                        />
                        <span style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: isActive ? VM.emerald : VM.danger,
                          border: `2px solid ${VM.surface}`
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {adv.first_name || adv.user_name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: VM.muted, display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: "3px", fontSize: "0.62rem" }}>
                            {adv.assigned_to || "GLOBAL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tabbed Forms / Media Library Panel */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          minWidth: 0,
          overflowY: "auto"
        }} className="custom-scrollbar">
          
          {selectedAdvocate && editForm ? (
            <>
              {/* Form card */}
              <div style={{
                background: VM.surface,
                border: `1px solid ${VM.border}`,
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: `1px solid ${VM.border}`, paddingBottom: "8px" }}>
                  <h3 style={{ fontFamily: VM.fontHead, fontSize: "1.1rem", color: VM.gold, margin: 0 }}>
                    Advocate Configuration ({editForm.user_name})
                  </h3>
                  <button 
                    onClick={handleSaveAdvocate}
                    disabled={isSaving}
                    style={{
                      background: VM.emerald,
                      border: "none",
                      color: "black",
                      borderRadius: "6px",
                      padding: "6px 16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Save size={14} />
                    {isSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>System Prompt</label>
                    <textarea 
                      value={editForm.u_system_prompt || ""}
                      onChange={e => setEditForm({ ...editForm, u_system_prompt: e.target.value })}
                      style={{ width: "100%", height: "80px", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "8px", fontSize: "0.8rem", resize: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>Deployment Zone / Room</label>
                      <input 
                        type="text" 
                        value={editForm.u_deployment_zone || ""}
                        onChange={e => setEditForm({ ...editForm, u_deployment_zone: e.target.value })}
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "0.8rem" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>Advocate Cadence</label>
                      <select 
                        value={editForm.u_cadence || "pacer"}
                        onChange={e => setEditForm({ ...editForm, u_cadence: e.target.value })}
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "0.8rem" }}
                      >
                        <option value="pacer">Pacer (Standard)</option>
                        <option value="lurker">Lurker (Quiet)</option>
                        <option value="agitator">Agitator (Frequent)</option>
                        <option value="reactant">Reactant (Event Only)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>Status</label>
                      <select 
                        value={editForm.active ?? "1"}
                        onChange={e => setEditForm({ ...editForm, active: parseInt(e.target.value) })}
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "0.8rem" }}
                      >
                        <option value="1">Active / Spawning</option>
                        <option value="0">Inactive / Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glowing Media Library panel */}
              <div style={{
                background: "rgba(11, 17, 26, 0.8)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${VM.border}`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 80px rgba(0, 212, 255, 0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                
                {/* Panel Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${VM.border}`, paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontFamily: VM.fontHead, fontSize: "1.2rem", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <ImageIcon size={18} style={{ color: VM.blue }} />
                      Lookbook &amp; Expression Vault
                    </h3>
                    <p style={{ fontSize: "0.7rem", color: VM.muted, margin: "4px 0 0 0" }}>
                      Upload and map visual avatars/staged actions to this advocate.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={handlePrintPdf}
                      style={{
                        background: "rgba(224, 188, 104, 0.1)",
                        border: `1px solid ${VM.gold}50`,
                        borderRadius: "6px",
                        color: VM.gold,
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Printer size={14} />
                      Print PDF Lookbook {selectedMediaIds.size > 0 ? `(${selectedMediaIds.size})` : "(All)"}
                    </button>
                  </div>
                </div>

                {/* Upload Section */}
                <form onSubmit={handleUpload} style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px dashed ${VM.border}`,
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <label style={{ display: "block", fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>Expression Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. soaked_in_rain"
                        value={uploadExpr}
                        onChange={e => setUploadExpr(e.target.value)}
                        style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "0.75rem" }}
                      />
                    </div>
                    <div style={{ width: "150px" }}>
                      <label style={{ display: "block", fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>Category</label>
                      <select
                        value={uploadCat}
                        onChange={e => setUploadCat(e.target.value)}
                        style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "0.75rem" }}
                      >
                        <option value="Concept Art">Concept Art</option>
                        <option value="Adventures">Adventures</option>
                        <option value="Raw Photos">Raw Photos</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={{ display: "block", fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", marginBottom: "4px" }}>File Attachment</label>
                      <input 
                        type="file"
                        accept="image/*,video/mp4"
                        onChange={e => {
                          if (e.target.files && e.target.files.length > 0) {
                            setUploadFile(e.target.files[0]);
                          }
                        }}
                        style={{ fontSize: "0.75rem", color: VM.muted }}
                      />
                    </div>
                  </div>
                  {uploadError && (
                    <div style={{ fontSize: "0.75rem", color: VM.danger, margin: 0 }}>
                      {uploadError}
                    </div>
                  )}
                  <button 
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    style={{
                      background: isUploading || !uploadFile ? "rgba(255,255,255,0.05)" : VM.blue,
                      border: "none",
                      color: isUploading || !uploadFile ? VM.muted : "black",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      cursor: isUploading || !uploadFile ? "not-allowed" : "pointer",
                      alignSelf: "flex-end",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Upload size={12} />
                    {isUploading ? "Uploading..." : "Upload & Register Expression"}
                  </button>
                </form>

                {/* Media Category Filters & Quick selections */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${VM.border}`, paddingBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["All", "Adventures", "Raw Photos", "Concept Art"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setMediaTab(tab)}
                        style={{
                          background: mediaTab === tab ? "rgba(0, 212, 255, 0.1)" : "transparent",
                          border: `1px solid ${mediaTab === tab ? VM.blue : "transparent"}`,
                          color: mediaTab === tab ? VM.blue : VM.muted,
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: VM.muted }}>
                    {selectedMediaIds.size > 0 ? (
                      <button 
                        onClick={() => setSelectedMediaIds(new Set())}
                        style={{ background: "none", border: "none", color: VM.blue, cursor: "pointer", fontSize: "0.72rem", textDecoration: "underline" }}
                      >
                        Clear Selection ({selectedMediaIds.size})
                      </button>
                    ) : (
                      <span>Select cards to print specific lookbooks</span>
                    )}
                  </div>
                </div>

                {/* Media grid */}
                {loadingMedia ? (
                  <div style={{ padding: "40px", textAlign: "center", color: VM.muted, fontSize: "0.8rem" }}>
                    Loading lookbook assets...
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: VM.muted, fontSize: "0.8rem", background: "rgba(0,0,0,0.1)", border: `1px solid ${VM.border}`, borderRadius: "8px" }}>
                    No media items registered in this category.
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: "12px"
                  }}>
                    {filteredMedia.map(asset => {
                      const isSelected = selectedMediaIds.has(asset.sys_id);
                      const isEditing = editingExprAsset?.sys_id === asset.sys_id;
                      const isVideo = asset.mime_type === 'video/mp4' || asset.file_path.endsWith('.mp4');

                      return (
                        <div 
                          key={asset.sys_id}
                          style={{
                            background: VM.surface,
                            border: `1px solid ${isSelected ? VM.blue : VM.border}`,
                            borderRadius: "8px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            transition: "all 0.2s",
                            boxShadow: isSelected ? `0 0 12px ${VM.blue}30` : "none"
                          }}
                        >
                          {/* Image Thumbnail / Video placeholder */}
                          <div style={{ height: "130px", width: "100%", background: "#000", position: "relative", overflow: "hidden" }}>
                            {isVideo ? (
                              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", justifyContent: "center", color: VM.gold }}>
                                <span style={{ fontSize: "2rem" }}>▶</span>
                                <span style={{ fontSize: "0.65rem", fontFamily: VM.fontMono, color: VM.muted }}>MP4 VIDEO</span>
                              </div>
                            ) : (
                              <img 
                                src={asset.file_path} 
                                alt={asset.expression} 
                                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                                onClick={() => setPreviewImage(asset.file_path)}
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${asset.expression}&backgroundColor=0f172a&textColor=ffffff`; }}
                              />
                            )}

                            {/* Checkbox overlay */}
                            <div 
                              onClick={() => toggleMediaSelection(asset.sys_id)}
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                cursor: "pointer",
                                color: isSelected ? VM.blue : "rgba(255,255,255,0.6)",
                                background: "rgba(0,0,0,0.5)",
                                borderRadius: "4px",
                                padding: "2px",
                                display: "flex"
                              }}
                            >
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>

                            {/* Category Badge overlay */}
                            <div style={{
                              position: "absolute",
                              bottom: "8px",
                              right: "8px",
                              background: "rgba(0,0,0,0.75)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "0.6rem",
                              color: VM.gold,
                              fontFamily: VM.fontMono
                            }}>
                              {asset.category}
                            </div>
                          </div>

                          {/* Info panel */}
                          <div style={{ padding: "10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <input 
                                  type="text" 
                                  value={editExprVal}
                                  onChange={e => setEditExprVal(e.target.value)}
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.blue}`, borderRadius: "4px", color: "#fff", padding: "4px", fontSize: "0.75rem" }}
                                />
                                <select
                                  value={editCatVal}
                                  onChange={e => setEditCatVal(e.target.value)}
                                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${VM.blue}`, borderRadius: "4px", color: "#fff", padding: "4px", fontSize: "0.75rem" }}
                                >
                                  <option value="Concept Art">Concept Art</option>
                                  <option value="Adventures">Adventures</option>
                                  <option value="Raw Photos">Raw Photos</option>
                                </select>
                                <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                  <button onClick={() => setEditingExprAsset(null)} style={{ background: "transparent", border: `1px solid ${VM.border}`, color: VM.muted, padding: "2px 6px", borderRadius: "3px", fontSize: "0.65rem", cursor: "pointer" }}>Cancel</button>
                                  <button onClick={() => handleUpdateExpression(asset)} style={{ background: VM.emerald, border: "none", color: "black", padding: "2px 6px", borderRadius: "3px", fontSize: "0.65rem", fontWeight: "bold", cursor: "pointer" }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "4px" }}>
                                      {asset.expression}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        setEditingExprAsset(asset);
                                        setEditExprVal(asset.expression);
                                        setEditCatVal(asset.category);
                                      }}
                                      style={{ background: "none", border: "none", color: VM.muted, cursor: "pointer", padding: "2px" }}
                                    >
                                      <Edit size={10} />
                                    </button>
                                  </div>
                                  <div style={{ fontSize: "0.62rem", fontFamily: VM.fontMono, color: VM.muted, marginTop: "4px", wordBreak: "break-all" }}>
                                    SHA256: {asset.sha256.substring(0, 16)}...
                                  </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", borderTop: `1px solid ${VM.border}40`, paddingTop: "6px" }}>
                                  <button 
                                    onClick={() => setPreviewImage(asset.file_path)}
                                    style={{ background: "none", border: "none", color: VM.blue, fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                                  >
                                    <Eye size={10} /> Preview
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteExpression(asset.sys_id)}
                                    style={{ background: "none", border: "none", color: VM.danger, fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                                  >
                                    <Trash2 size={10} /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, height: "200px", color: VM.muted }}>
              Select an advocate from the left panel.
            </div>
          )}

        </div>

      </div>

      {/* Full Resolution Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "pointer"
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth: "100%", maxHeight: "88vh", border: `2px solid ${VM.border}`, borderRadius: "8px" }} 
            />
            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "1.5rem",
                cursor: "pointer"
              }}
            >
              &times; Close
            </button>
          </div>
        </div>
      )}

      {/* CSS Keyframe Injection */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${VM.border};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${VM.muted};
        }
      `}</style>

    </div>
  );
}
