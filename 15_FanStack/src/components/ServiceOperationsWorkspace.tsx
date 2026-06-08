import React, { useState, useEffect, useCallback } from "react";
import { X, PlusSquare, ServerCog, Activity, RefreshCw, AlertTriangle, ChevronRight, Bug, Lightbulb, BookOpen } from "lucide-react";

/* ── Modern Professional Dark Theme ── */
const VM = {
  bg:       "#09090b",
  surface:  "#18181b",
  card:     "#27272a",
  border:   "#3f3f46",
  orange:   "#f97316",
  emerald:  "#3b82f6", // Use blue for primary action instead of neon green
  blue:     "#3b82f6",
  gold:     "#eab308",
  text:     "#f4f4f5",
  muted:    "#a1a1aa",
  danger:   "#ef4444",
  fontHead: "system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontBody: "system-ui, -apple-system, sans-serif",
} as const;

/* ── Type Definitions ── */
interface ServiceRecord {
  sys_id: string;
  short_description: string;
  description: string;
  state: string;
  priority: string;
  assigned_to: string;
  sys_created_on: string;
  sys_updated_on: string;
  work_notes?: string;
  number?: string;
}

interface NewRecordPayload {
  short_description: string;
  description: string;
  priority: string;
  work_notes?: string;
}

type TableName = "rm_story" | "rm_enhancement" | "rm_defect";

interface TableMeta {
  label: string;
  icon: React.ReactNode;
  accent: string;
}

const TABLE_META: Record<TableName, TableMeta> = {
  rm_story:       { label: "Stories",       icon: <BookOpen size={14} />,  accent: VM.blue },
  rm_enhancement: { label: "Enhancements",  icon: <Lightbulb size={14} />, accent: VM.gold },
  rm_defect:      { label: "Defects",       icon: <Bug size={14} />,       accent: VM.orange },
};

/* ── API Config ── */
const API_BASE = "";

