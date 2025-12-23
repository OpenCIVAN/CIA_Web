/**
 * CanvasSubtab Component - Canvas configuration for Layout Panel
 */
import React, { memo, useCallback } from 'react';
import { IconGrid3x3, IconArrowRight } from '@UI/react/components/common/Icon';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import PanToolOutlined from '@mui/icons-material/PanToolOutlined';
import CallMergeOutlined from '@mui/icons-material/CallMergeOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import RedoOutlined from '@mui/icons-material/RedoOutlined';
import FindReplaceOutlined from '@mui/icons-material/FindReplaceOutlined';
import { SpawnSizePicker } from '../components/SpawnSizePicker';
import { LAYOUT_MODES, FLOW_DIRECTIONS, TOOLS, DROP_MODES } from '../LayoutPanel.logic';
import './CanvasSubtab.scss';

// Quick layout presets
const QUICK_LAYOUTS = [
    { id: '1x1', label: '1×1', grid: [[1]] },
    { id: '2x1', label: '2×1', grid: [[1, 1]] },
    { id: '1x2', label: '1×2', grid: [[1], [1]] },
    { id: '2x2', label: '2×2', grid: [[1, 1], [1, 1]] },
    { id: '1+2', label: '1+2', grid: [[2, 1], [2, 1]] }, // 2-col span on left
    { id: '2+1', label: '2+1', grid: [[1, 2], [1, 2]] }, // 2-col span on right
];

// Quick Layout Button
const QuickLayoutBtn = memo(function QuickLayoutBtn({ layout, onClick }) {
    const rows = layout.grid.length;
    const cols = Math.max(...layout.grid.map(r => r.reduce((s, v) => s + v, 0)));

    return (
        <button className="quick-layout-btn" onClick={() => onClick(layout)} title={layout.label}>
            <div className="quick-layout-btn__icon" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                {layout.grid.flat().map((span, i) => (
                    <div key={i} className="quick-layout-btn__cell" style={{ gridColumn: `span ${span}` }} />
                ))}
            </div>
            <span>{layout.label}</span>
        </button>
    );
});

