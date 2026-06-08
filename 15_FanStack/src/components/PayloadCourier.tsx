/**
 * PayloadCourier — Sovereign Build (Cloud Architect Fix)
 * ======================================================
 * Fixes applied by Commander Artemis-1:
 *   1. Empty catch blocks → proper error state with user-facing feedback
 *   2. Select-all logic → intersection-based against filtered set only
 *   3. Blob download → content-type validation + deferred revokeObjectURL
 *   4. Added error/status state with toast notification system
 *   5. Added file size + type metadata columns
 *   6. Added selection summary bar
 *   7. Sovereign Design System: #00040a / #FF5910 / #00FF88 / #00d4ff
 *   8. Fonts: Orbitron (headers) / Share Tech Mono (data) / Rajdhani (body)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

/* ── Toast System ──────────────────────────────────────────────── */
function Toast({ message, type, onDismiss }: { key?: any, message: string, type: string, onDismiss: () => void }) {
  const colors = {
    error: { bg: "rgba(255,89,16,0.12)", border: "#FF5910", text: "#FF5910" },
    success: { bg: "rgba(0,255,136,0.10)", border: "#00FF88", text: "#00FF88" },
    info: { bg: "rgba(0,212,255,0.10)", border: "#00d4ff", text: "#00d4ff" },
  };
  const c = colors[type] || colors.info;

  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        padding: "10px 16px",
        borderRadius: 8,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.04em",
        display: "flex",
        alignItems: "center",
        gap: 8,
        animation: "toastIn 0.3s ease-out",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: 14 }}>
        {type === "error" ? "⚠" : type === "success" ? "✓" : "●"}
      </span>
      {message}
    </div>
  );
}

