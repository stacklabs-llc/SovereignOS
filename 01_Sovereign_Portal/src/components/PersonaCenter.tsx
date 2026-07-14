import React, { useState, useEffect, useCallback } from "react";
import { User, Bot, Search, Save, X, RefreshCw, AlertTriangle, ChevronDown, Download, FileText, Server, Plus, Award, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SortableTable } from "./SortableTable";

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
};


/* ── Sovereign Design Tokens ── */
const VM = {
  bg:       "#00040a",
  surface:  "#0a1118",
  card:     "#0d1820",
  border:   "#1a2a38",
  orange:   "#FF5910",
  emerald:  "#00FF88",
  blue:     "#00d4ff",
  gold:     "#E0BC68",
  text:     "#c8d6e0",
  muted:    "#5a7a8a",
  danger:   "#ff4444",
  fontHead: "'Orbitron', sans-serif",
  fontMono: "'Share Tech Mono', monospace",
  fontBody: "'Rajdhani', sans-serif",
} as const;

const FIELD_HELP_TEXTS: Record<string, string> = {
  user_name: "A unique, safe lowercase alphanumeric handle used as their system identifier.",
  first_name: "The user-facing display name shown in chats, rosters, and reports.",
  email_alias: "Internal email routing address mapped to this AI persona.",
  color: "Hex color code representing the avatar contour glow and chat accent theme.",
  title: "The professional role or fandom title assigned to the advocate.",
  assigned_to: "The MLB team affiliation defining their base regional context.",
  active: "Controls whether the persona is operational and responsive to triggers.",
  u_deployment_zone: "The target context room or space where the persona primarily operates.",
  u_cadence: "Determines the interaction frequency: Pacer (Standard), Lurker (Quiet), Agitator (Frequent), or Reactant (Event Only).",
  u_visual_style: "Enforced visual aesthetic tier used for generating lookbooks and sprite sheets.",
  u_boggs_reactivity: "Reactivity/entropy volatility index (1-11) governing brand behavior scaling.",
  introduction: "A short public biography summarizing the advocate's persona.",
  u_system_prompt: "The foundational instructions defining the persona's inner monologue, logic directives, and tone of voice.",
  u_behavior_expectations: "Core behavioral constraints and stylistic expectations guiding their discourse.",
  u_governance_boundaries: "Regulatory guidelines and safety guardrails they are strictly forbidden from crossing.",
  u_deep_lore: "Detailed backstory, personal preferences, and historical memory triggers.",
  u_avatar_prompt: "DALL-E / Pollinations prompt string used for synthesizing the advocate's avatar headshot.",
  u_character_map_prompt: "Prompt template for generating the 3x3 character sheet matrix grid.",
  u_canned_takes: "A JSON string array of pre-approved hot takes and canned message injections."
};

const FieldTooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div 
      style={{ display: "inline-flex", position: "relative", marginLeft: "6px", cursor: "help", verticalAlign: "middle", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ fontSize: "0.65rem", color: VM.emerald, border: `1px solid ${VM.emerald}80`, borderRadius: "50%", width: "12px", height: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontWeight: "bold", lineHeight: "1" }}>i</span>
      {visible && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "6px",
          background: VM.card,
          border: `1px solid ${VM.emerald}`,
          borderRadius: "6px",
          color: VM.text,
          padding: "8px 12px",
          width: "220px",
          zIndex: 9999,
          fontSize: "0.7rem",
          fontFamily: VM.fontMono,
          lineHeight: "1.4",
          boxShadow: `0 4px 20px rgba(0,255,136,0.15)`,
          whiteSpace: "normal",
          pointerEvents: "none",
          textTransform: "none",
          letterSpacing: "normal"
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

/* ── Type Definitions ── */
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
  u_avatar_prompt?: string;
  u_character_map_prompt?: string;
  u_canned_takes?: string;
}


interface SysUser {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  active: number;
  sys_created_on: string;
}

interface HardwareCi {
  sys_id: string;
  name: string;
  sys_class_name: string;
  short_description: string;
  operational_status: number;
  ip_address: string | null;
  mac_address: string | null;
  model_id: string | null;
}

type ActiveTab = "ai_bots";