async function fetchTable(table: TableName): Promise<ServiceRecord[]> {
  const res = await fetch(`${API_BASE}/api/now/table/${table}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`${table}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.result ?? [];
}

async function createRecord(table: TableName, payload: NewRecordPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/api/now/table/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status} ${res.statusText}`);
}

/* ── Validation ── */
function validatePayload(payload: NewRecordPayload): string | null {
  if (!payload.short_description.trim()) return "Short description is required.";
  if (payload.short_description.trim().length < 5) return "Short description must be at least 5 characters.";
  if (!payload.description.trim()) return "Description is required.";
  return null;
}

/* ── Main Component ── */
export default function ServiceOperationsWorkspace() {
  const [activeTable, setActiveTable] = useState<TableName>("rm_story");
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ServiceRecord | null>(null);
  const [newRecord, setNewRecord] = useState<NewRecordPayload>({
    short_description: "",
    description: "",
    priority: "3",
    work_notes: "",
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTable(activeTable);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [activeTable]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSubmit = async () => {
    const validationResult = validatePayload(newRecord);
    if (validationResult) {
      setValidationError(validationResult);
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    try {
      if (viewingRecord) {
        // Send PUT if viewing an existing record
        const res = await fetch(`${API_BASE}/api/now/table/${activeTable}/${encodeURIComponent(viewingRecord.sys_id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      } else {
        await createRecord(activeTable, newRecord);
      }
      setDrawerOpen(false);
      setViewingRecord(null);
      setNewRecord({ short_description: "", description: "", priority: "3", work_notes: "" });
      await loadRecords();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (record: ServiceRecord) => {
    setViewingRecord(record);
    setNewRecord({
      short_description: record.short_description,
      description: record.description,
      priority: record.priority,
      work_notes: record.work_notes || "",
    });
    setDrawerOpen(true);
    setValidationError(null);
  };

  const meta = TABLE_META[activeTable];

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


      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          borderBottom: `1px solid ${VM.border}`,
          paddingBottom: "1rem",
          zIndex: 1,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: VM.fontHead,
              fontSize: "1.2rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: VM.text,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ServerCog size={20} />
            Service Operations
          </h2>
          <p
            style={{
              fontFamily: VM.fontMono,
              fontSize: "0.65rem",
              color: VM.muted,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            /now/sow/workspace
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={loadRecords}
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
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Sync
          </button>
          <button
            onClick={() => { setViewingRecord(null); setDrawerOpen(true); setValidationError(null); setNewRecord({short_description: "", description: "", priority: "3", work_notes: ""}); }}
            style={{
              background: `${VM.emerald}15`,
              border: `1px solid ${VM.emerald}40`,
              borderRadius: "6px",
              padding: "6px 14px",
              color: VM.emerald,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: VM.fontMono,
              fontSize: "0.7rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${VM.emerald}25`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${VM.emerald}15`; }}
          >
            <PlusSquare size={12} />
            New {meta.label.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Table Switcher */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "1rem" }}>
        {(Object.keys(TABLE_META) as TableName[]).map((table) => {
          const m = TABLE_META[table];
          const isActive = activeTable === table;
          return (
            <button
              key={table}
              onClick={() => setActiveTable(table)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: isActive ? VM.surface : "transparent",
                border: `1px solid ${isActive ? VM.border : "transparent"}`,
                borderBottom: isActive ? `2px solid ${m.accent}` : "2px solid transparent",
                borderRadius: "6px 6px 0 0",
                color: isActive ? m.accent : VM.muted,
                fontFamily: VM.fontMono,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              {m.icon}
              {m.label}
            </button>
          );
        })}
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
            onClick={loadRecords}
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

      {/* Records Table */}
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
            Loading {meta.label.toLowerCase()}...
          </div>
        ) : records.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              fontFamily: VM.fontMono,
              fontSize: "0.8rem",
              color: VM.muted,
              gap: "8px",
            }}
          >
            <Activity size={24} style={{ opacity: 0.3 }} />
            No {meta.label.toLowerCase()} found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${VM.border}` }}>
                {["Short Description", "Priority", "State", "Created"].map((h) => (
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
              {records.map((record) => (
                <tr
                  key={record.sys_id}
                  onClick={() => handleRowClick(record)}
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
                      <ChevronRight size={10} style={{ color: meta.accent }} />
                      {record.short_description || <span style={{ color: VM.muted, fontStyle: "italic" }}>Untitled</span>}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <PriorityBadge priority={record.priority} />
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted }}>
                    {record.state || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: VM.fontMono, fontSize: "0.7rem", color: VM.muted }}>
                    {record.sys_created_on?.slice(0, 10) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
          fontFamily: VM.fontMono,
          fontSize: "0.6rem",
          color: VM.muted,
        }}
      >
        <span>{records.length} records</span>
        <span style={{ color: meta.accent }}>
          {meta.label} &#x2022; sovereign_now.db
        </span>
      </div>

      {/* New Record Drawer (slides from right) */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: `${VM.bg}88`,
              zIndex: 9,
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              maxWidth: "400px",
              height: "100%",
              background: VM.card,
              borderLeft: `1px solid ${VM.border}`,
              padding: "1.5rem",
              overflowY: "auto",
              zIndex: 10,
              boxShadow: `-20px 0 60px ${VM.bg}cc`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontFamily: VM.fontHead,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: viewingRecord ? VM.blue : meta.accent,
                  letterSpacing: "0.05em",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {viewingRecord ? `Update Ticket: ${viewingRecord.number || viewingRecord.sys_id.substring(0, 8).toUpperCase()}` : `New ${meta.label.slice(0, -1)}`}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: VM.muted }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div
                style={{
                  padding: "10px 12px",
                  background: `${VM.danger}15`,
                  border: `1px solid ${VM.danger}40`,
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  fontFamily: VM.fontMono,
                  fontSize: "0.7rem",
                  color: VM.danger,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertTriangle size={12} />
                {validationError}
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: VM.fontMono,
                    fontSize: "0.6rem",
                    color: VM.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    marginBottom: "6px",
                  }}
                >
                  Short Description *
                </label>
                <input
                  type="text"
                  value={newRecord.short_description}
                  onChange={(e) => setNewRecord((prev) => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Enter a brief summary..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: VM.surface,
                    border: `1px solid ${VM.border}`,
                    borderRadius: "6px",
                    color: VM.text,
                    fontFamily: VM.fontMono,
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = meta.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = VM.border)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: VM.fontMono,
                    fontSize: "0.6rem",
                    color: VM.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    marginBottom: "6px",
                  }}
                >
                  Description *
                </label>
                <textarea
                  value={newRecord.description}
                  onChange={(e) => setNewRecord((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description..."
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: VM.surface,
                    border: `1px solid ${VM.border}`,
                    borderRadius: "6px",
                    color: VM.text,
                    fontFamily: VM.fontMono,
                    fontSize: "0.8rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = meta.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = VM.border)}
                />
              </div>

              {viewingRecord && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: VM.fontMono,
                      fontSize: "0.6rem",
                      color: VM.emerald,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      marginBottom: "6px",
                    }}
                  >
                    AI Resolution / Work Notes
                  </label>
                  <textarea
                    readOnly
                    value={newRecord.work_notes || "No notes yet..."}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#1e293b",
                      border: `1px solid ${VM.emerald}50`,
                      borderRadius: "6px",
                      color: VM.text,
                      fontFamily: VM.fontMono,
                      fontSize: "0.8rem",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      marginBottom: "12px"
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: VM.fontMono,
                    fontSize: "0.6rem",
                    color: VM.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    marginBottom: "6px",
                  }}
                >
                  Priority
                </label>
                <select
                  value={newRecord.priority}
                  onChange={(e) => setNewRecord((prev) => ({ ...prev, priority: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: VM.surface,
                    border: `1px solid ${VM.border}`,
                    borderRadius: "6px",
                    color: VM.text,
                    fontFamily: VM.fontMono,
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="1">1 — Critical</option>
                  <option value="2">2 — High</option>
                  <option value="3">3 — Moderate</option>
                  <option value="4">4 — Low</option>
                  <option value="5">5 — Planning</option>
                </select>
              </div>
            </div>
            
            {/* Bro Decoder Button */}
            <button
              onClick={async () => {
                const isShort = newRecord.short_description.trim() !== "";
                const isDesc = newRecord.description.trim() !== "";
                if (!isShort && !isDesc) return;
                
                try {
                  const res = await fetch(`${API_BASE}/api/bro_decode`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      short_description: newRecord.short_description,
                      description: newRecord.description 
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setNewRecord(prev => ({
                      ...prev,
                      short_description: data.short_description || prev.short_description,
                      description: data.description || prev.description
                    }));
                  }
                } catch (e) {
                  console.error("Bro decode failed:", e);
                }
              }}
              style={{
                marginTop: "1.5rem",
                padding: "8px",
                background: `#2a1b3d`,
                border: `1px solid #7c3aed50`,
                borderRadius: "8px",
                color: "#c4b5fd",
                fontFamily: VM.fontMono,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `#3b2856`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `#2a1b3d`; }}
            >
              <Activity size={14} />
              Bro Decoder (Clean Text)
            </button>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                marginTop: "1.5rem",
                padding: "12px",
                background: submitting ? VM.surface : `${VM.emerald}20`,
                border: `1px solid ${VM.emerald}50`,
                borderRadius: "8px",
                color: VM.emerald,
                fontFamily: VM.fontMono,
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                cursor: submitting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = `${VM.emerald}30`; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = `${VM.emerald}20`; }}
            >
              {submitting ? (
                <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <PlusSquare size={14} />
              )}
              {submitting ? "Submitting..." : (viewingRecord ? `Update ${meta.label.slice(0, -1)}` : `Create ${meta.label.slice(0, -1)}`)}
            </button>
          </div>
        </>
      )}

      {/* Keyframe injection */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Priority Badge Sub-Component ── */
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    "1": { bg: "#ff444420", text: "#ff4444", label: "P1 Critical" },
    "2": { bg: "#FF591020", text: "#FF5910", label: "P2 High" },
    "3": { bg: "#E0BC6820", text: "#E0BC68", label: "P3 Moderate" },
    "4": { bg: "#00d4ff20", text: "#00d4ff", label: "P4 Low" },
    "5": { bg: "#5a7a8a20", text: "#5a7a8a", label: "P5 Planning" },
  };
  const c = colors[priority] ?? colors["3"];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "0.6rem",
        fontFamily: "'Share Tech Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.text}30`,
      }}
    >
      {c.label}
    </span>
  );
}