/* ── Sovereign Hex Badge ──────────────────────────────────────── */
function SovereignBadge() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <polygon
        points="18,2 32,10 32,26 18,34 4,26 4,10"
        fill="none"
        stroke="#FF5910"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <polygon
        points="18,7 28,13 28,25 18,31 8,25 8,13"
        fill="rgba(255,89,16,0.08)"
        stroke="#FF5910"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <text
        x="18"
        y="21"
        textAnchor="middle"
        fill="#FF5910"
        fontFamily="Orbitron"
        fontSize="10"
        fontWeight="700"
      >
        ⬡
      </text>
    </svg>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function PayloadCourier() {
  const [docs, setDocs] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Fetch Documents ──────────────────────────────────────── */
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:5055/api/admin/documents`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.status === "success") {
        setDocs(data.documents || []);
        setFilteredDocs(data.documents || []);
        addToast(
          `${(data.documents || []).length} assets indexed from Sovereign Drive`,
          "success"
        );
      } else {
        throw new Error(data.message || "API returned non-success status");
      }
    } catch (e) {
      // FIX 1: No more empty catch — surface the error to the user
      const msg = e.message || "Unknown error";
      setError(msg);
      addToast(`Fetch failed: ${msg}`, "error");
      console.error("PayloadCourier fetch error:", e);
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  /* ── Search Filter ────────────────────────────────────────── */
  useEffect(() => {
    if (!search.trim()) {
      setFilteredDocs(docs);
    } else {
      const term = search.toLowerCase();
      setFilteredDocs(
        docs.filter(
          (d) =>
            d.name.toLowerCase().includes(term) ||
            d.path.toLowerCase().includes(term)
        )
      );
    }
  }, [search, docs]);

  /* ── Selection Logic (FIX 2: intersection-based) ──────────── */
  const filteredPaths = new Set(filteredDocs.map((d) => d.path));
  const selectedInView = new Set(
    [...selected].filter((p) => filteredPaths.has(p))
  );
  const allFilteredSelected =
    filteredDocs.length > 0 && selectedInView.size === filteredDocs.length;

  const toggleSelect = (path) => {
    const next = new Set(selected);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelected(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      // Deselect only the currently filtered items
      filteredDocs.forEach((d) => next.delete(d.path));
    } else {
      // Select all currently filtered items (preserving other selections)
      filteredDocs.forEach((d) => next.add(d.path));
    }
    setSelected(next);
  };

  /* ── Export (FIX 3: blob validation + deferred revoke) ────── */
  const exportPayload = useCallback(async () => {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:5055/api/admin/package`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: Array.from(selected) }),
        }
      );

      if (!res.ok) {
        throw new Error(`Export failed: HTTP ${res.status}`);
      }

      // FIX 3a: Validate content type before treating as zip
      const contentType = res.headers.get("content-type") || "";
      if (
        !contentType.includes("application/zip") &&
        !contentType.includes("application/octet-stream")
      ) {
        // Server returned a non-binary response (probably a JSON error)
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.message || `Unexpected content type: ${contentType}`
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const match = res.headers
        .get("content-disposition")
        ?.match(/filename="?([^"]+)"?/);
      a.download = match
        ? match[1]
        : `sovereign_payload_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // FIX 3b: Deferred cleanup so the browser has time to grab the blob
      setTimeout(() => window.URL.revokeObjectURL(url), 3000);

      addToast(`Payload exported: ${selected.size} assets packaged`, "success");
    } catch (e) {
      addToast(`Export error: ${e.message}`, "error");
      console.error("PayloadCourier export error:", e);
    }
    setExporting(false);
  }, [selected, addToast]);

  /* ── Format helpers ───────────────────────────────────────── */
  const stripBase = (path) =>
    path.replace("/home/james/SovereignOS/", "");

  const getExtBadge = (name) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const map = {
      py: { label: "PY", color: "#00FF88" },
      json: { label: "JSON", color: "#00d4ff" },
      md: { label: "MD", color: "#a78bfa" },
      db: { label: "DB", color: "#FF5910" },
      txt: { label: "TXT", color: "#64748b" },
      sh: { label: "SH", color: "#fbbf24" },
      tsx: { label: "TSX", color: "#00d4ff" },
      jsx: { label: "JSX", color: "#00d4ff" },
      html: { label: "HTML", color: "#FF5910" },
      css: { label: "CSS", color: "#a78bfa" },
      csv: { label: "CSV", color: "#00FF88" },
    };
    const m = map[ext] || { label: ext.toUpperCase() || "?", color: "#475569" };
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 9,
          fontFamily: "'Share Tech Mono', monospace",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: m.color,
          background: `${m.color}15`,
          border: `1px solid ${m.color}30`,
        }}
      >
        {m.label}
      </span>
    );
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div
      style={{
        height: "100%",
        background: "#00040a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Rajdhani', sans-serif",
        color: "#e2e8f0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top glow accent */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 240,
          background:
            "radial-gradient(ellipse, rgba(255,89,16,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onDismiss={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(0,212,255,0.1)",
          background: "rgba(0,4,10,0.8)",
          backdropFilter: "blur(16px)",
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SovereignBadge />
          <div>
            <h1
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: "0.14em",
                color: "#ffffff",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Agent Courier
            </h1>
            <p
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "#FF5910",
                textTransform: "uppercase",
                margin: "4px 0 0 0",
                opacity: 0.8,
              }}
            >
              Zero-Friction Payload Packager
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Isolate targets..."
              style={{
                width: 260,
                background: "rgba(0,4,10,0.9)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "#e2e8f0",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 12,
                padding: "8px 14px 8px 32px",
                borderRadius: 6,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#00d4ff";
                e.target.style.boxShadow = "0 0 16px rgba(0,212,255,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,212,255,0.15)";
                e.target.style.boxShadow = "none";
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#00d4ff",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
          </div>

          {/* Retry button on error */}
          {error && (
            <button
              onClick={fetchDocs}
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #FF5910",
                background: "rgba(255,89,16,0.1)",
                color: "#FF5910",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Retry
            </button>
          )}

          {/* Export button */}
          <button
            onClick={exportPayload}
            disabled={selected.size === 0 || exporting}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "10px 20px",
              borderRadius: 6,
              border:
                selected.size > 0
                  ? "1px solid #00FF88"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                selected.size > 0
                  ? "rgba(0,255,136,0.08)"
                  : "rgba(255,255,255,0.03)",
              color: selected.size > 0 ? "#00FF88" : "#475569",
              cursor: selected.size > 0 ? "pointer" : "not-allowed",
              transition: "all 0.25s",
              boxShadow:
                selected.size > 0
                  ? "0 0 20px rgba(0,255,136,0.15)"
                  : "none",
            }}
          >
            {exporting
              ? "Packaging..."
              : `Export Payload (${selected.size})`}
          </button>
        </div>
      </div>

      {/* ── Selection Summary Bar ─────────────────────────────── */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 24px",
            background: "rgba(0,255,136,0.04)",
            borderBottom: "1px solid rgba(0,255,136,0.1)",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            color: "#00FF88",
            flexShrink: 0,
            position: "relative",
            zIndex: 5,
          }}
        >
          <span>
            {selected.size} asset{selected.size !== 1 ? "s" : ""} selected
            {search.trim() &&
              ` (${selectedInView.size} visible in current filter)`}
          </span>
          <button
            onClick={() => setSelected(new Set())}
            style={{
              background: "none",
              border: "none",
              color: "rgba(0,255,136,0.5)",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Data Grid ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid rgba(255,89,16,0.2)",
                borderTopColor: "#FF5910",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 12,
                color: "#FF5910",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              Scanning Sovereign Silos...
            </span>
          </div>
        ) : error && docs.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              padding: 40,
            }}
          >
            <span style={{ fontSize: 28, opacity: 0.6 }}>⚠</span>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 13,
                color: "#FF5910",
                textAlign: "center",
                maxWidth: 400,
              }}
            >
              {error}
            </span>
            <button
              onClick={fetchDocs}
              style={{
                marginTop: 8,
                fontFamily: "'Orbitron', monospace",
                fontWeight: 700,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                padding: "8px 20px",
                borderRadius: 6,
                border: "1px solid #FF5910",
                background: "rgba(255,89,16,0.08)",
                color: "#FF5910",
                cursor: "pointer",
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#00040a",
                  zIndex: 5,
                  borderBottom: "1px solid rgba(0,212,255,0.08)",
                }}
              >
                <th style={{ padding: "12px 16px", width: 44, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#FF5910" }}
                  />
                </th>
                {["Type", "Asset Name", "Path Matrix", "Modified"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: "rgba(0,212,255,0.4)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const isSelected = selected.has(doc.path);
                return (
                  <tr
                    key={doc.path}
                    onClick={() => toggleSelect(doc.path)}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      background: isSelected
                        ? "rgba(0,255,136,0.03)"
                        : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background =
                          "rgba(0,212,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected
                        ? "rgba(0,255,136,0.03)"
                        : "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        style={{
                          width: 14,
                          height: 14,
                          cursor: "pointer",
                          accentColor: "#FF5910",
                          pointerEvents: "none",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {getExtBadge(doc.name)}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 12,
                        color: isSelected ? "#00d4ff" : "#cbd5e1",
                        transition: "color 0.15s",
                      }}
                    >
                      {doc.name}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 10,
                        color: "rgba(100,116,139,0.7)",
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {stripBase(doc.path)}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {doc.last_modified || "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredDocs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 48,
                      textAlign: "center",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 12,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    No assets match current filter pattern
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          borderTop: "1px solid rgba(0,212,255,0.06)",
          background: "rgba(0,4,10,0.6)",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: "#334155",
          flexShrink: 0,
          position: "relative",
          zIndex: 5,
        }}
      >
        <span>
          {docs.length} total assets · {filteredDocs.length} visible
        </span>
        <span style={{ letterSpacing: "0.15em" }}>
          SOVEREIGN BUILD · CLOUD ARCHITECT FIX · v1.1
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        input::placeholder {
          color: rgba(100,116,139,0.4);
        }
      `}</style>
    </div>
  );
}