/* ── API Config ── */
async function fetchTable<T>(table: string): Promise<T[]> {
  try {
    const res = await fetch(`/api/now/table/${table}`);
    if (!res.ok) throw new Error(`${table}: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.result ?? [];
  } catch (error) {
    console.error(`Fetch failed for ${table}:`, error);
    throw error;
  }
}

/* ── Main Component ── */
export default function PersonaCenter() {
  const auth = useAuth();
  const isPilot = auth?.role === 'pilot' || auth?.role === 'admin';
  const isAuthorized = auth?.role === 'pilot' || auth?.role === 'admin' || auth?.role === 'stack_manager';
  const [personaPosts, setPersonaPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("ai_bots");
  const [bots, setBots] = useState<AiPersona[]>([]);
  const [mlbTeams, setMlbTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AiPersona | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [isMassUpdating, setIsMassUpdating] = useState(false);
  const [massUpdatePrompt, setMassUpdatePrompt] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [modalTab, setModalTab] = useState<"configure" | "swarms" | "assistant">("configure");
  const [seedingRawText, setSeedingRawText] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingLog, setSeedingLog] = useState<string[]>([]);
  const [seedingResult, setSeedingResult] = useState<{ req?: string; ritm?: string; task?: string; userName?: string } | null>(null);

  // MLB schedule — populates Zone dropdown
  const [mlbGames, setMlbGames]         = useState<{ game_pk: string; label: string; game_date: string }[]>([]);
  const [zoneWindow, setZoneWindow]     = useState<'today' | '7d'>('today');

  const loadMlbGames = async (window: 'today' | '7d' = 'today') => {
    try {
      const url = window === '7d' ? '/api/mlb/games?days=7' : '/api/mlb/games';
      const res = await fetch(url);
      if (res.ok) { const d = await res.json(); setMlbGames(d.games || []); }
    } catch { /* non-fatal */ }
  };

  const [massUpdateForm, setMassUpdateForm] = useState<{ assigned_to: string, active: string, u_deployment_zone: string }>({
    assigned_to: "",
    active: "",
    u_deployment_zone: ""
  });

  // Inline cell editing state (ServiceNow list-view style double-click)
  const [inlineEdit, setInlineEdit] = useState<{ sys_id: string; field: string; value: string } | null>(null);

  const loadTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) { const d = await res.json(); setMlbTeams(d.teams || []); }
    } catch { /* non-fatal — CMDB teams unavailable */ }
  };

  const startInlineEdit = (e: React.MouseEvent, sys_id: string, field: string, currentValue: string) => {
    e.stopPropagation();
    setInlineEdit({ sys_id, field, value: currentValue ?? "" });
  };

  const commitInlineEdit = async () => {
    if (!inlineEdit) return;
    const { sys_id, field, value } = inlineEdit;
    setInlineEdit(null);
    try {
      const token = localStorage.getItem('sovereign_session_token') || '';
      await fetch(`/api/now/table/cmdb_ci_ai_persona/${sys_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: field === 'active' ? parseInt(value) : value }),
      });
      await loadData();
    } catch (err) { console.error('Inline save failed', err); }
  };

  const toggleSelection = (sys_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedRecords);
    if (newSet.has(sys_id)) newSet.delete(sys_id);
    else newSet.add(sys_id);
    setSelectedRecords(newSet);
  };

  const handleMassUpdate = async () => {
      setIsSaving(true);
      const updates: any = {};
      if (massUpdateForm.assigned_to !== "") updates.assigned_to = massUpdateForm.assigned_to;
      if (massUpdateForm.active !== "") updates.active = parseInt(massUpdateForm.active);
      if (massUpdateForm.u_deployment_zone !== "") updates.u_deployment_zone = massUpdateForm.u_deployment_zone === "NONE" ? "" : massUpdateForm.u_deployment_zone;

      if (Object.keys(updates).length === 0) {
        setIsSaving(false);
        setIsMassUpdating(false);
        return;
      }

      try {
          const table = "cmdb_ci_ai_persona";
          for (const id of selectedRecords) {
              await fetch(`/api/now/table/${table}/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updates)
              });
          }
          setSelectedRecords(newSet => { newSet.clear(); return newSet; });
          await loadData();
          setIsMassUpdating(false);
      } catch (e) {
          alert("Failed to mass update records");
      } finally {
          setIsSaving(false);
      }
  };

  const handleMassDelete = async () => {
      if (!confirm(`Are you sure you want to delete ${selectedRecords.size} records?`)) return;
      setIsSaving(true);
      const table = "cmdb_ci_ai_persona";
      try {
          for (const id of selectedRecords) {
              await fetch(`/api/now/table/${table}/${id}`, { method: "DELETE" });
          }
          setSelectedRecords(newSet => { newSet.clear(); return newSet; });
          await loadData();
      } catch (e) {
          alert("Failed to mass delete");
      } finally {
          setIsSaving(false);
      }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectRecord = (record: AiPersona) => {
    setSelectedRecord(record);
    setEditForm({ ...record });
    setLiveAvatarUrl(null);
    setUploadStatus(null);
    setModalTab("configure");
    setSeedingRawText("");
    setSeedingLog([]);
    setSeedingResult(null);
  };

  const handleNewPersona = () => {
    const newRecord: AiPersona = {
      sys_id: "NEW_" + Date.now(),
      user_name: "New Advocate",
      first_name: "",
      last_name: "",
      title: "Sovereign Analyst",
      introduction: "",
      city: "",
      department: "",
      active: 1,
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      u_system_prompt: "",
      u_cadence: "pacer",
      u_visual_style: "style_clay",
      u_boggs_reactivity: 5,
    };
    setSelectedRecord(newRecord);
    setEditForm(newRecord);
    setLiveAvatarUrl(null);
    setUploadStatus(null);
    setModalTab("assistant");
    setSeedingRawText("");
    setSeedingLog([]);
    setSeedingResult(null);
  };


  const handleAISeed = async () => {
    if (!seedingRawText.trim()) return;
    setIsSeeding(true);
    setSeedingLog(["Initializing AI Seeding Assistant..."]);
    setSeedingResult(null);
    try {
      setSeedingLog(prev => [...prev, "Analyzing raw lore & extracting structured attributes with Gemini-2.5-Pro..."]);
      
      const res = await fetch("/api/now/table/cmdb_ci_ai_persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unstructured_lore: seedingRawText })
      });
      
      if (!res.ok) {
        throw new Error(`Seeding endpoint returned status ${res.status}`);
      }
      
      const data = await res.json();
      const result = data.result;
      
      if (result.status === "success") {
        setSeedingLog(prev => [
          ...prev,
          `Successfully generated structured Advocate model for user: ${result.user_name}`,
          `[REQ] Created Ticket: ${result.req_number}`,
          `[RITM] Created Request Item: ${result.ritm_number}`,
          `[TASK] Created Catalog Task: ${result.task_number}`,
          "Commit successful. Advocate successfully registered in CMDB registry."
        ]);
        setSeedingResult({
          req: result.req_number,
          ritm: result.ritm_number,
          task: result.task_number,
          userName: result.user_name
        });
        
        await loadData();
      } else {
        throw new Error(result.error || "Unknown seeding error");
      }
    } catch (err: any) {
      setSeedingLog(prev => [...prev, `❌ Seeding Failed: ${err.message}`]);
    } finally {
      setIsSeeding(false);
    }
  };


  const handleSave = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    setError(null);
    try {
      const table = "cmdb_ci_ai_persona";
      const isNew = selectedRecord.sys_id.startsWith("NEW_");
      
      const payload = { ...editForm };
      if (isNew) {
        delete payload.sys_id;
        delete payload.sys_created_on;
        delete payload.sys_updated_on;
      }
      
      const url = isNew 
        ? `/api/now/table/${table}` 
        : `/api/now/table/${table}/${selectedRecord.sys_id}`;
        
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || `HTTP ${res.status}`);
      await loadData();
      setSelectedRecord(null);
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSingle = async (sys_id: string) => {
    if (!confirm("Are you sure you want to delete this advocate? This action is permanent.")) return;
    setIsSaving(true);
    setError(null);
    try {
      const table = "cmdb_ci_ai_persona";
      const res = await fetch(`/api/now/table/${table}/${sys_id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || `HTTP ${res.status}`);
      await loadData();
      setSelectedRecord(null);
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const doAvatarUpload = async (file: File) => {
    // Use the name actually shown on screen — editForm is the live form state
    const personaName = (editForm?.user_name || (selectedRecord as any)?.user_name || '').trim();
    if (!personaName) {
      setUploadStatus({ ok: false, msg: 'No advocate selected — cannot upload.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ ok: false, msg: `Not an image file: ${file.type}` });
      return;
    }
    setUploadingAvatar(true);
    setUploadStatus({ ok: true, msg: `Uploading ${file.name} for ${personaName}…` });
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/persona_image/${encodeURIComponent(personaName)}`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setUploadStatus({ ok: true, msg: `✅ Avatar updated` });
      // Use the static file path from server response — no API lookup, loads instantly
      const cleanUrl = json.avatar_url || `/api/persona_image/${personaName}`;
      const newUrl = cleanUrl + `?t=${Date.now()}`;
      setLiveAvatarUrl(newUrl);
      setEditForm((prev: any) => prev ? { ...prev, avatar_url: cleanUrl } : null);
    } catch (err: any) {
      setUploadStatus({ ok: false, msg: `❌ Upload failed: ${err.message}` });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    doAvatarUpload(e.target.files[0]);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  // Clipboard paste — only fires when persona panel is open
  const handleClipboardPaste = (e: ClipboardEvent) => {
    if (!selectedRecord && !editForm) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) { doAvatarUpload(file); }
        break;
      }
    }
  };

  React.useEffect(() => {
    if (!selectedRecord) { setUploadStatus(null); return; }
    document.addEventListener('paste', handleClipboardPaste);
    return () => document.removeEventListener('paste', handleClipboardPaste);
  }, [selectedRecord, editForm]);

  const getRecordsToExport = () => {
    let recordsToExport: AiPersona[] = [...bots];
    if (selectedRecords.size > 0) {
       recordsToExport = recordsToExport.filter(r => selectedRecords.has(r.sys_id));
    }
    return recordsToExport;
  };

  const handleExportJSON = (singleRecord?: any) => {
    const isRecord = singleRecord && typeof singleRecord === 'object' && 'sys_id' in singleRecord;
    const recordsToExport = isRecord ? [singleRecord] : getRecordsToExport();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recordsToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // Conditionally assign the download filename based on selection count or single record pass
    const filename = (isRecord || (selectedRecords.size === 1 && recordsToExport.length === 1))
      ? `${(isRecord ? singleRecord : recordsToExport[0]).user_name}_export.json`
      : "sovereign_personas_export.json";
    downloadAnchorNode.setAttribute("download", filename);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportMD = (singleRecord?: any) => {
    const isRecord = singleRecord && typeof singleRecord === 'object' && 'sys_id' in singleRecord;
    const recordsToExport = isRecord ? [singleRecord] : getRecordsToExport();
    let mdStr = `# Sovereign OS — AI Advocates Export\n\n`;
    
    recordsToExport.forEach((record: any) => {
       const name = record.user_name;
       const avatarUrl = record.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=0f172a&textColor=ffffff`;
       
       mdStr += `## ${name}\n\n`;
       mdStr += `![${name} Avatar](${avatarUrl})\n\n`;
       mdStr += `**Team / Department:** ${record.department || record.assigned_to || "N/A"}\n\n`;
       mdStr += `**Email Alias:** ${record.email_alias || "N/A"}\n\n`;
       mdStr += `**Color:** ${record.color || "N/A"}\n\n`;
       mdStr += `**Cadence:** ${record.u_cadence || "pacer"}\n\n`;
       mdStr += `**Boggs Reactivity:** ${record.u_boggs_reactivity || "N/A"}\n\n`;
       mdStr += `**Deployment Zone:** ${record.u_deployment_zone || "N/A"}\n\n`;
       mdStr += `**Visual Theme Class:** ${record.u_visual_style || "N/A"}\n\n`;
       mdStr += `**Avatar Prompt:**\n\`\`\`\n${record.u_avatar_prompt || "N/A"}\n\`\`\`\n\n`;
       mdStr += `**Character Map Prompt:**\n\`\`\`\n${record.u_character_map_prompt || "N/A"}\n\`\`\`\n\n`;
       mdStr += `**System Prompt:**\n\`\`\`\n${record.u_system_prompt || "N/A"}\n\`\`\`\n\n`;
       mdStr += `**Behavior Notes:**\n${record.u_behavior_expectations || "N/A"}\n\n`;
       mdStr += `**Deep Lore:**\n${record.u_deep_lore || "N/A"}\n\n`;
       mdStr += `**Governance:**\n${record.u_governance_boundaries || "N/A"}\n\n`;
       
       let takesList = "N/A";
       if (record.u_canned_takes) {
         try {
           const parsed = typeof record.u_canned_takes === 'string' ? JSON.parse(record.u_canned_takes) : record.u_canned_takes;
           if (Array.isArray(parsed) && parsed.length > 0) {
             takesList = parsed.map((t: any) => `- **[${t.topic || 'LORE'}]** ${t.text || ''}`).join("\n");
           }
         } catch (e) {
           takesList = String(record.u_canned_takes);
         }
       }
       mdStr += `**Canned Injections (Takes):**\n${takesList}\n\n`;
       mdStr += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdStr);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // Conditionally assign the download filename based on selection count or single record pass
    const filename = (isRecord || (selectedRecords.size === 1 && recordsToExport.length === 1))
      ? `${(isRecord ? singleRecord : recordsToExport[0]).user_name}_export.md`
      : "sovereign_personas_export.md";
    downloadAnchorNode.setAttribute("download", filename);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePrintDossier = (singleId?: string) => {
    let idsParam = "";
    if (singleId) {
      idsParam = `ids=${singleId}`;
    } else {
      const records = getRecordsToExport();
      if (records.length === 0) {
        alert("No advocates selected to print.");
        return;
      }
      idsParam = `ids=${records.map(r => r.sys_id).join(",")}`;
    }
    window.open(`/api/personas/print_dossier?${idsParam}`, '_blank');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const botData = await fetchTable<AiPersona>("cmdb_ci_ai_persona");
      setBots(botData);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMDB records");
    } finally {
      setLoading(false);
    }
    loadMlbGames('today');
    loadTeams();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Filtering ── */
  const filteredBots = bots.filter((b) =>
    (b.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.assigned_to || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  let activeRecords: (AiPersona | SysUser | HardwareCi)[] = filteredBots;

  if (sortConfig !== null) {
    activeRecords = [...activeRecords].sort((a: any, b: any) => {
      let valA = a[sortConfig.key] || "";
      let valB = b[sortConfig.key] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const personaColumns = React.useMemo(() => {
    if (activeTab === "ai_bots") {
      return [
        {
          key: "user_name",
          label: "Name",
          sortable: true,
          render: (record: any) => {
            const isSelected = selectedRecords.has(record.sys_id);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => {}}
                  style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: VM.blue, marginRight: "4px", pointerEvents: "none" }} 
                />
                <Bot size={12} style={{ color: VM.emerald }} />
                <span 
                  onClick={(e) => { e.stopPropagation(); handleSelectRecord(record as AiPersona); }}
                  style={{ color: VM.emerald, textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
                >
                  {record.user_name}
                </span>
              </div>
            );
          }
        },
        {
          key: "assigned_to",
          label: "Team",
          sortable: true,
          render: (record: any) => {
            const bot = record as AiPersona;
            return inlineEdit?.sys_id === record.sys_id && inlineEdit.field === "assigned_to" ? (
              <select 
                autoFocus 
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={commitInlineEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: VM.surface, border: `1px solid ${VM.blue}`, borderRadius: "4px", color: VM.text, fontFamily: VM.fontMono, fontSize: "0.75rem", padding: "2px 4px", outline: "none" }}
              >
                <option value="">— Global —</option>
                {mlbTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <span 
                onDoubleClick={(e) => startInlineEdit(e, record.sys_id, "assigned_to", bot.assigned_to ?? "")}
                title="Double-click to edit team"
                style={{ borderBottom: `1px dashed ${VM.border}`, paddingBottom: "1px", cursor: "cell" }}
              >
                {bot.assigned_to ?? "—"}
              </span>
            );
          }
        },
        {
          key: "sys_updated_on",
          label: "Last Updated",
          sortable: true,
          render: (record: any) => record.sys_updated_on ? new Date(record.sys_updated_on).toLocaleString() : "—"
        },
        {
          key: "u_cadence",
          label: "Cadence",
          sortable: true,
          render: (record: any) => {
            const bot = record as AiPersona;
            const lookup: Record<string, string> = { pacer: "Pacer", lurker: "Lurker", agitator: "Agitator", reactant: "Reactant", Lurker: "Lurker", Agitator: "Agitator", Reactant: "Reactant" };
            return (
              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em",
                background: `${VM.blue}15`, color: VM.blue, border: `1px solid ${VM.blue}30` }}>
                {lookup[(bot.u_cadence ?? "pacer").toLowerCase()] ?? bot.u_cadence ?? "Pacer"}
              </span>
            );
          }
        },
        {
          key: "active",
          label: "Status",
          sortable: true,
          render: (record: any) => {
            const isActive = record.active === 1;
            return inlineEdit?.sys_id === record.sys_id && inlineEdit.field === "active" ? (
              <select 
                autoFocus 
                value={inlineEdit.value}
                onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                onBlur={commitInlineEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: VM.surface, border: `1px solid ${VM.blue}`, borderRadius: "4px", color: VM.text, fontFamily: VM.fontMono, fontSize: "0.75rem", padding: "2px 4px", outline: "none" }}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            ) : (
              <span 
                onDoubleClick={(e) => { e.stopPropagation(); const cur = String(record.active ?? "1"); startInlineEdit(e, record.sys_id, "active", cur); }}
                title="Double-click to toggle status"
                style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "0.6rem", fontFamily: VM.fontMono, textTransform: "uppercase", letterSpacing: "0.1em",
                  background: isActive ? `${VM.emerald}15` : `${VM.danger}15`, color: isActive ? VM.emerald : VM.danger, border: `1px solid ${isActive ? VM.emerald : VM.danger}30`, cursor: "cell" }}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            );
          }
        },
        {
          key: "actions",
          label: "Actions",
          sortable: false,
          render: (record: any) => {
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintDossier(record.sys_id);
                }}
                title="Print Dossier"
                style={{
                  background: "transparent",
                  border: `1px solid ${VM.border}`,
                  borderRadius: "4px",
                  padding: "2px 6px",
                  color: "#a855f7",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: VM.fontMono,
                  fontSize: "0.6rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#a855f7";
                  e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = VM.border;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Printer size={10} />
                Print
              </button>
            );
          }
        }
      ];
    } else if (activeTab === "hardware") {
      return [
        {
          key: "name",
          label: "Name",
          sortable: true,
          render: (record: any) => {
            const isSelected = selectedRecords.has(record.sys_id);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => {}}
                  style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: VM.blue, marginRight: "4px", pointerEvents: "none" }} 
                />
                <Server size={12} style={{ color: VM.emerald }} />
                <span 
                  onClick={(e) => { e.stopPropagation(); handleSelectRecord(record as any); }}
                  style={{ color: VM.emerald, textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
                >
                  {record.name}
                </span>
              </div>
            );
          }
        },
        {
          key: "ip_address",
          label: "IP Address",
          sortable: true
        },
        {
          key: "model_id",
          label: "Model",
          sortable: true
        },
        {
          key: "operational_status",
          label: "Status",
          sortable: true,
          render: (record: any) => {
            const isActive = record.operational_status === 1;
            return (
              <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "0.6rem", fontFamily: VM.fontMono, textTransform: "uppercase", letterSpacing: "0.1em",
                background: isActive ? `${VM.emerald}15` : `${VM.danger}15`, color: isActive ? VM.emerald : VM.danger, border: `1px solid ${isActive ? VM.emerald : VM.danger}30` }}>
                {isActive ? "Active" : "Offline"}
              </span>
            );
          }
        }
      ];
    } else {
      // Users
      return [
        {
          key: "user_name",
          label: "Name",
          sortable: true,
          render: (record: any) => {
            const isSelected = selectedRecords.has(record.sys_id);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => {}}
                  style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: VM.blue, marginRight: "4px", pointerEvents: "none" }} 
                />
                <User size={12} style={{ color: VM.emerald }} />
                <span 
                  onClick={(e) => { e.stopPropagation(); handleSelectRecord(record as any); }}
                  style={{ color: VM.emerald, textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}
                >
                  {record.user_name}
                </span>
              </div>
            );
          }
        },
        {
          key: "email",
          label: "Email",
          sortable: true
        },
        {
          key: "title",
          label: "Title",
          sortable: true
        },
        {
          key: "active",
          label: "Status",
          sortable: true,
          render: (record: any) => {
            const isActive = record.active === 1;
            return (
              <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "0.6rem", fontFamily: VM.fontMono, textTransform: "uppercase", letterSpacing: "0.1em",
                background: isActive ? `${VM.emerald}15` : `${VM.danger}15`, color: isActive ? VM.emerald : VM.danger, border: `1px solid ${isActive ? VM.emerald : VM.danger}30` }}>
                {isActive ? "Active" : "Inactive"}
              </span>
            );
          }
        }
      ];
    }
  }, [activeTab, selectedRecords, inlineEdit, mlbTeams, commitInlineEdit]);

  /* ── Render ── */
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: VM.bg,
        color: VM.text,
        fontFamily: VM.fontBody,
        padding: "1.5rem",
        borderRadius: "12px",
        border: `1px solid ${VM.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "300px",
          height: "300px",
          background: `radial-gradient(circle, ${VM.emerald}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          borderBottom: `1px solid ${VM.border}`,
          paddingBottom: "1rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: VM.fontHead,
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: VM.gold,
              margin: 0,
            }}
          >
            Advocate Center
          </h2>
          <p
            style={{
              fontFamily: VM.fontMono,
              fontSize: "0.65rem",
              color: VM.muted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            /now/cmdb/advocate_center
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === "ai_bots" && isAuthorized && (
            <button
              onClick={handleNewPersona}
              style={{
                background: VM.emerald,
                border: `1px solid ${VM.emerald}`,
                borderRadius: "6px",
                padding: "6px 12px",
                color: "#000",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: VM.fontMono,
                fontSize: "0.7rem",
                fontWeight: "bold",
                transition: "opacity 0.2s",
              }}
            >
              <Plus size={12} />
              New Advocate
            </button>
          )}
          <button
            onClick={handleExportJSON}
            style={{
              background: "transparent",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: VM.emerald,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = VM.emerald)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
          >
            <Download size={12} />
            Export JSON {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
          </button>
          <button
            onClick={handleExportMD}
            style={{
              background: "transparent",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: VM.blue,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = VM.blue)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
          >
            <FileText size={12} />
            Export MD {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
          </button>
          <button
            onClick={() => handlePrintDossier()}
            style={{
              background: "transparent",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: "#a855f7",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f7")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
          >
            <Printer size={12} />
            Print Dossier {selectedRecords.size > 0 ? `(${selectedRecords.size})` : ''}
          </button>
          {selectedRecords.size > 0 && activeTab === "ai_bots" && (
              <>
              <button
                onClick={() => setIsMassUpdating(true)}
                style={{
                  background: VM.orange,
                  border: `1px solid ${VM.orange}`,
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: VM.fontMono,
                  fontSize: "0.7rem",
                  transition: "opacity 0.2s",
                }}
              >
                <Bot size={12} />
                Mass Update ({selectedRecords.size})
              </button>
              <button
                onClick={handleMassDelete}
                style={{
                  background: VM.danger,
                  border: `1px solid ${VM.danger}`,
                  borderRadius: "6px",
                  padding: "6px 12px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: VM.fontMono,
                  fontSize: "0.7rem",
                  transition: "opacity 0.2s",
                }}
              >
                <X size={12} />
                Delete ({selectedRecords.size})
              </button>
              </>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              background: "transparent",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: VM.blue,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = VM.blue)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Sync
          </button>
        </div>
      </div>



      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: VM.surface,
          border: `1px solid ${VM.border}`,
          borderRadius: "6px",
          padding: "8px 12px",
          marginBottom: "1rem",
        }}
      >
        <Search size={14} style={{ color: VM.muted }} />
        <input
          type="text"
          placeholder="Search advocates by name or team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: VM.text,
            fontFamily: VM.fontMono,
            fontSize: "0.8rem",
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: VM.muted }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            background: `${VM.danger}15`,
            border: `1px solid ${VM.danger}40`,
            borderRadius: "6px",
            marginBottom: "1rem",
            fontFamily: VM.fontMono,
            fontSize: "0.75rem",
            color: VM.danger,
          }}
        >
          <AlertTriangle size={14} />
          {error}
          <button
            onClick={loadData}
            style={{
              marginLeft: "auto",
              background: `${VM.danger}20`,
              border: `1px solid ${VM.danger}40`,
              borderRadius: "4px",
              padding: "4px 10px",
              color: VM.danger,
              cursor: "pointer",
              fontFamily: VM.fontMono,
              fontSize: "0.65rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "8px" }}>
        <button onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? VM.surface : "transparent", border: `1px solid ${viewMode === "grid" ? VM.border : "transparent"}`, color: viewMode === "grid" ? VM.emerald : VM.muted, padding: "4px 8px", borderRadius: "4px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontFamily: VM.fontMono, textTransform: 'uppercase' }}>Grid</button>
        <button onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? VM.surface : "transparent", border: `1px solid ${viewMode === "list" ? VM.border : "transparent"}`, color: viewMode === "list" ? VM.blue : VM.muted, padding: "4px 8px", borderRadius: "4px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontFamily: VM.fontMono, textTransform: 'uppercase' }}>List</button>
      </div>

      {/* Record Grid/Table */}
      <div style={{ flex: 1, overflow: "auto", borderRadius: "6px", border: viewMode === "list" ? `1px solid ${VM.border}` : "none" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              fontFamily: VM.fontMono,
              fontSize: "0.8rem",
              color: VM.muted,
            }}
          >
            <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
            Loading CMDB records...
          </div>
        ) : activeRecords.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              fontFamily: VM.fontMono,
              fontSize: "0.8rem",
              color: VM.muted,
            }}
          >
            No records found.
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.75rem", padding: "1rem" }}>
            {activeRecords.map((record) => {
              const isSelected = selectedRecords.has(record.sys_id);
              const r = record as any;
              
              const bust = r._avatarBust ? `?t=${r._avatarBust}` : '';
              
              const hasCustomAsset = !!(r.avatar_url || r.avatar_blob);
              const avatarUrl = r.avatar_blob || r.avatar_url || `/api/persona_image/${(r.user_name || "").toLowerCase()}`;
              
              const rawTeamCode = (r.assigned_to || r.department || "").toUpperCase();
              
              const getTeamDisplayCode = (code: string) => {
                const c = (code || "").trim().toUpperCase();
                if (!c) return "";
                if (c.includes("INKWELL")) return "I&I";
                if (c.includes("WEED")) return "WEED";
                if (c.includes("AETHER")) return "AET";
                if (c.includes("SPITE")) return "SPT";
                if (c.includes("GARDEN")) return "GDN";
                if (c.length > 4) return c.substring(0, 3);
                return c;
              };
              
              const teamCode = getTeamDisplayCode(rawTeamCode);
              const colors = TEAM_COLORS[teamCode] || TEAM_COLORS[rawTeamCode] || { primary: "#0a1118", secondary: "#00d4ff" };
              const fallbackGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;

              const badgeTextColor = (() => {
                if (teamCode === "PHI") return "#FFFFFF";
                const hex = (colors.secondary || "#00d4ff").replace("#", "");
                if (hex.length !== 6) return colors.secondary;
                const rgbR = parseInt(hex.substring(0, 2), 16);
                const rgbG = parseInt(hex.substring(2, 4), 16);
                const rgbB = parseInt(hex.substring(4, 6), 16);
                const brightness = (rgbR * 299 + rgbG * 587 + rgbB * 114) / 1000;
                return brightness < 80 ? "#FFFFFF" : colors.secondary;
              })();

              // Cadence styles mapping
              const cadence = (r.u_cadence || "pacer").toLowerCase();
              let cadenceStyle: { bg: string; text: string; border: string } = { bg: "rgba(0, 212, 255, 0.1)", text: VM.blue as string, border: `1px solid rgba(0, 212, 255, 0.2)` };
              if (cadence === "agitator") {
                cadenceStyle = { bg: "rgba(255, 89, 16, 0.1)", text: VM.orange as string, border: `1px solid rgba(255, 89, 16, 0.2)` };
              } else if (cadence === "lurker") {
                cadenceStyle = { bg: "rgba(90, 122, 138, 0.1)", text: VM.muted as string, border: `1px solid rgba(90, 122, 138, 0.2)` };
              } else if (cadence === "reactant" || cadence === "yapper") {
                cadenceStyle = { bg: "rgba(0, 255, 136, 0.1)", text: VM.emerald as string, border: `1px solid rgba(0, 255, 136, 0.2)` };
              }


              // Simulated staging count based on name
              const stagedCount = ((r.user_name || "").charCodeAt(0) % 4) + 1;

              return (
              <div 
                key={record.sys_id} 
                onClick={() => handleSelectRecord(record as AiPersona)}
                style={{
                  position: "relative",
                  height: "390px",
                  background: isSelected ? `linear-gradient(135deg, ${VM.blue}15, ${VM.card})` : `linear-gradient(135deg, ${VM.card}, ${VM.surface})`,
                  border: `2px solid ${isSelected ? VM.blue : VM.border}`,
                  borderRadius: "20px",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  boxShadow: isSelected ? `0 12px 30px rgba(0,212,255,0.2), 0 0 0 1px ${VM.blue}` : "0 8px 24px rgba(0,0,0,0.4)",
                  display: "flex",
                  flexDirection: "column"
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = VM.emerald;
                        e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,255,136,0.15), 0 0 0 1px ${VM.emerald}`;
                        e.currentTarget.style.transform = "translateY(-6px)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = VM.border;
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                        e.currentTarget.style.transform = "none";
                    }
                }}
              >
                {/* Checkbox selector */}
                <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 12 }}>
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => toggleSelection(record.sys_id, e)}
                        style={{ cursor: "pointer", width: "20px", height: "20px", accentColor: VM.blue, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}
                    />
                </div>
                
                {/* Print Dossier overlay */}
                <div 
                  style={{ position: "absolute", top: "14px", right: "44px", zIndex: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintDossier(record.sys_id);
                  }}
                >
                  <button
                    title="Print Dossier"
                    style={{
                      background: "rgba(0,4,10,0.75)",
                      border: `1px solid ${VM.border}`,
                      padding: "4px",
                      borderRadius: "6px",
                      color: "#a855f7",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      backdropFilter: "blur(6px)",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#a855f7";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = VM.border;
                      e.currentTarget.style.color = "#a855f7";
                    }}
                  >
                    <Printer size={14} />
                  </button>
                </div>
                
                {/* Image Section / Fallback gradient */}
                <div style={{ height: "55%", width: "100%", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #0d1820 100%)", zIndex: 3 }} />
                    
                    {!hasCustomAsset ? (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: fallbackGradient,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative"
                      }}>
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
                          zIndex: 1
                        }} />
                        
                        {/* Premium Double-Ringed Faction SVG Glowing Frame */}
                        <svg
                          width="90"
                          height="90"
                          viewBox="0 0 100 100"
                          style={{
                            zIndex: 2,
                            filter: `drop-shadow(0 0 12px ${colors.secondary}90)`,
                          }}
                        >
                          <defs>
                            <radialGradient id={`glow-${record.sys_id}`} cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.75" />
                              <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                            </radialGradient>
                          </defs>
                          
                          {/* Radial glowing backing */}
                          <circle cx="50" cy="50" r="48" fill={`url(#glow-${record.sys_id})`} />
                          
                          {/* Outer polygon/hexagon ring matching club theme */}
                          <polygon
                            points="50,6 88,28 88,72 50,94 12,72 12,28"
                            fill="none"
                            stroke={colors.secondary}
                            strokeWidth="2.5"
                            opacity="0.8"
                            strokeDasharray="4 2"
                          />
                          
                          {/* Inner double-ring circular elements */}
                          <circle
                            cx="50"
                            cy="50"
                            r="34"
                            fill="none"
                            stroke={colors.secondary}
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="31"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="1"
                            opacity="0.6"
                          />
                          
                          {/* Central glowing custom initials */}
                          <text
                            x="50"
                            y="59"
                            fontFamily={VM.fontHead}
                            fontSize="25"
                            fontWeight="900"
                            fill="#ffffff"
                            textAnchor="middle"
                            style={{
                              textShadow: `0 0 8px ${colors.secondary}, 0 2px 4px rgba(0,0,0,0.8)`
                            }}
                          >
                            {((r.user_name || r.name || "") as string).substring(0, 2).toUpperCase()}
                          </text>
                        </svg>
                        
                        <span style={{
                          position: "absolute",
                          bottom: "16px",
                          fontFamily: VM.fontMono,
                          fontSize: "0.62rem",
                          color: "#ffffff",
                          letterSpacing: "0.15em",
                          zIndex: 2,
                          background: "rgba(0,0,0,0.45)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          backdropFilter: "blur(4px)"
                        }}>
                          🏟️ {teamCode || "GLOBAL"} STADIUM
                        </span>
                      </div>
                    ) : (
                      <img 
                          src={avatarUrl + bust}
                          alt={r.user_name || r.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 2 }}
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${r.user_name || r.name}&backgroundColor=0f172a&textColor=ffffff`; }}
                      />
                    )}

                    {/* Team tag in upper left */}
                    {teamCode && (
                        <div style={{ 
                          position: "absolute", 
                          top: "14px", 
                          left: "14px", 
                          zIndex: 10, 
                          background: "rgba(0,4,10,0.75)", 
                          border: `1px solid ${VM.border}`, 
                          padding: "4px 10px", 
                          borderRadius: "6px", 
                          fontFamily: VM.fontHead, 
                          fontSize: "0.75rem", 
                          color: badgeTextColor, 
                          fontWeight: "bold",
                          backdropFilter: "blur(6px)" 
                        }}>
                            {teamCode}
                        </div>
                    )}

                    {/* Staging Items badge overlay */}
                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      zIndex: 10,
                      background: "rgba(224, 188, 104, 0.15)",
                      border: `1px solid ${VM.gold}40`,
                      color: VM.gold,
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontFamily: VM.fontMono,
                      fontSize: "0.6rem",
                      letterSpacing: "0.08em",
                      fontWeight: "bold",
                      backdropFilter: "blur(4px)"
                    }}>
                      ⚡ {stagedCount} STAGED
                    </div>
                </div>

                {/* Content Section */}
                <div style={{ flex: 1, padding: "18px", display: "flex", flexDirection: "column", position: "relative", zIndex: 4, background: "#0d1820" }}>
                    <h3 style={{ fontFamily: VM.fontHead, fontSize: "1.25rem", color: VM.gold, margin: "0 0 4px 0", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.user_name || r.name}
                    </h3>
                    <div style={{ fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.emerald, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.title || r.department || "Sovereign Analyst"}
                    </div>
                    
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {/* Status Section */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ 
                                width: "8px", 
                                height: "8px", 
                                borderRadius: "50%", 
                                background: r.active === 1 || r.operational_status === 1 ? VM.emerald : VM.danger,
                                boxShadow: r.active === 1 || r.operational_status === 1 ? `0 0 8px ${VM.emerald}` : "none",
                                display: "inline-block"
                              }} />
                              <span style={{ fontFamily: VM.fontMono, fontSize: "0.75rem", color: r.active === 1 || r.operational_status === 1 ? VM.emerald : VM.danger, fontWeight: "bold", letterSpacing: "0.05em" }}>
                                  {r.active === 1 || r.operational_status === 1 ? "ACTIVE" : "OFFLINE"}
                              </span>
                            </div>
                        </div>

                        {/* Cadence Badge */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                            <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cadence</span>
                            <span style={{ 
                              fontFamily: VM.fontMono, 
                              fontSize: "0.7rem", 
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              background: cadenceStyle.bg,
                              color: cadenceStyle.text,
                              border: cadenceStyle.border,
                              borderRadius: "4px",
                              padding: "2px 8px",
                              letterSpacing: "0.05em"
                            }}>
                                {r.u_cadence || "pacer"}
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <SortableTable
            data={activeRecords}
            columns={personaColumns}
            searchPlaceholder="Search records..."
            searchKeys={activeTab === "ai_bots" ? ["user_name", "assigned_to", "u_cadence"] : activeTab === "hardware" ? ["name", "ip_address", "model_id"] : ["user_name", "email", "title"]}
            theme="glass"
          />
        )}
      </div>

      {/* ── Edit Advocate Modal ── */}
      {selectedRecord && editForm && (
        <div
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                  handleAvatarUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
                  break;
                }
              }
            }
          }}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,4,10,0.88)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: "24px",
          }}
        >
          <div style={{
            background: VM.card,
            border: `1px solid ${VM.border}`,
            borderRadius: "16px",
            width: "100%", maxWidth: "760px",
            maxHeight: "88vh", overflowY: "auto",
            boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${VM.border}`,
          }}>

            {/* Modal Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: `1px solid ${VM.border}`,
              position: "sticky", top: 0, background: VM.card, zIndex: 10,
              borderRadius: "16px 16px 0 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img
                  src={editForm.avatar_blob || editForm.avatar_url || `/api/persona_image/${(editForm.user_name || "").toLowerCase()}`}
                  alt={editForm.user_name}
                  style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", border: `2px solid ${VM.border}` }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${editForm.user_name}&backgroundColor=0f172a&textColor=ffffff`; }}
                />
                <div>
                  <div style={{ fontFamily: VM.fontHead, fontSize: "1.1rem", color: VM.gold, letterSpacing: "0.08em" }}>
                    {editForm.user_name}
                  </div>
                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginTop: "2px" }}>
                    {editForm.assigned_to || "Unassigned"} · {editForm.active === 1 ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!editForm.sys_id.startsWith("NEW_") && (
                  <>
                    <button
                      onClick={() => {
                        const targetBot = bots.find(b => b.sys_id === editForm.sys_id);
                        handleExportJSON(targetBot || editForm);
                      }}
                      title="Export this advocate's dossier to JSON"
                      style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: VM.emerald, display: "flex", alignItems: "center", gap: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem", transition: "border-color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = VM.emerald)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
                    >
                      <Download size={14} /> JSON
                    </button>
                    <button
                      onClick={() => {
                        const targetBot = bots.find(b => b.sys_id === editForm.sys_id);
                        handleExportMD(targetBot || editForm);
                      }}
                      title="Export this advocate's dossier to Markdown"
                      style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: VM.blue, display: "flex", alignItems: "center", gap: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem", transition: "border-color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = VM.blue)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
                    >
                      <FileText size={14} /> MD
                    </button>
                    <button
                      onClick={() => handlePrintDossier(editForm.sys_id)}
                      title="Print PDF Dossier"
                      style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#a855f7", display: "flex", alignItems: "center", gap: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem", transition: "border-color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f7")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = VM.border)}
                    >
                      <Printer size={14} /> PDF
                    </button>
                    <div style={{ width: "1px", height: "20px", background: VM.border, margin: "0 4px" }} />
                  </>
                )}
                <button
                  onClick={handleSave} disabled={isSaving || !isAuthorized}
                  style={{ background: VM.emerald, border: "none", borderRadius: "8px", padding: "8px 20px", color: "#000", cursor: (isSaving || !isAuthorized) ? "not-allowed" : "pointer", fontFamily: VM.fontMono, fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", transition: "opacity 0.2s", opacity: isAuthorized ? 1 : 0.5 }}
                >
                  <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "8px 14px", cursor: "pointer", color: VM.muted, display: "flex", alignItems: "center", gap: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem" }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>

            {/* Sub-tabs header bar */}
            <div style={{
              display: "flex",
              borderBottom: `1px solid ${VM.border}`,
              background: VM.surface,
              padding: "0 24px",
            }}>
              <button
                type="button"
                onClick={() => setModalTab("configure")}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: modalTab === "configure" ? `3px solid ${VM.emerald}` : "3px solid transparent",
                  color: modalTab === "configure" ? VM.emerald : VM.muted,
                  fontFamily: VM.fontHead,
                  fontSize: "0.72rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "all 0.2s",
                }}
              >
                ⚙️ CONFIGURE ADVOCATE
              </button>
              {selectedRecord.sys_id.startsWith("NEW_") && (
                <button
                  type="button"
                  onClick={() => setModalTab("assistant")}
                  style={{
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: modalTab === "assistant" ? `3px solid ${VM.emerald}` : "3px solid transparent",
                    color: modalTab === "assistant" ? VM.emerald : VM.muted,
                    fontFamily: VM.fontHead,
                    fontSize: "0.72rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    letterSpacing: "0.08em",
                    transition: "all 0.2s",
                  }}
                >
                  ⚡ AI SEEDING ASSISTANT
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalTab("swarms")}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: modalTab === "swarms" ? `3px solid ${VM.emerald}` : "3px solid transparent",
                  color: modalTab === "swarms" ? VM.emerald : VM.muted,
                  fontFamily: VM.fontHead,
                  fontSize: "0.72rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "all 0.2s",
                }}
              >
                🧬 SWARM GOALS & STACKS
              </button>
            </div>

            {modalTab === "configure" ? (
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                {!isAuthorized && (
                  <div style={{
                    background: `${VM.danger}15`,
                    border: `1px solid ${VM.danger}40`,
                    borderRadius: "8px",
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: VM.danger,
                    fontFamily: VM.fontMono,
                    fontSize: "0.75rem",
                  }}>
                    <span>⚠️ READ-ONLY REFERENCE NODE: Operator requires Stack Manager elevation to alter Advocate registry assets.</span>
                  </div>
                )}

                {/* Visual clarification badge */}
                <div style={{
                  padding: "14px 18px",
                  background: `${VM.blue}10`,
                  border: `1px solid ${VM.blue}25`,
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: VM.blue, fontFamily: VM.fontHead, fontSize: "0.75rem", fontWeight: "bold" }}>
                    🤖 ACTIVE AI SWARM BOT NODE
                  </div>
                  <p style={{ margin: 0, fontFamily: VM.fontMono, fontSize: "0.68rem", color: VM.text, lineHeight: "1.5" }}>
                    🚨 <strong>AI ADVOCATE vs OPERATOR:</strong> This modal configures an autonomous **AI Chatbot Swarm Node** (like Terry or Kosmos). Advocates run background cron sequences, subscribe to Brand Stacks, compile Swarm logs, and interact dynamically in chat. They **do not** log in manually as physical users. To create or manage real human Operator access, please use the **User Management Workspace** in the top navigation instead.
                  </p>
                </div>

                {/* Avatar Upload */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center", background: VM.surface, padding: "16px 20px", borderRadius: "10px", border: `1px solid ${VM.border}` }}>
                  <img
                    src={liveAvatarUrl || editForm.avatar_blob || editForm.avatar_url || `/api/persona_image/${(editForm.user_name || "").toLowerCase()}`}
                    alt={editForm.user_name}
                    style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", border: `2px solid ${VM.border}`, flexShrink: 0 }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${editForm.user_name}&backgroundColor=0f172a&textColor=ffffff`; }}
                  />
                  <div style={{ flex: 1 }}>
                    {/* Status message */}
                    {uploadStatus && (
                      <div style={{ marginBottom: "8px", padding: "6px 10px", borderRadius: "6px", fontFamily: VM.fontMono, fontSize: "0.72rem", background: uploadStatus.ok ? "#052e16" : "#2d0a0a", color: uploadStatus.ok ? "#4ade80" : "#f87171", border: `1px solid ${uploadStatus.ok ? '#10b981' : '#ef4444'}` }}>
                        {uploadStatus.msg}
                      </div>
                    )}
                    <div style={{ fontFamily: VM.fontMono, fontSize: "0.72rem", color: VM.muted, marginBottom: "10px" }}>
                      📋 <strong style={{ color: VM.text }}>Ctrl+V</strong> to paste · or pick a file:
                    </div>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: uploadingAvatar ? VM.surface : "transparent", border: `1px solid ${VM.blue}`, borderRadius: "6px", padding: "6px 14px", color: VM.blue, cursor: (uploadingAvatar || !isAuthorized) ? "not-allowed" : "pointer", fontFamily: VM.fontMono, fontSize: "0.75rem", opacity: isAuthorized ? 1 : 0.5 }}>
                      {uploadingAvatar ? "⏳ Uploading…" : "Choose Image"}
                      {isAuthorized && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />}
                    </label>
                  </div>
                </div>

                {/* Section: Identity */}
                <div>
                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "14px", paddingBottom: "8px", borderBottom: `1px solid ${VM.border}` }}>
                    Identity
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {[
                      { key: "user_name", label: "Username" },
                      { key: "first_name", label: "Display Name" },
                      { key: "email_alias", label: "Email Alias" },
                      { key: "color", label: "Color (e.g., #FF5910)" },
                      { key: "title", label: "Title / Role" },
                      { key: "assigned_to", label: "Team", type: "team-select" },
                      { key: "active", label: "Status", type: "status-select" },
                      { key: "u_deployment_zone", label: "Deployment Zone", type: "deployment-select" },
                      { key: "u_cadence", label: "Cadence", type: "cadence-select" },
                      { key: "u_visual_style", label: "Visual Style", type: "style-select" },
                      { key: "u_boggs_reactivity", label: "Brand Entropy Level (1 - 11)", type: "entropy-slider" },
                    ].map(({ key, label, type }) => (
                      <div key={key} style={{ gridColumn: type === "entropy-slider" ? "span 2" : "span 1" }}>
                        <label style={{ display: "flex", alignItems: "center", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                          {label}
                          <FieldTooltip text={FIELD_HELP_TEXTS[key] || "Advocate configuration field."} />
                        </label>
                        {type === "team-select" ? (
                          <select value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            <option value="">Unassigned (Global)</option>
                            {mlbTeams.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : type === "status-select" ? (
                          <select value={String(editForm[key] ?? "1")} onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </select>
                        ) : type === "deployment-select" ? (
                          <select value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            <option value="">Global / Unassigned</option>
                            <option value="BENCHED">BENCHED</option>
                            <option value="BULLPEN">BULLPEN</option>
                            {mlbTeams.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : type === "cadence-select" ? (
                          <select value={String(editForm[key] || "pacer")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            <option value="pacer">Pacer (Standard)</option>
                            <option value="lurker">Lurker (Quiet)</option>
                            <option value="agitator">Agitator (Frequent)</option>
                            <option value="reactant">Reactant (Event Only)</option>
                          </select>
                        ) : type === "style-select" ? (
                          <select value={String(editForm[key] || "style_clay")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            <option value="style_felt" disabled>Style A: Traumatized Fuzzy Felt (Banned)</option>
                            <option value="style_pixel">Style B: 16-Bit Pixel Grid</option>
                            <option value="style_clay">Style C: Unraveled Claymation</option>
                            <option value="style_apathetic">Style D: Apathetic Claymation</option>
                            <option value="style_2d">Style E: Flat 2D Vector Comic</option>
                          </select>
                        ) : type === "entropy-slider" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: VM.surface, padding: "8px 12px", borderRadius: "6px", border: `1px solid ${VM.border}` }}>
                            <input type="range" min="1" max="11" step="1" value={Number(editForm[key] ?? 5)} onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) })} disabled={!isAuthorized}
                              style={{ flex: 1, accentColor: VM.emerald, cursor: isAuthorized ? "pointer" : "not-allowed" }} />
                            <span style={{ fontFamily: VM.fontMono, fontSize: "0.9rem", color: VM.emerald, fontWeight: "bold", minWidth: "24px", textAlign: "right" }}>
                              {editForm[key] ?? 5}
                            </span>
                          </div>
                        ) : (
                          <input value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border} />
                        )}
                      </div>
                    ))}

                  </div>
                </div>

                {/* Section: Bio */}
                <div>
                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "14px", paddingBottom: "8px", borderBottom: `1px solid ${VM.border}` }}>
                    Bio
                  </div>
                  <label style={{ display: "flex", alignItems: "center", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Introduction / Short Bio
                    <FieldTooltip text={FIELD_HELP_TEXTS["introduction"] || "A short public biography summarizing the advocate."} />
                  </label>
                  <textarea value={String(editForm.introduction || "")} onChange={(e) => setEditForm({ ...editForm, introduction: e.target.value })} disabled={!isAuthorized}
                    style={{ width: "100%", height: "90px", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border} />
                </div>

                {/* Section: Character Lore */}
                <div>
                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "14px", paddingBottom: "8px", borderBottom: `1px solid ${VM.border}` }}>
                    Character Lore
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      { key: "u_system_prompt",         label: "System Prompt",         h: "120px" },
                      { key: "u_behavior_expectations", label: "Behavior Expectations",  h: "100px" },
                      { key: "u_governance_boundaries", label: "Governance Boundaries",  h: "100px" },
                      { key: "u_deep_lore",             label: "Deep Lore",             h: "160px" },
                      { key: "u_avatar_prompt",         label: "Avatar Generation Prompt", h: "80px" },
                      { key: "u_character_map_prompt",  label: "Character Map Prompt", h: "80px" },
                      { key: "u_canned_takes",          label: "Canned Injections / Takes (JSON Array)", h: "120px" },
                    ].map(({ key, label, h }) => (
                      <div key={key}>
                        <label style={{ display: "flex", alignItems: "center", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                          {label}
                          <FieldTooltip text={FIELD_HELP_TEXTS[key] || "Lore configuration field."} />
                        </label>
                        <textarea value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} disabled={!isAuthorized}
                          style={{ width: "100%", height: h, background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none", resize: "vertical", lineHeight: "1.5", boxSizing: "border-box" }}
                          onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: `1px solid ${VM.border}` }}>
                  {!selectedRecord.sys_id.startsWith("NEW_") ? (
                    <button
                      onClick={() => handleDeleteSingle(selectedRecord.sys_id)}
                      disabled={isSaving || !isAuthorized}
                      style={{
                        background: "transparent",
                        border: `1px solid ${VM.danger}`,
                        borderRadius: "8px",
                        padding: "10px 20px",
                        cursor: (isSaving || !isAuthorized) ? "not-allowed" : "pointer",
                        color: VM.danger,
                        fontFamily: VM.fontMono,
                        fontSize: "0.8rem",
                        transition: "background 0.2s",
                        opacity: isAuthorized ? 1 : 0.5
                      }}
                      onMouseEnter={(e) => isAuthorized && (e.currentTarget.style.background = `${VM.danger}15`)}
                      onMouseLeave={(e) => isAuthorized && (e.currentTarget.style.background = "transparent")}
                    >
                      Delete Advocate
                    </button>
                  ) : <div />}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setSelectedRecord(null)}
                      style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", color: VM.muted, fontFamily: VM.fontMono, fontSize: "0.8rem" }}>
                      Cancel
                    </button>
                    {isAuthorized && (
                      <button onClick={handleSave} disabled={isSaving}
                        style={{ background: VM.emerald, border: "none", borderRadius: "8px", padding: "10px 24px", color: "#000", cursor: isSaving ? "wait" : "pointer", fontFamily: VM.fontMono, fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : modalTab === "assistant" ? (
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{
                  padding: "16px 20px",
                  background: `${VM.emerald}10`,
                  border: `1px solid ${VM.emerald}25`,
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: VM.emerald, fontFamily: VM.fontHead, fontSize: "0.78rem", fontWeight: "bold" }}>
                    ⚡ AI ADVOCATE SEEDING ASSISTANT
                  </div>
                  <p style={{ margin: 0, fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.text, lineHeight: "1.5" }}>
                    Provide raw unstructured lore, character bios, or intake forms. Gemini-2.5-Pro will parse and structure the profile, register the advocate record in the CMDB system, and automatically generate the corresponding IT Service Management ticket stack (REQ, RITM, TASK) for complete audit trail compliance.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Raw Intake Lore / Bio Text</label>
                  <textarea
                    value={seedingRawText}
                    onChange={(e) => setSeedingRawText(e.target.value)}
                    disabled={isSeeding || !!seedingResult || !isAuthorized}
                    placeholder="Example: Keith Hernandez Fanboy. A diehard NYM fan who lives and breathes Keith Hernandez. Extremely reactive brand entropy (boggs level 8). Cadence is agitator. Visual style is Fuzzy Felt. Character background: grew up in Queens..."
                    style={{
                      width: "100%",
                      height: "220px",
                      background: VM.surface,
                      border: `1px solid ${VM.border}`,
                      borderRadius: "8px",
                      color: VM.text,
                      padding: "14px",
                      fontFamily: VM.fontMono,
                      fontSize: "0.82rem",
                      outline: "none",
                      resize: "vertical",
                      lineHeight: "1.5",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = VM.emerald}
                    onBlur={(e) => e.target.style.borderColor = VM.border}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleAISeed}
                    disabled={isSeeding || !seedingRawText.trim() || !!seedingResult || !isAuthorized}
                    style={{
                      background: VM.emerald,
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 24px",
                      color: "#000",
                      cursor: (isSeeding || !seedingRawText.trim() || !!seedingResult || !isAuthorized) ? "not-allowed" : "pointer",
                      fontFamily: VM.fontMono,
                      fontSize: "0.82rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: (isSeeding || !seedingRawText.trim() || !!seedingResult || !isAuthorized) ? 0.6 : 1,
                      transition: "opacity 0.2s"
                    }}
                  >
                    {isSeeding ? "⏳ Parsing & Seeding..." : "Process & Seed with Gemini-2.5-Pro"}
                  </button>
                </div>

                {seedingLog.length > 0 && (
                  <div style={{
                    background: "#03060c",
                    border: `1px solid ${VM.border}`,
                    borderRadius: "10px",
                    padding: "16px",
                    fontFamily: VM.fontMono,
                    fontSize: "0.75rem",
                    color: "#a1a1aa",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
                  }}>
                    <div style={{ color: VM.emerald, fontWeight: "bold", marginBottom: "12px", letterSpacing: "0.08em" }}>
                      📡 PROCESSING TELEMETRY LOGS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {seedingLog.map((log, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          lineHeight: "1.4"
                        }}>
                          <span style={{ color: VM.muted }}>[{idx + 1}]</span>
                          <span style={{ color: log.startsWith("❌") ? VM.danger : log.startsWith("Successfully") || log.startsWith("Commit") ? VM.emerald : "#e4e4e7" }}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seedingResult && (
                  <div style={{
                    padding: "16px 20px",
                    background: `${VM.emerald}15`,
                    border: `1px solid ${VM.emerald}40`,
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: VM.emerald, fontFamily: VM.fontHead, fontSize: "0.82rem", fontWeight: "bold" }}>
                      ✓ SEEDING TRANSACTION REGISTERED SUCCESSFUL
                    </div>
                    <p style={{ margin: 0, fontFamily: VM.fontMono, fontSize: "0.72rem", color: VM.text, lineHeight: "1.5" }}>
                      The AI Advocate <strong>@{seedingResult.userName}</strong> has been securely registered. Feel free to click "Cancel" to close this assistant, or switch to the <strong>Configure Advocate</strong> tab above to view/adjust the extracted fields.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Streak (Telemetry Node Timeline) */}
                <div style={{ background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "12px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <span style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.blue, textTransform: "uppercase", letterSpacing: "0.1em" }}>Dynamic Swarm Ingestion Streak</span>
                      <h4 style={{ margin: "2px 0 0 0", fontFamily: VM.fontHead, fontSize: "0.85rem", color: "#fff" }}>Telemetry Synchronization Timeline</h4>
                    </div>
                    <span style={{ fontFamily: VM.fontMono, fontSize: "0.7rem", background: `${VM.blue}15`, color: VM.blue, border: `1px solid ${VM.blue}30`, padding: "2px 8px", borderRadius: "6px" }}>
                      Active Streak: 4 / 5 Nodes
                    </span>
                  </div>

                  {/* Progress Line and Circles */}
                  <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 6px" }}>
                    <div style={{ position: "absolute", top: "50%", left: "16px", right: "16px", height: "3px", background: "#1e293b", zIndex: 1, transform: "translateY(-50%)" }}>
                      <div style={{ height: "100%", width: "75%", background: `linear-gradient(to right, ${VM.blue}, ${VM.emerald})`, boxShadow: `0 0 10px ${VM.blue}` }} />
                    </div>

                    {[
                      { day: 1, label: 'Node 1', active: true, icon: '✓' },
                      { day: 2, label: 'Node 2', active: true, icon: '✓' },
                      { day: 3, label: 'Node 3', active: true, icon: '✓' },
                      { day: 4, label: 'Node 4', active: true, icon: '✓' },
                      { day: 5, label: 'Node 5', active: false, icon: '★' }
                    ].map((node) => (
                      <div key={node.day} style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: node.active ? VM.blue : "#0f172a",
                          border: `2px solid ${node.active ? VM.blue : "#334155"}`,
                          color: node.active ? "#000" : VM.muted,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: "bold",
                          boxShadow: node.active ? `0 0 10px ${VM.blue}60` : "none"
                        }}>
                          {node.icon}
                        </div>
                        <span style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: node.active ? VM.blue : VM.muted }}>{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Brand Stack Swarm Matrix */}
                <div style={{ background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "12px", padding: "16px" }}>
                  <span style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.emerald, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>
                    ◈ Active Brand Stack Swarm Matrix
                  </span>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {/* WeedStack Swarm */}
                    <div style={{ background: "#00040a", border: `1px solid rgba(0, 255, 136, 0.15)`, padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: VM.fontHead, fontSize: "0.75rem", color: "#fff", fontWeight: "bold" }}>WeedStack Swarm</span>
                          <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.emerald, background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.2)", padding: "1px 6px", borderRadius: "4px" }}>COMPLETED</span>
                        </div>
                        <div style={{ fontFamily: VM.fontMono, fontSize: "0.6rem", color: VM.muted, marginTop: "4px", textTransform: "uppercase" }}>Target: WildSeed</div>
                        <p style={{ fontFamily: VM.fontBody, fontSize: "0.72rem", color: "#94a3b8", margin: "6px 0 0 0", lineHeight: "1.3" }}>Engaged dispensary target node; sync crop matrix intake briefs.</p>
                      </div>
                      <div style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.emerald }}>✓ SWARM SYNCHRONIZED</div>
                    </div>

                    {/* BistroStack Swarm */}
                    <div style={{ background: "#00040a", border: `1px solid rgba(0, 255, 136, 0.15)`, padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: VM.fontHead, fontSize: "0.75rem", color: "#fff", fontWeight: "bold" }}>BistroStack Swarm</span>
                          <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.emerald, background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.2)", padding: "1px 6px", borderRadius: "4px" }}>COMPLETED</span>
                        </div>
                        <div style={{ fontFamily: VM.fontMono, fontSize: "0.6rem", color: VM.muted, marginTop: "4px", textTransform: "uppercase" }}>Target: Bistro Portal</div>
                        <p style={{ fontFamily: VM.fontBody, fontSize: "0.72rem", color: "#94a3b8", margin: "6px 0 0 0", lineHeight: "1.3" }}>Emergency healing sequence executed; menu taxonomy seeded.</p>
                      </div>
                      <div style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.emerald }}>✓ SWARM SYNCHRONIZED</div>
                    </div>

                    {/* AetherVet Swarm */}
                    <div style={{ background: "#00040a", border: `1px solid rgba(0, 212, 255, 0.15)`, padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: VM.fontHead, fontSize: "0.75rem", color: "#fff", fontWeight: "bold" }}>AetherVet Swarm</span>
                          <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.blue, background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)", padding: "1px 6px", borderRadius: "4px" }}>ACTIVE</span>
                        </div>
                        <div style={{ fontFamily: VM.fontMono, fontSize: "0.6rem", color: VM.muted, marginTop: "4px", textTransform: "uppercase" }}>Target: Arkle Vet</div>
                        <p style={{ fontFamily: VM.fontBody, fontSize: "0.72rem", color: "#94a3b8", margin: "6px 0 0 0", lineHeight: "1.3" }}>Verify WebRTC telepresence mesh; verify feline telemetry data.</p>
                      </div>
                      <div style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.blue }}>◈ 75% TARGET ENGAGED</div>
                    </div>

                    {/* StackLabs Swarm */}
                    <div style={{ background: "#00040a", border: `1px solid rgba(224, 188, 104, 0.15)`, padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "105px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: VM.fontHead, fontSize: "0.75rem", color: "#fff", fontWeight: "bold" }}>StackLabs Swarm</span>
                          <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.gold, background: "rgba(224, 188, 104, 0.1)", border: "1px solid rgba(224, 188, 104, 0.2)", padding: "1px 6px", borderRadius: "4px" }}>DEPLOYED</span>
                        </div>
                        <div style={{ fontFamily: VM.fontMono, fontSize: "0.6rem", color: VM.muted, marginTop: "4px", textTransform: "uppercase" }}>Target: Raw Iron</div>
                        <p style={{ fontFamily: VM.fontBody, fontSize: "0.72rem", color: "#94a3b8", margin: "6px 0 0 0", lineHeight: "1.3" }}>Bare-metal hardware configured; engine room on standby.</p>
                      </div>
                      <div style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.gold }}>★ STACK SEEDED</div>
                    </div>
                  </div>
                </div>

                {/* Operator Swarm Deployment Badges */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Award size={14} style={{ color: VM.gold }} />
                    <span style={{ fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                      🧬 Operator Swarm Deployment Badges
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {(() => {
                      const username = (editForm.user_name || "").toLowerCase().trim();
                      let userAchievements = [];
                      if (username.includes("linda")) {
                        userAchievements = [
                          { id: 'weedstack_pioneer', title: 'WildSeed Swarm Completed', description: 'Successfully seeded and deployed the WeedStack customer intake matrix to WildSeed.', unlocked: true, dateEarned: '22 05 26', icon: '🌱' },
                          { id: 'relay_runner', title: 'Lavender Mint Seeder', description: 'Distributed premium brand announcement updates to Mets bullpen telemetrists.', unlocked: true, dateEarned: '24 05 26', icon: '🍬' },
                          { id: 'industrial_dial', title: 'Wellness Practice Tethered', description: 'Calibrated essential oils and Himalayan salt lamp telemetry systems securely.', unlocked: true, dateEarned: '28 05 26', icon: '🧘' },
                          { id: 'chaos_proof', title: 'Eat Pray Love Transcendence', description: 'Survive a heated brand discussion with Gary without dropping active frames.', unlocked: false, icon: '🛡️' }
                        ];
                      } else if (username.includes("kosmos")) {
                        userAchievements = [
                          { id: 'weedstack_pioneer', title: 'Kramerica Swarm Deployed', description: 'Successfully locked down WeedStack crop matrix deployments over bare metal.', unlocked: true, dateEarned: '12 05 26', icon: '🌱' },
                          { id: 'relay_runner', title: 'Bare-Metal Infrastructure', description: 'Configured 15 concurrent raw-iron standalone systems in the engine room.', unlocked: true, dateEarned: '18 05 26', icon: '🖥️' },
                          { id: 'industrial_dial', title: 'Bob Sacamano Relic Tether', description: 'Bypassed all cloud APIs using a custom tactile copper physical dial.', unlocked: true, dateEarned: '29 05 26', icon: '⚙️' },
                          { id: 'chaos_proof', title: 'Barf Debate Champion', description: 'Achieve emotional cognitive alignment with Barf on the voice relay line.', unlocked: false, icon: '🧠' }
                        ];
                      } else if (username.includes("barf")) {
                        userAchievements = [
                          { id: 'underpants_bandito', title: 'Portal Key Hijack Swarm', description: 'Successfully locked down the entire portal using retro terminal keys.', unlocked: true, dateEarned: '08 05 26', icon: '🦹' },
                          { id: 'mets_fanatic', title: 'Mets Bullpen Telemetrist', description: 'Screamed at Stearns for 45 minutes on the active telemetry line.', unlocked: true, dateEarned: '15 05 26', icon: '⚾' },
                          { id: 'hot_take_fire', title: 'Vocal Synthesizer Swarm', description: 'Triggered 15 concurrent vocal relay overrides on argo.', unlocked: true, dateEarned: '27 05 26', icon: '🔥' },
                          { id: 'casino_king', title: 'Credit Injection Whale', description: 'Wagered 10,000 portal credits in a single session without sweating.', unlocked: false, icon: '🎰' }
                        ];
                      } else if (username.includes("scruffy")) {
                        userAchievements = [
                          { id: 'weedstack_pioneer', title: 'WildSeed Swarm Completed', description: 'Successfully seeded and deployed the first WeedStack IoT matrix to WildSeed.', unlocked: true, dateEarned: '22 05 26', icon: '🌱' },
                          { id: 'relay_runner', title: 'Tailscale Mesh Swarm', description: 'Configured 15 concurrent Tailscale tunnel telemetry hops securely on clio.', unlocked: true, dateEarned: '24 05 26', icon: '⚡' },
                          { id: 'industrial_dial', title: 'Clio Relic Tethered', description: 'Integrated the custom tactile physical copper relic dial to clio command deck.', unlocked: true, dateEarned: '28 05 26', icon: '⚙️' },
                          { id: 'chaos_proof', title: 'Advocate Engagement Champion', description: 'Survive a heated Skew room debate with Barf without dropping telemetry frames.', unlocked: false, icon: '🛡️' }
                        ];
                      } else {
                        userAchievements = [
                          { id: 'so_weve_met', title: 'Mesh Swarm Auth', description: 'Successfully authenticated to the Sovereign Portal over secure tailscale.', unlocked: true, dateEarned: '29 05 26', icon: '🤝' },
                          { id: 'mom_on_tv', title: 'Genesis Seeder Recruit', description: 'Reached top 1000 operational rank in the Genesis seeder matrix.', unlocked: false, icon: '📺' },
                          { id: 'secret_trophy', title: 'Classified Swarm Goal', description: 'Keep completing assigned stories and tasks to unlock this relic.', unlocked: false, icon: '🔒' }
                        ];
                      }

                      return userAchievements.map((ach) => (
                        <div
                          key={ach.id}
                          style={{
                            position: "relative",
                            background: ach.unlocked ? "#080d19" : "rgba(5,8,17,0.6)",
                            border: `1px solid ${ach.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                            borderRadius: "16px",
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            opacity: ach.unlocked ? 1 : 0.55,
                            overflow: "hidden"
                          }}
                        >
                          {!ach.unlocked && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                              <Award size={20} style={{ color: VM.muted }} />
                              <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", color: VM.muted, textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.1em", marginTop: "4px" }}>Locked Achievement</span>
                            </div>
                          )}

                          {/* Icon Hex Frame */}
                          <div style={{ position: "relative", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a, #1e293b)", border: `1px solid ${VM.border}`, borderRadius: "10px", fontSize: "1.2rem", flexShrink: 0 }}>
                            {ach.icon}
                            {ach.unlocked && (
                              <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "14px", height: "14px", background: VM.emerald, border: "1px solid #000", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#000", fontWeight: "bold" }}>
                                ✓
                              </div>
                            )}
                          </div>

                          {/* Content Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                              <h5 style={{ margin: 0, fontFamily: VM.fontHead, fontSize: "0.75rem", color: "#fff", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ach.title}</h5>
                              {ach.unlocked && ach.dateEarned && (
                                <span style={{ fontFamily: VM.fontMono, fontSize: "0.58rem", background: `${VM.blue}15`, color: VM.blue, border: `1px solid ${VM.blue}30`, padding: "1px 4px", borderRadius: "4px" }}>
                                  {ach.dateEarned}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: "4px 0 0 0", fontFamily: VM.fontBody, fontSize: "0.72rem", color: VM.muted, lineHeight: "1.3" }}>{ach.description}</p>
                          </div>

                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Modal Cancel & Save Footer inside Swarm tab too */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${VM.border}` }}>
                  <button onClick={() => setSelectedRecord(null)}
                    style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", color: VM.muted, fontFamily: VM.fontMono, fontSize: "0.8rem" }}>
                    Close
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}


      {/* Mass Update Modal */}
      {isMassUpdating && (
          <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 300,
          }}>
              <div style={{
                  background: VM.card,
                  border: `1px solid ${VM.emerald}`,
                  borderRadius: "12px",
                  padding: "24px",
                  width: "500px",
                  boxShadow: `0 0 40px ${VM.emerald}40`
              }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontFamily: VM.fontHead, color: VM.emerald, margin: 0, letterSpacing: "0.1em" }}>Mass Configuration Update</h3>
                      <button onClick={() => setIsMassUpdating(false)} style={{ background: "transparent", border: "none", color: VM.muted, cursor: "pointer" }}><X size={16} /></button>
                  </div>
                  <p style={{ fontFamily: VM.fontMono, fontSize: "0.8rem", color: VM.text, marginBottom: "16px" }}>
                      Updating {selectedRecords.size} {activeTab === "ai_bots" ? "Advocates" : "Users"}. Fields left blank will not be modified.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                      <div>
                          <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Assigned To (Team)</label>
                          <select 
                              value={massUpdateForm.assigned_to}
                              onChange={e => setMassUpdateForm({...massUpdateForm, assigned_to: e.target.value})}
                              style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "8px", fontFamily: VM.fontMono, fontSize: "0.8rem", outline: "none" }}
                          >
                              <option value="">-- No Change --</option>
                              <option value="global">GLOBAL (Unassigned)</option>
                              {mlbTeams.map(team => (
                                  <option key={team} value={team}>{team}</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Status</label>
                          <select 
                              value={massUpdateForm.active}
                              onChange={e => setMassUpdateForm({...massUpdateForm, active: e.target.value})}
                              style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "8px", fontFamily: VM.fontMono, fontSize: "0.8rem", outline: "none" }}
                          >
                              <option value="">-- No Change --</option>
                              <option value="1">Active</option>
                              <option value="0">Inactive</option>
                          </select>
                      </div>

                      <div>
                          <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deployment Zone</label>
                          <select 
                              value={massUpdateForm.u_deployment_zone}
                              onChange={e => setMassUpdateForm({...massUpdateForm, u_deployment_zone: e.target.value})}
                              style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "8px", fontFamily: VM.fontMono, fontSize: "0.8rem", outline: "none" }}
                          >
                              <option value="">-- No Change --</option>
                              <option value="NONE">Clear Zone (None)</option>
                              <option value="BENCHED">Benched</option>
                              <option value="BULLPEN">Bullpen</option>
                          </select>
                      </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button onClick={() => setIsMassUpdating(false)} style={{ background: "transparent", border: `1px solid ${VM.border}`, color: VM.text, padding: "8px 16px", borderRadius: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                      <button 
                          onClick={handleMassUpdate} 
                          disabled={isSaving || (massUpdateForm.assigned_to === "" && massUpdateForm.active === "" && massUpdateForm.u_deployment_zone === "")}
                          style={{ background: VM.emerald, border: "none", color: "black", padding: "8px 16px", borderRadius: "6px", fontFamily: VM.fontMono, fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                          {isSaving ? "Updating..." : "Update Selected"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Keyframe injection */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
