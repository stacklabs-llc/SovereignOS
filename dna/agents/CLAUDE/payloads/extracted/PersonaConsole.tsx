import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Bot, Search, X, RefreshCw, AlertTriangle, Download,
  LayoutGrid, List, ChevronDown, Check, Filter,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   SOVEREIGN DESIGN TOKENS
   ══════════════════════════════════════════════════════════ */
const VM = {
  bg:       "#00040a",
  surface:  "#0a1118",
  card:     "#0d1820",
  border:   "#1a2a38",
  borderHi: "#2a3a4a",
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
  fontList: "'Inter', -apple-system, sans-serif",
} as const;

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ══════════════════════════════════════════════════════════ */
interface AiPersona {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string | null;
  title: string;
  introduction: string;
  city: string;
  department: string;         // LLM engine (gemini-flash, gemini-pro, etc.)
  active: number;
  sys_created_on: string;
  sys_updated_on: string;
  /* Extended fields — may be null until DB schema is updated */
  u_boggs_reactivity?: string | null;   // Low | Medium | High | Max Chaos | Always
  u_cadence?: string | null;            // Lurker | Pacer | Yapper
}

type ViewMode = "cards" | "list";

/* ══════════════════════════════════════════════════════════
   API LAYER
   ══════════════════════════════════════════════════════════ */
const API_BASE = import.meta.env?.VITE_API_BASE ?? "http://192.168.1.73:8096";

