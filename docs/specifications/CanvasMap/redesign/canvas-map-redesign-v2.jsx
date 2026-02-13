import { useState, useRef, useCallback, memo, useEffect } from "react";

// ============================================================================
// TOKENS
// ============================================================================
const T = {
  bg: { panel: "#0d0f14", elevated: "#151820", surface: "#1a1e28", glass: "rgba(255,255,255,0.03)", hover: "rgba(255,255,255,0.06)", active: "rgba(255,255,255,0.10)", minimap: "#0a0c10" },
  border: { subtle: "rgba(255,255,255,0.06)", default: "rgba(255,255,255,0.10)", focus: "rgba(255,255,255,0.20)" },
  text: { primary: "rgba(255,255,255,0.90)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.30)" },
  accent: { blue: "#60a5fa", cyan: "#22d3ee", green: "#34d399", amber: "#fbbf24", purple: "#a78bfa", pink: "#fb7185", red: "#ef4444", teal: "#2dd4bf" },
  r: { sm: 3, md: 5, lg: 8, xl: 10 },
};
const font = "'DM Sans', sans-serif";
const mono = "'DM Mono', monospace";

// ============================================================================
// MOCK DATA
// ============================================================================
const WORKSPACES = [
  { id: "ws1", name: "My Workspace", color: T.accent.teal },
  { id: "ws2", name: "Shared Analysis", color: T.accent.purple },
  { id: "ws3", name: "Dr. Chen's Review", color: T.accent.amber },
];

const MOCK_VGS = [
  { id: "vg1", name: "Brain MRI", color: T.accent.blue, pos: { row: 0, col: 0, rs: 2, cs: 2 }, layout: "2x2", views: ["Volume Render", "Iso Surface", "Slice XY", null], type: "explicit", active: true, starred: true },
  { id: "vg2", name: "Statistics", color: T.accent.green, pos: { row: 0, col: 2, rs: 1, cs: 2 }, layout: "1x2", views: ["Histogram", "Scatter"], type: "explicit", active: false, starred: false },
  { id: "vg3", name: "Cortex", color: T.accent.purple, pos: { row: 1, col: 2, rs: 2, cs: 1 }, layout: "2x1", views: ["Surface Mesh", "Thickness Map"], type: "implicit", active: false, starred: true },
  { id: "vg4", name: "Comparison", color: T.accent.amber, pos: { row: 1, col: 3, rs: 1, cs: 2 }, layout: "1x2", views: ["Pre-Op", null], type: "explicit", active: false, starred: false },
  { id: "vg5", name: "Notes", color: T.accent.pink, pos: { row: 3, col: 0, rs: 1, cs: 3 }, layout: "1x3", views: ["Session Notes", "References", "TODO"], type: "implicit", active: false, starred: false },
];

const CANVAS = { rows: 5, cols: 6 };

// ============================================================================
// ICONS
// ============================================================================
const I = {
  chevLeft: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>,
  chevDown: (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>,
  chevUp: (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>,
  chevRight: (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>,
  chevLeftSm: (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>,
  zoomIn: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>,
  zoomOut: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>,
  fit: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>,
  grid: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  eye: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  viewport: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1" strokeDasharray="3 2"/></svg>,
  edit: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  plus: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  minus: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  copy: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  save: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>,
  share: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
  trash: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  search: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  filter: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
  sort: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/></svg>,
  settings: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  users: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  home: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
  bookmark: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  crosshair: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>,
  move: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>,
  x: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  merge: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/></svg>,
  split: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>,
  undo: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13"/></svg>,
  redo: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016.69 3L21 13"/></svg>,
  check: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  diamond: (s=8) => <svg width={s} height={s} viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" rx="1" transform="rotate(45 5 5)" fill="currentColor"/></svg>,
  panelRight: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
};

// ============================================================================
// MICRO COMPONENTS
// ============================================================================
const TinyBtn = memo(({ icon, active, accent, onClick, title, size = 12, disabled, style: xs }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 24, height: 24, borderRadius: T.r.sm, border: "none",
    background: active ? (accent || T.accent.blue) + "18" : "transparent",
    color: active ? (accent || T.accent.blue) : T.text.secondary,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.3 : 1,
    transition: "all 0.15s", flexShrink: 0, ...xs,
  }}
    onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.background = T.bg.hover; }}
    onMouseLeave={e => { e.currentTarget.style.background = active ? (accent || T.accent.blue) + "18" : "transparent"; }}
  >{typeof icon === "function" ? icon(size) : icon}</button>
));

const Sep = ({ h = 14 }) => <div style={{ width: 1, height: h, background: T.border.subtle, margin: "0 2px", flexShrink: 0 }} />;

const Badge = ({ children, color }) => <span style={{
  fontSize: 9, fontWeight: 600, lineHeight: 1, padding: "2px 5px", borderRadius: 8,
  background: (color || T.accent.blue) + "20", color: color || T.accent.blue, fontFamily: mono,
}}>{children}</span>;

const Chip = memo(({ label, count, active, onClick, dimmed }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 10, border: "none",
    fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: font,
    background: active ? T.accent.blue + "18" : T.bg.glass,
    color: active ? T.accent.blue : T.text.secondary,
    opacity: dimmed ? 0.4 : 1, transition: "all 0.15s",
  }}>
    {label}
    {count !== undefined && <span style={{ opacity: 0.7, fontFamily: mono, fontSize: 9 }}>{count}</span>}
  </button>
));

