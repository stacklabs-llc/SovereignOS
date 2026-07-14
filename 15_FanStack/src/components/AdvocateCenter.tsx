import React, { useState, useEffect, useCallback } from "react";
import { User, Bot, Search, Save, X, RefreshCw, AlertTriangle, ChevronDown, Download, FileText, Server, Plus, Edit, Eye, Trash2, CheckSquare, Square, Printer, Image as ImageIcon, Sparkles, Upload } from "lucide-react";


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
  SMYRNAPAWSPROVISIONS: { primary: "#1F3B2E", secondary: "#E05A2B" },
  "SMYRNAPAWS&PROVISIONS": { primary: "#1F3B2E", secondary: "#E05A2B" },
  NYJ: { primary: "#125740", secondary: "#ffffff" },
  DAL: { primary: "#003594", secondary: "#869397" },
  GB: { primary: "#203731", secondary: "#ffb612" },
  UFL: { primary: "#16a34a", secondary: "#1e293b" },
  GLOBAL: { primary: "#0284c7", secondary: "#334155" },
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

// Sub-component for 3D Advocate Cards
function AdvocateCard({ 
  r, 
  isSelected, 
  onSelect, 
  onToggleSelect, 
  onRefresh 
}: { 
  r: any; 
  isSelected: boolean; 
  onSelect: (record: any) => void; 
  onToggleSelect: (id: string, e: React.MouseEvent) => void; 
  onRefresh: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [deepLore, setDeepLore] = useState(r.introduction || "");
  const [systemPrompt, setSystemPrompt] = useState(r.u_system_prompt || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Sync state if prop changes
  useEffect(() => {
    setDeepLore(r.introduction || "");
    setSystemPrompt(r.u_system_prompt || "");
  }, [r.introduction, r.u_system_prompt]);

  const styleType = r.u_visual_style || "";
  const isHeritage = styleType === "90s_cardboard_comic";
  const isCosmic = styleType === "style_pixel";
  const isFlagship = !isHeritage && !isCosmic;

  const avatarKey = (r.user_name || r.name || "").toLowerCase().replace(/[\s]/g, '_');
  const avatarUrl = r.avatar_url || `/api/persona_image/${avatarKey}`;
  const bust = r._avatarBust ? `?t=${r._avatarBust}` : '';
  const hasCustomAsset = !!r.avatar_url;

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

  const cadence = (r.u_cadence || "pacer").toLowerCase();
  let cadenceStyle = { bg: "rgba(0, 212, 255, 0.1)", text: VM.blue as string, border: `1px solid rgba(0, 212, 255, 0.2)` };
  if (cadence === "agitator") {
    cadenceStyle = { bg: "rgba(255, 89, 16, 0.1)", text: VM.orange as string, border: `1px solid rgba(255, 89, 16, 0.2)` };
  } else if (cadence === "lurker") {
    cadenceStyle = { bg: "rgba(90, 122, 138, 0.1)", text: VM.muted as string, border: `1px solid rgba(90, 122, 138, 0.2)` };
  } else if (cadence === "reactant" || cadence === "yapper") {
    cadenceStyle = { bg: "rgba(0, 255, 136, 0.1)", text: VM.emerald as string, border: `1px solid rgba(0, 255, 136, 0.2)` };
  }

  const stagedCount = ((r.user_name || "").charCodeAt(0) % 4) + 1;

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('sovereign_session_token') || '';
      const res = await fetch(`/api/now/table/cmdb_ci_ai_persona/${r.sys_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          introduction: deepLore,
          u_system_prompt: systemPrompt
        })
      });
      if (res.ok) {
        onRefresh();
        setIsFlipped(false);
      } else {
        alert("Failed to update advocate details");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating advocate");
    } finally {
      setIsUpdating(false);
    }
  };

  // Card flipping layouts & styles
  const cardContainerStyle: React.CSSProperties = {
    perspective: "1000px",
    width: "100%",
    height: "390px",
    position: "relative"
  };

  const cardInnerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    transformStyle: "preserve-3d",
    transform: isFlipped ? "rotateY(180deg)" : "none",
  };

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: "20px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  // Front layout styles based on theme
  const getFrontCardStyles = () => {
    if (isHeritage) {
      return {
        background: "#e4d5b7", // Textured heritage cream
        border: isSelected ? `3px solid ${VM.blue}` : `3px solid #8b5a2b`,
        boxShadow: isSelected ? `0 12px 30px rgba(0,212,255,0.3)` : (hovered ? "0 12px 30px rgba(139,90,43,0.3)" : "0 8px 24px rgba(0,0,0,0.5)"),
        transform: hovered && !isSelected ? "translateY(-6px)" : "none",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
      };
    }
    if (isCosmic) {
      return {
        background: `linear-gradient(135deg, #0b0518 0%, #1f0b35 100%)`, // Cosmic dark purple
        border: isSelected ? `2px solid ${VM.blue}` : (hovered ? `2px solid #ff00ff` : `2px solid #4a1d6d`),
        boxShadow: isSelected ? `0 12px 30px rgba(0,212,255,0.4)` : (hovered ? "0 12px 30px rgba(255,0,255,0.4)" : "0 8px 24px rgba(0,0,0,0.6)"),
        transform: hovered && !isSelected ? "translateY(-6px)" : "none",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
      };
    }
    // Flagship
    return {
      background: isSelected ? `linear-gradient(135deg, ${VM.blue}15, ${VM.card})` : `linear-gradient(135deg, ${VM.card}, ${VM.surface})`,
      border: `2px solid ${isSelected ? VM.blue : (hovered ? VM.emerald : VM.border)}`,
      boxShadow: isSelected ? `0 12px 30px rgba(0,212,255,0.2), 0 0 0 1px ${VM.blue}` : (hovered ? `0 12px 30px rgba(0,255,136,0.15), 0 0 0 1px ${VM.emerald}` : "0 8px 24px rgba(0,0,0,0.4)"),
      transform: hovered && !isSelected ? "translateY(-6px)" : "none",
      transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
    };
  };

  return (
    <div 
      style={cardContainerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={cardInnerStyle}>
        
        {/* CARD FRONT */}
        <div 
          style={{ ...faceStyle, ...getFrontCardStyles() }}
          onClick={() => onSelect(r)}
        >
          {/* Checkbox selector */}
          <div style={{ position: "absolute", top: "14px", right: "14px", zIndex: 12 }}>
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={() => {}}
              onClick={(e) => onToggleSelect(r.sys_id, e)}
              style={{ cursor: "pointer", width: "20px", height: "20px", accentColor: VM.blue, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}
            />
          </div>

          {/* Quick Flip button (top-right next to checkbox) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(true);
            }}
            style={{
              position: "absolute",
              top: "14px",
              right: "46px",
              zIndex: 12,
              background: isHeritage ? "#8b5a2b" : "rgba(0,0,0,0.6)",
              border: `1px solid ${isHeritage ? "#3a2010" : VM.border}`,
              color: isHeritage ? "#e4d5b7" : VM.text,
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "0.6rem",
              fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <RefreshCw size={10} />
            {isHeritage ? "STATS" : "FLIP"}
          </button>

          {/* Image Section / Fallback gradient */}
          <div style={{ height: "55%", width: "100%", position: "relative", overflow: "hidden" }}>
            <div style={{ 
              position: "absolute", 
              inset: 0, 
              background: isHeritage 
                ? "linear-gradient(to bottom, transparent 40%, #e4d5b7 100%)" 
                : (isCosmic ? "linear-gradient(to bottom, transparent 40%, #0b0518 100%)" : "linear-gradient(to bottom, transparent 40%, #0d1820 100%)"), 
              zIndex: 3 
            }} />
            
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
                <span style={{
                  fontFamily: isHeritage ? "Georgia, serif" : VM.fontHead,
                  fontSize: "3.2rem",
                  fontWeight: "black",
                  color: isHeritage ? "#3a2010" : "#ffffff",
                  textShadow: "0 4px 14px rgba(0,0,0,0.7)",
                  letterSpacing: "0.05em",
                  zIndex: 2
                }}>
                  {(r.user_name || "").substring(0, 2).toUpperCase()}
                </span>
                <span style={{
                  position: "absolute",
                  bottom: "16px",
                  fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono,
                  fontSize: "0.62rem",
                  color: isHeritage ? "#3a2010" : "#ffffff",
                  letterSpacing: "0.15em",
                  zIndex: 2,
                  background: isHeritage ? "rgba(228,213,183,0.8)" : "rgba(0,0,0,0.45)",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: `1px solid ${isHeritage ? "#8b5a2b" : "rgba(255,255,255,0.1)"}`,
                  backdropFilter: "blur(4px)"
                }}>
                  🏟️ {teamCode || "GLOBAL"} STADIUM
                </span>
              </div>
            ) : (
              <img 
                src={avatarUrl + bust}
                alt={r.user_name}
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 2 }}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${r.user_name}&backgroundColor=0f172a&textColor=ffffff`; }}
              />
            )}

            {/* Team tag in upper left */}
            {teamCode && (
              <div style={{ 
                position: "absolute", 
                top: "14px", 
                left: "14px", 
                zIndex: 10, 
                background: isHeritage ? "#8b5a2b" : "rgba(0,4,10,0.75)", 
                border: `1px solid ${isHeritage ? "#3a2010" : VM.border}`, 
                padding: "4px 10px", 
                borderRadius: "6px", 
                fontFamily: isHeritage ? "Georgia, serif" : VM.fontHead, 
                fontSize: "0.75rem", 
                color: isHeritage ? "#e4d5b7" : badgeTextColor, 
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
              background: isHeritage ? "rgba(139,90,43,0.2)" : "rgba(224, 188, 104, 0.15)",
              border: `1px solid ${isHeritage ? "#8b5a2b" : VM.gold}40`,
              color: isHeritage ? "#8b5a2b" : VM.gold,
              borderRadius: "6px",
              padding: "2px 8px",
              fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono,
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              fontWeight: "bold",
              backdropFilter: "blur(4px)"
            }}>
              ⚡ {stagedCount} STAGED
            </div>
          </div>

          {/* Content Section */}
          <div style={{ 
            flex: 1, 
            padding: "18px", 
            display: "flex", 
            flexDirection: "column", 
            position: "relative", 
            zIndex: 4, 
            background: isHeritage ? "#f4ebd0" : (isCosmic ? "#0b0518" : "#0d1820") 
          }}>
            <h3 style={{ 
              fontFamily: isHeritage ? "Georgia, serif" : VM.fontHead, 
              fontSize: "1.25rem", 
              color: isHeritage ? "#3a2010" : (isCosmic ? "#ff00ff" : VM.gold), 
              margin: "0 0 4px 0", 
              letterSpacing: "0.05em", 
              textTransform: "uppercase", 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis" 
            }}>
              {r.user_name}
            </h3>
            
            <div style={{ 
              fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, 
              fontSize: "0.75rem", 
              color: isHeritage ? "#8b2500" : (isCosmic ? "#00ffff" : VM.emerald), 
              textTransform: "uppercase", 
              letterSpacing: "0.1em", 
              marginBottom: "12px", 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis" 
            }}>
              {r.title || "Sovereign Analyst"}
            </div>

            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "6px", 
              marginBottom: "16px", 
              background: isHeritage ? "rgba(139,90,43,0.1)" : "rgba(0,0,0,0.2)", 
              padding: "10px", 
              borderRadius: "6px", 
              border: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}` 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.6rem", color: isHeritage ? "#8b5a2b" : VM.muted, textTransform: "uppercase" }}>Zone</span>
                <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.68rem", color: r.u_deployment_zone ? (isHeritage ? "#3a2010" : VM.blue) : (isHeritage ? "#8b5a2b" : VM.muted), fontWeight: "bold" }}>
                  {r.u_deployment_zone || "—"}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Status Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.58rem", color: isHeritage ? "#8b5a2b" : VM.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    background: r.active === 1 ? (isHeritage ? "#1f3b2e" : VM.emerald) : VM.danger,
                    boxShadow: r.active === 1 && !isHeritage ? `0 0 8px ${VM.emerald}` : "none",
                    display: "inline-block"
                  }} />
                  <span style={{ 
                    fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, 
                    fontSize: "0.75rem", 
                    color: r.active === 1 ? (isHeritage ? "#1f3b2e" : VM.emerald) : VM.danger, 
                    fontWeight: "bold", 
                    letterSpacing: "0.05em" 
                  }}>
                    {r.active === 1 ? "ACTIVE" : "OFFLINE"}
                  </span>
                </div>
              </div>

              {/* Cadence Badge */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.58rem", color: isHeritage ? "#8b5a2b" : VM.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cadence</span>
                <span style={{ 
                  fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, 
                  fontSize: "0.7rem", 
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  background: isHeritage ? "rgba(139,90,43,0.15)" : cadenceStyle.bg,
                  color: isHeritage ? "#8b5a2b" : cadenceStyle.text,
                  border: isHeritage ? "1px solid #8b5a2b" : cadenceStyle.border,
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

        {/* CARD BACK */}
        <div 
          style={{ 
            ...faceStyle, 
            transform: "rotateY(180deg)",
            background: isHeritage ? "#e4d5b7" : (isCosmic ? "#0b0518" : VM.card),
            border: `2px solid ${isHeritage ? "#8b5a2b" : VM.border}`,
            padding: "20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            color: isHeritage ? "#3a2010" : VM.text
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}`, paddingBottom: "8px" }}>
            <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontHead, fontSize: "0.85rem", fontWeight: "bold", color: isHeritage ? "#8b2500" : VM.gold }}>
              {isHeritage ? "ADVOCATE DOSSIER" : "QUICK PROTOCOLS"}
            </span>
            <span style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.7rem", color: isHeritage ? "#8b5a2b" : VM.muted }}>
              @{r.user_name}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
            {/* Deep Lore Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.6rem", color: isHeritage ? "#8b5a2b" : VM.muted, textTransform: "uppercase" }}>
                Deep Lore / Intro
              </label>
              <textarea
                value={deepLore}
                onChange={(e) => setDeepLore(e.target.value)}
                style={{
                  height: "75px",
                  resize: "none",
                  background: isHeritage ? "#f4ebd0" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}`,
                  borderRadius: "6px",
                  padding: "8px",
                  fontSize: "0.75rem",
                  color: isHeritage ? "#3a2010" : VM.text,
                  fontFamily: isHeritage ? "Georgia, serif" : "inherit"
                }}
              />
            </div>

            {/* System Prompt Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minHeight: 0 }}>
              <label style={{ fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono, fontSize: "0.6rem", color: isHeritage ? "#8b5a2b" : VM.muted, textTransform: "uppercase" }}>
                System Prompt Override
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                style={{
                  flex: 1,
                  resize: "none",
                  background: isHeritage ? "#f4ebd0" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}`,
                  borderRadius: "6px",
                  padding: "8px",
                  fontSize: "0.72rem",
                  color: isHeritage ? "#3a2010" : VM.text,
                  fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px", borderTop: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}`, paddingTop: "12px" }}>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              style={{
                flex: 1,
                background: isHeritage ? "#1f3b2e" : VM.emerald,
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono,
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textTransform: "uppercase"
              }}
            >
              <Save size={12} />
              {isUpdating ? "Saving..." : "Save"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              style={{
                flex: 1,
                background: isHeritage ? "rgba(139,90,43,0.15)" : "rgba(255,255,255,0.05)",
                color: isHeritage ? "#8b5a2b" : VM.text,
                border: `1px solid ${isHeritage ? "#8b5a2b" : VM.border}`,
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "0.75rem",
                fontFamily: isHeritage ? "Georgia, serif" : VM.fontMono,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textTransform: "uppercase"
              }}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function AdvocateCenter() {
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

  // Lookbook & Media Assets state
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaTab, setMediaTab] = useState<"All" | "Adventures" | "Raw Photos" | "Concept Art">("All");
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadExpr, setUploadExpr] = useState("");
  const [uploadCat, setUploadCat] = useState("Concept Art");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingExprAsset, setEditingExprAsset] = useState<any | null>(null);
  const [editExprVal, setEditExprVal] = useState("");
  const [editCatVal, setEditCatVal] = useState("");

  interface StyleItem {
    id: string;
    display_name: string;
    prompt_tokens: string;
    reference_asset: string;
    best_use_case: string;
  }
  const [styleRegistry, setStyleRegistry] = useState<StyleItem[]>([]);

  // MLB schedule — populates Zone dropdown
  const [mlbGames, setMlbGames]         = useState<{ game_pk: string; label: string; game_date: string }[]>([]);
  const [zoneWindow, setZoneWindow]     = useState<'today' | '7d'>('today');
  const [simulationZones, setSimulationZones] = useState<string[]>([]);

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

  const loadSimulationZones = async () => {
    try {
      const res = await fetch('/api/now/table/cmdb_ci_fanstack_room');
      if (res.ok) {
        const d = await res.json();
        const zones = Array.from(new Set((d.result || []).map((r: any) => r.room_key).filter(Boolean))) as string[];
        setSimulationZones(zones);
      }
    } catch { /* non-fatal */ }
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
    if (record && record.user_name) {
      loadMedia(record.user_name.toLowerCase().replace(/[\s]/g, '_'));
    }
  };

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

  const handleUploadExpression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedRecord) return;
    setIsUploading(true);
    setUploadError(null);

    const advName = selectedRecord.user_name.toLowerCase().replace(/[\s]/g, '_');
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
      const fileInput = document.getElementById("lookbook_file_input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await loadMedia(advName);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateExpression = async (asset: any) => {
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
      if (selectedRecord) {
        await loadMedia(selectedRecord.user_name.toLowerCase().replace(/[\s]/g, '_'));
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
      if (selectedRecord) {
        await loadMedia(selectedRecord.user_name.toLowerCase().replace(/[\s]/g, '_'));
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
    if (!selectedRecord) return;
    const adv = selectedRecord.user_name.toLowerCase().replace(/[\s]/g, '_');
    let url = `/api/media/print_lookbook?advocate=${adv}`;
    if (selectedMediaIds.size > 0) {
      url += `&ids=${Array.from(selectedMediaIds).join(",")}`;
    }
    window.open(url, "_blank");
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
      u_visual_style: "90s_cardboard_comic",
      u_boggs_reactivity: 5,
    };
    setSelectedRecord(newRecord);
    setEditForm(newRecord);
    setLiveAvatarUrl(null);
    setUploadStatus(null);
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
      const newUrl = json.avatar_url || `/api/persona_image/${personaName.toLowerCase()}`;
      setLiveAvatarUrl(newUrl + `?t=${Date.now()}`);
      if (editForm) {
        setEditForm({ ...editForm, avatar_url: newUrl });
      }
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

  const handleExportJSON = () => {
    const recordsToExport = getRecordsToExport();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recordsToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // Conditionally assign the download filename based on selection count
    const filename = (selectedRecords.size === 1 && recordsToExport.length === 1)
      ? `${recordsToExport[0].user_name}_export.json`
      : `sovereign_${activeTab}_export.json`;
    downloadAnchorNode.setAttribute("download", filename);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportMD = () => {
    const recordsToExport = getRecordsToExport();
    let mdStr = `# Sovereign OS — AI Advocates Export\n\n`;
    
    recordsToExport.forEach((record: any) => {
       const name = record.user_name;
       const avatarUrl = record.avatar_url || `/api/persona_image/${name.toLowerCase().replace(/\s/g, '_')}`;
       
       mdStr += `## ${name}\n\n`;
       mdStr += `![${name} Avatar](${avatarUrl})\n\n`;
       mdStr += `**Team:** ${record.department || record.assigned_to || "N/A"}\n\n`;
       mdStr += `**Cadence:** ${record.u_cadence || "pacer"}\n\n`;
       mdStr += `**Boggs Reactivity:** ${record.u_boggs_reactivity || "N/A"}\n\n`;
       mdStr += `**System Prompt:**\n\`\`\`\n${record.u_system_prompt || "N/A"}\n\`\`\`\n\n`;
       mdStr += `**Behavior Notes:**\n${record.u_behavior_expectations || "N/A"}\n\n`;
       mdStr += `**Deep Lore:**\n${record.u_deep_lore || "N/A"}\n\n`;
       mdStr += `**Governance:**\n${record.u_governance_boundaries || "N/A"}\n\n`;
       mdStr += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdStr);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    // Conditionally assign the download filename based on selection count
    const filename = (selectedRecords.size === 1 && recordsToExport.length === 1)
      ? `${recordsToExport[0].user_name}_export.md`
      : "sovereign_personas_export.md";
    downloadAnchorNode.setAttribute("download", filename);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const botData = await fetchTable<AiPersona>("cmdb_ci_ai_persona");
      setBots(botData);

      const res = await fetch("/api/style_registry");
      if (res.ok) {
        const d = await res.json();
        setStyleRegistry(d.styles || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMDB records");
    } finally {
      setLoading(false);
    }
    loadMlbGames('today');
    loadTeams();
    loadSimulationZones();
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
          {activeTab === "ai_bots" && (
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
      <div style={{ flex: 1, overflow: "auto", borderRadius: "6px", border: viewMode === "list" ? `1px solid ${VM.border}` : "none", position: "relative" }}>
        <div className="zone-badge" style={{ top: '6px', left: '6px' }}>[ZONE-1] PERSONA DIRECTORY</div>
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
            {activeRecords.map((record) => (
              <AdvocateCard
                key={record.sys_id}
                r={record}
                isSelected={selectedRecords.has(record.sys_id)}
                onSelect={(rec) => handleSelectRecord(rec as AiPersona)}
                onToggleSelect={(id, e) => toggleSelection(id, e)}
                onRefresh={() => loadData()}
              />
            ))}
          </div>
        ) : false ? (
          <div style={{ display: "none" }}>
            {activeRecords.map((record) => {
              const isSelected = selectedRecords.has(record.sys_id);
              const r = record as any;
              
              const avatarKey = (r.user_name || r.name || "").toLowerCase().replace(/[\s]/g, '_');
              const bust = r._avatarBust ? `?t=${r._avatarBust}` : '';
              
              const hasCustomAsset = !!r.avatar_url;
              const avatarUrl = r.avatar_url || `/api/persona_image/${avatarKey}`;
              
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
                        <span style={{
                          fontFamily: VM.fontHead,
                          fontSize: "3.2rem",
                          fontWeight: "black",
                          color: "#ffffff",
                          textShadow: "0 4px 14px rgba(0,0,0,0.7)",
                          letterSpacing: "0.05em",
                          zIndex: 2
                        }}>
                          {((r.user_name || r.name || "") as string).substring(0, 2).toUpperCase()}
                        </span>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", border: `1px solid ${VM.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: VM.fontMono, fontSize: "0.6rem", color: VM.muted, textTransform: "uppercase" }}>Zone</span>
                        <span style={{ fontFamily: VM.fontMono, fontSize: "0.68rem", color: r.u_deployment_zone ? VM.blue : VM.muted, fontWeight: "bold" }}>{r.u_deployment_zone || "—"}</span>
                      </div>
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${VM.border}` }}>
                {activeTab === "ai_bots"
                  ? [
                      { label: "Name", key: "user_name" },
                      { label: "Team", key: "assigned_to" },
                      { label: "Deployment Zone", key: "u_deployment_zone" },
                      { label: "Last Updated", key: "sys_updated_on" },
                      { label: "Cadence", key: "u_cadence" },
                      { label: "Status", key: "active" }
                    ].map((h) => (
                      <th
                        key={h.key}
                        onClick={() => handleSort(h.key)}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontFamily: VM.fontMono,
                          fontSize: "0.65rem",
                          color: VM.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          background: VM.surface,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        {h.label} {sortConfig?.key === h.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))
                  : activeTab === "hardware"
                  ? [
                      { label: "Name", key: "name" },
                      { label: "IP Address", key: "ip_address" },
                      { label: "Model", key: "model_id" },
                      { label: "Status", key: "operational_status" }
                    ].map((h) => (
                      <th
                        key={h.key}
                        onClick={() => handleSort(h.key)}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontFamily: VM.fontMono,
                          fontSize: "0.65rem",
                          color: VM.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          background: VM.surface,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        {h.label} {sortConfig?.key === h.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))
                  : [
                      { label: "Name", key: "user_name" },
                      { label: "Email", key: "email" },
                      { label: "Title", key: "title" },
                      { label: "Status", key: "active" }
                    ].map((h) => (
                      <th
                        key={h.key}
                        onClick={() => handleSort(h.key)}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontFamily: VM.fontMono,
                          fontSize: "0.65rem",
                          color: VM.muted,
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          background: VM.surface,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        {h.label} {sortConfig?.key === h.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {activeRecords.map((record) => {
                const bot = record as AiPersona;
                const isActive = (record as any).active === 1;
                const isSelected = selectedRecords.has(record.sys_id);

                return (
                  <tr
                    key={record.sys_id}
                    onClick={(e) => toggleSelection(record.sys_id, e)}
                    style={{
                      background: isSelected ? `${VM.blue}10` : "transparent",
                      borderBottom: `1px solid ${VM.border}50`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = VM.surface; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Name cell — click opens full editor */}
                    <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}}
                          style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: VM.blue, marginRight: "4px", pointerEvents: "none" }} />
                        <Bot size={12} style={{ color: VM.emerald }} />
                        <span onClick={(e) => { e.stopPropagation(); handleSelectRecord(record as AiPersona); }}
                          style={{ color: VM.emerald, textDecoration: "underline", cursor: "pointer", fontWeight: "bold" }}>
                          {(record as any).user_name}
                        </span>
                      </div>
                    </td>

                    {/* Team cell — double-click to inline edit */}
                    <td
                      onDoubleClick={(e) => startInlineEdit(e, record.sys_id, "assigned_to", bot.assigned_to ?? "")}
                      title="Double-click to edit team"
                      style={{ padding: "8px 14px", fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.muted, cursor: "cell", minWidth: "80px" }}>
                      {inlineEdit?.sys_id === record.sys_id && inlineEdit.field === "assigned_to" ? (
                        <select autoFocus value={inlineEdit.value}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: VM.surface, border: `1px solid ${VM.blue}`, borderRadius: "4px", color: VM.text, fontFamily: VM.fontMono, fontSize: "0.75rem", padding: "2px 4px", outline: "none" }}>
                          <option value="">— Global —</option>
                          {mlbTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <span style={{ borderBottom: `1px dashed ${VM.border}`, paddingBottom: "1px" }}>
                          {bot.assigned_to ?? "—"}
                        </span>
                      )}
                    </td>



                    {/* Deployment Zone cell — double-click to inline edit */}
                    <td
                      onDoubleClick={(e) => startInlineEdit(e, record.sys_id, "u_deployment_zone", bot.u_deployment_zone ?? "")}
                      title="Double-click to edit deployment zone"
                      style={{ padding: "8px 14px", fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.muted, cursor: "cell", minWidth: "130px" }}>
                      {inlineEdit?.sys_id === record.sys_id && inlineEdit.field === "u_deployment_zone" ? (
                        <select autoFocus value={inlineEdit.value}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: VM.surface, border: `1px solid ${VM.blue}`, borderRadius: "4px", color: VM.text, fontFamily: VM.fontMono, fontSize: "0.75rem", padding: "2px 4px", outline: "none" }}>
                          <option value="">— None —</option>
                          <option value="BENCHED">Benched</option>
                          <option value="BULLPEN">Bullpen</option>
                          <optgroup label="Active Simulation Rooms">
                            {simulationZones.map((z, idx) => <option key={`sz_${z}_${idx}`} value={z}>{z}</option>)}
                          </optgroup>
                          <optgroup label="MLB Game Rooms">
                            {mlbGames.map((g, idx) => <option key={`room_${g.game_pk}_${idx}`} value={`room_${g.game_pk}`}>{g.label} ({`room_${g.game_pk}`})</option>)}
                          </optgroup>
                        </select>
                      ) : (
                        <span style={{ borderBottom: `1px dashed ${VM.border}`, paddingBottom: "1px", color: bot.u_deployment_zone ? VM.blue : VM.muted }}>
                          {bot.u_deployment_zone || "—"}
                        </span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td style={{ padding: "8px 14px", fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.muted }}>
                      {bot.sys_updated_on ? new Date(bot.sys_updated_on).toLocaleString() : "—"}
                    </td>


                    {/* Cadence */}
                    <td style={{ padding: "8px 14px", fontFamily: VM.fontMono, fontSize: "0.7rem" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em",
                        background: `${VM.blue}15`, color: VM.blue, border: `1px solid ${VM.blue}30` }}>
                        {({ pacer: "Pacer", lurker: "Lurker", agitator: "Agitator", reactant: "Reactant", Lurker: "Lurker", Agitator: "Agitator", Reactant: "Reactant" }[(bot.u_cadence ?? "pacer").toLowerCase()] ?? bot.u_cadence ?? "Pacer")}
                      </span>
                    </td>

                    {/* Status — double-click to toggle */}
                    <td
                      onDoubleClick={(e) => { e.stopPropagation(); const cur = String((record as any).active ?? "1"); startInlineEdit(e, record.sys_id, "active", cur); }}
                      title="Double-click to toggle status"
                      style={{ padding: "8px 14px", cursor: "cell" }}>
                      {inlineEdit?.sys_id === record.sys_id && inlineEdit.field === "active" ? (
                        <select autoFocus value={inlineEdit.value}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onBlur={commitInlineEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitInlineEdit(); if (e.key === "Escape") setInlineEdit(null); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: VM.surface, border: `1px solid ${VM.blue}`, borderRadius: "4px", color: VM.text, fontFamily: VM.fontMono, fontSize: "0.75rem", padding: "2px 4px", outline: "none" }}>
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      ) : (
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "0.6rem", fontFamily: VM.fontMono, textTransform: "uppercase", letterSpacing: "0.1em",
                          background: isActive ? `${VM.emerald}15` : `${VM.danger}15`, color: isActive ? VM.emerald : VM.danger, border: `1px solid ${isActive ? VM.emerald : VM.danger}30` }}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                  </tr>

                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Edit Persona Modal ── */}
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
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRecord(null); }}
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
                  src={editForm.avatar_url || `/api/persona_image/${(editForm.user_name || "").toLowerCase().replace(/[\s]/g, '_')}`}
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
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSave} disabled={isSaving}
                  style={{ background: VM.emerald, border: "none", borderRadius: "8px", padding: "8px 20px", color: "#000", cursor: isSaving ? "wait" : "pointer", fontFamily: VM.fontMono, fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", transition: "opacity 0.2s" }}
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

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
              <div className="zone-badge" style={{ top: '6px', left: '6px' }}>[ZONE-2] PERSONA EDITOR</div>

              {/* Avatar Upload */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", background: VM.surface, padding: "16px 20px", borderRadius: "10px", border: `1px solid ${VM.border}` }}>
                <img
                  src={liveAvatarUrl || editForm.avatar_url || `/api/persona_image/${(editForm.user_name || "").toLowerCase().replace(/[\s]/g, '_')}`}
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
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: uploadingAvatar ? VM.surface : "transparent", border: `1px solid ${VM.blue}`, borderRadius: "6px", padding: "6px 14px", color: VM.blue, cursor: uploadingAvatar ? "wait" : "pointer", fontFamily: VM.fontMono, fontSize: "0.75rem" }}>
                    {uploadingAvatar ? "⏳ Uploading…" : "Choose Image"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
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
                    { key: "u_deployment_zone", label: "Deployment Zone", type: "zone-select" },
                    { key: "u_cadence", label: "Cadence", type: "cadence-select" },
                    { key: "u_visual_style", label: "Visual Style", type: "style-select" },
                    { key: "u_boggs_reactivity", label: "Brand Entropy Level (1 - 11)", type: "entropy-slider" },
                  ].map(({ key, label, type }) => (
                    <div key={key} style={{ gridColumn: type === "entropy-slider" ? "span 2" : "span 1" }}>
                      <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{label}</label>
                      {type === "team-select" ? (
                        <select value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                          onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                          <option value="">Unassigned (Global)</option>
                          {mlbTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : type === "status-select" ? (
                        <select value={String(editForm[key] ?? "1")} onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) })}
                          style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                          onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      ) : type === "cadence-select" ? (
                        <select value={String(editForm[key] || "pacer")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                          onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                          <option value="pacer">Pacer (Standard)</option>
                          <option value="lurker">Lurker (Quiet)</option>
                          <option value="agitator">Agitator (Frequent)</option>
                          <option value="reactant">Reactant (Event Only)</option>
                        </select>
                      ) : type === "zone-select" ? (
                        <select value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none" }}
                          onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                          <option value="">— None (Clear Zone) —</option>
                          <option value="BENCHED">Benched</option>
                          <option value="BULLPEN">Bullpen</option>
                          <optgroup label="Active Simulation Rooms">
                            {simulationZones.map((z, idx) => <option key={`sz_${z}_${idx}`} value={z}>{z}</option>)}
                          </optgroup>
                          <optgroup label="MLB Game Rooms">
                            {mlbGames.map((g, idx) => <option key={`room_${g.game_pk}_${idx}`} value={`room_${g.game_pk}`}>{g.label} ({`room_${g.game_pk}`})</option>)}
                          </optgroup>
                        </select>
                      ) : type === "style-select" ? (
                        <div>
                          <select value={String(editForm[key] || "90s_cardboard_comic")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                            style={{ width: "100%", background: VM.surface, border: `1px solid ${VM.border}`, borderRadius: "6px", color: VM.text, padding: "10px 12px", fontFamily: VM.fontMono, fontSize: "0.82rem", outline: "none", marginBottom: "8px" }}
                            onFocus={(e) => e.target.style.borderColor = VM.emerald} onBlur={(e) => e.target.style.borderColor = VM.border}>
                            {styleRegistry.length > 0 ? (
                              styleRegistry.map((style, idx) => (
                                <option key={`style_${style.id}_${idx}`} value={style.id}>{style.display_name}</option>
                              ))
                            ) : (
                              <>
                                <option value="90s_cardboard_comic">90s Cardboard Comic</option>
                                <option value="style_felt">Style A: Traumatized Fuzzy Felt</option>
                                <option value="style_pixel">Style B: 16-Bit Pixel Grid</option>
                                <option value="style_clay">Style C: Unraveled Claymation</option>
                                <option value="style_apathetic">Style D: Apathetic Claymation</option>
                              </>
                            )}
                          </select>
                          
                          {/* Rich Visual Style Preview Card */}
                          {(() => {
                            const currentStyleId = editForm[key] || "90s_cardboard_comic";
                            const styleObj = styleRegistry.find(s => s.id === currentStyleId);
                            if (!styleObj) return null;
                            
                            const cleanAssetName = styleObj.reference_asset.replace(/\.[^/.]+$/, "");
                            const referenceUrl = `/api/persona_image/${cleanAssetName}`;
                            
                            return (
                              <div style={{
                                display: "flex",
                                gap: "12px",
                                background: "rgba(15, 23, 42, 0.4)",
                                border: `1px dashed ${VM.border}`,
                                borderRadius: "8px",
                                padding: "12px",
                                marginTop: "8px",
                                backdropFilter: "blur(4px)"
                              }}>
                                <img 
                                  src={referenceUrl}
                                  alt={styleObj.display_name}
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "6px",
                                    objectFit: "cover",
                                    border: `1px solid ${VM.border}`
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${styleObj.display_name}&backgroundColor=0f172a&textColor=ffffff`;
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.75rem", fontWeight: "bold", color: VM.emerald, marginBottom: "4px" }}>
                                    {styleObj.display_name}
                                  </div>
                                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.68rem", color: VM.text, marginBottom: "4px", lineHeight: "1.2" }}>
                                    <strong>Prompt:</strong> {styleObj.prompt_tokens}
                                  </div>
                                  <div style={{ fontFamily: VM.fontMono, fontSize: "0.62rem", color: VM.muted }}>
                                    <strong>Best Use:</strong> {styleObj.best_use_case}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : type === "entropy-slider" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: VM.surface, padding: "8px 12px", borderRadius: "6px", border: `1px solid ${VM.border}` }}>
                          <input type="range" min="1" max="11" step="1" value={Number(editForm[key] ?? 5)} onChange={(e) => setEditForm({ ...editForm, [key]: parseInt(e.target.value) })}
                            style={{ flex: 1, accentColor: VM.emerald, cursor: "pointer" }} />
                          <span style={{ fontFamily: VM.fontMono, fontSize: "0.9rem", color: VM.emerald, fontWeight: "bold", minWidth: "24px", textAlign: "right" }}>
                            {editForm[key] ?? 5}
                          </span>
                        </div>
                      ) : (
                        <input value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
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
                <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Introduction / Short Bio</label>
                <textarea value={String(editForm.introduction || "")} onChange={(e) => setEditForm({ ...editForm, introduction: e.target.value })}
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
                  ].map(({ key, label, h }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontFamily: VM.fontMono, fontSize: "0.65rem", color: VM.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{label}</label>
                      <textarea value={String(editForm[key] || "")} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
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
                    disabled={isSaving}
                    style={{
                      background: "transparent",
                      border: `1px solid ${VM.danger}`,
                      borderRadius: "8px",
                      padding: "10px 20px",
                      cursor: isSaving ? "wait" : "pointer",
                      color: VM.danger,
                      fontFamily: VM.fontMono,
                      fontSize: "0.8rem",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${VM.danger}15`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Delete Advocate
                  </button>
                ) : <div />}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setSelectedRecord(null)}
                    style={{ background: "transparent", border: `1px solid ${VM.border}`, borderRadius: "8px", padding: "10px 20px", cursor: "pointer", color: VM.muted, fontFamily: VM.fontMono, fontSize: "0.8rem" }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving}
                    style={{ background: VM.emerald, border: "none", borderRadius: "8px", padding: "10px 24px", color: "#000", cursor: isSaving ? "wait" : "pointer", fontFamily: VM.fontMono, fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

            </div>
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
                              <optgroup label="Active Simulation Rooms">
                                {simulationZones.map((z, idx) => <option key={`sz_${z}_${idx}`} value={z}>{z}</option>)}
                              </optgroup>
                              <optgroup label="MLB Game Rooms">
                                {mlbGames.map((g, idx) => <option key={`room_${g.game_pk}_${idx}`} value={`room_${g.game_pk}`}>{g.label} ({`room_${g.game_pk}`})</option>)}
                              </optgroup>
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
