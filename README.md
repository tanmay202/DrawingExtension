# WebPage drawer
Vibecoded using Codex 5.4 high 

A Chromium Manifest V3 extension that injects a full-page drawing and annotation layer into any website. It is built with React, TypeScript, and Konva, and stores every annotation in document-space coordinates so drawings stay aligned while the page scrolls, resizes, or changes zoom level.

## Features

- Global `Ctrl+P` toggle for annotation mode.
- Scrollable pages while annotation mode is active.
- Document-coordinate rendering with viewport transform for reliable scroll alignment.
- Brush, highlighter, eraser, rectangle, square, ellipse, circle, line, arrow, and triangle tools.
- Select, move, resize, delete, undo, redo, and clear all.
- Draggable dark translucent toolbar with icon-only controls, color palette, stroke width, and opacity.
- Per-URL persistence via `chrome.storage.local`, with automatic restore on revisit and SPA route changes.
- JSON export/import.
- Visible-tab screenshot export with annotations composited on top.
- High-DPI rendering and viewport culling for smoother performance on long pages.

## Folder Structure

```text
public/
  background.js          MV3 service worker for screenshot capture
  manifest.json          Extension manifest
src/
  content/
    App.tsx              Content-script React app and state orchestration
    index.tsx            Shadow DOM injection entry point
    styles.ts            Isolated toolbar/canvas styles
    components/
      AnnotationStage.tsx Konva stage, tools, selection, transform logic
      BrushCursor.tsx     Brush/eraser cursor preview
      Toolbar.tsx         Draggable productivity toolbar
    hooks/
      useKeyboardShortcuts.ts
  history/
    useHistory.ts        Undo/redo manager
  storage/
    annotationStorage.ts Per-URL persistence
  types/
    annotations.ts       Shape/document/tool types
  utils/
    documentMetrics.ts   Scroll, resize, zoom, and page-size observers
    geometry.ts          Hit testing, bounds, normalization
    id.ts                Shape IDs
```

## Build

```bash
npm install
npm run build
```

## Load In Chrome, Edge, Or Brave

1. Open `chrome://extensions` or the equivalent extensions page.
2. Enable Developer Mode.
3. Choose **Load unpacked**.
4. Select the generated `dist` folder.
5. Open any webpage and press `Ctrl+P` to toggle annotation mode.

## Shortcuts

- `Ctrl+P`: toggle annotation mode
- `Ctrl+M`: Minimise
- `B`: brush
- `E`: eraser
- `R`: rectangle
- `C`: circle
- `Ctrl+Z`: undo
- `Ctrl+Shift+Z`: redo
- `Delete` / `Backspace`: delete selected item

## Coordinate Model

The extension keeps the canvas fixed to the viewport for performance, but every shape is stored in document coordinates. On render, the Konva group is translated by `-window.scrollX` and `-window.scrollY`, so annotations visually move with the document content while the overlay remains fixed and lightweight.