// ============================================================================
// WORKSPACE SELECTOR (in header)
// ============================================================================
const WorkspaceSelector = memo(({ active, workspaces, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 5, border: "none",
        background: "transparent", cursor: "pointer", padding: "2px 4px",
        borderRadius: T.r.sm, transition: "all 0.12s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = T.bg.hover}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ color: active.color }}>{I.diamond(8)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text.primary, fontFamily: font }}>{active.name}</span>
        <span style={{ color: T.text.tertiary, marginLeft: -2 }}>{I.chevDown(8)}</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 4,
            background: T.bg.elevated, border: `1px solid ${T.border.default}`,
            borderRadius: T.r.lg, padding: 4, minWidth: 180, zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            <div style={{ padding: "4px 8px", fontSize: 9, color: T.text.tertiary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: font }}>
              Workspaces
            </div>
            {workspaces.map(ws => (
              <button key={ws.id} onClick={() => { onChange(ws); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "6px 8px", border: "none", borderRadius: T.r.sm,
                  background: ws.id === active.id ? `${ws.color}15` : "transparent",
                  cursor: "pointer", transition: "all 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = ws.id === active.id ? `${ws.color}15` : T.bg.hover}
                onMouseLeave={e => e.currentTarget.style.background = ws.id === active.id ? `${ws.color}15` : "transparent"}
              >
                <span style={{ color: ws.color }}>{I.diamond(8)}</span>
                <span style={{ fontSize: 11, color: T.text.primary, fontFamily: font, fontWeight: ws.id === active.id ? 600 : 400 }}>{ws.name}</span>
                {ws.id === active.id && <span style={{ marginLeft: "auto", color: ws.color }}>{I.check(10)}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// ============================================================================
// MODE TABS
// ============================================================================
const TABS = [
  { id: "layout", label: "Layout", icon: I.grid },
  { id: "viewports", label: "Viewports", icon: I.viewport },
  { id: "team", label: "Team", icon: I.users },
];

const ModeTabs = memo(({ active, onChange }) => (
  <div style={{ display: "flex", gap: 1, padding: "0 8px", borderBottom: `1px solid ${T.border.subtle}` }}>
    {TABS.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "7px 0", border: "none", cursor: "pointer",
        fontSize: 10, fontWeight: 500, fontFamily: font, background: "transparent",
        color: active === tab.id ? T.text.primary : T.text.tertiary,
        borderBottom: active === tab.id ? `2px solid ${T.accent.teal}` : "2px solid transparent",
        marginBottom: -1, transition: "all 0.15s",
      }}>
        <span style={{ opacity: active === tab.id ? 1 : 0.5 }}>{tab.icon(11)}</span>
        {tab.label}
      </button>
    ))}
  </div>
));

// ============================================================================
// MINIMAP TOOLBAR (simplified: no VG/View toggle, no grid label toggle)
// ============================================================================
const MinimapToolbar = memo(({ zoom, showInternals, showViewports, onZoomIn, onZoomOut, onFit, setShowInternals, setShowViewports, tab }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 1,
    padding: "3px 6px", borderBottom: `1px solid ${T.border.subtle}`, minHeight: 28,
  }}>
    <TinyBtn icon={I.zoomOut} onClick={onZoomOut} title="Zoom out" />
    <span style={{ fontSize: 9, fontWeight: 600, color: T.text.tertiary, fontFamily: mono, minWidth: 30, textAlign: "center" }}>{zoom}%</span>
    <TinyBtn icon={I.zoomIn} onClick={onZoomIn} title="Zoom in" />
    <TinyBtn icon={I.fit} onClick={onFit} title="Fit to canvas" />
    <Sep />
    {(tab === "layout" || tab === "viewports") && (
      <TinyBtn icon={I.viewport} active={showViewports} accent={T.accent.cyan}
        onClick={() => setShowViewports(!showViewports)} title="Show viewports" />
    )}
    {tab === "layout" && (
      <TinyBtn icon={I.eye} active={showInternals} accent={T.accent.green}
        onClick={() => setShowInternals(!showInternals)} title="Show internal layouts" />
    )}
    {tab === "layout" && (
      <>
        <Sep />
        <TinyBtn icon={I.bookmark} active={false} accent={T.accent.amber} onClick={() => {}} title="Bookmarks" />
      </>
    )}
    {tab === "team" && (
      <TinyBtn icon={I.eye} active={true} accent={T.accent.green} onClick={() => {}} title="Show cursors" />
    )}
  </div>
));

// ============================================================================
// EDIT MODE BAR
// ============================================================================
const EditModeBar = memo(({ changes, timer, onUndo, onRedo, onCommit, onDiscard }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: "4px 8px", minHeight: 26,
    background: `${T.accent.amber}08`,
    borderBottom: `1px solid ${T.accent.amber}25`,
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "1px 6px", borderRadius: T.r.sm,
      background: `${T.accent.amber}18`,
    }}>
      <span style={{ color: T.accent.amber }}>{I.edit(9)}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: T.accent.amber, fontFamily: font }}>EDITING</span>
    </div>
    <span style={{ fontSize: 9, color: T.text.secondary, fontFamily: mono }}>{changes} changes</span>
    <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: mono }}>·</span>
    <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: mono }}>{timer}</span>
    <div style={{ flex: 1 }} />
    <TinyBtn icon={I.undo} onClick={onUndo} title="Undo" size={11} disabled={changes === 0} />
    <TinyBtn icon={I.redo} onClick={onRedo} title="Redo" size={11} disabled />
    <Sep h={12} />
    <button onClick={onDiscard} style={{
      border: "none", padding: "2px 8px", borderRadius: T.r.sm, cursor: "pointer",
      fontSize: 9, fontWeight: 600, fontFamily: font,
      background: T.bg.glass, color: T.text.secondary,
    }}>Discard</button>
    <button onClick={onCommit} style={{
      border: "none", padding: "2px 10px", borderRadius: T.r.sm, cursor: "pointer",
      fontSize: 9, fontWeight: 700, fontFamily: font,
      background: T.accent.green + "25", color: T.accent.green,
    }}>Done</button>
  </div>
));

