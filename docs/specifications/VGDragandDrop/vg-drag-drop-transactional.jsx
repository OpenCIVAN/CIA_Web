import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';

// =============================================================================
// DESIGN TOKENS
// =============================================================================
const T = {
  bg: { primary: '#0a0a12', secondary: '#12121a', tertiary: '#1a1a24', glass: 'rgba(255,255,255,0.03)', glassHover: 'rgba(255,255,255,0.06)' },
  border: { subtle: 'rgba(255,255,255,0.06)', default: 'rgba(255,255,255,0.1)' },
  text: { primary: '#e8e8ed', secondary: '#9898a8', muted: '#5c5c6e', inverse: '#0a0a12' },
  accent: {
    purple: '#a855f7', blue: '#3b82f6', cyan: '#22d3ee', green: '#22c55e',
    amber: '#f59e0b', pink: '#ec4899', red: '#ef4444', teal: '#14b8a6',
  },
  r: { sm: 4, md: 6, lg: 8, xl: 12 },
  f: { xxs: 9, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 },
};

// =============================================================================
// DATA
// =============================================================================
const TEMPLATES = [
  { id: 't-single', name: 'Single View', slots: 1, rows: 1, cols: 1, color: T.accent.blue, grid: [[1]], scope: 'project' },
  { id: 't-side', name: 'Side by Side', slots: 2, rows: 1, cols: 2, color: T.accent.green, grid: [[1,2]], scope: 'project' },
  { id: 't-2x2', name: '2×2 Grid', slots: 4, rows: 2, cols: 2, color: T.accent.purple, grid: [[1,2],[3,4]], scope: 'project' },
  { id: 't-main-detail', name: 'Main + Details', slots: 3, rows: 2, cols: 2, color: T.accent.pink, grid: [['M','M'],['D1','D2']], scope: 'project' },
  { id: 't-3x3', name: '3×3 Grid', slots: 9, rows: 3, cols: 3, color: T.accent.cyan, grid: [[1,2,3],[4,5,6],[7,8,9]], scope: 'project' },
];

const SAMPLE_VGS = [
  { id: 'vg-brain', name: 'Brain Volumes', slots: 4, rows: 2, cols: 2, color: T.accent.purple, grid: [[1,2],[3,4]], scope: 'personal', populated: true, datasets: ['brain_mri.nii'] },
  { id: 'vg-cardiac', name: 'Cardiac Analysis', slots: 2, rows: 1, cols: 2, color: T.accent.pink, grid: [[1,2]], scope: 'team', populated: true, datasets: ['heart_ct.dcm'] },
];

const COLLABORATORS = [
  { id: 'u1', name: 'You', avatar: 'Y', color: T.accent.cyan },
  { id: 'u2', name: 'Dr. Sarah', avatar: 'S', color: T.accent.pink },
  { id: 'u3', name: 'Marcus', avatar: 'M', color: T.accent.green },
];

const REACTIONS = ['👍', '⚠️', '❓', '🎯'];

const INITIAL_VGS = [
  { id: 'p1', name: 'Main', rows: 1, cols: 1, row: 0, col: 0, color: T.accent.cyan, grid: [[1]], populated: true, slots: 1 },
  { id: 'p2', name: '2×2 Analysis', rows: 2, cols: 2, row: 2, col: 0, color: T.accent.purple, grid: [[1,2],[3,4]], populated: false, slots: 4 },
  { id: 'p3', name: '2×2 Compare', rows: 2, cols: 2, row: 4, col: 0, color: T.accent.amber, grid: [[1,2],[3,4]], populated: false, slots: 4 },
];

// =============================================================================
// SMART PLACEMENT
// =============================================================================
function findSmartPosition(canvas, tRows, tCols, cursorRow, cursorCol, existingVGs) {
  const occupied = new Set();
  existingVGs.forEach(vg => {
    for (let r = vg.row; r < vg.row + vg.rows; r++)
      for (let c = vg.col; c < vg.col + vg.cols; c++)
        occupied.add(`${r},${c}`);
  });
  const aR = Math.max(0, Math.round(cursorRow - tRows / 2));
  const aC = Math.max(0, Math.round(cursorCol - tCols / 2));
  const fits = (r, c, mR, mC) => {
    if (r < 0 || c < 0 || r + tRows > mR || c + tCols > mC) return false;
    for (let dr = 0; dr < tRows; dr++)
      for (let dc = 0; dc < tCols; dc++)
        if (occupied.has(`${r + dr},${c + dc}`)) return false;
    return true;
  };
  if (fits(aR, aC, canvas.rows, canvas.cols))
    return { row: aR, col: aC, expanded: false, newRows: canvas.rows, newCols: canvas.cols, valid: true };
  for (let dist = 1; dist <= Math.max(canvas.rows, canvas.cols) + 4; dist++) {
    let best = null, bestD = Infinity;
    for (let dr = -dist; dr <= dist; dr++) {
      for (let dc = -dist; dc <= dist; dc++) {
        if (Math.abs(dr) !== dist && Math.abs(dc) !== dist) continue;
        const r = aR + dr, c = aC + dc;
        if (r < 0 || c < 0) continue;
        const eR = Math.max(canvas.rows, r + tRows), eC = Math.max(canvas.cols, c + tCols);
        if (fits(r, c, eR, eC)) {
          const d = Math.sqrt(dr * dr + dc * dc);
          if (d < bestD) { bestD = d; best = { row: r, col: c, expanded: eR > canvas.rows || eC > canvas.cols, newRows: eR, newCols: eC, valid: true }; }
        }
      }
    }
    if (best) return best;
  }
  return { row: canvas.rows, col: 0, expanded: true, newRows: canvas.rows + tRows, newCols: canvas.cols, valid: true };
}

function findDropZone(x, y) {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const zone = el.getAttribute('data-dropzone');
    if (zone) return { target: zone, element: el };
  }
  return { target: null, element: null };
}

