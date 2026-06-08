import { useState, useEffect, useCallback } from "react";
import { User, Bot, Search, Save, X, RefreshCw, AlertTriangle, ChevronDown } from "lucide-react";

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

type ActiveTab = "ai_bots" | "humans";

/* ── API Config ── */
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://192.168.1.73:8096";

async function fetchTable<T>(table: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}/api/now/table/${table}`);
  if (!res.ok) throw new Error(`${table}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.result ?? [];
}

/* ── Main Component ── */
export default function CmdbWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("ai_bots");
  const [bots, setBots] = useState<AiPersona[]>([]);
  const [humans, setHumans] = useState<SysUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AiPersona | SysUser | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [humanData, botData] = await Promise.all([
        fetchTable<SysUser>("sys_user"),
        fetchTable<AiPersona>("cmdb_ci_ai_persona"),
      ]);
      setHumans(humanData);
      setBots(botData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMDB records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Filtering ── */
  const filteredBots = bots.filter((b) =>
    b.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.city ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHumans = humans.filter((h) =>
    h.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRecords = activeTab === "ai_bots" ? filteredBots : filteredHumans;

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
            Sovereign Employee Center
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
            /now/cmdb/employee-center
          </p>
        </div>
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

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "1rem" }}>
        {(["ai_bots", "humans"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedRecord(null); }}
            style={{
              flex: 1,
              padding: "10px 0",
              background: activeTab === tab ? VM.surface : "transparent",
              border: `1px solid ${activeTab === tab ? VM.border : "transparent"}`,
              borderBottom: activeTab === tab ? `2px solid ${tab === "ai_bots" ? VM.emerald : VM.blue}` : "2px solid transparent",
              borderRadius: "6px 6px 0 0",
              color: activeTab === tab ? (tab === "ai_bots" ? VM.emerald : VM.blue) : VM.muted,
              fontFamily: VM.fontMono,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {tab === "ai_bots" ? <Bot size={14} /> : <User size={14} />}
            {tab === "ai_bots" ? `AI Personas (${bots.length})` : `Humans (${humans.length})`}
          </button>
        ))}
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
          placeholder={activeTab === "ai_bots" ? "Search personas by name or team..." : "Search users by name or email..."}
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

      {/* Record Table */}
      <div style={{ flex: 1, overflow: "auto", borderRadius: "6px", border: `1px solid ${VM.border}` }}>
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
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${VM.border}` }}>
                {activeTab === "ai_bots"
                  ? ["Name", "Team", "Engine", "Status"].map((h) => (
                      <th
                        key={h}
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
                        }}
                      >
                        {h}
                      </th>
                    ))
                  : ["Name", "Email", "Title", "Status"].map((h) => (
                      <th
                        key={h}
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
                        }}
                      >
                        {h}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {activeRecords.map((record) => {
                const isBot = activeTab === "ai_bots";
                const bot = record as AiPersona;
                const human = record as SysUser;
                const isActive = record.active === 1;

                return (
                  <tr
                    key={record.sys_id}
                    onClick={() => setSelectedRecord(record)}
                    style={{
                      borderBottom: `1px solid ${VM.border}50`,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = VM.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isBot ? <Bot size={12} style={{ color: VM.emerald }} /> : <User size={12} style={{ color: VM.blue }} />}
                        <span style={{ color: isBot ? VM.emerald : VM.blue }}>{record.user_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.muted }}>
                      {isBot ? bot.city ?? "—" : human.email ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.75rem", color: VM.muted }}>
                      {isBot ? bot.department ?? "—" : human.title ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontSize: "0.6rem",
                          fontFamily: VM.fontMono,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          background: isActive ? `${VM.emerald}15` : `${VM.danger}15`,
                          color: isActive ? VM.emerald : VM.danger,
                          border: `1px solid ${isActive ? VM.emerald : VM.danger}30`,
                        }}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedRecord && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "380px",
            height: "100%",
            background: VM.card,
            borderLeft: `1px solid ${VM.border}`,
            padding: "1.5rem",
            overflowY: "auto",
            zIndex: 10,
            boxShadow: `-20px 0 60px ${VM.bg}cc`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontFamily: VM.fontHead,
                fontSize: "0.9rem",
                color: VM.gold,
                letterSpacing: "0.1em",
                margin: 0,
              }}
            >
              Record Detail
            </h3>
            <button
              onClick={() => setSelectedRecord(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: VM.muted }}
            >
              <X size={16} />
            </button>
          </div>

          {Object.entries(selectedRecord).map(([key, value]) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: VM.fontMono,
                  fontSize: "0.6rem",
                  color: VM.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "4px",
                }}
              >
                {key}
              </label>
              <div
                style={{
                  fontFamily: VM.fontMono,
                  fontSize: "0.75rem",
                  color: VM.text,
                  padding: "8px 10px",
                  background: VM.surface,
                  borderRadius: "4px",
                  border: `1px solid ${VM.border}`,
                  wordBreak: "break-word",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                {value === null || value === "" ? <span style={{ color: VM.muted, fontStyle: "italic" }}>null</span> : String(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyframe injection */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
