import React, { useState } from 'react';
import { 
  Plus, Grid3X3, Sparkles, Moon, Eye,
  Pencil, Check, Layers, Box,
  BarChart3, Image, FileText, Loader2, X
} from 'lucide-react';

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

const themes = {
  neutral: {
    name: 'Current (Neutral)',
    description: 'True black foundation with white overlays',
    colors: {
      bgBase: '#000000',
      bgPrimary: '#0f0f0f',
      bgSecondary: '#1a1a1a',
      bgTertiary: '#222222',
      bgElevated: '#2a2a2a',
      bgCanvas: '#0a0a0a',
      bgCanvasCell: '#0f0f0f',
      borderSubtle: 'rgba(255, 255, 255, 0.04)',
      borderDefault: 'rgba(255, 255, 255, 0.08)',
      borderMedium: 'rgba(255, 255, 255, 0.12)',
      borderCanvas: 'rgba(255, 255, 255, 0.06)',
      glassSubtle: 'rgba(255, 255, 255, 0.02)',
      glassLight: 'rgba(255, 255, 255, 0.04)',
      glassMedium: 'rgba(255, 255, 255, 0.06)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textMuted: 'rgba(255, 255, 255, 0.4)',
    }
  },
  blueTinted: {
    name: 'Blue-Tinted (Subtle)',
    description: 'Scientific instrument aesthetic with blue undertones',
    colors: {
      bgBase: '#04060a',
      bgPrimary: '#0a0c10',
      bgSecondary: '#10141c',
      bgTertiary: '#161c28',
      bgElevated: '#1c2436',
      bgCanvas: '#080a0e',
      bgCanvasCell: '#0a0c10',
      borderSubtle: 'rgba(96, 165, 250, 0.06)',
      borderDefault: 'rgba(96, 165, 250, 0.10)',
      borderMedium: 'rgba(96, 165, 250, 0.15)',
      borderCanvas: 'rgba(96, 165, 250, 0.08)',
      glassSubtle: 'rgba(96, 165, 250, 0.02)',
      glassLight: 'rgba(96, 165, 250, 0.04)',
      glassMedium: 'rgba(96, 165, 250, 0.06)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(200, 210, 230, 0.75)',
      textMuted: 'rgba(140, 160, 200, 0.5)',
    }
  },
  blueTintedDeep: {
    name: 'Blue-Tinted Deep',
    description: 'More pronounced blue for immersive feel',
    colors: {
      bgBase: '#020408',
      bgPrimary: '#060a12',
      bgSecondary: '#0c1220',
      bgTertiary: '#121a2e',
      bgElevated: '#18223c',
      bgCanvas: '#040810',
      bgCanvasCell: '#060a12',
      borderSubtle: 'rgba(96, 165, 250, 0.08)',
      borderDefault: 'rgba(96, 165, 250, 0.12)',
      borderMedium: 'rgba(96, 165, 250, 0.18)',
      borderCanvas: 'rgba(96, 165, 250, 0.10)',
      glassSubtle: 'rgba(96, 165, 250, 0.03)',
      glassLight: 'rgba(96, 165, 250, 0.05)',
      glassMedium: 'rgba(96, 165, 250, 0.08)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(180, 200, 240, 0.8)',
      textMuted: 'rgba(120, 150, 210, 0.6)',
    }
  },
  vrOptimized: {
    name: 'VR Optimized (Recommended)',
    description: 'Neutral canvas for color accuracy + blue chrome for immersion',
    colors: {
      bgBase: '#020406',
      bgPrimary: '#060a12',
      bgSecondary: '#0c1220',
      bgTertiary: '#121a2e',
      bgElevated: '#18223c',
      bgCanvas: '#030303',
      bgCanvasCell: '#080808',
      borderSubtle: 'rgba(96, 165, 250, 0.08)',
      borderDefault: 'rgba(96, 165, 250, 0.12)',
      borderMedium: 'rgba(96, 165, 250, 0.18)',
      borderCanvas: 'rgba(255, 255, 255, 0.06)',
      glassSubtle: 'rgba(96, 165, 250, 0.03)',
      glassLight: 'rgba(96, 165, 250, 0.05)',
      glassMedium: 'rgba(96, 165, 250, 0.08)',
      glassPanel: 'rgba(8, 14, 24, 0.88)',
      textPrimary: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(180, 200, 240, 0.8)',
      textMuted: 'rgba(120, 150, 210, 0.6)',
      vrSafeZone: 'rgba(96, 165, 250, 0.03)',
    }
  }
};