async function fetchPersonas(): Promise<AiPersona[]> {
  const res = await fetch(`${API_BASE}/api/now/table/cmdb_ci_ai_persona`);
  if (!res.ok) throw new Error(`cmdb_ci_ai_persona: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.result ?? []) as AiPersona[];
}

/* ══════════════════════════════════════════════════════════
   EXPORT PIPELINE
   ══════════════════════════════════════════════════════════ */
function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportJSON(personas: AiPersona[]) {
  const ts = new Date().toISOString().slice(0, 10);
  downloadBlob(
    JSON.stringify(personas, null, 2),
    `sovereign_personas_export_${ts}.json`,
    "application/json"
  );
}

function exportMarkdown(personas: AiPersona[]) {
  const ts = new Date().toISOString().slice(0, 10);
  const header = `# Sovereign Persona Export (${ts})\n\n`;
  const table = [
    "| Name | Team | Engine | Boggs | Cadence | Status |",
    "|------|------|--------|-------|---------|--------|",
    ...personas.map((p) =>
      `| ${p.user_name} | ${p.city || "—"} | ${p.department || "—"} | ${p.u_boggs_reactivity || "—"} | ${p.u_cadence || "—"} | ${p.active ? "Active" : "Inactive"} |`
    ),
  ].join("\n");

  const loreBlocks = personas
    .map(
      (p) =>
        `---\n## ${p.user_name}\n**Team:** ${p.city || "—"}  \n**Engine:** ${p.department || "—"}  \n**Boggs:** ${p.u_boggs_reactivity || "—"}  \n**Cadence:** ${p.u_cadence || "—"}\n\n### System Prompt\n${p.title}\n\n### Deep Lore\n${p.introduction || "_No introduction on file._"}\n`
    )
    .join("\n");

  downloadBlob(header + table + "\n\n" + loreBlocks, `sovereign_personas_export_${ts}.md`, "text/markdown");
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

function BoggsBadge({ level }: { level: string | null | undefined }) {
  const l = (level || "—").toLowerCase();
  const map: Record<string, { color: string; label: string }> = {
    low:        { color: VM.blue,    label: "Low" },
    medium:     { color: VM.gold,    label: "Med" },
    high:       { color: VM.orange,  label: "High" },
    always:     { color: VM.danger,  label: "MAX" },
    "max chaos":{ color: VM.danger,  label: "MAX" },
  };
  const c = map[l] ?? { color: VM.muted, label: level || "—" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: "10px",
        fontSize: "0.6rem",
        fontFamily: VM.fontList,
        fontWeight: 600,
        letterSpacing: "0.05em",
        background: `${c.color}18`,
        color: c.color,
        border: `1px solid ${c.color}30`,
        textTransform: "uppercase",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {c.label}
    </span>
  );
}

function CadenceDot({ cadence }: { cadence: string | null | undefined }) {
  const c = (cadence || "").toLowerCase();
  const color = c === "yapper" ? VM.orange : c === "pacer" ? VM.emerald : c === "lurker" ? VM.blue : VM.muted;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.65rem", fontFamily: VM.fontList, color }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, display: "inline-block" }} />
      {cadence || "—"}
    </span>
  );
}

function AvatarThumb({ name }: { name: string }) {
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = name.replace(/_/g, " ").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        background: `hsl(${hue}, 40%, 18%)`,
        border: `1px solid hsl(${hue}, 50%, 30%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.55rem",
        fontFamily: VM.fontMono,
        fontWeight: 700,
        color: `hsl(${hue}, 60%, 65%)`,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHECKBOX
   ══════════════════════════════════════════════════════════ */
function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "3px",
        border: `1.5px solid ${checked || indeterminate ? VM.emerald : VM.muted}`,
        background: checked ? `${VM.emerald}25` : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {checked && <Check size={10} strokeWidth={3} style={{ color: VM.emerald }} />}
      {indeterminate && !checked && (
        <div style={{ width: "8px", height: "2px", background: VM.emerald, borderRadius: "1px" }} />
      )}
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function PersonaConsole() {
  const [personas, setPersonas] = useState<AiPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const exportRef = useRef<HTMLDivElement>(null);

  /* ── Data Loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPersonas();
      setPersonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load personas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Close export menu on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Derived data ── */
  const uniqueTeams = useMemo(
    () => Array.from(new Set(personas.map((p) => p.city || "Unassigned"))).sort(),
    [personas]
  );

  const filtered = useMemo(() => {
    let result = personas;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.user_name.toLowerCase().includes(q) ||
          (p.city ?? "").toLowerCase().includes(q) ||
          (p.department ?? "").toLowerCase().includes(q)
      );
    }
    if (teamFilter !== "all") {
      result = result.filter((p) => (p.city || "Unassigned") === teamFilter);
    }
    return result;
  }, [personas, searchQuery, teamFilter]);

  /* ── Selection Logic ── */
  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.sys_id)), [filtered]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.sys_id));
  const someFilteredSelected = filtered.some((p) => selectedIds.has(p.sys_id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.sys_id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.sys_id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  /* ── Export Logic ── */
  const exportTargets = useMemo(() => {
    if (selectedIds.size === 0) return personas;
    return personas.filter((p) => selectedIds.has(p.sys_id));
  }, [personas, selectedIds]);

  const handleExport = (format: "json" | "md") => {
    if (format === "json") exportJSON(exportTargets);
    else exportMarkdown(exportTargets);
    setExportMenuOpen(false);
  };

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */
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
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          borderBottom: `1px solid ${VM.border}`,
          paddingBottom: "1rem",
          zIndex: 2,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: VM.fontHead,
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: VM.gold,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Bot size={18} />
            Persona Console
          </h2>
          <p
            style={{
              fontFamily: VM.fontMono,
              fontSize: "0.6rem",
              color: VM.muted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: "3px",
            }}
          >
            /now/cmdb/persona-matrix &middot; {personas.length} agents
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              background: VM.surface,
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {(["cards", "list"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "6px 10px",
                  background: viewMode === mode ? VM.card : "transparent",
                  border: "none",
                  borderRight: mode === "cards" ? `1px solid ${VM.border}` : "none",
                  color: viewMode === mode ? VM.emerald : VM.muted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.6rem",
                  fontFamily: VM.fontMono,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  transition: "all 0.15s",
                }}
              >
                {mode === "cards" ? <LayoutGrid size={12} /> : <List size={12} />}
                {mode === "cards" ? "Cards" : "List"}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              background: "transparent",
              border: `1px solid ${VM.border}`,
              borderRadius: "6px",
              padding: "6px 10px",
              color: VM.blue,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              fontFamily: VM.fontMono,
              fontSize: "0.65rem",
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Export Dropdown */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              style={{
                background: `${VM.emerald}12`,
                border: `1px solid ${VM.emerald}35`,
                borderRadius: "6px",
                padding: "6px 12px",
                color: VM.emerald,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: VM.fontMono,
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
              }}
            >
              <Download size={12} />
              Export{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              <ChevronDown size={10} />
            </button>
            {exportMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  background: VM.card,
                  border: `1px solid ${VM.border}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                  zIndex: 20,
                  minWidth: "180px",
                  boxShadow: `0 8px 30px ${VM.bg}cc`,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.55rem",
                    fontFamily: VM.fontMono,
                    color: VM.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    borderBottom: `1px solid ${VM.border}`,
                  }}
                >
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : `Full roster (${personas.length})`}
                </div>
                {(["json", "md"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 12px",
                      background: "transparent",
                      border: "none",
                      borderBottom: fmt === "json" ? `1px solid ${VM.border}` : "none",
                      color: VM.text,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: VM.fontMono,
                      fontSize: "0.7rem",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = VM.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {fmt === "json" ? "Download JSON" : "Download Markdown"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search + Filters + Selection Bar ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", alignItems: "center", zIndex: 1 }}>
        {/* Search */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: VM.surface,
            border: `1px solid ${VM.border}`,
            borderRadius: "6px",
            padding: "7px 12px",
          }}
        >
          <Search size={13} style={{ color: VM.muted, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search name, team, engine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: VM.text,
              fontFamily: VM.fontMono,
              fontSize: "0.75rem",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: VM.muted, padding: 0 }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* Team Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: VM.surface,
            border: `1px solid ${VM.border}`,
            borderRadius: "6px",
            padding: "0 10px",
            height: "34px",
          }}
        >
          <Filter size={11} style={{ color: VM.muted }} />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: VM.text,
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              cursor: "pointer",
              paddingRight: "4px",
            }}
          >
            <option value="all">All Teams</option>
            {uniqueTeams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Selection indicator */}
        {selectedIds.size > 0 && (
          <button
            onClick={clearSelection}
            style={{
              background: `${VM.gold}15`,
              border: `1px solid ${VM.gold}35`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: VM.gold,
              cursor: "pointer",
              fontFamily: VM.fontMono,
              fontSize: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
          >
            <X size={10} />
            {selectedIds.size} selected
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            background: `${VM.danger}15`,
            border: `1px solid ${VM.danger}40`,
            borderRadius: "6px",
            marginBottom: "1rem",
            fontFamily: VM.fontMono,
            fontSize: "0.7rem",
            color: VM.danger,
          }}
        >
          <AlertTriangle size={13} />
          {error}
          <button
            onClick={loadData}
            style={{
              marginLeft: "auto",
              background: `${VM.danger}20`,
              border: `1px solid ${VM.danger}40`,
              borderRadius: "4px",
              padding: "3px 10px",
              color: VM.danger,
              cursor: "pointer",
              fontFamily: VM.fontMono,
              fontSize: "0.6rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content Area ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
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
            Loading CMDB persona registry...
          </div>
        ) : filtered.length === 0 ? (
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
            No personas match the current filter.
          </div>
        ) : viewMode === "list" ? (
          /* ════════════ SNOW LIST VIEW ════════════ */
          <div style={{ borderRadius: "6px", border: `1px solid ${VM.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: VM.surface, borderBottom: `1px solid ${VM.border}` }}>
                  <th style={{ ...listTh, width: "36px", paddingLeft: "12px" }}>
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected && !allFilteredSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ ...listTh, width: "36px" }}></th>
                  <th style={listTh}>Name</th>
                  <th style={listTh}>Zone</th>
                  <th style={listTh}>Boggs</th>
                  <th style={listTh}>Cadence</th>
                  <th style={listTh}>Engine</th>
                  <th style={{ ...listTh, width: "60px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const isSelected = selectedIds.has(p.sys_id);
                  return (
                    <tr
                      key={p.sys_id}
                      style={{
                        borderBottom: `1px solid ${VM.border}40`,
                        background: isSelected ? `${VM.emerald}06` : "transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = `${VM.surface}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected ? `${VM.emerald}06` : "transparent";
                      }}
                    >
                      <td style={{ ...listTd, paddingLeft: "12px", width: "36px" }}>
                        <Checkbox checked={isSelected} onChange={() => toggleSelect(p.sys_id)} />
                      </td>
                      <td style={{ ...listTd, width: "36px" }}>
                        <AvatarThumb name={p.user_name} />
                      </td>
                      <td style={{ ...listTd, color: VM.emerald, fontWeight: 500 }}>
                        {p.user_name}
                      </td>
                      <td style={{ ...listTd, color: VM.muted }}>{p.city || "—"}</td>
                      <td style={listTd}>
                        <BoggsBadge level={p.u_boggs_reactivity} />
                      </td>
                      <td style={listTd}>
                        <CadenceDot cadence={p.u_cadence} />
                      </td>
                      <td style={{ ...listTd, color: VM.muted, fontSize: "0.65rem" }}>
                        {p.department || "—"}
                      </td>
                      <td style={listTd}>
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: p.active ? VM.emerald : VM.danger,
                            display: "inline-block",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ════════════ VESPER CARD VIEW ════════════ */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {filtered.map((p) => {
              const isSelected = selectedIds.has(p.sys_id);
              const hue = p.user_name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
              return (
                <div
                  key={p.sys_id}
                  onClick={() => toggleSelect(p.sys_id)}
                  style={{
                    background: VM.card,
                    border: `1px solid ${isSelected ? VM.emerald + "60" : VM.border}`,
                    borderRadius: "10px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = isSelected ? VM.emerald : VM.borderHi)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = isSelected ? VM.emerald + "60" : VM.border)}
                >
                  {/* Selection check */}
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(p.sys_id)} />
                  </div>

                  {/* Ambient card glow */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-30px",
                      left: "-30px",
                      width: "100px",
                      height: "100px",
                      background: `radial-gradient(circle, hsl(${hue}, 50%, 25%) 0%, transparent 70%)`,
                      opacity: 0.15,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Avatar + Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", position: "relative" }}>
                    <AvatarThumb name={p.user_name} />
                    <div>
                      <div
                        style={{
                          fontFamily: VM.fontMono,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: VM.emerald,
                        }}
                      >
                        {p.user_name}
                      </div>
                      <div
                        style={{
                          fontFamily: VM.fontMono,
                          fontSize: "0.6rem",
                          color: VM.muted,
                        }}
                      >
                        {p.city || "Unassigned"} &middot; {p.department || "—"}
                      </div>
                    </div>
                  </div>

                  {/* System prompt preview */}
                  <div
                    style={{
                      fontFamily: VM.fontBody,
                      fontSize: "0.72rem",
                      color: VM.muted,
                      lineHeight: 1.4,
                      marginBottom: "12px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.title || "No system prompt."}
                  </div>

                  {/* Badges row */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <BoggsBadge level={p.u_boggs_reactivity} />
                    <CadenceDot cadence={p.u_cadence} />
                    <span
                      style={{
                        marginLeft: "auto",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: p.active ? VM.emerald : VM.danger,
                        display: "inline-block",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "10px",
          fontFamily: VM.fontMono,
          fontSize: "0.55rem",
          color: VM.muted,
          paddingTop: "8px",
          borderTop: `1px solid ${VM.border}`,
        }}
      >
        <span>
          {filtered.length} of {personas.length} personas
          {teamFilter !== "all" && ` \u2022 filtered: ${teamFilter}`}
        </span>
        <span style={{ color: VM.emerald }}>
          sovereign_now.db &middot; cmdb_ci_ai_persona
        </span>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LIST VIEW STYLE CONSTANTS (Vancouver Dark Slate)
   ══════════════════════════════════════════════════════════ */
const listTh: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  fontFamily: "'Inter', -apple-system, sans-serif",
  fontSize: "0.6rem",
  fontWeight: 600,
  color: "#5a7a8a",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "#0a1118",
  fontVariantNumeric: "tabular-nums",
};

const listTd: React.CSSProperties = {
  padding: "7px 10px",
  fontFamily: "'Inter', -apple-system, sans-serif",
  fontSize: "0.72rem",
  fontVariantNumeric: "tabular-nums",
  verticalAlign: "middle",
};
