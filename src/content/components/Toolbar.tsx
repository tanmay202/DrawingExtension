import {
  ArrowUpRight,
  Brush,
  Camera,
  ChevronDown,
  ChevronUp,
  Circle,
  Download,
  Eraser,
  GripVertical,
  Highlighter,
  Maximize,
  Minus,
  MinusCircle,
  MousePointer2,
  Pentagon,
  Redo2,
  SlidersHorizontal,
  Square,
  Trash2,
  Triangle,
  Undo2,
  Upload
} from "lucide-react";
import { PointerEvent, useCallback, useRef, useState } from "react";
import { Tool, ToolSettings } from "../../types/annotations";

interface ToolbarProps {
  active: boolean;
  minimized: boolean;
  tool: Tool;
  settings: ToolSettings;
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: Tool) => void;
  onSettings: (settings: ToolSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onScreenshot: () => void;
  onToggleMinimize: () => void;
}

const colors = [
  "#f8fafc", "#64748b", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#6366f1", "#ec4899", "#a855f7"
];

const tools: Array<{ id: Tool; title: string; icon: typeof Brush; shortcut?: string }> = [
  { id: "select", title: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "brush", title: "Brush", icon: Brush, shortcut: "B" },
  { id: "highlight", title: "Highlight", icon: Highlighter, shortcut: "H" },
  { id: "eraser", title: "Eraser", icon: Eraser, shortcut: "E" },
  { id: "rectangle", title: "Rectangle", icon: Square, shortcut: "R" },
  { id: "square", title: "Square", icon: Maximize },
  { id: "ellipse", title: "Ellipse", icon: Circle },
  { id: "circle", title: "Circle", icon: Pentagon, shortcut: "C" },
  { id: "line", title: "Line", icon: Minus, shortcut: "L" },
  { id: "arrow", title: "Arrow", icon: ArrowUpRight, shortcut: "A" },
  { id: "triangle", title: "Triangle", icon: Triangle }
];

export function Toolbar(props: ToolbarProps) {
  const [position, setPosition] = useState({ x: 18, y: 18 });
  const [showSettings, setShowSettings] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    setPosition({
      x: Math.min(Math.max(8, event.clientX - dragOffset.current.x), window.innerWidth - 120),
      y: Math.min(Math.max(8, event.clientY - dragOffset.current.y), window.innerHeight - 50)
    });
  };

  const toggleSettings = useCallback(() => {
    setShowSettings((v) => !v);
  }, []);

  // Minimized pill state
  if (props.minimized && props.active) {
    return (
      <div
        className="annotation-toolbar-pill"
        style={{ left: position.x, top: position.y }}
      >
        <div className="toolbar-handle pill-handle" title="Move" onPointerDown={startDrag} onPointerMove={drag}>
          <GripVertical size={14} />
        </div>
        <button
          className="pill-restore-btn"
          type="button"
          title="Restore toolbar (Ctrl+M)"
          aria-label="Restore toolbar"
          onClick={props.onToggleMinimize}
        >
          <ChevronDown size={14} />
          <Brush size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`annotation-toolbar ${props.active ? "" : "is-hidden"}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Primary toolbar row */}
      <div className="toolbar-primary">
        <div className="toolbar-handle" title="Move toolbar" onPointerDown={startDrag} onPointerMove={drag}>
          <GripVertical size={14} />
        </div>

        <div className="toolbar-divider" />

        {/* Tool buttons */}
        <div className="tool-group">
          {tools.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`tool-btn ${props.tool === item.id ? "is-active" : ""}`}
                type="button"
                title={`${item.title}${item.shortcut ? ` (${item.shortcut})` : ""}`}
                aria-label={item.title}
                onClick={() => props.onTool(item.id)}
              >
                <Icon size={14} strokeWidth={2.2} />
              </button>
            );
          })}
        </div>

        <div className="toolbar-divider" />

        {/* Undo / Redo */}
        <div className="tool-group">
          <button className="tool-btn" type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!props.canUndo} onClick={props.onUndo}>
            <Undo2 size={14} />
          </button>
          <button className="tool-btn" type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!props.canRedo} onClick={props.onRedo}>
            <Redo2 size={14} />
          </button>
          <button className="tool-btn" type="button" title="Clear all" aria-label="Clear" onClick={props.onClear}>
            <Trash2 size={14} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Active color swatch + settings toggle */}
        <button
          className={`settings-toggle-btn ${showSettings ? "is-open" : ""}`}
          type="button"
          title="Colors & Settings"
          aria-label="Colors & Settings"
          onClick={toggleSettings}
        >
          <span className="active-color-dot" style={{ background: props.settings.stroke }} />
          <SlidersHorizontal size={13} />
          {showSettings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        <div className="toolbar-divider" />

        {/* Actions */}
        <div className="tool-group">
          <button className="tool-btn" type="button" title="Screenshot" aria-label="Screenshot" onClick={props.onScreenshot}>
            <Camera size={14} />
          </button>
          <button className="tool-btn" type="button" title="Export JSON" aria-label="Export JSON" onClick={props.onExportJson}>
            <Download size={14} />
          </button>
          <button className="tool-btn" type="button" title="Import JSON" aria-label="Import JSON" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Minimize button */}
        <button
          className="tool-btn minimize-btn"
          type="button"
          title="Minimize (Ctrl+M)"
          aria-label="Minimize toolbar"
          onClick={props.onToggleMinimize}
        >
          <MinusCircle size={14} />
        </button>
      </div>

      {/* Expandable settings panel */}
      {showSettings && (
        <>
        <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
        <div className="settings-panel">
          <div className="settings-section">
            <span className="settings-label">Color</span>
            <div className="color-palette">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`swatch ${props.settings.stroke === color ? "is-active" : ""}`}
                  type="button"
                  title={color}
                  aria-label={color}
                  style={{ background: color }}
                  onClick={() => props.onSettings({ ...props.settings, stroke: color })}
                />
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-section range-section">
              <span className="settings-label">Size</span>
              <input
                aria-label="Stroke width"
                type="range"
                min="1"
                max="48"
                value={props.settings.strokeWidth}
                onChange={(event) => props.onSettings({ ...props.settings, strokeWidth: Number(event.target.value) })}
              />
              <span className="range-value">{props.settings.strokeWidth}</span>
            </div>

            <div className="settings-section range-section">
              <span className="settings-label">Opacity</span>
              <input
                aria-label="Opacity"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={props.settings.opacity}
                onChange={(event) => props.onSettings({ ...props.settings, opacity: Number(event.target.value) })}
              />
              <span className="range-value">{Math.round(props.settings.opacity * 100)}%</span>
            </div>
          </div>
        </div>
        </>
      )}

      <input
        ref={fileInputRef}
        className="annotation-file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            props.onImportJson(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