// =============================================================================
// LAYOUT MINI PREVIEW
// =============================================================================
const LayoutMiniPreview = memo(({ grid, color, size = 32 }) => {
  const rows = grid.length, cols = grid[0].length, g = 1.5;
  const cells = [], visited = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited.has(`${r},${c}`)) continue;
      const val = grid[r][c]; let sC = 1, sR = 1;
      while (c + sC < cols && grid[r][c + sC] === val) sC++;
      while (r + sR < rows) { let ok = true; for (let dc = 0; dc < sC; dc++) if (grid[r + sR]?.[c + dc] !== val) { ok = false; break; } if (!ok) break; sR++; }
      for (let dr = 0; dr < sR; dr++) for (let dc = 0; dc < sC; dc++) visited.add(`${r + dr},${c + dc}`);
      cells.push({ r, c, sR, sC });
    }
  }
  const cW = (size - (cols - 1) * g) / cols, cH = (size - (rows - 1) * g) / rows;
  return (
    <div style={{ width: size, height: size, position: 'relative', borderRadius: T.r.sm, border: `1px solid ${color}40`, overflow: 'hidden', flexShrink: 0 }}>
      {cells.map((cl, i) => <div key={i} style={{ position: 'absolute', left: cl.c * (cW + g), top: cl.r * (cH + g), width: cl.sC * cW + (cl.sC - 1) * g, height: cl.sR * cH + (cl.sR - 1) * g, background: `${color}35`, borderRadius: 1.5 }} />)}
    </div>
  );
});