// ============================================================================
// MINIMAP CANVAS (with sticky labels, gutters, draggable viewport)
// ============================================================================
const MinimapCanvas = memo(({
  vgs, selectedVGId, onSelectVG, onDoubleClickVG,
  showInternals, showViewports, highlightFilter,
  rows, cols, zoom,
  viewportPos, onViewportDragStart,
  onAddRow, onAddCol,
}) => {
  const cellSize = Math.max(28, (42 * zoom) / 100);
  const gap = 3;
  const labelW = 20;
  const labelH = 18;
  const colToLetter = c => String.fromCharCode(65 + c);

  const gridW = cols * cellSize + (cols - 1) * gap;
  const gridH = rows * cellSize + (rows - 1) * gap;

  // Gutter hover states
  const [gutterHover, setGutterHover] = useState(null); // 'top' | 'bottom' | 'left' | 'right'

  const gutterStyle = (side) => {
    const isHovered = gutterHover === side;
    const isHoriz = side === "top" || side === "bottom";
    return {
      position: "absolute",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      background: isHovered ? `${T.accent.teal}12` : "transparent",
      border: isHovered ? `1px dashed ${T.accent.teal}40` : "1px dashed transparent",
      borderRadius: T.r.sm,
      transition: "all 0.15s",
      ...(side === "top" && { top: -16, left: 0, right: 0, height: 14 }),
      ...(side === "bottom" && { bottom: -16, left: 0, right: 0, height: 14 }),
      ...(side === "left" && { left: -16, top: 0, bottom: 0, width: 14 }),
      ...(side === "right" && { right: -16, top: 0, bottom: 0, width: 14 }),
    };
  };

  const gutterLabel = (side) => (
    <span style={{
      fontSize: 8, color: gutterHover === side ? T.accent.teal : "transparent",
      fontFamily: mono, fontWeight: 700, transition: "color 0.15s",
    }}>+</span>
  );

  // Viewport drag
  const vpRef = useRef(null);
  const [vpDragging, setVpDragging] = useState(false);
  const [vpOffset, setVpOffset] = useState({ x: 0, y: 0 });

  const vpX = viewportPos.col * (cellSize + gap);
  const vpY = viewportPos.row * (cellSize + gap);
  const vpW = viewportPos.cs * cellSize + (viewportPos.cs - 1) * gap;
  const vpH = viewportPos.rs * cellSize + (viewportPos.rs - 1) * gap;

  return (
    <div style={{
      flex: 1, overflow: "auto", background: T.bg.minimap,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 28px",
      position: "relative",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {/* Sticky column labels */}
        <div style={{
          display: "flex", marginLeft: labelW + 4, marginBottom: 3, gap,
          position: "sticky", top: 0, zIndex: 5,
          background: T.bg.minimap, paddingBottom: 2,
        }}>
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} style={{
              width: cellSize, textAlign: "center",
              fontSize: 9, fontWeight: 600, color: T.text.tertiary, fontFamily: mono,
            }}>{colToLetter(c)}</div>
          ))}
        </div>

        <div style={{ display: "flex" }}>
          {/* Sticky row labels */}
          <div style={{
            display: "flex", flexDirection: "column", gap, marginRight: 4,
            position: "sticky", left: 0, zIndex: 5,
            background: T.bg.minimap, paddingRight: 2,
          }}>
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} style={{
                height: cellSize, display: "flex", alignItems: "center", justifyContent: "center",
                width: labelW, fontSize: 9, fontWeight: 600, color: T.text.tertiary, fontFamily: mono,
              }}>{r + 1}</div>
            ))}
          </div>

          {/* Grid container with gutters */}
          <div style={{ position: "relative", padding: 16 }}>
            {/* Expansion gutters */}
            <div style={gutterStyle("top")}
              onMouseEnter={() => setGutterHover("top")}
              onMouseLeave={() => setGutterHover(null)}
              onClick={() => onAddRow?.("top")}
            >{gutterLabel("top")}</div>
            <div style={gutterStyle("bottom")}
              onMouseEnter={() => setGutterHover("bottom")}
              onMouseLeave={() => setGutterHover(null)}
              onClick={() => onAddRow?.("bottom")}
            >{gutterLabel("bottom")}</div>
            <div style={gutterStyle("left")}
              onMouseEnter={() => setGutterHover("left")}
              onMouseLeave={() => setGutterHover(null)}
              onClick={() => onAddCol?.("left")}
            >{gutterLabel("left")}</div>
            <div style={gutterStyle("right")}
              onMouseEnter={() => setGutterHover("right")}
              onMouseLeave={() => setGutterHover(null)}
              onClick={() => onAddCol?.("right")}
            >{gutterLabel("right")}</div>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap, position: "relative",
            }}>
              {/* Background cells */}
              {Array.from({ length: rows * cols }, (_, i) => (
                <div key={`bg-${i}`} style={{
                  background: T.bg.glass, borderRadius: 2,
                  border: `1px solid ${T.border.subtle}`,
                }} />
              ))}

              {/* VG blocks */}
              {vgs.map(vg => {
                const { row, col, rs, cs } = vg.pos;
                const isSelected = selectedVGId === vg.id;
                const viewCount = vg.views.filter(Boolean).length;
                const totalCells = vg.views.length;
                const isDimmed = highlightFilter && !highlightFilter(vg);

                return (
                  <div key={vg.id} onClick={() => onSelectVG(vg.id)}
                    onDoubleClick={() => onDoubleClickVG(vg.id)}
                    style={{
                      gridRow: `${row + 1} / span ${rs}`,
                      gridColumn: `${col + 1} / span ${cs}`,
                      borderRadius: T.r.sm,
                      border: `1.5px solid ${vg.color}${isSelected ? "cc" : isDimmed ? "20" : "55"}`,
                      background: `${vg.color}${isSelected ? "18" : isDimmed ? "04" : "0a"}`,
                      cursor: "pointer", position: "relative",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      overflow: "hidden", transition: "all 0.25s",
                      opacity: isDimmed ? 0.3 : 1,
                      boxShadow: isSelected ? `0 0 0 1px ${vg.color}40, 0 0 12px ${vg.color}15` : "none",
                      zIndex: isSelected ? 2 : 1,
                    }}
                  >
                    <span style={{
                      fontSize: Math.min(9, cellSize * 0.22), fontWeight: 600,
                      color: T.text.primary, fontFamily: font,
                      textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap",
                      maxWidth: "90%", textAlign: "center", lineHeight: 1.2,
                    }}>{vg.name}</span>
                    {showInternals && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.min(cs, 3)}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.min(rs, 3)}, 1fr)`,
                        gap: 1, padding: 3, width: "85%", flex: 1, minHeight: 0, marginTop: 2,
                      }}>
                        {vg.views.slice(0, 6).map((v, i) => (
                          <div key={i} style={{
                            borderRadius: 1.5,
                            background: v ? `${vg.color}30` : T.bg.glass,
                            border: v ? "none" : `1px dashed ${T.border.subtle}`,
                            minHeight: 0,
                          }} />
                        ))}
                      </div>
                    )}
                    {!showInternals && (
                      <span style={{
                        fontSize: 7, color: vg.color, opacity: 0.8,
                        fontFamily: mono, fontWeight: 600, marginTop: 1,
                      }}>{viewCount}/{totalCells}</span>
                    )}
                  </div>
                );
              })}

              {/* Viewport indicator (draggable) */}
              {showViewports && (
                <div
                  style={{
                    gridRow: `${viewportPos.row + 1} / span ${viewportPos.rs}`,
                    gridColumn: `${viewportPos.col + 1} / span ${viewportPos.cs}`,
                    border: `2px solid ${T.accent.cyan}`,
                    borderRadius: T.r.sm,
                    background: `${T.accent.cyan}08`,
                    zIndex: 3,
                    cursor: "grab",
                    position: "relative",
                    transition: vpDragging ? "none" : "all 0.2s",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onViewportDragStart?.(e);
                  }}
                >
                  {/* Viewport label tab */}
                  <div style={{
                    position: "absolute", top: -1, left: 6,
                    transform: "translateY(-100%)",
                    padding: "1px 6px", borderRadius: "3px 3px 0 0",
                    background: T.accent.cyan, fontSize: 8, fontWeight: 700,
                    color: "#0a0c10", fontFamily: mono,
                    cursor: "grab",
                  }}>VP1</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// VG CONTEXT BAR (below minimap)
// ============================================================================
const VGContextBar = memo(({ vg, focused, onEdit, onExitFocus, onDeselect }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(vg?.name || "");
  const inputRef = useRef(null);

  useEffect(() => { if (vg) setName(vg.name); }, [vg]);
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  if (!vg) return null;

  const commitName = () => { setEditing(false); /* would call rename handler */ };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 8px", background: T.bg.elevated,
      borderTop: `1px solid ${T.border.subtle}`,
      borderBottom: `1px solid ${T.border.subtle}`, minHeight: 30,
    }}>
      {/* Back breadcrumb when in focused mode */}
      {focused && (
        <>
          <button onClick={onExitFocus} style={{
            display: "flex", alignItems: "center", gap: 3,
            border: "none", background: "none", color: T.text.secondary,
            cursor: "pointer", fontSize: 10, fontFamily: font, padding: "2px 0",
            flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.text.primary}
            onMouseLeave={e => e.currentTarget.style.color = T.text.secondary}
          >{I.chevLeft(10)}<span>Canvas</span></button>
          <Sep />
        </>
      )}

      <div style={{ width: 8, height: 8, borderRadius: 2, background: vg.color, flexShrink: 0 }} />

      {editing ? (
        <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setName(vg.name); setEditing(false); } }}
          style={{
            flex: 1, border: "none", outline: "none",
            background: T.bg.glass, padding: "2px 6px", borderRadius: T.r.sm,
            fontSize: 11, fontWeight: 600, color: T.text.primary, fontFamily: font,
            borderBottom: `1px solid ${T.accent.teal}`,
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title="Double-click to rename"
          style={{
            flex: 1, fontSize: 11, fontWeight: 600, color: T.text.primary, fontFamily: font,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: "text", borderBottom: "1px solid transparent",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderBottomColor = T.border.default}
          onMouseLeave={e => e.currentTarget.style.borderBottomColor = "transparent"}
        >{vg.name}</span>
      )}

      <Badge color={vg.color}>{vg.layout}</Badge>
      <Sep />
      {/* Show Quick Ops button only when NOT focused (already in focused mode) */}
      {!focused && <TinyBtn icon={I.edit} onClick={onEdit} title="Enter focused mode (Quick Ops)" />}
      <TinyBtn icon={I.copy} onClick={() => {}} title="Duplicate" />
      <TinyBtn icon={I.save} onClick={() => {}} title="Save as template" />
      <TinyBtn icon={I.share} onClick={() => {}} title="Share" />
      <TinyBtn icon={I.trash} onClick={() => {}} title="Delete" />
      {!focused && (
        <>
          <Sep />
          <TinyBtn icon={I.x} onClick={onDeselect} title="Deselect" size={10} />
        </>
      )}
    </div>
  );
});

// ============================================================================
// VG DIMENSION CONTROLS
// ============================================================================
const VGDimensionControls = memo(({ vg }) => {
  if (!vg) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "4px 8px", background: `${vg.color}06`,
      borderBottom: `1px solid ${T.border.subtle}`, minHeight: 26,
    }}>
      {[{ label: "INT", r: 2, c: 2 }, { label: "FTP", r: 2, c: 2 }].map((s, idx) => (
        <React.Fragment key={s.label}>
          {idx > 0 && <Sep h={12} />}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: T.text.tertiary, fontFamily: mono, letterSpacing: "0.5px", width: 22 }}>{s.label}</span>
            <TinyBtn icon={I.minus} onClick={() => {}} size={10} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.text.primary, fontFamily: mono, minWidth: 12, textAlign: "center" }}>{s.r}</span>
            <TinyBtn icon={I.plus} onClick={() => {}} size={10} />
            <span style={{ fontSize: 9, color: T.text.tertiary, fontWeight: 600 }}>×</span>
            <TinyBtn icon={I.minus} onClick={() => {}} size={10} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.text.primary, fontFamily: mono, minWidth: 12, textAlign: "center" }}>{s.c}</span>
            <TinyBtn icon={I.plus} onClick={() => {}} size={10} />
          </div>
        </React.Fragment>
      ))}
      <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: mono, marginLeft: "auto" }}>A1:B2</span>
    </div>
  );
});

// ============================================================================
// D-PAD
// ============================================================================
const DPad = memo(({ position = "A1" }) => {
  const b = (area) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", borderRadius: T.r.sm,
    background: T.bg.glass, color: T.text.secondary,
    cursor: "pointer", padding: 0, gridArea: area,
  });
  return (
    <div style={{
      display: "grid",
      gridTemplateAreas: `". u ." "l c r" ". d ."`,
      gridTemplateColumns: "20px 26px 20px",
      gridTemplateRows: "20px 26px 20px",
      gap: 2, flexShrink: 0,
    }}>
      <button style={b("u")}>{I.chevUp(8)}</button>
      <button style={b("d")}>{I.chevDown(8)}</button>
      <button style={b("l")}>{I.chevLeftSm(8)}</button>
      <button style={b("r")}>{I.chevRight(8)}</button>
      <div style={{
        gridArea: "c", display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: T.r.sm, background: T.accent.amber + "15",
        border: `1px solid ${T.accent.amber}30`,
      }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: T.accent.amber, fontFamily: mono }}>{position}</span>
      </div>
    </div>
  );
});

// ============================================================================
// VG LIST ITEM
// ============================================================================
const VGListItem = memo(({ vg, isSelected, onClick, dimmed }) => {
  const viewCount = vg.views.filter(Boolean).length;
  const totalCells = vg.views.length;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 8px", borderRadius: T.r.md,
      background: isSelected ? `${vg.color}10` : "transparent",
      border: isSelected ? `1px solid ${vg.color}25` : "1px solid transparent",
      cursor: "pointer", transition: "all 0.12s",
      opacity: dimmed ? 0.35 : 1,
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.bg.hover; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? `${vg.color}10` : "transparent"; }}
    >
      {/* Color dot with active ring */}
      <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 6, height: 6, borderRadius: 1.5, background: vg.color }} />
        {vg.active && <div style={{
          position: "absolute", inset: -1,
          borderRadius: 3, border: `1.5px solid ${T.accent.green}`,
        }} />}
      </div>
      <span style={{
        flex: 1, fontSize: 11, fontWeight: 500, color: T.text.primary, fontFamily: font,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{vg.name}</span>
      {vg.starred && <span style={{ color: T.accent.amber, fontSize: 10, flexShrink: 0 }}>★</span>}
      <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: mono }}>{vg.layout}</span>
      <Badge color={vg.color}>{viewCount}/{totalCells}</Badge>
    </div>
  );
});

// ============================================================================
// FOCUSED MODE OVERLAY (Quick Ops)
// ============================================================================
const FocusedModeOverlay = memo(({ vg, onExit }) => {
  if (!vg) return null;
  const gc = vg.layout === "2x2" ? 2 : vg.layout === "1x2" ? 2 : vg.layout === "1x3" ? 3 : vg.layout === "2x1" ? 1 : vg.layout === "3x3" ? 3 : 1;
  const gr = vg.layout === "2x2" ? 2 : vg.layout === "2x1" ? 2 : vg.layout === "3x3" ? 3 : 1;

  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(10,12,16,0.88)",
      backdropFilter: "blur(4px)", zIndex: 10,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Cell grid — no header since context bar + dimension controls persist above */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gc}, 1fr)`,
          gridTemplateRows: `repeat(${gr}, 1fr)`,
          gap: 4, width: "100%", maxWidth: 280,
          aspectRatio: `${gc} / ${gr}`,
        }}>
          {vg.views.map((view, i) => (
            <div key={i} style={{
              borderRadius: T.r.md,
              border: view ? `1.5px solid ${vg.color}50` : `1.5px dashed ${T.border.default}`,
              background: view ? `${vg.color}0c` : T.bg.glass,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4, padding: 8, cursor: view ? "grab" : "pointer",
              transition: "all 0.15s", minHeight: 56,
            }}>
              {view ? (
                <>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.text.primary, fontFamily: font, textAlign: "center" }}>{view}</span>
                  <span style={{ fontSize: 8, color: T.text.tertiary, fontFamily: mono }}>vtk</span>
                </>
              ) : (
                <>
                  <span style={{ color: T.text.tertiary }}>{I.plus(16)}</span>
                  <span style={{ fontSize: 8, color: T.text.tertiary, fontFamily: font }}>Empty</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Ops toolbar */}
      <div style={{
        margin: "0 12px 10px", padding: "5px 8px",
        borderRadius: T.r.lg, background: T.bg.elevated,
        border: `1px solid ${T.border.default}`,
        display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: T.r.sm,
          border: `1px solid ${T.border.subtle}`, background: T.bg.glass,
          color: T.text.secondary, cursor: "pointer", fontSize: 9, fontFamily: font,
        }}>{I.grid(10)}<span>Template</span>{I.chevDown(8)}</button>
        <Sep />
        <TinyBtn icon={I.merge} title="Merge cells" disabled />
        <TinyBtn icon={I.split} title="Split cell" disabled />
        <Sep />
        <button style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: T.r.sm,
          border: `1px solid ${T.accent.teal}30`, background: `${T.accent.teal}12`,
          color: T.accent.teal, cursor: "pointer", fontSize: 9, fontWeight: 600, fontFamily: font,
        }}>{I.edit(10)}<span>Editor</span></button>
      </div>
    </div>
  );
});

