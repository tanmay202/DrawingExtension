export const injectedStyles = `
:host, #annotation-app {
  all: initial;
  color-scheme: dark;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

.annotation-shell {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2147483647;
}

.annotation-stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1;
}

.annotation-stage.is-active {
  pointer-events: auto;
  cursor: crosshair;
}

.annotation-stage.is-selecting {
  cursor: default;
}

/* ── Minimized pill ── */
.annotation-toolbar-pill {
  z-index: 10;
  position: fixed;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 4px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 20px;
  background: rgba(15, 17, 24, 0.92);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(20px) saturate(1.4);
  pointer-events: auto;
  user-select: none;
  color: #e2e8f0;
  z-index: 2147483647;
  animation: pill-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pill-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.pill-handle {
  width: 20px !important;
  height: 24px !important;
  cursor: grab;
}

.pill-handle:active {
  cursor: grabbing;
}

.pill-restore-btn {
  appearance: none;
  border: 0;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  border-radius: 12px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 11px;
}

.pill-restore-btn:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.12);
}

/* ── Main toolbar ── */
.annotation-toolbar {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 0;
  pointer-events: auto;
  user-select: none;
  color: #e2e8f0;
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10;
}

.annotation-toolbar.is-hidden {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  pointer-events: none;
}

/* Primary horizontal row */
.toolbar-primary {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(15, 17, 24, 0.92);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.40),
    0 1px 3px rgba(0, 0, 0, 0.20),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  backdrop-filter: blur(24px) saturate(1.5);
}

.toolbar-handle {
  width: 20px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: rgba(148, 163, 184, 0.5);
  cursor: grab;
  flex: 0 0 auto;
  transition: color 120ms ease;
}

.toolbar-handle:hover {
  color: rgba(148, 163, 184, 0.8);
}

.toolbar-handle:active {
  cursor: grabbing;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.07);
  flex: 0 0 auto;
  margin: 0 1px;
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}

/* ── Tool buttons ── */
.tool-btn {
  appearance: none;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  color: rgba(203, 213, 225, 0.7);
  background: transparent;
  cursor: pointer;
  transition: all 100ms ease;
  position: relative;
}

.tool-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.tool-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.tool-btn.is-active {
  color: #0f172a;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  box-shadow: 0 1px 6px rgba(56, 189, 248, 0.3);
}

.tool-btn:disabled {
  cursor: default;
  color: rgba(148, 163, 184, 0.2);
  background: transparent;
}

.minimize-btn:hover:not(:disabled) {
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
}

/* ── Settings toggle ── */
.settings-toggle-btn {
  appearance: none;
  border: 0;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(203, 213, 225, 0.7);
  cursor: pointer;
  transition: all 100ms ease;
}

.settings-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.settings-toggle-btn.is-open {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.active-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  flex: 0 0 auto;
}

/* ── Settings backdrop (click-outside catcher) ── */
.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9;
  cursor: default;
}

/* ── Settings panel (expandable below toolbar) ── */
.settings-panel {
  position: relative;
  z-index: 11;
  margin-top: 4px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(15, 17, 24, 0.94);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  backdrop-filter: blur(24px) saturate(1.5);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: panel-slide 160ms cubic-bezier(0.16, 1, 0.3, 1);
  max-width: 320px;
}

@keyframes panel-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-row {
  display: flex;
  gap: 14px;
}

.settings-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.55);
}

.color-palette {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* ── Swatches ── */
.swatch {
  appearance: none;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 120ms ease;
}

.swatch:hover {
  transform: scale(1.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.swatch.is-active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.55);
  transform: scale(1.1);
}

/* ── Range inputs ── */
.range-section {
  flex: 1 1 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.range-section .settings-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.range-section input[type="range"] {
  flex: 1 1 auto;
  min-width: 50px;
  height: 3px;
  accent-color: #38bdf8;
  cursor: pointer;
}

.range-value {
  font-size: 10px;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.6);
  min-width: 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.annotation-file-input {
  display: none;
}

.brush-cursor {
  position: fixed;
  left: 0;
  top: 0;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: rgba(142, 216, 255, 0.14);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  z-index: 2147483647;
  transform: translate(-50%, -50%);
  will-change: transform, width, height;
}
`;