export const CanvasSubtab = memo(function CanvasSubtab({ logic }) {
    const {
        layoutMode, setLayoutMode, flowDirection, setFlowDirection,
        spawnSize, setSpawnSize, tool, setTool, editMode, toggleEditMode,
        dropMode, setDropMode, canUndo, canRedo, undo, redo, applyQuickLayout,
    } = logic;

    const handleQuickLayout = useCallback((layout) => {
        applyQuickLayout?.(layout);
    }, [applyQuickLayout]);

    return (
        <div className="canvas-subtab">
            {/* Layout Mode */}
            <div className="canvas-subtab__card" data-color="blue">
                <div className="canvas-subtab__card-header">
                    <IconGrid3x3 sx={{ fontSize: 10 }} />
                    <span>Layout Mode</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="etched-toggle">
                        <button
                            className={`etched-toggle__btn etched-toggle__btn--grid ${layoutMode === LAYOUT_MODES.GRID ? 'etched-toggle__btn--active' : ''}`}
                            onClick={() => setLayoutMode?.(LAYOUT_MODES.GRID)}
                        >
                            <IconGrid3x3 sx={{ fontSize: 12 }} />
                            <span>Grid</span>
                        </button>
                        <button
                            className={`etched-toggle__btn etched-toggle__btn--flow ${layoutMode === LAYOUT_MODES.FLOW ? 'etched-toggle__btn--active' : ''}`}
                            onClick={() => setLayoutMode?.(LAYOUT_MODES.FLOW)}
                        >
                            <TableRowsOutlined sx={{ fontSize: 12 }} />
                            <span>Flow</span>
                        </button>
                    </div>
                </div>

                {layoutMode === LAYOUT_MODES.FLOW && (
                    <div className="canvas-subtab__flow-direction">
                        <span className="canvas-subtab__label">Direction:</span>
                        <div className="etched-toggle">
                            <button
                                className={`etched-toggle__btn etched-toggle__btn--green etched-toggle__btn--compact ${flowDirection === FLOW_DIRECTIONS.ROW ? 'etched-toggle__btn--active' : ''}`}
                                onClick={() => setFlowDirection?.(FLOW_DIRECTIONS.ROW)}
                            >
                                <IconArrowRight sx={{ fontSize: 12 }} /> Row
                            </button>
                            <button
                                className={`etched-toggle__btn etched-toggle__btn--green etched-toggle__btn--compact ${flowDirection === FLOW_DIRECTIONS.COLUMN ? 'etched-toggle__btn--active' : ''}`}
                                onClick={() => setFlowDirection?.(FLOW_DIRECTIONS.COLUMN)}
                            >
                                <ArrowDownwardOutlined sx={{ fontSize: 12 }} /> Col
                            </button>
                        </div>
                    </div>
                )}

                <div className="canvas-subtab__description">
                    {layoutMode === LAYOUT_MODES.FLOW ? 'Views auto-arrange when added.' : 'Manually place and resize views.'}
                </div>
            </div>

            {/* New View Size */}
            <div className="canvas-subtab__card" data-color="green">
                <div className="canvas-subtab__card-header">
                    <AddCircleOutlineOutlined sx={{ fontSize: 10 }} />
                    <span>New View Size</span>
                </div>
                <SpawnSizePicker value={spawnSize} onChange={setSpawnSize} />
                <div className="canvas-subtab__description">
                    Click empty cell or drag dataset to spawn at this size
                </div>
            </div>

            {/* Quick Layouts */}
            <div className="canvas-subtab__card" data-color="amber">
                <div className="canvas-subtab__card-header">
                    <GridViewOutlined sx={{ fontSize: 10 }} />
                    <span>Quick Layouts</span>
                </div>
                <div className="canvas-subtab__quick-layouts">
                    {QUICK_LAYOUTS.map(layout => (
                        <QuickLayoutBtn key={layout.id} layout={layout} onClick={handleQuickLayout} />
                    ))}
                </div>
            </div>

            {/* Tools */}
            <div className="canvas-subtab__card" data-color="blue">
                <div className="canvas-subtab__card-header">
                    <MouseOutlined sx={{ fontSize: 10 }} />
                    <span>Tools</span>
                </div>

                <div className="canvas-subtab__tools">
                    <div className="canvas-subtab__tool-group">
                        <button
                            className={`layout-tool-btn layout-tool-btn--blue ${tool === TOOLS.SELECT ? 'layout-tool-btn--active' : ''}`}
                            onClick={() => setTool?.(TOOLS.SELECT)}
                            title="Select"
                        >
                            <MouseOutlined sx={{ fontSize: 14 }} />
                        </button>
                        <button
                            className={`layout-tool-btn layout-tool-btn--teal ${tool === TOOLS.PAN ? 'layout-tool-btn--active' : ''}`}
                            onClick={() => setTool?.(TOOLS.PAN)}
                            title="Pan"
                        >
                            <PanToolOutlined sx={{ fontSize: 14 }} />
                        </button>
                        <button
                            className={`layout-tool-btn layout-tool-btn--purple ${tool === TOOLS.MERGE ? 'layout-tool-btn--active' : ''}`}
                            onClick={() => setTool?.(TOOLS.MERGE)}
                            title="Merge"
                        >
                            <CallMergeOutlined sx={{ fontSize: 14 }} />
                        </button>

                        <div className="layout-divider" />

                        <button
                            className={`canvas-subtab__edit-btn ${editMode ? 'canvas-subtab__edit-btn--active' : ''}`}
                            onClick={toggleEditMode}
                        >
                            <EditOutlined sx={{ fontSize: 12 }} />
                            {editMode ? 'Done' : 'Edit'}
                        </button>

                        <div className="layout-divider" />

                        <button className="layout-tool-btn" onClick={undo} disabled={!canUndo} title="Undo">
                            <UndoOutlined sx={{ fontSize: 14 }} />
                        </button>
                        <button className="layout-tool-btn" onClick={redo} disabled={!canRedo} title="Redo">
                            <RedoOutlined sx={{ fontSize: 14 }} />
                        </button>
                    </div>

                    {editMode && (
                        <div className="canvas-subtab__drop-mode">
                            <span className="canvas-subtab__label">Drop:</span>
                            <div className="etched-toggle">
                                <button
                                    className={`etched-toggle__btn etched-toggle__btn--green etched-toggle__btn--compact ${dropMode === DROP_MODES.ADD ? 'etched-toggle__btn--active' : ''}`}
                                    onClick={() => setDropMode?.(DROP_MODES.ADD)}
                                >
                                    <AddCircleOutlineOutlined sx={{ fontSize: 10 }} /> Add
                                </button>
                                <button
                                    className={`etched-toggle__btn etched-toggle__btn--amber etched-toggle__btn--compact ${dropMode === DROP_MODES.REPLACE ? 'etched-toggle__btn--active' : ''}`}
                                    onClick={() => setDropMode?.(DROP_MODES.REPLACE)}
                                >
                                    <FindReplaceOutlined sx={{ fontSize: 10 }} /> Replace
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default CanvasSubtab;