// =============================================================================
// CHANGE LOG ENTRY
// =============================================================================
const ChangeEntry = memo(({ change, onRevert, reactions, onReact }) => {
  const icons = { add: '＋', move: '↗', remove: '✕' };
  const colors = { add: T.accent.green, move: T.accent.blue, remove: T.accent.red };
  return (
    <div style={{ padding: '6px 8px', marginBottom: 3, borderRadius: T.r.md, background: `${colors[change.type]}08`, border: `1px solid ${colors[change.type]}15` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors[change.type], width: 16, textAlign: 'center' }}>{icons[change.type]}</span>
        <span style={{ fontSize: T.f.sm, fontWeight: 600, color: T.text.primary, flex: 1 }}>{change.label}</span>
        {onRevert && (
          <button onClick={() => onRevert(change.id)} style={{ fontSize: T.f.xxs, color: T.text.muted, background: T.bg.tertiary, border: `1px solid ${T.border.subtle}`, borderRadius: 3, padding: '1px 5px', cursor: 'pointer' }}>undo</button>
        )}
      </div>
      <div style={{ fontSize: T.f.xs, color: T.text.muted, marginLeft: 22 }}>{change.detail}</div>
      {/* Reactions */}
      {reactions && reactions.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: 22, flexWrap: 'wrap' }}>
          {reactions.map((r, i) => (
            <span key={i} style={{ fontSize: 11, background: T.bg.tertiary, borderRadius: 10, padding: '1px 6px', border: `1px solid ${T.border.subtle}`, display: 'flex', alignItems: 'center', gap: 3 }}>
              {r.emoji} <span style={{ fontSize: T.f.xxs, color: r.userColor }}>{r.userName}</span>
            </span>
          ))}
        </div>
      )}
      {/* React buttons (for collaborator view) */}
      {onReact && (
        <div style={{ display: 'flex', gap: 3, marginTop: 4, marginLeft: 22 }}>
          {REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => onReact(change.id, emoji)} style={{ fontSize: 11, background: T.bg.glass, border: `1px solid ${T.border.subtle}`, borderRadius: 10, padding: '1px 5px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = T.bg.glassHover; e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = T.bg.glass; e.currentTarget.style.transform = 'scale(1)'; }}
            >{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// TIMEOUT PROMPT
// =============================================================================
const TimeoutPrompt = memo(({ visible, onExtend, onCommit, onDiscard }) => {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: T.bg.secondary, border: `1px solid ${T.accent.amber}40`, borderRadius: T.r.xl, padding: 24, width: 340, boxShadow: `0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px ${T.accent.amber}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${T.accent.amber}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⏱</div>
          <div>
            <div style={{ fontSize: T.f.xl, fontWeight: 700, color: T.text.primary }}>Still editing?</div>
            <div style={{ fontSize: T.f.sm, color: T.text.muted }}>Your edit session is about to expire</div>
          </div>
        </div>
        <div style={{ fontSize: T.f.sm, color: T.text.secondary, marginBottom: 18, lineHeight: 1.5 }}>
          The canvas has been locked for editing. Other collaborators are waiting. Would you like to continue, commit your changes, or discard?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onExtend} style={{ flex: 1, padding: '8px 12px', borderRadius: T.r.md, background: `${T.accent.amber}15`, border: `1px solid ${T.accent.amber}40`, color: T.accent.amber, fontWeight: 600, fontSize: T.f.md, cursor: 'pointer' }}>
            Extend 5min
          </button>
          <button onClick={onCommit} style={{ flex: 1, padding: '8px 12px', borderRadius: T.r.md, background: T.accent.green, border: 'none', color: T.text.inverse, fontWeight: 600, fontSize: T.f.md, cursor: 'pointer' }}>
            Commit
          </button>
          <button onClick={onDiscard} style={{ padding: '8px 12px', borderRadius: T.r.md, background: 'none', border: `1px solid ${T.accent.red}40`, color: T.accent.red, fontWeight: 600, fontSize: T.f.md, cursor: 'pointer' }}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// MAIN APP
// =============================================================================
export default function VGDragDropTransactional() {
  // === View mode: 'user' (editor) or 'collaborator' (observer) ===
  const [viewAs, setViewAs] = useState('user');
  const [showDraftLayer, setShowDraftLayer] = useState(true);

  // === Canvas state (committed) ===
  const [canvas, setCanvas] = useState({ rows: 7, cols: 5 });
  const canvasRef = useRef({ rows: 7, cols: 5 });
  const [committedVGs, setCommittedVGs] = useState(INITIAL_VGS);

  // === Transaction state ===
  const [editMode, setEditMode] = useState(false);
  const [draftVGs, setDraftVGs] = useState([]);
  const draftRef = useRef([]);
  const [draftCanvas, setDraftCanvas] = useState({ rows: 7, cols: 5 });
  const draftCanvasRef = useRef({ rows: 7, cols: 5 });
  const [changeLog, setChangeLog] = useState([]);
  const [changeReactions, setChangeReactions] = useState({});
  const changeIdRef = useRef(1);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTimeout, setShowTimeout] = useState(false);
  const timerRef = useRef(null);
  const TIMEOUT_SECONDS = 30; // Short for demo — configurable per workspace

  // === Drag state ===
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const [selectedVGId, setSelectedVGId] = useState(null);
  const [addPanelTab, setAddPanelTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast & events
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [events, setEvents] = useState([{ id: 0, text: 'Ready — Quick mode active', color: T.accent.teal }]);
  const evtId = useRef(1);

  const log = useCallback((t, c = T.accent.cyan) => setEvents(p => [...p.slice(-8), { id: evtId.current++, text: t, color: c }]), []);
  const showToast = useCallback((msg, color) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, color });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Keep refs synced
  useEffect(() => { canvasRef.current = canvas; }, [canvas]);
  useEffect(() => { draftRef.current = draftVGs; }, [draftVGs]);
  useEffect(() => { draftCanvasRef.current = draftCanvas; }, [draftCanvas]);

  // The VGs to display based on mode
  const displayVGs = editMode ? draftVGs : committedVGs;
  const displayCanvas = editMode ? draftCanvas : canvas;

  const mmCell = 34, mmGap = 3, mainCell = 100, mainGap = 6;

  // =======================================================================
  // TRANSACTION MANAGEMENT
  // =======================================================================
  const enterEditMode = useCallback(() => {
    setEditMode(true);
    setDraftVGs([...committedVGs]);
    draftRef.current = [...committedVGs];
    setDraftCanvas({ ...canvas });
    draftCanvasRef.current = { ...canvas };
    setChangeLog([]);
    setChangeReactions({});
    setTimeRemaining(TIMEOUT_SECONDS);
    log('⚡ Entered Edit Mode — canvas locked', T.accent.amber);
  }, [committedVGs, canvas, log]);

  const commitTransaction = useCallback(() => {
    setCommittedVGs([...draftVGs]);
    setCanvas({ ...draftCanvas });
    canvasRef.current = { ...draftCanvas };
    setEditMode(false);
    setTimeRemaining(null);
    if (timerRef.current) clearInterval(timerRef.current);
    log(`✓ Committed ${changeLog.length} changes`, T.accent.green);
    showToast(`Layout committed — ${changeLog.length} changes applied`, T.accent.green);
    setShowTimeout(false);
  }, [draftVGs, draftCanvas, changeLog.length, log, showToast]);

  const discardTransaction = useCallback(() => {
    setEditMode(false);
    setDraftVGs([]);
    setDraftCanvas({ ...canvas });
    setChangeLog([]);
    setChangeReactions({});
    setTimeRemaining(null);
    if (timerRef.current) clearInterval(timerRef.current);
    log('✕ Changes discarded', T.accent.red);
    showToast('Draft discarded — layout unchanged', T.accent.red);
    setShowTimeout(false);
  }, [canvas, log, showToast]);

  const extendTimer = useCallback(() => {
    setTimeRemaining(TIMEOUT_SECONDS);
    setShowTimeout(false);
    log('Timer extended +5min', T.accent.amber);
  }, [log]);

  // Timer countdown
  useEffect(() => {
    if (!editMode || timeRemaining === null) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { setShowTimeout(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [editMode, timeRemaining === null]);

  const addChange = useCallback((type, label, detail) => {
    const id = `ch-${changeIdRef.current++}`;
    setChangeLog(prev => [...prev, { id, type, label, detail, ts: Date.now() }]);
    return id;
  }, []);

  const revertChange = useCallback((changeId) => {
    // Simple: just remove the change and revert to committed state for that item
    // In production this would replay changes minus the reverted one
    setChangeLog(prev => prev.filter(c => c.id !== changeId));
    log('Reverted change', T.accent.amber);
  }, [log]);

  const addReaction = useCallback((changeId, emoji) => {
    const collab = COLLABORATORS[1 + Math.floor(Math.random() * 2)]; // Random collaborator
    setChangeReactions(prev => ({
      ...prev,
      [changeId]: [...(prev[changeId] || []), { emoji, userName: collab.name, userColor: collab.color }],
    }));
  }, []);

  // =======================================================================
  // MOVE VG (in edit mode)
  // =======================================================================
  const [movingVG, setMovingVG] = useState(null);
  const movingRef = useRef(null);

  const handleVGPointerDown = useCallback((e, vgId) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const vg = draftRef.current.find(v => v.id === vgId);
    if (!vg) return;
    const mv = { vgId, vg: { ...vg }, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, active: false, smartPos: null, overTarget: null };
    movingRef.current = mv;
    setMovingVG(mv);
  }, [editMode]);

  // =======================================================================
  // DRAG (from templates panel) — same as before
  // =======================================================================
  const handleTemplatePointerDown = useCallback((e, template) => {
    e.preventDefault();
    e.stopPropagation();
    const d = { template, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, active: false, smartPos: null, overTarget: null };
    dragRef.current = d;
    setDrag(d);
    log(`Grabbed: ${template.name}`, T.accent.blue);
  }, [log]);

  // =======================================================================
  // UNIFIED POINTER HANDLERS
  // =======================================================================
  const resolve = useCallback((x, y, tRows, tCols, excludeVGId = null) => {
    const { target, element } = findDropZone(x, y);
    if (!target || !element) return { overTarget: null, smartPos: null };
    const cs = target === 'minimap' ? mmCell : mainCell;
    const gp = target === 'minimap' ? mmGap : mainGap;
    const rect = element.getBoundingClientRect();
    const col = (x - rect.left) / (cs + gp), row = (y - rect.top) / (cs + gp);
    const cv = editMode ? draftCanvasRef.current : canvasRef.current;
    const vgs = (editMode ? draftRef.current : committedVGs).filter(v => v.id !== excludeVGId);
    const sp = findSmartPosition(cv, tRows, tCols, row, col, vgs);
    return { overTarget: target, smartPos: sp };
  }, [editMode, committedVGs]);

  useEffect(() => {
    const onMove = (e) => {
      // Moving a VG
      if (movingRef.current) {
        const m = movingRef.current;
        const dx = e.clientX - m.startX, dy = e.clientY - m.startY;
        const active = m.active || Math.abs(dx) > 5 || Math.abs(dy) > 5;
        const { overTarget, smartPos } = resolve(e.clientX, e.clientY, m.vg.rows, m.vg.cols, m.vgId);
        const next = { ...m, curX: e.clientX, curY: e.clientY, active, overTarget, smartPos };
        movingRef.current = next;
        setMovingVG(next);
        return;
      }
      // Dragging a template
      if (dragRef.current) {
        const d = dragRef.current;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        const active = d.active || Math.abs(dx) > 5 || Math.abs(dy) > 5;
        const { overTarget, smartPos } = resolve(e.clientX, e.clientY, d.template.rows, d.template.cols);
        const next = { ...d, curX: e.clientX, curY: e.clientY, active, overTarget, smartPos };
        dragRef.current = next;
        setDrag(next);
      }
    };

    const onUp = (e) => {
      // Moving a VG — commit move
      if (movingRef.current) {
        const m = movingRef.current;
        movingRef.current = null;
        if (!m.active) { setMovingVG(null); return; }
        const { overTarget, smartPos } = resolve(e.clientX, e.clientY, m.vg.rows, m.vg.cols, m.vgId);
        if (overTarget && smartPos?.valid) {
          const from = `${String.fromCharCode(65 + m.vg.col)}${m.vg.row + 1}`;
          const to = `${String.fromCharCode(65 + smartPos.col)}${smartPos.row + 1}`;
          setDraftVGs(prev => {
            const next = prev.map(v => v.id === m.vgId ? { ...v, row: smartPos.row, col: smartPos.col } : v);
            draftRef.current = next;
            return next;
          });
          if (smartPos.expanded) {
            setDraftCanvas({ rows: smartPos.newRows, cols: smartPos.newCols });
            draftCanvasRef.current = { rows: smartPos.newRows, cols: smartPos.newCols };
          }
          addChange('move', `Moved "${m.vg.name}"`, `${from} → ${to}`);
          log(`Moved "${m.vg.name}" ${from} → ${to}`, T.accent.blue);
        }
        setMovingVG(null);
        return;
      }

      // Dragging a template — place it
      if (dragRef.current) {
        const d = dragRef.current;
        dragRef.current = null;
        if (!d.active) { setDrag(null); return; }
        const { overTarget, smartPos } = resolve(e.clientX, e.clientY, d.template.rows, d.template.cols);
        if (!overTarget || !smartPos?.valid) { log('Drop cancelled', T.accent.red); setDrag(null); return; }
        const template = d.template;
        const newVG = {
          id: `p-${Date.now()}`, name: template.name, rows: template.rows, cols: template.cols,
          row: smartPos.row, col: smartPos.col, color: template.color, grid: template.grid,
          populated: template.populated || false, slots: template.slots,
        };
        const pos = `${String.fromCharCode(65 + smartPos.col)}${smartPos.row + 1}`;

        if (editMode) {
          setDraftVGs(prev => { const next = [...prev, newVG]; draftRef.current = next; return next; });
          if (smartPos.expanded) { setDraftCanvas({ rows: smartPos.newRows, cols: smartPos.newCols }); draftCanvasRef.current = { rows: smartPos.newRows, cols: smartPos.newCols }; }
          addChange('add', `Added "${template.name}"`, `At ${pos} (${template.rows}×${template.cols})`);
          log(`Staged: "${template.name}" at ${pos}`, T.accent.green);
        } else {
          setCommittedVGs(prev => [...prev, newVG]);
          if (smartPos.expanded) { setCanvas({ rows: smartPos.newRows, cols: smartPos.newCols }); canvasRef.current = { rows: smartPos.newRows, cols: smartPos.newCols }; }
          log(`✓ Placed "${template.name}" at ${pos}`, T.accent.green);
          showToast(`"${template.name}" placed at ${pos}`, template.color);
        }
        setSelectedVGId(newVG.id);
        setDrag(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [resolve, editMode, addChange, log, showToast]);

  const removeVG = useCallback((vgId) => {
    const vg = draftVGs.find(v => v.id === vgId);
    if (!vg) return;
    setDraftVGs(prev => { const next = prev.filter(v => v.id !== vgId); draftRef.current = next; return next; });
    addChange('remove', `Removed "${vg.name}"`, `Was at ${String.fromCharCode(65 + vg.col)}${vg.row + 1}`);
    log(`Staged removal: "${vg.name}"`, T.accent.red);
  }, [draftVGs, addChange, log]);

  const filteredItems = useMemo(() => {
    const items = addPanelTab === 'templates' ? TEMPLATES : SAMPLE_VGS;
    if (!searchQuery) return items;
    return items.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [addPanelTab, searchQuery]);

  const isDragging = drag?.active;
  const isMoving = movingVG?.active;
  const isCollabView = viewAs === 'collaborator';

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // =======================================================================
  // RENDER
  // =======================================================================
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: T.bg.primary, color: T.text.primary, fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", overflow: 'hidden', userSelect: isDragging || isMoving ? 'none' : 'auto' }}>

      {/* ====== LEFT: CANVAS PANEL ====== */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border.subtle}`, background: T.bg.secondary }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${editMode ? `${T.accent.amber}30` : T.border.subtle}`, background: editMode ? `${T.accent.amber}06` : T.bg.glass }}>
          <span style={{ fontSize: 15, color: editMode ? T.accent.amber : T.accent.teal, fontWeight: 700 }}>⊞</span>
          <span style={{ fontSize: T.f.xl, fontWeight: 700, letterSpacing: 1 }}>CANVAS</span>
          {editMode && (
            <span style={{ fontSize: T.f.xs, fontWeight: 700, color: T.accent.amber, background: `${T.accent.amber}15`, padding: '2px 7px', borderRadius: T.r.sm, animation: 'pulse 2s infinite' }}>
              EDITING
            </span>
          )}
          <div style={{ flex: 1 }} />
          {/* Edit mode toggle */}
          {!isCollabView && !editMode && (
            <button onClick={enterEditMode} style={{ fontSize: T.f.sm, fontWeight: 600, color: T.accent.amber, background: `${T.accent.amber}10`, border: `1px solid ${T.accent.amber}30`, borderRadius: T.r.md, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              ✏ Edit Layout
            </button>
          )}
          {editMode && timeRemaining !== null && (
            <span style={{ fontSize: T.f.xs, fontWeight: 600, color: timeRemaining < 10 ? T.accent.red : T.accent.amber, fontFamily: 'monospace' }}>
              ⏱ {formatTime(timeRemaining)}
            </span>
          )}
        </div>

        {/* Collaborator lock banner */}
        {isCollabView && editMode && (
          <div style={{ padding: '8px 12px', background: `${T.accent.amber}08`, borderBottom: `1px solid ${T.accent.amber}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: COLLABORATORS[0].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: T.f.xs, fontWeight: 700, color: T.text.inverse, flexShrink: 0 }}>Y</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.f.sm, fontWeight: 600, color: T.accent.amber }}>Canvas locked by You</div>
              <div style={{ fontSize: T.f.xs, color: T.text.muted }}>Editing layout · {changeLog.length} pending changes</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={showDraftLayer} onChange={(e) => setShowDraftLayer(e.target.checked)} style={{ accentColor: T.accent.amber }} />
              <span style={{ fontSize: T.f.xs, color: T.text.secondary }}>Draft</span>
            </label>
          </div>
        )}

        {/* Minimap */}
        <div style={{ borderBottom: `1px solid ${T.border.subtle}`, height: editMode ? 220 : 250, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: T.bg.glass, borderBottom: `1px solid ${T.border.subtle}` }}>
            <span style={{ fontSize: T.f.xs, color: editMode ? T.accent.amber : T.accent.teal, fontWeight: 600 }}>▾</span>
            <span style={{ fontSize: T.f.sm, fontWeight: 600 }}>Canvas Map</span>
            <span style={{ fontSize: T.f.xxs, color: T.text.muted }}>{displayCanvas.cols}×{displayCanvas.rows}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, background: isDragging && drag?.overTarget === 'minimap' ? `${T.accent.green}06` : editMode ? `${T.accent.amber}03` : 'transparent', transition: 'background 0.2s' }}>
            <div data-dropzone="minimap" style={{ position: 'relative', width: displayCanvas.cols * (mmCell + mmGap) - mmGap, height: displayCanvas.rows * (mmCell + mmGap) - mmGap, border: drag?.overTarget === 'minimap' ? `2px dashed ${T.accent.green}` : editMode ? `1px solid ${T.accent.amber}30` : `1px solid ${T.border.subtle}`, borderRadius: T.r.md, background: T.bg.secondary, transition: 'border-color 0.2s' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.2, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none', backgroundImage: `linear-gradient(${T.border.default} 1px, transparent 1px), linear-gradient(90deg, ${T.border.default} 1px, transparent 1px)`, backgroundSize: `${mmCell + mmGap}px ${mmCell + mmGap}px` }} />

              {/* Ghost for template drag */}
              {isDragging && drag.smartPos?.valid && drag.overTarget === 'minimap' && (
                <div style={{ position: 'absolute', zIndex: 15, pointerEvents: 'none', left: drag.smartPos.col * (mmCell + mmGap), top: drag.smartPos.row * (mmCell + mmGap), width: drag.template.cols * (mmCell + mmGap) - mmGap, height: drag.template.rows * (mmCell + mmGap) - mmGap, background: `${drag.template.color}18`, border: `2px solid ${drag.template.color}70`, borderRadius: T.r.sm, boxShadow: `0 0 16px ${drag.template.color}25`, transition: 'left 0.12s ease-out, top 0.12s ease-out' }} />
              )}

              {/* Ghost for VG move */}
              {isMoving && movingVG.smartPos?.valid && movingVG.overTarget === 'minimap' && (
                <div style={{ position: 'absolute', zIndex: 15, pointerEvents: 'none', left: movingVG.smartPos.col * (mmCell + mmGap), top: movingVG.smartPos.row * (mmCell + mmGap), width: movingVG.vg.cols * (mmCell + mmGap) - mmGap, height: movingVG.vg.rows * (mmCell + mmGap) - mmGap, background: `${movingVG.vg.color}18`, border: `2px dashed ${movingVG.vg.color}70`, borderRadius: T.r.sm, transition: 'left 0.12s ease-out, top 0.12s ease-out' }} />
              )}

              {/* Committed VGs (shown as faded in collab+draft view) */}
              {isCollabView && editMode && showDraftLayer && committedVGs.map(vg => {
                const isRemoved = !draftVGs.find(d => d.id === vg.id);
                const wasMoved = draftVGs.find(d => d.id === vg.id && (d.row !== vg.row || d.col !== vg.col));
                if (!isRemoved && !wasMoved) return null;
                return (
                  <div key={`orig-${vg.id}`} style={{ position: 'absolute', pointerEvents: 'none', left: vg.col * (mmCell + mmGap), top: vg.row * (mmCell + mmGap), width: vg.cols * (mmCell + mmGap) - mmGap, height: vg.rows * (mmCell + mmGap) - mmGap, background: `${T.accent.red}10`, border: `1px dashed ${T.accent.red}40`, borderRadius: T.r.sm, opacity: 0.6 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 14, color: T.accent.red, fontWeight: 700 }}>
                      {isRemoved ? '✕' : '↗'}
                    </div>
                  </div>
                );
              })}

              {/* Display VGs */}
              {displayVGs.map(vg => {
                const sel = selectedVGId === vg.id;
                const isBeingMoved = isMoving && movingVG.vgId === vg.id;
                const isNew = editMode && !committedVGs.find(c => c.id === vg.id);
                const wasMoved = editMode && committedVGs.find(c => c.id === vg.id && (c.row !== vg.row || c.col !== vg.col));
                return (
                  <div key={vg.id}
                    onPointerDown={(e) => handleVGPointerDown(e, vg.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedVGId(vg.id); }}
                    style={{
                      position: 'absolute', cursor: editMode ? 'grab' : 'pointer', overflow: 'hidden',
                      left: vg.col * (mmCell + mmGap), top: vg.row * (mmCell + mmGap),
                      width: vg.cols * (mmCell + mmGap) - mmGap, height: vg.rows * (mmCell + mmGap) - mmGap,
                      background: `${vg.color}20`, border: `2px ${vg.populated ? 'solid' : 'dashed'} ${sel ? vg.color : `${vg.color}50`}`,
                      borderRadius: T.r.sm, boxShadow: sel ? `0 0 10px ${vg.color}40` : 'none',
                      zIndex: sel ? 10 : 2, transition: 'box-shadow 0.2s',
                      opacity: isBeingMoved ? 0.3 : 1, touchAction: 'none',
                    }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, background: vg.color, padding: '1px 5px', borderBottomRightRadius: T.r.sm, fontSize: T.f.xxs, fontWeight: 700, color: T.text.inverse, maxWidth: '95%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vg.name}
                    </div>
                    {/* Change indicator */}
                    {(isNew || wasMoved) && (
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: isNew ? T.accent.green : T.accent.blue, border: `2px solid ${T.bg.secondary}`, zIndex: 20 }} />
                    )}
                    {/* Remove button in edit mode */}
                    {editMode && !isCollabView && (
                      <button onClick={(e) => { e.stopPropagation(); removeVG(vg.id); }}
                        style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '0 0 0 4px', background: `${T.accent.red}80`, border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15, opacity: 0.7 }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.7'}
                      >✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Change log in edit mode */}
        {editMode && (
          <div style={{ flexShrink: 0, maxHeight: 180, overflow: 'auto', borderBottom: `1px solid ${T.border.subtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: T.bg.glass, borderBottom: `1px solid ${T.border.subtle}`, position: 'sticky', top: 0, zIndex: 5 }}>
              <span style={{ fontSize: T.f.sm, fontWeight: 600 }}>Pending Changes</span>
              <span style={{ fontSize: T.f.xxs, fontWeight: 700, background: `${T.accent.amber}20`, color: T.accent.amber, padding: '1px 6px', borderRadius: 10 }}>{changeLog.length}</span>
            </div>
            <div style={{ padding: 6 }}>
              {changeLog.length === 0 ? (
                <div style={{ fontSize: T.f.xs, color: T.text.muted, padding: '8px 6px', textAlign: 'center' }}>
                  No changes yet — drag VGs to move, add templates, or remove VGs
                </div>
              ) : (
                changeLog.map(ch => (
                  <ChangeEntry key={ch.id} change={ch}
                    onRevert={!isCollabView ? revertChange : null}
                    reactions={changeReactions[ch.id]}
                    onReact={isCollabView ? addReaction : null}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* VG list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: `1px solid ${T.border.subtle}` }}>
          <span style={{ fontSize: T.f.sm, fontWeight: 600 }}>On Canvas</span>
          <span style={{ fontSize: T.f.xxs, fontWeight: 700, background: `${T.accent.teal}20`, color: T.accent.teal, padding: '1px 6px', borderRadius: 10 }}>{displayVGs.length}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 5 }}>
          {displayVGs.map(vg => (
            <div key={vg.id} onClick={() => setSelectedVGId(vg.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', marginBottom: 2, cursor: 'pointer', background: selectedVGId === vg.id ? `${vg.color}10` : 'transparent', border: `1px solid ${selectedVGId === vg.id ? `${vg.color}30` : 'transparent'}`, borderRadius: T.r.md, transition: 'all 0.15s' }}>
              <LayoutMiniPreview grid={vg.grid} color={vg.color} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: T.f.sm, fontWeight: 600 }}>{vg.name}</div>
                <div style={{ fontSize: T.f.xs, color: T.text.muted }}>{String.fromCharCode(65 + vg.col)}{vg.row + 1}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: vg.color }} />
            </div>
          ))}
        </div>

        {/* Commit/Discard bar (edit mode) */}
        {editMode && !isCollabView && (
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${T.accent.amber}30`, background: `${T.accent.amber}06`, display: 'flex', gap: 8 }}>
            <button onClick={commitTransaction} disabled={changeLog.length === 0} style={{ flex: 1, padding: '8px 12px', borderRadius: T.r.md, background: changeLog.length > 0 ? T.accent.green : T.bg.tertiary, border: 'none', color: changeLog.length > 0 ? T.text.inverse : T.text.muted, fontWeight: 700, fontSize: T.f.md, cursor: changeLog.length > 0 ? 'pointer' : 'default', transition: 'all 0.15s' }}>
              ✓ Commit ({changeLog.length})
            </button>
            <button onClick={discardTransaction} style={{ padding: '8px 12px', borderRadius: T.r.md, background: 'none', border: `1px solid ${T.accent.red}40`, color: T.accent.red, fontWeight: 600, fontSize: T.f.md, cursor: 'pointer' }}>
              ✕ Discard
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${T.border.subtle}`, fontSize: T.f.xs, color: T.text.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>{editMode ? 'Edit Mode' : 'Quick Mode'}</span>
          <span>Workspace: My Workspace</span>
        </div>
      </div>

      {/* ====== CENTER: MAIN CANVAS ====== */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: isDragging && drag?.overTarget === 'canvas' ? `radial-gradient(ellipse at center, ${T.accent.green}06 0%, transparent 70%)` : editMode ? `radial-gradient(ellipse at center, ${T.accent.amber}03 0%, transparent 70%)` : 'transparent' }}>

        {/* Mode indicator bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '6px 16px', background: `${T.bg.primary}e0`, backdropFilter: 'blur(8px)', borderBottom: `1px solid ${T.border.subtle}` }}>
          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: T.r.md, border: `1px solid ${T.border.subtle}`, overflow: 'hidden' }}>
            {['user', 'collaborator'].map(mode => (
              <button key={mode} onClick={() => setViewAs(mode)} style={{ padding: '4px 12px', fontSize: T.f.sm, fontWeight: viewAs === mode ? 600 : 400, background: viewAs === mode ? `${T.accent.cyan}15` : 'transparent', color: viewAs === mode ? T.accent.cyan : T.text.muted, border: 'none', cursor: 'pointer', borderRight: mode === 'user' ? `1px solid ${T.border.subtle}` : 'none' }}>
                {mode === 'user' ? '👤 Your View' : '👥 Collaborator View'}
              </button>
            ))}
          </div>
          {editMode && (
            <span style={{ fontSize: T.f.xs, color: T.accent.amber, fontWeight: 600 }}>
              ● Edit Session Active — {changeLog.length} pending change{changeLog.length !== 1 ? 's' : ''}
            </span>
          )}
          {!editMode && (
            <span style={{ fontSize: T.f.xs, color: T.text.muted }}>
              Quick Mode — drops auto-commit
            </span>
          )}
        </div>

        <div data-dropzone="canvas" style={{ position: 'relative', margin: '24px auto', width: displayCanvas.cols * (mainCell + mainGap) - mainGap, height: displayCanvas.rows * (mainCell + mainGap) - mainGap, minHeight: 300 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: `linear-gradient(${T.border.default} 1px, transparent 1px), linear-gradient(90deg, ${T.border.default} 1px, transparent 1px)`, backgroundSize: `${mainCell + mainGap}px ${mainCell + mainGap}px`, borderRadius: T.r.lg }} />

          {/* Column/row labels */}
          {Array.from({ length: displayCanvas.cols }, (_, i) => <div key={`c${i}`} style={{ position: 'absolute', top: -16, left: i * (mainCell + mainGap) + mainCell / 2, transform: 'translateX(-50%)', fontSize: T.f.xs, color: T.text.muted, fontWeight: 600, pointerEvents: 'none' }}>{String.fromCharCode(65 + i)}</div>)}
          {Array.from({ length: displayCanvas.rows }, (_, i) => <div key={`r${i}`} style={{ position: 'absolute', left: -14, top: i * (mainCell + mainGap) + mainCell / 2, transform: 'translateY(-50%)', fontSize: T.f.xs, color: T.text.muted, fontWeight: 600, pointerEvents: 'none' }}>{i + 1}</div>)}

          {/* Ghost for template drag */}
          {isDragging && drag.smartPos?.valid && drag.overTarget === 'canvas' && (
            <div style={{ position: 'absolute', zIndex: 15, pointerEvents: 'none', left: drag.smartPos.col * (mainCell + mainGap), top: drag.smartPos.row * (mainCell + mainGap), width: drag.template.cols * (mainCell + mainGap) - mainGap, height: drag.template.rows * (mainCell + mainGap) - mainGap, background: `${drag.template.color}10`, border: `2px dashed ${drag.template.color}50`, borderRadius: T.r.lg, transition: 'left 0.12s ease-out, top 0.12s ease-out' }}>
              <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: T.f.sm, color: drag.template.color, fontWeight: 600, background: T.bg.primary, padding: '2px 8px', borderRadius: T.r.md, border: `1px solid ${drag.template.color}40`, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                {String.fromCharCode(65 + drag.smartPos.col)}{drag.smartPos.row + 1}
              </div>
            </div>
          )}

          {/* Ghost for VG move */}
          {isMoving && movingVG.smartPos?.valid && movingVG.overTarget === 'canvas' && (
            <div style={{ position: 'absolute', zIndex: 15, pointerEvents: 'none', left: movingVG.smartPos.col * (mainCell + mainGap), top: movingVG.smartPos.row * (mainCell + mainGap), width: movingVG.vg.cols * (mainCell + mainGap) - mainGap, height: movingVG.vg.rows * (mainCell + mainGap) - mainGap, background: `${movingVG.vg.color}10`, border: `2px dashed ${movingVG.vg.color}60`, borderRadius: T.r.lg, transition: 'left 0.12s ease-out, top 0.12s ease-out' }}>
              <div style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: T.f.sm, color: movingVG.vg.color, fontWeight: 600, background: T.bg.primary, padding: '2px 8px', borderRadius: T.r.md, border: `1px solid ${movingVG.vg.color}40`, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                → {String.fromCharCode(65 + movingVG.smartPos.col)}{movingVG.smartPos.row + 1}
              </div>
            </div>
          )}

          {/* Original positions (collab draft layer) */}
          {isCollabView && editMode && showDraftLayer && committedVGs.map(vg => {
            const draft = draftVGs.find(d => d.id === vg.id);
            const removed = !draft;
            const moved = draft && (draft.row !== vg.row || draft.col !== vg.col);
            if (!removed && !moved) return null;
            return (
              <div key={`orig-${vg.id}`} style={{ position: 'absolute', pointerEvents: 'none', left: vg.col * (mainCell + mainGap), top: vg.row * (mainCell + mainGap), width: vg.cols * (mainCell + mainGap) - mainGap, height: vg.rows * (mainCell + mainGap) - mainGap, background: `${T.accent.red}06`, border: `2px dashed ${T.accent.red}30`, borderRadius: T.r.lg, opacity: 0.7 }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 20, color: T.accent.red }}>{removed ? '✕' : '↗'}</span>
                  <span style={{ fontSize: T.f.xs, color: T.accent.red }}>{removed ? 'Removing' : 'Moving'} "{vg.name}"</span>
                </div>
              </div>
            );
          })}

          {/* Display VGs on main canvas */}
          {displayVGs.map(vg => {
            const sel = selectedVGId === vg.id;
            const isBeingMoved = isMoving && movingVG?.vgId === vg.id;
            const isNew = editMode && !committedVGs.find(c => c.id === vg.id);
            const wasMoved = editMode && committedVGs.find(c => c.id === vg.id && (c.row !== vg.row || c.col !== vg.col));
            return (
              <div key={vg.id}
                onPointerDown={(e) => handleVGPointerDown(e, vg.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedVGId(vg.id); }}
                style={{
                  position: 'absolute', cursor: editMode ? 'grab' : 'pointer', overflow: 'hidden',
                  left: vg.col * (mainCell + mainGap), top: vg.row * (mainCell + mainGap),
                  width: vg.cols * (mainCell + mainGap) - mainGap, height: vg.rows * (mainCell + mainGap) - mainGap,
                  background: `${vg.color}10`, border: `2px ${vg.populated ? 'solid' : 'dashed'} ${sel ? vg.color : `${vg.color}35`}`,
                  borderRadius: T.r.lg, boxShadow: sel ? `0 0 24px ${vg.color}25` : '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: sel ? 10 : 2, transition: 'box-shadow 0.2s, border-color 0.2s, opacity 0.15s',
                  opacity: isBeingMoved ? 0.3 : 1, touchAction: 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: `${vg.color}12`, borderBottom: `1px solid ${vg.color}15` }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: vg.color }} />
                  <span style={{ fontSize: T.f.sm, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vg.name}</span>
                  {(isNew || wasMoved) && <span style={{ fontSize: T.f.xxs, fontWeight: 700, color: isNew ? T.accent.green : T.accent.blue, background: `${isNew ? T.accent.green : T.accent.blue}15`, padding: '0 4px', borderRadius: 3 }}>{isNew ? 'NEW' : 'MOVED'}</span>}
                  {editMode && !isCollabView && (
                    <button onClick={(e) => { e.stopPropagation(); removeVG(vg.id); }} style={{ width: 18, height: 18, borderRadius: T.r.sm, background: `${T.accent.red}15`, border: `1px solid ${T.accent.red}30`, color: T.accent.red, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  )}
                </div>
                <div style={{ flex: 1, display: 'grid', padding: 5, gridTemplateRows: `repeat(${vg.rows}, 1fr)`, gridTemplateColumns: `repeat(${vg.cols}, 1fr)`, gap: 3, minHeight: 40 }}>
                  {vg.grid.flat().map((_, i) => (
                    <div key={i} style={{ background: vg.populated ? `${vg.color}15` : T.bg.glass, border: `1px ${vg.populated ? 'solid' : 'dashed'} ${vg.color}20`, borderRadius: T.r.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: T.f.xs, color: vg.populated ? `${vg.color}70` : T.text.muted }}>{vg.populated ? `V${i + 1}` : '+'}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== RIGHT: ADD VGs PANEL ====== */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${T.border.subtle}`, background: T.bg.secondary }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${T.border.subtle}`, background: T.bg.glass }}>
          <span style={{ fontSize: 15, color: T.accent.purple, fontWeight: 700 }}>⊞</span>
          <div><div style={{ fontSize: T.f.xl, fontWeight: 700, letterSpacing: 1 }}>ADD VGS</div><div style={{ fontSize: T.f.xs, color: T.text.muted }}>Drag to canvas</div></div>
        </div>
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border.subtle}` }}>
          {[{ id: 'viewgroups', label: 'ViewGroups' }, { id: 'templates', label: 'Templates' }].map(tab => (
            <button key={tab.id} onClick={() => setAddPanelTab(tab.id)} style={{ flex: 1, padding: '8px 6px', cursor: 'pointer', background: 'none', border: 'none', borderBottom: addPanelTab === tab.id ? `2px solid ${T.accent.purple}` : '2px solid transparent', color: addPanelTab === tab.id ? T.text.primary : T.text.muted, fontSize: T.f.md, fontWeight: addPanelTab === tab.id ? 600 : 400 }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.border.subtle}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: T.bg.tertiary, borderRadius: T.r.md, border: `1px solid ${T.border.subtle}` }}>
            <span style={{ fontSize: T.f.sm, color: T.text.muted }}>⌕</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`Search...`} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: T.text.primary, fontSize: T.f.md }} />
          </div>
        </div>
        {isDragging && (
          <div style={{ margin: '5px 10px', padding: '6px 8px', background: `${T.accent.green}08`, border: `1px solid ${T.accent.green}20`, borderRadius: T.r.md, fontSize: T.f.xs, color: T.accent.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>●</span> Drop on canvas or minimap
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: '5px 10px' }}>
          <div style={{ fontSize: T.f.xs, color: T.text.muted, marginBottom: 6, paddingBottom: 5, borderBottom: `1px solid ${T.border.subtle}` }}>
            {addPanelTab === 'templates' ? `${filteredItems.length} templates` : `${filteredItems.length} saved`}
            {editMode && <span style={{ color: T.accent.amber }}> · changes are staged</span>}
          </div>
          {filteredItems.map(t => (
            <div key={t.id} onPointerDown={(e) => handleTemplatePointerDown(e, t)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', cursor: isDragging ? 'grabbing' : 'grab', background: isDragging && drag?.template?.id === t.id ? `${t.color}08` : T.bg.glass, border: `1px solid ${isDragging && drag?.template?.id === t.id ? `${t.color}30` : T.border.subtle}`, borderRadius: T.r.lg, marginBottom: 4, transition: 'all 0.15s', touchAction: 'none', opacity: isDragging && drag?.template?.id === t.id ? 0.5 : 1 }}
              onPointerOver={e => { if (!isDragging) { e.currentTarget.style.background = T.bg.glassHover; e.currentTarget.style.borderColor = `${t.color}40`; } }}
              onPointerOut={e => { if (!isDragging || drag?.template?.id !== t.id) { e.currentTarget.style.background = T.bg.glass; e.currentTarget.style.borderColor = T.border.subtle; } }}
            >
              <LayoutMiniPreview grid={t.grid} color={t.color} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: T.f.md, fontWeight: 600 }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ fontSize: T.f.xs, color: t.color, background: `${t.color}15`, padding: '0 3px', borderRadius: 3, fontWeight: 600 }}>{t.rows}×{t.cols}</span>
                  <span style={{ fontSize: T.f.xs, color: T.text.muted }}>{t.slots}s</span>
                  {t.datasets && <span style={{ fontSize: T.f.xs, color: T.text.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {t.datasets[0]}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.border.subtle}`, fontSize: T.f.xs, color: T.text.muted }}>
          {editMode ? 'Drops are staged — commit to apply' : 'Drops auto-commit immediately'}
        </div>
      </div>

      {/* Floating drag preview */}
      {isDragging && drag.template && (
        <div style={{ position: 'fixed', left: drag.curX + 14, top: drag.curY - 20, pointerEvents: 'none', zIndex: 9999, background: T.bg.secondary, border: `1px solid ${drag.template.color}60`, borderRadius: T.r.lg, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, transform: 'translateY(-50%)' }}>
          <LayoutMiniPreview grid={drag.template.grid} color={drag.template.color} size={22} />
          <div><div style={{ fontSize: T.f.sm, fontWeight: 600, whiteSpace: 'nowrap' }}>{drag.template.name}</div><div style={{ fontSize: T.f.xs, color: drag.template.color }}>{drag.template.rows}×{drag.template.cols}</div></div>
        </div>
      )}

      {/* Floating move preview */}
      {isMoving && movingVG.vg && (
        <div style={{ position: 'fixed', left: movingVG.curX + 14, top: movingVG.curY - 20, pointerEvents: 'none', zIndex: 9999, background: T.bg.secondary, border: `1px solid ${movingVG.vg.color}60`, borderRadius: T.r.lg, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, transform: 'translateY(-50%)' }}>
          <LayoutMiniPreview grid={movingVG.vg.grid} color={movingVG.vg.color} size={22} />
          <div><div style={{ fontSize: T.f.sm, fontWeight: 600, whiteSpace: 'nowrap' }}>Moving: {movingVG.vg.name}</div><div style={{ fontSize: T.f.xs, color: T.accent.blue }}>↗ drag to reposition</div></div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: T.bg.secondary, border: `1px solid ${toast.color}40`, borderRadius: T.r.xl, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: toast.color }} />
          <span style={{ fontSize: T.f.md, fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}

      {/* Event log */}
      <div style={{ position: 'fixed', bottom: 12, right: 12, width: 240, maxHeight: 130, background: T.bg.secondary, border: `1px solid ${T.border.subtle}`, borderRadius: T.r.lg, overflow: 'hidden', zIndex: 9000, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '4px 8px', background: T.bg.glass, borderBottom: `1px solid ${T.border.subtle}`, fontSize: T.f.xs, fontWeight: 600, color: T.text.muted, display: 'flex', justifyContent: 'space-between' }}>
          <span>EVENTS</span><span style={{ color: T.accent.green }}>●</span>
        </div>
        <div style={{ padding: 4, overflow: 'auto', maxHeight: 100 }}>
          {events.slice(-5).reverse().map((ev, i) => (
            <div key={ev.id} style={{ fontSize: T.f.xxs, color: i === 0 ? T.text.primary : T.text.muted, padding: '1px 3px', fontFamily: 'monospace', opacity: 1 - i * 0.15 }}>
              <span style={{ color: ev.color }}>▸</span> {ev.text}
            </div>
          ))}
        </div>
      </div>

      {/* Timeout prompt */}
      <TimeoutPrompt visible={showTimeout && editMode} onExtend={extendTimer} onCommit={commitTransaction} onDiscard={discardTransaction} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