const accents = {
  blue: '#60a5fa',
  green: '#34d399',
  amber: '#fbbf24',
  purple: '#a78bfa',
  pink: '#fb7185',
  teal: '#7dd3fc',
  red: '#f87171',
};

// =============================================================================
// EMPTY CELL COMPONENT
// =============================================================================
const EmptyCell = ({ theme, state = 'normal', showPlus = false }) => {
  const colors = themes[theme].colors;
  const isVRTheme = theme === 'vrOptimized';
  const canvasBorder = isVRTheme ? colors.borderCanvas : colors.borderDefault;
  
  const getStyles = () => {
    const base = {
      background: colors.glassSubtle,
      border: `1px dashed ${canvasBorder}`,
      borderRadius: 8,
      transition: 'all 0.15s ease',
    };
    
    switch (state) {
      case 'hover':
        return { ...base, background: colors.glassLight, borderColor: colors.borderMedium };
      case 'editMode':
        return { ...base, background: colors.glassMedium, border: `1px dashed ${colors.borderMedium}` };
      case 'editHover':
        return { ...base, background: 'rgba(96, 165, 250, 0.08)', border: `1px solid ${accents.blue}40` };
      case 'dragOver':
        return { ...base, background: 'rgba(52, 211, 153, 0.1)', border: `2px dashed ${accents.green}` };
      case 'selected':
        return { ...base, background: 'rgba(125, 211, 252, 0.1)', border: `2px solid ${accents.teal}` };
      default:
        return base;
    }
  };
  
  return (
    <div style={{ ...getStyles(), display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
      {showPlus && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: colors.textMuted }}>
          <Plus size={20} strokeWidth={1.5} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Add View</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// VIEW CELL COMPONENT
// =============================================================================
const ViewCell = ({ theme, color = accents.blue, name = 'Brain MRI', type = 'vtk', isActive = false, isLoading = false }) => {
  const colors = themes[theme].colors;
  const TypeIcon = type === 'vtk' ? Box : type === 'chart' ? BarChart3 : type === 'image' ? Image : FileText;
  const isVRTheme = theme === 'vrOptimized';
  
  const cellBg = isVRTheme ? '#080808' : colors.bgPrimary;
  const contentBg = isVRTheme 
    ? `linear-gradient(135deg, #050505 0%, ${color}05 100%)`
    : `linear-gradient(135deg, ${colors.bgCanvas} 0%, ${color}08 100%)`;
  const headerBorderColor = isVRTheme ? 'rgba(255, 255, 255, 0.08)' : colors.borderSubtle;
  
  return (
    <div style={{
      background: cellBg,
      border: isActive ? `2px solid ${color}` : `1px solid ${isVRTheme ? 'rgba(255,255,255,0.1)' : colors.borderDefault}`,
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isActive ? `0 0 0 1px ${color}, 0 4px 20px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderBottom: isActive ? `2px solid ${color}` : `1px solid ${headerBorderColor}`,
        background: isActive ? `linear-gradient(180deg, ${color}12 0%, transparent 100%)` : 'transparent',
      }}>
        {isLoading ? (
          <Loader2 size={6} style={{ color, animation: 'spin 1s linear infinite' }} />
        ) : (
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: isActive ? `0 0 6px ${color}` : 'none' }} />
        )}
        <span style={{ 
          fontSize: 11, 
          fontWeight: isActive ? 600 : 500, 
          color: isVRTheme ? 'rgba(255,255,255,0.9)' : colors.textPrimary,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
      </div>
      <div style={{
        flex: 1,
        background: contentBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        position: 'relative',
      }}>
        <TypeIcon size={32} style={{ color: `${color}30`, position: 'absolute' }} />
      </div>
    </div>
  );
};

// =============================================================================
// CANVAS GRID COMPONENT
// =============================================================================
const CanvasGrid = ({ theme, gap = 8, rows = 2, cols = 3, editMode = false, cells = [], showEdgeGradient = true }) => {
  const colors = themes[theme].colors;
  const isVRTheme = theme === 'vrOptimized';
  const canvasBg = isVRTheme ? '#030303' : colors.bgCanvas;
  
  const renderCell = (row, col) => {
    const cellData = cells.find(c => c.row === row && c.col === col);
    if (cellData?.view) {
      return <ViewCell key={`${row}-${col}`} theme={theme} {...cellData.view} />;
    }
    return (
      <EmptyCell 
        key={`${row}-${col}`}
        theme={theme}
        state={cellData?.state || (editMode ? 'editMode' : 'normal')}
        showPlus={!editMode && !cellData?.state}
      />
    );
  };
  
  return (
    <div style={{ background: canvasBg, borderRadius: 12, padding: gap, position: 'relative', overflow: 'hidden' }}>
      {isVRTheme && showEdgeGradient && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(180deg, rgba(8, 14, 24, 0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(0deg, rgba(8, 14, 24, 0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 24, background: 'linear-gradient(90deg, rgba(8, 14, 24, 0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 24, background: 'linear-gradient(270deg, rgba(8, 14, 24, 0.7) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: gap, minHeight: 300 }}>
        {Array.from({ length: rows * cols }, (_, i) => renderCell(Math.floor(i / cols), i % cols))}
      </div>
    </div>
  );
};

// =============================================================================
// COLOR SWATCH
// =============================================================================
const ColorSwatch = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
    <div style={{ width: 16, height: 16, background: color, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }} />
    <div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginLeft: 8 }}>{color}</span>
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CanvasThemeExplorer() {
  const [activeTheme, setActiveTheme] = useState('vrOptimized');
  const [gridGap, setGridGap] = useState(8);
  const [editMode, setEditMode] = useState(false);
  const [showEdgeGradient, setShowEdgeGradient] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  
  const theme = themes[activeTheme];
  const colors = theme.colors;
  
  const sampleCells = [
    { row: 0, col: 0, view: { color: accents.blue, name: 'Brain MRI - Axial', type: 'vtk', isActive: true } },
    { row: 0, col: 1, view: { color: accents.green, name: 'Heart CT', type: 'vtk' } },
    { row: 0, col: 2 },
    { row: 1, col: 0, view: { color: accents.purple, name: 'Spine Analysis', type: 'vtk' } },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ];
  
  const emptyCellStates = [
    { state: 'normal', label: 'Normal' },
    { state: 'hover', label: 'Hover' },
    { state: 'editMode', label: 'Edit Mode' },
    { state: 'editHover', label: 'Edit + Hover' },
    { state: 'dragOver', label: 'Drag Over' },
    { state: 'selected', label: 'Selected' },
  ];
  
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: '#111', borderRight: '1px solid rgba(255,255,255,0.08)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>Canvas Theme Explorer</h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Blue-tinted dark theme exploration</p>
        </div>
        
        {/* Theme Selector */}
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>Theme</div>
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setActiveTheme(key)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '10px 12px', marginBottom: 6,
                background: activeTheme === key ? `${accents.blue}15` : 'transparent',
                border: activeTheme === key ? `1px solid ${accents.blue}40` : '1px solid transparent',
                borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, background: t.colors.bgCanvas, border: `1px solid ${t.colors.borderDefault}`, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: activeTheme === key ? accents.blue : 'rgba(255,255,255,0.8)' }}>{t.name}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.description}</div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Grid Gap */}
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>Grid Gap</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[4, 8, 12, 16].map(g => (
              <button
                key={g}
                onClick={() => setGridGap(g)}
                style={{
                  flex: 1, padding: '8px 0',
                  background: gridGap === g ? `${accents.teal}20` : 'rgba(255,255,255,0.03)',
                  border: gridGap === g ? `1px solid ${accents.teal}50` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4, color: gridGap === g ? accents.teal : 'rgba(255,255,255,0.6)',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {g}px
              </button>
            ))}
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>Canvas Mode</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setEditMode(false)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0',
                background: !editMode ? `${accents.blue}20` : 'transparent',
                border: !editMode ? `1px solid ${accents.blue}50` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, color: !editMode ? accents.blue : 'rgba(255,255,255,0.5)',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Eye size={12} /> Normal
            </button>
            <button
              onClick={() => setEditMode(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0',
                background: editMode ? `${accents.amber}20` : 'transparent',
                border: editMode ? `1px solid ${accents.amber}50` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, color: editMode ? accents.amber : 'rgba(255,255,255,0.5)',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
        </div>
        
        {/* Edge Gradient Toggle */}
        {activeTheme === 'vrOptimized' && (
          <div style={{ padding: 12, background: 'rgba(96,165,250,0.05)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.15)' }}>
            <button
              onClick={() => setShowEdgeGradient(!showEdgeGradient)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                background: showEdgeGradient ? accents.blue : 'rgba(255,255,255,0.1)',
                border: `1px solid ${showEdgeGradient ? accents.blue : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {showEdgeGradient && <Check size={10} style={{ color: 'white' }} />}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>Edge Gradient Transition</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Blend neutral canvas into blue chrome</div>
              </div>
            </button>
          </div>
        )}
        
        {/* Color Palette */}
        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase' }}>Background Colors</div>
          <ColorSwatch color={colors.bgBase} label="Base" />
          <ColorSwatch color={colors.bgPrimary} label="Primary" />
          <ColorSwatch color={colors.bgSecondary} label="Secondary" />
          <ColorSwatch color={colors.bgCanvas} label="Canvas" />
        </div>
        
        {/* Comparison Toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12,
            background: showComparison ? `${accents.purple}20` : 'rgba(255,255,255,0.03)',
            border: showComparison ? `1px solid ${accents.purple}50` : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: showComparison ? accents.purple : 'rgba(255,255,255,0.7)',
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Layers size={14} /> {showComparison ? 'Hide' : 'Show'} Theme Comparison
        </button>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{theme.name}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{theme.description}</p>
        </div>
        
        {/* VR Optimized Explanation */}
        {activeTheme === 'vrOptimized' && (
          <div style={{ marginBottom: 32, background: 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0.02) 100%)', borderRadius: 12, border: '1px solid rgba(96,165,250,0.2)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #060a12 0%, #18223c 100%)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} style={{ color: accents.blue }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>VR Optimized: The Best of Both Worlds</h3>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Neutral canvas for color accuracy + blue chrome for immersion</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              {[
                { icon: Eye, label: 'Color Accuracy', desc: 'Neutral canvas preserves data colors' },
                { icon: Moon, label: 'VR Immersion', desc: 'Blue chrome creates spatial depth' },
                { icon: Sparkles, label: 'Eye Comfort', desc: 'Cool tones reduce fatigue in headsets' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', gap: 8 }}>
                  <Icon size={14} style={{ color: accents.blue, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'white' }}>{label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Canvas Preview */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Grid3X3 size={14} style={{ color: accents.blue }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Canvas Grid Preview</h2>
            <span style={{ fontSize: 10, color: editMode ? accents.amber : accents.blue, background: editMode ? `${accents.amber}15` : `${accents.blue}15`, padding: '3px 8px', borderRadius: 4, fontWeight: 500 }}>
              {editMode ? 'Edit Mode' : 'Normal Mode'}
            </span>
          </div>
          <div style={{ background: colors.bgSecondary, borderRadius: 16, padding: 16, border: `1px solid ${colors.borderDefault}` }}>
            <CanvasGrid theme={activeTheme} gap={gridGap} rows={2} cols={3} editMode={editMode} cells={sampleCells} showEdgeGradient={showEdgeGradient} />
          </div>
        </div>
        
        {/* Empty Cell States */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Box size={14} style={{ color: accents.teal }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Empty Cell States</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {emptyCellStates.map(({ state, label }) => (
              <div key={state}>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textAlign: 'center' }}>{label}</div>
                <div style={{ background: colors.bgCanvas, borderRadius: 8, padding: 8 }}>
                  <EmptyCell theme={activeTheme} state={state} showPlus={state === 'normal' || state === 'hover'} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Create Content Modal Concept */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Plus size={14} style={{ color: accents.green }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Create Content Modal (Proposed)</h2>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 3 }}>Click empty cell → Opens modal</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 20, display: 'flex', gap: 20 }}>
            {/* Modal Preview */}
            <div style={{ flex: 1, background: colors.bgSecondary, borderRadius: 12, border: `1px solid ${colors.borderDefault}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Add to Canvas</span>
                <X size={14} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', gap: 2, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${colors.borderSubtle}` }}>
                {[
                  { id: 'instances', label: 'Instances', icon: Box, active: true },
                  { id: 'notes', label: 'Notes', icon: FileText, active: false },
                  { id: 'media', label: 'Media', icon: Image, active: false },
                  { id: 'sessions', label: 'Sessions', icon: Layers, active: false },
                ].map(tab => (
                  <button key={tab.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: tab.active ? `${accents.blue}20` : 'transparent',
                    border: tab.active ? `1px solid ${accents.blue}40` : '1px solid transparent',
                    borderRadius: 6, color: tab.active ? accents.blue : 'rgba(255,255,255,0.5)',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  }}>
                    <tab.icon size={12} /> {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instance Types</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { icon: Box, label: 'VTK Volume', desc: '3D volumetric', color: accents.purple },
                    { icon: BarChart3, label: 'Chart', desc: '2D visualization', color: accents.teal },
                    { icon: Image, label: 'DICOM', desc: 'Medical imaging', color: accents.blue },
                    { icon: Grid3X3, label: 'Surface', desc: 'Mesh rendering', color: accents.green },
                    { icon: Layers, label: 'Multi-View', desc: 'Linked views', color: accents.amber },
                    { icon: Sparkles, label: 'Custom...', desc: 'Plugin types', color: 'rgba(255,255,255,0.3)' },
                  ].map(item => (
                    <button key={item.label} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8, cursor: 'pointer',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <item.icon size={16} style={{ color: item.color }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: 'white' }}>{item.label}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Explanation */}
            <div style={{ width: 240 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 12 }}>Why a Modal?</div>
              {[
                { title: 'Scales with Plugins', desc: 'New instance types appear automatically' },
                { title: 'Rich Previews', desc: 'Space for thumbnails and metadata' },
                { title: 'Categories', desc: 'Instances, Notes, Media, Sessions' },
                { title: 'VR-Ready', desc: 'Translates to 3D spatial menu' },
              ].map(item => (
                <div key={item.title} style={{ padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: accents.blue, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sessions Preview */}
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(167,139,250,0.08)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: accents.purple, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={14} /> Sessions Tab Content Ideas
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'VR State', desc: 'Saved volumetric VR position', icon: '🥽' },
                { label: 'Comparison', desc: 'Side-by-side datasets', icon: '⚖️' },
                { label: 'Subset', desc: 'Filtered data view', icon: '🔍' },
                { label: 'Isolation', desc: 'Single-element analysis', icon: '🎯' },
              ].map(item => (
                <div key={item.label} style={{ padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'white' }}>{item.label}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Theme Comparison */}
        {showComparison && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Layers size={14} style={{ color: accents.purple }} />
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Theme Comparison</h2>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {Object.entries(themes).map(([key, t]) => (
                <div key={key} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: key === activeTheme ? accents.blue : 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {key === activeTheme && <Check size={12} />} {t.name}
                  </div>
                  <div style={{ background: t.colors.bgSecondary, borderRadius: 12, padding: 12, border: `1px solid ${t.colors.borderDefault}` }}>
                    <CanvasGrid 
                      theme={key} 
                      gap={8} 
                      rows={2} 
                      cols={2} 
                      editMode={false} 
                      cells={[
                        { row: 0, col: 0, view: { color: accents.blue, name: 'MRI', type: 'vtk' } },
                        { row: 0, col: 1 },
                        { row: 1, col: 0 },
                        { row: 1, col: 1, view: { color: accents.purple, name: 'CT', type: 'vtk' } },
                      ]} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Instance Colors */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={14} style={{ color: accents.amber }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Instance Colors on Theme</h2>
          </div>
          <div style={{ background: colors.bgCanvas, borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Object.entries(accents).filter(([k]) => k !== 'red').map(([name, color]) => (
              <ViewCell key={name} theme={activeTheme} color={color} name={`${name.charAt(0).toUpperCase() + name.slice(1)} View`} type="vtk" />
            ))}
          </div>
        </div>
        
        {/* SCSS Export */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={14} style={{ color: accents.green }} />
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>SCSS Token Export</h2>
          </div>
          <div style={{ background: '#0d0d0d', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>// {theme.name}</div>
            <div><span style={{ color: accents.purple }}>$color-bg-base</span>: {colors.bgBase};</div>
            <div><span style={{ color: accents.purple }}>$color-bg-primary</span>: {colors.bgPrimary};</div>
            <div><span style={{ color: accents.purple }}>$color-bg-secondary</span>: {colors.bgSecondary};</div>
            <div><span style={{ color: accents.purple }}>$color-bg-canvas</span>: {colors.bgCanvas};</div>
            <div><span style={{ color: accents.purple }}>$color-bg-canvas-cell</span>: {colors.bgCanvasCell};</div>
            <div style={{ marginTop: 8 }}><span style={{ color: accents.purple }}>$color-border-subtle</span>: {colors.borderSubtle};</div>
            <div><span style={{ color: accents.purple }}>$color-border-default</span>: {colors.borderDefault};</div>
            <div><span style={{ color: accents.purple }}>$color-border-canvas</span>: {colors.borderCanvas};</div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