// ============================================================================
// RESIZE DIVIDER
// ============================================================================
const ResizeDivider = memo(({ onDrag }) => {
  const [d, setD] = useState(false);
  const ref = useRef(0);
  const hd = useCallback((e) => {
    e.preventDefault(); setD(true); ref.current = e.clientY;
    const mv = (ev) => onDrag(ev.clientY - ref.current);
    const up = () => { setD(false); window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
  }, [onDrag]);
  return (
    <div onMouseDown={hd} style={{ height: 6, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: 32, height: 2, borderRadius: 1, background: d ? T.accent.teal : T.border.default, transition: d ? "none" : "background 0.15s" }} />
    </div>
  );
});

// ============================================================================
// MAIN PANEL
// ============================================================================
export default function CanvasMapPanelV2() {
  const [workspace, setWorkspace] = useState(WORKSPACES[0]);
  const [tab, setTab] = useState("layout");
  const [selectedVGId, setSelectedVGId] = useState(null);
  const [focusedVGId, setFocusedVGId] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showInternals, setShowInternals] = useState(true);
  const [showViewports, setShowViewports] = useState(true);
  const [bottomTab, setBottomTab] = useState("vgs");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("all");
  const [minimapRatio, setMinimapRatio] = useState(0.52);
  const [editing, setEditing] = useState(false);
  const [editChanges, setEditChanges] = useState(0);
  const [canvas, setCanvas] = useState({ ...CANVAS });
  const [viewportPos, setViewportPos] = useState({ row: 0, col: 0, rs: 2, cs: 3 });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const selectedVG = MOCK_VGS.find(v => v.id === selectedVGId);
  const focusedVG = MOCK_VGS.find(v => v.id === focusedVGId);

  // Search + chip filter for minimap dimming
  const highlightFilter = useCallback((vg) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!vg.name.toLowerCase().includes(q) && !vg.views.some(v => v && v.toLowerCase().includes(q))) return false;
    }
    if (activeChip === "active" && !vg.active) return false;
    if (activeChip === "linked") return false; // none linked in mock
    if (activeChip === "shared") return false; // none shared in mock
    if (activeChip === "starred" && !vg.starred) return false;
    return true;
  }, [searchQuery, activeChip]);

  const hasFilter = searchQuery || activeChip !== "all";

  // Filtered list
  const filteredVGs = hasFilter ? MOCK_VGS.filter(highlightFilter) : MOCK_VGS;

  const handleSelectVG = useCallback((id) => setSelectedVGId(prev => prev === id ? null : id), []);
  const handleDoubleClickVG = useCallback((id) => { setFocusedVGId(id); setSelectedVGId(id); }, []);
  const handleExitFocus = useCallback(() => setFocusedVGId(null), []);

  // Timer for edit mode
  const [editTimer, setEditTimer] = useState(0);
  useEffect(() => {
    if (!editing) { setEditTimer(0); return; }
    const iv = setInterval(() => setEditTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [editing]);
  const fmtTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const chipCounts = {
    all: MOCK_VGS.length,
    active: MOCK_VGS.filter(v => v.active).length,
    linked: 0,
    shared: 0,
    starred: MOCK_VGS.filter(v => v.starred).length,
  };

  return (
    <div style={{
      width: 350, height: 720, background: T.bg.panel,
      borderRadius: T.r.xl, border: `1px solid ${T.border.subtle}`,
      display: "flex", flexDirection: "column", fontFamily: font,
      overflow: "hidden", position: "relative",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px", borderBottom: `1px solid ${T.border.subtle}`,
        background: T.bg.elevated, minHeight: 34,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary, fontFamily: font }}>Canvas Map</span>
        <span style={{ color: T.text.tertiary, fontSize: 10 }}>·</span>
        <WorkspaceSelector active={workspace} workspaces={WORKSPACES} onChange={setWorkspace} />
        <div style={{ flex: 1 }} />
        <TinyBtn icon={I.panelRight} onClick={() => {}} title="Open Companion Panel" size={11} />
        <TinyBtn icon={I.minus} onClick={() => {}} title="Minimize" size={10} />
        <TinyBtn icon={I.fit} onClick={() => {}} title="Expand" size={10} />
      </div>

      {/* ── MODE TABS ── */}
      <ModeTabs active={tab} onChange={setTab} />

      {/* ── MINIMAP TOOLBAR ── */}
      <MinimapToolbar
        zoom={zoom} showInternals={showInternals} showViewports={showViewports}
        onZoomIn={() => setZoom(z => Math.min(200, z + 25))}
        onZoomOut={() => setZoom(z => Math.max(50, z - 25))}
        onFit={() => setZoom(100)}
        setShowInternals={setShowInternals}
        setShowViewports={setShowViewports}
        tab={tab}
      />

      {/* ── EDIT MODE BAR ── */}
      {editing && (
        <EditModeBar
          changes={editChanges}
          timer={fmtTimer(editTimer)}
          onUndo={() => setEditChanges(c => Math.max(0, c - 1))}
          onRedo={() => {}}
          onCommit={() => { setEditing(false); setEditChanges(0); }}
          onDiscard={() => { setEditing(false); setEditChanges(0); }}
        />
      )}

      {/* ── MINIMAP ── */}
      <div style={{
        flex: minimapRatio, minHeight: 120,
        position: "relative", display: "flex", flexDirection: "column",
        borderTop: editing ? `2px solid ${T.accent.amber}30` : "none",
      }}>
        <MinimapCanvas
          vgs={MOCK_VGS} selectedVGId={selectedVGId}
          onSelectVG={handleSelectVG} onDoubleClickVG={handleDoubleClickVG}
          showInternals={showInternals} showViewports={showViewports}
          highlightFilter={hasFilter ? highlightFilter : null}
          rows={canvas.rows} cols={canvas.cols} zoom={zoom}
          viewportPos={viewportPos}
          onViewportDragStart={() => {}}
          onAddRow={(dir) => {
            setCanvas(c => ({ ...c, rows: c.rows + 1 }));
            setEditChanges(c => c + 1);
            if (!editing) setEditing(true);
          }}
          onAddCol={(dir) => {
            setCanvas(c => ({ ...c, cols: c.cols + 1 }));
            setEditChanges(c => c + 1);
            if (!editing) setEditing(true);
          }}
        />
        {focusedVGId && <FocusedModeOverlay vg={focusedVG} onExit={handleExitFocus} />}
      </div>

      {/* ── VG CONTEXT BAR (persists in both selected and focused states) ── */}
      {selectedVGId && (
        <VGContextBar vg={selectedVG} focused={!!focusedVGId}
          onEdit={() => handleDoubleClickVG(selectedVGId)}
          onExitFocus={handleExitFocus}
          onDeselect={() => { setSelectedVGId(null); setFocusedVGId(null); }} />
      )}
      {selectedVGId && <VGDimensionControls vg={selectedVG} />}

      {/* ── RESIZE DIVIDER ── */}
      <ResizeDivider onDrag={(delta) => setMinimapRatio(r => Math.max(0.25, Math.min(0.75, r + delta * 0.002)))} />

      {/* ── BOTTOM SECTION ── */}
      <div style={{ flex: 1 - minimapRatio, minHeight: 100, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* D-pad + Search + Filter + Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
          <DPad position={`${String.fromCharCode(65 + viewportPos.col)}${viewportPos.row + 1}`} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Search row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: T.r.md,
              background: T.bg.glass, border: `1px solid ${T.border.subtle}`,
            }}>
              <span style={{ color: T.text.tertiary, flexShrink: 0 }}>{I.search(11)}</span>
              <input placeholder="Search views, datasets..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: "none", background: "none", outline: "none",
                  fontSize: 10, color: T.text.primary, fontFamily: font,
                }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{
                  border: "none", background: "none", cursor: "pointer",
                  color: T.text.tertiary, display: "flex", padding: 0,
                }}>{I.x(10)}</button>
              )}
            </div>
            {/* Filter + Sort row */}
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 8px", borderRadius: T.r.sm,
                  border: `1px solid ${T.border.subtle}`, background: T.bg.glass,
                  color: T.text.secondary, cursor: "pointer", fontSize: 9, fontFamily: font,
                }}>{I.filter(9)}<span>Filter</span>{I.chevDown(7)}</button>
                {filterOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setFilterOpen(false)} />
                    <div style={{
                      position: "absolute", top: "100%", left: 0, marginTop: 4,
                      background: T.bg.elevated, border: `1px solid ${T.border.default}`,
                      borderRadius: T.r.lg, padding: 6, minWidth: 140, zIndex: 100,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}>
                      {["All types", "VTK", "Chart", "Text", "Image"].map(f => (
                        <button key={f} onClick={() => setFilterOpen(false)} style={{
                          display: "block", width: "100%", padding: "4px 8px", border: "none",
                          borderRadius: T.r.sm, background: "transparent",
                          fontSize: 10, color: T.text.primary, fontFamily: font,
                          textAlign: "left", cursor: "pointer",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg.hover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >{f}</button>
                      ))}
                      <div style={{ height: 1, background: T.border.subtle, margin: "4px 0" }} />
                      <div style={{ padding: "4px 8px", fontSize: 9, color: T.text.tertiary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: font }}>
                        Placement
                      </div>
                      {["All", "Explicit", "Implicit"].map(f => (
                        <button key={f} onClick={() => setFilterOpen(false)} style={{
                          display: "block", width: "100%", padding: "4px 8px", border: "none",
                          borderRadius: T.r.sm, background: "transparent",
                          fontSize: 10, color: T.text.primary, fontFamily: font,
                          textAlign: "left", cursor: "pointer",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg.hover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >{f}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 8px", borderRadius: T.r.sm,
                  border: `1px solid ${T.border.subtle}`, background: T.bg.glass,
                  color: T.text.secondary, cursor: "pointer", fontSize: 9, fontFamily: font,
                }}>{I.sort(9)}<span>Sort</span>{I.chevDown(7)}</button>
                {sortOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setSortOpen(false)} />
                    <div style={{
                      position: "absolute", top: "100%", left: 0, marginTop: 4,
                      background: T.bg.elevated, border: `1px solid ${T.border.default}`,
                      borderRadius: T.r.lg, padding: 6, minWidth: 140, zIndex: 100,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}>
                      {["Name A→Z", "Name Z→A", "Position", "View count", "Recently modified"].map(s => (
                        <button key={s} onClick={() => setSortOpen(false)} style={{
                          display: "block", width: "100%", padding: "4px 8px", border: "none",
                          borderRadius: T.r.sm, background: "transparent",
                          fontSize: 10, color: T.text.primary, fontFamily: font,
                          textAlign: "left", cursor: "pointer",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = T.bg.hover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >{s}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick chips */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "2px 8px 5px", overflowX: "auto",
        }}>
          <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: font, flexShrink: 0 }}>Quick:</span>
          <Chip label="All" count={chipCounts.all} active={activeChip === "all"} onClick={() => setActiveChip("all")} />
          <Chip label="Active" count={chipCounts.active} active={activeChip === "active"} onClick={() => setActiveChip("active")} />
          <Chip label="Linked" count={chipCounts.linked} active={activeChip === "linked"} onClick={() => setActiveChip("linked")} dimmed={chipCounts.linked === 0} />
          <Chip label="Shared" count={chipCounts.shared} active={activeChip === "shared"} onClick={() => setActiveChip("shared")} dimmed={chipCounts.shared === 0} />
          <Chip label="Starred" count={chipCounts.starred} active={activeChip === "starred"} onClick={() => setActiveChip("starred")} />
        </div>

        {/* Bottom tabs */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "0 8px", borderTop: `1px solid ${T.border.subtle}`, borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          {[{ id: "vgs", label: "On Canvas" }, { id: "views", label: "Views" }].map(t => (
            <button key={t.id} onClick={() => setBottomTab(t.id)} style={{
              padding: "5px 10px", border: "none", cursor: "pointer",
              fontSize: 10, fontWeight: 500, fontFamily: font, background: "transparent",
              color: bottomTab === t.id ? T.text.primary : T.text.tertiary,
              borderBottom: bottomTab === t.id ? `2px solid ${T.accent.teal}` : "2px solid transparent",
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "3px 8px", borderRadius: T.r.sm,
              border: `1px solid ${T.border.subtle}`, background: T.bg.glass,
              color: T.text.secondary, cursor: "pointer", fontSize: 9, fontFamily: font,
            }}>{I.edit(9)}<span>Edit Layout</span></button>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: "auto", padding: "4px 6px" }}>
          {(hasFilter ? filteredVGs : MOCK_VGS).map(vg => (
            <VGListItem key={vg.id} vg={vg} isSelected={selectedVGId === vg.id}
              onClick={() => handleSelectVG(vg.id)}
              dimmed={hasFilter && !highlightFilter(vg)} />
          ))}
          {hasFilter && filteredVGs.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", fontSize: 10, color: T.text.tertiary }}>
              No matches found
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderTop: `1px solid ${T.border.subtle}`,
        background: T.bg.elevated, minHeight: 24,
      }}>
        <TinyBtn icon={I.home} title="Homepoint" size={10} />
        <TinyBtn icon={I.crosshair} title="Set homepoint" size={10} />
        <TinyBtn icon={I.bookmark} title="Bookmarks" size={10} />
        <TinyBtn icon={I.settings} title="Settings" size={10} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: T.text.tertiary, fontFamily: mono }}>
          {canvas.rows}×{canvas.cols} · {MOCK_VGS.length} VG · {MOCK_VGS.reduce((s, v) => s + v.views.filter(Boolean).length, 0)} views
        </span>
      </div>
    </div>
  );
}
